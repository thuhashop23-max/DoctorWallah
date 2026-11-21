import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient, formatBDT, getImageUrl } from '../../api/client';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { 
    BookOpen, 
    PlayCircle, 
    Clock, 
    Bot, 
    Sparkles, 
    ShieldCheck, 
    ArrowRight, 
    Check, 
    AlertCircle, 
    Loader2,
    Copy,
    KeyRound,
    ExternalLink,
    MessageSquareWarning,
    Layers,
    GraduationCap
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';

export const StudentCoursesPage: React.FC = () => {
    const navigate = useNavigate();
    const { settings } = useSettings();
    const { user } = useAuth();

    const [coursesData, setCoursesData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Unlock Modal State
    const [unlockModalOpen, setUnlockModalOpen] = useState(false);
    const [selectedCourseForUnlock, setSelectedCourseForUnlock] = useState<any | null>(null);
    const [unlockPaymentMethod, setUnlockPaymentMethod] = useState<'manual_bkash' | 'manual_nagad' | 'manual_rocket'>('manual_bkash');
    const [unlockSenderPhone, setUnlockSenderPhone] = useState(user?.phone || '');
    const [unlockTrxId, setUnlockTrxId] = useState('');
    const [submittingUnlock, setSubmittingUnlock] = useState(false);
    const [unlockError, setUnlockError] = useState<string | null>(null);
    const [unlockSuccess, setUnlockSuccess] = useState<string | null>(null);
    const [copiedNumber, setCopiedNumber] = useState(false);
    const [copiedAccessKey, setCopiedAccessKey] = useState<string | null>(null);

    // Complain Box Modal State
    const [complaintModalOpen, setComplaintModalOpen] = useState(false);
    const [selectedCourseForComplaint, setSelectedCourseForComplaint] = useState<any | null>(null);
    const [complaintSubject, setComplaintSubject] = useState('');
    const [complaintMessage, setComplaintMessage] = useState('');
    const [submittingComplaint, setSubmittingComplaint] = useState(false);
    const [complaintSuccessMsg, setComplaintSuccessMsg] = useState<string | null>(null);
    const [complaintErrorMsg, setComplaintErrorMsg] = useState<string | null>(null);
    const [pastComplaints, setPastComplaints] = useState<any[]>([]);
    const [loadingPastComplaints, setLoadingPastComplaints] = useState(false);
    const [showPastComplaints, setShowPastComplaints] = useState(false);

    const handleOpenComplaintModal = async (course: any) => {
        setSelectedCourseForComplaint(course);
        setComplaintSubject('');
        setComplaintMessage('');
        setComplaintSuccessMsg(null);
        setComplaintErrorMsg(null);
        setShowPastComplaints(false);
        setComplaintModalOpen(true);
        fetchPastComplaints(course.id);
    };

    const fetchPastComplaints = async (courseId: number) => {
        try {
            setLoadingPastComplaints(true);
            const { data } = await apiClient.get(`/student/courses/${courseId}/complaints`);
            setPastComplaints(data.complaints || []);
        } catch {
            // ignore
        } finally {
            setLoadingPastComplaints(false);
        }
    };

    const handleSubmitComplaint = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCourseForComplaint) return;
        if (!complaintSubject.trim() || !complaintMessage.trim()) {
            setComplaintErrorMsg('Please fill in both subject and description.');
            return;
        }

        try {
            setSubmittingComplaint(true);
            setComplaintErrorMsg(null);
            setComplaintSuccessMsg(null);
            await apiClient.post('/student/complaints', {
                course_id: selectedCourseForComplaint.id,
                subject: complaintSubject.trim(),
                message: complaintMessage.trim(),
            });
            setComplaintSuccessMsg('Your complaint has been submitted successfully! The team will review it.');
            setComplaintSubject('');
            setComplaintMessage('');
            fetchPastComplaints(selectedCourseForComplaint.id);
        } catch (err: any) {
            setComplaintErrorMsg(err.response?.data?.message || 'Failed to submit complaint.');
        } finally {
            setSubmittingComplaint(false);
        }
    };

    const handleCopyAccessKey = (key: string) => {
        navigator.clipboard.writeText(key);
        setCopiedAccessKey(key);
        setTimeout(() => setCopiedAccessKey(null), 2000);
    };

    useEffect(() => {
        fetchMyCourses();
    }, []);

    const fetchMyCourses = async () => {
        try {
            const { data } = await apiClient.get('/student/my-courses');
            setCoursesData(data || []);
        } catch {}
        finally {
            setLoading(false);
        }
    };

    const handleOpenUnlock = async (item: any) => {
        setSelectedCourseForUnlock(item);
        setUnlockError(null);
        setUnlockSuccess(null);
        setUnlockSenderPhone(user?.phone || '');
        setUnlockTrxId('');

        // If pilot price is free (0 taka) or user is admin, unlock immediately!
        if ((Number(item.pilot_price) || 0) <= 0 || user?.role === 'admin') {
            try {
                const { data } = await apiClient.post(`/student/nexpilot/courses/${item.course.id}/unlock`);
                setCoursesData(prev => prev.map(c => c.course.id === item.course.id ? { ...c, has_nexpilot: true } : c));
                navigate(`/student/courses/${item.course.id}/nexpilot`);
            } catch (err: any) {
                alert(err.response?.data?.message || 'Failed to activate pilot.');
            }
            return;
        }

        // Open paid unlock modal
        setUnlockModalOpen(true);
    };

    const handleSubmitUnlockPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCourseForUnlock) return;

        setSubmittingUnlock(true);
        setUnlockError(null);

        try {
            const { data } = await apiClient.post(`/student/nexpilot/courses/${selectedCourseForUnlock.course.id}/unlock`, {
                payment_method: unlockPaymentMethod,
                transaction_ref: unlockTrxId.trim(),
                sender_phone: unlockSenderPhone.trim(),
            });

            setUnlockSuccess(data.message || 'Payment submitted successfully. It will be activated once verified.');
            setTimeout(() => {
                setUnlockModalOpen(false);
                fetchMyCourses();
            }, 3000);
        } catch (err: any) {
            setUnlockError(err.response?.data?.message || 'Failed to submit payment.');
        } finally {
            setSubmittingUnlock(false);
        }
    };

    const manualBkash = settings?.manual_payment_settings?.bkash?.account_number || '01700000000';
    const manualNagad = settings?.manual_payment_settings?.nagad?.account_number || '01700000000';
    const manualRocket = settings?.manual_payment_settings?.rocket?.account_number || '01700000000';

    const currentPayNumber = unlockPaymentMethod === 'manual_bkash' 
        ? manualBkash 
        : unlockPaymentMethod === 'manual_nagad' 
        ? manualNagad 
        : manualRocket;

    const handleCopyNumber = () => {
        navigator.clipboard.writeText(currentPayNumber);
        setCopiedNumber(true);
        setTimeout(() => setCopiedNumber(false), 2000);
    };

    if (loading) {
        return <div className="p-12 text-center text-slate-400">Loading courses...</div>;
    }

    return (
        <div className="space-y-6 max-w-7xl">
            <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">My Courses</h2>
                <p className="text-xs text-slate-500 mt-0.5">All your active courses and learning progress</p>
            </div>

            {coursesData.length === 0 ? (
                <div className="py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
                    <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <h4 className="font-bold text-slate-700">No courses found</h4>
                    <p className="text-xs">Enroll in a new course to get started.</p>
                    <Link
                        to="/courses"
                        className="inline-block mt-3 px-6 py-2.5 bg-sky-600 text-white font-bold text-xs rounded-xl shadow-md"
                    >
                        Browse Courses
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {coursesData.map((item) => {
                        const { course, total_lessons, completed_lessons, progress_percentage, last_lesson_id } = item;
                        return (
                            <div key={course.id} className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between">
                                <Link to={`/courses/${course.slug}`} className="block aspect-video bg-slate-900 relative group/thumb cursor-pointer overflow-hidden">
                                    {(course.thumbnail || (course as any).thumbnail_url) ? (
                                        <img
                                            src={getImageUrl(course.thumbnail || (course as any).thumbnail_url)}
                                            alt={course.title}
                                            className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                                            onError={(e) => {
                                                (e.currentTarget as HTMLElement).style.display = 'none';
                                                const fallback = (e.currentTarget.parentElement?.querySelector('.fallback-thumb') as HTMLElement);
                                                if (fallback) fallback.style.display = 'flex';
                                            }}
                                        />
                                    ) : null}
                                    <div className={`fallback-thumb w-full h-full ${(course.thumbnail || (course as any).thumbnail_url) ? 'hidden' : 'flex'} items-center justify-center text-white bg-slate-900`}>
                                        <BookOpen className="w-8 h-8 text-sky-400 opacity-60" />
                                    </div>
                                    <span className="absolute bottom-3 right-3 px-2 py-0.5 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold rounded">
                                        {total_lessons} Classes
                                    </span>
                                </Link>

                                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="font-bold text-slate-900 text-base line-clamp-2 flex-1">
                                                <Link
                                                    to={`/courses/${course.slug}`}
                                                    className="hover:text-sky-600 transition-colors cursor-pointer"
                                                >
                                                    {course.title}
                                                </Link>
                                            </h3>
                                            
                                            {item.has_nexpilot ? (
                                                <Link
                                                    to={`/student/courses/${course.id}/nexpilot`}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-sky-500 via-sky-600 to-sky-700 text-white text-[11px] font-bold rounded-lg shadow-xs hover:from-sky-600 hover:to-sky-800 shrink-0 transition-all hover:scale-105"
                                                    title="NexPilot AI Tutor"
                                                >
                                                    <Sparkles className="w-3 h-3 text-amber-300" />
                                                    <span>Pilot</span>
                                                </Link>
                                            ) : item.has_active_pilot ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenUnlock(item)}
                                                    className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                                                    title="Unlock NexPilot AI for this course"
                                                >
                                                    <Sparkles className="w-3 h-3 text-amber-600" />
                                                    <span>{item.pilot_price > 0 ? `+Pilot` : 'Free Pilot'}</span>
                                                </button>
                                            ) : null}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Instructor: {course.instructors?.map((i: any) => i.name).join(', ') || 'Expert Mentor'}
                                        </p>
                                        {item.is_instructor && (
                                            <div className="mt-1.5 flex items-center gap-1.5">
                                                <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-extrabold text-[10px] rounded-md border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                                                    <GraduationCap className="w-3 h-3 text-purple-600" />
                                                    Assigned Teacher
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Progress */}
                                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                                        <div className="flex justify-between text-xs font-bold">
                                            <span className="text-slate-500">Progress ({completed_lessons}/{total_lessons})</span>
                                            <span className="text-sky-600">{progress_percentage}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-sky-600 rounded-full"
                                                style={{ width: `${progress_percentage}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Primary Continue Learning Action */}
                                    {item.has_nexpilot ? (
                                        <div className="flex items-center gap-2 pt-1">
                                            <Link
                                                to={last_lesson_id 
                                                    ? `/learning/${course.id}/lessons/${last_lesson_id}` 
                                                    : `/courses/${course.slug}`}
                                                className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                                            >
                                                <PlayCircle className="w-4 h-4" />
                                                <span>Continue Learning</span>
                                            </Link>
                                            <Link
                                                to={`/student/courses/${course.id}/nexpilot`}
                                                className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors shrink-0 border border-slate-700"
                                                title="Open NexPilot AI Tutor Room"
                                            >
                                                <Bot className="w-4 h-4 text-sky-400" />
                                                <span>Pilot</span>
                                            </Link>
                                        </div>
                                    ) : item.has_active_pilot ? (
                                        <div className="flex items-center gap-2 pt-1">
                                            <Link
                                                to={last_lesson_id 
                                                    ? `/learning/${course.id}/lessons/${last_lesson_id}` 
                                                    : `/courses/${course.slug}`}
                                                className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                                            >
                                                <PlayCircle className="w-4 h-4" />
                                                <span>Continue Learning</span>
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => handleOpenUnlock(item)}
                                                className="px-3 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all shrink-0 cursor-pointer"
                                                title="Unlock NexPilot AI Tutor for this course"
                                            >
                                                <Sparkles className="w-3.5 h-3.5 text-white" />
                                                <span>{item.pilot_price > 0 ? 'Get Pilot' : 'Enable Free'}</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="pt-1">
                                            <Link
                                                to={last_lesson_id 
                                                    ? `/learning/${course.id}/lessons/${last_lesson_id}` 
                                                    : `/courses/${course.slug}`}
                                                className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                                            >
                                                <PlayCircle className="w-4 h-4" />
                                                <span>Continue Learning</span>
                                            </Link>
                                        </div>
                                    )}

                                    {/* Enrolled Action Buttons & Community Groups */}
                                    {item.is_instructor && (
                                        <div className="pt-1">
                                            <Link
                                                to={`/teacher/courses/${course.id}/builder`}
                                                className="w-full py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                                            >
                                                <Layers className="w-3.5 h-3.5 text-purple-200" />
                                                <span>Manage in Course Builder</span>
                                            </Link>
                                        </div>
                                    )}
                                    {course.enrolled_action_buttons && course.enrolled_action_buttons.length > 0 && (
                                        <div className="pt-3 border-t border-slate-100 space-y-2">
                                            {course.enrolled_action_buttons.some((b: any) => b.requires_access_key) && item.access_key && (
                                                <div className="p-2.5 bg-gradient-to-r from-indigo-50/90 via-sky-50/70 to-indigo-50/90 rounded-xl border border-indigo-200/80 flex items-center justify-between gap-2 shadow-2xs">
                                                    <div className="min-w-0 pr-1">
                                                        <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                                                            <KeyRound className="w-3 h-3 text-indigo-600 shrink-0" />
                                                            <span>Access Key:</span>
                                                        </div>
                                                        <div className="font-mono font-black text-xs sm:text-sm text-indigo-700 select-all truncate mt-0.5">
                                                            {item.access_key}
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopyAccessKey(item.access_key)}
                                                        className="px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer shrink-0 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs"
                                                        title="Copy Access Key"
                                                    >
                                                        {copiedAccessKey === item.access_key ? (
                                                            <span className="flex items-center gap-1 text-emerald-600 font-bold">
                                                                <Check className="w-3.5 h-3.5" /> Copied
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1">
                                                                <Copy className="w-3.5 h-3.5" /> Copy
                                                            </span>
                                                        )}
                                                    </button>
                                                </div>
                                            )}

                                            <div className="space-y-1.5">
                                                {course.enrolled_action_buttons.map((btn: any) => (
                                                    <a
                                                        key={btn.id}
                                                        href={btn.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={() => {
                                                            if (btn.requires_access_key && item.access_key) {
                                                                navigator.clipboard.writeText(item.access_key);
                                                            }
                                                        }}
                                                        className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all hover:scale-[1.01] cursor-pointer"
                                                    >
                                                        <ExternalLink className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                                        <span className="truncate">{btn.label}</span>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Complain Box Button - Always below learning and custom buttons */}
                                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <button
                                            type="button"
                                            onClick={() => handleOpenComplaintModal(course)}
                                            className="w-full py-2 px-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 hover:bg-rose-100/70 dark:hover:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                                        >
                                            <MessageSquareWarning className="w-3.5 h-3.5 text-rose-500" />
                                            <span>Complain Box</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Unlock NexPilot Payment Modal */}
            <Modal
                isOpen={unlockModalOpen}
                onClose={() => setUnlockModalOpen(false)}
                title="Unlock NexPilot AI Personal Tutor"
            >
                {selectedCourseForUnlock && (
                    <div className="space-y-4">
                        {/* Course & Pilot Overview Card */}
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50/70 via-amber-50/40 to-white border border-sky-100 flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <h4 className="font-bold text-sm text-slate-900 truncate">
                                        {selectedCourseForUnlock.course?.title}
                                    </h4>
                                    <span className="font-black text-sm text-sky-600 shrink-0">
                                        {formatBDT(selectedCourseForUnlock.pilot_price)}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                                    {selectedCourseForUnlock.pilot_title || 'NexPilot AI Learning Assistant'} — 24/7 personal AI tutor for theory explanations and problem solving.
                                </p>
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
                            <div className="flex items-center justify-between font-bold text-slate-900">
                                <span>Payment Instructions ({unlockPaymentMethod === 'manual_bkash' ? 'bKash' : unlockPaymentMethod === 'manual_nagad' ? 'Nagad' : 'Rocket'} Send Money):</span>
                                <button
                                    type="button"
                                    onClick={handleCopyNumber}
                                    className="inline-flex items-center gap-1 text-sky-600 font-bold hover:underline cursor-pointer"
                                >
                                    {copiedNumber ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                    <span>{copiedNumber ? 'Copied' : 'Copy Number'}</span>
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <span>Receiver Number:</span>
                                <strong className="font-mono text-sm text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                                    {currentPayNumber}
                                </strong>
                            </div>
                            <div>
                                Payable Amount: <strong className="text-slate-900">{formatBDT(selectedCourseForUnlock.pilot_price)}</strong>
                            </div>
                        </div>

                        {/* Error Alert */}
                        {unlockError && (
                            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium rounded-xl flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                <span>{unlockError}</span>
                            </div>
                        )}

                        {/* Success Alert */}
                        {unlockSuccess && (
                            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>{unlockSuccess}</span>
                            </div>
                        )}

                        {/* Submit Payment Form */}
                        <form onSubmit={handleSubmitUnlockPayment} className="space-y-3 pt-1">
                            {/* Method Selection */}
                            <div className="grid grid-cols-3 gap-2">
                                {(['manual_bkash', 'manual_nagad', 'manual_rocket'] as const).map((method) => {
                                    const isSelected = unlockPaymentMethod === method;
                                    const label = method === 'manual_bkash' ? 'bKash' : method === 'manual_nagad' ? 'Nagad' : 'Rocket';
                                    return (
                                        <button
                                            key={method}
                                            type="button"
                                            onClick={() => setUnlockPaymentMethod(method)}
                                            className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer font-bold text-xs ${
                                                isSelected 
                                                    ? 'border-sky-500 bg-sky-50/70 text-sky-700 shadow-2xs' 
                                                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Sender Mobile Number
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={unlockSenderPhone}
                                    onChange={(e) => setUnlockSenderPhone(e.target.value)}
                                    placeholder="017xxxxxxxx"
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Transaction ID (TrxID)
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={unlockTrxId}
                                    onChange={(e) => setUnlockTrxId(e.target.value)}
                                    placeholder="e.g. 9J3K8LQZ"
                                    className="w-full px-3.5 py-2.5 font-mono uppercase bg-slate-50 border border-slate-200 rounded-xl text-xs"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setUnlockModalOpen(false)}
                                    className="px-4 py-2 text-xs font-bold text-slate-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingUnlock}
                                    className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                                >
                                    <span>{submittingUnlock ? 'Submitting...' : 'Submit Payment'}</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </Modal>

            {/* Complain Box Modal */}
            <Modal
                isOpen={complaintModalOpen}
                onClose={() => setComplaintModalOpen(false)}
                title={`Complain Box: ${selectedCourseForComplaint?.title || 'Course'}`}
                maxWidth="md"
            >
                <div className="space-y-4">
                    {/* Header Note */}
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-start gap-2.5">
                        <MessageSquareWarning className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
                            Have an issue, grievance, or feedback regarding this course? Submit your complaint below. Our team and instructors will review and take necessary action.
                        </p>
                    </div>

                    {complaintSuccessMsg && (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs font-bold text-emerald-700 dark:text-emerald-300 rounded-xl flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-500" />
                            <span>{complaintSuccessMsg}</span>
                        </div>
                    )}

                    {complaintErrorMsg && (
                        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs font-bold text-rose-700 dark:text-rose-300 rounded-xl flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-rose-500" />
                            <span>{complaintErrorMsg}</span>
                        </div>
                    )}

                    {/* Toggle past complaints button if student has past complaints */}
                    {pastComplaints.length > 0 && (
                        <div className="flex items-center justify-between pb-1">
                            <button
                                type="button"
                                onClick={() => setShowPastComplaints(!showPastComplaints)}
                                className="text-xs font-bold text-[#25a2ee] hover:underline cursor-pointer"
                            >
                                {showPastComplaints ? 'Write New Complaint' : `View My Past Complaints (${pastComplaints.length})`}
                            </button>
                        </div>
                    )}

                    {showPastComplaints ? (
                        <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
                            {pastComplaints.map((item) => (
                                <div
                                    key={item.id}
                                    className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <h5 className="font-extrabold text-xs text-slate-900 dark:text-white">
                                            {item.subject}
                                        </h5>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                            item.status === 'resolved'
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : item.status === 'reviewed'
                                                ? 'bg-sky-100 text-sky-800'
                                                : 'bg-amber-100 text-amber-800'
                                        }`}>
                                            {item.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line">
                                        {item.message}
                                    </p>
                                    <span className="text-[10px] text-slate-400">
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <form onSubmit={handleSubmitComplaint} className="space-y-3.5">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Complaint Subject <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Video playback issue in Lesson 4, or schedule conflict"
                                    value={complaintSubject}
                                    onChange={(e) => setComplaintSubject(e.target.value)}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-rose-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Complaint Details / Description <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    rows={4}
                                    placeholder="Please describe your issue in detail so we can investigate and resolve it promptly..."
                                    value={complaintMessage}
                                    onChange={(e) => setComplaintMessage(e.target.value)}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:border-rose-500"
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setComplaintModalOpen(false)}
                                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingComplaint}
                                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                                >
                                    {submittingComplaint && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    <span>Submit Complaint</span>
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </Modal>
        </div>
    );
};

