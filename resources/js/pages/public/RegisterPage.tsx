import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';
import { apiClient } from '../../api/client';
import { User, Phone, Mail, Lock, BookOpen, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';

export const RegisterPage: React.FC = () => {
    const { login } = useAuth();
    const { t } = useLanguage();
    const { settings } = useSettings();
    const navigate = useNavigate();

    const logoUrl = settings?.logo_url || settings?.header_settings?.logo_url;
    const [logoError, setLogoError] = useState(false);

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // OTP Modal states
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [otpError, setOtpError] = useState<string | null>(null);
    const [otpLoading, setOtpLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendSuccess, setResendSuccess] = useState<string | null>(null);

    useEffect(() => {
        let timer: any;
        if (resendCooldown > 0) {
            timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const { data } = await apiClient.post('/auth/register', {
                name,
                phone,
                email,
                password,
                password_confirmation: passwordConfirmation,
            });

            if (data.requires_otp) {
                setShowOtpModal(true);
                setResendCooldown(60);
                setResendSuccess(null);
                setOtpError(null);
            } else {
                login(data.token, data.user);
                navigate('/student');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed. Please check your information.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setOtpError(null);
        setOtpLoading(true);

        try {
            const { data } = await apiClient.post('/auth/otp/verify', {
                phone,
                otp: otpCode,
            });

            if (data.token && data.user) {
                login(data.token, data.user);
                setShowOtpModal(false);
                navigate('/student');
            }
        } catch (err: any) {
            setOtpError(err.response?.data?.message || 'Invalid OTP code. Please try again.');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendCooldown > 0 || resendLoading) return;

        setResendLoading(true);
        setOtpError(null);
        setResendSuccess(null);

        try {
            const { data } = await apiClient.post('/auth/otp/resend', { phone });
            setResendSuccess(data.message || 'A new OTP code has been sent.');
            setResendCooldown(60);
        } catch (err: any) {
            const seconds = err.response?.data?.seconds_remaining;
            if (seconds) setResendCooldown(seconds);
            setOtpError(err.response?.data?.message || 'Failed to send OTP code.');
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050811] text-white flex items-center justify-center px-4 py-12 sm:py-20 relative overflow-hidden font-sans">
            {/* Ambient Medical Glow Mesh & Grid Backdrop */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(6,182,212,0.16),rgba(255,255,255,0))] pointer-events-none" />
            <div className="absolute top-1/4 -left-48 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-md w-full relative z-10 bg-[#0B101D]/90 backdrop-blur-2xl p-7 sm:p-9 rounded-[28px] border border-cyan-500/25 shadow-[0_0_60px_-15px_rgba(6,182,212,0.2)] space-y-6">
                {/* Top Laser Hairline Accent */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/90 to-transparent pointer-events-none rounded-t-[28px]" />

                <div className="text-center space-y-3">
                    {logoUrl && !logoError ? (
                        <Link to="/" className="inline-block transition-transform hover:scale-105 mx-auto">
                            <img
                                src={logoUrl}
                                alt={settings?.site_name || 'DoctorWallah'}
                                onError={() => setLogoError(true)}
                                className="h-12 sm:h-14 w-auto object-contain mx-auto max-w-[220px]"
                            />
                        </Link>
                    ) : (
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-teal-500 flex items-center justify-center text-slate-950 font-black mx-auto shadow-md shadow-cyan-500/20">
                            <BookOpen className="w-6 h-6" />
                        </div>
                    )}
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-[11px] font-mono tracking-wider mb-2">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                            <span>STUDENT REGISTRATION</span>
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tight">
                            {t.auth.registerTitle || 'Create Doctor Account'}
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">
                            {t.auth.registerSub || 'Join Bangladesh\'s #1 MBBS academic learning platform.'}
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2.5 shadow-md">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                            {t.auth.nameLabel || 'Full Name'}
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t.auth.namePlaceholder || 'e.g. Dr. Arpon Hossain'}
                                className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 hover:border-cyan-500/40 focus:border-cyan-400 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono transition-all"
                            />
                            <User className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3.5" />
                        </div>
                    </div>

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
                                className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 hover:border-cyan-500/40 focus:border-cyan-400 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono transition-all"
                            />
                            <Phone className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3.5" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                            {t.auth.emailLabel || 'Email Address'}
                        </label>
                        <div className="relative">
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t.auth.emailPlaceholder || 'student@doctorwallah.com'}
                                className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 hover:border-cyan-500/40 focus:border-cyan-400 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono transition-all"
                            />
                            <Mail className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3.5" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                            {t.auth.passwordLabel || 'Password'}
                        </label>
                        <div className="relative">
                            <input
                                type="password"
                                required
                                minLength={8}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={t.auth.passwordPlaceholder || '••••••••'}
                                className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 hover:border-cyan-500/40 focus:border-cyan-400 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono transition-all"
                            />
                            <Lock className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3.5" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                            {t.auth.confirmPasswordLabel || 'Confirm Password'}
                        </label>
                        <div className="relative">
                            <input
                                type="password"
                                required
                                value={passwordConfirmation}
                                onChange={(e) => setPasswordConfirmation(e.target.value)}
                                placeholder={t.auth.confirmPasswordPlaceholder || '••••••••'}
                                className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 hover:border-cyan-500/40 focus:border-cyan-400 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono transition-all"
                            />
                            <Lock className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3.5" />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:opacity-95 text-slate-950 font-black text-sm shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 font-mono uppercase tracking-wider mt-2"
                    >
                        <span>{loading ? t.auth.processing : (t.auth.completeRegisterBtn || 'CREATE DOCTOR ACCOUNT')}</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </form>

                <div className="text-center text-xs text-slate-400 pt-3 border-t border-cyan-500/10">
                    {t.auth.haveAccount || 'Already have an account?'}{' '}
                    <Link to="/login" className="font-bold text-cyan-400 hover:text-cyan-300 transition-colors">
                        {t.auth.loginBtn || 'Sign In Here →'}
                    </Link>
                </div>
            </div>

            {/* OTP Verification Modal */}
            <Modal
                isOpen={showOtpModal}
                onClose={() => setShowOtpModal(false)}
                title={t.auth.verifyOtpTitle}
                maxWidth="sm"
            >
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="text-center space-y-1">
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                            A 6-digit OTP code has been sent to <span className="font-bold text-slate-800 dark:text-slate-100">{phone}</span>.
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                            Your account will be activated automatically once the number is verified.
                        </p>
                    </div>

                    {resendSuccess && (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800/50">
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            <span>{resendSuccess}</span>
                        </div>
                    )}

                    {otpError && (
                        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-lg text-xs flex items-center gap-1.5 border border-rose-200 dark:border-rose-900/50">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{otpError}</span>
                        </div>
                    )}

                    <div>
                        <input
                            type="text"
                            required
                            maxLength={6}
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                            placeholder="------"
                            className="w-full text-center tracking-[0.5em] text-xl font-bold py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-800"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={otpLoading || otpCode.length !== 6}
                        className="w-full py-3 bg-sky-600 text-white font-bold text-sm rounded-xl hover:bg-sky-700 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        {otpLoading ? t.auth.verifying : t.auth.verifyOtpBtn}
                    </button>

                    <div className="flex items-center justify-between text-xs pt-1 px-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400">Didn't receive code?</span>
                        {resendCooldown > 0 ? (
                            <span className="text-slate-400 dark:text-slate-500 font-medium font-mono">
                                Resend in {resendCooldown}s
                            </span>
                        ) : (
                            <button
                                type="button"
                                onClick={handleResendOtp}
                                disabled={resendLoading}
                                className="text-sky-600 dark:text-sky-400 font-bold hover:underline cursor-pointer disabled:opacity-50"
                            >
                                {resendLoading ? 'Sending...' : 'Resend OTP'}
                            </button>
                        )}
                    </div>
                </form>
            </Modal>
        </div>
    );
};
