<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CourseComplaint extends Model
{
    use HasFactory;

    protected $table = 'course_complaints';

    public const STATUS_PENDING = 'pending';
    public const STATUS_REVIEWED = 'reviewed';
    public const STATUS_RESOLVED = 'resolved';

    protected $fillable = [
        'course_id',
        'user_id',
        'subject',
        'message',
        'status',
        'admin_notes',
        'resolved_at',
    ];

    protected $casts = [
        'course_id' => 'integer',
        'user_id' => 'integer',
        'resolved_at' => 'datetime',
    ];

    public static function ensureTableExists(): void
    {
        if (! Schema::hasTable('course_complaints')) {
            try {
                Schema::create('course_complaints', function (Blueprint $table) {
                    $table->id();
                    $table->unsignedBigInteger('course_id')->index();
                    $table->unsignedBigInteger('user_id')->index();
                    $table->string('subject');
                    $table->text('message');
                    $table->string('status', 30)->default('pending')->index();
                    $table->text('admin_notes')->nullable();
                    $table->timestamp('resolved_at')->nullable();
                    $table->timestamps();
                });
            } catch (\Throwable $e) {
                // Table already exists or no DDL permission
            }
        }
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
