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
    Award
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { PagePreloader } from '../../components/shared/PagePreloader';

const DEFAULT_FEATURES = [
    'Full HD Clinical Video Lectures & Live Discussions',
    'Downloadable BMDC / Professional Exam Notes & Formulas',
    'Direct Q&A Doubt-Solving Support with Medical Mentors',
    'High-Yield Medical Question Bank & Model Tests',
    'Lifetime Course Access from any Smartphone or PC',
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
    const discountText = course.coupon_discount_text || (discountAmount > 0 ? `Tk ${discountAmount} OFF` : '');

    const handleApplyCoupon = () => {
        if (promoCoupon && navigator.clipboard) {
            navigator.clipboard.writeText(promoCoupon);
        }
        setCopiedCoupon(true);
        setTimeout(() => setCopiedCoupon(false), 2500);
        addToCart(course);
    };

    return (
        <div className="bg-[#060202] text-white min-h-screen pb-20 selection:bg-[#A60201] selection:text-white relative overflow-hidden">
            {/* Ambient Background Radial Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[550px] bg-[#A60201]/10 rounded-full blur-[160px] pointer-events-none" />
            <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-[#A60201]/5 rounded-full blur-[140px] pointer-events-none" />

            {/* Header Hero */}
            <div className="relative bg-[#090303] text-white pt-8 pb-14 sm:pt-10 sm:pb-20 lg:pt-12 lg:pb-28 border-b border-[#A60201]/20 overflow-hidden">
                {/* Background Grid Pattern & Red Ambient Accent */}
                <div className="absolute inset-0 bg-[radial-gradient(#A60201_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
                <div className="absolute -top-32 right-1/4 w-96 h-96 bg-[#A60201]/15 rounded-full blur-[120px] pointer-events-none" />

                {/* Subtle ECG Line Header Decor */}
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#A60201]/50 to-transparent" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
                        <div className="lg:col-span-8 space-y-4">
                            {/* Eyebrow Badge */}
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#A60201]/15 text-red-300 text-xs font-black tracking-wider border border-[#A60201]/40 shadow-[0_0_15px_rgba(166,2,1,0.25)]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#A60201] animate-ping" />
                                <Sparkles className="w-3.5 h-3.5 text-[#A60201]" />
                                <span>MBBS CLINICAL BATCH • DOCTORWALLAH</span>
                            </div>

                            {/* Course Title */}
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight text-white drop-shadow-sm">
                                {course.title}
                            </h1>

                            {/* Short Description */}
                            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl">
                                {course.short_description || 'BMDC ও প্রফেশনাল পরীক্ষার সিলেবাস অনুযায়ী সাজানো বিশেষায়িত ক্লিনিক্যাল ও অ্যাকাডেমিক মেডিকেল কোর্স।'}
                            </p>

                            {/* Meta Badges */}
                            <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2 text-xs sm:text-sm">
                                <span className="flex items-center gap-2 bg-[#120505] px-3.5 py-2 rounded-xl border border-[#A60201]/25 text-slate-300 shadow-2xs">
                                    <BookOpen className="w-4 h-4 text-[#A60201]" />
                                    <span><strong className="text-white font-bold">{course.lessons_count || 0}</strong> Classes</span>
                                </span>

                                <span className="flex items-center gap-2 bg-[#120505] px-3.5 py-2 rounded-xl border border-[#A60201]/25 text-slate-300 shadow-2xs">
                                    <Users className="w-4 h-4 text-[#A60201]" />
                                    <span><strong className="text-white font-bold">{totalEnrolled}</strong> Medical Students</span>
                                </span>

                                {allInstructors.length > 0 && (
                                    <div className="flex items-center gap-2.5 bg-[#120505] px-3.5 py-2 rounded-xl border border-[#A60201]/25 text-slate-300 shadow-2xs">
                                        <div className="flex -space-x-2 overflow-hidden">
                                            {allInstructors.slice(0, 3).map((inst: any) => {
                                                const p = inst.photo_url || inst.teacher_profile?.photo_url || inst.teacherProfile?.photo_url;
                                                return p ? (
                                                    <img
                                                        key={inst.id}
                                                        src={getImageUrl(p)}
                                                        alt={inst.name}
                                                        className="inline-block h-6 w-6 rounded-full ring-2 ring-[#0A0303] object-cover object-top"
                                                    />
                                                ) : (
                                                    <div
                                                        key={inst.id}
                                                        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#A60201] text-[10px] font-bold text-white ring-2 ring-[#0A0303]"
                                                    >
                                                        {inst.name.charAt(0).toUpperCase()}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <span className="text-xs text-slate-300">
                                            Mentor: <strong className="text-white font-bold">{allInstructors.map((i: any) => i.name).join(', ')}</strong>
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Spacer column on desktop so hero right side accommodates the floating thumbnail card */}
                        <div className="hidden lg:block lg:col-span-4" />
                    </div>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
                    {/* Left: Description & Curriculum */}
                    <div className="order-2 lg:order-1 lg:col-span-8 space-y-8 pt-8 sm:pt-10">
                        {/* Course Overview Card */}
                        <div className="bg-[#0B0404]/95 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-[#A60201]/25 shadow-xl shadow-black/40 space-y-4">
                            <div className="flex items-center gap-2.5 pb-3 border-b border-[#A60201]/15">
                                <FileText className="w-5 h-5 text-[#A60201]" />
                                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">Course Overview & Clinical Guidelines</h2>
                            </div>
                            {course.description ? (
                                <MathView
                                    content={course.description}
                                    className="text-sm text-slate-300 leading-relaxed font-sans max-w-none"
                                />
                            ) : (
                                <p className="text-sm text-slate-500 italic">Course details and syllabus will be published soon.</p>
                            )}
                        </div>

                        {/* Curriculum Preview Card */}
                        <div className="bg-[#0B0404]/95 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-[#A60201]/25 shadow-xl shadow-black/40 space-y-6">
                            <div className="flex items-center justify-between border-b border-[#A60201]/15 pb-4">
                                <div>
                                    <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 text-[#A60201]" />
                                        <span>Course Curriculum & Syllabus</span>
                                    </h2>
                                    <p className="text-xs text-slate-400 mt-1">
                                        Total <strong className="text-white">{course.sections?.length || 0}</strong> Clinical Modules • <strong className="text-white">{course.lessons_count || 0}</strong> High-Yield Classes
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {course.sections && course.sections.length > 0 ? (
                                    course.sections.map((section, sIndex) => {
                                        const isOpen = openSections[section.id];
                                        return (
                                            <div
                                                key={section.id}
                                                className="border border-[#A60201]/25 rounded-2xl overflow-hidden bg-[#0F0505]"
                                            >
                                                <button
                                                    onClick={() => toggleSection(section.id)}
                                                    className="w-full px-5 py-4 bg-[#140606] hover:bg-[#1A0808] flex items-center justify-between text-left transition-colors cursor-pointer"
                                                >
                                                    <div>
                                                        <span className="text-[11px] font-black text-[#A60201] uppercase tracking-wider block">
                                                            Module 0{sIndex + 1}
                                                        </span>
                                                        <h4 className="text-sm sm:text-base font-bold text-white mt-0.5">
                                                            {section.title}
                                                        </h4>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-slate-400">
                                                        <span className="bg-[#080202] px-2.5 py-1 rounded-lg border border-[#A60201]/20 font-bold text-slate-300">
                                                            {section.lessons?.length || 0} Classes
                                                        </span>
                                                        {isOpen ? <ChevronUp className="w-4 h-4 text-[#A60201]" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                                                    </div>
                                                </button>

                                                {isOpen && (
                                                    <div className="divide-y divide-[#A60201]/15 bg-[#090303]">
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
                                                                        className="px-5 py-3.5 flex items-center justify-between hover:bg-[#170707] transition-colors text-sm group cursor-pointer"
                                                                    >
                                                                        <div className="flex items-center gap-3 min-w-0">
                                                                            {isPurchased ? (
                                                                                <Unlock className="w-4 h-4 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                                                                            ) : (
                                                                                <PlayCircle className="w-4 h-4 text-[#A60201] shrink-0 group-hover:scale-110 transition-transform" />
                                                                            )}
                                                                            <span className="text-slate-200 font-medium group-hover:text-red-300 transition-colors truncate">
                                                                                Class {lIndex + 1}: {lesson.title}
                                                                            </span>
                                                                        </div>

                                                                        <div className="flex items-center gap-3 shrink-0">
                                                                            {lesson.is_preview && !isPurchased ? (
                                                                                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                                                                                    <PlayCircle className="w-3 h-3 text-emerald-400" /> Free Preview
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-xs font-bold text-[#A60201] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                                                                    <span>Watch</span>
                                                                                    <ArrowRight className="w-3.5 h-3.5" />
                                                                                </span>
                                                                            )}
                                                                            <span className="text-xs text-slate-500 font-mono">
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
                                                                        const enrollCard = document.getElementById('enroll-section-card') || document.querySelector('.enroll-action-btn');
                                                                        if (enrollCard) {
                                                                            enrollCard.scrollIntoView({ behavior: 'smooth' });
                                                                        }
                                                                    }}
                                                                    className="px-5 py-3.5 flex items-center justify-between bg-[#080202]/50 hover:bg-[#100505] text-sm cursor-not-allowed opacity-75 transition-colors"
                                                                    title="Enroll in this course to unlock this class"
                                                                >
                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                        <Lock className="w-4 h-4 text-slate-600 shrink-0" />
                                                                        <span className="text-slate-500 font-medium truncate">
                                                                            Class {lIndex + 1}: {lesson.title}
                                                                        </span>
                                                                    </div>

                                                                    <div className="flex items-center gap-3 shrink-0">
                                                                        <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                                                                            <Lock className="w-3 h-3" />
                                                                            Locked
                                                                        </span>
                                                                        <span className="text-xs text-slate-600 font-mono">
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
                                    <p className="text-sm text-slate-500 text-center py-6">
                                        Curriculum for this course will be published soon.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Instructors Card */}
                        <div className="bg-[#0B0404]/95 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-[#A60201]/25 shadow-xl shadow-black/40 space-y-5">
                            <div className="flex items-center gap-2.5 pb-3 border-b border-[#A60201]/15">
                                <div className="w-8 h-8 rounded-xl bg-[#A60201]/15 text-[#A60201] flex items-center justify-center font-bold">
                                    <GraduationCap className="w-5 h-5" />
                                </div>
                                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">Course Instructors & Clinical Mentors</h2>
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
                                                className="p-4 sm:p-5 rounded-2xl border border-[#A60201]/25 bg-[#100505] hover:bg-[#160707] hover:border-[#A60201]/70 hover:shadow-[0_0_25px_rgba(166,2,1,0.2)] transition-all flex items-center gap-4 group"
                                            >
                                                {/* Teacher Photo / Avatar with rounded frame and fallback */}
                                                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 bg-gradient-to-tr from-[#A60201] to-[#880101] p-0.5 shadow-md shadow-[#A60201]/25 group-hover:scale-105 transition-transform">
                                                    {photoSrc ? (
                                                        <img
                                                            src={photoSrc}
                                                            alt={teacher.name}
                                                            className="w-full h-full object-cover object-top rounded-[14px] bg-slate-900"
                                                            onError={(e) => {
                                                                (e.currentTarget as HTMLElement).style.display = 'none';
                                                                const fallback = e.currentTarget.parentElement?.querySelector('.teacher-fallback-avatar') as HTMLElement;
                                                                if (fallback) fallback.style.display = 'flex';
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div className={`teacher-fallback-avatar w-full h-full ${photoSrc ? 'hidden' : 'flex'} items-center justify-center rounded-[14px] bg-gradient-to-tr from-[#A60201] to-black text-white font-black text-2xl`}>
                                                        {teacher.name ? teacher.name.charAt(0).toUpperCase() : 'T'}
                                                    </div>
                                                </div>

                                                {/* Teacher Details */}
                                                <div className="min-w-0 flex-1">
                                                    <Link 
                                                        to={`/instructors/${teacher.id}`}
                                                        className="font-black text-white text-base sm:text-lg hover:text-red-400 transition-colors line-clamp-1 block cursor-pointer"
                                                    >
                                                        {teacher.name}
                                                    </Link>
                                                    <p className="text-xs text-red-300 font-bold mt-0.5 line-clamp-1">
                                                        {designation}
                                                    </p>
                                                    {institution && (
                                                        <p className="text-[11px] text-slate-400 font-medium mt-0.5 line-clamp-1">
                                                            {institution}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="p-4 sm:p-5 rounded-2xl border border-[#A60201]/25 bg-[#100505] flex items-center gap-4">
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#A60201] to-red-600 p-0.5 shadow-md shrink-0 flex items-center justify-center">
                                            <div className="w-full h-full rounded-[14px] bg-black text-white flex items-center justify-center font-black text-2xl">
                                                D
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white text-base">DoctorWallah Clinical Faculty</h4>
                                            <p className="text-xs text-slate-400 font-medium mt-0.5">Experienced Medical Doctors & Academic Specialists</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Sticky Enrollment Card */}
                    <div className="order-1 lg:order-2 lg:col-span-4 -mt-8 sm:-mt-10 lg:-mt-48 xl:-mt-52 relative z-20">
                        <div id="enroll-section-card" className="sticky top-24 bg-[#0B0404]/95 backdrop-blur-xl rounded-3xl border border-[#A60201]/35 shadow-2xl shadow-black/80 overflow-hidden space-y-6 p-5 sm:p-6 ring-1 ring-[#A60201]/20">
                            {/* Glowing laser hairline */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#A60201] to-transparent shadow-[0_0_15px_#A60201]" />

                            {/* Course Image */}
                            <div className="aspect-video bg-black rounded-2xl overflow-hidden -mx-2 -mt-2 border border-[#A60201]/25 relative group">
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
                                <div className={`course-fallback-img w-full h-full ${(course.thumbnail || (course as any).thumbnail_url) ? 'hidden' : 'flex'} items-center justify-center text-white bg-[#0A0303]`}>
                                    <BookOpen className="w-12 h-12 text-[#A60201] opacity-70" />
                                </div>
                            </div>

                            {/* Admission Count & Class Start Badges */}
                            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                                {/* Admission Count Badge */}
                                <div className="bg-[#120505] border border-[#A60201]/30 rounded-2xl p-3 sm:p-3.5 flex items-center gap-3 shadow-inner">
                                    <div className="w-10 h-10 rounded-xl bg-[#A60201]/15 flex items-center justify-center shrink-0 text-[#A60201]">
                                        <svg viewBox="0 0 48 48" className="w-8 h-8" fill="currentColor">
                                            {/* Graduation cap */}
                                            <path d="M24 6L6 15l18 9 14-7V30h3V16.5L42 15 24 6z" />
                                            {/* Center student bust */}
                                            <circle cx="24" cy="27" r="3.5" />
                                            <path d="M19 36c0-2.8 2.2-5 5-5s5 2.2 5 5v1H19v-1z" />
                                            {/* Left student bust */}
                                            <circle cx="15" cy="29" r="2.8" />
                                            <path d="M11 37c0-2.2 1.8-4 4-4 1.2 0 2.3.5 3 1.4-.4.8-.6 1.8-.6 2.6H11v0z" />
                                            {/* Right student bust */}
                                            <circle cx="33" cy="29" r="2.8" />
                                            <path d="M37 37c0-2.2-1.8-4-4-4-1.2 0-2.3.5-3 1.4.4.8.6 1.8.6 2.6H37v0z" />
                                        </svg>
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-[11px] sm:text-xs font-bold text-slate-400 block truncate">
                                            Enrolled Students
                                        </span>
                                        <span className="text-xl sm:text-2xl font-black text-white leading-tight block">
                                            {totalEnrolled}
                                        </span>
                                    </div>
                                </div>

                                {/* Class Start Badge */}
                                <div className="bg-[#120505] border border-[#A60201]/30 rounded-2xl p-3 sm:p-3.5 flex items-center gap-3 shadow-inner">
                                    <div className="w-10 h-10 rounded-xl bg-[#A60201]/15 flex items-center justify-center shrink-0 text-red-400">
                                        <svg viewBox="0 0 48 48" className="w-8 h-8" fill="currentColor">
                                            {/* Calendar body */}
                                            <rect x="7" y="11" width="34" height="28" rx="5" fill="none" stroke="currentColor" strokeWidth="3" />
                                            <path d="M7 19h34" stroke="currentColor" strokeWidth="3" />
                                            {/* Rings */}
                                            <circle cx="15" cy="8" r="2" />
                                            <circle cx="24" cy="8" r="2" />
                                            <circle cx="33" cy="8" r="2" />
                                            {/* Dots */}
                                            <circle cx="14" cy="24" r="1.5" />
                                            <circle cx="20" cy="24" r="1.5" />
                                            <circle cx="14" cy="29" r="1.5" />
                                            <circle cx="20" cy="29" r="1.5" />
                                            {/* Clock badge */}
                                            <circle cx="32" cy="31" r="7" fill="currentColor" />
                                            <circle cx="32" cy="31" r="5" fill="#3A0808" />
                                            <path d="M32 28v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                        </svg>
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-[11px] sm:text-xs font-bold text-slate-400 block truncate">
                                            Classes Start
                                        </span>
                                        <span className="text-xs sm:text-sm font-black text-red-200 truncate block leading-tight">
                                            {course.class_starts_at || 'Immediate Access'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Coupon & Live Countdown Timer (Enabled via Admin) */}
                            {!isEnrolled && Boolean(course.show_coupon_timer) && (Boolean(promoCoupon) || (Boolean(course.discount_deadline) && (timeLeft.days > 0 || timeLeft.hours > 0 || timeLeft.minutes > 0 || timeLeft.seconds > 0))) && (
                                <div className="border-[1.5px] border-dashed border-[#A60201]/50 bg-[#140606] rounded-2xl p-3 sm:p-4 space-y-3">
                                    {/* Top Row: Coupon code, discount label, and Apply button */}
                                    {Boolean(promoCoupon) && (
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="bg-black border border-[#A60201]/60 rounded-xl px-3 sm:px-4 py-1.5 font-mono font-black text-red-300 text-xs sm:text-sm tracking-wide shadow-2xs truncate">
                                                {promoCoupon}
                                            </div>
                                            {Boolean(discountText) && (
                                                <span className="text-xs sm:text-sm font-black text-red-400 whitespace-nowrap">
                                                    {discountText}
                                                </span>
                                            )}
                                            <button
                                                type="button"
                                                onClick={handleApplyCoupon}
                                                className="bg-[#A60201] hover:bg-[#880101] text-white px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black shadow-md shadow-[#A60201]/30 transition cursor-pointer whitespace-nowrap"
                                            >
                                                {copiedCoupon ? 'Applied!' : 'Apply'}
                                            </button>
                                        </div>
                                    )}

                                    {/* Bottom Row: 4 Countdown Pills */}
                                    {Boolean(course.discount_deadline) && (timeLeft.days > 0 || timeLeft.hours > 0 || timeLeft.minutes > 0 || timeLeft.seconds > 0) && (
                                        <div className="grid grid-cols-4 gap-2 text-center">
                                            <div className="bg-black/80 rounded-xl py-2 px-1 border border-[#A60201]/30 flex flex-col items-center justify-center">
                                                <span className="text-base sm:text-lg font-black text-[#A60201] leading-tight">{timeLeft.days}</span>
                                                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400">Days</span>
                                            </div>
                                            <div className="bg-black/80 rounded-xl py-2 px-1 border border-[#A60201]/30 flex flex-col items-center justify-center">
                                                <span className="text-base sm:text-lg font-black text-[#A60201] leading-tight">{timeLeft.hours}</span>
                                                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400">Hours</span>
                                            </div>
                                            <div className="bg-black/80 rounded-xl py-2 px-1 border border-[#A60201]/30 flex flex-col items-center justify-center">
                                                <span className="text-base sm:text-lg font-black text-[#A60201] leading-tight">{timeLeft.minutes}</span>
                                                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400">Mins</span>
                                            </div>
                                            <div className="bg-black/80 rounded-xl py-2 px-1 border border-[#A60201]/30 flex flex-col items-center justify-center">
                                                <span className="text-base sm:text-lg font-black text-[#A60201] leading-tight">{timeLeft.seconds}</span>
                                                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400">Secs</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Centered Price Section or Enrolled Badge */}
                            {isEnrolled ? (
                                <div className="text-center py-2">
                                    <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-950/80 text-emerald-300 font-extrabold text-sm rounded-full border border-emerald-500/40 shadow-md">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                        <span>Enrolled (You own this course)</span>
                                    </span>
                                </div>
                            ) : (
                                <div className="text-center py-1 flex items-baseline justify-center gap-3">
                                    {course.price === 0 ? (
                                        <span className="text-3xl sm:text-4xl font-black text-emerald-400">Free</span>
                                    ) : (
                                        <>
                                            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                                                {formatBDT(effectivePrice)}
                                            </span>
                                            {hasDiscount && (
                                                <span className="text-xl sm:text-2xl font-bold text-slate-500 line-through">
                                                    {formatBDT(course.price)}
                                                </span>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Action CTA Buttons */}
                            <div className="space-y-3">
                                {isEnrolled ? (
                                    <Link
                                        to={firstLessonId ? `/learning/${course.id}/lessons/${firstLessonId}` : (user?.role === 'teacher' ? '/teacher/courses' : '/student/my-courses')}
                                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-base sm:text-lg flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                                    >
                                        <PlayCircle className="w-5 h-5" />
                                        <span>Start Learning</span>
                                    </Link>
                                ) : course.price === 0 ? (
                                    <button
                                        onClick={handleFreeEnroll}
                                        disabled={enrollingFree}
                                        className="w-full py-4 rounded-2xl bg-[#A60201] hover:bg-[#880101] text-white font-black text-base sm:text-lg flex items-center justify-center gap-2 shadow-lg shadow-[#A60201]/30 transition-all disabled:opacity-50 cursor-pointer"
                                    >
                                        <Sparkles className="w-5 h-5" />
                                        <span>{enrollingFree ? 'Enrolling...' : 'Start Learning for Free'}</span>
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => addToCart(course)}
                                        className={`w-full py-4 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xl ${
                                            isInCart(course.id)
                                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                                                : 'bg-[#A60201] hover:bg-[#880101] text-white shadow-lg shadow-[#A60201]/35 hover:shadow-2xl hover:shadow-[#A60201]/50 hover:-translate-y-0.5'
                                        }`}
                                    >
                                        <ShoppingCart className="w-5 h-5" />
                                        <span>{isInCart(course.id) ? 'Course in Cart (Open Cart)' : 'ENROL IN THIS COURSE'}</span>
                                    </button>
                                )}

                                {/* Secondary: 'How to Enroll' button */}
                                {!isEnrolled && (
                                    <button
                                        type="button"
                                        onClick={() => setShowHowToBuyModal(true)}
                                        className="w-full py-3 px-4 rounded-2xl border border-[#A60201]/30 bg-[#120505] hover:bg-[#1A0808] text-slate-300 hover:text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-2xs transition group cursor-pointer"
                                    >
                                        <PlayCircle className="w-4 h-4 text-[#A60201] group-hover:scale-110 transition" />
                                        <span>How to Enroll • Video Guide</span>
                                    </button>
                                )}

                                {/* Custom Action Buttons (Outline, etc.) */}
                                {course.action_buttons && course.action_buttons.length > 0 && (
                                    <div className="space-y-2.5 pt-1">
                                        {course.action_buttons.map((btn) => (
                                            <a
                                                key={btn.id}
                                                href={btn.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full py-3.5 px-4 rounded-2xl border border-[#A60201]/30 bg-[#120505] hover:bg-[#1A0808] text-slate-200 hover:text-white font-bold text-sm flex items-center justify-center gap-2 shadow-2xs transition group"
                                            >
                                                {btn.type === 'file' ? (
                                                    <FileText className="w-4 h-4 text-[#A60201] group-hover:scale-110 transition" />
                                                ) : (
                                                    <ExternalLink className="w-4 h-4 text-[#A60201] group-hover:scale-110 transition" />
                                                )}
                                                <span>{btn.label}</span>
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Course Features Checklist */}
                            <div className="space-y-3 pt-4 border-t border-[#A60201]/20 text-xs text-slate-300 font-medium">
                                <h4 className="text-xs font-black text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <ShieldCheck className="w-4 h-4 text-[#A60201]" />
                                    <span>Course Privileges & Features:</span>
                                </h4>
                                {courseFeatures.map((feat, idx) => (
                                    <div key={idx} className="flex items-start gap-2.5">
                                        <CheckCircle2 className="w-4 h-4 text-[#A60201] shrink-0 mt-0.5" />
                                        <span className="leading-tight text-slate-300">{feat}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* How to Buy Modal */}
            {showHowToBuyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-[#0B0404] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#A60201]/40 space-y-4 p-6 relative text-white">
                        <button
                            type="button"
                            onClick={() => setShowHowToBuyModal(false)}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-[#180707] rounded-full transition cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-2.5 pb-2 border-b border-[#A60201]/20">
                            <div className="w-10 h-10 rounded-xl bg-[#A60201]/20 flex items-center justify-center text-[#A60201] shrink-0 shadow-inner">
                                <PlayCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-white">How to Enroll in this Course?</h3>
                                <p className="text-xs text-slate-400">Enroll easily in 4 simple steps</p>
                            </div>
                        </div>

                        {course.how_to_buy_url ? (
                            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-[#A60201]/30 shadow-inner">
                                {course.how_to_buy_url.includes('youtube.com') || course.how_to_buy_url.includes('youtu.be') ? (
                                    <iframe
                                        src={
                                            course.how_to_buy_url.includes('embed')
                                                ? course.how_to_buy_url
                                                : course.how_to_buy_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')
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
                                <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#130606] border border-[#A60201]/25">
                                    <span className="w-6 h-6 rounded-full bg-[#A60201] text-white font-bold text-xs flex items-center justify-center shrink-0">1</span>
                                    <p className="text-xs text-slate-300 font-medium">Click the <strong className="text-white">"ENROL IN THIS COURSE"</strong> button in the sidebar to add this course to your cart, then proceed to checkout.</p>
                                </div>
                                {Boolean(course.show_coupon_timer && promoCoupon) && (
                                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#130606] border border-[#A60201]/25">
                                        <span className="w-6 h-6 rounded-full bg-[#A60201] text-white font-bold text-xs flex items-center justify-center shrink-0">2</span>
                                        <p className="text-xs text-slate-300 font-medium">Coupon code <strong className="text-red-300 font-mono">{promoCoupon}</strong> will automatically apply your discount.</p>
                                    </div>
                                )}
                                <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#130606] border border-[#A60201]/25">
                                    <span className="w-6 h-6 rounded-full bg-[#A60201] text-white font-bold text-xs flex items-center justify-center shrink-0">3</span>
                                    <p className="text-xs text-slate-300 font-medium">Complete payment securely via bKash, Nagad, Rocket, or online card payment.</p>
                                </div>
                                <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#130606] border border-[#A60201]/25">
                                    <span className="w-6 h-6 rounded-full bg-[#A60201] text-white font-bold text-xs flex items-center justify-center shrink-0">4</span>
                                    <p className="text-xs text-slate-300 font-medium">Once payment is verified, the course will be unlocked immediately in your student dashboard.</p>
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
