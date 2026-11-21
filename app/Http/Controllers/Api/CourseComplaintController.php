<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseComplaint;
use App\Models\Enrollment;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourseComplaintController extends Controller
{
    /**
     * Student submits a complaint for an enrolled course.
     */
    public function submitComplaint(Request $request): JsonResponse
    {
        CourseComplaint::ensureTableExists();

        $validated = $request->validate([
            'course_id' => ['required', 'integer', 'exists:courses,id'],
            'subject' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $user = $request->user();
        $course = Course::findOrFail($validated['course_id']);

        // Check if student has enrolled or purchased
        $isEnrolled = Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->where('status', Enrollment::STATUS_ACTIVE)
            ->exists()
            || Order::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->where('payment_status', Order::PAYMENT_PAID)
            ->exists();

        if (! $isEnrolled && ! $user->isAdmin()) {
            return response()->json([
                'message' => 'You can only submit complaints for courses you are enrolled in.',
            ], 403);
        }

        $complaint = CourseComplaint::create([
            'course_id' => $course->id,
            'user_id' => $user->id,
            'subject' => trim($validated['subject']),
            'message' => trim($validated['message']),
            'status' => CourseComplaint::STATUS_PENDING,
        ]);

        return response()->json([
            'message' => 'Your complaint has been submitted successfully. The team will review it soon.',
            'complaint' => $complaint,
        ], 201);
    }

    /**
     * Get complaints submitted by the authenticated student for a specific course.
     */
    public function getStudentCourseComplaints(Request $request, $courseId): JsonResponse
    {
        CourseComplaint::ensureTableExists();

        $user = $request->user();

        $complaints = CourseComplaint::where('course_id', $courseId)
            ->where('user_id', $user->id)
            ->latest('id')
            ->get();

        return response()->json([
            'complaints' => $complaints,
        ]);
    }

    /**
     * Get courses for Admin & Teacher Complain Box.
     * Teacher only sees courses they teach. Admin sees all courses.
     */
    public function getCoursesWithComplaints(Request $request): JsonResponse
    {
        CourseComplaint::ensureTableExists();

        $user = $request->user();
        $isAdmin = $user->isAdmin();

        $query = Course::query();

        if (! $isAdmin) {
            // Teacher: only courses assigned to this teacher
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
            ->withCount([
                'complaints',
                'complaints as pending_complaints_count' => function ($q) {
                    $q->where('status', CourseComplaint::STATUS_PENDING);
                },
                'complaints as resolved_complaints_count' => function ($q) {
                    $q->where('status', CourseComplaint::STATUS_RESOLVED);
                },
            ])
            ->orderByDesc('complaints_count')
            ->latest('id')
            ->get();

        return response()->json([
            'courses' => $courses,
            'is_admin' => $isAdmin,
        ]);
    }

    /**
     * Get complaints for a specific course.
     * Anonymity rule: If user is Teacher, student identity is ANONYMOUS.
     * If user is Admin, student identity is VISIBLE.
     */
    public function getCourseComplaints(Request $request, $courseId): JsonResponse
    {
        CourseComplaint::ensureTableExists();

        $user = $request->user();
        $isAdmin = $user->isAdmin();

        $course = Course::findOrFail($courseId);

        // Authorization check: Admin or assigned Teacher
        if (! $isAdmin && ! $course->isAssignedTeacher($user->id)) {
            return response()->json([
                'message' => 'You do not have permission to view complaints for this course.',
            ], 403);
        }

        $complaintsQuery = CourseComplaint::where('course_id', $course->id)
            ->with(['user:id,name,phone,email,registration_number'])
            ->latest('id');

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $complaintsQuery->where('status', $request->input('status'));
        }

        $rawComplaints = $complaintsQuery->get();

        // Format and apply anonymity rules
        $formattedComplaints = $rawComplaints->map(function ($c) use ($isAdmin) {
            $studentData = [];

            if ($isAdmin) {
                // Admin can see student information
                $studentData = [
                    'id' => $c->user?->id,
                    'name' => $c->user?->name ?? 'Registered Student',
                    'phone' => $c->user?->phone,
                    'email' => $c->user?->email,
                    'registration_number' => $c->user?->registration_number,
                    'is_anonymous' => false,
                ];
            } else {
                // Teacher: student is strictly anonymous
                $studentData = [
                    'id' => null,
                    'name' => 'Anonymous Student',
                    'phone' => null,
                    'email' => null,
                    'registration_number' => null,
                    'is_anonymous' => true,
                ];
            }

            return [
                'id' => $c->id,
                'course_id' => $c->course_id,
                'subject' => $c->subject,
                'message' => $c->message,
                'status' => $c->status,
                'admin_notes' => $c->admin_notes,
                'resolved_at' => $c->resolved_at?->toIso8601String(),
                'created_at' => $c->created_at->toIso8601String(),
                'student' => $studentData,
            ];
        });

        return response()->json([
            'course' => [
                'id' => $course->id,
                'title' => $course->title,
                'slug' => $course->slug,
                'thumbnail' => $course->thumbnail,
            ],
            'complaints' => $formattedComplaints,
            'is_admin' => $isAdmin,
        ]);
    }

    /**
     * Update complaint status (Pending, Reviewed, Resolved).
     */
    public function updateStatus(Request $request, $complaintId): JsonResponse
    {
        CourseComplaint::ensureTableExists();

        $user = $request->user();
        $isAdmin = $user->isAdmin();

        $complaint = CourseComplaint::findOrFail($complaintId);
        $course = $complaint->course;

        if (! $isAdmin && ! $course->isAssignedTeacher($user->id)) {
            return response()->json([
                'message' => 'You do not have permission to update this complaint.',
            ], 403);
        }

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:pending,reviewed,resolved'],
            'admin_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $updateData = [
            'status' => $validated['status'],
        ];

        if ($validated['status'] === CourseComplaint::STATUS_RESOLVED && ! $complaint->resolved_at) {
            $updateData['resolved_at'] = now();
        }

        if ($isAdmin && isset($validated['admin_notes'])) {
            $updateData['admin_notes'] = $validated['admin_notes'];
        }

        $complaint->update($updateData);

        return response()->json([
            'message' => 'Complaint status updated successfully.',
            'complaint' => $complaint->fresh(),
        ]);
    }
}
