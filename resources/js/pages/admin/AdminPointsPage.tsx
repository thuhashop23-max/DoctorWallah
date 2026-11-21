import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import {
    Gem,
    Sparkles,
    Settings,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Save,
    TrendingUp,
    ShieldAlert,
    Coins,
    Sliders,
    Zap,
    Percent,
    ArrowRight
} from 'lucide-react';

interface PointSettings {
    id?: number;
    purchase_points_enabled: boolean;
    purchase_points_type: 'fixed' | 'per_amount';
    points_per_course: number;
    points_per_100_currency: number;
    redemption_enabled: boolean;
    redemption_points: number;
    redemption_amount: number;
    max_redemption_percentage: number;
    is_active: boolean;
}

export const AdminPointsPage: React.FC = () => {
    const [settings, setSettings] = useState<PointSettings>({
        purchase_points_enabled: true,
        purchase_points_type: 'fixed',
        points_per_course: 50,
        points_per_100_currency: 10,
        redemption_enabled: true,
        redemption_points: 10,
        redemption_amount: 1.00,
        max_redemption_percentage: 50,
        is_active: true,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

    // Interactive simulator state
    const [simPoints, setSimPoints] = useState<number>(200);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get('/admin/points/settings');
            if (res.data?.settings) {
                setSettings({
                    ...res.data.settings,
                    redemption_enabled: res.data.settings.redemption_enabled !== false,
                    redemption_points: res.data.settings.redemption_points ?? 10,
                    redemption_amount: res.data.settings.redemption_amount ?? 1.00,
                    max_redemption_percentage: res.data.settings.max_redemption_percentage ?? 50,
                });
            }
        } catch (err) {
            console.error('Failed to load point settings', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            setSaveSuccessMsg(null);
            const res = await apiClient.put('/admin/points/settings', settings);
            if (res.data?.settings) {
                setSettings({
                    ...res.data.settings,
                    redemption_enabled: res.data.settings.redemption_enabled !== false,
                    redemption_points: res.data.settings.redemption_points ?? 10,
                    redemption_amount: res.data.settings.redemption_amount ?? 1.00,
                    max_redemption_percentage: res.data.settings.max_redemption_percentage ?? 50,
                });
            }
            setSaveSuccessMsg('Point rules and redemption settings saved successfully!');
            setTimeout(() => setSaveSuccessMsg(null), 4000);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to save point settings.');
        } finally {
            setSaving(false);
        }
    };

    // Calculate simulated discount
    const calcDiscount = (points: number) => {
        const pUnit = Math.max(1, settings.redemption_points || 10);
        const aUnit = Math.max(0.01, settings.redemption_amount || 1);
        return ((points / pUnit) * aUnit).toFixed(2);
    };

    if (loading) {
        return (
            <div className="py-24 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-500">Loading point rules...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header & Submenu Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                        <Gem className="w-7 h-7 text-amber-500" />
                        <span>Points Management</span>
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Configure reward points rules, checkout coin-to-discount conversion, and system status.
                    </p>
                </div>

                {/* Submenu Pills */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <Link
                        to="/admin/points/rules"
                        className="px-4 py-2 rounded-xl text-xs font-black bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs transition"
                    >
                        Points Rules
                    </Link>
                    <Link
                        to="/admin/points/usages"
                        className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
                    >
                        User Usages
                    </Link>
                </div>
            </div>

            {saveSuccessMsg && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-2.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 shadow-2xs">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{saveSuccessMsg}</span>
                </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-6">
                {/* 1. MASTER SWITCH: ENABLE / DISABLE POINTS SYSTEM */}
                <div className={`p-5 sm:p-6 rounded-3xl border transition-all shadow-sm ${
                    settings.is_active
                        ? 'bg-gradient-to-r from-emerald-50/80 via-white to-sky-50/60 dark:from-emerald-950/30 dark:via-slate-900 dark:to-sky-950/20 border-emerald-300 dark:border-emerald-800'
                        : 'bg-gradient-to-r from-rose-50/90 via-white to-amber-50/60 dark:from-rose-950/30 dark:via-slate-900 dark:to-amber-950/20 border-rose-300 dark:border-rose-800'
                }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start sm:items-center gap-3.5">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                                settings.is_active
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-rose-500 text-white'
                            }`}>
                                <Gem className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                                        Reward Points System
                                    </h2>
                                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                                        settings.is_active
                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                    }`}>
                                        {settings.is_active ? 'Active & Enabled' : 'Disabled / Off'}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                                    {settings.is_active
                                        ? 'Points system is fully active. Diamond point badges are displayed in the header, students can earn points, and redeem them at checkout.'
                                        : 'Points system is turned off. All point displays in the header, Earn Points navigation, and checkout redemption options are completely hidden.'}
                                </p>
                            </div>
                        </div>

                        {/* Master Toggle */}
                        <label className="relative inline-flex items-center cursor-pointer shrink-0 self-start sm:self-auto">
                            <input
                                type="checkbox"
                                checked={settings.is_active}
                                onChange={(e) => setSettings({ ...settings, is_active: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-14 h-8 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
                        </label>
                    </div>

                    {!settings.is_active && (
                        <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-2 text-xs font-bold text-rose-700 dark:text-rose-400">
                            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                            <span>System Notice: Point badges in header and cart discount options are currently inactive for all users.</span>
                        </div>
                    )}
                </div>

                {/* 2. HIGHLIGHTED SECTION: COIN TO BDT DISCOUNT REDEMPTION RULES */}
                <div className="relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-sky-500/10 dark:from-amber-950/40 dark:via-slate-900 dark:to-sky-950/30 border-2 border-amber-400/60 dark:border-amber-500/40 rounded-3xl p-5 sm:p-7 shadow-lg shadow-amber-500/5 space-y-6">
                    {/* Glowing Accent Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-amber-200/60 dark:border-amber-800/60">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/30 shrink-0">
                                <Coins className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-black text-lg text-slate-900 dark:text-white">
                                        Checkout Points Redemption Rule
                                    </h3>
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white shadow-2xs">
                                        Featured
                                    </span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                                    Set how many Coins / Points a student must spend to receive a discount in Taka (BDT) on course checkout.
                                </p>
                            </div>
                        </div>

                        {/* Enable Redemption Switch */}
                        <div className="flex items-center gap-2.5 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-2xl border border-amber-200 dark:border-amber-800/80 shadow-2xs shrink-0 self-start sm:self-auto">
                            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                                Allow Checkout Burn:
                            </span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.redemption_enabled}
                                    onChange={(e) => setSettings({ ...settings, redemption_enabled: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-amber-500"></div>
                            </label>
                        </div>
                    </div>

                    {/* Inputs Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* 1. Points Rate */}
                        <div className="p-4 bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-800/80 rounded-2xl shadow-2xs space-y-2">
                            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <Gem className="w-3.5 h-3.5 text-amber-500" />
                                <span>Coins / Points Spent</span>
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min="1"
                                    max="100000"
                                    value={settings.redemption_points}
                                    onChange={(e) => setSettings({ ...settings, redemption_points: parseInt(e.target.value, 10) || 1 })}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500"
                                />
                                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 shrink-0">
                                    Points
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-tight">
                                Number of points required per discount unit.
                            </p>
                        </div>

                        {/* 2. BDT Discount Amount */}
                        <div className="p-4 bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-800/80 rounded-2xl shadow-2xs space-y-2">
                            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <Coins className="w-3.5 h-3.5 text-amber-500" />
                                <span>Discount Received (BDT)</span>
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0.1"
                                    max="10000"
                                    value={settings.redemption_amount}
                                    onChange={(e) => setSettings({ ...settings, redemption_amount: parseFloat(e.target.value) || 1.0 })}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500"
                                />
                                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 shrink-0">
                                    BDT (Tk)
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-tight">
                                Monetary discount awarded for the spent points above.
                            </p>
                        </div>

                        {/* 3. Max Order Discount Limit */}
                        <div className="p-4 bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-800/80 rounded-2xl shadow-2xs space-y-2">
                            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <Percent className="w-3.5 h-3.5 text-amber-500" />
                                <span>Max Discount Cap (%)</span>
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={settings.max_redemption_percentage}
                                    onChange={(e) => setSettings({ ...settings, max_redemption_percentage: parseInt(e.target.value, 10) || 50 })}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500"
                                />
                                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 shrink-0">
                                    % of Order
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-tight">
                                Max percentage of order total that can be discounted via points (e.g. 50% or 100%).
                            </p>
                        </div>
                    </div>

                    {/* LIVE INTERACTIVE SIMULATOR BOX */}
                    <div className="p-5 bg-white dark:bg-slate-900/90 border border-amber-300/80 dark:border-amber-700/80 rounded-2xl shadow-xs space-y-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-amber-500" />
                                <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                                    Live Rate Simulator: {settings.redemption_points} 💎 = Tk {settings.redemption_amount} Discount
                                </h4>
                            </div>
                            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                                1 Point = Tk {(settings.redemption_amount / settings.redemption_points).toFixed(3)}
                            </span>
                        </div>

                        {/* Quick Presets */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                            {[50, 100, 500, 1000].map((pts) => (
                                <button
                                    key={pts}
                                    type="button"
                                    onClick={() => setSimPoints(pts)}
                                    className={`p-3 rounded-xl border transition-all text-left ${
                                        simPoints === pts
                                            ? 'bg-amber-500/15 border-amber-500 text-amber-800 dark:text-amber-300 ring-2 ring-amber-500/30'
                                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-300'
                                    }`}
                                >
                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
                                        Spend {pts} 💎
                                    </span>
                                    <span className="text-base font-black text-amber-600 dark:text-amber-400 block mt-0.5">
                                        Tk {calcDiscount(pts)} OFF
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Interactive Custom Test */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                    Test Custom Points:
                                </span>
                                <input
                                    type="number"
                                    value={simPoints}
                                    onChange={(e) => setSimPoints(parseInt(e.target.value, 10) || 0)}
                                    className="w-24 px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-center"
                                />
                                <span className="text-xs font-bold text-amber-500">💎</span>
                            </div>

                            <div className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <span>Student Saves:</span>
                                <span className="px-3 py-1 bg-emerald-500 text-white rounded-lg font-black text-sm shadow-2xs">
                                    Tk {calcDiscount(simPoints)} BDT
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. COURSE PURCHASE EARNING RULES */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
                    <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                                    Course Purchase Earning Rules
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Award points automatically when students purchase or enroll in paid courses.
                                </p>
                            </div>
                        </div>

                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input
                                type="checkbox"
                                checked={settings.purchase_points_enabled}
                                onChange={(e) => setSettings({ ...settings, purchase_points_enabled: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-sky-500"></div>
                        </label>
                    </div>

                    {settings.purchase_points_enabled && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Calculation Mode
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <label className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                                        settings.purchase_points_type === 'fixed'
                                            ? 'bg-sky-50/50 dark:bg-sky-950/30 border-sky-300 dark:border-sky-700'
                                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="purchase_points_type"
                                            value="fixed"
                                            checked={settings.purchase_points_type === 'fixed'}
                                            onChange={() => setSettings({ ...settings, purchase_points_type: 'fixed' })}
                                            className="mt-0.5 text-sky-600"
                                        />
                                        <div>
                                            <span className="font-extrabold text-xs text-slate-900 dark:text-white block">
                                                Fixed Points Per Course
                                            </span>
                                            <span className="text-[11px] text-slate-500 block mt-0.5">
                                                Award an identical set amount of points regardless of course price.
                                            </span>
                                        </div>
                                    </label>

                                    <label className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                                        settings.purchase_points_type === 'per_amount'
                                            ? 'bg-sky-50/50 dark:bg-sky-950/30 border-sky-300 dark:border-sky-700'
                                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="purchase_points_type"
                                            value="per_amount"
                                            checked={settings.purchase_points_type === 'per_amount'}
                                            onChange={() => setSettings({ ...settings, purchase_points_type: 'per_amount' })}
                                            className="mt-0.5 text-sky-600"
                                        />
                                        <div>
                                            <span className="font-extrabold text-xs text-slate-900 dark:text-white block">
                                                Proportional to Amount Spent
                                            </span>
                                            <span className="text-[11px] text-slate-500 block mt-0.5">
                                                Award points based on every 100 BDT spent on the purchase.
                                            </span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {settings.purchase_points_type === 'fixed' ? (
                                <div className="max-w-xs space-y-1">
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Points Per Course
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100000"
                                        value={settings.points_per_course}
                                        onChange={(e) => setSettings({ ...settings, points_per_course: parseInt(e.target.value, 10) || 0 })}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                                    />
                                </div>
                            ) : (
                                <div className="max-w-xs space-y-1">
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Points Per 100 BDT Spent
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100000"
                                        value={settings.points_per_100_currency}
                                        onChange={(e) => setSettings({ ...settings, points_per_100_currency: parseInt(e.target.value, 10) || 0 })}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Submit Action */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-sm rounded-2xl shadow-md shadow-amber-500/20 flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Saving Rules...</span>
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                <span>Save Point Rules</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};
