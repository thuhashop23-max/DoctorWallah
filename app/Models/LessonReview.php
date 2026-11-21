<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class LessonReview extends Model
{
    protected $fillable = [
        'lesson_id',
        'course_id',
        'user_id',
        'rating',
        'review',
    ];

    protected $casts = [
        'rating' => 'integer',
        'lesson_id' => 'integer',
        'course_id' => 'integer',
        'user_id' => 'integer',
    ];

    /**
     * Ensure the lesson_reviews table exists on shared hosting environments.
     */
    public static function ensureTableExists(): void
    {
        if (! Schema::hasTable('lesson_reviews')) {
            try {
                Schema::create('lesson_reviews', function (Blueprint $table) {
                    $table->id();
                    $table->unsignedBigInteger('lesson_id')->index();
                    $table->unsignedBigInteger('course_id')->index();
                    $table->unsignedBigInteger('user_id')->index();
                    $table->unsignedTinyInteger('rating');
                    $table->text('review')->nullable();
                    $table->timestamps();

                    $table->unique(['lesson_id', 'user_id']);
                });
            } catch (\Throwable $e) {
                // Table already exists or no DDL permission
            }
        }
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
