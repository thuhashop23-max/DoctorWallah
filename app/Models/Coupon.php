<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Schema;

class Coupon extends Model
{
    use HasFactory, SoftDeletes;

    public const TYPE_FIXED = 'fixed';
    public const TYPE_PERCENTAGE = 'percentage';

    public const SCOPE_ALL = 'all';
    public const SCOPE_COURSE = 'course';
    public const SCOPE_CATEGORY = 'category';

    public const USER_ALL = 'all';
    public const USER_SPECIFIC = 'specific';

    public static function ensureTableExists(): void
    {
        if (!Schema::hasTable('coupons')) {
            try {
                Schema::create('coupons', function (Blueprint $table) {
                    $table->id();
                    $table->string('code', 50)->unique();
                    $table->string('title');
                    $table->text('description')->nullable();
                    $table->enum('discount_type', ['fixed', 'percentage'])->default('fixed');
                    $table->decimal('discount_amount', 10, 2);
                    $table->decimal('max_discount_amount', 10, 2)->nullable();
                    $table->decimal('min_order_amount', 10, 2)->nullable();
                    $table->enum('scope_type', ['all', 'course', 'category'])->default('all');
                    $table->enum('user_restriction_type', ['all', 'specific'])->default('all');
                    $table->unsignedBigInteger('restricted_user_id')->nullable();
                    $table->unsignedInteger('usage_limit')->nullable();
                    $table->unsignedInteger('usage_limit_per_user')->default(1)->nullable();
                    $table->unsignedInteger('times_used')->default(0);
                    $table->dateTime('start_date')->nullable();
                    $table->dateTime('expiry_date')->nullable();
                    $table->boolean('is_active')->default(true);
                    $table->unsignedBigInteger('created_by')->nullable();
                    $table->softDeletes();
                    $table->timestamps();

                    $table->index(['code', 'is_active']);
                });
            } catch (\Throwable $e) {}
        } else {
            try {
                if (!Schema::hasColumn('coupons', 'deleted_at')) {
                    Schema::table('coupons', function (Blueprint $table) {
                        $table->softDeletes();
                    });
                }
                if (!Schema::hasColumn('coupons', 'usage_limit_per_user')) {
                    Schema::table('coupons', function (Blueprint $table) {
                        $table->unsignedInteger('usage_limit_per_user')->default(1)->nullable();
                    });
                }
                if (!Schema::hasColumn('coupons', 'times_used')) {
                    Schema::table('coupons', function (Blueprint $table) {
                        $table->unsignedInteger('times_used')->default(0);
                    });
                }
                if (!Schema::hasColumn('coupons', 'user_restriction_type')) {
                    Schema::table('coupons', function (Blueprint $table) {
                        $table->string('user_restriction_type', 20)->default('all');
                    });
                }
                if (!Schema::hasColumn('coupons', 'restricted_user_id')) {
                    Schema::table('coupons', function (Blueprint $table) {
                        $table->unsignedBigInteger('restricted_user_id')->nullable();
                    });
                }
            } catch (\Throwable $e) {}
        }

        if (!Schema::hasTable('coupon_courses')) {
            try {
                Schema::create('coupon_courses', function (Blueprint $table) {
                    $table->id();
                    $table->unsignedBigInteger('coupon_id');
                    $table->unsignedBigInteger('course_id');
                    $table->timestamps();
                    $table->index(['coupon_id', 'course_id']);
                });
            } catch (\Throwable $e) {}
        }

        if (!Schema::hasTable('coupon_categories')) {
            try {
                Schema::create('coupon_categories', function (Blueprint $table) {
                    $table->id();
                    $table->unsignedBigInteger('coupon_id');
                    $table->unsignedBigInteger('category_id');
                    $table->timestamps();
                    $table->index(['coupon_id', 'category_id']);
                });
            } catch (\Throwable $e) {}
        }

        if (!Schema::hasTable('coupon_usages')) {
            try {
                Schema::create('coupon_usages', function (Blueprint $table) {
                    $table->id();
                    $table->unsignedBigInteger('coupon_id');
                    $table->unsignedBigInteger('user_id');
                    $table->unsignedBigInteger('order_id')->nullable();
                    $table->decimal('discount_amount', 10, 2)->default(0);
                    $table->timestamps();
                    $table->index(['coupon_id', 'user_id']);
                });
            } catch (\Throwable $e) {}
        }

        if (!Schema::hasTable('coupon_users')) {
            try {
                Schema::create('coupon_users', function (Blueprint $table) {
                    $table->id();
                    $table->unsignedBigInteger('coupon_id');
                    $table->unsignedBigInteger('user_id');
                    $table->timestamps();
                    $table->index(['coupon_id', 'user_id']);
                });
            } catch (\Throwable $e) {}
        }
    }

    public static function booted(): void
    {
        parent::booted();
        static::ensureTableExists();
    }

