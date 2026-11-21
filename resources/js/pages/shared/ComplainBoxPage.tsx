import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import {
    MessageSquareWarning,
    Search,
    BookOpen,
    Shield,
    User,
    Mail,
    Phone,
    Hash,
    Clock,
    CheckCircle2,
    AlertCircle,
    Loader2,
    X,
    Filter,
    Calendar,
    ChevronRight,
    MessageCircle,
    ArrowLeft
} from 'lucide-react';

interface StudentInfo {
    id: number | null;
    name: string;
    phone: string | null;
    email: string | null;
    registration_number: string | null;
    is_anonymous: boolean;
}

interface ComplaintItem {
    id: number;
    course_id: number;
    subject: string;
    message: string;
    status: 'pending' | 'reviewed' | 'resolved';
    admin_notes: string | null;
    resolved_at: string | null;
    created_at: string;
    student: StudentInfo;
}

interface CourseItem {
    id: number;
    title: string;
    slug: string;
    thumbnail: string | null;
    complaints_count: number;
    pending_complaints_count: number;
    resolved_complaints_count: number;
}

interface ComplainBoxPageProps {
    role?: 'admin' | 'teacher';
}

export const ComplainBoxPage: React.FC<ComplainBoxPageProps> = ({ role = 'admin' }) => {
    const [courses, setCourses] = useState<CourseItem[]>([]);
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAdmin, setIsAdmin] = useState(role === 'admin');

    // Selected course complaints modal/view
    const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);
    const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
    const [loadingComplaints, setLoadingComplaints] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'reviewed' | 'resolved'>('all');
    const [updatingComplaintId, setUpdatingComplaintId] = useState<number | null>(null);
    const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Notes editing for Admin
    const [editingNotesId, setEditingNotesId] = useState<number | null>(null);
    const [notesText, setNotesText] = useState('');
    const [savingNotes, setSavingNotes] = useState(false);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async (search = '') => {
        try {
            setLoadingCourses(true);
            const params = search ? { search } : {};
            const { data } = await apiClient.get('/complaints/courses', { params });
            setCourses(data.courses || []);
            if (typeof data.is_admin === 'boolean') {
                setIsAdmin(data.is_admin);
            }
        } catch {
            // ignore error
        } finally {
            setLoadingCourses(false);
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchCourses(searchQuery);
    };

    const handleOpenCourseComplaints = async (course: CourseItem) => {
        setSelectedCourse(course);
        setStatusFilter('all');
        setActionMsg(null);
        setEditingNotesId(null);
        await fetchComplaints(course.id, 'all');
    };

    const fetchComplaints = async (courseId: number, status = 'all') => {
        try {
            setLoadingComplaints(true);
            const params = status !== 'all' ? { status } : {};
            const { data } = await apiClient.get(`/complaints/courses/${courseId}`, { params });
            setComplaints(data.complaints || []);
            if (typeof data.is_admin === 'boolean') {
                setIsAdmin(data.is_admin);
            }
        } catch {
            // ignore error
        } finally {
            setLoadingComplaints(false);
        }
    };

    const handleStatusFilterChange = (status: 'all' | 'pending' | 'reviewed' | 'resolved') => {
        setStatusFilter(status);
        if (selectedCourse) {
            fetchComplaints(selectedCourse.id, status);
        }
    };

    const handleUpdateStatus = async (complaintId: number, newStatus: 'pending' | 'reviewed' | 'resolved') => {
        try {
            setUpdatingComplaintId(complaintId);
            setActionMsg(null);
            await apiClient.put(`/complaints/${complaintId}/status`, {
                status: newStatus,
            });
            // Update local state
            setComplaints((prev) =>
                prev.map((c) => (c.id === complaintId ? { ...c, status: newStatus } : c))
            );
            // Update course counters
            setCourses((prev) =>
                prev.map((c) => {
                    if (c.id === selectedCourse?.id) {
                        return {
                            ...c,
                            pending_complaints_count:
                                newStatus === 'pending'
                                    ? c.pending_complaints_count + 1
                                    : Math.max(0, c.pending_complaints_count - 1),
                            resolved_complaints_count:
                                newStatus === 'resolved'
                                    ? c.resolved_complaints_count + 1
                                    : Math.max(0, c.resolved_complaints_count - 1),
                        };
                    }
                    return c;
                })
            );
            setActionMsg({ type: 'success', text: `Status changed to ${newStatus}.` });
        } catch (err: any) {
            setActionMsg({
                type: 'error',
                text: err.response?.data?.message || 'Failed to update status.',
            });
        } finally {
            setUpdatingComplaintId(null);
        }
    };

    const handleSaveAdminNotes = async (complaintId: number) => {
        try {
            setSavingNotes(true);
            setActionMsg(null);
            const currentComplaint = complaints.find((c) => c.id === complaintId);
            if (!currentComplaint) return;

            await apiClient.put(`/complaints/${complaintId}/status`, {
                status: currentComplaint.status,
                admin_notes: notesText,
            });

            setComplaints((prev) =>
                prev.map((c) => (c.id === complaintId ? { ...c, admin_notes: notesText } : c))
            );
            setEditingNotesId(null);
            setActionMsg({ type: 'success', text: 'Internal resolution notes saved successfully.' });
        } catch (err: any) {
            setActionMsg({
                type: 'error',
                text: err.response?.data?.message || 'Failed to save notes.',
            });
        } finally {
            setSavingNotes(false);
        }
    };

    const filteredCourses = courses.filter((c) =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                        <MessageSquareWarning className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            Complain Box
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                            {isAdmin
                                ? 'View and manage all student complaints across all courses with full student identity.'
                                : 'View student complaints submitted for your assigned courses (Student identities are protected).'}
                        </p>
                    </div>
                </div>

                {isAdmin && (
                    <span className="self-start sm:self-auto px-3 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full text-xs font-bold border border-purple-200 dark:border-purple-800">
                        Admin View (Full Access)
                    </span>
                )}
                {!isAdmin && (
                    <span className="self-start sm:self-auto px-3 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-full text-xs font-bold border border-amber-200 dark:border-amber-800 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        Teacher View (Anonymous Mode)
                    </span>
                )}
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search courses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:border-rose-500"
                    />
                </form>

                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 self-end sm:self-auto">
                    <span>Total Courses: {courses.length}</span>
                </div>
            </div>

            {/* Courses Grid */}
            {loadingCourses ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
                    <span className="text-xs font-semibold text-slate-500">Loading courses...</span>
                </div>
            ) : filteredCourses.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
                    <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                        <BookOpen className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                        No Courses Found
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                        {searchQuery
                            ? 'No courses match your search criteria. Try a different search term.'
                            : 'There are no courses assigned or available to display in the Complain Box.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredCourses.map((course) => {
                        const hasPending = course.pending_complaints_count > 0;
                        return (
                            <div
                                key={course.id}
                                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow flex flex-col overflow-hidden"
                            >
                                {/* Course Top / Thumbnail */}
                                <div className="h-36 bg-slate-100 dark:bg-slate-800 relative overflow-hidden flex items-center justify-center">
                                    {course.thumbnail ? (
                                        <img
                                            src={course.thumbnail}
                                            alt={course.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <BookOpen className="w-12 h-12 text-slate-400 dark:text-slate-600" />
                                    )}
                                    {/* Pending Badge */}
                                    {hasPending && (
                                        <div className="absolute top-3 right-3 px-2.5 py-1 bg-amber-500 text-white text-[11px] font-black rounded-lg shadow-md flex items-center gap-1 animate-pulse">
                                            <AlertCircle className="w-3 h-3" />
                                            <span>{course.pending_complaints_count} Pending</span>
                                        </div>
                                    )}
                                </div>

                                {/* Course Body */}
                                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                                    <div className="space-y-2">
                                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white line-clamp-2 leading-snug">
                                            {course.title}
                                        </h3>

                                        <div className="flex flex-wrap items-center gap-2 text-xs">
                                            <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg border border-slate-200 dark:border-slate-700">
                                                {course.complaints_count} Total Complaints
                                            </span>
                                            {course.resolved_complaints_count > 0 && (
                                                <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold rounded-lg border border-emerald-200 dark:border-emerald-800">
                                                    {course.resolved_complaints_count} Resolved
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Button: Complain List */}
                                    <button
                                        type="button"
                                        onClick={() => handleOpenCourseComplaints(course)}
                                        className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer group"
                                    >
                                        <MessageCircle className="w-4 h-4 text-rose-200 group-hover:scale-110 transition-transform" />
                                        <span>Complain List ({course.complaints_count})</span>
                                        <ChevronRight className="w-3.5 h-3.5 text-rose-200" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Complaints Drawer / Modal for Selected Course */}
            {selectedCourse && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 shrink-0">
                            <div className="flex items-center gap-3 pr-4">
                                <button
                                    onClick={() => setSelectedCourse(null)}
                                    className="p-1.5 -ml-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                                    title="Back to courses"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white line-clamp-1">
                                            {selectedCourse.title}
                                        </h3>
                                        <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-extrabold text-[11px] rounded-md shrink-0">
                                            {complaints.length} Complaints
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {isAdmin
                                            ? 'Admin Review Mode - Showing student details'
                                            : 'Instructor View - Student identities are strictly anonymous'}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedCourse(null)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors shrink-0"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Status Filter Bar */}
                        <div className="px-5 sm:px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3 shrink-0">
                            <div className="flex items-center gap-1.5">
                                <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
                                {(['all', 'pending', 'reviewed', 'resolved'] as const).map((tab) => (
                                    <button
                                        key={tab}
                                        type="button"
                                        onClick={() => handleStatusFilterChange(tab)}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-colors ${
                                            statusFilter === tab
                                                ? 'bg-rose-600 text-white shadow-2xs'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            {/* Alert Msg */}
                            {actionMsg && (
                                <div
                                    className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                                        actionMsg.type === 'success'
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                            : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                                    }`}
                                >
                                    {actionMsg.type === 'success' ? (
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                    ) : (
                                        <AlertCircle className="w-3.5 h-3.5" />
                                    )}
                                    <span>{actionMsg.text}</span>
                                </div>
                            )}
                        </div>

                        {/* Complaints List Body */}
                        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
                            {loadingComplaints ? (
                                <div className="py-16 flex flex-col items-center justify-center gap-3">
                                    <Loader2 className="w-7 h-7 animate-spin text-rose-500" />
                                    <span className="text-xs font-semibold text-slate-500">
                                        Loading complaints...
                                    </span>
                                </div>
                            ) : complaints.length === 0 ? (
                                <div className="py-16 text-center space-y-2">
                                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                        No Complaints in This Filter
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        There are no {statusFilter !== 'all' ? statusFilter : ''} complaints registered for this course.
                                    </p>
                                </div>
                            ) : (
                                complaints.map((complaint) => {
                                    const isUpdating = updatingComplaintId === complaint.id;
                                    const isAnonymous = complaint.student.is_anonymous || !isAdmin;

                                    return (
                                        <div
                                            key={complaint.id}
                                            className="bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 space-y-3.5 transition-all"
                                        >
                                            {/* Top Row: Subject, Status Badge, Date */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                <div className="flex items-start sm:items-center gap-2">
                                                    <span
                                                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                            complaint.status === 'resolved'
                                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                                                : complaint.status === 'reviewed'
                                                                ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-300 dark:border-sky-800'
                                                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                                        }`}
                                                    >
                                                        {complaint.status}
                                                    </span>
                                                    <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                                                        {complaint.subject}
                                                    </h4>
                                                </div>

                                                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    <span>{new Date(complaint.created_at).toLocaleString()}</span>
                                                </div>
                                            </div>

                                            {/* Student Identity Section */}
                                            <div className="p-3 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60">
                                                {isAnonymous ? (
                                                    // Strictly Anonymous for Teachers
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                                                            <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                                                                    Anonymous Student
                                                                </span>
                                                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] font-bold rounded-md">
                                                                    Identity Hidden
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] text-slate-400">
                                                                Student identity is protected and only visible to system administrators.
                                                            </p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    // Full Student Details for Admin
                                                    <div className="space-y-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0">
                                                                <User className="w-3.5 h-3.5" />
                                                            </div>
                                                            <span className="text-xs font-black text-slate-900 dark:text-white">
                                                                {complaint.student.name}
                                                            </span>
                                                            {complaint.student.registration_number && (
                                                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-md flex items-center gap-1">
                                                                    <Hash className="w-3 h-3" />
                                                                    {complaint.student.registration_number}
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400 pl-9">
                                                            {complaint.student.email && (
                                                                <div className="flex items-center gap-1">
                                                                    <Mail className="w-3 h-3 text-slate-400" />
                                                                    <span>{complaint.student.email}</span>
                                                                </div>
                                                            )}
                                                            {complaint.student.phone && (
                                                                <div className="flex items-center gap-1">
                                                                    <Phone className="w-3 h-3 text-slate-400" />
                                                                    <span>{complaint.student.phone}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Complaint Message Body */}
                                            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                    Complaint Description
                                                </span>
                                                <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed font-medium">
                                                    {complaint.message}
                                                </p>
                                            </div>

                                            {/* Admin Notes Section (Admin Only) */}
                                            {isAdmin && (
                                                <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/40 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-300">
                                                            Internal Admin Notes
                                                        </span>
                                                        {editingNotesId !== complaint.id && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setEditingNotesId(complaint.id);
                                                                    setNotesText(complaint.admin_notes || '');
                                                                }}
                                                                className="text-[11px] font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 underline cursor-pointer"
                                                            >
                                                                {complaint.admin_notes ? 'Edit Notes' : '+ Add Note'}
                                                            </button>
                                                        )}
                                                    </div>

                                                    {editingNotesId === complaint.id ? (
                                                        <div className="space-y-2">
                                                            <textarea
                                                                rows={2}
                                                                value={notesText}
                                                                onChange={(e) => setNotesText(e.target.value)}
                                                                placeholder="Write internal notes or action taken..."
                                                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden"
                                                            />
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setEditingNotesId(null)}
                                                                    className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg"
                                                                >
                                                                    Cancel
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleSaveAdminNotes(complaint.id)}
                                                                    disabled={savingNotes}
                                                                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                                                                >
                                                                    {savingNotes && <Loader2 className="w-3 h-3 animate-spin" />}
                                                                    <span>Save Note</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-purple-900 dark:text-purple-200 italic font-medium">
                                                            {complaint.admin_notes || 'No internal notes added yet.'}
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {/* Action Bar: Change Status */}
                                            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                                                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <span>
                                                        {complaint.resolved_at
                                                            ? `Resolved on ${new Date(complaint.resolved_at).toLocaleDateString()}`
                                                            : 'Awaiting resolution'}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                                        Change Status:
                                                    </span>
                                                    <div className="flex items-center gap-1">
                                                        {(['pending', 'reviewed', 'resolved'] as const).map((st) => (
                                                            <button
                                                                key={st}
                                                                type="button"
                                                                disabled={isUpdating || complaint.status === st}
                                                                onClick={() => handleUpdateStatus(complaint.id, st)}
                                                                className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-colors cursor-pointer ${
                                                                    complaint.status === st
                                                                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 opacity-60 cursor-default'
                                                                        : st === 'resolved'
                                                                        ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                                                        : st === 'reviewed'
                                                                        ? 'bg-sky-50 hover:bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                                                                        : 'bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                                                } disabled:opacity-50`}
                                                            >
                                                                {st}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-5 sm:px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 flex items-center justify-between shrink-0">
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                Showing {complaints.length} complaint(s)
                            </span>
                            <button
                                type="button"
                                onClick={() => setSelectedCourse(null)}
                                className="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
