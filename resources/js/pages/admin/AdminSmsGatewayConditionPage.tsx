import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import {
    MessageSquareText,
    Activity,
    CreditCard,
    RefreshCw,
    ExternalLink,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Send,
    Loader2,
    ShieldCheck,
    Settings,
    ArrowUpRight,
    Smartphone,
    TrendingUp,
    HelpCircle
} from 'lucide-react';

interface GatewayConditionData {
    gateway: {
        provider: string;
        provider_name: string;
        api_endpoint: string;
        has_token: boolean;
        api_token_masked: string | null;
        sender_id: string;
        sms_enabled: boolean;
        otp_enabled: boolean;
        recharge_portal_url: string;
    };
    balance_info: {
        success: boolean;
        message: string;
        balance: string | number | null;
        raw_response: string | null;
    };
    statistics: {
        total_sent: number;
        today_sent: number;
        this_month_sent: number;
        successful_count: number;
        failed_count: number;
        success_rate: number;
    };
    recent_logs: Array<{
        id: number;
        phone: string;
        type: string;
        status: string;
        message: string;
        response_payload: any;
        created_at: string;
    }>;
}

export const AdminSmsGatewayConditionPage: React.FC = () => {
    const [data, setData] = useState<GatewayConditionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshingBalance, setRefreshingBalance] = useState(false);
    const [refreshSuccess, setRefreshSuccess] = useState(false);

    // Test SMS Tool
    const [testPhone, setTestPhone] = useState('');
    const [sendingTest, setSendingTest] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    useEffect(() => {
        fetchGatewayCondition();
    }, []);

    const fetchGatewayCondition = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get('/sms/gateway-condition');
            setData(res.data);
        } catch (err: any) {
            console.error('Failed to load SMS gateway condition:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRefreshBalance = async () => {
        try {
            setRefreshingBalance(true);
            setRefreshSuccess(false);
            const res = await apiClient.get('/sms/balance');
            if (data) {
                setData({
                    ...data,
                    balance_info: res.data
                });
            }
            setRefreshSuccess(true);
            setTimeout(() => setRefreshSuccess(false), 3000);
        } catch (err: any) {
            console.error('Failed to refresh balance:', err);
        } finally {
            setRefreshingBalance(false);
        }
    };

    const handleSendTestSms = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!testPhone.trim()) return;

        setSendingTest(true);
        setTestResult(null);

        try {
            const res = await apiClient.post('/sms-settings/test', {
                phone: testPhone.trim()
            });
            setTestResult({
                success: res.data.success,
                message: res.data.message || (res.data.success ? 'Test SMS sent successfully!' : 'Failed to send test SMS')
            });
            // Refresh logs
            fetchGatewayCondition();
        } catch (err: any) {
            setTestResult({
                success: false,
                message: err.response?.data?.message || err.message || 'Error occurred while sending test SMS.'
            });
        } finally {
            setSendingTest(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[450px] space-y-3">
                <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
                <p className="text-sm font-semibold text-slate-500">Checking GreenWeb SMS Gateway Condition...</p>
            </div>
        );
    }

    const balanceValue = data?.balance_info?.balance;
    const numericBalance = typeof balanceValue === 'number'
        ? balanceValue
        : typeof balanceValue === 'string' && !isNaN(Number(balanceValue))
            ? Number(balanceValue)
            : null;

    const isLowBalance = numericBalance !== null && numericBalance <= 100;
    const isCriticalBalance = numericBalance !== null && numericBalance <= 20;
    const isHealthy = Boolean(data?.gateway?.has_token && data?.balance_info?.success);

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-16">
            {/* Top Bar Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-sky-600 uppercase tracking-wider mb-1">
                        <Link to="/admin/sms" className="hover:underline">SMS Management</Link>
                        <span>/</span>
                        <span>Gateway Condition</span>
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                        <Activity className="w-6 h-6 text-sky-600" />
                        <span>SMS Gateway Condition & Balance</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Live GreenWeb gateway status, remaining SMS balance, diagnostics & instant recharge portal.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        type="button"
                        onClick={handleRefreshBalance}
                        disabled={refreshingBalance}
                        className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-xs flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
                        title="Fetch latest balance from GreenWeb"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${refreshingBalance ? 'animate-spin' : ''}`} />
                        <span>{refreshingBalance ? 'Updating...' : 'Refresh Balance'}</span>
                    </button>

                    <a
                        href={data?.gateway?.recharge_portal_url || 'https://greenweb.com.bd'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 transition cursor-pointer"
                    >
                        <CreditCard className="w-3.5 h-3.5 text-emerald-200" />
                        <span>Recharge on GreenWeb</span>
                        <ExternalLink className="w-3 h-3 text-emerald-200" />
                    </a>

                    <Link
                        to="/admin/sms"
                        className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                        title="Configure API Tokens & Sender ID"
                    >
                        <Settings className="w-3.5 h-3.5 text-slate-500" />
                        <span>Settings</span>
                    </Link>
                </div>
            </div>

            {/* Refresh Success Notification */}
            {refreshSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Balance refreshed successfully from GreenWeb API.</span>
                </div>
            )}

            {/* Warning Alert if Balance is Low */}
            {isLowBalance && (
                <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isCriticalBalance
                        ? 'bg-rose-50 border-rose-200 text-rose-900'
                        : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}>
                    <div className="flex items-start gap-3">
                        <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${isCriticalBalance ? 'text-rose-600' : 'text-amber-600'}`} />
                        <div>
                            <h4 className="text-xs font-black uppercase tracking-wider">
                                {isCriticalBalance ? 'Critical SMS Balance Alert' : 'Low SMS Balance Warning'}
                            </h4>
                            <p className="text-xs text-slate-700 mt-0.5">
                                Your GreenWeb account has only <span className="font-bold underline">{numericBalance} SMS</span> remaining. Please recharge your balance to prevent interruptions in student login OTPs, course purchase confirmations, and class notifications.
                            </p>
                        </div>
                    </div>
                    <a
                        href={data?.gateway?.recharge_portal_url || 'https://greenweb.com.bd'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`shrink-0 px-4 py-2 font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 transition ${
                            isCriticalBalance
                                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                : 'bg-amber-600 hover:bg-amber-700 text-white'
                        }`}
                    >
                        <span>Recharge Now</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                </div>
            )}

            {/* Token Missing Alert */}
            {!data?.gateway?.has_token && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-wider">GreenWeb API Token Missing</h4>
                        <p className="text-xs text-rose-700 mt-0.5">
                            You have not saved your GreenWeb API Token. Please go to <Link to="/admin/sms" className="underline font-bold">SMS Settings</Link> and enter your token to enable SMS sending and balance tracking.
                        </p>
                    </div>
                </div>
            )}

            {/* Top 3 Diagnostic Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 1. Live Balance Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live GreenWeb Balance</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1 ${
                                isCriticalBalance
                                    ? 'bg-rose-100 text-rose-800'
                                    : isLowBalance
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-emerald-100 text-emerald-800'
                            }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                    isCriticalBalance ? 'bg-rose-600' : isLowBalance ? 'bg-amber-600' : 'bg-emerald-600'
                                }`} />
                                {isCriticalBalance ? 'Critical' : isLowBalance ? 'Low' : 'Healthy'}
                            </span>
                        </div>

                        <div>
                            <div className="text-3xl font-black text-slate-900 tracking-tight">
                                {balanceValue !== null && balanceValue !== undefined ? (
                                    <>
                                        <span>{balanceValue}</span>
                                        <span className="text-sm font-semibold text-slate-500 ml-1.5">SMS</span>
                                    </>
                                ) : (
                                    <span className="text-slate-400 text-lg">Unable to fetch</span>
                                )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1">
                                {data?.balance_info?.message || 'Remaining credits in your GreenWeb SMS account.'}
                            </p>
                        </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] font-medium text-slate-400">
                            Raw: {data?.balance_info?.raw_response ? String(data.balance_info.raw_response).slice(0, 30) : 'None'}
                        </span>
                        <a
                            href={data?.gateway?.recharge_portal_url || 'https://greenweb.com.bd'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                        >
                            <span>Top-up Units</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                    </div>
                </div>

                {/* 2. Gateway Condition & Status Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gateway Status</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1 ${
                                isHealthy ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isHealthy ? 'bg-emerald-600 animate-pulse' : 'bg-rose-600'}`} />
                                {isHealthy ? 'Connected' : 'Offline / Check'}
                            </span>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500">Provider:</span>
                                <span className="font-bold text-slate-800">{data?.gateway?.provider_name}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500">Sender ID:</span>
                                <span className="font-bold text-slate-800 font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">
                                    {data?.gateway?.sender_id}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500">API Token:</span>
                                <span className="font-mono text-[11px] text-slate-600">
                                    {data?.gateway?.api_token_masked || 'Not Configured'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Service Switch:</span>
                        <span className={`font-bold ${data?.gateway?.sms_enabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {data?.gateway?.sms_enabled ? 'Active (Sending)' : 'Disabled'}
                        </span>
                    </div>
                </div>

                {/* 3. Delivery Performance Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Delivery Health</span>
                            <span className="text-xs font-bold text-sky-600 flex items-center gap-1">
                                <TrendingUp className="w-3.5 h-3.5" />
                                {data?.statistics?.success_rate}% Success
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-1">
                            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Sent Today</span>
                                <span className="text-lg font-black text-slate-900">{data?.statistics?.today_sent ?? 0}</span>
                            </div>
                            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">This Month</span>
                                <span className="text-lg font-black text-slate-900">{data?.statistics?.this_month_sent ?? 0}</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>Total Sent: <strong className="text-slate-800">{data?.statistics?.total_sent ?? 0}</strong></span>
                        <span className="text-rose-600">Failed: <strong>{data?.statistics?.failed_count ?? 0}</strong></span>
                    </div>
                </div>
            </div>

            {/* Recharge Instructions & Test SMS Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* GreenWeb Recharge Guide */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                                <CreditCard className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">How to Recharge GreenWeb Balance</h3>
                                <p className="text-xs text-slate-500">Fast bKash / Nagad / Online top-up guide</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 text-xs text-slate-600">
                        <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                            <div>
                                <strong className="text-slate-800">Log into GreenWeb User Panel:</strong>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    Click the button below to open <span className="font-mono text-sky-600">greenweb.com.bd</span> or <span className="font-mono text-sky-600">bdbulksms.com</span> and sign in with your phone & password.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                            <div>
                                <strong className="text-slate-800">Select SMS Bundle & Pay:</strong>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    Go to "Add Fund" or "Buy SMS", choose your slab (Non-masking or Masking), and complete payment via instant bKash / Nagad payment gateway.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                            <div>
                                <strong className="text-slate-800">Instant Activation & Sync:</strong>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    Once payment completes, the SMS balance is immediately added to your API token. Return to this page and click <span className="font-bold text-sky-600">Refresh Balance</span> above to view your updated credit.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 flex flex-wrap items-center gap-3">
                        <a
                            href={data?.gateway?.recharge_portal_url || 'https://greenweb.com.bd'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-2 transition"
                        >
                            <span>Open GreenWeb Portal</span>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                        </a>
                        <span className="text-[11px] text-slate-400">
                            Recharged credits rollover automatically if top-up is made before expiry.
                        </span>
                    </div>
                </div>

                {/* Live Test SMS Tool */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold shrink-0">
                                <Send className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">Live Gateway Test</h3>
                                <p className="text-xs text-slate-500">Send an instant test message to verify delivery</p>
                            </div>
                        </div>

                        <form onSubmit={handleSendTestSms} className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Recipient Phone Number
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="017XXXXXXXX or +8801XXXXXXXXX"
                                        value={testPhone}
                                        onChange={(e) => setTestPhone(e.target.value)}
                                        disabled={sendingTest}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                                    />
                                </div>
                                <p className="text-[11px] text-slate-400 mt-1">
                                    A quick verification SMS will be sent via GreenWeb gateway to test live API responsiveness.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={sendingTest || !testPhone.trim()}
                                className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                            >
                                {sendingTest ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span>Dispatching Test SMS...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-3.5 h-3.5" />
                                        <span>Send Test SMS Now</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {testResult && (
                        <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                            testResult.success
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : 'bg-rose-50 border-rose-200 text-rose-800'
                        }`}>
                            {testResult.success ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            ) : (
                                <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            )}
                            <div>
                                <span className="font-bold block">
                                    {testResult.success ? 'Success!' : 'Failed!'}
                                </span>
                                <span className="text-[11px]">{testResult.message}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Recent SMS Delivery Logs */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                            <Smartphone className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">Recent Gateway Delivery Logs</h3>
                            <p className="text-xs text-slate-500">Real-time status of outgoing SMS dispatches</p>
                        </div>
                    </div>

                    <Link
                        to="/admin/sms/auto-push"
                        className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 self-start sm:self-auto"
                    >
                        <span>Manage Auto SMS Push</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                <th className="py-3 px-4">Date & Time</th>
                                <th className="py-3 px-4">Recipient</th>
                                <th className="py-3 px-4">Category</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4">Message Snippet</th>
                                <th className="py-3 px-4">Gateway Response</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data?.recent_logs && data.recent_logs.length > 0 ? (
                                data.recent_logs.map((log) => {
                                    const isSent = log.status === 'sent';
                                    return (
                                        <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                                                {new Date(log.created_at).toLocaleString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </td>
                                            <td className="py-3 px-4 font-mono font-bold text-slate-800">
                                                {log.phone}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700">
                                                    {log.type}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                    isSent
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : 'bg-rose-100 text-rose-800'
                                                }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${isSent ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                                                    {isSent ? 'Sent' : 'Failed'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 max-w-xs truncate text-slate-600" title={log.message}>
                                                {log.message}
                                            </td>
                                            <td className="py-3 px-4 font-mono text-[11px] text-slate-500 max-w-[150px] truncate">
                                                {typeof log.response_payload === 'string'
                                                    ? log.response_payload
                                                    : log.response_payload
                                                        ? JSON.stringify(log.response_payload)
                                                        : '-'}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-slate-400">
                                        No recent SMS logs found. Use the Live Test tool above to send a verification message.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};