<?php

namespace App\Services;

use App\Models\SmsLog;
use App\Models\SmsSetting;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GreenWebSmsService
{
    protected ?string $token;
    protected bool $enabled;

    public function __construct()
    {
        $settings = SmsSetting::current();
        $this->token = !empty($settings->api_token) ? trim((string) $settings->api_token) : null;
        $this->enabled = (bool) $settings->sms_enabled;
    }

    public function isConfigured(): bool
    {
        return !empty($this->token);
    }

    public function isEnabled(): bool
    {
        return $this->enabled && $this->isConfigured();
    }

    /**
     * Send SMS to a Bangladeshi mobile number.
     *
     * @return array [success => bool, status => string, message => string]
     */
    public function sendSms(string $phone, string $message, string $type = 'transactional', ?int $campaignId = null, bool $forceLive = false): array
    {
        $normalizedPhone = User::normalizePhone($phone);
        if (! $normalizedPhone || ! User::isValidPhoneNumber($normalizedPhone)) {
            return [
                'success' => false,
                'status' => 'invalid_number',
                'message' => 'Invalid Bangladeshi phone number.',
            ];
        }

        // GreenWeb standard recipient format: 8801XXXXXXXXX or 01XXXXXXXXX
        $recipient = ltrim($normalizedPhone, '+');

        $isTestMode = $forceLive || in_array($type, ['test', 'test_auto_push', 'test_sms'], true);

        if (! $this->isConfigured()) {
            return [
                'success' => false,
                'status' => 'not_configured',
                'message' => 'GreenWeb SMS token is not configured. Please set your API token in SMS Settings.',
            ];
        }

        if (! $this->isEnabled() && ! $isTestMode) {
            SmsLog::create([
                'campaign_id' => $campaignId,
                'phone' => $normalizedPhone,
                'message' => $message,
                'status' => 'disabled',
                'type' => $type,
                'response_payload' => json_encode(['note' => 'SMS gateway is disabled in settings']),
                'created_at' => now(),
            ]);

            return [
                'success' => false,
                'status' => 'disabled',
                'message' => 'SMS gateway is currently disabled. Please toggle SMS Enabled ON in SMS Settings.',
            ];
        }

        try {
            $postData = [
                'token' => trim((string) $this->token),
                'to' => $recipient,
                'message' => $message,
            ];

            // Attempt via HTTPS first without verifying local CA certs (fixes shared hosting curl 60 errors)
            try {
                $response = Http::timeout(15)
                    ->withoutVerifying()
                    ->withHeaders([
                        'User-Agent' => 'DoctorWallah-LMS/1.0',
                        'Accept' => '*/*',
                    ])
                    ->asForm()
                    ->post('https://api.greenweb.com.bd/api.php', $postData);
            } catch (\Throwable $httpsEx) {
                // Fallback to HTTP if HTTPS connection is blocked on host
                $response = Http::timeout(15)
                    ->asForm()
                    ->post('http://api.greenweb.com.bd/api.php', $postData);
            }

            $responseBody = trim($response->body());
            $isSuccess = $response->successful()
                && ! str_starts_with(strtolower($responseBody), 'error')
                && ! str_contains(strtolower($responseBody), 'error:');

            SmsLog::create([
                'campaign_id' => $campaignId,
                'phone' => $normalizedPhone,
                'message' => $message,
                'status' => $isSuccess ? 'sent' : 'failed',
                'type' => $type,
                'response_payload' => substr($responseBody, 0, 500),
                'created_at' => now(),
            ]);

            return [
                'success' => $isSuccess,
                'status' => $isSuccess ? 'sent' : 'failed',
                'message' => $responseBody ?: ($isSuccess ? 'SMS sent successfully.' : 'No response from SMS gateway.'),
            ];
        } catch (\Throwable $e) {
            Log::error('GreenWeb SMS Error: ' . $e->getMessage());

            SmsLog::create([
                'campaign_id' => $campaignId,
                'phone' => $normalizedPhone,
                'message' => $message,
                'status' => 'failed',
                'type' => $type,
                'response_payload' => json_encode(['error' => $e->getMessage()]),
                'created_at' => now(),
            ]);

            return [
                'success' => false,
                'status' => 'error',
                'message' => 'Failed to reach SMS provider: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Check account balance from GreenWeb.
     */
    public function checkBalance(): array
    {
        if (! $this->isConfigured()) {
            return [
                'success' => false,
                'message' => 'GreenWeb API token is not configured in SMS Settings.',
                'balance' => null,
                'raw_response' => null,
            ];
        }

        try {
            $token = trim((string) $this->token);
            $response = null;

            // 1. Try with &balance&json via HTTPS
            try {
                $response = Http::timeout(10)
                    ->withoutVerifying()
                    ->get('https://api.greenweb.com.bd/g_api.php', [
                        'token' => $token,
                        'balance' => 'true',
                        'json' => '',
                    ]);
            } catch (\Throwable $e) {
                // Fallback to HTTP
                try {
                    $response = Http::timeout(10)->get('http://api.greenweb.com.bd/g_api.php', [
                        'token' => $token,
                        'balance' => 'true',
                        'json' => '',
                    ]);
                } catch (\Throwable $e2) {
                    $response = Http::timeout(10)->get('https://api.greenweb.com.bd/g_api.php', [
                        'token' => $token,
                        'balance' => 'true',
                    ]);
                }
            }

            if (! $response || ! $response->successful()) {
                return [
                    'success' => false,
                    'message' => $response ? 'GreenWeb responded with HTTP ' . $response->status() : 'Connection failed',
                    'balance' => null,
                    'raw_response' => $response ? $response->body() : null,
                ];
            }

            $body = trim($response->body());
            $parsedBalance = null;

            // Attempt JSON decode
            $jsonData = json_decode($body, true);
            if (is_array($jsonData)) {
                if (isset($jsonData[0]['balance'])) {
                    $parsedBalance = $jsonData[0]['balance'];
                } elseif (isset($jsonData['balance'])) {
                    $parsedBalance = $jsonData['balance'];
                }
            }

            // If not found in JSON, parse string (e.g. "1250" or "Balance: 1250")
            if ($parsedBalance === null) {
                if (is_numeric($body)) {
                    $parsedBalance = (float) $body;
                } elseif (preg_match('/(\d+(?:\.\d+)?)/', $body, $matches)) {
                    $parsedBalance = $matches[1];
                } else {
                    $parsedBalance = $body;
                }
            }

            return [
                'success' => true,
                'message' => 'Balance fetched successfully.',
                'balance' => $parsedBalance,
                'raw_response' => $body,
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'message' => $e->getMessage(),
                'balance' => null,
                'raw_response' => null,
            ];
        }
    }
}
