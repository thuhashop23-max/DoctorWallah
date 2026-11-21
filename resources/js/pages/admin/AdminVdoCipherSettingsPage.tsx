import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { VdocipherSettings } from '../../types';
import {
    Video,
    Save,
    CheckCircle2,
    AlertCircle,
    Eye,
    EyeOff,
    Activity,
    ShieldCheck,
    Lock,
    ExternalLink,
    HelpCircle,
    Folder,
    Check,
    Copy,
    Loader2,
    Sparkles
} from 'lucide-react';

const DEFAULT_VDOCIPHER: VdocipherSettings = {
    enabled: true,
    api_secret_key: '',
    folder_id: '',
    watermark_enabled: true,
};

export const AdminVdoCipherSettingsPage: React.FC = () => {
    const [settings, setSettings] = useState<VdocipherSettings>(DEFAULT_VDOCIPHER);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [showKey, setShowKey] = useState(false);
    const [copiedKey, setCopiedKey] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const { data } = await apiClient.get('/admin/settings/vdocipher');
            if (data?.settings) {
                setSettings({
                    enabled: data.settings.enabled ?? true,
                    api_secret_key: data.settings.api_secret_key || '',
                    folder_id: data.settings.folder_id || '',
                    watermark_enabled: data.settings.watermark_enabled ?? true,
                });
            }
        } catch (err: any) {
            console.error('Failed to fetch VdoCipher settings:', err);
            setErrorMessage('Failed to load VdoCipher settings. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setSaving(true);
        setSuccessMessage(null);
        setErrorMessage(null);

        try {
            const { data } = await apiClient.put('/admin/settings/vdocipher', settings);
            setSuccessMessage(data.message || 'VdoCipher configuration saved successfully.');
            if (data?.settings) {
                setSettings({
                    enabled: data.settings.enabled ?? true,
                    api_secret_key: data.settings.api_secret_key || '',
                    folder_id: data.settings.folder_id || '',
                    watermark_enabled: data.settings.watermark_enabled ?? true,
                });
            }
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch (err: any) {
            console.error('Failed to update VdoCipher settings:', err);
            setErrorMessage(err.response?.data?.message || 'Failed to save settings. Please check your inputs.');
        } finally {
            setSaving(false);
        }
    };

    const handleTestConnection = async () => {
        if (!settings.api_secret_key.trim()) {
            setErrorMessage('Please provide an API Secret Key to test connection.');
            return;
        }

        setTesting(true);
        setTestResult(null);
        setErrorMessage(null);

        try {
            const { data } = await apiClient.post('/admin/settings/vdocipher/test-connection', {
                api_secret_key: settings.api_secret_key,
            });
            setTestResult({
                success: data.success,
                message: data.message,
                count: data.count,
            });
        } catch (err: any) {
            setTestResult({
                success: false,
                message: err.response?.data?.message || 'Connection failed. Please verify your API Secret Key.',
            });
        } finally {
            setTesting(false);
        }
    };

    const handleCopyKey = () => {
        if (!settings.api_secret_key) return;
        navigator.clipboard.writeText(settings.api_secret_key);
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 2000);
    };

    const isConfigured = Boolean(settings.api_secret_key.trim());

    if (loading) {
        return (
            <div className="min-h-[500px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                    <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
                    <p className="text-sm font-semibold">Loading VdoCipher Configuration...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                            <Video className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                VdoCipher Configuration
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                Configure DRM video security, direct uploads, and dynamic student watermarking.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleTestConnection}
                        disabled={testing || !settings.api_secret_key.trim()}
                        className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-purple-500 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                        {testing ? <Loader2 className="w-4 h-4 animate-spin text-purple-600" /> : <Activity className="w-4 h-4 text-purple-600" />}
                        <span>{testing ? 'Testing...' : 'Test Connection'}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleSave()}
                        disabled={saving}
                        className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-purple-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>{saving ? 'Saving...' : 'Save Settings'}</span>
                    </button>
                </div>
            </div>

            {/* Notifications */}
            {successMessage && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center gap-3 text-sm animate-in fade-in duration-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{successMessage}</span>
                </div>
            )}

            {errorMessage && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 flex items-center gap-3 text-sm animate-in fade-in duration-200">
                    <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>{errorMessage}</span>
                </div>
            )}

            {testResult && (
                <div className={`p-4 rounded-2xl border text-sm flex items-start gap-3 animate-in fade-in duration-200 ${
                    testResult.success
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                        : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                }`}>
                    {testResult.success ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                        <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                        <p className="font-bold">{testResult.success ? 'API Connection Verified' : 'Connection Failed'}</p>
                        <p className="text-xs opacity-90 mt-0.5">{testResult.message}</p>
                    </div>
                </div>
            )}

            {/* Status Overview Card */}
            <div className="bg-gradient-to-r from-purple-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-purple-800/40 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold text-purple-200">
                            <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
                            <span>DRM Video Anti-Piracy Protection</span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black">
                            {isConfigured ? 'VdoCipher DRM Security Active' : 'VdoCipher Not Configured'}
                        </h3>
                        <p className="text-xs sm:text-sm text-purple-200/90 max-w-xl">
                            {isConfigured
                                ? 'Your account is connected. Uploaded course videos are automatically transcoded into multi-bitrate DRM streams and protected with dynamic student watermarks.'
                                : 'Enter your VdoCipher API Secret Key below to enable DRM encryption, screen-recording defense, and high-speed multi-bitrate video streaming.'}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                        <a
                            href="https://www.vdocipher.com/dashboard/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition flex items-center gap-1.5"
                        >
                            <span>Open VdoCipher Console</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                    </div>
                </div>

                {/* Decorative background glow */}
                <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
            </div>

            {/* Main Form */}
            <form onSubmit={handleSave} className="space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between">
                        <div>
                            <h4 className="text-base font-extrabold text-slate-900 dark:text-white">API Credentials</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Required secret credentials to authenticate with the VdoCipher API.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Enable Service:</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.enabled}
                                    onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
                            </label>
                        </div>
                    </div>

                    {/* API Secret Key Field */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                                <Lock className="w-3.5 h-3.5 text-purple-600" />
                                <span>API Secret Key *</span>
                            </span>
                            <a
                                href="https://www.vdocipher.com/dashboard/settings/api"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-1"
                            >
                                <span>Find your key</span>
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        </label>

                        <div className="relative">
                            <input
                                type={showKey ? 'text' : 'password'}
                                required
                                value={settings.api_secret_key}
                                onChange={(e) => setSettings({ ...settings, api_secret_key: e.target.value })}
                                placeholder="Paste your VdoCipher API Secret Key here"
                                className="w-full px-4 py-3 pr-24 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs sm:text-sm font-mono text-slate-900 dark:text-white focus:outline-hidden focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                            />

                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                {settings.api_secret_key && (
                                    <button
                                        type="button"
                                        onClick={handleCopyKey}
                                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700 transition"
                                        title="Copy Key"
                                    >
                                        {copiedKey ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setShowKey(!showKey)}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700 transition"
                                    title={showKey ? 'Hide Key' : 'Show Key'}
                                >
                                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <p className="text-[11px] text-slate-400">
                            Available in your VdoCipher console under <strong>Settings &gt; API</strong>. Used securely by your server to generate video upload tokens and encrypted playback OTPs.
                        </p>
                    </div>

                    {/* Default Folder ID (Optional) */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <Folder className="w-3.5 h-3.5 text-slate-500" />
                            <span>Default Folder ID (Optional)</span>
                        </label>
                        <input
                            type="text"
                            value={settings.folder_id || ''}
                            onChange={(e) => setSettings({ ...settings, folder_id: e.target.value })}
                            placeholder="e.g. 1a2b3c4d5e6f7g8h"
                            className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs sm:text-sm font-mono text-slate-900 dark:text-white focus:outline-hidden focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                        />
                        <p className="text-[11px] text-slate-400">
                            If you organize videos into folders in VdoCipher, newly uploaded lesson videos will automatically be stored inside this folder.
                        </p>
                    </div>

                    {/* DRM Watermark Toggle */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-purple-600" />
                                <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                                    Dynamic Anti-Piracy Watermarking
                                </h5>
                            </div>
                            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 max-w-xl">
                                Dynamically overlays each enrolled student's name and mobile number at moving random positions on the video player. Deters unauthorized screen-recording and content leakage.
                            </p>
                        </div>

                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input
                                type="checkbox"
                                checked={settings.watermark_enabled}
                                onChange={(e) => setSettings({ ...settings, watermark_enabled: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
                        </label>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm rounded-xl shadow-md shadow-purple-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
                        </button>
                    </div>
                </div>
            </form>

            {/* Quick How-To Instructions */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                    <HelpCircle className="w-4 h-4 text-purple-600" />
                    <span>How to use VdoCipher in Lessons</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 space-y-1.5">
                        <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 font-black text-xs flex items-center justify-center">1</span>
                        <h6 className="font-bold text-slate-900 dark:text-white">Save API Key</h6>
                        <p className="text-xs text-slate-500">Paste your API Secret Key above and click Test Connection to confirm.</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 space-y-1.5">
                        <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 font-black text-xs flex items-center justify-center">2</span>
                        <h6 className="font-bold text-slate-900 dark:text-white">Add/Edit Lesson</h6>
                        <p className="text-xs text-slate-500">In Course Builder, choose VdoCipher from the video source dropdown.</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 space-y-1.5">
                        <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 font-black text-xs flex items-center justify-center">3</span>
                        <h6 className="font-bold text-slate-900 dark:text-white">Upload or Paste Shortcode</h6>
                        <p className="text-xs text-slate-500">Upload your video file directly with automatic transcoding or paste your Video ID / Shortcode.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
