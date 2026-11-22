import React, { useEffect, useState, useMemo } from 'react';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
    Star,
    BookOpen,
    TrendingUp,
    AlertTriangle,
    CheckCircle2,
    Search,
    Filter,
    BarChart3,
    Trash2,
    ChevronDown,
    Loader2,
    Sparkles,
    User,
    ArrowUpRight,
    ArrowDownRight,
    Layers,
    Smile,
    Frown
} from 'lucide-react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ReferenceLine,
    Cell
} from 'recharts';

interface CourseOption {
    id: number;
    title: string;
    slug: string;
    thumbnail?: string;
    lessons_count: number;
    reviews_count: number;
    average_rating: number;
    positive_percentage: number;
}

interface LessonStat {
    id: number;
    title: string;
    slug: string;
    section_id: number;
    section_title: string;
    sort_order: number;
    class_number: number;
    reviews_count: number;
    average_rating: number;
    status: 'excellent' | 'good' | 'average' | 'poor' | 'no_reviews';
    distribution: Record<number, number>;
}

interface ReviewItem {
    id: number;
    rating: number;
    review: string | null;
    created_at: string;
    lesson: {
        id: number;
        title: string;
    };
    user: {
        id: number;
        name: string;
        email?: string;
        role: string;
        avatar?: string;
    };
}

