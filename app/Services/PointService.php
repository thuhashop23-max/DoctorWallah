<?php

namespace App\Services;

use App\Models\Order;
use App\Models\PointSetting;
use App\Models\PointTransaction;
use App\Models\RewardNoteSubmission;
use App\Models\User;
use App\Notifications\CoursePurchasePointsNotification;
use App\Notifications\RewardPointsApprovedNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PointService
{
    /**
     * Award points to a student upon successful course purchase/enrollment.
     */
    public function awardCoursePurchasePoints(Order $order): ?PointTransaction
    {
        try {
            $settings = PointSetting::getSettings();

            if (! $settings->is_active || ! $settings->purchase_points_enabled) {
                return null;
            }

            // Check if points have already been awarded for this order
            PointTransaction::ensureTableExists();
            $existing = PointTransaction::where('type', PointTransaction::TYPE_COURSE_PURCHASE)
                ->where('reference_id', $order->id)
                ->first();

            if ($existing) {
                return $existing;
            }

            $pointsToAward = 0;
            if ($settings->purchase_points_type === 'fixed') {
                $pointsToAward = (int) $settings->points_per_course;
            } elseif ($settings->purchase_points_type === 'per_amount') {
                $finalAmount = (float) $order->final_amount;
                $per100 = (int) $settings->points_per_100_currency;
                $pointsToAward = max(1, (int) round(($finalAmount / 100) * $per100));
            }

            if ($pointsToAward <= 0) {
                return null;
            }

            return DB::transaction(function () use ($order, $pointsToAward) {
                $user = User::lockForUpdate()->find($order->user_id);
                if (! $user) {
                    return null;
                }

                $user->points = ($user->points ?? 0) + $pointsToAward;
                $user->save();

                $courseTitle = $order->course?->title ?? 'Course Enrollment';

                $transaction = PointTransaction::create([
                    'user_id' => $user->id,
                    'amount' => $pointsToAward,
                    'type' => PointTransaction::TYPE_COURSE_PURCHASE,
                    'reference_id' => $order->id,
                    'reference_type' => Order::class,
                    'description' => "Reward points earned for enrolling in: {$courseTitle}",
                ]);

                // Send notification to user
                try {
                    $user->notify(new CoursePurchasePointsNotification($courseTitle, $pointsToAward, $order->id));
                } catch (\Throwable $e) {
                    Log::warning('Course purchase points notification failed: ' . $e->getMessage());
                }

                return $transaction;
            });
        } catch (\Throwable $e) {
            Log::error('PointService awardCoursePurchasePoints failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Approve note submission and award points to the student.
     */
    public function awardNoteRewardPoints(RewardNoteSubmission $submission, int $reviewerId): RewardNoteSubmission
    {
        RewardNoteSubmission::ensureTableExists();
        PointTransaction::ensureTableExists();

        return DB::transaction(function () use ($submission, $reviewerId) {
            $topic = $submission->topic;
            $pointsToAward = $topic ? (int) $topic->points_reward : 50;

            $student = User::lockForUpdate()->find($submission->user_id);
            if ($student) {
                $student->points = ($student->points ?? 0) + $pointsToAward;
                $student->save();
            }

            $submission->update([
                'status' => RewardNoteSubmission::STATUS_APPROVED,
                'points_awarded' => $pointsToAward,
                'reviewed_by' => $reviewerId,
                'reviewed_at' => now(),
            ]);

            PointTransaction::create([
                'user_id' => $submission->user_id,
                'amount' => $pointsToAward,
                'type' => PointTransaction::TYPE_NOTE_REWARD,
                'reference_id' => $submission->id,
                'reference_type' => RewardNoteSubmission::class,
                'description' => "Reward points for approved note on topic: " . ($topic?->title ?? 'Course Topic'),
            ]);

            // Notify student
            if ($student) {
                try {
                    $student->notify(new RewardPointsApprovedNotification(
                        $topic?->title ?? 'Topic',
                        $pointsToAward,
                        $submission->topic_id,
                        $submission->id
                    ));
                } catch (\Throwable $e) {
                    Log::warning('Reward points approved notification failed: ' . $e->getMessage());
                }
            }

            return $submission->fresh(['user', 'topic', 'reviewer']);
        });
    }

    /**
     * Reject note submission with optional feedback.
     */
    public function rejectNoteSubmission(RewardNoteSubmission $submission, int $reviewerId, ?string $feedback = null): RewardNoteSubmission
    {
        RewardNoteSubmission::ensureTableExists();

        $submission->update([
            'status' => RewardNoteSubmission::STATUS_REJECTED,
            'reviewed_by' => $reviewerId,
            'feedback' => $feedback,
            'reviewed_at' => now(),
        ]);

        return $submission->fresh(['user', 'topic', 'reviewer']);
    }

    /**
     * Admin manual adjustment of user points.
     */
    public function adjustUserPoints(int $userId, int $amount, string $description, ?int $adminId = null): ?PointTransaction
    {
        PointTransaction::ensureTableExists();

        return DB::transaction(function () use ($userId, $amount, $description, $adminId) {
            $user = User::lockForUpdate()->find($userId);
            if (! $user) {
                return null;
            }

            $newBalance = max(0, ($user->points ?? 0) + $amount);
            $actualChange = $newBalance - ($user->points ?? 0);
            $user->points = $newBalance;
            $user->save();

            return PointTransaction::create([
                'user_id' => $user->id,
                'amount' => $actualChange,
                'type' => PointTransaction::TYPE_MANUAL_ADJUSTMENT,
                'reference_id' => $adminId,
                'reference_type' => User::class,
                'description' => $description,
            ]);
        });
    }

    /**
     * Calculate discount for points redemption.
     */
    public function calculatePointsDiscount(User $user, float $currentAmount, ?int $pointsRequested): array
    {
        $settings = PointSetting::getSettings();

        if (! $settings->is_active || ! $settings->redemption_enabled) {
            return [
                'valid' => false,
                'points_redeemed' => 0,
                'discount_amount' => 0.0,
                'message' => 'Point redemption is currently disabled.',
            ];
        }

        $pointsRequested = max(0, (int) $pointsRequested);
        if ($pointsRequested <= 0) {
            return [
                'valid' => false,
                'points_redeemed' => 0,
                'discount_amount' => 0.0,
                'message' => 'Please specify points to redeem.',
            ];
        }

        $userBalance = (int) ($user->points ?? 0);
        if ($userBalance < $pointsRequested) {
            return [
                'valid' => false,
                'points_redeemed' => 0,
                'discount_amount' => 0.0,
                'message' => "Insufficient points balance (You have {$userBalance} points).",
            ];
        }

        $pointsUnit = max(1, (int) ($settings->redemption_points ?? 10));
        $amountUnit = max(0.01, (float) ($settings->redemption_amount ?? 1.00));

        // Max discount allowed by percentage
        $maxPercent = max(1, min(100, (int) ($settings->max_redemption_percentage ?? 50)));
        $maxDiscountAllowed = round(($currentAmount * $maxPercent) / 100, 2);

        $rawDiscount = round(($pointsRequested / $pointsUnit) * $amountUnit, 2);
        $discountAmount = min($currentAmount, min($maxDiscountAllowed, $rawDiscount));

        if ($discountAmount <= 0) {
            return [
                'valid' => false,
                'points_redeemed' => 0,
                'discount_amount' => 0.0,
                'message' => 'Points could not be applied to this amount.',
            ];
        }

        // Recalculate actual points needed
        $actualPointsNeeded = min($pointsRequested, (int) ceil(($discountAmount / $amountUnit) * $pointsUnit));

        return [
            'valid' => true,
            'points_redeemed' => $actualPointsNeeded,
            'discount_amount' => $discountAmount,
            'message' => "Points applied: saved {$discountAmount} BDT discount.",
        ];
    }

    /**
     * Redeem points for an order and record transaction.
     */
    public function redeemPointsForOrder(Order $order, User $user, int $pointsRedeemed, float $discountAmount): ?PointTransaction
    {
        if ($pointsRedeemed <= 0 || $discountAmount <= 0) {
            return null;
        }

        PointTransaction::ensureTableExists();

        return DB::transaction(function () use ($order, $user, $pointsRedeemed, $discountAmount) {
            $u = User::lockForUpdate()->find($user->id);
            if (! $u) {
                return null;
            }

            $u->points = max(0, ($u->points ?? 0) - $pointsRedeemed);
            $u->save();

            return PointTransaction::create([
                'user_id' => $u->id,
                'amount' => -$pointsRedeemed,
                'type' => PointTransaction::TYPE_REDEEM_DISCOUNT,
                'reference_id' => $order->id,
                'reference_type' => Order::class,
                'description' => "Redeemed {$pointsRedeemed} reward points for {$discountAmount} BDT discount on order #{$order->order_number}",
            ]);
        });
    }

    /**
     * Refund redeemed points when an order is cancelled.
     */
    public function refundOrderRedeemedPoints(Order $order): ?PointTransaction
    {
        $pointsRedeemed = (int) ($order->points_redeemed ?? 0);
        if ($pointsRedeemed <= 0) {
            return null;
        }

        PointTransaction::ensureTableExists();

        $alreadyRefunded = PointTransaction::where('type', PointTransaction::TYPE_MANUAL_ADJUSTMENT)
            ->where('reference_id', $order->id)
            ->where('reference_type', Order::class)
            ->exists();

        if ($alreadyRefunded) {
            return null;
        }

        return DB::transaction(function () use ($order, $pointsRedeemed) {
            $u = User::lockForUpdate()->find($order->user_id);
            if (! $u) {
                return null;
            }

            $u->points = ($u->points ?? 0) + $pointsRedeemed;
            $u->save();

            return PointTransaction::create([
                'user_id' => $u->id,
                'amount' => $pointsRedeemed,
                'type' => PointTransaction::TYPE_MANUAL_ADJUSTMENT,
                'reference_id' => $order->id,
                'reference_type' => Order::class,
                'description' => "Refunded {$pointsRedeemed} points from cancelled order #{$order->order_number}",
            ]);
        });
    }
}
