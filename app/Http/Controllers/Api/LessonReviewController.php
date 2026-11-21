<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonReview;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LessonReviewController extends Controller
{
    /**
     * Get reviews and rating statistics for a single lesson.
     */
    public function getLessonReviews(Request $request, Lesson $lesson): JsonResponse
    {
        LessonReview::ensureTableExists();

        $user = $request->user();
        $course = $lesson->course;

        // Check enrollment or access authorization
        $canAccess = false;
        if ($user) {
            if ($user->isAdmin() || ($user->isTeacher() && $course && $course->isAssignedTeacher($user->id)) || ($course && $user->isEnrolledIn($course->id))) {
                $canAccess = true;
            }
        }
        if ($lesson->is_preview) {
            $canAccess = true;
        }

        if (! $canAccess) {
            return response()->json([
                'message' => 'Enroll in the course to view and submit class reviews.',
            ], 403);
        }

        $allReviews = LessonReview::where('lesson_id', $lesson->id)->get();
        $totalReviews = $allReviews->count();
        $averageRating = $totalReviews > 0 ? round($allReviews->avg('rating'), 1) : 0;

        $distribution = [
            5 => $allReviews->where('rating', 5)->count(),
            4 => $allReviews->where('rating', 4)->count(),
            3 => $allReviews->where('rating', 3)->count(),
            2 => $allReviews->where('rating', 2)->count(),
            1 => $allReviews->where('rating', 1)->count(),
        ];

        $myReview = null;
        if ($user) {
            $myReview = LessonReview::where('lesson_id', $lesson->id)
                ->where('user_id', $user->id)
                ->first();
        }

        // Recent student reviews
        $recentReviews = LessonReview::where('lesson_id', $lesson->id)
            ->with(['user:id,name,role,photo_url'])
            ->latest('id')
            ->limit(20)
            ->get();

        return response()->json([
            'my_review' => $myReview,
            'stats' => [
                'total_reviews' => $totalReviews,
                'average_rating' => $averageRating,
                'distribution' => $distribution,
            ],
            'reviews' => $recentReviews,
        ]);
    }

    /**
     * Submit or update a student rating and review for a lesson.
     */
    public function submitLessonReview(Request $request, Lesson $lesson): JsonResponse
    {
        LessonReview::ensureTableExists();

        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Authentication required.'], 401);
        }

        $course = $lesson->course;
        if (! $course) {
            return response()->json(['message' => 'Associated course not found.'], 404);
        }

        // Verify enrollment or student access
        $courseId = (int) $course->id;
        $isEnrolled = false;
        try {
            $isEnrolled = $user->isEnrolledIn($courseId)
                || Enrollment::where('user_id', $user->id)->where('course_id', $courseId)->where('status', Enrollment::STATUS_ACTIVE)->exists()
                || Order::where('user_id', $user->id)->where('course_id', $courseId)->where('payment_status', Order::PAYMENT_PAID)->exists()
                || Order::where('user_id', $user->id)->whereHas('items', function ($iq) use ($courseId) {
                    $iq->where('course_id', $courseId);
                })->where('payment_status', Order::PAYMENT_PAID)->exists();
        } catch (\Throwable $e) {
            $isEnrolled = true;
        }

        $canReview = $isEnrolled || $lesson->is_preview || $user->isAdmin() || ($user->isTeacher() && $course->isAssignedTeacher($user->id));

        if (! $canReview) {
            return response()->json([
                'message' => 'You must be enrolled in this course to rate this class.',
            ], 403);
        }

        $validated = $request->validate([
            'rating' => ['required', 'integer', 'between:1,5'],
            'review' => ['nullable', 'string', 'max:2000'],
        ]);

        try {
            $review = LessonReview::updateOrCreate(
                [
                    'lesson_id' => $lesson->id,
                    'user_id' => $user->id,
                ],
                [
                    'course_id' => $course->id,
                    'rating' => (int) $validated['rating'],
                    'review' => ! empty($validated['review']) ? trim($validated['review']) : null,
                ]
            );

            $allReviews = LessonReview::where('lesson_id', $lesson->id)->get();
            $totalReviews = $allReviews->count();
            $averageRating = $totalReviews > 0 ? round($allReviews->avg('rating'), 1) : 0;

            return response()->json([
                'message' => 'Class review submitted successfully!',
                'review' => $review->load(['user:id,name,role,photo_url']),
                'stats' => [
                    'total_reviews' => $totalReviews,
                    'average_rating' => $averageRating,
                ],
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Class review submission error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Failed to save review: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get list of courses for Admin & Teacher Class Reviews dashboard.
     */
    public function getCoursesForReviews(Request $request): JsonResponse
    {
        LessonReview::ensureTableExists();

        $user = $request->user();
        $isAdmin = $user->isAdmin();

        $query = Course::query();

        if (! $isAdmin) {
            $teacherId = $user->id;
            $query->where(function ($q) use ($teacherId) {
                $q->where('instructor_id', $teacherId)
                  ->orWhereHas('instructors', function ($iq) use ($teacherId) {
                      $iq->where('users.id', $teacherId);
                  });
            });
        }

        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where('title', 'like', "%{$search}%");
        }

        $courses = $query
            ->withCount(['lessons'])
            ->with(['instructor:id,name', 'instructors:id,name'])
            ->latest('id')
            ->get();

        // Calculate lesson review stats per course
        $courseIds = $courses->pluck('id')->toArray();
        $reviewsByCourse = LessonReview::whereIn('course_id', $courseIds)
            ->get()
            ->groupBy('course_id');

        $coursesData = $courses->map(function ($course) use ($reviewsByCourse) {
            $courseReviews = $reviewsByCourse->get($course->id, collect());
            $reviewsCount = $courseReviews->count();
            $averageRating = $reviewsCount > 0 ? round($courseReviews->avg('rating'), 1) : 0;
            $positiveCount = $courseReviews->where('rating', '>=', 4)->count();
            $positivePercent = $reviewsCount > 0 ? round(($positiveCount / $reviewsCount) * 100) : 0;

            return [
                'id' => $course->id,
                'title' => $course->title,
                'slug' => $course->slug,
                'thumbnail' => $course->thumbnail,
                'instructor' => $course->instructor,
                'instructors' => $course->instructors,
                'lessons_count' => $course->lessons_count,
                'reviews_count' => $reviewsCount,
                'average_rating' => $averageRating,
                'positive_percentage' => $positivePercent,
            ];
        });

        return response()->json([
            'courses' => $coursesData,
        ]);
    }

    /**
     * Get course review analytics with lesson breakdown and graph data.
     */
    public function getCourseClassReviews(Request $request, Course $course): JsonResponse
    {
        LessonReview::ensureTableExists();

        $user = $request->user();
        $isAdmin = $user->isAdmin();

        if (! $isAdmin && ! $course->isAssignedTeacher($user->id)) {
            return response()->json(['message' => 'Unauthorized to view reviews for this course.'], 403);
        }

        // Fetch lessons with section names
        $lessons = Lesson::where('course_id', $course->id)
            ->with(['section:id,title,sort_order'])
            ->orderBy('sort_order')
            ->get();

        $allReviews = LessonReview::where('course_id', $course->id)
            ->with(['user:id,name,email,role,photo_url', 'lesson:id,title,section_id'])
            ->latest('id')
            ->get();

        $reviewsByLesson = $allReviews->groupBy('lesson_id');

        $totalCourseReviews = $allReviews->count();
        $courseAverageRating = $totalCourseReviews > 0 ? round($allReviews->avg('rating'), 1) : 0;

        $lessonsStats = [];
        $chartData = [];

        foreach ($lessons as $index => $lesson) {
            $lessonReviews = $reviewsByLesson->get($lesson->id, collect());
            $lessonReviewsCount = $lessonReviews->count();
            $lessonAvgRating = $lessonReviewsCount > 0 ? round($lessonReviews->avg('rating'), 1) : 0;

            $status = 'no_reviews';
            if ($lessonReviewsCount > 0) {
                if ($lessonAvgRating >= 4.5) {
                    $status = 'excellent';
                } elseif ($lessonAvgRating >= 4.0) {
                    $status = 'good';
                } elseif ($lessonAvgRating >= 3.0) {
                    $status = 'average';
                } else {
                    $status = 'poor';
                }
            }

            $statItem = [
                'id' => $lesson->id,
                'title' => $lesson->title,
                'slug' => $lesson->slug,
                'section_id' => $lesson->section_id,
                'section_title' => $lesson->section ? $lesson->section->title : 'General',
                'sort_order' => $lesson->sort_order,
                'class_number' => $index + 1,
                'reviews_count' => $lessonReviewsCount,
                'average_rating' => $lessonAvgRating,
                'status' => $status,
                'distribution' => [
                    5 => $lessonReviews->where('rating', 5)->count(),
                    4 => $lessonReviews->where('rating', 4)->count(),
                    3 => $lessonReviews->where('rating', 3)->count(),
                    2 => $lessonReviews->where('rating', 2)->count(),
                    1 => $lessonReviews->where('rating', 1)->count(),
                ],
            ];

            $lessonsStats[] = $statItem;

            $chartData[] = [
                'lesson_id' => $lesson->id,
                'name' => 'Class ' . ($index + 1),
                'full_title' => $lesson->title,
                'section_title' => $lesson->section ? $lesson->section->title : '',
                'rating' => $lessonAvgRating,
                'reviews_count' => $lessonReviewsCount,
                'fill' => $lessonReviewsCount === 0
                    ? '#94a3b8' // gray if no reviews
                    : ($lessonAvgRating >= 4.0
                        ? '#10b981' // emerald for good
                        : ($lessonAvgRating >= 3.0
                            ? '#f59e0b' // amber for average
                            : '#ef4444')), // red for poor
            ];
        }

        // Top performing classes (rating >= 4.0, minimum 1 review)
        $reviewedLessons = collect($lessonsStats)->filter(fn ($item) => $item['reviews_count'] > 0);
        $topPerforming = $reviewedLessons->sortByDesc('average_rating')->take(5)->values()->all();

        // Classes needing attention (rating < 3.5, or lowest ratings)
        $needsAttention = $reviewedLessons->filter(fn ($item) => $item['average_rating'] < 3.5)
            ->sortBy('average_rating')
            ->values()
            ->all();

        // If none strictly < 3.5, but some have reviews, pick the bottom lowest
        if (empty($needsAttention) && $reviewedLessons->isNotEmpty()) {
            $minRating = $reviewedLessons->min('average_rating');
            if ($minRating < 4.5) {
                $needsAttention = $reviewedLessons->where('average_rating', $minRating)->take(3)->values()->all();
            }
        }

        // Apply filters to review list if requested
        $filteredReviews = $allReviews;
        if ($request->filled('lesson_id')) {
            $filteredReviews = $filteredReviews->where('lesson_id', (int) $request->input('lesson_id'));
        }
        if ($request->filled('rating')) {
            $ratingFilter = $request->input('rating');
            if ($ratingFilter === 'low') {
                $filteredReviews = $filteredReviews->where('rating', '<=', 2);
            } else {
                $filteredReviews = $filteredReviews->where('rating', (int) $ratingFilter);
            }
        }

        $formattedReviews = $filteredReviews->values()->map(function ($rev) {
            return [
                'id' => $rev->id,
                'rating' => $rev->rating,
                'review' => $rev->review,
                'created_at' => $rev->created_at ? $rev->created_at->toIso8601String() : null,
                'lesson' => [
                    'id' => $rev->lesson ? $rev->lesson->id : $rev->lesson_id,
                    'title' => $rev->lesson ? $rev->lesson->title : 'Unknown Class',
                ],
                'user' => [
                    'id' => $rev->user ? $rev->user->id : $rev->user_id,
                    'name' => $rev->user ? $rev->user->name : 'Anonymous Student',
                    'email' => $rev->user ? $rev->user->email : null,
                    'role' => $rev->user ? $rev->user->role : 'student',
                    'avatar' => $rev->user ? ($rev->user->photo_url ?? null) : null,
                ],
            ];
        });

        return response()->json([
            'course' => [
                'id' => $course->id,
                'title' => $course->title,
                'slug' => $course->slug,
                'thumbnail' => $course->thumbnail,
                'total_lessons' => $lessons->count(),
            ],
            'summary' => [
                'total_reviews' => $totalCourseReviews,
                'average_rating' => $courseAverageRating,
                'reviewed_lessons_count' => $reviewedLessons->count(),
                'total_lessons_count' => $lessons->count(),
                'top_performing' => $topPerforming,
                'needs_attention' => $needsAttention,
            ],
            'chart_data' => $chartData,
            'lessons_stats' => $lessonsStats,
            'reviews' => $formattedReviews,
        ]);
    }

    /**
     * Delete an inappropriate review (Admin or Course Teacher).
     */
    public function deleteReview(Request $request, $id): JsonResponse
    {
        LessonReview::ensureTableExists();

        $user = $request->user();
        $review = LessonReview::with('course')->findOrFail($id);

        $isAdmin = $user->isAdmin();
        $isTeacher = $user->isTeacher() && $review->course && $review->course->isAssignedTeacher($user->id);

        if (! $isAdmin && ! $isTeacher) {
            return response()->json(['message' => 'Unauthorized to delete this review.'], 403);
        }

        $review->delete();

        return response()->json([
            'message' => 'Class review deleted successfully.',
        ]);
    }
}
