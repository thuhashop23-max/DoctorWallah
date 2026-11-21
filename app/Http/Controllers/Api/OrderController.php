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
use App\Notifications\PaymentConfirmedNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function checkout(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'course_id' => ['nullable', 'exists:courses,id'],
            'course_ids' => ['nullable', 'array'],
            'course_ids.*' => ['exists:courses,id'],
            'include_nexpilot' => ['nullable', 'boolean'],
            'payment_method' => ['required', 'string'],
            'transaction_ref' => ['nullable', 'string', 'max:100'],
            'sender_phone' => ['nullable', 'string', 'max:20'],
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
            return response()->json([
                'message' => 'Please select at least one course for checkout.',
            ], 422);
        }

        $courses = Course::with(['nexpilot', 'categories'])->whereIn('id', $courseIds)->get();
        if ($courses->isEmpty()) {
            abort(404, 'Selected courses are not available for purchase.');
        }

        foreach ($courses as $c) {
            if ($c->status !== Course::STATUS_PUBLISHED) {
                return response()->json([
                    'message' => "Course '{$c->title}' is not available for purchase.",
                ], 422);
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

        // Check and apply affiliate discount
        $affiliateProfile = null;
        $affiliateDiscount = 0.0;
        if (!empty($validated['affiliate_code'])) {
            $affiliateProfile = AffiliateProfile::where('affiliate_code', $validated['affiliate_code'])
                ->where('status', AffiliateProfile::STATUS_ACTIVE)
                ->first();

            // Self-referral protection: cannot refer oneself
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

        // Check and apply coupon discount
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
            \Illuminate\Support\Facades\Log::warning('Dynamic offer evaluation skipped during checkout: ' . $e->getMessage());
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
                \Illuminate\Support\Facades\Log::warning('Points redemption calculation failed: ' . $e->getMessage());
            }
        }

        $finalAmount = (float) floor(max(0, $courseFinalAmount + $nexpilotPrice));
        $isFree = ($finalAmount <= 0);

        if (! $isFree) {
            if (empty($validated['transaction_ref'])) {
                return response()->json([
                    'message' => 'Transaction ID is required.',
                    'errors' => ['transaction_ref' => ['Transaction reference is required.']],
                ], 422);
            }
            if (empty($validated['sender_phone'])) {
                return response()->json([
                    'message' => 'Sender phone is required.',
                    'errors' => ['sender_phone' => ['Sender phone number is required.']],
                ], 422);
            }
            if (Payment::where('transaction_ref', $validated['transaction_ref'])->exists()) {
                return response()->json([
                    'message' => 'This transaction reference has already been used for another order.',
                    'errors' => ['transaction_ref' => ['This transaction ID is already registered.']],
                ], 422);
            }
        }

        try {
            $order = DB::transaction(function () use ($user, $courses, $primaryCourse, $validated, $price, $discountAmount, $affiliateDiscount, $affiliateProfile, $coupon, $couponDiscount, $dynamicOffer, $dynamicOfferDiscount, $pointsRedeemed, $pointsDiscount, $finalAmount, $includeNexPilot, $nexpilotId, $nexpilotPrice, $isFree) {
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
                    'payment_status' => $isFree ? Order::PAYMENT_PAID : Order::PAYMENT_PENDING,
                    'order_status' => $isFree ? Order::ORDER_COMPLETED : Order::ORDER_PROCESSING,
                    'payment_method' => $isFree ? 'free' : $validated['payment_method'],
                    'notes' => $validated['notes'] ?? ($isFree ? '100% Discount / Free Coupon Enrollment' : null),
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

                // Track coupon usage
                if ($coupon) {
                    CouponUsage::create([
                        'coupon_id' => $coupon->id,
                        'user_id' => $user->id,
                        'order_id' => $order->id,
                        'discount_amount' => $couponDiscount,
                    ]);
                    $coupon->increment('times_used');
                }

                // Redeem points if applied
                if ($pointsRedeemed > 0) {
                    try {
                        app(\App\Services\PointService::class)->redeemPointsForOrder($order, $user, $pointsRedeemed, $pointsDiscount);
                    } catch (\Throwable $e) {
                        \Illuminate\Support\Facades\Log::error('Redeeming points for order failed: ' . $e->getMessage());
                    }
                }

                // Create OrderItem for each course
                foreach ($courses as $c) {
                    OrderItem::create([
                        'order_id' => $order->id,
                        'course_id' => $c->id,
                        'price' => (float) $c->effective_price,
                    ]);
                }

                Payment::create([
                    'order_id' => $order->id,
                    'transaction_ref' => $isFree ? ('FREE_' . $order->order_number) : $validated['transaction_ref'],
                    'sender_phone' => $isFree ? ($user->phone ?? '01700000000') : $validated['sender_phone'],
                    'amount' => $finalAmount,
                    'payment_method' => $isFree ? 'free' : $validated['payment_method'],
                    'status' => $isFree ? Payment::STATUS_APPROVED : Payment::STATUS_PENDING,
                    'verified_at' => $isFree ? now() : null,
                ]);

                if ($isFree) {
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
                }

                return $order;
            });
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Order checkout transaction failed: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'user_id' => $user->id,
                'course_ids' => $courseIds,
            ]);

            return response()->json([
                'message' => 'Failed to process order: ' . $e->getMessage(),
            ], 500);
        }

        if ($isFree) {
            try {
                app(\App\Services\CoursePurchaseSmsService::class)->sendPurchaseSms($order);
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('Purchase SMS failed on free checkout: ' . $e->getMessage());
            }
        }

        return response()->json([
            'message' => $isFree ? 'Enrolled in course(s) successfully!' : 'Order placed successfully. Enrollment will be activated upon payment verification.',
            'is_free' => $isFree,
            'order' => $order->load(['course', 'items.course', 'latestPayment']),
        ], 201);
    }

    public function myOrders(Request $request): JsonResponse
    {
        $orders = $request->user()->orders()
            ->with(['course', 'latestPayment'])
            ->latest()
            ->paginate(10);

        return response()->json($orders);
    }

    public function index(Request $request): JsonResponse
    {
        $query = Order::query()
            ->with(['user:id,name,phone,email', 'course:id,title,price', 'latestPayment']);

        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                         ->orWhere('phone', 'like', "%{$search}%");
                  });
            });
        }

        $orders = $query->latest()->paginate($request->integer('per_page', 15));

        return response()->json($orders);
    }

    public function confirmPayment(Request $request, Order $order): JsonResponse
    {
        if ($order->payment_status === Order::PAYMENT_PAID) {
            return response()->json([
                'message' => 'Payment for this order has already been verified.',
            ], 422);
        }

        DB::transaction(function () use ($order) {
            $order->update([
                'payment_status' => Order::PAYMENT_PAID,
                'order_status' => Order::ORDER_COMPLETED,
            ]);

            if ($order->latestPayment) {
                $order->latestPayment->update([
                    'status' => Payment::STATUS_APPROVED,
                    'verified_by' => auth()->id(),
                    'verified_at' => now(),
                ]);
            }

            // Create or update enrollment for each course in the order
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

            // Audit log
            AuditLog::log('payment_confirmed', 'Order', $order->id, null, [
                'order_number' => $order->order_number,
                'amount' => $order->final_amount,
                'confirmed_by' => auth()->id(),
            ]);

            // Affiliate commission crediting
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

                    if ($commType === 'percentage') {
                        $commAmount = round(($order->final_amount * $commRate) / 100, 2);
                    } else {
                        $commAmount = (float) $commRate;
                    }

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

            // Notify student
            $order->user->notify(new PaymentConfirmedNotification($order));

            // Award purchase reward points
            try {
                app(\App\Services\PointService::class)->awardCoursePurchasePoints($order);
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error('Awarding purchase points failed: ' . $e->getMessage());
            }

            // Dispatch Course Purchase Auto SMS Push
            try {
                app(\App\Services\CoursePurchaseSmsService::class)->sendPurchaseSms($order);
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error('Auto SMS Push on payment confirmation failed: ' . $e->getMessage());
            }
        });

        return response()->json([
            'message' => 'Payment has been verified successfully and student enrollment is active.',
            'order' => $order->fresh(['user', 'course', 'latestPayment']),
        ]);
    }

    public function rejectPayment(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        DB::transaction(function () use ($order, $validated) {
            $order->update([
                'payment_status' => Order::PAYMENT_FAILED,
                'order_status' => Order::ORDER_CANCELLED,
                'notes' => $validated['reason'] ?? 'Payment verification failed.',
            ]);

            if ($order->latestPayment) {
                $order->latestPayment->update([
                    'status' => Payment::STATUS_REJECTED,
                    'verified_by' => auth()->id(),
                    'verified_at' => now(),
                    'notes' => $validated['reason'] ?? null,
                ]);
            }

            // Refund any redeemed points if order is rejected
            try {
                app(\App\Services\PointService::class)->refundOrderRedeemedPoints($order);
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error('Refunding redeemed points on order rejection failed: ' . $e->getMessage());
            }

            AuditLog::log('payment_rejected', 'Order', $order->id, null, ['reason' => $validated['reason'] ?? null]);
        });

        return response()->json([
            'message' => 'Payment has been rejected.',
            'order' => $order->fresh(['user', 'course', 'latestPayment']),
        ]);
    }

    /**
     * Get order receipt details by order number.
     */
    public function getOrderByNumber(Request $request, string $orderNumber): JsonResponse
    {
        $order = Order::where('order_number', $orderNumber)
            ->with(['course:id,title,slug,thumbnail,price', 'items.course:id,title,slug,thumbnail,price', 'latestPayment'])
            ->first();

        if (! $order) {
            return response()->json([
                'message' => 'Order not found.',
            ], 404);
        }

        return response()->json([
            'order' => $order,
        ]);
    }
}
