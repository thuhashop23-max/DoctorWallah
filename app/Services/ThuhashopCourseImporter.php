<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Course;
use App\Models\CourseSection;
use App\Models\Lesson;
use App\Models\LessonAttachment;
use Illuminate\Support\Str;
use PDO;

class ThuhashopCourseImporter
{
    protected ?PDO $pdo = null;
    protected string $prefix = 'wp_';

    public function connect(): bool
    {
        $configPath = '/home/u825551938/domains/thuhashop.com/public_html/wp-config.php';
        if (!file_exists($configPath)) {
            $configPath = base_path('../thuhashop.com/public_html/wp-config.php');
        }

        if (!file_exists($configPath)) {
            \Log::error("ThuhashopCourseImporter: wp-config.php not found at {$configPath}");
            return false;
        }

        $content = file_get_contents($configPath);
        preg_match("/define\(\s*['\"]DB_NAME['\"]\s*,\s*['\"](.*?)['\"]\s*\);/", $content, $mName);
        preg_match("/define\(\s*['\"]DB_USER['\"]\s*,\s*['\"](.*?)['\"]\s*\);/", $content, $mUser);
        preg_match("/define\(\s*['\"]DB_PASSWORD['\"]\s*,\s*['\"](.*?)['\"]\s*\);/", $content, $mPass);
        preg_match("/\\\$table_prefix\s*=\s*['\"](.*?)['\"];/", $content, $mPrefix);

        if (empty($mName[1]) || empty($mPass[1])) {
            \Log::error("ThuhashopCourseImporter: Could not parse DB credentials from wp-config.php");
            return false;
        }

        $this->prefix = $mPrefix[1] ?? 'wp_';
        $this->pdo = new PDO(
            "mysql:host=127.0.0.1;dbname={$mName[1]};charset=utf8mb4",
            $mUser[1],
            $mPass[1],
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        return true;
    }

    public function importAll(): array
    {
        if (!$this->pdo && !$this->connect()) {
            return ['status' => 'error', 'message' => 'Database connection failed'];
        }

        $prefix = $this->prefix;
        $pdo = $this->pdo;

        // LearnDash course mappings to DoctorWallah course slugs
        $courseMapping = [
            3220 => 'anatomy-thorax-card',
            3224 => 'cellular-physiology-blood-card',
            3226 => 'biophysics-biomolecules-card',
            18460 => 'general-histology',
            18456 => 'general-embryology',
            18476 => 'embryology-archive',
            60783 => 'superior-extremity-card-upper-limb',
            60785 => 'cardiovascular-system-card',
            60789 => 'food-nutrition-card',
            145895 => 'inferior-extremity',
            145899 => 'gi-renal-physiology',
            145897 => 'renal-biochemistry',
            129927 => 'abdomen-card',
            129929 => 'respiratory-physiology-card',
            129935 => 'metabolism',
            18470 => 'head-neck-archive',
            18474 => 'reproductive-physiology-archive',
        ];

        $importedCourses = 0;
        $importedSections = 0;
        $importedLessons = 0;
        $importedAttachments = 0;

        $modularClassTrees = [];

        foreach ($courseMapping as $wpCourseId => $dwSlug) {
            // Find course post
            $cStmt = $pdo->prepare("SELECT ID, post_title, post_name, post_content FROM {$prefix}posts WHERE ID = ?");
            $cStmt->execute([$wpCourseId]);
            $cRow = $cStmt->fetch(PDO::FETCH_ASSOC);
            if (!$cRow) continue;

            // Fetch course meta
            $mStmt = $pdo->prepare("SELECT meta_key, meta_value FROM {$prefix}postmeta WHERE post_id = ?");
            $mStmt->execute([$wpCourseId]);
            $cMeta = $mStmt->fetchAll(PDO::FETCH_KEY_PAIR);

            $stepsRaw = $cMeta['ld_course_steps'] ?? null;
            $steps = $stepsRaw ? @unserialize($stepsRaw) : null;

            // Lesson & Topic order from steps
            $lessonOrder = [];
            $lessonTopics = [];
            if (!empty($steps['steps']['h']['sfwd-lessons'])) {
                foreach ($steps['steps']['h']['sfwd-lessons'] as $lesId => $lesData) {
                    $lessonOrder[] = $lesId;
                    if (!empty($lesData['sfwd-topic'])) {
                        $lessonTopics[$lesId] = array_keys($lesData['sfwd-topic']);
                    }
                }
            }

            if (empty($lessonOrder)) continue;

            // Find or create Course in DoctorWallah
            $course = Course::where('slug', $dwSlug)->first();
            if (!$course) {
                $course = Course::create([
                    'title' => $cRow['post_title'],
                    'slug' => $dwSlug,
                    'short_description' => $cRow['post_title'] . ' Complete Card Preparation Course.',
                    'description' => !empty($cRow['post_content']) ? $cRow['post_content'] : ($cRow['post_title'] . ' এর সকল ক্লাস ও স্টাডি ম্যাটেরিয়ালস।'),
                    'price' => 450,
                    'sale_price' => 450,
                    'status' => Course::STATUS_PUBLISHED,
                    'is_featured' => false,
                    'fake_enrollment_count' => rand(80, 150),
                    'class_starts_at' => 'চলমান (Ongoing)',
                    'enable_manual_payment' => true,
                    'enable_shurjopay' => true,
                ]);
            }

            $importedCourses++;
            $courseTree = [];

            // Query lessons
            $inLids = implode(',', array_map('intval', $lessonOrder));
            $lPostsStmt = $pdo->query("SELECT ID, post_title, post_name, post_content, menu_order FROM {$prefix}posts WHERE ID IN ($inLids)");
            $lPosts = $lPostsStmt->fetchAll(PDO::FETCH_ASSOC);
            $lPostsById = [];
            foreach ($lPosts as $lp) $lPostsById[$lp['ID']] = $lp;

            foreach ($lessonOrder as $sIdx => $lid) {
                if (!isset($lPostsById[$lid])) continue;
                $lesPost = $lPostsById[$lid];
                $secTitle = $lesPost['post_title'];

                // Create CourseSection
                $section = CourseSection::updateOrCreate(
                    [
                        'course_id' => $course->id,
                        'title' => $secTitle,
                    ],
                    [
                        'sort_order' => $sIdx + 1,
                        'description' => $secTitle . ' lectures and resources.',
                    ]
                );
                $importedSections++;

                $tids = $lessonTopics[$lid] ?? [];
                $sectionItems = [];

                if (!empty($tids)) {
                    $inTids = implode(',', array_map('intval', $tids));
                    $tPostsStmt = $pdo->query("SELECT ID, post_title, post_name, post_content, menu_order FROM {$prefix}posts WHERE ID IN ($inTids)");
                    $tPosts = $tPostsStmt->fetchAll(PDO::FETCH_ASSOC);
                    $tPostsById = [];
                    foreach ($tPosts as $tp) $tPostsById[$tp['ID']] = $tp;

                    foreach ($tids as $tIdx => $tid) {
                        if (!isset($tPostsById[$tid])) continue;
                        $topPost = $tPostsById[$tid];

                        $itemData = $this->createLessonRecord(
                            $course->id,
                            $section->id,
                            $topPost['post_title'],
                            $topPost['post_content'] ?? '',
                            $tIdx + 1
                        );

                        if ($itemData['created']) {
                            $importedLessons++;
                        }
                        if ($itemData['has_attachment']) {
                            $importedAttachments++;
                        }

                        $sectionItems[] = $itemData;
                    }
                } else {
                    // Lesson itself is a standalone item (e.g. textbook, marked book, slide, single lecture)
                    $itemData = $this->createLessonRecord(
                        $course->id,
                        $section->id,
                        $lesPost['post_title'],
                        $lesPost['post_content'] ?? '',
                        1
                    );

                    if ($itemData['created']) {
                        $importedLessons++;
                    }
                    if ($itemData['has_attachment']) {
                        $importedAttachments++;
                    }

                    $sectionItems[] = $itemData;
                }

                $courseTree[] = [
                    'section_title' => $secTitle,
                    'items' => $sectionItems,
                ];
            }

            $modularClassTrees[$dwSlug] = $courseTree;
        }

        // Now populate the 6 Main Program Package Courses with their constituent classes & materials
        $packageMappings = [
            '1st-card-full-course' => [
                'anatomy-thorax-card',
                'cellular-physiology-blood-card',
                'biophysics-biomolecules-card',
            ],
            '2nd-card-full-course' => [
                'general-histology',
                'general-embryology',
                'superior-extremity-card-upper-limb',
                'cardiovascular-system-card',
                'food-nutrition-card',
            ],
            'mbbs-4th-card' => [
                'inferior-extremity',
                'gi-renal-physiology',
                'renal-biochemistry',
            ],
            'mbbs-first-phase-1st-term' => [
                'anatomy-thorax-card',
                'cellular-physiology-blood-card',
                'biophysics-biomolecules-card',
                'general-histology',
                'general-embryology',
                'superior-extremity-card-upper-limb',
                'cardiovascular-system-card',
                'food-nutrition-card',
            ],
            'mbbs-first-phase-3rd-card' => [
                'head-neck-archive',
                'reproductive-physiology-archive',
                'abdomen-card',
                'respiratory-physiology-card',
                'metabolism',
            ],
            'mbbs-first-phase-2nd-term' => [
                'head-neck-archive',
                'reproductive-physiology-archive',
                'abdomen-card',
                'respiratory-physiology-card',
                'metabolism',
                'inferior-extremity',
                'gi-renal-physiology',
                'renal-biochemistry',
            ],
        ];

        foreach ($packageMappings as $pkgSlug => $constituentSlugs) {
            $pkgCourse = Course::where('slug', $pkgSlug)->first();
            if (!$pkgCourse) continue;

            $globalSecOrder = 1;
            foreach ($constituentSlugs as $constSlug) {
                if (!isset($modularClassTrees[$constSlug])) continue;

                $sourceCourse = Course::where('slug', $constSlug)->first();
                $prefixTitle = $sourceCourse ? $sourceCourse->title : Str::headline($constSlug);

                foreach ($modularClassTrees[$constSlug] as $sec) {
                    $combinedSecTitle = "{$prefixTitle} - {$sec['section_title']}";

                    $targetSection = CourseSection::updateOrCreate(
                        [
                            'course_id' => $pkgCourse->id,
                            'title' => $combinedSecTitle,
                        ],
                        [
                            'sort_order' => $globalSecOrder++,
                            'description' => $combinedSecTitle . ' lectures and resources.',
                        ]
                    );
                    $importedSections++;

                    foreach ($sec['items'] as $itemIdx => $it) {
                        $pLesson = Lesson::updateOrCreate(
                            [
                                'course_id' => $pkgCourse->id,
                                'section_id' => $targetSection->id,
                                'title' => $it['title'],
                            ],
                            [
                                'slug' => Str::slug($it['title']) . "-pkg-{$pkgCourse->id}-" . ($itemIdx + 1),
                                'content' => $it['content'],
                                'video_provider' => $it['video_provider'],
                                'video_url' => $it['video_url'],
                                'duration_minutes' => $it['duration_minutes'],
                                'is_preview' => $itemIdx === 0,
                                'status' => 'published',
                                'sort_order' => $itemIdx + 1,
                            ]
                        );
                        $importedLessons++;

                        if (!empty($it['drive_url'])) {
                            LessonAttachment::updateOrCreate(
                                [
                                    'lesson_id' => $pLesson->id,
                                    'file_name' => $it['title'],
                                ],
                                [
                                    'file_type' => 'google_drive',
                                    'file_size' => 0,
                                    'file_path' => $it['drive_url'],
                                    'is_private' => false,
                                ]
                            );
                            $importedAttachments++;
                        }
                    }
                }
            }
        }

        return [
            'status' => 'success',
            'imported_courses' => $importedCourses,
            'imported_sections' => $importedSections,
            'imported_lessons' => $importedLessons,
            'imported_attachments' => $importedAttachments,
            'timestamp' => now()->toIso8601String(),
        ];
    }

    protected function createLessonRecord(int $courseId, int $sectionId, string $title, string $rawContent, int $order): array
    {
        // 1. Detect Video URL
        $videoUrl = null;
        $videoProvider = null;

        if (preg_match('#src="([^"]*player\.vimeo\.com/video/[^"]*)"#i', $rawContent, $m)) {
            $videoUrl = $m[1];
            $videoProvider = 'vimeo';
        } elseif (preg_match('#(https?://(?:www\.)?player\.vimeo\.com/video/\d+[^"\s<>]*)#i', $rawContent, $m)) {
            $videoUrl = $m[1];
            $videoProvider = 'vimeo';
        } elseif (preg_match('#(https?://(?:www\.)?vimeo\.com/\d+[^"\s<>]*)#i', $rawContent, $m)) {
            $videoUrl = $m[1];
            $videoProvider = 'vimeo';
        } elseif (preg_match('#(https?://(?:www\.)?(?:youtube\.com/watch\?v=|youtu\.be/)[^"\s<>&]+)#i', $rawContent, $m)) {
            $videoUrl = $m[1];
            $videoProvider = 'youtube';
        } elseif (preg_match('#mp4="([^"]+\.mp4)"#i', $rawContent, $m)) {
            $videoUrl = $m[1];
            $videoProvider = 'html5';
        }

        // 2. Detect Google Drive / Download Material
        $driveUrl = null;
        if (preg_match('#href="([^"]*drive\.google\.com[^"]*)"#i', $rawContent, $m)) {
            $driveUrl = $m[1];
        } elseif (preg_match('#(https?://drive\.google\.com/[^"\s<>]+)#i', $rawContent, $m)) {
            $driveUrl = $m[1];
        }

        // 3. Clean and format content
        $content = trim($rawContent);
        if ($driveUrl && empty($content)) {
            $content = "<a class=\"custom-btn\" href=\"{$driveUrl}\" target=\"_blank\" rel=\"noopener noreferrer\"> Download {$title} </a>";
        }

        $uniqueSlug = Str::slug($title) . "-c{$courseId}-s{$sectionId}-{$order}";

        $lesson = Lesson::updateOrCreate(
            [
                'course_id' => $courseId,
                'section_id' => $sectionId,
                'title' => $title,
            ],
            [
                'slug' => $uniqueSlug,
                'content' => $content,
                'video_provider' => $videoProvider,
                'video_url' => $videoUrl,
                'duration_minutes' => 45,
                'is_preview' => $order === 1,
                'status' => 'published',
                'sort_order' => $order,
            ]
        );

        $hasAttachment = false;
        if ($driveUrl) {
            LessonAttachment::updateOrCreate(
                [
                    'lesson_id' => $lesson->id,
                    'file_name' => $title,
                ],
                [
                    'file_type' => 'google_drive',
                    'file_size' => 0,
                    'file_path' => $driveUrl,
                    'is_private' => false,
                ]
            );
            $hasAttachment = true;
        }

        return [
            'created' => true,
            'id' => $lesson->id,
            'title' => $title,
            'content' => $content,
            'video_provider' => $videoProvider,
            'video_url' => $videoUrl,
            'drive_url' => $driveUrl,
            'duration_minutes' => 45,
            'has_attachment' => $hasAttachment,
        ];
    }
}
