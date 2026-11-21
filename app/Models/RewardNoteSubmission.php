<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class RewardNoteSubmission extends Model
{
    use HasFactory;

    protected $table = 'reward_note_submissions';

    public const STATUS_PENDING = 'pending';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';

    protected $fillable = [
        'topic_id',
        'course_id',
        'user_id',
        'title',
        'description',
        'file_paths',
        'status',
        'points_awarded',
        'reviewed_by',
        'feedback',
        'reviewed_at',
    ];

    protected $casts = [
        'topic_id' => 'integer',
        'course_id' => 'integer',
        'user_id' => 'integer',
        'points_awarded' => 'integer',
        'reviewed_by' => 'integer',
        'file_paths' => 'array',
        'reviewed_at' => 'datetime',
    ];

    public static function ensureTableExists(): void
    {
        if (! Schema::hasTable('reward_note_submissions')) {
            try {
                Schema::create('reward_note_submissions', function (Blueprint $table) {
                    $table->id();
                    $table->unsignedBigInteger('topic_id')->index();
                    $table->unsignedBigInteger('course_id')->index();
                    $table->unsignedBigInteger('user_id')->index();
                    $table->string('title');
                    $table->text('description')->nullable();
                    $table->text('file_paths')->nullable();
                    $table->string('status', 30)->default('pending')->index();
                    $table->integer('points_awarded')->default(0);
                    $table->unsignedBigInteger('reviewed_by')->nullable();
                    $table->text('feedback')->nullable();
                    $table->timestamp('reviewed_at')->nullable();
                    $table->timestamps();
                });
            } catch (\Throwable $e) {
                // Table exists
            }
        }
    }

    public function topic(): BelongsTo
    {
        return $this->belongsTo(RewardTopic::class, 'topic_id');
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
