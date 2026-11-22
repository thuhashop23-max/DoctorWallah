import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiClient, formatBDT, getImageUrl } from '../../api/client';
import { Course, Category, CustomPage } from '../../types';
import { PageBlockRenderer } from '../../components/builder/PageBlockRenderer';
import { useLanguage } from '../../context/LanguageContext';
import { 
    Search, 
    BookOpen, 
    Layers, 
    Sparkles, 
    X, 
    ChevronRight, 
    ChevronLeft,
    ChevronsLeft,
    ChevronsRight,
    CheckCircle2, 
    Video, 
    Users,
    Loader2,
    ShoppingCart,
    PlayCircle 
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { ClinicalCourseCard } from '../../components/shared/ClinicalCourseCard';

interface PaginationMeta {
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
    per_page: number;
}

export const CoursesPage: React.FC = () => {
    const { t, language } = useLanguage();
    const { addToCart, isInCart } = useCart();
    const [searchParams, setSearchParams] = useSearchParams();
    const [courses, setCourses] = useState<Course[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [pageConfig, setPageConfig] = useState<CustomPage | null>(null);
    const [loading, setLoading] = useState(true);

    const activeCategory = searchParams.get('category') || '';
    const activeSearch = searchParams.get('search') || '';
    const [defaultSort, setDefaultSort] = useState<string>('best_selling');
    const activeSort = searchParams.get('sort') || defaultSort;
    const [searchInput, setSearchInput] = useState(activeSearch);

    useEffect(() => {
        setSearchInput(activeSearch);
    }, [activeSearch]);

    const [currentPage, setCurrentPage] = useState<number>(() => {
        const p = parseInt(searchParams.get('page') || '1', 10);
        return isNaN(p) || p < 1 ? 1 : p;
    });
    const [perPage, setPerPage] = useState<number>(12);
    const [pagination, setPagination] = useState<PaginationMeta>({
        current_page: 1,
        last_page: 1,
        total: 0,
        from: 0,
        to: 0,
        per_page: 12,
    });

    // Fetch page settings from visual page builder/admin page edit
    useEffect(() => {
        const fetchPageAndCategories = async () => {
            try {
                const [catsRes, pageRes] = await Promise.allSettled([
                    apiClient.get('/categories'),
                    apiClient.get('/pages/courses'),
                ]);

                let allCats: Category[] = [];
                if (catsRes.status === 'fulfilled') {
                    allCats = catsRes.value.data || [];
                }

                // Filter out pseudo categories 'free-courses' & 'paid-courses'
                let validCats = allCats.filter(c => c.slug !== 'free-courses' && c.slug !== 'paid-courses');

                if (pageRes.status === 'fulfilled' && pageRes.value.data?.page) {
                    const page = pageRes.value.data.page;
                    setPageConfig(page);

                    // Check if page builder has course_tabs block with selectedCategorySlugs
                    const tabBlock = (page.blocks || []).find((b: any) => b.type === 'course_tabs');
                    if (tabBlock?.settings?.selectedCategorySlugs && Array.isArray(tabBlock.settings.selectedCategorySlugs)) {
                        const selectedSlugs: string[] = tabBlock.settings.selectedCategorySlugs;
                        if (selectedSlugs.length > 0) {
                            validCats = validCats.filter(c => selectedSlugs.includes(c.slug));
                        }
                    }
                    if (tabBlock?.settings?.sortBy) {
                        setDefaultSort(tabBlock.settings.sortBy);
                    }
                }

                setCategories(validCats);
            } catch {
                // handle error
            }
        };

        fetchPageAndCategories();
    }, []);

    useEffect(() => {
        const pageFromUrl = parseInt(searchParams.get('page') || '1', 10);
        const validPage = isNaN(pageFromUrl) || pageFromUrl < 1 ? 1 : pageFromUrl;
        setCurrentPage(validPage);
        fetchCourses(validPage, perPage, activeCategory, activeSearch, activeSort);
    }, [activeCategory, activeSearch, activeSort, searchParams.get('page')]);

    const fetchCourses = async (
        page = currentPage,
        pageSize = perPage,
        cat = activeCategory,
        q = activeSearch,
        sort = activeSort
    ) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', String(page));
            params.append('per_page', String(pageSize));
            if (cat) params.append('category', cat);
            if (q) params.append('search', q);
            if (sort) params.append('sort', sort);

            const { data } = await apiClient.get(`/courses?${params.toString()}`);
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
        } catch {
            // handle error
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > pagination.last_page || newPage === currentPage) return;
        const newParams = new URLSearchParams(searchParams);
        newParams.set('page', String(newPage));
        setSearchParams(newParams);
        setCurrentPage(newPage);
        fetchCourses(newPage, perPage, activeCategory, activeSearch);
        window.scrollTo({ top: 180, behavior: 'smooth' });
    };

    const handlePerPageChange = (newSize: number) => {
        setPerPage(newSize);
        const newParams = new URLSearchParams(searchParams);
        newParams.set('page', '1');
        setSearchParams(newParams);
        setCurrentPage(1);
        fetchCourses(1, newSize, activeCategory, activeSearch);
    };

    const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const newParams = new URLSearchParams(searchParams);
        const q = searchInput.trim();
        if (q) {
            newParams.set('search', q);
        } else {
            newParams.delete('search');
        }
        newParams.delete('page');
        setSearchParams(newParams);
    };

    const handleClearSearch = () => {
        setSearchInput('');
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('search');
        newParams.delete('page');
        setSearchParams(newParams);
    };

    const handleSelectCategory = (categorySlug: string) => {
        const newParams = new URLSearchParams(searchParams);
        if (!categorySlug || categorySlug === 'all') {
            newParams.delete('category');
        } else {
            newParams.set('category', categorySlug);
        }
        newParams.delete('page');
        setSearchParams(newParams);
    };

    const handleSortChange = (newSort: string) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('sort', newSort);
        newParams.delete('page');
        setSearchParams(newParams);
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

    // If page is fully customized with custom blocks (beyond standard grid), render builder view
    const isCustomizedInBuilder = pageConfig && 
        Array.isArray(pageConfig.blocks) && 
        pageConfig.blocks.length > 0 &&
        pageConfig.blocks.some(b => b.type !== 'course_tabs');

    if (isCustomizedInBuilder && pageConfig) {
        return (
            <div className="space-y-0">
                {pageConfig.custom_css && <style>{pageConfig.custom_css}</style>}
                {pageConfig.blocks.map(block => (
                    <PageBlockRenderer key={block.id} block={block} isBuilder={false} />
                ))}
            </div>
        );
    }

    const currentCategoryObj = categories.find(c => c.slug === activeCategory);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-10">
            {/* Header & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200/80 dark:border-slate-800 pb-8">
                <div>
                    <div className="inline-flex items-center gap-2 text-xs font-bold text-[#A60201] uppercase tracking-widest mb-2">
                        <Sparkles className="w-4 h-4" />
                        <span>Course Catalog</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {currentCategoryObj ? currentCategoryObj.name : 'All Courses'}
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {currentCategoryObj?.description || 'Choose the right course to achieve your goals. Comprehensive preparation with top instructors.'}
                    </p>
                </div>

                {/* Search Bar with dedicated Search button */}
                <form onSubmit={handleSearchSubmit} className="relative max-w-md w-full">
                    <div className="relative w-full">
                        <input
                            type="text"
                            name="q"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder={t.courses?.searchPlaceholder || 'Search courses by name or subject...'}
                            className="w-full pl-11 pr-24 py-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#A60201] text-sm shadow-2xs placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        />
                        <button
                            type="submit"
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-[#A60201] cursor-pointer"
                            title="Search courses"
                        >
                            <Search className="w-5 h-5" />
                        </button>
                        {searchInput && (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                className="absolute right-24 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                title="Clear search"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            type="submit"
                            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-[#A60201] hover:bg-[#880101] text-white font-bold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                            <Search className="w-3.5 h-3.5" />
                            <span>Search</span>
                        </button>
                    </div>
                </form>
            </div>

            {/* Category Filter Tabs & Sorting */}
            <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#A60201]" />
                        <span>Filter by Category</span>
                    </span>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                        {/* Sort Selector */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">Sort:</span>
                            <select
                                value={activeSort}
                                onChange={(e) => handleSortChange(e.target.value)}
                                className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#A60201] cursor-pointer shadow-2xs"
                            >
                                <option value="best_selling">Best Selling (Most Sales)</option>
                                <option value="alphabetical_asc">Alphabetical (A - Z)</option>
                                <option value="alphabetical_desc">Alphabetical (Z - A)</option>
                                <option value="latest">Newest First</option>
                                <option value="price_low">Price: Low to High</option>
                                <option value="price_high">Price: High to Low</option>
                            </select>
                        </div>

                        {activeCategory && (
                            <button
                                type="button"
                                onClick={() => handleSelectCategory('all')}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-600 cursor-pointer"
                            >
                                <X className="w-3.5 h-3.5" />
                                <span>Reset Filter</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Horizontally Scrollable Category Pill Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                    {/* All Courses Tab */}
                    <button
                        type="button"
                        onClick={() => handleSelectCategory('all')}
                        className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
                            activeCategory === ''
                                ? 'bg-[#A60201] text-white shadow-md shadow-[#A60201]/30 ring-2 ring-[#A60201]/20'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 shadow-2xs'
                        }`}
                    >
                        <span>All Courses</span>
                        {pagination.total > 0 && activeCategory === '' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-white/20 text-white">
                                {pagination.total}
                            </span>
                        )}
                    </button>

                    {/* Educational Categories Selected in Builder/Page Edit */}
                    {categories.map((cat) => {
                        const isSelected = activeCategory === cat.slug;
                        return (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => handleSelectCategory(cat.slug)}
                                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
                                    isSelected
                                        ? 'bg-[#A60201] text-white shadow-md shadow-[#A60201]/30 ring-2 ring-[#A60201]/20'
                                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 shadow-2xs'
                                }`}
                            >
                                <span>{cat.name}</span>
                                {cat.courses_count !== undefined && cat.courses_count > 0 && (
                                    <span
                                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                            isSelected
                                                ? 'bg-white/20 text-white'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                        }`}
                                    >
                                        {cat.courses_count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Courses Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                        <div key={n} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 animate-pulse space-y-4">
                            <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                            <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                        </div>
                    ))}
                </div>
            ) : courses.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
                    <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">
                        No Courses Found
                    </h3>
                    <p className="text-xs text-slate-400">
                        There are currently no courses in this category or matching your search.
                    </p>
                    {activeCategory && (
                        <button
                            type="button"
                            onClick={() => handleSelectCategory('all')}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#A60201] text-white font-bold text-xs rounded-xl shadow-xs hover:bg-[#880101] transition-colors cursor-pointer"
                        >
                            <span>View All Courses</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                    {courses.map((course) => (
                        <ClinicalCourseCard
                            key={course.id}
                            course={course}
                            addToCart={addToCart}
                            isInCart={isInCart}
                        />
                    ))}
                </div>
            )}

            {/* Pagination Controls */}
            {!loading && courses.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                    {/* Left: Stats & Per-Page Selector */}
                    <div className="flex flex-wrap items-center gap-3">
                        <span>
                            Showing <strong className="text-slate-900 dark:text-white">{pagination.from || 0}</strong> to{' '}
                            <strong className="text-slate-900 dark:text-white">{pagination.to || 0}</strong> of{' '}
                            <strong className="text-slate-900 dark:text-white">{pagination.total}</strong> published courses
                        </span>

                        <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200 dark:border-slate-800">
                            <span className="text-slate-400">Per page:</span>
                            <select
                                value={perPage}
                                onChange={(e) => handlePerPageChange(Number(e.target.value))}
                                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer focus:ring-2 focus:ring-[#A60201]"
                            >
                                <option value={12}>12</option>
                                <option value={24}>24</option>
                                <option value={48}>48</option>
                                <option value={96}>96</option>
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
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                                title="First Page"
                            >
                                <ChevronsLeft className="w-4 h-4" />
                            </button>

                            {/* Previous Page */}
                            <button
                                type="button"
                                disabled={currentPage <= 1 || loading}
                                onClick={() => handlePageChange(currentPage - 1)}
                                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-1"
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
                                            className={`w-7 sm:w-8 h-7 sm:h-8 rounded-lg font-bold text-xs transition cursor-pointer ${
                                                isActive
                                                    ? 'bg-[#A60201] text-white shadow-xs'
                                                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
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
                                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-1"
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
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                                title="Last Page"
                            >
                                <ChevronsRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
