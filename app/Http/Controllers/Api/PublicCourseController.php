<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicCourseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Course::query()
            ->with(['instructors.teacherProfile', 'instructor.teacherProfile', 'categories:id,name,slug'])
            ->withCount(['lessons', 'enrollments'])
            ->published();

        // Type filter: free, paid, or all
        if ($request->filled('type')) {
            if ($request->type === 'free') {
                $query->free();
            } elseif ($request->type === 'paid') {
                $query->paid();
            }
        }

        // Category filter
        if ($request->filled('category')) {
            $query->whereHas('categories', function ($q) use ($request) {
                $q->where('slug', $request->category);
            });
        }

        // Featured filter
        if ($request->boolean('featured')) {
            $query->featured();
        }

        // Search query
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('short_description', 'like', "%{$search}%");
            });
        }

        // Sorting: best_selling (highest real sales & verified enrollments), alphabetical_asc (A-Z), alphabetical_desc (Z-A), price_low, price_high, oldest, latest
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

        $courses = $query->paginate($request->integer('per_page', 12));

        $user = auth('sanctum')->user();
        $enrolledCourseIds = [];
        if ($user) {
            $enrolledCourseIds = \App\Models\Enrollment::where('user_id', $user->id)
                ->where('status', \App\Models\Enrollment::STATUS_ACTIVE)
                ->pluck('course_id')
                ->toArray();

            $taughtCourseIds = Course::where(function ($q) use ($user) {
                $q->where('instructor_id', $user->id)
                  ->orWhereHas('instructors', fn ($iq) => $iq->where('users.id', $user->id));
            })->pluck('id')->toArray();

            $enrolledCourseIds = array_unique(array_merge($enrolledCourseIds, $taughtCourseIds));
        }

        $courses->getCollection()->transform(function ($c) use ($enrolledCourseIds, $user) {
            $c->is_enrolled = in_array($c->id, $enrolledCourseIds) || ($user && $user->isAdmin());
            return $c;
        });

        return response()->json($courses);
    }

    public function show(string $slug): JsonResponse
    {
        $course = Course::where('slug', $slug)
            ->with([
                'instructors.teacherProfile',
                'instructor.teacherProfile',
                'categories:id,name,slug',
                'nexpilot' => function ($q) {
                    $q->select('id', 'course_id', 'title', 'price', 'short_description', 'is_active')
                      ->where('is_active', true);
                },
                'sections.lessons' => function ($q) {
                    $q->select('id', 'course_id', 'section_id', 'title', 'slug', 'duration_minutes', 'is_preview', 'sort_order')
                      ->orderBy('sort_order');
                },
            ])
            ->withCount(['lessons', 'enrollments'])
            ->published()
            ->firstOrFail();

        $user = auth('sanctum')->user();
        $isEnrolled = false;
        $accessKey = null;

        if ($user) {
            if ($user->isAdmin() || $user->isEnrolledIn($course->id) || ($user->isTeacher() && $course->isAssignedTeacher($user->id))) {
                $isEnrolled = true;
            }

            if ($user->isEnrolledIn($course->id)) {
                $enrollment = $user->enrollments()
                    ->where('course_id', $course->id)
                    ->where('status', \App\Models\Enrollment::STATUS_ACTIVE)
                    ->first();
                if ($enrollment) {
                    $accessKey = $enrollment->getOrGenerateAccessKey();
                }
            }
        }

        if ($isEnrolled) {
            $course->is_enrolled = true;
        }

        return response()->json([
            'course' => $course,
            'is_enrolled' => $isEnrolled,
            'access_key' => $accessKey,
        ]);
    }

    public function categories(): JsonResponse
    {
        $categories = Category::withCount(['courses' => function ($q) {
            $q->published();
        }])->get();

        return response()->json($categories);
    }

    /**
     * Get uploaded student reviews / testimonials screenshots for infinite marquee
     */
    public function marqueeReviews(): JsonResponse
    {
        $reviews = [];
        try {
            if (\Illuminate\Support\Facades\Schema::hasTable('media')) {
                $mediaItems = \App\Models\Media::where('file_type', 'image')
                    ->latest()
                    ->take(50)
                    ->get();

                foreach ($mediaItems as $item) {
                    $reviews[] = [
                        'id' => $item->id,
                        'url' => $item->url ?: asset('storage/' . $item->file_path),
                        'title' => $item->file_name,
                    ];
                }
            }
        } catch (\Throwable $e) {}

        if (empty($reviews)) {
            $knownFiles = [
                'Dvf93tePcSijBdHF40XsNEz7NJyrjTwa4b9IWe4U.jpg',
                '2ilyybrdxRCRlPbt3MmmB1Sh8lU9AtqdRDNuVUHW.png',
                '4UmfhyGw1sj3ZVwvF9rkb30CcNCV1UtPpMo0sKGW.jpg',
                'EL8TVLqrMJ89kcmFr7GlKfLsRlrrzblLWKaCLsN5.jpg',
                'PPPG6tTHhd5vCH3wfdnsgZOKRM4LkCW5ozfiU6bi.jpg',
                'ODS6ANECxTOwCKIaERyYpa8lnmLp2EGoWdWOBKuO.jpg',
                'skWSTpZEpGJHY9eCUniUlxKeyU43qHvWl7JBBeAZ.jpg',
                'MNLrK2o5A58IAwdcAEz8j47ua2lpxMWqzuz3VIRn.jpg',
                'mbGCDMxphmWoPMAfUvCS0cPTdZeGPpIYh7cdx9m7.jpg',
                'vBQjKQOLWQWwdaqfSr023T7hHwOTTkYFjyFeDJhD.webp',
                'EuXBw1PwXkBh1lCTlQELz0P5GiQmixfWuGzie9Z1.jpg',
                'xvh6magzlWJrFcorpiGwV8AarUo8MlxsEhTUIfyg.jpg',
                'hbyBW1UxFgAYUsXJvOk5wqb9lMcIM7rlHuj0HvB3.jpg',
                'YOYfudQJw5V9SGDNEBXfbkw1ZgDJkZRWBtRMO2rO.jpg',
                'TybfpRohuU2RDZfyvecMseWCm1S6KiFSuuaUkhdT.jpg',
                'mqvJxX8ioUHejqiGGbYJP5QD8dgWdxsLnGsByCFT.jpg',
                'ac592Zz1cy1mg2CwHcQgpu4WYlTZ4T52ys9AxOYB.jpg',
                'odkbP92BZbNwyCDPAmvX4kik5w0Qr21NaMEcmX1r.jpg',
                'v7G85vfdx9I1nNKf2B84u3rFlg7PPA07XEGAJNSf.jpg',
                'IQMKuQQuylahu1luFE1gpDqmUlLdv5p9pIZFcQfV.jpg',
                'Ftr6fWQ4rTuWYMtPeSpEB2tAoOwp9x9Vy9R9vhqR.jpg',
                'sd3pZtDXOPidWHQQOoHC6vAsi7bdtw2S5EobOgHG.jpg',
                'x2jSZJyVRX3uIsXG4o0cK3Lb9Of8smGWuz65tguv.png',
                'Xcq0pGWrtES7yMRISv26aorb8t3QwxBg4SVV7ijF.jpg',
                'ftixuMACT0pcQcMlRz9sClJh0ZVWI6A15BLZf8Jm.jpg',
                'ovcSCZKWnILdR75Cj1j4zmriUogXoUK8sstKec4t.jpg',
                'swX0NlfXGZsREg0NCPxyN9ZZK68FYHfsBHXkHQnF.jpg',
                'BUVBAh4HSoiAnd3kXJ7amRtEvGksVDLcxmyszRWQ.jpg',
                'jxzi7lY7DkZrbTG4vbHwL3WKPUkvR51TpM2XkcQ5.jpg',
                'dfwgVqmGLcfXZiKfqNMda9AdqsG4WS1EoRQjlucK.jpg',
                'z4IaCXiY2tfjoPiLKzl359dJpmMSHbuIuraTHIQW.jpg',
                '9MbBCTpqrtmACIveX0xGhagoj0DI9grlO6t7YWxQ.jpg',
                'cF8W4phayJSdniEBZ6KQl9BB1d1HgQfgpdJyUj1B.jpg',
                'Rwx5T1qVHEp7I8FUhfUq10OkcxsX3uk9HUYGbrBy.jpg',
                'I9IZFMmNEIMXalyYoDD2ZASLYX0nHDCgeINXxyps.png',
                'd1R7oMGxQ1zop3bN4Pc9HCcZnQtoREbfZ0FF4l8s.jpg',
                'ZSGv2ScXAlEmegcHQqjkziWzieUZ8myXFmb7ctml.jpg',
                'e0aL4hf8HfzapahkpH8R3EDnDfZcfdUDm9nH8lpa.jpg',
                'pPVab8pTUmsypPhvLQ6GscabhFCGQdwG6vdVxeip.jpg',
                'KYeCSL2yzSPEymK9IN2Es125rsUg5LBRUfTzaQXk.jpg',
                'ZHlHXfoCPIeCfCruhF1l2YVE08MhT2nf2GrE9uzK.jpg',
                'PUCnyKXcKTfOBbBbKGM58kfKNWVGlQWK0V1brKZx.jpg',
                'XTBtoAeg5jcMJq3wtzt53a6mcSIcmKWPs7vjkAfG.jpg',
                'zdLPOlUZumkLOYZPysfUUP5KL4vXhwPYjjAs3LPV.jpg',
                'RD8vFy4NHrQ2FLVCOgAhCaUPy12jJvYMsfGxnFqn.png',
                'Fx8TBmXUMLnyJaP8hlzUcQvabRfzh7GAQW5Xftv7.jpg',
                '7gIffdItOscO9CVc6BQIMsUk1C0n9kukfvciKPGl.jpg',
                'ZaVB6WkP1yQLVRfS24LzmaLB7G6xHIoVt839Ajya.jpg',
                'x1PfQI4ivaXqcR4ZBQdGYAeFwKYnm7kKlaY9JFZ8.jpg',
                'gKjbQSp7VZaVKD5wQuZdfTpypjgXKeWJr5yIAtJi.jpg',
                'pmZQtkzTENMlusDl92m7QjEkZbCzXFoaBBtpGYGw.jpg',
                'iWiZEQ9f6L4bv9lRzBHHXTKUK3tL8ukiccHTDVaZ.jpg',
            ];
            foreach ($knownFiles as $idx => $f) {
                $reviews[] = [
                    'id' => $idx + 1,
                    'url' => asset('storage/media/' . $f),
                    'title' => 'Student Review ' . ($idx + 1),
                ];
            }
        }

        return response()->json([
            'success' => true,
            'count' => count($reviews),
            'reviews' => $reviews,
        ]);
    }
}
