<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\PointTransaction;
use App\Models\RewardNoteSubmission;
use App\Models\RewardTopic;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EarnPointController extends Controller
{
    /**
     * Get courses for the Earn Points page.
     */
    public function getCourses(Request $request): JsonResponse
    {
        RewardTopic::ensureTableExists();
        RewardNoteSubmission::ensureTableExists();

        $query = Course::query();

        // If there are published courses, prefer published, otherwise show all active
        $hasPublished = Course::where('status', Course::STATUS_PUBLISHED)->exists();
        if ($hasPublished) {
            $query->where('status', Course::STATUS_PUBLISHED);
        }

        // Optional server-side search
        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        $courses = $query
            ->withCount([
                'rewardTopics as active_topics_count' => function ($q) {
                    $q->where('is_active', true);
                },
            ])
            ->orderByDesc('active_topics_count')
            ->latest('id')
            ->get();

        $featured = $courses->filter(function ($c) {
            return ($c->active_topics_count ?? 0) > 0;
        })->values();

        return response()->json([
            'courses' => $courses,
            'all_courses' => $courses,
            'featured_courses' => $featured,
        ]);
    }

    /**
     * Get active reward topics for a specific course (by ID or slug).
     */
    public function getCourseTopics(Request $request, $courseId): JsonResponse
    {
        RewardTopic::ensureTableExists();
        RewardNoteSubmission::ensureTableExists();

        $course = Course::where('id', $courseId)->orWhere('slug', $courseId)->first();
        if (! $course) {
            return response()->json([
                'message' => 'Course not found',
                'topics' => [],
            ], 404);
        }

        $topics = RewardTopic::where('course_id', $course->id)
            ->where('is_active', true)
            ->withCount([
                'submissions as total_submissions_count',
                'submissions as approved_submissions_count' => function ($q) {
                    $q->where('status', RewardNoteSubmission::STATUS_APPROVED);
                },
            ])
            ->latest('id')
            ->get();

        return response()->json([
            'course' => [
                'id' => $course->id,
                'title' => $course->title,
                'slug' => $course->slug,
                'thumbnail' => $course->thumbnail,
            ],
            'topics' => $topics,
        ]);
    }

    /**
     * Get approved notes for a topic (so students can read and study good notes).
     */
    public function getApprovedNotes(Request $request, $topicId): JsonResponse
    {
        RewardNoteSubmission::ensureTableExists();

        $topic = RewardTopic::find($topicId);
        if (! $topic) {
            return response()->json([
                'message' => 'Topic not found',
                'approved_notes' => [],
            ], 404);
        }

        $approvedNotes = RewardNoteSubmission::where('topic_id', $topic->id)
            ->where('status', RewardNoteSubmission::STATUS_APPROVED)
            ->with(['user:id,name,photo_url,registration_number'])
            ->latest('reviewed_at')
            ->get();

        return response()->json([
            'topic' => $topic,
            'approved_notes' => $approvedNotes,
        ]);
    }

    /**
     * Student submits note (photos / PDF) for a topic.
     */
    public function submitNote(Request $request, $topicId): JsonResponse
    {
        RewardNoteSubmission::ensureTableExists();

        $topic = RewardTopic::find($topicId);
        if (! $topic) {
            return response()->json(['message' => 'Topic not found.'], 404);
        }

        $user = $request->user();

        $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'files' => ['nullable', 'array', 'max:10'],
            'files.*' => ['file', 'mimes:jpeg,jpg,png,webp,pdf', 'max:51200'], // 50MB max per file
        ]);

        $fileUrls = [];

        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {
                $path = $file->store('reward_notes', 'public');
                $url = asset('storage/' . $path);

                // Mirror copy to public_path for shared hosting / cPanel environments
                try {
                    $destPath = public_path('storage/' . $path);
                    $destDir = dirname($destPath);
                    if (! file_exists($destDir)) {
                        @mkdir($destDir, 0755, true);
                    }
                    @copy(storage_path('app/public/' . $path), $destPath);
                } catch (\Throwable $e) {
                    // ignore
                }

                $fileUrls[] = [
                    'url' => $url,
                    'file_name' => $file->getClientOriginalName(),
                    'file_type' => strtolower($file->getClientOriginalExtension()),
                    'file_size' => $file->getSize(),
                ];
            }
        }

        $submission = RewardNoteSubmission::create([
            'topic_id' => $topic->id,
            'course_id' => $topic->course_id,
            'user_id' => $user->id,
            'title' => $request->input('title'),
            'description' => $request->input('description'),
            'file_paths' => $fileUrls,
            'status' => RewardNoteSubmission::STATUS_PENDING,
            'points_awarded' => 0,
        ]);

        return response()->json([
            'message' => 'Your note has been submitted successfully! The teacher will review it soon.',
            'submission' => $submission->load(['topic', 'user']),
        ], 201);
    }

    /**
     * Get current student's note submissions.
     */
    public function getMySubmissions(Request $request): JsonResponse
    {
        RewardNoteSubmission::ensureTableExists();

        $user = $request->user();

        $submissions = RewardNoteSubmission::where('user_id', $user->id)
            ->with([
                'topic:id,title,points_reward,course_id',
                'course:id,title,slug,thumbnail',
            ])
            ->latest('id')
            ->get();

        return response()->json([
            'submissions' => $submissions,
            'total_earned_from_notes' => (int) $submissions->where('status', RewardNoteSubmission::STATUS_APPROVED)->sum('points_awarded'),
        ]);
    }

    /**
     * Get current student's points history / transactions.
     */
    public function getMyPointsHistory(Request $request): JsonResponse
    {
        PointTransaction::ensureTableExists();

        $user = $request->user();

        $transactions = PointTransaction::where('user_id', $user->id)
            ->latest('id')
            ->paginate(25);

        return response()->json([
            'points' => (int) ($user->points ?? 0),
            'transactions' => $transactions,
        ]);
    }
}
