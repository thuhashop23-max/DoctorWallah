import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import {
    Radio,
    Clock,
    Calendar,
    BookOpen,
    Play,
    User,
    MessageSquare,
    Loader2,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    ExternalLink,
    Sparkles
} from 'lucide-react';

interface LiveClassItem {
    id: number;
    course_id: number;
    title: string;
    description?: string | null;
    live_url: string;
    start_time: string;
    end_time?: string | null;
    status: 'upcoming' | 'live' | 'completed' | 'cancelled';
    is_currently_live: boolean;
    comments_count: number;
    course: {
        id: number;
        title: string;
        slug: string;
        thumbnail?: string | null;
    };
    creator?: {
        id: number;
        name: string;
        email: string;
    } | null;
}

export const StudentLiveClassesPage: React.FC = () => {
    const [liveClasses, setLiveClasses] = useState<LiveClassItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterTab, setFilterTab] = useState<'all' | 'live_upcoming' | 'completed'>('all');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        fetchLiveClasses();
    }, []);

    const fetchLiveClasses = async () => {
        try {
            setLoading(true);
            const { data } = await apiClient.get('/student/live-classes');
            setLiveClasses(data.live_classes || []);
        } catch (err: any) {
            setErrorMsg('Unable to load live classes.');
        } finally {
            setLoading(false);
        }
    };

    const formatDateTime = (dateStr?: string | null) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            return d.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateStr;
        }
    };

    const filteredClasses = liveClasses.filter((c) => {
        if (filterTab === 'live_upcoming') {
            return c.status === 'live' || c.status === 'upcoming' || c.is_currently_live;
        }
        if (filterTab === 'completed') {
            return c.status === 'completed';
        }
        return true;
    });

    const activeLiveCount = liveClasses.filter(c => c.status === 'live' || c.is_currently_live).length;

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            {/* Header & Filter Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                        <Radio className="w-7 h-7 text-[#A60201] animate-pulse" />
                        <span>Live Classes</span>
                        {activeLiveCount > 0 && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#A60201] text-white animate-bounce">
                                {activeLiveCount} Live Now!
                            </span>
                        )}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        Active and upcoming interactive live sessions for your enrolled courses
                    </p>
                </div>

                {/* Filter Tabs */}
                <div className="bg-slate-200/70 dark:bg-white/[0.06] p-1.5 rounded-full inline-flex items-center text-xs font-bold self-start sm:self-auto shadow-2xs border border-transparent dark:border-white/[0.08]">
                    <button
                        type="button"
                        onClick={() => setFilterTab('all')}
                        className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${filterTab === 'all'
                            ? 'bg-white dark:bg-[#A60201] text-slate-800 dark:text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                    >
                        All ({liveClasses.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterTab('live_upcoming')}
                        className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${filterTab === 'live_upcoming'
                            ? 'bg-white dark:bg-[#A60201] text-slate-800 dark:text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                    >
                        Live & Upcoming
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterTab('completed')}
                        className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${filterTab === 'completed'
                            ? 'bg-white dark:bg-[#A60201] text-slate-800 dark:text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                    >
                        Completed (Recorded)
                    </button>
                </div>
            </div>

            {/* Error state */}
            {errorMsg && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs sm:text-sm flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>{errorMsg}</span>
                </div>
            )}

            {/* Loading state */}
            {loading ? (
                <div className="py-24 flex flex-col items-center justify-center gap-3 bg-white dark:bg-[#0A0404] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
                    <Loader2 className="w-9 h-9 text-[#A60201] animate-spin" />
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Loading live classes...</span>
                </div>
            ) : filteredClasses.length === 0 ? (
                /* Empty state */
                <div className="bg-white dark:bg-[#0A0404] rounded-3xl p-10 sm:p-14 border border-slate-200/80 dark:border-white/[0.08] text-center shadow-xs dark:shadow-[0_4px_30px_rgba(0,0,0,0.5)] space-y-4 transition-colors">
                    <div className="w-16 h-16 rounded-3xl bg-red-50 dark:bg-[#A60201]/10 text-[#A60201] dark:text-red-300 flex items-center justify-center mx-auto border border-red-200/60 dark:border-[#A60201]/30">
                        <Radio className="w-8 h-8" />
                    </div>
                    <div className="max-w-md mx-auto space-y-1.5">
                        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                            No live classes found
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                            There are no scheduled live classes in your enrolled courses right now. Newly scheduled sessions will appear here.
                        </p>
                    </div>
                    <div className="pt-2">
                        <Link
                            to="/student/my-courses"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#A60201] hover:bg-[#880101] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#A60201]/25 transition-all"
                        >
                            <BookOpen className="w-4 h-4" />
                            <span>Browse My Courses</span>
                        </Link>
                    </div>
                </div>
            ) : (
                /* Grid of Live Class Cards */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredClasses.map((item) => {
                        const isLive = item.status === 'live' || item.is_currently_live;
                        const isCompleted = item.status === 'completed';

                        return (
                            <div
                                key={item.id}
                                className={`rounded-3xl border bg-white dark:bg-[#0A0404] p-5 flex flex-col justify-between shadow-xs dark:shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-all hover:shadow-md ${isLive
                                    ? 'border-red-400 dark:border-[#A60201] ring-2 ring-[#A60201]/20'
                                    : 'border-slate-200/80 dark:border-white/[0.08] hover:border-[#A60201]/40'
                                    }`}
                            >
                                <div className="space-y-3.5">
                                    {/* Top Course Badge & Status */}
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-[11px] font-bold text-[#A60201] dark:text-red-300 bg-red-50 dark:bg-[#A60201]/10 border border-red-200/80 dark:border-[#A60201]/30 px-2.5 py-0.5 rounded-full truncate max-w-[180px]">
                                            {item.course?.title || 'Course'}
                                        </span>

                                        {isLive ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#A60201] text-white shadow-xs animate-pulse">
                                                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                                <span>LIVE</span>
                                            </span>
                                        ) : isCompleted ? (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400">
                                                Completed
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border border-amber-200/80 dark:border-amber-500/30">
                                                Upcoming
                                            </span>
                                        )}
                                    </div>

                                    {/* Title */}
                                    <div>
                                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white line-clamp-2 leading-snug">
                                            {item.title}
                                        </h3>
                                        {item.creator && (
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                                <User className="w-3.5 h-3.5 text-slate-400" />
                                                <span>{item.creator.name}</span>
                                            </p>
                                        )}
                                    </div>

                                    {/* Time Info */}
                                    <div className="bg-slate-50 dark:bg-white/[0.03] rounded-2xl p-3 border border-slate-100 dark:border-white/[0.06] space-y-1 text-xs text-slate-600 dark:text-slate-300">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5 text-[#A60201] shrink-0" />
                                            <span>Starts: {formatDateTime(item.start_time)}</span>
                                        </div>
                                        <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <MessageSquare className="w-3 h-3 text-slate-400" />
                                                <span>{item.comments_count || 0} Comments</span>
                                            </span>
                                            <span className="font-bold text-[#A60201] dark:text-red-400">Live Session</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Join Button */}
                                <div className="pt-4">
                                    <Link
                                        to={`/student/live-classes/${item.id}`}
                                        className="w-full py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xs bg-[#A60201] hover:bg-[#880101] text-white shadow-[#A60201]/25"
                                    >
                                        <Play className="w-3.5 h-3.5 fill-white" />
                                        <span>{isLive ? 'Join Live Class Now' : 'Enter Class Room'}</span>
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

