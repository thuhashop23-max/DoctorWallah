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
        if (!Schema::hasTable('dynamic_offers')) {
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
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->index('is_active');
            });
        }

        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
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
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                if (Schema::hasColumn('orders', 'dynamic_offer_discount')) {
                    $table->dropColumn('dynamic_offer_discount');
                }
                if (Schema::hasColumn('orders', 'dynamic_offer_title')) {
                    $table->dropColumn('dynamic_offer_title');
                }
                if (Schema::hasColumn('orders', 'dynamic_offer_id')) {
                    $table->dropColumn('dynamic_offer_id');
                }
            });
        }

        Schema::dropIfExists('dynamic_offers');
    }
};
