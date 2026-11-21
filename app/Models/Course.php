<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class Course extends Model
{
    use SoftDeletes;
    public const STATUS_DRAFT = 'draft';
    public const STATUS_PUBLISHED = 'published';
    public const STATUS_ARCHIVED = 'archived';

    protected $fillable = [
        'instructor_id', // legacy support
        'title',
        'slug',
        'short_description',
        'description',
        'features',
        'thumbnail',
        'price',
        'sale_price',
        'fake_enrollment_count',
        'class_starts_at',
        'action_buttons',
        'enrolled_action_buttons',
        'coupon_code',
        'coupon_discount_text',
        'discount_deadline',
        'show_coupon_timer',
        'how_to_buy_url',
        'is_featured',
        'enable_manual_payment',
        'enable_shurjopay',
        'status',
    ];

    protected $casts = [
        'price' => 'float',
        'sale_price' => 'float',
        'features' => 'array',
        'fake_enrollment_count' => 'integer',
        'action_buttons' => 'array',
        'enrolled_action_buttons' => 'array',
        'discount_deadline' => 'datetime',
        'show_coupon_timer' => 'boolean',
        'is_featured' => 'boolean',
        'enable_manual_payment' => 'boolean',
        'enable_shurjopay' => 'boolean',
    ];

    protected $appends = [
        'effective_price',
        'discount_percent',
        'thumbnail_url',
    ];

    public static function booted(): void
    {
        self::ensureCourseInstructorsTableExists();
        self::ensureCategoryCourseTableExists();

        if (Schema::hasTable('courses')) {
            $columnDefinitions = [
                'enable_manual_payment' => fn(Blueprint $table) => $table->boolean('enable_manual_payment')->default(true),
                'enable_shurjopay' => fn(Blueprint $table) => $table->boolean('enable_shurjopay')->default(true),
                'features' => fn(Blueprint $table) => $table->json('features')->nullable(),
                'fake_enrollment_count' => fn(Blueprint $table) => $table->integer('fake_enrollment_count')->default(0),
                'class_starts_at' => fn(Blueprint $table) => $table->string('class_starts_at', 100)->nullable(),
                'action_buttons' => fn(Blueprint $table) => $table->json('action_buttons')->nullable(),
                'enrolled_action_buttons' => fn(Blueprint $table) => $table->json('enrolled_action_buttons')->nullable(),
                'coupon_code' => fn(Blueprint $table) => $table->string('coupon_code', 100)->nullable(),
                'coupon_discount_text' => fn(Blueprint $table) => $table->string('coupon_discount_text', 100)->nullable(),
                'discount_deadline' => fn(Blueprint $table) => $table->timestamp('discount_deadline')->nullable(),
                'show_coupon_timer' => fn(Blueprint $table) => $table->boolean('show_coupon_timer')->default(false),
                'how_to_buy_url' => fn(Blueprint $table) => $table->string('how_to_buy_url', 500)->nullable(),
            ];

            foreach ($columnDefinitions as $col => $definition) {
                try {
                    if (!Schema::hasColumn('courses', $col)) {
                        Schema::table('courses', function (Blueprint $table) use ($definition) {
                            $definition($table);
                        });
                    }
                } catch (\Throwable $e) {
                    // Column already exists or restricted
                }
            }
        }

        static::creating(function (self $course): void {
            if (empty($course->slug)) {
                $course->slug = Str::slug($course->title);
            }
        });
    }

    public static function ensureCourseInstructorsTableExists(): void
    {
        try {
            if (! Schema::hasTable('course_instructors')) {
                Schema::create('course_instructors', function (Blueprint $table) {
                    $table->id();
                    $table->unsignedBigInteger('course_id')->index();
                    $table->unsignedBigInteger('user_id')->index();
                    $table->boolean('is_primary')->default(false);
                    $table->timestamps();

                    $table->unique(['course_id', 'user_id']);
                });
            } else {
                if (! Schema::hasColumn('course_instructors', 'is_primary')) {
                    Schema::table('course_instructors', function (Blueprint $table) {
                        $table->boolean('is_primary')->default(false)->after('user_id');
                    });
                }
                if (! Schema::hasColumn('course_instructors', 'created_at')) {
                    Schema::table('course_instructors', function (Blueprint $table) {
                        $table->timestamps();
                    });
                }
            }
        } catch (\Throwable $e) {
            \Log::warning('ensureCourseInstructorsTableExists error: ' . $e->getMessage());
        }
    }

    public static function ensureCategoryCourseTableExists(): void
    {
        try {
            if (! Schema::hasTable('category_course')) {
                Schema::create('category_course', function (Blueprint $table) {
                    $table->id();
                    $table->unsignedBigInteger('category_id')->index();
                    $table->unsignedBigInteger('course_id')->index();
                    $table->timestamps();
                });
            }
        } catch (\Throwable $e) {
            \Log::warning('ensureCategoryCourseTableExists error: ' . $e->getMessage());
        }
    }

    public function instructors(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'course_instructors', 'course_id', 'user_id')
            ->withPivot('is_primary')
            ->withTimestamps();
    }

    // Fallback for single instructor relationship
    public function instructor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'instructor_id');
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class);
    }

    public function getCategoryAttribute(): ?Category
    {
        return $this->relationLoaded('categories') ? $this->categories->first() : $this->categories()->first();
    }

    public function sections(): HasMany
    {
        return $this->hasMany(CourseSection::class)->orderBy('sort_order');
    }

    public function lessons(): HasMany
    {
        return $this->hasMany(Lesson::class)->orderBy('sort_order');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    public function exams(): BelongsToMany
    {
        return $this->belongsToMany(Exam::class, 'course_exams')->withPivot('order')->withTimestamps()->orderBy('course_exams.order');
    }

    public function students(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'enrollments')
            ->withPivot(['id', 'status', 'enrolled_at'])
            ->withTimestamps();
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function nexpilot(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(NexPilot::class);
    }

    public function liveClasses(): HasMany
    {
        return $this->hasMany(LiveClass::class)->orderBy('start_time', 'desc');
    }

    public function routines(): HasMany
    {
        return $this->hasMany(CourseRoutine::class)->orderBy('start_time', 'asc');
    }

    public function lessonReviews(): HasMany
    {
        return $this->hasMany(LessonReview::class);
    }

    public function scopePublished($query)
    {
        return $query->where('status', self::STATUS_PUBLISHED);
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true)->published();
    }

    public function scopeFree($query)
    {
        return $query->where('price', 0)->published();
    }

    public function scopePaid($query)
    {
        return $query->where('price', '>', 0)->published();
    }

    public function getThumbnailAttribute($value): ?string
    {
        if (!$value) {
            return null;
        }
        if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://') || str_starts_with($value, 'data:')) {
            return $value;
        }
        return str_starts_with($value, '/') ? $value : '/' . $value;
    }

    public function getThumbnailUrlAttribute(): ?string
    {
        return $this->thumbnail;
    }

    public function getEffectivePriceAttribute(): float
    {
        if ($this->sale_price !== null && $this->sale_price >= 0 && $this->sale_price < $this->price) {
            return (float) $this->sale_price;
        }

        return (float) $this->price;
    }

    public function getDiscountPercentAttribute(): int
    {
        if (! $this->price || $this->sale_price === null || $this->price <= $this->sale_price) {
            return 0;
        }

        return (int) round((($this->price - $this->sale_price) / $this->price) * 100);
    }

    public function isAssignedTeacher(int $userId): bool
    {
        if ($this->instructor_id === $userId) {
            return true;
        }

        try {
            self::ensureCourseInstructorsTableExists();
            return $this->instructors()->where('users.id', $userId)->exists();
        } catch (\Throwable $e) {
            return false;
        }
    }

    public function affiliateSetting(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(CourseAffiliateSetting::class);
    }

    public function bundles(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(CourseBundle::class, 'bundle_courses', 'course_id', 'bundle_id')
            ->withPivot('sort_order')
            ->withTimestamps();
    }

    public function rewardTopics(): HasMany
    {
        return $this->hasMany(RewardTopic::class);
    }

    public function rewardNoteSubmissions(): HasMany
    {
        return $this->hasMany(RewardNoteSubmission::class);
    }

    public function complaints(): HasMany
    {
        return $this->hasMany(CourseComplaint::class);
    }
}
