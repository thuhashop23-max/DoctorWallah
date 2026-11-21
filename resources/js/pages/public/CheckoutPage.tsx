import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';
import { apiClient, formatBDT } from '../../api/client';
import { Course, ManualPaymentSettings, ManualPaymentType } from '../../types';
import { 
    CreditCard, 
    ShieldCheck, 
    AlertCircle, 
    ArrowRight, 
    BookOpen, 
    CheckCircle2,
    Copy,
    Check,
    Sparkles,
    Bot,
    Tag,
    TicketPercent,
    X,
    Loader2,
    Zap,
    ShoppingCart,
    Gem
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { PagePreloader } from '../../components/shared/PagePreloader';
import { getStoredReferralCode, setStoredReferralCode, clearStoredReferralCode } from '../../utils/referralTracker';

const DEFAULT_MANUAL_SETTINGS: ManualPaymentSettings = {
    bkash: {
        enabled: true,
        name: 'bKash',
        account_number: '01700000000',
        type: 'send_money',
        instructions: 'Open your bKash app or dial *247# to Send Money to the recipient number. Enter the TrxID below after payment.',
        instructions_en: 'Open your bKash app or dial *247# to Send Money to the recipient number. Enter the TrxID below after payment.',
    },
    nagad: {
        enabled: true,
        name: 'Nagad',
        account_number: '01700000000',
        type: 'send_money',
        instructions: 'Open your Nagad app or dial *167# to Send Money to the recipient number. Enter the TrxID below after payment.',
        instructions_en: 'Open your Nagad app or dial *167# to Send Money to the recipient number. Enter the TrxID below after payment.',
    },
    rocket: {
        enabled: true,
        name: 'Rocket',
        account_number: '01700000000',
        type: 'send_money',
        instructions: 'Open your Rocket app or dial *322# to Send Money to the recipient number. Enter the TrxID below after payment.',
        instructions_en: 'Open your Rocket app or dial *322# to Send Money to the recipient number. Enter the TrxID below after payment.',
    },
};

export const CheckoutPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { language } = useLanguage();
    const { settings } = useSettings();
    const { items: cartItems, clearCart, subtotal: cartSubtotal, totalOriginalPrice: cartOriginalPrice, dynamicOfferDiscount, appliedOffer, appliedCoupon: cartAppliedCoupon, removeCoupon: removeCartCoupon } = useCart();
    const isCartMode = !slug;

    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [includeNexPilot, setIncludeNexPilot] = useState(true);
    const isShurjopayAllowed = settings?.shurjopay_settings ? settings.shurjopay_settings.enabled : true;

    const [paymentMethod, setPaymentMethod] = useState<'shurjopay' | 'manual_bkash' | 'manual_nagad' | 'manual_rocket'>('shurjopay');
    const [transactionRef, setTransactionRef] = useState('');
    const [senderPhone, setSenderPhone] = useState(user?.phone || '');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Referral / Affiliate state
    const [referralInput, setReferralInput] = useState('');
    const [appliedReferral, setAppliedReferral] = useState<{
        code: string;
        discount_amount: number;
        discount_rate: number;
        discount_type: string;
        message: string;
    } | null>(null);
    const [checkingReferral, setCheckingReferral] = useState(false);
    const [referralMessage, setReferralMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Coupon state
    const [couponInput, setCouponInput] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<{
        coupon_id: number;
        code: string;
        title: string;
        discount_type: string;
        discount_amount: number;
        calculated_discount: number;
        final_price: number;
        message: string;
    } | null>(null);
    const [checkingCoupon, setCheckingCoupon] = useState(false);
    const [couponMessage, setCouponMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Merge settings from context or fallback to defaults
    const manualSettings: ManualPaymentSettings = {
        bkash: { ...DEFAULT_MANUAL_SETTINGS.bkash, ...(settings?.manual_payment_settings?.bkash || {}) },
        nagad: { ...DEFAULT_MANUAL_SETTINGS.nagad, ...(settings?.manual_payment_settings?.nagad || {}) },
        rocket: { ...DEFAULT_MANUAL_SETTINGS.rocket, ...(settings?.manual_payment_settings?.rocket || {}) },
    };

    const availableGateways = [
        {
            id: 'manual_bkash' as const,
            key: 'bkash' as const,
            config: manualSettings.bkash,
            colorClass: 'border-pink-500 bg-pink-50/50 text-pink-600',
            inactiveClass: 'hover:border-pink-300',
            textColor: 'text-pink-600',
            title: 'bKash',
        },
        {
            id: 'manual_nagad' as const,
            key: 'nagad' as const,
            config: manualSettings.nagad,
            colorClass: 'border-orange-500 bg-orange-50/50 text-orange-600',
            inactiveClass: 'hover:border-orange-300',
            textColor: 'text-orange-600',
            title: 'Nagad',
        },
        {
            id: 'manual_rocket' as const,
            key: 'rocket' as const,
            config: manualSettings.rocket,
            colorClass: 'border-purple-500 bg-purple-50/50 text-purple-600',
            inactiveClass: 'hover:border-purple-300',
            textColor: 'text-purple-600',
            title: 'Rocket',
        },
    ].filter(gw => gw.config?.enabled !== false);

    // Automatically select gateway based on availability
    useEffect(() => {
        if (paymentMethod === 'shurjopay' && !isShurjopayAllowed && availableGateways.length > 0) {
            setPaymentMethod(availableGateways[0].id);
        } else if (paymentMethod !== 'shurjopay' && !availableGateways.some(gw => gw.id === paymentMethod)) {
            if (isShurjopayAllowed) {
                setPaymentMethod('shurjopay');
            } else if (availableGateways.length > 0) {
                setPaymentMethod(availableGateways[0].id);
            }
        }
    }, [isShurjopayAllowed, availableGateways, paymentMethod]);

    useEffect(() => {
        if (!user) {
            navigate(slug ? `/login?redirect=/checkout/${slug}` : '/login?redirect=/checkout');
            return;
        }

        if (slug) {
            const fetchCourse = async () => {
                try {
                    const { data } = await apiClient.get(`/courses/${slug}`);
                    if (data.is_enrolled) {
                        navigate('/student/my-courses');
                        return;
                    }
                    setCourse(data.course);
                    const couponFromUrl = searchParams.get('coupon');
                    if (couponFromUrl && data.course?.id) {
                        setCouponInput(couponFromUrl.toUpperCase());
                        validateCouponCode(couponFromUrl.toUpperCase(), data.course.id);
                    }
                } catch {
                    navigate('/courses');
                } finally {
                    setLoading(false);
                }
            };
            fetchCourse();
        } else {
            // Cart checkout mode
            if (cartItems.length === 0) {
                navigate('/cart');
                return;
            }
            setLoading(false);
            const couponFromUrl = searchParams.get('coupon');
            if (couponFromUrl && cartItems[0]?.id) {
                setCouponInput(couponFromUrl.toUpperCase());
                validateCouponCode(couponFromUrl.toUpperCase(), cartItems[0].id);
            }
        }
    }, [slug, user, cartItems.length]);

    const activeGateway = availableGateways.find(gw => gw.id === paymentMethod) || availableGateways[0];
    const currentNumber = activeGateway?.config?.account_number || '01700000000';
    const currentType: ManualPaymentType = activeGateway?.config?.type || 'send_money';

    const nexpilot = course?.nexpilot;
    const hasActivePilot = Boolean(nexpilot && (nexpilot.is_active === true || nexpilot.is_active === 1 || nexpilot.is_active === '1'));
    const pilotPrice = hasActivePilot && includeNexPilot ? Number(nexpilot.price || 0) : 0;

    const courseBasePrice = isCartMode
        ? cartSubtotal
        : (course
            ? (course.sale_price !== null && course.sale_price !== undefined && Number(course.sale_price) < Number(course.price)
                ? Number(course.sale_price)
                : Number(course.effective_price ?? course.price ?? 0))
            : 0);

    const originalRegularPrice = isCartMode
        ? cartOriginalPrice
        : (course ? Number(course.price || 0) : 0);

    const referralDiscount = appliedReferral ? Math.floor(Number(appliedReferral.discount_amount || 0)) : 0;
    const couponDiscount = appliedCoupon ? Math.floor(Number(appliedCoupon.calculated_discount || 0)) : 0;
    const dynamicDiscount = isCartMode ? Math.floor(dynamicOfferDiscount || 0) : 0;

    // Points redemption
    const isPointsActive = (settings as any)?.point_settings?.is_active !== false && (settings as any)?.point_settings?.redemption_enabled !== false;
    const redemptionPointsRate = (settings as any)?.point_settings?.redemption_points || 10;
    const redemptionAmountRate = (settings as any)?.point_settings?.redemption_amount || 1.0;
    const maxRedeemPercent = (settings as any)?.point_settings?.max_redemption_percentage || 50;

    const [usePoints, setUsePoints] = useState(false);
    const [pointsRedeemedCount, setPointsRedeemedCount] = useState<number>(0);

    const userPoints = user?.points || 0;
    const baseBeforePoints = Math.max(0, courseBasePrice + pilotPrice - referralDiscount - couponDiscount - dynamicDiscount);
    const maxPointsDiscountAllowed = Math.floor((baseBeforePoints * maxRedeemPercent) / 100);
    const maxPointsUsable = Math.max(0, Math.min(userPoints, Math.ceil((maxPointsDiscountAllowed / redemptionAmountRate) * redemptionPointsRate)));

    const activePointsToRedeem = usePoints ? Math.min(userPoints, pointsRedeemedCount > 0 ? pointsRedeemedCount : maxPointsUsable) : 0;
    const pointsDiscount = usePoints && activePointsToRedeem > 0
        ? Math.floor(Math.min(baseBeforePoints, Math.min(maxPointsDiscountAllowed, (activePointsToRedeem / redemptionPointsRate) * redemptionAmountRate)))
        : 0;

    const totalPayable = Math.floor(Math.max(0, baseBeforePoints - pointsDiscount));

    // Auto sync coupon from cart if present
    useEffect(() => {
        if (isCartMode && cartAppliedCoupon && !appliedCoupon) {
            setAppliedCoupon({
                coupon_id: cartAppliedCoupon.coupon_id,
                code: cartAppliedCoupon.code,
                title: cartAppliedCoupon.title,
                discount_type: cartAppliedCoupon.discount_type,
                discount_amount: cartAppliedCoupon.discount_amount,
                calculated_discount: cartAppliedCoupon.calculated_discount,
                final_price: cartAppliedCoupon.final_price,
                message: cartAppliedCoupon.message || 'Coupon applied from cart!',
            });
            setCouponInput(cartAppliedCoupon.code);
            setCouponMessage({ type: 'success', text: cartAppliedCoupon.message || 'Coupon applied from cart!' });
        }
    }, [isCartMode, cartAppliedCoupon]);

    const validateCouponCode = async (codeToVerify: string, courseId?: number) => {
        if (!codeToVerify || !codeToVerify.trim()) return;
        try {
            setCheckingCoupon(true);
            setCouponMessage(null);
            const payload: any = {
                code: codeToVerify.trim().toUpperCase(),
            };
            if (isCartMode) {
                payload.course_ids = cartItems.map((i) => i.id);
            } else if (courseId) {
                payload.course_id = courseId;
            }
            const res = await apiClient.post('/coupons/validate', payload);

            if (res.data.valid) {
                setAppliedCoupon(res.data);
                setCouponMessage({ type: 'success', text: res.data.message || 'Coupon applied successfully!' });
            } else {
                setCouponMessage({ type: 'error', text: res.data.message || 'Invalid coupon.' });
            }
        } catch (err: any) {
            setCouponMessage({ type: 'error', text: err.response?.data?.message || 'Invalid coupon code.' });
        } finally {
            setCheckingCoupon(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponInput('');
        setCouponMessage(null);
        if (isCartMode) {
            removeCartCoupon();
        }
    };

    const validateReferralCode = async (codeToVerify: string, courseId: number) => {
        if (!codeToVerify || !codeToVerify.trim()) return;
        try {
            setCheckingReferral(true);
            setReferralMessage(null);
            const { data } = await apiClient.get(`/affiliate/check-code/${encodeURIComponent(codeToVerify.trim())}`, {
                params: { course_id: courseId }
            });

            if (data.valid) {
                setAppliedReferral({
                    code: data.code,
                    discount_amount: Number(data.discount_amount || 0),
                    discount_rate: Number(data.discount_rate || 0),
                    discount_type: data.discount_type || 'percentage',
                    message: data.message,
                });
                setStoredReferralCode(data.code, data.cookie_days || 30);
                setReferralMessage({ type: 'success', text: data.message });
            } else {
                setReferralMessage({ type: 'error', text: data.message || 'Referral code is invalid or expired.' });
            }
        } catch (err: any) {
            setReferralMessage({ type: 'error', text: err.response?.data?.message || 'Invalid referral code.' });
        } finally {
            setCheckingReferral(false);
        }
    };

    useEffect(() => {
        const targetCourseId = course?.id || (isCartMode && cartItems[0]?.id);
        if (targetCourseId) {
            const stored = getStoredReferralCode();
            if (stored && !appliedReferral) {
                setReferralInput(stored);
                validateReferralCode(stored, targetCourseId);
            }
        }
    }, [course, isCartMode, cartItems]);

    const handleRemoveReferral = () => {
        setAppliedReferral(null);
        setReferralInput('');
        setReferralMessage(null);
        clearStoredReferralCode();
    };

    const getMethodTypeLabel = (type: ManualPaymentType) => {
        if (type === 'payment') {
            return 'Payment';
        }
        if (type === 'cash_out') {
            return 'Cash Out';
        }
        return 'Send Money';
    };

    const getAccountTypeBadge = (type: ManualPaymentType) => {
        if (type === 'payment') {
            return 'Merchant';
        }
        if (type === 'cash_out') {
            return 'Agent';
        }
        return 'Personal';
    };

    const handleCopyNumber = () => {
        navigator.clipboard.writeText(currentNumber);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSubmitOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!course && !isCartMode) return;
        if (isCartMode && cartItems.length === 0) return;

        setError(null);
        setSubmitting(true);

        try {
            const payload: any = {
                payment_method: totalPayable <= 0 ? 'free' : paymentMethod,
                transaction_ref: totalPayable <= 0 ? undefined : transactionRef,
                sender_phone: totalPayable <= 0 ? undefined : senderPhone,
                notes,
                include_nexpilot: hasActivePilot && includeNexPilot,
                affiliate_code: appliedReferral?.code || (referralInput.trim() ? referralInput.trim() : undefined),
                coupon_code: appliedCoupon?.code || (couponInput.trim() ? couponInput.trim() : undefined),
                dynamic_offer_id: appliedOffer?.offer_id || undefined,
                points_to_redeem: usePoints && activePointsToRedeem > 0 ? activePointsToRedeem : undefined,
            };

            if (isCartMode) {
                payload.course_ids = cartItems.map((i) => i.id);
                payload.course_id = cartItems[0]?.id;
            } else if (course) {
                payload.course_id = course.id;
                payload.course_ids = [course.id];
            }

            const { data } = await apiClient.post('/orders/checkout', payload);

            if (isCartMode) {
                clearCart();
            }

            const targetOrderNumber = data.order?.order_number || data.order_number || 'processing';

            if (data.is_free) {
                navigate(`/order-status/${targetOrderNumber}?status=success`, {
                    replace: true,
                    state: { order: data.order, message: data.message }
                });
                return;
            }

            navigate(`/order-status/${targetOrderNumber}`, { state: { order: data.order } });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to process order.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleShurjopayCheckout = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!course && !isCartMode) return;
        if (isCartMode && cartItems.length === 0) return;

        setError(null);
        setSubmitting(true);

        try {
            const payload: any = {
                notes,
                include_nexpilot: hasActivePilot && includeNexPilot,
                affiliate_code: appliedReferral?.code || (referralInput.trim() ? referralInput.trim() : undefined),
                coupon_code: appliedCoupon?.code || (couponInput.trim() ? couponInput.trim() : undefined),
                dynamic_offer_id: appliedOffer?.offer_id || undefined,
                points_to_redeem: usePoints && activePointsToRedeem > 0 ? activePointsToRedeem : undefined,
            };

            if (isCartMode) {
                payload.course_ids = cartItems.map((i) => i.id);
                payload.course_id = cartItems[0]?.id;
            } else if (course) {
                payload.course_id = course.id;
                payload.course_ids = [course.id];
            }

            const { data } = await apiClient.post('/orders/shurjopay/checkout', payload);

            if (isCartMode) {
                clearCart();
            }

            if (data.is_free) {
                navigate(data.redirect_url || `/order-status/${data.order_number}?status=success`, {
                    replace: true,
                    state: { order: data.order, message: data.message }
                });
                return;
            }

            if (data.checkout_url) {
                window.location.href = data.checkout_url;
            } else {
                setError('shurjoPay checkout URL could not be generated. Please try again.');
                setSubmitting(false);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to initialize payment gateway.');
            setSubmitting(false);
        }
    };

    if (loading || (!course && !isCartMode) || (isCartMode && cartItems.length === 0)) {
        return (
            <PagePreloader
                title="Loading checkout..."
                subtitle="Verifying course enrollment details"
            />
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    Checkout & Payment
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    Submit payment details to confirm your course enrollment
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Payment Method & Trx ID form */}
                <div className="lg:col-span-7 space-y-6">
                    {/* Payment Provider Selection */}
                    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                        {totalPayable <= 0 ? (
                            <div className="space-y-5">
                                <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/60 to-sky-50 border-2 border-emerald-400 shadow-xs space-y-3">
                                    <div className="flex items-start gap-3.5">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center font-black shadow-md shadow-emerald-500/20 shrink-0">
                                            <Sparkles className="w-6 h-6 animate-pulse" />
                                        </div>
                                        <div>
                                            <span className="inline-block text-[11px] font-black uppercase tracking-wider bg-emerald-200 text-emerald-900 px-2.5 py-0.5 rounded-full mb-1">
                                                100% Discount Active
                                            </span>
                                            <h3 className="text-lg font-black text-slate-900 tracking-tight">
                                                Enroll Completely Free
                                            </h3>
                                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                                Your discount or coupon code has been applied successfully. No payment required. Click below to enroll immediately.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Additional Notes (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Write any special notes or references here"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                                    />
                                </div>

                                {error && (
                                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={handleShurjopayCheckout}
                                    disabled={submitting}
                                    className="w-full py-4 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-base rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Completing enrollment...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-5 h-5" />
                                            <span>Enroll Completely Free (Tk 0)</span>
                                            <ArrowRight className="w-5 h-5 ml-1" />
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <>
                                <h3 className="text-lg font-bold text-slate-900">
                                    Select Payment Method
                                </h3>

                                {/* shurjoPay Online Payment Option */}
                                {isShurjopayAllowed && (
                                    <div className="space-y-2">
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod('shurjopay')}
                                            className={`w-full p-4.5 rounded-2xl border-2 text-left transition-all cursor-pointer relative overflow-hidden ${
                                                paymentMethod === 'shurjopay'
                                                    ? 'border-sky-500 bg-sky-50/70 text-sky-950 shadow-xs ring-2 ring-sky-500/20'
                                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                                            }`}
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 to-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-sky-500/20">
                                                        <Zap className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-extrabold text-base text-slate-900">
                                                                Online Payment
                                                            </span>
                                                            <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full shadow-2xs">
                                                                Instant Gateway
                                                            </span>
                                                        </div>
                                                        <span className="text-xs text-slate-500 font-medium block mt-0.5">
                                                            Pay instantly with bKash, Nagad, Rocket, Cards, or Net Banking
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-1.5 shrink-0 self-start sm:self-center">
                                                    <span className="px-3 py-1 bg-pink-50 border border-pink-200 rounded-lg text-[11px] font-bold text-pink-600 text-center shadow-2xs">
                                                        bKash
                                                    </span>
                                                    <span className="px-3 py-1 bg-orange-50 border border-orange-200 rounded-lg text-[11px] font-bold text-orange-600 text-center shadow-2xs">
                                                        Nagad
                                                    </span>
                                                    <span className="px-3 py-1 bg-purple-50 border border-purple-200 rounded-lg text-[11px] font-bold text-purple-600 text-center shadow-2xs">
                                                        Rocket
                                                    </span>
                                                    <span className="px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg text-[11px] font-bold text-blue-600 text-center shadow-2xs">
                                                        Cards
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                )}

                                {/* Manual Payment Section */}
                                {availableGateways.length > 0 && (
                                    <div className="space-y-3 pt-2">
                                        {isShurjopayAllowed && (
                                            <div className="flex items-center gap-3">
                                                <div className="h-px bg-slate-200 flex-1"></div>
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                    Or Manual Send Money (TrxID)
                                                </span>
                                                <div className="h-px bg-slate-200 flex-1"></div>
                                            </div>
                                        )}
                                        <div className={`grid grid-cols-${Math.min(availableGateways.length, 3)} gap-3`}>
                                            {availableGateways.map(gw => {
                                                const isSelected = paymentMethod === gw.id;
                                                return (
                                                    <button
                                                        key={gw.id}
                                                        type="button"
                                                        onClick={() => setPaymentMethod(gw.id)}
                                                        className={`p-3.5 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                                                            isSelected
                                                                ? `${gw.colorClass} shadow-xs ring-2 ring-slate-400/20`
                                                                : `border-slate-200 hover:border-slate-300 ${gw.inactiveClass}`
                                                        }`}
                                                    >
                                                        <span className={`block font-black text-sm ${gw.textColor}`}>{gw.title}</span>
                                                        <span className="text-[11px] text-slate-500 font-semibold block truncate">
                                                            {gw.title} {getMethodTypeLabel(gw.config?.type || 'send_money')}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {!isShurjopayAllowed && availableGateways.length === 0 && (
                                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                                        <span>No payment methods are currently active for this course. Please contact support.</span>
                                    </div>
                                )}

                                {error && (
                                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                {/* Conditional Form: shurjoPay VS Manual */}
                                {paymentMethod === 'shurjopay' ? (
                                    <div className="space-y-4 pt-1">
                                        <div className="p-3.5 rounded-2xl bg-sky-50/80 border border-sky-100 text-xs text-slate-700 flex items-center gap-2.5">
                                            <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
                                            <span>
                                                Pay securely with bKash, Nagad, Rocket, or Cards via shurjoPay. Course access will unlock automatically.
                                            </span>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                Additional Notes (Optional)
                                            </label>
                                            <input
                                                type="text"
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                placeholder="Any special note or reference"
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
                                            />
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleShurjopayCheckout}
                                            disabled={submitting}
                                            className="w-full py-4 bg-gradient-to-r from-sky-500 via-sky-600 to-sky-700 hover:from-sky-600 hover:to-sky-800 text-white font-black text-base rounded-2xl shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4 cursor-pointer"
                                        >
                                            {submitting ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    <span>Connecting to shurjoPay...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <ShieldCheck className="w-5 h-5" />
                                                    <span>Pay {formatBDT(totalPayable)} with shurjoPay</span>
                                                    <ArrowRight className="w-5 h-5 ml-1" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                ) : (
                            <>
                                {/* Manual Instructions */}
                                {activeGateway && (
                                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-2.5">
                                        <div className="font-bold text-slate-900 flex items-center justify-between">
                                            <span className="flex items-center gap-1.5">
                                                <span>
                                                    Payment Instructions ({activeGateway.title}):
                                                </span>
                                            </span>
                                            <button
                                                type="button"
                                                onClick={handleCopyNumber}
                                                className="inline-flex items-center gap-1 text-sky-600 font-bold hover:underline cursor-pointer"
                                            >
                                                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                                <span>{copied ? 'Copied' : 'Copy Number'}</span>
                                            </button>
                                        </div>

                                        <p className="leading-relaxed">
                                            {`1. Open your ${activeGateway.title} app or dial code and select ${getMethodTypeLabel(currentType)}.`}
                                        </p>

                                        <div className="flex items-center gap-2 pt-0.5">
                                            <span>2. Recipient Number: </span>
                                            <strong className="font-mono text-sm text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                                                {currentNumber}
                                            </strong>
                                            <span className="text-[11px] text-slate-500 font-medium">
                                                ({getAccountTypeBadge(currentType)})
                                            </span>
                                        </div>

                                        <p className="pt-0.5">
                                            3. Send Amount: 
                                            <strong className="text-slate-900">{formatBDT(totalPayable)}</strong>
                                        </p>

                                        {(activeGateway.config?.instructions_en || activeGateway.config?.instructions) && (
                                            <div className="p-3 bg-white rounded-xl border border-slate-200/90 text-slate-600 leading-relaxed font-normal">
                                                <span className="font-semibold text-slate-800 block mb-0.5">
                                                    Special Instruction:
                                                </span>
                                                {activeGateway.config?.instructions_en || activeGateway.config?.instructions}
                                            </div>
                                        )}

                                        <p className="pt-0.5 text-slate-500">
                                            4. Enter the TrxID below after successful transfer.
                                        </p>
                                    </div>
                                )}

                                {/* Manual Verification Form */}
                                <form onSubmit={handleSubmitOrder} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            Sender Mobile Number
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={senderPhone}
                                            onChange={(e) => setSenderPhone(e.target.value)}
                                            placeholder="017xxxxxxxx"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            Transaction ID (TrxID)
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={transactionRef}
                                            onChange={(e) => setTransactionRef(e.target.value)}
                                            placeholder="e.g. 9J3K8LQZ"
                                            className="w-full px-4 py-3 font-mono uppercase bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            Additional Notes (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="Any special note or reference"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full py-4 bg-sky-600 hover:bg-sky-700 text-white font-bold text-base rounded-xl shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4 cursor-pointer"
                                    >
                                        <span>{submitting ? 'Processing Order...' : 'Payment Completed & Confirm Order'}</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </button>
                                </form>
                            </>
                        )}
                        </>
                    )}
                    </div>
                </div>

                {/* Right: Order Summary */}
                <div className="lg:col-span-5">
                    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                        <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">
                            Order Summary
                        </h3>

                        {/* Course Card Preview (Single Course or Cart Items) */}
                        {isCartMode && appliedOffer?.applied && (
                            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-sky-50 border border-emerald-200/80 flex items-start gap-2.5">
                                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                <div className="text-xs">
                                    <span className="font-bold text-emerald-900">
                                        {appliedOffer.offer_title || 'Dynamic Offer Applied'}
                                    </span>
                                    <span className="ml-1.5 font-bold text-emerald-700">
                                        (-{formatBDT(dynamicDiscount)})
                                    </span>
                                    {appliedOffer.banner_text && (
                                        <p className="text-[11px] text-emerald-800/80 mt-0.5">{appliedOffer.banner_text}</p>
                                    )}
                                </div>
                            </div>
                        )}
                        {isCartMode ? (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <span>Enrolling in {cartItems.length} {cartItems.length === 1 ? 'Course' : 'Courses'}</span>
                                    <Link to="/cart" className="text-sky-600 hover:underline">Edit Cart</Link>
                                </div>
                                <div className="max-h-56 overflow-y-auto space-y-2.5 pr-1 divide-y divide-slate-100">
                                    {cartItems.map((item) => (
                                        <div key={item.id} className="pt-2 first:pt-0 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-12 h-10 rounded-lg bg-slate-900 overflow-hidden shrink-0">
                                                    {item.thumbnail || item.thumbnail_url ? (
                                                        <img src={item.thumbnail || item.thumbnail_url || ''} alt={item.title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-white">
                                                            <BookOpen className="w-4 h-4 text-sky-400" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="text-xs font-bold text-slate-900 truncate">{item.title}</h4>
                                                    <p className="text-[11px] text-slate-500">{item.lessons_count || 0} Lessons</p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-black text-slate-900 shrink-0">
                                                {formatBDT(item.effective_price)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : course ? (
                            <div className="flex gap-4">
                                <div className="w-20 h-16 rounded-xl bg-slate-900 overflow-hidden shrink-0">
                                    {course.thumbnail ? (
                                        <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white">
                                            <BookOpen className="w-6 h-6 text-sky-400" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 line-clamp-2">{course.title}</h4>
                                    <p className="text-xs text-slate-500 mt-1">{course.lessons_count || 0} Lessons</p>
                                </div>
                            </div>
                        ) : null}

                        {/* NexPilot Add-on Option if course has NexPilot */}
                        {hasActivePilot && (
                            <div 
                                onClick={() => setIncludeNexPilot(!includeNexPilot)}
                                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer select-none ${
                                    includeNexPilot 
                                        ? 'bg-linear-to-br from-amber-50/80 via-sky-50/50 to-white border-sky-400 shadow-xs' 
                                        : 'bg-slate-50 border-slate-200 hover:border-slate-300 opacity-80'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        checked={includeNexPilot}
                                        onChange={(e) => setIncludeNexPilot(e.target.checked)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="mt-1 w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                                                <Sparkles className="w-4 h-4 text-amber-500" />
                                                <span>NexPilot AI Tutor</span>
                                            </span>
                                            <span className="font-black text-sm text-amber-600">
                                                +{formatBDT(nexpilot.price)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                            {nexpilot.short_description || 'Comprehensive 24/7 personalized AI tutor assistance across all theory and practice.'}
                                        </p>
                                        <div className="mt-2.5 flex items-center gap-2">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-700">
                                                Theory + Practice
                                            </span>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700">
                                                OpenAI Powered
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Referral / Promo Code Box */}
                        <div className="pt-2 border-t border-slate-100">
                            {appliedReferral ? (
                                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-700">
                                            <Tag className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-mono font-bold text-xs text-emerald-900">{appliedReferral.code}</span>
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-200/80 text-emerald-800 rounded">
                                                    {appliedReferral.discount_amount > 0 ? `Tk ${appliedReferral.discount_amount} Off` : 'Code Active'}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-emerald-700 mt-0.5">
                                                {appliedReferral.message}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleRemoveReferral}
                                        className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                                        title="Remove code"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                        <Tag className="w-3.5 h-3.5 text-sky-500" />
                                        <span>Have a Referral or Promo Code?</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={referralInput}
                                            onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                                            placeholder="e.g. MONO2026"
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
                                        />
                                        <button
                                            type="button"
                                            disabled={checkingReferral || !referralInput.trim()}
                                            onClick={() => validateReferralCode(referralInput, course?.id || cartItems[0]?.id || 0)}
                                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 shrink-0 flex items-center gap-1"
                                        >
                                            {checkingReferral && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                            <span>Apply</span>
                                        </button>
                                    </div>
                                    {referralMessage && referralMessage.type === 'error' && (
                                        <p className="text-[11px] text-red-500 font-medium">
                                            {referralMessage.text}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Coupon Code Box */}
                        <div className="pt-2 border-t border-slate-100">
                            {appliedCoupon ? (
                                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-amber-100 rounded-lg text-amber-700">
                                            <TicketPercent className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-mono font-bold text-xs text-amber-900">{appliedCoupon.code}</span>
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-200/80 text-amber-800 rounded">
                                                    -Tk {appliedCoupon.calculated_discount} OFF
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-amber-700 mt-0.5">
                                                {appliedCoupon.title}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleRemoveCoupon}
                                        className="text-slate-400 hover:text-red-500 p-1 transition-colors cursor-pointer"
                                        title="Remove coupon"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                        <TicketPercent className="w-3.5 h-3.5 text-amber-600" />
                                        <span>Have a Discount Coupon?</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={couponInput}
                                            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                                            placeholder="Enter coupon code..."
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
                                        />
                                        <button
                                            type="button"
                                            disabled={checkingCoupon || !couponInput.trim()}
                                            onClick={() => validateCouponCode(couponInput, course?.id || cartItems[0]?.id || 0)}
                                            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 shrink-0 flex items-center gap-1 cursor-pointer shadow-xs"
                                        >
                                            {checkingCoupon && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                            <span>Apply</span>
                                        </button>
                                    </div>
                                    {couponMessage && (
                                        <p className={`text-[11px] font-medium ${couponMessage.type === 'error' ? 'text-red-500' : 'text-emerald-600'}`}>
                                            {couponMessage.text}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Points Redemption Box */}
                        {isPointsActive && (
                            <div className="pt-2 border-t border-slate-100">
                                {!user ? (
                                    <div className="p-3 bg-amber-500/10 border border-amber-300/60 rounded-2xl flex items-center justify-between gap-3 text-xs">
                                        <div className="flex items-center gap-2 text-amber-800">
                                            <Gem className="w-4 h-4 text-amber-500 shrink-0" />
                                            <span>Have reward points? Log in to apply discounts.</span>
                                        </div>
                                        <Link
                                            to="/login"
                                            className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-2xs shrink-0"
                                        >
                                            Login
                                        </Link>
                                    </div>
                                ) : userPoints <= 0 ? (
                                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-2 text-xs text-slate-500">
                                        <Gem className="w-4 h-4 text-slate-400 shrink-0" />
                                        <span>You have 0 💎 Reward Points. Earn points by uploading study notes!</span>
                                    </div>
                                ) : (
                                    <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-white border border-amber-300 rounded-2xl space-y-2.5">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-amber-500 text-white rounded-xl shadow-2xs">
                                                    <Gem className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <span className="text-xs font-black text-slate-900 block">
                                                        Apply Reward Points
                                                    </span>
                                                    <span className="text-[11px] text-amber-700 font-bold block">
                                                        Balance: {userPoints} 💎 ({redemptionPointsRate} 💎 = Tk {redemptionAmountRate} OFF)
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (!usePoints) {
                                                        setUsePoints(true);
                                                        setPointsRedeemedCount(maxPointsUsable);
                                                    } else {
                                                        setUsePoints(false);
                                                        setPointsRedeemedCount(0);
                                                    }
                                                }}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shadow-2xs ${
                                                    usePoints
                                                        ? 'bg-rose-500 hover:bg-rose-600 text-white'
                                                        : 'bg-amber-500 hover:bg-amber-600 text-white'
                                                }`}
                                            >
                                                {usePoints ? 'Remove Points' : 'Apply Points'}
                                            </button>
                                        </div>

                                        {usePoints && (
                                            <div className="pt-2 border-t border-amber-200/80 space-y-2">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="font-bold text-slate-700">
                                                        Redeeming {activePointsToRedeem} 💎 points
                                                    </span>
                                                    <span className="font-black text-emerald-600 text-sm">
                                                        - {formatBDT(pointsDiscount)} OFF
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-slate-400">
                                                    Max discount limit: up to {maxRedeemPercent}% of course price.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Pricing Breakdown */}
                        <div className="space-y-3 pt-4 border-t border-slate-100 text-sm">
                            <div className="flex justify-between text-slate-600">
                                <span>Regular Course Fee{isCartMode ? ` (${cartItems.length} items)` : ''}</span>
                                <span className="font-semibold">{formatBDT(originalRegularPrice)}</span>
                            </div>

                            {originalRegularPrice > courseBasePrice && (
                                <div className="flex justify-between text-emerald-600 font-medium">
                                    <span>Special Discount Savings</span>
                                    <span>- {formatBDT(originalRegularPrice - courseBasePrice)}</span>
                                </div>
                            )}

                            {referralDiscount > 0 && (
                                <div className="flex justify-between text-emerald-600 font-medium">
                                    <span className="flex items-center gap-1.5">
                                        <Tag className="w-3.5 h-3.5 text-emerald-500" />
                                        <span>Referral Discount ({appliedReferral?.code})</span>
                                    </span>
                                    <span className="font-semibold">- {formatBDT(referralDiscount)}</span>
                                </div>
                            )}

                            {couponDiscount > 0 && (
                                <div className="flex justify-between text-amber-600 font-medium">
                                    <span className="flex items-center gap-1.5">
                                        <TicketPercent className="w-3.5 h-3.5 text-amber-600" />
                                        <span>Coupon Discount ({appliedCoupon?.code})</span>
                                    </span>
                                    <span className="font-semibold">- {formatBDT(couponDiscount)}</span>
                                </div>
                            )}

                            {pointsDiscount > 0 && (
                                <div className="flex justify-between text-amber-600 font-medium">
                                    <span className="flex items-center gap-1.5">
                                        <Gem className="w-3.5 h-3.5 text-amber-500" />
                                        <span>Points Discount ({activePointsToRedeem} 💎)</span>
                                    </span>
                                    <span className="font-semibold">- {formatBDT(pointsDiscount)}</span>
                                </div>
                            )}

                            {dynamicDiscount > 0 && (
                                <div className="flex justify-between text-emerald-600 font-medium">
                                    <span className="flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                                        <span>Dynamic Bundle Offer ({appliedOffer?.offer_title || 'Applied'})</span>
                                    </span>
                                    <span className="font-semibold">- {formatBDT(dynamicDiscount)}</span>
                                </div>
                            )}

                            {hasActivePilot && includeNexPilot && nexpilot && (
                                <div className="flex justify-between text-sky-600 font-medium">
                                    <span className="flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                        <span>NexPilot AI Learning Assistant</span>
                                    </span>
                                    <span className="font-semibold">+{formatBDT(nexpilot.price)}</span>
                                </div>
                            )}

                            <div className="flex justify-between text-lg font-black text-slate-900 pt-3 border-t border-slate-100">
                                <span>Total Payable</span>
                                <span className="text-sky-600">{formatBDT(totalPayable)}</span>
                            </div>
                        </div>

                        {/* Security Guarantee */}
                        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-800 space-y-1.5">
                            <div className="flex items-center gap-1.5 font-bold">
                                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                <span>Secure & Verified Transaction</span>
                            </div>
                            <p className="text-emerald-700/90 leading-relaxed">
                                Your course will be unlocked immediately once the payment is verified, and you will receive SMS confirmation.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
