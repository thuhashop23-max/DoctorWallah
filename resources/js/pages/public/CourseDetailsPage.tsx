import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiClient, formatBDT, getImageUrl } from '../../api/client';
import { Course } from '../../types';
import { MathView } from '../../components/shared/MathView';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
    BookOpen, 
    Users, 
    Clock, 
    PlayCircle, 
    CheckCircle2, 
    Lock, 
    Unlock,
    Sparkles, 
    ChevronDown, 
    ChevronUp, 
    ShieldCheck, 
    ArrowRight, 
    Calendar, 
    GraduationCap, 
    FileText, 
    ExternalLink, 
    X, 
    Copy, 
    Check, 
    Key, 
    ShoppingCart,
    Award,
    Star,
    Video,
    HelpCircle,
    Download,
    Stethoscope,
    Activity,
    Layers,
    Share2
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { PagePreloader } from '../../components/shared/PagePreloader';

const DEFAULT_FEATURES = [
    'Complete Clinical & Academic Lecture Series (Full HD)',
    'BMDC Curriculum & Professional Exam Oriented Syllabus',
    'High-Yield Annotated PDF Lecture Notes & Formulas',
    'Clinical Case Discussions, Ward Correlation & Drug Charts',
    'Interactive Q&A Mentorship with Senior Doctors',
    'Self-Assessment Model Tests & High-Yield Question Bank',
    'Unrestricted Lifetime Access across Mobile & Desktop',
];

