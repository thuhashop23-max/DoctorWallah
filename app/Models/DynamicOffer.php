<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;

class DynamicOffer extends Model
{
    protected $fillable = [
        'title',
        'description',
        'banner_text',
        'scope_type',
        'applicable_categories',
        'applicable_courses',
        'tiers',
        'min_order_amount',
        'start_date',
        'end_date',
        'is_active',
        'priority',
        'created_by',
    ];

    protected $casts = [
        'applicable_categories' => 'array',
        'applicable_courses' => 'array',
        'tiers' => 'array',
        'min_order_amount' => 'float',
        'is_active' => 'boolean',
        'priority' => 'integer',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Scope for currently active offers based on dates and active flag.
     */
    public function scopeActive($query)
    {
        $now = now();
        return $query->where('is_active', true)
            ->where(function ($q) use ($now) {
                $q->whereNull('start_date')->orWhere('start_date', '<=', $now);
            })
            ->where(function ($q) use ($now) {
                $q->whereNull('end_date')->orWhere('end_date', '>=', $now);
            })
            ->orderByDesc('priority')
            ->orderByDesc('id');
    }

    public static function ensureTableExists(): void
    {
        if (!Schema::hasTable('dynamic_offers')) {
            try {
                Schema::create('dynamic_offers', function (Blueprint $table) {
                    $table->id();
                    $table->string('title');
                    $table->text('description')->nullable();
                    $table->string('banner_text', 500)->nullable();
                    $table->enum('scope_type', ['all', 'category', 'course'])->default('all');
                    $table->json('applicable_categories')->nullable();
                    $table->json('applicable_courses')->nullable();
                    $table->json('tiers');
                    $table->decimal('min_order_amount', 10, 2)->nullable();
                    $table->dateTime('start_date')->nullable();
                    $table->dateTime('end_date')->nullable();
                    $table->boolean('is_active')->default(true);
                    $table->integer('priority')->default(0);
                    $table->unsignedBigInteger('created_by')->nullable();
                    $table->timestamps();
                    $table->index('is_active');
                });
            } catch (\Throwable $e) {
                // Ignore if table exists or permission issue
            }
        }
    }

    public static function booted(): void
    {
        parent::booted();
        static::ensureTableExists();
    }

    /**
     * Calculate discount for a given list of courses.
     *
     * @param mixed $courses
     * @param float $subtotal
     * @return array
     */
    public function evaluateForCourses($courses, float $subtotal): array
    {
        try {
            if (!$this->is_active) {
                return ['applied' => false, 'discount_amount' => 0];
            }

            $now = now();
            if ($this->start_date && $this->start_date->isFuture()) {
                return ['applied' => false, 'discount_amount' => 0];
            }
            if ($this->end_date && $this->end_date->isPast()) {
                return ['applied' => false, 'discount_amount' => 0];
            }

            if ($this->min_order_amount && $subtotal < $this->min_order_amount) {
                return [
                    'applied' => false,
                    'discount_amount' => 0,
                    'min_order_required' => $this->min_order_amount,
                    'message' => 'Minimum order amount of ' . $this->min_order_amount . ' Tk required.'
                ];
            }

            $courseCollection = $courses instanceof Collection ? $courses : collect($courses);

            // Filter qualifying courses based on scope
            $qualifyingCourses = $courseCollection->filter(function ($course) {
                if ($this->scope_type === 'all') {
                    return true;
                }

                if ($this->scope_type === 'course') {
                    $allowedIds = array_map('intval', (array) ($this->applicable_courses ?? []));
                    return in_array((int) $course->id, $allowedIds, true);
                }

                if ($this->scope_type === 'category') {
                    $allowedCatIds = array_map('intval', (array) ($this->applicable_categories ?? []));
                    if (!empty($course->category_id) && in_array((int) $course->category_id, $allowedCatIds, true)) {
                        return true;
                    }
                    if ($course->relationLoaded('categories')) {
                        $catIds = $course->categories->pluck('id')->map(fn($id) => (int) $id)->all();
                        return count(array_intersect($catIds, $allowedCatIds)) > 0;
                    }
                    if (method_exists($course, 'categories')) {
                        try {
                            $catIds = $course->categories()->pluck('categories.id')->map(fn($id) => (int) $id)->all();
                            return count(array_intersect($catIds, $allowedCatIds)) > 0;
                        } catch (\Throwable $e) {}
                    }
                    return false;
                }

                return false;
            });

            $qualifyingCount = $qualifyingCourses->count();
            if ($qualifyingCount === 0) {
                return ['applied' => false, 'discount_amount' => 0];
            }

            // Calculate qualifying price
            $qualifyingPrice = $qualifyingCourses->sum(function ($c) {
                return (float) ($c->effective_price ?? $c->price ?? 0);
            });

            $tiers = (array) ($this->tiers ?? []);
            // Sort tiers by min_qty descending
            usort($tiers, function ($a, $b) {
                return ($b['min_qty'] ?? 0) <=> ($a['min_qty'] ?? 0);
            });

            $matchedTier = null;
            $nextTier = null;

            foreach ($tiers as $tier) {
                $minQty = (int) ($tier['min_qty'] ?? 1);
                if ($qualifyingCount >= $minQty) {
                    $matchedTier = $tier;
                    break;
                }
            }

            // Find the next tier to encourage adding more courses
            $ascendingTiers = $tiers;
            usort($ascendingTiers, function ($a, $b) {
                return ($a['min_qty'] ?? 0) <=> ($b['min_qty'] ?? 0);
            });

            foreach ($ascendingTiers as $tier) {
                $minQty = (int) ($tier['min_qty'] ?? 1);
                if ($minQty > $qualifyingCount) {
                    $nextTier = $tier;
                    break;
                }
            }

            if (!$matchedTier) {
                return [
                    'applied' => false,
                    'offer_id' => $this->id,
                    'offer_title' => $this->title,
                    'qualifying_count' => $qualifyingCount,
                    'discount_amount' => 0,
                    'next_tier' => $nextTier ? [
                        'min_qty' => (int) $nextTier['min_qty'],
                        'courses_needed' => (int) $nextTier['min_qty'] - $qualifyingCount,
                        'discount_type' => $nextTier['discount_type'] ?? 'percentage',
                        'discount_value' => (float) ($nextTier['discount_value'] ?? 0),
                    ] : null,
                ];
            }

            $discountType = $matchedTier['discount_type'] ?? 'percentage';
            $discountValue = (float) ($matchedTier['discount_value'] ?? 0);
            $discountAmount = 0.0;

            if ($discountType === 'percentage') {
                $discountAmount = floor(($qualifyingPrice * $discountValue) / 100);
            } else {
                $discountAmount = floor(min($qualifyingPrice, $discountValue));
            }

            return [
                'applied' => true,
                'offer_id' => $this->id,
                'offer_title' => $this->title,
                'banner_text' => $this->banner_text,
                'scope_type' => $this->scope_type,
                'qualifying_count' => $qualifyingCount,
                'matched_tier' => [
                    'min_qty' => (int) $matchedTier['min_qty'],
                    'discount_type' => $discountType,
                    'discount_value' => $discountValue,
                ],
                'discount_amount' => (float) floor($discountAmount),
                'next_tier' => $nextTier ? [
                    'min_qty' => (int) $nextTier['min_qty'],
                    'courses_needed' => (int) $nextTier['min_qty'] - $qualifyingCount,
                    'discount_type' => $nextTier['discount_type'] ?? 'percentage',
                    'discount_value' => (float) ($nextTier['discount_value'] ?? 0),
                ] : null,
            ];
        } catch (\Throwable $e) {
            return ['applied' => false, 'discount_amount' => 0];
        }
    }
}
