import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Course } from '../types';
import { apiClient } from '../api/client';

export interface CartItem {
    id: number;
    title: string;
    slug: string;
    price: number;
    effective_price: number;
    sale_price?: number | null;
    thumbnail?: string | null;
    thumbnail_url?: string | null;
    lessons_count?: number;
    instructors?: Array<{ id: number; name: string }>;
    instructor?: { id: number; name: string } | null;
}

export interface AppliedOfferTier {
    min_qty: number;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    courses_needed?: number;
}

export interface DynamicOfferEvaluation {
    applied: boolean;
    offer_id?: number;
    offer_title?: string;
    banner_text?: string | null;
    scope_type?: string;
    qualifying_count?: number;
    matched_tier?: AppliedOfferTier | null;
    discount_amount: number;
    next_tier?: AppliedOfferTier | null;
}

export interface AppliedCartCoupon {
    coupon_id: number;
    code: string;
    title: string;
    discount_type: 'fixed' | 'percentage';
    discount_amount: number;
    calculated_discount: number;
    final_price: number;
    message?: string;
}

interface CartContextType {
    items: CartItem[];
    addToCart: (course: Course | CartItem) => void;
    removeFromCart: (courseId: number) => void;
    clearCart: () => void;
    isInCart: (courseId: number) => boolean;
    cartCount: number;
    subtotal: number;
    totalOriginalPrice: number;
    totalSavings: number;
    dynamicOfferDiscount: number;
    appliedOffer: DynamicOfferEvaluation | null;
    appliedCoupon: AppliedCartCoupon | null;
    couponDiscount: number;
    isApplyingCoupon: boolean;
    couponError: string | null;
    applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
    removeCoupon: () => void;
    appliedPoints: number;
    pointsDiscount: number;
    applyPoints: (pointsCount: number, ratePoints: number, rateAmount: number, maxPercent: number) => { success: boolean; message: string };
    removePoints: () => void;
    totalPayable: number;
    isEvaluatingOffer: boolean;
    refreshDynamicOffer: () => Promise<void>;
    isCartOpen: boolean;
    openCart: () => void;
    closeCart: () => void;
    toggleCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'novonex_cart_items';
const COUPON_STORAGE_KEY = 'novonex_cart_coupon';
const POINTS_STORAGE_KEY = 'novonex_cart_points';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [items, setItems] = useState<CartItem[]>(() => {
        try {
            const saved = localStorage.getItem(CART_STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const [isCartOpen, setIsCartOpen] = useState(false);
    const [dynamicOfferDiscount, setDynamicOfferDiscount] = useState<number>(0);
    const [appliedOffer, setAppliedOffer] = useState<DynamicOfferEvaluation | null>(null);
    const [isEvaluatingOffer, setIsEvaluatingOffer] = useState(false);

    // Coupon state
    const [appliedCoupon, setAppliedCoupon] = useState<AppliedCartCoupon | null>(() => {
        try {
            const saved = localStorage.getItem(COUPON_STORAGE_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });
    const [couponDiscount, setCouponDiscount] = useState<number>(() => {
        try {
            const saved = localStorage.getItem(COUPON_STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                return Math.floor(Number(parsed.calculated_discount || 0));
            }
        } catch {}
        return 0;
    });
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
    const [couponError, setCouponError] = useState<string | null>(null);

    // Points redemption state
    const [appliedPoints, setAppliedPoints] = useState<number>(() => {
        try {
            const saved = localStorage.getItem(POINTS_STORAGE_KEY);
            return saved ? parseInt(saved, 10) || 0 : 0;
        } catch {
            return 0;
        }
    });
    const [pointsDiscount, setPointsDiscount] = useState<number>(0);

    useEffect(() => {
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
        } catch {}
    }, [items]);

    const evaluateCartOffers = useCallback(async (currentItems: CartItem[]) => {
        if (!currentItems || currentItems.length === 0) {
            setDynamicOfferDiscount(0);
            setAppliedOffer(null);
            return;
        }

        try {
            setIsEvaluatingOffer(true);
            const { data } = await apiClient.post('/dynamic-offers/evaluate', {
                course_ids: currentItems.map((item) => item.id),
            });

            if (data && data.offer) {
                setAppliedOffer(data.offer);
                setDynamicOfferDiscount(Math.floor(Number(data.discount_amount || 0)));
            } else {
                setAppliedOffer(null);
                setDynamicOfferDiscount(0);
            }
        } catch {
            // Fail safely without disrupting the cart
            setAppliedOffer(null);
            setDynamicOfferDiscount(0);
        } finally {
            setIsEvaluatingOffer(false);
        }
    }, []);

    useEffect(() => {
        evaluateCartOffers(items);
    }, [items, evaluateCartOffers]);

    const refreshDynamicOffer = useCallback(async () => {
        await evaluateCartOffers(items);
    }, [items, evaluateCartOffers]);

    const addToCart = (course: Course | CartItem) => {
        setItems((prev) => {
            const exists = prev.some((item) => item.id === course.id);
            if (exists) {
                return prev;
            }

            const rawPrice = Number(course.price) || 0;
            const salePrice = course.sale_price !== null && course.sale_price !== undefined ? Number(course.sale_price) : null;
            const effPrice = (salePrice !== null && salePrice < rawPrice)
                ? salePrice
                : (course.effective_price !== undefined && course.effective_price !== null ? Number(course.effective_price) : rawPrice);

            const newItem: CartItem = {
                id: course.id,
                title: course.title,
                slug: course.slug,
                price: rawPrice,
                effective_price: effPrice,
                sale_price: salePrice,
                thumbnail: course.thumbnail || (course as any).thumbnail_url || null,
                thumbnail_url: (course as any).thumbnail_url || course.thumbnail || null,
                lessons_count: course.lessons_count || 0,
                instructors: (course as any).instructors || [],
                instructor: (course as any).instructor || null,
            };

            return [...prev, newItem];
        });

        // Automatically open the cart drawer when a course is added
        setIsCartOpen(true);
    };

    const applyCoupon = async (code: string): Promise<{ success: boolean; message: string }> => {
        const cleanCode = code ? code.trim().toUpperCase() : '';
        if (!cleanCode) {
            setCouponError('Please enter a coupon code.');
            return { success: false, message: 'Please enter a coupon code.' };
        }

        if (items.length === 0) {
            setCouponError('Your cart is empty.');
            return { success: false, message: 'Your cart is empty.' };
        }

        setIsApplyingCoupon(true);
        setCouponError(null);

        try {
            const { data } = await apiClient.post('/coupons/validate', {
                code: cleanCode,
                course_ids: items.map((i) => i.id),
            });

            if (data && data.valid) {
                const discount = Math.floor(Number(data.calculated_discount || 0));
                const couponData: AppliedCartCoupon = {
                    coupon_id: data.coupon_id,
                    code: data.code,
                    title: data.title,
                    discount_type: data.discount_type,
                    discount_amount: Number(data.discount_amount),
                    calculated_discount: discount,
                    final_price: Number(data.final_price),
                    message: data.message,
                };

                setAppliedCoupon(couponData);
                setCouponDiscount(discount);
                setCouponError(null);
                try {
                    localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(couponData));
                } catch {}

                return { success: true, message: data.message || 'Coupon applied successfully!' };
            } else {
                const msg = data.message || 'Invalid coupon code.';
                setCouponError(msg);
                return { success: false, message: msg };
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to apply coupon. Please check the code and try again.';
            setCouponError(msg);
            return { success: false, message: msg };
        } finally {
            setIsApplyingCoupon(false);
        }
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
        setCouponDiscount(0);
        setCouponError(null);
        try {
            localStorage.removeItem(COUPON_STORAGE_KEY);
        } catch {}
    };

    // Re-validate applied coupon whenever cart items change
    useEffect(() => {
        if (!appliedCoupon) return;

        if (items.length === 0) {
            removeCoupon();
            return;
        }

        apiClient.post('/coupons/validate', {
            code: appliedCoupon.code,
            course_ids: items.map((i) => i.id),
        }).then(({ data }) => {
            if (data && data.valid) {
                const discount = Math.floor(Number(data.calculated_discount || 0));
                setCouponDiscount(discount);
                setAppliedCoupon((prev) => prev ? {
                    ...prev,
                    calculated_discount: discount,
                    final_price: Number(data.final_price),
                } : null);
            } else {
                removeCoupon();
            }
        }).catch(() => {
            // Keep current or silently wait
        });
    }, [items]);

    const removeFromCart = (courseId: number) => {
        setItems((prev) => prev.filter((item) => item.id !== courseId));
    };

    const clearCart = () => {
        setItems([]);
        setAppliedOffer(null);
        setDynamicOfferDiscount(0);
        removeCoupon();
        removePoints();
        try {
            localStorage.removeItem(CART_STORAGE_KEY);
        } catch {}
    };

    const applyPoints = (pointsCount: number, ratePoints: number, rateAmount: number, maxPercent: number) => {
        if (pointsCount <= 0) {
            removePoints();
            return { success: false, message: 'Please select a valid points amount.' };
        }
        const baseAmount = Math.max(0, subtotal - dynamicOfferDiscount - couponDiscount);
        const maxAllowedDiscount = Math.floor((baseAmount * (maxPercent || 50)) / 100);
        const rPoints = Math.max(1, ratePoints || 10);
        const rAmount = Math.max(0.01, rateAmount || 1.0);
        const calculatedDiscount = Math.floor(Math.min(baseAmount, Math.min(maxAllowedDiscount, (pointsCount / rPoints) * rAmount)));

        setAppliedPoints(pointsCount);
        setPointsDiscount(calculatedDiscount);
        try {
            localStorage.setItem(POINTS_STORAGE_KEY, pointsCount.toString());
        } catch {}
        return { success: true, message: `Applied ${pointsCount} points (-Tk ${calculatedDiscount} discount)!` };
    };

    const removePoints = () => {
        setAppliedPoints(0);
        setPointsDiscount(0);
        try {
            localStorage.removeItem(POINTS_STORAGE_KEY);
        } catch {}
    };

    const isInCart = (courseId: number) => {
        return items.some((item) => item.id === courseId);
    };

    const cartCount = items.length;

    const subtotal = Math.floor(items.reduce((acc, item) => acc + (Number(item.effective_price) || 0), 0));
    const totalOriginalPrice = Math.floor(items.reduce((acc, item) => acc + (Number(item.price) || Number(item.effective_price) || 0), 0));
    const totalPayable = Math.floor(Math.max(0, subtotal - dynamicOfferDiscount - couponDiscount - pointsDiscount));
    const totalSavings = Math.floor(Math.max(0, totalOriginalPrice - totalPayable));

    const openCart = () => setIsCartOpen(true);
    const closeCart = () => setIsCartOpen(false);
    const toggleCart = () => setIsCartOpen((prev) => !prev);

    return (
        <CartContext.Provider
            value={{
                items,
                addToCart,
                removeFromCart,
                clearCart,
                isInCart,
                cartCount,
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
                isEvaluatingOffer,
                refreshDynamicOffer,
                isCartOpen,
                openCart,
                closeCart,
                toggleCart,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = (): CartContextType => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
