import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';
import { ThemeSwitcher } from '../ui/ThemeSwitcher';
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
    ShoppingCart
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
    const navigate = useNavigate();
    const location = useLocation();

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [openMobileSubmenuIds, setOpenMobileSubmenuIds] = useState<Record<string, boolean>>({});
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
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
    const logoHeight = headerSettings?.logo_height || 42;

    const brandTitle = getLocalizedText(
        headerSettings?.brand_title,
        headerSettings?.brand_title_en,
        language
    ) || (settings?.site_name ? settings.site_name.split(' ')[0] : 'NOVONEX');

    const brandSubtitle = getLocalizedText(
        headerSettings?.brand_subtitle,
        headerSettings?.brand_subtitle_en,
        language
    ) || (settings?.site_name && settings.site_name.split(' ').length > 1
        ? settings.site_name.split(' ').slice(1).join(' ')
        : 'EDU');

    const announcementText = getLocalizedText(
        headerSettings?.announcement_text,
        headerSettings?.announcement_text_en,
        language
    );

    const ctaButtonText = getLocalizedText(
        headerSettings?.cta_button_text,
        headerSettings?.cta_button_text_en,
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
        setUserDropdownOpen(false);
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
            return sessionStorage.getItem(`novonex_header_banner_dismissed_${bannerKey}`) === 'true';
        } catch {
            return false;
        }
    });

    useEffect(() => {
        try {
            const isDismissed = sessionStorage.getItem(`novonex_header_banner_dismissed_${bannerKey}`) === 'true';
            setBannerDismissed(isDismissed);
        } catch {
            setBannerDismissed(false);
        }
    }, [bannerKey]);

    const handleDismissBanner = () => {
        setBannerDismissed(true);
        try {
            sessionStorage.setItem(`novonex_header_banner_dismissed_${bannerKey}`, 'true');
        } catch { }
    };

    const shouldShowBanner = Boolean(
        headerSettings?.banner_enabled &&
        !bannerDismissed &&
        (headerSettings?.banner_show_on === 'home' ? isHome : true)
    );

    return (
        <div className={`${headerSettings?.sticky !== false ? 'sticky top-0' : 'relative'} z-50`}>
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

            <header className="w-full bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
                    {/* Brand Logo (Left) */}
                    <div className="flex items-center shrink-0">
                        <Link to="/" className="flex items-center gap-2.5 group">
                            {logoUrl && !logoError ? (
                                <img
                                    src={logoUrl}
                                    alt={settings?.site_name || 'NovoNex'}
                                    onError={() => setLogoError(true)}
                                    style={{ height: `${logoHeight || 38}px` }}
                                    className="w-auto max-w-[150px] sm:max-w-[200px] object-contain group-hover:opacity-95 transition-opacity"
                                />
                            ) : loading ? (
                                <div style={{ height: `${logoHeight || 38}px`, width: '120px' }} className="shrink-0" />
                            ) : (
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#25a2ee] text-white flex items-center justify-center font-black shadow-sm group-hover:scale-105 transition-transform">
                                        <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase font-sans">
                                            {brandTitle || 'NovoNex'}
                                        </span>
                                        {brandSubtitle && (
                                            <span className="text-xs font-bold text-[#CC1200] uppercase">
                                                {brandSubtitle}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </Link>
                    </div>

                    {/* Right Side Navigation + Actions Group (Phitron Layout) */}
                    <div className="flex items-center gap-4 lg:gap-6">
                        {/* Desktop Navigation Links */}
                        <nav className="hidden lg:flex items-center gap-5 xl:gap-6">
                            {menuItems.map((item) => {
                                const hasChildren = Boolean(item.children && item.children.length > 0);
                                const isCurrentActive = location.pathname === item.url && !hasChildren;
                                const isOpen = openDropdownId === item.id;
                                const itemLabel = getLocalizedText(item.label, item.label_en, language) || item.label;

                                // Phitron-style outline pill for highlighted / special item (like [ AI ML ])
                                if (item.highlight) {
                                    return (
                                        <Link
                                            key={item.id}
                                            to={item.url}
                                            className="px-3.5 py-1 rounded-full border border-[#25a2ee] text-[#25a2ee] hover:bg-[#25a2ee]/10 font-bold text-xs sm:text-sm transition-colors whitespace-nowrap"
                                        >
                                            {itemLabel}
                                        </Link>
                                    );
                                }

                                if (hasChildren) {
                                    return (
                                        <div
                                            key={item.id}
                                            className="relative"
                                            onMouseEnter={() => setOpenDropdownId(item.id)}
                                            onMouseLeave={() => setOpenDropdownId(null)}
                                        >
                                            <Link
                                                to={item.url}
                                                className={`flex items-center gap-1 text-xs sm:text-sm font-semibold transition-colors py-1 ${isOpen || (location.pathname.startsWith(item.url) && item.url !== '/')
                                                    ? 'text-[#25a2ee]'
                                                    : 'text-slate-800 dark:text-slate-200 hover:text-[#25a2ee]'
                                                    }`}
                                            >
                                                <span>{itemLabel}</span>
                                                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#25a2ee]' : ''}`} />
                                            </Link>

                                            {/* Dropdown Menu */}
                                            {isOpen && (
                                                <div className="absolute left-0 mt-2 min-w-[220px] w-max max-w-xs bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                                    {item.children!.map((sub) => {
                                                        const subLabel = getLocalizedText(sub.label, sub.label_en, language) || sub.label;
                                                        return sub.is_external || sub.url.startsWith('http') ? (
                                                            <a
                                                                key={sub.id}
                                                                href={sub.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center justify-between gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#25a2ee] transition-colors"
                                                            >
                                                                <span>{subLabel}</span>
                                                                <ExternalLink className="w-3 h-3 text-slate-400" />
                                                            </a>
                                                        ) : (
                                                            <Link
                                                                key={sub.id}
                                                                to={sub.url}
                                                                className="block px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#25a2ee] transition-colors"
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

                                if (item.is_external || item.url.startsWith('http')) {
                                    return (
                                        <a
                                            key={item.id}
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 hover:text-[#25a2ee] transition-colors flex items-center gap-1"
                                        >
                                            <span>{itemLabel}</span>
                                            <ExternalLink className="w-3 h-3 text-slate-400" />
                                        </a>
                                    );
                                }

                                return (
                                    <Link
                                        key={item.id}
                                        to={item.url}
                                        className={`text-xs sm:text-sm font-semibold transition-colors ${isCurrentActive
                                            ? 'text-[#25a2ee] font-bold'
                                            : 'text-slate-800 dark:text-slate-200 hover:text-[#25a2ee]'
                                            }`}
                                    >
                                        {itemLabel}
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Search Icon */}
                        <button
                            type="button"
                            onClick={() => setSearchModalOpen(true)}
                            className="p-2 text-slate-600 dark:text-slate-300 hover:text-[#25a2ee] dark:hover:text-[#25a2ee] hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Search Courses"
                        >
                            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>

                        {/* Cart Icon */}
                        <button
                            type="button"
                            onClick={toggleCart}
                            className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-[#25a2ee] dark:hover:text-[#25a2ee] hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Shopping Cart"
                            aria-label="Shopping Cart"
                        >
                            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-[#25a2ee] text-white text-[10px] font-black min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-xs animate-in zoom-in duration-150">
                                    {cartCount > 9 ? '9+' : cartCount}
                                </span>
                            )}
                        </button>

                        {/* Theme switcher */}
                        {headerSettings?.show_theme_toggle !== false && (
                            <div className="hidden sm:block">
                                <ThemeSwitcher variant="compact" />
                            </div>
                        )}

                        {/* Auth Buttons (Phitron Signature Style) */}
                        {user ? (
                            <div className="flex items-center gap-2">
                                {/* User Points Badge (Only when active) */}
                                {isPointsActive && (
                                    <Link
                                        to="/earn-points"
                                        className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-extrabold text-xs transition-all shadow-2xs group"
                                        title="My Reward Points & Earn Points"
                                    >
                                        <Gem className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
                                        <span>{user.points ?? 0}</span>
                                    </Link>
                                )}

                                {/* Notification Bell */}
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                                        className="p-2 text-slate-700 dark:text-slate-200 hover:text-[#25a2ee] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer relative"
                                        title="Notifications"
                                    >
                                        <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                                        {unreadCount > 0 && (
                                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#CC1200] rounded-full ring-2 ring-white animate-pulse" />
                                        )}
                                    </button>

                                    {notifDropdownOpen && (
                                        <div
                                            className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                                            onMouseLeave={() => setNotifDropdownOpen(false)}
                                        >
                                            <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Notifications</span>
                                                {unreadCount > 0 && (
                                                    <button
                                                        onClick={markAllRead}
                                                        className="text-[10px] font-bold text-[#25a2ee] hover:underline flex items-center gap-1 cursor-pointer"
                                                    >
                                                        <CheckCheck className="w-3 h-3" />
                                                        <span>Mark all as read</span>
                                                    </button>
                                                )}
                                            </div>
                                            <div className="max-h-60 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800">
                                                {notifications.length === 0 ? (
                                                    <div className="p-4 text-center text-xs text-slate-400">
                                                        No new notifications
                                                    </div>
                                                ) : (
                                                    notifications.slice(0, 8).map((n) => (
                                                        <div
                                                            key={n.id}
                                                            onClick={() => handleNotificationClick(n)}
                                                            className={`p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer ${!n.read_at ? 'bg-sky-50/50 dark:bg-sky-950/40' : ''
                                                                }`}
                                                        >
                                                            <div className="flex items-center justify-between gap-1">
                                                                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                                                                    {n.data?.title || n.title || 'Notice'}
                                                                </p>
                                                                {!n.read_at && (
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-[#25a2ee] shrink-0" />
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
                                    className="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[#25a2ee] text-slate-800 dark:text-white transition-all group"
                                >
                                    <div className="w-7 h-7 rounded-lg bg-[#25a2ee] text-white font-bold text-xs flex items-center justify-center">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-bold text-xs sm:text-sm hidden sm:inline max-w-[100px] truncate">
                                        {user.name.split(' ')[0]}
                                    </span>
                                </Link>

                                <button
                                    type="button"
                                    onClick={logout}
                                    className="p-2 text-slate-400 hover:text-[#CC1200] hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                                    title="Logout"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 sm:gap-2.5">
                                {/* Login Outline Pill Button */}
                                <Link
                                    to="/login"
                                    className="px-4 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-[#25a2ee] hover:text-[#25a2ee] dark:hover:border-[#25a2ee] dark:hover:text-[#25a2ee] transition-all cursor-pointer"
                                >
                                    Login
                                </Link>

                                {/* Registration Solid Pill Button in #CC1200 */}
                                <Link
                                    to="/register"
                                    className="px-4 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-bold text-white bg-[#CC1200] hover:bg-[#a80e00] shadow-sm shadow-[#CC1200]/25 transition-all cursor-pointer whitespace-nowrap"
                                >
                                    Registration
                                </Link>
                            </div>
                        )}

                        {/* Mobile Hamburger Button */}
                        <button
                            type="button"
                            onClick={() => {
                                setMobileMenuOpen(!mobileMenuOpen);
                                if (mobileMenuOpen) {
                                    setOpenMobileSubmenuIds({});
                                }
                            }}
                            className="lg:hidden p-2 text-slate-700 dark:text-slate-200 hover:text-[#25a2ee] rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Drawer (Phitron Clean Full-Width Style) */}
                {mobileMenuOpen && (
                    <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                        {/* Mobile Drawer Search Bar */}
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
                                placeholder="Search courses..."
                                className="w-full pl-10 pr-20 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#25a2ee]"
                            />
                            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <button
                                type="submit"
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-[#25a2ee] hover:bg-[#1f8ed1] text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                            >
                                Search
                            </button>
                        </form>
                        {menuItems.map((item) => {
                            const itemLabel = getLocalizedText(item.label, item.label_en, language) || item.label;
                            const hasChildren = Boolean(item.children && item.children.length > 0);
                            const isSubmenuOpen = Boolean(openMobileSubmenuIds[item.id]);

                            return (
                                <div key={item.id} className="space-y-1">
                                    {hasChildren ? (
                                        <button
                                            type="button"
                                            onClick={() => toggleMobileSubmenu(item.id)}
                                            className="w-full flex items-center justify-between px-3 py-2 rounded-lg font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#25a2ee] transition-colors cursor-pointer text-left"
                                        >
                                            <span className="flex items-center gap-2">
                                                <span>{itemLabel}</span>
                                                {item.highlight && (
                                                    <span className="text-[10px] border border-[#25a2ee] text-[#25a2ee] px-2 py-0.5 rounded-full font-bold">PRO</span>
                                                )}
                                            </span>
                                            <ChevronDown
                                                className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${
                                                    isSubmenuOpen ? 'rotate-180 text-[#25a2ee]' : ''
                                                }`}
                                            />
                                        </button>
                                    ) : item.is_external || item.url.startsWith('http') ? (
                                        <a
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="flex items-center justify-between px-3 py-2 rounded-lg font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#25a2ee]"
                                        >
                                            <span>{itemLabel}</span>
                                            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                                        </a>
                                    ) : (
                                        <Link
                                            to={item.url}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="flex items-center justify-between px-3 py-2 rounded-lg font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#25a2ee]"
                                        >
                                            <span>{itemLabel}</span>
                                            {item.highlight && (
                                                <span className="text-[10px] border border-[#25a2ee] text-[#25a2ee] px-2 py-0.5 rounded-full font-bold">PRO</span>
                                            )}
                                        </Link>
                                    )}

                                    {/* Sub-items if any (Only rendered when user clicks to open) */}
                                    {hasChildren && isSubmenuOpen && (
                                        <div className="pl-4 space-y-1 border-l-2 border-[#25a2ee]/40 dark:border-[#25a2ee]/40 ml-3 my-1 animate-in slide-in-from-top-1 fade-in duration-200">
                                            {item.children!.map((sub) => {
                                                const subLabel = getLocalizedText(sub.label, sub.label_en, language) || sub.label;
                                                return sub.is_external || sub.url.startsWith('http') ? (
                                                    <a
                                                        key={sub.id}
                                                        href={sub.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={() => setMobileMenuOpen(false)}
                                                        className="flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-[#25a2ee]"
                                                    >
                                                        <span>• {subLabel}</span>
                                                        <ExternalLink className="w-3 h-3 text-slate-400" />
                                                    </a>
                                                ) : (
                                                    <Link
                                                        key={sub.id}
                                                        to={sub.url}
                                                        onClick={() => setMobileMenuOpen(false)}
                                                        className="block px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-[#25a2ee]"
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

                        {/* Mobile Cart Button */}
                        <button
                            type="button"
                            onClick={() => {
                                setMobileMenuOpen(false);
                                toggleCart();
                            }}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-lg font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#25a2ee] transition-colors cursor-pointer"
                        >
                            <span className="flex items-center gap-2">
                                <ShoppingCart className="w-4 h-4 text-[#25a2ee]" />
                                <span>Cart</span>
                            </span>
                            {cartCount > 0 && (
                                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-[#25a2ee] text-white">
                                    {cartCount}
                                </span>
                            )}
                        </button>

                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                            {isPointsActive && user && (
                                <Link
                                    to="/earn-points"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center justify-between px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-3 text-xs font-bold text-amber-600 dark:text-amber-400"
                                >
                                    <span className="flex items-center gap-1.5">
                                        <Gem className="w-4 h-4 text-amber-500" />
                                        <span>My Reward Points</span>
                                    </span>
                                    <span className="px-2 py-0.5 bg-amber-500 text-white rounded-md text-[11px] font-extrabold flex items-center gap-1">
                                        <Gem className="w-3 h-3 text-white" />
                                        <span>{user.points ?? 0}</span>
                                    </span>
                                </Link>
                            )}

                            {user ? (
                                <div className="flex items-center gap-2 w-full">
                                    <Link
                                        to={getDashboardPath()}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex-1 py-2 text-center font-bold text-white bg-[#25a2ee] hover:bg-[#1784ce] rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
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
                                        className="p-2 text-[#CC1200] hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer"
                                        title="Logout"
                                    >
                                        <LogOut className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2 w-full">
                                    <Link
                                        to="/login"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="py-2 text-center font-bold text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-xs hover:border-[#25a2ee] hover:text-[#25a2ee] transition-all"
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        to="/register"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="py-2 text-center font-bold text-white bg-[#CC1200] hover:bg-[#a80e00] rounded-xl text-xs shadow-sm transition-all"
                                    >
                                        Registration
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
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-white text-sm">
                                <Search className="w-4 h-4 text-sky-600" />
                                <span>Search Courses or Topics</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSearchModalOpen(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSearchSubmit} className="mt-4 space-y-3">
                            <div className="relative">
                                <button
                                    type="submit"
                                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-600 cursor-pointer"
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
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-sky-500 dark:text-white"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                            >
                                <Search className="w-4 h-4" />
                                <span>Search</span>
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
                    className="w-full relative shadow-xs overflow-hidden border-b border-black/10 z-40 transition-all duration-300"
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
