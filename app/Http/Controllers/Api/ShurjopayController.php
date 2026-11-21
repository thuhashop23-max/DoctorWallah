<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\AffiliateCommission;
use App\Models\AffiliateProfile;
use App\Models\AffiliateSetting;
use App\Models\Coupon;
use App\Models\CouponUsage;
use App\Models\Course;
use App\Models\CourseAffiliateSetting;
use App\Models\Enrollment;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\WebsiteSetting;
use App\Notifications\PaymentConfirmedNotification;
use App\Services\CoursePurchaseSmsService;
use App\Services\ShurjopayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ShurjopayController extends Controller
{
    /**
     * Get shurjoPay settings for admin.
     */
    public function getSettings(): JsonResponse
    {
        $settings = ShurjopayService::getSettings();
        return response()->json($settings);
    }

    /**
     * Update shurjoPay settings from admin panel.
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'enabled' => ['required', 'boolean'],
            'environment' => ['required', 'string', 'in:sandbox,live'],
            'live_api_url' => ['required', 'string', 'max:255'],
            'live_username' => ['required', 'string', 'max:255'],
            'live_password' => ['nullable', 'string', 'max:255'],
            'live_prefix' => ['required', 'string', 'max:20'],
            'sandbox_api_url' => ['required', 'string', 'max:255'],
            'sandbox_username' => ['required', 'string', 'max:255'],
            'sandbox_password' => ['nullable', 'string', 'max:255'],
            'sandbox_prefix' => ['required', 'string', 'max:20'],
            'display_name' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $setting = WebsiteSetting::current();
        $currentShurjo = $setting->shurjopay_settings ?? WebsiteSetting::defaultShurjopaySettings();

        // Preserve existing passwords if empty in request
        if (empty($validated['live_password']) && !empty($currentShurjo['live_password'])) {
            $validated['live_password'] = $currentShurjo['live_password'];
        }
        if (empty($validated['sandbox_password']) && !empty($currentShurjo['sandbox_password'])) {
            $validated['sandbox_password'] = $currentShurjo['sandbox_password'];
        }

        $setting->update([
            'shurjopay_settings' => $validated,
        ]);

        AuditLog::log('shurjopay_settings_updated', 'WebsiteSetting', $setting->id, null, [
            'environment' => $validated['environment'],
            'enabled' => $validated['enabled'],
            'live_username' => $validated['live_username'],
            'sandbox_username' => $validated['sandbox_username'],
        ]);

        return response()->json([
            'message' => 'shurjoPay settings saved successfully.',
            'settings' => $setting->fresh()->shurjopay_settings,
        ]);
    }

    /**
     * Test connection with shurjoPay gateway.
     */
    public function testConnection(Request $request): JsonResponse
    {
        $params = $request->only([
            'environment',
            'live_api_url',
            'live_username',
            'live_password',
            'live_prefix',
            'sandbox_api_url',
            'sandbox_username',
            'sandbox_password',
            'sandbox_prefix',
        ]);

        $result = ShurjopayService::testConnection($params);

        return response()->json($result, $result['success'] ? 200 : 422);
    }

    /**
     * Initiate online payment checkout with shurjoPay.
     */
    public function initiate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'course_id' => ['nullable', 'exists:courses,id'],
            'course_ids' => ['nullable', 'array'],
            'course_ids.*' => ['exists:courses,id'],
            'include_nexpilot' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string', 'max:500'],
            'affiliate_code' => ['nullable', 'string', 'max:50'],
            'coupon_code' => ['nullable', 'string', 'max:50'],
            'dynamic_offer_id' => ['nullable', 'integer'],
            'points_to_redeem' => ['nullable', 'integer', 'min:0'],
        ]);

        $user = auth()->user();

        $courseIds = [];
        if (!empty($validated['course_ids'])) {
            $courseIds = array_values(array_unique(array_filter($validated['course_ids'])));
        } elseif (!empty($validated['course_id'])) {
            $courseIds = [$validated['course_id']];
        }

        if (empty($courseIds)) {
            return response()->json(['message' => 'Please select at least one course for checkout.'], 422);
        }

        $courses = Course::with(['nexpilot', 'categories'])->whereIn('id', $courseIds)->get();
        if ($courses->isEmpty()) {
            return response()->json(['message' => 'Selected courses are not available for purchase.'], 404);
        }

        foreach ($courses as $c) {
            if ($c->status !== Course::STATUS_PUBLISHED) {
                return response()->json(['message' => "Course '{$c->title}' is not available for purchase."], 422);
            }
        }

        $alreadyEnrolled = [];
        foreach ($courses as $c) {
            if ($user->isEnrolledIn($c->id)) {
                $alreadyEnrolled[] = $c->title;
            }
        }

        if (!empty($alreadyEnrolled)) {
            return response()->json([
                'message' => 'You are already enrolled in: ' . implode(', ', $alreadyEnrolled),
            ], 422);
        }

        $primaryCourse = $courses->first();
        $includeNexPilot = (bool) ($validated['include_nexpilot'] ?? false);
        $nexpilot = $primaryCourse->nexpilot;
        $nexpilotPrice = 0.0;
        $nexpilotId = null;
        if ($includeNexPilot && $nexpilot && $nexpilot->is_active) {
            $nexpilotPrice = (float) $nexpilot->price;
            $nexpilotId = $nexpilot->id;
        }

        $price = 0.0;
        $courseFinalAmount = 0.0;
        foreach ($courses as $c) {
            $price += (float) $c->price;
            $courseFinalAmount += (float) $c->effective_price;
        }
        $discountAmount = max(0, $price - $courseFinalAmount);

        // Check affiliate discount
        $affiliateProfile = null;
        $affiliateDiscount = 0.0;
        if (!empty($validated['affiliate_code'])) {
            $affiliateProfile = AffiliateProfile::where('affiliate_code', $validated['affiliate_code'])
                ->where('status', AffiliateProfile::STATUS_ACTIVE)
                ->first();

            if ($affiliateProfile && $affiliateProfile->user_id !== $user->id) {
                $courseSetting = CourseAffiliateSetting::where('course_id', $primaryCourse->id)->first();
                $genSetting = AffiliateSetting::current();

                $discountType = $courseSetting && $courseSetting->is_active
                    ? $courseSetting->discount_type
                    : $genSetting->default_discount_type;

                $discountRate = $courseSetting && $courseSetting->is_active
                    ? (float) $courseSetting->discount_amount
                    : (float) $genSetting->default_discount_amount;

                if ($discountType === 'percentage') {
                    $affiliateDiscount = round(($courseFinalAmount * $discountRate) / 100, 2);
                } else {
                    $affiliateDiscount = min($courseFinalAmount, $discountRate);
                }
            } else {
                $affiliateProfile = null;
            }
        }

        $courseFinalAmount = max(0, $courseFinalAmount - $affiliateDiscount);

        // Check coupon discount
        $coupon = null;
        $couponDiscount = 0.0;
        if (!empty($validated['coupon_code'])) {
            $code = strtoupper(trim($validated['coupon_code']));
            $coupon = Coupon::where('code', $code)->first();

            if (!$coupon) {
                return response()->json([
                    'message' => 'The coupon code provided is invalid.',
                    'errors' => ['coupon_code' => ['Invalid coupon code.']],
                ], 422);
            }

            if ($request->filled('course_ids') || count($courses) > 1) {
                $validation = $coupon->validateForCart($user, $courses, $courseFinalAmount);
            } else {
                $validation = $coupon->validateForCheckout($user, $primaryCourse, $courseFinalAmount);
            }
            if (!$validation['valid']) {
                return response()->json([
                    'message' => $validation['message'],
                    'errors' => ['coupon_code' => [$validation['message']]],
                ], 422);
            }

            $couponDiscount = (float) $validation['calculated_discount'];
            $courseFinalAmount = max(0, $courseFinalAmount - $couponDiscount);
        }

        // Check and apply active dynamic offer discount
        $dynamicOffer = null;
        $dynamicOfferDiscount = 0.0;
        try {
            if (class_exists(\App\Models\DynamicOffer::class) && \Illuminate\Support\Facades\Schema::hasTable('dynamic_offers')) {
                $activeOffers = \App\Models\DynamicOffer::active()->get();
                $bestOfferEval = null;
                $bestOfferModel = null;
                $maxOfferDiscount = 0.0;

                foreach ($activeOffers as $offer) {
                    $eval = $offer->evaluateForCourses($courses, $courseFinalAmount);
                    if (!empty($eval['applied']) && (float) ($eval['discount_amount'] ?? 0) > $maxOfferDiscount) {
                        $maxOfferDiscount = (float) $eval['discount_amount'];
                        $bestOfferEval = $eval;
                        $bestOfferModel = $offer;
                    }
                }

                if ($bestOfferEval && $bestOfferModel) {
                    $dynamicOffer = $bestOfferModel;
                    $dynamicOfferDiscount = (float) floor(min($courseFinalAmount, $maxOfferDiscount));
                    $courseFinalAmount = max(0, $courseFinalAmount - $dynamicOfferDiscount);
                }
            }
        } catch (\Throwable $e) {
            Log::warning('Dynamic offer evaluation skipped in shurjoPay checkout: ' . $e->getMessage());
        }

        // Check and apply points redemption discount
        $pointsRedeemed = 0;
        $pointsDiscount = 0.0;
        if (!empty($validated['points_to_redeem']) && (int) $validated['points_to_redeem'] > 0) {
            try {
                $pointService = app(\App\Services\PointService::class);
                $pointsEval = $pointService->calculatePointsDiscount($user, $courseFinalAmount, (int) $validated['points_to_redeem']);
                if ($pointsEval['valid']) {
                    $pointsRedeemed = (int) $pointsEval['points_redeemed'];
                    $pointsDiscount = (float) $pointsEval['discount_amount'];
                    $courseFinalAmount = max(0, $courseFinalAmount - $pointsDiscount);
                }
            } catch (\Throwable $e) {
                Log::warning('Points redemption calculation failed in shurjoPay checkout: ' . $e->getMessage());
            }
        }

        $finalAmount = (float) floor(max(0, $courseFinalAmount + $nexpilotPrice));

        // If amount is 0 (100% coupon, 100% discount, or free course), do NOT call shurjoPay.
        // Immediately mark order as PAID and activate enrollment.
        if ($finalAmount <= 0) {
            try {
                $order = DB::transaction(function () use ($user, $courses, $primaryCourse, $validated, $price, $discountAmount, $affiliateDiscount, $affiliateProfile, $coupon, $couponDiscount, $dynamicOffer, $dynamicOfferDiscount, $pointsRedeemed, $pointsDiscount, $includeNexPilot, $nexpilotId, $nexpilotPrice) {
                    $orderData = [
                        'order_number' => Order::generateOrderNumber(),
                        'user_id' => $user->id,
                        'affiliate_id' => $affiliateProfile ? $affiliateProfile->id : null,
                        'affiliate_code' => $affiliateProfile ? $affiliateProfile->affiliate_code : null,
                        'course_id' => $primaryCourse->id,
                        'original_price' => $price,
                        'discount_amount' => $discountAmount,
                        'affiliate_discount' => $affiliateDiscount,
                        'coupon_id' => $coupon ? $coupon->id : null,
                        'coupon_code' => $coupon ? $coupon->code : null,
                        'coupon_discount' => $couponDiscount,
                        'points_redeemed' => $pointsRedeemed,
                        'points_discount' => $pointsDiscount,
                        'final_amount' => 0,
                        'has_nexpilot' => $nexpilotPrice > 0 || ($includeNexPilot && $nexpilotId),
                        'nexpilot_id' => $nexpilotId,
                        'nexpilot_price' => $nexpilotPrice,
                        'payment_status' => Order::PAYMENT_PAID,
                        'order_status' => Order::ORDER_COMPLETED,
                        'payment_method' => 'free',
                        'notes' => $validated['notes'] ?? '100% Discount / Free Enrollment with Points or Coupon',
                    ];

                    if (\Illuminate\Support\Facades\Schema::hasColumn('orders', 'dynamic_offer_id')) {
                        $orderData['dynamic_offer_id'] = $dynamicOffer ? $dynamicOffer->id : null;
                    }
                    if (\Illuminate\Support\Facades\Schema::hasColumn('orders', 'dynamic_offer_title')) {
                        $orderData['dynamic_offer_title'] = $dynamicOffer ? $dynamicOffer->title : null;
                    }
                    if (\Illuminate\Support\Facades\Schema::hasColumn('orders', 'dynamic_offer_discount')) {
                        $orderData['dynamic_offer_discount'] = $dynamicOfferDiscount;
                    }

                    $order = Order::create($orderData);

                    if ($pointsRedeemed > 0) {
                        try {
                            app(\App\Services\PointService::class)->redeemPointsForOrder($order, $user, $pointsRedeemed, $pointsDiscount);
                        } catch (\Throwable $e) {
                            Log::error('Redeeming points in free shurjoPay checkout failed: ' . $e->getMessage());
                        }
                    }

                    if ($coupon) {
                        CouponUsage::create([
                            'coupon_id' => $coupon->id,
                            'user_id' => $user->id,
                            'order_id' => $order->id,
                            'discount_amount' => $couponDiscount,
                        ]);
                        $coupon->increment('times_used');
                    }

                    foreach ($courses as $c) {
                        OrderItem::create([
                            'order_id' => $order->id,
                            'course_id' => $c->id,
                            'price' => 0,
                        ]);
                    }

                    Payment::create([
                        'order_id' => $order->id,
                        'transaction_ref' => 'FREE_' . $order->order_number,
                        'sender_phone' => $user->phone ?? '01700000000',
                        'amount' => 0,
                        'payment_method' => 'free',
                        'status' => Payment::STATUS_APPROVED,
                        'verified_at' => now(),
                        'notes' => '100% Discount / Free Enrollment Approved',
                    ]);

                    // Immediately create active Enrollment for each course
                    foreach ($courses as $c) {
                        Enrollment::updateOrCreate(
                            [
                                'user_id' => $user->id,
                                'course_id' => $c->id,
                            ],
                            [
                                'order_id' => $order->id,
                                'status' => Enrollment::STATUS_ACTIVE,
                                'has_nexpilot' => (bool) ($nexpilotPrice > 0 || ($includeNexPilot && $nexpilotId && $c->id === $primaryCourse->id)),
                                'nexpilot_id' => ($c->id === $primaryCourse->id ? $nexpilotId : null),
                                'enrolled_at' => now(),
                            ]
                        );
                    }

                    AuditLog::log('free_enrollment_auto_activated', 'Order', $order->id, null, [
                        'order_number' => $order->order_number,
                        'user_id' => $user->id,
                        'course_id' => $primaryCourse->id,
                        'coupon_code' => $coupon?->code,
                    ]);

                    try {
                        $user->notify(new PaymentConfirmedNotification($order));
                    } catch (\Throwable $e) {
                        Log::error('Free enrollment notification failed: ' . $e->getMessage());
                    }

                    // Award purchase points
                    try {
                        app(\App\Services\PointService::class)->awardCoursePurchasePoints($order);
                    } catch (\Throwable $e) {
                        Log::error('Awarding purchase points failed: ' . $e->getMessage());
                    }

                    try {
                        app(CoursePurchaseSmsService::class)->sendPurchaseSms($order);
                    } catch (\Throwable $e) {
                        Log::error('Free enrollment SMS failed: ' . $e->getMessage());
                    }

                    return $order;
                });
            } catch (\Throwable $e) {
                Log::error('Free checkout transaction failed: ' . $e->getMessage(), [
                    'trace' => $e->getTraceAsString(),
                ]);
                return response()->json(['message' => 'Failed to process free checkout: ' . $e->getMessage()], 500);
            }

            return response()->json([
                'success' => true,
                'is_free' => true,
                'message' => 'Enrolled in course(s) with 100% discount successfully!',
                'order_number' => $order->order_number,
                'order' => $order->load(['course', 'items.course', 'latestPayment']),
                'redirect_url' => "/order-status/{$order->order_number}?status=success",
            ]);
        }

        // Create order and pending payment
        try {
            $order = DB::transaction(function () use ($user, $courses, $primaryCourse, $validated, $price, $discountAmount, $affiliateDiscount, $affiliateProfile, $coupon, $couponDiscount, $dynamicOffer, $dynamicOfferDiscount, $pointsRedeemed, $pointsDiscount, $finalAmount, $includeNexPilot, $nexpilotId, $nexpilotPrice) {
                $orderData = [
                    'order_number' => Order::generateOrderNumber(),
                    'user_id' => $user->id,
                    'affiliate_id' => $affiliateProfile ? $affiliateProfile->id : null,
                    'affiliate_code' => $affiliateProfile ? $affiliateProfile->affiliate_code : null,
                    'course_id' => $primaryCourse->id,
                    'original_price' => $price,
                    'discount_amount' => $discountAmount,
                    'affiliate_discount' => $affiliateDiscount,
                    'coupon_id' => $coupon ? $coupon->id : null,
                    'coupon_code' => $coupon ? $coupon->code : null,
                    'coupon_discount' => $couponDiscount,
                    'points_redeemed' => $pointsRedeemed,
                    'points_discount' => $pointsDiscount,
                    'final_amount' => $finalAmount,
                    'has_nexpilot' => $nexpilotPrice > 0 || ($includeNexPilot && $nexpilotId),
                    'nexpilot_id' => $nexpilotId,
                    'nexpilot_price' => $nexpilotPrice,
                    'payment_status' => Order::PAYMENT_PENDING,
                    'order_status' => Order::ORDER_PROCESSING,
                    'payment_method' => 'shurjopay',
                    'notes' => $validated['notes'] ?? 'Online payment via shurjoPay',
                ];

                if (\Illuminate\Support\Facades\Schema::hasColumn('orders', 'dynamic_offer_id')) {
                    $orderData['dynamic_offer_id'] = $dynamicOffer ? $dynamicOffer->id : null;
                }
                if (\Illuminate\Support\Facades\Schema::hasColumn('orders', 'dynamic_offer_title')) {
                    $orderData['dynamic_offer_title'] = $dynamicOffer ? $dynamicOffer->title : null;
                }
                if (\Illuminate\Support\Facades\Schema::hasColumn('orders', 'dynamic_offer_discount')) {
                    $orderData['dynamic_offer_discount'] = $dynamicOfferDiscount;
                }

                $order = Order::create($orderData);

                if ($pointsRedeemed > 0) {
                    try {
                        app(\App\Services\PointService::class)->redeemPointsForOrder($order, $user, $pointsRedeemed, $pointsDiscount);
                    } catch (\Throwable $e) {
                        Log::error('Redeeming points in shurjoPay checkout failed: ' . $e->getMessage());
                    }
                }

                if ($coupon) {
                    CouponUsage::create([
                        'coupon_id' => $coupon->id,
                        'user_id' => $user->id,
                        'order_id' => $order->id,
                        'discount_amount' => $couponDiscount,
                    ]);
                    $coupon->increment('times_used');
                }

                foreach ($courses as $c) {
                    OrderItem::create([
                        'order_id' => $order->id,
                        'course_id' => $c->id,
                        'price' => (float) $c->effective_price,
                    ]);
                }

                Payment::create([
                    'order_id' => $order->id,
                    'transaction_ref' => 'PENDING_' . $order->order_number,
                    'sender_phone' => $user->phone ?? '01700000000',
                    'amount' => $finalAmount,
                    'payment_method' => 'shurjopay',
                    'status' => Payment::STATUS_PENDING,
                    'notes' => 'Awaiting shurjoPay gateway payment',
                ]);

                return $order;
            });
        } catch (\Throwable $e) {
            Log::error('shurjoPay checkout order creation failed: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['message' => 'Failed to initialize payment: ' . $e->getMessage()], 500);
        }

        // Call shurjoPay initiate
        $payResult = ShurjopayService::initiatePayment($order, $user, $request->ip() ?: '127.0.0.1');

        if (!$payResult['success']) {
            return response()->json([
                'message' => $payResult['message'] ?? 'Could not initialize online payment gateway.',
            ], 422);
        }

        // Save shurjoPay order reference to Payment and Order
        if ($payment = $order->payments()->first()) {
            $payment->update([
                'transaction_ref' => $payResult['sp_order_id'],
            ]);
        }

        $order->update([
            'notes' => 'shurjoPay Order ID: ' . $payResult['sp_order_id'],
        ]);

        return response()->json([
            'success' => true,
            'checkout_url' => $payResult['checkout_url'],
            'order_number' => $order->order_number,
            'sp_order_id' => $payResult['sp_order_id'],
        ]);
    }

    /**
     * Handle return / callback from shurjoPay redirect.
     */
    public function callback(Request $request): RedirectResponse
    {
        $spOrderId = $request->input('order_id')
            ?? $request->input('sp_order_id')
            ?? $request->input('customer_order_id');

        Log::info('shurjoPay callback received', [
            'all' => $request->all(),
            'spOrderId' => $spOrderId,
        ]);

        if (empty($spOrderId)) {
            return redirect('/courses?payment=failed&reason=invalid_callback');
        }

        $verify = ShurjopayService::verifyPayment($spOrderId);

        // Find the matching Order
        $order = null;
        if (!empty($verify['value1'])) {
            $order = Order::with(['user', 'course', 'latestPayment', 'affiliateProfile'])->find($verify['value1']);
        }

        if (!$order && !empty($verify['value2'])) {
            $order = Order::with(['user', 'course', 'latestPayment', 'affiliateProfile'])
                ->where('order_number', $verify['value2'])
                ->first();
        }

        if (!$order) {
            $payment = Payment::where('transaction_ref', $spOrderId)->first();
            if ($payment) {
                $order = Order::with(['user', 'course', 'latestPayment', 'affiliateProfile'])->find($payment->order_id);
            }
        }

        if (!$order && !empty($verify['customer_order_id'])) {
            $payment = Payment::where('transaction_ref', $verify['customer_order_id'])->first();
            if ($payment) {
                $order = Order::with(['user', 'course', 'latestPayment', 'affiliateProfile'])->find($payment->order_id);
            }
        }

        // If order not found, fallback to order-status with generic failed
        if (!$order) {
            Log::error('shurjoPay callback order not found', ['spOrderId' => $spOrderId, 'verify' => $verify]);
            return redirect('/?payment=failed&reason=order_not_found');
        }

        // Handle verified success
        if ($verify['success'] && $verify['verified']) {
            if ($order->payment_status !== Order::PAYMENT_PAID) {
                DB::transaction(function () use ($order, $verify, $spOrderId) {
                    $order->update([
                        'payment_status' => Order::PAYMENT_PAID,
                        'order_status' => Order::ORDER_COMPLETED,
                    ]);

                    $payment = $order->payments()->latest()->first();
                    $bankTrx = $verify['bank_trx_id'] ?? $spOrderId;
                    $methodName = $verify['method'] ?? 'shurjopay';

                    if ($payment) {
                        $payment->update([
                            'status' => Payment::STATUS_APPROVED,
                            'transaction_ref' => $bankTrx,
                            'verified_at' => now(),
                            'notes' => "Verified via shurjoPay. Method: {$methodName}. Trx: {$bankTrx}",
                        ]);
                    }

                    // Activate enrollment for each course in the order
                    $orderItems = $order->items()->get();
                    if ($orderItems->isNotEmpty()) {
                        foreach ($orderItems as $item) {
                            Enrollment::updateOrCreate(
                                [
                                    'user_id' => $order->user_id,
                                    'course_id' => $item->course_id,
                                ],
                                [
                                    'order_id' => $order->id,
                                    'status' => Enrollment::STATUS_ACTIVE,
                                    'has_nexpilot' => (bool) ($order->has_nexpilot && $item->course_id === $order->course_id),
                                    'nexpilot_id' => ($item->course_id === $order->course_id ? $order->nexpilot_id : null),
                                    'enrolled_at' => now(),
                                ]
                            );
                        }
                    } else {
                        Enrollment::updateOrCreate(
                            [
                                'user_id' => $order->user_id,
                                'course_id' => $order->course_id,
                            ],
                            [
                                'order_id' => $order->id,
                                'status' => Enrollment::STATUS_ACTIVE,
                                'has_nexpilot' => (bool) $order->has_nexpilot,
                                'nexpilot_id' => $order->nexpilot_id,
                                'enrolled_at' => now(),
                            ]
                        );
                    }

                    // Credit affiliate commission if applicable
                    if ($order->affiliate_id && $order->affiliateProfile) {
                        $affiliate = $order->affiliateProfile;
                        if ($affiliate->status === AffiliateProfile::STATUS_ACTIVE && $affiliate->user_id !== $order->user_id) {
                            $courseSetting = CourseAffiliateSetting::where('course_id', $order->course_id)->first();
                            $genSetting = AffiliateSetting::current();

                            $commType = $courseSetting && $courseSetting->is_active
                                ? $courseSetting->commission_type
                                : $genSetting->default_commission_type;

                            $commRate = $courseSetting && $courseSetting->is_active
                                ? (float) $courseSetting->commission_amount
                                : (float) $genSetting->default_commission_amount;

                            $commAmount = $commType === 'percentage'
                                ? round(($order->final_amount * $commRate) / 100, 2)
                                : (float) $commRate;

                            if ($commAmount > 0) {
                                AffiliateCommission::firstOrCreate(
                                    [
                                        'order_id' => $order->id,
                                        'affiliate_id' => $affiliate->id,
                                    ],
                                    [
                                        'course_id' => $order->course_id,
                                        'buyer_id' => $order->user_id,
                                        'order_amount' => $order->final_amount,
                                        'discount_given' => $order->affiliate_discount ?? 0,
                                        'commission_type' => $commType,
                                        'commission_rate' => $commRate,
                                        'commission_amount' => $commAmount,
                                        'status' => AffiliateCommission::STATUS_APPROVED,
                                    ]
                                );

                                $affiliate->balance += $commAmount;
                                $affiliate->total_earned += $commAmount;
                                $affiliate->save();
                            }
                        }
                    }

                    // Log audit
                    AuditLog::log('shurjopay_payment_confirmed', 'Order', $order->id, null, [
                        'order_number' => $order->order_number,
                        'amount' => $order->final_amount,
                        'bank_trx_id' => $bankTrx,
                        'method' => $methodName,
                    ]);

                    // Notify student
                    try {
                        $order->user->notify(new PaymentConfirmedNotification($order));
                    } catch (\Throwable $e) {
                        Log::error('Notification failed: ' . $e->getMessage());
                    }

                    // Award purchase points
                    try {
                        app(\App\Services\PointService::class)->awardCoursePurchasePoints($order);
                    } catch (\Throwable $e) {
                        Log::error('Awarding purchase points failed: ' . $e->getMessage());
                    }

                    // Auto SMS push
                    try {
                        app(CoursePurchaseSmsService::class)->sendPurchaseSms($order);
                    } catch (\Throwable $e) {
                        Log::error('Auto SMS Push failed: ' . $e->getMessage());
                    }
                });
            }

            $trx = urlencode($verify['bank_trx_id'] ?? $spOrderId);
            return redirect("/order-status/{$order->order_number}?status=success&trx_id={$trx}");
        }

        // If verification failed
        if ($order->payment_status !== Order::PAYMENT_PAID) {
            $order->update([
                'payment_status' => Order::PAYMENT_FAILED,
                'order_status' => Order::ORDER_CANCELLED,
            ]);
            if ($payment = $order->payments()->latest()->first()) {
                $payment->update([
                    'status' => Payment::STATUS_REJECTED,
                    'notes' => $verify['message'] ?? 'shurjoPay payment verification failed',
                ]);
            }
        }

        $errMsg = urlencode($verify['message'] ?? 'Payment failed or was cancelled.');
        return redirect("/order-status/{$order->order_number}?status=failed&message={$errMsg}");
    }

    /**
     * Handle payment cancellation redirect from shurjoPay.
     */
    public function cancel(Request $request): RedirectResponse
    {
        $orderId = $request->input('order_id');
        $orderNumber = $request->input('order_number');

        $order = null;
        if ($orderId) {
            $order = Order::find($orderId);
        } elseif ($orderNumber) {
            $order = Order::where('order_number', $orderNumber)->first();
        }

        if ($order && $order->payment_status === Order::PAYMENT_PENDING) {
            $order->update([
                'payment_status' => Order::PAYMENT_CANCELLED,
                'order_status' => Order::ORDER_CANCELLED,
                'notes' => 'Payment cancelled by user on shurjoPay gateway.',
            ]);

            if ($payment = $order->payments()->latest()->first()) {
                $payment->update([
                    'status' => Payment::STATUS_REJECTED,
                    'notes' => 'Cancelled by user',
                ]);
            }

            return redirect("/order-status/{$order->order_number}?status=cancelled");
        }

        return redirect('/courses?payment=cancelled');
    }
}

