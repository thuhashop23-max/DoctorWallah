import React, { useState, useEffect, useRef } from 'react';
import { getImageUrl } from '../../api/client';
import {
    Play,
    ChevronLeft,
    ChevronRight,
    X,
    Sparkles,
    Video,
    User
} from 'lucide-react';

export interface VideoTestimonialItem {
    id: string;
    name: string;
    role?: string;
    videoUrl: string;
    thumbnailUrl?: string;
}

export interface VideoTestimonialsProps {
    settings?: {
        sectionTag?: string;
        sectionTitle?: string;
        sectionSub?: string;
        items?: VideoTestimonialItem[];
    };
    isBuilder?: boolean;
}

export const getYouTubeVideoId = (url?: string): string | null => {
    if (!url) return null;
    const trimmed = url.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
        return trimmed;
    }
    const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shortsMatch) return shortsMatch[1];
    const liveMatch = trimmed.match(/youtube\.com\/live\/([a-zA-Z0-9_-]{11})/);
    if (liveMatch) return liveMatch[1];
    const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch) return shortMatch[1];
    const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (watchMatch) return watchMatch[1];
    const embedMatch = trimmed.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
    if (embedMatch) return embedMatch[1];
    return null;
};

const DEFAULT_ITEMS: VideoTestimonialItem[] = [
    {
        id: '1',
        name: 'Samiul',
        role: 'DoctorWallah Student Review',
        videoUrl: 'https://youtu.be/Cbw_yhBGM_4',
        thumbnailUrl: '',
    },
    {
        id: '2',
        name: 'Khurshed',
        role: 'DoctorWallah Student Review',
        videoUrl: 'https://youtu.be/Zt7yfNIbInQ',
        thumbnailUrl: '',
    },
];

