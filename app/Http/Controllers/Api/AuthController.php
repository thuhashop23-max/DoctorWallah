<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OtpVerification;
use App\Models\SmsSetting;
use App\Models\User;
use App\Services\GreenWebSmsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    /**
     * Parse User-Agent into a clean human-readable device name
     */
    public static function parseDeviceName(?string $userAgent): string
    {
        if (empty($userAgent)) {
            return 'Unknown Device';
        }

        $platform = 'Device';
        if (preg_match('/windows nt 10/i', $userAgent)) {
            $platform = 'Windows 10/11';
        } elseif (preg_match('/windows nt/i', $userAgent)) {
            $platform = 'Windows';
        } elseif (preg_match('/iphone/i', $userAgent)) {
            $platform = 'iPhone';
        } elseif (preg_match('/ipad/i', $userAgent)) {
            $platform = 'iPad';
        } elseif (preg_match('/macintosh|mac os x/i', $userAgent)) {
            $platform = 'macOS';
        } elseif (preg_match('/android/i', $userAgent)) {
            $platform = 'Android';
        } elseif (preg_match('/linux/i', $userAgent)) {
            $platform = 'Linux';
        }

        $browser = 'Browser';
        if (preg_match('/edg/i', $userAgent)) {
            $browser = 'Edge';
        } elseif (preg_match('/chrome|crios/i', $userAgent)) {
            $browser = 'Chrome';
        } elseif (preg_match('/firefox|fxios/i', $userAgent)) {
            $browser = 'Firefox';
        } elseif (preg_match('/safari/i', $userAgent) && ! preg_match('/chrome/i', $userAgent)) {
            $browser = 'Safari';
        } elseif (preg_match('/opera|opr/i', $userAgent)) {
            $browser = 'Opera';
        }

        return "{$browser} on {$platform}";
    }

    /**
     * Issue an access token for user while strictly enforcing max 2 simultaneous devices
     */
    public static function issueDeviceToken(User $user, Request $request): string
    {
        try {
            if (! Schema::hasColumn('personal_access_tokens', 'ip_address')) {
                Artisan::call('migrate', ['--force' => true]);
            }
        } catch (\Throwable $e) {
        }

        // Enforce max 2 simultaneous active devices:
        // Retrieve existing active tokens ordered from newest to oldest
        $existingTokens = $user->tokens()
            ->orderByRaw('COALESCE(last_used_at, created_at) DESC')
            ->get();

        // If user already has 2 or more devices, revoke the oldest ones so that adding this new token keeps total <= 2
        if ($existingTokens->count() >= 2) {
            $tokensToDelete = $existingTokens->slice(1);
            foreach ($tokensToDelete as $oldToken) {
                $oldToken->delete();
            }
        }

        $deviceName = self::parseDeviceName($request->userAgent());
        $newAccessToken = $user->createToken($deviceName);
        $plainToken = $newAccessToken->plainTextToken;

        try {
            $tokenId = $newAccessToken->accessToken->id;
            DB::table('personal_access_tokens')->where('id', $tokenId)->update([
                'ip_address' => $request->ip(),
                'user_agent' => substr($request->userAgent() ?: '', 0, 500),
                'last_used_at' => now(),
            ]);
        } catch (\Throwable $e) {
        }

        return $plainToken;
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $loginInput = trim($validated['phone']);
        $normalizedPhone = User::normalizePhone($loginInput);

        $user = null;
        if ($normalizedPhone) {
            $user = User::where('phone', $normalizedPhone)->first();
        } elseif (filter_var($loginInput, FILTER_VALIDATE_EMAIL)) {
            $user = User::where('email', strtolower($loginInput))->first();
        } else {
            return response()->json([
                'message' => 'Please enter a valid mobile number or email.',
                'errors' => ['phone' => ['Please enter a valid mobile number or email.']],
            ], 422);
        }

        if (! $user) {
            return response()->json([
                'message' => 'Invalid mobile number or password.',
                'errors' => ['phone' => ['Invalid mobile number or password.']],
            ], 401);
        }

        $passwordMatches = false;
        if (str_starts_with($user->password, '$wp$') || str_starts_with($user->password, '$P$') || str_starts_with($user->password, '$H$')) {
            $wpHasher = new \App\Services\WordPressHasher();
            if ($wpHasher->checkPassword($validated['password'], $user->password)) {
                $passwordMatches = true;
                $user->password = Hash::make($validated['password']);
                $user->save();
            }
        } else {
            $passwordMatches = Hash::check($validated['password'], $user->password);
        }

        if (! $passwordMatches) {
            return response()->json([
                'message' => 'Invalid mobile number or password.',
                'errors' => ['phone' => ['Invalid mobile number or password.']],
            ], 401);
        }

        if ($user->status !== User::STATUS_ACTIVE) {
            return response()->json([
                'message' => 'Your account is deactivated. Please contact support.',
            ], 403);
        }

        $token = self::issueDeviceToken($user, $request);

        return response()->json([
            'message' => 'Logged in successfully.',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'phone' => $user->phone,
                'registration_number' => $user->registration_number,
                'email' => $user->email,
                'role' => $user->role,
                'custom_role_id' => $user->custom_role_id,
                'custom_role' => $user->customRole,
                'status' => $user->status,
                'points' => (int) ($user->points ?? 0),
            ],
        ]);
    }

    public function register(Request $request, GreenWebSmsService $smsService): JsonResponse
    {
        $normalizedPhone = User::normalizePhone($request->input('phone'));

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if (! $normalizedPhone || ! User::isValidPhoneNumber($normalizedPhone)) {
            return response()->json([
                'message' => 'Please provide a valid 11-digit Bangladeshi mobile number.',
                'errors' => ['phone' => ['Please provide a valid Bangladeshi mobile number.']],
            ], 422);
        }

        if (User::where('phone', $normalizedPhone)->exists()) {
            return response()->json([
                'message' => 'This mobile number is already registered.',
                'errors' => ['phone' => ['This mobile number is already in use.']],
            ], 422);
        }

        $smsSettings = SmsSetting::current();

        if ($smsSettings->otp_enabled) {
            $otpCode = (string) random_int(100000, 999999);
            $expiresAt = now()->addMinutes($smsSettings->otp_expiration_minutes ?: 5);

            OtpVerification::updateOrCreate(
                ['phone' => $normalizedPhone],
                [
                    'otp_hash' => Hash::make($otpCode),
                    'expires_at' => $expiresAt,
                    'attempts' => 0,
                    'verified_at' => null,
                    'payload' => [
                        'name' => $validated['name'],
                        'phone' => $normalizedPhone,
                        'email' => $validated['email'],
                        'password' => $validated['password'],
                        'role' => User::ROLE_STUDENT,
                    ],
                ]
            );

            $smsMessage = "Your NovoNex OTP code is: {$otpCode}. Valid for {$smsSettings->otp_expiration_minutes} minutes.";
            $smsService->sendSms($normalizedPhone, $smsMessage);

            return response()->json([
                'message' => 'A 6-digit OTP has been sent to your phone. Account will be activated upon verification.',
                'requires_otp' => true,
                'phone' => $normalizedPhone,
            ]);
        }

        $user = User::create([
            'name' => $validated['name'],
            'phone' => $normalizedPhone,
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => User::ROLE_STUDENT,
            'status' => User::STATUS_ACTIVE,
        ]);

        $token = self::issueDeviceToken($user, $request);

        return response()->json([
            'message' => 'Registration completed successfully.',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'phone' => $user->phone,
                'registration_number' => $user->registration_number,
                'email' => $user->email,
                'role' => $user->role,
                'status' => $user->status,
                'points' => (int) ($user->points ?? 0),
            ],
        ], 201);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        // Auto-promote student to teacher if assigned as instructor to any course
        if ($user->role === User::ROLE_STUDENT && $user->isTeacher()) {
            $user->update(['role' => User::ROLE_TEACHER]);
            \App\Models\TeacherProfile::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'designation' => 'Instructor',
                    'institution' => 'NovoNex Faculty',
                    'is_featured' => true,
                ]
            );
            $user->refresh();
        }

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'phone' => $user->phone,
                'registration_number' => $user->registration_number,
                'email' => $user->email,
                'role' => $user->role,
                'is_teacher' => $user->isTeacher(),
                'custom_role_id' => $user->custom_role_id,
                'custom_role' => $user->customRole,
                'status' => $user->status,
                'points' => (int) ($user->points ?? 0),
                'enrolled_courses_count' => $user->enrolledCourses()->count(),
                'unread_notifications_count' => $user->unreadNotifications()->count(),
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    /**
     * FORGOT PASSWORD: Send OTP
     */
    public function forgotPasswordSendOtp(Request $request, GreenWebSmsService $smsService): JsonResponse
    {
        $validated = $request->validate([
            'phone' => ['required', 'string'],
        ]);

        $normalizedPhone = User::normalizePhone($validated['phone']);

        if (! $normalizedPhone) {
            return response()->json([
                'message' => 'Please provide a valid Bangladeshi mobile number.',
            ], 422);
        }

        $user = User::where('phone', $normalizedPhone)->first();

        if (! $user) {
            return response()->json([
                'message' => 'No account found registered with this mobile number.',
            ], 404);
        }

        $lastOtp = OtpVerification::where('phone', $normalizedPhone)->latest()->first();
        if ($lastOtp && $lastOtp->created_at->addSeconds(60)->isFuture()) {
            $secondsRemaining = now()->diffInSeconds($lastOtp->created_at->addSeconds(60));
            return response()->json([
                'message' => "Please wait {$secondsRemaining} seconds before requesting a new OTP.",
                'seconds_remaining' => $secondsRemaining,
            ], 429);
        }

        $otpCode = (string) random_int(100000, 999999);
        $expiresAt = now()->addMinutes(10);

        OtpVerification::create([
            'phone' => $normalizedPhone,
            'otp_hash' => Hash::make($otpCode),
            'expires_at' => $expiresAt,
            'attempts' => 0,
            'verified_at' => null,
            'payload' => [
                'action' => 'password_reset',
                'user_id' => $user->id,
            ],
        ]);

        $smsMessage = "Your NovoNex password reset OTP is: {$otpCode}. Valid for 10 minutes.";
        $smsService->sendSms($normalizedPhone, $smsMessage);

        return response()->json([
            'message' => 'A 6-digit OTP code has been sent to your mobile number.',
            'phone' => $normalizedPhone,
        ]);
    }

    /**
     * FORGOT PASSWORD: Verify OTP
     */
    public function forgotPasswordVerifyOtp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => ['required', 'string'],
            'otp' => ['required', 'string', 'size:6'],
        ]);

        $normalizedPhone = User::normalizePhone($validated['phone']);

        $verification = OtpVerification::where('phone', $normalizedPhone)
            ->whereNull('verified_at')
            ->latest()
            ->first();

        if (! $verification) {
            return response()->json([
                'message' => 'No OTP request found. Please request a new OTP.',
            ], 404);
        }

        if ($verification->expires_at->isPast()) {
            return response()->json([
                'message' => 'OTP code has expired. Please request a new OTP.',
            ], 422);
        }

        if ($verification->attempts >= 5) {
            return response()->json([
                'message' => 'Maximum attempt limit exceeded. Please request a new OTP.',
            ], 429);
        }

        if (! Hash::check($validated['otp'], $verification->otp_hash)) {
            $verification->increment('attempts');
            return response()->json([
                'message' => 'Incorrect OTP code. Please enter the valid code.',
                'remaining_attempts' => max(0, 5 - $verification->attempts),
            ], 422);
        }

        $verification->update(['verified_at' => now()]);

        return response()->json([
            'message' => 'OTP verified successfully. Now set your new password.',
            'verified' => true,
        ]);
    }

    /**
     * FORGOT PASSWORD: Reset password and auto-login
     */
    public function forgotPasswordReset(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => ['required', 'string'],
            'otp' => ['required', 'string', 'size:6'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $normalizedPhone = User::normalizePhone($validated['phone']);

        // Check verification was marked within last 15 minutes
        $verification = OtpVerification::where('phone', $normalizedPhone)
            ->whereNotNull('verified_at')
            ->where('verified_at', '>=', now()->subMinutes(15))
            ->latest()
            ->first();

        if (! $verification) {
            return response()->json([
                'message' => 'Verification session expired. Please restart with a new OTP.',
            ], 422);
        }

        $user = User::where('phone', $normalizedPhone)->firstOrFail();
        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        // Auto login user
        $token = self::issueDeviceToken($user, $request);

        return response()->json([
            'message' => 'Password reset successfully. Welcome back!',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'phone' => $user->phone,
                'registration_number' => $user->registration_number,
                'email' => $user->email,
                'role' => $user->role,
                'status' => $user->status,
            ],
        ]);
    }

    /**
     * DEVICE MANAGEMENT: List active devices for authenticated user
     */
    public function getDevices(Request $request): JsonResponse
    {
        $user = $request->user();
        $currentTokenId = $user->currentAccessToken()?->id;

        $tokens = $user->tokens()
            ->orderByRaw('COALESCE(last_used_at, created_at) DESC')
            ->get();

        $devices = $tokens->map(function ($token) use ($currentTokenId) {
            return [
                'id' => $token->id,
                'name' => $token->name ?: 'Unknown Device',
                'ip_address' => $token->ip_address,
                'user_agent' => $token->user_agent,
                'is_current' => $token->id === $currentTokenId,
                'last_used_at' => $token->last_used_at ? $token->last_used_at->toIso8601String() : $token->created_at->toIso8601String(),
                'created_at' => $token->created_at ? $token->created_at->toIso8601String() : null,
            ];
        });

        return response()->json([
            'devices' => $devices,
            'max_allowed' => 2,
            'active_count' => $devices->count(),
        ]);
    }

    /**
     * DEVICE MANAGEMENT: Revoke a specific device session
     */
    public function revokeDevice(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $token = $user->tokens()->where('id', $id)->first();

        if ($token) {
            $token->delete();
        }

        return response()->json([
            'message' => 'Device logged out successfully.',
        ]);
    }

    /**
     * DEVICE MANAGEMENT: Logout from all other devices
     */
    public function logoutOtherDevices(Request $request): JsonResponse
    {
        $user = $request->user();
        $currentTokenId = $user->currentAccessToken()?->id;

        $user->tokens()->where('id', '!=', $currentTokenId)->delete();

        return response()->json([
            'message' => 'Logged out from all other devices successfully.',
        ]);
    }

    /**
     * USER PROFILE: Update profile details
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
        ]);

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
        ]);

        return response()->json([
            'message' => 'Profile information updated successfully.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'phone' => $user->phone,
                'registration_number' => $user->registration_number,
                'email' => $user->email,
                'role' => $user->role,
                'status' => $user->status,
            ],
        ]);
    }

    /**
     * USER PROFILE: Change password
     */
    public function changePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if (! Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'message' => 'Current password is incorrect.',
                'errors' => ['current_password' => ['Current password is incorrect.']],
            ], 422);
        }

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        return response()->json([
            'message' => 'Password changed successfully.',
        ]);
    }
}
