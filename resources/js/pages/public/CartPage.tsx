import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { formatBDT, getImageUrl } from '../../api/client';
import {
    ShoppingCart,
    Trash2,
    ArrowRight,
    BookOpen,
    ShieldCheck,
    Sparkles,
    ShoppingBag,
    ArrowLeft,
    CheckCircle2,
    Tag,
    Flame,
    Ticket,
    X,
    Loader2,
    Gem
} from 'lucide-react';

export const CartPage: React.FC = () => {
    const {
        items,
        removeFromCart,
        clearCart,
        subtotal,
        totalOriginalPrice,
        totalSavings,
        dynamicOfferDiscount,
        appliedOffer,
        appliedCoupon,
        couponDiscount,
        isApplyingCoupon,
        couponError,
        applyCoupon,
        removeCoupon,
        appliedPoints,
        pointsDiscount,
        applyPoints,
        removePoints,
        totalPayable,
        cartCount
    } = useCart();

    const { user } = useAuth();
    const { settings } = useSettings();
    const isPointsActive = (settings as any)?.point_settings?.is_active !== false && (settings as any)?.point_settings?.redemption_enabled !== false;
    const redemptionPointsRate = (settings as any)?.point_settings?.redemption_points || 10;
    const redemptionAmountRate = (settings as any)?.point_settings?.redemption_amount || 1.0;
    const maxRedeemPercent = (settings as any)?.point_settings?.max_redemption_percentage || 50;

    const userPoints = user?.points || 0;

    const navigate = useNavigate();
    const [couponCodeInput, setCouponCodeInput] = useState('');
    const [couponSuccessMessage, setCouponSuccessMessage] = useState<string | null>(null);

    const handleApplyCoupon = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!couponCodeInput.trim()) return;
        setCouponSuccessMessage(null);
        const res = await applyCoupon(couponCodeInput.trim());
        if (res.success) {
            setCouponCodeInput('');
            setCouponSuccessMessage(res.message);
        }
    };

    const handleRemoveCoupon = () => {
        removeCoupon();
        setCouponCodeInput('');
        setCouponSuccessMessage(null);
    };

    const handleCheckout = () => {
        navigate('/checkout');
    };

    return (
        <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950/60 py-8 sm:py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header breadcrumb & title */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                        <Link to="/" className="hover:text-[#25a2ee] transition-colors">Home</Link>
                        <span>/</span>
                        <Link to="/courses" className="hover:text-[#25a2ee] transition-colors">Courses</Link>
                        <span>/</span>
                        <span className="text-slate-900 dark:text-white font-medium">Cart</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-[#25a2ee] flex items-center justify-center shadow-xs">
                                <ShoppingCart className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                    Shopping Cart
                                </h1>
                                <p className="text-xs sm:text-sm text-slate-500">
                                    {cartCount === 0
                                        ? 'Your cart is currently empty'
                                        : `You have ${cartCount} ${cartCount === 1 ? 'course' : 'courses'} in your cart`}
                                </p>
                            </div>
                        </div>

                        {cartCount > 0 && (
                            <button
                                type="button"
                                onClick={clearCart}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Empty Cart</span>
                            </button>
                        )}
                    </div>
                </div>

                {cartCount === 0 ? (
                    /* Empty Cart State */
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 sm:p-16 text-center max-w-2xl mx-auto shadow-sm">
                        <div className="w-20 h-20 rounded-3xl bg-sky-50 dark:bg-sky-950/40 text-[#25a2ee] flex items-center justify-center mx-auto mb-5 shadow-xs">
                            <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
                            Your cart is empty
                        </h2>
                        <p className="text-sm text-slate-500 max-w-md mx-auto mb-8 leading-relaxed">
                            Looks like you haven't added any courses to your cart yet. Explore our top courses and level up your skills today!
                        </p>
                        <Link
                            to="/courses"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#25a2ee] hover:bg-[#1d8cd0] text-white font-bold text-sm shadow-md shadow-[#25a2ee]/20 hover:shadow-lg transition-all"
                        >
                            <span>Browse Courses</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                ) : (
                    /* Cart With Items Layout */
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Course Items List */}
                        <div className="lg:col-span-8 space-y-4">
                            {/* Dynamic Offer Notification Banner */}
                            {appliedOffer && (
                                <div className="rounded-2xl overflow-hidden shadow-xs border">
                                    {appliedOffer.applied ? (
                                        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-sky-500/10 border-emerald-500/30 flex items-start gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                                <Sparkles className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">
                                                        {appliedOffer.offer_title || 'Dynamic Bundle Offer Applied!'}
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                                        Saved {formatBDT(dynamicOfferDiscount)}
                                                    </span>
                                                </div>
                                                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                                                    {appliedOffer.banner_text || `You have unlocked special bundle pricing on ${appliedOffer.qualifying_count || items.length} qualifying courses.`}
                                                </p>
                                                {appliedOffer.next_tier && (
                                                    <div className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                                                        <Flame className="w-4 h-4 text-amber-500" />
                                                        <span>Add {appliedOffer.next_tier.courses_needed} more course to get {appliedOffer.next_tier.discount_type === 'percentage' ? `${appliedOffer.next_tier.discount_value}%` : formatBDT(appliedOffer.next_tier.discount_value)} OFF!</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : appliedOffer.next_tier ? (
                                        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30 flex items-start gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                                <Flame className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                                                    {appliedOffer.offer_title || 'Special Bundle Offer Available'}
                                                </p>
                                                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                                                    Add {appliedOffer.next_tier.courses_needed} more {appliedOffer.next_tier.courses_needed === 1 ? 'course' : 'courses'} to your cart to instantly get {appliedOffer.next_tier.discount_type === 'percentage' ? `${appliedOffer.next_tier.discount_value}%` : formatBDT(appliedOffer.next_tier.discount_value)} OFF!
                                                </p>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            )}

                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 shadow-sm overflow-hidden">
                                {items.map((item) => {
                                    const thumbSrc = getImageUrl(item.thumbnail || item.thumbnail_url);
                                    const hasDiscount = item.effective_price < item.price;
                                    const instructorName = item.instructor?.name || (item.instructors && item.instructors[0]?.name);

                                    return (
                                        <div
                                            key={item.id}
                                            className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                                        >
                                            {/* Thumbnail and Info */}
                                            <div className="flex items-start gap-4 flex-1 min-w-0">
                                                <div className="w-24 sm:w-28 h-16 sm:h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700">
                                                    {thumbSrc ? (
                                                        <img
                                                            src={thumbSrc}
                                                            alt={item.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                            <BookOpen className="w-6 h-6" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <Link
                                                        to={`/courses/${item.slug}`}
                                                        className="text-sm sm:text-base font-bold text-slate-900 dark:text-white hover:text-[#25a2ee] line-clamp-2 transition-colors"
                                                    >
                                                        {item.title}
                                                    </Link>

                                                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500">
                                                        {instructorName && (
                                                            <span>By {instructorName}</span>
                                                        )}
                                                        {item.lessons_count && item.lessons_count > 0 ? (
                                                            <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                                <BookOpen className="w-3 h-3 text-[#25a2ee]" />
                                                                {item.lessons_count} Lessons
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Price & Action */}
                                            <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                                                <div className="sm:text-right">
                                                    <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                                                        {formatBDT(item.effective_price)}
                                                    </div>
                                                    {hasDiscount && (
                                                        <div className="text-xs text-slate-400 line-through">
                                                            {formatBDT(item.price)}
                                                        </div>
                                                    )}
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="mt-0 sm:mt-2 text-xs text-rose-500 hover:text-rose-600 font-semibold p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer flex items-center gap-1"
                                                    title="Remove course"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    <span className="sm:hidden">Remove</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Continue Shopping Link */}
                            <div className="flex items-center justify-between pt-2">
                                <Link
                                    to="/courses"
                                    className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-[#25a2ee] transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    <span>Continue Browsing Courses</span>
                                </Link>
                            </div>
                        </div>

                        {/* Order Summary Column */}
                        <div className="lg:col-span-4">
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm sticky top-24 space-y-6">
                                <h3 className="text-lg font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                                    Order Summary
                                </h3>

                                {/* Coupon Section */}
                                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2.5">
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                                        <span className="flex items-center gap-1.5">
                                            <Ticket className="w-4 h-4 text-[#25a2ee]" />
                                            <span>Apply Coupon</span>
                                        </span>
                                    </div>

                                    {appliedCoupon ? (
                                        <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-extrabold text-xs text-emerald-800 dark:text-emerald-200 tracking-wider">
                                                            {appliedCoupon.code}
                                                        </span>
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-emerald-200 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                                                            Applied
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-emerald-700 dark:text-emerald-300 truncate">
                                                        {appliedCoupon.title || `You saved ${formatBDT(couponDiscount)}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleRemoveCoupon}
                                                className="p-1 text-slate-400 hover:text-rose-500 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
                                                title="Remove coupon"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                                            <div className="flex items-center gap-2">
                                                <div className="relative flex-1">
                                                    <input
                                                        type="text"
                                                        value={couponCodeInput}
                                                        onChange={(e) => {
                                                            setCouponCodeInput(e.target.value.toUpperCase());
                                                            setCouponSuccessMessage(null);
                                                        }}
                                                        placeholder="Enter coupon code"
                                                        disabled={isApplyingCoupon}
                                                        className="w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:normal-case focus:outline-none focus:border-[#25a2ee] focus:ring-1 focus:ring-[#25a2ee]"
                                                    />
                                                </div>
                                                <button
                                                    type="submit"
                                                    disabled={isApplyingCoupon || !couponCodeInput.trim()}
                                                    className="px-4 py-2 bg-[#25a2ee] hover:bg-[#1a8ed2] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
                                                >
                                                    {isApplyingCoupon ? (
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    ) : (
                                                        'Apply'
                                                    )}
                                                </button>
                                            </div>
                                            {couponError && (
                                                <p className="text-xs text-rose-500 font-medium pl-0.5">
                                                    {couponError}
                                                </p>
                                            )}
                                            {couponSuccessMessage && !couponError && (
                                                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium pl-0.5">
                                                    {couponSuccessMessage}
                                                </p>
                                            )}
                                        </form>
                                    )}
                                </div>

                                {/* Points Redemption Section */}
                                {isPointsActive && (
                                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                                            <span className="flex items-center gap-1.5">
                                                <Gem className="w-4 h-4 text-amber-500" />
                                                <span>Redeem Reward Points</span>
                                            </span>
                                        </div>

                                        {!user ? (
                                            <div className="p-2.5 bg-amber-500/10 border border-amber-300/50 rounded-xl flex items-center justify-between gap-2 text-xs">
                                                <span className="text-amber-800 dark:text-amber-300 text-[11px]">
                                                    Log in to apply points for discount
                                                </span>
                                                <Link
                                                    to="/login"
                                                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] rounded-lg shadow-2xs shrink-0"
                                                >
                                                    Login
                                                </Link>
                                            </div>
                                        ) : userPoints <= 0 ? (
                                            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] text-slate-400">
                                                You have 0 💎 points available.
                                            </div>
                                        ) : (
                                            <div className="p-3 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/80 rounded-xl space-y-2">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div>
                                                        <span className="text-xs font-black text-slate-900 dark:text-white block">
                                                            Available: {userPoints} 💎
                                                        </span>
                                                        <span className="text-[10px] text-amber-700 dark:text-amber-400 block">
                                                            {redemptionPointsRate} 💎 = Tk {redemptionAmountRate} OFF
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (appliedPoints > 0) {
                                                                removePoints();
                                                            } else {
                                                                applyPoints(userPoints, redemptionPointsRate, redemptionAmountRate, maxRedeemPercent);
                                                            }
                                                        }}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer shadow-2xs ${
                                                            appliedPoints > 0
                                                                ? 'bg-rose-500 hover:bg-rose-600 text-white'
                                                                : 'bg-amber-500 hover:bg-amber-600 text-white'
                                                        }`}
                                                    >
                                                        {appliedPoints > 0 ? 'Remove' : 'Apply Points'}
                                                    </button>
                                                </div>
                                                {appliedPoints > 0 && (
                                                    <div className="flex items-center justify-between text-xs font-bold pt-1.5 border-t border-amber-200/60 dark:border-amber-800/60">
                                                        <span className="text-slate-600 dark:text-slate-300">
                                                            Applied: {appliedPoints} 💎
                                                        </span>
                                                        <span className="text-emerald-600 dark:text-emerald-400 font-black">
                                                            - {formatBDT(pointsDiscount)} OFF
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                        <span>Total Items:</span>
                                        <span className="font-semibold text-slate-900 dark:text-white">{cartCount}</span>
                                    </div>

                                    {totalOriginalPrice > subtotal && (
                                        <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                            <span>Original Price:</span>
                                            <span className="line-through">{formatBDT(totalOriginalPrice)}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                        <span>Items Subtotal:</span>
                                        <span className="font-semibold text-slate-900 dark:text-white">{formatBDT(subtotal)}</span>
                                    </div>

                                    {dynamicOfferDiscount > 0 && (
                                        <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                                            <span className="flex items-center gap-1">
                                                <Tag className="w-3.5 h-3.5" />
                                                <span>Dynamic Bundle:</span>
                                            </span>
                                            <span>- {formatBDT(dynamicOfferDiscount)}</span>
                                        </div>
                                    )}

                                    {couponDiscount > 0 && appliedCoupon && (
                                        <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                                            <span className="flex items-center gap-1">
                                                <Ticket className="w-3.5 h-3.5" />
                                                <span>Coupon ({appliedCoupon.code}):</span>
                                            </span>
                                            <span>- {formatBDT(couponDiscount)}</span>
                                        </div>
                                    )}

                                    {pointsDiscount > 0 && (
                                        <div className="flex justify-between text-amber-600 dark:text-amber-400 font-semibold">
                                            <span className="flex items-center gap-1">
                                                <Gem className="w-3.5 h-3.5 text-amber-500" />
                                                <span>Points Discount ({appliedPoints} 💎):</span>
                                            </span>
                                            <span>- {formatBDT(pointsDiscount)}</span>
                                        </div>
                                    )}

                                    {totalSavings > 0 && (
                                        <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                                            <span className="flex items-center gap-1">
                                                <Sparkles className="w-3.5 h-3.5" />
                                                Total Savings:
                                            </span>
                                            <span>- {formatBDT(totalSavings)}</span>
                                        </div>
                                    )}

                                    <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-between items-baseline">
                                        <span className="text-base font-bold text-slate-900 dark:text-white">Total Payable:</span>
                                        <span className="text-2xl font-black text-[#25a2ee]">
                                            {formatBDT(totalPayable)}
                                        </span>
                                    </div>
                                </div>

                                {/* Checkout Button */}
                                <button
                                    type="button"
                                    onClick={handleCheckout}
                                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#25a2ee] hover:bg-[#1d8cd0] text-white font-bold text-sm shadow-md shadow-[#25a2ee]/25 hover:shadow-lg transition-all cursor-pointer"
                                >
                                    <span>Proceed to Checkout</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>

                                {/* Trust Highlights */}
                                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                        <span>Instant enrollment after payment</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                        <span>Limited access to course contents</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-[#25a2ee] shrink-0" />
                                        <span>100% secure payment gateway</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
