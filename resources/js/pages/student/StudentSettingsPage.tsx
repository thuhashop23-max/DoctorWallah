import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import {
    Smartphone,
    Laptop,
    ShieldCheck,
    AlertCircle,
    CheckCircle2,
    LogOut,
    KeyRound,
    User as UserIcon,
    Lock,
    Eye,
    EyeOff,
    RefreshCw,
    Clock,
    Globe,
    Shield
} from 'lucide-react';

interface DeviceItem {
    id: number;
    name: string;
    ip_address: string | null;
    user_agent: string | null;
    is_current: boolean;
    last_used_at: string | null;
    created_at: string | null;
}

interface StudentSettingsPageProps {
    defaultView?: 'devices' | 'profile' | 'password';
}

export const StudentSettingsPage: React.FC<StudentSettingsPageProps> = ({ defaultView }) => {
    const { user, updateUser } = useAuth();
    const location = useLocation();

    // Determine active view strictly based on route URL (No internal tabs needed)
    const activeView = (() => {
        const path = location.pathname;
        if (path.includes('/devices')) return 'devices';
        if (path.includes('/password')) return 'password';
        if (path.includes('/profile')) return 'profile';
        return defaultView || 'devices';
    })();

    // Devices state
    const [devices, setDevices] = useState<DeviceItem[]>([]);
    const [devicesLoading, setDevicesLoading] = useState(true);
    const [deviceActionLoading, setDeviceActionLoading] = useState<number | 'others' | null>(null);
    const [deviceSuccessMsg, setDeviceSuccessMsg] = useState('');
    const [deviceErrorMsg, setDeviceErrorMsg] = useState('');

    // Profile form state
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
    const [profileErrorMsg, setProfileErrorMsg] = useState('');

    // Password form state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordSuccessMsg, setPasswordSuccessMsg] = useState('');
    const [passwordErrorMsg, setPasswordErrorMsg] = useState('');

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setEmail(user.email || '');
        }
    }, [user]);

    useEffect(() => {
        if (activeView === 'devices') {
            fetchDevices();
        }
    }, [activeView]);

    const fetchDevices = async () => {
        setDevicesLoading(true);
        setDeviceErrorMsg('');
        try {
            const { data } = await apiClient.get('/user/devices');
            setDevices(data.devices || []);
        } catch (err: any) {
            setDeviceErrorMsg('Unable to load device list. Please try again.');
        } finally {
            setDevicesLoading(false);
        }
    };

    const handleRevokeDevice = async (id: number) => {
        if (!window.confirm('Are you sure you want to log out this device?')) {
            return;
        }

        setDeviceActionLoading(id);
        setDeviceSuccessMsg('');
        setDeviceErrorMsg('');
        try {
            const { data } = await apiClient.delete(`/user/devices/${id}`);
            setDeviceSuccessMsg(data.message || 'Device logged out successfully.');
            await fetchDevices();
        } catch (err: any) {
            setDeviceErrorMsg(err.response?.data?.message || 'Failed to log out device.');
        } finally {
            setDeviceActionLoading(null);
        }
    };

    const handleLogoutOthers = async () => {
        if (!window.confirm('Are you sure you want to log out all other devices except this one?')) {
            return;
        }

        setDeviceActionLoading('others');
        setDeviceSuccessMsg('');
        setDeviceErrorMsg('');
        try {
            const { data } = await apiClient.post('/user/devices/logout-others');
            setDeviceSuccessMsg(data.message || 'Logged out from all other devices successfully.');
            await fetchDevices();
        } catch (err: any) {
            setDeviceErrorMsg(err.response?.data?.message || 'Failed to log out other devices.');
        } finally {
            setDeviceActionLoading(null);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileLoading(true);
        setProfileSuccessMsg('');
        setProfileErrorMsg('');

        try {
            const { data } = await apiClient.put('/user/profile', {
                name,
                email
            });
            setProfileSuccessMsg(data.message || 'Profile updated successfully!');
            if (updateUser && data.user) {
                updateUser(data.user);
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Profile update failed. Please check your inputs.';
            setProfileErrorMsg(msg);
        } finally {
            setProfileLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordLoading(true);
        setPasswordSuccessMsg('');
        setPasswordErrorMsg('');

        if (newPassword.length < 8) {
            setPasswordErrorMsg('New password must be at least 8 characters long.');
            setPasswordLoading(false);
            return;
        }

        if (newPassword !== newPasswordConfirm) {
            setPasswordErrorMsg('New password and confirm password do not match.');
            setPasswordLoading(false);
            return;
        }

        try {
            const { data } = await apiClient.post('/user/change-password', {
                current_password: currentPassword,
                password: newPassword,
                password_confirmation: newPasswordConfirm
            });
            setPasswordSuccessMsg(data.message || 'Password changed successfully.');
            setCurrentPassword('');
            setNewPassword('');
            setNewPasswordConfirm('');
        } catch (err: any) {
            const msg = err.response?.data?.message || err.response?.data?.errors?.current_password?.[0] || 'Unable to change password.';
            setPasswordErrorMsg(msg);
        } finally {
            setPasswordLoading(false);
        }
    };

    const isMobileDevice = (name: string, ua?: string | null) => {
        const str = `${name} ${ua || ''}`.toLowerCase();
        return str.includes('android') || str.includes('iphone') || str.includes('ipad') || str.includes('mobile');
    };

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return 'Unknown';
        try {
            const d = new Date(dateStr);
            return d.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Page Header (No Internal Tabs) */}
            <div className="bg-white dark:bg-[#0A0404] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-white/[0.08] shadow-xs dark:shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#A60201] via-[#880101] to-[#5A0101] text-white flex items-center justify-center font-black text-2xl shadow-md shadow-[#A60201]/25 shrink-0">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                {user?.name || 'Student Name'}
                            </h1>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                                <span>Phone: <span className="font-semibold text-slate-700 dark:text-slate-300">{user?.phone}</span></span>
                                <span>•</span>
                                <span>
                                    Registration No: <span className="font-extrabold text-[#A60201] dark:text-red-400 font-mono bg-red-50 dark:bg-[#A60201]/10 border border-red-200/80 dark:border-[#A60201]/30 px-2 py-0.5 rounded-md">{user?.registration_number || 'Loading...'}</span>
                                </span>
                                <span>•</span>
                                <span>Role: <span className="text-[#A60201] dark:text-red-400 font-bold uppercase">{user?.role || 'student'}</span></span>
                            </div>
                        </div>
                    </div>

                    {/* Active Section Indicator Badge */}
                    <div>
                        {activeView === 'devices' && (
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-red-50 dark:bg-[#A60201]/10 text-[#A60201] dark:text-red-300 border border-red-200/80 dark:border-[#A60201]/30 text-xs sm:text-sm font-bold shadow-2xs">
                                <Smartphone className="w-4 h-4 text-[#A60201] dark:text-red-400" />
                                <span>Active Devices & Security</span>
                                <span className="px-2 py-0.5 text-xs rounded-full bg-[#A60201]/15 dark:bg-[#A60201]/25 text-[#A60201] dark:text-red-200 font-extrabold">
                                    {devices.length}/2 Active
                                </span>
                            </div>
                        )}
                        {activeView === 'profile' && (
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-red-50 dark:bg-[#A60201]/10 text-[#A60201] dark:text-red-300 border border-red-200/80 dark:border-[#A60201]/30 text-xs sm:text-sm font-bold shadow-2xs">
                                <UserIcon className="w-4 h-4 text-[#A60201] dark:text-red-400" />
                                <span>Profile & Account Info</span>
                            </div>
                        )}
                        {activeView === 'password' && (
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-red-50 dark:bg-[#A60201]/10 text-[#A60201] dark:text-red-300 border border-red-200/80 dark:border-[#A60201]/30 text-xs sm:text-sm font-bold shadow-2xs">
                                <KeyRound className="w-4 h-4 text-[#A60201] dark:text-red-400" />
                                <span>Change Password</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* VIEW 1: ACTIVE DEVICES & SECURITY */}
            {activeView === 'devices' && (
                <div className="space-y-6">
                    {/* Security Policy Card */}
                    <div className="bg-gradient-to-r from-red-500/5 via-slate-50 to-red-500/5 dark:from-[#1A0505] dark:via-[#0A0404] dark:to-[#1A0505] border border-red-200/60 dark:border-white/[0.08] rounded-3xl p-6 relative overflow-hidden transition-colors">
                        <div className="flex items-start gap-4 relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-black/60 text-[#A60201] dark:text-red-400 shadow-sm border border-slate-100 dark:border-white/[0.08] flex items-center justify-center shrink-0">
                                <Shield className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                                    Device Security Policy: Maximum 2 Active Devices
                                </h2>
                                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                    To ensure account security and copyright protection of course content, an account can be logged in on
                                    <strong> a maximum of 2 devices simultaneously</strong>. Logging in on a 3rd device will automatically log out your oldest active session.
                                </p>
                                <div className="pt-2 flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white dark:bg-white/[0.05] text-[#A60201] dark:text-red-300 border border-red-200/80 dark:border-white/10">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-[#A60201]" />
                                        Max Limit: 2 Devices
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                                        <Clock className="w-3.5 h-3.5 text-[#A60201]" />
                                        Currently Active: {devices.length}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feedback Messages */}
                    {deviceSuccessMsg && (
                        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <span>{deviceSuccessMsg}</span>
                        </div>
                    )}
                    {deviceErrorMsg && (
                        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs sm:text-sm flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                            <span>{deviceErrorMsg}</span>
                        </div>
                    )}

                    {/* Devices List Header & Actions */}
                    <div className="bg-white dark:bg-[#0A0404] rounded-3xl p-6 border border-slate-200/80 dark:border-white/[0.08] shadow-xs dark:shadow-[0_4px_30px_rgba(0,0,0,0.5)] space-y-5 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/[0.08] pb-4">
                            <div>
                                <h3 className="text-base font-black text-slate-900 dark:text-white">
                                    Active Sessions ({devices.length}/2)
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Below are the devices currently logged into your account
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={fetchDevices}
                                    disabled={devicesLoading}
                                    className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-[#A60201] hover:border-[#A60201]/30 dark:hover:text-red-400 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${devicesLoading ? 'animate-spin' : ''}`} />
                                    <span>Refresh</span>
                                </button>

                                {devices.some(d => !d.is_current) && (
                                    <button
                                        type="button"
                                        onClick={handleLogoutOthers}
                                        disabled={deviceActionLoading === 'others'}
                                        className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-300 hover:bg-rose-100 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                                    >
                                        <LogOut className="w-3.5 h-3.5" />
                                        <span>Log Out All Other Devices</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Device Cards */}
                        {devicesLoading ? (
                            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400 dark:text-slate-500">
                                <RefreshCw className="w-8 h-8 animate-spin text-[#A60201]" />
                                <span className="text-xs font-semibold">Loading device list...</span>
                            </div>
                        ) : devices.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                                No active device sessions found.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {devices.map((device) => {
                                    const isMobile = isMobileDevice(device.name, device.user_agent);
                                    return (
                                        <div
                                            key={device.id}
                                            className={`rounded-2xl p-5 border transition-all ${device.is_current
                                                ? 'bg-red-50/30 dark:bg-[#A60201]/10 border-red-200 dark:border-[#A60201]/40 ring-2 ring-[#A60201]/15'
                                                : 'bg-white dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3.5">
                                                    <div
                                                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${device.is_current
                                                            ? 'bg-[#A60201] text-white shadow-xs'
                                                            : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300'
                                                            }`}
                                                    >
                                                        {isMobile ? (
                                                            <Smartphone className="w-5 h-5" />
                                                        ) : (
                                                            <Laptop className="w-5 h-5" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                                                                {device.name}
                                                            </h4>
                                                            {device.is_current && (
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                                                                    Current Device
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                                                            <Globe className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                                                            <span>IP: {device.ip_address || 'Unknown'}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                                    <span>Last Active: {formatDate(device.last_used_at)}</span>
                                                </div>

                                                {!device.is_current ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRevokeDevice(device.id)}
                                                        disabled={deviceActionLoading === device.id}
                                                        className="px-2.5 py-1 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/15 font-bold transition-colors cursor-pointer"
                                                    >
                                                        {deviceActionLoading === device.id ? 'Logging out...' : 'Log Out'}
                                                    </button>
                                                ) : (
                                                    <span className="text-[11px] font-bold text-[#A60201] dark:text-red-400">
                                                        Using Now
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* VIEW 2: PROFILE INFORMATION */}
            {activeView === 'profile' && (
                <div className="bg-white dark:bg-[#0A0404] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-white/[0.08] shadow-xs dark:shadow-[0_4px_30px_rgba(0,0,0,0.5)] space-y-6 transition-colors">
                    <div>
                        <h3 className="text-base font-black text-slate-900 dark:text-white">Personal Information</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Update your full name and registered email address</p>
                    </div>

                    {profileSuccessMsg && (
                        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <span>{profileSuccessMsg}</span>
                        </div>
                    )}
                    {profileErrorMsg && (
                        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs sm:text-sm flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                            <span>{profileErrorMsg}</span>
                        </div>
                    )}

                    <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-xl">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                Full Name
                            </label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-black/40 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm font-medium focus:border-[#A60201] focus:ring-2 focus:ring-[#A60201]/20 focus:outline-hidden transition-all"
                                placeholder="Enter your full name"
                            />
                        </div>

                        {/* Auto-Generated Registration Number */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                                <span>Registration Number (Student ID)</span>
                                <span className="text-[10px] font-bold text-[#A60201] dark:text-red-400 bg-red-50 dark:bg-[#A60201]/10 px-2 py-0.5 rounded-md border border-red-200/80 dark:border-[#A60201]/30">
                                    Auto-Generated
                                </span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    disabled
                                    value={user?.registration_number || 'Loading...'}
                                    className="w-full px-4 py-2.5 rounded-xl border border-red-200/80 dark:border-[#A60201]/30 bg-red-50/40 dark:bg-[#A60201]/10 text-[#A60201] dark:text-red-300 font-mono font-bold text-sm cursor-not-allowed select-all"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#A60201] dark:text-red-300 bg-red-100 dark:bg-[#A60201]/20 px-2.5 py-0.5 rounded-md">
                                    Permanent ID
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                                This unique registration number acts as your permanent student ID across all courses, live classes, exams, and certificates.
                            </p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                Mobile Number (Permanent)
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    disabled
                                    value={user?.phone || ''}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02] text-slate-500 dark:text-slate-400 text-sm font-medium cursor-not-allowed"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-200 dark:bg-white/[0.06] px-2 py-0.5 rounded-md">
                                    Non-changeable
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                                Your mobile number is used as your primary login identifier and cannot be modified directly.
                            </p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                Email Address
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-black/40 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm font-medium focus:border-[#A60201] focus:ring-2 focus:ring-[#A60201]/20 focus:outline-hidden transition-all"
                                placeholder="yourname@gmail.com"
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={profileLoading}
                                className="px-6 py-2.5 rounded-xl bg-[#A60201] hover:bg-[#880101] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#A60201]/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                            >
                                {profileLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                                <span>{profileLoading ? 'Saving...' : 'Save Profile'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* VIEW 3: CHANGE PASSWORD */}
            {activeView === 'password' && (
                <div className="bg-white dark:bg-[#0A0404] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-white/[0.08] shadow-xs dark:shadow-[0_4px_30px_rgba(0,0,0,0.5)] space-y-6 transition-colors">
                    <div>
                        <h3 className="text-base font-black text-slate-900 dark:text-white">Change Password</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Verify your current password and choose a secure new password</p>
                    </div>

                    {passwordSuccessMsg && (
                        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <span>{passwordSuccessMsg}</span>
                        </div>
                    )}
                    {passwordErrorMsg && (
                        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs sm:text-sm flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                            <span>{passwordErrorMsg}</span>
                        </div>
                    )}

                    <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                Current Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    required
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 pr-11 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-black/40 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm font-medium focus:border-[#A60201] focus:ring-2 focus:ring-[#A60201]/20 focus:outline-hidden transition-all"
                                    placeholder="Enter your current password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer p-1"
                                >
                                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                New Password (minimum 8 characters)
                            </label>
                            <div className="relative">
                                <input
                                    type={showNewPassword ? 'text' : 'password'}
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 pr-11 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-black/40 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm font-medium focus:border-[#A60201] focus:ring-2 focus:ring-[#A60201]/20 focus:outline-hidden transition-all"
                                    placeholder="Enter a new secure password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer p-1"
                                >
                                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    required
                                    value={newPasswordConfirm}
                                    onChange={(e) => setNewPasswordConfirm(e.target.value)}
                                    className="w-full px-4 py-2.5 pr-11 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-black/40 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm font-medium focus:border-[#A60201] focus:ring-2 focus:ring-[#A60201]/20 focus:outline-hidden transition-all"
                                    placeholder="Re-type your new password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer p-1"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={passwordLoading}
                                className="px-6 py-2.5 rounded-xl bg-[#A60201] hover:bg-[#880101] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#A60201]/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                            >
                                {passwordLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                                <span>{passwordLoading ? 'Updating...' : 'Update Password'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};
