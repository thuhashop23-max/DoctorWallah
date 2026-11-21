<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseSection;
use App\Models\Exam;
use App\Models\Lesson;
use App\Models\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class CourseBuilderController extends Controller
{
    protected function authorizeCourseAccess(Course $course): void
    {
        $user = auth()->user();
        if (! $user->isAdmin() && ! $course->isAssignedTeacher($user->id)) {
            abort(403, 'You do not have permission to manage this course curriculum.');
        }
    }

    public function getCurriculum(Course $course): JsonResponse
    {
        $this->authorizeCourseAccess($course);

        $sections = $course->sections()
            ->with(['lessons.attachments'])
            ->orderBy('sort_order')
            ->get();

        return response()->json([
            'course' => [
                'id' => $course->id,
                'title' => $course->title,
                'slug' => $course->slug,
                'status' => $course->status,
                'price' => $course->price,
                'sale_price' => $course->sale_price,
                'action_buttons' => $course->action_buttons ?? [],
                'enrolled_action_buttons' => $course->enrolled_action_buttons ?? [],
            ],
            'sections' => $sections,
        ]);
    }

    public function storeSection(Request $request, Course $course): JsonResponse
    {
        $this->authorizeCourseAccess($course);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $maxSort = $course->sections()->max('sort_order') ?? 0;

        $section = $course->sections()->create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'sort_order' => $maxSort + 1,
        ]);

        return response()->json([
            'message' => 'New section added successfully.',
            'section' => $section->load('lessons'),
        ], 201);
    }

    public function updateSection(Request $request, CourseSection $section): JsonResponse
    {
        $this->authorizeCourseAccess($section->course);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $section->update($validated);

        return response()->json([
            'message' => 'Section updated successfully.',
            'section' => $section,
        ]);
    }

    public function deleteSection(CourseSection $section): JsonResponse
    {
        $this->authorizeCourseAccess($section->course);

        $section->delete();

        return response()->json([
            'message' => 'Section and all its lessons have been deleted.',
        ]);
    }

    public function reorderSections(Request $request, Course $course): JsonResponse
    {
        $this->authorizeCourseAccess($course);

        $validated = $request->validate([
            'section_ids' => ['required', 'array'],
            'section_ids.*' => ['exists:course_sections,id'],
        ]);

        foreach ($validated['section_ids'] as $index => $id) {
            CourseSection::where('id', $id)
                ->where('course_id', $course->id)
                ->update(['sort_order' => $index + 1]);
        }

        return response()->json(['message' => 'Section order updated successfully.']);
    }

    protected function ensureLessonColumns(): void
    {
        if (Schema::hasTable('lessons')) {
            if (!Schema::hasColumn('lessons', 'video_provider')) {
                try {
                    Schema::table('lessons', function ($table) {
                        $table->string('video_provider', 50)->default('youtube')->nullable()->after('content');
                    });
                } catch (\Throwable $e) {
                    \Log::warning('Could not add video_provider column to lessons: ' . $e->getMessage());
                }
            }
            if (Schema::hasColumn('lessons', 'video_url')) {
                try {
                    \DB::statement("ALTER TABLE lessons MODIFY COLUMN video_url TEXT NULL");
                } catch (\Throwable $e) {}
            }
        }
    }

    public static function extractVdoCipherVideoId(?string $input): ?string
    {
        if (empty($input)) return null;
        $clean = trim($input);

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

        return $clean;
    }

    public function storeLesson(Request $request, CourseSection $section): JsonResponse
    {
        $this->authorizeCourseAccess($section->course);
        $this->ensureLessonColumns();

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
            'video_provider' => ['nullable', 'string', 'in:youtube,vdocipher'],
            'video_url' => ['nullable', 'string', 'max:5000'],
            'duration_minutes' => ['nullable', 'integer', 'min:0'],
            'is_preview' => ['nullable', 'boolean'],
            'status' => ['required', 'in:draft,published'],
        ]);

        $videoProvider = $validated['video_provider'] ?? 'youtube';
        $videoUrl = $validated['video_url'] ?? null;

        // If VdoCipher, extract the clean video ID if a shortcode or embed was provided
        if ($videoProvider === 'vdocipher' && !empty($videoUrl)) {
            $extracted = static::extractVdoCipherVideoId($videoUrl);
            if (!empty($extracted)) {
                $videoUrl = $extracted;
            }
        }

        $maxSort = $section->lessons()->max('sort_order') ?? 0;

        $lessonData = [
            'course_id' => $section->course_id,
            'section_id' => $section->id,
            'title' => $validated['title'],
            'slug' => Str::slug($validated['title']) . '-' . Str::random(4),
            'content' => $validated['content'] ?? null,
            'video_url' => $videoUrl,
            'duration_minutes' => (int) ($validated['duration_minutes'] ?? 0),
            'is_preview' => (bool) ($validated['is_preview'] ?? false),
            'status' => $validated['status'],
            'sort_order' => $maxSort + 1,
        ];

        if (Schema::hasColumn('lessons', 'video_provider')) {
            $lessonData['video_provider'] = $videoProvider;
        }

        try {
            $lesson = Lesson::create($lessonData);

            return response()->json([
                'message' => 'New lesson added successfully.',
                'lesson' => $lesson->load('attachments'),
            ], 201);
        } catch (\Throwable $e) {
            \Log::error('storeLesson error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to save lesson: ' . $e->getMessage(),
            ], 422);
        }
    }

    public function updateLesson(Request $request, Lesson $lesson): JsonResponse
    {
        $this->authorizeCourseAccess($lesson->course);
        $this->ensureLessonColumns();

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
            'video_provider' => ['nullable', 'string', 'in:youtube,vdocipher'],
            'video_url' => ['nullable', 'string', 'max:5000'],
            'duration_minutes' => ['nullable', 'integer', 'min:0'],
            'is_preview' => ['nullable', 'boolean'],
            'status' => ['required', 'in:draft,published'],
            'section_id' => ['nullable', 'exists:course_sections,id'],
        ]);

        $videoProvider = $validated['video_provider'] ?? $lesson->video_provider ?? 'youtube';
        $videoUrl = $validated['video_url'] ?? null;

        if ($videoProvider === 'vdocipher' && !empty($videoUrl)) {
            $extracted = static::extractVdoCipherVideoId($videoUrl);
            if (!empty($extracted)) {
                $videoUrl = $extracted;
            }
        }

        $lessonData = [
            'title' => $validated['title'],
            'content' => $validated['content'] ?? null,
            'video_url' => $videoUrl,
            'duration_minutes' => (int) ($validated['duration_minutes'] ?? 0),
            'is_preview' => (bool) ($validated['is_preview'] ?? false),
            'status' => $validated['status'],
            'section_id' => $validated['section_id'] ?? $lesson->section_id,
        ];

        if (Schema::hasColumn('lessons', 'video_provider')) {
            $lessonData['video_provider'] = $videoProvider;
        }

        try {
            $lesson->update($lessonData);

            return response()->json([
                'message' => 'Lesson updated successfully.',
                'lesson' => $lesson->fresh('attachments'),
            ]);
        } catch (\Throwable $e) {
            \Log::error('updateLesson error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to update lesson: ' . $e->getMessage(),
            ], 422);
        }
    }

    public function deleteLesson(Lesson $lesson): JsonResponse
    {
        $this->authorizeCourseAccess($lesson->course);

        $lesson->delete();

        return response()->json([
            'message' => 'Lesson deleted successfully.',
        ]);
    }

    public function reorderLessons(Request $request, CourseSection $section): JsonResponse
    {
        $this->authorizeCourseAccess($section->course);

        $validated = $request->validate([
            'lesson_ids' => ['required', 'array'],
            'lesson_ids.*' => ['exists:lessons,id'],
        ]);

        foreach ($validated['lesson_ids'] as $index => $id) {
            Lesson::where('id', $id)
                ->where('section_id', $section->id)
                ->update(['sort_order' => $index + 1]);
        }

        return response()->json(['message' => 'Lesson order updated successfully.']);
    }

    public function duplicateLesson(Lesson $lesson): JsonResponse
    {
        $this->authorizeCourseAccess($lesson->course);

        $clone = $lesson->replicate();
        $clone->title = $lesson->title . ' (Copy)';
        $clone->slug = Str::slug($clone->title) . '-' . Str::random(4);
        $clone->sort_order = $lesson->sort_order + 1;
        $clone->save();

        foreach ($lesson->attachments as $attachment) {
            $attClone = $attachment->replicate();
            $attClone->lesson_id = $clone->id;
            $attClone->save();
        }

        return response()->json([
            'message' => 'Lesson cloned successfully.',
            'lesson' => $clone->load('attachments'),
        ]);
    }

    protected function ensureExamTypeColumn(): void
    {
        if (Schema::hasTable('exams') && !Schema::hasColumn('exams', 'exam_type')) {
            Schema::table('exams', function ($table) {
                $table->string('exam_type', 20)->default('practice')->after('duration_minutes');
                $table->index('exam_type');
            });
        }
    }

    public function getCourseExams(Course $course): JsonResponse
    {
        $this->ensureExamTypeColumn();
        $this->authorizeCourseAccess($course);
        $user = auth()->user();

        $attachedExams = $course->exams()
            ->with(['creator:id,name,email'])
            ->withCount(['questions', 'submissions'])
            ->get();

        // Categorize attached exams:
        // Practice exams list: native practice exams + live exams whose time has expired (auto-transitioned to practice)
        $practiceExams = $attachedExams->filter(function ($e) {
            return ($e->exam_type ?? Exam::TYPE_PRACTICE) === Exam::TYPE_PRACTICE || ($e->isLiveExam() && $e->isLiveExpired());
        })->values();

        // Live exams list: all exams created as live
        $liveExams = $attachedExams->filter(function ($e) {
            return ($e->exam_type ?? Exam::TYPE_PRACTICE) === Exam::TYPE_LIVE;
        })->values();

        $attachedIds = $attachedExams->pluck('id')->toArray();

        // Available exams query (exams not attached to this course)
        $availableQuery = Exam::whereNotIn('id', $attachedIds);

        if (!$user->isAdmin()) {
            $teacherCourseIds = Course::where('instructor_id', $user->id)
                ->orWhereHas('instructors', fn($q) => $q->where('users.id', $user->id))
                ->pluck('id');

            $availableQuery->where(function ($q) use ($user, $teacherCourseIds) {
                $q->where('created_by', $user->id)
                  ->orWhereHas('courses', fn($cq) => $cq->whereIn('courses.id', $teacherCourseIds))
                  ->orWhereIn('course_id', $teacherCourseIds);
            });
        }

        $availableExams = $availableQuery->latest()->get([
            'id', 'title', 'exam_type', 'duration_minutes', 'total_marks', 'pass_marks', 'status', 'start_time', 'end_time'
        ]);

        return response()->json([
            'attached_exams' => $attachedExams,
            'practice_exams' => $practiceExams,
            'live_exams' => $liveExams,
            'available_exams' => $availableExams,
        ]);
    }

    public function storeCourseExam(Request $request, Course $course): JsonResponse
    {
        $this->ensureExamTypeColumn();
        $this->authorizeCourseAccess($course);
        $user = auth()->user();

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'exam_type' => ['required', 'in:practice,live'],
            'duration_minutes' => ['required', 'integer', 'min:1', 'max:1440'],
            'start_time' => ['nullable', 'date'],
            'end_time' => ['nullable', 'date'],
            'total_marks' => ['nullable', 'numeric', 'min:0'],
            'pass_marks' => ['nullable', 'numeric', 'min:0'],
            'has_negative_marking' => ['nullable', 'boolean'],
            'negative_marks' => ['nullable', 'numeric', 'min:0'],
            'status' => ['nullable', 'in:draft,published,archived'],
        ]);

        if ($validated['exam_type'] === Exam::TYPE_LIVE) {
            if (empty($validated['start_time']) || empty($validated['end_time'])) {
                return response()->json(['message' => 'Start time and end time are required for live exams.'], 422);
            }
            if (strtotime($validated['end_time']) < strtotime($validated['start_time'])) {
                return response()->json(['message' => 'End time must be after start time.'], 422);
            }
        }

        $validated['created_by'] = $user->id;
        $validated['course_id'] = $course->id;
        $validated['status'] = $validated['status'] ?? Exam::STATUS_PUBLISHED;
        $validated['has_negative_marking'] = (bool) ($validated['has_negative_marking'] ?? false);
        $validated['negative_marks'] = $validated['has_negative_marking'] ? ($validated['negative_marks'] ?? 0) : 0;
        $validated['total_marks'] = $validated['total_marks'] ?? 0;

        $exam = Exam::create($validated);

        // Attach to course
        $nextOrder = $course->exams()->count() + 1;
        $course->exams()->syncWithoutDetaching([
            $exam->id => ['order' => $nextOrder],
        ]);

        return response()->json([
            'message' => $exam->exam_type === Exam::TYPE_LIVE 
                ? 'Live exam created successfully.' 
                : 'Practice exam created successfully.',
            'exam' => $exam->load(['creator:id,name,email'])->loadCount(['questions', 'submissions']),
        ], 201);
    }

    public function updateCourseExam(Request $request, Course $course, Exam $exam): JsonResponse
    {
        $this->ensureExamTypeColumn();
        $this->authorizeCourseAccess($course);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'exam_type' => ['required', 'in:practice,live'],
            'duration_minutes' => ['required', 'integer', 'min:1', 'max:1440'],
            'start_time' => ['nullable', 'date'],
            'end_time' => ['nullable', 'date'],
            'total_marks' => ['nullable', 'numeric', 'min:0'],
            'pass_marks' => ['nullable', 'numeric', 'min:0'],
            'has_negative_marking' => ['nullable', 'boolean'],
            'negative_marks' => ['nullable', 'numeric', 'min:0'],
            'status' => ['nullable', 'in:draft,published,archived'],
        ]);

        if ($validated['exam_type'] === Exam::TYPE_LIVE) {
            if (empty($validated['start_time']) || empty($validated['end_time'])) {
                return response()->json(['message' => 'Start time and end time are required for live exams.'], 422);
            }
            if (strtotime($validated['end_time']) < strtotime($validated['start_time'])) {
                return response()->json(['message' => 'End time must be after start time.'], 422);
            }
        }

        $validated['has_negative_marking'] = (bool) ($validated['has_negative_marking'] ?? false);
        $validated['negative_marks'] = $validated['has_negative_marking'] ? ($validated['negative_marks'] ?? 0) : 0;

        $exam->update($validated);

        return response()->json([
            'message' => 'Exam updated successfully.',
            'exam' => $exam->load(['creator:id,name,email'])->loadCount(['questions', 'submissions']),
        ]);
    }

    public function attachExam(Request $request, Course $course): JsonResponse
    {
        $this->ensureExamTypeColumn();
        $this->authorizeCourseAccess($course);
        $user = auth()->user();

        $validated = $request->validate([
            'exam_id' => ['required', 'exists:exams,id'],
            'exam_type' => ['nullable', 'in:practice,live'],
            'start_time' => ['nullable', 'date'],
            'end_time' => ['nullable', 'date'],
        ]);

        $exam = Exam::findOrFail($validated['exam_id']);

        if (!$user->isAdmin() && $exam->created_by !== $user->id) {
            $hasAccess = $exam->courses()
                ->where(function ($q) use ($user) {
                    $q->where('instructor_id', $user->id)
                      ->orWhereHas('instructors', fn($iq) => $iq->where('users.id', $user->id));
                })
                ->exists();

            if (!$hasAccess && $exam->course_id) {
                $hasAccess = Course::where('id', $exam->course_id)
                    ->where(function ($q) use ($user) {
                        $q->where('instructor_id', $user->id)
                          ->orWhereHas('instructors', fn($iq) => $iq->where('users.id', $user->id));
                    })
                    ->exists();
            }

            if (!$hasAccess) {
                return response()->json(['message' => 'You do not have permission to add this exam.'], 403);
            }
        }

        if (!empty($validated['exam_type'])) {
            $exam->exam_type = $validated['exam_type'];
            if ($validated['exam_type'] === Exam::TYPE_LIVE) {
                if (!empty($validated['start_time'])) $exam->start_time = $validated['start_time'];
                if (!empty($validated['end_time'])) $exam->end_time = $validated['end_time'];
            }
            $exam->save();
        }

        $nextOrder = $course->exams()->count() + 1;
        $course->exams()->syncWithoutDetaching([
            $exam->id => ['order' => $nextOrder],
        ]);

        return response()->json([
            'message' => 'Exam added to course successfully.',
            'attached_exams' => $course->exams()
                ->with(['creator:id,name,email'])
                ->withCount(['questions', 'submissions'])
                ->get(),
        ]);
    }

    public function detachExam(Course $course, Exam $exam): JsonResponse
    {
        $this->authorizeCourseAccess($course);

        $course->exams()->detach($exam->id);

        return response()->json([
            'message' => 'Exam removed from course successfully.',
        ]);
    }

    public function getCustomButtons(Course $course): JsonResponse
    {
        $this->authorizeCourseAccess($course);

        return response()->json([
            'action_buttons' => $course->action_buttons ?? [],
            'enrolled_action_buttons' => $course->enrolled_action_buttons ?? [],
        ]);
    }

    public function updateCustomButtons(Request $request, Course $course): JsonResponse
    {
        $this->authorizeCourseAccess($course);

        $validated = $request->validate([
            'action_buttons' => ['nullable', 'array'],
            'enrolled_action_buttons' => ['nullable', 'array'],
        ]);

        $course->update([
            'action_buttons' => $validated['action_buttons'] ?? [],
            'enrolled_action_buttons' => $validated['enrolled_action_buttons'] ?? [],
        ]);

        return response()->json([
            'message' => 'Custom buttons updated successfully.',
            'action_buttons' => $course->action_buttons ?? [],
            'enrolled_action_buttons' => $course->enrolled_action_buttons ?? [],
        ]);
    }

    public function uploadButtonFile(Request $request, Course $course): JsonResponse
    {
        $this->authorizeCourseAccess($course);

        $request->validate([
            'file' => ['required', 'file', 'max:51200'],
        ]);

        $file = $request->file('file');
        $originalName = $file->getClientOriginalName();
        $path = $file->store('media', 'public');
        $url = asset('storage/' . $path);

        try {
            $destPath = public_path('storage/' . $path);
            $destDir = dirname($destPath);
            if (!file_exists($destDir)) {
                @mkdir($destDir, 0755, true);
            }
            @copy(storage_path('app/public/' . $path), $destPath);
        } catch (\Throwable $e) {
            // ignore if permissions prevent direct copy
        }

        try {
            Media::create([
                'user_id' => auth()->id(),
                'file_name' => $originalName,
                'file_path' => $path,
                'file_type' => 'document',
                'mime_type' => $file->getMimeType() ?: 'application/octet-stream',
                'file_size' => $file->getSize() ?: 0,
            ]);
        } catch (\Throwable $e) {
            // ignore
        }

        return response()->json([
            'url' => $url,
            'file_name' => $originalName,
        ]);
    }
}
