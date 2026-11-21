<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CouponValidationController extends Controller
{
    /**
     * Validate a coupon code for cart courses or a single course and user
     */
    public function validateCoupon(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string'],
            'course_id' => ['nullable', 'exists:courses,id'],
            'course_ids' => ['nullable', 'array'],
            'course_ids.*' => ['integer'],
        ]);

        $code = strtoupper(trim($validated['code']));
        $coupon = Coupon::where('code', $code)->first();

        if (!$coupon) {
            return response()->json([
                'valid' => false,
                'message' => 'Invalid coupon code.',
            ], 404);
        }

        $user = $request->user('sanctum') ?? $request->user();

        // 1. Multiple courses validation (Cart Mode)
        if (!empty($validated['course_ids'])) {
            $courses = Course::with('categories')
                ->whereIn('id', $validated['course_ids'])
                ->get();

            if ($courses->isEmpty()) {
                return response()->json([
                    'valid' => false,
                    'message' => 'No valid courses found in cart to apply this coupon.',
                ], 422);
            }

            $subtotal = $courses->sum(function ($c) {
                return (float) ($c->effective_price ?? $c->price ?? 0);
            });

            $result = $coupon->validateForCart($user, $courses, $subtotal);

            if (!$result['valid']) {
                return response()->json($result, 422);
            }

            return response()->json($result);
        }

        // 2. Single course validation (Single Checkout Mode)
        if (!empty($validated['course_id'])) {
            $course = Course::with('categories')->findOrFail($validated['course_id']);
            $coursePrice = (float) $course->effective_price;

            $result = $coupon->validateForCheckout($user, $course, $coursePrice);

            if (!$result['valid']) {
                return response()->json($result, 422);
            }

            return response()->json($result);
        }

        return response()->json([
            'valid' => false,
            'message' => 'Please provide at least one course in the cart to apply coupon.',
        ], 422);
    }
}

