<?php

namespace Database\Seeders;

use App\Models\AuditLog;
use App\Models\Category;
use App\Models\Course;
use App\Models\CourseSection;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonAttachment;
use App\Models\LessonComment;
use App\Models\LessonProgress;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\SmsSetting;
use App\Models\User;
use App\Models\WebsiteSetting;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Admin User
        $admin = User::firstOrCreate(
            ['phone' => '+8801700000001'],
            [
                'name' => 'Admin User',
                'email' => 'admin@example.com',
                'password' => Hash::make('password123'),
                'role' => User::ROLE_ADMIN,
                'status' => User::STATUS_ACTIVE,
            ]
        );

        // 2. Create 3 Teachers
        $teacher1 = User::firstOrCreate(
            ['phone' => '+8801700000002'],
            [
                'name' => 'Dr. Rafiqul Islam (Physics Mentor)',
                'email' => 'teacher1@example.com',
                'password' => Hash::make('password123'),
                'role' => User::ROLE_TEACHER,
                'status' => User::STATUS_ACTIVE,
            ]
        );

        $teacher2 = User::firstOrCreate(
            ['phone' => '+8801700000003'],
            [
                'name' => 'Tanvir Ahmed (Chemistry Expert)',
                'email' => 'teacher2@example.com',
                'password' => Hash::make('password123'),
                'role' => User::ROLE_TEACHER,
                'status' => User::STATUS_ACTIVE,
            ]
        );

        $teacher3 = User::firstOrCreate(
            ['phone' => '+8801700000004'],
            [
                'name' => 'Nusrat Jahan (Math Specialist)',
                'email' => 'teacher3@example.com',
                'password' => Hash::make('password123'),
                'role' => User::ROLE_TEACHER,
                'status' => User::STATUS_ACTIVE,
            ]
        );

        // 3. Create 10 Students
        $students = [];
        $studentNames = [
            'Rahim Ullah', 'Karim Hossain', 'Ayesha Siddika', 'Shakib Al Hasan',
            'Fahim Chowdhury', 'Sumaiya Akter', 'Mahmudur Rahman', 'Tasnim Jerin',
            'Asif Mahmud', 'Rifat Islam'
        ];

        foreach ($studentNames as $idx => $name) {
            $num = str_pad((string) ($idx + 11), 2, '0', STR_PAD_LEFT);
            $students[] = User::firstOrCreate(
                ['phone' => "+88017000000{$num}"],
                [
                    'name' => $name,
                    'email' => "student{$num}@example.com",
                    'password' => Hash::make('password123'),
                    'role' => User::ROLE_STUDENT,
                    'status' => User::STATUS_ACTIVE,
                ]
            );
        }

        // 4. Categories
        $catFree = Category::firstOrCreate(['slug' => 'free-courses'], ['name' => 'Free Courses', 'description' => 'All open free courses']);
        $catPaid = Category::firstOrCreate(['slug' => 'paid-courses'], ['name' => 'Paid Courses', 'description' => 'Premium masterclass courses']);
        $catPhysics = Category::firstOrCreate(['slug' => 'hsc-physics'], ['name' => 'HSC Physics', 'description' => 'Physics 1st & 2nd Paper']);
        $catChem = Category::firstOrCreate(['slug' => 'hsc-chemistry'], ['name' => 'HSC Chemistry', 'description' => 'Chemistry 1st & 2nd Paper']);
        $catMath = Category::firstOrCreate(['slug' => 'higher-math'], ['name' => 'Higher Math', 'description' => 'Calculus and Algebra']);
        $catAdmission = Category::firstOrCreate(['slug' => 'admission'], ['name' => 'University Admission', 'description' => 'Engineering and Medical']);
        $catWeb = Category::firstOrCreate(['slug' => 'web-dev'], ['name' => 'Programming & ICT', 'description' => 'Web Development & Coding']);

        // 5. Course 1: HSC Physics Masterclass (Paid, Multi-Teacher: Teacher 1 & Teacher 2)
        $course1 = Course::firstOrCreate(
            ['slug' => 'hsc-physics-complete-masterclass'],
            [
                'instructor_id' => $teacher1->id,
                'title' => 'HSC Physics Complete Masterclass',
                'short_description' => 'From Vectors to Modern Physics: Concept Clearing, Mathematical Problems, and Full Lecture Sheets.',
                'description' => '<p>This course comprehensively covers the syllabus for HSC students and university admission seekers. Core concepts, board questions, and entry test problems are solved in detail.</p>',
                'thumbnail' => 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=800&q=80',
                'price' => 4500,
                'sale_price' => 3200,
                'is_featured' => true,
                'status' => Course::STATUS_PUBLISHED,
            ]
        );
        $course1->categories()->sync([$catPaid->id, $catPhysics->id, $catAdmission->id]);
        $course1->instructors()->sync([$teacher1->id, $teacher2->id]);

        // Course 1 Sections & Lessons
        $sec1 = CourseSection::firstOrCreate(
            ['course_id' => $course1->id, 'title' => 'Topic 01: Vectors and Dynamics'],
            ['description' => 'Vector direction, resultant, and calculus applications', 'sort_order' => 1]
        );

        $lesson1 = Lesson::firstOrCreate(
            ['course_id' => $course1->id, 'section_id' => $sec1->id, 'title' => 'Class 01: Vector Basics and Parallelogram Law'],
            [
                'slug' => 'vector-basics',
                'content' => "In this class, we learn types of vectors and how to calculate magnitude and direction using the parallelogram law.\n\nImportant Formulas:\nR = sqrt(P^2 + Q^2 + 2PQ cos a)\ntan theta = (Q sin a) / (P + Q cos a)",
                'video_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'duration_minutes' => 35,
                'is_preview' => true,
                'status' => 'published',
                'sort_order' => 1,
            ]
        );

        $lesson2 = Lesson::firstOrCreate(
            ['course_id' => $course1->id, 'section_id' => $sec1->id, 'title' => 'Class 02: River-Boat Problems & Relative Velocity'],
            [
                'slug' => 'river-boat-physics',
                'content' => "Techniques for solving river crossing and relative velocity problems with ease.",
                'video_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'duration_minutes' => 42,
                'is_preview' => false,
                'status' => 'published',
                'sort_order' => 2,
            ]
        );

        $sec2 = CourseSection::firstOrCreate(
            ['course_id' => $course1->id, 'title' => 'Topic 02: Newtonian Mechanics and Gravity'],
            ['description' => 'Laws of motion, moment of inertia, and angular momentum', 'sort_order' => 2]
        );

        $lesson3 = Lesson::firstOrCreate(
            ['course_id' => $course1->id, 'section_id' => $sec2->id, 'title' => 'Class 01: Newton’s Second Law and Conservation of Momentum'],
            [
                'slug' => 'newtons-laws-momentum',
                'content' => "Conservation of linear momentum and rocket propulsion analysis.",
                'video_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'duration_minutes' => 38,
                'is_preview' => false,
                'status' => 'published',
                'sort_order' => 1,
            ]
        );

        // 6. Course 2: HSC Chemistry Fundamentals (Free Course, Multi-Teacher: Teacher 2 & Teacher 3)
        $course2 = Course::firstOrCreate(
            ['slug' => 'hsc-chemistry-fundamentals'],
            [
                'instructor_id' => $teacher2->id,
                'title' => 'HSC Chemistry Fundamentals (Free Crash Course)',
                'short_description' => 'Periodic table, hybridization, and chemical changes foundation classes.',
                'description' => '<p>Strong basics are key to scoring well in Chemistry. This free course clarifies periodic trends and chemical bonding hybridization easily.</p>',
                'thumbnail' => 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=800&q=80',
                'price' => 0,
                'sale_price' => 0,
                'is_featured' => true,
                'status' => Course::STATUS_PUBLISHED,
            ]
        );
        $course2->categories()->sync([$catChem->id]);
        $course2->instructors()->sync([$teacher2->id, $teacher3->id]);

        $c2Sec = CourseSection::firstOrCreate(
            ['course_id' => $course2->id, 'title' => 'Chapter 01: Periodic Properties and Chemical Bonds'],
            ['description' => 'Electronic configuration and bonding nature', 'sort_order' => 1]
        );

        Lesson::firstOrCreate(
            ['course_id' => $course2->id, 'section_id' => $c2Sec->id, 'title' => 'Class 01: Orbital Hybridization (sp, sp2, sp3)'],
            [
                'slug' => 'orbital-hybridization',
                'content' => 'Bond angles, orbital geometries, and hybridization theory for methane, ammonia, and water.',
                'video_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'duration_minutes' => 28,
                'is_preview' => true,
                'status' => 'published',
                'sort_order' => 1,
            ]
        );

        // 7. Course 3: Higher Math Calculus Mastery (Paid Course, Teacher 1 & Teacher 3)
        $course3 = Course::firstOrCreate(
            ['slug' => 'higher-math-calculus-mastery'],
            [
                'instructor_id' => $teacher3->id,
                'title' => 'Higher Math Calculus & Integration Mastery',
                'short_description' => 'Limits, differentiation, and integration shortcuts with past board question solutions.',
                'description' => '<p>Overcome fear of calculus with this dedicated masterclass. Covers everything from limits of functions to multi-variable integration.</p>',
                'thumbnail' => 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80',
                'price' => 3500,
                'sale_price' => 2800,
                'is_featured' => true,
                'status' => Course::STATUS_PUBLISHED,
            ]
        );
        $course3->categories()->sync([$catMath->id, $catAdmission->id]);
        $course3->instructors()->sync([$teacher1->id, $teacher3->id]);

        // 8. Course 4: Draft Course (for testing admin draft state)
        $course4 = Course::firstOrCreate(
            ['slug' => 'ai-and-web-development-bootcamp'],
            [
                'instructor_id' => $teacher1->id,
                'title' => 'Full-Stack Web Development & AI Tools (Upcoming)',
                'short_description' => 'Draft course for testing admin publishing workflows.',
                'description' => '<p>Upcoming web development and AI workflow course.</p>',
                'price' => 5000,
                'sale_price' => 4000,
                'is_featured' => false,
                'status' => Course::STATUS_DRAFT,
            ]
        );
        $course4->categories()->sync([$catWeb->id]);

        // 9. Enrollments & Sample Orders
        // Student 1 enrolled in Course 1 via a Paid Order
        $order1 = Order::firstOrCreate(
            ['order_number' => 'ORD-261026-PAID1'],
            [
                'user_id' => $students[0]->id,
                'course_id' => $course1->id,
                'original_price' => 4500,
                'discount_amount' => 1300,
                'final_amount' => 3200,
                'payment_status' => Order::PAYMENT_PAID,
                'order_status' => Order::ORDER_COMPLETED,
                'payment_method' => 'manual_bkash',
                'notes' => 'Payment completed via bKash.',
            ]
        );
        Payment::firstOrCreate(
            ['order_id' => $order1->id],
            [
                'transaction_ref' => '9J2K8LQZ01',
                'sender_phone' => '+8801700000011',
                'amount' => 3200,
                'payment_method' => 'manual_bkash',
                'status' => Payment::STATUS_APPROVED,
                'verified_by' => $admin->id,
                'verified_at' => now(),
            ]
        );
        Enrollment::firstOrCreate(
            ['user_id' => $students[0]->id, 'course_id' => $course1->id],
            ['order_id' => $order1->id, 'status' => 'active', 'enrolled_at' => now()]
        );
        LessonProgress::firstOrCreate(
            ['user_id' => $students[0]->id, 'lesson_id' => $lesson1->id],
            ['course_id' => $course1->id, 'is_completed' => true, 'completed_at' => now(), 'last_accessed_at' => now()]
        );

        // Student 2 has a Pending Order for Course 1 (not enrolled yet!)
        $order2 = Order::firstOrCreate(
            ['order_number' => 'ORD-261026-PEND1'],
            [
                'user_id' => $students[1]->id,
                'course_id' => $course1->id,
                'original_price' => 4500,
                'discount_amount' => 1300,
                'final_amount' => 3200,
                'payment_status' => Order::PAYMENT_PENDING,
                'order_status' => Order::ORDER_PROCESSING,
                'payment_method' => 'manual_nagad',
                'notes' => 'Payment sent via Nagad.',
            ]
        );
        Payment::firstOrCreate(
            ['order_id' => $order2->id],
            [
                'transaction_ref' => 'NG88992211',
                'sender_phone' => '+8801700000012',
                'amount' => 3200,
                'payment_method' => 'manual_nagad',
                'status' => Payment::STATUS_PENDING,
            ]
        );

        // Student 1 & 2 enrolled in Free Course 2
        Enrollment::firstOrCreate(
            ['user_id' => $students[0]->id, 'course_id' => $course2->id],
            ['status' => 'active', 'enrolled_at' => now()]
        );
        Enrollment::firstOrCreate(
            ['user_id' => $students[1]->id, 'course_id' => $course2->id],
            ['status' => 'active', 'enrolled_at' => now()]
        );

        // 10. Sample Student Question & Teacher Reply
        $comment = LessonComment::firstOrCreate(
            ['lesson_id' => $lesson1->id, 'user_id' => $students[0]->id, 'parent_id' => null],
            ['content' => 'Sir, could you please explain the condition for minimum crossing time across the river again?']
        );
        LessonComment::firstOrCreate(
            ['lesson_id' => $lesson1->id, 'user_id' => $teacher1->id, 'parent_id' => $comment->id],
            ['content' => 'Certainly Rahim. To cross the river in minimum time, the boat must steer perpendicular (at 90 degrees) relative to the bank. This is explained at minute 18:00 in the lecture.']
        );

        // 11. Website & SMS Settings
        WebsiteSetting::current();
        SmsSetting::current();
    }
}
