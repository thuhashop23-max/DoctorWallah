<?php

use App\Http\Controllers\Api\AdminCategoryController;
use App\Http\Controllers\Api\AdminCourseController;
use App\Http\Controllers\Api\AdminAccessKeyController;
use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CourseBuilderController;
use App\Http\Controllers\Api\EnrollmentController;
use App\Http\Controllers\Api\LessonAttachmentController;
use App\Http\Controllers\Api\LessonCommentController;
use App\Http\Controllers\Api\MediaController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\AdminPageController;
use App\Http\Controllers\Api\PublicPageController;
use App\Http\Controllers\Api\OtpController;
use App\Http\Controllers\Api\PublicCourseController;
use App\Http\Controllers\Api\SmsMarketingController;
use App\Http\Controllers\Api\SmsSettingsController;
use App\Http\Controllers\Api\WebsiteSettingsController;
use App\Http\Controllers\Api\NexPilotAdminController;
use App\Http\Controllers\Api\NexPilotStudentController;
use App\Http\Controllers\Api\ExamController;
use App\Http\Controllers\Api\ExamBuilderController;
use App\Http\Controllers\Api\ExamSubmissionController;
use App\Http\Controllers\Api\AffiliateAdminController;
use App\Http\Controllers\Api\AffiliateStudentController;
use App\Http\Controllers\Api\TeacherPublicController;
use App\Http\Controllers\Api\AutoSmsPushController;
use App\Http\Controllers\Api\AdminBundleController;
use App\Http\Controllers\Api\AiExamQuestionController;
use App\Http\Controllers\Api\AdminCouponController;
use App\Http\Controllers\Api\CouponValidationController;
use App\Http\Controllers\Api\AdminDynamicOfferController;
use App\Http\Controllers\Api\DynamicOfferController;
use App\Http\Controllers\Api\AnnouncementController;
use App\Http\Controllers\Api\RoutineController;
use App\Http\Controllers\Api\LiveClassController;
use App\Http\Controllers\Api\ShurjopayController;
use App\Http\Controllers\Api\VdoCipherController;
use App\Http\Controllers\Api\AdminRoleController;
use App\Http\Controllers\Api\AdminManualEnrollmentController;
use App\Http\Controllers\Api\AdminPointController;
use App\Http\Controllers\Api\RewardTopicController;
use App\Http\Controllers\Api\EarnPointController;
use App\Http\Controllers\Api\CourseComplaintController;
use App\Http\Controllers\Api\LessonReviewController;
use App\Models\Course;
use App\Models\LessonComment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/
Route::post('auth/login', [AuthController::class, 'login']);
Route::post('auth/register', [AuthController::class, 'register']);
Route::post('auth/otp/verify', [OtpController::class, 'verify']);
Route::post('auth/otp/resend', [OtpController::class, 'resend']);
Route::post('auth/forgot-password/send-otp', [AuthController::class, 'forgotPasswordSendOtp']);
Route::post('auth/forgot-password/verify-otp', [AuthController::class, 'forgotPasswordVerifyOtp']);
Route::post('auth/forgot-password/reset', [AuthController::class, 'forgotPasswordReset']);

Route::get('courses', [PublicCourseController::class, 'index']);
Route::get('courses/{slug}', [PublicCourseController::class, 'show']);
Route::get('categories', [PublicCourseController::class, 'categories']);
Route::get('bundles/featured', [AdminBundleController::class, 'publicBundles']);
Route::get('settings', [WebsiteSettingsController::class, 'getSettings']);
Route::get('pages/{slug}', [PublicPageController::class, 'show']);
Route::get('affiliate/check-code/{code}', [AffiliateStudentController::class, 'checkCode']);
Route::get('teachers/featured', [TeacherPublicController::class, 'getFeaturedTeachers']);
Route::get('teachers/{id}', [TeacherPublicController::class, 'getTeacherProfile']);
Route::get('instructors/{id}', [TeacherPublicController::class, 'getTeacherProfile']);
Route::get('testimonials/marquee', [PublicCourseController::class, 'marqueeReviews']);

Route::get('sync-medical-home', function(\Illuminate\Http\Request $request) {
    if ($request->query('key') !== 'DWMedicalSync2026') {
        return response()->json(['error' => 'Unauthorized'], 403);
    }
    $page = \App\Models\Page::where('slug', 'home')->first();
    if (!$page) {
        $page = new \App\Models\Page();
        $page->title = 'Home';
        $page->slug = 'home';
        $page->is_published = true;
    }
    $page->meta_title = 'DoctorWallah | Bangladesh’s #1 MBBS Online Learning Platform';
    $page->meta_description = 'Comprehensive preparation for MBBS First Phase, Cards, Terms, and 1st Prof with dissection videos and marked standard books.';
    $page->blocks = \App\Models\Page::defaultHomeBlocks();
    $page->save();

    return response()->json([
        'success' => true,
        'message' => 'Home page updated to MBBS medical theme successfully!',
        'blocks_count' => count($page->blocks),
    ]);
});

// Public Earn Points
Route::prefix('earn-points')->group(function () {
    Route::get('courses', [EarnPointController::class, 'getCourses']);
    Route::get('courses/{course}/topics', [EarnPointController::class, 'getCourseTopics']);
    Route::get('topics/{topic}/approved-notes', [EarnPointController::class, 'getApprovedNotes']);
});

