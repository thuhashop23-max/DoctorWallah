<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Course;
use App\Models\TeacherProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminUserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::query();

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = trim($request->search);
            $digits = preg_replace('/\D+/', '', $search);
            $query->where(function ($q) use ($search, $digits) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");

                if (! empty($digits)) {
                    $q->orWhere('phone', 'like', "%{$digits}%");
                }
            });
        }

        $users = $query->with(['teacherProfile', 'customRole'])
            ->withCount(['enrollments', 'instructedCourses'])
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return response()->json($users);
    }

    public function show(User $user): JsonResponse
    {
        return response()->json([
            'user' => $user->load([
                'enrolledCourses' => function ($query) {
                    $query->select('courses.id', 'courses.title', 'courses.slug', 'courses.price', 'courses.sale_price', 'courses.thumbnail', 'courses.status')
                          ->withPivot(['id', 'status', 'enrolled_at', 'expires_at'])
                          ->latest('enrollments.created_at');
                },
                'instructedCourses' => function ($query) {
                    $query->select('courses.id', 'courses.title', 'courses.slug', 'courses.price', 'courses.status', 'courses.thumbnail');
                },
                'orders' => function ($query) {
                    $query->select('id', 'user_id', 'course_id', 'order_number', 'final_amount', 'payment_status', 'order_status', 'payment_method', 'created_at')
                          ->with('course:id,title,thumbnail')
                          ->latest();
                },
                'examSubmissions' => function ($query) {
                    $query->select('id', 'exam_id', 'user_id', 'total_marks', 'obtained_marks', 'total_questions', 'total_answered', 'total_correct', 'total_wrong', 'status', 'submitted_at')
                          ->with('exam:id,title')
                          ->latest();
                },
                'affiliateProfile',
                'teacherProfile',
            ])->loadCount(['enrollments', 'orders', 'examSubmissions', 'instructedCourses']),
        ]);
    }

    public function changeRole(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'role' => ['required', 'string'],
            'custom_role_id' => ['nullable'],
        ]);

        $newRole = $validated['role'];
        $oldRole = $user->role;
        $customRoleId = $request->input('custom_role_id');

        // If custom role is selected
        if ($newRole === 'custom' || (! empty($customRoleId) && $newRole !== 'admin' && $newRole !== 'teacher' && $newRole !== 'student')) {
            $user->update([
                'role' => 'custom',
                'custom_role_id' => $customRoleId,
            ]);
            $roleObj = \App\Models\Role::find($customRoleId);
            $roleTitle = $roleObj ? $roleObj->name : 'Custom Role';
            AuditLog::log('user_role_changed', 'User', $user->id, ['role' => $oldRole], ['role' => 'custom', 'custom_role_id' => $customRoleId]);
            return response()->json([
                'message' => "User role updated to '{$roleTitle}' successfully.",
                'user' => $user->fresh(['teacherProfile', 'customRole']),
            ]);
        }

        if ($oldRole === $newRole && ! $customRoleId) {
            return response()->json(['message' => 'Role remains unchanged.']);
        }

        // Prevent demoting the last active admin
        if ($oldRole === User::ROLE_ADMIN && $newRole !== User::ROLE_ADMIN) {
            $activeAdminCount = User::where('role', User::ROLE_ADMIN)
                ->where('status', User::STATUS_ACTIVE)
                ->where('id', '!=', $user->id)
                ->count();

            if ($activeAdminCount === 0) {
                return response()->json([
                    'message' => 'At least one active admin is required. This admin cannot be demoted.',
                ], 422);
            }
        }

        $user->update([
            'role' => $newRole,
            'custom_role_id' => null,
        ]);

        if ($newRole === User::ROLE_TEACHER) {
            TeacherProfile::firstOrCreate(['user_id' => $user->id]);
        }

        AuditLog::log('user_role_changed', 'User', $user->id, ['role' => $oldRole], ['role' => $newRole]);

        return response()->json([
            'message' => "User role updated to {$newRole} successfully.",
            'user' => $user->fresh(['teacherProfile', 'customRole']),
        ]);
    }

    public function toggleStatus(User $user): JsonResponse
    {
        $newStatus = $user->status === User::STATUS_ACTIVE ? User::STATUS_INACTIVE : User::STATUS_ACTIVE;

        // Prevent deactivating the last active admin
        if ($user->isAdmin() && $newStatus === User::STATUS_INACTIVE) {
            $otherActiveAdmins = User::where('role', User::ROLE_ADMIN)
                ->where('status', User::STATUS_ACTIVE)
                ->where('id', '!=', $user->id)
                ->count();

            if ($otherActiveAdmins === 0) {
                return response()->json([
                    'message' => 'The only active admin account cannot be deactivated.',
                ], 422);
            }
        }

        $oldStatus = $user->status;
        $user->update(['status' => $newStatus]);

        AuditLog::log('user_status_changed', 'User', $user->id, ['status' => $oldStatus], ['status' => $newStatus]);

        return response()->json([
            'message' => 'User status updated successfully.',
            'user' => $user->fresh(),
        ]);
    }

    /**
     * Create a new user (Student, Teacher, or Admin)
     */
    public function store(Request $request): JsonResponse
    {
        $normalizedPhone = User::normalizePhone($request->input('phone'));

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'role' => ['required', 'string'],
            'custom_role_id' => ['nullable'],
            'status' => ['nullable', 'in:active,inactive'],
        ], [
            'name.required' => 'Full name is required.',
            'phone.required' => 'Phone number is required.',
            'email.required' => 'Email address is required.',
            'email.unique' => 'This email is already in use.',
            'password.required' => 'Password is required.',
            'password.min' => 'Password must be at least 6 characters.',
            'role.required' => 'User role is required.',
        ]);

        if (! $normalizedPhone || ! User::isValidPhoneNumber($normalizedPhone)) {
            return response()->json([
                'message' => 'Please provide a valid 11-digit Bangladeshi mobile number.',
                'errors' => ['phone' => ['Please provide a valid Bangladeshi mobile number.']],
            ], 422);
        }

        if (User::where('phone', $normalizedPhone)->exists()) {
            return response()->json([
                'message' => 'An account already exists with this mobile number.',
                'errors' => ['phone' => ['This mobile number is already in use.']],
            ], 422);
        }

        $user = User::create([
            'name' => trim($validated['name']),
            'phone' => $normalizedPhone,
            'email' => strtolower(trim($validated['email'])),
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'custom_role_id' => $validated['custom_role_id'] ?? null,
            'status' => $validated['status'] ?? User::STATUS_ACTIVE,
        ]);

        if ($user->role === User::ROLE_TEACHER) {
            TeacherProfile::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'designation' => $request->input('designation') ?: 'Instructor',
                    'institution' => $request->input('institution') ?: 'NovoNex Faculty',
                    'photo_url' => $request->input('photo_url'),
                    'bio' => $request->input('bio'),
                    'is_featured' => true,
                ]
            );
        }

        AuditLog::log('user_created_by_admin', 'User', $user->id, null, [
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role,
        ]);

        return response()->json([
            'message' => 'New user created successfully.',
            'user' => $user->load(['teacherProfile'])->loadCount(['enrollments', 'instructedCourses']),
        ], 201);
    }

    /**
     * Delete user account
     */
    public function destroy(Request $request, User $user): JsonResponse
    {
        // Prevent deleting self
        if ($request->user() && $request->user()->id === $user->id) {
            return response()->json([
                'message' => 'You cannot delete your own admin account.',
            ], 422);
        }

        // Prevent deleting the last active admin
        if ($user->isAdmin()) {
            $otherActiveAdmins = User::where('role', User::ROLE_ADMIN)
                ->where('status', User::STATUS_ACTIVE)
                ->where('id', '!=', $user->id)
                ->count();

            if ($otherActiveAdmins === 0) {
                return response()->json([
                    'message' => 'At least one active admin is required. This admin account cannot be deleted.',
                ], 422);
            }
        }

        $userId = $user->id;
        $userName = $user->name;
        $userRole = $user->role;

        DB::transaction(function () use ($user) {
            // Nullify legacy instructor foreign key if present
            Course::where('instructor_id', $user->id)->update(['instructor_id' => null]);

            // Detach course instructors many-to-many
            $user->instructedCourses()->detach();

            // Revoke tokens
            $user->tokens()->delete();

            // Delete the user record
            $user->delete();
        });

        AuditLog::log('user_deleted_by_admin', 'User', $userId, [
            'name' => $userName,
            'role' => $userRole,
        ], null);

        return response()->json([
            'message' => 'User account deleted successfully.',
        ]);
    }

    /**
     * Update user information, roles, and profile picture (Admin)
     */
    public function update(Request $request, User $user): JsonResponse
    {
        $normalizedPhone = $request->filled('phone')
            ? User::normalizePhone($request->input('phone'))
            : $user->phone;

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'phone' => ['required', 'string'],
            'registration_number' => ['nullable', 'string', 'max:50', 'unique:users,registration_number,' . $user->id],
            'role' => ['nullable', 'string'],
            'custom_role_id' => ['nullable'],
            'status' => ['nullable', 'in:active,inactive'],
            'password' => ['nullable', 'string', 'min:6'],
            'photo_url' => ['nullable', 'string'],
            'photo' => ['nullable', 'image', 'max:10240'],
            'avatar' => ['nullable', 'image', 'max:10240'],
            'designation' => ['nullable', 'string', 'max:255'],
            'institution' => ['nullable', 'string', 'max:255'],
            'bio' => ['nullable', 'string'],
        ], [
            'name.required' => 'Full name is required.',
            'email.required' => 'Email address is required.',
            'email.unique' => 'This email address is already in use by another user.',
            'phone.required' => 'Phone number is required.',
            'registration_number.unique' => 'This registration number is already in use.',
            'password.min' => 'Password must be at least 6 characters.',
        ]);

        if (! $normalizedPhone || ! User::isValidPhoneNumber($normalizedPhone)) {
            return response()->json([
                'message' => 'Please provide a valid 11-digit Bangladeshi mobile number.',
                'errors' => ['phone' => ['Please provide a valid Bangladeshi mobile number.']],
            ], 422);
        }

        $phoneExists = User::where('phone', $normalizedPhone)->where('id', '!=', $user->id)->exists();
        if ($phoneExists) {
            return response()->json([
                'message' => 'This mobile number is already in use by another account.',
                'errors' => ['phone' => ['This mobile number is already in use.']],
            ], 422);
        }

        $oldData = $user->only(['name', 'email', 'phone', 'role', 'status', 'photo_url']);

        $photoUrl = $user->photo_url;
        if ($request->has('photo_url')) {
            $photoUrl = $request->input('photo_url') ?: null;
        }

        // Handle uploaded image file if provided
        $imageFile = $request->file('photo') ?? $request->file('avatar');
        if ($imageFile && $imageFile->isValid()) {
            $path = $imageFile->store('avatars', 'public');
            $photoUrl = asset('storage/' . $path);

            try {
                $destPath = public_path('storage/' . $path);
                $destDir = dirname($destPath);
                if (! file_exists($destDir)) {
                    @mkdir($destDir, 0755, true);
                }
                @copy(storage_path('app/public/' . $path), $destPath);
            } catch (\Throwable $e) {}
        }

        $updateData = [
            'name' => trim($validated['name']),
            'email' => strtolower(trim($validated['email'])),
            'phone' => $normalizedPhone,
            'photo_url' => $photoUrl,
        ];

        if ($request->has('registration_number')) {
            $updateData['registration_number'] = $request->input('registration_number') ? trim($request->input('registration_number')) : null;
        }

        if ($request->filled('status')) {
            $newStatus = $request->input('status');
            if ($user->isAdmin() && $newStatus === User::STATUS_INACTIVE) {
                $otherActiveAdmins = User::where('role', User::ROLE_ADMIN)
                    ->where('status', User::STATUS_ACTIVE)
                    ->where('id', '!=', $user->id)
                    ->count();

                if ($otherActiveAdmins === 0) {
                    return response()->json([
                        'message' => 'The only active admin account cannot be deactivated.',
                    ], 422);
                }
            }
            $updateData['status'] = $newStatus;
        }

        if ($request->filled('password')) {
            $updateData['password'] = Hash::make($request->input('password'));
        }

        if ($request->filled('role')) {
            $newRole = $request->input('role');
            if ($user->role === User::ROLE_ADMIN && $newRole !== User::ROLE_ADMIN) {
                $activeAdminCount = User::where('role', User::ROLE_ADMIN)
                    ->where('status', User::STATUS_ACTIVE)
                    ->where('id', '!=', $user->id)
                    ->count();

                if ($activeAdminCount === 0) {
                    return response()->json([
                        'message' => 'At least one active admin is required. This admin cannot be demoted.',
                    ], 422);
                }
            }
            $updateData['role'] = $newRole;
            $updateData['custom_role_id'] = ($newRole === 'custom' || !empty($request->input('custom_role_id')))
                ? $request->input('custom_role_id')
                : null;
        }

        $user->update($updateData);

        // Keep TeacherProfile synced if teacher or profile info provided
        if ($user->role === User::ROLE_TEACHER || $request->filled('designation') || $request->filled('institution')) {
            TeacherProfile::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'designation' => $request->input('designation') ?: ($user->teacherProfile?->designation ?: 'Instructor'),
                    'institution' => $request->input('institution') ?: ($user->teacherProfile?->institution ?: 'NovoNex Faculty'),
                    'photo_url' => $photoUrl,
                    'bio' => $request->input('bio') ?: $user->teacherProfile?->bio,
                    'is_featured' => true,
                ]
            );
        } elseif ($user->teacherProfile && $photoUrl !== null) {
            $user->teacherProfile->update(['photo_url' => $photoUrl]);
        }

        AuditLog::log('user_updated_by_admin', 'User', $user->id, $oldData, $updateData);

        return response()->json([
            'message' => 'User information and profile picture updated successfully.',
            'user' => $user->fresh(['teacherProfile', 'customRole'])->loadCount(['enrollments', 'instructedCourses']),
        ]);
    }

    /**
     * Upload avatar image for any user (Admin)
     */
    public function updateAvatar(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'photo' => ['nullable', 'image', 'max:10240'],
            'avatar' => ['nullable', 'image', 'max:10240'],
            'photo_url' => ['nullable', 'string'],
        ]);

        $photoUrl = $request->input('photo_url');

        $imageFile = $request->file('photo') ?? $request->file('avatar');
        if ($imageFile && $imageFile->isValid()) {
            $path = $imageFile->store('avatars', 'public');
            $photoUrl = asset('storage/' . $path);

            try {
                $destPath = public_path('storage/' . $path);
                $destDir = dirname($destPath);
                if (! file_exists($destDir)) {
                    @mkdir($destDir, 0755, true);
                }
                @copy(storage_path('app/public/' . $path), $destPath);
            } catch (\Throwable $e) {}
        }

        if (! empty($photoUrl)) {
            $user->update(['photo_url' => $photoUrl]);

            if ($user->teacherProfile) {
                $user->teacherProfile->update(['photo_url' => $photoUrl]);
            }
        }

        return response()->json([
            'message' => 'Profile picture updated successfully.',
            'photo_url' => $photoUrl,
            'user' => $user->fresh(['teacherProfile', 'customRole']),
        ]);
    }

    /**
     * Update teacher profile details
     */
    public function updateTeacherProfile(Request $request, User $user): JsonResponse
    {
        if ($user->role !== User::ROLE_TEACHER) {
            return response()->json(['message' => 'This user is not an instructor.'], 422);
        }

        $validated = $request->validate([
            'designation' => ['nullable', 'string', 'max:255'],
            'institution' => ['nullable', 'string', 'max:255'],
            'photo_url' => ['nullable', 'string'],
            'bio' => ['nullable', 'string'],
            'expertise' => ['nullable', 'string', 'max:255'],
            'is_featured' => ['nullable', 'boolean'],
        ]);

        $profile = TeacherProfile::updateOrCreate(
            ['user_id' => $user->id],
            $validated
        );

        return response()->json([
            'message' => 'Instructor profile saved successfully.',
            'profile' => $profile,
            'user' => $user->load('teacherProfile'),
        ]);
    }
}
