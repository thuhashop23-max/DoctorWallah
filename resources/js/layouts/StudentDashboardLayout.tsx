import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import { apiClient } from '../api/client';
import { Navbar } from '../components/shared/Navbar';
import { Footer } from '../components/shared/Footer';
import {
    Home,
    BookOpen,
    Calendar,
    ClipboardList,
    Trophy,
    ShoppingCart,
    Share2,
    PhoneCall,
    LogOut,
    Menu,
    X,
    ChevronDown,
    Settings,
    Smartphone,
    KeyRound,
    User as UserIcon,
    Radio,
    SlidersHorizontal,
    GraduationCap,
    Loader2,
    Stethoscope,
    ShieldCheck
} from 'lucide-react';

interface MenuItem {
    title: string;
    path: string;
    icon: any;
    exact?: boolean;
    isAction?: boolean;
    action?: () => void;
    children?: Array<{
        title: string;
        path: string;
        icon: any;
    }>;
}

export const StudentDashboardLayout: React.FC = () => {
    const { user, logout, isLoading } = useAuth();
    const { t } = useLanguage();
    const { settings } = useSettings();
    const location = useLocation();
    const navigate = useNavigate();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

    // Quick stats for student sidebar
    const [activeCoursesCount, setActiveCoursesCount] = useState<number>(0);
    const [completedCoursesCount, setCompletedCoursesCount] = useState<number>(0);
    const [ordersCount, setOrdersCount] = useState<number>(0);

    const supportPhone = settings?.support_phone || settings?.contact_phone || '01580401289';

    useEffect(() => {
        if (!user) return;
        fetchQuickStats();
    }, [user]);

    // Close mobile drawer on route change
    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

    const fetchQuickStats = async () => {
        try {
            const [coursesRes, ordersRes] = await Promise.allSettled([
                apiClient.get('/student/my-courses'),
                apiClient.get('/orders/my-orders'),
            ]);
            if (coursesRes.status === 'fulfilled') {
                const list = coursesRes.value.data || [];
                const completed = list.filter((c: any) => c.progress_percentage === 100).length;
                setCompletedCoursesCount(completed);
                setActiveCoursesCount(Math.max(0, list.length - completed));
            }
            if (ordersRes.status === 'fulfilled') {
                const d = ordersRes.value.data;
                const total = d?.total ?? (Array.isArray(d) ? d.length : d?.data?.length ?? 0);
                setOrdersCount(total);
            }
        } catch { }
    };

    const toggleSubmenu = (title: string, e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setOpenSubmenu(prev => (prev === title ? null : title));
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#060202] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-[#A60201] animate-spin" />
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Loading Student Portal...</span>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const menuItems: MenuItem[] = [
        {
            title: 'Home',
            path: '/student',
            icon: Home,
            exact: true
        },
        {
            title: 'My Courses',
            path: '/student/my-courses',
            icon: BookOpen
        },
        {
            title: 'Live Classes',
            path: '/student/live-classes',
            icon: Radio
        },
        {
            title: 'Routine',
            path: '/student/routine',
            icon: Calendar,
        },
        {
            title: 'Exams',
            path: '/student/exams',
            icon: ClipboardList
        },
        {
            title: 'Leaderboard',
            path: '/student/leaderboard',
            icon: Trophy
        },
        {
            title: 'Orders',
            path: '/student/orders',
            icon: ShoppingCart
        },
        {
            title: 'Affiliate & Referrals',
            path: '/student/affiliate',
            icon: Share2
        },
        {
            title: 'Profile & Settings',
            path: '/student/settings',
            icon: Settings,
            children: [
                {
                    title: 'Login Devices',
                    path: '/student/settings/devices',
                    icon: Smartphone
                },
                {
                    title: 'Profile Info',
                    path: '/student/settings/profile',
                    icon: UserIcon
                },
                {
                    title: 'Change Password',
                    path: '/student/settings/password',
                    icon: KeyRound
                }
            ]
        }
    ];

    const isCurrentActive = (item: MenuItem) => {
        if (item.exact) {
            return location.pathname === item.path && !location.hash;
        }
        if (item.isAction) {
            return location.hash === '#routine';
        }
        if (item.children) {
            return location.pathname.startsWith('/student/settings') || location.pathname.startsWith('/student/profile');
        }
        return location.pathname.startsWith(item.path.split('?')[0]);
    };

    const renderSidebarContent = (isMobile = false) => {
        return (
            <div className="flex flex-col justify-between h-full space-y-6">
                <div className="space-y-5">
                    {/* Mobile Drawer Header with Close Button */}
                    {isMobile && (
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
                            <span className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                                <Stethoscope className="w-4 h-4 text-[#A60201]" />
                                <span>DoctorWallah Portal</span>
                            </span>
                            <button
                                type="button"
                                onClick={() => setSidebarOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition"
                                title="Close Menu"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {/* Student Profile Box */}
                    <div className="pt-1 pb-3 px-1 border-b border-slate-100 dark:border-white/[0.08] space-y-3">
                        <div className="flex flex-col items-center text-center">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#A60201] via-[#880101] to-[#5A0101] text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-[#A60201]/30 border-2 border-white/20 ring-4 ring-[#A60201]/20">
                                    {user.name ? user.name.charAt(0).toUpperCase() : 'S'}
                                </div>
                                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0A0404]" title="Active Student" />
                            </div>

                            <h3 className="text-sm font-black text-slate-900 dark:text-white mt-3 truncate max-w-full">
                                {user.name}
                            </h3>

                            <div className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full bg-red-50 dark:bg-[#A60201]/20 border border-red-200 dark:border-[#A60201]/40 text-[#A60201] dark:text-red-300 text-[10px] font-bold">
                                <ShieldCheck className="w-3 h-3 text-[#A60201]" />
                                <span>Verified Cadet</span>
                            </div>

                            <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-1">
                                {user.registration_number || (user.id ? `ID: bidth-${user.id}` : 'Student')}
                            </p>
                        </div>

                        {/* 3-stat micro-grid */}
                        <div className="grid grid-cols-3 gap-1 p-2 bg-slate-50 dark:bg-black/50 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl text-center">
                            <div className="p-1">
                                <span className="block text-sm font-black text-slate-900 dark:text-white">{activeCoursesCount}</span>
                                <span className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 leading-tight">Active<br />Courses</span>
                            </div>
                            <div className="p-1 border-x border-slate-200/80 dark:border-white/[0.08]">
                                <span className="block text-sm font-black text-slate-900 dark:text-white">{completedCoursesCount}</span>
                                <span className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 leading-tight">Completed</span>
                            </div>
                            <div className="p-1">
                                <span className="block text-sm font-black text-slate-900 dark:text-white">{ordersCount}</span>
                                <span className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 leading-tight">Orders</span>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Menu */}
                    <nav className="space-y-1">
                        {menuItems.map((item) => {
                            const active = isCurrentActive(item);
                            const Icon = item.icon;

                            if (item.children) {
                                const isSubmenuOpen = openSubmenu === item.title;
                                return (
                                    <div key={item.title} className="space-y-1">
                                        <button
                                            type="button"
                                            onClick={() => toggleSubmenu(item.title)}
                                            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all text-left cursor-pointer ${
                                                active
                                                    ? 'bg-red-50 dark:bg-[#A60201]/20 text-[#A60201] dark:text-red-300 font-extrabold'
                                                    : 'text-slate-600 dark:text-slate-300 hover:text-[#A60201] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon className={`w-4 h-4 ${active ? 'text-[#A60201] dark:text-red-400' : 'text-slate-400 dark:text-slate-500'}`} />
                                                <span>{item.title}</span>
                                            </div>
                                            <ChevronDown
                                                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                                    isSubmenuOpen ? 'rotate-180 text-[#A60201]' : 'text-slate-400'
                                                }`}
                                            />
                                        </button>

                                        {isSubmenuOpen && (
                                            <div className="pl-3 pr-1 py-1 space-y-1 ml-4 border-l-2 border-slate-200 dark:border-white/10 animate-in fade-in slide-in-from-top-1 duration-200">
                                                {item.children.map((child) => {
                                                    const ChildIcon = child.icon;
                                                    const isChildActive = location.pathname === child.path || (
                                                        child.path === '/student/settings/profile' && location.pathname === '/student/profile'
                                                    );
                                                    return (
                                                        <Link
                                                            key={child.path}
                                                            to={child.path}
                                                            onClick={() => setSidebarOpen(false)}
                                                            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold text-xs transition-all ${
                                                                isChildActive
                                                                    ? 'bg-[#A60201] text-white shadow-2xs'
                                                                    : 'text-slate-500 dark:text-slate-400 hover:text-[#A60201] dark:hover:text-white hover:bg-red-50/70 dark:hover:bg-white/[0.04]'
                                                            }`}
                                                        >
                                                            {ChildIcon && (
                                                                <ChildIcon className={`w-3.5 h-3.5 ${isChildActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                                                            )}
                                                            <span>{child.title}</span>
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            return (
                                <Link
                                    key={item.title}
                                    to={item.path}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                                        active
                                            ? 'bg-[#A60201] text-white shadow-xs font-extrabold'
                                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                                    }`}
                                >
                                    <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                                    <span>{item.title}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Bottom Support & Logout */}
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-white/[0.08]">
                    <div className="bg-red-50/80 dark:bg-[#120404] rounded-2xl p-3 border border-red-100 dark:border-[#A60201]/30 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white dark:bg-black/50 text-[#A60201] shadow-2xs flex items-center justify-center shrink-0 border border-red-100 dark:border-[#A60201]/30">
                            <PhoneCall className="w-4 h-4 text-[#A60201]" />
                        </div>
                        <div className="truncate">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block leading-tight">Academic Help</span>
                            <a
                                href={`tel:${supportPhone}`}
                                className="text-xs font-extrabold text-[#A60201] dark:text-red-300 hover:underline truncate block"
                            >
                                {supportPhone}
                            </a>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-rose-100 dark:hover:border-rose-900/50 rounded-xl font-bold text-xs transition cursor-pointer"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Log Out</span>
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#060202] text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-[#A60201] selection:text-white transition-colors duration-200">
            {/* Header: Global Website Navbar */}
            <Navbar />

            {/* Middle Container */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8">
                {/* Mobile Student Bar & Drawer Trigger (lg:hidden) */}
                <div className="lg:hidden mb-5">
                    {/* User Quick Strip + Menu Toggle Button */}
                    <div className="bg-white dark:bg-[#0A0404] rounded-2xl p-3.5 border border-slate-200/90 dark:border-white/10 shadow-xs flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#A60201] to-[#7B0100] text-white font-bold text-base flex items-center justify-center shrink-0 shadow-xs">
                                {user.name ? user.name.charAt(0).toUpperCase() : 'S'}
                            </div>
                            <div className="truncate">
                                <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                    {user.name}
                                </h3>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                                    {user.registration_number || (user.id ? `ID: bidth-${user.id}` : 'Student')}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setSidebarOpen(true)}
                            className="px-3.5 py-2 bg-red-50 dark:bg-[#A60201]/20 hover:bg-red-100 dark:hover:bg-[#A60201]/30 text-[#A60201] dark:text-red-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition shrink-0 cursor-pointer border border-red-200 dark:border-[#A60201]/40"
                        >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            <span>Student Menu</span>
                        </button>
                    </div>
                </div>

                {/* Main 2-Column Section */}
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
                    {/* Desktop Sidebar Card */}
                    <aside className="hidden lg:block w-72 shrink-0 sticky top-24">
                        <div className="bg-white dark:bg-[#0A0404] rounded-3xl p-5 border border-slate-200/90 dark:border-white/[0.08] shadow-sm dark:shadow-[0_4px_30px_rgba(0,0,0,0.5)] min-h-[500px] transition-colors">
                            {renderSidebarContent(false)}
                        </div>
                    </aside>

                    {/* Page Content Outlet */}
                    <div className="flex-1 w-full min-w-0">
                        <Outlet />
                    </div>
                </div>
            </main>

            {/* Footer: Global Website Footer */}
            <Footer />

            {/* Mobile Slide-Over Drawer */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
                        onClick={() => setSidebarOpen(false)}
                    />
                    <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white dark:bg-[#0A0404] text-slate-900 dark:text-white border-r border-slate-200 dark:border-white/10 z-50 p-5 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-left duration-200">
                        {renderSidebarContent(true)}
                    </div>
                </div>
            )}
        </div>
    );
};