// shurjoPay Public Redirect Callback & Cancel
Route::match(['get', 'post'], 'payment/shurjopay/callback', [ShurjopayController::class, 'callback']);
Route::match(['get', 'post'], 'payment/shurjopay/cancel', [ShurjopayController::class, 'cancel']);

// Public/Token-aware Attachment Download & Redirect
Route::get('exams/csv-template', [ExamBuilderController::class, 'downloadCsvTemplate']);
Route::get('learning/attachments/{attachment}/download', [LessonAttachmentController::class, 'download']);

// Cart & Public Coupon / Dynamic Offer Validation (Guest & Student Friendly)
Route::post('coupons/validate', [CouponValidationController::class, 'validateCoupon']);
Route::get('dynamic-offers/active', [DynamicOfferController::class, 'getActiveOffers']);
Route::post('dynamic-offers/evaluate', [DynamicOfferController::class, 'evaluate']);

// Order Status & Receipt Lookup (Public / Student Friendly)
Route::get('orders/status/{orderNumber}', [OrderController::class, 'getOrderByNumber']);

/*
|--------------------------------------------------------------------------
| Protected Routes (Authenticated via Sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    // Auth profile & devices
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::put('user/profile', [AuthController::class, 'updateProfile']);
    Route::put('user/change-password', [AuthController::class, 'changePassword']);
    Route::get('user/devices', [AuthController::class, 'getDevices']);
    Route::delete('user/devices/{id}', [AuthController::class, 'revokeDevice']);
    Route::post('user/devices/logout-others', [AuthController::class, 'logoutOtherDevices']);

    // Notifications
    Route::get('notifications', [NotificationController::class, 'index']);
    Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('notifications/read-all', [NotificationController::class, 'markAllAsRead']);

    // Enrollments & Learning
    Route::post('courses/{course}/enroll-free', [EnrollmentController::class, 'enrollFree']);
    Route::get('student/my-courses', [EnrollmentController::class, 'myCourses']);
    Route::get('learning/{course}/first-lesson', [EnrollmentController::class, 'getFirstLesson']);
    Route::get('learning/{course}/lessons/{lesson}', [EnrollmentController::class, 'getLesson']);
    Route::post('learning/lessons/{lesson}/progress', [EnrollmentController::class, 'toggleProgress']);
    Route::get('learning/lessons/{lesson}/vdocipher-otp', [VdoCipherController::class, 'getOtp']);

    // Lesson Discussion & Comments
    Route::get('learning/lessons/{lesson}/comments', [LessonCommentController::class, 'index']);
    Route::post('learning/lessons/{lesson}/comments', [LessonCommentController::class, 'store']);
    Route::post('learning/comments/{comment}/reply', [LessonCommentController::class, 'reply']);

    // Class Rating & Reviews
    Route::get('learning/lessons/{lesson}/reviews', [LessonReviewController::class, 'getLessonReviews']);
    Route::post('learning/lessons/{lesson}/reviews', [LessonReviewController::class, 'submitLessonReview']);

    // Orders & Checkout
    Route::post('orders/checkout', [OrderController::class, 'checkout']);
    Route::post('orders/shurjopay/checkout', [ShurjopayController::class, 'initiate']);
    Route::get('orders/my-orders', [OrderController::class, 'myOrders']);
    Route::post('coupons/validate', [CouponValidationController::class, 'validateCoupon']);
    Route::get('dynamic-offers/active', [DynamicOfferController::class, 'getActiveOffers']);
    Route::post('dynamic-offers/evaluate', [DynamicOfferController::class, 'evaluate']);

    // NexPilot Student Learning Room & Chatbot
    Route::prefix('student/nexpilot')->group(function () {
        Route::get('courses/{courseId}', [NexPilotStudentController::class, 'getPilotForCourse']);
        Route::get('topics/{topicId}/history', [NexPilotStudentController::class, 'getTopicChatHistory']);
        Route::post('topics/{topicId}/chat', [NexPilotStudentController::class, 'sendMessage']);
        Route::post('courses/{courseId}/unlock', [NexPilotStudentController::class, 'unlockPilotForEnrolledCourse']);
    });

    // Student Exam Taking & Review Routes
    Route::get('student/leaderboard', [ExamSubmissionController::class, 'studentLeaderboard']);
    Route::prefix('student/exams')->group(function () {
        Route::get('available', [ExamSubmissionController::class, 'studentAvailableExams']);
        Route::get('my-exams', [ExamSubmissionController::class, 'studentMyExams']);
        Route::get('leaderboard', [ExamSubmissionController::class, 'studentLeaderboard']);
        Route::get('submissions/{submission}', [ExamSubmissionController::class, 'studentSubmissionReview']);
        Route::get('{exam}/start', [ExamSubmissionController::class, 'studentStartExam']);
        Route::post('{exam}/submit', [ExamSubmissionController::class, 'studentSubmitExam']);
        Route::post('upload-attachment', [ExamSubmissionController::class, 'uploadAnswerAttachment']);
    });

    // Student Live Classes & Real-Time Q&A
    Route::prefix('student/live-classes')->group(function () {
        Route::get('/', [LiveClassController::class, 'studentLiveClasses']);
        Route::get('{liveClass}', [LiveClassController::class, 'studentShow']);
        Route::get('{liveClass}/comments', [LiveClassController::class, 'getComments']);
        Route::post('{liveClass}/comments', [LiveClassController::class, 'storeComment']);
    });

    // Student Unified Routine (Live Classes & Live Exams)
    Route::get('student/routine', [RoutineController::class, 'studentRoutine']);

    // Student Earn Points & Rewards
    Route::prefix('student/earn-points')->group(function () {
        Route::post('topics/{topic}/submit', [EarnPointController::class, 'submitNote']);
        Route::get('my-submissions', [EarnPointController::class, 'getMySubmissions']);
        Route::get('my-points-history', [EarnPointController::class, 'getMyPointsHistory']);
    });

    // Student Course Complaints (Complain Box)
    Route::post('student/complaints', [CourseComplaintController::class, 'submitComplaint']);
    Route::get('student/courses/{courseId}/complaints', [CourseComplaintController::class, 'getStudentCourseComplaints']);

    // Complain Box Management (Admin & Teacher)
    Route::prefix('complaints')->middleware('role:teacher,admin')->group(function () {
        Route::get('courses', [CourseComplaintController::class, 'getCoursesWithComplaints']);
        Route::get('courses/{courseId}', [CourseComplaintController::class, 'getCourseComplaints']);
        Route::put('{complaintId}/status', [CourseComplaintController::class, 'updateStatus']);
    });

    // Class Reviews & Performance Analytics (Admin & Teacher)
    Route::prefix('class-reviews')->middleware('role:teacher,admin')->group(function () {
        Route::get('courses', [LessonReviewController::class, 'getCoursesForReviews']);
        Route::get('courses/{course}', [LessonReviewController::class, 'getCourseClassReviews']);
        Route::delete('{id}', [LessonReviewController::class, 'deleteReview']);
    });

    // Student Affiliate Program
    Route::prefix('student/affiliate')->group(function () {
        Route::get('status', [AffiliateStudentController::class, 'getStatus']);
        Route::post('apply', [AffiliateStudentController::class, 'apply']);
        Route::post('payout-account', [AffiliateStudentController::class, 'updatePayoutAccount']);
        Route::post('request-payout', [AffiliateStudentController::class, 'requestPayout']);
    });

    // Exam Management (Admin & Teacher)
    Route::prefix('exams')->middleware('role:teacher,admin')->group(function () {
        Route::get('/', [ExamController::class, 'index']);
        Route::get('/courses-list', [ExamController::class, 'coursesList']);
        Route::post('/upload-attachment', [ExamSubmissionController::class, 'uploadAnswerAttachment']);
        Route::post('/', [ExamController::class, 'store']);
        Route::get('/{exam}', [ExamController::class, 'show']);
        Route::put('/{exam}', [ExamController::class, 'update']);
        Route::delete('/{exam}', [ExamController::class, 'destroy']);
        Route::post('/{id}/restore', [ExamController::class, 'restore']);
        Route::delete('/{id}/force-delete', [ExamController::class, 'forceDelete']);

        // Exam Builder
        Route::get('/{exam}/questions', [ExamBuilderController::class, 'getQuestions']);
        Route::post('/{exam}/questions', [ExamBuilderController::class, 'storeQuestion']);
        Route::put('/{exam}/questions/{question}', [ExamBuilderController::class, 'updateQuestion']);
        Route::delete('/{exam}/questions/{question}', [ExamBuilderController::class, 'deleteQuestion']);
        Route::post('/{exam}/questions/reorder', [ExamBuilderController::class, 'reorderQuestions']);
        Route::post('/questions/upload-attachment', [ExamBuilderController::class, 'uploadAttachment']);
        Route::post('/{exam}/import-csv', [ExamBuilderController::class, 'importCsv']);

        // AI Question Generation & Import
        Route::post('/{exam}/ai/generate-questions', [AiExamQuestionController::class, 'generateQuestions']);
        Route::post('/{exam}/ai/import-questions', [AiExamQuestionController::class, 'importQuestions']);

        // Submissions & Evaluation
        Route::get('/{exam}/submissions', [ExamSubmissionController::class, 'getSubmissions']);
        Route::get('/{exam}/submissions/{submission}', [ExamSubmissionController::class, 'getSubmissionDetails']);
        Route::post('/{exam}/submissions/{submission}/evaluate', [ExamSubmissionController::class, 'evaluateSubmission']);
    });

    // Announcements & Student Notifications (Admin & Teacher)
    Route::prefix('announcements')->middleware('role:teacher,admin')->group(function () {
        Route::get('options', [AnnouncementController::class, 'options']);
        Route::post('notify-students', [AnnouncementController::class, 'notifyStudents']);
        Route::get('history', [AnnouncementController::class, 'history']);
    });

    // Course Builder (Accessible to Admin & Assigned Teachers)
    Route::prefix('builder')->group(function () {
        Route::get('{course}/curriculum', [CourseBuilderController::class, 'getCurriculum']);
        Route::post('{course}/sections', [CourseBuilderController::class, 'storeSection']);
        Route::put('sections/{section}', [CourseBuilderController::class, 'updateSection']);
        Route::delete('sections/{section}', [CourseBuilderController::class, 'deleteSection']);
        Route::post('{course}/reorder-sections', [CourseBuilderController::class, 'reorderSections']);

        Route::post('sections/{section}/lessons', [CourseBuilderController::class, 'storeLesson']);
        Route::put('lessons/{lesson}', [CourseBuilderController::class, 'updateLesson']);
        Route::delete('lessons/{lesson}', [CourseBuilderController::class, 'deleteLesson']);
        Route::post('sections/{section}/reorder-lessons', [CourseBuilderController::class, 'reorderLessons']);
        Route::post('lessons/{lesson}/duplicate', [CourseBuilderController::class, 'duplicateLesson']);

        Route::post('lessons/{lesson}/attachments', [LessonAttachmentController::class, 'upload']);
        Route::post('lessons/{lesson}/attachments/link', [LessonAttachmentController::class, 'storeLink']);
        Route::delete('attachments/{attachment}', [LessonAttachmentController::class, 'delete']);

        // Course Attached Exams
        Route::get('{course}/exams', [CourseBuilderController::class, 'getCourseExams']);
        Route::post('{course}/exams', [CourseBuilderController::class, 'attachExam']);
        Route::post('{course}/exams/create', [CourseBuilderController::class, 'storeCourseExam']);
        Route::put('{course}/exams/{exam}', [CourseBuilderController::class, 'updateCourseExam']);
        Route::delete('{course}/exams/{exam}', [CourseBuilderController::class, 'detachExam']);

        // Course Live Classes
        Route::get('{course}/live-classes', [LiveClassController::class, 'index']);
        Route::post('{course}/live-classes', [LiveClassController::class, 'store']);
        Route::put('{course}/live-classes/{liveClass}', [LiveClassController::class, 'update']);
        Route::delete('{course}/live-classes/{liveClass}', [LiveClassController::class, 'destroy']);
        Route::patch('{course}/live-classes/{liveClass}/status', [LiveClassController::class, 'toggleStatus']);

        // Course Unified Routine
        Route::get('{course}/routine', [RoutineController::class, 'getCourseRoutine']);
        Route::post('{course}/routine/items', [RoutineController::class, 'storeRoutineItem']);
        Route::put('{course}/routine/items/{routine}', [RoutineController::class, 'updateRoutineItem']);
        Route::delete('{course}/routine/items/{routine}', [RoutineController::class, 'deleteRoutineItem']);

        // Course Custom Buttons & Outline
        Route::get('{course}/custom-buttons', [CourseBuilderController::class, 'getCustomButtons']);
        Route::put('{course}/custom-buttons', [CourseBuilderController::class, 'updateCustomButtons']);
        Route::post('{course}/upload-button-file', [CourseBuilderController::class, 'uploadButtonFile']);

        // Course Reward Topics & Submissions (Builder)
        Route::get('{course}/reward-topics', [RewardTopicController::class, 'getCourseTopics']);
        Route::post('{course}/reward-topics', [RewardTopicController::class, 'storeTopic']);
        Route::put('reward-topics/{topic}', [RewardTopicController::class, 'updateTopic']);
        Route::delete('reward-topics/{topic}', [RewardTopicController::class, 'deleteTopic']);
        Route::get('reward-topics/{topic}/submissions', [RewardTopicController::class, 'getTopicSubmissions']);
        Route::post('reward-submissions/{submission}/review', [RewardTopicController::class, 'reviewSubmission']);
    });

    // Direct VdoCipher upload credentials for Course Builder (admin & teacher)
    Route::post('vdocipher/upload-credentials', [VdoCipherController::class, 'getUploadCredentials']);
    Route::post('admin/vdocipher/upload-credentials', [VdoCipherController::class, 'getUploadCredentials']);
    Route::post('vdocipher/upload-proxy', [VdoCipherController::class, 'uploadProxy']);

    // VdoCipher settings aliases (both /api/settings/vdocipher and /api/admin/settings/vdocipher)
    Route::prefix('settings/vdocipher')->middleware('role:admin')->group(function () {
        Route::get('/', [VdoCipherController::class, 'getSettings']);
        Route::put('/', [VdoCipherController::class, 'updateSettings']);
        Route::post('test-connection', [VdoCipherController::class, 'testConnection']);
    });

    // Teacher Specific Routes
    Route::prefix('teacher')->middleware('role:teacher,admin')->group(function () {
        Route::get('my-courses', function (Request $request) {
            \App\Models\Course::ensureCourseInstructorsTableExists();
            $user = $request->user();

            // 1. Courses taught / assigned to this teacher
            $teachingCourses = Course::where(function ($query) use ($user) {
                $query->whereHas('instructors', function ($q) use ($user) {
                    $q->where('users.id', $user->id);
                })
                ->orWhere('instructor_id', $user->id);
            })
            ->with(['instructors:id,name', 'instructor:id,name'])
            ->withCount(['lessons', 'enrollments'])
            ->latest()
            ->get();

            $teachingIds = $teachingCourses->pluck('id')->toArray();

            $formattedTeachingCourses = $teachingCourses->map(function ($course) {
                $arr = $course->toArray();
                $arr['is_assigned_teacher'] = true;
                $arr['role_in_course'] = 'instructor';
                $arr['can_manage_builder'] = true;
                return $arr;
            });

            // 2. Courses where teacher is enrolled as a student (excluding courses they instruct)
            $enrollments = $user->enrollments()
                ->where('status', \App\Models\Enrollment::STATUS_ACTIVE)
                ->whereNotIn('course_id', $teachingIds)
                ->with(['course' => function ($q) {
                    $q->with(['instructors:id,name', 'instructor:id,name', 'nexpilot:id,course_id,title,price,is_active'])
                      ->withCount(['lessons', 'enrollments']);
                }])
                ->latest('enrolled_at')
                ->get();

            $enrolledCourses = $enrollments->map(function ($enrollment) use ($user) {
                $course = $enrollment->course;
                if (!$course) {
                    return null;
                }

                $totalLessons = (int) ($course->lessons_count ?? 0);
                $completedCount = \App\Models\LessonProgress::where('user_id', $user->id)
                    ->where('course_id', $course->id)
                    ->where('is_completed', true)
                    ->count();

                $percentage = $totalLessons > 0 ? (int) round(($completedCount / $totalLessons) * 100) : 0;

                $lastAccessed = \App\Models\LessonProgress::where('user_id', $user->id)
                    ->where('course_id', $course->id)
                    ->latest('last_accessed_at')
                    ->first();

                $firstLesson = $course->lessons()->orderBy('sort_order')->first();

                $arr = $course->toArray();
                $arr['is_assigned_teacher'] = false;
                $arr['role_in_course'] = 'student';
                $arr['can_manage_builder'] = false;
                $arr['enrolled_at'] = $enrollment->enrolled_at ? $enrollment->enrolled_at->toIso8601String() : null;
                $arr['access_key'] = $enrollment->access_key;
                $arr['total_lessons'] = $totalLessons;
                $arr['completed_lessons'] = $completedCount;
                $arr['progress_percentage'] = $percentage;
                $arr['last_lesson_id'] = $lastAccessed ? $lastAccessed->lesson_id : optional($firstLesson)->id;

                return $arr;
            })->filter()->values();

            $allCourses = $formattedTeachingCourses->concat($enrolledCourses)->values();

            return response()->json($allCourses);
        });

        Route::get('student-questions', function (Request $request) {
            $user = $request->user();
            $courseIds = Course::whereHas('instructors', function ($q) use ($user) {
                $q->where('users.id', $user->id);
            })
            ->orWhere('instructor_id', $user->id)
            ->pluck('id');

            $questions = LessonComment::whereNull('parent_id')
                ->whereHas('lesson', function ($q) use ($courseIds) {
                    $q->whereIn('course_id', $courseIds);
                })
                ->with(['lesson:id,title,course_id', 'lesson.course:id,title', 'user:id,name', 'replies.user:id,name'])
                ->latest()
                ->paginate(15);

            return response()->json($questions);
        });
    });

    // Admin Specific Routes
    Route::prefix('admin')->middleware('role:admin')->group(function () {
        // Course Management
        Route::get('courses', [AdminCourseController::class, 'index']);
        Route::post('courses', [AdminCourseController::class, 'store']);
        Route::get('courses/{course}', [AdminCourseController::class, 'show']);
        Route::put('courses/{course}', [AdminCourseController::class, 'update']);
        Route::delete('courses/{course}', [AdminCourseController::class, 'destroy']);
        Route::post('courses/{id}/restore', [AdminCourseController::class, 'restore']);
        Route::delete('courses/{id}/force-delete', [AdminCourseController::class, 'forceDelete']);
        Route::get('teachers-list', [AdminCourseController::class, 'teachersList']);

        // Course Category Management
        Route::get('categories', [AdminCategoryController::class, 'index']);
        Route::post('categories', [AdminCategoryController::class, 'store']);
        Route::put('categories/{category}', [AdminCategoryController::class, 'update']);
        Route::delete('categories/{category}', [AdminCategoryController::class, 'destroy']);

        // Manual Enrollment
        Route::prefix('manual-enrollment')->group(function () {
            Route::get('targets', [AdminManualEnrollmentController::class, 'targets']);
            Route::get('courses', [AdminManualEnrollmentController::class, 'courses']);
            Route::get('search-users', [AdminManualEnrollmentController::class, 'searchUsers']);
            Route::post('lookup-phones', [AdminManualEnrollmentController::class, 'lookupPhones']);
            Route::post('enroll', [AdminManualEnrollmentController::class, 'enroll']);
            Route::get('history', [AdminManualEnrollmentController::class, 'history']);
            Route::get('targets/{type}/{id}/students', [AdminManualEnrollmentController::class, 'getTargetStudents']);
            Route::delete('enrollment/{id}', [AdminManualEnrollmentController::class, 'removeEnrollment']);
            Route::post('bulk-remove', [AdminManualEnrollmentController::class, 'bulkRemove']);
        });

        // Course Access Keys Management & Student Verification
        Route::prefix('access-keys')->group(function () {
            Route::get('courses', [AdminAccessKeyController::class, 'courses']);
            Route::get('courses/{courseId}', [AdminAccessKeyController::class, 'courseStudents']);
            Route::match(['get', 'post'], 'verify', [AdminAccessKeyController::class, 'verify']);
            Route::post('{enrollmentId}/regenerate', [AdminAccessKeyController::class, 'regenerate']);
        });

        // User Management
        Route::get('users', [AdminUserController::class, 'index']);
        Route::post('users', [AdminUserController::class, 'store']);
        Route::get('users/{user}', [AdminUserController::class, 'show']);
        Route::match(['put', 'post'], 'users/{user}', [AdminUserController::class, 'update']);
        Route::post('users/{user}/avatar', [AdminUserController::class, 'updateAvatar']);
        Route::post('users/{user}/role', [AdminUserController::class, 'changeRole']);
        Route::post('users/{user}/status', [AdminUserController::class, 'toggleStatus']);
        Route::put('users/{user}/teacher-profile', [AdminUserController::class, 'updateTeacherProfile']);
        Route::delete('users/{user}', [AdminUserController::class, 'destroy']);

        // Custom Roles & Permissions (RBAC)
        Route::get('roles', [AdminRoleController::class, 'index']);
        Route::get('roles/permissions-catalog', [AdminRoleController::class, 'permissionCatalog']);
        Route::post('roles', [AdminRoleController::class, 'store']);
        Route::get('roles/{role}', [AdminRoleController::class, 'show']);
        Route::put('roles/{role}', [AdminRoleController::class, 'update']);
        Route::delete('roles/{role}', [AdminRoleController::class, 'destroy']);

        // Order Management
        Route::get('orders', [OrderController::class, 'index']);
        Route::post('orders/{order}/confirm-payment', [OrderController::class, 'confirmPayment']);
        Route::post('orders/{order}/reject-payment', [OrderController::class, 'rejectPayment']);

        // Analytics
        Route::get('analytics', [AnalyticsController::class, 'getStats']);

        // SMS Settings & Configuration
        Route::get('sms-settings', [SmsSettingsController::class, 'getSettings']);
        Route::put('sms-settings', [SmsSettingsController::class, 'updateSettings']);
        Route::post('sms-settings/test', [SmsSettingsController::class, 'testSms']);
        Route::get('sms/gateway-condition', [SmsSettingsController::class, 'getGatewayCondition']);
        Route::get('sms/balance', [SmsSettingsController::class, 'getBalance']);

        // Auto SMS Push on Course Purchase
        Route::get('sms/auto-push', [AutoSmsPushController::class, 'getSettings']);
        Route::put('sms/auto-push/settings', [AutoSmsPushController::class, 'updateGeneralSettings']);
        Route::post('sms/auto-push/courses', [AutoSmsPushController::class, 'saveCourseTemplate']);
        Route::delete('sms/auto-push/courses/{template}', [AutoSmsPushController::class, 'deleteCourseTemplate']);
        Route::post('sms/auto-push/test', [AutoSmsPushController::class, 'sendTestSms']);

        // Course Bundles & Bundle Builder
        Route::get('bundles', [AdminBundleController::class, 'index']);
        Route::post('bundles', [AdminBundleController::class, 'store']);
        Route::get('bundles/{bundle}', [AdminBundleController::class, 'show']);
        Route::put('bundles/{bundle}', [AdminBundleController::class, 'update']);
        Route::delete('bundles/{bundle}', [AdminBundleController::class, 'destroy']);
        Route::post('bundles/{id}/restore', [AdminBundleController::class, 'restore']);
        Route::delete('bundles/{id}/force-delete', [AdminBundleController::class, 'forceDelete']);
        Route::post('bundles/{bundle}/courses', [AdminBundleController::class, 'addCourse']);
        Route::delete('bundles/{bundle}/courses/{course}', [AdminBundleController::class, 'removeCourse']);
        Route::post('bundles/{bundle}/courses/reorder', [AdminBundleController::class, 'reorderCourses']);
        Route::get('bundles/{bundle}/available-courses', [AdminBundleController::class, 'availableCourses']);

        // SMS Marketing
        Route::get('sms-marketing/courses', [SmsMarketingController::class, 'getCourses']);
        Route::post('sms-marketing/preview', [SmsMarketingController::class, 'getPreview']);
        Route::post('sms-marketing/send', [SmsMarketingController::class, 'sendMarketingSms']);
        Route::get('sms-marketing/history', [SmsMarketingController::class, 'getHistory']);

        // Marketing: Coupons Management
        Route::get('coupons', [AdminCouponController::class, 'index']);
        Route::post('coupons', [AdminCouponController::class, 'store']);
        Route::get('coupons/search-users', [AdminCouponController::class, 'searchUsers']);
        Route::get('coupons/courses-and-categories', [AdminCouponController::class, 'getCoursesAndCategories']);
        Route::get('coupons/{id}', [AdminCouponController::class, 'show']);
        Route::put('coupons/{id}', [AdminCouponController::class, 'update']);
        Route::delete('coupons/{id}', [AdminCouponController::class, 'destroy']);
        Route::post('coupons/{id}/restore', [AdminCouponController::class, 'restore']);
        Route::delete('coupons/{id}/force-delete', [AdminCouponController::class, 'forceDelete']);
        Route::post('coupons/{id}/toggle-status', [AdminCouponController::class, 'toggleStatus']);

        // Marketing: Dynamic Offer Builder
        Route::get('dynamic-offers', [AdminDynamicOfferController::class, 'index']);
        Route::post('dynamic-offers', [AdminDynamicOfferController::class, 'store']);
        Route::get('dynamic-offers/courses-and-categories', [AdminDynamicOfferController::class, 'getCoursesAndCategories']);
        Route::get('dynamic-offers/{id}', [AdminDynamicOfferController::class, 'show']);
        Route::put('dynamic-offers/{id}', [AdminDynamicOfferController::class, 'update']);
        Route::delete('dynamic-offers/{id}', [AdminDynamicOfferController::class, 'destroy']);
        Route::post('dynamic-offers/{id}/toggle-status', [AdminDynamicOfferController::class, 'toggleStatus']);

        // Aliases with admin/ prefix for dynamic offers
        Route::get('admin/dynamic-offers', [AdminDynamicOfferController::class, 'index']);
        Route::post('admin/dynamic-offers', [AdminDynamicOfferController::class, 'store']);
        Route::get('admin/dynamic-offers/courses-and-categories', [AdminDynamicOfferController::class, 'getCoursesAndCategories']);
        Route::get('admin/dynamic-offers/{id}', [AdminDynamicOfferController::class, 'show']);
        Route::put('admin/dynamic-offers/{id}', [AdminDynamicOfferController::class, 'update']);
        Route::delete('admin/dynamic-offers/{id}', [AdminDynamicOfferController::class, 'destroy']);
        Route::post('admin/dynamic-offers/{id}/toggle-status', [AdminDynamicOfferController::class, 'toggleStatus']);

        // Website Settings & Appearance (Header / Footer Builder / Manual Payment)
        Route::put('website-settings', [WebsiteSettingsController::class, 'updateSettings']);
        Route::put('website-settings/header', [WebsiteSettingsController::class, 'updateHeaderSettings']);
        Route::put('website-settings/footer', [WebsiteSettingsController::class, 'updateFooterSettings']);
        Route::put('website-settings/manual-payment', [WebsiteSettingsController::class, 'updateManualPaymentSettings']);

        // shurjoPay Integration Settings
        Route::prefix('payments/shurjopay')->group(function () {
            Route::get('/', [ShurjopayController::class, 'getSettings']);
            Route::put('/', [ShurjopayController::class, 'updateSettings']);
            Route::post('test-connection', [ShurjopayController::class, 'testConnection']);
        });

        // VdoCipher Configuration & Upload
        Route::prefix('settings/vdocipher')->group(function () {
            Route::get('/', [VdoCipherController::class, 'getSettings']);
            Route::put('/', [VdoCipherController::class, 'updateSettings']);
            Route::post('test-connection', [VdoCipherController::class, 'testConnection']);
        });
        Route::post('vdocipher/upload-credentials', [VdoCipherController::class, 'getUploadCredentials']);

        // Media Library
        Route::get('media', [MediaController::class, 'index']);
        Route::post('media', [MediaController::class, 'store']);
        Route::delete('media/{media}', [MediaController::class, 'destroy']);

        // Pages Management & Visual Page Builder
        Route::get('pages', [AdminPageController::class, 'index']);
        Route::post('pages', [AdminPageController::class, 'store']);
        Route::post('pages/sync-categories', [AdminPageController::class, 'syncCategories']);
        Route::get('pages/{id}', [AdminPageController::class, 'show']);
        Route::put('pages/{id}', [AdminPageController::class, 'update']);
        Route::delete('pages/{id}', [AdminPageController::class, 'destroy']);
        Route::post('pages/{id}/toggle-status', [AdminPageController::class, 'toggleStatus']);
        Route::post('pages/{id}/duplicate', [AdminPageController::class, 'duplicate']);
        Route::post('pages/{id}/reset-template', [AdminPageController::class, 'resetTemplate']);

        // AI Configuration (OpenAI Model Settings)
        Route::prefix('ai')->group(function () {
            Route::get('settings', [NexPilotAdminController::class, 'getSettings']);
            Route::match(['post', 'put'], 'settings', [NexPilotAdminController::class, 'updateSettings']);
            Route::post('test-connection', [NexPilotAdminController::class, 'testConnection']);
        });

        // NexPilot AI Management
        Route::prefix('nexpilot')->group(function () {
            Route::get('/', [NexPilotAdminController::class, 'index']);
            Route::get('courses', [NexPilotAdminController::class, 'getEligibleCourses']);
            Route::post('/', [NexPilotAdminController::class, 'store']);
            Route::get('settings', [NexPilotAdminController::class, 'getSettings']);
            Route::match(['post', 'put'], 'settings', [NexPilotAdminController::class, 'updateSettings']);
            Route::post('test-connection', [NexPilotAdminController::class, 'testConnection']);
            Route::post('upload-material', [NexPilotAdminController::class, 'uploadAttachment']);
            Route::get('{id}', [NexPilotAdminController::class, 'show']);
            Route::put('{id}', [NexPilotAdminController::class, 'update']);
            Route::delete('{id}', [NexPilotAdminController::class, 'destroy']);
            Route::get('{id}/builder', [NexPilotAdminController::class, 'getBuilderData']);
            Route::post('{id}/topics', [NexPilotAdminController::class, 'storeTopic']);
            Route::put('topics/{topicId}', [NexPilotAdminController::class, 'updateTopic']);
            Route::delete('topics/{topicId}', [NexPilotAdminController::class, 'destroyTopic']);
            Route::post('{id}/reorder-topics', [NexPilotAdminController::class, 'reorderTopics']);
            Route::get('{id}/students', [NexPilotAdminController::class, 'getEnrolledStudents']);
            Route::post('{id}/students/{enrollmentId}/toggle', [NexPilotAdminController::class, 'toggleStudentAccess']);
            Route::post('{id}/grant-all', [NexPilotAdminController::class, 'grantToAllStudents']);
        });

        // Affiliate Management
        Route::prefix('affiliate')->group(function () {
            Route::get('settings', [AffiliateAdminController::class, 'getGeneralSettings']);
            Route::put('settings', [AffiliateAdminController::class, 'updateGeneralSettings']);
            Route::get('courses', [AffiliateAdminController::class, 'getCourseSettings']);
            Route::put('courses/{course}', [AffiliateAdminController::class, 'updateCourseSetting']);
            Route::delete('courses/{course}', [AffiliateAdminController::class, 'deleteCourseSetting']);
            Route::get('affiliates', [AffiliateAdminController::class, 'getAffiliates']);
            Route::get('commissions', [AffiliateAdminController::class, 'getCommissions']);
            Route::get('payouts', [AffiliateAdminController::class, 'getPayouts']);
            Route::put('payouts/{payout}', [AffiliateAdminController::class, 'updatePayoutStatus']);
        });

        // Points Management & Rules
        Route::prefix('points')->group(function () {
            Route::get('settings', [AdminPointController::class, 'getSettings']);
            Route::put('settings', [AdminPointController::class, 'updateSettings']);
            Route::get('transactions', [AdminPointController::class, 'getTransactions']);
            Route::get('user-usages', [AdminPointController::class, 'getUserUsages']);
            Route::get('users/{id}/usages', [AdminPointController::class, 'getUserUsageDetails']);
            Route::post('adjust', [AdminPointController::class, 'adjustPoints']);
        });
    });
});

/*
|--------------------------------------------------------------------------
| Automated Deployment Webhook (CI/CD)
|--------------------------------------------------------------------------
| Triggered by GitHub Actions post-deploy to run migrations and refresh caches.
*/
Route::get('import-thuhashop-data', function (Request $request) {
    if ($request->query('key') !== 'DWInspect2026Secret') {
        return response()->json(['error' => 'Unauthorized'], 403);
    }

    try {
        @set_time_limit(300);
        $importer = new \App\Services\ThuhashopCourseImporter();
        $result = $importer->importAll();
        return response()->json($result);
    } catch (\Throwable $e) {
        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage(),
            'file' => $e->getFile() . ':' . $e->getLine(),
        ], 500);
    }
});

