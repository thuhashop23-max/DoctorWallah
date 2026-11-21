<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class PointSetting extends Model
{
    use HasFactory;

    protected $table = 'point_settings';

    protected $fillable = [
        'purchase_points_enabled',
        'purchase_points_type',
        'points_per_course',
        'points_per_100_currency',
        'redemption_enabled',
        'redemption_points',
        'redemption_amount',
        'max_redemption_percentage',
        'is_active',
    ];

    protected $casts = [
        'purchase_points_enabled' => 'boolean',
        'points_per_course' => 'integer',
        'points_per_100_currency' => 'integer',
        'redemption_enabled' => 'boolean',
        'redemption_points' => 'integer',
        'redemption_amount' => 'float',
        'max_redemption_percentage' => 'integer',
        'is_active' => 'boolean',
    ];

    public static function ensureTableExists(): void
    {
        if (! Schema::hasTable('point_settings')) {
            try {
                Schema::create('point_settings', function (Blueprint $table) {
                    $table->id();
                    $table->boolean('purchase_points_enabled')->default(true);
                    $table->string('purchase_points_type')->default('fixed');
                    $table->integer('points_per_course')->default(50);
                    $table->integer('points_per_100_currency')->default(10);
                    $table->boolean('redemption_enabled')->default(true);
                    $table->integer('redemption_points')->default(10);
                    $table->decimal('redemption_amount', 10, 2)->default(1.00);
                    $table->integer('max_redemption_percentage')->default(50);
                    $table->boolean('is_active')->default(true);
                    $table->timestamps();
                });
            } catch (\Throwable $e) {
                // Table already exists or no DDL permissions
            }
        } else {
            try {
                if (! Schema::hasColumn('point_settings', 'redemption_enabled')) {
                    Schema::table('point_settings', function (Blueprint $table) {
                        $table->boolean('redemption_enabled')->default(true);
                        $table->integer('redemption_points')->default(10);
                        $table->decimal('redemption_amount', 10, 2)->default(1.00);
                        $table->integer('max_redemption_percentage')->default(50);
                    });
                }
            } catch (\Throwable $e) {
                // Ignore DDL errors
            }
        }
    }

    public static function getSettings(): self
    {
        self::ensureTableExists();

        $settings = self::first();
        if (! $settings) {
            $settings = self::create([
                'purchase_points_enabled' => true,
                'purchase_points_type' => 'fixed',
                'points_per_course' => 50,
                'points_per_100_currency' => 10,
                'redemption_enabled' => true,
                'redemption_points' => 10,
                'redemption_amount' => 1.00,
                'max_redemption_percentage' => 50,
                'is_active' => true,
            ]);
        }

        return $settings;
    }
}
