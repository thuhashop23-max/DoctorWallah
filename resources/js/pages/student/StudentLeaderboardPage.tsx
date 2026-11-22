import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
    Trophy,
    Crown,
    Medal,
    Award,
    BookOpen,
    Calendar,
    ChevronDown,
    Loader2,
    Sparkles,
    AlertCircle,
    CheckCircle2,
    Clock,
    UserCheck,
    FileText
} from 'lucide-react';

interface EnrolledCourse {
    id: number;
    title: string;
    slug: string;
    thumbnail?: string | null;
}

interface LeaderboardItem {
    rank: number;
    user_id: number;
    name: string;
    total_points: number;
    exams_count: number;
    is_current_user: boolean;
}

interface CurrentUserRanking {
    rank: number | null;
    user_id: number;
    name: string;
    total_points: number;
    exams_count: number;
    is_current_user: boolean;
}

const formatNumber = (num: number | string | null | undefined): string => {
    if (num === null || num === undefined) return '-';
    return String(num);
};

const getAvatarGradient = (name: string) => {
    const gradients = [
        'from-sky-500 to-indigo-600',
        'from-emerald-500 to-teal-600',
        'from-violet-500 to-purple-600',
        'from-amber-500 to-orange-600',
        'from-rose-500 to-pink-600',
        'from-cyan-500 to-blue-600',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return gradients[Math.abs(hash) % gradients.length];
};

export const StudentLeaderboardPage: React.FC = () => {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();

    // Filters: course_id ('all' | number) and period ('week' | 'month' | 'all')
    const [selectedCourseId, setSelectedCourseId] = useState<string | number>('all');
    const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week');

    const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
    const [currentUser, setCurrentUser] = useState<CurrentUserRanking | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        fetchLeaderboard(selectedCourseId, selectedPeriod);
    }, [selectedCourseId, selectedPeriod]);

    const fetchLeaderboard = async (courseId: string | number, period: 'week' | 'month' | 'all') => {
        setLoading(true);
        setErrorMsg('');
        try {
            const params: any = { period };
            if (courseId && courseId !== 'all') {
                params.course_id = courseId;
            }

            const { data } = await apiClient.get('/student/leaderboard', { params });
            setEnrolledCourses(data.enrolled_courses || []);
            setLeaderboard(data.leaderboard || []);
            setCurrentUser(data.current_user || null);

            // If selected course was not set or changed
            if (data.selected_course_id && selectedCourseId === 'all' && courseId !== 'all') {
                setSelectedCourseId(data.selected_course_id);
            }
        } catch (err: any) {
            console.error('Failed to load leaderboard', err);
            setErrorMsg('Unable to load leaderboard data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Extract Top 3 and rest
    const rank1 = leaderboard.find((item) => item.rank === 1);
    const rank2 = leaderboard.find((item) => item.rank === 2);
    const rank3 = leaderboard.find((item) => item.rank === 3);
    const restList = leaderboard.filter((item) => item.rank > 3);

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {/* Header & Filter Row */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                            <Trophy className="w-7 h-7 text-amber-500" />
                            <span>Leaderboard</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                            Top student rankings and merit leaderboard based on exam performance
                        </p>
                    </div>

                    {/* Time Filter Pills */}
                    <div className="bg-slate-200/70 dark:bg-white/[0.06] p-1.5 rounded-full inline-flex items-center text-xs font-bold self-start sm:self-auto shadow-2xs border border-transparent dark:border-white/[0.08]">
                        <button
                            type="button"
                            onClick={() => setSelectedPeriod('week')}
                            className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${selectedPeriod === 'week'
                                ? 'bg-white dark:bg-[#A60201] text-slate-800 dark:text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            This Week
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedPeriod('month')}
                            className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${selectedPeriod === 'month'
                                ? 'bg-white dark:bg-[#A60201] text-slate-800 dark:text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            This Month
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedPeriod('all')}
                            className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${selectedPeriod === 'all'
                                ? 'bg-white dark:bg-[#A60201] text-slate-800 dark:text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            All Time
                        </button>
                    </div>
                </div>

                {/* Course Selection Tabs / Dropdown */}
                {enrolledCourses.length > 0 && (
                    <div className="bg-white dark:bg-[#0A0404] rounded-2xl p-3 border border-slate-200/80 dark:border-white/[0.08] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
                        <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700 dark:text-slate-300 shrink-0">
                            <BookOpen className="w-4 h-4 text-[#A60201]" />
                            <span>Filter by Course:</span>
                        </div>

                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none flex-1">
                            <button
                                type="button"
                                onClick={() => setSelectedCourseId('all')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${selectedCourseId === 'all'
                                    ? 'bg-[#A60201] text-white shadow-xs'
                                    : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.1]'
                                    }`}
                            >
                                All My Courses
                            </button>

                            {enrolledCourses.map((c) => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => setSelectedCourseId(c.id)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 truncate max-w-[200px] transition-all cursor-pointer ${selectedCourseId === c.id
                                        ? 'bg-[#A60201] text-white shadow-xs'
                                        : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.1]'
                                        }`}
                                    title={c.title}
                                >
                                    {c.title}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Error Message */}
            {errorMsg && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs sm:text-sm flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>{errorMsg}</span>
                </div>
            )}

            {/* Loading State */}
            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400 bg-white dark:bg-[#0A0404] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
                    <Loader2 className="w-9 h-9 text-[#A60201] animate-spin" />
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Loading leaderboard...</span>
                </div>
            ) : leaderboard.length === 0 ? (
                /* Empty State */
                <div className="bg-white dark:bg-[#0A0404] rounded-3xl p-10 sm:p-14 border border-slate-200/80 dark:border-white/[0.08] text-center shadow-xs dark:shadow-[0_4px_30px_rgba(0,0,0,0.5)] space-y-4 transition-colors">
                    <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-500/15 text-amber-500 flex items-center justify-center mx-auto border border-amber-100 dark:border-amber-500/30">
                        <Trophy className="w-8 h-8" />
                    </div>
                    <div className="max-w-md mx-auto space-y-1.5">
                        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                            No exam results found
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                            No students have taken exams for the selected course and timeframe yet. Take an exam now to claim the top spot!
                        </p>
                    </div>
                    <div className="pt-2">
                        <Link
                            to="/student/exams"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#A60201] hover:bg-[#880101] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#A60201]/25 transition-all"
                        >
                            <FileText className="w-4 h-4" />
                            <span>Browse Exams</span>
                        </Link>
                    </div>
                </div>
            ) : (
                <>
                    {/* PODIUM CARD (TOP 3) */}
                    <div className="bg-white dark:bg-[#0A0404] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-white/[0.08] shadow-xs dark:shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-colors">
                        <div className="flex items-end justify-center gap-3 sm:gap-6 pt-6 pb-2">
                            {/* RANK 2 (Left - Silver Podium) */}
                            {rank2 ? (
                                <div className="flex flex-col items-center flex-1 max-w-[140px] sm:max-w-[160px] animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    {/* Avatar */}
                                    <div className="relative mb-2">
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-1 ring-4 ring-slate-300 dark:ring-slate-700 bg-white dark:bg-[#0A0404] shadow-md">
                                            <div
                                                className={`w-full h-full rounded-full bg-gradient-to-tr ${getAvatarGradient(
                                                    rank2.name
                                                )} text-white flex items-center justify-center font-black text-lg sm:text-xl`}
                                            >
                                                {rank2.name.charAt(0).toUpperCase()}
                                            </div>
                                        </div>
                                        {/* Rank Badge */}
                                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-slate-500 text-white font-black text-xs flex items-center justify-center border-2 border-white dark:border-[#0A0404] shadow-xs">
                                            2
                                        </span>
                                    </div>

                                    {/* Name & Points */}
                                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 text-center truncate max-w-full">
                                        {rank2.name}
                                    </h4>
                                    <p className="text-[11px] sm:text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                                        {formatNumber(rank2.total_points)} pts
                                    </p>

                                    {/* Silver Pedestal */}
                                    <div className="w-full h-28 sm:h-36 bg-gradient-to-b from-slate-200 to-slate-300/80 dark:from-slate-800 dark:to-slate-900 rounded-t-2xl mt-3 flex items-center justify-center border-t-2 border-slate-300 dark:border-slate-700 shadow-inner">
                                        <span className="text-3xl sm:text-4xl font-black text-slate-500/80 dark:text-slate-400/80">2</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 max-w-[140px] sm:max-w-[160px] opacity-0" />
                            )}

                            {/* RANK 1 (Middle - Gold Podium - Highest Elevation) */}
                            {rank1 && (
                                <div className="flex flex-col items-center flex-1 max-w-[150px] sm:max-w-[180px] -mt-6 sm:-mt-8 z-10 animate-in fade-in slide-in-from-bottom-6 duration-300">
                                    {/* Crown Icon */}
                                    <Crown className="w-7 h-7 sm:w-8 sm:h-8 text-amber-500 animate-bounce" />

                                    {/* Avatar */}
                                    <div className="relative mb-2">
                                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1.5 ring-4 ring-amber-400 dark:ring-amber-500/60 bg-white dark:bg-[#0A0404] shadow-xl shadow-amber-500/20">
                                            <div
                                                className={`w-full h-full rounded-full bg-gradient-to-tr ${getAvatarGradient(
                                                    rank1.name
                                                )} text-white flex items-center justify-center font-black text-xl sm:text-2xl`}
                                            >
                                                {rank1.name.charAt(0).toUpperCase()}
                                            </div>
                                        </div>
                                        {/* Rank 1 Badge */}
                                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-amber-500 text-white font-black text-xs sm:text-sm flex items-center justify-center border-2 border-white dark:border-[#0A0404] shadow-sm">
                                            1
                                        </span>
                                    </div>

                                    {/* Name & Points */}
                                    <h4 className="text-xs sm:text-base font-black text-slate-900 dark:text-white text-center truncate max-w-full">
                                        {rank1.name}
                                    </h4>
                                    <p className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400 mt-0.5">
                                        {formatNumber(rank1.total_points)} pts
                                    </p>

                                    {/* Gold Pedestal */}
                                    <div className="w-full h-40 sm:h-48 bg-gradient-to-b from-amber-100 via-amber-200/90 to-amber-300/70 dark:from-amber-950/60 dark:via-amber-900/40 dark:to-amber-950/80 rounded-t-2xl mt-3 flex items-center justify-center border-t-2 border-amber-300 dark:border-amber-700 shadow-inner">
                                        <span className="text-4xl sm:text-5xl font-black text-amber-600/90 dark:text-amber-400/90">1</span>
                                    </div>
                                </div>
                            )}

                            {/* RANK 3 (Right - Bronze Podium) */}
                            {rank3 ? (
                                <div className="flex flex-col items-center flex-1 max-w-[140px] sm:max-w-[160px] animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    {/* Avatar */}
                                    <div className="relative mb-2">
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-1 ring-4 ring-amber-700/40 bg-white dark:bg-[#0A0404] shadow-md">
                                            <div
                                                className={`w-full h-full rounded-full bg-gradient-to-tr ${getAvatarGradient(
                                                    rank3.name
                                                )} text-white flex items-center justify-center font-black text-lg sm:text-xl`}
                                            >
                                                {rank3.name.charAt(0).toUpperCase()}
                                            </div>
                                        </div>
                                        {/* Rank 3 Badge */}
                                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center border-2 border-white dark:border-[#0A0404] shadow-xs">
                                            3
                                        </span>
                                    </div>

                                    {/* Name & Points */}
                                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 text-center truncate max-w-full">
                                        {rank3.name}
                                    </h4>
                                    <p className="text-[11px] sm:text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                                        {formatNumber(rank3.total_points)} pts
                                    </p>

                                    {/* Bronze Pedestal */}
                                    <div className="w-full h-24 sm:h-28 bg-gradient-to-b from-stone-200 to-stone-300/80 dark:from-stone-800 dark:to-stone-900 rounded-t-2xl mt-3 flex items-center justify-center border-t-2 border-stone-300 dark:border-stone-700 shadow-inner">
                                        <span className="text-3xl sm:text-4xl font-black text-stone-500/80 dark:text-stone-400/80">3</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 max-w-[140px] sm:max-w-[160px] opacity-0" />
                            )}
                        </div>
                    </div>

                    {/* RANKINGS LIST (RANK 4+) */}
                    {restList.length > 0 && (
                        <div className="bg-white dark:bg-[#0A0404] rounded-3xl p-3 sm:p-5 border border-slate-200/80 dark:border-white/[0.08] shadow-xs dark:shadow-[0_4px_30px_rgba(0,0,0,0.5)] divide-y divide-slate-100 dark:divide-white/[0.06] transition-colors">
                            {restList.map((item) => (
                                <div
                                    key={item.user_id}
                                    className={`flex items-center justify-between p-3 sm:p-4 rounded-2xl transition-colors ${item.is_current_user
                                        ? 'bg-red-50/50 dark:bg-[#A60201]/10 border border-red-200/80 dark:border-[#A60201]/30'
                                        : 'hover:bg-slate-50 dark:hover:bg-white/[0.02]'
                                        }`}
                                >
                                    <div className="flex items-center gap-3.5 sm:gap-4 truncate">
                                        {/* Rank Number */}
                                        <span className="w-6 text-center font-black text-xs sm:text-sm text-slate-400 dark:text-slate-500">
                                            {formatNumber(item.rank)}
                                        </span>

                                        {/* Avatar */}
                                        <div
                                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                                                item.name
                                            )} text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-xs shrink-0`}
                                        >
                                            {item.name.charAt(0).toUpperCase()}
                                        </div>

                                        {/* Name & Details */}
                                        <div className="truncate">
                                            <div className="flex items-center gap-2">
                                                <h5 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 truncate">
                                                    {item.name}
                                                </h5>
                                                {item.is_current_user && (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 dark:bg-[#A60201]/20 text-[#A60201] dark:text-red-300">
                                                        You
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                                                {formatNumber(item.exams_count)} exams completed
                                            </p>
                                        </div>
                                    </div>

                                    {/* Points */}
                                    <div className="text-right shrink-0">
                                        <span className="text-sm sm:text-base font-black text-amber-600 dark:text-amber-400">
                                            {formatNumber(item.total_points)}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 ml-1">pts</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* FLOATING / STICKY BOTTOM CARD FOR CURRENT USER */}
            {currentUser && (
                <div className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:w-[calc(100%-20rem)] max-w-4xl z-40">
                    <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-teal-950 text-white rounded-2xl p-3 sm:p-4 shadow-2xl border border-emerald-600/40 flex items-center justify-between backdrop-blur-md">
                        <div className="flex items-center gap-3 sm:gap-4 truncate">
                            {/* User Rank */}
                            <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs font-black text-emerald-300 shrink-0">
                                {formatNumber(currentUser.rank)}
                            </div>

                            {/* User Avatar */}
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 text-white flex items-center justify-center font-black text-xs sm:text-sm shadow-md shrink-0 ring-2 ring-emerald-400/50">
                                {currentUser.name?.charAt(0).toUpperCase() || 'U'}
                            </div>

                            {/* Info */}
                            <div className="truncate">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs sm:text-sm font-black text-white">You</span>
                                    {currentUser.rank && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                                            Rank #{formatNumber(currentUser.rank)}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] text-emerald-200/80 truncate mt-0.5 font-medium">
                                    {currentUser.total_points > 0
                                        ? `${formatNumber(currentUser.exams_count)} exams completed`
                                        : 'Take exams to earn points'}
                                </p>
                            </div>
                        </div>

                        {/* Points */}
                        <div className="text-right shrink-0 pl-3">
                            <span className="text-lg sm:text-2xl font-black text-emerald-300">
                                {formatNumber(currentUser.total_points)}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-200/70 ml-1">pts</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