Route::get('inspect-thuhashop-students', function (Request $request) {
    if ($request->query('key') !== 'DWInspect2026Secret') {
        return response()->json(['error' => 'Unauthorized'], 403);
    }

    try {
        @set_time_limit(300);
        $importer = new \App\Services\ThuhashopStudentImporter();
        return response()->json($importer->inspect());
    } catch (\Throwable $e) {
        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage(),
            'file' => $e->getFile() . ':' . $e->getLine(),
        ], 500);
    }
});

Route::any('import-thuhashop-students', function (Request $request) {
    if ($request->query('key') !== 'DWInspect2026Secret') {
        return response()->json(['error' => 'Unauthorized'], 403);
    }

    try {
        @set_time_limit(600);
        $importer = new \App\Services\ThuhashopStudentImporter();
        return response()->json($importer->importStudents());
    } catch (\Throwable $e) {
        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage(),
            'file' => $e->getFile() . ':' . $e->getLine(),
        ], 500);
    }
});

Route::get('verify-imported-students', function (Request $request) {
    if ($request->query('key') !== 'DWInspect2026Secret') {
        return response()->json(['error' => 'Unauthorized'], 403);
    }

    try {
        $importer = new \App\Services\ThuhashopStudentImporter();
        return response()->json($importer->verifyImport());
    } catch (\Throwable $e) {
        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage(),
            'file' => $e->getFile() . ':' . $e->getLine(),
        ], 500);
    }
});

Route::post('deploy/post-update', function (Request $request) {
    $secret = env('DEPLOY_SECRET');
    if (!$secret || $request->header('X-Deploy-Secret') !== $secret) {
        return response()->json(['error' => 'Unauthorized'], 403);
    }

    try {
        \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
        $migrateOutput = \Illuminate\Support\Facades\Artisan::output();

        \Illuminate\Support\Facades\Artisan::call('optimize:clear');
        $clearOutput = \Illuminate\Support\Facades\Artisan::output();

        \Illuminate\Support\Facades\Artisan::call('config:cache');
        \Illuminate\Support\Facades\Artisan::call('route:cache');
        \Illuminate\Support\Facades\Artisan::call('view:cache');

        return response()->json([
            'status' => 'success',
            'message' => 'Migrations executed and cache optimized successfully',
            'migrate_output' => trim($migrateOutput),
            'clear_output' => trim($clearOutput),
            'timestamp' => now()->toIso8601String(),
        ]);
    } catch (\Throwable $e) {
        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage(),
        ], 500);
    }
});
