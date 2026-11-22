import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link, useSearchParams } from 'react-router-dom';
import {
    CheckCircle2,
    Clock,
    BookOpen,
    Home,
    XCircle,
    AlertTriangle,
    ArrowRight,
    Copy,
    Check,
    ShoppingBag,
    Sparkles,
    ShieldCheck,
    CreditCard,
    ExternalLink,
    Loader2
} from 'lucide-react';
import { apiClient, formatBDT, getImageUrl } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

export const OrderStatusPage: React.FC = () => {
    const { orderNumber } = useParams<{ orderNumber: string }>();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();

    const [order, setOrder] = useState<any>(location.state?.order || null);
    const [loading, setLoading] = useState<boolean>(!location.state?.order);
    const [copiedOrderNumber, setCopiedOrderNumber] = useState(false);

    const queryStatus = searchParams.get('status');
    const trxId = searchParams.get('trx_id') || order?.latest_payment?.transaction_ref || order?.transaction_ref;
    const message = searchParams.get('message');

    useEffect(() => {
        if (!order && orderNumber) {
            fetchOrderDetails(orderNumber);
        }
    }, [orderNumber]);

    const fetchOrderDetails = async (num: string) => {
        setLoading(true);
        try {
            const { data } = await apiClient.get(`/orders/status/${num}`);
            if (data?.order) {
                setOrder(data.order);
            }
        } catch (err) {
            console.error('Failed to load order receipt', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyOrderNumber = () => {
        const text = orderNumber || order?.order_number;
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedOrderNumber(true);
        setTimeout(() => setCopiedOrderNumber(false), 2500);
    };

    // Determine Status
    const isPaymentPaid = order?.payment_status === 'paid' || queryStatus === 'success';
    const isFailed = order?.payment_status === 'failed' || queryStatus === 'failed';
    const isCancelled = order?.payment_status === 'cancelled' || order?.order_status === 'cancelled' || queryStatus === 'cancelled';
    const isPending = !isPaymentPaid && !isFailed && !isCancelled;

    // Gather courses in the order
    const orderedCourses: any[] = [];
    if (order?.items && order.items.length > 0) {
        order.items.forEach((item: any) => {
            if (item.course) {
                orderedCourses.push({
                    ...item.course,
                    itemPrice: item.price,
                });
            }
        });
    } else if (order?.course) {
        orderedCourses.push({
            ...order.course,
            itemPrice: order.final_amount,
        });
    }

    const firstCourseSlug = orderedCourses[0]?.slug;

    return (
        <div className="min-h-[80vh] py-12 sm:py-16 px-4 bg-slate-50/50 dark:bg-slate-950 flex flex-col justify-center animate-fadeIn">
            <div className="max-w-2xl mx-auto w-full space-y-6">

                {/* CELEBRATORY THANK YOU BANNER */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs text-center space-y-4 relative overflow-hidden">
                    {/* Top background accent glow */}
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-400 via-sky-500 to-indigo-500" />

                    {/* Status Icon */}
                    {isPaymentPaid ? (
                        <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border-4 border-emerald-100 dark:border-emerald-900/60 shadow-lg shadow-emerald-500/10">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                    ) : isFailed ? (
                        <div className="w-20 h-20 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border-4 border-rose-100 dark:border-rose-900/60 shadow-lg shadow-rose-500/10">
                            <XCircle className="w-10 h-10" />
                        </div>
                    ) : isCancelled ? (
                        <div className="w-20 h-20 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border-4 border-amber-100 dark:border-amber-900/60 shadow-lg shadow-amber-500/10">
                            <AlertTriangle className="w-10 h-10" />
                        </div>
                    ) : (
                        <div className="w-20 h-20 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border-4 border-amber-100 dark:border-amber-900/60 shadow-xs">
                            <Clock className="w-10 h-10 animate-pulse" />
                        </div>
                    )}

                    {/* Thank You & Heading */}
                    <div className="space-y-2">
                        {/* Prominent Thank You Badge */}
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-black uppercase tracking-wider">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Thank You!</span>
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                            {isPaymentPaid
                                ? 'Thank You For Your Order!'
                                : isFailed
                                ? 'Payment Verification Failed'
                                : isCancelled
                                ? 'Order Payment Cancelled'
                                : 'Thank You! Your Order has been Placed'}
                        </h1>

                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
                            {isPaymentPaid
                                ? 'Your payment has been successfully confirmed. Course access and enrollment are now active and ready for you!'
                                : isFailed
                                ? (message ? decodeURIComponent(message) : 'There was an issue processing your payment transaction. Please try again or contact support.')
                                : isCancelled
                                ? 'You have cancelled the payment process. You can retry anytime from checkout or your cart.'
                                : 'We have received your order details. Our team is verifying your payment. Once approved, your course access will unlock automatically.'}
                        </p>
                    </div>

                    {/* PROMINENT ORDER NUMBER BADGE */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-md mx-auto flex items-center justify-between gap-3">
                        <div className="text-left min-w-0">
                            <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                                Order Number
                            </span>
                            <span className="font-mono text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-wide truncate block">
                                {orderNumber || order?.order_number || 'Processing...'}
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={handleCopyOrderNumber}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs ${
                                copiedOrderNumber
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-white dark:bg-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600'
                            }`}
                            title="Copy Order Number"
                        >
                            {copiedOrderNumber ? (
                                <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Copied!</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copy ID</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* ORDER DETAILS & BILLING SUMMARY */}
                {loading ? (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-[#A60201]" />
                        <span>Loading order summary...</span>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                                <ShoppingBag className="w-4 h-4 text-[#A60201]" />
                                <span>Order Summary & Items</span>
                            </h3>

                            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                                isPaymentPaid
                                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                                    : isFailed
                                    ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300'
                                    : isCancelled
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300'
                                    : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 animate-pulse'
                            }`}>
                                {isPaymentPaid
                                    ? 'Paid & Enrolled'
                                    : isFailed
                                    ? 'Payment Failed'
                                    : isCancelled
                                    ? 'Cancelled'
                                    : 'Verification Pending'}
                            </span>
                        </div>

                        {/* Ordered Courses List */}
                        {orderedCourses.length > 0 && (
                            <div className="space-y-3">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                                    Enrolled Course(s) ({orderedCourses.length}):
                                </span>
                                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/60 dark:border-slate-800 rounded-2xl overflow-hidden">
                                    {orderedCourses.map((c, idx) => (
                                        <div key={idx} className="p-3.5 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                                                    {c.thumbnail ? (
                                                        <img
                                                            src={getImageUrl(c.thumbnail)}
                                                            alt={c.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                            <BookOpen className="w-5 h-5" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                                                        {c.title}
                                                    </h4>
                                                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block">
                                                        Limited Access Included
                                                    </span>
                                                </div>
                                            </div>

                                            <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white shrink-0">
                                                {formatBDT(c.itemPrice ?? c.price ?? 0)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Payment & Billing Breakdown */}
                        <div className="space-y-2.5 pt-2 text-xs">
                            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                                <span>Order Date & Time:</span>
                                <span className="font-bold text-slate-700 dark:text-slate-300">
                                    {order?.created_at ? new Date(order.created_at).toLocaleString() : new Date().toLocaleString()}
                                </span>
                            </div>

                            {order?.original_price > order?.final_amount && (
                                <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                                    <span>Regular Price:</span>
                                    <span className="line-through">{formatBDT(order.original_price)}</span>
                                </div>
                            )}

                            {order?.discount_amount > 0 && (
                                <div className="flex justify-between items-center font-semibold text-emerald-600 dark:text-emerald-400">
                                    <span>Total Discount:</span>
                                    <span>-{formatBDT(order.discount_amount)}</span>
                                </div>
                            )}

                            {order?.points_redeemed > 0 && (
                                <div className="flex justify-between items-center font-semibold text-amber-600 dark:text-amber-400">
                                    <span>Reward Points Redeemed ({order.points_redeemed} 💎):</span>
                                    <span>-{formatBDT(order.points_discount || 0)}</span>
                                </div>
                            )}

                            {order?.payment_method && (
                                <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                                    <span>Payment Method:</span>
                                    <span className="font-bold uppercase text-slate-700 dark:text-slate-300">
                                        {order.payment_method}
                                    </span>
                                </div>
                            )}

                            {trxId && (
                                <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                                    <span>Transaction ID / Ref:</span>
                                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                        {trxId}
                                    </span>
                                </div>
                            )}

                            <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
                                <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                                    Total Amount:
                                </span>
                                <span className="text-xl font-black text-[#A60201]">
                                    {formatBDT(order?.final_amount || 0)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ACTION BUTTONS & NEXT STEPS */}
                <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        {isPaymentPaid && firstCourseSlug ? (
                            <Link
                                to={`/learning/${order?.course_id || orderedCourses[0]?.id}`}
                                className="w-full sm:w-auto flex-1 py-3.5 px-6 bg-[#A60201] hover:bg-[#880101] text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-[#A60201]/25 flex items-center justify-center gap-2 transition cursor-pointer"
                            >
                                <BookOpen className="w-4 h-4" />
                                <span>Start Learning Course</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        ) : (
                            <Link
                                to="/student/my-courses"
                                className="w-full sm:w-auto flex-1 py-3.5 px-6 bg-[#A60201] hover:bg-[#880101] text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-[#A60201]/25 flex items-center justify-center gap-2 transition cursor-pointer"
                            >
                                <BookOpen className="w-4 h-4" />
                                <span>Go to My Courses</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        )}

                        <Link
                            to="/student/orders"
                            className="w-full sm:w-auto py-3.5 px-6 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 transition cursor-pointer"
                        >
                            <ShoppingBag className="w-4 h-4" />
                            <span>View All Orders</span>
                        </Link>

                        <Link
                            to="/"
                            className="w-full sm:w-auto py-3.5 px-6 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 transition cursor-pointer"
                        >
                            <Home className="w-4 h-4" />
                            <span>Home</span>
                        </Link>
                    </div>

                    {/* Support Reassurance Footer */}
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-400 text-center pt-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>A confirmation has been recorded in your account dashboard. Need help? Contact Support.</span>
                    </div>
                </div>

            </div>
        </div>
    );
};
