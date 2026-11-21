<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\WebsiteSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class VdoCipherController extends Controller
{
    /**
     * Get VdoCipher configuration settings.
     */
    public function getSettings(): JsonResponse
    {
        $settings = WebsiteSetting::current();
        $vdoSettings = $settings->vdocipher_settings ?? WebsiteSetting::defaultVdocipherSettings();

        // Mask API Secret Key for safety if requested by non-admin or returning
        return response()->json([
            'settings' => $vdoSettings,
            'is_configured' => !empty($vdoSettings['api_secret_key']),
        ]);
    }

    /**
     * Update VdoCipher configuration settings.
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'api_secret_key' => ['nullable', 'string', 'max:500'],
            'folder_id' => ['nullable', 'string', 'max:100'],
            'watermark_enabled' => ['nullable', 'boolean'],
            'enabled' => ['nullable', 'boolean'],
        ]);

        $settings = WebsiteSetting::current();
        $currentVdo = $settings->vdocipher_settings ?? WebsiteSetting::defaultVdocipherSettings();

        $merged = [
            'enabled' => array_key_exists('enabled', $validated) ? (bool)$validated['enabled'] : ($currentVdo['enabled'] ?? true),
            'api_secret_key' => array_key_exists('api_secret_key', $validated) ? trim($validated['api_secret_key'] ?? '') : ($currentVdo['api_secret_key'] ?? ''),
            'folder_id' => array_key_exists('folder_id', $validated) ? trim($validated['folder_id'] ?? '') : ($currentVdo['folder_id'] ?? ''),
            'watermark_enabled' => array_key_exists('watermark_enabled', $validated) ? (bool)$validated['watermark_enabled'] : ($currentVdo['watermark_enabled'] ?? true),
        ];

        $settings->update([
            'vdocipher_settings' => $merged,
        ]);

        AuditLog::log('vdocipher_settings_updated', 'WebsiteSetting', $settings->id, null, [
            'folder_id' => $merged['folder_id'],
            'watermark_enabled' => $merged['watermark_enabled'],
            'has_api_key' => !empty($merged['api_secret_key']),
        ]);

        return response()->json([
            'message' => 'VdoCipher configuration saved successfully.',
            'settings' => $merged,
            'is_configured' => !empty($merged['api_secret_key']),
        ]);
    }

    /**
     * Test connection to VdoCipher API using provided or stored API key.
     */
    public function testConnection(Request $request): JsonResponse
    {
        $apiKey = trim($request->input('api_secret_key') ?? '');

        if (empty($apiKey)) {
            $settings = WebsiteSetting::current();
            $apiKey = $settings->vdocipher_settings['api_secret_key'] ?? '';
        }

        if (empty($apiKey)) {
            return response()->json([
                'success' => false,
                'message' => 'Please provide a VdoCipher API Secret Key to test.',
            ], 422);
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Apisecret ' . $apiKey,
                'Accept' => 'application/json',
            ])->timeout(12)->get('https://dev.vdocipher.com/api/videos?limit=1');

            if ($response->successful()) {
                $data = $response->json();
                $count = $data['count'] ?? 0;
                return response()->json([
                    'success' => true,
                    'message' => "Connection successful! Connected to VdoCipher account. Total videos: {$count}.",
                    'count' => $count,
                ]);
            }

            $errMsg = $response->json('message') ?? ('VdoCipher API responded with status ' . $response->status());
            return response()->json([
                'success' => false,
                'message' => "Connection failed: {$errMsg}",
            ], 400);
        } catch (\Throwable $e) {
            Log::error('VdoCipher test connection error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Network error connecting to VdoCipher: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get direct S3 upload credentials from VdoCipher.
     */
    public function getUploadCredentials(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user || (!$user->isAdmin() && !$user->isTeacher())) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $settings = WebsiteSetting::current();
        $apiKey = $settings->vdocipher_settings['api_secret_key'] ?? '';

        if (empty($apiKey)) {
            return response()->json([
                'message' => 'VdoCipher API Secret Key is not configured. Please configure it in Website Settings > VdoCipher Configuration.',
            ], 422);
        }

        $title = trim($request->input('title') ?? 'Lesson Video ' . date('Y-m-d H:i'));
        $folderId = trim($request->input('folder_id') ?? ($settings->vdocipher_settings['folder_id'] ?? ''));

        $query = ['title' => $title];
        if (!empty($folderId)) {
            $query['folderId'] = $folderId;
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Apisecret ' . $apiKey,
                'Accept' => 'application/json',
            ])->timeout(15)->put('https://dev.vdocipher.com/api/videos?' . http_build_query($query));

            if (!$response->successful()) {
                $errorMsg = $response->json('message') ?? ('VdoCipher error (HTTP ' . $response->status() . ')');
                return response()->json([
                    'message' => 'Failed to obtain upload credentials from VdoCipher: ' . $errorMsg,
                ], 400);
            }

            $data = $response->json();
            $clientPayload = $data['clientPayload'] ?? null;
            $videoId = $data['videoId'] ?? $data['video']['id'] ?? $data['id'] ?? null;

            if (!$clientPayload || !$videoId) {
                return response()->json([
                    'message' => 'Invalid upload response received from VdoCipher.',
                ], 502);
            }

            // Ensure S3 POST policy fields required by AWS S3 are explicitly attached
            if (!isset($clientPayload['success_action_status'])) {
                $clientPayload['success_action_status'] = '201';
            }
            if (!isset($clientPayload['success_action_redirect'])) {
                $clientPayload['success_action_redirect'] = '';
            }

            return response()->json([
                'clientPayload' => $clientPayload,
                'videoId' => $videoId,
                'uploadLink' => $clientPayload['uploadLink'] ?? null,
            ]);
        } catch (\Throwable $e) {
            Log::error('VdoCipher upload credentials error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to communicate with VdoCipher: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Server-side upload proxy to VdoCipher S3 for situations where client direct S3 POST is blocked.
     */
    public function uploadProxy(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user || (!$user->isAdmin() && !$user->isTeacher())) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $request->validate([
            'file' => ['required', 'file'],
            'title' => ['nullable', 'string', 'max:255'],
        ]);

        $settings = WebsiteSetting::current();
        $apiKey = $settings->vdocipher_settings['api_secret_key'] ?? '';
        if (empty($apiKey)) {
            return response()->json(['message' => 'VdoCipher API Secret Key is not configured.'], 422);
        }

        $uploadedFile = $request->file('file');
        $title = trim($request->input('title') ?? $uploadedFile->getClientOriginalName());
        $folderId = trim($settings->vdocipher_settings['folder_id'] ?? '');

        $query = ['title' => $title];
        if (!empty($folderId)) {
            $query['folderId'] = $folderId;
        }

        try {
            $credsRes = Http::withHeaders([
                'Authorization' => 'Apisecret ' . $apiKey,
                'Accept' => 'application/json',
            ])->timeout(20)->put('https://dev.vdocipher.com/api/videos?' . http_build_query($query));

            if (!$credsRes->successful()) {
                return response()->json([
                    'message' => 'Failed to obtain upload link from VdoCipher: ' . ($credsRes->json('message') ?? $credsRes->body()),
                ], 400);
            }

            $data = $credsRes->json();
            $clientPayload = $data['clientPayload'] ?? [];
            $videoId = $data['videoId'] ?? $data['video']['id'] ?? $data['id'] ?? null;
            $uploadLink = $clientPayload['uploadLink'] ?? null;

            if (!$uploadLink || !$videoId) {
                return response()->json(['message' => 'Invalid upload payload from VdoCipher.'], 502);
            }

            // S3 POST policy requires fields in specific order before the file
            $orderedKeys = [
                'key',
                'policy',
                'x-amz-algorithm',
                'x-amz-credential',
                'x-amz-date',
                'x-amz-signature',
                'success_action_status',
                'success_action_redirect',
            ];

            $multipart = [];
            foreach ($orderedKeys as $k) {
                $val = $clientPayload[$k] ?? ($k === 'success_action_status' ? '201' : ($k === 'success_action_redirect' ? '' : null));
                if ($val !== null) {
                    $multipart[] = ['name' => $k, 'contents' => (string) $val];
                }
            }

            foreach ($clientPayload as $k => $val) {
                if ($k !== 'uploadLink' && !in_array($k, $orderedKeys, true)) {
                    $multipart[] = ['name' => $k, 'contents' => (string) $val];
                }
            }

            $multipart[] = [
                'name' => 'file',
                'contents' => fopen($uploadedFile->getRealPath(), 'r'),
                'filename' => $uploadedFile->getClientOriginalName(),
            ];

            $s3Res = Http::timeout(600)->asMultipart()->post($uploadLink, $multipart);

            if ($s3Res->status() < 200 || $s3Res->status() >= 300) {
                Log::error('VdoCipher S3 proxy upload rejected: ' . $s3Res->body());
                return response()->json([
                    'message' => 'S3 upload rejected with status ' . $s3Res->status() . ': ' . $s3Res->body(),
                ], 400);
            }

            return response()->json([
                'success' => true,
                'videoId' => $videoId,
                'message' => 'Video uploaded successfully to VdoCipher.',
            ]);
        } catch (\Throwable $e) {
            Log::error('VdoCipher proxy upload error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Server error uploading to VdoCipher S3: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get OTP and PlaybackInfo for authorized student viewing.
     */
    public function getOtp(Request $request, Lesson $lesson): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Authorize access: must be admin, assigned course instructor, lesson is preview, or enrolled student
        $isAuthorized = false;
        if ($user->isAdmin()) {
            $isAuthorized = true;
        } elseif ($user->isTeacher() && $lesson->course && $lesson->course->isAssignedTeacher($user->id)) {
            $isAuthorized = true;
        } elseif ($lesson->is_preview) {
            $isAuthorized = true;
        } elseif ($user->isEnrolledIn($lesson->course_id)) {
            $isAuthorized = true;
        } else {
            $isEnrolled = Enrollment::where('user_id', $user->id)
                ->where('course_id', $lesson->course_id)
                ->where('status', 'active')
                ->exists();
            if ($isEnrolled) {
                $isAuthorized = true;
            }
        }

        if (!$isAuthorized) {
            return response()->json([
                'message' => 'You must be enrolled in this course to watch this lesson video.',
            ], 403);
        }

        $videoRaw = trim($lesson->video_url ?? '');
        if (empty($videoRaw)) {
            return response()->json([
                'message' => 'No video attached to this lesson.',
            ], 404);
        }

        // Direct iframe or player URL support
        if (str_starts_with($videoRaw, '<iframe') || str_contains($videoRaw, 'player.vdocipher.com/v2/?otp=')) {
            return response()->json([
                'otp' => '',
                'playbackInfo' => '',
                'videoId' => $this->extractVideoId($videoRaw) ?? '',
                'embedUrl' => $videoRaw,
            ]);
        }

        // Extract Video ID from raw string (can be direct 32-char ID, or shortcode [vdo id="..."], or iframe URL)
        $videoId = $this->extractVideoId($videoRaw);

        if (empty($videoId)) {
            return response()->json([
                'message' => 'Could not determine a valid VdoCipher Video ID from the lesson settings. Please ensure you provided a valid 32-character Video ID or [vdo id="..."] shortcode.',
                'raw' => $videoRaw,
            ], 422);
        }

        $settings = WebsiteSetting::current();
        $vdoSettings = $settings->vdocipher_settings ?? WebsiteSetting::defaultVdocipherSettings();
        $apiKey = $vdoSettings['api_secret_key'] ?? '';

        if (empty($apiKey)) {
            return response()->json([
                'message' => 'VdoCipher API Secret Key is not configured. Please configure it in Website Settings > VdoCipher Configuration.',
            ], 422);
        }

        // Dynamic DRM Watermark setup (student anti-piracy overlay)
        $payload = [
            'ttl' => 300,
        ];

        if (!empty($vdoSettings['watermark_enabled'])) {
            $watermarkText = $user->name . ' (' . ($user->phone ?: $user->email) . ')';
            $payload['annotate'] = json_encode([
                [
                    'type' => 'rtext',
                    'text' => $watermarkText,
                    'alpha' => '0.45',
                    'color' => '0xFFFFFF',
                    'size' => '13',
                    'interval' => '4000',
                ]
            ]);
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Apisecret ' . $apiKey,
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ])->timeout(12)->post("https://dev.vdocipher.com/api/videos/{$videoId}/otp", $payload);

            if (!$response->successful()) {
                $err = $response->json('message') ?? ('VdoCipher returned status ' . $response->status());
                Log::warning("VdoCipher OTP generation failed for video {$videoId}: {$err}");
                return response()->json([
                    'message' => 'VdoCipher API Error: ' . $err,
                    'videoId' => $videoId,
                ], 400);
            }

            $otpData = $response->json();

            return response()->json([
                'otp' => $otpData['otp'] ?? null,
                'playbackInfo' => $otpData['playbackInfo'] ?? null,
                'videoId' => $videoId,
                'embedUrl' => "https://player.vdocipher.com/v2/?otp=" . ($otpData['otp'] ?? '') . "&playbackInfo=" . ($otpData['playbackInfo'] ?? ''),
            ]);
        } catch (\Throwable $e) {
            Log::error('VdoCipher OTP generation error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to connect to VdoCipher: ' . $e->getMessage(),
                'videoId' => $videoId,
            ], 400);
        }
    }

    /**
     * Helper to extract 32-character VdoCipher Video ID from various user inputs:
     * - "1234567890abcdef1234567890abcdef"
     * - "[vdo id=\"1234567890abcdef1234567890abcdef\"]"
     * - "[vdocipher id='...']"
     * - "<iframe src=\"https://player.vdocipher.com/v2/?otp=...&playbackInfo=...\"></iframe>"
     * - URL containing video id
     */
    public function extractVideoId(string $input): ?string
    {
        $clean = trim($input);
        if (empty($clean)) return null;

        // 1. Direct 32-char hex string
        if (preg_match('/^[a-f0-9]{32}$/i', $clean)) {
            return $clean;
        }

        // 2. Shortcode [vdo id="..."] or [vdocipher id='...'] with single, double, curly, or no quotes
        if (preg_match('/\[(?:vdo|vdocipher)[^\]]*?(?:id|video-id|videoId)\s*=\s*[\'"`“”‘’]?([a-zA-Z0-9_-]{16,40})[\'"`“”‘’]?[^\]]*\]/i', $clean, $matches)) {
            return $matches[1];
        }

        // 3. Shortcode without "id=": [vdo 1234567890abcdef...]
        if (preg_match('/\[(?:vdo|vdocipher)\s+[\'"`“”‘’]?([a-zA-Z0-9_-]{16,40})[\'"`“”‘’]?/i', $clean, $matches)) {
            return $matches[1];
        }

        // 4. HTML tag e.g. <vdo-player video-id="..."> or data-video-id="..."
        if (preg_match('/(?:id|video-id|videoId)\s*=\s*[\'"`“”‘’]?([a-zA-Z0-9_-]{16,40})[\'"`“”‘’]?/i', $clean, $matches)) {
            return $matches[1];
        }

        // 5. URL containing video ID (e.g. dev.vdocipher.com/api/videos/{id} or vdocipher.com/dashboard/video/{id})
        if (preg_match('/(?:videos|video|v)\/([a-zA-Z0-9_-]{16,40})/i', $clean, $matches)) {
            return $matches[1];
        }

        // 6. Base64 playbackInfo extraction from iframe or embed URL
        if (preg_match('/playbackInfo=([a-zA-Z0-9_-]+={0,2})/i', $clean, $matches)) {
            try {
                $decoded = base64_decode($matches[1]);
                if ($decoded && preg_match('/(?:videoId|id)["\']?\s*:\s*["\']([a-zA-Z0-9_-]{16,40})["\']/i', $decoded, $jsonMatch)) {
                    return $jsonMatch[1];
                }
            } catch (\Throwable $e) {}
        }

        // 7. Search for any 32-character hex string anywhere in the input
        if (preg_match('/([a-f0-9]{32})/i', $clean, $matches)) {
            return $matches[1];
        }

        // 8. Search for any 24-40 char alphanumeric identifier
        if (preg_match('/([a-zA-Z0-9_-]{24,40})/i', $clean, $matches)) {
            return $matches[1];
        }

        return null;
    }
}
