import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { apiClient } from '../../api/client';
import { 
    Phone, 
    Lock, 
    KeyRound, 
    CheckCircle2, 
    AlertCircle, 
    ArrowRight, 
    ArrowLeft, 
    Eye, 
    EyeOff, 
    Loader2, 
    RefreshCw,
    GraduationCap
} from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
    const { login } = useAuth();
    const { settings } = useSettings();
    const navigate = useNavigate();

    const logoUrl = settings?.logo_url || settings?.header_settings?.logo_url;
    const [logoError, setLogoError] = useState(false);

    // Step: 1 = Enter Phone, 2 = Enter OTP, 3 = New Password
    const [step, setStep] = useState<1 | 2 | 3>(1);

    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Resend countdown
    const [resendCooldown, setResendCooldown] = useState(0);

    useEffect(() => {
        let timer: any;
        if (resendCooldown > 0) {
            timer = setInterval(() => {
                setResendCooldown(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [resendCooldown]);

    // Step 1: Send OTP
    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        if (!phone.trim()) {
            setError('Please enter your mobile number.');
            return;
        }

        try {
            setLoading(true);
            const { data } = await apiClient.post('/auth/forgot-password/send-otp', {
                phone: phone.trim(),
            });

            setSuccessMessage(data.message || 'An OTP code has been sent to your phone.');
            setResendCooldown(60);
            setStep(2);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send OTP. Please provide a valid mobile number.');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Resend OTP
    const handleResendOtp = async () => {
        if (resendCooldown > 0) return;
        setError(null);
        setSuccessMessage(null);

        try {
            setLoading(true);
            const { data } = await apiClient.post('/auth/forgot-password/send-otp', {
                phone: phone.trim(),
            });

            setSuccessMessage(data.message || 'A new OTP code has been sent.');
            setResendCooldown(60);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to resend OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        if (otp.trim().length !== 6) {
            setError('Please enter the 6-digit OTP code.');
            return;
        }

        try {
            setLoading(true);
            const { data } = await apiClient.post('/auth/forgot-password/verify-otp', {
                phone: phone.trim(),
                otp: otp.trim(),
            });

            setSuccessMessage(data.message || 'OTP verified successfully! Now set a new password.');
            setStep(3);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid OTP code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Reset Password & Auto Login
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match. Please try again.');
            return;
        }

        try {
            setLoading(true);
            const { data } = await apiClient.post('/auth/forgot-password/reset', {
                phone: phone.trim(),
                otp: otp.trim(),
                password: newPassword,
                password_confirmation: confirmPassword,
            });

            setSuccessMessage(data.message || 'Password changed successfully!');
            
            // Auto login user
            if (data.token && data.user) {
                login(data.token, data.user);
                setTimeout(() => {
                    if (data.user.role === 'admin') navigate('/admin');
                    else if (data.user.role === 'teacher') navigate('/teacher');
                    else navigate('/student');
                }, 1000);
            } else {
                navigate('/login');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 font-sans">
            <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-sky-500/5 p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 space-y-6">
                {/* Brand & Header */}
                <div className="text-center space-y-3">
                    {logoUrl && !logoError ? (
                        <Link to="/" className="inline-block transition-transform hover:scale-105 mx-auto">
                            <img
                                src={logoUrl}
                                alt={settings?.site_name || 'Logo'}
                                onError={() => setLogoError(true)}
                                className="h-12 sm:h-14 w-auto object-contain mx-auto max-w-[220px]"
                            />
                        </Link>
                    ) : (
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-amber-500 text-white flex items-center justify-center mx-auto shadow-md shadow-sky-500/20">
                            <KeyRound className="w-6 h-6" />
                        </div>
                    )}
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            Reset Password
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {step === 1 && 'Enter your registered mobile number'}
                            {step === 2 && 'Verify the 6-digit OTP sent to your phone'}
                            {step === 3 && 'Set a new password for your account'}
                        </p>
                    </div>
                </div>

                {/* Step Indicators */}
                <div className="flex items-center justify-center gap-2 pt-1">
                    <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 1 ? 'w-8 bg-sky-600' : 'w-2 bg-slate-200 dark:bg-slate-700'}`} />
                    <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 2 ? 'w-8 bg-sky-600' : 'w-2 bg-slate-200 dark:bg-slate-700'}`} />
                    <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 3 ? 'w-8 bg-sky-600' : 'w-2 bg-slate-200 dark:bg-slate-700'}`} />
                </div>

                {/* Alerts */}
                {error && (
                    <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in duration-200">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                        <span className="font-semibold leading-relaxed">{error}</span>
                    </div>
                )}

                {successMessage && (
                    <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-700 dark:text-emerald-300 animate-in fade-in duration-200">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                        <span className="font-semibold leading-relaxed">{successMessage}</span>
                    </div>
                )}

                {/* STEP 1: ENTER PHONE */}
                {step === 1 && (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                Mobile Number
                            </label>
                            <div className="relative">
                                <input
                                    type="tel"
                                    required
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="017xxxxxxxx"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-800 transition-all font-mono"
                                />
                                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">
                                A 6-digit verification code will be sent to this number.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 via-sky-600 to-sky-700 hover:from-sky-600 hover:to-sky-800 text-white font-extrabold text-sm shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <span>Send OTP Code</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                )}

                {/* STEP 2: ENTER OTP */}
                {step === 2 && (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                    6-Digit OTP Code
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="text-xs font-bold text-sky-600 hover:underline"
                                >
                                    Change Number
                                </button>
                            </div>

                            <input
                                type="text"
                                maxLength={6}
                                required
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                placeholder="• • • • • •"
                                className="w-full py-3 text-center text-xl font-mono font-bold tracking-widest bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
                            />
                        </div>

                        {/* Resend OTP Button */}
                        <div className="text-center">
                            {resendCooldown > 0 ? (
                                <span className="text-xs text-slate-400">
                                    Resend code in: <strong className="text-sky-600 font-mono">{resendCooldown}s</strong>
                                </span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    disabled={loading}
                                    className="text-xs font-bold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1 cursor-pointer"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    <span>Resend Code</span>
                                </button>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || otp.length !== 6}
                            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 via-sky-600 to-sky-700 hover:from-sky-600 hover:to-sky-800 text-white font-extrabold text-sm shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <span>Verify OTP</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                )}

                {/* STEP 3: SET NEW PASSWORD */}
                {step === 3 && (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    minLength={8}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="At least 8 characters"
                                    className="w-full pl-10 pr-11 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
                                />
                                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute right-2.5 top-2.5 rounded-lg transition-colors cursor-pointer"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                                    minLength={8}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm password"
                                    className="w-full pl-10 pr-11 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
                                />
                                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute right-2.5 top-2.5 rounded-lg transition-colors cursor-pointer"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 via-sky-600 to-sky-700 hover:from-sky-600 hover:to-sky-800 text-white font-extrabold text-sm shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <span>Reset Password & Login</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                )}

                {/* Back to Login Link */}
                <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800">
                    Remember your password?{' '}
                    <Link to="/login" className="font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 inline-flex items-center gap-1">
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Login</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};

