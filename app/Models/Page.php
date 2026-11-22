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
     * Default home page block template matching DoctorWallah MBBS Medical design
     */
    public static function defaultHomeBlocks(): array
    {
        return [
            [
                'id' => 'block_ribbon_1',
                'type' => 'top_announcement',
                'title' => 'Top Campaign Ribbon',
                'settings' => [
                    'badge' => '🩺 MBBS 2026 Batch',
                    'text' => 'Admissions open for MBBS 1st Phase, Cards & Term All-in-One Programs! Access 1,250+ video lectures & marked standard books.',
                    'linkText' => 'Explore MBBS Courses →',
                    'linkUrl' => '/courses',
                    'bgColor' => 'from-teal-800 via-sky-700 to-emerald-600',
                ]
            ],
            [
                'id' => 'block_features_1',
                'type' => 'features',
                'title' => 'The Clinical Vault Hero Bento Grid',
                'settings' => [
                    'sectionTag' => '🩺 BANGLADESH\'S #1 MBBS ACADEMIC PLATFORM',
                    'sectionTitle' => 'Medical Academic Excellence, From Item & Card Prep To 1st Prof Success!',
                    'sectionSub' => 'বাংলাদেশের সকল মেডিকেল কলেজের শিক্ষার্থীদের জন্য পূর্ণাঙ্গ ক্লিনিক্যাল ও অ্যাকাডেমিক আর্কিটেকচার — ৪K ক্যাডাভারিক ডিসেকশন ও ভিসেরা থিয়েটার, ১০ মিনিট আইটেম রিভিশন এবং লাইন-বাই-লাইন দাগানো স্ট্যান্ডার্ড বই (BDC, Guyton, Ganong, Datta, Langman)।',
                    'items' => [
                        [
                            'id' => 'feat_1',
                            'icon' => 'Award',
                            'title' => 'রিসার্চ বেজড কনসেপচুয়াল ক্লাস',
                            'desc' => 'প্রতিটি আইটেম ও কার্ডের জন্য রয়েছে গভীর কনসেপচুয়াল ক্লাস, ক্লিনিক্যাল কো-রিলেশন ও হাই-ইল্ড অ্যানালাইসিস।'
                        ],
                        [
                            'id' => 'feat_2',
                            'icon' => 'Zap',
                            'title' => '১০ মিনিট আইটেম ওভারভিউ ক্লাস',
                            'desc' => 'আইটেম বা কার্ড পরীক্ষার ঠিক আগের দিন দ্রুত রিভিশনের জন্য সাজানো হয়েছে স্পেশাল ১০ মিনিটের আইটেম ক্র্যাশ লেকচার।'
                        ],
                        [
                            'id' => 'feat_3',
                            'icon' => 'Video',
                            'title' => 'ডিসেকশন ও ভিজ্যুয়ালাইজেশন ডেমোনস্ট্রেশন',
                            'desc' => 'অ্যানাটমির ক্যাডাভারিক ডিসেকশন ভিডিও এবং ভিসেরা ডেমো ক্লাস যাতে অস্পি ও ভাইভায় সর্বোচ্চ কনফিডেন্স পাওয়া যায়।'
                        ],
                        [
                            'id' => 'feat_4',
                            'icon' => 'FileText',
                            'title' => 'সোফিস্টিকেটেড দাগানো বই (Marked Books)',
                            'desc' => 'Guyton, BDC, Datta, Snell, Langman বইগুলোর কোন কোন লাইন আইটেমে জানতে চাওয়া হয়, তা দাগানো সফট-কপি ও স্লাইড।'
                        ]
                    ]
                ]
            ],
            [
                'id' => 'block_bundle_1',
                'type' => 'bundle_showcase',
                'title' => 'Course Bundles Section',
                'settings' => [
                    'sectionTag' => 'অল-ইন-ওয়ান টার্ম প্যাকেজ',
                    'sectionTitle' => 'MBBS First Phase কমপ্লিট কার্ড ও টার্ম বান্ডেল',
                    'sectionSub' => 'একক সাবজেক্টের পাশাপাশি পুরো টার্ম বা কার্ড বান্ডেলে এনরোল করে এক ক্লিকেই সব ক্লাস ও মেটেরিয়াল অ্যাক্সেস করুন।',
                    'limit' => 6,
                ]
            ],
            [
                'id' => 'block_course_tabs_1',
                'type' => 'course_tabs',
                'title' => 'Courses Grid & Tabs',
                'settings' => [
                    'headingTag' => 'MBBS অ্যাকাডেমিক কারিকুলাম',
                    'headingTitle' => 'আমাদের ফ্ল্যাগশিপ MBBS কোর্স ও কার্ডসমূহ',
                    'viewAllText' => 'সকল কোর্স দেখুন',
                    'viewAllLink' => '/courses',
                    'limit' => 12,
                    'tabs' => [
                        [
                            'id' => 'tab_all',
                            'label' => 'All MBBS Courses',
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
                        ['label' => 'এনরোল্ড মেডিকেল শিক্ষার্থী', 'value' => '৫৫০+'],
                        ['label' => 'মোট MBBS লেকচার', 'value' => '১,২৫০+'],
                        ['label' => 'দাগানো স্ট্যান্ডার্ড বই ও মেটেরিয়াল', 'value' => '১২০+'],
                        ['label' => 'সাকসেস ও স্যাটিসফ্যাকশন রেট', 'value' => '৯৯%'],
                    ]
                ]
            ],
            [
                'id' => 'block_teachers_1',
                'type' => 'teachers_showcase',
                'title' => 'Faculty & Mentors Section',
                'settings' => [
                    'sectionTag' => 'মেন্টর ও ফ্যাকাল্টি প্যানেল',
                    'sectionTitle' => 'দেশসেরা মেডিকেল মেন্টরদের সাথে প্রস্তুতি নিন',
                    'sectionSub' => 'মেডিকেল কারিকুলামের জটিল বিষয়গুলোকে সহজ ও প্রাঞ্জল করে উপস্থাপনকারী অভিজ্ঞ মেন্টরবৃন্দ।',
                    'limit' => 8,
                ]
            ],
            [
                'id' => 'block_video_testimonials_1',
                'type' => 'video_testimonials',
                'title' => 'Video Testimonials Section',
                'settings' => [
                    'sectionTag' => 'মেডিকেল শিক্ষার্থীদের রিভিউ',
                    'sectionTitle' => 'আমাদের শিক্ষার্থীরা যা বলছে',
                    'sectionSub' => 'ক্যামেরার সামনে শিক্ষার্থীদের সরাসরি অভিজ্ঞতা ও মতামত।',
                    'items' => [
                        [
                            'id' => 'v1',
                            'name' => 'Samiul',
                            'role' => 'DoctorWallah Medical Student Review',
                            'videoUrl' => 'https://youtu.be/Cbw_yhBGM_4',
                            'thumbnailUrl' => '',
                        ],
                        [
                            'id' => 'v2',
                            'name' => 'Khurshed',
                            'role' => 'DoctorWallah Medical Student Review',
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
                    'sectionTag' => 'প্রফ প্রিপারেশন রোডম্যাপ',
                    'sectionTitle' => '৪ ধাপে MBBS আইটেম, কার্ড ও ১st প্রফ প্রস্তুতি',
                    'sectionSub' => 'বেসিক কনসেপ্ট ক্লিয়ারিং থেকে প্রফ পরীক্ষায় ডিস্টিংশন মার্কস অর্জনের কার্যকরী গাইডলাইন।',
                    'steps' => [
                        ['id' => 'step_1', 'num' => '০১', 'title' => 'কনসেপ্ট ক্লিয়ারিং ও থিওরি ক্লাস', 'desc' => 'ক্লিনিক্যাল কো-রিলেশন ও ডায়াগ্রামের সাহায্যে প্রতিটি চ্যাপ্টারের গভীর কনসেপ্ট অর্জন।'],
                        ['id' => 'step_2', 'num' => '০২', 'title' => '১০ মিনিট কুইক আইটেম ওভারভিউ', 'desc' => 'আইটেমের আগের রাতে পুরো অধ্যায় ১০ মিনিটে রিভিশন ও ভাইভা প্রশ্নের পূর্ণ প্রস্তুতি।'],
                        ['id' => 'step_3', 'num' => '০৩', 'title' => 'ডিসেকশন, ভিসেরা ও ওস্পি ডেমো', 'desc' => 'ক্যাডাভারিক ডিসেকশন ভিডিও ও ভিসেরা ভিজ্যুয়ালাইজেশনের মাধ্যমে প্র্যাকটিক্যাল এক্সিলেন্স।'],
                        ['id' => 'step_4', 'num' => '০৪', 'title' => 'দাগানো বই (Marked Book) রিভিশন', 'desc' => 'স্ট্যান্ডার্ড টেক্সটবুকের দাগানো অংশ পড়ে রিটেন ও ভাইভায় সর্বোচ্চ নম্বর নিশ্চিত করা।'],
                    ]
                ]
            ],
            [
                'id' => 'block_testimonials_1',
                'type' => 'testimonials',
                'title' => 'Student Reviews & Testimonials',
                'settings' => [
                    'sectionTag' => 'মেডিকেল শিক্ষার্থীদের অভিজ্ঞতা',
                    'sectionTitle' => 'আমাদের শিক্ষার্থীদের অভিমত',
                    'sectionSub' => 'দেশের বিভিন্ন মেডিকেল কলেজের ছাত্র-ছাত্রীদের বাস্তব অভিজ্ঞতা ও রিভিউ।',
                    'items' => [
                        [
                            'id' => 'test_1',
                            'name' => 'Dr. Tanvir Ahmed',
                            'role' => "Dhaka Medical College",
                            'rating' => 5,
                            'avatar' => '',
                            'quote' => 'DoctorWallah এর অ্যানাটমি ডিসেকশন ক্লাস এবং দাগানো বই আমার ফার্স্ট প্রফের অ্যানাটমি কার্ডে ডিস্টিংশন মার্কস পেতে সবচেয়ে বড় সাহায্য করেছে!'
                        ],
                        [
                            'id' => 'test_2',
                            'name' => 'Sadia Afrin',
                            'role' => 'Chittagong Medical College',
                            'rating' => 5,
                            'avatar' => '',
                            'quote' => 'ফিজিওলজির গাইটনের জটিল মেকানিজমগুলো এত সহজে ১০ মিনিট ওভারভিউ ক্লাসে বুঝিয়ে দেওয়া হয়েছে যে আইটেম দেওয়া এখন একদম সহজ!'
                        ],
                        [
                            'id' => 'test_3',
                            'name' => 'Nafis Fuad',
                            'role' => 'Sir Salimullah Medical College',
                            'rating' => 5,
                            'avatar' => '',
                            'quote' => 'বায়োকেমিস্ট্রির সাইকেল আর মেটাবলিজমের কনসেপ্ট ক্লিয়ারিং ক্লাসের কোনো তুলনা নেই। মেডিকেল লাইফে এটি সেরা গাইডলাইন।'
                        ],
                    ]
                ]
            ],
            [
                'id' => 'block_faq_1',
                'type' => 'faq_accordion',
                'title' => 'FAQ Accordion Section',
                'settings' => [
                    'sectionTag' => 'সাধারণ জিজ্ঞাসাসমূহ (FAQ)',
                    'sectionTitle' => 'মেডিকেল শিক্ষার্থীদের সাধারণ প্রশ্নের উত্তর',
                    'sectionSub' => 'কোর্স এনরোলমেন্ট, ক্লাস এক্সেস ও স্টাডি মেটেরিয়াল সম্পর্কিত তথ্য।',
                    'items' => [
                        [
                            'id' => 'faq_1',
                            'q' => 'DoctorWallah-তে কোন কোন মেডিকেল কলেজের শিক্ষার্থীরা পড়তে পারবে?',
                            'a' => 'বাংলাদেশের যেকোনো সরকারি ও বেসরকারি মেডিকেল কলেজের MBBS শিক্ষার্থীরা (ঢাকা বিশ্ববিদ্যালয়, চমেবি, রাবি, শেবাচিম বা বিএসএমএমইউ অধিভুক্ত) আমাদের কোর্সগুলো করে তাদের আইটেম, কার্ড, টার্ম ও প্রফ পরীক্ষার সম্পূর্ণ প্রস্তুতি নিতে পারবে।'
                        ],
                        [
                            'id' => 'faq_2',
                            'q' => 'ভিডিও ক্লাসের পাশাপাশি কি দাগানো স্ট্যান্ডার্ড বই ও লেকচার নোটস পাওয়া যাবে?',
                            'a' => 'হ্যাঁ! প্রতিটি ক্লাসের সাথে রয়েছে স্ট্যান্ডার্ড বইয়ের হাই-ইল্ড দাগানো সফট-কপি (Marked Books - BDC, Guyton, Datta, Langman), স্লাইড ড্রাইভ ফোল্ডার এবং এক্সপ্ল্যানেশন নোটস।'
                        ],
                        [
                            'id' => 'faq_3',
                            'q' => 'অ্যানাটমির প্র্যাকটিক্যাল, ভিসেরা ও ডিসেকশন কীভাবে শেখানো হয়?',
                            'a' => 'আমাদের অ্যানাটমি কোর্সগুলোতে রয়েছে ক্যাডাভারিক ডিসেকশন ভিডিও, ভিসেরা ডেমোনস্ট্রেশন এবং অস্পি (OSPE) স্পেশাল ক্লাস যা রিয়েল প্র্যাকটিক্যাল ফিল দেয়।'
                        ],
                        [
                            'id' => 'faq_4',
                            'q' => 'আমি কি মোবাইল ও ল্যাপটপ উভয় ডিভাইস থেকেই ক্লাস করতে পারব?',
                            'a' => 'হ্যাঁ, আমাদের প্ল্যাটফর্ম পুরোপুরি রেসপনসিভ। যেকোনো স্মার্টফোন, ট্যাবলেট, ল্যাপটপ বা ডেস্কটপ থেকে হাই-স্পিড ভিমিও প্লেয়ারে বাফারলেস ক্লাস দেখা যাবে।'
                        ],
                        [
                            'id' => 'faq_5',
                            'q' => 'আইটেম বা কার্ড পরীক্ষার আগে কুইক রিভিশনের কোনো ব্যবস্থা আছে কি?',
                            'a' => 'একদমই তাই! প্রতিটি টপিকের জন্য রয়েছে "১০ মিনিট আইটেম ওভারভিউ ক্লাস", যা আইটেম পরীক্ষার ঠিক আগের রাতে পুরো অধ্যায় দ্রুত রিভিশন করতে সহায়তা করে।'
                        ]
                    ]
                ]
            ],
            [
                'id' => 'block_cta_1',
                'type' => 'cta_banner',
                'title' => 'Bottom CTA Banner',
                'settings' => [
                    'badge' => '🩺 MBBS এনরোলমেন্ট চলমান',
                    'title' => 'বাংলাদেশের মেডিকেল শিক্ষার্থীদের ১ নম্বর প্ল্যাটফর্মে আজই যুক্ত হোন',
                    'subtitle' => 'আইটেম ক্লিয়ারিং থেকে প্রফ পরীক্ষা — আপনার মেডিকেল শিক্ষা জীবনের প্রতিটি পদক্ষেপে ডক্টরওয়ালাহ সবসময় আপনার পাশে রয়েছে।',
                    'buttonText' => 'সকল MBBS কোর্স দেখুন',
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
                    'meta_title' => $category->name . ' - DoctorWallah',
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
                'meta_title' => 'All Courses - DoctorWallah',
                'meta_description' => 'Browse all subject-based preparation courses.',
                'blocks' => static::defaultCoursesBlocks(),
            ]
        );

        return $synced;
    }
}
