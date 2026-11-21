<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EnrollmentController extends Controller
{
    public function enrollFree(Course $course): JsonResponse
    {
        $user = auth()->user();

        if ($course->status !== Course::STATUS_PUBLISHED) {
            abort(404, 'Course is not active.');
        }

        if ($course->price > 0) {
            return response()->json([
                'message' => 'This is a paid course. Please complete checkout to enroll.',
            ], 422);
        }

        if ($user->isEnrolledIn($course->id)) {
            $enrollment = Enrollment::where('user_id', $user->id)
                ->where('course_id', $course->id)
                ->first();

            $pilot = $course->nexpilot;
            if ($enrollment && $pilot && $pilot->is_active && (float)$pilot->price <= 0 && !$enrollment->has_nexpilot) {
                $enrollment->update([
                    'has_nexpilot' => true,
                    'nexpilot_id' => $pilot->id,
                ]);
            }

            return response()->json([
                'message' => 'You are already enrolled in this course.',
                'enrollment' => $enrollment,
            ]);
        }

        $pilot = $course->nexpilot;
        $hasPilot = (bool) ($pilot && $pilot->is_active && (float)$pilot->price <= 0);

        $enrollment = Enrollment::create([
            'user_id' => $user->id,
            'course_id' => $course->id,
            'status' => Enrollment::STATUS_ACTIVE,
            'has_nexpilot' => $hasPilot,
            'nexpilot_id' => $hasPilot ? $pilot->id : null,
            'enrolled_at' => now(),
        ]);

        return response()->json([
            'message' => 'Congratulations! You have enrolled in this free course successfully.',
            'enrollment' => $enrollment,
        ], 201);
    }

    public function myCourses(Request $request): JsonResponse
    {
        $user = $request->user();

        $enrollments = $user->enrollments()
            ->with(['course' => function ($q) {
                $q->with(['instructors:id,name', 'instructor:id,name', 'nexpilot:id,course_id,title,price,is_active'])
                  ->withCount('lessons');
            }])
            ->where('status', Enrollment::STATUS_ACTIVE)
            ->latest('enrolled_at')
            ->get();

        $coursesData = $enrollments->map(function ($enrollment) use ($user) {
            $course = $enrollment->course;
            $totalLessons = $course->lessons_count;

            $completedCount = LessonProgress::where('user_id', $user->id)
                ->where('course_id', $course->id)
                ->where('is_completed', true)
                ->count();

            $percentage = $totalLessons > 0 ? (int) round(($completedCount / $totalLessons) * 100) : 0;

            $lastAccessed = LessonProgress::where('user_id', $user->id)
                ->where('course_id', $course->id)
                ->latest('last_accessed_at')
                ->first();

            $pilot = $course->nexpilot;
            $hasActivePilot = (bool) ($pilot && $pilot->is_active);
            $pilotPrice = $pilot ? (float) $pilot->price : 0;
            $hasPilotAccess = (bool) (
                $user->isAdmin() ||
                $user->isTeacher() ||
                ($hasActivePilot && ($pilotPrice <= 0 || $enrollment->has_nexpilot))
            );

            return [
                'course' => $course,
                'access_key' => $enrollment->getOrGenerateAccessKey(),
                'enrolled_at' => $enrollment->enrolled_at,
                'total_lessons' => $totalLessons,
                'completed_lessons' => $completedCount,
                'progress_percentage' => $percentage,
                'last_lesson_id' => $lastAccessed ? $lastAccessed->lesson_id : optional($course->lessons()->first())->id,
                'has_nexpilot' => $hasPilotAccess,
                'nexpilot_id' => $pilot ? $pilot->id : null,
                'has_active_pilot' => $hasActivePilot,
                'pilot_price' => $pilotPrice,
                'pilot_title' => $pilot ? $pilot->title : null,
                'is_instructor' => $course->isAssignedTeacher($user->id),
            ];
        });

        return response()->json($coursesData);
    }

    public function getFirstLesson(Course $course): JsonResponse
    {
        $user = auth()->user();

        $canAccess = false;
        if ($user) {
            if ($user->isAdmin()) {
                $canAccess = true;
            } elseif ($user->isTeacher() && $course->isAssignedTeacher($user->id)) {
                $canAccess = true;
            } elseif ($user->isEnrolledIn($course->id)) {
                $canAccess = true;
            }
        }

        $canManageBuilder = $user && ($user->isAdmin() || ($user->isTeacher() && $course->isAssignedTeacher($user->id)));
        $isEnrolled = $user ? $user->isEnrolledIn($course->id) : false;

        if (!$canAccess) {
            $previewLesson = Lesson::where('course_id', $course->id)
                ->where('is_preview', true)
                ->orderBy('sort_order')
                ->first();

            if ($previewLesson) {
                return response()->json([
                    'lesson_id' => $previewLesson->id,
                    'course_slug' => $course->slug,
                    'is_preview' => true,
                    'can_manage_builder' => $canManageBuilder,
                    'is_enrolled' => $isEnrolled,
                ]);
            }

            return response()->json([
                'message' => 'You must be enrolled in this course to access the classroom.',
                'course_slug' => $course->slug,
                'can_manage_builder' => $canManageBuilder,
                'is_enrolled' => $isEnrolled,
            ], 403);
        }

        // 1. Check last accessed lesson
        $lastProgress = LessonProgress::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->latest('last_accessed_at')
            ->first();

        if ($lastProgress && $lastProgress->lesson_id) {
            return response()->json([
                'lesson_id' => $lastProgress->lesson_id,
                'course_slug' => $course->slug,
                'can_manage_builder' => $canManageBuilder,
                'is_enrolled' => $isEnrolled,
            ]);
        }

        // 2. Otherwise get first lesson of first section
        $firstSection = $course->sections()->orderBy('sort_order')->first();
        if ($firstSection) {
            $firstLesson = $firstSection->lessons()->orderBy('sort_order')->first();
            if ($firstLesson) {
                return response()->json([
                    'lesson_id' => $firstLesson->id,
                    'course_slug' => $course->slug,
                    'can_manage_builder' => $canManageBuilder,
                    'is_enrolled' => $isEnrolled,
                ]);
            }
        }

        // 3. Fallback to any first lesson in the course
        $firstLesson = Lesson::where('course_id', $course->id)->orderBy('sort_order')->first();
        if ($firstLesson) {
            return response()->json([
                'lesson_id' => $firstLesson->id,
                'course_slug' => $course->slug,
                'can_manage_builder' => $canManageBuilder,
                'is_enrolled' => $isEnrolled,
            ]);
        }

        return response()->json([
            'message' => 'No lessons found in this course yet.',
            'course_slug' => $course->slug,
            'can_manage_builder' => $canManageBuilder,
            'is_enrolled' => $isEnrolled,
        ], 404);
    }

    public function getLesson(Course $course, Lesson $lesson): JsonResponse
    {
        $user = auth()->user();

        // Authorization check
        $canAccess = false;
        if ($user) {
            if ($user->isAdmin()) {
                $canAccess = true;
            } elseif ($user->isTeacher() && $course->isAssignedTeacher($user->id)) {
                $canAccess = true;
            } elseif ($user->isEnrolledIn($course->id)) {
                $canAccess = true;
            }
        }
        if ($lesson->is_preview) {
            $canAccess = true;
        }

        if (! $canAccess) {
            abort(403, 'You must be enrolled in the course to access this class.');
        }

        // Track last accessed
        if ($user->isEnrolledIn($course->id)) {
            LessonProgress::updateOrCreate(
                ['user_id' => $user->id, 'lesson_id' => $lesson->id],
                ['course_id' => $course->id, 'last_accessed_at' => now()]
            );
        }

        // Fetch curriculum structure for sidebar with completion markers
        $sections = $course->sections()
            ->with(['lessons' => function ($q) {
                $q->select('id', 'course_id', 'section_id', 'title', 'slug', 'duration_minutes', 'is_preview', 'sort_order')
                  ->orderBy('sort_order');
            }])
            ->orderBy('sort_order')
            ->get();

        $completedLessonIds = LessonProgress::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->where('is_completed', true)
            ->pluck('lesson_id')
            ->toArray();

        $canManageBuilder = $user && ($user->isAdmin() || ($user->isTeacher() && $course->isAssignedTeacher($user->id)));

        return response()->json([
            'lesson' => $lesson->load(['attachments', 'section']),
            'sections' => $sections,
            'completed_lesson_ids' => $completedLessonIds,
            'is_completed' => in_array($lesson->id, $completedLessonIds, true),
            'can_manage_builder' => $canManageBuilder,
            'is_enrolled' => $user ? $user->isEnrolledIn($course->id) : false,
        ]);
    }

    public function toggleProgress(Request $request, Lesson $lesson): JsonResponse
    {
        $user = $request->user();

        $progress = LessonProgress::firstOrNew([
            'user_id' => $user->id,
            'lesson_id' => $lesson->id,
        ]);

        $progress->course_id = $lesson->course_id;
        $progress->is_completed = ! $progress->is_completed;
        $progress->completed_at = $progress->is_completed ? now() : null;
        $progress->last_accessed_at = now();
        $progress->save();

        $totalLessons = Lesson::where('course_id', $lesson->course_id)->count();
        $completedLessons = LessonProgress::where('user_id', $user->id)
            ->where('course_id', $lesson->course_id)
            ->where('is_completed', true)
            ->count();

        $percentage = $totalLessons > 0 ? (int) round(($completedLessons / $totalLessons) * 100) : 0;

        return response()->json([
            'is_completed' => $progress->is_completed,
            'completed_lessons' => $completedLessons,
            'total_lessons' => $totalLessons,
            'progress_percentage' => $percentage,
        ]);
    }
}
