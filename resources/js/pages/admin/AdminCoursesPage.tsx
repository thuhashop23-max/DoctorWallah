import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient, formatBDT } from '../../api/client';
import { Course } from '../../types';
import {
    Plus,
    Search,
    Edit,
    Layers,
    Trash2,
    BookOpen,
    Users,
    CheckCircle2,
    Clock,
    ExternalLink,
    RotateCcw,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Loader2,
    X,
    Filter,
    Eye
} from 'lucide-react';

interface PaginationMeta {
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
    per_page: number;
}

export const AdminCoursesPage: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('latest');
    const [statusFilter, setStatusFilter] = useState(() => {
        const p = new URLSearchParams(window.location.search);
        return p.get('status') || '';
    });
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [perPage, setPerPage] = useState<number>(15);
    const [pagination, setPagination] = useState<PaginationMeta>({
        current_page: 1,
        last_page: 1,
        total: 0,
        from: 0,
        to: 0,
        per_page: 15,
    });

    useEffect(() => {
        setCurrentPage(1);
        fetchCourses(1, perPage, search, statusFilter, sortBy);
    }, [search, statusFilter, sortBy]);

    const fetchCourses = async (
        page = currentPage,
        pageSize = perPage,
        searchTerm = search,
        status = statusFilter,
        sort = sortBy
    ) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', String(page));
            params.append('per_page', String(pageSize));
            if (searchTerm.trim()) params.append('search', searchTerm.trim());
            if (status) params.append('status', status);
            if (sort) params.append('sort', sort);

            const { data } = await apiClient.get(`/admin/courses?${params.toString()}`);
            setCourses(data.data || []);
            setPagination({
                current_page: data.current_page || 1,
                last_page: data.last_page || 1,
                total: data.total || 0,
                from: data.from || 0,
                to: data.to || 0,
                per_page: data.per_page || pageSize,
            });
            setCurrentPage(data.current_page || 1);
        } catch (err) {
            console.error('Failed to fetch courses:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > pagination.last_page || newPage === currentPage) return;
        setCurrentPage(newPage);
        fetchCourses(newPage, perPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePerPageChange = (newPerPage: number) => {
        setPerPage(newPerPage);
        setCurrentPage(1);
        fetchCourses(1, newPerPage);
    };

    const handleDeleteCourse = async (courseId: number) => {
        if (!window.confirm('Are you sure you want to move this course to trash? You can restore it from trash anytime.')) return;

        try {
            await apiClient.delete(`/admin/courses/${courseId}`);
            fetchCourses(currentPage, perPage);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete course.');
        }
    };

    const handleRestoreCourse = async (courseId: number) => {
        try {
            await apiClient.post(`/admin/courses/${courseId}/restore`);
            fetchCourses(currentPage, perPage);
            alert('Course restored successfully!');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to restore course.');
        }
    };

    const handleForceDeleteCourse = async (courseId: number) => {
        if (!window.confirm('Warning: Are you sure you want to permanently delete this course? This action cannot be undone!')) return;

        try {
            await apiClient.delete(`/admin/courses/${courseId}/force-delete`);
            fetchCourses(currentPage, perPage);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to permanently delete course.');
        }
    };

    // Calculate smart page number array with ellipses
    const getPageNumbers = (current: number, total: number): (number | string)[] => {
        if (total <= 7) {
            return Array.from({ length: total }, (_, i) => i + 1);
        }
        if (current <= 4) {
            return [1, 2, 3, 4, 5, '...', total];
        }
        if (current >= total - 3) {
            return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
        }
        return [1, '...', current - 1, current, current + 1, '...', total];
    };

    return (
        <div className="space-y-6 max-w-7xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        Course Management
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Manage all courses, curriculum visual builder, and course details (Total: {pagination.total} Courses)
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        to="/admin/courses/create"
                        className="px-5 py-3 bg-[#25a2ee] hover:bg-[#1f8ed1] text-white font-bold text-sm rounded-xl shadow-md shadow-[#25a2ee]/25 flex items-center gap-2 transition-all cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Create New Course</span>
                    </Link>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Search Input with Search button */}
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        setCurrentPage(1);
                        fetchCourses(1, perPage, search, statusFilter);
                    }}
                    className="relative w-full sm:max-w-md"
                >
                    <div className="relative">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search courses by name or description..."
                            className="w-full pl-10 pr-24 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-[#25a2ee] focus:border-transparent transition"
                        />
                        <button
                            type="submit"
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#25a2ee] cursor-pointer"
                            title="Search"
                        >
                            <Search className="w-4 h-4" />
                        </button>
                        {search && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearch('');
                                    setCurrentPage(1);
                                    fetchCourses(1, perPage, '', statusFilter);
                                }}
                                className="absolute right-20 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                title="Clear search"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            type="submit"
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-[#25a2ee] hover:bg-[#1f8ed1] text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                        >
                            Search
                        </button>
                    </div>
                </form>

                {/* Status Filter & Sort Order */}
                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 cursor-pointer"
                        title="Sort courses"
                    >
                        <option value="latest">Newest First</option>
                        <option value="best_selling">Best Selling (Most Enrolled)</option>
                        <option value="alphabetical_asc">Alphabetical (A - Z)</option>
                        <option value="alphabetical_desc">Alphabetical (Z - A)</option>
                        <option value="price_low">Price: Low to High</option>
                        <option value="price_high">Price: High to Low</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className={`w-full sm:w-auto bg-slate-50 border rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold cursor-pointer ${statusFilter === 'trashed' ? 'border-rose-300 text-rose-700 bg-rose-50' : 'border-slate-200 text-slate-700'
                            }`}
                    >
                        <option value="">All Statuses ({pagination.total})</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="archived">Archived</option>
                        <option value="trashed">Trash Bin</option>
                    </select>

                    <button
                        type="button"
                        onClick={() => setStatusFilter(prev => prev === 'trashed' ? '' : 'trashed')}
                        className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${statusFilter === 'trashed'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                            }`}
                        title="Trash / Recycle Bin"
                    >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        <span>{statusFilter === 'trashed' ? 'All Courses' : 'Trash'}</span>
                    </button>
                </div>
            </div>

            {/* Trash Mode Notice */}
            {statusFilter === 'trashed' && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs text-rose-800">
                    <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
                    <span className="font-semibold">
                        Trash Mode: Previously deleted courses are stored here. You can restore them or permanently delete them from the database.
                    </span>
                </div>
            )}

            {/* Courses Table Container */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                            <tr>
                                <th className="py-4 px-6">Course</th>
                                <th className="py-4 px-4">Instructors</th>
                                <th className="py-4 px-4">Price</th>
                                <th className="py-4 px-4">Lessons & Enrolled</th>
                                <th className="py-4 px-4">Status</th>
                                <th className="py-4 px-6 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Loader2 className="w-6 h-6 animate-spin text-[#25a2ee]" />
                                            <span>Loading courses...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : courses.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <BookOpen className="w-8 h-8 text-slate-300" />
                                            <span className="font-bold text-slate-600">No courses found matching your criteria.</span>
                                            {search && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSearch('')}
                                                    className="text-xs text-[#25a2ee] hover:underline font-semibold"
                                                >
                                                    Clear search filter
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                courses.map((course) => (
                                    <tr key={course.id} className="hover:bg-slate-50/70 transition-colors">
                                        {/* Course Info */}
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <a
                                                    href={`/courses/${course.slug}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-14 h-10 rounded-lg bg-slate-900 overflow-hidden shrink-0 block cursor-pointer group shadow-2xs"
                                                    title="View course public page"
                                                >
                                                    {course.thumbnail ? (
                                                        <img
                                                            src={course.thumbnail}
                                                            alt={course.title}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-white font-bold text-[10px]">
                                                            <BookOpen className="w-4 h-4 text-[#25a2ee]" />
                                                        </div>
                                                    )}
                                                </a>
                                                <div className="max-w-xs">
                                                    <a
                                                        href={`/courses/${course.slug}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="font-bold text-slate-900 hover:text-[#25a2ee] text-sm truncate block transition-colors"
                                                        title="View course details"
                                                    >
                                                        {course.title}
                                                    </a>
                                                    <span className="text-[11px] text-slate-400 font-mono">
                                                        /{course.slug}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Instructors */}
                                        <td className="py-4 px-4">
                                            <div className="text-slate-800 font-semibold max-w-[150px] truncate">
                                                {course.instructors && course.instructors.length > 0
                                                    ? course.instructors.map((i) => i.name).join(', ')
                                                    : 'No instructors assigned'}
                                            </div>
                                        </td>

                                        {/* Pricing */}
                                        <td className="py-4 px-4">
                                            {course.price === 0 ? (
                                                <span className="font-bold text-emerald-600">Free</span>
                                            ) : (
                                                <div>
                                                    <span className="font-bold text-slate-900">
                                                        {formatBDT(course.sale_price || course.price)}
                                                    </span>
                                                    {course.sale_price && course.sale_price < course.price && (
                                                        <span className="block text-[10px] text-slate-400 line-through">
                                                            {formatBDT(course.price)}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </td>

                                        {/* Stats */}
                                        <td className="py-4 px-4">
                                            <div className="text-slate-600 space-y-0.5">
                                                <div className="font-semibold text-slate-800">{course.lessons_count || 0} Lessons</div>
                                                <div className="text-slate-400 text-[11px]">
                                                    {(course.fake_enrollment_count || 0) + (course.enrollments_count || 0)} Students
                                                    {Boolean(course.fake_enrollment_count) && (
                                                        <span className="text-[10px] text-slate-400"> ({course.enrollments_count || 0} real)</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="py-4 px-4">
                                            {course.status === 'published' ? (
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                    Published
                                                </span>
                                            ) : course.status === 'draft' ? (
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-700 border border-slate-200">
                                                    Draft
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-200">
                                                    Archived
                                                </span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="py-4 px-6 text-right">
                                            <div className="inline-flex items-center gap-1.5">
                                                {statusFilter === 'trashed' ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleRestoreCourse(course.id)}
                                                            title="Restore"
                                                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg flex items-center gap-1 text-xs transition-colors cursor-pointer border border-emerald-200"
                                                        >
                                                            <RotateCcw className="w-3.5 h-3.5" />
                                                            <span>Restore</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleForceDeleteCourse(course.id)}
                                                            title="Permanent Delete"
                                                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg flex items-center gap-1 text-xs transition-colors cursor-pointer border border-rose-200"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                            <span>Delete Forever</span>
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Link
                                                            to={`/admin/courses/${course.id}/builder`}
                                                            title="Open Course Builder"
                                                            className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-[#25a2ee] font-bold rounded-lg flex items-center gap-1 text-xs transition-colors border border-sky-100"
                                                        >
                                                            <Layers className="w-3.5 h-3.5" />
                                                            <span>Builder</span>
                                                        </Link>
                                                        <a
                                                            href={`/learning/${course.id}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            title="Preview Course as Student"
                                                            className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-sky-600 rounded-lg transition-colors"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </a>
                                                        <Link
                                                            to={`/admin/courses/${course.id}/edit`}
                                                            title="Edit Course"
                                                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDeleteCourse(course.id)}
                                                            title="Delete Course"
                                                            className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors cursor-pointer"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Comprehensive Server-Side Pagination Bar */}
                <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-semibold text-slate-600">
                    {/* Left: Stats & Per-Page Selector */}
                    <div className="flex flex-wrap items-center gap-3">
                        <span>
                            Showing <strong className="text-slate-900">{pagination.from || 0}</strong> to{' '}
                            <strong className="text-slate-900">{pagination.to || 0}</strong> of{' '}
                            <strong className="text-slate-900">{pagination.total}</strong> courses
                        </span>

                        <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
                            <span className="text-slate-500 font-medium">Per page:</span>
                            <select
                                value={perPage}
                                onChange={(e) => handlePerPageChange(Number(e.target.value))}
                                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 cursor-pointer focus:ring-2 focus:ring-[#25a2ee]"
                            >
                                <option value={10}>10</option>
                                <option value={15}>15</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                    </div>

                    {/* Right: Page Navigation Controls */}
                    {pagination.last_page > 1 && (
                        <div className="flex flex-wrap items-center gap-1 self-center md:self-auto">
                            {/* First Page */}
                            <button
                                type="button"
                                disabled={currentPage <= 1 || loading}
                                onClick={() => handlePageChange(1)}
                                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                                title="First Page"
                            >
                                <ChevronsLeft className="w-4 h-4" />
                            </button>

                            {/* Previous Page */}
                            <button
                                type="button"
                                disabled={currentPage <= 1 || loading}
                                onClick={() => handlePageChange(currentPage - 1)}
                                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-1"
                                title="Previous Page"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Prev</span>
                            </button>

                            {/* Page Numbers */}
                            <div className="flex items-center gap-1 mx-1">
                                {getPageNumbers(currentPage, pagination.last_page).map((p, idx) => {
                                    if (p === '...') {
                                        return (
                                            <span key={`ellipsis-${idx}`} className="px-2 text-slate-400 select-none">
                                                ...
                                            </span>
                                        );
                                    }
                                    const pageNum = Number(p);
                                    const isActive = pageNum === currentPage;
                                    return (
                                        <button
                                            key={pageNum}
                                            type="button"
                                            disabled={loading}
                                            onClick={() => handlePageChange(pageNum)}
                                            className={`w-7 sm:w-8 h-7 sm:h-8 rounded-lg font-bold text-xs transition cursor-pointer ${isActive
                                                ? 'bg-[#25a2ee] text-white shadow-xs'
                                                : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-700'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Next Page */}
                            <button
                                type="button"
                                disabled={currentPage >= pagination.last_page || loading}
                                onClick={() => handlePageChange(currentPage + 1)}
                                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-1"
                                title="Next Page"
                            >
                                <span className="hidden sm:inline">Next</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>

                            {/* Last Page */}
                            <button
                                type="button"
                                disabled={currentPage >= pagination.last_page || loading}
                                onClick={() => handlePageChange(pagination.last_page)}
                                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                                title="Last Page"
                            >
                                <ChevronsRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
