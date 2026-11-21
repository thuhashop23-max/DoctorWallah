<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Schema;

class SmsSetting extends Model
{
    protected $fillable = [
        'provider',
        'api_token',
        'sender_id',
        'sms_enabled',
        'otp_enabled',
        'otp_expiration_minutes',
        'otp_resend_cooldown_seconds',
    ];

    protected $casts = [
        'sms_enabled' => 'boolean',
        'otp_enabled' => 'boolean',
        'otp_expiration_minutes' => 'integer',
        'otp_resend_cooldown_seconds' => 'integer',
    ];

    public function getApiTokenAttribute($value): ?string
    {
        if (empty($value)) {
            return null;
        }

        try {
            return trim(Crypt::decryptString($value));
        } catch (\Throwable $e) {
            // Raw or unencrypted token stored directly in database
            return trim((string) $value);
        }
    }

    public function setApiTokenAttribute($value): void
    {
        if (empty($value)) {
            $this->attributes['api_token'] = null;
            return;
        }

        $this->attributes['api_token'] = trim((string) $value);
    }

    public static function ensureTableExists(): void
    {
        if (!Schema::hasTable('sms_settings')) {
            try {
                Schema::create('sms_settings', function (Blueprint $table) {
                    $table->id();
                    $table->string('provider')->default('greenweb');
                    $table->text('api_token')->nullable();
                    $table->string('sender_id')->nullable();
                    $table->boolean('sms_enabled')->default(false);
                    $table->boolean('otp_enabled')->default(false);
                    $table->integer('otp_expiration_minutes')->default(5);
                    $table->integer('otp_resend_cooldown_seconds')->default(60);
                    $table->timestamps();
                });
            } catch (\Throwable $e) {}
        }
    }

    public static function current(): self
    {
        static::ensureTableExists();

        return static::firstOrCreate(
            ['provider' => 'greenweb'],
            [
                'sms_enabled' => false,
                'otp_enabled' => false,
                'otp_expiration_minutes' => 5,
                'otp_resend_cooldown_seconds' => 60,
            ]
        );
    }

    public function getMaskedTokenAttribute(): string
    {
        if (empty($this->api_token)) {
            return '';
        }

        $token = (string) $this->api_token;
        $length = strlen($token);
        if ($length <= 8) {
            return '********';
        }

        return substr($token, 0, 4) . str_repeat('*', max(4, $length - 8)) . substr($token, -4);
    }
}
