import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';
import { useTheme } from '../../context/ThemeContext';
import { getLocalizedText } from '../../utils/localization';
import { apiClient } from '../../api/client';
import {
    Home,
    GraduationCap,
    BookOpen,
    Users,
    ClipboardList,
    Search,
    Menu,
    X,
    LogOut,
    ChevronDown,
    Sparkles,
    Gem,
    Boxes,
    PhoneCall,
    BookMarked,
    Shield,
    Bell,
    CheckCheck,
    ExternalLink,
    ChevronRight,
    ShoppingCart,
    Sun,
    Moon
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { HeaderMenuItem } from '../../types';

export const Navbar: React.FC = () => {
    const { user, logout } = useAuth();
    const { cartCount, toggleCart } = useCart();
    const { t, language } = useLanguage();
    const { settings, loading } = useSettings();
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [openMobileSubmenuIds, setOpenMobileSubmenuIds] = useState<Record<string, boolean>>({});
    const [coursesDropdownOpen, setCoursesDropdownOpen] = useState(false);
    const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
    const [searchModalOpen, setSearchModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [logoError, setLogoError] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

    const toggleMobileSubmenu = (itemId: string) => {
        setOpenMobileSubmenuIds(prev => ({
            ...prev,
            [itemId]: !prev[itemId]
        }));
    };

    const headerSettings = settings?.header_settings;
    const logoUrl = headerSettings?.logo_url ?? settings?.logo_url;
    const logoHeight = headerSettings?.logo_height || 36;

    const brandTitle = getLocalizedText(
        headerSettings?.brand_title,
        headerSettings?.brand_title_en,
        language
    ) || (settings?.site_name ? settings.site_name.split(' ')[0] : 'DoctorWallah');

    const brandSubtitle = getLocalizedText(
        headerSettings?.brand_subtitle,
        headerSettings?.brand_subtitle_en,
        language
    ) || (settings?.site_name && settings.site_name.split(' ').length > 1
        ? settings.site_name.split(' ').slice(1).join(' ')
        : '');

    const announcementText = getLocalizedText(
        headerSettings?.announcement_text,
        headerSettings?.announcement_text_en,
        language
    );

    const isPointsActive = (settings as any)?.point_settings?.is_active !== false;

    // Course Categories for the Courses dropdown
    const courseCategories = [
        { id: 'c-all', label: 'All Courses', label_bn: 'সকল কোর্স', url: '/courses' },
        { id: 'c-academic', label: 'Academic Courses', label_bn: 'একাডেমিক কোর্স', url: '/courses?type=academic' },
        { id: 'c-admission', label: 'Admission & Varsity', label_bn: 'ভর্তি প্রস্তুতি', url: '/courses?type=admission' },
        { id: 'c-recorded', label: 'Recorded Batches', label_bn: 'রেকর্ডেড ব্যাচ', url: '/courses' },
        { id: 'c-free', label: 'Free Trial Classes', label_bn: 'ফ্রি ট্রায়াল ক্লাস', url: '/courses?type=free' },
    ];

    // Secondary items from DB if user wants to access other pages
    const rawMenuItems: HeaderMenuItem[] = (headerSettings?.menu_items && headerSettings.menu_items.length > 0)
        ? headerSettings.menu_items
        : [];

    const otherMenuItems = React.useMemo(() => {
        return rawMenuItems.filter(item => {
            const url = (item.url || '').toLowerCase();
            const label = (item.label || '').toLowerCase();
            return url !== '/' && url !== '/courses' && !label.includes('course') && !label.includes('হোম') && !label.includes('home');
        });
    }, [rawMenuItems]);

    useEffect(() => {
        setLogoError(false);
    }, [logoUrl]);

    // Close dropdowns on route change
    useEffect(() => {
        setMobileMenuOpen(false);
        setCoursesDropdownOpen(false);
        setMoreDropdownOpen(false);
        setSearchModalOpen(false);
        setNotifDropdownOpen(false);
        setOpenMobileSubmenuIds({});
    }, [location.pathname]);

    useEffect(() => {
        if (!user) return;
        const fetchNotifs = async () => {
            try {
                const { data } = await apiClient.get('/notifications');
                setNotifications(data.data || []);
                const unreadRes = await apiClient.get('/notifications/unread-count');
                setUnreadCount(unreadRes.data.unread_count || 0);
            } catch { }
        };
        fetchNotifs();
        const interval = setInterval(fetchNotifs, 30000);
        return () => clearInterval(interval);
    }, [user]);

    const markAllRead = async () => {
        try {
            await apiClient.post('/notifications/read-all');
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
        } catch { }
    };

    const handleNotificationClick = async (n: any) => {
        try {
            if (!n.read_at) {
                await apiClient.post(`/notifications/${n.id}/read`);
                setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read_at: new Date().toISOString() } : item));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch { }
        setNotifDropdownOpen(false);
        const targetLink = n.data?.link || n.link;
        if (targetLink) {
            navigate(targetLink);
        }
    };

    const getDashboardPath = () => {
        if (!user) return '/login';
        if (user.role === 'admin' || Boolean(user.custom_role_id || user.custom_role)) return '/admin';
        if (user.role === 'teacher') return '/teacher';
        return '/student';
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const q = searchQuery.trim();
        navigate(q ? `/courses?search=${encodeURIComponent(q)}` : '/courses');
        setSearchModalOpen(false);
        setSearchQuery('');
    };

    const isHome = location.pathname === '/';
    const isCourses = location.pathname.startsWith('/courses');

    // 10MS Style Header Banner Dismissal State
    const bannerKey = `${headerSettings?.banner_image_url || ''}_${headerSettings?.banner_title || ''}_${headerSettings?.banner_bg_color || ''}`;
    const [bannerDismissed, setBannerDismissed] = useState<boolean>(() => {
        try {
            return sessionStorage.getItem(`DoctorWallah_header_banner_dismissed_${bannerKey}`) === 'true';
        } catch {
            return false;
        }
    });

    useEffect(() => {
        try {
            const isDismissed = sessionStorage.getItem(`DoctorWallah_header_banner_dismissed_${bannerKey}`) === 'true';
            setBannerDismissed(isDismissed);
        } catch {
            setBannerDismissed(false);
        }
    }, [bannerKey]);

    const handleDismissBanner = () => {
        setBannerDismissed(true);
        try {
            sessionStorage.setItem(`DoctorWallah_header_banner_dismissed_${bannerKey}`, 'true');
        } catch { }
    };

    const shouldShowBanner = Boolean(
        headerSettings?.banner_enabled &&
        !bannerDismissed &&
        (headerSettings?.banner_show_on === 'home' ? isHome : true)
    );

    return (
        <div className={`${headerSettings?.sticky !== false ? 'sticky top-0' : 'relative'} z-50 w-full`}>
            {/* Announcement Top Banner */}
            {headerSettings?.announcement_enabled && announcementText && (
                <div
                    style={{ backgroundColor: headerSettings.announcement_bg || '#0284c7' }}
                    className="w-full text-white text-xs font-semibold py-1.5 px-3 sm:px-4 text-center shadow-xs transition-colors"
                >
                    <div className="max-w-7xl mx-auto flex items-center justify-center gap-1.5 sm:gap-2">
                        <span className="truncate">{announcementText}</span>
                        {headerSettings.announcement_link && (
                            headerSettings.announcement_link.startsWith('http') ? (
                                <a
                                    href={headerSettings.announcement_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline font-bold text-[11px] opacity-90 hover:opacity-100 inline-flex items-center gap-0.5 ml-1 shrink-0"
                                >
                                    <span>View</span>
                                    <ChevronRight className="w-3 h-3" />
                                </a>
                            ) : (
                                <Link
                                    to={headerSettings.announcement_link}
                                    className="underline font-bold text-[11px] opacity-90 hover:opacity-100 inline-flex items-center gap-0.5 ml-1 shrink-0"
                                >
                                    <span>View</span>
                                    <ChevronRight className="w-3 h-3" />
                                </Link>
                            )
                        )}
                    </div>
                </div>
            )}

            {/* Floating Capsule Header */}
            <header className="w-full pt-2 sm:pt-3.5 px-2.5 sm:px-4 lg:px-8 max-w-6xl mx-auto">
                <div className="w-full bg-white/95 dark:bg-[#0c0d12]/95 backdrop-blur-xl border border-slate-200/90 dark:border-white/10 rounded-2xl sm:rounded-full px-3 sm:px-5 py-2 sm:py-2.5 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_35px_-5px_rgba(0,0,0,0.7)] flex items-center justify-between gap-1.5 sm:gap-4 transition-all duration-200">
                    
                    {/* Brand Logo (Left) */}
                    <div className="flex items-center shrink-0 min-w-0">
                        <Link to="/" className="flex items-center gap-1.5 sm:gap-2.5 group">
                            {logoUrl && !logoError ? (
                                <img
                                    src={logoUrl}
                                    alt={settings?.site_name || 'DoctorWallah'}
                                    onError={() => setLogoError(true)}
                                    style={{ height: `${logoHeight}px` }}
                                    className="w-auto max-w-[110px] sm:max-w-[160px] object-contain group-hover:opacity-95 transition-opacity"
                                />
                            ) : loading ? (
                                <div style={{ height: `${logoHeight}px`, width: '100px' }} className="shrink-0" />
                            ) : (
                                <div className="flex items-center gap-1.5 sm:gap-2.5">
                                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-sky-500 to-teal-400 text-white flex items-center justify-center font-black shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform shrink-0">
                                        <GraduationCap className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-sm sm:text-base md:text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase font-sans">
                                            Doctor<span className="text-sky-500">Wallah</span>
                                        </span>
                                        {brandSubtitle && (
                                            <span className="text-[10px] font-bold text-sky-500 uppercase tracking-widest hidden lg:inline">
                                                {brandSubtitle}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </Link>
                    </div>

                    {/* Desktop Navigation Links (Center - Clean & Minimal) */}
                    <nav className="hidden md:flex items-center gap-1 lg:gap-3 shrink-0">
                        {/* 1. Home Link */}
                        <Link
                            to="/"
                            className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold transition-colors ${
                                isHome
                                    ? 'text-slate-950 dark:text-white font-bold'
                                    : 'text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'
                            }`}
                        >
                            <Home className="w-4 h-4 shrink-0" />
                            <span>{language === 'bn' ? 'হোম' : 'Home'}</span>
                            {isHome && (
                                <span className="absolute -bottom-1 left-2.5 right-2.5 h-0.5 bg-slate-950 dark:bg-white rounded-full shadow-[0_0_8px_rgba(0,0,0,0.3)] dark:shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
                            )}
                        </Link>

                        {/* 2. Courses Dropdown Link */}
                        <div
                            className="relative"
                            onMouseEnter={() => setCoursesDropdownOpen(true)}
                            onMouseLeave={() => setCoursesDropdownOpen(false)}
                        >
                            <Link
                                to="/courses"
                                onClick={() => setCoursesDropdownOpen(false)}
                                className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                                    isCourses || coursesDropdownOpen
                                        ? 'text-slate-950 dark:text-white font-bold'
                                        : 'text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'
                                }`}
                            >
                                <GraduationCap className="w-4 h-4 shrink-0" />
                                <span>{language === 'bn' ? 'কোর্সসমূহ' : 'Courses'}</span>
                                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${coursesDropdownOpen ? 'rotate-180 text-slate-900 dark:text-white' : ''}`} />
                                {isCourses && (
                                    <span className="absolute -bottom-1 left-2.5 right-2.5 h-0.5 bg-slate-950 dark:bg-white rounded-full shadow-[0_0_8px_rgba(0,0,0,0.3)] dark:shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
                                )}
                            </Link>

                            {/* Courses Dropdown Menu */}
                            {coursesDropdownOpen && (
                                <div className="absolute left-0 top-full mt-2 min-w-[210px] bg-white/95 dark:bg-[#12141c]/95 backdrop-blur-2xl rounded-2xl shadow-xl dark:shadow-2xl border border-slate-200/90 dark:border-white/10 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                    {courseCategories.map((cat) => (
                                        <Link
                                            key={cat.id}
                                            to={cat.url}
                                            className="block px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-950 dark:hover:text-white transition-colors"
                                        >
                                            {language === 'bn' ? cat.label_bn : cat.label}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 3. More Dropdown (If other pages exist) */}
                        {otherMenuItems.length > 0 && (
                            <div
                                className="relative"
                                onMouseEnter={() => setMoreDropdownOpen(true)}
                                onMouseLeave={() => setMoreDropdownOpen(false)}
                            >
                                <button
                                    type="button"
                                    onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                                    className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                                        moreDropdownOpen
                                            ? 'text-slate-950 dark:text-white font-bold'
                                            : 'text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'
                                    }`}
                                >
                                    <Boxes className="w-4 h-4 shrink-0" />
                                    <span>{language === 'bn' ? 'আরও' : 'More'}</span>
                                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${moreDropdownOpen ? 'rotate-180 text-slate-900 dark:text-white' : ''}`} />
                                </button>

                                {moreDropdownOpen && (
                                    <div className="absolute left-0 top-full mt-2 min-w-[200px] bg-white/95 dark:bg-[#12141c]/95 backdrop-blur-2xl rounded-2xl shadow-xl dark:shadow-2xl border border-slate-200/90 dark:border-white/10 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                        {otherMenuItems.map((item) => {
                                            const itemLabel = getLocalizedText(item.label, item.label_en, language) || item.label;
                                            return item.is_external || item.url.startsWith('http') ? (
                                                <a
                                                    key={item.id}
                                                    href={item.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-950 dark:hover:text-white transition-colors"
                                                >
                                                    <span>{itemLabel}</span>
                                                    <ExternalLink className="w-3 h-3 text-slate-400" />
                                                </a>
                                            ) : (
                                                <Link
                                                    key={item.id}
                                                    to={item.url}
                                                    className="block px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-950 dark:hover:text-white transition-colors"
                                                >
                                                    {itemLabel}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </nav>

                    {/* Right Side Actions Group */}
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                        {/* Search Button (Hidden on small mobile, search input is in mobile drawer) */}
                        <button
                            type="button"
                            onClick={() => setSearchModalOpen(true)}
                            className="hidden sm:flex w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200/80 text-slate-700 hover:text-slate-950 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:text-slate-300 dark:hover:text-white items-center justify-center transition-all cursor-pointer shrink-0"
                            title="Search Courses"
                            aria-label="Search"
                        >
                            <Search className="w-4 h-4" />
                        </button>

                        {/* Cart Button */}
                        <button
                            type="button"
                            onClick={toggleCart}
                            className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200/80 text-slate-700 hover:text-slate-950 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:text-slate-300 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
                            title="Shopping Cart"
                            aria-label="Shopping Cart"
                        >
                            <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-sky-500 text-white text-[9px] sm:text-[10px] font-black min-w-[15px] h-[15px] sm:min-w-[18px] sm:h-[18px] px-1 rounded-full flex items-center justify-center shadow-xs">
                                    {cartCount > 9 ? '9+' : cartCount}
                                </span>
                            )}
                        </button>

                        {/* Reward Points Pill (Visible on large screens, in drawer on mobile) */}
                        {isPointsActive && (
                            <Link
                                to="/earn-points"
                                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-600 dark:bg-amber-500/15 dark:border-amber-500/30 dark:text-amber-400 font-bold text-xs transition-all shadow-2xs group shrink-0"
                                title="My Reward Points"
                            >
                                <Gem className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
                                <span>{user ? (user.points ?? 0) : (language === 'bn' ? 'পয়েন্ট' : 'Points')}</span>
                            </Link>
                        )}

                        {/* Theme Switcher Button */}
                        {headerSettings?.show_theme_toggle !== false && (
                            <button
                                type="button"
                                onClick={toggleTheme}
                                title={isDark ? t.theme.switchToLight : t.theme.switchToDark}
                                aria-label="Theme toggle"
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200/80 text-slate-700 hover:text-slate-950 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:text-slate-300 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer select-none shrink-0"
                            >
                                {isDark ? (
                                    <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 transition-transform duration-300" />
                                ) : (
                                    <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-700 transition-transform duration-300" />
                                )}
                            </button>
                        )}

                        {/* Auth Area */}
                        {user ? (
                            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                                {/* Notification Bell (Hidden on small mobile, in drawer) */}
                                <div className="relative hidden sm:block">
                                    <button
                                        type="button"
                                        onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200/80 text-slate-700 hover:text-slate-950 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:text-slate-300 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer relative shrink-0"
                                        title="Notifications"
                                    >
                                        <Bell className="w-4 h-4" />
                                        {unreadCount > 0 && (
                                            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-[#0c0d12] animate-pulse" />
                                        )}
                                    </button>

                                    {notifDropdownOpen && (
                                        <div
                                            className="absolute right-0 mt-2 w-72 sm:w-80 bg-white/95 dark:bg-[#12141c]/98 backdrop-blur-2xl rounded-2xl shadow-xl dark:shadow-2xl border border-slate-200/90 dark:border-white/10 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                                            onMouseLeave={() => setNotifDropdownOpen(false)}
                                        >
                                            <div className="px-4 py-2 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between">
                                                <span className="text-xs font-bold text-slate-900 dark:text-white">Notifications</span>
                                                {unreadCount > 0 && (
                                                    <button
                                                        onClick={markAllRead}
                                                        className="text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                                                    >
                                                        <CheckCheck className="w-3 h-3" />
                                                        <span>Mark all as read</span>
                                                    </button>
                                                )}
                                            </div>
                                            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
                                                {notifications.length === 0 ? (
                                                    <div className="p-4 text-center text-xs text-slate-400">
                                                        No new notifications
                                                    </div>
                                                ) : (
                                                    notifications.slice(0, 8).map((n) => (
                                                        <div
                                                            key={n.id}
                                                            onClick={() => handleNotificationClick(n)}
                                                            className={`p-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer ${
                                                                !n.read_at ? 'bg-sky-50/60 dark:bg-sky-500/10' : ''
                                                            }`}
                                                        >
                                                            <div className="flex items-center justify-between gap-1">
                                                                <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                                                                    {n.data?.title || n.title || 'Notice'}
                                                                </p>
                                                                {!n.read_at && (
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                                                                )}
                                                            </div>
                                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                                                                {n.data?.message || n.message}
                                                            </p>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* User Dashboard Pill */}
                                <Link
                                    to={getDashboardPath()}
                                    className="flex items-center gap-1 sm:gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200/80 dark:bg-white/10 dark:hover:bg-white/15 dark:border-white/15 text-slate-800 dark:text-white transition-all shrink-0"
                                    title="My Dashboard"
                                >
                                    <div className="w-5 h-5 rounded-full bg-sky-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-bold text-xs hidden sm:inline max-w-[80px] truncate">
                                        {user.name.split(' ')[0]}
                                    </span>
                                </Link>

                                <button
                                    type="button"
                                    onClick={logout}
                                    className="hidden sm:flex p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-full transition-colors cursor-pointer shrink-0"
                                    title="Logout"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <Link
                                to="/login"
                                className="bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 font-bold px-3 sm:px-5 py-1 sm:py-1.5 rounded-full transition-all shadow-xs text-xs sm:text-sm cursor-pointer whitespace-nowrap shrink-0 flex items-center justify-center"
                            >
                                {language === 'bn' ? 'লগইন' : 'Login'}
                            </Link>
                        )}

                        {/* Mobile Hamburger Toggle Button */}
                        <button
                            type="button"
                            onClick={() => {
                                setMobileMenuOpen(!mobileMenuOpen);
                                if (mobileMenuOpen) {
                                    setOpenMobileSubmenuIds({});
                                }
                            }}
                            className="md:hidden w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200/80 text-slate-800 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                            aria-label="Toggle Menu"
                        >
                            {mobileMenuOpen ? <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Menu className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Backdrop */}
                {mobileMenuOpen && (
                    <div 
                        className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-150"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                )}

                {/* Mobile Floating Drawer (Fully responsive & theme-adaptive) */}
                {mobileMenuOpen && (
                    <div className="md:hidden relative z-50 mt-2 bg-white/98 dark:bg-[#0c0d12]/98 backdrop-blur-2xl border border-slate-200/90 dark:border-white/10 rounded-2xl sm:rounded-3xl p-4 shadow-2xl text-slate-800 dark:text-white space-y-3 max-h-[calc(82vh)] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                        {/* Drawer Header */}
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/10">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Menu
                            </span>
                            <button
                                type="button"
                                onClick={() => setMobileMenuOpen(false)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Mobile Search Bar */}
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                const q = searchQuery.trim();
                                navigate(q ? `/courses?search=${encodeURIComponent(q)}` : '/courses');
                                setMobileMenuOpen(false);
                                setSearchQuery('');
                            }}
                            className="relative"
                        >
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search courses or topics..."
                                className="w-full pl-9 pr-20 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                            />
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <button
                                type="submit"
                                className="absolute right-1 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                            >
                                Search
                            </button>
                        </form>

                        {/* Navigation Links */}
                        <div className="space-y-1 pt-1">
                            {/* 1. Home */}
                            <Link
                                to="/"
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl font-semibold text-xs sm:text-sm transition-colors ${
                                    isHome
                                        ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold'
                                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10'
                                }`}
                            >
                                <Home className="w-4 h-4 text-sky-500 shrink-0" />
                                <span>{language === 'bn' ? 'হোম' : 'Home'}</span>
                            </Link>

                            {/* 2. Courses (Expandable Accordion) */}
                            <div className="space-y-1">
                                <button
                                    type="button"
                                    onClick={() => toggleMobileSubmenu('courses')}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold text-xs sm:text-sm hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer text-left ${
                                        isCourses ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold' : 'text-slate-700 dark:text-slate-200'
                                    }`}
                                >
                                    <span className="flex items-center gap-2.5">
                                        <GraduationCap className="w-4 h-4 text-sky-500 shrink-0" />
                                        <span>{language === 'bn' ? 'কোর্সসমূহ' : 'Courses'}</span>
                                    </span>
                                    <ChevronDown
                                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                                            openMobileSubmenuIds['courses'] ? 'rotate-180 text-sky-500' : ''
                                        }`}
                                    />
                                </button>

                                {openMobileSubmenuIds['courses'] && (
                                    <div className="pl-6 space-y-1 border-l-2 border-sky-500/30 ml-4 my-1">
                                        {courseCategories.map((cat) => (
                                            <Link
                                                key={cat.id}
                                                to={cat.url}
                                                onClick={() => setMobileMenuOpen(false)}
                                                className="block px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-white"
                                            >
                                                • {language === 'bn' ? cat.label_bn : cat.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 3. Other Pages from Settings */}
                            {otherMenuItems.map((item) => {
                                const itemLabel = getLocalizedText(item.label, item.label_en, language) || item.label;
                                return item.is_external || item.url.startsWith('http') ? (
                                    <a
                                        key={item.id}
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center justify-between px-3 py-2 rounded-xl font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10"
                                    >
                                        <span className="flex items-center gap-2.5">
                                            <BookOpen className="w-4 h-4 text-sky-500 shrink-0" />
                                            <span>{itemLabel}</span>
                                        </span>
                                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                                    </a>
                                ) : (
                                    <Link
                                        key={item.id}
                                        to={item.url}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center justify-between px-3 py-2 rounded-xl font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10"
                                    >
                                        <span className="flex items-center gap-2.5">
                                            <BookOpen className="w-4 h-4 text-sky-500 shrink-0" />
                                            <span>{itemLabel}</span>
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Mobile Cart Button */}
                        <button
                            type="button"
                            onClick={() => {
                                setMobileMenuOpen(false);
                                toggleCart();
                            }}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                        >
                            <span className="flex items-center gap-2.5">
                                <ShoppingCart className="w-4 h-4 text-sky-500 shrink-0" />
                                <span>Cart</span>
                            </span>
                            {cartCount > 0 && (
                                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-sky-500 text-white">
                                    {cartCount}
                                </span>
                            )}
                        </button>

                        {/* Mobile Points Badge */}
                        {isPointsActive && (
                            <Link
                                to="/earn-points"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center justify-between px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400"
                            >
                                <span className="flex items-center gap-2">
                                    <Gem className="w-4 h-4 text-amber-500" />
                                    <span>My Reward Points</span>
                                </span>
                                <span className="px-2 py-0.5 bg-amber-500 text-white rounded-md text-[11px] font-extrabold flex items-center gap-1">
                                    <Gem className="w-3 h-3 text-white" />
                                    <span>{user ? (user.points ?? 0) : 0}</span>
                                </span>
                            </Link>
                        )}

                        {/* Mobile Auth Area */}
                        <div className="pt-2 border-t border-slate-200 dark:border-white/10">
                            {user ? (
                                <div className="space-y-2 pt-1">
                                    <div className="px-3 py-2 bg-slate-50 dark:bg-white/5 rounded-xl flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-full bg-sky-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                {user.name}
                                            </p>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                                {user.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 w-full">
                                        <Link
                                            to={getDashboardPath()}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="flex-1 py-2 text-center font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <Shield className="w-4 h-4" />
                                            <span>Dashboard</span>
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMobileMenuOpen(false);
                                                logout();
                                            }}
                                            className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/20 border border-slate-200 dark:border-white/10 rounded-xl transition-colors cursor-pointer"
                                            title="Logout"
                                        >
                                            <LogOut className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2 w-full pt-1">
                                    <Link
                                        to="/login"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="py-2.5 text-center font-bold text-white dark:text-slate-950 bg-slate-950 dark:bg-white hover:opacity-90 rounded-xl text-xs transition-all shadow-xs"
                                    >
                                        {language === 'bn' ? 'লগইন' : 'Login'}
                                    </Link>
                                    <Link
                                        to="/register"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="py-2.5 text-center font-bold text-slate-800 dark:text-white bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 border border-slate-200 dark:border-white/15 rounded-xl text-xs transition-all"
                                    >
                                        {language === 'bn' ? 'রেজিস্ট্রেশন' : 'Register'}
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </header>

            {/* Quick Search Modal */}
            {searchModalOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-xs">
                    <div className="bg-white dark:bg-[#10121a] text-slate-900 dark:text-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-white/10 relative animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
                            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-white text-sm">
                                <Search className="w-4 h-4 text-sky-500" />
                                <span>Search Courses or Topics</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSearchModalOpen(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg cursor-pointer transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSearchSubmit} className="mt-4 space-y-3">
                            <div className="relative">
                                <button
                                    type="submit"
                                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-500 cursor-pointer"
                                    title="Search"
                                >
                                    <Search className="w-4 h-4" />
                                </button>
                                <input
                                    type="text"
                                    autoFocus
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Type course name (e.g. Fundamental Calculus, Physics...)"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white placeholder:text-slate-400"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 bg-slate-950 dark:bg-white text-white dark:text-slate-950 hover:opacity-90 font-bold rounded-2xl text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                            >
                                <Search className="w-4 h-4" />
                                <span>Search Courses</span>
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* 10 MINUTE SCHOOL STYLE SUB-HEADER BANNER */}
            {shouldShowBanner && (
                <div
                    style={{
                        backgroundColor: headerSettings?.banner_bg_color || '#8a0000',
                        color: headerSettings?.banner_text_color || '#ffffff',
                    }}
                    className="w-full relative shadow-xs overflow-hidden border-b border-black/10 z-40 transition-all duration-300 mt-2"
                >
                    {/* Mode 1: Image Banner */}
                    {headerSettings?.banner_mode !== 'text' && headerSettings?.banner_image_url ? (
                        headerSettings.banner_link ? (
                            headerSettings.banner_link.startsWith('http') ? (
                                <a
                                    href={headerSettings.banner_link}
                                    target={headerSettings.banner_link_open_new_tab ? '_blank' : '_self'}
                                    rel={headerSettings.banner_link_open_new_tab ? 'noopener noreferrer' : undefined}
                                    className="block relative w-full h-[55px] sm:h-[70px] md:h-[80px] lg:h-[85px] group overflow-hidden"
                                >
                                    <img
                                        src={headerSettings.banner_image_url}
                                        alt={headerSettings.banner_title || 'Promotional Banner'}
                                        className="w-full h-full object-cover sm:object-contain object-center mx-auto transition-transform duration-300 group-hover:scale-[1.008]"
                                    />
                                </a>
                            ) : (
                                <Link
                                    to={headerSettings.banner_link}
                                    className="block relative w-full h-[55px] sm:h-[70px] md:h-[80px] lg:h-[85px] group overflow-hidden"
                                >
                                    <img
                                        src={headerSettings.banner_image_url}
                                        alt={headerSettings.banner_title || 'Promotional Banner'}
                                        className="w-full h-full object-cover sm:object-contain object-center mx-auto transition-transform duration-300 group-hover:scale-[1.008]"
                                    />
                                </Link>
                            )
                        ) : (
                            <div className="relative w-full h-[55px] sm:h-[70px] md:h-[80px] lg:h-[85px] overflow-hidden">
                                <img
                                    src={headerSettings.banner_image_url}
                                    alt={headerSettings.banner_title || 'Promotional Banner'}
                                    className="w-full h-full object-cover sm:object-contain object-center mx-auto"
                                />
                            </div>
                        )
                    ) : (
                        /* Mode 2: Custom Text & Background Color Banner */
                        <div className="py-2.5 sm:py-3 px-3 sm:px-6 lg:px-8">
                            <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3 text-xs sm:text-sm">
                                <div className="flex items-center gap-2 min-w-0 pr-4 sm:pr-0">
                                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                                    <span className="font-extrabold truncate text-white">
                                        {headerSettings?.banner_title || 'First class is completely free in the new batch!'}
                                    </span>
                                    {headerSettings?.banner_subtitle && (
                                        <span className="hidden md:inline text-xs text-white/90 truncate font-medium">
                                            • {headerSettings.banner_subtitle}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                                    {headerSettings?.banner_btn_text && (
                                        headerSettings.banner_btn_link?.startsWith('http') ? (
                                            <a
                                                href={headerSettings.banner_btn_link}
                                                target={headerSettings.banner_link_open_new_tab ? '_blank' : '_self'}
                                                rel="noopener noreferrer"
                                                style={{
                                                    backgroundColor: headerSettings.banner_btn_bg || '#16a34a',
                                                    color: headerSettings.banner_btn_text_color || '#ffffff',
                                                }}
                                                className="px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-lg text-xs font-black shadow-xs hover:brightness-110 transition-all flex items-center gap-1"
                                            >
                                                <span>{headerSettings.banner_btn_text}</span>
                                                <ChevronRight className="w-3.5 h-3.5" />
                                            </a>
                                        ) : (
                                            <Link
                                                to={headerSettings.banner_btn_link || headerSettings.banner_link || '/courses'}
                                                style={{
                                                    backgroundColor: headerSettings.banner_btn_bg || '#16a34a',
                                                    color: headerSettings.banner_btn_text_color || '#ffffff',
                                                }}
                                                className="px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-lg text-xs font-black shadow-xs hover:brightness-110 transition-all flex items-center gap-1"
                                            >
                                                <span>{headerSettings.banner_btn_text}</span>
                                                <ChevronRight className="w-3.5 h-3.5" />
                                            </Link>
                                        )
                                    )}

                                    {headerSettings?.banner_secondary_text && (
                                        headerSettings.banner_secondary_link ? (
                                            <a
                                                href={headerSettings.banner_secondary_link}
                                                className="hidden lg:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold transition-colors shadow-xs"
                                            >
                                                <PhoneCall className="w-3.5 h-3.5" />
                                                <span>{headerSettings.banner_secondary_text}</span>
                                            </a>
                                        ) : (
                                            <span className="hidden lg:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/15 text-white text-xs font-bold shadow-xs">
                                                <PhoneCall className="w-3.5 h-3.5" />
                                                <span>{headerSettings.banner_secondary_text}</span>
                                            </span>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Dismiss / Close 'X' Button */}
                    {headerSettings?.banner_closeable !== false && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDismissBanner();
                            }}
                            className="absolute top-1/2 -translate-y-1/2 right-2 sm:right-4 w-6 h-6 rounded-full bg-black/40 hover:bg-black/75 text-white flex items-center justify-center transition-all cursor-pointer z-30 backdrop-blur-xs"
                            title="Close Banner"
                            aria-label="Close banner"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
