<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Page extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'status',
        'layout_type',
        'blocks',
        'custom_css',
        'meta_title',
        'meta_description',
        'is_system',
    ];

    protected $casts = [
        'blocks' => 'array',
        'is_system' => 'boolean',
    ];

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    /**
     * Default home page block template matching current design
     */
    public static function defaultHomeBlocks(): array
    {
        return [
            [
                'id' => 'block_ribbon_1',
                'type' => 'top_announcement',
                'title' => 'Top Campaign Ribbon',
                'settings' => [
                    'badge' => 'Special Offer',
                    'text' => 'Admissions open for Academic Cycles and Admission Master Batches with special discounts!',
                    'linkText' => 'View All Courses →',
                    'linkUrl' => '/courses',
                    'bgColor' => 'from-sky-700 via-sky-600 to-amber-500',
                ]
            ],
            [
                'id' => 'block_hero_1',
                'type' => 'hero',
                'title' => 'Hero Banner Section',
                'settings' => [
                    'badge' => "Bangladesh's Most Advanced Online Learning Platform",
                    'titlePart1' => 'Where Dreams Become Reality,',
                    'titleHighlight' => 'From Concept Clearing',
                    'titlePart2' => 'To Admission Success!',
                    'subtitle' => 'Prepare with 100% confidence through live and full HD recorded classes by experienced mentors, chapter-wise lecture sheets, 24/7 NexPilot AI doubt solving, and real-time model tests.',
                    'browseCoursesBtn' => 'Browse Courses',
                    'browseCoursesLink' => '/courses',
                    'startFreeClassBtn' => 'Take Online Exam',
                    'startFreeClassLink' => '/student/exams',
                    'trust1' => '50,000+ Active Students',
                    'trust2' => '100+ Flagship Courses',
                    'trust3' => '24/7 AI Doubt Solver',
                    'cardBadge' => 'Live Academy Status',
                    'physicsTitle' => 'HSC Physics 1st & 2nd Paper',
                    'physicsSub' => 'Chapter-wise Complete Mathematical Analysis',
                    'teachersTitle' => 'Top Mentors from BUET & DU',
                    'teachersSub' => 'Direct Expert Mentorship',
                    'studyMatTitle' => 'Premium Handnotes & Question Bank',
                    'studyMatSub' => 'Downloadable Printable Sheets',
                    'joinTodayBtn' => 'Join Today',
                ]
            ],
            [
                'id' => 'block_features_1',
                'type' => 'features',
                'title' => 'Why Choose Us Section',
                'settings' => [
                    'sectionTag' => 'Our Features',
                    'sectionTitle' => 'Why NovoNex Is the First Choice for Students',
                    'sectionSub' => 'Beyond rote memorization, we teach deep concepts and practical problem-solving tricks to guide students to the top.',
                    'items' => [
                        [
                            'id' => 'feat_1',
                            'icon' => 'Award',
                            'title' => 'Top University Mentors',
                            'desc' => 'Classes directly supervised by experienced instructors from BUET, Dhaka University, and top medical colleges.'
                        ],
                        [
                            'id' => 'feat_2',
                            'icon' => 'Zap',
                            'title' => 'NexPilot AI Doubt Solver',
                            'desc' => 'Snap a photo or type any question for instant, accurate step-by-step solutions within seconds.'
                        ],
                        [
                            'id' => 'feat_3',
                            'icon' => 'HelpCircle',
                            'title' => 'Chapter Doubt Box',
                            'desc' => 'Ask questions right below any lecture video with direct replies from course mentors.'
                        ],
                        [
                            'id' => 'feat_4',
                            'icon' => 'ShieldCheck',
                            'title' => 'Real-time Merit Ranking',
                            'desc' => 'Board-standard online model tests with negative marking and competitive nation-wide rankings.'
                        ]
                    ]
                ]
            ],
            [
                'id' => 'block_bundle_1',
                'type' => 'bundle_showcase',
                'title' => 'Course Bundles Section',
                'settings' => [
                    'sectionTag' => 'Special Packages',
                    'sectionTitle' => 'Popular Course Bundles & Combos',
                    'sectionSub' => 'Bundle multiple courses together and save up to 50%!',
                    'limit' => 4,
                ]
            ],
            [
                'id' => 'block_course_tabs_1',
                'type' => 'course_tabs',
                'title' => 'Courses Grid & Tabs',
                'settings' => [
                    'headingTag' => 'Popular Courses',
                    'headingTitle' => 'Our Flagship Academic & Admission Courses',
                    'viewAllText' => 'View All Courses',
                    'viewAllLink' => '/courses',
                    'limit' => 12,
                    'tabs' => [
                        [
                            'id' => 'tab_all',
                            'label' => 'All Courses',
                            'type' => 'category',
                            'categorySlug' => 'all',
                        ],
                    ],
                    'dynamicCategories' => true,
                ]
            ],
            [
                'id' => 'block_stats_1',
                'type' => 'stats_counter',
                'title' => 'Stats & Counter',
                'settings' => [
                    'stats' => [
                        ['label' => 'Active Students', 'value' => '50,000+'],
                        ['label' => 'Premium Courses', 'value' => '100+'],
                        ['label' => 'HD Video Classes', 'value' => '5,000+'],
                        ['label' => 'Success Rate', 'value' => '98%'],
                    ]
                ]
            ],
            [
                'id' => 'block_teachers_1',
                'type' => 'teachers_showcase',
                'title' => 'Faculty & Mentors Section',
                'settings' => [
                    'sectionTag' => 'Mentor Panel',
                    'sectionTitle' => 'Prepare with the Nation’s Best Mentors',
                    'sectionSub' => 'Guiding thousands of learners year-round toward their dream campuses.',
                    'limit' => 8,
                ]
            ],
            [
                'id' => 'block_video_testimonials_1',
                'type' => 'video_testimonials',
                'title' => 'Video Testimonials Section',
                'settings' => [
                    'sectionTag' => 'Student Stories & Video Reviews',
                    'sectionTitle' => 'What Our Students Say',
                    'sectionSub' => 'Real journeys, genuine experiences, and success stories shared on camera.',
                    'items' => [
                        [
                            'id' => 'v1',
                            'name' => 'Samiul',
                            'role' => 'NovoNex Student Review',
                            'videoUrl' => 'https://youtu.be/Cbw_yhBGM_4',
                            'thumbnailUrl' => '',
                        ],
                        [
                            'id' => 'v2',
                            'name' => 'Khurshed',
                            'role' => 'NovoNex Student Review',
                            'videoUrl' => 'https://youtu.be/Zt7yfNIbInQ',
                            'thumbnailUrl' => '',
                        ],
                    ]
                ]
            ],
            [
                'id' => 'block_learning_path_1',
                'type' => 'learning_path',
                'title' => 'Learning Methodology Section',
                'settings' => [
                    'sectionTag' => 'Learning Methodology',
                    'sectionTitle' => '4-Step Proven Methodology for 100% Preparation',
                    'sectionSub' => 'A structured roadmap from core concepts to top exam performance.',
                    'steps' => [
                        ['id' => 'step_1', 'num' => '01', 'title' => 'Basics & Concept Clearing', 'desc' => 'Clear theory breakdown using animations and real-world examples.'],
                        ['id' => 'step_2', 'num' => '02', 'title' => 'Topic-wise Problem Solving', 'desc' => 'Complete solutions for past board and top college exam problems.'],
                        ['id' => 'step_3', 'num' => '03', 'title' => '24/7 AI Doubt Resolution', 'desc' => 'Instant doubt assistance anytime during your self-study.'],
                        ['id' => 'step_4', 'num' => '04', 'title' => 'Live Model Tests & Rankings', 'desc' => 'Timed assessments in a real exam environment to boost confidence.'],
                    ]
                ]
            ],
            [
                'id' => 'block_testimonials_1',
                'type' => 'testimonials',
                'title' => 'Student Reviews & Testimonials',
                'settings' => [
                    'sectionTag' => 'Student Reviews',
                    'sectionTitle' => 'Success Stories from Our Students',
                    'sectionSub' => 'Real experiences and milestones shared by our learners.',
                    'items' => [
                        [
                            'id' => 'test_1',
                            'name' => 'Tanvir Ahmed',
                            'role' => "BUET '23 Batch",
                            'rating' => 5,
                            'avatar' => '',
                            'quote' => 'The physics and mathematics classes completely transformed my concept clarity. The doubt solving system is simply outstanding!'
                        ],
                        [
                            'id' => 'test_2',
                            'name' => 'Sadia Afrin',
                            'role' => 'Dhaka Medical College',
                            'rating' => 5,
                            'avatar' => '',
                            'quote' => 'The online exam environment feels just like the actual test. Checking the merit ranking helped me spot and fix my mistakes easily.'
                        ],
                        [
                            'id' => 'test_3',
                            'name' => 'Farhan Kabir',
                            'role' => 'Notre Dame College, GPA 5',
                            'rating' => 5,
                            'avatar' => '',
                            'quote' => 'The lecture sheets are so well-organized that I could complete my entire revision without needing any other books.'
                        ],
                    ]
                ]
            ],
            [
                'id' => 'block_faq_1',
                'type' => 'faq_accordion',
                'title' => 'FAQ Accordion Section',
                'settings' => [
                    'sectionTag' => 'Frequently Asked Questions',
                    'sectionTitle' => 'Answers to Common Questions',
                    'sectionSub' => 'Key information regarding enrollment, classes, and exams.',
                    'items' => [
                        [
                            'id' => 'faq_1',
                            'q' => 'How do I purchase or enroll in a NovoNex course?',
                            'a' => 'Click the "Enroll Now" or "Buy Course" button on any course card. Complete the payment via bKash, Nagad, or Rocket and submit your TrxID for fast activation.'
                        ],
                        [
                            'id' => 'faq_2',
                            'q' => 'Are recorded classes and lecture sheets provided alongside live sessions?',
                            'a' => 'Yes, every live class is automatically saved in full HD in your archive, accessible for unlimited revisions until exam day, complete with printable lecture notes.'
                        ],
                        [
                            'id' => 'faq_3',
                            'q' => 'How does NexPilot AI Doubt Solver assist in studies?',
                            'a' => 'NexPilot is a 24/7 AI tutor aligned with your curriculum. Whenever you are stuck on a formula or problem, get instant explanations within seconds.'
                        ],
                        [
                            'id' => 'faq_4',
                            'q' => 'How do online model tests and merit positions work?',
                            'a' => 'Tests feature timers and negative marking matching real board and university formats. Immediate scores, solution explanations, and rankings are displayed upon submission.'
                        ],
                        [
                            'id' => 'faq_5',
                            'q' => 'Can I access the courses on both mobile and computer devices?',
                            'a' => 'Yes! Our platform runs seamlessly across all smartphones, tablets, laptops, and desktop computers.'
                        ]
                    ]
                ]
            ],
            [
                'id' => 'block_cta_1',
                'type' => 'cta_banner',
                'title' => 'Bottom CTA Banner',
                'settings' => [
                    'badge' => 'Admissions Open',
                    'title' => 'Join the Premier Online Learning Platform Today',
                    'subtitle' => 'We are with you at every step of your journey. Enroll in your target course now and start preparing.',
                    'buttonText' => 'Browse Courses',
                    'buttonLink' => '/courses',
                    'bgColor' => 'sky',
                ]
            ],
        ];
    }

    /**
     * Default courses page block template
     */
    public static function defaultCoursesBlocks(): array
    {
        $categories = Category::whereNotIn('slug', ['free-courses', 'paid-courses'])->get();

        $tabs = [
            [
                'id' => 'tab_all',
                'label' => 'All Courses',
                'type' => 'category',
                'categorySlug' => 'all',
            ]
        ];

        $selectedSlugs = [];
        foreach ($categories as $cat) {
            $selectedSlugs[] = $cat->slug;
            $tabs[] = [
                'id' => 'tab_' . $cat->slug,
                'label' => $cat->name,
                'type' => 'category',
                'categorySlug' => $cat->slug,
            ];
        }

        return [
            [
                'id' => 'block_hero_courses',
                'type' => 'cta_banner',
                'title' => 'Courses Page Banner',
                'settings' => [
                    'badge' => 'Course Catalog & Subjects',
                    'title' => 'All Courses',
                    'subtitle' => 'Choose the right course to achieve your goals. Comprehensive preparation with experienced mentors.',
                    'bgColor' => 'sky',
                    'buttonText' => '',
                    'buttonLink' => '',
                ]
            ],
            [
                'id' => 'block_course_tabs_courses',
                'type' => 'course_tabs',
                'title' => 'Courses Grid & Category Tabs',
                'settings' => [
                    'headingTag' => 'Courses',
                    'headingTitle' => 'All Courses by Category',
                    'limit' => 12,
                    'showAllTab' => true,
                    'allTabLabel' => 'All Courses',
                    'selectedCategorySlugs' => $selectedSlugs,
                    'tabs' => $tabs,
                    'dynamicCategories' => false,
                ]
            ]
        ];
    }

    /**
     * Default blocks for an individual category page
     */
    public static function defaultCategoryBlocks(Category $category): array
    {
        return [
            [
                'id' => 'block_hero_' . $category->slug,
                'type' => 'cta_banner',
                'title' => $category->name . ' Banner',
                'settings' => [
                    'badge' => 'Subject Courses',
                    'title' => $category->name,
                    'subtitle' => $category->description ?? ('Explore all premium live and recorded courses for ' . $category->name . '.'),
                    'bgColor' => 'indigo',
                    'buttonText' => 'View All Courses',
                    'buttonLink' => '/courses',
                ]
            ],
            [
                'id' => 'block_tabs_' . $category->slug,
                'type' => 'course_tabs',
                'title' => $category->name . ' Courses Grid',
                'settings' => [
                    'headingTag' => 'Course Catalog',
                    'headingTitle' => 'Courses in ' . $category->name,
                    'limit' => 12,
                    'showAllTab' => false,
                    'selectedCategorySlugs' => [$category->slug],
                    'tabs' => [
                        [
                            'id' => 'tab_' . $category->slug,
                            'label' => $category->name,
                            'type' => 'category',
                            'categorySlug' => $category->slug,
                        ]
                    ],
                    'dynamicCategories' => false,
                ]
            ]
        ];
    }

    /**
     * Sync all database categories into individual editable pages in the pages list.
     */
    public static function syncCategoryPages(): array
    {
        $categories = Category::whereNotIn('slug', ['free-courses', 'paid-courses'])->get();
        $synced = [];

        foreach ($categories as $category) {
            $slug = 'category-' . $category->slug;
            $page = static::firstOrCreate(
                ['slug' => $slug],
                [
                    'title' => $category->name,
                    'status' => 'published',
                    'layout_type' => 'category',
                    'is_system' => false,
                    'meta_title' => $category->name . ' - NovoNex',
                    'meta_description' => $category->description ?? ($category->name . ' courses and materials.'),
                    'blocks' => static::defaultCategoryBlocks($category),
                ]
            );

            $synced[] = $page;
        }

        // Also ensure system Courses page exists
        static::firstOrCreate(
            ['slug' => 'courses'],
            [
                'title' => 'All Courses',
                'status' => 'published',
                'layout_type' => 'builder',
                'is_system' => true,
                'meta_title' => 'All Courses - NovoNex',
                'meta_description' => 'Browse all subject-based preparation courses.',
                'blocks' => static::defaultCoursesBlocks(),
            ]
        );

        return $synced;
    }
}
