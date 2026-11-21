<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\DynamicOffer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class DynamicOfferController extends Controller
{
    /**
     * Get list of currently active dynamic offers for banners or notices.
     */
    public function getActiveOffers(Request $request): JsonResponse
    {
        if (!Schema::hasTable('dynamic_offers')) {
            return response()->json(['offers' => []]);
        }

        $offers = DynamicOffer::active()->get();

        return response()->json(['offers' => $offers]);
    }

    /**
     * Evaluate cart items against active dynamic offers.
     */
    public function evaluate(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'course_ids' => ['nullable', 'array'],
                'course_ids.*' => ['integer'],
            ]);

            $courseIds = array_filter((array) ($validated['course_ids'] ?? []));
            if (empty($courseIds) || !Schema::hasTable('dynamic_offers')) {
                return response()->json([
                    'has_offer' => false,
                    'discount_amount' => 0,
                    'offer' => null,
                ]);
            }

            $courses = Course::with('categories')
                ->whereIn('id', $courseIds)
                ->where('status', Course::STATUS_PUBLISHED)
                ->get();

            if ($courses->isEmpty()) {
                return response()->json([
                    'has_offer' => false,
                    'discount_amount' => 0,
                    'offer' => null,
                ]);
            }

            $subtotal = $courses->sum(function ($c) {
                return (float) ($c->effective_price ?? $c->price ?? 0);
            });

            $activeOffers = DynamicOffer::active()->get();
            if ($activeOffers->isEmpty()) {
                return response()->json([
                    'has_offer' => false,
                    'discount_amount' => 0,
                    'offer' => null,
                ]);
            }

            $bestEvaluation = null;
            $maxDiscount = -1.0;
            $bestNextTierOffer = null;

            foreach ($activeOffers as $offer) {
                $eval = $offer->evaluateForCourses($courses, $subtotal);

                if (!empty($eval['applied']) && (float) ($eval['discount_amount'] ?? 0) > $maxDiscount) {
                    $maxDiscount = (float) $eval['discount_amount'];
                    $bestEvaluation = $eval;
                } elseif (empty($eval['applied']) && !empty($eval['next_tier']) && !$bestNextTierOffer) {
                    $bestNextTierOffer = $eval;
                }
            }

            if ($bestEvaluation) {
                return response()->json([
                    'has_offer' => true,
                    'applied' => true,
                    'discount_amount' => (float) floor($bestEvaluation['discount_amount']),
                    'offer' => $bestEvaluation,
                ]);
            }

            if ($bestNextTierOffer) {
                return response()->json([
                    'has_offer' => false,
                    'applied' => false,
                    'discount_amount' => 0,
                    'offer' => $bestNextTierOffer,
                ]);
            }
        } catch (\Throwable $e) {
            // Fail safely
        }

        return response()->json([
            'has_offer' => false,
            'applied' => false,
            'discount_amount' => 0,
            'offer' => null,
        ]);
    }
}
