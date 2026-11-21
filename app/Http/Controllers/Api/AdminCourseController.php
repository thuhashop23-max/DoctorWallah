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
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class AdminCourseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Course::query()
            ->with(['instructors:id,name,email', 'categories:id,name'])
            ->withCount(['lessons', 'enrollments']);

        if ($request->status === 'trashed' || $request->boolean('trashed')) {
            $query->onlyTrashed();
        } elseif ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('short_description', 'like', "%{$search}%");
            });
        }

        // Sorting: best_selling (highest real sales & verified enrollments), alphabetical_asc, alphabetical_desc, price_low, price_high, oldest, latest
        $sort = $request->get('sort', 'latest');
        switch ($sort) {
            case 'best_selling':
            case 'most_sold':
            case 'sales':
            case 'popular':
                $query->orderByRaw('
                    (
                        COALESCE((SELECT COUNT(DISTINCT orders.id) FROM orders WHERE orders.course_id = courses.id AND orders.payment_status = "paid"), 0)
                        +
                        COALESCE((SELECT COUNT(DISTINCT order_items.id) FROM order_items JOIN orders AS o2 ON order_items.order_id = o2.id WHERE order_items.course_id = courses.id AND o2.course_id != courses.id AND o2.payment_status = "paid"), 0)
                        +
                        COALESCE((SELECT COUNT(DISTINCT enrollments.id) FROM enrollments WHERE enrollments.course_id = courses.id AND (enrollments.status = "active" OR enrollments.status IS NULL) AND (enrollments.order_id IS NULL OR enrollments.order_id NOT IN (SELECT id FROM orders WHERE payment_status = "paid"))), 0)
                    ) DESC
                ')
                ->orderByRaw('
                    (
                        COALESCE((SELECT COUNT(*) FROM enrollments WHERE enrollments.course_id = courses.id), 0)
                        +
                        COALESCE(courses.fake_enrollment_count, 0)
                    ) DESC
                ')
                ->orderBy('courses.id', 'desc');
                break;
            case 'alphabetical':
            case 'alphabetical_asc':
            case 'title_asc':
            case 'a_z':
                $query->orderBy('courses.title', 'asc');
                break;
            case 'alphabetical_desc':
            case 'title_desc':
            case 'z_a':
                $query->orderBy('courses.title', 'desc');
                break;
            case 'price_low':
            case 'price_asc':
                $query->orderByRaw('COALESCE(courses.sale_price, courses.price) ASC');
                break;
            case 'price_high':
            case 'price_desc':
                $query->orderByRaw('COALESCE(courses.sale_price, courses.price) DESC');
                break;
            case 'oldest':
                $query->orderBy('courses.id', 'asc');
                break;
            case 'latest':
            default:
                $query->orderBy('courses.id', 'desc');
                break;
        }

        $courses = $query->paginate($request->integer('per_page', 15));

        return response()->json($courses);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:courses,slug'],
            'short_description' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'sale_price' => ['nullable', 'numeric', 'min:0', 'lte:price'],
            'thumbnail' => ['nullable', 'string'],
            'is_featured' => ['nullable', 'boolean'],
            'status' => ['required', 'in:draft,published,archived'],
            'category_ids' => ['nullable', 'array'],
            'category_ids.*' => ['exists:categories,id'],
            'instructor_ids' => ['nullable', 'array'],
            'instructor_ids.*' => ['exists:users,id'],
            'features' => ['nullable', 'array'],
            'features.*' => ['string', 'max:500'],
            'fake_enrollment_count' => ['nullable', 'integer', 'min:0'],
            'class_starts_at' => ['nullable', 'string', 'max:100'],
            'action_buttons' => ['nullable', 'array'],
            'enrolled_action_buttons' => ['nullable', 'array'],
            'coupon_code' => ['nullable', 'string', 'max:100'],
            'coupon_discount_text' => ['nullable', 'string', 'max:100'],
            'discount_deadline' => ['nullable', 'date'],
            'show_coupon_timer' => ['nullable', 'boolean'],
            'how_to_buy_url' => ['nullable', 'string', 'max:500'],
        ], [
            'sale_price.lte' => 'Sale price must be less than or equal to regular price.',
        ]);

        $slug = ! empty($validated['slug']) ? Str::slug($validated['slug']) : Str::slug($validated['title']);
        $originalSlug = $slug;
        $counter = 1;
        while (Course::where('slug', $slug)->exists()) {
            $slug = "{$originalSlug}-{$counter}";
            $counter++;
        }

        try {
            $courseData = [
                'title' => $validated['title'],
                'slug' => $slug,
                'short_description' => $validated['short_description'] ?? null,
                'description' => $validated['description'] ?? null,
                'price' => (float) $validated['price'],
                'sale_price' => isset($validated['sale_price']) && $validated['sale_price'] !== '' ? (float) $validated['sale_price'] : null,
                'thumbnail' => $validated['thumbnail'] ?? null,
                'is_featured' => (bool) ($validated['is_featured'] ?? false),
                'status' => $validated['status'],
            ];

            if (Schema::hasColumn('courses', 'features')) {
                $courseData['features'] = $validated['features'] ?? null;
            }
            if (Schema::hasColumn('courses', 'fake_enrollment_count')) {
                $courseData['fake_enrollment_count'] = isset($validated['fake_enrollment_count']) ? (int) $validated['fake_enrollment_count'] : 0;
            }
            if (Schema::hasColumn('courses', 'class_starts_at')) {
                $courseData['class_starts_at'] = $validated['class_starts_at'] ?? null;
            }
            if (Schema::hasColumn('courses', 'action_buttons')) {
                $courseData['action_buttons'] = $validated['action_buttons'] ?? null;
            }
            if (Schema::hasColumn('courses', 'enrolled_action_buttons')) {
                $courseData['enrolled_action_buttons'] = $validated['enrolled_action_buttons'] ?? null;
            }
            if (Schema::hasColumn('courses', 'coupon_code')) {
                $courseData['coupon_code'] = ! empty($validated['coupon_code']) ? strtoupper(trim($validated['coupon_code'])) : null;
            }
            if (Schema::hasColumn('courses', 'coupon_discount_text')) {
                $courseData['coupon_discount_text'] = $validated['coupon_discount_text'] ?? null;
            }
            if (Schema::hasColumn('courses', 'discount_deadline')) {
                $courseData['discount_deadline'] = ! empty($validated['discount_deadline']) ? $validated['discount_deadline'] : null;
            }
            if (Schema::hasColumn('courses', 'show_coupon_timer')) {
                $courseData['show_coupon_timer'] = array_key_exists('show_coupon_timer', $validated) ? (bool) $validated['show_coupon_timer'] : false;
            }
            if (Schema::hasColumn('courses', 'how_to_buy_url')) {
                $courseData['how_to_buy_url'] = $validated['how_to_buy_url'] ?? null;
            }

            $course = Course::create($courseData);

            if (! empty($validated['category_ids'])) {
                Course::ensureCategoryCourseTableExists();
                try {
                    $course->categories()->sync($validated['category_ids']);
                } catch (\Throwable $catErr) {
                    \Log::error('Categories sync in store failed: ' . $catErr->getMessage());
                }
            }

            if (! empty($validated['instructor_ids'])) {
                Course::ensureCourseInstructorsTableExists();
                $primaryId = $validated['instructor_ids'][0];
                $course->update(['instructor_id' => $primaryId]);

                // Automatically ensure assigned users have teacher role and TeacherProfile
                foreach ($validated['instructor_ids'] as $instId) {
                    $instUser = User::find($instId);
                    if ($instUser) {
                        if ($instUser->role === User::ROLE_STUDENT) {
                            $instUser->update(['role' => User::ROLE_TEACHER]);
                        }
                        TeacherProfile::firstOrCreate(
                            ['user_id' => $instUser->id],
                            [
                                'designation' => 'Instructor',
                                'institution' => 'NovoNex Faculty',
                                'is_featured' => true,
                            ]
                        );
                    }
                }

                try {
                    $syncData = [];
                    foreach ($validated['instructor_ids'] as $idx => $userId) {
                        $syncData[$userId] = ['is_primary' => ($idx === 0)];
                    }
                    $course->instructors()->sync($syncData);
                } catch (\Throwable $syncErr) {
                    \Log::error('Instructors pivot sync in store failed: ' . $syncErr->getMessage());
                    try {
                        foreach ($validated['instructor_ids'] as $idx => $userId) {
                            DB::table('course_instructors')->insert([
                                'course_id' => $course->id,
                                'user_id' => $userId,
                                'is_primary' => ($idx === 0) ? 1 : 0,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                        }
                    } catch (\Throwable $rawErr) {
                        \Log::error('Direct DB insert in store failed: ' . $rawErr->getMessage());
                    }
                }
            }

            try {
                AuditLog::log('course_created', 'Course', $course->id, null, $course->toArray());
            } catch (\Throwable $e) {
                \Log::warning('AuditLog log failed: ' . $e->getMessage());
            }

            return response()->json([
                'message' => 'Course created successfully.',
                'course' => $course->load(['instructors', 'categories']),
            ], 201);
        } catch (\Throwable $e) {
            \Log::error('Course create failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to create course: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function show(Course $course): JsonResponse
    {
        Course::ensureCourseInstructorsTableExists();
        Course::ensureCategoryCourseTableExists();

        // If course has legacy instructor_id but no pivot entries, link them automatically
        if ($course->instructor_id && $course->instructors()->count() === 0) {
            try {
                $course->instructors()->syncWithoutDetaching([
                    $course->instructor_id => ['is_primary' => true]
                ]);
            } catch (\Throwable $e) {
                // ignore
            }
        }

        return response()->json([
            'course' => $course->load(['instructors.teacherProfile', 'instructor.teacherProfile', 'categories:id,name', 'sections.lessons.attachments']),
        ]);
    }

    public function update(Request $request, Course $course): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:courses,slug,' . $course->id],
            'short_description' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'sale_price' => ['nullable', 'numeric', 'min:0', 'lte:price'],
            'thumbnail' => ['nullable', 'string'],
            'is_featured' => ['nullable', 'boolean'],
            'status' => ['required', 'in:draft,published,archived'],
            'category_ids' => ['nullable', 'array'],
            'category_ids.*' => ['exists:categories,id'],
            'instructor_ids' => ['nullable', 'array'],
            'instructor_ids.*' => ['exists:users,id'],
            'features' => ['nullable', 'array'],
            'features.*' => ['string', 'max:500'],
            'fake_enrollment_count' => ['nullable', 'integer', 'min:0'],
            'class_starts_at' => ['nullable', 'string', 'max:100'],
            'action_buttons' => ['nullable', 'array'],
            'enrolled_action_buttons' => ['nullable', 'array'],
            'coupon_code' => ['nullable', 'string', 'max:100'],
            'coupon_discount_text' => ['nullable', 'string', 'max:100'],
            'discount_deadline' => ['nullable', 'date'],
            'show_coupon_timer' => ['nullable', 'boolean'],
            'how_to_buy_url' => ['nullable', 'string', 'max:500'],
        ], [
            'sale_price.lte' => 'Sale price must be less than or equal to regular price.',
        ]);

        $oldValues = $course->toArray();

        try {
            $updateData = [
                'title' => $validated['title'],
                'slug' => ! empty($validated['slug']) ? Str::slug($validated['slug']) : $course->slug,
                'short_description' => $validated['short_description'] ?? null,
                'description' => $validated['description'] ?? null,
                'price' => (float) $validated['price'],
                'sale_price' => isset($validated['sale_price']) && $validated['sale_price'] !== '' ? (float) $validated['sale_price'] : null,
                'thumbnail' => $validated['thumbnail'] ?? $course->thumbnail,
                'is_featured' => (bool) ($validated['is_featured'] ?? false),
                'status' => $validated['status'],
            ];

            if (Schema::hasColumn('courses', 'features')) {
                $updateData['features'] = $validated['features'] ?? null;
            }
            if (Schema::hasColumn('courses', 'fake_enrollment_count')) {
                $updateData['fake_enrollment_count'] = isset($validated['fake_enrollment_count']) ? (int) $validated['fake_enrollment_count'] : 0;
            }
            if (Schema::hasColumn('courses', 'class_starts_at')) {
                $updateData['class_starts_at'] = $validated['class_starts_at'] ?? null;
            }
            if (Schema::hasColumn('courses', 'action_buttons')) {
                $updateData['action_buttons'] = array_key_exists('action_buttons', $validated) ? $validated['action_buttons'] : $course->action_buttons;
            }
            if (Schema::hasColumn('courses', 'enrolled_action_buttons')) {
                $updateData['enrolled_action_buttons'] = array_key_exists('enrolled_action_buttons', $validated) ? $validated['enrolled_action_buttons'] : $course->enrolled_action_buttons;
            }
            if (Schema::hasColumn('courses', 'coupon_code')) {
                $updateData['coupon_code'] = ! empty($validated['coupon_code']) ? strtoupper(trim($validated['coupon_code'])) : null;
            }
            if (Schema::hasColumn('courses', 'coupon_discount_text')) {
                $updateData['coupon_discount_text'] = $validated['coupon_discount_text'] ?? null;
            }
            if (Schema::hasColumn('courses', 'discount_deadline')) {
                $updateData['discount_deadline'] = ! empty($validated['discount_deadline']) ? $validated['discount_deadline'] : null;
            }
            if (Schema::hasColumn('courses', 'show_coupon_timer')) {
                $updateData['show_coupon_timer'] = array_key_exists('show_coupon_timer', $validated) ? (bool) $validated['show_coupon_timer'] : false;
            }
            if (Schema::hasColumn('courses', 'how_to_buy_url')) {
                $updateData['how_to_buy_url'] = $validated['how_to_buy_url'] ?? null;
            }

            $course->update($updateData);

            if (isset($validated['category_ids'])) {
                Course::ensureCategoryCourseTableExists();
                try {
                    $course->categories()->sync($validated['category_ids']);
                } catch (\Throwable $catErr) {
                    \Log::error('Categories sync in update failed: ' . $catErr->getMessage());
                }
            }

            if (isset($validated['instructor_ids'])) {
                Course::ensureCourseInstructorsTableExists();

                // Always update the single primary instructor_id on courses table first
                $primaryId = ! empty($validated['instructor_ids']) ? $validated['instructor_ids'][0] : null;
                $course->update(['instructor_id' => $primaryId]);

                // Automatically ensure assigned users have teacher role and TeacherProfile
                foreach ($validated['instructor_ids'] as $instId) {
                    $instUser = User::find($instId);
                    if ($instUser) {
                        if ($instUser->role === User::ROLE_STUDENT) {
                            $instUser->update(['role' => User::ROLE_TEACHER]);
                        }
                        TeacherProfile::firstOrCreate(
                            ['user_id' => $instUser->id],
                            [
                                'designation' => 'Instructor',
                                'institution' => 'NovoNex Faculty',
                                'is_featured' => true,
                            ]
                        );
                    }
                }

                try {
                    $syncData = [];
                    foreach ($validated['instructor_ids'] as $idx => $userId) {
                        $syncData[$userId] = ['is_primary' => ($idx === 0)];
                    }
                    $course->instructors()->sync($syncData);
                } catch (\Throwable $syncErr) {
                    \Log::error('Instructors pivot sync in update failed: ' . $syncErr->getMessage());
                    try {
                        DB::table('course_instructors')->where('course_id', $course->id)->delete();
                        foreach ($validated['instructor_ids'] as $idx => $userId) {
                            DB::table('course_instructors')->insert([
                                'course_id' => $course->id,
                                'user_id' => $userId,
                                'is_primary' => ($idx === 0) ? 1 : 0,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                        }
                    } catch (\Throwable $rawErr) {
                        \Log::error('Direct DB insert in update failed: ' . $rawErr->getMessage());
                    }
                }
            }

            try {
                AuditLog::log('course_updated', 'Course', $course->id, $oldValues, $course->toArray());
            } catch (\Throwable $e) {
                \Log::warning('AuditLog log failed: ' . $e->getMessage());
            }

            return response()->json([
                'message' => 'Course updated successfully.',
                'course' => $course->fresh(['instructors', 'categories']),
            ]);
        } catch (\Throwable $e) {
            \Log::error('Course update failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to save course: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(Course $course): JsonResponse
    {
        $oldValues = $course->toArray();
        $course->delete();

        AuditLog::log('course_trashed', 'Course', $course->id, $oldValues, null);

        return response()->json([
            'message' => 'Course moved to trash. You can restore it if needed.',
        ]);
    }

    public function restore($id): JsonResponse
    {
        $course = Course::onlyTrashed()->findOrFail($id);
        $course->restore();

        AuditLog::log('course_restored', 'Course', $course->id, null, $course->toArray());

        return response()->json([
            'message' => 'Course restored successfully.',
            'course' => $course,
        ]);
    }

    public function forceDelete($id): JsonResponse
    {
        $course = Course::withTrashed()->findOrFail($id);
        $oldValues = $course->toArray();

        // Detach relations safely
        Course::ensureCourseInstructorsTableExists();
        Course::ensureCategoryCourseTableExists();
        try {
            $course->instructors()->detach();
        } catch (\Throwable $e) {}
        try {
            $course->categories()->detach();
        } catch (\Throwable $e) {}
        if (method_exists($course, 'bundles')) {
            try {
                $course->bundles()->detach();
            } catch (\Throwable $e) {}
        }
        $course->forceDelete();

        AuditLog::log('course_permanently_deleted', 'Course', $id, $oldValues, null);

        return response()->json([
            'message' => 'Course permanently deleted.',
        ]);
    }

    public function teachersList(Request $request): JsonResponse
    {
        Course::ensureCourseInstructorsTableExists();

        $query = User::query()
            ->where(function ($q) {
                $q->where('status', User::STATUS_ACTIVE)
                  ->orWhereNull('status')
                  ->orWhere('status', '');
            });

        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        } else {
            $query->where(function ($q) {
                $q->where('role', User::ROLE_TEACHER)
                  ->orWhere('role', User::ROLE_ADMIN)
                  ->orWhereHas('customRole')
                  ->orWhereHas('instructedCourses')
                  ->orWhereIn('id', Course::whereNotNull('instructor_id')->pluck('instructor_id'));
            });
        }

        $teachers = $query
            ->select('id', 'name', 'phone', 'email', 'role')
            ->orderBy('name', 'asc')
            ->limit(100)
            ->get();

        return response()->json($teachers);
    }
}
