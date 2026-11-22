<?php

use App\Models\Category;
use App\Models\Course;
use App\Models\CourseSection;
use App\Models\Lesson;
use App\Models\Page;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Create or Find Categories
        $catMbbsFirstPhase = Category::firstOrCreate(
            ['slug' => 'mbbs-first-phase'],
            [
                'name' => 'MBBS First Phase',
                'description' => 'MBBS ১ম ফেজের সকল কার্ড ও টার্মের পূর্ণাঙ্গ কোর্স ও শিক্ষা সামগ্রী।',
            ]
        );

        $catCards = Category::firstOrCreate(
            ['slug' => 'mbbs-cards'],
            [
                'name' => 'MBBS Cards',
                'description' => 'MBBS ১ম ফেজের সকল কার্ডের পৃথক ও সমন্বিত কোর্সসমূহ।',
            ]
        );

        $catTerms = Category::firstOrCreate(
            ['slug' => 'term-courses'],
            [
                'name' => 'Term Courses',
                'description' => 'MBBS ১ম ও ২য় টার্মের পূর্ণাঙ্গ প্রস্তুতি কোর্স।',
            ]
        );

        $catAnatomy = Category::firstOrCreate(
            ['slug' => 'anatomy'],
            [
                'name' => 'Anatomy',
                'description' => 'Thorax, Upper Limb, Lower Limb, General Histology & Embryology.',
            ]
        );

        $catPhysiology = Category::firstOrCreate(
            ['slug' => 'physiology'],
            [
                'name' => 'Physiology',
                'description' => 'General Physiology, Blood, CVS, GI & Renal Physiology.',
            ]
        );

        $catBiochemistry = Category::firstOrCreate(
            ['slug' => 'biochemistry'],
            [
                'name' => 'Biochemistry',
                'description' => 'Biophysics, Biomolecules, Food & Nutrition, Renal Biochemistry.',
            ]
        );

        // 2. Define Main Group Programs (from thuhashop.com/doctorwallah/)
        $mainPrograms = [
            [
                'title' => 'MBBS 4th Card',
                'slug' => 'mbbs-4th-card',
                'short_description' => 'MBBS 4th Card Complete Preparation Course (Anatomy, Physiology & Biochemistry).',
                'description' => 'DoctorWallah এর MBBS 4th Card পূর্ণাঙ্গ কোর্স। এতে অন্তর্ভুক্ত রয়েছে Inferior Extremity Anatomy, Gastrointestinal Physiology, Renal Physiology এবং Renal Biochemistry এর উচ্চমানের কনসেপচুয়াল ও আইটেম ওরিয়েন্টেড ক্লাস।',
                'price' => 900,
                'sale_price' => 900,
                'thumbnail' => '/courses-thumbnails/mbbs-4th-card.png',
                'is_featured' => true,
                'fake_enrollment_count' => 142,
                'class_starts_at' => 'চলমান (Ongoing)',
                'features' => [
                    '🩺 Anatomy – Inferior Extremity',
                    '📚 Physiology – Gastrointestinal Physiology',
                    '🔬 Physiology – Renal Physiology',
                    '🧪 Biochemistry – Renal Biochemistry',
                    '🔍 Curiosity Satisfying Research Based Class',
                    '⏱️ 10 Minute Item Overview Class',
                    '🧪 Practical / Demonstration / Visualization / Correlating Class',
                    '📚 Sophisticated Soft Copy Materials (Marked Book with Explanation)',
                    '💡 Clinical Problem Based Class',
                ],
                'categories' => [$catMbbsFirstPhase->id, $catCards->id],
                'sections' => [
                    [
                        'title' => 'Anatomy – Inferior Extremity',
                        'lessons' => [
                            ['title' => 'Inferior Extremity Overview & Osteology Breakdown', 'is_preview' => true, 'duration' => 45],
                            ['title' => 'Femoral Triangle, Adductor Canal & Gluteal Region', 'is_preview' => false, 'duration' => 60],
                            ['title' => 'Thigh, Leg & Foot Compartments and Nerve Supply', 'is_preview' => false, 'duration' => 55],
                            ['title' => 'Important Clinical Conditions & Card Item Questions', 'is_preview' => false, 'duration' => 40],
                        ],
                    ],
                    [
                        'title' => 'Physiology – Gastrointestinal Physiology',
                        'lessons' => [
                            ['title' => 'GI Motility, Secretions & Digestion-Absorption Mechanics', 'is_preview' => false, 'duration' => 50],
                            ['title' => 'Liver, Gallbladder & Pancreatic Function Tests', 'is_preview' => false, 'duration' => 45],
                        ],
                    ],
                    [
                        'title' => 'Physiology – Renal Physiology',
                        'lessons' => [
                            ['title' => 'Renal Circulation & Glomerular Filtration Rate (GFR)', 'is_preview' => false, 'duration' => 55],
                            ['title' => 'Tubular Reabsorption, Countercurrent & Urine Concentration', 'is_preview' => false, 'duration' => 50],
                            ['title' => 'Acid-Base Balance Regulation by Kidneys', 'is_preview' => false, 'duration' => 40],
                        ],
                    ],
                    [
                        'title' => 'Biochemistry – Renal Biochemistry',
                        'lessons' => [
                            ['title' => 'Kidney Function Biomarkers & Urea Clearance', 'is_preview' => false, 'duration' => 45],
                            ['title' => 'Abnormal Constituents of Urine & Clinical Pathology', 'is_preview' => false, 'duration' => 40],
                        ],
                    ],
                ],
            ],

            [
                'title' => 'MBBS First Phase 1st Term',
                'slug' => 'mbbs-first-phase-1st-term',
                'short_description' => 'MBBS First Phase 1st Term Full Comprehensive Master Course.',
                'description' => 'MBBS First Phase এর ১ম টার্মের পূর্ণাঙ্গ প্যাকেজ কোর্স। এতে ১ম টার্মের অন্তর্ভুক্ত সকল সাবজেক্টের কার্ড কোর্স (Thorax, Cellular Physiology & Blood, Biophysics, General Histology & Embryology, Upper Limb, CVS, Food & Nutrition) সমন্বিতভাবে রয়েছে।',
                'price' => 1799,
                'sale_price' => 1799,
                'thumbnail' => '/courses-thumbnails/mbbs-first-phase-1st-term.jpeg',
                'is_featured' => true,
                'fake_enrollment_count' => 285,
                'class_starts_at' => 'চলমান (Ongoing)',
                'features' => [
                    '🔍 Curiosity Satisfying Research Based Class',
                    '⏱️ 10 Minute Item Overview Class',
                    '🧪 Practical / Demonstration / Visualization / Correlating Class',
                    '📚 Sophisticated Soft Copy Materials (Marked Book with Explanation)',
                    '💡 Clinical Problem Based Class',
                    '🩺 Anatomy Thorax Card',
                    '🩸 Cellular Physiology & Blood Card',
                    '🧬 Biophysics & Biomolecules Card',
                    '🔬 General Histology & Embryology',
                    '💪 Superior Extremity Card (Upper Limb)',
                    '❤️ Cardiovascular System Card',
                    '🥗 Food & Nutrition Card',
                ],
                'categories' => [$catMbbsFirstPhase->id, $catTerms->id],
                'sections' => [
                    [
                        'title' => 'Anatomy Thorax Card',
                        'lessons' => [
                            ['title' => 'Thoracic Cage, Intercostal Spaces & Mechanism of Respiration', 'is_preview' => true, 'duration' => 50],
                            ['title' => 'Lungs, Bronchopulmonary Segments & Pleura', 'is_preview' => false, 'duration' => 55],
                            ['title' => 'Mediastinum & Internal Anatomy of Heart', 'is_preview' => false, 'duration' => 60],
                        ],
                    ],
                    [
                        'title' => 'Cellular Physiology & Blood Card',
                        'lessons' => [
                            ['title' => 'Functional Organization of the Cell & Transport Across Cell Membrane', 'is_preview' => false, 'duration' => 45],
                            ['title' => 'Erythropoiesis, Hemoglobin & Nutritional Anemias', 'is_preview' => false, 'duration' => 50],
                            ['title' => 'Hemostasis, Coagulation Mechanism & Blood Grouping', 'is_preview' => false, 'duration' => 55],
                        ],
                    ],
                    [
                        'title' => 'Biophysics & Biomolecules Card',
                        'lessons' => [
                            ['title' => 'Chemistry & Classification of Carbohydrates, Lipids & Proteins', 'is_preview' => false, 'duration' => 50],
                            ['title' => 'Enzyme Kinetics, Coenzymes & Diagnostic Enzymology', 'is_preview' => false, 'duration' => 45],
                        ],
                    ],
                    [
                        'title' => 'General Histology & Embryology',
                        'lessons' => [
                            ['title' => 'Epithelial, Connective, Muscular & Nervous Tissues', 'is_preview' => false, 'duration' => 50],
                            ['title' => 'Gametogenesis, Fertilization & Bilaminar/Trilaminar Germ Disc', 'is_preview' => false, 'duration' => 55],
                        ],
                    ],
                    [
                        'title' => 'Superior Extremity Card (Upper Limb)',
                        'lessons' => [
                            ['title' => 'Pectoral Region, Axilla & Brachial Plexus Anatomy', 'is_preview' => false, 'duration' => 60],
                            ['title' => 'Arm, Forearm, Cubital Fossa & Palmar Spaces', 'is_preview' => false, 'duration' => 55],
                        ],
                    ],
                    [
                        'title' => 'Cardiovascular System Card',
                        'lessons' => [
                            ['title' => 'Cardiac Muscle Properties, Pacemaker Potential & ECG Basics', 'is_preview' => false, 'duration' => 55],
                            ['title' => 'Cardiac Cycle, Heart Sounds, Cardiac Output & BP Regulation', 'is_preview' => false, 'duration' => 60],
                        ],
                    ],
                    [
                        'title' => 'Food & Nutrition Card',
                        'lessons' => [
                            ['title' => 'Nutritional Requirements, Energy Balance & Fat-Soluble Vitamins', 'is_preview' => false, 'duration' => 45],
                            ['title' => 'Water-Soluble Vitamins & Mineral Micronutrients', 'is_preview' => false, 'duration' => 45],
                        ],
                    ],
                ],
            ],

            [
                'title' => 'MBBS First Phase 2nd Term',
                'slug' => 'mbbs-first-phase-2nd-term',
                'short_description' => 'MBBS First Phase 2nd Term Comprehensive Preparation Course.',
                'description' => 'MBBS First Phase এর ২য় টার্মের শিক্ষার্থীদের জন্য সম্পূর্ণ গাইডেন্স ও মাস্টার ক্লাস। সকল গুরুত্বপূর্ণ আইটেম, ভাইভা প্রশ্ন ও রিটেন সাজেশনের স্পেশালাইজড প্রস্তুতি।',
                'price' => 2000,
                'sale_price' => 2000,
                'thumbnail' => '/courses-thumbnails/mbbs-first-phase-2nd-term.jpeg',
                'is_featured' => true,
                'fake_enrollment_count' => 198,
                'class_starts_at' => 'চলমান (Ongoing)',
                'features' => [
                    '1️⃣ Curiosity Satisfying Research Based Class',
                    '2️⃣ 10 Minute Item Overview Class',
                    '3️⃣ Practical / Demonstration / Visualization / Correlating Class',
                    '✨ Sophisticated Soft Copy Materials (Marked Book with Explanation)',
                    '✨ Clinical Problem Based Class',
                    '🎯 High-Yield Item & Viva Questions Preparation',
                ],
                'categories' => [$catMbbsFirstPhase->id, $catTerms->id],
                'sections' => [
                    [
                        'title' => '3rd Card Preparation & Lectures',
                        'lessons' => [
                            ['title' => 'Head & Neck Overview & Cranial Nerve Organization', 'is_preview' => true, 'duration' => 50],
                            ['title' => 'Endocrine System Physiology & Hormone Action Mechanisms', 'is_preview' => false, 'duration' => 55],
                        ],
                    ],
                    [
                        'title' => '4th Card Preparation & Lectures',
                        'lessons' => [
                            ['title' => 'Inferior Extremity Anatomy Key Landmark Classes', 'is_preview' => false, 'duration' => 50],
                            ['title' => 'Renal & Gastrointestinal Physiology Core Item Solutions', 'is_preview' => false, 'duration' => 55],
                        ],
                    ],
                    [
                        'title' => '2nd Term Final Comprehensive Assessment',
                        'lessons' => [
                            ['title' => 'Card Final Viva & Written High-Yield Mastery Strategies', 'is_preview' => false, 'duration' => 45],
                        ],
                    ],
                ],
            ],

            [
                'title' => '1st Card Full Course',
                'slug' => '1st-card-full-course',
                'short_description' => '1st Card Full Course (Thorax, Blood & Biophysics).',
                'description' => 'MBBS 1st Card এর তিনটি মৌলিক বিষয়: অ্যানাটমি থোরাক্স, ফিজিওলজি ব্লাড অ্যান্ড সেলুলার ফিজিওলজি এবং বায়োকেমিস্ট্রি বায়োফিজিক্স ও বায়োমলিকিউলস এর পূর্ণাঙ্গ ক্লাস।',
                'price' => 999,
                'sale_price' => 999,
                'thumbnail' => '/courses-thumbnails/1st-card-full-course.jpeg',
                'is_featured' => true,
                'fake_enrollment_count' => 230,
                'class_starts_at' => 'চলমান (Ongoing)',
                'features' => [
                    '🔍 Curiosity Satisfying Research Based Class',
                    '⏱️ 10 Minute Item Overview Class',
                    '🧪 Practical / Demonstration / Visualization / Correlating Class',
                    '📚 Sophisticated Soft Copy Materials (Marked Book with Explanation)',
                    '🩺 Anatomy Thorax Card',
                    '🩸 Cellular Physiology & Blood Card',
                    '🧬 Biophysics & Biomolecules Card',
                ],
                'categories' => [$catMbbsFirstPhase->id, $catCards->id],
                'sections' => [
                    [
                        'title' => 'Thorax Anatomy Complete',
                        'lessons' => [
                            ['title' => 'Thoracic Wall & Intercostal Space Anatomy', 'is_preview' => true, 'duration' => 45],
                            ['title' => 'Lungs, Pleural Cavity & Surface Markings', 'is_preview' => false, 'duration' => 50],
                            ['title' => 'Heart, Great Vessels & Pericardium', 'is_preview' => false, 'duration' => 55],
                        ],
                    ],
                    [
                        'title' => 'General & Blood Physiology',
                        'lessons' => [
                            ['title' => 'Cell Physiology & Membrane Transport Systems', 'is_preview' => false, 'duration' => 45],
                            ['title' => 'Erythrocytes, Hemoglobin & Anemia Classification', 'is_preview' => false, 'duration' => 50],
                            ['title' => 'Platelets, Blood Coagulation & Clinical Tests', 'is_preview' => false, 'duration' => 40],
                        ],
                    ],
                    [
                        'title' => 'Biophysics & Biomolecules',
                        'lessons' => [
                            ['title' => 'Colloids, Osmotic Pressure, pH & Buffer Systems', 'is_preview' => false, 'duration' => 45],
                            ['title' => 'Structural Biochemistry of Biomolecules', 'is_preview' => false, 'duration' => 50],
                        ],
                    ],
                ],
            ],

            [
                'title' => '2nd Card Full Course',
                'slug' => '2nd-card-full-course',
                'short_description' => '2nd Card Full Course (Histology, Upper Limb, CVS & Nutrition).',
                'description' => 'MBBS 2nd Card এর সকল বিষয়ের পূর্ণাঙ্গ প্রস্তুতি কোর্স। এতে রয়েছে জেনারেল হিস্টোলজি ও এমব্রায়োলজি, সুপিরিয়র এক্সট্রিমিটি (আপার লিম্ব), কার্ডিওভাসকুলার সিস্টেম (সিভিএস) এবং ফুড অ্যান্ড নিউট্রিশন।',
                'price' => 999,
                'sale_price' => 999,
                'thumbnail' => '/courses-thumbnails/2nd-card-full-course.jpg',
                'is_featured' => true,
                'fake_enrollment_count' => 215,
                'class_starts_at' => 'চলমান (Ongoing)',
                'features' => [
                    '🔍 Curiosity Satisfying Research Based Class',
                    '⏱️ 10 Minute Item Overview Class',
                    '🧪 Practical / Demonstration / Visualization / Correlating Class',
                    '📚 Sophisticated Soft Copy Materials (Marked Book with Explanation)',
                    '💡 Clinical Problem Based Class',
                    '🔬 General Histology & Embryology',
                    '💪 Superior Extremity Card (Upper Limb)',
                    '❤️ Cardiovascular System Card',
                    '🥗 Food & Nutrition Card',
                ],
                'categories' => [$catMbbsFirstPhase->id, $catCards->id],
                'sections' => [
                    [
                        'title' => 'General Histology & Embryology',
                        'lessons' => [
                            ['title' => 'Basic Tissues of Human Body & Microscopy Slides', 'is_preview' => true, 'duration' => 50],
                            ['title' => 'First Three Weeks of Human Embryonic Development', 'is_preview' => false, 'duration' => 55],
                        ],
                    ],
                    [
                        'title' => 'Superior Extremity (Upper Limb)',
                        'lessons' => [
                            ['title' => 'Bones, Joints & Ligaments of Upper Limb', 'is_preview' => false, 'duration' => 50],
                            ['title' => 'Brachial Plexus Lesions & Peripheral Nerve Injuries', 'is_preview' => false, 'duration' => 55],
                        ],
                    ],
                    [
                        'title' => 'Cardiovascular Physiology (CVS)',
                        'lessons' => [
                            ['title' => 'Electrophysiology of Cardiac Conduction & ECG Essentials', 'is_preview' => false, 'duration' => 55],
                            ['title' => 'Hemodynamics, Vascular Resistance & Blood Pressure', 'is_preview' => false, 'duration' => 50],
                        ],
                    ],
                    [
                        'title' => 'Food & Nutrition',
                        'lessons' => [
                            ['title' => 'Vitamins, Mineral Deficiencies & Clinical Malnutrition', 'is_preview' => false, 'duration' => 45],
                        ],
                    ],
                ],
            ],

            [
                'title' => 'MBBS First Phase 3rd Card',
                'slug' => 'mbbs-first-phase-3rd-card',
                'short_description' => 'MBBS First Phase 3rd Card Complete Course.',
                'description' => 'MBBS First Phase এর ৩য় কার্ডের স্পেশাল প্রস্তুতি। অ্যানাটমি হেড অ্যান্ড নেক বেসিকস, ফিজিওলজি এন্ডোক্রিনোলজি এবং বায়োকেমিস্ট্রির জন্য বিশেষভাবে ডিজাইন করা।',
                'price' => 1200,
                'sale_price' => 1200,
                'thumbnail' => '/courses-thumbnails/mbbs-first-phase-3rd-card.jpeg',
                'is_featured' => true,
                'fake_enrollment_count' => 165,
                'class_starts_at' => 'চলমান (Ongoing)',
                'features' => [
                    '🔍 Curiosity Satisfying Research Based Class',
                    '⏱️ 10 Minute Item Overview Class',
                    '🧪 Practical / Demonstration / Visualization / Correlating Class',
                    '📚 Sophisticated Soft Copy Materials (Marked Book with Explanation)',
                    '💡 Clinical Problem Based Class',
                    '🧠 Head & Neck / Neuroanatomy Basics',
                    '🧬 Endocrine Physiology & Metabolism',
                ],
                'categories' => [$catMbbsFirstPhase->id, $catCards->id],
                'sections' => [
                    [
                        'title' => 'Head & Neck Key Gross Features',
                        'lessons' => [
                            ['title' => 'Scalp, Face & Triangles of Neck Overview', 'is_preview' => true, 'duration' => 50],
                            ['title' => 'Pharyngeal Apparatus & Craniofacial Embryology', 'is_preview' => false, 'duration' => 50],
                        ],
                    ],
                    [
                        'title' => 'Endocrinology & Reproductive Physiology',
                        'lessons' => [
                            ['title' => 'Hypothalamic-Pituitary Axis & Target Gland Hormones', 'is_preview' => false, 'duration' => 55],
                            ['title' => 'Thyroid, Parathyroid, Adrenal & Pancreatic Hormones', 'is_preview' => false, 'duration' => 50],
                        ],
                    ],
                    [
                        'title' => 'Metabolism & Bioenergetics',
                        'lessons' => [
                            ['title' => 'Glycolysis, TCA Cycle & Electron Transport Chain', 'is_preview' => false, 'duration' => 45],
                        ],
                    ],
                ],
            ],
        ];

        // 3. Define Modular Card Courses (Individual Cards under the groups)
        $modularCourses = [
            [
                'title' => 'Anatomy Thorax Card',
                'slug' => 'anatomy-thorax-card',
                'short_description' => 'Anatomy Thorax Card Complete Item & Viva Preparation.',
                'description' => 'থোরাক্স অ্যানাটমির সকল আইটেম, ভিসেরা, ক্যাডাভারিক ডিসেকশন ও ভাইভা প্রশ্নের পূর্ণাঙ্গ প্রস্তুতি।',
                'price' => 450,
                'sale_price' => 450,
                'thumbnail' => '/courses-thumbnails/1st-card-full-course.jpeg',
                'is_featured' => false,
                'fake_enrollment_count' => 95,
                'class_starts_at' => 'চলমান (Ongoing)',
                'features' => [
                    '🔍 3D Thoracic Anatomy Visualization',
                    '⏱️ 10 Minute Item Overview Class',
                    '🩺 Thorax Viscera & Dissection Demonstration',
                    '📚 Soft Copy Marked Materials',
                ],
                'categories' => [$catAnatomy->id, $catCards->id],
                'sections' => [
                    [
                        'title' => 'Thoracic Anatomy Modules',
                        'lessons' => [
                            ['title' => 'Thoracic Cage & Ribs Demonstration', 'is_preview' => true, 'duration' => 45],
                            ['title' => 'Lungs, Tracheobronchial Tree & Pleura', 'is_preview' => false, 'duration' => 50],
                            ['title' => 'Heart Gross Anatomy & Pericardium', 'is_preview' => false, 'duration' => 55],
                        ],
                    ],
                ],
            ],

            [
                'title' => 'Cellular Physiology & Blood Card',
                'slug' => 'cellular-physiology-blood-card',
                'short_description' => 'Cellular Physiology & Hematology Card Full Course.',
                'description' => 'সেলুলার ফিজিওলজি, আরবিসি, ডব্লিউবিসি, প্লেটলেটস, অ্যানিমিয়া ও কোয়াগুলেশন মেকানিজমের সম্পূর্ণ ক্লাস।',
                'price' => 450,
                'sale_price' => 450,
                'thumbnail' => '/courses-thumbnails/1st-card-full-course.jpeg',
                'is_featured' => false,
                'fake_enrollment_count' => 88,
                'class_starts_at' => 'চলমান (Ongoing)',
                'features' => [
                    '🩸 Complete Hematology & Blood Physiology',
                    '⏱️ 10 Minute Item Overview Class',
                    '💡 Clinical Case Problems in Hematology',
                    '📚 Soft Copy Study Notes',
                ],
                'categories' => [$catPhysiology->id, $catCards->id],
                'sections' => [
                    [
                        'title' => 'Hematology & Cell Physiology',
                        'lessons' => [
                            ['title' => 'Transport Through Cell Membranes & Homeostasis', 'is_preview' => true, 'duration' => 45],
                            ['title' => 'RBC Physiology, Hemoglobin & Jaundice', 'is_preview' => false, 'duration' => 50],
                            ['title' => 'Immunity, Blood Groups & Transfusion Reactions', 'is_preview' => false, 'duration' => 45],
                        ],
                    ],
                ],
            ],

            [
                'title' => 'Biophysics & Biomolecules Card',
                'slug' => 'biophysics-biomolecules-card',
                'short_description' => 'Biophysics & Biomolecules Biochemistry Card Course.',
                'description' => 'বায়োফিজিক্যাল প্রিন্সিপালস, পিএইচ বাফার এবং বায়োমলিকিউলসের কাঠামোগত বায়োকেমিস্ট্রির সম্পূর্ণ কোর্স।',
                'price' => 400,
                'sale_price' => 400,
                'thumbnail' => '/courses-thumbnails/1st-card-full-course.jpeg',
                'is_featured' => false,
                'fake_enrollment_count' => 76,
                'class_starts_at' => 'চলমান (Ongoing)',
                'features' => [
                    '🧬 Biomolecules Structure & Classification',
                    '⏱️ 10 Minute Item Overview Class',
                    '🧪 Acid-Base & Buffer Mechanics',
                    '📚 Soft Copy Notes & Marked Books',
                ],
                'categories' => [$catBiochemistry->id, $catCards->id],
                'sections' => [
                    [
                        'title' => 'Biophysical Principles & Chemistry',
                        'lessons' => [
                            ['title' => 'Solutions, Colloids, Osmosis & Donnan Equilibrium', 'is_preview' => true, 'duration' => 40],
                            ['title' => 'Carbohydrates, Lipids & Proteins Chemistry', 'is_preview' => false, 'duration' => 50],
                        ],
                    ],
                ],
            ],

            [
                'title' => 'General Histology',
                'slug' => 'general-histology',
                'short_description' => 'General Histology Theory & Practical Slide Identification.',
                'description' => 'এপিথেলিয়াম, কানেক্টিভ টিস্যু, কার্টিলেজ, বোন এবং মাসল টিস্যুর হিস্টোলজিক্যাল আইডেন্টিফিকেশন ও থিওরি।',
                'price' => 400,
                'sale_price' => 400,
                'thumbnail' => '/courses-thumbnails/2nd-card-full-course.jpg',
                'is_featured' => false,
                'fake_enrollment_count' => 82,
                'class_starts_at' => 'চলমান (Ongoing)',
                'features' => [
                    '🔬 Microscopic Slide High-Definition Walkthrough',
                    '⏱️ 10 Minute Item Overview Class',
                    '📚 Histology Soft Copy Atlas & Notes',
                ],
                'categories' => [$catAnatomy->id, $catCards->id],
                'sections' => [
                    [
                        'title' => 'Basic Tissues Histology',
                        'lessons' => [
                            ['title' => 'Epithelial & Connective Tissues Microscopy', 'is_preview' => true, 'duration' => 45],
                            ['title' => 'Cartilage, Bone & Muscle Slide Breakdown', 'is_preview' => false, 'duration' => 45],
                        ],
                    ],
                ],
            ],

            [
                'title' => 'Superior Extremity Card (Upper Limb)',
                'slug' => 'superior-extremity-card-upper-limb',
                'short_description' => 'Superior Extremity (Upper Limb) Anatomy Comprehensive Course.',
                'description' => 'আপার লিম্বের অস্টিওলজি, মাসল কম্পার্টমেন্ট, ব্লাড ভেসেলস ও ব্র্যাকিয়াল প্লেক্সাসের সম্পূর্ণ ক্লাস।',
                'price' => 500,
                'sale_price' => 500,
                'thumbnail' => '/courses-thumbnails/2nd-card-full-course.jpg',
                'is_featured' => false,
                'fake_enrollment_count' => 91,
                'class_starts_at' => 'চলমান (Ongoing)',
                'features' => [
                    '💪 Upper Limb Muscle & Neurovascular Mastery',
                    '⏱️ 10 Minute Item Overview Class',
                    '🩺 Clinical Nerve Palsies & Deformities',
                    '📚 Soft Copy Study Notes',
                ],
                'categories' => [$catAnatomy->id, $catCards->id],
                'sections' => [
                    [
                        'title' => 'Upper Limb Regional Anatomy',
                        'lessons' => [
                            ['title' => 'Pectoral Region & Axillary Neurovascular Bundle', 'is_preview' => true, 'duration' => 50],
                            ['title' => 'Brachial Plexus, Roots, Trunks, Cords & Branches', 'is_preview' => false, 'duration' => 55],
                            ['title' => 'Arm, Forearm, Hand & Carpal Tunnel Syndrome', 'is_preview' => false, 'duration' => 55],
                        ],
                    ],
                ],
            ],

            [
                'title' => 'Cardiovascular System Card',
                'slug' => 'cardiovascular-system-card',
                'short_description' => 'Cardiovascular System (CVS) Physiology Full Course.',
                'description' => 'কার্ডিওভাসকুলার সিস্টেমের ফিজিওলজি, কার্ডিয়াক সাইকেল, প্রেসার ভলিউম লুপ ও ইসিজি ইন্টারপ্রিটেশন।',
                'price' => 500,
                'sale_price' => 500,
                'thumbnail' => '/courses-thumbnails/2nd-card-full-course.jpg',
                'is_featured' => false,
                'fake_enrollment_count' => 87,
                'class_starts_at' => 'চলমান (Ongoing)',
                'features' => [
                    '❤️ Cardiac Electrophysiology & Mechanics',
                    '⏱️ 10 Minute Item Overview Class',
                    '📈 12-Lead ECG Interpretation Fundamentals',
                    '📚 Soft Copy Study Notes',
                ],
                'categories' => [$catPhysiology->id, $catCards->id],
                'sections' => [
                    [
                        'title' => 'CVS Hemodynamics & Cardiac Function',
                        'lessons' => [
                            ['title' => 'Cardiac Conduction, Action Potentials & ECG', 'is_preview' => true, 'duration' => 55],
                            ['title' => 'Cardiac Cycle Events, Wiggers Diagram & Murmurs', 'is_preview' => false, 'duration' => 50],
                            ['title' => 'Short-Term & Long-Term BP Regulation', 'is_preview' => false, 'duration' => 45],
                        ],
                    ],
                ],
            ],

            [
                'title' => 'Food & Nutrition Card',
                'slug' => 'food-nutrition-card',
                'short_description' => 'Food & Nutrition Biochemistry Card Course.',
                'description' => 'নিউট্রিশনাল বায়োকেমিস্ট্রি, ম্যাক্রো ও মাইক্রোনিউট্রিয়েন্টস, ভিটামিনস এবং ক্লিনিক্যাল নিউট্রিশন।',
                'price' => 400,
                'sale_price' => 400,
                'thumbnail' => '/courses-thumbnails/2nd-card-full-course.jpg',
                'is_featured' => false,
                'fake_enrollment_count' => 73,
                'class_starts_at' => 'চলমান (Ongoing)',
                'features' => [
                    '🥗 Nutritional Energetics & Deficiencies',
                    '⏱️ 10 Minute Item Overview Class',
                    '📚 Soft Copy Notes & Marked Books',
                ],
                'categories' => [$catBiochemistry->id, $catCards->id],
                'sections' => [
                    [
                        'title' => 'Nutritional Biochemistry',
                        'lessons' => [
                            ['title' => 'Caloric Requirements, BMR & Dietary Fibers', 'is_preview' => true, 'duration' => 40],
                            ['title' => 'Fat-Soluble & Water-Soluble Vitamins in Health & Disease', 'is_preview' => false, 'duration' => 50],
                        ],
                    ],
                ],
            ],

            [
                'title' => 'Inferior Extremity (Lower Limb)',
                'slug' => 'inferior-extremity',
                'short_description' => 'Inferior Extremity (Lower Limb) Anatomy Course.',
                'description' => 'লোয়ার লিম্ব অ্যানাটমি: ফিমোরাল ট্রায়াঙ্গেল, গ্লুটিয়াল রিজিয়ন, থাই, লেগ, ফুট এবং ওয়াকিং মেকানিক্স।',
                'price' => 500,
                'sale_price' => 500,
                'thumbnail' => '/courses-thumbnails/mbbs-4th-card.png',
                'is_featured' => false,
                'fake_enrollment_count' => 79,
                'class_starts_at' => 'চলমান (Ongoing)',
                'features' => [
                    '🩺 Lower Limb Dissection & 3D Anatomy',
                    '⏱️ 10 Minute Item Overview Class',
                    '📚 Soft Copy Study Notes',
                ],
                'categories' => [$catAnatomy->id, $catCards->id],
                'sections' => [
                    [
                        'title' => 'Lower Limb Regional Anatomy',
                        'lessons' => [
                            ['title' => 'Femoral Sheath, Canal, Hernia & Popliteal Fossa', 'is_preview' => true, 'duration' => 50],
                            ['title' => 'Leg Compartments, Retinacula & Arches of Foot', 'is_preview' => false, 'duration' => 50],
                        ],
                    ],
                ],
            ],

            [
                'title' => 'GI + Renal Physiology',
                'slug' => 'gi-renal-physiology',
                'short_description' => 'Gastrointestinal & Renal Physiology Combined Card Course.',
                'description' => 'গ্যাস্ট্রোইনটেস্টাইনাল ও রেনাল সিস্টেমের সার্বিক ফিজিওলজি এবং রেগুলেশন।',
                'price' => 500,
                'sale_price' => 500,
                'thumbnail' => '/courses-thumbnails/mbbs-4th-card.png',
                'is_featured' => false,
                'fake_enrollment_count' => 84,
                'class_starts_at' => 'চলমান (Ongoing)',
                'features' => [
                    '📚 GI & Renal Physiological Integration',
                    '⏱️ 10 Minute Item Overview Class',
                    '💡 High-Yield Item & Viva Discussion',
                ],
                'categories' => [$catPhysiology->id, $catCards->id],
                'sections' => [
                    [
                        'title' => 'GI & Renal Mechanisms',
                        'lessons' => [
                            ['title' => 'Gastric & Pancreatic Secretion Regulation', 'is_preview' => true, 'duration' => 45],
                            ['title' => 'Renal Tubular Transport & Acid-Base Balance', 'is_preview' => false, 'duration' => 50],
                        ],
                    ],
                ],
            ],

            [
                'title' => 'Renal Biochemistry',
                'slug' => 'renal-biochemistry',
                'short_description' => 'Renal Biochemistry & Kidney Function Tests Course.',
                'description' => 'রেনাল মেটাবলিজম, ইউরিয়া ফরমেশন, কেমিক্যাল কনস্টিটিউয়েন্টস অফ ইউরিন ও ক্লিনিক্যাল ল্যাব টেস্ট।',
                'price' => 400,
                'sale_price' => 400,
                'thumbnail' => '/courses-thumbnails/mbbs-4th-card.png',
                'is_featured' => false,
                'fake_enrollment_count' => 71,
                'class_starts_at' => 'চলমান (Ongoing)',
                'features' => [
                    '🧪 Renal Function Test Biomarkers',
                    '⏱️ 10 Minute Item Overview Class',
                    '📚 Soft Copy Study Notes',
                ],
                'categories' => [$catBiochemistry->id, $catCards->id],
                'sections' => [
                    [
                        'title' => 'Renal Clinical Biochemistry',
                        'lessons' => [
                            ['title' => 'Glomerular Permeability & Creatinine Clearance', 'is_preview' => true, 'duration' => 40],
                            ['title' => 'Urinary Casts, Proteinuria & Glycosuria', 'is_preview' => false, 'duration' => 45],
                        ],
                    ],
                ],
            ],
        ];

        $allCourses = array_merge($mainPrograms, $modularCourses);

        foreach ($allCourses as $cData) {
            $course = Course::firstOrCreate(
                ['slug' => $cData['slug']],
                [
                    'title' => $cData['title'],
                    'short_description' => $cData['short_description'],
                    'description' => $cData['description'],
                    'price' => $cData['price'],
                    'sale_price' => $cData['sale_price'],
                    'thumbnail' => $cData['thumbnail'],
                    'status' => Course::STATUS_PUBLISHED,
                    'is_featured' => $cData['is_featured'] ?? false,
                    'fake_enrollment_count' => $cData['fake_enrollment_count'] ?? 100,
                    'class_starts_at' => $cData['class_starts_at'] ?? 'চলমান (Ongoing)',
                    'features' => $cData['features'] ?? [],
                    'enable_manual_payment' => true,
                    'enable_shurjopay' => true,
                    'action_buttons' => [
                        ['label' => 'কোর্সে ভর্তি হও', 'url' => '/checkout', 'type' => 'primary'],
                    ],
                ]
            );

            // Sync categories
            if (!empty($cData['categories'])) {
                $course->categories()->syncWithoutDetaching($cData['categories']);
            }

            // Sync sections & lessons
            if (!empty($cData['sections'])) {
                foreach ($cData['sections'] as $secIdx => $sData) {
                    $section = CourseSection::firstOrCreate(
                        [
                            'course_id' => $course->id,
                            'title' => $sData['title'],
                        ],
                        [
                            'sort_order' => $secIdx + 1,
                            'description' => $sData['title'] . ' lectures and resources.',
                        ]
                    );

                    if (!empty($sData['lessons'])) {
                        foreach ($sData['lessons'] as $lesIdx => $lData) {
                            Lesson::firstOrCreate(
                                [
                                    'course_id' => $course->id,
                                    'section_id' => $section->id,
                                    'title' => $lData['title'],
                                ],
                                [
                                    'slug' => Str::slug($lData['title']) . '-' . $course->id . '-' . ($lesIdx + 1),
                                    'content' => 'DoctorWallah Masterclass: ' . $lData['title'],
                                    'duration_minutes' => $lData['duration'] ?? 45,
                                    'is_preview' => $lData['is_preview'] ?? false,
                                    'status' => 'published',
                                    'sort_order' => $lesIdx + 1,
                                ]
                            );
                        }
                    }
                }
            }
        }

        // 4. Sync category pages so all categories exist as builder pages
        try {
            Page::syncCategoryPages();
        } catch (\Throwable $e) {
            // Ignore if pages table issue
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $slugs = [
            'mbbs-4th-card',
            'mbbs-first-phase-1st-term',
            'mbbs-first-phase-2nd-term',
            '1st-card-full-course',
            '2nd-card-full-course',
            'mbbs-first-phase-3rd-card',
            'anatomy-thorax-card',
            'cellular-physiology-blood-card',
            'biophysics-biomolecules-card',
            'general-histology',
            'superior-extremity-card-upper-limb',
            'cardiovascular-system-card',
            'food-nutrition-card',
            'inferior-extremity',
            'gi-renal-physiology',
            'renal-biochemistry',
        ];

        Course::whereIn('slug', $slugs)->forceDelete();
    }
};
