<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\TeacherProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeacherPublicController extends Controller
{
    /**
     * Get featured teachers list for homepage carousel
     */
    public function getFeaturedTeachers(): JsonResponse
    {
        Course::ensureCourseInstructorsTableExists();

        $teachers = User::where(function ($q) {
                $q->where('role', User::ROLE_TEACHER)
                  ->orWhereHas('instructedCourses')
                  ->orWhereIn('id', Course::whereNotNull('instructor_id')->pluck('instructor_id'));
            })
            ->where(function ($q) {
                $q->where('status', User::STATUS_ACTIVE)
                  ->orWhereNull('status')
                  ->orWhere('status', '');
            })
            ->with(['teacherProfile'])
            ->withCount(['instructedCourses' => function ($q) {
                $q->where('status', Course::STATUS_PUBLISHED);
            }])
            ->get()
            ->map(function ($teacher) {
                $profile = $teacher->teacherProfile;
                return [
                    'id' => $teacher->id,
                    'name' => $teacher->name,
                    'designation' => $profile?->designation ?? 'Instructor',
                    'institution' => $profile?->institution ?? 'NovoNex Faculty',
                    'photo_url' => $profile?->photo_url,
                    'bio' => $profile?->bio,
                    'expertise' => $profile?->expertise,
                    'is_featured' => $profile?->is_featured ?? true,
                    'courses_count' => $teacher->instructed_courses_count,
                ];
            });

        return response()->json([
            'data' => $teachers,
            'teachers' => $teachers,
        ]);
    }

    /**
     * Get single teacher public profile and their courses
     */
    public function getTeacherProfile(int $id): JsonResponse
    {
        Course::ensureCourseInstructorsTableExists();

        $teacher = User::where('id', $id)
            ->with(['teacherProfile'])
            ->firstOrFail();

        // Ensure teacher profile exists
        if (! $teacher->teacherProfile) {
            TeacherProfile::firstOrCreate(['user_id' => $teacher->id], [
                'designation' => 'Instructor',
                'institution' => 'NovoNex Faculty',
                'is_featured' => true,
            ]);
            $teacher->load('teacherProfile');
        }

        // Get all courses taught by this teacher (both via pivot and instructor_id)
        $courses = Course::where('status', Course::STATUS_PUBLISHED)
            ->where(function ($q) use ($teacher) {
                $q->where('instructor_id', $teacher->id)
                  ->orWhereHas('instructors', fn($iq) => $iq->where('users.id', $teacher->id));
            })
            ->select('id', 'title', 'slug', 'thumbnail', 'short_description', 'price', 'sale_price', 'status')
            ->withCount(['enrollments', 'lessons'])
            ->latest()
            ->get();

        // If this teacher doesn't have courses linked directly yet, show popular published courses
        if ($courses->isEmpty()) {
            $courses = Course::where('status', Course::STATUS_PUBLISHED)
                ->select('id', 'title', 'slug', 'thumbnail', 'short_description', 'price', 'sale_price', 'status')
                ->withCount(['enrollments', 'lessons'])
                ->latest()
                ->limit(6)
                ->get();
        }

        $user = auth('sanctum')->user();
        $enrolledIds = [];
        if ($user) {
            $enrolledIds = \App\Models\Enrollment::where('user_id', $user->id)
                ->where('status', \App\Models\Enrollment::STATUS_ACTIVE)
                ->pluck('course_id')
                ->toArray();

            $taughtIds = Course::where(function ($q) use ($user) {
                $q->where('instructor_id', $user->id)
                  ->orWhereHas('instructors', fn ($iq) => $iq->where('users.id', $user->id));
            })->pluck('id')->toArray();

            $enrolledIds = array_unique(array_merge($enrolledIds, $taughtIds));
        }

        $courses->transform(function ($c) use ($enrolledIds, $user) {
            $c->is_enrolled = in_array($c->id, $enrolledIds) || ($user && $user->isAdmin());
            return $c;
        });

        $profile = $teacher->teacherProfile;

        return response()->json([
            'teacher' => [
                'id' => $teacher->id,
                'name' => $teacher->name,
                'designation' => $profile?->designation ?? 'Instructor',
                'institution' => $profile?->institution ?? 'NovoNex Faculty',
                'photo_url' => $profile?->photo_url,
                'bio' => $profile?->bio,
                'expertise' => $profile?->expertise,
                'social_links' => $profile?->social_links ?? [],
                'courses_count' => $courses->count(),
                'total_students' => $courses->sum('enrollments_count'),
            ],
            'courses' => $courses,
        ]);
    }
}
