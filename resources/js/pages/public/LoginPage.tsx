import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';
import { apiClient } from '../../api/client';
import {
    Phone,
    Lock,
    BookOpen,
    AlertCircle,
    ArrowRight,
    Eye,
    EyeOff,
    Stethoscope,
    Activity,
    ShieldCheck,
    Microscope,
    Zap,
    Sparkles
} from 'lucide-react';

export const LoginPage: React.FC = () => {
    const { login } = useAuth();
    const { t } = useLanguage();
    const { settings } = useSettings();
    const navigate = useNavigate();

    const logoUrl = settings?.logo_url || settings?.header_settings?.logo_url;
    const [logoError, setLogoError] = useState(false);

    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const { data } = await apiClient.post('/auth/login', {
                phone,
                password,
            });

            login(data.token, data.user);

            // Redirect based on role
            if (data.user.role === 'admin') {
                navigate('/admin');
            } else if (data.user.role === 'teacher') {
                navigate('/teacher');
            } else {
                navigate('/student');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#060202] text-white flex items-center justify-center px-4 py-12 sm:py-20 relative overflow-hidden font-sans">
            {/* Ambient Medical Glow Mesh & Grid Backdrop */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(166,2,1,0.22),rgba(0,0,0,0))] pointer-events-none" />
            <div className="absolute top-1/4 -left-48 w-96 h-96 bg-[#A60201]/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-[#A60201]/10 rounded-full blur-3xl pointer-events-none" />

            {/* Subtle Electrocardiogram (ECG) Pulse Line SVG in Background */}
            <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 opacity-[0.06] pointer-events-none overflow-hidden select-none">
                <svg className="w-full h-48" viewBox="0 0 1200 200" fill="none" preserveAspectRatio="none">
                    <path
                        d="M0 100 L300 100 L320 60 L335 140 L350 40 L365 170 L380 90 L395 110 L410 100 L700 100 L720 60 L735 140 L750 40 L765 170 L780 90 L795 110 L810 100 L1200 100"
                        stroke="#A60201"
                        strokeWidth="2.5"
                    />
                </svg>
            </div>

            <div className="max-w-6xl w-full mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
                {/* Left Column: Clinical Studio Brand Identity & Capabilities */}
                <div className="lg:col-span-6 space-y-6 text-center lg:text-left order-2 lg:order-1">
                    {/* Brand Logo & Eyebrow */}
                    <div className="space-y-4">
                        {logoUrl && !logoError ? (
                            <Link to="/" className="inline-block transition-transform hover:scale-105">
                                <img
                                    src={logoUrl}
                                    alt={settings?.site_name || 'DoctorWallah'}
                                    onError={() => setLogoError(true)}
                                    className="h-12 sm:h-14 w-auto object-contain mx-auto lg:mx-0 max-w-[220px]"
                                />
                            </Link>
                        ) : (
                            <Link to="/" className="inline-flex items-center gap-2.5">
                                <div className="w-11 h-11 rounded-2xl bg-[#A60201] flex items-center justify-center text-white font-black shadow-lg shadow-[#A60201]/30">
                                    <Stethoscope className="w-6 h-6" />
                                </div>
                                <span className="text-2xl font-black text-white tracking-tight">DoctorWallah</span>
                            </Link>
                        )}

                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1A0303]/90 border border-[#A60201]/40 text-red-200 text-xs font-mono tracking-wider backdrop-blur-xl">
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A60201] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#A60201]"></span>
                            </span>
                            <span>MBBS CLINICAL PORTAL • ACADEMIC SUITE</span>
                        </div>
                    </div>

                    <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.15]">
                        Welcome Back, <br />
                        <span className="bg-gradient-to-r from-white via-rose-100 to-[#EF4444] bg-clip-text text-transparent">
                            Doctor-in-Training.
                        </span>
                    </h1>

                    <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                        Log in to resume your Gross Anatomy dissection lectures, Physiology & Biochemistry conceptual modules, and access your personalized marked textbooks vault.
                    </p>

                    {/* 3 Medical Capability Pillars */}
                    <div className="space-y-3 pt-2 text-left max-w-lg mx-auto lg:mx-0">
                        <div className="p-3.5 rounded-2xl bg-[#0D0404]/80 border border-[#A60201]/25 backdrop-blur-xl flex items-center gap-3.5">
                            <div className="w-9 h-9 rounded-xl bg-[#A60201]/15 border border-[#A60201]/40 text-red-400 flex items-center justify-center shrink-0">
                                <Activity className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-white">4K Cadaveric Dissection Lab</h4>
                                <p className="text-[11px] text-slate-400">Thorax, Viscera, Head & Neck, Extremities with live orientation</p>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-[#0D0404]/80 border border-[#A60201]/25 backdrop-blur-xl flex items-center gap-3.5">
                            <div className="w-9 h-9 rounded-xl bg-[#A60201]/15 border border-[#A60201]/40 text-red-400 flex items-center justify-center shrink-0">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-white">Professor-Marked Textbooks</h4>
                                <p className="text-[11px] text-slate-400">Guyton, BDC & Ganong highlighted with must-know viva lines</p>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-[#0D0404]/80 border border-[#A60201]/25 backdrop-blur-xl flex items-center gap-3.5">
                            <div className="w-9 h-9 rounded-xl bg-[#A60201]/15 border border-[#A60201]/40 text-red-400 flex items-center justify-center shrink-0">
                                <Zap className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-white">10-Minute Item Panic Station</h4>
                                <p className="text-[11px] text-slate-400">Night-before rapid viva & card survival review cards</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Secure Clinical Authentication Terminal */}
                <div className="lg:col-span-6 max-w-md w-full mx-auto order-1 lg:order-2">
                    <div className="relative bg-[#0A0303]/95 backdrop-blur-2xl p-7 sm:p-9 rounded-[28px] border border-[#A60201]/30 shadow-[0_0_60px_-15px_rgba(166,2,1,0.3)] space-y-6">
                        {/* Top Laser Hairline Accent */}
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#A60201] to-transparent pointer-events-none rounded-t-[28px]" />

                        {/* Terminal Header */}
                        <div className="border-b border-[#A60201]/15 pb-4 space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] font-mono text-red-400 font-bold">
                                <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[#A60201] animate-ping" />
                                    <span>SECURE CLINICAL AUTH</span>
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1A0303] border border-[#A60201]/40 text-red-200">
                                    256-BIT SSL
                                </span>
                            </div>
                            <h2 className="text-2xl font-black text-white tracking-tight">
                                {t.auth.loginTitle || 'Portal Sign In'}
                            </h2>
                            <p className="text-xs text-slate-400">
                                {t.auth.loginSub || 'Enter your registered mobile number and password to access.'}
                            </p>
                        </div>

                        {error && (
                            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2.5 shadow-md">
                                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Phone Input */}
                            <div>
                                <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                                    {t.auth.phoneLabel || 'Mobile Number'}
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder={t.auth.phonePlaceholder || '01XXXXXXXXX'}
                                        className="w-full pl-10 pr-4 py-3 bg-black/80 border border-slate-800 hover:border-[#A60201]/50 focus:border-[#A60201] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#A60201] font-mono transition-all"
                                    />
                                    <Phone className="w-4 h-4 text-red-400 absolute left-3.5 top-3.5" />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                                        {t.auth.passwordLabel || 'Password'}
                                    </label>
                                    <Link
                                        to="/forgot-password"
                                        className="text-xs font-bold text-red-400 hover:text-white hover:underline transition-colors"
                                    >
                                        Forgot Password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder={t.auth.passwordPlaceholder || '••••••••'}
                                        className="w-full pl-10 pr-11 py-3 bg-black/80 border border-slate-800 hover:border-[#A60201]/50 focus:border-[#A60201] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#A60201] font-mono transition-all"
                                    />
                                    <Lock className="w-4 h-4 text-red-400 absolute left-3.5 top-3.5" />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="p-1.5 text-slate-400 hover:text-red-300 absolute right-2.5 top-2.5 rounded-lg transition-colors cursor-pointer"
                                        title={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-red-400" />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 rounded-xl bg-[#A60201] hover:bg-[#880101] text-white font-black text-sm shadow-lg shadow-[#A60201]/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 font-mono uppercase tracking-wider mt-2"
                            >
                                <span>{loading ? t.common.loading : (t.auth.loginBtn || 'ENTER CLINICAL PORTAL')}</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </form>

                        {/* Security accreditation seal */}
                        <div className="pt-2 flex items-center justify-center gap-2 text-[11px] font-mono text-slate-400">
                            <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
                            <span>Protected & Encrypted Medical Session</span>
                        </div>

                        {/* Register link */}
                        <div className="text-center text-xs text-slate-400 pt-3 border-t border-[#A60201]/15">
                            {t.auth.noAccount || "Don't have an account?"}{' '}
                            <Link to="/register" className="font-bold text-red-400 hover:text-white transition-colors">
                                {t.auth.registerBtn || 'Create Student Account →'}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
