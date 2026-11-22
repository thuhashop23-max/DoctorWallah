import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { apiClient, formatBDT, getImageUrl } from '../../api/client';
import { Course, Category, CustomPage } from '../../types';
import { PageBlockRenderer } from '../../components/builder/PageBlockRenderer';
import { useLanguage } from '../../context/LanguageContext';
import { 
    Sparkles, 
    BookOpen, 
    CheckCircle2, 
    Users, 
    PlayCircle, 
    ArrowRight, 
    Award, 
    Clock, 
    HelpCircle, 
    Star,
    GraduationCap,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Flame,
    ClipboardList,
    Bot,
    FileText,
    Boxes,
    Zap,
    TrendingUp,
    ShieldCheck,
    Video,
    Check,
    Tag,
    ShoppingCart,
    Stethoscope,
    Activity,
    Microscope,
    HeartPulse,
    Dna
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { StudentReviewsMarquee } from '../../components/home/StudentReviewsMarquee';
import { PagePreloader } from '../../components/shared/PagePreloader';
import { VideoTestimonialsCoverflow } from '../../components/home/VideoTestimonialsCoverflow';

interface FeaturedTeacher {
    id: number;
    name: string;
    email?: string;
    designation: string;
    institution: string;
    photo_url?: string | null;
    bio?: string | null;
    expertise?: string | null;
    experience?: string;
    tags?: string[];
    category?: 'ssc' | 'hsc' | 'admission' | 'arts' | 'all';
    courses_count: number;
}

interface FeaturedBundle {
    id: number;
    title: string;
    slug: string;
    thumbnail?: string | null;
    short_description?: string | null;
    regular_price: number;
    sale_price: number;
    courses_count?: number;
    courses?: { id: number; title: string; thumbnail?: string | null }[];
}

export const HomePage: React.FC = () => {
    const { t, language } = useLanguage();
    const { addToCart, isInCart } = useCart();
    const [customPage, setCustomPage] = useState<CustomPage | null>(() => {
        try {
            const cached = sessionStorage.getItem('DoctorWallah_home_custom_page');
            if (cached) {
                const parsed = JSON.parse(cached);
                if (parsed && Array.isArray(parsed.blocks) && parsed.blocks.length > 0) {
                    return parsed;
                }
            }
        } catch {}
        return null;
    });
    const [courses, setCourses] = useState<Course[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [bundles, setBundles] = useState<FeaturedBundle[]>([]);
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [teachers, setTeachers] = useState<FeaturedTeacher[]>([]);
    const [teacherFilter, setTeacherFilter] = useState<'all' | 'anatomy' | 'physiology' | 'biochemistry' | 'clinical'>('all');
    const [loading, setLoading] = useState<boolean>(() => {
        try {
            const cached = sessionStorage.getItem('DoctorWallah_home_custom_page');
            if (cached) {
                const parsed = JSON.parse(cached);
                if (parsed && Array.isArray(parsed.blocks) && parsed.blocks.length > 0) {
                    return false;
                }
            }
        } catch {}
        return true;
    });
    const [coursesLoading, setCoursesLoading] = useState(false);
    const [teachersLoading, setTeachersLoading] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [openFaq, setOpenFaq] = useState<number | null>(0);
    const carouselRef = useRef<HTMLDivElement>(null);

    const scrollLeft = () => {
        if (carouselRef.current) {
            const step = carouselRef.current.clientWidth > 640 ? 270 : carouselRef.current.clientWidth;
            carouselRef.current.scrollBy({ left: -step, behavior: 'smooth' });
        }
    };

    const scrollRight = () => {
        if (carouselRef.current) {
            const step = carouselRef.current.clientWidth > 640 ? 270 : carouselRef.current.clientWidth;
            carouselRef.current.scrollBy({ left: step, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [coursesRes, catsRes, pageRes, teachersRes, bundlesRes] = await Promise.allSettled([
                    apiClient.get('/courses?per_page=12'),
                    apiClient.get('/categories'),
                    apiClient.get('/pages/home'),
                    apiClient.get('/teachers/featured'),
                    apiClient.get('/bundles/featured'),
                ]);

                if (coursesRes.status === 'fulfilled') {
                    setCourses(coursesRes.value.data.data || []);
                }
                if (catsRes.status === 'fulfilled') {
                    setCategories(catsRes.value.data || []);
                }
                if (pageRes.status === 'fulfilled' && pageRes.value.data?.page) {
                    const fetchedPage = pageRes.value.data.page;
                    setCustomPage(fetchedPage);
                    try {
                        sessionStorage.setItem('DoctorWallah_home_custom_page', JSON.stringify(fetchedPage));
                    } catch {}
                }
                if (teachersRes.status === 'fulfilled') {
                    const teacherList = teachersRes.value.data?.data || teachersRes.value.data?.teachers || [];
                    setTeachers(teacherList);
                }
                if (bundlesRes.status === 'fulfilled') {
                    setBundles(bundlesRes.value.data?.bundles || []);
                }
            } catch {
                // handle error
            } finally {
                setLoading(false);
                setTeachersLoading(false);
            }
        };
        fetchData();
    }, []);

    // Only real platform teachers from database
    const allFaculty: FeaturedTeacher[] = teachers.map((t) => {
        const combined = `${t.expertise || ''} ${t.designation || ''} ${t.bio || ''}`.toLowerCase();
        let cat: 'anatomy' | 'physiology' | 'biochemistry' | 'clinical' | 'all' = 'all';
        if (combined.includes('anat') || combined.includes('dissect') || combined.includes('viscera') || combined.includes('histo') || combined.includes('embryo')) {
            cat = 'anatomy';
        } else if (combined.includes('physio') || combined.includes('guyton') || combined.includes('ganong') || combined.includes('cvs') || combined.includes('renal')) {
            cat = 'physiology';
        } else if (combined.includes('biochem') || combined.includes('harper') || combined.includes('lippincott') || combined.includes('genetics') || combined.includes('metabolism')) {
            cat = 'biochemistry';
        } else if (combined.includes('clinic') || combined.includes('viva') || combined.includes('ospe') || combined.includes('card') || combined.includes('prof')) {
            cat = 'clinical';
        } else {
            cat = 'anatomy';
        }

        const tags = t.expertise 
            ? t.expertise.split(',').map((s: string) => s.trim()) 
            : ['MBBS Faculty', '1st Prof'];

        return {
            ...t,
            designation: t.designation || 'MBBS Instructor & Mentor',
            institution: t.institution || 'DoctorWallah Medical Faculty',
            experience: t.bio ? (t.bio.length > 50 ? t.bio.substring(0, 50) + '...' : t.bio) : 'MBBS Faculty Member',
            tags,
            category: cat
        };
    });

    const displayedFaculty = allFaculty.filter((t) => {
        if (teacherFilter === 'all') return true;
        if (teacherFilter === 'anatomy') {
            return t.category === 'anatomy' || t.tags?.some(tag => tag.toLowerCase().includes('anat') || tag.toLowerCase().includes('viscera') || tag.toLowerCase().includes('dissect'));
        }
        if (teacherFilter === 'physiology') {
            return t.category === 'physiology' || t.tags?.some(tag => tag.toLowerCase().includes('physio') || tag.toLowerCase().includes('guyton'));
        }
        if (teacherFilter === 'biochemistry') {
            return t.category === 'biochemistry' || t.tags?.some(tag => tag.toLowerCase().includes('biochem') || tag.toLowerCase().includes('harper'));
        }
        if (teacherFilter === 'clinical') {
            return t.category === 'clinical' || t.tags?.some(tag => tag.toLowerCase().includes('clinic') || tag.toLowerCase().includes('viva') || tag.toLowerCase().includes('ospe'));
        }
        return true;
    });

    // Smooth auto-scroll for Teacher carousel
    useEffect(() => {
        if (displayedFaculty.length <= 1 || isPaused) return;
        const interval = setInterval(() => {
            if (!carouselRef.current) return;
            const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
            if (scrollLeft + clientWidth >= scrollWidth - 15) {
                carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                const step = clientWidth > 640 ? 270 : clientWidth;
                carouselRef.current.scrollBy({ left: step, behavior: 'smooth' });
            }
        }, 4000);
        return () => clearInterval(interval);
    }, [displayedFaculty, isPaused]);

    const handleCategoryClick = async (slug: string) => {
        if (activeCategory === slug) return;
        setActiveCategory(slug);
        setCoursesLoading(true);
        try {
            const url = slug === 'all' 
                ? '/courses?per_page=12' 
                : `/courses?per_page=12&category=${encodeURIComponent(slug)}`;
            const res = await apiClient.get(url);
            setCourses(res.data.data || []);
        } catch {
            // handle error
        } finally {
            setCoursesLoading(false);
        }
    };

    const faqs = [
        {
            q: 'How do I enroll in MBBS Card, Term, or All-in-One courses on DoctorWallah?',
            a: 'Select your desired MBBS discipline or bundle (e.g. Thorax Card, Abdomen, Physiology, or Full 1st Prof Package), click "Add to Cart", and checkout. Pay easily via bKash, Nagad, Rocket, or card, and access your high-yield lectures and materials instantly.',
        },
        {
            q: 'Do I get recorded classes, viscera demonstrations, and marked soft-copy books?',
            a: 'Yes! Every high-yield class is available in 1080p Full HD with unlimited replay. You also receive high-yield marked standard textbooks (BDC, Guyton, Datta, Langman), dissection & viscera video demonstrations, and OSPE guides.',
        },
        {
            q: 'Can DoctorWallah help me prepare for tomorrow’s Item or Card viva?',
            a: 'Absolutely! Our "10-Minute Item Quick Recap" lectures and card-specific viva question lists are specifically designed to help medical students revise key structures, relations, and clinical correlations the night before viva.',
        },
        {
            q: 'Does DoctorWallah align with the official BM&DC 1st Prof curriculum?',
            a: 'Yes, 100%. Our courses cover the exact syllabi followed by Dhaka University, Chittagong Medical University, Rajshahi Medical University, and Sylhet Medical University for DMC, SSMC, CMC, SOMC, and all medical colleges across Bangladesh.',
        },
        {
            q: 'Can I access the courses and marked books on both phone and laptop?',
            a: 'Yes, our platform is fully responsive and optimized for ultra-fast streaming on Android, iPhone, iPad, Windows, and Mac devices.',
        },
    ];

    if (loading) {
        return (
            <PagePreloader
                title="Loading DoctorWallah..."
                subtitle="Setting up courses, mentors, and learning materials"
            />
        );
    }

    if (customPage && Array.isArray(customPage.blocks) && customPage.blocks.length > 0) {
        let displayBlocks = customPage.blocks;
        const hasVideoTestimonials = displayBlocks.some((b) => b.type === 'video_testimonials');
        if (!hasVideoTestimonials) {
            const fallbackVideoBlock = {
                id: 'block_video_testimonials_default',
                type: 'video_testimonials' as const,
                title: 'Video Testimonials',
                settings: {
                    sectionTag: 'Student Stories & Video Reviews',
                    sectionTitle: 'What Our Students Say',
                    sectionSub: 'Real journeys, genuine experiences, and success stories shared on camera.',
                    items: [
                        {
                            id: 'v1',
                            name: 'Samiul',
                            role: 'DoctorWallah Student Review',
                            videoUrl: 'https://youtu.be/Cbw_yhBGM_4',
                            thumbnailUrl: '',
                        },
                        {
                            id: 'v2',
                            name: 'Khurshed',
                            role: 'DoctorWallah Student Review',
                            videoUrl: 'https://youtu.be/Zt7yfNIbInQ',
                            thumbnailUrl: '',
                        },
                    ],
                },
            };
            const teacherIdx = displayBlocks.findIndex((b) => b.type === 'teachers_showcase');
            if (teacherIdx !== -1) {
                displayBlocks = [
                    ...displayBlocks.slice(0, teacherIdx + 1),
                    fallbackVideoBlock,
                    ...displayBlocks.slice(teacherIdx + 1),
                ];
            } else {
                displayBlocks = [...displayBlocks, fallbackVideoBlock];
            }
        }

        return (
            <div className="space-y-0 overflow-hidden font-sans">
                {customPage.custom_css && <style>{customPage.custom_css}</style>}
                {displayBlocks.map((block) => (
                    <PageBlockRenderer key={block.id} block={block} isBuilder={false} />
                ))}
            </div>
        );
    }

    const testimonialsBlock = customPage?.blocks?.find(
        (b) => b.type === 'testimonials' || b.type === 'student_reviews_marquee'
    );
    const videoTestimonialsBlock = customPage?.blocks?.find(
        (b) => b.type === 'video_testimonials'
    );

    return (
        <div className="space-y-16 sm:space-y-24 pb-20 overflow-hidden font-sans">
            {/* Top Live Campaign Ribbon */}
            <div className="bg-gradient-to-r from-teal-600 via-sky-600 to-emerald-600 text-white text-xs sm:text-sm py-2.5 px-4 font-semibold text-center flex items-center justify-center gap-2 shadow-inner">
                <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                <span>🩺 MBBS 2026 Batch: Admissions open for MBBS 1st Phase, Cards & Term All-in-One Programs!</span>
                <Link to="/courses" className="underline font-extrabold text-white hover:text-teal-100 transition-colors ml-1 hidden sm:inline">
                    View All Courses →
                </Link>
            </div>

            {/* 1. HERO SECTION */}
            <section className="relative overflow-hidden bg-gradient-to-b from-teal-50/70 via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 pt-8 sm:pt-14 pb-16 sm:pb-24 border-b border-slate-100 dark:border-slate-800 transition-colors">
                {/* Decorative background blurs */}
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
                <div className="absolute bottom-0 left-10 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
                        {/* Left Content Column */}
                        <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                            {/* Trust Badge */}
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-xs sm:text-sm font-extrabold tracking-wide shadow-2xs">
                                <Stethoscope className="w-4 h-4 text-teal-600 animate-pulse" />
                                <span>Bangladesh's #1 MBBS & Medical Learning Platform</span>
                            </div>

                            {/* Headline */}
                            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-[1.2] tracking-tight">
                                Medical Academic Excellence, <br />
                                <span className="bg-gradient-to-r from-teal-600 via-sky-600 to-emerald-500 bg-clip-text text-transparent">
                                    From Item & Card Prep
                                </span> <br />
                                To 1st Prof Success!
                            </h1>

                            {/* Subtitle */}
                            <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                                Master Gross Anatomy, Physiology & Biochemistry with clinical confidence through expert-led high-yield lectures, cadaveric dissection & viscera demos, and marked standard textbooks (BDC, Guyton, Datta, Langman, Ganong).
                            </p>

                            {/* Dual CTAs */}
                            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                                <Link
                                    to="/courses"
                                    className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-teal-600/30 hover:shadow-xl hover:shadow-teal-600/40 transition-all flex items-center justify-center gap-2 group cursor-pointer"
                                >
                                    <span>Explore MBBS Courses</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                                </Link>

                                <Link
                                    to="/courses"
                                    className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-teal-600 text-teal-700 dark:text-teal-300 font-extrabold text-sm sm:text-base hover:bg-teal-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                                >
                                    <PlayCircle className="w-5 h-5 text-teal-600" />
                                    <span>Watch Free Demos</span>
                                </Link>
                            </div>

                            {/* Metrics Counter Bar */}
                            <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-200/80 dark:border-slate-800 text-left">
                                <div className="space-y-0.5">
                                    <div className="text-2xl sm:text-3xl font-black text-teal-600">550+</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Medical Students</div>
                                </div>
                                <div className="space-y-0.5">
                                    <div className="text-2xl sm:text-3xl font-black text-sky-600">1,250+</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">MBBS Lectures</div>
                                </div>
                                <div className="space-y-0.5">
                                    <div className="text-2xl sm:text-3xl font-black text-emerald-600">100%</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Prof Syllabus Covered</div>
                                </div>
                                <div className="space-y-0.5">
                                    <div className="text-2xl sm:text-3xl font-black text-amber-500">24/7</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Marked Soft Books</div>
                                </div>
                            </div>
                        </div>

                        {/* Right Interactive Visual Card */}
                        <div className="lg:col-span-5 relative">
                            <div className="relative mx-auto max-w-md lg:max-w-none bg-gradient-to-tr from-teal-500 via-sky-600 to-emerald-500 p-1 rounded-3xl shadow-2xl shadow-teal-500/25">
                                <div className="bg-slate-900 rounded-[22px] p-6 text-white space-y-5">
                                    {/* Card Header */}
                                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="flex h-2.5 w-2.5 relative">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
                                            </span>
                                            <span className="text-xs font-bold text-teal-400 uppercase tracking-wide">
                                                MBBS Academic Hub
                                            </span>
                                        </div>
                                        <span className="text-[11px] font-bold px-2 py-0.5 bg-teal-500/20 text-teal-300 rounded-md">
                                            1st Phase 2026-27
                                        </span>
                                    </div>

                                    {/* Program Card Title */}
                                    <div>
                                        <h3 className="text-lg sm:text-xl font-black text-white leading-snug">
                                            MBBS 1st Phase Complete Card & Prof Preparation
                                        </h3>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Anatomy, Physiology & Biochemistry complete syllabus aligned with BM&DC curriculum for DMC, SSMC, CMC, SOMC & all medical colleges.
                                        </p>
                                    </div>

                                    {/* Highlights list with icons */}
                                    <div className="space-y-2.5">
                                        <div className="bg-slate-800/90 p-3 rounded-xl border border-slate-700/60 flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                                                <Activity className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-white">Anatomy Dissection & Viscera</h4>
                                                <p className="text-[11px] text-slate-400">Thorax, Abdomen, Superior/Inferior Extremities, Histo & Embryo</p>
                                            </div>
                                        </div>

                                        <div className="bg-slate-800/90 p-3 rounded-xl border border-slate-700/60 flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                                                <Microscope className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-white">Physiology & Biochemistry Mastery</h4>
                                                <p className="text-[11px] text-slate-400">Guyton, Ganong, Harper & Lippincott based concept clarity</p>
                                            </div>
                                        </div>

                                        <div className="bg-slate-800/90 p-3 rounded-xl border border-slate-700/60 flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-white">Marked Standard Books & Item Qs</h4>
                                                <p className="text-[11px] text-slate-400">High-yield marked lines, viva questions & OSPE sheets</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="pt-2">
                                        <Link
                                            to="/courses"
                                            className="block w-full py-3.5 bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-600 hover:opacity-95 text-white font-extrabold rounded-xl text-center text-sm shadow-md shadow-teal-500/25 transition-all cursor-pointer"
                                        >
                                            Enroll in MBBS Batch
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. MEDICAL DISCIPLINES & ACADEMIC SEGMENTS */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
                    <span className="text-xs font-bold text-teal-600 uppercase tracking-widest bg-teal-50 dark:bg-teal-950/60 px-3 py-1 rounded-full border border-teal-200 dark:border-teal-800">
                        MBBS Disciplines
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        Which Subject or Card are You Preparing For?
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                        Choose your target discipline and master your item, card & 1st Prof syllabus.
                    </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
                    {/* Anatomy */}
                    <div 
                        onClick={() => handleCategoryClick('all')}
                        className="bg-gradient-to-b from-teal-50 to-white dark:from-slate-900 dark:to-slate-950 p-4 sm:p-5 rounded-2xl border border-teal-100 dark:border-slate-800 text-center hover:border-teal-400 dark:hover:border-teal-500 hover:shadow-lg transition-all cursor-pointer group flex flex-col items-center"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Activity className="w-6 h-6" />
                        </div>
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">Gross Anatomy</h3>
                        <p className="text-[11px] text-slate-500 mt-1">Dissection, Viscera & Histo</p>
                    </div>

                    {/* Physiology */}
                    <div 
                        onClick={() => handleCategoryClick('all')}
                        className="bg-gradient-to-b from-rose-50 to-white dark:from-slate-900 dark:to-slate-950 p-4 sm:p-5 rounded-2xl border border-rose-100 dark:border-slate-800 text-center hover:border-rose-400 dark:hover:border-rose-500 hover:shadow-lg transition-all cursor-pointer group flex flex-col items-center"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <HeartPulse className="w-6 h-6" />
                        </div>
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">Physiology</h3>
                        <p className="text-[11px] text-slate-500 mt-1">Guyton & Ganong Concepts</p>
                    </div>

                    {/* Biochemistry */}
                    <div 
                        onClick={() => handleCategoryClick('all')}
                        className="bg-gradient-to-b from-purple-50 to-white dark:from-slate-900 dark:to-slate-950 p-4 sm:p-5 rounded-2xl border border-purple-100 dark:border-slate-800 text-center hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg transition-all cursor-pointer group flex flex-col items-center"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Microscope className="w-6 h-6" />
                        </div>
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">Biochemistry</h3>
                        <p className="text-[11px] text-slate-500 mt-1">Metabolism & Genetics</p>
                    </div>

                    {/* Card & Term Bundles */}
                    <div 
                        onClick={() => handleCategoryClick('all')}
                        className="bg-gradient-to-b from-amber-50 to-white dark:from-slate-900 dark:to-slate-950 p-4 sm:p-5 rounded-2xl border border-amber-100 dark:border-slate-800 text-center hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-lg transition-all cursor-pointer group flex flex-col items-center"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Boxes className="w-6 h-6" />
                        </div>
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">Card & Term Combos</h3>
                        <p className="text-[11px] text-slate-500 mt-1">All-in-One Programs</p>
                    </div>

                    {/* Marked Books & OSPE */}
                    <Link 
                        to="/courses"
                        className="col-span-2 sm:col-span-1 bg-gradient-to-b from-sky-50 to-white dark:from-slate-900 dark:to-slate-950 p-4 sm:p-5 rounded-2xl border border-sky-100 dark:border-slate-800 text-center hover:border-sky-400 dark:hover:border-sky-500 hover:shadow-lg transition-all cursor-pointer group flex flex-col items-center"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">Marked Books & OSPE</h3>
                        <p className="text-[11px] text-slate-500 mt-1">Soft Books & Viva Qs</p>
                    </Link>
                </div>
            </section>

            {/* 3. FEATURED COURSES SECTION (Bondi Pathshala Style Cards) */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-sky-600 uppercase tracking-widest mb-1.5">
                            <Flame className="w-4 h-4 text-rose-500" />
                            <span>Popular & Ongoing Courses</span>
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                            Featured Courses
                        </h2>
                    </div>
                    <Link
                        to="/courses"
                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300"
                    >
                        <span>View All Courses</span>
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* Dynamic Category Navigation Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 scrollbar-none">
                    <button
                        onClick={() => handleCategoryClick('all')}
                        className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
                            activeCategory === 'all'
                                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
                        }`}
                    >
                        All Courses
                    </button>
                    {categories.map((cat) => {
                        const isSelected = activeCategory === cat.slug;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => handleCategoryClick(cat.slug)}
                                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                                    isSelected
                                        ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
                                }`}
                            >
                                <span>{cat.name}</span>
                                {cat.courses_count !== undefined && cat.courses_count > 0 && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                    }`}>
                                        {cat.courses_count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {loading || coursesLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((n) => (
                            <div key={n} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-4 animate-pulse space-y-4">
                                <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
                                <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : courses.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 text-slate-500 space-y-3">
                        <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                        <h3 className="text-base font-bold text-slate-800 dark:text-white">No courses found at this time</h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">New batches for this category will be available soon.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                        {courses.map((course) => (
                            <div
                                key={course.id}
                                className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-2xl hover:border-sky-400 dark:hover:border-sky-500 transition-all flex flex-col overflow-hidden relative"
                            >
                                {/* Thumbnail Header */}
                                <Link to={`/courses/${course.slug}`} className="block relative aspect-video bg-slate-900 overflow-hidden cursor-pointer group/thumb">
                                    {(course.thumbnail || (course as any).thumbnail_url) ? (
                                        <img
                                            src={getImageUrl(course.thumbnail || (course as any).thumbnail_url)}
                                            alt={course.title}
                                            className="w-full h-full object-cover group-hover:scale-105 group-hover/thumb:scale-105 transition-transform duration-500"
                                            onError={(e) => {
                                                (e.currentTarget as HTMLElement).style.display = 'none';
                                                const fallback = (e.currentTarget.parentElement?.querySelector('.fallback-thumb') as HTMLElement);
                                                if (fallback) fallback.style.display = 'flex';
                                            }}
                                        />
                                    ) : null}
                                    <div className={`fallback-thumb w-full h-full ${(course.thumbnail || (course as any).thumbnail_url) ? 'hidden' : 'flex'} items-center justify-center bg-gradient-to-tr from-slate-800 to-sky-950 text-white`}>
                                        <BookOpen className="w-12 h-12 text-sky-400 opacity-60" />
                                    </div>

                                    {/* Discount Badge */}
                                    {course.discount_percent && course.discount_percent > 0 ? (
                                        <span className="absolute top-3 right-3 px-3 py-1 text-xs font-black bg-rose-600 text-white rounded-xl shadow-md">
                                            {course.discount_percent}% OFF
                                        </span>
                                    ) : course.price === 0 ? (
                                        <span className="absolute top-3 right-3 px-3 py-1 text-xs font-black bg-emerald-600 text-white rounded-xl shadow-md">
                                            Free Course
                                        </span>
                                    ) : null}

                                    {/* Category Pill on image */}
                                    {course.categories && course.categories.length > 0 && (
                                        <span className="absolute bottom-3 left-3 px-2.5 py-1 text-[11px] font-bold bg-black/70 backdrop-blur-xs text-white rounded-lg">
                                            {course.categories[0].name}
                                        </span>
                                    )}
                                </Link>

                                {/* Content Body */}
                                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <Video className="w-3.5 h-3.5 text-sky-500" />
                                                <span>{course.lessons_count || 0} Lessons</span>
                                            </span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <Users className="w-3.5 h-3.5 text-sky-500" />
                                                <span>{(course.fake_enrollment_count || 0) + (course.enrollments_count || 0)} Students</span>
                                            </span>
                                        </div>

                                        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 transition-colors line-clamp-2">
                                            <Link
                                                to={`/courses/${course.slug}`}
                                                className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer"
                                            >
                                                {course.title}
                                            </Link>
                                        </h3>

                                        {/* Course feature checklist */}
                                        <div className="space-y-1.5 pt-1 text-xs text-slate-600 dark:text-slate-300">
                                            {((course.features && Array.isArray(course.features) && course.features.length > 0)
                                                ? course.features.filter((f: any) => typeof f === 'string' && f.trim().length > 0)
                                                : [
                                                    'Live & Full HD Recorded Class Archive',
                                                    'Chapter-wise Lecture Sheets & Question Bank',
                                                    'NexPilot AI 24/7 Instant Doubt Solver',
                                                ]
                                            ).slice(0, 4).map((feat: string, fIdx: number) => (
                                                <div key={fIdx} className="flex items-start gap-1.5">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                                    <span className="line-clamp-1 leading-tight">{feat}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Pricing & Instructor Row */}
                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="text-xs font-medium text-slate-500 truncate mr-2">
                                                Instructor: <span className="font-bold text-slate-800 dark:text-slate-200">
                                                    {course.instructors && course.instructors.length > 0 
                                                        ? course.instructors[0].name 
                                                        : (course.instructor?.name || 'Expert Mentor')}
                                                </span>
                                            </div>

                                            <div className="text-right shrink-0">
                                                {course.is_enrolled ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold text-xs rounded-full border border-emerald-200 dark:border-emerald-800">
                                                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                                        <span>Enrolled</span>
                                                    </span>
                                                ) : course.price === 0 ? (
                                                    <span className="text-lg font-black text-emerald-600">Free</span>
                                                ) : (
                                                    <div className="flex items-baseline gap-1.5">
                                                        <span className="text-xl font-black text-sky-600 dark:text-sky-400">
                                                            {formatBDT(
                                                                course.sale_price !== null && course.sale_price !== undefined && Number(course.sale_price) < Number(course.price)
                                                                    ? Number(course.sale_price)
                                                                    : (course.effective_price ?? Number(course.price))
                                                            )}
                                                        </span>
                                                        {course.sale_price !== null && course.sale_price !== undefined && Number(course.sale_price) < Number(course.price) && (
                                                            <span className="text-xs text-slate-400 line-through">
                                                                {formatBDT(course.price)}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="grid grid-cols-2 gap-2 pt-1">
                                            <Link
                                                to={`/courses/${course.slug}`}
                                                className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs text-slate-700 dark:text-slate-200 text-center transition-all cursor-pointer flex items-center justify-center"
                                            >
                                                View Details
                                            </Link>
                                            {course.is_enrolled ? (
                                                <Link
                                                    to={`/learning/${course.id}`}
                                                    className="py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                                                >
                                                    <PlayCircle className="w-3.5 h-3.5" />
                                                    <span>Start Class</span>
                                                </Link>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => addToCart(course)}
                                                    className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                                                        isInCart(course.id)
                                                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                                                            : 'bg-[#25a2ee] hover:bg-[#1f8ed1] text-white shadow-sky-500/20'
                                                    }`}
                                                >
                                                    <ShoppingCart className="w-3.5 h-3.5" />
                                                    <span>{isInCart(course.id) ? 'In Cart' : 'Add to Cart'}</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* 4. COURSE BUNDLES SHOWCASE SECTION (Special High-Converting Bundles) */}
            {bundles.length > 0 && (
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-gradient-to-tr from-slate-900 via-sky-950 to-slate-900 rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden shadow-2xl border border-sky-800/60">
                        {/* Glow accent */}
                        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                            <div>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider mb-2">
                                    <Boxes className="w-3.5 h-3.5" />
                                    <span>Combo Bundle Offer</span>
                                </span>
                                <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                                    Special Course Bundles
                                </h2>
                                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                                    Get complete preparation by bundling multiple courses together at maximum savings.
                                </p>
                            </div>
                            <Link
                                to="/courses"
                                className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-amber-300 hover:text-white transition-colors"
                            >
                                <span>View All Bundles</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {bundles.map((bundle) => (
                                <div
                                    key={bundle.id}
                                    className="bg-slate-800/80 rounded-2xl border border-sky-700/40 p-5 flex flex-col justify-between hover:border-amber-400 transition-all group"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-sky-500/30 text-sky-200 border border-sky-400/30">
                                                {bundle.courses_count || bundle.courses?.length || 0} Courses Included
                                            </span>
                                            <span className="text-xs font-bold text-emerald-400">
                                                Mega Saving Pack
                                            </span>
                                        </div>

                                        <h3 className="text-lg font-black text-white group-hover:text-amber-300 transition-colors line-clamp-2">
                                            {bundle.title}
                                        </h3>

                                        {bundle.short_description && (
                                            <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                                                {bundle.short_description}
                                            </p>
                                        )}

                                        {/* Included Courses Pills */}
                                        {bundle.courses && bundle.courses.length > 0 && (
                                            <div className="pt-2 space-y-1">
                                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                    Included Courses:
                                                </div>
                                                <div className="space-y-1">
                                                    {bundle.courses.slice(0, 3).map((c) => (
                                                        <div key={c.id} className="text-xs text-slate-200 flex items-center gap-1.5 truncate">
                                                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                                            <span className="truncate">{c.title}</span>
                                                        </div>
                                                    ))}
                                                    {bundle.courses.length > 3 && (
                                                        <div className="text-[10px] text-amber-300 font-bold">
                                                            + {bundle.courses.length - 3} More Courses
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Pricing & CTA */}
                                    <div className="pt-4 mt-4 border-t border-slate-700/80 flex items-center justify-between gap-3">
                                        <div>
                                            <div className="text-xs text-slate-400 line-through">
                                                {formatBDT(bundle.regular_price)}
                                            </div>
                                            <div className="text-xl font-black text-amber-400">
                                                {formatBDT(bundle.sale_price)}
                                            </div>
                                        </div>

                                        <Link
                                            to={`/courses`}
                                            className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-colors shadow-md cursor-pointer"
                                        >
                                            Get Bundle
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* 5. BONDI PATHSHALA STYLE ROUTINE & MODEL TEST CTA BANNER */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-gradient-to-r from-sky-600 via-sky-700 to-amber-600 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-xl">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                        <div className="lg:col-span-8 space-y-4 text-center lg:text-left">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold tracking-wide">
                                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                <span>Verify 100% Exam Readiness</span>
                            </div>
                            <h2 className="text-2xl sm:text-4xl font-black leading-tight">
                                Test Yourself in the Live Exam Hall, <br />
                                Know Your Real Position on the Instant Merit List!
                            </h2>
                            <p className="text-xs sm:text-sm text-sky-100 max-w-xl leading-relaxed">
                                Experience chapter-wise model tests in authentic board & admission environments with negative marking, step-by-step solutions, and performance reviews.
                            </p>
                        </div>

                        <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
                            <Link
                                to="/student/exams"
                                className="px-6 py-3.5 bg-white hover:bg-slate-100 text-sky-700 font-black rounded-2xl text-center text-sm shadow-md transition-all cursor-pointer"
                            >
                                Take Online Model Tests
                            </Link>
                            <Link
                                to="/courses?type=free"
                                className="px-6 py-3.5 bg-sky-900/60 hover:bg-sky-900 text-white border border-white/20 font-bold rounded-2xl text-center text-sm transition-all cursor-pointer"
                            >
                                Free Resources & Demo Classes
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. BEST INSTRUCTORS & MENTORS CAROUSEL (Bondi Pathshala Inspired Arched Portrait Cards) */}
            <section className="relative py-12 sm:py-16 bg-gradient-to-b from-white via-sky-50/20 to-white dark:from-slate-950 dark:via-slate-900/40 dark:to-slate-950 border-y border-slate-100 dark:border-slate-800/80 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Section Header */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-8">
                        {/* Left: Section Title with Orange Swoosh Underline */}
                        <div>
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center flex-wrap gap-2">
                                <span>Meet Our Expert</span>
                                <span className="relative inline-block text-sky-500 dark:text-sky-400">
                                    Instructors
                                    <svg
                                        className="absolute -bottom-2 left-0 w-full h-3 text-amber-500"
                                        viewBox="0 0 160 12"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M2 9.5C45 2 115 1.5 158 8.5"
                                            stroke="currentColor"
                                            strokeWidth="3.5"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </span>
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-2">
                                Learn from top faculty and experienced mentors
                            </p>
                        </div>

                        {/* Center: Category Filter Pills */}
                        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none">
                            {[
                                { id: 'all', label: 'All Faculty' },
                                { id: 'anatomy', label: 'Anatomy' },
                                { id: 'physiology', label: 'Physiology' },
                                { id: 'biochemistry', label: 'Biochemistry' },
                                { id: 'clinical', label: 'Clinical & Viva' }
                            ].map((tab) => {
                                const isActive = teacherFilter === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setTeacherFilter(tab.id as any)}
                                        className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
                                            isActive
                                                ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/25'
                                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-white border border-slate-200 dark:border-slate-800 hover:border-teal-300'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Right: Action Button & Arrow Navigation */}
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0 self-end lg:self-auto">
                            <Link
                                to="/courses"
                                className="px-5 py-2 rounded-full bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                            >
                                <span>View All Instructors</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={scrollLeft}
                                    aria-label="Previous teachers"
                                    className="p-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-800 hover:border-sky-300 hover:text-sky-600 transition-all shadow-xs cursor-pointer active:scale-95"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={scrollRight}
                                    aria-label="Next teachers"
                                    className="p-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-800 hover:border-sky-300 hover:text-sky-600 transition-all shadow-xs cursor-pointer active:scale-95"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Carousel Scroll Container */}
                    {teachersLoading ? (
                        <div className="flex gap-2.5 sm:gap-5 overflow-hidden py-2">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div
                                    key={i}
                                    className="w-[calc(50%-5px)] sm:w-[220px] md:w-[245px] shrink-0 bg-white dark:bg-slate-900 rounded-[20px] sm:rounded-[26px] border border-slate-100 dark:border-slate-800 p-2 sm:p-3 animate-pulse space-y-2 sm:space-y-3"
                                >
                                    <div className="aspect-[3/3.8] rounded-xl sm:rounded-2xl bg-slate-200 dark:bg-slate-800" />
                                    <div className="h-3.5 sm:h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                                </div>
                            ))}
                        </div>
                    ) : displayedFaculty.length === 0 ? (
                        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 text-slate-500">
                            <GraduationCap className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                            <p className="text-sm font-semibold">No instructors listed in this category</p>
                        </div>
                    ) : (
                        <div
                            ref={carouselRef}
                            onMouseEnter={() => setIsPaused(true)}
                            onMouseLeave={() => setIsPaused(false)}
                            className="flex gap-2.5 sm:gap-5 overflow-x-auto pb-4 pt-1 scroll-smooth scrollbar-none"
                            style={{ scrollSnapType: 'x mandatory' }}
                        >
                            {displayedFaculty.map((teacher) => (
                                <Link
                                    to={`/instructors/${teacher.id}`}
                                    key={teacher.id}
                                    style={{ scrollSnapAlign: 'start' }}
                                    className="w-[calc(50%-5px)] sm:w-[220px] md:w-[245px] shrink-0 bg-white dark:bg-slate-900 rounded-[20px] sm:rounded-[26px] border border-slate-200/90 dark:border-slate-800 p-2 sm:p-3 shadow-md hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group cursor-pointer relative"
                                >
                                    {/* Arched Photo / Portrait Container */}
                                    <div className="relative aspect-[3/3.8] rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-b from-sky-400 via-sky-600 to-slate-950 dark:from-sky-500 dark:via-sky-800 dark:to-slate-950 flex items-end justify-center">
                                        {/* Radial soft lighting */}
                                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent pointer-events-none" />

                                        {/* Sparkle star accents */}
                                        <div className="absolute top-3 right-3 sm:top-4 sm:right-5 text-sky-200/50 pointer-events-none animate-pulse">
                                            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        </div>
                                        <div className="absolute top-10 left-3 sm:top-12 sm:left-4 text-cyan-200/40 pointer-events-none">
                                            <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                        </div>

                                        {/* Arched border guide */}
                                        <div className="absolute inset-1.5 rounded-t-full border border-sky-300/25 pointer-events-none" />

                                        {/* Top Left Institution Badge */}
                                        <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 z-10 px-1.5 sm:px-2 py-0.5 rounded-full bg-slate-950/60 backdrop-blur-md border border-white/20 text-[9px] sm:text-[10px] font-black text-white flex items-center gap-1 shadow-xs">
                                            <span>{teacher.institution || 'BUET'}</span>
                                        </div>

                                        {/* Top Right Golden Crest */}
                                        <div className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-10 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-400/25 backdrop-blur-md border border-amber-300/40 flex items-center justify-center text-amber-300 shadow-xs">
                                            <Award className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                        </div>

                                        {/* Teacher Photo */}
                                        <div className="w-full h-[90%] relative flex items-end justify-center overflow-hidden">
                                            {teacher.photo_url ? (
                                                <img
                                                    src={teacher.photo_url}
                                                    alt={teacher.name}
                                                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 drop-shadow-md"
                                                    loading="lazy"
                                                    onError={(e) => {
                                                        (e.target as HTMLElement).style.display = 'none';
                                                    }}
                                                />
                                            ) : null}
                                            <div className={`w-full h-full flex flex-col items-center justify-center text-white ${teacher.photo_url ? 'hidden' : 'flex'}`}>
                                                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center text-base sm:text-xl font-black mb-1">
                                                    {(teacher.name || 'T').charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-[9px] sm:text-[10px] font-bold text-sky-200">Instructor & Mentor</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom Info Details */}
                                    <div className="pt-2 sm:pt-2.5 px-0.5 space-y-1 flex-1 flex flex-col justify-between">
                                        <div>
                                            {/* Teacher Name */}
                                            <h3 className="font-extrabold text-xs sm:text-base text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors line-clamp-1">
                                                {teacher.name}
                                            </h3>

                                            {/* Designation & Experience */}
                                            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 font-medium">
                                                {teacher.designation} {teacher.experience ? `— ${teacher.experience}` : ''}
                                            </p>
                                        </div>

                                        {/* Category Pill Badges */}
                                        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap pt-1.5 sm:pt-2">
                                            {teacher.tags && teacher.tags.length > 0 ? (
                                                teacher.tags.slice(0, 2).map((tag, idx) => (
                                                    <span
                                                        key={idx}
                                                        className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold tracking-tight border ${
                                                            idx === 0
                                                                ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                                                                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                                        }`}
                                                    >
                                                        {tag}
                                                    </span>
                                                ))
                                            ) : (
                                                <>
                                                    <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold tracking-tight border bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 border-sky-200 dark:border-sky-800">
                                                        Class 9-10
                                                    </span>
                                                    <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold tracking-tight border bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                                                        HSC
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* 6.1. VIDEO TESTIMONIALS (3D Coverflow Slider with YouTube Lightbox) */}
            <VideoTestimonialsCoverflow settings={videoTestimonialsBlock?.settings} />

            {/* 6.5. STUDENT REVIEWS / TESTIMONIALS DUAL-DIRECTION SCROLL MARQUEE */}
            <StudentReviewsMarquee settings={testimonialsBlock?.settings} />

            {/* 7. WHY CHOOSE DoctorWallah (Platform Pillars) */}
            <section className="bg-slate-900 text-white py-16 sm:py-20 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-teal-400 bg-teal-950 px-3 py-1 rounded-full border border-teal-800">
                            Why Choose DoctorWallah?
                        </span>
                        <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
                            The Complete MBBS Academic Excellence Platform
                        </h2>
                        <p className="text-slate-400 text-xs sm:text-sm">
                            We bridge textbook theory, cadaveric dissection, and clinical viva questions to ensure top honours in 1st Prof.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/60 space-y-3 hover:border-teal-500 transition-colors">
                            <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                                <Activity className="w-6 h-6" />
                            </div>
                            <h3 className="text-base font-bold text-white">Research-Based Conceptual Classes</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                High-yield medical lectures breaking down complex pathways into unforgettable clinical concepts.
                            </p>
                        </div>

                        <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/60 space-y-3 hover:border-teal-500 transition-colors">
                            <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                                <Video className="w-6 h-6" />
                            </div>
                            <h3 className="text-base font-bold text-white">10-Minute Item Quick Recap</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Short, high-yield summary videos to rapidly revise key landmarks and viva points the night before your oral exam.
                            </p>
                        </div>

                        <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/60 space-y-3 hover:border-emerald-500 transition-colors">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                <Microscope className="w-6 h-6" />
                            </div>
                            <h3 className="text-base font-bold text-white">Dissection & Viscera Demos</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Clear video demonstrations of organs, muscle attachments, and histology slides for perfect OSPE score.
                            </p>
                        </div>

                        <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/60 space-y-3 hover:border-amber-500 transition-colors">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                                <FileText className="w-6 h-6" />
                            </div>
                            <h3 className="text-base font-bold text-white">Marked Standard Books</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Soft-copy standard textbooks (BDC, Guyton, Datta, Langman) with marked high-yield lines and item questions.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 8. FREQUENTLY ASKED QUESTIONS (FAQ Accordion) */}
            <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10 space-y-2">
                    <span className="text-xs font-bold text-sky-600 uppercase tracking-widest bg-sky-50 dark:bg-sky-950/60 px-3 py-1 rounded-full">
                        Questions & Answers
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        Frequently Asked Questions (FAQ)
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500">
                        Everything you need to know about enrollment, access, and our learning tools.
                    </p>
                </div>

                <div className="space-y-3">
                    {faqs.map((faq, idx) => {
                        const isOpen = openFaq === idx;
                        return (
                            <div
                                key={idx}
                                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all shadow-2xs"
                            >
                                <button
                                    type="button"
                                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-900 dark:text-white hover:text-sky-600 transition-colors cursor-pointer"
                                >
                                    <span>{faq.q}</span>
                                    <ChevronDown
                                        className={`w-5 h-5 text-slate-400 transition-transform duration-200 shrink-0 ${
                                            isOpen ? 'rotate-180 text-sky-600' : ''
                                        }`}
                                    />
                                </button>
                                {isOpen && (
                                    <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* 9. COMMUNITY & ADMISSION CONSULTANCY BANNER */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 text-center space-y-6 relative overflow-hidden border border-slate-800">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-bold tracking-wide">
                        <Users className="w-3.5 h-3.5" />
                        <span>Learners Community</span>
                    </div>

                    <h2 className="text-2xl sm:text-4xl font-black max-w-2xl mx-auto leading-tight">
                        Join 50,000+ Students on Your Journey to Academic Excellence Today!
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
                        Our support team is always ready to guide you towards the right courses and career paths.
                    </p>

                    <div className="flex flex-wrap justify-center gap-4 pt-2">
                        <Link
                            to="/courses"
                            className="px-8 py-3.5 bg-gradient-to-r from-sky-500 via-sky-600 to-sky-700 hover:from-sky-600 hover:to-sky-800 text-white font-extrabold rounded-2xl text-sm transition-all shadow-lg shadow-sky-600/30 cursor-pointer"
                        >
                            Explore Courses
                        </Link>
                        <Link
                            to="/register"
                            className="px-8 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-extrabold rounded-2xl text-sm transition-all border border-slate-700 cursor-pointer"
                        >
                            Register for Free
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};