export const CourseDetailsPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t, language } = useLanguage();
    const { addToCart, isInCart } = useCart();

    const [course, setCourse] = useState<Course | null>(null);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [accessKey, setAccessKey] = useState<string | null>(null);
    const [copiedAccessKey, setCopiedAccessKey] = useState(false);
    const [loading, setLoading] = useState(true);
    const [openSections, setOpenSections] = useState<Record<number, boolean>>({});
    const [enrollingFree, setEnrollingFree] = useState(false);
    const [copiedCoupon, setCopiedCoupon] = useState(false);
    const [showHowToBuyModal, setShowHowToBuyModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'instructors' | 'benefits'>('overview');

    // Live countdown timer state
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
    });

    useEffect(() => {
        if (!course?.show_coupon_timer || !course?.discount_deadline) {
            setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            return;
        }

        const updateTimer = () => {
            const diff = new Date(course.discount_deadline).getTime() - new Date().getTime();
            if (diff > 0) {
                setTimeLeft({
                    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((diff / 1000 / 60) % 60),
                    seconds: Math.floor((diff / 1000) % 60),
                });
            } else {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [course?.discount_deadline, course?.show_coupon_timer]);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const { data } = await apiClient.get(`/courses/${slug}`);
                setCourse(data.course);
                setIsEnrolled(data.is_enrolled || false);
                setAccessKey(data.access_key || null);
                // Expand all sections by default
                if (data.course?.sections) {
                    const expanded: Record<number, boolean> = {};
                    data.course.sections.forEach((s: any) => {
                        expanded[s.id] = true;
                    });
                    setOpenSections(expanded);
                }
            } catch {
                navigate('/courses');
            } finally {
                setLoading(false);
            }
        };
        fetchCourse();
    }, [slug]);

    const handleCopyAccessKey = (key: string) => {
        navigator.clipboard.writeText(key);
        setCopiedAccessKey(true);
        setTimeout(() => setCopiedAccessKey(false), 2500);
    };

    const toggleSection = (id: number) => {
        setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleFreeEnroll = async () => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (!course) return;

        setEnrollingFree(true);
        try {
            await apiClient.post(`/courses/${course.id}/enroll-free`);
            setIsEnrolled(true);
            const firstLesson = course.sections?.[0]?.lessons?.[0];
            if (firstLesson) {
                navigate(`/learning/${course.id}/lessons/${firstLesson.id}`);
            } else {
                navigate('/student/my-courses');
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Enrollment failed.');
        } finally {
            setEnrollingFree(false);
        }
    };

    if (loading) {
        return (
            <PagePreloader
                title="Loading course details..."
                subtitle="Fetching medical curriculum, clinical records, and syllabus"
            />
        );
    }

    if (!course) return null;

    const allInstructors: any[] = (course.instructors && course.instructors.length > 0)
        ? course.instructors
        : (course.instructor ? [course.instructor] : []);

    const firstLessonId = course.sections?.[0]?.lessons?.[0]?.id;
    const totalEnrolled = (course.fake_enrollment_count || 0) + (course.enrollments_count || 0);
    const courseFeatures = (course.features && course.features.length > 0) ? course.features : DEFAULT_FEATURES;

    const effectivePrice = course.sale_price !== null && course.sale_price !== undefined && Number(course.sale_price) < Number(course.price)
        ? Number(course.sale_price)
        : (course.effective_price ?? Number(course.price));
    const hasDiscount = course.sale_price !== null && course.sale_price !== undefined && Number(course.sale_price) < Number(course.price);
    const promoCoupon = course.coupon_code || '';
    const discountAmount = hasDiscount ? Math.round(Number(course.price) - Number(course.sale_price)) : 0;
    const discountPercentage = hasDiscount && Number(course.price) > 0 
        ? Math.round(((Number(course.price) - Number(course.sale_price)) / Number(course.price)) * 100) 
        : 0;
    const discountText = course.coupon_discount_text || (discountPercentage > 0 ? `${discountPercentage}% OFF` : '');

    const handleApplyCoupon = () => {
        if (promoCoupon && navigator.clipboard) {
            navigator.clipboard.writeText(promoCoupon);
        }
        setCopiedCoupon(true);
        setTimeout(() => setCopiedCoupon(false), 2500);
        addToCart(course);
    };

    return (
        <div className="bg-slate-50 dark:bg-[#050505] text-slate-900 dark:text-white min-h-screen pb-28 sm:pb-20 selection:bg-[#A60201] selection:text-white font-sans antialiased relative transition-colors">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[480px] bg-gradient-to-b from-[#A60201]/12 via-[#A60201]/3 to-transparent blur-3xl pointer-events-none -z-10" />

            {/* Top Minimal Breadcrumb Bar */}
            <div className="border-b border-slate-200 dark:border-white/[0.06] bg-white/80 dark:bg-[#070303]/80 backdrop-blur-md sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 min-w-0">
                        <Link to="/" className="hover:text-slate-900 dark:hover:text-white transition-colors shrink-0">Home</Link>
                        <span className="text-slate-400 dark:text-slate-600">/</span>
                        <Link to="/courses" className="hover:text-slate-900 dark:hover:text-white transition-colors shrink-0">Courses</Link>
                        <span className="text-slate-400 dark:text-slate-600">/</span>
                        <span className="text-slate-900 dark:text-slate-200 font-semibold truncate">{course.title}</span>
                    </div>

                    <div className="hidden sm:flex items-center gap-3 shrink-0">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-400/20">
                            <Star className="w-3 h-3 fill-amber-500 dark:fill-amber-400 text-amber-500 dark:text-amber-400" />
                            <span>4.9 / 5.0 (Medical Peer Rated)</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Hero Section */}
            <section className="relative pt-8 pb-12 sm:pt-12 sm:pb-16 border-b border-slate-200 dark:border-white/[0.06] bg-white dark:bg-gradient-to-b dark:from-[#0B0303] dark:via-[#070202] dark:to-[#050505] overflow-hidden">
                {/* Subtle Grid Accent */}
                <div className="absolute inset-0 bg-[radial-gradient(#A60201_1px,transparent_1px)] [background-size:32px_32px] opacity-10 pointer-events-none" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                        {/* Hero Text Content (Left Column) */}
                        <div className="lg:col-span-8 space-y-5">
                            {/* Eyebrow Label */}
                            <div className="flex flex-wrap items-center gap-2.5">
                                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-50 dark:bg-[#A60201]/15 text-[#A60201] dark:text-red-200 text-xs font-bold tracking-wider uppercase border border-red-200 dark:border-[#A60201]/40 shadow-xs">
                                    <Stethoscope className="w-3.5 h-3.5 text-[#A60201]" />
                                    <span>MBBS Clinical Program</span>
                                </span>

                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-white/[0.08]">
                                    <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                    <span>BMDC Curriculum Aligned</span>
                                </span>
                            </div>

                            {/* Main Title */}
                            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.18] drop-shadow-xs">
                                {course.title}
                            </h1>

                            {/* Subtitle / Description */}
                            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl font-normal">
                                {course.short_description || 'Master clinical concepts, ward rounds, pharmacology, and exam-oriented high-yield topics with experienced medical mentors.'}
                            </p>

                            {/* Key Quick Metrics Bar */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-2">
                                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] backdrop-blur-xs shadow-xs">
                                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Classes</span>
                                    <span className="text-lg font-black text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                                        <BookOpen className="w-4 h-4 text-[#A60201]" />
                                        {course.lessons_count || 0} Lessons
                                    </span>
                                </div>

                                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] backdrop-blur-xs shadow-xs">
                                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Enrolled</span>
                                    <span className="text-lg font-black text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                                        <Users className="w-4 h-4 text-[#A60201]" />
                                        {totalEnrolled}+ Doctors
                                    </span>
                                </div>

                                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] backdrop-blur-xs shadow-xs">
                                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Validity</span>
                                    <span className="text-lg font-black text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                                        <Clock className="w-4 h-4 text-[#A60201]" />
                                        Lifetime
                                    </span>
                                </div>

                                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] backdrop-blur-xs shadow-xs">
                                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Language</span>
                                    <span className="text-lg font-black text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                                        <GraduationCap className="w-4 h-4 text-[#A60201]" />
                                        Bangla + Eng
                                    </span>
                                </div>
                            </div>

                            {/* Mentors Avatar Strip */}
                            {allInstructors.length > 0 && (
                                <div className="pt-2 flex items-center gap-3">
                                    <div className="flex -space-x-2.5 overflow-hidden p-0.5">
                                        {allInstructors.slice(0, 3).map((inst: any) => {
                                            const p = inst.photo_url || inst.teacher_profile?.photo_url || inst.teacherProfile?.photo_url;
                                            return p ? (
                                                <img
                                                    key={inst.id}
                                                    src={getImageUrl(p)}
                                                    alt={inst.name}
                                                    className="inline-block h-9 w-9 rounded-full ring-2 ring-white dark:ring-[#070202] object-cover object-top"
                                                />
                                            ) : (
                                                <div
                                                    key={inst.id}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#A60201] text-xs font-black text-white ring-2 ring-white dark:ring-[#070202]"
                                                >
                                                    {inst.name.charAt(0).toUpperCase()}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="text-xs">
                                        <span className="text-slate-500 dark:text-slate-400 block">Led by Medical Mentors</span>
                                        <span className="font-extrabold text-slate-900 dark:text-white">
                                            {allInstructors.map((i: any) => i.name).join(', ')}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Spacer column on desktop for layout balance */}
                        <div className="hidden lg:block lg:col-span-4" />
                    </div>
                </div>
            </section>

            {/* Main Interactive Container */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                    {/* Left Column: Navigation Tabs & Tab Content */}
                    <div className="order-2 lg:order-1 lg:col-span-8 space-y-6">
                        {/* Modern Tab Bar */}
                        <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-[#0D0404]/90 border border-slate-200 dark:border-white/[0.08] rounded-2xl overflow-x-auto no-scrollbar shadow-inner">
                            <button
                                type="button"
                                onClick={() => setActiveTab('overview')}
                                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
                                    activeTab === 'overview'
                                        ? 'bg-[#A60201] text-white shadow-md shadow-[#A60201]/30'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-white dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/[0.04]'
                                }`}
                            >
                                <FileText className="w-4 h-4" />
                                <span>Overview</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('curriculum')}
                                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
                                    activeTab === 'curriculum'
                                        ? 'bg-[#A60201] text-white shadow-md shadow-[#A60201]/30'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-white dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/[0.04]'
                                }`}
                            >
                                <Layers className="w-4 h-4" />
                                <span>Curriculum ({course.sections?.length || 0} Modules)</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('instructors')}
                                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
                                    activeTab === 'instructors'
                                        ? 'bg-[#A60201] text-white shadow-md shadow-[#A60201]/30'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-white dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/[0.04]'
                                }`}
                            >
                                <GraduationCap className="w-4 h-4" />
                                <span>Faculty</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('benefits')}
                                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
                                    activeTab === 'benefits'
                                        ? 'bg-[#A60201] text-white shadow-md shadow-[#A60201]/30'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-white dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/[0.04]'
                                }`}
                            >
                                <ShieldCheck className="w-4 h-4" />
                                <span>What's Included</span>
                            </button>
                        </div>

                        {/* Tab 1: Overview */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6 animate-in fade-in duration-200">
                                {/* Description Card */}
                                <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0A0505] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl space-y-4">
                                    <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
                                        <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-[#A60201]/15 text-[#A60201] flex items-center justify-center font-bold">
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                                            Course Details & Syllabus Breakdown
                                        </h2>
                                    </div>

                                    {course.description ? (
                                        <MathView
                                            content={course.description}
                                            className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed font-sans max-w-none prose prose-slate dark:prose-invert"
                                        />
                                    ) : (
                                        <p className="text-sm text-slate-500 dark:text-slate-400 italic">Course description will be published soon.</p>
                                    )}
                                </div>

                                {/* Class Highlights Bento Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#0D0505] border border-slate-200 dark:border-[#A60201]/20 hover:border-[#A60201]/50 transition-colors space-y-2">
                                        <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-[#A60201]/15 text-[#A60201] flex items-center justify-center">
                                            <Video className="w-4 h-4" />
                                        </div>
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Full HD Video Classes</h3>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                            Watch every lecture on your own schedule with zero ads, high-speed streaming, and playback speed control.
                                        </p>
                                    </div>

                                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#0D0505] border border-slate-200 dark:border-[#A60201]/20 hover:border-[#A60201]/50 transition-colors space-y-2">
                                        <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-[#A60201]/15 text-[#A60201] flex items-center justify-center">
                                            <Download className="w-4 h-4" />
                                        </div>
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Annotated Medical Notes</h3>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                            Download high-resolution presentation slides, clinical diagrams, formulas, and mnemonics in PDF.
                                        </p>
                                    </div>

                                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#0D0505] border border-slate-200 dark:border-[#A60201]/20 hover:border-[#A60201]/50 transition-colors space-y-2">
                                        <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-[#A60201]/15 text-[#A60201] flex items-center justify-center">
                                            <Stethoscope className="w-4 h-4" />
                                        </div>
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Ward & Clinical Correlation</h3>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                            Bridging textbook theory with clinical bedside case presentations and OSPE/viva questions.
                                        </p>
                                    </div>

                                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#0D0505] border border-slate-200 dark:border-[#A60201]/20 hover:border-[#A60201]/50 transition-colors space-y-2">
                                        <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-[#A60201]/15 text-[#A60201] flex items-center justify-center">
                                            <HelpCircle className="w-4 h-4" />
                                        </div>
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Direct Mentor Doubt Clearing</h3>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                            Ask questions directly to doctors in the dedicated discussion panel for instant conceptual clarity.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab 2: Curriculum */}
                        {activeTab === 'curriculum' && (
                            <div className="space-y-4 animate-in fade-in duration-200">
                                <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#0A0505] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
                                        <div>
                                            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                                                <Layers className="w-5 h-5 text-[#A60201]" />
                                                <span>Complete Syllabus Breakdown</span>
                                            </h2>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                {course.sections?.length || 0} Modules • {course.lessons_count || 0} Lectures • Comprehensive Clinical Coverage
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                const allOpen = Object.values(openSections).every(Boolean);
                                                const updated: Record<number, boolean> = {};
                                                course.sections?.forEach((s: any) => {
                                                    updated[s.id] = !allOpen;
                                                });
                                                setOpenSections(updated);
                                            }}
                                            className="text-xs font-bold text-[#A60201] hover:underline self-start sm:self-auto cursor-pointer"
                                        >
                                            {Object.values(openSections).every(Boolean) ? 'Collapse All Modules' : 'Expand All Modules'}
                                        </button>
                                    </div>

                                    {/* Module Accordions */}
                                    <div className="space-y-3 pt-2">
                                        {course.sections && course.sections.length > 0 ? (
                                            course.sections.map((section, sIndex) => {
                                                const isOpen = openSections[section.id];
                                                return (
                                                    <div
                                                        key={section.id}
                                                        className="border border-slate-200 dark:border-white/[0.06] rounded-2xl overflow-hidden bg-slate-50 dark:bg-[#0D0505] transition-colors"
                                                    >
                                                        {/* Section Header */}
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleSection(section.id)}
                                                            className="w-full px-5 py-4 bg-slate-100/80 hover:bg-slate-200/60 dark:bg-[#110505] dark:hover:bg-[#170707] flex items-center justify-between text-left transition-colors cursor-pointer border-b border-slate-200 dark:border-white/[0.04]"
                                                        >
                                                            <div className="space-y-0.5">
                                                                <span className="text-[11px] font-black text-[#A60201] uppercase tracking-wider block">
                                                                    Module {sIndex + 1 < 10 ? `0${sIndex + 1}` : sIndex + 1}
                                                                </span>
                                                                <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                                                                    {section.title}
                                                                </h4>
                                                            </div>

                                                            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 shrink-0">
                                                                <span className="bg-white dark:bg-black/60 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/[0.08] font-bold text-slate-700 dark:text-slate-300 shadow-2xs">
                                                                    {section.lessons?.length || 0} Classes
                                                                </span>
                                                                {isOpen ? <ChevronUp className="w-4 h-4 text-[#A60201]" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                                            </div>
                                                        </button>

                                                        {/* Section Lessons */}
                                                        {isOpen && (
                                                            <div className="divide-y divide-slate-100 dark:divide-white/[0.04] bg-white dark:bg-[#0A0404]">
                                                                {section.lessons?.map((lesson, lIndex) => {
                                                                    const isTeacherOrAdmin = Boolean(user && (user.role === 'admin' || (user.role === 'teacher' && course?.instructors?.some((i: any) => i.id === user.id))));
                                                                    const isPurchased = Boolean(isEnrolled || isTeacherOrAdmin);
                                                                    const canAccess = Boolean(isPurchased || lesson.is_preview);
                                                                    const lessonUrl = `/learning/${course.id}/lessons/${lesson.id}`;

                                                                    if (canAccess) {
                                                                        return (
                                                                            <Link
                                                                                key={lesson.id}
                                                                                to={lessonUrl}
                                                                                className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#160606] transition-colors text-sm group cursor-pointer"
                                                                            >
                                                                                <div className="flex items-center gap-3 min-w-0">
                                                                                    {isPurchased ? (
                                                                                        <Unlock className="w-4 h-4 text-emerald-500 shrink-0 group-hover:scale-110 transition-transform" />
                                                                                    ) : (
                                                                                        <PlayCircle className="w-4 h-4 text-[#A60201] shrink-0 group-hover:scale-110 transition-transform" />
                                                                                    )}
                                                                                    <span className="text-slate-800 dark:text-slate-200 font-medium group-hover:text-[#A60201] dark:group-hover:text-red-200 transition-colors truncate">
                                                                                        Class {lIndex + 1}: {lesson.title}
                                                                                    </span>
                                                                                </div>

                                                                                <div className="flex items-center gap-3 shrink-0">
                                                                                    {lesson.is_preview && !isPurchased ? (
                                                                                        <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 px-2 py-0.5 rounded flex items-center gap-1 shadow-2xs">
                                                                                            <PlayCircle className="w-3 h-3 text-emerald-500 dark:text-emerald-400" /> Free Preview
                                                                                        </span>
                                                                                    ) : (
                                                                                        <span className="text-xs font-bold text-[#A60201] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                                                                            <span>Watch</span>
                                                                                            <ArrowRight className="w-3.5 h-3.5" />
                                                                                        </span>
                                                                                    )}
                                                                                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                                                                                        {lesson.duration_minutes} mins
                                                                                    </span>
                                                                                </div>
                                                                            </Link>
                                                                        );
                                                                    }

                                                                    return (
                                                                        <div
                                                                            key={lesson.id}
                                                                            onClick={() => {
                                                                                const enrollCard = document.getElementById('enroll-section-card');
                                                                                if (enrollCard) {
                                                                                    enrollCard.scrollIntoView({ behavior: 'smooth' });
                                                                                }
                                                                            }}
                                                                            className="px-5 py-3.5 flex items-center justify-between bg-slate-50/50 dark:bg-black/20 hover:bg-slate-100/60 dark:hover:bg-black/40 text-sm cursor-not-allowed opacity-75 transition-colors"
                                                                            title="Enroll in this course to unlock this class"
                                                                        >
                                                                            <div className="flex items-center gap-3 min-w-0">
                                                                                <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                                                                                <span className="text-slate-500 dark:text-slate-400 font-medium truncate">
                                                                                    Class {lIndex + 1}: {lesson.title}
                                                                                </span>
                                                                            </div>

                                                                            <div className="flex items-center gap-3 shrink-0">
                                                                                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                                                                                    <Lock className="w-3 h-3" />
                                                                                    Locked
                                                                                </span>
                                                                                <span className="text-xs text-slate-400 font-mono">
                                                                                    {lesson.duration_minutes} mins
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
                                                Curriculum for this course will be updated shortly.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab 3: Faculty / Instructors */}
                        {activeTab === 'instructors' && (
                            <div className="space-y-4 animate-in fade-in duration-200">
                                <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0A0505] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl space-y-6">
                                    <div className="pb-4 border-b border-slate-100 dark:border-white/[0.06]">
                                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                                            <GraduationCap className="w-5 h-5 text-[#A60201]" />
                                            <span>Course Instructors & Academic Mentors</span>
                                        </h2>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            Learn directly from qualified medical graduates and experienced teachers.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {allInstructors.length > 0 ? (
                                            allInstructors.map((teacher: any) => {
                                                const rawPhoto = teacher.photo_url 
                                                    || teacher.teacher_profile?.photo_url 
                                                    || teacher.teacherProfile?.photo_url 
                                                    || teacher.photo 
                                                    || teacher.avatar;
                                                const photoSrc = rawPhoto ? getImageUrl(rawPhoto) : '';
                                                const designation = teacher.designation 
                                                    || teacher.teacher_profile?.designation 
                                                    || teacher.teacherProfile?.designation 
                                                    || 'MBBS, Clinical Faculty & Mentor';
                                                const institution = teacher.institution 
                                                    || teacher.teacher_profile?.institution 
                                                    || teacher.teacherProfile?.institution;

                                                return (
                                                    <div 
                                                        key={teacher.id} 
                                                        className="p-5 rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-[#0E0505] hover:border-[#A60201]/50 hover:shadow-lg dark:hover:shadow-[#A60201]/10 transition-all flex items-center gap-4 group"
                                                    >
                                                        {/* Avatar */}
                                                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 border border-slate-200 dark:border-[#A60201]/40 bg-slate-100 dark:bg-black p-0.5 shadow-xs">
                                                            {photoSrc ? (
                                                                <img
                                                                    src={photoSrc}
                                                                    alt={teacher.name}
                                                                    className="w-full h-full object-cover object-top rounded-[14px]"
                                                                    onError={(e) => {
                                                                        (e.currentTarget as HTMLElement).style.display = 'none';
                                                                        const fallback = e.currentTarget.parentElement?.querySelector('.teacher-fallback-avatar') as HTMLElement;
                                                                        if (fallback) fallback.style.display = 'flex';
                                                                    }}
                                                                />
                                                            ) : null}
                                                            <div className={`teacher-fallback-avatar w-full h-full ${photoSrc ? 'hidden' : 'flex'} items-center justify-center rounded-[14px] bg-gradient-to-tr from-[#A60201] to-slate-900 text-white font-black text-2xl`}>
                                                                {teacher.name ? teacher.name.charAt(0).toUpperCase() : 'D'}
                                                            </div>
                                                        </div>

                                                        {/* Info */}
                                                        <div className="min-w-0 flex-1">
                                                            <Link 
                                                                to={`/instructors/${teacher.id}`}
                                                                className="font-bold text-slate-900 dark:text-white text-base hover:text-[#A60201] dark:hover:text-red-300 transition-colors line-clamp-1 block cursor-pointer"
                                                            >
                                                                {teacher.name}
                                                            </Link>
                                                            <p className="text-xs text-[#A60201] dark:text-red-300 font-medium mt-0.5 line-clamp-1">
                                                                {designation}
                                                            </p>
                                                            {institution && (
                                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 line-clamp-1">
                                                                    {institution}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-[#0E0505] flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-[#A60201]/15 border border-red-200 dark:border-[#A60201]/40 flex items-center justify-center shrink-0 text-[#A60201] font-black text-2xl">
                                                    DW
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900 dark:text-white text-base">DoctorWallah Clinical Faculty</h4>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Experienced Medical Doctors & Academic Specialists</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab 4: What's Included / Benefits */}
                        {activeTab === 'benefits' && (
                            <div className="space-y-4 animate-in fade-in duration-200">
                                <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0A0505] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl space-y-5">
                                    <div className="pb-4 border-b border-slate-100 dark:border-white/[0.06]">
                                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                                            <ShieldCheck className="w-5 h-5 text-[#A60201]" />
                                            <span>Full Course Privileges & Included Material</span>
                                        </h2>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            All features unlocked immediately upon enrollment verification.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                        {courseFeatures.map((feat, idx) => (
                                            <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0E0505] border border-slate-200 dark:border-white/[0.04] flex items-start gap-3">
                                                <CheckCircle2 className="w-4 h-4 text-[#A60201] shrink-0 mt-0.5" />
                                                <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 leading-snug">{feat}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Sticky Elegant Purchase Card */}
                    <div className="order-1 lg:order-2 lg:col-span-4 -mt-6 sm:-mt-8 lg:-mt-48 xl:-mt-52 relative z-20">
                        <div id="enroll-section-card" className="sticky top-20 bg-white dark:bg-[#0C0505]/95 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-[#A60201]/30 shadow-xl dark:shadow-2xl dark:shadow-black/90 overflow-hidden space-y-5 p-5 sm:p-6 ring-1 ring-slate-200/50 dark:ring-white/[0.05]">
                            {/* Top Laser Accent */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#A60201] to-transparent shadow-[0_0_12px_#A60201]" />

                            {/* Media Preview Box */}
                            <div className="aspect-video bg-black rounded-2xl overflow-hidden -mx-2 -mt-2 border border-slate-200 dark:border-white/[0.08] relative group">
                                {(course.thumbnail || (course as any).thumbnail_url) ? (
                                    <img 
                                        src={getImageUrl(course.thumbnail || (course as any).thumbnail_url)} 
                                        alt={course.title} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                        onError={(e) => {
                                            (e.currentTarget as HTMLElement).style.display = 'none';
                                            const fallback = e.currentTarget.parentElement?.querySelector('.course-fallback-img') as HTMLElement;
                                            if (fallback) fallback.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <div className={`course-fallback-img w-full h-full ${(course.thumbnail || (course as any).thumbnail_url) ? 'hidden' : 'flex'} items-center justify-center text-white bg-slate-900 dark:bg-[#0A0202]`}>
                                    <BookOpen className="w-12 h-12 text-[#A60201] opacity-70" />
                                </div>

                                {/* Free Preview / How to Buy Pill on Thumbnail */}
                                {!isEnrolled && (
                                    <button
                                        type="button"
                                        onClick={() => setShowHowToBuyModal(true)}
                                        className="absolute inset-0 bg-black/40 hover:bg-black/25 flex items-center justify-center transition-colors group/play cursor-pointer"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-[#A60201] text-white flex items-center justify-center shadow-lg shadow-[#A60201]/50 group-hover/play:scale-110 transition-transform">
                                            <PlayCircle className="w-6 h-6 fill-white text-[#A60201]" />
                                        </div>
                                    </button>
                                )}
                            </div>

                            {/* Enrolled & Class Schedule Strip */}
                            <div className="grid grid-cols-2 gap-2.5">
                                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-[#A60201]/15 text-[#A60201] flex items-center justify-center shrink-0">
                                        <Users className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block truncate">Total Students</span>
                                        <span className="text-sm font-black text-slate-900 dark:text-white block">{totalEnrolled}</span>
                                    </div>
                                </div>

                                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-[#A60201]/15 text-[#A60201] dark:text-red-300 flex items-center justify-center shrink-0">
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block truncate">Schedule</span>
                                        <span className="text-xs font-black text-[#A60201] dark:text-red-200 block truncate">
                                            {course.class_starts_at || 'Immediate'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Coupon & Live Countdown Timer */}
                            {!isEnrolled && Boolean(course.show_coupon_timer) && (Boolean(promoCoupon) || (Boolean(course.discount_deadline) && (timeLeft.days > 0 || timeLeft.hours > 0 || timeLeft.minutes > 0 || timeLeft.seconds > 0))) && (
                                <div className="border border-dashed border-[#A60201]/40 bg-red-50/50 dark:bg-[#120404] rounded-2xl p-3 sm:p-3.5 space-y-2.5">
                                    {Boolean(promoCoupon) && (
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="bg-white dark:bg-black/70 border border-slate-200 dark:border-[#A60201]/40 rounded-xl px-2.5 py-1 font-mono font-bold text-[#A60201] dark:text-red-200 text-xs truncate">
                                                {promoCoupon}
                                            </div>
                                            {Boolean(discountText) && (
                                                <span className="text-xs font-black text-[#A60201] dark:text-red-400">
                                                    {discountText}
                                                </span>
                                            )}
                                            <button
                                                type="button"
                                                onClick={handleApplyCoupon}
                                                className="bg-[#A60201] hover:bg-[#880101] text-white px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer"
                                            >
                                                {copiedCoupon ? 'Applied' : 'Apply'}
                                            </button>
                                        </div>
                                    )}

                                    {/* Countdown */}
                                    {Boolean(course.discount_deadline) && (timeLeft.days > 0 || timeLeft.hours > 0 || timeLeft.minutes > 0 || timeLeft.seconds > 0) && (
                                        <div className="grid grid-cols-4 gap-1.5 text-center pt-1">
                                            <div className="bg-white dark:bg-black/60 rounded-xl py-1.5 px-1 border border-slate-200 dark:border-white/[0.04]">
                                                <span className="text-sm font-black text-slate-900 dark:text-white block leading-tight">{timeLeft.days}</span>
                                                <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400">Days</span>
                                            </div>
                                            <div className="bg-white dark:bg-black/60 rounded-xl py-1.5 px-1 border border-slate-200 dark:border-white/[0.04]">
                                                <span className="text-sm font-black text-slate-900 dark:text-white block leading-tight">{timeLeft.hours}</span>
                                                <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400">Hours</span>
                                            </div>
                                            <div className="bg-white dark:bg-black/60 rounded-xl py-1.5 px-1 border border-slate-200 dark:border-white/[0.04]">
                                                <span className="text-sm font-black text-slate-900 dark:text-white block leading-tight">{timeLeft.minutes}</span>
                                                <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400">Mins</span>
                                            </div>
                                            <div className="bg-white dark:bg-black/60 rounded-xl py-1.5 px-1 border border-slate-200 dark:border-white/[0.04]">
                                                <span className="text-sm font-black text-[#A60201] block leading-tight">{timeLeft.seconds}</span>
                                                <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400">Secs</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Price Presentation */}
                            {isEnrolled ? (
                                <div className="text-center py-2">
                                    <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-extrabold text-sm rounded-full border border-emerald-200 dark:border-emerald-500/40">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                                        <span>Enrolled • Lifetime Access Active</span>
                                    </span>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <div className="flex items-baseline justify-between">
                                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Course Fee:</span>
                                        {hasDiscount && (
                                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30 px-2 py-0.5 rounded-md">
                                                Save {formatBDT(discountAmount)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-baseline gap-3">
                                        {course.price === 0 ? (
                                            <span className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400">Free</span>
                                        ) : (
                                            <>
                                                <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                                                    {formatBDT(effectivePrice)}
                                                </span>
                                                {hasDiscount && (
                                                    <span className="text-base sm:text-lg font-bold text-slate-400 dark:text-slate-500 line-through">
                                                        {formatBDT(course.price)}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Action CTA Buttons */}
                            <div className="space-y-2.5 pt-1">
                                {isEnrolled ? (
                                    <Link
                                        to={firstLessonId ? `/learning/${course.id}/lessons/${firstLessonId}` : (user?.role === 'teacher' ? '/teacher/courses' : '/student/my-courses')}
                                        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                                    >
                                        <PlayCircle className="w-5 h-5" />
                                        <span>Start Learning Now</span>
                                    </Link>
                                ) : course.price === 0 ? (
                                    <button
                                        onClick={handleFreeEnroll}
                                        disabled={enrollingFree}
                                        className="w-full py-3.5 rounded-2xl bg-[#A60201] hover:bg-[#880101] text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-[#A60201]/30 transition-all disabled:opacity-50 cursor-pointer"
                                    >
                                        <Sparkles className="w-5 h-5" />
                                        <span>{enrollingFree ? 'Enrolling...' : 'Start Learning for Free'}</span>
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => addToCart(course)}
                                        className={`w-full py-4 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xl ${
                                            isInCart(course.id)
                                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                                                : 'bg-[#A60201] hover:bg-[#880101] text-white shadow-lg shadow-[#A60201]/35 hover:shadow-2xl hover:shadow-[#A60201]/50 hover:-translate-y-0.5'
                                        }`}
                                    >
                                        <ShoppingCart className="w-5 h-5" />
                                        <span>{isInCart(course.id) ? 'Course in Cart (Open Cart)' : 'ENROL IN THIS COURSE'}</span>
                                    </button>
                                )}

                                {/* Secondary Guide Trigger */}
                                {!isEnrolled && (
                                    <button
                                        type="button"
                                        onClick={() => setShowHowToBuyModal(true)}
                                        className="w-full py-3 px-4 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.02] dark:hover:bg-white/[0.06] text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer"
                                    >
                                        <PlayCircle className="w-4 h-4 text-[#A60201]" />
                                        <span>How to Enroll • Video Guide</span>
                                    </button>
                                )}

                                {/* Action Buttons from backend if present */}
                                {course.action_buttons && course.action_buttons.length > 0 && (
                                    <div className="space-y-2 pt-1">
                                        {course.action_buttons.map((btn) => (
                                            <a
                                                key={btn.id}
                                                href={btn.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full py-3 px-4 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.02] dark:hover:bg-white/[0.06] text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                                            >
                                                {btn.type === 'file' ? (
                                                    <FileText className="w-4 h-4 text-[#A60201]" />
                                                ) : (
                                                    <ExternalLink className="w-4 h-4 text-[#A60201]" />
                                                )}
                                                <span>{btn.label}</span>
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Trust Guarantee Bullets */}
                            <div className="space-y-2.5 pt-4 border-t border-slate-200 dark:border-white/[0.06] text-xs text-slate-500 dark:text-slate-400">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                                    <span>Instant automated access after payment</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                                    <span>Official BMDC / Academic oriented material</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Award className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                                    <span>Verified DoctorWallah Learning Experience</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Fixed Bottom Purchase Strip */}
            {!isEnrolled && (
                <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#090303]/95 backdrop-blur-xl border-t border-slate-200 dark:border-[#A60201]/30 p-3 shadow-2xl flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">Course Fee</span>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-lg font-black text-slate-900 dark:text-white">{formatBDT(effectivePrice)}</span>
                            {hasDiscount && (
                                <span className="text-xs text-slate-400 dark:text-slate-500 line-through">{formatBDT(course.price)}</span>
                            )}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => addToCart(course)}
                        className="py-3 px-6 rounded-xl bg-[#A60201] hover:bg-[#880101] text-white font-black text-sm flex items-center gap-2 shadow-lg shadow-[#A60201]/30 shrink-0 cursor-pointer"
                    >
                        <ShoppingCart className="w-4 h-4" />
                        <span>{isInCart(course.id) ? 'View Cart' : 'ENROL NOW'}</span>
                    </button>
                </div>
            )}

            {/* How to Enroll Modal */}
            {showHowToBuyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 dark:bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#0C0505] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-[#A60201]/40 space-y-4 p-6 relative text-slate-900 dark:text-white">
                        <button
                            type="button"
                            onClick={() => setShowHowToBuyModal(false)}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-full transition cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-white/[0.06]">
                            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-[#A60201]/15 flex items-center justify-center text-[#A60201] shrink-0">
                                <PlayCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white">How to Enroll in this Course?</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Enroll easily in 4 simple steps</p>
                            </div>
                        </div>

                        {course.how_to_buy_url ? (
                            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-slate-200 dark:border-white/[0.08] shadow-inner">
                                {course.how_to_buy_url.includes('youtube.com') || course.how_to_buy_url.includes('youtu.be') ? (
                                    <iframe
                                        src={
                                            (course.how_to_buy_url.includes('embed')
                                                ? course.how_to_buy_url
                                                : course.how_to_buy_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')) +
                                            (course.how_to_buy_url.includes('?') ? '&color=red' : '?color=red')
                                        }
                                        title="How to buy course"
                                        className="w-full h-full border-0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                ) : (
                                    <video
                                        src={course.how_to_buy_url}
                                        controls
                                        className="w-full h-full object-contain"
                                    />
                                )}
                            </div>
                        ) : (
                            <div className="space-y-2.5 py-1">
                                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06]">
                                    <span className="w-6 h-6 rounded-full bg-[#A60201] text-white font-bold text-xs flex items-center justify-center shrink-0">1</span>
                                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">Click the <strong className="text-slate-900 dark:text-white">"ENROL IN THIS COURSE"</strong> button to add this course to your cart.</p>
                                </div>
                                {Boolean(course.show_coupon_timer && promoCoupon) && (
                                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06]">
                                        <span className="w-6 h-6 rounded-full bg-[#A60201] text-white font-bold text-xs flex items-center justify-center shrink-0">2</span>
                                        <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">Coupon code <strong className="text-[#A60201] dark:text-red-300 font-mono">{promoCoupon}</strong> will apply your discount.</p>
                                    </div>
                                )}
                                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06]">
                                    <span className="w-6 h-6 rounded-full bg-[#A60201] text-white font-bold text-xs flex items-center justify-center shrink-0">3</span>
                                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">Complete payment through bKash, Nagad, Rocket, or card online gateway.</p>
                                </div>
                                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06]">
                                    <span className="w-6 h-6 rounded-full bg-[#A60201] text-white font-bold text-xs flex items-center justify-center shrink-0">4</span>
                                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">Access will be granted immediately in your student dashboard upon confirmation.</p>
                                </div>
                            </div>
                        )}

                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowHowToBuyModal(false);
                                    addToCart(course);
                                }}
                                className="w-full py-3.5 rounded-2xl bg-[#A60201] hover:bg-[#880101] text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#A60201]/30 transition cursor-pointer"
                            >
                                <ShoppingCart className="w-4 h-4" />
                                <span>{isInCart(course.id) ? 'Course in Cart (Open Cart)' : 'ENROL NOW'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
