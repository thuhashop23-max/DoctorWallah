import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../../api/client';
import {
    Users,
    BookOpen,
    Boxes,
    Search,
    ArrowLeft,
    UserPlus,
    Download,
    Trash2,
    Phone,
    Mail,
    Calendar,
    CheckCircle2,
    AlertCircle,
    Loader2,
    X,
    ChevronRight,
    GraduationCap,
    Sparkles,
    Layers,
    Eye,
    Check,
    Send,
    ExternalLink,
    UserMinus,
    KeyRound,
    Copy
} from 'lucide-react';

interface TargetItem {
    id: number;
    type: 'course' | 'bundle';
    title: string;
    slug: string;
    thumbnail: string | null;
    price: number;
    regular_price: number;
    sale_price: number | null;
    status: string;
    category?: { id: number; name: string } | null;
    courses_count?: number;
    courses?: { id: number; title: string }[];
    enrollments_count: number;
}

interface StudentRecord {
    enrollment_id: number;
    user_id: number;
    user: {
        id: number;
        name: string;
        phone: string | null;
        email: string | null;
        registration_number?: string | null;
        status?: string;
    };
    enrolled_at: string;
    status: string;
    access_key?: string | null;
    order_number?: string | null;
    payment_method?: string | null;
}

interface SearchUserItem {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
    role: string;
    status: string;
    is_enrolled?: boolean;
}

