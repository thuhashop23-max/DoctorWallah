<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class Order extends Model
{
    public const PAYMENT_PENDING = 'pending';
    public const PAYMENT_PAID = 'paid';
    public const PAYMENT_FAILED = 'failed';
    public const PAYMENT_CANCELLED = 'cancelled';
    public const PAYMENT_REFUNDED = 'refunded';

    public const ORDER_PROCESSING = 'processing';
    public const ORDER_COMPLETED = 'completed';
    public const ORDER_CANCELLED = 'cancelled';

    protected $fillable = [
        'order_number',
        'user_id',
        'affiliate_id',
        'affiliate_code',
        'course_id',
        'bundle_id',
        'original_price',
        'discount_amount',
        'affiliate_discount',
        'coupon_id',
        'coupon_code',
        'coupon_discount',
        'points_redeemed',
        'points_discount',
        'dynamic_offer_id',
        'dynamic_offer_title',
        'dynamic_offer_discount',
        'final_amount',
        'has_nexpilot',
        'nexpilot_id',
        'nexpilot_price',
        'payment_status',
        'order_status',
        'payment_method',
        'notes',
    ];

    protected $casts = [
        'original_price' => 'float',
        'discount_amount' => 'float',
        'affiliate_discount' => 'float',
        'coupon_discount' => 'float',
        'points_redeemed' => 'integer',
        'points_discount' => 'float',
        'dynamic_offer_discount' => 'float',
        'final_amount' => 'float',
        'has_nexpilot' => 'boolean',
        'nexpilot_price' => 'float',
    ];

    public static function booted(): void
    {
        parent::booted();

        if (Schema::hasTable('orders')) {
            try {
                Schema::table('orders', function (Blueprint $table) {
                    if (!Schema::hasColumn('orders', 'points_redeemed')) {
                        $table->integer('points_redeemed')->default(0)->after('coupon_discount');
                    }
                    if (!Schema::hasColumn('orders', 'points_discount')) {
                        $table->decimal('points_discount', 10, 2)->default(0.00)->after('points_redeemed');
                    }
                    if (!Schema::hasColumn('orders', 'dynamic_offer_id')) {
                        $table->unsignedBigInteger('dynamic_offer_id')->nullable()->after('coupon_discount');
                    }
                    if (!Schema::hasColumn('orders', 'dynamic_offer_title')) {
                        $table->string('dynamic_offer_title')->nullable()->after('dynamic_offer_id');
                    }
                    if (!Schema::hasColumn('orders', 'dynamic_offer_discount')) {
                        $table->decimal('dynamic_offer_discount', 10, 2)->default(0.00)->after('dynamic_offer_title');
                    }
                });
            } catch (\Throwable $e) {
                // Ignore schema migration issues
            }
        }
    }

    public static function generateOrderNumber(): string
    {
        return 'ORD-'.strtoupper(date('ymd')).'-'.strtoupper(Str::random(5));
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function bundle(): BelongsTo
    {
        return $this->belongsTo(CourseBundle::class, 'bundle_id');
    }

    public function coupon(): BelongsTo
    {
        return $this->belongsTo(Coupon::class);
    }

    public function dynamicOffer(): BelongsTo
    {
        return $this->belongsTo(DynamicOffer::class, 'dynamic_offer_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function nexpilot(): BelongsTo
    {
        return $this->belongsTo(NexPilot::class, 'nexpilot_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function affiliateProfile(): BelongsTo
    {
        return $this->belongsTo(AffiliateProfile::class, 'affiliate_id');
    }

    public function affiliateCommission(): HasOne
    {
        return $this->hasOne(AffiliateCommission::class);
    }

    public function latestPayment(): HasOne
    {
        return $this->hasOne(Payment::class)->latestOfMany();
    }

    public function enrollment(): HasOne
    {
        return $this->hasOne(Enrollment::class);
    }

    public function isPaid(): bool
    {
        return $this->payment_status === self::PAYMENT_PAID;
    }

    public function scopePaid($query)
    {
        return $query->where('payment_status', self::PAYMENT_PAID);
    }

    public function scopePending($query)
    {
        return $query->where('payment_status', self::PAYMENT_PENDING);
    }
}
