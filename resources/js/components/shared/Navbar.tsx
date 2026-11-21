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
    FileText,
    Users,
    ClipboardList,
    Search,
    Menu,
    X,
    User as UserIcon,
    LayoutDashboard,
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
    Calendar,
    Sun,
    Moon
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { HeaderMenuItem } from '../../types';

const DEFAULT_NAV_ITEMS: HeaderMenuItem[] = [
    {
        id: '1',
        label: 'AI ML',
        label_en: 'AI ML',
        url: '/courses',
        is_external: false,
        highlight: true,
    },
    {
        id: '2',
        label: 'Course Details',
        label_en: 'Course Details',
        url: '/courses',
        is_external: false,
        highlight: false,
        children: [
            { id: '2-1', label: 'All Courses', label_en: 'All Courses', url: '/courses' },
            { id: '2-2', label: 'Academic Courses', label_en: 'Academic Courses', url: '/courses?type=academic' },
            { id: '2-3', label: 'Admission & Varsity', label_en: 'Admission & Varsity', url: '/courses?type=admission' },
            { id: '2-4', label: 'Recorded Batches', label_en: 'Recorded Batches', url: '/courses' },
        ],
    },
    {
        id: 'earn-points',
        label: 'Earn Points',
        label_en: 'Earn Points',
        url: '/earn-points',
        is_external: false,
        highlight: true,
    },
    {
        id: '3',
        label: 'Success Story',
        label_en: 'Success Story',
        url: '/courses',
        is_external: false,
        highlight: false,
    },
    {
        id: '4',
        label: 'Bootcamps / Events',
        label_en: 'Bootcamps / Events',
        url: '/courses?type=live',
        is_external: false,
        highlight: false,
    },
    {
        id: '5',
        label: 'More',
        label_en: 'More',
        url: '/courses',
        is_external: false,
        highlight: false,
        children: [
            { id: '5-1', label: 'Live Exams & Quizzes', label_en: 'Live Exams & Quizzes', url: '/student/exams' },
            { id: '5-2', label: 'Free Trial Classes', label_en: 'Free Trial Classes', url: '/courses?type=free' },
            { id: '5-3', label: 'Class Routine', label_en: 'Class Routine', url: '/student/routine' },
            { id: '5-4', label: 'Contact Us', label_en: 'Contact Us', url: '/p/contact' },
        ],
    },
];

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
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
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

    const rawMenuItems: HeaderMenuItem[] = (headerSettings?.menu_items && headerSettings.menu_items.length > 0)
        ? headerSettings.menu_items
        : DEFAULT_NAV_ITEMS;

    const isPointsActive = (settings as any)?.point_settings?.is_active !== false;

    const menuItems = React.useMemo(() => {
        if (!isPointsActive) {
            return rawMenuItems.filter(item => item.url !== '/earn-points');
        }

        const hasEarn = rawMenuItems.some(item => item.url === '/earn-points');
        if (!hasEarn) {
            const earnItem: HeaderMenuItem = {
                id: 'earn-points',
                label: 'Earn Points',
                label_en: 'Earn Points',
                url: '/earn-points',
                is_external: false,
                highlight: true,
            };
            const courseIdx = rawMenuItems.findIndex(item => item.url === '/courses' || item.label?.toLowerCase().includes('course'));
            if (courseIdx >= 0) {
                const copy = [...rawMenuItems];
                copy.splice(courseIdx + 1, 0, earnItem);
                return copy;
            }
            return [...rawMenuItems, earnItem];
        }
        return rawMenuItems;
    }, [rawMenuItems, isPointsActive]);

    useEffect(() => {
        setLogoError(false);
    }, [logoUrl]);

    // Close dropdowns on route change
    useEffect(() => {
        setMobileMenuOpen(false);
        setOpenDropdownId(null);
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

    // Dynamic icon resolution matching the menu label or URL
    const getNavIcon = (item: HeaderMenuItem) => {
        const label = (item.label || item.label_en || '').toLowerCase();
        const url = (item.url || '').toLowerCase();

        if (url === '/' || label === 'home' || label.includes('হোম') || label.includes('নীড়')) {
            return <Home className="w-4 h-4 shrink-0" />;
        }
        if (url.includes('course') || label.includes('course') || label.includes('কোর্স')) {
            return <GraduationCap className="w-4 h-4 shrink-0" />;
        }
        if (url.includes('exam') || label.includes('exam') || label.includes('পরীক্ষা') || label.includes('quiz')) {
            return <ClipboardList className="w-4 h-4 shrink-0" />;
        }
        if (url.includes('store') || url.includes('book') || label.includes('store') || label.includes('বই') || label.includes('দোকান')) {
            return <BookOpen className="w-4 h-4 shrink-0" />;
        }
        if (url.includes('point') || label.includes('point') || label.includes('পয়েন্ট')) {
            return <Gem className="w-4 h-4 shrink-0" />;
        }
        if (label.includes('about') || label.includes('আমাদের') || label.includes('story') || label.includes('দল')) {
            return <Users className="w-4 h-4 shrink-0" />;
        }
        if (label.includes('bootcamp') || label.includes('event')) {
            return <Calendar className="w-4 h-4 shrink-0" />;
        }
        if (label.includes('ai') || label.includes('ml') || item.highlight) {
            return <Sparkles className="w-4 h-4 shrink-0" />;
        }
        if (item.children && item.children.length > 0) {
            return <Boxes className="w-4 h-4 shrink-0" />;
        }
        return <BookMarked className="w-4 h-4 shrink-0" />;
    };

    const isRouteActive = (item: HeaderMenuItem) => {
        if (item.url === '/') {
            return location.pathname === '/';
        }
        if (item.url && item.url !== '#') {
            return location.pathname === item.url || location.pathname.startsWith(`${item.url}/`);
        }
        return false;
    };

    return (
        <div className={`${headerSettings?.sticky !== false ? 'sticky top-0' : 'relative'} z-50 w-full`}>
            {/* Announcement Top Banner */}
            {headerSettings?.announcement_enabled && announcementText && (
                <div
                    style={{ backgroundColor: headerSettings.announcement_bg || '#0284c7' }}
                    className="w-full text-white text-xs font-semibold py-1.5 px-4 text-center shadow-xs transition-colors"
                >
                    <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
                        <span>{announcementText}</span>
                        {headerSettings.announcement_link && (
                            headerSettings.announcement_link.startsWith('http') ? (
                                <a
                                    href={headerSettings.announcement_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline font-bold text-[11px] opacity-90 hover:opacity-100 inline-flex items-center gap-0.5 ml-1"
                                >
                                    <span>View Details</span>
                                    <ChevronRight className="w-3 h-3" />
                                </a>
                            ) : (
                                <Link
                                    to={headerSettings.announcement_link}
                                    className="underline font-bold text-[11px] opacity-90 hover:opacity-100 inline-flex items-center gap-0.5 ml-1"
                                >
                                    <span>View Details</span>
                                    <ChevronRight className="w-3 h-3" />
                                </Link>
                            )
                        )}
                    </div>
                </div>
            )}

            {/* Floating Dark Capsule Header (Inspired by ACS / Rakib's Classroom) */}
            <header className="w-full pt-2 sm:pt-3.5 px-2.5 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="w-full bg-[#0c0d12]/95 dark:bg-[#090a0f]/95 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-full px-3.5 sm:px-6 py-2 sm:py-2.5 shadow-[0_10px_35px_-5px_rgba(0,0,0,0.7)] flex items-center justify-between gap-2 sm:gap-4 transition-all">
                    {/* Brand Logo (Left) */}
                    <div className="flex items-center shrink-0">
                        <Link to="/" className="flex items-center gap-2.5 group">
                            {logoUrl && !logoError ? (
                                <img
                                    src={logoUrl}
                                    alt={settings?.site_name || 'DoctorWallah'}
                                    onError={() => setLogoError(true)}
                                    style={{ height: `${logoHeight}px` }}
                                    className="w-auto max-w-[130px] sm:max-w-[180px] object-contain group-hover:opacity-95 transition-opacity"
                                />
                            ) : loading ? (
                                <div style={{ height: `${logoHeight}px`, width: '120px' }} className="shrink-0" />
                            ) : (
                                <div className="flex items-center gap-2 sm:gap-2.5">
                                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-sky-500 to-teal-400 text-white flex items-center justify-center font-black shadow-md group-hover:scale-105 transition-transform">
                                        <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-sm sm:text-base md:text-lg font-black tracking-tight text-white uppercase font-sans">
                                                {brandTitle || 'DoctorWallah'}
                                            </span>
                                            {brandSubtitle && (
                                                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest hidden sm:inline">
                                                    {brandSubtitle}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Link>
                    </div>

                    {/* Desktop Navigation Links (Center) */}
                    <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
                        {menuItems.map((item) => {
                            const hasChildren = Boolean(item.children && item.children.length > 0);
                            const isActive = isRouteActive(item);
                            const isOpen = openDropdownId === item.id;
                            const itemLabel = getLocalizedText(item.label, item.label_en, language) || item.label;

                            // Special Highlighted item (e.g. AI ML or PRO)
                            if (item.highlight) {
                                return (
                                    <Link
                                        key={item.id}
                                        to={item.url}
                                        className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-sky-400/40 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 font-bold text-xs sm:text-sm transition-all whitespace-nowrap shadow-xs ${
                                            isActive ? 'ring-1 ring-sky-400 bg-sky-500/25 text-white' : ''
                                        }`}
                                    >
                                        <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                                        <span>{itemLabel}</span>
                                        {isActive && (
                                            <span className="absolute -bottom-1 left-3 right-3 h-0.5 bg-sky-400 rounded-full" />
                                        )}
                                    </Link>
                                );
                            }

                            // Items with Children Dropdown
                            if (hasChildren) {
                                return (
                                    <div
                                        key={item.id}
                                        className="relative"
                                        onMouseEnter={() => setOpenDropdownId(item.id)}
                                        onMouseLeave={() => setOpenDropdownId(null)}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => setOpenDropdownId(isOpen ? null : item.id)}
                                            className={`relative flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                                                isOpen || isActive
                                                    ? 'text-white font-bold'
                                                    : 'text-slate-300 hover:text-white'
                                            }`}
                                        >
                                            {getNavIcon(item)}
                                            <span>{itemLabel}</span>
                                            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-white' : ''}`} />
                                            {isActive && (
                                                <span className="absolute -bottom-1 left-2.5 right-2.5 h-0.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
                                            )}
                                        </button>

                                        {/* Dropdown Menu */}
                                        {isOpen && (
                                            <div className="absolute left-0 top-full mt-2 min-w-[220px] w-max max-w-xs bg-[#12141c]/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/10 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                                {item.children!.map((sub) => {
                                                    const subLabel = getLocalizedText(sub.label, sub.label_en, language) || sub.label;
                                                    return sub.is_external || sub.url.startsWith('http') ? (
                                                        <a
                                                            key={sub.id}
                                                            href={sub.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                                                        >
                                                            <span>{subLabel}</span>
                                                            <ExternalLink className="w-3 h-3 text-slate-400" />
                                                        </a>
                                                    ) : (
                                                        <Link
                                                            key={sub.id}
                                                            to={sub.url}
                                                            className="block px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                                                        >
                                                            {subLabel}
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            // External Link
                            if (item.is_external || item.url.startsWith('http')) {
                                return (
                                    <a
                                        key={item.id}
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="relative flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-colors"
                                    >
                                        {getNavIcon(item)}
                                        <span>{itemLabel}</span>
                                        <ExternalLink className="w-3 h-3 text-slate-400" />
                                    </a>
                                );
                            }

                            // Standard Nav Link (Matches reference image with underline indicator on active)
                            return (
                                <Link
                                    key={item.id}
                                    to={item.url}
                                    className={`relative flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold transition-colors ${
                                        isActive
                                            ? 'text-white font-bold'
                                            : 'text-slate-300 hover:text-white'
                                    }`}
                                >
                                    {getNavIcon(item)}
                                    <span>{itemLabel}</span>
                                    {isActive && (
                                        <span className="absolute -bottom-1 left-2.5 right-2.5 h-0.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Right Side Actions Group */}
                    <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                        {/* Search Button */}
                        <button
                            type="button"
                            onClick={() => setSearchModalOpen(true)}
                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                            title="Search Courses"
                            aria-label="Search"
                        >
                            <Search className="w-4 h-4" />
                        </button>

                        {/* Cart Button */}
                        <button
                            type="button"
                            onClick={toggleCart}
                            className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                            title="Shopping Cart"
                            aria-label="Shopping Cart"
                        >
                            <ShoppingCart className="w-4 h-4" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-sky-500 text-white text-[10px] font-black min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-md animate-in zoom-in duration-150">
                                    {cartCount > 9 ? '9+' : cartCount}
                                </span>
                            )}
                        </button>

                        {/* Reward Points Pill (Preserved as requested) */}
                        {isPointsActive && (
                            <Link
                                to="/earn-points"
                                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 text-amber-400 font-bold text-xs transition-all shadow-sm group"
                                title="My Reward Points"
                            >
                                <Gem className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                                <span>{user ? (user.points ?? 0) : 'Points'}</span>
                            </Link>
                        )}

                        {/* Theme Switcher Button (Circular, matching screenshot) */}
                        {headerSettings?.show_theme_toggle !== false && (
                            <button
                                type="button"
                                onClick={toggleTheme}
                                title={isDark ? t.theme.switchToLight : t.theme.switchToDark}
                                aria-label="Theme toggle"
                                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer select-none"
                            >
                                {isDark ? (
                                    <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45" />
                                ) : (
                                    <Moon className="w-4 h-4 text-slate-300 transition-transform duration-300 rotate-0 hover:-rotate-12" />
                                )}
                            </button>
                        )}

                        {/* Auth Area */}
                        {user ? (
                            <div className="flex items-center gap-2">
                                {/* Notification Bell */}
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer relative"
                                        title="Notifications"
                                    >
                                        <Bell className="w-4 h-4" />
                                        {unreadCount > 0 && (
                                            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-[#0c0d12] animate-pulse" />
                                        )}
                                    </button>

                                    {notifDropdownOpen && (
                                        <div
                                            className="absolute right-0 mt-2 w-72 sm:w-80 bg-[#12141c]/98 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/10 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                                            onMouseLeave={() => setNotifDropdownOpen(false)}
                                        >
                                            <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
                                                <span className="text-xs font-bold text-white">Notifications</span>
                                                {unreadCount > 0 && (
                                                    <button
                                                        onClick={markAllRead}
                                                        className="text-[10px] font-bold text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                                                    >
                                                        <CheckCheck className="w-3 h-3" />
                                                        <span>Mark all as read</span>
                                                    </button>
                                                )}
                                            </div>
                                            <div className="max-h-60 overflow-y-auto divide-y divide-white/5">
                                                {notifications.length === 0 ? (
                                                    <div className="p-4 text-center text-xs text-slate-400">
                                                        No new notifications
                                                    </div>
                                                ) : (
                                                    notifications.slice(0, 8).map((n) => (
                                                        <div
                                                            key={n.id}
                                                            onClick={() => handleNotificationClick(n)}
                                                            className={`p-3 hover:bg-white/5 transition-colors cursor-pointer ${
                                                                !n.read_at ? 'bg-sky-500/10' : ''
                                                            }`}
                                                        >
                                                            <div className="flex items-center justify-between gap-1">
                                                                <p className="text-xs font-bold text-white line-clamp-1">
                                                                    {n.data?.title || n.title || 'Notice'}
                                                                </p>
                                                                {!n.read_at && (
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                                                                )}
                                                            </div>
                                                            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
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
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white transition-all group"
                                >
                                    <div className="w-6 h-6 rounded-full bg-sky-500 text-white font-bold text-xs flex items-center justify-center">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-bold text-xs hidden sm:inline max-w-[100px] truncate">
                                        {user.name.split(' ')[0]}
                                    </span>
                                </Link>

                                <button
                                    type="button"
                                    onClick={logout}
                                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-full transition-colors cursor-pointer"
                                    title="Logout"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                {/* Registration Text Link (Subtle) */}
                                <Link
                                    to="/register"
                                    className="hidden xl:inline-block text-slate-300 hover:text-white text-xs sm:text-sm font-semibold transition-colors px-2 py-1"
                                >
                                    {language === 'bn' ? 'রেজিস্ট্রেশন' : 'Register'}
                                </Link>

                                {/* High-Contrast White Pill Button (Matching Screenshot "লগইন") */}
                                <Link
                                    to="/login"
                                    className="bg-white text-slate-950 hover:bg-slate-200 font-bold px-4 sm:px-6 py-1.5 sm:py-2 rounded-full transition-all shadow-md text-xs sm:text-sm cursor-pointer whitespace-nowrap flex items-center justify-center"
                                >
                                    {language === 'bn' ? 'লগইন' : 'Login'}
                                </Link>
                            </div>
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
                            className="lg:hidden w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center transition-colors cursor-pointer"
                            aria-label="Toggle Menu"
                        >
                            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Floating Drawer (Fully responsive dark glass card) */}
                {mobileMenuOpen && (
                    <div className="lg:hidden mt-2 bg-[#0c0d12]/98 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-2xl text-white space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                        {/* Mobile Search Bar */}
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                const q = searchQuery.trim();
                                navigate(q ? `/courses?search=${encodeURIComponent(q)}` : '/courses');
                                setMobileMenuOpen(false);
                                setSearchQuery('');
                            }}
                            className="relative mb-2"
                        >
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search courses or topics..."
                                className="w-full pl-10 pr-20 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                            />
                            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <button
                                type="submit"
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-white text-slate-950 font-bold text-xs rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                            >
                                Search
                            </button>
                        </form>

                        {/* Navigation Links */}
                        <div className="space-y-1">
                            {menuItems.map((item) => {
                                const itemLabel = getLocalizedText(item.label, item.label_en, language) || item.label;
                                const hasChildren = Boolean(item.children && item.children.length > 0);
                                const isSubmenuOpen = Boolean(openMobileSubmenuIds[item.id]);
                                const isActive = isRouteActive(item);

                                return (
                                    <div key={item.id} className="space-y-1">
                                        {hasChildren ? (
                                            <button
                                                type="button"
                                                onClick={() => toggleMobileSubmenu(item.id)}
                                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-xs sm:text-sm hover:bg-white/10 transition-colors cursor-pointer text-left ${
                                                    isActive ? 'text-sky-400 font-bold bg-white/5' : 'text-slate-200'
                                                }`}
                                            >
                                                <span className="flex items-center gap-2.5">
                                                    {getNavIcon(item)}
                                                    <span>{itemLabel}</span>
                                                    {item.highlight && (
                                                        <span className="text-[10px] border border-sky-400/50 bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full font-bold">PRO</span>
                                                    )}
                                                </span>
                                                <ChevronDown
                                                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                                                        isSubmenuOpen ? 'rotate-180 text-white' : ''
                                                    }`}
                                                />
                                            </button>
                                        ) : item.is_external || item.url.startsWith('http') ? (
                                            <a
                                                href={item.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={() => setMobileMenuOpen(false)}
                                                className="flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-slate-200 hover:bg-white/10 hover:text-white"
                                            >
                                                <span className="flex items-center gap-2.5">
                                                    {getNavIcon(item)}
                                                    <span>{itemLabel}</span>
                                                </span>
                                                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                                            </a>
                                        ) : (
                                            <Link
                                                to={item.url}
                                                onClick={() => setMobileMenuOpen(false)}
                                                className={`flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-xs sm:text-sm hover:bg-white/10 hover:text-white ${
                                                    isActive ? 'text-sky-400 font-bold bg-white/5' : 'text-slate-200'
                                                }`}
                                            >
                                                <span className="flex items-center gap-2.5">
                                                    {getNavIcon(item)}
                                                    <span>{itemLabel}</span>
                                                </span>
                                                {item.highlight && (
                                                    <span className="text-[10px] border border-sky-400/50 bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full font-bold">PRO</span>
                                                )}
                                            </Link>
                                        )}

                                        {/* Sub-items if any */}
                                        {hasChildren && isSubmenuOpen && (
                                            <div className="pl-6 space-y-1 border-l border-white/15 ml-4 my-1">
                                                {item.children!.map((sub) => {
                                                    const subLabel = getLocalizedText(sub.label, sub.label_en, language) || sub.label;
                                                    return sub.is_external || sub.url.startsWith('http') ? (
                                                        <a
                                                            key={sub.id}
                                                            href={sub.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={() => setMobileMenuOpen(false)}
                                                            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5"
                                                        >
                                                            <span>• {subLabel}</span>
                                                            <ExternalLink className="w-3 h-3 text-slate-500" />
                                                        </a>
                                                    ) : (
                                                        <Link
                                                            key={sub.id}
                                                            to={sub.url}
                                                            onClick={() => setMobileMenuOpen(false)}
                                                            className="block px-3 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5"
                                                        >
                                                            • {subLabel}
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
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
                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-slate-200 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                        >
                            <span className="flex items-center gap-2.5">
                                <ShoppingCart className="w-4 h-4 text-sky-400" />
                                <span>Cart</span>
                            </span>
                            {cartCount > 0 && (
                                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-sky-500 text-white">
                                    {cartCount}
                                </span>
                            )}
                        </button>

                        {/* Mobile Points & Auth */}
                        <div className="pt-3 border-t border-white/10 space-y-2">
                            {isPointsActive && (
                                <Link
                                    to="/earn-points"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center justify-between px-3 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs font-bold text-amber-400"
                                >
                                    <span className="flex items-center gap-2">
                                        <Gem className="w-4 h-4 text-amber-400" />
                                        <span>My Reward Points</span>
                                    </span>
                                    <span className="px-2 py-0.5 bg-amber-500 text-slate-950 rounded-md text-[11px] font-extrabold flex items-center gap-1">
                                        <Gem className="w-3 h-3 text-slate-950" />
                                        <span>{user ? (user.points ?? 0) : 0}</span>
                                    </span>
                                </Link>
                            )}

                            {user ? (
                                <div className="flex items-center gap-2 w-full pt-1">
                                    <Link
                                        to={getDashboardPath()}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex-1 py-2.5 text-center font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Shield className="w-4 h-4" />
                                        <span>{user.role === 'admin' ? 'Admin Panel' : `Dashboard (${user.name.split(' ')[0]})`}</span>
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMobileMenuOpen(false);
                                            logout();
                                        }}
                                        className="p-2.5 text-rose-400 hover:bg-rose-500/20 border border-white/10 rounded-xl transition-colors cursor-pointer"
                                        title="Logout"
                                    >
                                        <LogOut className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2 w-full pt-1">
                                    <Link
                                        to="/login"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="py-2.5 text-center font-bold text-slate-950 bg-white hover:bg-slate-200 rounded-xl text-xs transition-all shadow-md"
                                    >
                                        {language === 'bn' ? 'লগইন' : 'Login'}
                                    </Link>
                                    <Link
                                        to="/register"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="py-2.5 text-center font-bold text-white bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl text-xs transition-all"
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
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/75 backdrop-blur-sm">
                    <div className="bg-[#10121a] text-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-white/10 relative animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-3 border-b border-white/10">
                            <div className="flex items-center gap-2 font-bold text-white text-sm">
                                <Search className="w-4 h-4 text-sky-400" />
                                <span>Search Courses or Topics</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSearchModalOpen(false)}
                                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSearchSubmit} className="mt-4 space-y-3">
                            <div className="relative">
                                <button
                                    type="submit"
                                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-400 cursor-pointer"
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
                                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 text-white placeholder:text-slate-400"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 bg-white text-slate-950 hover:bg-slate-200 font-bold rounded-2xl text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                            >
                                <Search className="w-4 h-4 text-slate-950" />
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
                        <div className="py-2.5 sm:py-3 px-4 sm:px-6 lg:px-8">
                            <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm">
                                <div className="flex items-center gap-2.5 min-w-0 pr-6 sm:pr-0">
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                                    <span className="font-extrabold truncate text-white">
                                        {headerSettings?.banner_title || 'First class is completely free in the new batch!'}
                                    </span>
                                    {headerSettings?.banner_subtitle && (
                                        <span className="hidden md:inline text-xs text-white/90 truncate font-medium">
                                            • {headerSettings.banner_subtitle}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
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
                                                className="px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg text-xs font-black shadow-xs hover:brightness-110 transition-all flex items-center gap-1"
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
                                                className="px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg text-xs font-black shadow-xs hover:brightness-110 transition-all flex items-center gap-1"
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
