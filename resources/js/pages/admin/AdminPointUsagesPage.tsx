import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import {
    Gem,
    Search,
    Users,
    TrendingUp,
    Flame,
    ArrowUpRight,
    ArrowDownRight,
    Eye,
    Loader2,
    Calendar,
    X,
    Filter,
    Plus,
    Minus,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    FileText,
    ShoppingCart,
    BookOpen
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';

interface UserUsageItem {
    id: number;
    name: string;
    phone: string;
    email: string;
    points: number;
    registration_number?: string | null;
    photo_url?: string | null;
    total_gained: number;
    total_burned: number;
    point_transactions_count: number;
    created_at?: string;
}

interface PointTransactionItem {
    id: number;
    user_id: number;
    amount: number;
    type: string;
    reference_id?: number | null;
    reference_type?: string | null;
    description: string;
    created_at: string;
}

interface UserUsageDetails {
    user: {
        id: number;
        name: string;
        phone: string;
        email: string;
        registration_number?: string | null;
        photo_url?: string | null;
        points: number;
    };
    summary: {
        current_balance: number;
        total_gained: number;
        total_burned: number;
        transactions_count: number;
    };
    transactions: {
        data: PointTransactionItem[];
        current_page: number;
        last_page: number;
        total: number;
    };
}

export const AdminPointUsagesPage: React.FC = () => {
    const [users, setUsers] = useState<UserUsageItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sort, setSort] = useState('points');
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);

    // Selected user for details modal
    const [selectedUser, setSelectedUser] = useState<UserUsageItem | null>(null);
    const [details, setDetails] = useState<UserUsageDetails | null>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsFilter, setDetailsFilter] = useState<'all' | 'gained' | 'burned'>('all');

    // Quick Adjust Modal
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    const [adjustUserId, setAdjustUserId] = useState<number | null>(null);
    const [adjustAmount, setAdjustAmount] = useState('50');
    const [adjustDescription, setAdjustDescription] = useState('');
    const [adjustLoading, setAdjustLoading] = useState(false);
    const [adjustError, setAdjustError] = useState<string | null>(null);

    useEffect(() => {
        fetchUserUsages(1);
    }, [sort]);

    const fetchUserUsages = async (page = 1) => {
        try {
            setLoading(true);
            const params: any = { page, sort };
            if (searchTerm.trim()) params.search = searchTerm.trim();

            const res = await apiClient.get('/admin/points/user-usages', { params });
            const data = res.data;
            setUsers(data.data || []);
            setCurrentPage(data.current_page || 1);
            setLastPage(data.last_page || 1);
            setTotalUsers(data.total || 0);
        } catch (err) {
            console.error('Failed to load point usages', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchUserUsages(1);
    };

    const openUserDetails = async (user: UserUsageItem) => {
        setSelectedUser(user);
        setDetails(null);
        setDetailsFilter('all');
        fetchUserDetails(user.id, 'all');
    };

    const fetchUserDetails = async (userId: number, filter: 'all' | 'gained' | 'burned') => {
        try {
            setDetailsLoading(true);
            const res = await apiClient.get(`/admin/points/users/${userId}/usages`, {
                params: { filter }
            });
            setDetails(res.data);
        } catch (err) {
            console.error('Failed to load user usage details', err);
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleFilterChange = (filter: 'all' | 'gained' | 'burned') => {
        setDetailsFilter(filter);
        if (selectedUser) {
            fetchUserDetails(selectedUser.id, filter);
        }
    };

    const handleAdjustPoints = async (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseInt(adjustAmount, 10);
        if (!adjustUserId || isNaN(numAmount) || numAmount === 0) {
            setAdjustError('Please specify a valid student ID and non-zero point amount.');
            return;
        }
        if (!adjustDescription.trim()) {
            setAdjustError('Please enter a reason or description.');
            return;
        }

        try {
            setAdjustLoading(true);
            setAdjustError(null);
            await apiClient.post('/admin/points/adjust', {
                user_id: adjustUserId,
                amount: numAmount,
                description: adjustDescription.trim(),
            });

            setIsAdjustModalOpen(false);
            setAdjustAmount('50');
            setAdjustDescription('');
            fetchUserUsages(currentPage);
            if (selectedUser && selectedUser.id === adjustUserId) {
                fetchUserDetails(adjustUserId, detailsFilter);
            }
        } catch (err: any) {
            setAdjustError(err.response?.data?.message || 'Failed to adjust points.');
        } finally {
            setAdjustLoading(false);
        }
    };

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'course_purchase':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                        <ShoppingCart className="w-3 h-3" />
                        <span>Course Purchase</span>
                    </span>
                );
            case 'note_reward':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        <FileText className="w-3 h-3" />
                        <span>Note Reward</span>
                    </span>
                );
            case 'redeem_discount':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                        <Flame className="w-3 h-3" />
                        <span>Checkout Burn</span>
                    </span>
                );
            case 'manual_adjustment':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                        <span>Admin Adjust</span>
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <span>{type}</span>
                    </span>
                );
        }
    };

    return (
        <div className="space-y-6">
            {/* Header & Submenu Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                        <Gem className="w-7 h-7 text-amber-500" />
                        <span>Points Management</span>
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Track how students earn points, monitor checkout burns, and inspect individual student usage logs.
                    </p>
                </div>

                {/* Submenu Pills */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <Link
                        to="/admin/points/rules"
                        className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
                    >
                        Points Rules
                    </Link>
                    <Link
                        to="/admin/points/usages"
                        className="px-4 py-2 rounded-xl text-xs font-black bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs transition"
                    >
                        User Usages
                    </Link>
                </div>
            </div>

            {/* Quick Filter & Search Bar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-4">
                <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center justify-between gap-3">
                    <div className="relative w-full md:w-80">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by name, phone, email, reg no..."
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-hidden focus:border-amber-500"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <span className="text-xs font-bold text-slate-500 shrink-0">Sort By:</span>
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-hidden focus:border-amber-500"
                        >
                            <option value="points">Current Balance (High to Low)</option>
                            <option value="total_gained">Total Gained / Earned</option>
                            <option value="total_burned">Total Burned / Spent</option>
                            <option value="recent">Recently Registered</option>
                        </select>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition"
                        >
                            Filter
                        </button>
                    </div>
                </form>
            </div>

            {/* Users Usages Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                            Student Points Directory ({totalUsers})
                        </h3>
                        <p className="text-xs text-slate-400">
                            Click 'View Usages' to see exact breakdown of where each student gained or burned points.
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="py-20 text-center space-y-3">
                        <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
                        <p className="text-xs font-bold text-slate-500">Loading student usages...</p>
                    </div>
                ) : users.length === 0 ? (
                    <div className="py-20 text-center space-y-3">
                        <Users className="w-10 h-10 text-slate-300 mx-auto" />
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            No students found with points history.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="py-3 px-4">Student</th>
                                    <th className="py-3 px-4">Current Balance</th>
                                    <th className="py-3 px-4">Total Gained</th>
                                    <th className="py-3 px-4">Total Burned</th>
                                    <th className="py-3 px-4">Transactions</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                                {users.map((u) => (
                                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center font-black text-sm shrink-0">
                                                    {u.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="font-extrabold text-slate-900 dark:text-white block truncate">
                                                        {u.name}
                                                    </span>
                                                    <span className="text-[11px] text-slate-400 block truncate">
                                                        {u.phone} • {u.email}
                                                    </span>
                                                    {u.registration_number && (
                                                        <span className="text-[10px] font-mono text-sky-600 block">
                                                            Reg: {u.registration_number}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 whitespace-nowrap">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-full font-black text-xs text-amber-700 dark:text-amber-400">
                                                <Gem className="w-3.5 h-3.5 text-amber-500" />
                                                <span>{u.points.toLocaleString()}</span>
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 whitespace-nowrap">
                                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-black">
                                                <ArrowUpRight className="w-3.5 h-3.5" />
                                                <span>+{u.total_gained.toLocaleString()}</span>
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 whitespace-nowrap">
                                            <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-black">
                                                <ArrowDownRight className="w-3.5 h-3.5" />
                                                <span>-{u.total_burned.toLocaleString()}</span>
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                                            {u.point_transactions_count} activities
                                        </td>
                                        <td className="py-3 px-4 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => openUserDetails(u)}
                                                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center gap-1 transition"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    <span>View Usages</span>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setAdjustUserId(u.id);
                                                        setIsAdjustModalOpen(true);
                                                    }}
                                                    className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl font-bold text-xs transition"
                                                    title="Quick Adjust Points"
                                                >
                                                    ± Adjust
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {!loading && lastPage > 1 && (
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-medium">
                            Page {currentPage} of {lastPage}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => fetchUserUsages(currentPage - 1)}
                                disabled={currentPage <= 1}
                                className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => fetchUserUsages(currentPage + 1)}
                                disabled={currentPage >= lastPage}
                                className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* User Usage Details Modal */}
            {selectedUser && (
                <Modal
                    isOpen={Boolean(selectedUser)}
                    onClose={() => setSelectedUser(null)}
                    title="Student Points & Usage History"
                >
                    <div className="space-y-5">
                        {/* Student Profile Card */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-lg shadow-sm">
                                        {selectedUser.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-base text-slate-900 dark:text-white">
                                            {selectedUser.name}
                                        </h3>
                                        <p className="text-xs text-slate-500">
                                            {selectedUser.phone} • {selectedUser.email}
                                        </p>
                                        {selectedUser.registration_number && (
                                            <span className="text-[11px] font-mono text-sky-600 font-bold block mt-0.5">
                                                ID: {selectedUser.registration_number}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        setAdjustUserId(selectedUser.id);
                                        setIsAdjustModalOpen(true);
                                    }}
                                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition"
                                >
                                    ± Adjust Points
                                </button>
                            </div>

                            {/* 3 Summary Badges */}
                            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-center">
                                <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Balance</span>
                                    <span className="font-black text-base text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1 mt-0.5">
                                        <Gem className="w-3.5 h-3.5" />
                                        <span>{(details?.summary.current_balance ?? selectedUser.points).toLocaleString()}</span>
                                    </span>
                                </div>
                                <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Gained</span>
                                    <span className="font-black text-base text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
                                        <ArrowUpRight className="w-3.5 h-3.5" />
                                        <span>+{(details?.summary.total_gained ?? selectedUser.total_gained).toLocaleString()}</span>
                                    </span>
                                </div>
                                <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Burned</span>
                                    <span className="font-black text-base text-rose-600 dark:text-rose-400 flex items-center justify-center gap-1 mt-0.5">
                                        <ArrowDownRight className="w-3.5 h-3.5" />
                                        <span>-{(details?.summary.total_burned ?? selectedUser.total_burned).toLocaleString()}</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                            <button
                                onClick={() => handleFilterChange('all')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                                    detailsFilter === 'all'
                                        ? 'bg-amber-500 text-white'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                }`}
                            >
                                All Activities
                            </button>
                            <button
                                onClick={() => handleFilterChange('gained')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                                    detailsFilter === 'gained'
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                }`}
                            >
                                Points Gained
                            </button>
                            <button
                                onClick={() => handleFilterChange('burned')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                                    detailsFilter === 'burned'
                                        ? 'bg-rose-600 text-white'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                }`}
                            >
                                Points Burned
                            </button>
                        </div>

                        {/* Transactions List */}
                        {detailsLoading ? (
                            <div className="py-12 text-center">
                                <Loader2 className="w-6 h-6 text-amber-500 animate-spin mx-auto" />
                                <p className="text-xs font-bold text-slate-400 mt-2">Loading transactions...</p>
                            </div>
                        ) : !details || details.transactions.data.length === 0 ? (
                            <div className="py-12 text-center text-xs text-slate-400 font-bold">
                                No point activities found for this filter.
                            </div>
                        ) : (
                            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                                {details.transactions.data.map((tx) => {
                                    const isPositive = tx.amount > 0;
                                    const dateStr = new Date(tx.created_at).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    });

                                    return (
                                        <div
                                            key={tx.id}
                                            className="p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl flex items-start justify-between gap-3 shadow-2xs"
                                        >
                                            <div className="space-y-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    {getTypeBadge(tx.type)}
                                                    <span className="text-[11px] text-slate-400 font-medium">
                                                        {dateStr}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                    {tx.description}
                                                </p>
                                            </div>

                                            <div className="shrink-0 text-right">
                                                <span
                                                    className={`inline-flex items-center gap-0.5 font-black text-sm ${
                                                        isPositive
                                                            ? 'text-emerald-600 dark:text-emerald-400'
                                                            : 'text-rose-600 dark:text-rose-400'
                                                    }`}
                                                >
                                                    {isPositive ? '+' : ''}
                                                    {tx.amount}
                                                    <Gem className="w-3.5 h-3.5 ml-0.5" />
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </Modal>
            )}

            {/* Quick Adjust Modal */}
            {isAdjustModalOpen && (
                <Modal
                    isOpen={isAdjustModalOpen}
                    onClose={() => setIsAdjustModalOpen(false)}
                    title="Manual Points Adjustment"
                >
                    <form onSubmit={handleAdjustPoints} className="space-y-4">
                        {adjustError && (
                            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl">
                                {adjustError}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Student ID
                            </label>
                            <input
                                type="number"
                                value={adjustUserId || ''}
                                onChange={(e) => setAdjustUserId(parseInt(e.target.value, 10) || null)}
                                placeholder="Student user ID"
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-hidden"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Point Amount (+ to add, - to deduct)
                            </label>
                            <input
                                type="number"
                                value={adjustAmount}
                                onChange={(e) => setAdjustAmount(e.target.value)}
                                placeholder="e.g. 50 or -20"
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-hidden"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Reason / Description
                            </label>
                            <textarea
                                value={adjustDescription}
                                onChange={(e) => setAdjustDescription(e.target.value)}
                                placeholder="e.g. Quiz bonus points, manual adjustment, compensation..."
                                rows={3}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-hidden"
                                required
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsAdjustModalOpen(false)}
                                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={adjustLoading}
                                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50"
                            >
                                {adjustLoading ? 'Applying...' : 'Apply Points Adjustment'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};
