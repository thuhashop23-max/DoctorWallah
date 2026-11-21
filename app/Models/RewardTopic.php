<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class RewardTopic extends Model
{
    use HasFactory;

    protected $table = 'reward_topics';

    protected $fillable = [
        'course_id',
        'created_by',
        'title',
        'description',
        'points_reward',
        'is_active',
    ];

    protected $casts = [
        'course_id' => 'integer',
        'created_by' => 'integer',
        'points_reward' => 'integer',
        'is_active' => 'boolean',
    ];

    public static function ensureTableExists(): void
    {
        if (! Schema::hasTable('reward_topics')) {
            try {
                Schema::create('reward_topics', function (Blueprint $table) {
                    $table->id();
                    $table->unsignedBigInteger('course_id')->index();
                    $table->unsignedBigInteger('created_by')->nullable()->index();
                    $table->string('title');
                    $table->text('description')->nullable();
                    $table->integer('points_reward')->default(50);
                    $table->boolean('is_active')->default(true);
                    $table->timestamps();
                });
            } catch (\Throwable $e) {
                // Table exists
            }
        }
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(RewardNoteSubmission::class, 'topic_id');
    }

    public function approvedSubmissions(): HasMany
    {
        return $this->hasMany(RewardNoteSubmission::class, 'topic_id')
            ->where('status', RewardNoteSubmission::STATUS_APPROVED);
    }
}
