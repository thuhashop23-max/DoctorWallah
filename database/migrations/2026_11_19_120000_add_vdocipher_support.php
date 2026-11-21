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
        if (Schema::hasTable('website_settings')) {
            Schema::table('website_settings', function (Blueprint $table) {
                if (! Schema::hasColumn('website_settings', 'vdocipher_settings')) {
                    $table->json('vdocipher_settings')->nullable()->after('manual_payment_settings');
                }
            });
        }

        if (Schema::hasTable('lessons')) {
            Schema::table('lessons', function (Blueprint $table) {
                if (! Schema::hasColumn('lessons', 'video_provider')) {
                    $table->string('video_provider', 50)->default('youtube')->nullable()->after('content');
                }
                if (Schema::hasColumn('lessons', 'video_url')) {
                    $table->text('video_url')->nullable()->change();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('website_settings')) {
            Schema::table('website_settings', function (Blueprint $table) {
                if (Schema::hasColumn('website_settings', 'vdocipher_settings')) {
                    $table->dropColumn('vdocipher_settings');
                }
            });
        }

        if (Schema::hasTable('lessons')) {
            Schema::table('lessons', function (Blueprint $table) {
                if (Schema::hasColumn('lessons', 'video_provider')) {
                    $table->dropColumn('video_provider');
                }
            });
        }
    }
};
