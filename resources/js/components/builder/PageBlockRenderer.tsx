import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageBlock, Course, Category, CourseTabItem } from '../../types';
import { apiClient, formatBDT, getImageUrl } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { getLocalizedText } from '../../utils/localization';
import { PlyrVideoPlayer } from '../shared/PlyrVideoPlayer';
import {
    Sparkles,
    BookOpen,
    CheckCircle2,
    Users,
    PlayCircle,
    ArrowRight,
    Award,
    Clock,
    HelpCircle,
    Star,
    ShieldCheck,
    Zap,
    Heart,
    FileText,
    Code,
    Video,
    Boxes,
    Tag,
    ChevronDown,
    ChevronUp,
    GraduationCap,
    Flame,
    ClipboardList,
    ExternalLink,
    Plus,
    Minus,
    Check,
    ShoppingCart,
    Stethoscope,
    Activity,
    Microscope,
    HeartPulse,
    Dna,
    Search
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { StudentReviewsMarquee } from '../home/StudentReviewsMarquee';
import { VideoTestimonialsCoverflow } from '../home/VideoTestimonialsCoverflow';
import { ClinicalCourseCard } from '../shared/ClinicalCourseCard';

interface PageBlockRendererProps {
    block: PageBlock;
    isBuilder?: boolean; // if true, preview mode inside builder
    onSelectBlock?: () => void;
}

export const PageBlockRenderer: React.FC<PageBlockRendererProps> = ({
    block,
    isBuilder = false,
    onSelectBlock,
}) => {
    const s = block.settings || {};
    const styleProps: React.CSSProperties = {};
    if (s.bgColor) styleProps.backgroundColor = s.bgColor;
    if (s.textColor) styleProps.color = s.textColor;
    if (typeof s.paddingTop === 'number') styleProps.paddingTop = `${s.paddingTop}px`;
    if (typeof s.paddingBottom === 'number') styleProps.paddingBottom = `${s.paddingBottom}px`;
    if (s.textAlign) styleProps.textAlign = s.textAlign;

    const renderInner = () => {
        switch (block.type) {
            case 'top_announcement':
                return <TopAnnouncementBlock block={block} isBuilder={isBuilder} />;
            case 'hero':
                return <HeroBlock block={block} isBuilder={isBuilder} />;
            case 'heading':
                return <HeadingBlock block={block} isBuilder={isBuilder} />;
            case 'button':
                return <ButtonBlock block={block} isBuilder={isBuilder} />;
            case 'image':
                return <ImageBlock block={block} isBuilder={isBuilder} />;
            case 'divider':
                return <DividerBlock block={block} />;
            case 'spacer':
                return <SpacerBlock block={block} />;
            case 'bundle_showcase':
                return <BundleShowcaseBlock block={block} isBuilder={isBuilder} />;
            case 'course_tabs':
                return <CourseTabsBlock block={block} isBuilder={isBuilder} />;
            case 'teachers_showcase':
                return <TeachersShowcaseBlock block={block} isBuilder={isBuilder} />;
            case 'learning_path':
                return <LearningPathBlock block={block} isBuilder={isBuilder} />;
            case 'video_testimonials':
                return <VideoTestimonialsCoverflow settings={block.settings} isBuilder={isBuilder} />;
            case 'testimonials':
            case 'student_reviews_marquee':
                return <StudentReviewsMarquee settings={block.settings} isBuilder={isBuilder} />;
            case 'faq_accordion':
                return <FaqAccordionBlock block={block} isBuilder={isBuilder} />;
            case 'html_widget':
                return <HtmlWidgetBlock block={block} isBuilder={isBuilder} />;
            case 'features':
                return <FeaturesBlock block={block} isBuilder={isBuilder} />;
            case 'cta_banner':
                return <CtaBannerBlock block={block} isBuilder={isBuilder} />;
            case 'rich_text':
                return <RichTextBlock block={block} isBuilder={isBuilder} />;
            case 'video_embed':
                return <VideoEmbedBlock block={block} isBuilder={isBuilder} />;
            case 'stats_counter':
                return <StatsCounterBlock block={block} isBuilder={isBuilder} />;
            default:
                return (
                    <div className="p-6 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl text-center text-sm border border-dashed border-slate-300 dark:border-slate-700">
                        Unknown block type: {block.type}
                    </div>
                );
        }
    };

    return (
        <div
            id={s.htmlId || undefined}
            className={`elementor-block-wrapper ${s.customClass || ''}`}
            style={styleProps}
        >
            {s.scopedCss && <style>{s.scopedCss}</style>}
            {renderInner()}
        </div>
    );
};

/* -------------------------------------------------------------
 * 1. HERO BLOCK
 * ----------------------------------------------------------- */
const HeroBlock: React.FC<{ block: PageBlock; isBuilder?: boolean }> = ({ block }) => {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const s = block.settings || {};

    const [searchTopic, setSearchTopic] = useState('');
    const [cockpitMode, setCockpitMode] = useState<'dissection' | 'item' | 'textbooks'>('dissection');

    const badge = getLocalizedText(s.badge, s.badge_en, language) || 'CLINICAL STUDIO 2026-27 | BM&DC 1ST PHASE ACADEMIC SUITE';
    const titlePart1 = getLocalizedText(s.titlePart1, s.titlePart1_en, language) || 'Master Gross Anatomy, Physiology & Biochemistry';
    const titleHighlight = getLocalizedText(s.titleHighlight, s.titleHighlight_en, language) || 'From Daily Items & Cards To 1st Prof Honours';
    const titlePart2 = getLocalizedText(s.titlePart2, s.titlePart2_en, language) || '';
    const subtitle = getLocalizedText(s.subtitle, s.subtitle_en, language) || 'Research-grounded clinical lectures, cadaveric dissection theater, and line-by-line marked standard textbooks (BDC, Guyton, Ganong, Datta, Langman) designed for viva & OSPE mastery.';
    const browseCoursesBtn = getLocalizedText(s.browseCoursesBtn, s.browseCoursesBtn_en, language) || 'Explore Clinical Courses';
    const startFreeClassBtn = getLocalizedText(s.startFreeClassBtn, s.startFreeClassBtn_en, language) || 'Watch Viscera Demos';
    const trust1 = getLocalizedText(s.trust1, s.trust1_en, language) || '550+ Enrolled Doctors-in-Training';
    const trust2 = getLocalizedText(s.trust2, s.trust2_en, language) || '1,250+ High-Yield Medical Lectures';
    const trust3 = getLocalizedText(s.trust3, s.trust3_en, language) || 'BM&DC Syllabus 100% Covered';

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchTopic.trim()) {
            navigate(`/courses?search=${encodeURIComponent(searchTopic.trim())}`);
        } else {
            navigate('/courses');
        }
    };

    const handleTagClick = (tag: string) => {
        navigate(`/courses?search=${encodeURIComponent(tag)}`);
    };

    return (
        <section className="relative overflow-hidden bg-[#060913] text-white pt-12 sm:pt-20 pb-20 sm:pb-28 border-b border-cyan-500/10">
            {/* Ambient Medical Glow Mesh & Grid Backdrop */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(6,182,212,0.18),rgba(255,255,255,0))] pointer-events-none" />
            <div className="absolute top-1/4 -left-48 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/3 -right-48 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Subtle Electrocardiogram (ECG) Pulse Line SVG in Background */}
            <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 opacity-[0.06] pointer-events-none overflow-hidden select-none">
                <svg className="w-full h-48" viewBox="0 0 1200 200" fill="none" preserveAspectRatio="none">
                    <path
                        d="M0 100 L300 100 L320 60 L335 140 L350 40 L365 170 L380 90 L395 110 L410 100 L700 100 L720 60 L735 140 L750 40 L765 170 L780 90 L795 110 L810 100 L1200 100"
                        stroke="url(#ecg-gradient)"
                        strokeWidth="2.5"
                    />
                    <defs>
                        <linearGradient id="ecg-gradient" x1="0" y1="0" x2="1200" y2="0" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#06b6d4" stopOpacity="0.2" />
                            <stop offset="0.5" stopColor="#10b981" stopOpacity="0.8" />
                            <stop offset="1" stopColor="#06b6d4" stopOpacity="0.2" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* 1. Header Eyebrow & Badges */}
                <div className="text-center max-w-3xl mx-auto space-y-4">
                    <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono tracking-wider backdrop-blur-xl shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
                        </span>
                        <span>{badge}</span>
                    </div>

                    <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15]">
                        {titlePart1} <br />
                        <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(6,182,212,0.35)]">
                            {titleHighlight}
                        </span>
                        {titlePart2 && <><br /><span>{titlePart2}</span></>}
                    </h1>

                    <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
                        {subtitle}
                    </p>
                </div>

                {/* 2. Interactive Medical Search & Viva Finder Console */}
                <div className="mt-8 max-w-2xl mx-auto">
                    <form onSubmit={handleSearch} className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/30 via-emerald-500/30 to-cyan-500/30 rounded-2xl blur-md opacity-75 group-hover:opacity-100 transition duration-300" />
                        <div className="relative flex items-center bg-slate-950/90 border border-cyan-500/40 rounded-2xl p-1.5 sm:p-2 backdrop-blur-2xl shadow-2xl">
                            <div className="pl-3 sm:pl-4 pr-2 text-cyan-400">
                                <Search className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                value={searchTopic}
                                onChange={(e) => setSearchTopic(e.target.value)}
                                placeholder="Search organ, card, item, or textbook (e.g. Thorax, Guyton CVS, BDC Upper Limb)..."
                                className="w-full bg-transparent text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none"
                            />
                            <button
                                type="submit"
                                className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-md shadow-cyan-500/25 shrink-0 cursor-pointer flex items-center gap-1.5"
                            >
                                <span>Find Topic</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </form>

                    {/* Quick-Jump Neon Topic Pills */}
                    <div className="flex items-center justify-center gap-2 flex-wrap mt-3 text-xs">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                            <Activity className="w-3.5 h-3.5 text-cyan-400" />
                            Quick Vault:
                        </span>
                        {[
                            { label: '⚡ Thorax Card', tag: 'Thorax' },
                            { label: '🧬 Guyton CVS', tag: 'Physiology' },
                            { label: '🦴 Upper Limb', tag: 'Upper Limb' },
                            { label: '🔬 Histology OSPE', tag: 'Histology' },
                            { label: '🫁 Respi & Renal', tag: 'Renal' },
                            { label: '📚 Marked Books', tag: 'Anatomy' },
                        ].map((p, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => handleTagClick(p.tag)}
                                className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-700/80 hover:border-cyan-400/80 text-slate-300 hover:text-cyan-300 text-[11px] font-medium transition-all cursor-pointer backdrop-blur-md"
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. The Clinical Studio Cockpit (3-Mode Interactive Dark Glass Showcase) */}
                <div className="mt-12 sm:mt-16 max-w-5xl mx-auto">
                    <div className="bg-slate-950/70 border border-cyan-500/30 rounded-3xl p-4 sm:p-7 backdrop-blur-2xl shadow-[0_0_60px_-15px_rgba(6,182,212,0.2)]">
                        {/* Cockpit Mode Switcher Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4 mb-6">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                                <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                                <span className="ml-2 text-xs font-mono text-cyan-300 font-semibold uppercase tracking-wider hidden sm:inline">
                                    DoctorWallah Clinical Studio Console
                                </span>
                            </div>

                            {/* Cockpit Tabs */}
                            <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setCockpitMode('dissection')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                        cockpitMode === 'dissection'
                                            ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    <Activity className="w-3.5 h-3.5" />
                                    <span>Viscera & Dissection</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCockpitMode('item')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                        cockpitMode === 'item'
                                            ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    <Zap className="w-3.5 h-3.5" />
                                    <span>10-Min Item Deck</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCockpitMode('textbooks')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                        cockpitMode === 'textbooks'
                                            ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    <BookOpen className="w-3.5 h-3.5" />
                                    <span>Marked Books (Guyton & BDC)</span>
                                </button>
                            </div>
                        </div>

                        {/* Interactive Cockpit Viewports */}
                        {cockpitMode === 'dissection' && (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                                <div className="lg:col-span-7 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px] font-mono">
                                            LIVE CADAVERIC PREVIEW • THORAX CARD
                                        </span>
                                        <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                            1080p Ultra-HD Dissection
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-black text-white">
                                        Gross Anatomy & Organ Demonstration Lab
                                    </h3>
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                        Real cadaveric organ handling with live anatomical landmarks highlighted. Never get confused during OSPE or viva again.
                                    </p>
                                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                                        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-cyan-400" />
                                            <span className="text-xs font-medium text-slate-200">Aortic Arch & Branches</span>
                                        </div>
                                        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-teal-400" />
                                            <span className="text-xs font-medium text-slate-200">Pericardium & Sinuses</span>
                                        </div>
                                        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                            <span className="text-xs font-medium text-slate-200">Phrenic & Vagus Nerves</span>
                                        </div>
                                        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-amber-400" />
                                            <span className="text-xs font-medium text-slate-200">Hilus of Lungs & Relations</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="lg:col-span-5 space-y-4">
                                    <div className="bg-gradient-to-br from-cyan-950/60 to-slate-900/90 rounded-2xl border border-cyan-500/20 p-5 space-y-3">
                                        <div className="text-xs font-mono uppercase text-cyan-400 tracking-wider">
                                            Anatomical Advantage
                                        </div>
                                        <div className="text-xl font-black text-white">
                                            "Clear visualization is 90% of viva success."
                                        </div>
                                        <p className="text-xs text-slate-300 leading-relaxed">
                                            Our professors demonstrate every muscle origin-insertion, arterial anastomoses, and viscera impressions before oral examinations.
                                        </p>
                                        <Link
                                            to="/courses"
                                            className="inline-flex items-center gap-2 text-xs font-bold text-cyan-300 hover:text-cyan-200 underline pt-1"
                                        >
                                            <span>Explore Dissection Course Library</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        {cockpitMode === 'item' && (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                                <div className="lg:col-span-7 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-3.5">
                                    <div className="flex items-center justify-between">
                                        <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-mono">
                                            PANIC DECK • TOMORROW'S VIVA READY
                                        </span>
                                        <span className="text-xs font-semibold text-cyan-400">
                                            10-Minute Rapid Revision
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-black text-white">
                                        Top 5 Must-Ask Viva Questions for This Card
                                    </h3>
                                    <div className="space-y-2 text-xs">
                                        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                                            <span className="text-cyan-400 font-bold">Q1: </span>
                                            <span className="text-slate-200">Demonstrate anatomical position of heart and boundaries of transverse sinus.</span>
                                        </div>
                                        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                                            <span className="text-cyan-400 font-bold">Q2: </span>
                                            <span className="text-slate-200">What are the bronchopulmonary segments and their clinical significance?</span>
                                        </div>
                                        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                                            <span className="text-cyan-400 font-bold">Q3: </span>
                                            <span className="text-slate-200">Coronary blood supply: Right dominant vs left dominant circulation differences.</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="lg:col-span-5 bg-gradient-to-br from-amber-950/40 to-slate-900/90 rounded-2xl border border-amber-500/20 p-5 space-y-3">
                                    <div className="text-xs font-mono uppercase text-amber-400 tracking-wider">
                                        10-Min Viva Summary
                                    </div>
                                    <div className="text-xl font-black text-white">
                                        Save hours of sleep before oral exams.
                                    </div>
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                        Each item has a high-yield 10-minute recap video giving you the exact key phrases professors expect to hear at the viva table.
                                    </p>
                                    <Link
                                        to="/courses"
                                        className="inline-flex items-center gap-2 text-xs font-bold text-amber-300 hover:text-amber-200 underline pt-1"
                                    >
                                        <span>Unlock Item Viva Recaps</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            </div>
                        )}

                        {cockpitMode === 'textbooks' && (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                                <div className="lg:col-span-7 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono">
                                            PROFESSOR MARKINGS • GUYTON & BDC
                                        </span>
                                        <span className="text-xs font-semibold text-emerald-400">
                                            Direct Soft-Book Annotations
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-black text-white">
                                        Stop Reading Everything: Read What Gets You Honours
                                    </h3>
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                        Medical textbooks are 1,200+ pages long. Our mentors have marked every high-yield line, table, and clinical box in Guyton, Ganong, BDC, and Datta so you know exactly what to study.
                                    </p>
                                    <div className="grid grid-cols-3 gap-3 pt-1 text-center">
                                        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                                            <div className="text-sm font-black text-cyan-400">BDC Vol 1-4</div>
                                            <div className="text-[10px] text-slate-400 mt-0.5">Marked Gross Anatomy</div>
                                        </div>
                                        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                                            <div className="text-sm font-black text-emerald-400">Guyton 14th</div>
                                            <div className="text-[10px] text-slate-400 mt-0.5">Marked Medical Physio</div>
                                        </div>
                                        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                                            <div className="text-sm font-black text-amber-400">Harper & Datta</div>
                                            <div className="text-[10px] text-slate-400 mt-0.5">Biochem & Neuroanatomy</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="lg:col-span-5 bg-gradient-to-br from-emerald-950/40 to-slate-900/90 rounded-2xl border border-emerald-500/20 p-5 space-y-3">
                                    <div className="text-xs font-mono uppercase text-emerald-400 tracking-wider">
                                        Downloadable Materials
                                    </div>
                                    <div className="text-xl font-black text-white">
                                        Soft-copies included with every course.
                                    </div>
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                        Open directly on your iPad, tablet or laptop. Highlighted in yellow (Must Know for Prof) and pink (Item Viva Specials).
                                    </p>
                                    <Link
                                        to="/courses"
                                        className="inline-flex items-center gap-2 text-xs font-bold text-emerald-300 hover:text-emerald-200 underline pt-1"
                                    >
                                        <span>Browse Courses with Marked Textbooks</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Cockpit Bottom Actions & Metrics */}
                        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                            <div className="flex items-center gap-6 text-slate-400 font-medium">
                                <span className="flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                                    {trust1}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    {trust2}
                                </span>
                                <span className="flex items-center gap-1.5 hidden md:flex">
                                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                                    {trust3}
                                </span>
                            </div>

                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <Link
                                    to={s.browseCoursesLink || '/courses'}
                                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-cyan-500/20 flex items-center justify-center gap-2"
                                >
                                    <span>{browseCoursesBtn}</span>
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                                <Link
                                    to={s.startFreeClassLink || '/courses'}
                                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400/60 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-2"
                                >
                                    <PlayCircle className="w-4 h-4 text-cyan-400" />
                                    <span>{startFreeClassBtn}</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

/* -------------------------------------------------------------
 * 2. COURSE TABS & GRID BLOCK (Supports Category query OR Custom HTML Tab!)
 * ----------------------------------------------------------- */
const CourseTabsBlock: React.FC<{ block: PageBlock; isBuilder?: boolean }> = ({ block, isBuilder }) => {
    const { t, language } = useLanguage();
    const { addToCart, isInCart } = useCart();
    const s = block.settings || {};

    const headingTag = getLocalizedText(s.headingTag, s.headingTag_en, language) || t.courses.headingTag;
    const headingTitle = getLocalizedText(s.headingTitle, s.headingTitle_en, language) || t.courses.headingTitle;
    const viewAllText = getLocalizedText(s.viewAllText, s.viewAllText_en, language) || t.courses.viewAll;
    const allTabLabel = getLocalizedText(s.allTabLabel, s.allTabLabel_en, language) || t.courses.allTab;

    const rawTabs: CourseTabItem[] = s.tabs || [
        { id: 'tab_all', label: allTabLabel, type: 'category', categorySlug: 'all' }
    ];

    const configuredTabs = rawTabs.map(tab => ({
        ...tab,
        label: tab.id === 'tab_all' ? allTabLabel : getLocalizedText(tab.label, (tab as any).label_en, language)
    }));

    const [activeTabId, setActiveTabId] = useState<string>(configuredTabs[0]?.id || 'tab_all');
    const [courses, setCourses] = useState<Course[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    const activeTab = configuredTabs.find(t => t.id === activeTabId) || configuredTabs[0];

    const sortBy = s.sortBy || 'best_selling';

    useEffect(() => {
        // Fetch categories for pill counts or dynamic category display if enabled
        const fetchInitial = async () => {
            try {
                const initialCategory = activeTab?.type === 'category' && activeTab?.categorySlug && activeTab?.categorySlug !== 'all'
                    ? `&category=${encodeURIComponent(activeTab.categorySlug)}`
                    : '';
                const [coursesRes, catsRes] = await Promise.all([
                    apiClient.get(`/courses?per_page=${s.limit || 12}&sort=${sortBy}${initialCategory}`),
                    apiClient.get('/categories'),
                ]);
                setCourses(coursesRes.data.data || []);
                const allCats: Category[] = catsRes.data || [];
                // Filter out free-courses and paid-courses pseudo categories
                const filteredCats = allCats.filter(c => c.slug !== 'free-courses' && c.slug !== 'paid-courses');
                // If selectedCategorySlugs is specified in settings, filter by it
                if (Array.isArray(s.selectedCategorySlugs) && s.selectedCategorySlugs.length > 0) {
                    setCategories(filteredCats.filter(c => s.selectedCategorySlugs.includes(c.slug)));
                } else {
                    setCategories(filteredCats);
                }
            } catch {
                // error handling
            } finally {
                setLoading(false);
            }
        };
        fetchInitial();
    }, [s.limit, s.selectedCategorySlugs, sortBy]);

    // When tab changes, if it is a category tab, fetch courses for that category
    const handleTabClick = async (tab: CourseTabItem) => {
        setActiveTabId(tab.id);
        if (tab.type === 'category') {
            setLoading(true);
            try {
                const slug = tab.categorySlug || 'all';
                const url = slug === 'all'
                    ? `/courses?per_page=${s.limit || 12}&sort=${sortBy}`
                    : `/courses?per_page=${s.limit || 12}&sort=${sortBy}&category=${encodeURIComponent(slug)}`;
                const res = await apiClient.get(url);
                setCourses(res.data.data || []);
            } catch {
                // error
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <section className="bg-[#060913] text-white py-16 sm:py-20 border-b border-cyan-500/10 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-semibold uppercase tracking-wider mb-3">
                            <Activity className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{headingTag || 'BM&DC 1ST PHASE CURRICULUM'}</span>
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                            {headingTitle || 'Flagship MBBS Courses & Card Batches'}
                        </h2>
                    </div>
                    {viewAllText && (
                        <Link
                            to={s.viewAllLink || '/courses'}
                            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                            <span>{viewAllText}</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    )}
                </div>

                {/* Configured Tabs Bar */}
                <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-thin">
                    {configuredTabs.map((tab) => {
                        const isSelected = activeTabId === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => handleTabClick(tab)}
                                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${isSelected
                                    ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-black shadow-lg shadow-cyan-500/30'
                                    : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 shadow-2xs'
                                    }`}
                            >
                                <span>{tab.label}</span>
                                {tab.type === 'html' && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${isSelected ? 'bg-black/30 text-slate-900 font-bold' : 'bg-cyan-950 text-cyan-300'
                                        }`}>
                                        HTML
                                    </span>
                                )}
                            </button>
                        );
                    })}

                    {/* If dynamic categories enabled in settings, also show database categories */}
                    {s.dynamicCategories && categories.map((cat) => {
                        const isSelected = activeTab?.type === 'category' && activeTab?.categorySlug === cat.slug;
                        return (
                            <button
                                key={`cat_${cat.id}`}
                                type="button"
                                onClick={() => {
                                    const customTab: CourseTabItem = {
                                        id: `dyn_cat_${cat.id}`,
                                        label: cat.name,
                                        type: 'category',
                                        categorySlug: cat.slug,
                                    };
                                    handleTabClick(customTab);
                                }}
                                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${isSelected
                                    ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-black shadow-lg shadow-cyan-500/30'
                                    : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 shadow-2xs'
                                    }`}
                            >
                                <span>{cat.name}</span>
                                {cat.courses_count !== undefined && cat.courses_count > 0 && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-black/30 text-slate-900 font-bold' : 'bg-slate-800 text-slate-400'
                                        }`}>
                                        {cat.courses_count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* TAB CONTENT: EITHER CUSTOM HTML WIDGET OR COURSES GRID */}
                {activeTab?.type === 'html' ? (
                    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-xs">
                        {activeTab.cssContent && (
                            <style>{activeTab.cssContent}</style>
                        )}
                        <div
                            dangerouslySetInnerHTML={{
                                __html: activeTab.htmlContent || `<div class="text-center text-slate-400 py-8">Add custom HTML widget content...</div>`
                            }}
                        />
                    </div>
                ) : (
                    /* Course Cards Grid */
                    <div>
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {[1, 2, 3].map((n) => (
                                    <div key={n} className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 animate-pulse space-y-4">
                                        <div className="h-48 bg-slate-800 rounded-xl" />
                                        <div className="h-6 bg-slate-800 rounded w-3/4" />
                                        <div className="h-4 bg-slate-800 rounded w-1/2" />
                                    </div>
                                ))}
                            </div>
                        ) : courses.length === 0 ? (
                            <div className="text-center py-12 bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400 space-y-2">
                                <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
                                <p className="font-semibold">{t.courses.emptyCourses}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                                {courses.map((course) => (
                                    <ClinicalCourseCard
                                        key={course.id}
                                        course={course}
                                        addToCart={addToCart}
                                        isInCart={isInCart}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
};

/* -------------------------------------------------------------
 * 3. CUSTOM HTML & CSS WIDGET (Elementor Pro style raw HTML/CSS)
 * ----------------------------------------------------------- */
const HtmlWidgetBlock: React.FC<{ block: PageBlock; isBuilder?: boolean }> = ({ block }) => {
    const { language } = useLanguage();
    const s = block.settings || {};
    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {s.cssContent && (
                <style>{s.cssContent}</style>
            )}
            <div
                dangerouslySetInnerHTML={{
                    __html: s.htmlContent || `<div class="p-8 bg-slate-100 text-slate-400 rounded-2xl text-center text-sm font-mono">Custom HTML/CSS Widget Preview...</div>`
                }}
            />
        </section>
    );
};

/* -------------------------------------------------------------
 * 4. FEATURES GRID BLOCK (The Clinical Vault - Dark Glass Bento Grid)
 * ----------------------------------------------------------- */
const FeaturesBlock: React.FC<{ block: PageBlock; isBuilder?: boolean }> = ({ block }) => {
    const { t, language } = useLanguage();
    const s = block.settings || {};

    const sectionTag = getLocalizedText(s.sectionTag, s.sectionTag_en, language) || 'THE CLINICAL VAULT • 4 CORE ADVANTAGES';
    const sectionTitle = getLocalizedText(s.sectionTitle, s.sectionTitle_en, language) || 'Scientific Learning Architecture for 1st Prof Honours';
    const sectionSub = getLocalizedText(s.sectionSub, s.sectionSub_en, language) || 'We bridge textbook theory, cadaveric dissection, and clinical viva questions to ensure distinction marks in your college examinations.';

    return (
        <section className="bg-[#070B14] text-white py-20 sm:py-28 relative overflow-hidden border-b border-cyan-500/10">
            {/* Ambient background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-cyan-500/5 rounded-full blur-[140px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
                    <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-semibold uppercase tracking-wider shadow-sm">
                        <Activity className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{sectionTag}</span>
                    </span>
                    <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
                        {sectionTitle}
                    </h2>
                    <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
                        {sectionSub}
                    </p>
                </div>

                {/* The Asymmetric Dark Glass Bento Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* BENTO TILE 1: Large (Span 7) - Virtual Dissection & Viscera Theater */}
                    <div className="lg:col-span-7 bg-slate-900/60 backdrop-blur-2xl border border-cyan-500/20 hover:border-cyan-400/50 rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 group shadow-[0_0_50px_-20px_rgba(6,182,212,0.15)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/15 transition-all" />

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
                                    <Activity className="w-6 h-6" />
                                </div>
                                <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px] font-mono uppercase tracking-wider">
                                    PILLAR 01 • ANATOMY
                                </span>
                            </div>

                            <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-cyan-300 transition-colors">
                                Cadaveric Dissection & Viscera 3D Theater
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                                Don't just imagine structures in 2D. Watch high-definition dissection recordings where mentors hold real viscera, trace arterial courses, and point out exact structures asked in OSPE and oral examinations.
                            </p>

                            {/* Anatomical Tags */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-center">
                                    <span className="text-[11px] font-mono text-cyan-300 font-semibold">Thoracic Viscera</span>
                                </div>
                                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-center">
                                    <span className="text-[11px] font-mono text-teal-300 font-semibold">Abdomen Organs</span>
                                </div>
                                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-center">
                                    <span className="text-[11px] font-mono text-emerald-300 font-semibold">Head & Neck</span>
                                </div>
                                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-center">
                                    <span className="text-[11px] font-mono text-amber-300 font-semibold">Extremities</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between">
                            <span className="text-xs text-slate-400 font-medium">Included with all Anatomy courses</span>
                            <Link to="/courses" className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                <span>Watch Preview</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </div>

                    {/* BENTO TILE 2: Small (Span 5) - The 10-Minute Item Panic Station */}
                    <div className="lg:col-span-5 bg-slate-900/60 backdrop-blur-2xl border border-amber-500/20 hover:border-amber-400/50 rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 group shadow-[0_0_50px_-20px_rgba(245,158,11,0.15)] relative overflow-hidden">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                                    <Zap className="w-6 h-6" />
                                </div>
                                <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-mono uppercase tracking-wider">
                                    PILLAR 02 • SPEED
                                </span>
                            </div>

                            <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-amber-300 transition-colors">
                                10-Minute Item Panic Station
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                                Viva tomorrow morning at 8:00 AM? Don't panic. Watch our 10-minute concentrated item recaps covering the 15 exact questions professors ask before handing you your signature.
                            </p>

                            <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-1.5 text-xs">
                                <div className="flex items-center gap-2 text-slate-300">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                                    <span>High-frequency viva questions from DMC, SSMC & CMC</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-300">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Exact anatomical definitions & relations</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between">
                            <span className="text-xs text-slate-400 font-medium">Night-before revision</span>
                            <Link to="/courses" className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                <span>Try Item Recap</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </div>

                    {/* BENTO TILE 3: Small (Span 5) - Professor-Marked Textbooks */}
                    <div className="lg:col-span-5 bg-slate-900/60 backdrop-blur-2xl border border-emerald-500/20 hover:border-emerald-400/50 rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 group shadow-[0_0_50px_-20px_rgba(16,185,129,0.15)] relative overflow-hidden">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                                    <BookOpen className="w-6 h-6" />
                                </div>
                                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono uppercase tracking-wider">
                                    PILLAR 03 • TEXTBOOKS
                                </span>
                            </div>

                            <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-emerald-300 transition-colors">
                                Professor-Marked Standard Books
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                                Complete soft-copy books with lines already marked by experienced doctors. Yellow for must-know written topics, Pink for tricky oral viva questions.
                            </p>

                            <div className="grid grid-cols-2 gap-2 text-center text-xs">
                                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                                    <div className="font-bold text-emerald-400">Guyton 14th Ed</div>
                                    <div className="text-[10px] text-slate-400">Marked Physio</div>
                                </div>
                                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                                    <div className="font-bold text-cyan-400">BDC Anatomy</div>
                                    <div className="text-[10px] text-slate-400">All 4 Volumes</div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between">
                            <span className="text-xs text-slate-400 font-medium">PDF Soft Copies Included</span>
                            <Link to="/courses" className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                <span>Get Marked Books</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </div>

                    {/* BENTO TILE 4: Large (Span 7) - Real-Time Model Tests & OSPE Simulator */}
                    <div className="lg:col-span-7 bg-slate-900/60 backdrop-blur-2xl border border-rose-500/20 hover:border-rose-400/50 rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 group shadow-[0_0_50px_-20px_rgba(244,63,94,0.15)] relative overflow-hidden">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                                    <ClipboardList className="w-6 h-6" />
                                </div>
                                <span className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] font-mono uppercase tracking-wider">
                                    PILLAR 04 • EVALUATION
                                </span>
                            </div>

                            <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-rose-300 transition-colors">
                                Real-Time 1st Prof Model Tests & OSPE Stations
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                                Practice realistic clinical MCQs and Single Best Answer (SBA) questions with negative marking, timed countdowns, and instant nationwide medical college merit rankings.
                            </p>

                            <div className="grid grid-cols-3 gap-2.5 pt-1 text-center text-xs">
                                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                                    <div className="text-sm font-black text-rose-400">BM&DC</div>
                                    <div className="text-[10px] text-slate-400">Standard Pattern</div>
                                </div>
                                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                                    <div className="text-sm font-black text-amber-400">Instant</div>
                                    <div className="text-[10px] text-slate-400">Solution Analysis</div>
                                </div>
                                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                                    <div className="text-sm font-black text-emerald-400">Nationwide</div>
                                    <div className="text-[10px] text-slate-400">Merit Position</div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between">
                            <span className="text-xs text-slate-400 font-medium">Card & Term Exam Hall</span>
                            <Link to="/courses" className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                <span>Start Model Test</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

/* -------------------------------------------------------------
 * 5. CTA BANNER BLOCK (Dark Glass Clinical Terminal)
 * ----------------------------------------------------------- */
const CtaBannerBlock: React.FC<{ block: PageBlock; isBuilder?: boolean }> = ({ block }) => {
    const { language } = useLanguage();
    const s = block.settings || {};

    const badge = getLocalizedText(s.badge, s.badge_en, language) || 'MBBS 2026 ADMISSION OPEN';
    const title = getLocalizedText(s.title, s.title_en, language) || 'Join Bangladesh\'s #1 MBBS Academic Platform Today';
    const subtitle = getLocalizedText(s.subtitle, s.subtitle_en, language) || 'From day-to-day item viva clearance to 1st Prof Honours, DoctorWallah is your constant academic mentor.';
    const buttonText = getLocalizedText(s.buttonText, s.buttonText_en, language) || 'Enroll in MBBS Batch';
    const buttonLink = s.buttonLink || '/courses';

    return (
        <section className="bg-[#050811] py-16 sm:py-24 relative overflow-hidden border-t border-cyan-500/10">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="bg-slate-900/80 border border-cyan-500/30 rounded-3xl p-8 sm:p-14 text-center space-y-6 backdrop-blur-2xl shadow-[0_0_80px_-20px_rgba(6,182,212,0.25)] relative overflow-hidden">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono tracking-wider">
                        <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{badge}</span>
                    </div>

                    <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                        {title}
                    </h2>

                    <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
                        {subtitle}
                    </p>

                    <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            to={buttonLink}
                            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black text-sm sm:text-base transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <span>{buttonText}</span>
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link
                            to="/courses"
                            className="w-full sm:w-auto px-6 py-4 rounded-xl bg-slate-950 border border-slate-700 hover:border-cyan-400/60 text-slate-300 hover:text-white font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <PlayCircle className="w-5 h-5 text-cyan-400" />
                            <span>Watch Demo Classes</span>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

/* -------------------------------------------------------------
 * 6. RICH TEXT / POLICY CONTENT BLOCK
 * ----------------------------------------------------------- */
const RichTextBlock: React.FC<{ block: PageBlock; isBuilder?: boolean }> = ({ block }) => {
    const { language } = useLanguage();
    const s = block.settings || {};
    const content = getLocalizedText(s.content, s.content_en, language) || '<p>Add content here...</p>';

    return (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div
                className="prose prose-slate dark:prose-invert lg:prose-lg max-w-none prose-headings:font-black prose-headings:text-slate-900 dark:prose-headings:text-white prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-p:leading-relaxed"
                dangerouslySetInnerHTML={{ __html: content }}
            />
        </section>
    );
};

/* -------------------------------------------------------------
 * 7. VIDEO EMBED BLOCK WITH PLYR.JS
 * ----------------------------------------------------------- */
const VideoEmbedBlock: React.FC<{ block: PageBlock; isBuilder?: boolean }> = ({ block }) => {
    const { language } = useLanguage();
    const s = block.settings || {};

    const title = getLocalizedText(s.title, s.title_en, language);
    const subtitle = getLocalizedText(s.subtitle, s.subtitle_en, language);

    return (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {(title || subtitle) && (
                <div className="text-center mb-8 space-y-2">
                    {title && <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">{title}</h2>}
                    {subtitle && <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">{subtitle}</p>}
                </div>
            )}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-black">
                {s.videoUrl ? (
                    <PlyrVideoPlayer
                        url={s.videoUrl}
                        title={title || 'Video Player'}
                        className="w-full h-full"
                    />
                ) : (
                    <div className="w-full aspect-video flex flex-col items-center justify-center text-slate-400">
                        <PlayCircle className="w-16 h-16 text-slate-600 mb-2" />
                        <span className="text-sm">
                            Please provide a video link
                        </span>
                    </div>
                )}
            </div>
        </section>
    );
};

/* -------------------------------------------------------------
 * 8. STATS COUNTER BLOCK
 * ----------------------------------------------------------- */
const StatsCounterBlock: React.FC<{ block: PageBlock; isBuilder?: boolean }> = ({ block }) => {
    const { language } = useLanguage();
    const s = block.settings || {};

    const defaultStats = [
        { label: 'Enrolled Students', value: '10,000+' },
        { label: 'Recorded Lectures', value: '500+' },
        { label: 'Total Courses', value: '20+' },
        { label: 'Success Rate', value: '98%' },
    ];

    const rawStats = s.stats || defaultStats;
    const stats = rawStats.map((stat: any) => ({
        value: getLocalizedText(stat.value, stat.value_en, language) || stat.value,
        label: getLocalizedText(stat.label, stat.label_en, language) || stat.label,
    }));

    return (
        <section className="bg-slate-50 dark:bg-slate-900/60 border-y border-slate-200/80 dark:border-slate-800 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                    {stats.map((stat: any, idx: number) => (
                        <div key={idx} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs space-y-1">
                            <div className="text-3xl sm:text-4xl font-black text-sky-600 dark:text-sky-400">{stat.value}</div>
                            <div className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

/* -------------------------------------------------------------
 * 9. TOP ANNOUNCEMENT RIBBON BLOCK
 * ----------------------------------------------------------- */
const TopAnnouncementBlock: React.FC<{ block: PageBlock; isBuilder?: boolean }> = ({ block }) => {
    const { language } = useLanguage();
    const s = block.settings || {};
    const badge = getLocalizedText(s.badge, s.badge_en, language) || '🩺 MBBS 2026 Batch';
    const text = getLocalizedText(s.text, s.text_en, language) || 'Admissions open for MBBS 1st Phase, Cards & Term All-in-One Programs! Access 1,250+ video lectures & marked standard books.';
    const linkText = getLocalizedText(s.linkText, s.linkText_en, language) || 'Explore MBBS Courses →';
    const linkUrl = s.linkUrl || '/courses';

    return (
        <div className="bg-[#040711] border-b border-cyan-500/20 text-slate-200 text-xs sm:text-sm py-2.5 px-4 font-semibold text-center flex items-center justify-center gap-2 relative z-10 shadow-lg shadow-cyan-950/50 backdrop-blur-md">
            {badge && (
                <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
                </span>
            )}
            <span className="text-cyan-300 font-mono text-[11px] sm:text-xs font-bold uppercase">{badge}:</span>
            <span className="text-slate-300 font-medium text-xs sm:text-sm">{text}</span>
            {linkText && (
                <Link to={linkUrl} className="underline font-bold text-cyan-400 hover:text-cyan-300 transition-colors ml-1 hidden sm:inline">
                    {linkText}
                </Link>
            )}
        </div>
    );
};

/* -------------------------------------------------------------
 * 10. HEADING BLOCK
 * ----------------------------------------------------------- */
const HeadingBlock: React.FC<{ block: PageBlock; isBuilder?: boolean }> = ({ block }) => {
    const { language } = useLanguage();
    const s = block.settings || {};
    const title = getLocalizedText(s.title, s.title_en, language) || 'Heading Title';
    const subtitle = getLocalizedText(s.subtitle, s.subtitle_en, language);
    const tag = s.tag || 'h2';
    const align = s.align || 'center';
    const size = s.size || '3xl';
    const color = s.color || '';

    const alignClass = align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center';
    const sizeMap: Record<string, string> = {
        sm: 'text-lg sm:text-xl',
        md: 'text-xl sm:text-2xl',
        lg: 'text-2xl sm:text-3xl',
        xl: 'text-3xl sm:text-4xl',
        '2xl': 'text-4xl sm:text-5xl',
        '3xl': 'text-4xl sm:text-5xl lg:text-6xl',
    };
    const sizeClass = sizeMap[size] || 'text-3xl sm:text-4xl';

    const HeadingTag = tag as keyof JSX.IntrinsicElements;

    return (
        <div className={`py-6 px-4 max-w-7xl mx-auto ${alignClass}`}>
            {subtitle && (
                <div className="text-xs sm:text-sm font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 mb-2">
                    {subtitle}
                </div>
            )}
            <HeadingTag className={`font-black tracking-tight text-slate-900 dark:text-white ${sizeClass} ${color}`}>
                {title}
            </HeadingTag>
        </div>
    );
};

/* -------------------------------------------------------------
 * 11. BUTTON BLOCK
 * ----------------------------------------------------------- */
const ButtonBlock: React.FC<{ block: PageBlock; isBuilder?: boolean }> = ({ block }) => {
    const { language } = useLanguage();
    const s = block.settings || {};
    const text = getLocalizedText(s.text, s.text_en, language) || 'Click Here';
    const link = s.link || '#';
    const align = s.align || 'center';
    const variant = s.variant || 'gradient';
    const size = s.size || 'md';
    const target = s.target || '_self';

    const alignClass = align === 'left' ? 'justify-start' : align === 'right' ? 'justify-end' : 'justify-center';
    const sizeClass = size === 'sm' ? 'px-4 py-2 text-xs' : size === 'lg' ? 'px-8 py-4 text-base' : 'px-6 py-3 text-sm';

    let variantClass = 'bg-gradient-to-r from-sky-500 via-sky-600 to-sky-700 text-white hover:from-sky-600 hover:to-sky-800 shadow-md shadow-sky-600/30';
    if (variant === 'primary') variantClass = 'bg-sky-600 text-white hover:bg-sky-700 shadow-md';
    if (variant === 'secondary') variantClass = 'bg-amber-500 text-white hover:bg-amber-600 shadow-md';
    if (variant === 'outline') variantClass = 'border-2 border-sky-600 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40';
    if (variant === 'dark') variantClass = 'bg-slate-900 text-white hover:bg-slate-800 shadow-md';

    return (
        <div className={`py-4 px-4 max-w-7xl mx-auto flex ${alignClass}`}>
            <Link
                to={link}
                target={target}
                className={`inline-flex items-center gap-2 rounded-xl font-bold transition-all cursor-pointer ${sizeClass} ${variantClass}`}
            >
                <span>{text}</span>
                <ArrowRight className="w-4 h-4" />
            </Link>
        </div>
    );
};

/* -------------------------------------------------------------
 * 12. IMAGE BLOCK
 * ----------------------------------------------------------- */
const ImageBlock: React.FC<{ block: PageBlock; isBuilder?: boolean }> = ({ block }) => {
    const s = block.settings || {};
    const url = s.imageUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&auto=format&fit=crop&q=80';
    const alt = s.alt || 'Image';
    const caption = s.caption;
    const align = s.align || 'center';
    const rounded = s.rounded || '2xl';
    const maxWidth = s.maxWidth || '100%';

    const alignClass = align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center';
    const roundedClass = rounded === 'full' ? 'rounded-full' : rounded === 'none' ? 'rounded-none' : rounded === 'md' ? 'rounded-md' : 'rounded-2xl';

    return (
        <div className={`py-6 px-4 max-w-7xl mx-auto ${alignClass}`}>
            <div className="inline-block" style={{ maxWidth }}>
                {s.link ? (
                    <Link to={s.link}>
                        <img src={getImageUrl(url)} alt={alt} className={`w-full h-auto shadow-lg border border-slate-200 dark:border-slate-800 ${roundedClass}`} />
                    </Link>
                ) : (
                    <img src={getImageUrl(url)} alt={alt} className={`w-full h-auto shadow-lg border border-slate-200 dark:border-slate-800 ${roundedClass}`} />
                )}
                {caption && <p className="text-xs text-slate-500 mt-2 italic">{caption}</p>}
            </div>
        </div>
    );
};

/* -------------------------------------------------------------
 * 13. DIVIDER BLOCK
 * ----------------------------------------------------------- */
const DividerBlock: React.FC<{ block: PageBlock }> = ({ block }) => {
    const s = block.settings || {};
    const width = s.width || '100%';
    const align = s.align || 'center';
    const style = s.style || 'solid';
    const color = s.color || '#e2e8f0';

    const alignClass = align === 'left' ? 'mr-auto' : align === 'right' ? 'ml-auto' : 'mx-auto';

    return (
        <div className="py-4 px-4 max-w-7xl mx-auto">
            <hr className={alignClass} style={{ width, borderTopStyle: style, borderTopColor: color, borderTopWidth: '1px' }} />
        </div>
    );
};

/* -------------------------------------------------------------
 * 14. SPACER BLOCK
 * ----------------------------------------------------------- */
const SpacerBlock: React.FC<{ block: PageBlock }> = ({ block }) => {
    const s = block.settings || {};
    const height = Number(s.height || 40);
    return <div style={{ height: `${height}px` }} className="w-full" />;
};

/* -------------------------------------------------------------
 * 15. COURSE BUNDLES SHOWCASE BLOCK (Dark Glass Clinical Packages)
 * ----------------------------------------------------------- */
const BundleShowcaseBlock: React.FC<{ block: PageBlock; isBuilder?: boolean }> = ({ block }) => {
    const { language } = useLanguage();
    const s = block.settings || {};
    const sectionTag = getLocalizedText(s.sectionTag, s.sectionTag_en, language) || 'PHASE-1 ALL-IN-ONE BUNDLES';
    const sectionTitle = getLocalizedText(s.sectionTitle, s.sectionTitle_en, language) || 'Complete Card & Term Preparation Suites';
    const sectionSub = getLocalizedText(s.sectionSub, s.sectionSub_en, language) || 'Combine Anatomy, Physiology, and Biochemistry in one all-inclusive bundle with maximum savings.';
    const limit = Number(s.limit || 4);

    const [bundles, setBundles] = useState<any[]>([]);

    useEffect(() => {
        const fetchBundles = async () => {
            try {
                const res = await apiClient.get('/bundles/featured');
                setBundles((res.data?.bundles || []).slice(0, limit));
            } catch { }
        };
        fetchBundles();
    }, [limit]);

    if (bundles.length === 0) return null;

    return (
        <section className="py-16 sm:py-24 bg-[#070B14] text-white border-b border-cyan-500/10 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
                    {sectionTag && (
                        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono uppercase tracking-wider">
                            <Boxes className="w-3.5 h-3.5 text-amber-400" />
                            <span>{sectionTag}</span>
                        </div>
                    )}
                    <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                        {sectionTitle}
                    </h2>
                    {sectionSub && (
                        <p className="text-sm sm:text-base text-slate-300">
                            {sectionSub}
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bundles.map((bundle) => {
                        const discount = bundle.regular_price > bundle.sale_price
                            ? Math.round(((bundle.regular_price - bundle.sale_price) / bundle.regular_price) * 100)
                            : 0;

                        return (
                            <div
                                key={bundle.id}
                                className="bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-amber-500/30 hover:border-amber-400 p-6 flex flex-col justify-between shadow-[0_0_35px_-10px_rgba(245,158,11,0.15)] hover:shadow-[0_0_45px_-5px_rgba(245,158,11,0.25)] transition-all duration-300 relative group overflow-hidden"
                            >
                                {discount > 0 && (
                                    <div className="absolute top-4 right-4 bg-rose-600 text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-md">
                                        {discount}% OFF
                                    </div>
                                )}
                                <div>
                                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4">
                                        <Boxes className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-black text-white mb-2 group-hover:text-amber-300 transition-colors">
                                        {bundle.title}
                                    </h3>
                                    {bundle.short_description && (
                                        <p className="text-xs text-slate-300 line-clamp-2 mb-4 leading-relaxed">
                                            {bundle.short_description}
                                        </p>
                                    )}

                                    {Array.isArray(bundle.courses) && bundle.courses.length > 0 && (
                                        <div className="space-y-1.5 mb-6 pt-3 border-t border-slate-800">
                                            <span className="text-[11px] font-mono text-cyan-300 font-semibold uppercase tracking-wider block">
                                                Included Courses ({bundle.courses.length}):
                                            </span>
                                            {bundle.courses.slice(0, 3).map((c: any) => (
                                                <div key={c.id} className="text-xs text-slate-300 flex items-center gap-2">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                                    <span className="truncate">{c.title}</span>
                                                </div>
                                            ))}
                                            {bundle.courses.length > 3 && (
                                                <div className="text-[11px] text-amber-400 font-bold pl-5">
                                                    + {bundle.courses.length - 3} more courses
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                                    <div>
                                        <div className="text-xs text-slate-500 line-through">
                                            {formatBDT(bundle.regular_price)}
                                        </div>
                                        <div className="text-2xl font-black text-amber-400">
                                            {formatBDT(bundle.sale_price)}
                                        </div>
                                    </div>
                                    <Link
                                        to={`/checkout/${bundle.slug}?type=bundle`}
                                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/30 flex items-center gap-1.5 transition-all"
                                    >
                                        <span>Get Bundle</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

/* -------------------------------------------------------------
 * 16. FACULTY & TEACHERS SHOWCASE BLOCK (Dark Glass Studio)
 * ----------------------------------------------------------- */
const TeachersShowcaseBlock: React.FC<{ block: PageBlock; isBuilder?: boolean }> = ({ block }) => {
    const { language } = useLanguage();
    const s = block.settings || {};
    const sectionTag = getLocalizedText(s.sectionTag, s.sectionTag_en, language) || 'MEDICAL FACULTY';
    const sectionTitle = getLocalizedText(s.sectionTitle, s.sectionTitle_en, language) || 'Learn from Top Medical Educators';
    const sectionSub = getLocalizedText(s.sectionSub, s.sectionSub_en, language) || 'Experienced medical mentors from premier medical colleges (DMC, CMC, SSMC, SOMC) guiding you through Items, Cards & 1st Prof.';
    const limit = Number(s.limit || 8);

    const [teachers, setTeachers] = useState<any[]>([]);
    const [filter, setFilter] = useState<'all' | 'anatomy' | 'physiology' | 'biochemistry' | 'clinical'>('all');

    useEffect(() => {
        const fetchTeachers = async () => {
            try {
                const res = await apiClient.get('/teachers/featured');
                const list = res.data?.data || res.data?.teachers || [];
                setTeachers(list.slice(0, limit));
            } catch { }
        };
        fetchTeachers();
    }, [limit]);

    if (teachers.length === 0) return null;

    const filtered = teachers.filter((t) => {
        if (filter === 'all') return true;
        const text = `${t.expertise || ''} ${t.designation || ''} ${t.bio || ''}`.toLowerCase();
        if (filter === 'anatomy') return text.includes('anat') || text.includes('dissect') || text.includes('viscera');
        if (filter === 'physiology') return text.includes('physio') || text.includes('guyton');
        if (filter === 'biochemistry') return text.includes('biochem') || text.includes('harper');
        if (filter === 'clinical') return text.includes('clinic') || text.includes('viva') || text.includes('prof');
        return true;
    });

    return (
        <section className="py-16 sm:py-24 bg-[#060913] text-white border-b border-cyan-500/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
                    {sectionTag && (
                        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono uppercase tracking-wider">
                            <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{sectionTag}</span>
                        </div>
                    )}
                    <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                        {sectionTitle}
                    </h2>
                    {sectionSub && (
                        <p className="text-sm sm:text-base text-slate-300">
                            {sectionSub}
                        </p>
                    )}

                    {/* Filter Pills */}
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
                        {[
                            { key: 'all', label: 'All Faculty' },
                            { key: 'anatomy', label: 'Anatomy' },
                            { key: 'physiology', label: 'Physiology' },
                            { key: 'biochemistry', label: 'Biochemistry' },
                            { key: 'clinical', label: 'Clinical & Viva' },
                        ].map((btn) => (
                            <button
                                key={btn.key}
                                type="button"
                                onClick={() => setFilter(btn.key as any)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${filter === btn.key
                                    ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-black shadow-md shadow-cyan-500/20'
                                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                                    }`}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                    {filtered.map((t) => (
                        <div
                            key={t.id}
                            className="bg-slate-900/60 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-slate-800 hover:border-cyan-500/50 p-3 sm:p-5 text-center shadow-sm hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] transition-all group flex flex-col justify-between"
                        >
                            <div>
                                <div className="relative w-20 h-20 sm:w-28 sm:h-28 mx-auto mb-3 sm:mb-4 rounded-xl sm:rounded-2xl overflow-hidden bg-slate-950 border-2 border-cyan-500/20 group-hover:border-cyan-400/50 transition-colors">
                                    {t.photo_url ? (
                                        <img src={getImageUrl(t.photo_url)} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-cyan-400 font-black text-xl sm:text-2xl">
                                            {t.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <h3 className="font-bold text-xs sm:text-base text-white mb-0.5 group-hover:text-cyan-300 transition-colors line-clamp-1">
                                    {t.name}
                                </h3>
                                <p className="text-[10px] sm:text-xs font-semibold text-cyan-400 line-clamp-1">
                                    {t.designation || 'Medical Faculty Lead'}
                                </p>
                                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 line-clamp-1">
                                    {t.institution || 'DMC / SSMC / CMC'}
                                </p>
                            </div>
                            <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-slate-800">
                                <Link
                                    to={`/teachers/${t.id}`}
                                    className="text-[11px] sm:text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center justify-center gap-1"
                                >
                                    <span>View Profile</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

/* -------------------------------------------------------------
 * 17. LEARNING PATH / METHODOLOGY BLOCK (Dark Glass 4-Step Blueprint)
 * ----------------------------------------------------------- */
const LearningPathBlock: React.FC<{ block: PageBlock; isBuilder?: boolean }> = ({ block }) => {
    const { language } = useLanguage();
    const s = block.settings || {};
    const sectionTag = getLocalizedText(s.sectionTag, s.sectionTag_en, language) || 'METHODOLOGY • 4-STEP SYSTEM';
    const sectionTitle = getLocalizedText(s.sectionTitle, s.sectionTitle_en, language) || '4-Step Scientific System for Guaranteed 1st Prof Preparation';
    const sectionSub = getLocalizedText(s.sectionSub, s.sectionSub_en, language) || 'A structured blueprint from conceptual mastery to oral viva distinction.';

    const defaultSteps = [
        { id: '1', num: '01', title: 'Conceptual Clarity & Item Mastery', desc: 'Every topic explained thoroughly from standard books (BDC, Guyton, Harper) with 3D models and viscera demo.' },
        { id: '2', num: '02', title: 'Cadaveric Dissection & Histology', desc: 'High-yield demonstrations of muscles, nerves, vessels and viscera landmarks for OSPE.' },
        { id: '3', num: '03', title: 'Marked Textbooks & Item Viva Qs', desc: 'Directly marked lines, card viva questions, and high-yield past Prof questions ready for review.' },
        { id: '4', num: '04', title: 'Card & Term Standard Model Tests', desc: 'Clinical MCQs, SBA questions, and structured written tests with nationwide medical college rankings.' },
    ];
    const steps = s.steps || defaultSteps;

    return (
        <section className="py-16 sm:py-24 bg-[#070B14] text-white border-b border-cyan-500/10 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
                    {sectionTag && (
                        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono uppercase tracking-wider">
                            <Activity className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{sectionTag}</span>
                        </div>
                    )}
                    <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                        {sectionTitle}
                    </h2>
                    {sectionSub && (
                        <p className="text-sm sm:text-base text-slate-300">
                            {sectionSub}
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {steps.map((st: any, idx: number) => (
                        <div
                            key={st.id || idx}
                            className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl border border-cyan-500/20 hover:border-cyan-400/50 shadow-sm hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] transition-all relative overflow-hidden group"
                        >
                            <div className="text-3xl font-mono font-black text-cyan-400/40 group-hover:text-cyan-400 mb-3 transition-colors">
                                {st.num || `0${idx + 1}`}
                            </div>
                            <h3 className="text-base sm:text-lg font-black text-white mb-2 group-hover:text-cyan-300 transition-colors">
                                {st.title}
                            </h3>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                {st.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

/* -------------------------------------------------------------
 * 18. TESTIMONIALS / STUDENT REVIEWS BLOCK
 * ----------------------------------------------------------- */
const TestimonialsBlock: React.FC<{ block: PageBlock; isBuilder?: boolean }> = ({ block }) => {
    const { language } = useLanguage();
    const s = block.settings || {};
    const sectionTag = getLocalizedText(s.sectionTag, s.sectionTag_en, language) || 'Student Reviews';
    const sectionTitle = getLocalizedText(s.sectionTitle, s.sectionTitle_en, language) || 'Success Stories from Our Students';
    const sectionSub = getLocalizedText(s.sectionSub, s.sectionSub_en, language) || 'Hear authentic experiences and achievements from DoctorWallah learners.';

    const defaultItems = [
        {
            id: '1',
            name: 'Tanveer Ahmed',
            role: 'Dhaka Medical College (DMC), K-79',
            rating: 5,
            quote: 'Gross Anatomy and Thorax dissection classes completely transformed my card preparation. Cleared 1st Prof with Honours marks!'
        },
        {
            id: '2',
            name: 'Sadia Afrin',
            role: 'Chittagong Medical College (CMC)',
            rating: 5,
            quote: 'Guyton and Ganong Physiology concepts were so clear. The 10-minute item quick revision before viva saved me every single card.'
        },
        {
            id: '3',
            name: 'Farhan Kabir',
            role: 'Sir Salimullah Medical College (SSMC)',
            rating: 5,
            quote: 'The marked PDF soft-books and OSPE viscera stations gave me unmatched confidence during clinical practicals.'
        },
    ];
    const items = s.items || defaultItems;

    return (
        <section className="py-16 sm:py-24 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
                    {sectionTag && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-bold uppercase tracking-wider">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span>{sectionTag}</span>
                        </div>
                    )}
                    <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                        {sectionTitle}
                    </h2>
                    {sectionSub && (
                        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                            {sectionSub}
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {items.map((item: any, idx: number) => (
                        <div
                            key={item.id || idx}
                            className="bg-slate-50 dark:bg-slate-900 p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between"
                        >
                            <div className="space-y-4">
                                <div className="flex items-center gap-1 text-amber-400">
                                    {[...Array(item.rating || 5)].map((_, i) => (
                                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                                    ))}
                                </div>
                                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">
                                    "{item.quote}"
                                </p>
                            </div>
                            <div className="pt-5 mt-5 border-t border-slate-200/60 dark:border-slate-800">
                                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                                    {item.name}
                                </h4>
                                <p className="text-xs text-sky-600 dark:text-sky-400 font-semibold">
                                    {item.role}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

/* -------------------------------------------------------------
 * 19. FAQ ACCORDION BLOCK
 * ----------------------------------------------------------- */
const FaqAccordionBlock: React.FC<{ block: PageBlock; isBuilder?: boolean }> = ({ block }) => {
    const { language } = useLanguage();
    const s = block.settings || {};
    const sectionTag = getLocalizedText(s.sectionTag, s.sectionTag_en, language) || 'Frequently Asked Questions';
    const sectionTitle = getLocalizedText(s.sectionTitle, s.sectionTitle_en, language) || 'Common Inquiries Answered';
    const sectionSub = getLocalizedText(s.sectionSub, s.sectionSub_en, language) || 'Everything you need to know about course enrollment, classes, and exams.';

    const defaultFaqs = [
        {
            id: '1',
            q: 'How do I enroll in a course on DoctorWallah?',
            a: 'Click the "Enroll Now" button on any course card, select your payment method (bKash, Nagad, Rocket, or Card), complete the payment, and your enrollment will be instantly activated.'
        },
        {
            id: '2',
            q: 'Are recorded classes and lecture sheets provided with live classes?',
            a: 'Yes, every live class is archived in full HD and accessible anytime until the final exam date, along with chapter lecture notes and question banks.'
        },
        {
            id: '3',
            q: 'How does the NexPilot AI Doubt Solver assist learning?',
            a: 'NexPilot is a 24/7 curriculum-aligned AI assistant. Whenever you are stuck on a problem or formula, chat instantly to clarify concepts in seconds.'
        },
        {
            id: '4',
            q: 'How do online model tests and rankings work?',
            a: 'Exams are timed with negative marking mirroring board and admission standards. Immediately upon submission, you receive automated scores, answer explanations, and your merit ranking.'
        },
    ];
    const items = s.items || defaultFaqs;
    const [openIdx, setOpenIdx] = useState<number | null>(0);

    return (
        <section className="py-16 sm:py-24 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
                    {sectionTag && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-xs font-bold uppercase tracking-wider">
                            <HelpCircle className="w-3.5 h-3.5 text-sky-600" />
                            <span>{sectionTag}</span>
                        </div>
                    )}
                    <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                        {sectionTitle}
                    </h2>
                    {sectionSub && (
                        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                            {sectionSub}
                        </p>
                    )}
                </div>

                <div className="space-y-3.5">
                    {items.map((faq: any, idx: number) => {
                        const isOpen = openIdx === idx;
                        return (
                            <div
                                key={faq.id || idx}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs transition-colors"
                            >
                                <button
                                    type="button"
                                    onClick={() => setOpenIdx(isOpen ? null : idx)}
                                    className="w-full text-left p-5 flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-900 dark:text-white cursor-pointer hover:text-sky-600 transition-colors"
                                >
                                    <span>{faq.q}</span>
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform ${isOpen ? 'bg-sky-100 text-sky-600 rotate-180 dark:bg-sky-950' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                                        }`}>
                                        <ChevronDown className="w-4 h-4" />
                                    </div>
                                </button>
                                {isOpen && (
                                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};