export const AdminCourseStudentsPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    // View state
    const targetTypeParam = (searchParams.get('type') as 'course' | 'bundle') || 'course';
    const targetIdParam = searchParams.get('id') ? Number(searchParams.get('id')) : null;

    // Targets list state
    const [targets, setTargets] = useState<TargetItem[]>([]);
    const [loadingTargets, setLoadingTargets] = useState(true);
    const [targetFilter, setTargetFilter] = useState<'all' | 'course' | 'bundle'>('all');
    const [targetSearch, setTargetSearch] = useState('');

    // Selected target drill-down state
    const [selectedTarget, setSelectedTarget] = useState<TargetItem | null>(null);
    const [students, setStudents] = useState<StudentRecord[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [studentSearch, setStudentSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({
        total: 0,
        current_page: 1,
        last_page: 1,
        per_page: 50,
    });
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    const handleCopyKey = (key: string) => {
        navigator.clipboard.writeText(key);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    // Bulk selection & Revoke state
    const [selectedEnrollmentIds, setSelectedEnrollmentIds] = useState<number[]>([]);
    const [selectAllAcrossPages, setSelectAllAcrossPages] = useState<boolean>(false);
    const [revokeModalOpen, setRevokeModalOpen] = useState(false);
    const [revokingTarget, setRevokingTarget] = useState<{
        student?: StudentRecord;
        isBulk?: boolean;
        selectAllPages?: boolean;
    } | null>(null);
    const [isRevoking, setIsRevoking] = useState(false);

    // Manual Enroll Modal state
    const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
    const [modalTarget, setModalTarget] = useState<TargetItem | null>(null);
    const [enrollTab, setEnrollTab] = useState<'search' | 'bulk'>('search');
    const [userQuery, setUserQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchUserItem[]>([]);
    const [searchingUsers, setSearchingUsers] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<SearchUserItem[]>([]);
    const [bulkPhones, setBulkPhones] = useState('');
    const [verifyingPhones, setVerifyingPhones] = useState(false);
    const [unmatchedPhones, setUnmatchedPhones] = useState<string[]>([]);
    const [sendSms, setSendSms] = useState(false);
    const [enrollNotes, setEnrollNotes] = useState('');
    const [submittingEnroll, setSubmittingEnroll] = useState(false);

    // Initial Load of Targets
    useEffect(() => {
        fetchTargets();
    }, []);

    // When targetId in URL changes, load drill-down students
    useEffect(() => {
        if (targetIdParam) {
            fetchTargetStudents(targetTypeParam, targetIdParam, currentPage, studentSearch);
        } else {
            setSelectedTarget(null);
            setStudents([]);
        }
    }, [targetIdParam, targetTypeParam, currentPage, studentSearch]);

    const fetchTargets = async () => {
        setLoadingTargets(true);
        try {
            const { data } = await apiClient.get('/admin/manual-enrollment/targets');
            const items: TargetItem[] = data.targets || [];
            setTargets(items);

            // If URL already has targetId, find the target object
            if (targetIdParam) {
                const found = items.find(t => t.id === targetIdParam && t.type === targetTypeParam);
                if (found) {
                    setSelectedTarget(found);
                }
            }
        } catch (err) {
            console.error('Failed to load targets', err);
        } finally {
            setLoadingTargets(false);
        }
    };

    const fetchTargetStudents = async (
        type: 'course' | 'bundle',
        id: number,
        page = 1,
        query = ''
    ) => {
        setLoadingStudents(true);
        try {
            const params = new URLSearchParams();
            params.append('page', String(page));
            params.append('per_page', '50');
            if (query.trim()) params.append('q', query.trim());

            const { data } = await apiClient.get(
                `/admin/manual-enrollment/targets/${type}/${id}/students?${params.toString()}`
            );

            if (data.target) {
                setSelectedTarget(prev => ({
                    ...(prev || {}),
                    ...data.target,
                    enrollments_count: data.target.total_students,
                } as TargetItem));
            }

            setStudents(data.students || []);
            if (data.pagination) {
                setPagination(data.pagination);
            }
        } catch (err: any) {
            console.error('Failed to load students', err);
            alert(err.response?.data?.message || 'Failed to load student list for this course.');
        } finally {
            setLoadingStudents(false);
        }
    };

    const handleSelectTarget = (target: TargetItem) => {
        setSelectedTarget(target);
        setCurrentPage(1);
        setStudentSearch('');
        setSelectedEnrollmentIds([]);
        setSelectAllAcrossPages(false);
        setSearchParams({ type: target.type, id: String(target.id) });
    };

    const handleBackToTargets = () => {
        setSelectedTarget(null);
        setStudents([]);
        setStudentSearch('');
        setCurrentPage(1);
        setSelectedEnrollmentIds([]);
        setSelectAllAcrossPages(false);
        setSearchParams({});
    };

    // Filtered targets
    const displayedTargets = useMemo(() => {
        return targets.filter(t => {
            const matchesType = targetFilter === 'all' || t.type === targetFilter;
            const searchLower = targetSearch.toLowerCase().trim();
            const matchesSearch = !searchLower ||
                t.title.toLowerCase().includes(searchLower) ||
                (t.category?.name && t.category.name.toLowerCase().includes(searchLower));
            return matchesType && matchesSearch;
        });
    }, [targets, targetFilter, targetSearch]);

    // Selection helpers
    const isAllPageSelected = students.length > 0 && students.every(s => selectedEnrollmentIds.includes(s.enrollment_id));
    const isSomePageSelected = students.some(s => selectedEnrollmentIds.includes(s.enrollment_id)) && !isAllPageSelected;

    const handleToggleSelectAllPage = () => {
        if (isAllPageSelected || selectAllAcrossPages) {
            setSelectedEnrollmentIds([]);
            setSelectAllAcrossPages(false);
        } else {
            setSelectedEnrollmentIds(students.map(s => s.enrollment_id));
            setSelectAllAcrossPages(false);
        }
    };

    const handleToggleSelectOne = (enrollmentId: number) => {
        setSelectAllAcrossPages(false);
        setSelectedEnrollmentIds(prev =>
            prev.includes(enrollmentId)
                ? prev.filter(id => id !== enrollmentId)
                : [...prev, enrollmentId]
        );
    };

    const handleSelectAllAcrossPages = () => {
        setSelectAllAcrossPages(true);
        setSelectedEnrollmentIds(students.map(s => s.enrollment_id));
    };

    const handleClearSelection = () => {
        setSelectedEnrollmentIds([]);
        setSelectAllAcrossPages(false);
    };

    // Open Single Revoke Modal
    const handleOpenSingleRevoke = (student: StudentRecord) => {
        setRevokingTarget({
            student,
            isBulk: false,
            selectAllPages: false,
        });
        setRevokeModalOpen(true);
    };

    // Open Bulk Revoke Modal
    const handleOpenBulkRevoke = () => {
        if (selectedEnrollmentIds.length === 0 && !selectAllAcrossPages) return;
        setRevokingTarget({
            isBulk: true,
            selectAllPages: selectAllAcrossPages,
        });
        setRevokeModalOpen(true);
    };

    // Confirm Revoke (Single or Bulk)
    const handleConfirmRevoke = async () => {
        if (!selectedTarget || !revokingTarget) return;
        setIsRevoking(true);

        try {
            if (!revokingTarget.isBulk && revokingTarget.student) {
                // Single student revoke
                await apiClient.delete(`/admin/manual-enrollment/enrollment/${revokingTarget.student.enrollment_id}`);
                alert(`"${revokingTarget.student.user.name}" has been successfully removed from the course.`);
            } else {
                // Bulk revoke
                const selectedStudents = students.filter(s => selectedEnrollmentIds.includes(s.enrollment_id));
                const userIds = selectedStudents.map(s => s.user_id);

                const payload: any = {
                    target_type: selectedTarget.type,
                    target_id: selectedTarget.id,
                    remove_all: Boolean(revokingTarget.selectAllPages),
                };

                if (!revokingTarget.selectAllPages) {
                    payload.enrollment_ids = selectedEnrollmentIds;
                    payload.user_ids = userIds;
                }

                const { data } = await apiClient.post('/admin/manual-enrollment/bulk-remove', payload);
                alert(data.message || 'Selected students have been successfully removed from the course.');
            }

            setRevokeModalOpen(false);
            setRevokingTarget(null);
            setSelectedEnrollmentIds([]);
            setSelectAllAcrossPages(false);

            // Refresh student list & targets
            await fetchTargetStudents(selectedTarget.type, selectedTarget.id, currentPage, studentSearch);
            fetchTargets();
        } catch (err: any) {
            console.error('Revoke failed', err);
            alert(err.response?.data?.message || 'Failed to remove student(s) from the course.');
        } finally {
            setIsRevoking(false);
        }
    };

    // Export CSV
    const handleExportCSV = () => {
        if (!selectedTarget || students.length === 0) {
            alert('No student data available to download.');
            return;
        }

        const headers = ['#', 'Name', 'Phone', 'Email', 'Registration Roll', 'Enrolled At', 'Status', 'Order Number'];
        const rows = students.map((s, idx) => [
            (currentPage - 1) * pagination.per_page + idx + 1,
            `"${(s.user.name || '').replace(/"/g, '""')}"`,
            `"${s.user.phone || ''}"`,
            `"${s.user.email || ''}"`,
            `"${s.user.registration_number || ''}"`,
            `"${new Date(s.enrolled_at).toLocaleString('en-US')}"`,
            `"${s.status}"`,
            `"${s.order_number || 'N/A'}"`,
        ]);

        const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${selectedTarget.title}-Students-${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Open Manual Enrollment Modal
    const handleOpenEnrollModal = (target: TargetItem) => {
        setModalTarget(target);
        setSelectedUsers([]);
        setUserQuery('');
        setSearchResults([]);
        setBulkPhones('');
        setUnmatchedPhones([]);
        setSendSms(false);
        setEnrollNotes('');
        setIsEnrollModalOpen(true);
    };

    // Search Users for Enrollment
    const handleSearchUsers = async (q: string) => {
        setUserQuery(q);
        if (!q.trim() || q.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        setSearchingUsers(true);
        try {
            const { data } = await apiClient.get('/admin/manual-enrollment/search-users', {
                params: {
                    q: q.trim(),
                    target_type: modalTarget?.type,
                    target_id: modalTarget?.id,
                }
            });
            setSearchResults(data.users || []);
        } catch (err) {
            console.error('Failed to search users', err);
        } finally {
            setSearchingUsers(false);
        }
    };

    // Toggle Select User
    const handleToggleUser = (user: SearchUserItem) => {
        if (selectedUsers.some(u => u.id === user.id)) {
            setSelectedUsers(prev => prev.filter(u => u.id !== user.id));
        } else {
            setSelectedUsers(prev => [...prev, user]);
        }
    };

    // Lookup Bulk Phones
    const handleLookupPhones = async () => {
        if (!bulkPhones.trim()) {
            alert('Please enter or paste mobile numbers.');
            return;
        }

        setVerifyingPhones(true);
        try {
            const { data } = await apiClient.post('/admin/manual-enrollment/lookup-phones', {
                phones: bulkPhones,
                target_type: modalTarget?.type,
                target_id: modalTarget?.id,
            });

            const matched: SearchUserItem[] = data.matched_users || [];
            setUnmatchedPhones(data.unmatched_phones || []);

            // Add matched users into selected users avoiding duplicates
            setSelectedUsers(prev => {
                const existingIds = new Set(prev.map(u => u.id));
                const newOnes = matched.filter(u => !existingIds.has(u.id));
                return [...prev, ...newOnes];
            });

            if (matched.length > 0) {
                alert(`${matched.length} students found in the system and added!`);
            } else {
                alert('No registered students found matching the provided numbers.');
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to verify mobile numbers.');
        } finally {
            setVerifyingPhones(false);
        }
    };

    // Submit Enrollment
    const handleSubmitEnroll = async () => {
        if (!modalTarget) return;

        if (selectedUsers.length === 0) {
            alert('Please select at least one student.');
            return;
        }

        setSubmittingEnroll(true);
        try {
            const { data } = await apiClient.post('/admin/manual-enrollment/enroll', {
                target_type: modalTarget.type,
                target_id: modalTarget.id,
                user_ids: selectedUsers.map(u => u.id),
                send_sms: sendSms,
                notes: enrollNotes,
            });

            alert(`Successfully enrolled ${data.enrolled_count || selectedUsers.length} students!`);
            setIsEnrollModalOpen(false);

            // Refresh targets count
            fetchTargets();

            // If currently viewing this target's students, refresh students list
            if (selectedTarget && selectedTarget.id === modalTarget.id && selectedTarget.type === modalTarget.type) {
                fetchTargetStudents(modalTarget.type, modalTarget.id, 1, studentSearch);
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to enroll students.');
        } finally {
            setSubmittingEnroll(false);
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* VIEW 1: DRILL-DOWN ENROLLED STUDENTS LIST */}
            {selectedTarget ? (
                <div className="space-y-6">
                    {/* Back Button & Target Header Banner */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <button
                            type="button"
                            onClick={handleBackToTargets}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 font-semibold text-sm transition-all shadow-xs"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back to All Courses</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleOpenEnrollModal(selectedTarget)}
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-md shadow-sky-600/20 transition-all"
                        >
                            <UserPlus className="w-4 h-4" />
                            <span>+ Enroll Student</span>
                        </button>
                    </div>

                    {/* Course / Bundle Info Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                            {selectedTarget.thumbnail ? (
                                <img
                                    src={selectedTarget.thumbnail}
                                    alt={selectedTarget.title}
                                    className="w-24 h-16 sm:w-28 sm:h-20 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                                />
                            ) : (
                                <div className="w-24 h-16 sm:w-28 sm:h-20 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-inner">
                                    {selectedTarget.type === 'bundle' ? <Boxes className="w-8 h-8" /> : <BookOpen className="w-8 h-8" />}
                                </div>
                            )}

                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2.5 mb-2">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${selectedTarget.type === 'bundle'
                                        ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                        : 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                                        }`}>
                                        {selectedTarget.type === 'bundle' ? 'Combo Bundle' : 'Course'}
                                    </span>
                                    {selectedTarget.category && (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                            {selectedTarget.category.name}
                                        </span>
                                    )}
                                </div>

                                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">
                                    {selectedTarget.title}
                                </h1>

                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-4">
                                    <span className="inline-flex items-center gap-1.5 font-bold text-sky-600 dark:text-sky-400">
                                        <Users className="w-4 h-4" />
                                        Total {pagination.total || selectedTarget.enrollments_count || 0} Students
                                    </span>
                                    {selectedTarget.courses_count ? (
                                        <span>• {selectedTarget.courses_count} Courses included</span>
                                    ) : null}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Students List Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                        {/* Search & Actions Bar */}
                        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="relative flex-1 max-w-md">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={studentSearch}
                                    onChange={(e) => {
                                        setStudentSearch(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    placeholder="Student name, phone, email or roll..."
                                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                                />
                                {studentSearch && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStudentSearch('');
                                            setCurrentPage(1);
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                {students.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleToggleSelectAllPage}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-bold transition-all cursor-pointer"
                                    >
                                        <Check className="w-4 h-4 text-sky-500" />
                                        <span>{isAllPageSelected || selectAllAcrossPages ? 'Deselect All' : 'Select All'}</span>
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={handleExportCSV}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-bold transition-all"
                                >
                                    <Download className="w-4 h-4 text-slate-500" />
                                    <span>Download CSV</span>
                                </button>
                            </div>
                        </div>

                        {/* Bulk Actions Banner */}
                        {(selectedEnrollmentIds.length > 0 || selectAllAcrossPages) && (
                            <div className="mx-5 sm:mx-6 mt-4 p-4 rounded-2xl bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                                        {selectAllAcrossPages ? pagination.total : selectedEnrollmentIds.length}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                                            {selectAllAcrossPages
                                                ? `All (${pagination.total}) students in this course selected`
                                                : `${selectedEnrollmentIds.length} students selected`}
                                        </p>
                                        {!selectAllAcrossPages && pagination.total > students.length && isAllPageSelected && (
                                            <button
                                                type="button"
                                                onClick={handleSelectAllAcrossPages}
                                                className="text-xs text-sky-600 dark:text-sky-400 font-semibold underline hover:text-sky-700 cursor-pointer block mt-0.5"
                                            >
                                                Select all {pagination.total} students across all pages in this course? Click here
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 justify-end">
                                    <button
                                        type="button"
                                        onClick={handleClearSelection}
                                        className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                    >
                                        Clear Selection
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleOpenBulkRevoke}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm hover:shadow transition-all cursor-pointer"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Remove from Course ({selectAllAcrossPages ? pagination.total : selectedEnrollmentIds.length})</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Table */}
                        {loadingStudents ? (
                            <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
                                <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
                                <p className="text-sm font-semibold">Loading students list...</p>
                            </div>
                        ) : students.length === 0 ? (
                            <div className="py-20 text-center px-4">
                                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-4">
                                    <Users className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                                    {studentSearch ? 'No students found' : 'No students in this course yet'}
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                                    {studentSearch ? 'Try searching with another name, phone number, or roll.' : 'Click Enroll Student button to add students manually.'}
                                </p>
                                {!studentSearch && (
                                    <button
                                        type="button"
                                        onClick={() => handleOpenEnrollModal(selectedTarget)}
                                        className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-all"
                                    >
                                        <UserPlus className="w-4 h-4" />
                                        <span>Enroll Student</span>
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-850/50 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                                            <th className="py-3.5 px-4 w-10 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isAllPageSelected || selectAllAcrossPages}
                                                    onChange={handleToggleSelectAllPage}
                                                    className="w-4 h-4 rounded-sm text-sky-600 focus:ring-sky-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                                                    title="Select all students on this page"
                                                />
                                            </th>
                                            <th className="py-3.5 px-3 w-12 text-center">#</th>
                                            <th className="py-3.5 px-4">Student</th>
                                            <th className="py-3.5 px-4">Contact</th>
                                            <th className="py-3.5 px-4">Registration Roll</th>
                                            <th className="py-3.5 px-4">Access Key</th>
                                            <th className="py-3.5 px-4">Enrolled Date</th>
                                            <th className="py-3.5 px-4">Status</th>
                                            <th className="py-3.5 px-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                                        {students.map((student, idx) => {
                                            const serialNo = (currentPage - 1) * pagination.per_page + idx + 1;
                                            const isRowSelected = selectAllAcrossPages || selectedEnrollmentIds.includes(student.enrollment_id);
                                            return (
                                                <tr
                                                    key={student.enrollment_id}
                                                    className={`transition-colors ${isRowSelected
                                                        ? 'bg-sky-50/70 dark:bg-sky-950/40 hover:bg-sky-50 dark:hover:bg-sky-950/60'
                                                        : 'hover:bg-slate-50/60 dark:hover:bg-slate-850/40'
                                                        }`}
                                                >
                                                    <td className="py-3.5 px-4 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={isRowSelected}
                                                            onChange={() => handleToggleSelectOne(student.enrollment_id)}
                                                            className="w-4 h-4 rounded-sm text-sky-600 focus:ring-sky-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                                                        />
                                                    </td>
                                                    <td className="py-3.5 px-3 text-center font-bold text-xs text-slate-400">
                                                        {serialNo}
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
                                                                {student.user.name?.charAt(0)?.toUpperCase() || 'S'}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="font-bold text-slate-900 dark:text-white truncate">
                                                                    {student.user.name}
                                                                </div>
                                                                <div className="text-xs text-slate-400">
                                                                    ID: #{student.user_id}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <div className="space-y-0.5 text-xs">
                                                            {student.user.phone ? (
                                                                <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                                                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                                                                    <span>{student.user.phone}</span>
                                                                </div>
                                                            ) : null}
                                                            {student.user.email ? (
                                                                <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate">
                                                                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                                    <span className="truncate">{student.user.email}</span>
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                            {student.user.registration_number || `ME-2026-${student.user_id}`}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        {student.access_key ? (
                                                            <div className="inline-flex items-center gap-1.5 bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800/60 px-2.5 py-1 rounded-lg">
                                                                <KeyRound className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                                                                <span className="font-mono font-bold text-xs text-sky-700 dark:text-sky-300 select-all">
                                                                    {student.access_key}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleCopyKey(student.access_key!)}
                                                                    className="p-1 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors text-slate-500 hover:text-sky-600 cursor-pointer"
                                                                    title="Copy Access Key"
                                                                >
                                                                    {copiedKey === student.access_key ? (
                                                                        <Check className="w-3 h-3 text-emerald-600" />
                                                                    ) : (
                                                                        <Copy className="w-3 h-3" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-slate-400 font-mono">—</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                        {new Date(student.enrolled_at).toLocaleDateString('en-US', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric',
                                                        })}
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            <span>Active</span>
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenSingleRevoke(student)}
                                                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-800 transition-all cursor-pointer"
                                                            title="Remove student from course"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                            <span>Remove</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination Bar */}
                        {pagination.last_page > 1 && (
                            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 text-xs text-slate-500">
                                <div>
                                    Page {pagination.current_page} of {pagination.last_page} (Total {pagination.total})
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        disabled={currentPage <= 1 || loadingStudents}
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 font-semibold hover:bg-slate-50 transition-all"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        type="button"
                                        disabled={currentPage >= pagination.last_page || loadingStudents}
                                        onClick={() => setCurrentPage(prev => prev + 1)}
                                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 font-semibold hover:bg-slate-50 transition-all"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* VIEW 2: ALL COURSES & BUNDLES LIST (MAIN VIEW) */
                <div className="space-y-6">
                    {/* Header Banner */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 text-xs font-black uppercase tracking-wider">
                                <GraduationCap className="w-4 h-4" />
                                <span>Course Student Management</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                                Student List & Enrollment
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                Click any course to view its complete student list or manually enroll new students.
                            </p>
                        </div>
                    </div>

                    {/* Filter Tabs & Search Bar */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Tabs */}
                        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
                            <button
                                type="button"
                                onClick={() => setTargetFilter('all')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${targetFilter === 'all'
                                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                All ({targets.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setTargetFilter('course')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${targetFilter === 'course'
                                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                Courses ({targets.filter(t => t.type === 'course').length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setTargetFilter('bundle')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${targetFilter === 'bundle'
                                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                Combo Bundles ({targets.filter(t => t.type === 'bundle').length})
                            </button>
                        </div>

                        {/* Search Input */}
                        <div className="relative w-full md:w-80">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={targetSearch}
                                onChange={(e) => setTargetSearch(e.target.value)}
                                placeholder="Search course or bundle..."
                                className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                            />
                            {targetSearch && (
                                <button
                                    type="button"
                                    onClick={() => setTargetSearch('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Targets Grid */}
                    {loadingTargets ? (
                        <div className="py-24 flex flex-col items-center justify-center text-slate-400 space-y-3">
                            <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
                            <p className="text-sm font-semibold">Loading courses and bundles...</p>
                        </div>
                    ) : displayedTargets.length === 0 ? (
                        <div className="py-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center p-8">
                            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-4">
                                <BookOpen className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                                No courses or bundles found
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                                Try changing your filter or search keywords.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {displayedTargets.map((target) => {
                                const isBundle = target.type === 'bundle';
                                return (
                                    <div
                                        key={`${target.type}-${target.id}`}
                                        className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden"
                                    >
                                        {/* Card Header Thumbnail */}
                                        <div className="relative h-44 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                            {target.thumbnail ? (
                                                <img
                                                    src={target.thumbnail}
                                                    alt={target.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center text-white">
                                                    {isBundle ? (
                                                        <Boxes className="w-12 h-12 opacity-50" />
                                                    ) : (
                                                        <BookOpen className="w-12 h-12 opacity-50" />
                                                    )}
                                                </div>
                                            )}

                                            {/* Type Badge */}
                                            <div className="absolute top-3 left-3 flex items-center gap-2">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-md ${isBundle
                                                    ? 'bg-purple-600 text-white'
                                                    : 'bg-sky-600 text-white'
                                                    }`}>
                                                    {isBundle ? 'Combo Bundle' : 'Course'}
                                                </span>
                                                {target.category?.name && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-900/80 text-white backdrop-blur-xs">
                                                        {target.category.name}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Student Count Badge Overlay */}
                                            <div className="absolute bottom-3 right-3">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-white/95 dark:bg-slate-900/95 text-sky-700 dark:text-sky-300 backdrop-blur-xs shadow-md">
                                                    <Users className="w-3.5 h-3.5 text-sky-500" />
                                                    <span>{target.enrollments_count || 0} Students</span>
                                                </span>
                                            </div>
                                        </div>

                                        {/* Card Body */}
                                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                            <div>
                                                <h3 className="text-base font-black text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                                                    {target.title}
                                                </h3>
                                                {isBundle && target.courses_count ? (
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                                        <Layers className="w-3.5 h-3.5" />
                                                        <span>{target.courses_count} Courses included</span>
                                                    </p>
                                                ) : null}
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSelectTarget(target)}
                                                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-600 text-sky-700 dark:text-sky-300 hover:text-white font-bold text-xs transition-all border border-sky-200/80 dark:border-sky-800"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    <span>Student List</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenEnrollModal(target)}
                                                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all shrink-0"
                                                    title="Manually enroll new student into this course"
                                                >
                                                    <UserPlus className="w-4 h-4" />
                                                    <span>Enroll</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* MANUAL ENROLLMENT MODAL */}
            {isEnrollModalOpen && modalTarget && (
                <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden shadow-2xl">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 mb-1">
                                    {modalTarget.type === 'bundle' ? 'Bundle Enrollment' : 'Course Enrollment'}
                                </span>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white truncate">
                                    {modalTarget.title}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsEnrollModalOpen(false)}
                                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Tabs */}
                        <div className="px-6 pt-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4 text-xs font-bold">
                            <button
                                type="button"
                                onClick={() => setEnrollTab('search')}
                                className={`pb-3 border-b-2 transition-all ${enrollTab === 'search'
                                    ? 'border-sky-600 text-sky-600 dark:text-sky-400'
                                    : 'border-transparent text-slate-400 hover:text-slate-700'
                                    }`}
                            >
                                Search & Select Students
                            </button>
                            <button
                                type="button"
                                onClick={() => setEnrollTab('bulk')}
                                className={`pb-3 border-b-2 transition-all ${enrollTab === 'bulk'
                                    ? 'border-sky-600 text-sky-600 dark:text-sky-400'
                                    : 'border-transparent text-slate-400 hover:text-slate-700'
                                    }`}
                            >
                                Bulk Mobile Numbers
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                            {enrollTab === 'search' ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                            Search Student (Name, Phone or Email)
                                        </label>
                                        <div className="relative">
                                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="text"
                                                value={userQuery}
                                                onChange={(e) => handleSearchUsers(e.target.value)}
                                                placeholder="e.g. 01712..., John..."
                                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Search Results Dropdown */}
                                    {searchingUsers ? (
                                        <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin text-sky-500" />
                                            <span>Searching...</span>
                                        </div>
                                    ) : searchResults.length > 0 ? (
                                        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 max-h-48 overflow-y-auto bg-slate-50/50 dark:bg-slate-850">
                                            {searchResults.map(user => {
                                                const isSelected = selectedUsers.some(u => u.id === user.id);
                                                return (
                                                    <div
                                                        key={user.id}
                                                        onClick={() => handleToggleUser(user)}
                                                        className={`p-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-sky-50/60 dark:hover:bg-slate-800 transition-colors ${isSelected ? 'bg-sky-50 dark:bg-sky-950/40' : ''
                                                            }`}
                                                    >
                                                        <div className="min-w-0">
                                                            <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                                                {user.name}
                                                            </div>
                                                            <div className="text-[11px] text-slate-500">
                                                                {user.phone || user.email}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            {user.is_enrolled && (
                                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                                                    Already Enrolled
                                                                </span>
                                                            )}
                                                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${isSelected
                                                                ? 'bg-sky-600 border-sky-600 text-white'
                                                                : 'border-slate-300 dark:border-slate-600'
                                                                }`}>
                                                                {isSelected && <Check className="w-3.5 h-3.5" />}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : userQuery.length >= 2 ? (
                                        <p className="text-xs text-slate-400 text-center py-2">
                                            No students found.
                                        </p>
                                    ) : null}
                                </div>
                            ) : (
                                /* Tab 2: Bulk Phones */
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                            Mobile Numbers (paste with comma, space or newline)
                                        </label>
                                        <textarea
                                            rows={4}
                                            value={bulkPhones}
                                            onChange={(e) => setBulkPhones(e.target.value)}
                                            placeholder="01711000000, 01822000000&#10;01933000000"
                                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        disabled={verifyingPhones || !bulkPhones.trim()}
                                        onClick={handleLookupPhones}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 text-white text-xs font-bold transition-all disabled:opacity-50"
                                    >
                                        {verifyingPhones ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <Search className="w-3.5 h-3.5" />
                                        )}
                                        <span>Verify Numbers & Add to List</span>
                                    </button>

                                    {unmatchedPhones.length > 0 && (
                                        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-xs">
                                            <p className="font-bold text-amber-800 dark:text-amber-300 mb-1">
                                                No accounts found for the following {unmatchedPhones.length} numbers:
                                            </p>
                                            <p className="text-amber-700 dark:text-amber-400 font-mono text-[11px] break-all">
                                                {unmatchedPhones.join(', ')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Selected Users Chips */}
                            {selectedUsers.length > 0 && (
                                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                                        <span>Selected for enrollment ({selectedUsers.length} students):</span>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedUsers([])}
                                            className="text-rose-500 hover:underline"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                        {selectedUsers.map(user => (
                                            <span
                                                key={user.id}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-2xs"
                                            >
                                                <span>{user.name}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleUser(user)}
                                                    className="text-slate-400 hover:text-rose-500"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Options */}
                            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    <input
                                        type="checkbox"
                                        checked={sendSms}
                                        onChange={(e) => setSendSms(e.target.checked)}
                                        className="w-4 h-4 rounded-sm border-slate-300 text-sky-600 focus:ring-sky-500"
                                    />
                                    <span>Send confirmation SMS to student (if SMS gateway configured)</span>
                                </label>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Admin Note (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={enrollNotes}
                                        onChange={(e) => setEnrollNotes(e.target.value)}
                                        placeholder="e.g. Offline Payment / Direct Admission"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsEnrollModalOpen(false)}
                                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={submittingEnroll || selectedUsers.length === 0}
                                onClick={handleSubmitEnroll}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all"
                            >
                                {submittingEnroll ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Check className="w-4 h-4" />
                                )}
                                <span>Enroll {selectedUsers.length} Students</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Revoke Confirmation Modal */}
            {revokeModalOpen && revokingTarget && (
                <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                                    <Trash2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                        {revokingTarget.isBulk
                                            ? 'Revoke Students Course Access'
                                            : 'Revoke Student Course Access'}
                                    </h3>
                                    <p className="text-xs text-slate-500 truncate max-w-[240px]">
                                        {selectedTarget?.title}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                disabled={isRevoking}
                                onClick={() => {
                                    setRevokeModalOpen(false);
                                    setRevokingTarget(null);
                                }}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            {revokingTarget.isBulk ? (
                                <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                                        Are you sure you want to remove{' '}
                                        <span className="text-rose-600 dark:text-rose-400 font-extrabold text-base">
                                            {revokingTarget.selectAllPages ? pagination.total : selectedEnrollmentIds.length} students
                                        </span>{' '}
                                        from this {selectedTarget?.type === 'bundle' ? 'bundle' : 'course'}?
                                    </p>
                                </div>
                            ) : revokingTarget.student ? (
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-2">
                                    <div className="font-bold text-sm text-slate-900 dark:text-white">
                                        {revokingTarget.student.user.name}
                                    </div>
                                    <div className="text-xs text-slate-500 space-y-1">
                                        {revokingTarget.student.user.phone && (
                                            <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                                <span>{revokingTarget.student.user.phone}</span>
                                            </div>
                                        )}
                                        {revokingTarget.student.user.email && (
                                            <div className="flex items-center gap-1.5">
                                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                                <span>{revokingTarget.student.user.email}</span>
                                            </div>
                                        )}
                                        <div className="font-mono text-xs text-sky-600 dark:text-sky-400 font-semibold pt-0.5">
                                            Roll: {revokingTarget.student.user.registration_number || `ME-2026-${revokingTarget.student.user_id}`}
                                        </div>
                                    </div>
                                </div>
                            ) : null}

                            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                                <span>
                                    <strong>Warning:</strong> Removing access will prevent the student from accessing this course's dashboard, videos, routine, resources, and exams.
                                </span>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                disabled={isRevoking}
                                onClick={() => {
                                    setRevokeModalOpen(false);
                                    setRevokingTarget(null);
                                }}
                                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={isRevoking}
                                onClick={handleConfirmRevoke}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                            >
                                {isRevoking ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                                <span>
                                    {revokingTarget.isBulk
                                        ? `Yes, Remove ${revokingTarget.selectAllPages ? pagination.total : selectedEnrollmentIds.length} Students`
                                        : 'Yes, Remove'}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
