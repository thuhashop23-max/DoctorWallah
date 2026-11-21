<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Add points column to users table if missing
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (! Schema::hasColumn('users', 'points')) {
                    $table->integer('points')->default(0)->after('status');
                }
            });
        }

        // 2. Create point_settings table
        if (! Schema::hasTable('point_settings')) {
            Schema::create('point_settings', function (Blueprint $table) {
                $table->id();
                $table->boolean('purchase_points_enabled')->default(true);
                $table->string('purchase_points_type')->default('fixed'); // fixed or per_amount
                $table->integer('points_per_course')->default(50);
                $table->integer('points_per_100_currency')->default(10);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // 3. Create point_transactions table
        if (! Schema::hasTable('point_transactions')) {
            Schema::create('point_transactions', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id')->index();
                $table->integer('amount'); // positive or negative
                $table->string('type', 50)->index(); // course_purchase, note_reward, manual_adjustment
                $table->unsignedBigInteger('reference_id')->nullable()->index();
                $table->string('reference_type', 100)->nullable();
                $table->string('description', 255);
                $table->timestamps();
            });
        }

        // 4. Create reward_topics table
        if (! Schema::hasTable('reward_topics')) {
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
        }

        // 5. Create reward_note_submissions table
        if (! Schema::hasTable('reward_note_submissions')) {
            Schema::create('reward_note_submissions', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('topic_id')->index();
                $table->unsignedBigInteger('course_id')->index();
                $table->unsignedBigInteger('user_id')->index();
                $table->string('title');
                $table->text('description')->nullable();
                $table->text('file_paths')->nullable(); // JSON array of stored file paths
                $table->string('status', 30)->default('pending')->index(); // pending, approved, rejected
                $table->integer('points_awarded')->default(0);
                $table->unsignedBigInteger('reviewed_by')->nullable();
                $table->text('feedback')->nullable();
                $table->timestamp('reviewed_at')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reward_note_submissions');
        Schema::dropIfExists('reward_topics');
        Schema::dropIfExists('point_transactions');
        Schema::dropIfExists('point_settings');

        if (Schema::hasTable('users') && Schema::hasColumn('users', 'points')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('points');
            });
        }
    }
};
