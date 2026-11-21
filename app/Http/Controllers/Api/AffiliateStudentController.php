<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AffiliateCommission;
use App\Models\AffiliatePayout;
use App\Models\AffiliateProfile;
use App\Models\AffiliateSetting;
use App\Models\Course;
use App\Models\CourseAffiliateSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AffiliateStudentController extends Controller
{
    /**
     * Get student's affiliate status and dashboard information
     */
    public function getStatus(Request $request): JsonResponse
    {
        $user = $request->user();
        $settings = AffiliateSetting::current();

        $isEligible = true;
        if ($settings->require_course_purchase) {
            $isEligible = $user->hasPurchasedAnyCourse();
        }

        $profile = $user->affiliateProfile;

        // If affiliate, load stats and courses for link generator
        $courses = [];
        $recentCommissions = [];
        $payouts = [];

        if ($profile) {
            $courses = Course::where('status', Course::STATUS_PUBLISHED)
                ->select('id', 'title', 'slug', 'price', 'sale_price')
                ->with('affiliateSetting')
                ->orderBy('title')
                ->get();

            $recentCommissions = $profile->commissions()
                ->with(['course:id,title,price', 'order:id,order_number'])
                ->latest()
                ->take(10)
                ->get();

            $payouts = $profile->payouts()->latest()->take(10)->get();
        }

        return response()->json([
            'is_eligible' => $isEligible,
            'is_affiliate' => (bool) $profile,
            'profile' => $profile,
            'settings' => $settings,
            'courses' => $courses,
            'recent_commissions' => $recentCommissions,
            'payouts' => $payouts,
        ]);
    }

    /**
     * Apply / Join affiliate program (instant enrollment if eligible)
     */
    public function apply(Request $request): JsonResponse
    {
        $user = $request->user();
        $settings = AffiliateSetting::current();

        if (!$settings->is_enabled) {
            return response()->json(['message' => 'The affiliate program is currently inactive.'], 400);
        }

        if ($settings->require_course_purchase && !$user->hasPurchasedAnyCourse()) {
            return response()->json([
                'message' => 'You must be enrolled in at least one course to become an affiliate.',
            ], 403);
        }

        if ($user->affiliateProfile) {
            return response()->json([
                'message' => 'You are already a registered affiliate partner.',
                'profile' => $user->affiliateProfile,
            ]);
        }

        $code = AffiliateProfile::generateCodeForUser($user);

        $profile = AffiliateProfile::create([
            'user_id' => $user->id,
            'affiliate_code' => $code,
            'status' => AffiliateProfile::STATUS_ACTIVE,
            'balance' => 0.00,
            'total_earned' => 0.00,
            'total_withdrawn' => 0.00,
            'clicks_count' => 0,
        ]);

        return response()->json([
            'message' => 'Congratulations! You have successfully joined as an affiliate partner.',
            'profile' => $profile,
        ], 201);
    }

    /**
     * Update payout payment details (bKash/Nagad/Rocket account)
     */
    public function updatePayoutAccount(Request $request): JsonResponse
    {
        $user = $request->user();
        $profile = $user->affiliateProfile;

        if (!$profile) {
            return response()->json(['message' => 'Affiliate profile not found.'], 404);
        }

        $validated = $request->validate([
            'payout_method' => ['required', 'in:bkash,nagad,rocket,bank'],
            'payout_account' => ['required', 'string', 'max:100'],
        ]);

        $profile->update($validated);

        return response()->json([
            'message' => 'Withdrawal account number saved successfully.',
            'profile' => $profile,
        ]);
    }

    /**
     * Request payout / withdrawal
     */
    public function requestPayout(Request $request): JsonResponse
    {
        $user = $request->user();
        $profile = $user->affiliateProfile;

        if (!$profile || $profile->status !== AffiliateProfile::STATUS_ACTIVE) {
            return response()->json(['message' => 'Affiliate account is inactive.'], 403);
        }

        $settings = AffiliateSetting::current();

        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:' . $settings->min_payout_amount],
            'payment_method' => ['required', 'in:bkash,nagad,rocket,bank'],
            'account_number' => ['required', 'string', 'max:100'],
        ]);

        if ($validated['amount'] > $profile->balance) {
            return response()->json([
                'message' => 'Withdrawal amount cannot exceed available balance. Current balance: Tk ' . $profile->balance,
            ], 422);
        }

        $payout = DB::transaction(function () use ($profile, $validated) {
            // Deduct from balance
            $profile->balance -= $validated['amount'];
            $profile->save();

            return AffiliatePayout::create([
                'affiliate_id' => $profile->id,
                'amount' => $validated['amount'],
                'payment_method' => $validated['payment_method'],
                'account_number' => $validated['account_number'],
                'status' => AffiliatePayout::STATUS_PENDING,
            ]);
        });

        return response()->json([
            'message' => 'Withdrawal request submitted successfully. Payment will be processed upon admin verification.',
            'payout' => $payout,
            'balance' => $profile->balance,
        ], 201);
    }

    /**
     * Public check referral / affiliate code for checkout discount calculation
     */
    public function checkCode(Request $request, string $code): JsonResponse
    {
        $settings = AffiliateSetting::current();
        if (!$settings->is_enabled) {
            return response()->json(['valid' => false, 'message' => 'Affiliate program is currently inactive.'], 400);
        }

        $profile = AffiliateProfile::where('affiliate_code', $code)
            ->where('status', AffiliateProfile::STATUS_ACTIVE)
            ->first();

        if (!$profile) {
            return response()->json(['valid' => false, 'message' => 'Invalid or expired referral code.'], 404);
        }

        $courseId = $request->integer('course_id');
        $discountAmount = 0.0;
        $discountType = $settings->default_discount_type;
        $discountRate = (float) $settings->default_discount_amount;

        if ($courseId) {
            $course = Course::find($courseId);
            if ($course) {
                $courseSetting = CourseAffiliateSetting::where('course_id', $courseId)->first();
                if ($courseSetting && $courseSetting->is_active) {
                    $discountType = $courseSetting->discount_type;
                    $discountRate = (float) $courseSetting->discount_amount;
                }

                $coursePrice = (float) $course->effective_price;
                if ($discountType === 'percentage') {
                    $discountAmount = round(($coursePrice * $discountRate) / 100, 2);
                } else {
                    $discountAmount = min($coursePrice, $discountRate);
                }
            }
        }

        // Increment click
        $profile->increment('clicks_count');

        return response()->json([
            'valid' => true,
            'code' => $profile->affiliate_code,
            'affiliate_name' => $profile->user->name ?? 'Affiliate Partner',
            'discount_type' => $discountType,
            'discount_rate' => $discountRate,
            'discount_amount' => $discountAmount,
            'cookie_days' => $settings->cookie_days,
            'message' => $discountAmount > 0
                ? "Referral code applied! You get Tk {$discountAmount} discount."
                : 'Referral code applied successfully.',
        ]);
    }
}

