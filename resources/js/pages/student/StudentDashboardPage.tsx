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
    Gem
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
                text: `Completed a lesson in ${first.course?.title || 'Course'}`,
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
                text: `Purchased ${second.course?.title || 'Master Course'}`,
                time: getRelativeTime(second.enrolled_at),
            });
        }
    }

    if (recentActivities.length === 0) {
        recentActivities.push(
            {
                id: 'act-welcome',
                text: 'Welcome to NovoNex Student Portal',
                time: 'Recently',
            },
            {
                id: 'act-profile',
                text: 'Account registered and profile initialized',
                time: getRelativeTime(user?.created_at),
            }
        );
    }

    if (loading) {
        return (
            <div className="py-24 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-[#25a2ee] animate-spin" />
                <span className="text-xs font-bold text-slate-500">Loading student profile...</span>
            </div>
        );
    }

    const userIdDisplay = user?.registration_number || (user?.id ? `bidth-${user.id}` : 'bidth-100004372');

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Page Header */}
            <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Profile Overview
                </h1>
            </div>

            {/* Top 2-Column Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
                {/* 1. Personal Information Card */}
                <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                        <UserIcon className="w-4 h-4 text-[#25a2ee]" />
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                            Personal Information
                        </h2>
                    </div>

                    <div className="space-y-4 pt-1">
                        {/* Full Name */}
                        <div>
                            <span className="text-[11px] font-bold text-slate-400 block mb-1 flex items-center gap-1.5">
                                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                                <span>Full Name</span>
                            </span>
                            <p className="font-extrabold text-slate-900 text-sm">
                                {user?.name || 'Student'}
                            </p>
                        </div>

                        {/* User ID */}
                        <div>
                            <span className="text-[11px] font-bold text-slate-400 block mb-1 flex items-center gap-1.5">
                                <Hash className="w-3.5 h-3.5 text-slate-400" />
                                <span>User ID</span>
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200/90 px-2.5 py-1 rounded-lg select-all">
                                    {userIdDisplay}
                                </span>
                                <button
                                    type="button"
                                    onClick={copyUserId}
                                    className="p-1.5 text-slate-400 hover:text-[#25a2ee] hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                                    title="Copy User ID"
                                >
                                    {copiedId ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                    )}
                                </button>
                                {copiedId && (
                                    <span className="text-[11px] font-bold text-emerald-600">Copied!</span>
                                )}
                            </div>
                        </div>

                        {/* Email Address */}
                        <div>
                            <span className="text-[11px] font-bold text-slate-400 block mb-1 flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                <span>Email Address</span>
                            </span>
                            <p className="font-bold text-slate-800 text-xs sm:text-sm break-all">
                                {user?.email || 'Not provided'}
                            </p>
                        </div>

                        {/* Phone Number */}
                        <div>
                            <span className="text-[11px] font-bold text-slate-400 block mb-1 flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                <span>Phone Number</span>
                            </span>
                            <p className="font-bold text-slate-800 text-xs sm:text-sm">
                                {user?.phone || 'Not provided'}
                            </p>
                        </div>

                        {/* Address */}
                        <div>
                            <span className="text-[11px] font-bold text-slate-400 block mb-1 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                <span>Address</span>
                            </span>
                            <p className="font-medium text-slate-600 text-xs">
                                {user?.address || 'Dhaka, Bangladesh'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. Account Summary Card */}
                <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-2xs space-y-5 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                            <BarChart3 className="w-4 h-4 text-[#25a2ee]" />
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                                Account Summary
                            </h2>
                        </div>

                        {/* Reward Points Card */}
                        <div className="mt-3 p-3.5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                                    <Gem className="w-4 h-4" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                        Reward Points
                                    </span>
                                    <p className="text-lg font-black text-slate-900 leading-tight flex items-center gap-1.5 mt-0.5">
                                        <Gem className="w-4 h-4 text-amber-500" />
                                        <span>{user?.points ?? 0}</span>
                                    </p>
                                </div>
                            </div>
                            <Link
                                to="/earn-points"
                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-extrabold rounded-xl shadow-2xs transition flex items-center gap-1 shrink-0"
                            >
                                <span>Earn Points</span>
                                <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>

                        {/* Progress Bars */}
                        <div className="space-y-4 pt-2">
                            {/* Active Courses */}
                            <div>
                                <div className="flex items-center justify-between text-xs font-extrabold text-slate-700 mb-1.5">
                                    <span>Active Courses</span>
                                    <span>{activeCourses}</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="h-2 rounded-full bg-amber-400 transition-all duration-500"
                                        style={{ width: `${Math.min(100, Math.max(activeCourses > 0 ? 35 : 0, activeCourses * 45))}%` }}
                                    />
                                </div>
                            </div>

                            {/* Completed Courses */}
                            <div>
                                <div className="flex items-center justify-between text-xs font-extrabold text-slate-700 mb-1.5">
                                    <span>Completed Courses</span>
                                    <span>{completedCourses}</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="h-2 rounded-full bg-slate-300 transition-all duration-500"
                                        style={{ width: `${Math.min(100, completedCourses * 50)}%` }}
                                    />
                                </div>
                            </div>

                            {/* Wishlist Items / Exams */}
                            <div>
                                <div className="flex items-center justify-between text-xs font-extrabold text-slate-700 mb-1.5">
                                    <span>Wishlist Items</span>
                                    <span>{wishlistOrExamsCount}</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="h-2 rounded-full bg-purple-500 transition-all duration-500"
                                        style={{ width: `${Math.min(100, Math.max(wishlistOrExamsCount > 0 ? 45 : 0, wishlistOrExamsCount * 18))}%` }}
                                    />
                                </div>
                            </div>

                            {/* Total Orders */}
                            <div>
                                <div className="flex items-center justify-between text-xs font-extrabold text-slate-700 mb-1.5">
                                    <span>Total Orders</span>
                                    <span>{ordersCount}</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="h-2 rounded-full bg-slate-300 transition-all duration-500"
                                        style={{ width: `${Math.min(100, ordersCount * 30)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sub-section: Recent Activity */}
                    <div className="pt-4 border-t border-slate-100">
                        <h3 className="text-xs font-extrabold text-slate-800 mb-2.5">
                            Recent Activity
                        </h3>
                        <div className="space-y-2.5">
                            {recentActivities.map((act) => (
                                <div key={act.id} className="flex items-start gap-2 text-xs">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#25a2ee] mt-1.5 shrink-0" />
                                    <div>
                                        <p className="font-semibold text-slate-700 leading-snug">
                                            {act.text}
                                        </p>
                                        <span className="text-[10px] text-slate-400">
                                            {act.time}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Recent Courses */}
            <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h2 className="text-base font-black text-slate-900 tracking-tight">
                        Recent Courses
                    </h2>
                    <Link
                        to="/student/my-courses"
                        className="text-xs font-extrabold text-[#25a2ee] hover:underline flex items-center gap-1"
                    >
                        <span>View All</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>

                {coursesData && coursesData.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {coursesData.slice(0, 4).map((item: any) => {
                            const course = item.course;
                            const enrolledDate = item.enrolled_at
                                ? new Date(item.enrolled_at).toLocaleDateString('en-US', {
                                    month: 'long',
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
                                    className="p-3.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 hover:border-sky-300 rounded-2xl transition-all flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 group"
                                >
                                    {/* Thumbnail */}
                                    <div className="w-full sm:w-28 h-36 sm:h-20 bg-slate-900 rounded-xl overflow-hidden shrink-0 relative shadow-2xs">
                                        {course.thumbnail ? (
                                            <img
                                                src={course.thumbnail}
                                                alt={course.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-[#25a2ee] to-slate-900 text-white font-bold text-[10px] p-1 text-center">
                                                <span>NovoNex</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="w-full flex-1 min-w-0 space-y-1">
                                        <h3 className="font-extrabold text-sm text-slate-900 truncate group-hover:text-[#25a2ee] transition-colors">
                                            {course.title}
                                        </h3>
                                        <p className="text-[11px] text-slate-500">
                                            Enrolled: <span className="font-semibold text-slate-700">{enrolledDate}</span>
                                        </p>
                                        <div className="flex items-center justify-between pt-1">
                                            <span className="text-[11px] font-bold text-slate-500">
                                                Duration: <span className="font-semibold text-slate-700">3 months</span>
                                            </span>
                                            <Link
                                                to={playUrl}
                                                className="px-3 py-1 bg-[#25a2ee] hover:bg-[#1f8ed1] text-white text-[11px] font-bold rounded-lg shadow-2xs flex items-center gap-1 transition"
                                            >
                                                <Play className="w-3 h-3 fill-white" />
                                                <span>Continue</span>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="py-12 text-center space-y-3">
                        <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                        <p className="text-sm font-bold text-slate-600">You haven't enrolled in any courses yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