    protected $fillable = [
        'code',
        'title',
        'description',
        'discount_type',
        'discount_amount',
        'max_discount_amount',
        'min_order_amount',
        'scope_type',
        'user_restriction_type',
        'restricted_user_id',
        'usage_limit',
        'usage_limit_per_user',
        'times_used',
        'start_date',
        'expiry_date',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'discount_amount' => 'float',
        'max_discount_amount' => 'float',
        'min_order_amount' => 'float',
        'usage_limit' => 'integer',
        'usage_limit_per_user' => 'integer',
        'times_used' => 'integer',
        'start_date' => 'datetime',
        'expiry_date' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function courses(): BelongsToMany
    {
        return $this->belongsToMany(Course::class, 'coupon_courses')->withTimestamps();
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'coupon_categories')->withTimestamps();
    }

    public function restrictedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'restricted_user_id');
    }

    public function restrictedUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'coupon_users')->withTimestamps();
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function usages(): HasMany
    {
        return $this->hasMany(CouponUsage::class);
    }

    /**
     * Check whether coupon is currently active based on dates and status
     */
    public function isCurrentlyValid(): bool
    {
        if (!$this->is_active) {
            return false;
        }

        $now = Carbon::now();

        if ($this->start_date && $this->start_date->isFuture()) {
            return false;
        }

        if ($this->expiry_date && $this->expiry_date->isPast()) {
            return false;
        }

        if ($this->usage_limit !== null && $this->times_used >= $this->usage_limit) {
            return false;
        }

        return true;
    }

    /**
     * Calculate discount amount given a base course price
     */
    public function calculateDiscount(float $basePrice): float
    {
        if ($this->discount_type === self::TYPE_PERCENTAGE) {
            $discount = floor(($basePrice * $this->discount_amount) / 100);
            if ($this->max_discount_amount !== null && $this->max_discount_amount > 0) {
                $discount = min($discount, (float) $this->max_discount_amount);
            }
            return min($basePrice, max(0, (float) floor($discount)));
        }

        // Fixed / flat discount
        return min($basePrice, max(0, (float) floor((float) $this->discount_amount)));
    }

    /**
     * Fully validate coupon for a specific user and course
     */
    public function validateForCheckout(?User $user, Course $course, float $coursePrice): array
    {
        if (!$this->is_active) {
            return ['valid' => false, 'message' => 'This coupon is no longer active.'];
        }

        $now = Carbon::now();

        if ($this->start_date && $this->start_date->isFuture()) {
            return ['valid' => false, 'message' => 'This coupon offer has not started yet.'];
        }

        if ($this->expiry_date && $this->expiry_date->isPast()) {
            return ['valid' => false, 'message' => 'This coupon has expired.'];
        }

        if ($this->usage_limit !== null && $this->times_used >= $this->usage_limit) {
            return ['valid' => false, 'message' => 'This coupon has reached its total usage limit.'];
        }

        // Minimum order amount check
        if ($this->min_order_amount !== null && $this->min_order_amount > 0 && $coursePrice < $this->min_order_amount) {
            return [
                'valid' => false,
                'message' => "This coupon requires a minimum course value of Tk {$this->min_order_amount}."
            ];
        }

        // User restriction check
        if ($this->user_restriction_type === self::USER_SPECIFIC) {
            if (!$user) {
                return ['valid' => false, 'message' => 'Please log in to your account to use this coupon.'];
            }
            $allowedUserIds = $this->restrictedUsers()->pluck('users.id')->toArray();
            if (!empty($allowedUserIds)) {
                if (!in_array($user->id, $allowedUserIds, true)) {
                    return ['valid' => false, 'message' => 'This coupon is restricted to specific user accounts.'];
                }
            } elseif ($this->restricted_user_id !== null && $user->id !== $this->restricted_user_id) {
                return ['valid' => false, 'message' => 'This coupon is restricted to a specific user account.'];
            }
        }

        // Per-user usage limit check
        if ($user && $this->usage_limit_per_user > 0) {
            $userUsageCount = $this->usages()->where('user_id', $user->id)->count();
            if ($userUsageCount >= $this->usage_limit_per_user) {
                return ['valid' => false, 'message' => 'You have already reached the maximum usage limit for this coupon.'];
            }
        }

        // Scope check: specific course
        if ($this->scope_type === self::SCOPE_COURSE) {
            $isLinked = $this->courses()->where('courses.id', $course->id)->exists();
            if (!$isLinked) {
                return ['valid' => false, 'message' => 'This coupon is not valid for this specific course.'];
            }
        }

        // Scope check: specific category
        if ($this->scope_type === self::SCOPE_CATEGORY) {
            $categoryIds = $course->categories()->pluck('categories.id')->toArray();
            $isCategoryLinked = $this->categories()->whereIn('categories.id', $categoryIds)->exists();
            if (!$isCategoryLinked) {
                return ['valid' => false, 'message' => 'This coupon is only valid for selected course categories.'];
            }
        }

        $discount = $this->calculateDiscount($coursePrice);

        return [
            'valid' => true,
            'coupon_id' => $this->id,
            'code' => $this->code,
            'title' => $this->title,
            'discount_type' => $this->discount_type,
            'discount_amount' => $this->discount_amount,
            'calculated_discount' => $discount,
            'final_price' => max(0, $coursePrice - $discount),
            'message' => 'Coupon applied successfully!',
        ];
    }

    /**
     * Fully validate coupon for a collection of cart courses.
     *
     * @param User|null $user
     * @param mixed $courses
     * @param float $subtotal
     * @return array
     */
    public function validateForCart(?User $user, $courses, float $subtotal): array
    {
        if (!$this->is_active) {
            return ['valid' => false, 'message' => 'This coupon is no longer active.'];
        }

        $now = Carbon::now();

        if ($this->start_date && $this->start_date->isFuture()) {
            return ['valid' => false, 'message' => 'This coupon offer has not started yet.'];
        }

        if ($this->expiry_date && $this->expiry_date->isPast()) {
            return ['valid' => false, 'message' => 'This coupon has expired.'];
        }

        if ($this->usage_limit !== null && $this->times_used >= $this->usage_limit) {
            return ['valid' => false, 'message' => 'This coupon has reached its total usage limit.'];
        }

        // Minimum order amount check against cart subtotal
        if ($this->min_order_amount !== null && $this->min_order_amount > 0 && $subtotal < $this->min_order_amount) {
            return [
                'valid' => false,
                'message' => "This coupon requires a minimum cart subtotal of Tk {$this->min_order_amount}."
            ];
        }

        // User restriction check
        if ($this->user_restriction_type === self::USER_SPECIFIC) {
            if (!$user) {
                return ['valid' => false, 'message' => 'Please log in to your account to use this coupon.'];
            }
            $allowedUserIds = $this->restrictedUsers()->pluck('users.id')->toArray();
            if (!empty($allowedUserIds)) {
                if (!in_array($user->id, $allowedUserIds, true)) {
                    return ['valid' => false, 'message' => 'This coupon is restricted to specific user accounts.'];
                }
            } elseif ($this->restricted_user_id !== null && $user->id !== $this->restricted_user_id) {
                return ['valid' => false, 'message' => 'This coupon is restricted to a specific user account.'];
            }
        }

        // Per-user usage limit check
        if ($user && $this->usage_limit_per_user > 0) {
            $userUsageCount = $this->usages()->where('user_id', $user->id)->count();
            if ($userUsageCount >= $this->usage_limit_per_user) {
                return ['valid' => false, 'message' => 'You have already reached the maximum usage limit for this coupon.'];
            }
        }

        $courseCollection = $courses instanceof \Illuminate\Support\Collection ? $courses : collect($courses);

        if ($courseCollection->isEmpty()) {
            return ['valid' => false, 'message' => 'Your cart is empty.'];
        }

        // Scope check: all, specific courses, or specific categories
        $qualifyingCourses = $courseCollection->filter(function ($course) {
            if ($this->scope_type === self::SCOPE_ALL) {
                return true;
            }

            if ($this->scope_type === self::SCOPE_COURSE) {
                return $this->courses()->where('courses.id', $course->id)->exists();
            }

            if ($this->scope_type === self::SCOPE_CATEGORY) {
                $categoryIds = $course->relationLoaded('categories')
                    ? $course->categories->pluck('id')->toArray()
                    : (method_exists($course, 'categories') ? $course->categories()->pluck('categories.id')->toArray() : []);
                return $this->categories()->whereIn('categories.id', $categoryIds)->exists();
            }

            return false;
        });

        if ($qualifyingCourses->isEmpty()) {
            if ($this->scope_type === self::SCOPE_COURSE) {
                return ['valid' => false, 'message' => 'This coupon is not valid for any course currently in your cart.'];
            }
            if ($this->scope_type === self::SCOPE_CATEGORY) {
                return ['valid' => false, 'message' => 'This coupon is only valid for selected categories. None of your cart items match.'];
            }
            return ['valid' => false, 'message' => 'No qualifying items found in cart for this coupon.'];
        }

        $qualifyingTotal = $qualifyingCourses->sum(function ($c) {
            return (float) ($c->effective_price ?? $c->price ?? 0);
        });

        $discount = $this->calculateDiscount($qualifyingTotal);

        return [
            'valid' => true,
            'coupon_id' => $this->id,
            'code' => $this->code,
            'title' => $this->title,
            'discount_type' => $this->discount_type,
            'discount_amount' => (float) $this->discount_amount,
            'calculated_discount' => (float) floor($discount),
            'final_price' => (float) floor(max(0, $subtotal - $discount)),
            'message' => 'Coupon applied successfully!',
        ];
    }
}

