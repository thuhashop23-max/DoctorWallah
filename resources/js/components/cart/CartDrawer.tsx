import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { formatBDT, getImageUrl } from '../../api/client';
import {
    ShoppingCart,
    X,
    Trash2,
    ArrowRight,
    BookOpen,
    ShieldCheck,
    Sparkles,
    ShoppingBag,
    Tag,
    Flame,
    Ticket,
    Loader2,
    CheckCircle2,
    Gem
} from 'lucide-react';

export const CartDrawer: React.FC = () => {
    const {
        items,
        isCartOpen,
        closeCart,
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
        removePoints,
        totalPayable,
        cartCount
    } = useCart();

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

    // Prevent body scroll when drawer is open and handle Escape key to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                closeCart();
            }
        };

        if (isCartOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isCartOpen, closeCart]);

    if (!isCartOpen) return null;

    const handleCheckout = () => {
        closeCart();
        navigate('/checkout');
    };

    const handleViewCart = () => {
        closeCart();
        navigate('/cart');
    };

    return (
        <div className="fixed inset-0 z-[100] overflow-hidden">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
                onClick={closeCart}
            />

            {/* Slide-over panel */}
            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 z-[101]">
                <div className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col justify-between border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
                    {/* Header */}
                    <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                        {/* Left: Cross Icon + Title */}
                        <div className="flex items-center gap-3 min-w-0">
                            {/* Cross Icon on the Left side of swipe bar */}
                            <button
                                type="button"
                                onClick={closeCart}
                                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 flex items-center justify-center transition-all cursor-pointer border border-slate-200/80 dark:border-slate-700 shadow-2xs shrink-0 group"
                                title="Close Cart (Esc)"
                                aria-label="Close Cart"
                            >
                                <X className="w-5 h-5 transition-transform group-hover:rotate-90 duration-200" />
                            </button>

                            <div className="min-w-0">
                                <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <span>Shopping Cart</span>
                                    {cartCount > 0 && (
                                        <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-[#A60201] text-white shrink-0">
                                            {cartCount}
                                        </span>
                                    )}
                                </h2>
                                <p className="text-[11px] text-slate-400 truncate">
                                    {cartCount === 0 ? 'No courses added yet' : `${cartCount} ${cartCount === 1 ? 'course' : 'courses'} in cart`}
                                </p>
                            </div>
                        </div>

                        {/* Right: Clear button */}
                        {cartCount > 0 && (
                            <button
                                type="button"
                                onClick={clearCart}
                                className="text-xs text-rose-500 hover:text-rose-600 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer shrink-0"
                                title="Empty Cart"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    {/* Dynamic Offer Notification Banner */}
                    {cartCount > 0 && appliedOffer && (
                        <div className="px-4 pt-3 pb-1">
                            {appliedOffer.applied ? (
                                <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-sky-500/10 border border-emerald-500/30 flex items-start gap-2.5">
                                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                    <div className="text-xs">
                                        <p className="font-bold text-emerald-800 dark:text-emerald-300">
                                            {appliedOffer.offer_title || 'Special Bundle Offer Applied!'}
                                        </p>
                                        <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
                                            {appliedOffer.banner_text || `You saved ${formatBDT(dynamicOfferDiscount)} on this order.`}
                                        </p>
                                        {appliedOffer.next_tier && (
                                            <p className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold mt-1 flex items-center gap-1">
                                                <Flame className="w-3 h-3 text-amber-500" />
                                                <span>Add {appliedOffer.next_tier.courses_needed} more to get {appliedOffer.next_tier.discount_type === 'percentage' ? `${appliedOffer.next_tier.discount_value}%` : formatBDT(appliedOffer.next_tier.discount_value)} OFF!</span>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : appliedOffer.next_tier ? (
                                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
                                    <Flame className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                    <div className="text-xs">
                                        <p className="font-bold text-amber-800 dark:text-amber-300">
                                            {appliedOffer.offer_title || 'Unlock Special Discount'}
                                        </p>
                                        <p className="text-[11px] text-amber-700/90 dark:text-amber-400/90 mt-0.5">
                                            Add {appliedOffer.next_tier.courses_needed} more {appliedOffer.next_tier.courses_needed === 1 ? 'course' : 'courses'} to your cart to get {appliedOffer.next_tier.discount_type === 'percentage' ? `${appliedOffer.next_tier.discount_value}%` : formatBDT(appliedOffer.next_tier.discount_value)} OFF!
                                        </p>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    )}

                    {/* Cart Items List */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-slate-100 dark:divide-slate-800">
                        {cartCount === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4 space-y-4">
                                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                                    <ShoppingBag className="w-8 h-8" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                                        Your cart is empty
                                    </h3>
                                    <p className="text-xs text-slate-400 max-w-xs">
                                        Explore our courses catalog and add the courses you want to prepare with.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            closeCart();
                                            navigate('/courses');
                                        }}
                                        className="px-5 py-2.5 bg-[#A60201] hover:bg-[#880101] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                                    >
                                        <BookOpen className="w-4 h-4" />
                                        <span>Browse Courses</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={closeCart}
                                        className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                        <span>Close</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3.5 pb-2">
                                {items.map((item) => {
                                    const thumb = getImageUrl(item.thumbnail || item.thumbnail_url);
                                    const hasDiscount = item.price > item.effective_price;

                                    return (
                                        <div
                                            key={item.id}
                                            className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 hover:border-[#A60201]/40 transition-colors group"
                                        >
                                            {/* Thumbnail */}
                                            <Link
                                                to={`/courses/${item.slug}`}
                                                onClick={closeCart}
                                                className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-900 overflow-hidden shrink-0 block relative"
                                            >
                                                {thumb ? (
                                                    <img
                                                        src={thumb}
                                                        alt={item.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-white bg-slate-800">
                                                        <BookOpen className="w-6 h-6 text-slate-500" />
                                                    </div>
                                                )}
                                            </Link>

                                            {/* Course Info */}
                                            <div className="flex-1 min-w-0">
                                                <Link
                                                    to={`/courses/${item.slug}`}
                                                    onClick={closeCart}
                                                    className="block font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 hover:text-[#A60201] dark:hover:text-[#A60201] line-clamp-2 transition-colors leading-snug"
                                                >
                                                    {item.title}
                                                </Link>

                                                <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400">
                                                    {item.lessons_count !== undefined && item.lessons_count > 0 && (
                                                        <span>{item.lessons_count} Classes</span>
                                                    )}
                                                    {item.lessons_count !== undefined && item.lessons_count > 0 && <span>•</span>}
                                                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Limited Access</span>
                                                </div>

                                                {/* Price & Delete */}
                                                <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                                                    <div className="flex items-baseline gap-1.5">
                                                        <span className="font-black text-sm text-[#A60201]">
                                                            {formatBDT(item.effective_price)}
                                                        </span>
                                                        {hasDiscount && (
                                                            <span className="text-[11px] text-slate-400 line-through">
                                                                {formatBDT(item.price)}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => removeFromCart(item.id)}
                                                        className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                                        title="Remove from cart"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer / Summary & Actions */}
                    {cartCount > 0 && (
                        <div className="p-4 sm:p-5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/80 space-y-3">
                            {/* Coupon Code Section */}
                            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700/80 shadow-2xs">
                                {appliedCoupon ? (
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                                <Ticket className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 tracking-wider">
                                                        {appliedCoupon.code}
                                                    </span>
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                                                        Applied
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium truncate">
                                                    {appliedCoupon.title || `Saved ${formatBDT(couponDiscount)}`}
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
                                        <div className="flex items-center gap-1.5">
                                            <div className="relative flex-1">
                                                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                                                    <Ticket className="w-3.5 h-3.5" />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={couponCodeInput}
                                                    onChange={(e) => {
                                                        setCouponCodeInput(e.target.value.toUpperCase());
                                                        setCouponSuccessMessage(null);
                                                    }}
                                                    placeholder="Coupon Code"
                                                    disabled={isApplyingCoupon}
                                                    className="w-full pl-8 pr-2 py-1.5 text-xs font-semibold uppercase tracking-wider bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:normal-case focus:outline-none focus:border-[#A60201] focus:ring-1 focus:ring-[#A60201]"
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={isApplyingCoupon || !couponCodeInput.trim()}
                                                className="px-3 py-1.5 bg-[#A60201] hover:bg-[#880101] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                                            >
                                                {isApplyingCoupon ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    'Apply'
                                                )}
                                            </button>
                                        </div>
                                        {couponError && (
                                            <p className="text-[11px] text-rose-500 font-medium pl-1 leading-tight">
                                                {couponError}
                                            </p>
                                        )}
                                        {couponSuccessMessage && !couponError && (
                                            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium pl-1 leading-tight">
                                                {couponSuccessMessage}
                                            </p>
                                        )}
                                    </form>
                                )}
                            </div>

                            {/* Summary info */}
                            <div className="space-y-1.5 text-xs">
                                {totalOriginalPrice > subtotal && (
                                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                                        <span>Regular Total</span>
                                        <span className="line-through">{formatBDT(totalOriginalPrice)}</span>
                                    </div>
                                )}

                                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                                    <span>Courses Subtotal</span>
                                    <span>{formatBDT(subtotal)}</span>
                                </div>

                                {dynamicOfferDiscount > 0 && (
                                    <div className="flex items-center justify-between font-semibold text-emerald-600 dark:text-emerald-400">
                                        <span className="flex items-center gap-1">
                                            <Tag className="w-3.5 h-3.5" />
                                            <span>Dynamic Bundle Offer</span>
                                        </span>
                                        <span>-{formatBDT(dynamicOfferDiscount)}</span>
                                    </div>
                                )}

                                {couponDiscount > 0 && appliedCoupon && (
                                    <div className="flex items-center justify-between font-semibold text-emerald-600 dark:text-emerald-400">
                                        <span className="flex items-center gap-1">
                                            <Ticket className="w-3.5 h-3.5" />
                                            <span>Coupon ({appliedCoupon.code})</span>
                                        </span>
                                        <span>-{formatBDT(couponDiscount)}</span>
                                    </div>
                                )}

                                {pointsDiscount > 0 && appliedPoints > 0 && (
                                    <div className="flex items-center justify-between font-semibold text-amber-600 dark:text-amber-400">
                                        <span className="flex items-center gap-1">
                                            <Gem className="w-3.5 h-3.5 text-amber-500" />
                                            <span>Reward Points ({appliedPoints.toLocaleString()})</span>
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            <span>-{formatBDT(pointsDiscount)}</span>
                                            <button
                                                type="button"
                                                onClick={removePoints}
                                                className="text-[10px] text-rose-500 hover:text-rose-600 underline font-normal"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {totalSavings > 0 && (
                                    <div className="flex items-center justify-between font-semibold text-emerald-600 dark:text-emerald-400">
                                        <span className="flex items-center gap-1">
                                            <Sparkles className="w-3.5 h-3.5" />
                                            <span>Total Savings</span>
                                        </span>
                                        <span>-{formatBDT(totalSavings)}</span>
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                                    <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200">Total Payable</span>
                                    <span className="font-black text-lg text-[#A60201]">
                                        {formatBDT(totalPayable)}
                                    </span>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="space-y-2 pt-1">
                                <button
                                    type="button"
                                    onClick={handleCheckout}
                                    className="w-full py-3 bg-[#A60201] hover:bg-[#880101] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-[#A60201]/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                                >
                                    <span>Proceed to Checkout</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>

                                <button
                                    type="button"
                                    onClick={handleViewCart}
                                    className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                                >
                                    View Full Cart
                                </button>
                            </div>

                            {/* Security Notice */}
                            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center pt-1">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Instant Enrollment upon Payment Verification</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
