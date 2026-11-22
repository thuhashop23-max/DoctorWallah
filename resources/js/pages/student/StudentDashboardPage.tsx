import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
    User as UserIcon,
    Copy,
    Check,
    BarChart3,
    BookOpen,
    Clock,
    Play,
    Loader2,
    Calendar,
    ArrowRight,
    MapPin,
    Mail,
    Phone,
    Hash,
    Sparkles,
    Gem,
    Stethoscope,
    GraduationCap,
    ShieldCheck,
    CheckCircle2,
    Activity,
    Award
} from 'lucide-react';

interface RecentActivityItem {
    id: string;
    text: string;
    time: string;
}

export const StudentDashboardPage: React.FC = () => {
    const { user } = useAuth();
    const [coursesData, setCoursesData] = useState<any[]>([]);
    const [availableExams, setAvailableExams] = useState<any[]>([]);
    const [ordersCount, setOrdersCount] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [coursesRes, examsRes, ordersRes] = await Promise.allSettled([
                apiClient.get('/student/my-courses'),
                apiClient.get('/student/exams/available'),
                apiClient.get('/orders/my-orders'),
            ]);

            if (coursesRes.status === 'fulfilled') {
                setCoursesData(coursesRes.value.data || []);
            }
            if (examsRes.status === 'fulfilled') {
                setAvailableExams(examsRes.value.data?.exams || []);
            }
            if (ordersRes.status === 'fulfilled') {
                const d = ordersRes.value.data;
                const total = d?.total ?? (Array.isArray(d) ? d.length : d?.data?.length ?? 0);
                setOrdersCount(total);
            }
        } catch {
            // silent fail
        } finally {
            setLoading(false);
        }
    };

    const copyUserId = () => {
        const idToCopy = user?.registration_number || (user?.id ? `bidth-${user.id}` : 'bidth-100004372');
        navigator.clipboard.writeText(idToCopy);
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
    };

    // Calculate dynamic counts
    const totalCourses = coursesData.length;
    const completedCourses = coursesData.filter((c: any) => c.progress_percentage === 100).length;
    const activeCourses = Math.max(0, totalCourses - completedCourses);
    const wishlistOrExamsCount = availableExams.length;

    // Relative time helper
    const getRelativeTime = (dateInput?: string) => {
        if (!dateInput) return 'Recently';
        const d = new Date(dateInput);
        const diffMs = Date.now() - d.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays <= 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
        return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
    };

    // Build realistic Recent Activities
    const recentActivities: RecentActivityItem[] = [];
    if (coursesData && coursesData.length > 0) {
        const first = coursesData[0];
        if (first.last_lesson?.title) {
            recentActivities.push({
                id: 'act-lesson',
                text: `Watched lesson in ${first.course?.title || 'Course'}`,
                time: getRelativeTime(first.enrolled_at),
            });
        }
        recentActivities.push({
            id: 'act-enroll-1',
            text: `Enrolled in ${first.course?.title || 'Course'}`,
            time: getRelativeTime(first.enrolled_at),
        });
        if (coursesData.length > 1) {
            const second = coursesData[1];
            recentActivities.push({
                id: 'act-enroll-2',
                text: `Active batch: ${second.course?.title || 'Master Course'}`,
                time: getRelativeTime(second.enrolled_at),
            });
        }
    }

    if (recentActivities.length === 0) {
        recentActivities.push(
            {
                id: 'act-welcome',
                text: 'Welcome to DoctorWallah Student Portal',
                time: 'Recently',
            },
            {
                id: 'act-profile',
                text: 'Medical cadet profile verified & initialized',
                time: getRelativeTime(user?.created_at),
            }
        );
    }

    if (loading) {
        return (
            <div className="py-24 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-[#A60201] animate-spin" />
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Loading student clinical records...</span>
            </div>
        );
    }

    const userIdDisplay = user?.registration_number || (user?.id ? `bidth-${user.id}` : 'bidth-100004372');
    const firstActiveCourse = coursesData.find((c: any) => (c.progress_percentage || 0) < 100) || coursesData[0];

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* 1. Command Center Hero Card */}
            <div className="relative overflow-hidden rounded-3xl p-6 sm:p-7 bg-white dark:bg-[#0A0404] border border-slate-200/90 dark:border-white/[0.08] shadow-sm dark:shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-colors">
                {/* Subtle Brand Ambient Glow in Dark Mode */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/5 dark:bg-[#A60201]/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Left: Cadet Info & Greetings */}
                    <div className="space-y-2.5 max-w-xl">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 dark:bg-[#A60201]/20 border border-red-200 dark:border-[#A60201]/40 text-[#A60201] dark:text-red-300 text-xs font-bold uppercase tracking-wider">
                                <Stethoscope className="w-3.5 h-3.5 text-[#A60201]" />
                                <span>MBBS Cadet Portal</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs font-medium font-mono">
                                <Hash className="w-3 h-3 text-slate-400" />
                                <span>{userIdDisplay}</span>
                                <button
                                    type="button"
                                    onClick={copyUserId}
                                    className="hover:text-[#A60201] transition-colors cursor-pointer"
                                    title="Copy ID"
                                >
                                    {copiedId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                </button>
                            </span>
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                            Welcome back, <span className="text-[#A60201]">{user?.name || 'Doctor'}</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                            Track your academic milestones, prepare for 1st Prof cards, review high-yield lecture records, and attend scheduled live clinical sessions.
                        </p>
                    </div>

                    {/* Right: Quick Stats & Points Capsule */}
                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                        {/* Points Capsule */}
                        <div className="p-3 sm:p-3.5 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25 rounded-2xl flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                                <Gem className="w-4 h-4" />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                                    Reward Points
                                </span>
                                <span className="text-lg font-black text-slate-900 dark:text-white leading-tight block">
                                    {user?.points ?? 0}
                                </span>
                            </div>
                            <Link
                                to="/earn-points"
                                className="ml-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition shadow-2xs"
                            >
                                Redeem
                            </Link>
                        </div>

                        {/* View Courses Button */}
                        <Link
                            to="/student/my-courses"
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#A60201] hover:bg-[#880101] text-white text-xs font-bold shadow-md shadow-[#A60201]/25 hover:shadow-lg transition-all"
                        >
                            <BookOpen className="w-4 h-4" />
                            <span>My Classes</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* 2. 4 Clinical Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Metric 1: Active Courses */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0A0404] border border-slate-200/80 dark:border-white/[0.08] shadow-2xs space-y-2 transition-colors">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Enrolled Curriculums</span>
                        <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-[#A60201]/20 text-[#A60201] dark:text-red-300 flex items-center justify-center">
                            <BookOpen className="w-4 h-4" />
                        </div>
                    </div>
                    <div>
                        <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white block">
                            {activeCourses}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                            Active study pathways
                        </span>
                    </div>
                </div>

                {/* Metric 2: Completed Curriculums */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0A0404] border border-slate-200/80 dark:border-white/[0.08] shadow-2xs space-y-2 transition-colors">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Completed Courses</span>
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                    </div>
                    <div>
                        <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white block">
                            {completedCourses}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                            Cards & terms cleared
                        </span>
                    </div>
                </div>

                {/* Metric 3: Exams & Model Tests */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0A0404] border border-slate-200/80 dark:border-white/[0.08] shadow-2xs space-y-2 transition-colors">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Practice Exams</span>
                        <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                            <Award className="w-4 h-4" />
                        </div>
                    </div>
                    <div>
                        <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white block">
                            {wishlistOrExamsCount}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                            Available assessments
                        </span>
                    </div>
                </div>

                {/* Metric 4: Verified Orders */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0A0404] border border-slate-200/80 dark:border-white/[0.08] shadow-2xs space-y-2 transition-colors">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Purchase Orders</span>
                        <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                            <BarChart3 className="w-4 h-4" />
                        </div>
                    </div>
                    <div>
                        <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white block">
                            {ordersCount}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                            Processed enrollments
                        </span>
                    </div>
                </div>
            </div>

            {/* 3. In-Progress Course Spotlight (If available) */}
            {firstActiveCourse && (
                <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-red-50/50 via-white to-white dark:from-[#140505] dark:via-[#0A0404] dark:to-[#0A0404] border border-red-200/80 dark:border-[#A60201]/30 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5 transition-colors">
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-900 overflow-hidden shrink-0 shadow-md relative group">
                            {firstActiveCourse.course?.thumbnail ? (
                                <img
                                    src={firstActiveCourse.course.thumbnail}
                                    alt={firstActiveCourse.course?.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-[#A60201] text-white flex items-center justify-center">
                                    <BookOpen className="w-6 h-6" />
                                </div>
                            )}
                        </div>

                        <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#A60201] dark:text-red-400">
                                    <Activity className="w-3 h-3 text-[#A60201]" />
                                    <span>Resume Active Curriculum</span>
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                    • {firstActiveCourse.progress_percentage || 0}% Cleared
                                </span>
                            </div>
                            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                                {firstActiveCourse.course?.title || 'MBBS Prep Course'}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                {firstActiveCourse.last_lesson?.title ? `Next up: ${firstActiveCourse.last_lesson.title}` : 'Continue where you left off in your video lectures'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end md:self-auto w-full md:w-auto">
                        <Link
                            to={firstActiveCourse.last_lesson_id ? `/learning/${firstActiveCourse.course?.id}/lessons/${firstActiveCourse.last_lesson_id}` : `/courses/${firstActiveCourse.course?.slug || firstActiveCourse.course?.id}`}
                            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#A60201] hover:bg-[#880101] text-white text-xs font-black shadow-md shadow-[#A60201]/25 hover:shadow-lg transition-all"
                        >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Continue Lecture</span>
                        </Link>
                    </div>
                </div>
            )}

            {/* 4. Two-Column Main Content Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Recent Enrolled Courses (8 cols on lg) */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white dark:bg-[#0A0404] rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-white/[0.08] shadow-xs space-y-4 transition-colors">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.08]">
                            <div>
                                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                                    My Enrolled Courses
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Your registered clinical batches and class schedules
                                </p>
                            </div>
                            <Link
                                to="/student/my-courses"
                                className="text-xs font-extrabold text-[#A60201] dark:text-red-400 hover:underline inline-flex items-center gap-1"
                            >
                                <span>View All Courses</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>

                        {coursesData && coursesData.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {coursesData.slice(0, 4).map((item: any) => {
                                    const course = item.course;
                                    const enrolledDate = item.enrolled_at
                                        ? new Date(item.enrolled_at).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })
                                        : 'Recent';
                                    const playUrl = item.last_lesson_id
                                        ? `/learning/${course.id}/lessons/${item.last_lesson_id}`
                                        : `/courses/${course.slug || course.id}`;

                                    return (
                                        <div
                                            key={item.enrollment_id || course.id}
                                            className="p-4 rounded-2xl bg-slate-50/70 dark:bg-black/40 hover:bg-slate-50 dark:hover:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] hover:border-[#A60201]/50 dark:hover:border-[#A60201]/50 transition-all flex flex-col justify-between space-y-3 group"
                                        >
                                            {/* Thumbnail aperture */}
                                            <div className="aspect-video w-full rounded-xl bg-slate-900 overflow-hidden relative shadow-2xs">
                                                {course.thumbnail ? (
                                                    <img
                                                        src={course.thumbnail}
                                                        alt={course.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-[#A60201] to-[#0A0303] text-white font-bold text-xs p-2 text-center">
                                                        <span>DoctorWallah</span>
                                                    </div>
                                                )}
                                                <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-white text-[10px] font-bold">
                                                    {item.total_lessons || 0} Classes
                                                </span>
                                            </div>

                                            {/* Course Title & Progress */}
                                            <div className="space-y-1.5 flex-1">
                                                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white line-clamp-2 group-hover:text-[#A60201] dark:group-hover:text-red-400 transition-colors">
                                                    {course.title}
                                                </h4>
                                                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                                                    <span>Enrolled: {enrolledDate}</span>
                                                    <span className="font-semibold text-slate-700 dark:text-slate-300">{item.progress_percentage || 0}%</span>
                                                </div>
                                                {/* Mini progress bar */}
                                                <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        className="h-1.5 rounded-full bg-[#A60201] transition-all duration-300"
                                                        style={{ width: `${item.progress_percentage || 0}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Action bar */}
                                            <div className="pt-1 flex items-center justify-between border-t border-slate-200/60 dark:border-white/[0.06]">
                                                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                                                    Full Access
                                                </span>
                                                <Link
                                                    to={playUrl}
                                                    className="px-3 py-1.5 rounded-lg bg-[#A60201] hover:bg-[#880101] text-white text-[11px] font-bold flex items-center gap-1 shadow-xs transition"
                                                >
                                                    <Play className="w-3 h-3 fill-current" />
                                                    <span>Start Class</span>
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-16 text-center space-y-3">
                                <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                                <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">
                                    No Enrolled Courses Found
                                </h3>
                                <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
                                    You haven't enrolled in any medical courses yet. Explore our BMDC curriculum courses to master your cards & 1st Prof.
                                </p>
                                <Link
                                    to="/courses"
                                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#A60201] hover:bg-[#880101] text-white text-xs font-bold shadow-xs transition"
                                >
                                    <span>Browse MBBS Courses</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Profile Dossier & Activity (4 cols on lg) */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Personal Information Dossier */}
                    <div className="bg-white dark:bg-[#0A0404] rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-white/[0.08] shadow-xs space-y-4 transition-colors">
                        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-white/[0.08]">
                            <UserIcon className="w-4 h-4 text-[#A60201]" />
                            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                Cadet Identity
                            </h3>
                        </div>

                        <div className="space-y-3.5 text-xs">
                            {/* Full Name */}
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                                    Student Name
                                </span>
                                <p className="font-extrabold text-slate-900 dark:text-white">
                                    {user?.name || 'Medical Student'}
                                </p>
                            </div>

                            {/* User ID */}
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                                    Cadet ID
                                </span>
                                <p className="font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-black/60 border border-slate-200 dark:border-white/10 px-2 py-1 rounded-md inline-block">
                                    {userIdDisplay}
                                </p>
                            </div>

                            {/* Phone Number */}
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                                    Phone Number
                                </span>
                                <p className="font-semibold text-slate-800 dark:text-slate-300">
                                    {user?.phone || 'Not provided'}
                                </p>
                            </div>

                            {/* Email */}
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                                    Email Address
                                </span>
                                <p className="font-semibold text-slate-800 dark:text-slate-300 break-all">
                                    {user?.email || 'Not provided'}
                                </p>
                            </div>

                            {/* Campus Location */}
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                                    Location
                                </span>
                                <p className="font-semibold text-slate-800 dark:text-slate-300">
                                    {user?.address || 'Dhaka, Bangladesh'}
                                </p>
                            </div>
                        </div>

                        <div className="pt-2">
                            <Link
                                to="/student/settings/profile"
                                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-slate-800 dark:text-white text-xs font-bold transition border border-slate-200 dark:border-white/10"
                            >
                                <span>Edit Profile Info</span>
                                <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                    </div>

                    {/* Recent Academic Milestones */}
                    <div className="bg-white dark:bg-[#0A0404] rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-white/[0.08] shadow-xs space-y-4 transition-colors">
                        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-white/[0.08]">
                            <Clock className="w-4 h-4 text-[#A60201]" />
                            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                Recent Milestones
                            </h3>
                        </div>

                        <div className="space-y-3">
                            {recentActivities.map((act) => (
                                <div key={act.id} className="flex items-start gap-2.5 text-xs">
                                    <span className="w-2 h-2 rounded-full bg-[#A60201] mt-1.5 shrink-0" />
                                    <div>
                                        <p className="font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                                            {act.text}
                                        </p>
                                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                            {act.time}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
