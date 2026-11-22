import React from 'react';
import { Link } from 'react-router-dom';
import { Course } from '../../types';
import { formatBDT, getImageUrl } from '../../api/client';
import {
    BookOpen,
    Video,
    Users,
    PlayCircle,
    ArrowRight,
    ShoppingCart,
    CheckCircle2,
    Microscope,
    FileText,
    Zap,
    Activity,
    Stethoscope,
    Sparkles
} from 'lucide-react';

interface ClinicalCourseCardProps {
    course: Course;
    addToCart: (course: Course) => void;
    isInCart: (courseId: number) => boolean;
}

export const ClinicalCourseCard: React.FC<ClinicalCourseCardProps> = ({
    course,
    addToCart,
    isInCart,
}) => {
    const thumbUrl = getImageUrl((course as any).thumbnail || course.thumbnail_url);
    const categoryName = course.categories?.[0]?.name;
    const isEnrolled = !!(course as any).is_enrolled;
    const enrolledCount = (course.fake_enrollment_count || 0) + (course.enrollments_count || 0);

    const effectivePrice = course.sale_price !== null && course.sale_price !== undefined && Number(course.sale_price) < Number(course.price)
        ? Number(course.sale_price)
        : (course.effective_price ?? Number(course.price));
    const hasDiscount = course.sale_price !== null && course.sale_price !== undefined && Number(course.sale_price) < Number(course.price);

    // Pick 4 clinical high-yield feature pills
    const customFeatures = Array.isArray(course.features) && course.features.length > 0
        ? course.features.filter((f: any) => typeof f === 'string' && f.trim().length > 0)
        : [];

    const feature1 = customFeatures[0] || 'Cadaveric Viscera Demo';
    const feature2 = customFeatures[1] || 'Marked Standard Books';
    const feature3 = customFeatures[2] || '10-Min Item Quick Deck';
    const feature4 = customFeatures[3] || 'OSPE & Spotter Station';

    const instructorName = course.instructors && course.instructors.length > 0
        ? course.instructors[0].name
        : (course.instructor?.name || 'Medical Faculty Lead');

    return (
        <div className="group relative bg-[#0B101D]/90 backdrop-blur-2xl rounded-[26px] border border-cyan-500/20 hover:border-cyan-400/70 shadow-xl hover:shadow-[0_0_40px_rgba(6,182,212,0.22)] transition-all duration-300 flex flex-col justify-between overflow-hidden">
            {/* Top Glowing Laser Hairline */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div>
                {/* 1. Clinical Dossier Header Bar */}
                <div className="px-5 pt-4 pb-2.5 flex items-center justify-between border-b border-cyan-500/10 text-[11px] font-mono">
                    <div className="flex items-center gap-2 text-cyan-300/80">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
                        </span>
                        <span className="tracking-wider uppercase font-bold truncate max-w-[170px]">
                            {categoryName ? `MED • ${categoryName.toUpperCase()}` : 'MED • 1ST PHASE'}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        {course.discount_percent && course.discount_percent > 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-extrabold text-[10px]">
                                SAVE {course.discount_percent}%
                            </span>
                        ) : course.price === 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-extrabold text-[10px]">
                                FREE
                            </span>
                        ) : (
                            <span className="px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/20 text-cyan-300/80 text-[10px] flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                                <span>BM&DC</span>
                            </span>
                        )}
                    </div>
                </div>

                {/* 2. Inset Specimen Screen / Tablet Aperture */}
                <div className="p-3.5 pb-0">
                    <Link
                        to={`/courses/${course.slug}`}
                        className="block relative aspect-[16/9.5] rounded-2xl overflow-hidden bg-slate-950 border border-cyan-500/15 group-hover:border-cyan-400/40 transition-colors shadow-inner"
                    >
                        {thumbUrl ? (
                            <img
                                src={thumbUrl}
                                alt={course.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                onError={(e) => {
                                    (e.currentTarget as HTMLElement).style.display = 'none';
                                    const fallback = (e.currentTarget.parentElement?.querySelector('.fallback-thumb') as HTMLElement);
                                    if (fallback) fallback.style.display = 'flex';
                                }}
                            />
                        ) : null}
                        <div className={`fallback-thumb w-full h-full ${thumbUrl ? 'hidden' : 'flex'} items-center justify-center bg-gradient-to-tr from-slate-950 via-slate-900 to-cyan-950 text-white`}>
                            <BookOpen className="w-10 h-10 text-cyan-400 opacity-60" />
                        </div>

                        {/* Floating HUD Badges on bottom of thumbnail */}
                        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/85 backdrop-blur-md border border-white/10 text-[11px] font-mono text-slate-200 shadow-md">
                                <Video className="w-3.5 h-3.5 text-cyan-400" />
                                <span>{course.lessons_count || 0} Lectures</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/85 backdrop-blur-md border border-white/10 text-[11px] font-mono text-emerald-300 shadow-md">
                                <Users className="w-3.5 h-3.5 text-emerald-400" />
                                <span>{enrolledCount} Enrolled</span>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* 3. Card Content */}
                <div className="p-5 pt-3.5 space-y-3.5">
                    {/* Course Title */}
                    <h3 className="text-base sm:text-lg font-black text-white group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug">
                        <Link to={`/courses/${course.slug}`}>
                            {course.title}
                        </Link>
                    </h3>

                    {/* Clinical Capabilities Matrix (2x2 Grid) */}
                    <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                        <div className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-1.5 truncate hover:border-cyan-500/40 transition-colors" title={feature1}>
                            <Microscope className="w-3 h-3 text-cyan-400 shrink-0" />
                            <span className="truncate">{feature1}</span>
                        </div>
                        <div className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-1.5 truncate hover:border-teal-500/40 transition-colors" title={feature2}>
                            <FileText className="w-3 h-3 text-teal-400 shrink-0" />
                            <span className="truncate">{feature2}</span>
                        </div>
                        <div className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-1.5 truncate hover:border-amber-500/40 transition-colors" title={feature3}>
                            <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                            <span className="truncate">{feature3}</span>
                        </div>
                        <div className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-1.5 truncate hover:border-emerald-500/40 transition-colors" title={feature4}>
                            <Activity className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span className="truncate">{feature4}</span>
                        </div>
                    </div>

                    {/* Faculty Mentor Strip */}
                    <div className="flex items-center gap-2 pt-1 text-xs text-slate-400 border-t border-slate-800/80">
                        <div className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 flex items-center justify-center shrink-0 text-[10px] font-bold">
                            <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
                        </div>
                        <span className="truncate">
                            Lead: <span className="font-bold text-slate-200">{instructorName}</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* 4. Unified Command Bar (Footer) */}
            <div className="p-5 pt-3 border-t border-cyan-500/10 flex items-center justify-between gap-3 bg-slate-950/40">
                {/* Price section */}
                <div>
                    <div className="text-[10px] uppercase font-mono text-slate-400 font-bold tracking-wider">Fee</div>
                    {isEnrolled ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-black text-sm font-mono">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>ENROLLED</span>
                        </span>
                    ) : course.price === 0 ? (
                        <span className="text-lg font-black text-emerald-400 font-mono">Free</span>
                    ) : (
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-black text-cyan-400 font-mono">
                                {formatBDT(effectivePrice)}
                            </span>
                            {hasDiscount && (
                                <span className="text-xs text-slate-500 line-through font-mono">
                                    {formatBDT(course.price)}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Smart Action Buttons */}
                <div className="flex items-center gap-2">
                    <Link
                        to={`/courses/${course.slug}`}
                        className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-400/50 text-slate-300 hover:text-white transition-all cursor-pointer"
                        title="View Course Details"
                    >
                        <ArrowRight className="w-4 h-4" />
                    </Link>

                    {isEnrolled ? (
                        <Link
                            to={`/learning/${course.id}`}
                            className="px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 font-mono"
                        >
                            <PlayCircle className="w-3.5 h-3.5" />
                            <span>CLASS</span>
                        </Link>
                    ) : (
                        <button
                            type="button"
                            onClick={() => addToCart(course)}
                            className={`px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg font-mono ${
                                isInCart(course.id)
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
                                    : 'bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:opacity-95 text-slate-950 shadow-cyan-500/25'
                            }`}
                        >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>{isInCart(course.id) ? 'IN CART' : 'ENROL'}</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
