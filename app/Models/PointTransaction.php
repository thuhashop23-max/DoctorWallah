<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class PointTransaction extends Model
{
    use HasFactory;

    protected $table = 'point_transactions';

    public const TYPE_COURSE_PURCHASE = 'course_purchase';
    public const TYPE_NOTE_REWARD = 'note_reward';
    public const TYPE_MANUAL_ADJUSTMENT = 'manual_adjustment';
    public const TYPE_REDEEM_DISCOUNT = 'redeem_discount';

    protected $fillable = [
        'user_id',
        'amount',
        'type',
        'reference_id',
        'reference_type',
        'description',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'amount' => 'integer',
        'reference_id' => 'integer',
    ];

    public static function ensureTableExists(): void
    {
        if (! Schema::hasTable('point_transactions')) {
            try {
                Schema::create('point_transactions', function (Blueprint $table) {
                    $table->id();
                    $table->unsignedBigInteger('user_id')->index();
                    $table->integer('amount');
                    $table->string('type', 50)->index();
                    $table->unsignedBigInteger('reference_id')->nullable()->index();
                    $table->string('reference_type', 100)->nullable();
                    $table->string('description', 255);
                    $table->timestamps();
                });
            } catch (\Throwable $e) {
                // Table exists
            }
        }
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
