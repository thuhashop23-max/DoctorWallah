<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\RewardNoteSubmission;
use App\Models\RewardTopic;
use App\Services\PointService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RewardTopicController extends Controller
{
    protected function authorizeCourseAccess(Course $course): void
    {
        $user = auth()->user();
        if (! $user->isAdmin() && ! $course->isAssignedTeacher($user->id)) {
            abort(403, 'You do not have permission to manage reward setup for this course.');
        }
    }

    public function getCourseTopics(Course $course): JsonResponse
    {
        $this->authorizeCourseAccess($course);

        RewardTopic::ensureTableExists();
        RewardNoteSubmission::ensureTableExists();

        $topics = RewardTopic::where('course_id', $course->id)
            ->withCount([
                'submissions',
                'submissions as pending_submissions_count' => function ($q) {
                    $q->where('status', RewardNoteSubmission::STATUS_PENDING);
                },
                'submissions as approved_submissions_count' => function ($q) {
                    $q->where('status', RewardNoteSubmission::STATUS_APPROVED);
                },
            ])
            ->latest('id')
            ->get();

        return response()->json([
            'topics' => $topics,
        ]);
    }

    public function storeTopic(Request $request, Course $course): JsonResponse
    {
        $this->authorizeCourseAccess($course);

        RewardTopic::ensureTableExists();

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'points_reward' => ['required', 'integer', 'min:1', 'max:10000'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $topic = RewardTopic::create([
            'course_id' => $course->id,
            'created_by' => auth()->id(),
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'points_reward' => $validated['points_reward'],
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'message' => 'Reward topic created successfully.',
            'topic' => $topic,
        ], 201);
    }

    public function updateTopic(Request $request, RewardTopic $topic): JsonResponse
    {
        $this->authorizeCourseAccess($topic->course);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'points_reward' => ['required', 'integer', 'min:1', 'max:10000'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $topic->update([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'points_reward' => $validated['points_reward'],
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'message' => 'Reward topic updated successfully.',
            'topic' => $topic->fresh(),
        ]);
    }

    public function deleteTopic(RewardTopic $topic): JsonResponse
    {
        $this->authorizeCourseAccess($topic->course);

        $topic->submissions()->delete();
        $topic->delete();

        return response()->json([
            'message' => 'Reward topic deleted successfully.',
        ]);
    }

    public function getTopicSubmissions(Request $request, RewardTopic $topic): JsonResponse
    {
        $this->authorizeCourseAccess($topic->course);

        RewardNoteSubmission::ensureTableExists();

        $query = RewardNoteSubmission::where('topic_id', $topic->id)
            ->with([
                'user:id,name,phone,email,points,registration_number',
                'reviewer:id,name',
            ])
            ->latest('id');

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        $submissions = $query->get();

        return response()->json([
            'topic' => $topic,
            'submissions' => $submissions,
        ]);
    }

    public function reviewSubmission(Request $request, RewardNoteSubmission $submission, PointService $pointService): JsonResponse
    {
        $this->authorizeCourseAccess($submission->course);

        $validated = $request->validate([
            'action' => ['required', 'string', 'in:approve,reject'],
            'feedback' => ['nullable', 'string', 'max:1000'],
        ]);

        $reviewerId = auth()->id();

        if ($validated['action'] === 'approve') {
            if ($submission->status === RewardNoteSubmission::STATUS_APPROVED) {
                return response()->json(['message' => 'This submission has already been approved.'], 422);
            }

            $updated = $pointService->awardNoteRewardPoints($submission, $reviewerId);

            return response()->json([
                'message' => 'Submission approved successfully and points awarded to the student.',
                'submission' => $updated,
            ]);
        }

        $updated = $pointService->rejectNoteSubmission($submission, $reviewerId, $validated['feedback'] ?? null);

        return response()->json([
            'message' => 'Submission rejected.',
            'submission' => $updated,
        ]);
    }
}
