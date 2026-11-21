import React, { useState, useEffect, useMemo } from 'react';
import { apiClient, formatBDT } from '../../api/client';
import {
    Sparkles,
    Plus,
    Search,
    Edit2,
    Trash2,
    Check,
    X,
    Loader2,
    Layers,
    BookOpen,
    Calendar,
    AlertCircle,
    CheckCircle2,
    Tag,
    Sliders,
    Flame,
    Zap,
    TrendingUp,
    Gift,
    Percent,
    Coins,
    ArrowRight
} from 'lucide-react';

interface TierRule {
    min_qty: number;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
}

interface DynamicOfferItem {
    id: number;
    title: string;
    description?: string | null;
    banner_text?: string | null;
    scope_type: 'all' | 'category' | 'course';
    applicable_categories?: number[] | null;
    applicable_courses?: number[] | null;
    tiers: TierRule[];
    min_order_amount?: number | null;
    start_date?: string | null;
    end_date?: string | null;
    is_active: boolean;
    priority: number;
    created_at: string;
}

interface CourseOption {
    id: number;
    title: string;
    price: number;
    sale_price?: number | null;
    category_id?: number | null;
}

interface CategoryOption {
    id: number;
    name: string;
    slug: string;
    courses_count?: number;
}

export const AdminDynamicOffersPage: React.FC = () => {
    const [offers, setOffers] = useState<DynamicOfferItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total_offers: 0,
        active_offers: 0,
        global_offers: 0,
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [scopeFilter, setScopeFilter] = useState<'all' | 'all_courses' | 'category' | 'course'>('all');

    // Available courses and categories for modal
    const [coursesList, setCoursesList] = useState<CourseOption[]>([]);
    const [categoriesList, setCategoriesList] = useState<CategoryOption[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(false);

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editingOffer, setEditingOffer] = useState<DynamicOfferItem | null>(null);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Form inputs
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        banner_text: '',
        scope_type: 'all' as 'all' | 'category' | 'course',
        applicable_categories: [] as number[],
        applicable_courses: [] as number[],
        tiers: [
            { min_qty: 2, discount_type: 'percentage' as const, discount_value: 15 },
            { min_qty: 3, discount_type: 'percentage' as const, discount_value: 25 },
        ] as TierRule[],
        min_order_amount: '',
        start_date: '',
        end_date: '',
        is_active: true,
        priority: 0,
    });

    // Modal search & category filters
    const [modalCourseSearch, setModalCourseSearch] = useState('');
    const [modalCourseCategoryFilter, setModalCourseCategoryFilter] = useState('all');
    const [modalCategorySearch, setModalCategorySearch] = useState('');

    useEffect(() => {
        fetchOffers();
        fetchCoursesAndCategories();
    }, []);

    const fetchOffers = async () => {
        try {
            setLoading(true);
            const { data } = await apiClient.get('/admin/dynamic-offers');
            setOffers(data.offers?.data || []);
            setStats(data.stats || { total_offers: 0, active_offers: 0, global_offers: 0 });
        } catch {
            setOffers([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchCoursesAndCategories = async () => {
        try {
            setLoadingOptions(true);
            const { data } = await apiClient.get('/admin/dynamic-offers/courses-and-categories');
            setCoursesList(data.courses || []);
            setCategoriesList(data.categories || []);
        } catch {
            // handle error
        } finally {
            setLoadingOptions(false);
        }
    };

    const handleOpenCreateModal = () => {
        setEditingOffer(null);
        setModalCourseSearch('');
        setModalCourseCategoryFilter('all');
        setModalCategorySearch('');
        setFormData({
            title: '',
            description: '',
            banner_text: '',
            scope_type: 'all',
            applicable_categories: [],
            applicable_courses: [],
            tiers: [
                { min_qty: 2, discount_type: 'percentage', discount_value: 15 },
                { min_qty: 3, discount_type: 'percentage', discount_value: 25 },
            ],
            min_order_amount: '',
            start_date: '',
            end_date: '',
            is_active: true,
            priority: 0,
        });
        setFeedback(null);
        setModalOpen(true);
    };

    const handleOpenEditModal = (offer: DynamicOfferItem) => {
        setEditingOffer(offer);
        setModalCourseSearch('');
        setModalCourseCategoryFilter('all');
        setModalCategorySearch('');
        setFormData({
            title: offer.title,
            description: offer.description || '',
            banner_text: offer.banner_text || '',
            scope_type: offer.scope_type,
            applicable_categories: offer.applicable_categories || [],
            applicable_courses: offer.applicable_courses || [],
            tiers: offer.tiers && offer.tiers.length > 0 ? offer.tiers : [{ min_qty: 2, discount_type: 'percentage', discount_value: 15 }],
            min_order_amount: offer.min_order_amount ? String(offer.min_order_amount) : '',
            start_date: offer.start_date ? offer.start_date.substring(0, 10) : '',
            end_date: offer.end_date ? offer.end_date.substring(0, 10) : '',
            is_active: offer.is_active,
            priority: offer.priority || 0,
        });
        setFeedback(null);
        setModalOpen(true);
    };

    const handleAddTier = () => {
        const lastQty = formData.tiers.length > 0 ? formData.tiers[formData.tiers.length - 1].min_qty : 1;
        setFormData((prev) => ({
            ...prev,
            tiers: [
                ...prev.tiers,
                { min_qty: lastQty + 1, discount_type: 'percentage', discount_value: 30 },
            ],
        }));
    };

    const handleRemoveTier = (index: number) => {
        if (formData.tiers.length <= 1) return;
        setFormData((prev) => ({
            ...prev,
            tiers: prev.tiers.filter((_, i) => i !== index),
        }));
    };

    const handleTierChange = (index: number, field: keyof TierRule, value: any) => {
        setFormData((prev) => {
            const updated = [...prev.tiers];
            updated[index] = { ...updated[index], [field]: value };
            return { ...prev, tiers: updated };
        });
    };

    const handleToggleCategory = (catId: number) => {
        setFormData((prev) => {
            const exists = prev.applicable_categories.includes(catId);
            return {
                ...prev,
                applicable_categories: exists
                    ? prev.applicable_categories.filter((id) => id !== catId)
                    : [...prev.applicable_categories, catId],
            };
        });
    };

    const handleSelectAllFilteredCategories = () => {
        const filteredIds = filteredModalCategories.map((cat) => cat.id);
        setFormData((prev) => {
            const combined = Array.from(new Set([...prev.applicable_categories, ...filteredIds]));
            return { ...prev, applicable_categories: combined };
        });
    };

    const handleClearCategories = () => {
        setFormData((prev) => ({ ...prev, applicable_categories: [] }));
    };

    const handleToggleCourse = (courseId: number) => {
        setFormData((prev) => {
            const exists = prev.applicable_courses.includes(courseId);
            return {
                ...prev,
                applicable_courses: exists
                    ? prev.applicable_courses.filter((id) => id !== courseId)
                    : [...prev.applicable_courses, courseId],
            };
        });
    };

    const handleSelectAllFilteredCourses = () => {
        const filteredIds = filteredModalCourses.map((c) => c.id);
        setFormData((prev) => {
            const combined = Array.from(new Set([...prev.applicable_courses, ...filteredIds]));
            return { ...prev, applicable_courses: combined };
        });
    };

    const handleClearCourses = () => {
        setFormData((prev) => ({ ...prev, applicable_courses: [] }));
    };

    const handleSaveOffer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            setFeedback({ type: 'error', text: 'Offer title is required.' });
            return;
        }

        if (formData.tiers.length === 0) {
            setFeedback({ type: 'error', text: 'At least one quantity tier rule is required.' });
            return;
        }

        if (formData.scope_type === 'category' && formData.applicable_categories.length === 0) {
            setFeedback({ type: 'error', text: 'Please select at least one category for Category scope.' });
            return;
        }

        if (formData.scope_type === 'course' && formData.applicable_courses.length === 0) {
            setFeedback({ type: 'error', text: 'Please select at least one course for Course scope.' });
            return;
        }

        setSaving(true);
        setFeedback(null);

        try {
            const payload = {
                title: formData.title.trim(),
                description: formData.description.trim() || null,
                banner_text: formData.banner_text.trim() || null,
                scope_type: formData.scope_type,
                applicable_categories: formData.scope_type === 'category' ? formData.applicable_categories : null,
                applicable_courses: formData.scope_type === 'course' ? formData.applicable_courses : null,
                tiers: formData.tiers.map((t) => ({
                    min_qty: Number(t.min_qty) || 1,
                    discount_type: t.discount_type,
                    discount_value: Number(t.discount_value) || 0,
                })),
                min_order_amount: formData.min_order_amount ? Number(formData.min_order_amount) : null,
                start_date: formData.start_date || null,
                end_date: formData.end_date || null,
                is_active: formData.is_active,
                priority: Number(formData.priority) || 0,
            };

            if (editingOffer) {
                await apiClient.put(`/admin/dynamic-offers/${editingOffer.id}`, payload);
            } else {
                await apiClient.post('/admin/dynamic-offers', payload);
            }

            setModalOpen(false);
            fetchOffers();
        } catch (err: any) {
            const apiMessage = err.response?.data?.message;
            const validationErrors = err.response?.data?.errors;
            let displayError = apiMessage || 'Failed to save dynamic offer.';
            if (validationErrors && typeof validationErrors === 'object') {
                const firstVal = Object.values(validationErrors)[0];
                if (Array.isArray(firstVal) && firstVal[0]) {
                    displayError = `${displayError} (${firstVal[0]})`;
                }
            }
            setFeedback({
                type: 'error',
                text: displayError,
            });
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (offer: DynamicOfferItem) => {
        try {
            const { data } = await apiClient.post(`/admin/dynamic-offers/${offer.id}/toggle-status`);
            setOffers((prev) =>
                prev.map((o) => (o.id === offer.id ? { ...o, is_active: data.offer.is_active } : o))
            );
        } catch {
            alert('Failed to toggle status.');
        }
    };

    const handleDeleteOffer = async (offer: DynamicOfferItem) => {
        if (!window.confirm(`Are you sure you want to delete the offer "${offer.title}"?`)) {
            return;
        }

        try {
            await apiClient.delete(`/admin/dynamic-offers/${offer.id}`);
            setOffers((prev) => prev.filter((o) => o.id !== offer.id));
        } catch {
            alert('Failed to delete offer.');
        }
    };

    // Filtered offers list
    const filteredOffers = useMemo(() => {
        return offers.filter((o) => {
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchesTitle = o.title.toLowerCase().includes(q);
                const matchesBanner = (o.banner_text || '').toLowerCase().includes(q);
                if (!matchesTitle && !matchesBanner) return false;
            }

            if (statusFilter === 'active' && !o.is_active) return false;
            if (statusFilter === 'inactive' && o.is_active) return false;

            if (scopeFilter === 'all_courses' && o.scope_type !== 'all') return false;
            if (scopeFilter === 'category' && o.scope_type !== 'category') return false;
            if (scopeFilter === 'course' && o.scope_type !== 'course') return false;

            return true;
        });
    }, [offers, searchQuery, statusFilter, scopeFilter]);

    // Modal filtered categories
    const filteredModalCategories = useMemo(() => {
        if (!modalCategorySearch.trim()) return categoriesList;
        const q = modalCategorySearch.toLowerCase();
        return categoriesList.filter(
            (cat) => cat.name.toLowerCase().includes(q) || cat.slug.toLowerCase().includes(q)
        );
    }, [categoriesList, modalCategorySearch]);

    // Modal filtered courses (by title and category filter)
    const filteredModalCourses = useMemo(() => {
        return coursesList.filter((c) => {
            if (modalCourseSearch.trim()) {
                const q = modalCourseSearch.toLowerCase();
                if (!c.title.toLowerCase().includes(q)) return false;
            }
            if (modalCourseCategoryFilter !== 'all') {
                const catId = Number(modalCourseCategoryFilter);
                if (c.category_id !== catId) return false;
            }
            return true;
        });
    }, [coursesList, modalCourseSearch, modalCourseCategoryFilter]);

    return (
        <div className="space-y-6">
            {/* Header with Title and Create Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div>
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 dark:bg-sky-950/60 text-[#25a2ee] border border-sky-200 dark:border-sky-800 mb-2">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Marketing Automation</span>
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        Dynamic Offer Builder
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Configure tiered discounts (e.g. Buy 2 get 15% off, Buy 3 get 25% off) with scope rules for the whole store, categories, or specific courses.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleOpenCreateModal}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#25a2ee] hover:bg-[#1f8ed1] text-white font-bold text-sm shadow-md shadow-[#25a2ee]/25 transition-all cursor-pointer self-start sm:self-auto shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    <span>Create New Offer</span>
                </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-[#25a2ee] flex items-center justify-center font-bold">
                        <Gift className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-400">Total Offers</p>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                            {stats.total_offers}
                        </h3>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center font-bold">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-400">Active Rules</p>
                        <h3 className="text-2xl font-black text-emerald-600 mt-0.5">
                            {stats.active_offers}
                        </h3>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center font-bold">
                        <Layers className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-400">Storewide Offers</p>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                            {stats.global_offers}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search offers by title..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#25a2ee]"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                    {/* Status filter pills */}
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
                        <button
                            type="button"
                            onClick={() => setStatusFilter('all')}
                            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                                statusFilter === 'all'
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                                    : 'text-slate-600 dark:text-slate-300'
                            }`}
                        >
                            All Status
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter('active')}
                            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                                statusFilter === 'active'
                                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold'
                                    : 'text-slate-600 dark:text-slate-300'
                            }`}
                        >
                            Active
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter('inactive')}
                            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                                statusFilter === 'inactive'
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                                    : 'text-slate-600 dark:text-slate-300'
                            }`}
                        >
                            Inactive
                        </button>
                    </div>

                    {/* Scope select */}
                    <select
                        value={scopeFilter}
                        onChange={(e) => setScopeFilter(e.target.value as any)}
                        className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden"
                    >
                        <option value="all">All Scopes</option>
                        <option value="all_courses">Storewide (All)</option>
                        <option value="category">Category-Specific</option>
                        <option value="course">Course-Specific</option>
                    </select>
                </div>
            </div>

            {/* Offers Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#25a2ee]" />
                        <span className="text-sm font-semibold">Loading dynamic offers...</span>
                    </div>
                ) : filteredOffers.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 space-y-3">
                        <Gift className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                        <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                            No Dynamic Offers Found
                        </h3>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                            No rules found matching your filters. Click "Create New Offer" to set up your first multi-course discount rule.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs sm:text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
                                <tr>
                                    <th className="px-5 py-3.5">Offer Title</th>
                                    <th className="px-5 py-3.5">Scope Rule</th>
                                    <th className="px-5 py-3.5">Tiered Discount Rules</th>
                                    <th className="px-5 py-3.5">Status</th>
                                    <th className="px-5 py-3.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-200">
                                {filteredOffers.map((offer) => {
                                    return (
                                        <tr
                                            key={offer.id}
                                            className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                                        >
                                            {/* Offer Title */}
                                            <td className="px-5 py-4 max-w-xs">
                                                <div className="font-bold text-slate-900 dark:text-white line-clamp-2">
                                                    {offer.title}
                                                </div>
                                                {offer.min_order_amount && (
                                                    <div className="text-[10px] text-slate-400 mt-1">
                                                        Min cart: {formatBDT(offer.min_order_amount)}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Scope */}
                                            <td className="px-5 py-4">
                                                {offer.scope_type === 'all' && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                                        <Layers className="w-3 h-3" />
                                                        <span>All Courses (Storewide)</span>
                                                    </span>
                                                )}
                                                {offer.scope_type === 'category' && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                                                        <Tag className="w-3 h-3" />
                                                        <span>
                                                            {offer.applicable_categories?.length || 0} Categories
                                                        </span>
                                                    </span>
                                                )}
                                                {offer.scope_type === 'course' && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                                        <BookOpen className="w-3 h-3" />
                                                        <span>
                                                            {offer.applicable_courses?.length || 0} Specific Courses
                                                        </span>
                                                    </span>
                                                )}
                                            </td>

                                            {/* Tiers Pills */}
                                            <td className="px-5 py-4">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    {(offer.tiers || []).map((t, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                                                        >
                                                            <span>{t.min_qty}+ Items:</span>
                                                            <strong className="text-[#25a2ee]">
                                                                {t.discount_type === 'percentage'
                                                                    ? `${t.discount_value}% OFF`
                                                                    : `-${formatBDT(t.discount_value)}`}
                                                            </strong>
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>

                                            {/* Status Toggle */}
                                            <td className="px-5 py-4">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleStatus(offer)}
                                                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                                                        offer.is_active
                                                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                                                    }`}
                                                >
                                                    <span
                                                        className={`w-1.5 h-1.5 rounded-full ${
                                                            offer.is_active ? 'bg-emerald-500' : 'bg-slate-400'
                                                        }`}
                                                    />
                                                    <span>{offer.is_active ? 'Active' : 'Inactive'}</span>
                                                </button>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenEditModal(offer)}
                                                        className="p-1.5 rounded-lg text-slate-500 hover:text-[#25a2ee] hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                                        title="Edit Offer"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteOffer(offer)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                                        title="Delete Offer"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create / Edit Offer Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
                        onClick={() => !saving && setModalOpen(false)}
                    />

                    {/* Modal Box */}
                    <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 z-10 animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-[#25a2ee]" />
                                    <span>{editingOffer ? 'Edit Dynamic Offer' : 'Create Dynamic Offer'}</span>
                                </h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Configure multi-course discount rules and quantity thresholds for student carts.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSaveOffer} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                            {feedback && (
                                <div
                                    className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                                        feedback.type === 'error'
                                            ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-400'
                                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400'
                                    }`}
                                >
                                    {feedback.type === 'error' ? (
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                    ) : (
                                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                                    )}
                                    <span>{feedback.text}</span>
                                </div>
                            )}

                            {/* Offer Title */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Offer Title <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Special Bundle Saver: Buy 2 Get 15% Off, Buy 3 Get 25% Off"
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#25a2ee]"
                                />
                            </div>

                            {/* Scope Selection */}
                            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                        Applicable Course Scope <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={formData.scope_type}
                                        onChange={(e) =>
                                            setFormData({ ...formData, scope_type: e.target.value as any })
                                        }
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#25a2ee] cursor-pointer"
                                    >
                                        <option value="all">All Courses (Storewide)</option>
                                        <option value="category">Specific Categories</option>
                                        <option value="course">Specific Courses</option>
                                    </select>
                                    <p className="text-[11px] text-slate-400">
                                        {formData.scope_type === 'all' &&
                                            'Storewide: Any course added to the cart counts toward the tiered discount.'}
                                        {formData.scope_type === 'category' &&
                                            'Category Scope: Only courses belonging to the selected categories qualify.'}
                                        {formData.scope_type === 'course' &&
                                            'Course Scope: Only the specifically selected courses qualify for the offer.'}
                                    </p>
                                </div>

                                {/* Category Scope Multi-Select Picker with Search */}
                                {formData.scope_type === 'category' && (
                                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                            <div>
                                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                                    Eligible Categories ({formData.applicable_categories.length} selected)
                                                </span>
                                                <p className="text-[11px] text-slate-400">
                                                    Search and select the categories where this offer is applicable.
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={handleSelectAllFilteredCategories}
                                                    className="text-[11px] font-bold text-[#25a2ee] hover:underline cursor-pointer"
                                                >
                                                    Select All Matching ({filteredModalCategories.length})
                                                </button>
                                                {formData.applicable_categories.length > 0 && (
                                                    <>
                                                        <span className="text-slate-300 dark:text-slate-600">•</span>
                                                        <button
                                                            type="button"
                                                            onClick={handleClearCategories}
                                                            className="text-[11px] font-bold text-rose-500 hover:underline cursor-pointer"
                                                        >
                                                            Clear Selection
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Category Search Input */}
                                        <div className="relative">
                                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="text"
                                                value={modalCategorySearch}
                                                onChange={(e) => setModalCategorySearch(e.target.value)}
                                                placeholder="Search categories by name..."
                                                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#25a2ee]"
                                            />
                                        </div>

                                        {/* Categories List */}
                                        <div className="max-h-56 overflow-y-auto space-y-1 pr-1 divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-xl bg-white dark:bg-slate-850 p-2">
                                            {filteredModalCategories.length === 0 ? (
                                                <div className="p-4 text-center text-xs text-slate-400">
                                                    No categories found matching your search.
                                                </div>
                                            ) : (
                                                filteredModalCategories.map((cat) => {
                                                    const selected = formData.applicable_categories.includes(cat.id);
                                                    return (
                                                        <div
                                                            key={cat.id}
                                                            onClick={() => handleToggleCategory(cat.id)}
                                                            className={`p-2.5 rounded-lg flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                                                                selected
                                                                    ? 'bg-sky-50 dark:bg-sky-950/40 text-slate-900 dark:text-white'
                                                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                <div
                                                                    className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                                                                        selected
                                                                            ? 'bg-[#25a2ee] border-[#25a2ee] text-white'
                                                                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                                                                    }`}
                                                                >
                                                                    {selected && <Check className="w-3 h-3 stroke-[3]" />}
                                                                </div>
                                                                <span className="text-xs font-bold truncate">
                                                                    {cat.name}
                                                                </span>
                                                            </div>
                                                            <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold shrink-0">
                                                                {cat.courses_count ?? 0} courses
                                                            </span>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Course Scope Multi-Select Picker with Course Search & Category Filter */}
                                {formData.scope_type === 'course' && (
                                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                            <div>
                                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                                    Eligible Courses ({formData.applicable_courses.length} selected)
                                                </span>
                                                <p className="text-[11px] text-slate-400">
                                                    Search and select specific courses that qualify for this bundle offer.
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={handleSelectAllFilteredCourses}
                                                    className="text-[11px] font-bold text-[#25a2ee] hover:underline cursor-pointer"
                                                >
                                                    Select All Matching ({filteredModalCourses.length})
                                                </button>
                                                {formData.applicable_courses.length > 0 && (
                                                    <>
                                                        <span className="text-slate-300 dark:text-slate-600">•</span>
                                                        <button
                                                            type="button"
                                                            onClick={handleClearCourses}
                                                            className="text-[11px] font-bold text-rose-500 hover:underline cursor-pointer"
                                                        >
                                                            Clear Selection
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Search Bar & Category Filter Row */}
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            {/* Course Title Search */}
                                            <div className="relative flex-1">
                                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                                <input
                                                    type="text"
                                                    value={modalCourseSearch}
                                                    onChange={(e) => setModalCourseSearch(e.target.value)}
                                                    placeholder="Search course by title..."
                                                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#25a2ee]"
                                                />
                                            </div>

                                            {/* Category Filter Dropdown */}
                                            <div className="w-full sm:w-56 shrink-0">
                                                <select
                                                    value={modalCourseCategoryFilter}
                                                    onChange={(e) => setModalCourseCategoryFilter(e.target.value)}
                                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#25a2ee] cursor-pointer"
                                                >
                                                    <option value="all">All Categories ({coursesList.length})</option>
                                                    {categoriesList.map((cat) => (
                                                        <option key={cat.id} value={String(cat.id)}>
                                                            {cat.name} ({cat.courses_count ?? 0})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Course List */}
                                        <div className="max-h-60 overflow-y-auto space-y-1 pr-1 divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-xl bg-white dark:bg-slate-850 p-2">
                                            {filteredModalCourses.length === 0 ? (
                                                <div className="p-4 text-center text-xs text-slate-400">
                                                    No courses found matching your search or category filter.
                                                </div>
                                            ) : (
                                                filteredModalCourses.map((c) => {
                                                    const selected = formData.applicable_courses.includes(c.id);
                                                    const cat = categoriesList.find((item) => item.id === c.category_id);
                                                    return (
                                                        <div
                                                            key={c.id}
                                                            onClick={() => handleToggleCourse(c.id)}
                                                            className={`p-2.5 rounded-lg flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                                                                selected
                                                                    ? 'bg-sky-50 dark:bg-sky-950/40 text-slate-900 dark:text-white'
                                                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                <div
                                                                    className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                                                                        selected
                                                                            ? 'bg-[#25a2ee] border-[#25a2ee] text-white'
                                                                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                                                                    }`}
                                                                >
                                                                    {selected && <Check className="w-3 h-3 stroke-[3]" />}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <span className="text-xs font-bold block truncate">
                                                                        {c.title}
                                                                    </span>
                                                                    {cat && (
                                                                        <span className="text-[10px] text-slate-400 font-medium">
                                                                            {cat.name}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <span className="text-xs font-black text-[#25a2ee] shrink-0">
                                                                {formatBDT(c.sale_price || c.price)}
                                                            </span>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Tier Rule Builder (Quantity Thresholds & Discounts) */}
                            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                            Quantity Discount Rules / Tiers <span className="text-rose-500">*</span>
                                        </label>
                                        <p className="text-[11px] text-slate-400">
                                            Set how much discount students receive when adding 2, 3, 4 or more courses.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddTier}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-[#25a2ee] hover:bg-sky-100 font-bold text-xs cursor-pointer border border-sky-200 dark:border-sky-800"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Add Tier Rule</span>
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {formData.tiers.map((tier, idx) => (
                                        <div
                                            key={idx}
                                            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                                        >
                                            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                                                {/* Min Quantity */}
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                                        If cart has:
                                                    </span>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={tier.min_qty}
                                                        onChange={(e) =>
                                                            handleTierChange(idx, 'min_qty', parseInt(e.target.value, 10) || 1)
                                                        }
                                                        className="w-16 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white text-center focus:ring-1 focus:ring-[#25a2ee]"
                                                    />
                                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                                        courses
                                                    </span>
                                                </div>

                                                <ArrowRight className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />

                                                {/* Discount Type */}
                                                <select
                                                    value={tier.discount_type}
                                                    onChange={(e) =>
                                                        handleTierChange(idx, 'discount_type', e.target.value as any)
                                                    }
                                                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden"
                                                >
                                                    <option value="percentage">Percentage (%)</option>
                                                    <option value="fixed">Flat Amount (Tk)</option>
                                                </select>

                                                {/* Discount Value */}
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step={tier.discount_type === 'percentage' ? '1' : '10'}
                                                        value={tier.discount_value}
                                                        onChange={(e) =>
                                                            handleTierChange(idx, 'discount_value', parseFloat(e.target.value) || 0)
                                                        }
                                                        className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold text-[#25a2ee] text-center focus:ring-1 focus:ring-[#25a2ee]"
                                                    />
                                                    <span className="text-xs font-bold text-slate-500">
                                                        {tier.discount_type === 'percentage' ? '%' : 'Tk'}
                                                    </span>
                                                </div>
                                            </div>

                                            {formData.tiers.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveTier(idx)}
                                                    className="text-xs text-rose-500 hover:text-rose-600 font-semibold p-1 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer self-end sm:self-auto"
                                                    title="Remove tier"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Additional Settings: Minimum Cart Value, Priority, Dates & Status */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Min Cart Value (Tk)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.min_order_amount}
                                        onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                                        placeholder="Optional (e.g. 1000)"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Start Date (Optional)
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        End Date (Optional)
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            {/* Active Switch */}
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                <div>
                                    <span className="text-xs font-bold text-slate-800 dark:text-white block">
                                        Offer Status (Active / Inactive)
                                    </span>
                                    <p className="text-[11px] text-slate-400">
                                        When active, students will automatically get the discount when cart thresholds are met.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                                        formData.is_active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                                    }`}
                                >
                                    <span
                                        className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                                            formData.is_active ? 'left-6.5' : 'left-0.5'
                                        }`}
                                    />
                                </button>
                            </div>

                            {/* Modal Footer Buttons */}
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-2.5 rounded-xl bg-[#25a2ee] hover:bg-[#1f8ed1] text-white font-bold text-xs shadow-md shadow-[#25a2ee]/25 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    <span>{editingOffer ? 'Update Offer' : 'Save & Publish Offer'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
