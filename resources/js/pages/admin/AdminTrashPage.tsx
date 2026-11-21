import React, { useState, useEffect } from 'react';
import { apiClient, formatBDT } from '../../api/client';
import {
    Trash2,
    RotateCcw,
    BookOpen,
    Boxes,
    ClipboardList,
    TicketPercent,
    Search,
    AlertTriangle,
    Loader2,
    Calendar,
    ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

type TrashTab = 'courses' | 'bundles' | 'exams' | 'coupons';

export const AdminTrashPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TrashTab>('courses');
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

    useEffect(() => {
        fetchTrashItems();
    }, [activeTab, search]);

    const fetchTrashItems = async () => {
        setLoading(true);
        try {
            let endpoint = '';
            if (activeTab === 'courses') endpoint = '/admin/courses';
            else if (activeTab === 'bundles') endpoint = '/admin/bundles';
            else if (activeTab === 'exams') endpoint = '/exams';
            else if (activeTab === 'coupons') endpoint = '/admin/coupons';

            const { data } = await apiClient.get(endpoint, {
                params: {
                    status: 'trashed',
                    search: search.trim() || undefined,
                }
            });

            // Adjust based on differing API payload formats
            if (activeTab === 'exams') {
                setItems(data.data || data.exams || []);
            } else if (activeTab === 'bundles') {
                setItems(data.bundles || data.data || []);
            } else if (activeTab === 'coupons') {
                setItems(data.coupons || data.data || []);
            } else {
                setItems(data.courses || data.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch trash items', err);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (id: number, title: string) => {
        try {
            setActionLoadingId(id);
            let url = '';
            if (activeTab === 'courses') url = `/admin/courses/${id}/restore`;
            else if (activeTab === 'bundles') url = `/admin/bundles/${id}/restore`;
            else if (activeTab === 'exams') url = `/exams/${id}/restore`;
            else if (activeTab === 'coupons') url = `/admin/coupons/${id}/restore`;

            await apiClient.post(url);
            setItems(prev => prev.filter(item => item.id !== id));
            alert(`"${title}" restored successfully!`);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to restore item.');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleForceDelete = async (id: number, title: string) => {
        if (!window.confirm(`Warning: Are you sure you want to permanently delete "${title}"? This action cannot be undone!`)) {
            return;
        }

        try {
            setActionLoadingId(id);
            let url = '';
            if (activeTab === 'courses') url = `/admin/courses/${id}/force-delete`;
            else if (activeTab === 'bundles') url = `/admin/bundles/${id}/force-delete`;
            else if (activeTab === 'exams') url = `/exams/${id}/force-delete`;
            else if (activeTab === 'coupons') url = `/admin/coupons/${id}/force-delete`;

            await apiClient.delete(url);
            setItems(prev => prev.filter(item => item.id !== id));
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to permanently delete item.');
        } finally {
            setActionLoadingId(null);
        }
    };

    const tabConfig = [
        { id: 'courses' as TrashTab, label: 'Courses', icon: BookOpen, color: 'text-indigo-600' },
        { id: 'bundles' as TrashTab, label: 'Bundles', icon: Boxes, color: 'text-sky-600' },
        { id: 'exams' as TrashTab, label: 'Exams', icon: ClipboardList, color: 'text-purple-600' },
        { id: 'coupons' as TrashTab, label: 'Coupons', icon: TicketPercent, color: 'text-emerald-600' },
    ];

    return (
        <div className="space-y-6 max-w-7xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                        <Trash2 className="w-7 h-7 text-rose-600" />
                        <span>Recycle Bin / Trash</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Deleted courses, bundles, exams, and coupons are temporarily preserved here. You can restore them or permanently delete them.
                    </p>
                </div>
            </div>

            {/* Trash Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                {tabConfig.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => {
                                setActiveTab(tab.id);
                                setSearch('');
                            }}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${isActive
                                ? 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 shadow-xs'
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                                }`}
                        >
                            <Icon className={`w-4 h-4 ${isActive ? 'text-rose-600' : 'text-slate-400'}`} />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Search Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-4">
                <div className="relative w-full sm:max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search trash items..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500 dark:text-white"
                    />
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Total Found: <span className="font-bold text-slate-800 dark:text-white">{items.length}</span> items
                </div>
            </div>

            {/* Items Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                            <tr>
                                <th className="py-4 px-6">Item Details</th>
                                <th className="py-4 px-4">Price / Info</th>
                                <th className="py-4 px-4">Deleted Date</th>
                                <th className="py-4 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="py-16 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Loader2 className="w-7 h-7 animate-spin text-rose-500" />
                                            <span>Loading trash items...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-16 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                                            <Trash2 className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                                            <p className="font-bold text-slate-700 dark:text-slate-300">Trash is completely empty!</p>
                                            <p className="text-xs text-slate-500">There are currently no deleted items in this category.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                items.map((item) => {
                                    const title = item.title || item.code || `Item #${item.id}`;
                                    const deletedAt = item.deleted_at ? new Date(item.deleted_at).toLocaleString('en-US') : 'N/A';

                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                                            {/* Details */}
                                            <td className="py-4 px-6">
                                                <div className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                                                    {title}
                                                </div>
                                                {item.code && (
                                                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-semibold mt-1 inline-block">
                                                        Code: {item.code}
                                                    </span>
                                                )}
                                                {item.short_description && (
                                                    <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                                        {item.short_description}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Value / Info */}
                                            <td className="py-4 px-4 text-xs">
                                                {activeTab === 'coupons' && (
                                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                        {item.discount_type === 'percentage' ? `${item.discount_amount}% OFF` : `${formatBDT(item.discount_amount)} FLAT`}
                                                    </span>
                                                )}
                                                {activeTab === 'courses' && (
                                                    <span className="font-bold text-slate-900 dark:text-white">
                                                        {formatBDT(item.sale_price || item.price)}
                                                    </span>
                                                )}
                                                {activeTab === 'bundles' && (
                                                    <span className="font-bold text-slate-900 dark:text-white">
                                                        {formatBDT(item.sale_price || item.regular_price)}
                                                    </span>
                                                )}
                                                {activeTab === 'exams' && (
                                                    <div className="space-y-0.5 text-[11px] text-slate-500">
                                                        <div>Marks: {item.total_marks}</div>
                                                        <div>Duration: {item.duration_minutes} mins</div>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Deleted Time */}
                                            <td className="py-4 px-4 text-xs text-slate-500 dark:text-slate-400">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                    <span>{deletedAt}</span>
                                                </div>
                                            </td>

                                            {/* Action Buttons */}
                                            <td className="py-4 px-6 text-right whitespace-nowrap">
                                                <div className="inline-flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRestore(item.id, title)}
                                                        disabled={actionLoadingId === item.id}
                                                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold rounded-xl flex items-center gap-1.5 text-xs transition-colors cursor-pointer border border-emerald-200 dark:border-emerald-800 disabled:opacity-50"
                                                        title="Restore"
                                                    >
                                                        <RotateCcw className="w-3.5 h-3.5" />
                                                        <span>Restore</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleForceDelete(item.id, title)}
                                                        disabled={actionLoadingId === item.id}
                                                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 font-bold rounded-xl flex items-center gap-1.5 text-xs transition-colors cursor-pointer border border-rose-200 dark:border-rose-800 disabled:opacity-50"
                                                        title="Permanent Delete"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                        <span>Delete Forever</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