export const ClassReviewsPage: React.FC = () => {
    const { user } = useAuth();
    const [courses, setCourses] = useState<CourseOption[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
    const [coursesLoading, setCoursesLoading] = useState(true);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [searchCourseText, setSearchCourseText] = useState('');

    const [courseDetails, setCourseDetails] = useState<any>(null);
    const [lessonsStats, setLessonsStats] = useState<LessonStat[]>([]);
    const [chartData, setChartData] = useState<any[]>([]);
    const [reviews, setReviews] = useState<ReviewItem[]>([]);
    const [summary, setSummary] = useState<any>(null);

    // Filter states
    const [filterLessonId, setFilterLessonId] = useState<string>('all');
    const [filterRating, setFilterRating] = useState<string>('all');
    const [searchReviewQuery, setSearchReviewQuery] = useState('');
    const [deletingId, setDeletingId] = useState<number | null>(null);

    useEffect(() => {
        fetchCourses();
    }, []);

    useEffect(() => {
        if (selectedCourseId) {
            fetchCourseDetails(selectedCourseId);
        }
    }, [selectedCourseId]);

    const fetchCourses = async () => {
        setCoursesLoading(true);
        try {
            const { data } = await apiClient.get('/class-reviews/courses');
            const list = data.courses || [];
            setCourses(list);
            if (list.length > 0 && !selectedCourseId) {
                setSelectedCourseId(list[0].id);
            }
        } catch (err) {
            console.error('Failed to load courses for class reviews', err);
        } finally {
            setCoursesLoading(false);
        }
    };

    const fetchCourseDetails = async (courseId: number) => {
        setDetailsLoading(true);
        try {
            const { data } = await apiClient.get(`/class-reviews/courses/${courseId}`);
            setCourseDetails(data.course);
            setSummary(data.summary);
            setLessonsStats(data.lessons_stats || []);
            setChartData(data.chart_data || []);
            setReviews(data.reviews || []);
            setFilterLessonId('all');
            setFilterRating('all');
        } catch (err) {
            console.error('Failed to load class reviews for course', err);
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleDeleteReview = async (reviewId: number) => {
        if (!confirm('Are you sure you want to delete this class review?')) return;
        setDeletingId(reviewId);
        try {
            await apiClient.delete(`/class-reviews/${reviewId}`);
            setReviews(prev => prev.filter(r => r.id !== reviewId));
            if (selectedCourseId) {
                fetchCourseDetails(selectedCourseId);
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete review');
        } finally {
            setDeletingId(null);
        }
    };

    const filteredCourses = useMemo(() => {
        if (!searchCourseText.trim()) return courses;
        const q = searchCourseText.toLowerCase();
        return courses.filter(c => c.title.toLowerCase().includes(q));
    }, [courses, searchCourseText]);

    const selectedCourse = useMemo(() => {
        return courses.find(c => c.id === selectedCourseId) || null;
    }, [courses, selectedCourseId]);

    const filteredReviews = useMemo(() => {
        let list = [...reviews];
        if (filterLessonId !== 'all') {
            const lid = parseInt(filterLessonId, 10);
            list = list.filter(r => r.lesson.id === lid);
        }
        if (filterRating !== 'all') {
            if (filterRating === 'low') {
                list = list.filter(r => r.rating <= 2);
            } else {
                const rat = parseInt(filterRating, 10);
                list = list.filter(r => r.rating === rat);
            }
        }
        if (searchReviewQuery.trim()) {
            const q = searchReviewQuery.toLowerCase();
            list = list.filter(r =>
                r.user.name.toLowerCase().includes(q) ||
                (r.user.email && r.user.email.toLowerCase().includes(q)) ||
                (r.review && r.review.toLowerCase().includes(q)) ||
                r.lesson.title.toLowerCase().includes(q)
            );
        }
        return list;
    }, [reviews, filterLessonId, filterRating, searchReviewQuery]);

    // Custom Tooltip for Chart
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const item = payload[0].payload;
            return (
                <div className="bg-slate-900 border border-slate-700 p-3 rounded-2xl shadow-xl text-white text-xs space-y-1 z-50">
                    <p className="font-extrabold text-sky-400">{item.name}: {item.full_title}</p>
                    {item.section_title && (
                        <p className="text-[11px] text-slate-400">Section: {item.section_title}</p>
                    )}
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                        <span className="flex items-center gap-1 font-black text-amber-400">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            {item.rating > 0 ? `${item.rating} / 5.0` : 'No rating yet'}
                        </span>
                        <span className="text-slate-400">• {item.reviews_count} reviews</span>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                        <span className="p-2 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            <Star className="w-6 h-6 fill-amber-500 text-amber-500" />
                        </span>
                        <span>Class Reviews & Performance Analytics</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Track student ratings per class, spot high-performing lessons, and identify classes needing revision.
                    </p>
                </div>
            </div>

            {/* Course Selector Bar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                        <BookOpen className="w-4 h-4 text-[#A60201]" />
                        <span>Select Course to Analyze:</span>
                    </div>

                    <div className="relative w-full sm:w-72">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchCourseText}
                            onChange={(e) => setSearchCourseText(e.target.value)}
                            placeholder="Search courses..."
                            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#A60201]"
                        />
                    </div>
                </div>

                {/* Course pills / select buttons */}
                {coursesLoading ? (
                    <div className="flex items-center justify-center py-6 text-slate-400 gap-2 text-xs">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Loading courses...</span>
                    </div>
                ) : filteredCourses.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">No matching courses found.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
                        {filteredCourses.map((c) => {
                            const isSelected = c.id === selectedCourseId;
                            return (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => setSelectedCourseId(c.id)}
                                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                                        isSelected
                                            ? 'bg-amber-500/10 border-amber-500 text-slate-900 dark:text-white shadow-xs ring-2 ring-amber-500/30'
                                            : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                                    }`}
                                >
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-bold text-xs truncate leading-snug">{c.title}</h4>
                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                            {c.lessons_count} Classes • {c.reviews_count} Reviews
                                        </p>
                                    </div>
                                    <div className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 font-black text-xs">
                                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                        <span>{c.average_rating > 0 ? c.average_rating : '-'}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Course Analytics Content */}
            {detailsLoading ? (
                <div className="py-24 text-center space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#A60201]" />
                    <p className="text-xs text-slate-400">Loading class performance and student reviews...</p>
                </div>
            ) : !selectedCourse ? (
                <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
                    <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-semibold">Please select a course to view class reviews and graph analytics.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                            <div>
                                <span className="text-xs font-bold text-slate-400 block mb-1">Average Class Rating</span>
                                <div className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
                                    <span>{summary?.average_rating > 0 ? `${summary.average_rating} / 5.0` : 'N/A'}</span>
                                </div>
                                <span className="text-[11px] text-slate-400 mt-1 block">
                                    Across all classes in course
                                </span>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                <Sparkles className="w-6 h-6" />
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                            <div>
                                <span className="text-xs font-bold text-slate-400 block mb-1">Total Student Reviews</span>
                                <div className="text-2xl font-black text-slate-900 dark:text-white">
                                    {summary?.total_reviews || 0}
                                </div>
                                <span className="text-[11px] text-slate-400 mt-1 block">
                                    Submitted ratings & feedback
                                </span>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
                                <BarChart3 className="w-6 h-6" />
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                            <div>
                                <span className="text-xs font-bold text-slate-400 block mb-1">Reviewed Classes Ratio</span>
                                <div className="text-2xl font-black text-slate-900 dark:text-white">
                                    {summary?.reviewed_lessons_count || 0} / {summary?.total_lessons_count || 0}
                                </div>
                                <span className="text-[11px] text-slate-400 mt-1 block">
                                    Classes with student reviews
                                </span>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                                <Layers className="w-6 h-6" />
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                            <div>
                                <span className="text-xs font-bold text-slate-400 block mb-1">Performance Status</span>
                                <div className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                                    {summary?.average_rating >= 4.0 ? (
                                        <>
                                            <Smile className="w-5 h-5 text-emerald-500" />
                                            <span className="text-emerald-600 dark:text-emerald-400">High Satisfaction</span>
                                        </>
                                    ) : summary?.average_rating >= 3.0 ? (
                                        <>
                                            <Smile className="w-5 h-5 text-amber-500" />
                                            <span className="text-amber-600 dark:text-amber-400">Average Performance</span>
                                        </>
                                    ) : summary?.total_reviews === 0 ? (
                                        <span className="text-slate-400">Awaiting Feedback</span>
                                    ) : (
                                        <>
                                            <Frown className="w-5 h-5 text-rose-500" />
                                            <span className="text-rose-600 dark:text-rose-400">Needs Attention</span>
                                        </>
                                    )}
                                </div>
                                <span className="text-[11px] text-slate-400 mt-1 block">
                                    Student satisfaction index
                                </span>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    {/* GRAPH SECTION: Class by Class Rating Chart */}
                    <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <div className="flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-sky-500" />
                                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                                        Class Performance Graph
                                    </h3>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Visual rating comparison across every class in this course. Easily identify your strongest and weakest lessons.
                                </p>
                            </div>

                            {/* Color Legend */}
                            <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                                    <span className="text-slate-600 dark:text-slate-300">Excellent (≥ 4.0 ★)</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                                    <span className="text-slate-600 dark:text-slate-300">Average (3.0 - 3.9 ★)</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-3 h-3 rounded-full bg-rose-500" />
                                    <span className="text-slate-600 dark:text-slate-300">Poor (&lt; 3.0 ★)</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-3 h-3 rounded-full bg-slate-400" />
                                    <span className="text-slate-600 dark:text-slate-300">No Reviews</span>
                                </div>
                            </div>
                        </div>

                        {chartData.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 text-xs">
                                No classes found in this course.
                            </div>
                        ) : (
                            <div className="h-80 w-full pt-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 15, right: 15, left: -10, bottom: 25 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="name"
                                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                                            tickLine={false}
                                            axisLine={false}
                                            angle={-25}
                                            textAnchor="end"
                                        />
                                        <YAxis
                                            domain={[0, 5]}
                                            ticks={[0, 1, 2, 3, 4, 5]}
                                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(v) => `${v} ★`}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <ReferenceLine y={3.5} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Target: 3.5 ★', fill: '#f59e0b', fontSize: 10, position: 'right' }} />
                                        <Bar dataKey="rating" radius={[6, 6, 0, 0]}>
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    {/* TOP PERFORMING & NEEDS ATTENTION HIGHLIGHTS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Top Performing Lessons */}
                        <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-white dark:to-slate-900 border border-emerald-300 dark:border-emerald-800/60 p-5 sm:p-6 rounded-3xl space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-emerald-200 dark:border-emerald-900/60">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-emerald-500 text-white rounded-xl shadow-xs">
                                        <ArrowUpRight className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-sm text-slate-900 dark:text-white">
                                            Top Performing Classes
                                        </h4>
                                        <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                                            Highest student ratings & satisfaction
                                        </span>
                                    </div>
                                </div>
                                <span className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-500 text-white shadow-2xs">
                                    Best Rated
                                </span>
                            </div>

                            {summary?.top_performing && summary.top_performing.length > 0 ? (
                                <div className="space-y-2.5">
                                    {summary.top_performing.map((item: LessonStat) => (
                                        <div
                                            key={item.id}
                                            className="p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-emerald-200/60 dark:border-emerald-900/40 flex items-center justify-between gap-3 shadow-2xs"
                                        >
                                            <div className="min-w-0">
                                                <h5 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                                    Class {item.class_number}: {item.title}
                                                </h5>
                                                <span className="text-[10px] text-slate-400">
                                                    {item.section_title} • {item.reviews_count} reviews
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-black text-xs shrink-0 border border-emerald-200 dark:border-emerald-800">
                                                <Star className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
                                                <span>{item.average_rating}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400 italic py-4 text-center">
                                    No reviews submitted yet for this course.
                                </p>
                            )}
                        </div>

                        {/* Classes Needing Attention / Improvement */}
                        <div className="bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-white dark:to-slate-900 border border-rose-300 dark:border-rose-800/60 p-5 sm:p-6 rounded-3xl space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-rose-200 dark:border-rose-900/60">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-rose-500 text-white rounded-xl shadow-xs">
                                        <AlertTriangle className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-sm text-slate-900 dark:text-white">
                                            Classes Needing Attention
                                        </h4>
                                        <span className="text-[11px] text-rose-700 dark:text-rose-400 font-semibold">
                                            Lessons with lowest ratings or student difficulties
                                        </span>
                                    </div>
                                </div>
                                <span className="text-xs font-black px-2.5 py-1 rounded-full bg-rose-500 text-white shadow-2xs">
                                    Needs Review
                                </span>
                            </div>

                            {summary?.needs_attention && summary.needs_attention.length > 0 ? (
                                <div className="space-y-2.5">
                                    {summary.needs_attention.map((item: LessonStat) => (
                                        <div
                                            key={item.id}
                                            className="p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between gap-3 shadow-2xs"
                                        >
                                            <div className="min-w-0">
                                                <h5 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                                    Class {item.class_number}: {item.title}
                                                </h5>
                                                <span className="text-[10px] text-slate-400">
                                                    {item.section_title} • {item.reviews_count} reviews
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-black text-xs shrink-0 border border-rose-200 dark:border-rose-800">
                                                <Star className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                                                <span>{item.average_rating > 0 ? item.average_rating : '-'}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-emerald-600 dark:text-emerald-400 italic py-4 text-center font-bold">
                                    Great work! All reviewed classes have solid positive ratings.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Class by Class Breakdown Table */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <h3 className="text-base font-black text-slate-900 dark:text-white">
                                    All Classes Review Breakdown
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Detailed scores and rating counts for every lesson in {selectedCourse.title}
                                </p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                                    <tr>
                                        <th className="py-3 px-4 rounded-l-xl">#</th>
                                        <th className="py-3 px-4">Class Title</th>
                                        <th className="py-3 px-4">Section</th>
                                        <th className="py-3 px-4">Reviews Count</th>
                                        <th className="py-3 px-4">Average Rating</th>
                                        <th className="py-3 px-4">Status</th>
                                        <th className="py-3 px-4 rounded-r-xl text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                                    {lessonsStats.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="py-3 px-4 font-mono text-slate-400">{item.class_number}</td>
                                            <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                                                {item.title}
                                            </td>
                                            <td className="py-3 px-4 text-slate-500">{item.section_title}</td>
                                            <td className="py-3 px-4 font-bold">{item.reviews_count}</td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="flex items-center gap-0.5">
                                                        {[1, 2, 3, 4, 5].map((s) => (
                                                            <Star
                                                                key={s}
                                                                className={`w-3.5 h-3.5 ${
                                                                    s <= Math.round(item.average_rating) && item.reviews_count > 0
                                                                        ? 'fill-amber-400 text-amber-400'
                                                                        : 'text-slate-300 dark:text-slate-700'
                                                                }`}
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className="font-black text-xs text-slate-900 dark:text-white">
                                                        {item.reviews_count > 0 ? item.average_rating : '-'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                {item.reviews_count === 0 ? (
                                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                                                        No Reviews
                                                    </span>
                                                ) : item.average_rating >= 4.5 ? (
                                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                                        Excellent (4.5+)
                                                    </span>
                                                ) : item.average_rating >= 4.0 ? (
                                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
                                                        Good (4.0+)
                                                    </span>
                                                ) : item.average_rating >= 3.0 ? (
                                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                                        Average
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                                                        Needs Improvement
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => setFilterLessonId(item.id.toString())}
                                                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition cursor-pointer"
                                                >
                                                    View Feedback
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* INDIVIDUAL STUDENT REVIEWS FEED */}
                    <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <span>Student Reviews & Feedback</span>
                                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                                        {filteredReviews.length}
                                    </span>
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Browse feedback messages submitted by students for each class.
                                </p>
                            </div>

                            {/* Filters Bar */}
                            <div className="flex flex-wrap items-center gap-2.5">
                                {/* Search query */}
                                <div className="relative">
                                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        value={searchReviewQuery}
                                        onChange={(e) => setSearchReviewQuery(e.target.value)}
                                        placeholder="Search student or note..."
                                        className="pl-8 pr-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#A60201]"
                                    />
                                </div>

                                {/* Class filter */}
                                <select
                                    value={filterLessonId}
                                    onChange={(e) => setFilterLessonId(e.target.value)}
                                    className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
                                >
                                    <option value="all">All Classes</option>
                                    {lessonsStats.map((l) => (
                                        <option key={l.id} value={l.id}>
                                            Class {l.class_number}: {l.title.slice(0, 30)}
                                        </option>
                                    ))}
                                </select>

                                {/* Star rating filter */}
                                <select
                                    value={filterRating}
                                    onChange={(e) => setFilterRating(e.target.value)}
                                    className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
                                >
                                    <option value="all">All Stars</option>
                                    <option value="5">5 Stars Only</option>
                                    <option value="4">4 Stars Only</option>
                                    <option value="3">3 Stars Only</option>
                                    <option value="2">2 Stars Only</option>
                                    <option value="1">1 Star Only</option>
                                    <option value="low">Low Ratings (&le; 2 Stars)</option>
                                </select>

                                {(filterLessonId !== 'all' || filterRating !== 'all' || searchReviewQuery) && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFilterLessonId('all');
                                            setFilterRating('all');
                                            setSearchReviewQuery('');
                                        }}
                                        className="px-2.5 py-1.5 text-xs text-rose-500 hover:text-rose-600 font-bold hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition cursor-pointer"
                                    >
                                        Reset
                                    </button>
                                )}
                            </div>
                        </div>

                        {filteredReviews.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 space-y-2">
                                <Star className="w-8 h-8 mx-auto text-slate-300" />
                                <p className="text-xs font-semibold">No class reviews found matching the selected filters.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredReviews.map((rev) => (
                                    <div
                                        key={rev.id}
                                        className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-3 hover:border-slate-300 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold flex items-center justify-center text-xs shrink-0">
                                                    {rev.user.name ? rev.user.name.charAt(0) : 'S'}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                                        {rev.user.name}
                                                    </h4>
                                                    {rev.user.email && (
                                                        <span className="text-[11px] text-slate-400 truncate block">
                                                            {rev.user.email}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <div className="flex items-center gap-0.5">
                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                        <Star
                                                            key={s}
                                                            className={`w-3.5 h-3.5 ${
                                                                s <= rev.rating
                                                                    ? 'fill-amber-400 text-amber-400'
                                                                    : 'text-slate-300 dark:text-slate-700'
                                                            }`}
                                                        />
                                                    ))}
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteReview(rev.id)}
                                                    disabled={deletingId === rev.id}
                                                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                                                    title="Delete Review"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="text-[11px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2.5 py-1 rounded-lg inline-flex items-center gap-1 border border-sky-200 dark:border-sky-800">
                                            <BookOpen className="w-3 h-3" />
                                            <span>{rev.lesson.title}</span>
                                        </div>

                                        {rev.review ? (
                                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60 italic">
                                                "{rev.review}"
                                            </p>
                                        ) : (
                                            <p className="text-[11px] text-slate-400 italic">
                                                Student gave a star rating without written feedback.
                                            </p>
                                        )}

                                        <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-800 flex items-center justify-between">
                                            <span>Rating: {rev.rating} / 5 Stars</span>
                                            <span>{new Date(rev.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