export const VideoTestimonialsCoverflow: React.FC<VideoTestimonialsProps> = ({
    settings,
    isBuilder = false,
}) => {
    const sectionTag = settings?.sectionTag ?? 'Student Stories & Video Reviews';
    const sectionTitle = settings?.sectionTitle ?? 'What Our Students Say';
    const sectionSub = settings?.sectionSub ?? 'Real journeys, genuine experiences, and success stories shared on camera.';

    const rawItems = settings?.items;
    const items: VideoTestimonialItem[] = (Array.isArray(rawItems) && rawItems.length > 0)
        ? rawItems.map((item, idx) => {
            if (item.videoUrl && item.videoUrl.trim() && !item.videoUrl.includes('dQw4w9WgXcQ')) {
                return item;
            }
            const fallback = DEFAULT_ITEMS[idx] || DEFAULT_ITEMS[0];
            return {
                ...item,
                name: (item.name && item.name !== 'Student Name' && item.name !== 'Farhan Islam' && item.name !== 'Sadia Afrin')
                    ? item.name
                    : fallback.name,
                role: item.role || fallback.role,
                videoUrl: fallback.videoUrl,
            };
        })
        : DEFAULT_ITEMS;

    const [activeIndex, setActiveIndex] = useState(0);
    const [popupVideoId, setPopupVideoId] = useState<string | null>(null);

    // Keep activeIndex within bounds if items change
    useEffect(() => {
        if (activeIndex >= items.length) {
            setActiveIndex(Math.max(0, items.length - 1));
        }
    }, [items.length]);

    // Keyboard navigation and ESC modal close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (popupVideoId) {
                if (e.key === 'Escape') setPopupVideoId(null);
                return;
            }
            if (e.key === 'ArrowLeft') {
                handlePrev();
            } else if (e.key === 'ArrowRight') {
                handleNext();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [popupVideoId, items.length]);

    const handlePrev = () => {
        setActiveIndex((prev) => Math.max(0, prev - 1));
    };

    const handleNext = () => {
        setActiveIndex((prev) => Math.min(items.length - 1, prev + 1));
    };

    const activeItem = items[activeIndex] || items[0];

    const handlePlayItem = (item: VideoTestimonialItem) => {
        const videoId = getYouTubeVideoId(item.videoUrl);
        if (videoId) {
            setPopupVideoId(videoId);
        } else if (item.videoUrl) {
            window.open(item.videoUrl, '_blank', 'noopener,noreferrer');
        }
    };

    // Helper to calculate effective thumbnail
    const getItemThumbnail = (item: VideoTestimonialItem): string => {
        if (item.thumbnailUrl && item.thumbnailUrl.trim()) {
            return getImageUrl(item.thumbnailUrl.trim());
        }
        const videoId = getYouTubeVideoId(item.videoUrl);
        if (videoId) {
            return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        }
        return 'https://placehold.co/640x360/0f172a/38bdf8?text=Video+Testimonial';
    };

    // Touch swipe support
    const touchStartX = useRef<number | null>(null);
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null) return;
        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchStartX.current - touchEndX;
        if (Math.abs(diff) > 40) {
            if (diff > 0) handleNext();
            else handlePrev();
        }
        touchStartX.current = null;
    };

    const total = items.length;

    // Separate preceding and following items (strictly non-looping, no duplicated cards)
    const leftItems: { item: VideoTestimonialItem; idx: number }[] = [];
    for (let i = 0; i < activeIndex; i++) {
        leftItems.push({ item: items[i], idx: i });
    }

    const rightItems: { item: VideoTestimonialItem; idx: number }[] = [];
    for (let i = activeIndex + 1; i < items.length; i++) {
        rightItems.push({ item: items[i], idx: i });
    }

    // Show up to 2 closest flankers on left and 2 on right
    const visibleLeft = leftItems.slice(-2);
    const visibleRight = rightItems.slice(0, 2);

    const renderFlankerStrip = (item: VideoTestimonialItem, targetIdx: number, size: 'normal' | 'small' = 'normal') => {
        if (!item) return null;
        const thumb = getItemThumbnail(item);
        const isSmall = size === 'small';

        return (
            <div
                key={`${item.id}-${targetIdx}-${size}`}
                onClick={() => setActiveIndex(targetIdx)}
                className={`group relative rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer border border-slate-700/60 dark:border-slate-800 shadow-xl hover:border-sky-400 hover:shadow-sky-500/30 transition-all duration-300 shrink-0 select-none ${
                    isSmall
                        ? 'hidden xl:block w-[52px] 2xl:w-[64px] h-[170px] sm:h-[230px] md:h-[260px] opacity-40 hover:opacity-85 scale-90'
                        : 'w-[44px] xs:w-[50px] sm:w-[68px] md:w-[82px] lg:w-[92px] h-[170px] xs:h-[195px] sm:h-[260px] md:h-[305px] lg:h-[340px] opacity-80 hover:opacity-100 hover:scale-[1.03]'
                }`}
                title={`View ${item.name}'s review`}
            >
                {/* Thumbnail Image */}
                <img
                    src={thumb}
                    alt={item.name}
                    className="w-full h-full object-cover filter brightness-[0.55] group-hover:brightness-[0.75] transition-all duration-300"
                    loading="lazy"
                />

                {/* Dark Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/85" />

                {/* Play Icon Badge on Top */}
                <div className="absolute top-2 sm:top-3 inset-x-0 flex justify-center z-10 pointer-events-none">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-black/50 border border-white/50 backdrop-blur-xs flex items-center justify-center text-white group-hover:bg-rose-600 group-hover:border-rose-400 group-hover:scale-110 transition-all">
                        <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-white text-white ml-0.5" />
                    </div>
                </div>

                {/* Prominent Vertical Student Name (Matching the uploaded image reference) */}
                <div className="absolute inset-0 flex items-center justify-center p-1 sm:p-2 pointer-events-none">
                    <span
                        className="text-white font-black text-xs sm:text-sm md:text-base tracking-wide whitespace-nowrap text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] group-hover:text-amber-300 transition-colors"
                        style={{
                            writingMode: 'vertical-rl',
                            transform: 'rotate(180deg)',
                        }}
                    >
                        {item.name}
                    </span>
                </div>
            </div>
        );
    };

    return (
        <section className="relative py-16 sm:py-24 bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-white overflow-hidden transition-colors duration-150 border-b border-slate-200 dark:border-slate-800">
            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-sky-500/10 dark:bg-sky-500/15 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute top-1/3 left-1/4 w-[400px] h-[250px] bg-[#CC1200]/5 dark:bg-[#CC1200]/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14 space-y-3">
                    {sectionTag && (
                        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/50 text-[#CC1200] dark:text-rose-400 text-xs font-bold uppercase tracking-wider shadow-2xs">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{sectionTag}</span>
                        </div>
                    )}

                    {sectionTitle && (
                        <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                            <span className="text-[#CC1200]">{sectionTitle}</span>
                        </h2>
                    )}

                    {sectionSub && (
                        <p className="text-xs sm:text-sm lg:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                            {sectionSub}
                        </p>
                    )}
                </div>

                {/* Coverflow Stage */}
                <div
                    className="relative w-full py-4 flex flex-col items-center justify-center select-none"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    {/* Navigation Buttons (Left & Right) */}
                    {items.length > 1 && (
                        <>
                            <button
                                type="button"
                                onClick={handlePrev}
                                disabled={activeIndex === 0}
                                aria-label="Previous Video"
                                className={`absolute left-1 sm:left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-xl text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all ${
                                    activeIndex === 0
                                        ? 'opacity-30 cursor-not-allowed pointer-events-none'
                                        : 'hover:bg-sky-50 dark:hover:bg-slate-800 hover:text-sky-600 hover:scale-105 active:scale-95 cursor-pointer'
                                }`}
                            >
                                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>

                            <button
                                type="button"
                                onClick={handleNext}
                                disabled={activeIndex === items.length - 1}
                                aria-label="Next Video"
                                className={`absolute right-1 sm:right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-xl text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all ${
                                    activeIndex === items.length - 1
                                        ? 'opacity-30 cursor-not-allowed pointer-events-none'
                                        : 'hover:bg-sky-50 dark:hover:bg-slate-800 hover:text-sky-600 hover:scale-105 active:scale-95 cursor-pointer'
                                }`}
                            >
                                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                        </>
                    )}

                    {/* Cards Visual Layer (Center active card flanked by vertical name strips) */}
                    <div className="relative w-full max-w-6xl mx-auto flex items-center justify-center gap-2 xs:gap-3 sm:gap-4 md:gap-5 px-2 overflow-visible">
                        {/* Left Flanker Strips (strictly existing items before activeIndex) */}
                        {visibleLeft.map((entry, vPos) => {
                            const isFar = visibleLeft.length > 1 && vPos === 0;
                            return renderFlankerStrip(entry.item, entry.idx, isFar ? 'small' : 'normal');
                        })}

                        {/* Center Active 16:9 Video Card */}
                        <div
                            className="relative w-[260px] xs:w-[310px] sm:w-[460px] md:w-[540px] lg:w-[620px] aspect-video rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border-2 border-slate-800 ring-4 ring-sky-500/20 cursor-pointer shrink-0 z-20 transition-all duration-300 group/center"
                            onClick={() => handlePlayItem(activeItem)}
                        >
                            {/* Video Thumbnail */}
                            <img
                                src={getItemThumbnail(activeItem)}
                                alt={activeItem.name}
                                className="w-full h-full object-cover group-hover/center:scale-102 transition-transform duration-500"
                                loading="lazy"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = 'https://placehold.co/640x360/0f172a/38bdf8?text=Video+Review';
                                }}
                            />

                            {/* Dark Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-black/10" />

                            {/* Central Large Play Button */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-full bg-white/25 backdrop-blur-md border-2 border-white/90 text-white flex items-center justify-center shadow-2xl group-hover/center:scale-115 group-hover/center:bg-rose-600 group-hover/center:border-rose-400 transition-all duration-300">
                                    <Play className="w-6 h-6 sm:w-8 sm:h-8 fill-white text-white ml-1 group-hover/center:scale-110 transition-transform" />
                                </div>
                            </div>

                            {/* Bottom Captions on Active Card */}
                            <div className="absolute bottom-0 inset-x-0 p-3 sm:p-5 text-left bg-gradient-to-t from-black/95 via-black/80 to-transparent">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-400 flex items-center justify-center shrink-0">
                                        <User className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-white font-black text-sm sm:text-lg md:text-xl line-clamp-1 drop-shadow-md">
                                            {activeItem.name}
                                        </h3>
                                        {activeItem.role && (
                                            <p className="text-slate-300 text-xs sm:text-sm line-clamp-1 font-medium mt-0.5 drop-shadow-sm">
                                                {activeItem.role}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Flanker Strips (strictly existing items after activeIndex) */}
                        {visibleRight.map((entry, vPos) => {
                            const isFar = visibleRight.length > 1 && vPos === 1;
                            return renderFlankerStrip(entry.item, entry.idx, isFar ? 'small' : 'normal');
                        })}
                    </div>

                    {/* Pagination Indicator Dots */}
                    {items.length > 1 && (
                        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-6 sm:mt-8">
                            {items.map((_, dotIdx) => (
                                <button
                                    key={dotIdx}
                                    type="button"
                                    onClick={() => setActiveIndex(dotIdx)}
                                    aria-label={`Go to slide ${dotIdx + 1}`}
                                    className={`transition-all duration-300 rounded-full cursor-pointer ${
                                        dotIdx === activeIndex
                                            ? 'w-6 sm:w-8 h-2 bg-sky-500 shadow-md shadow-sky-500/40'
                                            : 'w-2 h-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600'
                                    }`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Video Lightbox Popup Modal */}
            {popupVideoId && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
                    onClick={() => setPopupVideoId(null)}
                >
                    <div
                        className="relative max-w-4xl w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-black"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            type="button"
                            onClick={() => setPopupVideoId(null)}
                            aria-label="Close Video"
                            className="absolute top-3 right-3 z-20 p-2 rounded-full bg-black/70 hover:bg-rose-600 text-white transition-colors cursor-pointer border border-white/20"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* YouTube Embed Iframe */}
                        <iframe
                            className="w-full h-full"
                            src={`https://www.youtube-nocookie.com/embed/${popupVideoId}?autoplay=1&rel=0&modestbranding=1`}
                            title="YouTube video testimonial"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                        />
                    </div>
                </div>
            )}
        </section>
    );
};
