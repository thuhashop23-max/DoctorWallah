import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import {
    Send,
    Bell,
    BookOpen,
    Package,
    Users,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Info,
    ExternalLink,
    Clock,
    Megaphone,
    Layers
} from 'lucide-react';

interface CourseOption {
    id: number;
    title: string;
    slug: string;
    direct_students_count: number;
    total_reach_count: number;
    included_in_bundles: { id: number; title: string }[];
}

interface BundleOption {
    id: number;
    title: string;
    slug: string;
    courses_count: number;
    total_reach_count: number;
}

interface NotificationHistoryItem {
    id: number;
    title: string;
    message: string;
    target_type: 'course' | 'bundle' | 'all';
    target_id: number | null;
    target_title: string | null;
    recipients_count: number;
    created_at: string;
}

export const NotifyStudentPage: React.FC = () => {
    const [courses, setCourses] = useState<CourseOption[]>([]);
    const [bundles, setBundles] = useState<BundleOption[]>([]);
    const [totalStudentsCount, setTotalStudentsCount] = useState<number>(0);
    const [isAdmin, setIsAdmin] = useState(false);

    const [targetType, setTargetType] = useState<'course' | 'bundle' | 'all'>('course');
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
    const [selectedBundleId, setSelectedBundleId] = useState<number | null>(null);

    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [link, setLink] = useState('/student');

    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [history, setHistory] = useState<NotificationHistoryItem[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        fetchOptions();
        fetchHistory();
    }, []);

    const fetchOptions = async () => {
        try {
            setLoading(true);
            const { data } = await apiClient.get('/announcements/target-options');
            setCourses(data.courses || []);
            setBundles(data.bundles || []);
            setTotalStudentsCount(data.total_students_count || 0);
            setIsAdmin(!!data.is_admin);

            if (data.courses && data.courses.length > 0) {
                setSelectedCourseId(data.courses[0].id);
            }
            if (data.bundles && data.bundles.length > 0) {
                setSelectedBundleId(data.bundles[0].id);
            }
        } catch (err: any) {
            console.error('Failed to load options', err);
            setErrorMessage('Failed to load courses and bundles.');
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            setLoadingHistory(true);
            const { data } = await apiClient.get('/announcements/history');
            setHistory(data.history || []);
        } catch {
            // silent fail
        } finally {
            setLoadingHistory(false);
        }
    };

    const selectedCourse = courses.find(c => c.id === selectedCourseId);
    const selectedBundle = bundles.find(b => b.id === selectedBundleId);

    const handleSendNotification = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccessMessage(null);
        setErrorMessage(null);

        if (!title.trim()) {
            setErrorMessage('Please enter notification title.');
            return;
        }

        if (!message.trim()) {
            setErrorMessage('Please enter notification message content.');
            return;
        }

        if (targetType === 'course' && !selectedCourseId) {
            setErrorMessage('Please select a course.');
            return;
        }

        if (targetType === 'bundle' && !selectedBundleId) {
            setErrorMessage('Please select a bundle.');
            return;
        }

        const confirmText = targetType === 'course'
            ? `Are you sure you want to send this notification to all enrolled students in "${selectedCourse?.title}" (and included bundles)?`
            : targetType === 'bundle'
                ? `Are you sure you want to send this notification to all enrolled students in "${selectedBundle?.title}"?`
                : 'Are you sure you want to send this notification to all students across the platform?';

        if (!window.confirm(confirmText)) {
            return;
        }

        try {
            setSending(true);
            const payload = {
                target_type: targetType,
                target_id: targetType === 'course' ? selectedCourseId : targetType === 'bundle' ? selectedBundleId : null,
                title: title.trim(),
                message: message.trim(),
                link: link.trim() || '/student',
            };

            const { data } = await apiClient.post('/announcements/notify-students', payload);

            setSuccessMessage(data.message || 'Notification sent successfully!');
            setTitle('');
            setMessage('');
            setLink('/student');
            fetchHistory();
        } catch (err: any) {
            setErrorMessage(err.response?.data?.message || 'Failed to send notification. Please try again.');
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
                <span className="text-xs font-bold text-slate-500">Loading...</span>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-16">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                            <Megaphone className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                Student Notifications & Announcements
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Send direct notifications and alerts to students by course, bundle, or platform-wide
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
                        Total Courses: {courses.length} | Bundles: {bundles.length}
                    </span>
                </div>
            </div>

            {/* Notification Form Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left 7 Cols: Form */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
                    {/* Alerts */}
                    {successMessage && (
                        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                            <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                                {successMessage}
                            </div>
                        </div>
                    )}

                    {errorMessage && (
                        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                            <div className="text-xs font-bold text-rose-800 dark:text-rose-300">
                                {errorMessage}
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSendNotification} className="space-y-6">
                        {/* 1. Target Audience Tabs */}
                        <div className="space-y-2.5">
                            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">
                                1. Target Audience <span className="text-rose-500">*</span>
                            </label>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setTargetType('course')}
                                    className={`p-3 rounded-2xl border text-left font-bold text-xs flex items-center gap-2.5 transition-all cursor-pointer ${targetType === 'course'
                                        ? 'bg-sky-50 dark:bg-sky-950/50 border-sky-500 text-sky-700 dark:text-sky-300 ring-2 ring-sky-500/20'
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                                        }`}
                                >
                                    <BookOpen className="w-4 h-4 text-sky-500" />
                                    <span>Course</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setTargetType('bundle')}
                                    className={`p-3 rounded-2xl border text-left font-bold text-xs flex items-center gap-2.5 transition-all cursor-pointer ${targetType === 'bundle'
                                        ? 'bg-sky-50 dark:bg-sky-950/50 border-sky-500 text-sky-700 dark:text-sky-300 ring-2 ring-sky-500/20'
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                                        }`}
                                >
                                    <Package className="w-4 h-4 text-indigo-500" />
                                    <span>Bundle</span>
                                </button>

                                {isAdmin && (
                                    <button
                                        type="button"
                                        onClick={() => setTargetType('all')}
                                        className={`p-3 rounded-2xl border text-left font-bold text-xs flex items-center gap-2.5 transition-all cursor-pointer ${targetType === 'all'
                                            ? 'bg-sky-50 dark:bg-sky-950/50 border-sky-500 text-sky-700 dark:text-sky-300 ring-2 ring-sky-500/20'
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                                            }`}
                                    >
                                        <Users className="w-4 h-4 text-emerald-500" />
                                        <span>All Students</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* 2. Target Dropdown Select */}
                        {targetType === 'course' && (
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Select Course <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={selectedCourseId || ''}
                                    onChange={(e) => setSelectedCourseId(Number(e.target.value))}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-sky-500"
                                >
                                    {courses.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.title} (Direct: {c.direct_students_count} | Total Reach: {c.total_reach_count})
                                        </option>
                                    ))}
                                </select>

                                {/* Course Bundle Inclusion Notice */}
                                {selectedCourse && (
                                    <div className="p-3.5 bg-sky-50/70 dark:bg-sky-950/30 rounded-2xl border border-sky-100 dark:border-sky-900/40 text-xs space-y-1.5">
                                        <div className="flex items-center gap-2 font-bold text-sky-800 dark:text-sky-300">
                                            <Info className="w-4 h-4 text-sky-600 shrink-0" />
                                            <span>Automatic Bundle Delivery Active</span>
                                        </div>
                                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                                            Active students in this course as well as all students in bundles containing this course will automatically receive this notification.
                                        </p>
                                        {selectedCourse.included_in_bundles?.length > 0 ? (
                                            <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                                                <span className="text-[10px] font-bold text-slate-500">Linked Bundles:</span>
                                                {selectedCourse.included_in_bundles.map(b => (
                                                    <span key={b.id} className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700">
                                                        {b.title}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-slate-400 block pt-0.5">
                                                (This course is currently not included in any bundle)
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {targetType === 'bundle' && (
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Select Bundle <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={selectedBundleId || ''}
                                    onChange={(e) => setSelectedBundleId(Number(e.target.value))}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-sky-500"
                                >
                                    {bundles.map(b => (
                                        <option key={b.id} value={b.id}>
                                            {b.title} (Courses: {b.courses_count} | Students: {b.total_reach_count})
                                        </option>
                                    ))}
                                </select>

                                {selectedBundle && (
                                    <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 text-xs">
                                        <span className="font-bold text-indigo-800 dark:text-indigo-300">
                                            Estimated Total Recipients: {selectedBundle.total_reach_count} students
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {targetType === 'all' && (
                            <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-2">
                                <Users className="w-4 h-4 text-emerald-600" />
                                <span>All registered platform students ({totalStudentsCount}) will receive this announcement.</span>
                            </div>
                        )}

                        {/* 3. Title */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                2. Notification Title <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Tomorrow's Physics Live Class & Assignment"
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-sky-500"
                            />
                        </div>

                        {/* 4. Message */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                3. Message Content <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={4}
                                placeholder="Write detailed announcements or instructions for students..."
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-sky-500 leading-relaxed"
                            />
                        </div>

                        {/* 5. Custom Link */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                4. Custom Link (Optional)
                            </label>
                            <input
                                type="text"
                                value={link}
                                onChange={(e) => setLink(e.target.value)}
                                placeholder="e.g. /student/my-courses or /courses/physics-hsc"
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-sky-500"
                            />
                            <p className="text-[11px] text-slate-400">
                                Students will be directed to this URL upon clicking the notification.
                            </p>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={sending}
                                className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                            >
                                {sending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Sending Notification...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        <span>Send Notification</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Right 5 Cols: Live Preview & Guidance */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Live Preview Box */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                            <Bell className="w-4 h-4 text-sky-600" />
                            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                                Student Notification Bar Preview
                            </h3>
                        </div>

                        {/* Dropdown preview item */}
                        <div className="p-4 rounded-2xl bg-[#f8fafc] dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-1.5 shadow-2xs">
                            <div className="flex items-center justify-between">
                                <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 text-[10px] font-bold">
                                    {targetType === 'course'
                                        ? selectedCourse?.title || 'Course'
                                        : targetType === 'bundle'
                                            ? selectedBundle?.title || 'Bundle'
                                            : 'All Students'}
                                </span>
                                <span className="text-[10px] text-slate-400">Just now</span>
                            </div>

                            <h4 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">
                                {title || 'Notification title will appear here'}
                            </h4>

                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                                {message || 'Detailed message content will appear in this preview...'}
                            </p>

                            <div className="pt-1 flex items-center gap-1 text-[11px] font-bold text-sky-600">
                                <span>Opens link:</span>
                                <span className="underline truncate max-w-[150px]">{link || '/student'}</span>
                            </div>
                        </div>

                        <p className="text-[11px] text-slate-400 leading-relaxed">
                            💡 When students visit the dashboard or website, a badge will appear on the top bar bell icon, allowing them to read this alert.
                        </p>
                    </div>

                    {/* How bundle delivery works card */}
                    <div className="bg-gradient-to-br from-indigo-50 to-sky-50 dark:from-indigo-950/40 dark:to-sky-950/40 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/40 space-y-3">
                        <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300 font-extrabold text-xs">
                            <Layers className="w-4 h-4 text-indigo-600" />
                            <span>Automated Bundle Recipient Propagation</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            When sending notifications to a specific course, the system automatically checks all bundles containing that course and delivers the alert to those students simultaneously.
                        </p>
                    </div>
                </div>
            </div>

            {/* History Section */}
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                        Recently Sent Notifications History
                    </h3>
                    <span className="text-xs text-slate-400">Latest 20 messages</span>
                </div>

                {loadingHistory ? (
                    <div className="py-8 text-center text-xs text-slate-400">Loading history...</div>
                ) : history.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 space-y-2">
                        <Megaphone className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">No notifications sent yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {history.map((item) => (
                            <div key={item.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-3 rounded-2xl transition-colors">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-[10px] font-bold">
                                            {item.target_title || item.target_type}
                                        </span>
                                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                                            {item.title}
                                        </h4>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 max-w-2xl">
                                        {item.message}
                                    </p>
                                </div>

                                <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 shrink-0">
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                                        Recipients: {item.recipients_count}
                                    </span>
                                    <span>{new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
export default NotifyStudentPage;
