import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient, getImageUrl } from '../../api/client';
import { CustomPage, PageBlock, BlockType, CourseTabItem, Category } from '../../types';
import { PageBlockRenderer } from '../../components/builder/PageBlockRenderer';
import { MediaPickerModal } from '../../components/shared/MediaPickerModal';
import { getDefaultMarqueeReviews } from '../../components/home/StudentReviewsMarquee';
import { getYouTubeVideoId } from '../../components/home/VideoTestimonialsCoverflow';
import {
    ArrowLeft,
    Save,
    Eye,
    Monitor,
    Tablet,
    Smartphone,
    Plus,
    Sliders,
    Layers,
    Trash2,
    Copy,
    ChevronUp,
    ChevronDown,
    Code,
    Check,
    Sparkles,
    BookOpen,
    Award,
    HelpCircle,
    Zap,
    Video,
    BarChart3,
    FileText,
    PanelLeftClose,
    PanelLeftOpen,
    ExternalLink,
    AlertCircle,
    GripVertical,
    Search,
    Type,
    Image as ImageIcon,
    MousePointerClick,
    Minus,
    MoveVertical,
    GraduationCap,
    Flame,
    MessageSquare,
    Star,
    Boxes,
    RefreshCw,
    Palette,
    Clock
} from 'lucide-react';

/* -------------------------------------------------------------
 * DropZone Component for Drag and Drop Target Slots
 * ----------------------------------------------------------- */
interface DropZoneProps {
    index: number;
    isDragging: boolean;
    isActive: boolean;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent) => void;
    onQuickAdd?: () => void;
}

const DropZone: React.FC<DropZoneProps> = ({
    isDragging,
    isActive,
    onDragOver,
    onDragLeave,
    onDrop,
    onQuickAdd,
}) => {
    return (
        <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`transition-all duration-200 relative z-30 ${isDragging
                ? isActive
                    ? 'py-4 my-2'
                    : 'py-2 my-1'
                : 'py-1 my-0'
                }`}
        >
            {isDragging ? (
                <div
                    className={`flex items-center justify-center rounded-xl border-2 border-dashed transition-all pointer-events-none ${isActive
                        ? 'h-16 bg-sky-500/20 border-sky-500 text-sky-600 scale-[1.01] shadow-lg ring-4 ring-sky-500/20'
                        : 'h-7 bg-sky-50/50 border-sky-300 text-sky-500/70'
                        }`}
                >
                    <div className="flex items-center gap-2 text-xs font-bold">
                        <Plus className={`w-4 h-4 ${isActive ? 'animate-bounce text-sky-600' : ''}`} />
                        <span>{isActive ? 'Drop Here' : 'Drop Zone'}</span>
                    </div>
                </div>
            ) : onQuickAdd ? (
                <div className="opacity-0 hover:opacity-100 transition-opacity flex justify-center -my-2.5">
                    <button
                        type="button"
                        onClick={onQuickAdd}
                        className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white font-bold text-[10px] rounded-full shadow-md flex items-center gap-1 cursor-pointer"
                    >
                        <Plus className="w-3 h-3" />
                        <span>Add Widget Here</span>
                    </button>
                </div>
            ) : null}
        </div>
    );
};

/* -------------------------------------------------------------
 * ELEMENTOR PRO WIDGET CATALOG DEFINITION
 * ----------------------------------------------------------- */
interface WidgetDef {
    type: BlockType;
    name: string;
    description: string;
    category: 'Basic' | 'Pro & Marketing' | 'NovoNex LMS';
    icon: React.ComponentType<{ className?: string }>;
    iconBg: string;
    iconColor: string;
}

const WIDGET_CATALOG: WidgetDef[] = [
    // --- BASIC ---
    {
        type: 'heading',
        name: 'Heading',
        description: 'Eye-catching titles & headlines',
        category: 'Basic',
        icon: Type,
        iconBg: 'bg-indigo-500/20',
        iconColor: 'text-indigo-400',
    },
    {
        type: 'rich_text',
        name: 'Text Editor',
        description: 'Rich paragraphs & policies',
        category: 'Basic',
        icon: FileText,
        iconBg: 'bg-purple-500/20',
        iconColor: 'text-purple-400',
    },
    {
        type: 'button',
        name: 'Button',
        description: 'Call to action button',
        category: 'Basic',
        icon: MousePointerClick,
        iconBg: 'bg-sky-500/20',
        iconColor: 'text-sky-400',
    },
    {
        type: 'image',
        name: 'Image Banner',
        description: 'Responsive images & banners',
        category: 'Basic',
        icon: ImageIcon,
        iconBg: 'bg-emerald-500/20',
        iconColor: 'text-emerald-400',
    },
    {
        type: 'video_embed',
        name: 'Video (Plyr)',
        description: 'Clean video player (YouTube/Vimeo)',
        category: 'Basic',
        icon: Video,
        iconBg: 'bg-red-500/20',
        iconColor: 'text-red-400',
    },
    {
        type: 'divider',
        name: 'Divider Line',
        description: 'Horizontal separator line',
        category: 'Basic',
        icon: Minus,
        iconBg: 'bg-slate-700/40',
        iconColor: 'text-slate-300',
    },
    {
        type: 'spacer',
        name: 'Spacer',
        description: 'Vertical whitespace gap',
        category: 'Basic',
        icon: MoveVertical,
        iconBg: 'bg-slate-700/40',
        iconColor: 'text-slate-300',
    },
    // --- PRO & MARKETING ---
    {
        type: 'hero',
        name: 'Hero Banner',
        description: 'Headline, dual CTAs & trust badges',
        category: 'Pro & Marketing',
        icon: Sparkles,
        iconBg: 'bg-blue-500/20',
        iconColor: 'text-blue-400',
    },
    {
        type: 'top_announcement',
        name: 'Campaign Ribbon',
        description: 'Top notice & announcement bar',
        category: 'Pro & Marketing',
        icon: Flame,
        iconBg: 'bg-amber-500/20',
        iconColor: 'text-amber-400',
    },
    {
        type: 'features',
        name: 'Why Choose Us',
        description: 'Feature value cards',
        category: 'Pro & Marketing',
        icon: Award,
        iconBg: 'bg-teal-500/20',
        iconColor: 'text-teal-400',
    },
    {
        type: 'cta_banner',
        name: 'CTA Banner',
        description: 'Conversion banner with button',
        category: 'Pro & Marketing',
        icon: Zap,
        iconBg: 'bg-rose-500/20',
        iconColor: 'text-rose-400',
    },
    {
        type: 'stats_counter',
        name: 'Stats Counter',
        description: 'Animated numbers & metrics',
        category: 'Pro & Marketing',
        icon: BarChart3,
        iconBg: 'bg-cyan-500/20',
        iconColor: 'text-cyan-400',
    },
    {
        type: 'learning_path',
        name: 'Learning Path',
        description: 'Step-by-step preparation flow',
        category: 'Pro & Marketing',
        icon: Layers,
        iconBg: 'bg-violet-500/20',
        iconColor: 'text-violet-400',
    },
    {
        type: 'testimonials',
        name: 'Testimonials',
        description: 'Student quotes & rating reviews',
        category: 'Pro & Marketing',
        icon: MessageSquare,
        iconBg: 'bg-amber-500/20',
        iconColor: 'text-amber-400',
    },
    {
        type: 'video_testimonials',
        name: 'Video Testimonials',
        description: '3D coverflow video reviews slider',
        category: 'Pro & Marketing',
        icon: Video,
        iconBg: 'bg-rose-500/20',
        iconColor: 'text-rose-400',
    },
    {
        type: 'faq_accordion',
        name: 'FAQ Accordion',
        description: 'Expandable Q&A accordion',
        category: 'Pro & Marketing',
        icon: HelpCircle,
        iconBg: 'bg-emerald-500/20',
        iconColor: 'text-emerald-400',
    },
    // --- NOVONEX LMS ---
    {
        type: 'course_tabs',
        name: 'Course Tabs & Grid',
        description: 'Category filter tabs & live course cards',
        category: 'NovoNex LMS',
        icon: BookOpen,
        iconBg: 'bg-sky-500/20',
        iconColor: 'text-sky-400',
    },
    {
        type: 'bundle_showcase',
        name: 'Course Bundles',
        description: 'Combo package showcase grid',
        category: 'NovoNex LMS',
        icon: Boxes,
        iconBg: 'bg-indigo-500/20',
        iconColor: 'text-indigo-400',
    },
    {
        type: 'teachers_showcase',
        name: 'Faculty Mentors',
        description: 'Teacher profiles & university tags',
        category: 'NovoNex LMS',
        icon: GraduationCap,
        iconBg: 'bg-orange-500/20',
        iconColor: 'text-orange-400',
    },
    {
        type: 'html_widget',
        name: 'Custom HTML/CSS',
        description: 'Embed arbitrary code & styles',
        category: 'NovoNex LMS',
        icon: Code,
        iconBg: 'bg-amber-500/20',
        iconColor: 'text-amber-400',
    },
];

export const AdminPageBuilderPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();

    const [page, setPage] = useState<CustomPage | null>(null);
    const [blocks, setBlocks] = useState<PageBlock[]>([]);
    const [customCss, setCustomCss] = useState<string>('');
    const [status, setStatus] = useState<'published' | 'draft'>('published');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Drag & Drop States
    const [isDragging, setIsDragging] = useState(false);
    const [draggedWidgetType, setDraggedWidgetType] = useState<BlockType | null>(null);
    const [draggedBlockIndex, setDraggedBlockIndex] = useState<number | null>(null);
    const [activeDropZoneIndex, setActiveDropZoneIndex] = useState<number | null>(null);

    // Categories list for course tab selector
    const [dbCategories, setDbCategories] = useState<Category[]>([]);

    // Device preview: desktop (100%), tablet (768px), mobile (375px)
    const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

    // Canvas scroll ref & smooth scroll helpers
    const mainCanvasRef = useRef<HTMLElement>(null);
    const canvasFrameRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (canvasFrameRef.current) {
            canvasFrameRef.current.scrollTo({
                top: canvasFrameRef.current.scrollHeight,
                behavior: 'smooth',
            });
        }
        if (mainCanvasRef.current) {
            mainCanvasRef.current.scrollTo({
                top: mainCanvasRef.current.scrollHeight,
                behavior: 'smooth',
            });
        }
    };

    const scrollToTop = () => {
        if (canvasFrameRef.current) {
            canvasFrameRef.current.scrollTo({
                top: 0,
                behavior: 'smooth',
            });
        }
        if (mainCanvasRef.current) {
            mainCanvasRef.current.scrollTo({
                top: 0,
                behavior: 'smooth',
            });
        }
    };

    // Sidebar state: 'widgets' | 'inspector' | 'css'
    const [activeSidebarTab, setActiveSidebarTab] = useState<'widgets' | 'inspector' | 'css'>('widgets');
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Selected block for editing
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

    // Widget search in elements panel
    const [widgetSearch, setWidgetSearch] = useState('');

    // Resetting state
    const [resetting, setResetting] = useState(false);

    // Testimonial Media & Screenshot Management States
    const [testimonialMediaPickerOpen, setTestimonialMediaPickerOpen] = useState(false);
    const [manualImageUrl, setManualImageUrl] = useState('');
    const [loadingMediaReviews, setLoadingMediaReviews] = useState(false);
    const [videoThumbnailPickerIndex, setVideoThumbnailPickerIndex] = useState<number | null>(null);

    // Inspector 3 sub-tabs: 'content' | 'style' | 'advanced'
    const [inspectorSubTab, setInspectorSubTab] = useState<'content' | 'style' | 'advanced'>('content');

    const handleResetTemplate = async () => {
        if (!page) return;
        if (!confirm('Are you sure you want to reset all sections to the default template? Any custom modifications will be replaced with standard sections.')) return;
        setResetting(true);
        try {
            const { data } = await apiClient.post(`/admin/pages/${page.id}/reset-template`);
            setBlocks(data.page.blocks || []);
            showToast(data.message || 'Sections reset to default template!');
            if (data.page.blocks && data.page.blocks.length > 0) {
                setSelectedBlockId(data.page.blocks[0].id);
            }
        } catch {
            showToast('Failed to reset template');
        } finally {
            setResetting(false);
        }
    };

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    useEffect(() => {
        fetchPage();
        fetchCategories();
    }, [id]);

    const fetchCategories = async () => {
        try {
            const { data } = await apiClient.get('/categories');
            setDbCategories(data || []);
        } catch { }
    };

    const fetchPage = async () => {
        try {
            const { data } = await apiClient.get(`/admin/pages/${id}`);
            const p = data.page;
            setPage(p);
            setBlocks(Array.isArray(p.blocks) ? p.blocks : []);
            setCustomCss(p.custom_css || '');
            setStatus(p.status || 'published');
            if (p.blocks && p.blocks.length > 0) {
                setSelectedBlockId(p.blocks[0].id);
            }
        } catch (err) {
            // error
        } finally {
            setLoading(false);
        }
    };

    // Keyboard shortcut Ctrl + S to save
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [page, blocks, customCss, status]);

    const handleSave = async () => {
        if (!page) return;
        setSaving(true);
        try {
            await apiClient.put(`/admin/pages/${page.id}`, {
                title: page.title,
                slug: page.slug,
                status: status,
                blocks: blocks,
                custom_css: customCss,
                meta_title: page.meta_title,
                meta_description: page.meta_description,
            });
            if (page.slug === 'home') {
                try {
                    sessionStorage.removeItem('novonex_home_custom_page');
                } catch {}
            }
            showToast('Saved successfully!');
            alert('Saved successfully!');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to save design.');
        } finally {
            setSaving(false);
        }
    };

    /* -------------------------------------------------------------
     * BLOCK ACTIONS
     * ----------------------------------------------------------- */
    const handleAddBlock = (type: BlockType, insertIndex?: number) => {
        const newBlockId = `block_${type}_${Date.now()}`;
        let newBlock: PageBlock;

        switch (type) {
            case 'hero':
                newBlock = {
                    id: newBlockId,
                    type: 'hero',
                    title: 'Hero Banner',
                    settings: {
                        badge: 'Admissions Open for New Batch',
                        titlePart1: 'Learn with Top Educators',
                        titleHighlight: 'Easily and Effectively',
                        titlePart2: 'Study & Exam Preparation',
                        subtitle: 'Comprehensive guidelines and round-the-clock doubt solving to help you succeed in exams.',
                        browseCoursesBtn: 'Browse All Courses',
                        browseCoursesLink: '/courses',
                        startFreeClassBtn: 'Start Free Class',
                        startFreeClassLink: '/courses',
                        trust1: '10,000+ Students',
                        trust2: 'Lifetime Access',
                        trust3: '24/7 Doubt Solving',
                        cardBadge: 'Live Status',
                        physicsTitle: 'HSC Physics',
                        physicsSub: 'Video & Chapter-wise Notes',
                        teachersTitle: 'Experienced Faculty',
                        teachersSub: 'Top University Educators',
                        studyMatTitle: 'Study Materials',
                        studyMatSub: 'Handnotes & Model Tests',
                        joinTodayBtn: 'Join Today',
                    }
                };
                break;

            case 'course_tabs':
                newBlock = {
                    id: newBlockId,
                    type: 'course_tabs',
                    title: 'Course Tabs & Grid',
                    settings: {
                        headingTag: 'Courses',
                        headingTitle: 'Popular Premium & Special Courses',
                        viewAllText: 'All Courses',
                        viewAllLink: '/courses',
                        limit: 12,
                        sortBy: 'best_selling',
                        showAllTab: true,
                        allTabLabel: 'All Courses',
                        dynamicCategories: false,
                        selectedCategorySlugs: dbCategories
                            .filter(c => c.slug !== 'free-courses' && c.slug !== 'paid-courses')
                            .map(c => c.slug),
                        tabs: [
                            { id: 'tab_all', label: 'All Courses', type: 'category', categorySlug: 'all' },
                            ...dbCategories
                                .filter(c => c.slug !== 'free-courses' && c.slug !== 'paid-courses')
                                .slice(0, 5)
                                .map(c => ({
                                    id: `tab_${c.slug}`,
                                    label: c.name,
                                    type: 'category' as const,
                                    categorySlug: c.slug,
                                }))
                        ]
                    }
                };
                break;

            case 'html_widget':
                newBlock = {
                    id: newBlockId,
                    type: 'html_widget',
                    title: 'Custom HTML & CSS',
                    settings: {
                        containerWidth: 'boxed',
                        bgColor: '#ffffff',
                        html: '<div class="p-8 text-center bg-sky-50 rounded-2xl border border-sky-200">\n  <h2 class="text-2xl font-bold text-sky-900 mb-2">Custom HTML Widget</h2>\n  <p class="text-slate-600">You can add your custom HTML code and styling here.</p>\n</div>',
                        css: '/* Custom scoped CSS */\n',
                    }
                };
                break;

            case 'features':
                newBlock = {
                    id: newBlockId,
                    type: 'features',
                    title: 'Why Choose Us',
                    settings: {
                        sectionTag: 'Our Highlights',
                        sectionTitle: 'Why Choose NovoNex?',
                        sectionSub: 'We don\'t just deliver videos; we build conceptual mastery.',
                        items: [
                            { id: '1', icon: 'Award', title: 'Expert Faculty', desc: 'Lectures prepared under direct supervision of top university professors.' },
                            { id: '2', icon: 'HelpCircle', title: 'Dedicated Doubt Solving', desc: 'Ask questions directly beneath every lecture video.' },
                            { id: '3', icon: 'Clock', title: 'Mobile Friendly', desc: 'Smooth learning experience across phone, tablet, and PC.' },
                        ]
                    }
                };
                break;

            case 'cta_banner':
                newBlock = {
                    id: newBlockId,
                    type: 'cta_banner',
                    title: 'Call to Action Banner',
                    settings: {
                        badge: 'Enrollment Open',
                        title: 'Join Today to Achieve Your Dream Goal',
                        subtitle: 'Study alongside thousands of motivated learners on Bangladesh\'s premier education platform.',
                        buttonText: 'Explore Courses',
                        buttonLink: '/courses',
                        bgColor: 'sky',
                    }
                };
                break;

            case 'rich_text':
                newBlock = {
                    id: newBlockId,
                    type: 'rich_text',
                    title: 'Rich Content / Policy',
                    settings: {
                        content: '<h2>Write your heading here</h2>\n<p>Write your detailed article, terms, or policy guidelines here. Supports rich formatting and lists.</p>'
                    }
                };
                break;

            case 'video_embed':
                newBlock = {
                    id: newBlockId,
                    type: 'video_embed',
                    title: 'Video Embed',
                    settings: {
                        title: 'Introduction to Our Platform',
                        subtitle: 'See how NovoNex helps students excel',
                        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                    }
                };
                break;

            case 'stats_counter':
                newBlock = {
                    id: newBlockId,
                    type: 'stats_counter',
                    title: 'Stats Counter',
                    settings: {
                        stats: [
                            { label: 'Enrolled Students', value: '10,000+' },
                            { label: 'Video Lessons', value: '500+' },
                            { label: 'Total Courses', value: '20+' },
                            { label: 'Success Rate', value: '98%' },
                        ]
                    }
                };
                break;

            case 'top_announcement':
                newBlock = {
                    id: newBlockId,
                    type: 'top_announcement',
                    title: 'Campaign Ribbon',
                    settings: {
                        badge: 'Special Offer',
                        text: 'Admission open with special discounts on academic and master batches!',
                        linkText: 'Explore All Courses →',
                        linkUrl: '/courses',
                        bgColor: 'from-sky-700 via-sky-600 to-amber-500',
                    }
                };
                break;

            case 'heading':
                newBlock = {
                    id: newBlockId,
                    type: 'heading',
                    title: 'Heading',
                    settings: {
                        title: 'Your Headline Title Here',
                        subtitle: 'Category or Tagline',
                        tag: 'h2',
                        align: 'center',
                        size: '3xl',
                        color: '',
                    }
                };
                break;

            case 'button':
                newBlock = {
                    id: newBlockId,
                    type: 'button',
                    title: 'Call to Action Button',
                    settings: {
                        text: 'Explore Courses',
                        link: '/courses',
                        variant: 'gradient',
                        size: 'md',
                        align: 'center',
                        target: '_self',
                    }
                };
                break;

            case 'image':
                newBlock = {
                    id: newBlockId,
                    type: 'image',
                    title: 'Image Banner',
                    settings: {
                        imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&auto=format&fit=crop&q=80',
                        alt: 'Banner image',
                        link: '',
                        caption: '',
                        rounded: '2xl',
                        align: 'center',
                        maxWidth: '100%',
                    }
                };
                break;

            case 'divider':
                newBlock = {
                    id: newBlockId,
                    type: 'divider',
                    title: 'Divider Line',
                    settings: {
                        width: '100%',
                        align: 'center',
                        style: 'solid',
                        color: '#e2e8f0',
                    }
                };
                break;

            case 'spacer':
                newBlock = {
                    id: newBlockId,
                    type: 'spacer',
                    title: 'Vertical Spacer',
                    settings: {
                        height: 40,
                    }
                };
                break;

            case 'bundle_showcase':
                newBlock = {
                    id: newBlockId,
                    type: 'bundle_showcase',
                    title: 'Course Bundles',
                    settings: {
                        sectionTag: 'Special Packages',
                        sectionTitle: 'Popular Course Bundles & Combos',
                        sectionSub: 'Bundle multiple courses together and save up to 50%!',
                        limit: 4,
                    }
                };
                break;

            case 'teachers_showcase':
                newBlock = {
                    id: newBlockId,
                    type: 'teachers_showcase',
                    title: 'Faculty Mentors',
                    settings: {
                        sectionTag: 'Mentor Panel',
                        sectionTitle: 'Prepare with Top Instructors',
                        sectionSub: 'Guiding thousands of learners toward academic excellence and dream careers.',
                        limit: 8,
                    }
                };
                break;

            case 'learning_path':
                newBlock = {
                    id: newBlockId,
                    type: 'learning_path',
                    title: 'Learning Path',
                    settings: {
                        sectionTag: 'Learning Methodology',
                        sectionTitle: 'A 4-Step Scientific System to Guarantee 100% Preparation',
                        sectionSub: 'From clear concept building to exam mastery, every step of the journey is organized.',
                        steps: [
                            { id: '1', num: '01', title: 'Concept & Basics Mastery', desc: 'Every topic thoroughly clarified using animated visuals and real examples.' },
                            { id: '2', num: '02', title: 'Targeted Problem Solving', desc: 'Comprehensive practice and solutions of previous board and top exam problems.' },
                            { id: '3', num: '03', title: '24/7 AI Doubt Solving', desc: 'Instant clarity whenever you are stuck with formulas or concepts.' },
                            { id: '4', num: '04', title: 'Live Mock Tests & Rankings', desc: 'Real exam simulated environment with timers and detailed analytical reports.' },
                        ]
                    }
                };
                break;

            case 'testimonials':
                newBlock = {
                    id: newBlockId,
                    type: 'testimonials',
                    title: 'Student Testimonials & Reviews',
                    settings: {
                        sectionTag: 'Real Feedback & Success Stories',
                        sectionTitle: 'Loved by Thousands of Learners Across Bangladesh',
                        sectionSub: 'Swipe through genuine screenshots and student reviews from our academic, admission, and skill batches.',
                        speed: 45,
                        images: [],
                        items: [
                            { id: '1', name: 'Tanvir Ahmed', role: 'Engineering Batch \'23', rating: 5, quote: 'The interactive classes transformed my preparation. The instant AI doubt solver was a game changer!' },
                            { id: '2', name: 'Sadia Afrin', role: 'Medical College \'24', rating: 5, quote: 'The mock test platform replicates real exams perfectly. Tracking merit rankings helped me improve consistently.' },
                            { id: '3', name: 'Farhan Kabir', role: 'Top College GPA 5', rating: 5, quote: 'The lecture sheets and practice sets were so well structured that I could complete my entire revision smoothly.' },
                        ]
                    }
                };
                break;

            case 'video_testimonials':
                newBlock = {
                    id: newBlockId,
                    type: 'video_testimonials',
                    title: 'Video Testimonials',
                    settings: {
                        sectionTag: 'Student Stories & Video Reviews',
                        sectionTitle: 'What Our Students Say',
                        sectionSub: 'Real journeys, genuine experiences, and success stories shared on camera.',
                        items: [
                            {
                                id: '1',
                                name: 'Samiul',
                                role: 'NovoNex Student Review',
                                videoUrl: 'https://youtu.be/Cbw_yhBGM_4',
                                thumbnailUrl: '',
                            },
                            {
                                id: '2',
                                name: 'Khurshed',
                                role: 'NovoNex Student Review',
                                videoUrl: 'https://youtu.be/Zt7yfNIbInQ',
                                thumbnailUrl: '',
                            },
                        ]
                    }
                };
                break;

            case 'faq_accordion':
                newBlock = {
                    id: newBlockId,
                    type: 'faq_accordion',
                    title: 'FAQ Accordion',
                    settings: {
                        sectionTag: 'Frequently Asked Questions',
                        sectionTitle: 'Common Questions & Answers',
                        sectionSub: 'Everything you need to know about enrollments, classes, and exams.',
                        items: [
                            { id: '1', q: 'How do I enroll in a course on NovoNex?', a: 'Click the "Enroll Now" or "Get Course" button on any course card. Complete the checkout process to get immediate access.' },
                            { id: '2', q: 'Can I access recorded classes and lecture sheets after live sessions?', a: 'Yes, every live session is saved to your student archive in Full HD and remains accessible throughout your course validity.' },
                            { id: '3', q: 'How does the NexPilot AI Doubt Solver assist my learning?', a: 'NexPilot is an intelligent 24/7 tutor linked with your curriculum. Ask any study question to get instant step-by-step guidance.' },
                        ]
                    }
                };
                break;
        }

        const newBlocks = [...blocks];
        if (typeof insertIndex === 'number') {
            newBlocks.splice(insertIndex, 0, newBlock);
        } else {
            newBlocks.push(newBlock);
        }
        setBlocks(newBlocks);
        setSelectedBlockId(newBlock.id);
        setActiveSidebarTab('inspector');
        showToast('Widget added');
    };

    /* Drag & Drop Event Handlers */
    const handleWidgetDragStart = (e: React.DragEvent, type: BlockType) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'widget', widgetType: type }));
        e.dataTransfer.effectAllowed = 'copy';
        setIsDragging(true);
        setDraggedWidgetType(type);
    };

    const handleBlockDragStart = (e: React.DragEvent, index: number) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'block', blockIndex: index }));
        e.dataTransfer.effectAllowed = 'move';
        setIsDragging(true);
        setDraggedBlockIndex(index);
    };

    const handleDragEnd = () => {
        setIsDragging(false);
        setDraggedWidgetType(null);
        setDraggedBlockIndex(null);
        setActiveDropZoneIndex(null);
    };

    const handleDragOver = (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = draggedWidgetType ? 'copy' : 'move';
        if (activeDropZoneIndex !== targetIndex) {
            setActiveDropZoneIndex(targetIndex);
        }
    };

    const handleDrop = (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        e.stopPropagation();

        if (draggedWidgetType) {
            handleAddBlock(draggedWidgetType, targetIndex);
            showToast('New widget placed!');
        } else if (draggedBlockIndex !== null) {
            if (draggedBlockIndex === targetIndex || draggedBlockIndex === targetIndex - 1) {
                handleDragEnd();
                return;
            }
            const newBlocks = [...blocks];
            const [moved] = newBlocks.splice(draggedBlockIndex, 1);
            const insertAt = draggedBlockIndex < targetIndex ? targetIndex - 1 : targetIndex;
            newBlocks.splice(insertAt, 0, moved);
            setBlocks(newBlocks);
            setSelectedBlockId(moved.id);
            showToast('Block position reordered!');
        }
        handleDragEnd();
    };

    const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === blocks.length - 1) return;

        const newBlocks = [...blocks];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        const [moved] = newBlocks.splice(index, 1);
        newBlocks.splice(targetIndex, 0, moved);
        setBlocks(newBlocks);
    };

    const handleDuplicateBlock = (index: number) => {
        const source = blocks[index];
        const clone: PageBlock = {
            ...JSON.parse(JSON.stringify(source)),
            id: `block_${source.type}_${Date.now()}`,
            title: `${source.title} (Copy)`,
        };
        const newBlocks = [...blocks];
        newBlocks.splice(index + 1, 0, clone);
        setBlocks(newBlocks);
        setSelectedBlockId(clone.id);
        showToast('Widget duplicated');
    };

    const handleDeleteBlock = (index: number) => {
        if (!confirm('Are you sure you want to delete this widget?')) return;
        const newBlocks = [...blocks];
        const [removed] = newBlocks.splice(index, 1);
        setBlocks(newBlocks);
        if (selectedBlockId === removed.id) {
            setSelectedBlockId(newBlocks[0]?.id || null);
        }
        showToast('Widget deleted');
    };

    const handleUpdateSelectedSettings = (key: string, value: any) => {
        if (!selectedBlockId) return;
        setBlocks(prev => prev.map(b => {
            if (b.id !== selectedBlockId) return b;
            return {
                ...b,
                settings: {
                    ...b.settings,
                    [key]: value,
                }
            };
        }));
    };

    const selectedBlock = blocks.find(b => b.id === selectedBlockId);

    const publicUrl = page ? (page.slug === 'home' ? '/' : `/p/${page.slug}`) : '/';

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-900 text-white">
                <div className="text-center space-y-3">
                    <div className="w-10 h-10 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <div className="text-sm font-bold">Loading visual builder...</div>
                </div>
            </div>
        );
    }

    if (!page) {
        return (
            <div className="p-8 text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
                <h2 className="text-xl font-bold">Page not found</h2>
                <Link to="/admin/pages" className="inline-block px-4 py-2 bg-sky-600 text-white rounded-xl text-sm">
                    Back to pages list
                </Link>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
            {/* Global Page Custom CSS Injection */}
            {customCss && <style>{customCss}</style>}

            {/* Toast Notification */}
            {toastMessage && (
                <div className="fixed bottom-20 right-8 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-slide-up">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-medium">{toastMessage}</span>
                </div>
            )}

            {/* ---------------- TOP BUILDER HEADER ---------------- */}
            <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0 select-none">
                {/* Left: Back & Page Title */}
                <div className="flex items-center gap-3">
                    <Link
                        to="/admin/pages"
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Back to pages list"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Link>

                    <div className="h-5 w-px bg-slate-800" />

                    <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{page.title}</span>
                        <span className="text-xs text-slate-400 font-mono">({publicUrl})</span>
                        {page.is_system && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                                System Page
                            </span>
                        )}
                    </div>
                </div>

                {/* Center: Responsive Viewport Switcher */}
                <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800">
                    <button
                        onClick={() => setDeviceView('desktop')}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${deviceView === 'desktop' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                            }`}
                        title="Desktop View (100%)"
                    >
                        <Monitor className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setDeviceView('tablet')}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${deviceView === 'tablet' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                            }`}
                        title="Tablet View (768px)"
                    >
                        <Tablet className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setDeviceView('mobile')}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${deviceView === 'mobile' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                            }`}
                        title="Mobile View (375px)"
                    >
                        <Smartphone className="w-4 h-4" />
                    </button>
                </div>

                {/* Right: Status, Preview & Save */}
                <div className="flex items-center gap-2.5">
                    {(page?.slug === 'home' || page?.slug === 'courses' || page?.is_system) && (
                        <button
                            type="button"
                            onClick={handleResetTemplate}
                            disabled={resetting}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/50 text-slate-300 hover:text-rose-400 text-xs font-bold border border-slate-700/60 hover:border-rose-800/60 transition-colors cursor-pointer"
                            title="Reset all sections to default layout"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin text-rose-400' : ''}`} />
                            <span>{resetting ? 'Resetting...' : 'Reset Template'}</span>
                        </button>
                    )}

                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as any)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${status === 'published'
                            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80'
                            : 'bg-amber-950/60 text-amber-400 border-amber-800/80'
                            }`}
                    >
                        <option value="published" className="bg-slate-900 text-white">Published</option>
                        <option value="draft" className="bg-slate-900 text-white">Draft</option>
                    </select>

                    <a
                        href={publicUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold border border-slate-700/60 transition-colors"
                        title="Preview in new tab"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Preview</span>
                    </a>

                    <button
                        type="button"
                        onClick={scrollToBottom}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 text-xs font-bold border border-slate-700/60 transition-colors cursor-pointer"
                        title="Scroll to bottom of canvas"
                    >
                        <ChevronDown className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Scroll Down</span>
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-sky-500/20 transition-all disabled:opacity-50 cursor-pointer"
                    >
                        <Save className="w-3.5 h-3.5" />
                        <span>{saving ? 'Saving...' : 'Save (Ctrl+S)'}</span>
                    </button>
                </div>
            </header>

            {/* ---------------- MAIN WORKSPACE ---------------- */}
            <div className="flex-1 flex overflow-hidden min-h-0 h-[calc(100vh-3.5rem)] max-h-[calc(100vh-3.5rem)]">
                {/* ---------------- LEFT SIDEBAR PANEL ---------------- */}
                <aside
                    className={`${sidebarOpen ? 'w-[380px]' : 'w-0'
                        } transition-all duration-300 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 overflow-hidden z-20 min-h-0`}
                >
                    {/* Sidebar Tabs */}
                    <div className="flex items-center border-b border-slate-800 bg-slate-950/60 p-1.5 shrink-0">
                        <button
                            onClick={() => setActiveSidebarTab('widgets')}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${activeSidebarTab === 'widgets'
                                ? 'bg-sky-600 text-white shadow-xs'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                }`}
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Widgets</span>
                        </button>
                        <button
                            onClick={() => setActiveSidebarTab('inspector')}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${activeSidebarTab === 'inspector'
                                ? 'bg-sky-600 text-white shadow-xs'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                }`}
                        >
                            <Sliders className="w-3.5 h-3.5" />
                            <span>Settings</span>
                        </button>
                        <button
                            onClick={() => setActiveSidebarTab('css')}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${activeSidebarTab === 'css'
                                ? 'bg-sky-600 text-white shadow-xs'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                }`}
                        >
                            <Code className="w-3.5 h-3.5" />
                            <span>Page CSS</span>
                        </button>
                    </div>

                    {/* Sidebar Tab Content */}
                    <div className="flex-1 builder-sidebar-scroll p-4 space-y-4">
                        {/* TAB 1: WIDGETS DRAWER */}
                        {activeSidebarTab === 'widgets' && (
                            <div className="space-y-4">
                                {/* Search Input */}
                                <div className="relative">
                                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={widgetSearch}
                                        onChange={(e) => setWidgetSearch(e.target.value)}
                                        placeholder="Search widgets (e.g. Hero, Bundles, Button)..."
                                        className="w-full pl-8 pr-7 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                                    />
                                    {widgetSearch && (
                                        <button
                                            type="button"
                                            onClick={() => setWidgetSearch('')}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer w-4 h-4 flex items-center justify-center rounded-full bg-slate-800"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>

                                <div className="p-2.5 bg-sky-950/50 border border-sky-800/60 rounded-xl text-[11px] text-sky-300 flex items-center gap-2">
                                    <GripVertical className="w-3.5 h-3.5 text-sky-400 shrink-0 animate-pulse" />
                                    <span><strong>Drag & Drop</strong> any widget onto canvas or click to append.</span>
                                </div>

                                {widgetSearch.trim() !== '' ? (
                                    <div className="space-y-2">
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            Search Results ({WIDGET_CATALOG.filter(w => w.name.toLowerCase().includes(widgetSearch.toLowerCase()) || w.description.toLowerCase().includes(widgetSearch.toLowerCase())).length})
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {WIDGET_CATALOG.filter(w => w.name.toLowerCase().includes(widgetSearch.toLowerCase()) || w.description.toLowerCase().includes(widgetSearch.toLowerCase())).map((widget) => {
                                                const Icon = widget.icon;
                                                return (
                                                    <button
                                                        key={widget.type}
                                                        draggable={true}
                                                        onDragStart={(e) => handleWidgetDragStart(e, widget.type)}
                                                        onDragEnd={handleDragEnd}
                                                        onClick={() => handleAddBlock(widget.type)}
                                                        className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-sky-500/50 text-left transition-all group cursor-grab active:cursor-grabbing flex flex-col justify-between h-24 select-none relative"
                                                    >
                                                        <GripVertical className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 absolute top-2.5 right-2" />
                                                        <div className={`w-7 h-7 rounded-lg ${widget.iconBg} ${widget.iconColor} flex items-center justify-center`}>
                                                            <Icon className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-bold text-white group-hover:text-sky-400 truncate">{widget.name}</div>
                                                            <div className="text-[10px] text-slate-400 line-clamp-1">{widget.description}</div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    (['Basic', 'Pro & Marketing', 'NovoNex LMS'] as const).map(category => {
                                        const categoryWidgets = WIDGET_CATALOG.filter(w => w.category === category);
                                        return (
                                            <div key={category} className="space-y-2 pt-1">
                                                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800/80 pb-1">
                                                    <span>{category}</span>
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                                                        {categoryWidgets.length}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {categoryWidgets.map((widget) => {
                                                        const Icon = widget.icon;
                                                        return (
                                                            <button
                                                                key={widget.type}
                                                                draggable={true}
                                                                onDragStart={(e) => handleWidgetDragStart(e, widget.type)}
                                                                onDragEnd={handleDragEnd}
                                                                onClick={() => handleAddBlock(widget.type)}
                                                                className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-sky-500/50 text-left transition-all group cursor-grab active:cursor-grabbing flex flex-col justify-between h-24 select-none relative"
                                                            >
                                                                <GripVertical className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 absolute top-2.5 right-2" />
                                                                <div className={`w-7 h-7 rounded-lg ${widget.iconBg} ${widget.iconColor} flex items-center justify-center`}>
                                                                    <Icon className="w-4 h-4" />
                                                                </div>
                                                                <div>
                                                                    <div className="text-xs font-bold text-white group-hover:text-sky-400 truncate">{widget.name}</div>
                                                                    <div className="text-[10px] text-slate-400 line-clamp-1">{widget.description}</div>
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}

                        {/* TAB 2: INSPECTOR / SETTINGS */}
                        {activeSidebarTab === 'inspector' && (
                            <div className="space-y-4">
                                {!selectedBlock ? (
                                    <div className="p-8 text-center text-slate-500 space-y-2">
                                        <Sliders className="w-8 h-8 text-slate-600 mx-auto" />
                                        <p className="text-xs font-bold">Click any widget on the canvas to configure</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Element Header */}
                                        <div className="pb-3 border-b border-slate-800 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 font-mono">
                                                    {selectedBlock.type}
                                                </span>
                                                <span className="text-[10px] font-mono text-slate-500 truncate max-w-[130px]">{selectedBlock.id}</span>
                                            </div>
                                            <input
                                                type="text"
                                                value={selectedBlock.title || ''}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? { ...b, title: val } : b));
                                                }}
                                                className="w-full bg-transparent text-sm font-bold text-white border-b border-transparent hover:border-slate-700 focus:border-sky-500 focus:outline-none transition-colors"
                                                title="Rename section for easy organization"
                                            />
                                        </div>

                                        {/* Elementor Pro 3-Tab Inspector Bar */}
                                        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                                            <button
                                                type="button"
                                                onClick={() => setInspectorSubTab('content')}
                                                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${inspectorSubTab === 'content'
                                                    ? 'bg-sky-600 text-white shadow-xs'
                                                    : 'text-slate-400 hover:text-white'
                                                    }`}
                                            >
                                                <FileText className="w-3.5 h-3.5" />
                                                <span>Content</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setInspectorSubTab('style')}
                                                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${inspectorSubTab === 'style'
                                                    ? 'bg-sky-600 text-white shadow-xs'
                                                    : 'text-slate-400 hover:text-white'
                                                    }`}
                                            >
                                                <Palette className="w-3.5 h-3.5" />
                                                <span>Style</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setInspectorSubTab('advanced')}
                                                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${inspectorSubTab === 'advanced'
                                                    ? 'bg-sky-600 text-white shadow-xs'
                                                    : 'text-slate-400 hover:text-white'
                                                    }`}
                                            >
                                                <Code className="w-3.5 h-3.5" />
                                                <span>Advanced</span>
                                            </button>
                                        </div>

                                        {/* SUBTAB 1: CONTENT */}
                                        {inspectorSubTab === 'content' && (
                                            <div className="space-y-4">
                                                {/* --- 1. TOP ANNOUNCEMENT --- */}
                                                {selectedBlock.type === 'top_announcement' && (
                                                    <div className="space-y-3 text-xs">
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Badge Text</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.badge || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('badge', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Message Text</label>
                                                            <textarea
                                                                rows={2}
                                                                value={selectedBlock.settings.text || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('text', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">Link Text</label>
                                                                <input
                                                                    type="text"
                                                                    value={selectedBlock.settings.linkText || ''}
                                                                    onChange={(e) => handleUpdateSelectedSettings('linkText', e.target.value)}
                                                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">Link URL</label>
                                                                <input
                                                                    type="text"
                                                                    value={selectedBlock.settings.linkUrl || ''}
                                                                    onChange={(e) => handleUpdateSelectedSettings('linkUrl', e.target.value)}
                                                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Background Gradient Class</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.bgColor || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('bgColor', e.target.value)}
                                                                placeholder="e.g. from-sky-700 via-sky-600 to-amber-500"
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* --- 2. HERO BANNER --- */}
                                                {selectedBlock.type === 'hero' && (
                                                    <div className="space-y-3 text-xs">
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Top Badge</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.badge || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('badge', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Title Part 1</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.titlePart1 || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('titlePart1', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Highlighted Text</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.titleHighlight || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('titleHighlight', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sky-400 font-bold"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Title Part 2</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.titlePart2 || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('titlePart2', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Subtitle</label>
                                                            <textarea
                                                                rows={2}
                                                                value={selectedBlock.settings.subtitle || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('subtitle', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">Primary Button</label>
                                                                <input
                                                                    type="text"
                                                                    value={selectedBlock.settings.browseCoursesBtn || ''}
                                                                    onChange={(e) => handleUpdateSelectedSettings('browseCoursesBtn', e.target.value)}
                                                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">Primary Link</label>
                                                                <input
                                                                    type="text"
                                                                    value={selectedBlock.settings.browseCoursesLink || ''}
                                                                    onChange={(e) => handleUpdateSelectedSettings('browseCoursesLink', e.target.value)}
                                                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">Secondary Button</label>
                                                                <input
                                                                    type="text"
                                                                    value={selectedBlock.settings.startFreeClassBtn || ''}
                                                                    onChange={(e) => handleUpdateSelectedSettings('startFreeClassBtn', e.target.value)}
                                                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">Secondary Link</label>
                                                                <input
                                                                    type="text"
                                                                    value={selectedBlock.settings.startFreeClassLink || ''}
                                                                    onChange={(e) => handleUpdateSelectedSettings('startFreeClassLink', e.target.value)}
                                                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="pt-2 border-t border-slate-800 space-y-2">
                                                            <span className="text-[10px] font-bold uppercase text-slate-400">Trust Metrics</span>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.trust1 || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('trust1', e.target.value)}
                                                                placeholder="Trust 1 (e.g. 10,000+ Students)"
                                                                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.trust2 || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('trust2', e.target.value)}
                                                                placeholder="Trust 2 (e.g. Lifetime Access)"
                                                                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.trust3 || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('trust3', e.target.value)}
                                                                placeholder="Trust 3 (e.g. 24/7 Doubt Solving)"
                                                                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* --- 3. HEADING WIDGET --- */}
                                                {selectedBlock.type === 'heading' && (
                                                    <div className="space-y-3 text-xs">
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Heading Title</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.title || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('title', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Subtitle / Tagline</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.subtitle || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('subtitle', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">HTML Tag</label>
                                                                <select
                                                                    value={selectedBlock.settings.tag || 'h2'}
                                                                    onChange={(e) => handleUpdateSelectedSettings('tag', e.target.value)}
                                                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                                                                >
                                                                    <option value="h1">H1</option>
                                                                    <option value="h2">H2</option>
                                                                    <option value="h3">H3</option>
                                                                    <option value="h4">H4</option>
                                                                    <option value="h5">H5</option>
                                                                    <option value="h6">H6</option>
                                                                    <option value="p">P (Paragraph)</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">Size</label>
                                                                <select
                                                                    value={selectedBlock.settings.size || '3xl'}
                                                                    onChange={(e) => handleUpdateSelectedSettings('size', e.target.value)}
                                                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                                                                >
                                                                    <option value="sm">Small</option>
                                                                    <option value="md">Medium</option>
                                                                    <option value="lg">Large</option>
                                                                    <option value="xl">XL</option>
                                                                    <option value="2xl">2XL</option>
                                                                    <option value="3xl">3XL</option>
                                                                    <option value="4xl">4XL</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">Alignment</label>
                                                                <select
                                                                    value={selectedBlock.settings.align || 'center'}
                                                                    onChange={(e) => handleUpdateSelectedSettings('align', e.target.value)}
                                                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                                >
                                                                    <option value="left">Left</option>
                                                                    <option value="center">Center</option>
                                                                    <option value="right">Right</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">Color (optional)</label>
                                                                <input
                                                                    type="text"
                                                                    value={selectedBlock.settings.color || ''}
                                                                    onChange={(e) => handleUpdateSelectedSettings('color', e.target.value)}
                                                                    placeholder="#0284c7 or empty"
                                                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* --- 4. BUTTON WIDGET --- */}
                                                {selectedBlock.type === 'button' && (
                                                    <div className="space-y-3 text-xs">
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Button Text</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.text || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('text', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Link URL</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.link || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('link', e.target.value)}
                                                                placeholder="/courses or https://..."
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">Style Variant</label>
                                                                <select
                                                                    value={selectedBlock.settings.variant || 'gradient'}
                                                                    onChange={(e) => handleUpdateSelectedSettings('variant', e.target.value)}
                                                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                                                                >
                                                                    <option value="gradient">Sky Gradient</option>
                                                                    <option value="solid">Solid Sky</option>
                                                                    <option value="outline">Outline</option>
                                                                    <option value="dark">Dark Slate</option>
                                                                    <option value="light">Light White</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">Size</label>
                                                                <select
                                                                    value={selectedBlock.settings.size || 'md'}
                                                                    onChange={(e) => handleUpdateSelectedSettings('size', e.target.value)}
                                                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                                                                >
                                                                    <option value="sm">Small</option>
                                                                    <option value="md">Medium</option>
                                                                    <option value="lg">Large</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">Alignment</label>
                                                                <select
                                                                    value={selectedBlock.settings.align || 'center'}
                                                                    onChange={(e) => handleUpdateSelectedSettings('align', e.target.value)}
                                                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                                >
                                                                    <option value="left">Left</option>
                                                                    <option value="center">Center</option>
                                                                    <option value="right">Right</option>
                                                                    <option value="full">Full Width</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">Open in New Tab</label>
                                                                <select
                                                                    value={selectedBlock.settings.target || '_self'}
                                                                    onChange={(e) => handleUpdateSelectedSettings('target', e.target.value)}
                                                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                                >
                                                                    <option value="_self">Same Tab (_self)</option>
                                                                    <option value="_blank">New Tab (_blank)</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* --- 5. IMAGE WIDGET --- */}
                                                {selectedBlock.type === 'image' && (
                                                    <div className="space-y-3 text-xs">
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Image URL</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.imageUrl || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('imageUrl', e.target.value)}
                                                                placeholder="https://... or /storage/..."
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                                                            />
                                                        </div>
                                                        {selectedBlock.settings.imageUrl && (
                                                            <div className="h-28 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
                                                                <img
                                                                    src={selectedBlock.settings.imageUrl}
                                                                    alt="Preview"
                                                                    className="max-h-full max-w-full object-contain"
                                                                />
                                                            </div>
                                                        )}
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">Alt Text</label>
                                                                <input
                                                                    type="text"
                                                                    value={selectedBlock.settings.alt || ''}
                                                                    onChange={(e) => handleUpdateSelectedSettings('alt', e.target.value)}
                                                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">Click Link (optional)</label>
                                                                <input
                                                                    type="text"
                                                                    value={selectedBlock.settings.link || ''}
                                                                    onChange={(e) => handleUpdateSelectedSettings('link', e.target.value)}
                                                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-2">
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">Border Radius</label>
                                                                <select
                                                                    value={selectedBlock.settings.rounded || '2xl'}
                                                                    onChange={(e) => handleUpdateSelectedSettings('rounded', e.target.value)}
                                                                    className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                                >
                                                                    <option value="none">None</option>
                                                                    <option value="md">Rounded MD</option>
                                                                    <option value="lg">Rounded LG</option>
                                                                    <option value="xl">Rounded XL</option>
                                                                    <option value="2xl">Rounded 2XL</option>
                                                                    <option value="full">Circle / Full</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">Align</label>
                                                                <select
                                                                    value={selectedBlock.settings.align || 'center'}
                                                                    onChange={(e) => handleUpdateSelectedSettings('align', e.target.value)}
                                                                    className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                                >
                                                                    <option value="left">Left</option>
                                                                    <option value="center">Center</option>
                                                                    <option value="right">Right</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">Max Width</label>
                                                                <input
                                                                    type="text"
                                                                    value={selectedBlock.settings.maxWidth || '100%'}
                                                                    onChange={(e) => handleUpdateSelectedSettings('maxWidth', e.target.value)}
                                                                    placeholder="100% or 600px"
                                                                    className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Image Caption (optional)</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.caption || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('caption', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* --- 6. DIVIDER WIDGET --- */}
                                                {selectedBlock.type === 'divider' && (
                                                    <div className="space-y-3 text-xs">
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">Style</label>
                                                                <select
                                                                    value={selectedBlock.settings.style || 'solid'}
                                                                    onChange={(e) => handleUpdateSelectedSettings('style', e.target.value)}
                                                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                                >
                                                                    <option value="solid">Solid</option>
                                                                    <option value="dashed">Dashed</option>
                                                                    <option value="dotted">Dotted</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">Width</label>
                                                                <input
                                                                    type="text"
                                                                    value={selectedBlock.settings.width || '100%'}
                                                                    onChange={(e) => handleUpdateSelectedSettings('width', e.target.value)}
                                                                    placeholder="100% or 80px"
                                                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">Color</label>
                                                                <input
                                                                    type="text"
                                                                    value={selectedBlock.settings.color || '#e2e8f0'}
                                                                    onChange={(e) => handleUpdateSelectedSettings('color', e.target.value)}
                                                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">Align</label>
                                                                <select
                                                                    value={selectedBlock.settings.align || 'center'}
                                                                    onChange={(e) => handleUpdateSelectedSettings('align', e.target.value)}
                                                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                                >
                                                                    <option value="left">Left</option>
                                                                    <option value="center">Center</option>
                                                                    <option value="right">Right</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* --- 7. SPACER WIDGET --- */}
                                                {selectedBlock.type === 'spacer' && (
                                                    <div className="space-y-3 text-xs">
                                                        <div>
                                                            <div className="flex items-center justify-between mb-1">
                                                                <label className="block text-slate-400 font-bold">Height (pixels)</label>
                                                                <span className="text-sky-400 font-bold">{selectedBlock.settings.height || 40}px</span>
                                                            </div>
                                                            <input
                                                                type="range"
                                                                min="10"
                                                                max="200"
                                                                value={selectedBlock.settings.height || 40}
                                                                onChange={(e) => handleUpdateSelectedSettings('height', parseInt(e.target.value) || 40)}
                                                                className="w-full accent-sky-500 cursor-pointer"
                                                            />
                                                            <input
                                                                type="number"
                                                                value={selectedBlock.settings.height || 40}
                                                                onChange={(e) => handleUpdateSelectedSettings('height', parseInt(e.target.value) || 40)}
                                                                className="w-full mt-2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* --- 8. COURSE BUNDLES --- */}
                                                {selectedBlock.type === 'bundle_showcase' && (
                                                    <div className="space-y-3 text-xs">
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Section Tag</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.sectionTag || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('sectionTag', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Main Title</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.sectionTitle || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('sectionTitle', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Subtitle</label>
                                                            <textarea
                                                                rows={2}
                                                                value={selectedBlock.settings.sectionSub || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('sectionSub', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Display Limit</label>
                                                            <input
                                                                type="number"
                                                                value={selectedBlock.settings.limit || 4}
                                                                onChange={(e) => handleUpdateSelectedSettings('limit', parseInt(e.target.value) || 4)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* --- 9. TEACHERS SHOWCASE --- */}
                                                {selectedBlock.type === 'teachers_showcase' && (
                                                    <div className="space-y-3 text-xs">
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Section Tag</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.sectionTag || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('sectionTag', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Main Title</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.sectionTitle || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('sectionTitle', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Subtitle</label>
                                                            <textarea
                                                                rows={2}
                                                                value={selectedBlock.settings.sectionSub || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('sectionSub', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Display Limit</label>
                                                            <input
                                                                type="number"
                                                                value={selectedBlock.settings.limit || 8}
                                                                onChange={(e) => handleUpdateSelectedSettings('limit', parseInt(e.target.value) || 8)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* --- 10. LEARNING PATH --- */}
                                                {selectedBlock.type === 'learning_path' && (
                                                    <div className="space-y-3 text-xs">
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Section Tag</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.sectionTag || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('sectionTag', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Main Title</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.sectionTitle || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('sectionTitle', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Subtitle</label>
                                                            <textarea
                                                                rows={2}
                                                                value={selectedBlock.settings.sectionSub || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('sectionSub', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>

                                                        {/* Steps Manager */}
                                                        <div className="pt-2 border-t border-slate-800 space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-bold text-slate-300">Methodology Steps</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const steps = selectedBlock.settings.steps || [];
                                                                        const newStep = {
                                                                            id: String(Date.now()),
                                                                            num: `0${steps.length + 1}`,
                                                                            title: 'New Step Title',
                                                                            desc: 'Enter step details and instructions.'
                                                                        };
                                                                        handleUpdateSelectedSettings('steps', [...steps, newStep]);
                                                                    }}
                                                                    className="px-2 py-0.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px]"
                                                                >
                                                                    + Add Step
                                                                </button>
                                                            </div>
                                                            <div className="space-y-2 max-h-56 builder-sidebar-scroll pr-1">
                                                                {(selectedBlock.settings.steps || []).map((step: any, sIdx: number) => (
                                                                    <div key={step.id || sIdx} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                                                                        <div className="flex items-center justify-between">
                                                                            <input
                                                                                type="text"
                                                                                value={step.num || ''}
                                                                                onChange={(e) => {
                                                                                    const steps = [...(selectedBlock.settings.steps || [])];
                                                                                    steps[sIdx] = { ...steps[sIdx], num: e.target.value };
                                                                                    handleUpdateSelectedSettings('steps', steps);
                                                                                }}
                                                                                className="w-14 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-sky-400 font-bold text-center"
                                                                                placeholder="01"
                                                                            />
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const steps = [...(selectedBlock.settings.steps || [])];
                                                                                    steps.splice(sIdx, 1);
                                                                                    handleUpdateSelectedSettings('steps', steps);
                                                                                }}
                                                                                className="text-rose-400 hover:text-rose-300 p-1"
                                                                            >
                                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </div>
                                                                        <input
                                                                            type="text"
                                                                            value={step.title || ''}
                                                                            onChange={(e) => {
                                                                                const steps = [...(selectedBlock.settings.steps || [])];
                                                                                steps[sIdx] = { ...steps[sIdx], title: e.target.value };
                                                                                handleUpdateSelectedSettings('steps', steps);
                                                                            }}
                                                                            placeholder="Step Title"
                                                                            className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white font-bold"
                                                                        />
                                                                        <textarea
                                                                            rows={2}
                                                                            value={step.desc || ''}
                                                                            onChange={(e) => {
                                                                                const steps = [...(selectedBlock.settings.steps || [])];
                                                                                steps[sIdx] = { ...steps[sIdx], desc: e.target.value };
                                                                                handleUpdateSelectedSettings('steps', steps);
                                                                            }}
                                                                            placeholder="Step Description"
                                                                            className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-300 text-[11px]"
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* --- 11. TESTIMONIALS & REVIEWS SHOWCASE --- */}
                                                {selectedBlock.type === 'testimonials' && (() => {
                                                    const rawImages = selectedBlock.settings.images;
                                                    const hasCustomImages = Array.isArray(rawImages);
                                                    const imagesList: Array<{ id?: string | number; url: string; title?: string }> = hasCustomImages ? rawImages : [];
                                                    const currentSpeed = Number(selectedBlock.settings.speed) || 45;

                                                    return (
                                                        <div className="space-y-4 text-xs">
                                                            {/* Header & Text Labels */}
                                                            <div className="space-y-2.5 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                                                                <span className="font-bold text-slate-300 block text-[11px] uppercase tracking-wider">
                                                                    Header & Text Labels
                                                                </span>
                                                                <div>
                                                                    <label className="block text-slate-400 font-semibold mb-1">Section Tag / Badge</label>
                                                                    <input
                                                                        type="text"
                                                                        value={selectedBlock.settings.sectionTag ?? ''}
                                                                        placeholder="Real Feedback & Success Stories"
                                                                        onChange={(e) => handleUpdateSelectedSettings('sectionTag', e.target.value)}
                                                                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-slate-400 font-semibold mb-1">Main Heading</label>
                                                                    <input
                                                                        type="text"
                                                                        value={selectedBlock.settings.sectionTitle ?? ''}
                                                                        placeholder="Loved by Thousands of Learners Across Bangladesh"
                                                                        onChange={(e) => handleUpdateSelectedSettings('sectionTitle', e.target.value)}
                                                                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-bold"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-slate-400 font-semibold mb-1">Subtitle Description</label>
                                                                    <textarea
                                                                        rows={2}
                                                                        value={selectedBlock.settings.sectionSub ?? ''}
                                                                        placeholder="Swipe through genuine screenshots and student reviews from our academic, admission, and skill batches."
                                                                        onChange={(e) => handleUpdateSelectedSettings('sectionSub', e.target.value)}
                                                                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Scroll Speed Control */}
                                                            <div className="space-y-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="font-bold text-slate-300 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                                                                        <Clock className="w-3.5 h-3.5 text-sky-400" />
                                                                        Marquee Scroll Speed
                                                                    </span>
                                                                    <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold text-[11px]">
                                                                        {currentSpeed}s
                                                                    </span>
                                                                </div>
                                                                <p className="text-[10px] text-slate-400">
                                                                    Cycle duration in seconds. Lower number = faster; higher number = slower.
                                                                </p>
                                                                <div className="flex items-center gap-3">
                                                                    <input
                                                                        type="range"
                                                                        min={15}
                                                                        max={120}
                                                                        step={5}
                                                                        value={currentSpeed}
                                                                        onChange={(e) => handleUpdateSelectedSettings('speed', Number(e.target.value))}
                                                                        className="w-full accent-sky-500 cursor-pointer"
                                                                    />
                                                                    <input
                                                                        type="number"
                                                                        min={10}
                                                                        max={180}
                                                                        value={currentSpeed}
                                                                        onChange={(e) => handleUpdateSelectedSettings('speed', Math.max(10, Math.min(180, Number(e.target.value) || 45)))}
                                                                        className="w-16 px-2 py-1 bg-slate-900 border border-slate-800 rounded text-center text-white font-bold"
                                                                    />
                                                                </div>
                                                                {/* Speed presets */}
                                                                <div className="grid grid-cols-4 gap-1.5 pt-1">
                                                                    {[
                                                                        { label: '25s (Fast)', val: 25 },
                                                                        { label: '35s (Brisk)', val: 35 },
                                                                        { label: '45s (Normal)', val: 45 },
                                                                        { label: '65s (Smooth)', val: 65 },
                                                                    ].map((p) => (
                                                                        <button
                                                                            key={p.val}
                                                                            type="button"
                                                                            onClick={() => handleUpdateSelectedSettings('speed', p.val)}
                                                                            className={`py-1 px-1.5 rounded text-[10px] font-semibold text-center transition-colors cursor-pointer ${
                                                                                currentSpeed === p.val
                                                                                    ? 'bg-sky-600 text-white shadow-sm'
                                                                                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                                                                            }`}
                                                                        >
                                                                            {p.label}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {/* Testimonials Screenshots Manager */}
                                                            <div className="space-y-2.5 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                                                                <div className="flex items-center justify-between">
                                                                    <div>
                                                                        <span className="font-bold text-slate-300 block text-[11px] uppercase tracking-wider">
                                                                            Review Screenshots
                                                                        </span>
                                                                        <span className="text-[10px] text-slate-400">
                                                                            {hasCustomImages
                                                                                ? `${imagesList.length} customized screenshot${imagesList.length === 1 ? '' : 's'}`
                                                                                : 'Using 50 uploaded screenshots (Default)'}
                                                                        </span>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setTestimonialMediaPickerOpen(true)}
                                                                        className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                                                                    >
                                                                        <Plus className="w-3.5 h-3.5" />
                                                                        <span>Add from Media</span>
                                                                    </button>
                                                                </div>

                                                                {/* Preload / Reset helper buttons */}
                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                    <button
                                                                        type="button"
                                                                        disabled={loadingMediaReviews}
                                                                        onClick={async () => {
                                                                            setLoadingMediaReviews(true);
                                                                            try {
                                                                                const { data } = await apiClient.get('/testimonials/marquee');
                                                                                if (data && Array.isArray(data.reviews) && data.reviews.length > 0) {
                                                                                    handleUpdateSelectedSettings('images', data.reviews);
                                                                                    showToast(`Loaded ${data.reviews.length} screenshots from media`);
                                                                                } else {
                                                                                    const fallback = getDefaultMarqueeReviews();
                                                                                    handleUpdateSelectedSettings('images', fallback);
                                                                                    showToast(`Loaded ${fallback.length} default screenshots`);
                                                                                }
                                                                            } catch (e) {
                                                                                const fallback = getDefaultMarqueeReviews();
                                                                                handleUpdateSelectedSettings('images', fallback);
                                                                                showToast(`Loaded ${fallback.length} default screenshots`);
                                                                            } finally {
                                                                                setLoadingMediaReviews(false);
                                                                            }
                                                                        }}
                                                                        className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                                                        title="Load all 50 uploaded screenshots into the list to curate & delete unwanted ones"
                                                                    >
                                                                        <RefreshCw className={`w-3 h-3 text-sky-400 ${loadingMediaReviews ? 'animate-spin' : ''}`} />
                                                                        <span>{hasCustomImages ? 'Reset to All 50 Media' : 'Populate All 50 to Curate'}</span>
                                                                    </button>

                                                                    {hasCustomImages && imagesList.length > 0 && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                handleUpdateSelectedSettings('images', []);
                                                                                showToast('Cleared review images');
                                                                            }}
                                                                            className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-semibold transition-colors cursor-pointer"
                                                                        >
                                                                            Clear All
                                                                        </button>
                                                                    )}
                                                                </div>

                                                                {/* Quick Add URL */}
                                                                <div className="flex items-center gap-1.5 pt-1">
                                                                    <input
                                                                        type="text"
                                                                        value={manualImageUrl}
                                                                        onChange={(e) => setManualImageUrl(e.target.value)}
                                                                        placeholder="Or paste screenshot image URL..."
                                                                        className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-[11px]"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            if (!manualImageUrl.trim()) return;
                                                                            const current = Array.isArray(selectedBlock.settings?.images)
                                                                                ? [...selectedBlock.settings.images]
                                                                                : [];
                                                                            const newImg = {
                                                                                id: String(Date.now()),
                                                                                url: manualImageUrl.trim(),
                                                                                title: `Screenshot ${current.length + 1}`
                                                                            };
                                                                            handleUpdateSelectedSettings('images', [...current, newImg]);
                                                                            setManualImageUrl('');
                                                                            showToast('Screenshot added');
                                                                        }}
                                                                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-[10px] cursor-pointer"
                                                                    >
                                                                        + Add URL
                                                                    </button>
                                                                </div>

                                                                {/* Screenshots List with Thumbnail & Delete Button */}
                                                                {hasCustomImages ? (
                                                                    <div className="space-y-1.5 max-h-72 overflow-y-auto builder-sidebar-scroll pr-1 pt-1">
                                                                        {imagesList.length === 0 ? (
                                                                            <div className="text-center py-6 px-3 bg-slate-900/50 rounded-lg border border-dashed border-slate-800 text-slate-400 text-[11px]">
                                                                                No screenshots in list. Click "Populate All 50 to Curate" or "+ Add from Media".
                                                                            </div>
                                                                        ) : (
                                                                            imagesList.map((img, imgIdx) => {
                                                                                const imgUrl = typeof img === 'string' ? img : img.url;
                                                                                const imgTitle = (typeof img === 'object' && img.title) ? img.title : `Screenshot #${imgIdx + 1}`;
                                                                                return (
                                                                                    <div
                                                                                        key={img.id || imgIdx}
                                                                                        className="flex items-center gap-2 p-1.5 bg-slate-900 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors group"
                                                                                    >
                                                                                        <span className="text-[10px] font-mono text-slate-500 w-5 text-right shrink-0">
                                                                                            #{imgIdx + 1}
                                                                                        </span>
                                                                                        <div className="w-12 h-9 rounded bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                                                                                            <img
                                                                                                src={getImageUrl(imgUrl)}
                                                                                                alt={imgTitle}
                                                                                                className="w-full h-full object-cover"
                                                                                                onError={(e) => {
                                                                                                    const target = e.target as HTMLImageElement;
                                                                                                    target.src = 'https://placehold.co/100x75/0f172a/38bdf8?text=Review';
                                                                                                }}
                                                                                            />
                                                                                        </div>
                                                                                        <div className="flex-1 min-w-0">
                                                                                            <p className="text-[11px] font-medium text-slate-200 truncate" title={imgTitle}>
                                                                                                {imgTitle}
                                                                                            </p>
                                                                                            <p className="text-[9px] text-slate-500 truncate" title={imgUrl}>
                                                                                                {imgUrl}
                                                                                            </p>
                                                                                        </div>
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => {
                                                                                                const updated = imagesList.filter((_, idx) => idx !== imgIdx);
                                                                                                handleUpdateSelectedSettings('images', updated);
                                                                                                showToast(`Removed #${imgIdx + 1}`);
                                                                                            }}
                                                                                            title="Delete this screenshot from review showcase"
                                                                                            className="p-1.5 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                                                                                        >
                                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                                        </button>
                                                                                    </div>
                                                                                );
                                                                            })
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <div className="p-3 bg-sky-950/20 border border-sky-800/30 rounded-xl space-y-2">
                                                                        <p className="text-[11px] text-sky-300 font-medium leading-relaxed">
                                                                            💡 All 50 media images are currently auto-scrolling on the home page.
                                                                        </p>
                                                                        <p className="text-[10px] text-slate-400 leading-relaxed">
                                                                            Click <strong>"Populate All 50 to Curate"</strong> above to load the list here. Then you can inspect each screenshot and delete any non-testimonial images with one click!
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Optional Quotes Manager */}
                                                            <details className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/70 text-slate-400 text-[11px]">
                                                                <summary className="font-semibold text-slate-300 cursor-pointer select-none">
                                                                    Quotes & Text Reviews (Optional)
                                                                </summary>
                                                                <div className="pt-2 space-y-2">
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-[10px] text-slate-400">Add text quotes if needed</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const items = selectedBlock.settings.items || [];
                                                                                const newItem = {
                                                                                    id: String(Date.now()),
                                                                                    name: 'Student Name',
                                                                                    role: 'Batch / College',
                                                                                    rating: 5,
                                                                                    quote: 'Learning with NovoNex has been truly transformative and wonderful!'
                                                                                };
                                                                                handleUpdateSelectedSettings('items', [...items, newItem]);
                                                                            }}
                                                                            className="px-2 py-0.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px] cursor-pointer"
                                                                        >
                                                                            + Add Quote
                                                                        </button>
                                                                    </div>
                                                                    <div className="space-y-2 max-h-48 builder-sidebar-scroll pr-1">
                                                                        {(selectedBlock.settings.items || []).map((item: any, iIdx: number) => (
                                                                            <div key={item.id || iIdx} className="p-2 bg-slate-900 rounded-lg border border-slate-800 space-y-1.5">
                                                                                <div className="flex items-center justify-between">
                                                                                    <span className="font-bold text-sky-400 text-[10px]">Quote #{iIdx + 1}</span>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => {
                                                                                            const items = [...(selectedBlock.settings.items || [])];
                                                                                            items.splice(iIdx, 1);
                                                                                            handleUpdateSelectedSettings('items', items);
                                                                                        }}
                                                                                        className="text-rose-400 hover:text-rose-300 p-0.5"
                                                                                    >
                                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                                    </button>
                                                                                </div>
                                                                                <div className="grid grid-cols-2 gap-1.5">
                                                                                    <input
                                                                                        type="text"
                                                                                        value={item.name || ''}
                                                                                        onChange={(e) => {
                                                                                            const items = [...(selectedBlock.settings.items || [])];
                                                                                            items[iIdx] = { ...items[iIdx], name: e.target.value };
                                                                                            handleUpdateSelectedSettings('items', items);
                                                                                        }}
                                                                                        placeholder="Student Name"
                                                                                        className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-white text-[10px]"
                                                                                    />
                                                                                    <input
                                                                                        type="text"
                                                                                        value={item.role || ''}
                                                                                        onChange={(e) => {
                                                                                            const items = [...(selectedBlock.settings.items || [])];
                                                                                            items[iIdx] = { ...items[iIdx], role: e.target.value };
                                                                                            handleUpdateSelectedSettings('items', items);
                                                                                        }}
                                                                                        placeholder="Role / Institution"
                                                                                        className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-slate-300 text-[10px]"
                                                                                    />
                                                                                </div>
                                                                                <textarea
                                                                                    rows={2}
                                                                                    value={item.quote || ''}
                                                                                    onChange={(e) => {
                                                                                        const items = [...(selectedBlock.settings.items || [])];
                                                                                        items[iIdx] = { ...items[iIdx], quote: e.target.value };
                                                                                        handleUpdateSelectedSettings('items', items);
                                                                                    }}
                                                                                    placeholder="Student Quote"
                                                                                    className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-slate-300 text-[10px]"
                                                                                />
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </details>
                                                        </div>
                                                    );
                                                })()}

                                                {/* --- 11.5. VIDEO TESTIMONIALS COVERFLOW --- */}
                                                {selectedBlock.type === 'video_testimonials' && (
                                                    <div className="space-y-4 text-xs">
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Section Tag</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.sectionTag || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('sectionTag', e.target.value)}
                                                                placeholder="e.g. Student Stories & Video Reviews"
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Main Title</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.sectionTitle || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('sectionTitle', e.target.value)}
                                                                placeholder="e.g. What Our Students Say"
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Subtitle</label>
                                                            <textarea
                                                                rows={2}
                                                                value={selectedBlock.settings.sectionSub || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('sectionSub', e.target.value)}
                                                                placeholder="e.g. Real journeys, genuine experiences, and success stories shared on camera."
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>

                                                        {/* Video List Manager */}
                                                        <div className="pt-3 border-t border-slate-800 space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <span className="font-bold text-slate-200">Video Testimonials</span>
                                                                    <span className="ml-2 text-[11px] text-slate-500">
                                                                        ({(selectedBlock.settings.items || []).length})
                                                                    </span>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const items = selectedBlock.settings.items || [];
                                                                        const newItem = {
                                                                            id: String(Date.now()),
                                                                            name: 'Student Name',
                                                                            role: 'Batch / Goal',
                                                                            videoUrl: '',
                                                                            thumbnailUrl: '',
                                                                        };
                                                                        handleUpdateSelectedSettings('items', [...items, newItem]);
                                                                    }}
                                                                    className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                                                                >
                                                                    <Plus className="w-3.5 h-3.5" />
                                                                    <span>Add Video</span>
                                                                </button>
                                                            </div>

                                                            <div className="space-y-3">
                                                                {(!selectedBlock.settings.items || selectedBlock.settings.items.length === 0) && (
                                                                    <div className="p-4 rounded-xl bg-slate-950 border border-dashed border-slate-800 text-center text-slate-500 text-xs">
                                                                        No video reviews added yet. Click &quot;Add Video&quot; above to add one.
                                                                    </div>
                                                                )}

                                                                {(selectedBlock.settings.items || []).map((item: any, vIdx: number) => {
                                                                    const videoId = getYouTubeVideoId(item.videoUrl);
                                                                    const effectiveThumb = item.thumbnailUrl?.trim()
                                                                        ? getImageUrl(item.thumbnailUrl.trim())
                                                                        : (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '');

                                                                    return (
                                                                        <div
                                                                            key={item.id || vIdx}
                                                                            className="p-3 bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors space-y-2.5"
                                                                        >
                                                                            <div className="flex items-center justify-between">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 font-black text-[10px] flex items-center justify-center">
                                                                                        {vIdx + 1}
                                                                                    </span>
                                                                                    <span className="font-bold text-slate-300 text-xs truncate max-w-[140px]">
                                                                                        {item.name || 'Untitled Video'}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="flex items-center gap-1">
                                                                                    {vIdx > 0 && (
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => {
                                                                                                const items = [...(selectedBlock.settings.items || [])];
                                                                                                const temp = items[vIdx - 1];
                                                                                                items[vIdx - 1] = items[vIdx];
                                                                                                items[vIdx] = temp;
                                                                                                handleUpdateSelectedSettings('items', items);
                                                                                            }}
                                                                                            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                                                                                            title="Move Up"
                                                                                        >
                                                                                            <ChevronUp className="w-3.5 h-3.5" />
                                                                                        </button>
                                                                                    )}
                                                                                    {vIdx < (selectedBlock.settings.items || []).length - 1 && (
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => {
                                                                                                const items = [...(selectedBlock.settings.items || [])];
                                                                                                const temp = items[vIdx + 1];
                                                                                                items[vIdx + 1] = items[vIdx];
                                                                                                items[vIdx] = temp;
                                                                                                handleUpdateSelectedSettings('items', items);
                                                                                            }}
                                                                                            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                                                                                            title="Move Down"
                                                                                        >
                                                                                            <ChevronDown className="w-3.5 h-3.5" />
                                                                                        </button>
                                                                                    )}
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => {
                                                                                            const items = [...(selectedBlock.settings.items || [])];
                                                                                            items.splice(vIdx, 1);
                                                                                            handleUpdateSelectedSettings('items', items);
                                                                                        }}
                                                                                        className="p-1 text-rose-400 hover:text-rose-300 rounded hover:bg-rose-950/40"
                                                                                        title="Delete Video"
                                                                                    >
                                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                                    </button>
                                                                                </div>
                                                                            </div>

                                                                            {/* Student Name & Role */}
                                                                            <div className="grid grid-cols-2 gap-2">
                                                                                <div>
                                                                                    <label className="block text-[10px] text-slate-400 mb-1">Student / Reviewer Name</label>
                                                                                    <input
                                                                                        type="text"
                                                                                        value={item.name || ''}
                                                                                        onChange={(e) => {
                                                                                            const items = [...(selectedBlock.settings.items || [])];
                                                                                            items[vIdx] = { ...items[vIdx], name: e.target.value };
                                                                                            handleUpdateSelectedSettings('items', items);
                                                                                        }}
                                                                                        placeholder="e.g. Farhan Islam"
                                                                                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs"
                                                                                    />
                                                                                </div>
                                                                                <div>
                                                                                    <label className="block text-[10px] text-slate-400 mb-1">Role / Batch / Tag</label>
                                                                                    <input
                                                                                        type="text"
                                                                                        value={item.role || ''}
                                                                                        onChange={(e) => {
                                                                                            const items = [...(selectedBlock.settings.items || [])];
                                                                                            items[vIdx] = { ...items[vIdx], role: e.target.value };
                                                                                            handleUpdateSelectedSettings('items', items);
                                                                                        }}
                                                                                        placeholder="e.g. Student & Guardian"
                                                                                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs"
                                                                                    />
                                                                                </div>
                                                                            </div>

                                                                            {/* YouTube Video URL */}
                                                                            <div>
                                                                                <div className="flex items-center justify-between mb-1">
                                                                                    <label className="block text-[10px] text-slate-400">YouTube Video Link</label>
                                                                                    {videoId ? (
                                                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                                                                                            <Check className="w-3 h-3" />
                                                                                            <span>ID: {videoId}</span>
                                                                                        </span>
                                                                                    ) : item.videoUrl ? (
                                                                                        <span className="text-[10px] text-amber-400">Invalid YouTube URL</span>
                                                                                    ) : null}
                                                                                </div>
                                                                                <input
                                                                                    type="text"
                                                                                    value={item.videoUrl || ''}
                                                                                    onChange={(e) => {
                                                                                        const items = [...(selectedBlock.settings.items || [])];
                                                                                        items[vIdx] = { ...items[vIdx], videoUrl: e.target.value };
                                                                                        handleUpdateSelectedSettings('items', items);
                                                                                    }}
                                                                                    placeholder="https://www.youtube.com/watch?v=... or youtu.be/..."
                                                                                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs font-mono"
                                                                                />
                                                                            </div>

                                                                            {/* Thumbnail Preview & Picker */}
                                                                            <div>
                                                                                <label className="block text-[10px] text-slate-400 mb-1">Cover Thumbnail</label>
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="w-24 h-14 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shrink-0 relative flex items-center justify-center">
                                                                                        {effectiveThumb ? (
                                                                                            <img
                                                                                                src={effectiveThumb}
                                                                                                alt="Preview"
                                                                                                className="w-full h-full object-cover"
                                                                                            />
                                                                                        ) : (
                                                                                            <Video className="w-5 h-5 text-slate-600" />
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="space-y-1.5 flex-1">
                                                                                        <div className="flex items-center gap-1.5">
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => setVideoThumbnailPickerIndex(vIdx)}
                                                                                                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer border border-slate-700"
                                                                                            >
                                                                                                <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                                                                                                <span>Upload / Pick Media</span>
                                                                                            </button>
                                                                                            {item.thumbnailUrl && (
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={() => {
                                                                                                        const items = [...(selectedBlock.settings.items || [])];
                                                                                                        items[vIdx] = { ...items[vIdx], thumbnailUrl: '' };
                                                                                                        handleUpdateSelectedSettings('items', items);
                                                                                                    }}
                                                                                                    className="px-2 py-1 rounded text-rose-400 hover:bg-rose-950/40 text-[10px]"
                                                                                                >
                                                                                                    Use YouTube Auto-Thumb
                                                                                                </button>
                                                                                            )}
                                                                                        </div>
                                                                                        <p className="text-[10px] text-slate-500 leading-tight">
                                                                                            {item.thumbnailUrl
                                                                                                ? 'Custom uploaded thumbnail active.'
                                                                                                : (videoId ? 'Using automatic YouTube HQ thumbnail.' : 'No thumbnail yet.')}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* --- 12. FAQ ACCORDION --- */}
                                                {selectedBlock.type === 'faq_accordion' && (
                                                    <div className="space-y-3 text-xs">
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Section Tag</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.sectionTag || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('sectionTag', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Main Title</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.sectionTitle || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('sectionTitle', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Subtitle</label>
                                                            <textarea
                                                                rows={2}
                                                                value={selectedBlock.settings.sectionSub || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('sectionSub', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>

                                                        {/* FAQ Items Manager */}
                                                        <div className="pt-2 border-t border-slate-800 space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-bold text-slate-300">Questions & Answers</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const items = selectedBlock.settings.items || [];
                                                                        const newItem = {
                                                                            id: String(Date.now()),
                                                                            q: 'Enter your new question here?',
                                                                            a: 'Enter the clear, helpful answer here.'
                                                                        };
                                                                        handleUpdateSelectedSettings('items', [...items, newItem]);
                                                                    }}
                                                                    className="px-2 py-0.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px]"
                                                                >
                                                                    + Add FAQ
                                                                </button>
                                                            </div>
                                                            <div className="space-y-2 max-h-56 builder-sidebar-scroll pr-1">
                                                                {(selectedBlock.settings.items || []).map((faq: any, fIdx: number) => (
                                                                    <div key={faq.id || fIdx} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="font-bold text-sky-400 text-[10px]">Q#{fIdx + 1}</span>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const items = [...(selectedBlock.settings.items || [])];
                                                                                    items.splice(fIdx, 1);
                                                                                    handleUpdateSelectedSettings('items', items);
                                                                                }}
                                                                                className="text-rose-400 hover:text-rose-300 p-1"
                                                                            >
                                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </div>
                                                                        <input
                                                                            type="text"
                                                                            value={faq.q || ''}
                                                                            onChange={(e) => {
                                                                                const items = [...(selectedBlock.settings.items || [])];
                                                                                items[fIdx] = { ...items[fIdx], q: e.target.value };
                                                                                handleUpdateSelectedSettings('items', items);
                                                                            }}
                                                                            placeholder="Question"
                                                                            className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white font-bold"
                                                                        />
                                                                        <textarea
                                                                            rows={2}
                                                                            value={faq.a || ''}
                                                                            onChange={(e) => {
                                                                                const items = [...(selectedBlock.settings.items || [])];
                                                                                items[fIdx] = { ...items[fIdx], a: e.target.value };
                                                                                handleUpdateSelectedSettings('items', items);
                                                                            }}
                                                                            placeholder="Answer"
                                                                            className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-300 text-[11px]"
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* --- 13. FEATURES (WHY CHOOSE US) --- */}
                                                {selectedBlock.type === 'features' && (
                                                    <div className="space-y-3 text-xs">
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Section Tag</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.sectionTag || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('sectionTag', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Main Title</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.sectionTitle || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('sectionTitle', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Subtitle</label>
                                                            <textarea
                                                                rows={2}
                                                                value={selectedBlock.settings.sectionSub || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('sectionSub', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>

                                                        {/* Feature Cards Manager */}
                                                        <div className="pt-2 border-t border-slate-800 space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-bold text-slate-300">Feature Cards</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const items = selectedBlock.settings.items || [];
                                                                        const newItem = {
                                                                            id: String(Date.now()),
                                                                            icon: 'Award',
                                                                            title: 'New Feature Advantage',
                                                                            desc: 'Enter detailed description of this feature.'
                                                                        };
                                                                        handleUpdateSelectedSettings('items', [...items, newItem]);
                                                                    }}
                                                                    className="px-2 py-0.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px]"
                                                                >
                                                                    + Add Card
                                                                </button>
                                                            </div>
                                                            <div className="space-y-2 max-h-56 builder-sidebar-scroll pr-1">
                                                                {(selectedBlock.settings.items || []).map((feat: any, idx: number) => (
                                                                    <div key={feat.id || idx} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="font-bold text-sky-400 text-[10px]">Card #{idx + 1}</span>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const items = [...(selectedBlock.settings.items || [])];
                                                                                    items.splice(idx, 1);
                                                                                    handleUpdateSelectedSettings('items', items);
                                                                                }}
                                                                                className="text-rose-400 hover:text-rose-300 p-1"
                                                                            >
                                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </div>
                                                                        <input
                                                                            type="text"
                                                                            value={feat.title || ''}
                                                                            onChange={(e) => {
                                                                                const items = [...(selectedBlock.settings.items || [])];
                                                                                items[idx] = { ...items[idx], title: e.target.value };
                                                                                handleUpdateSelectedSettings('items', items);
                                                                            }}
                                                                            placeholder="Card Title"
                                                                            className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white font-bold"
                                                                        />
                                                                        <textarea
                                                                            rows={2}
                                                                            value={feat.desc || ''}
                                                                            onChange={(e) => {
                                                                                const items = [...(selectedBlock.settings.items || [])];
                                                                                items[idx] = { ...items[idx], desc: e.target.value };
                                                                                handleUpdateSelectedSettings('items', items);
                                                                            }}
                                                                            placeholder="Card Description"
                                                                            className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-300 text-[11px]"
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* --- 14. STATS COUNTER --- */}
                                                {selectedBlock.type === 'stats_counter' && (
                                                    <div className="space-y-3 text-xs">
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-bold text-slate-300">Metrics Counters</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const stats = selectedBlock.settings.stats || [];
                                                                    handleUpdateSelectedSettings('stats', [
                                                                        ...stats,
                                                                        { label: 'Metric Name', value: '100+' }
                                                                    ]);
                                                                }}
                                                                className="px-2 py-0.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px]"
                                                            >
                                                                + Add Metric
                                                            </button>
                                                        </div>
                                                        <div className="space-y-2 max-h-56 builder-sidebar-scroll pr-1">
                                                            {(selectedBlock.settings.stats || []).map((stat: any, sIdx: number) => (
                                                                <div key={sIdx} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="font-bold text-sky-400 text-[10px]">Counter #{sIdx + 1}</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const stats = [...(selectedBlock.settings.stats || [])];
                                                                                stats.splice(sIdx, 1);
                                                                                handleUpdateSelectedSettings('stats', stats);
                                                                            }}
                                                                            className="text-rose-400 hover:text-rose-300 p-1"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        <input
                                                                            type="text"
                                                                            value={stat.value || ''}
                                                                            onChange={(e) => {
                                                                                const stats = [...(selectedBlock.settings.stats || [])];
                                                                                stats[sIdx] = { ...stats[sIdx], value: e.target.value };
                                                                                handleUpdateSelectedSettings('stats', stats);
                                                                            }}
                                                                            placeholder="Value (e.g. 10,000+)"
                                                                            className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-sky-400 font-bold"
                                                                        />
                                                                        <input
                                                                            type="text"
                                                                            value={stat.label || ''}
                                                                            onChange={(e) => {
                                                                                const stats = [...(selectedBlock.settings.stats || [])];
                                                                                stats[sIdx] = { ...stats[sIdx], label: e.target.value };
                                                                                handleUpdateSelectedSettings('stats', stats);
                                                                            }}
                                                                            placeholder="Label (e.g. Students)"
                                                                            className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* --- 15. CTA BANNER --- */}
                                                {selectedBlock.type === 'cta_banner' && (
                                                    <div className="space-y-3 text-xs">
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Badge</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.badge || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('badge', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Headline</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.title || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('title', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Subtitle</label>
                                                            <textarea
                                                                rows={2}
                                                                value={selectedBlock.settings.subtitle || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('subtitle', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">Button Text</label>
                                                                <input
                                                                    type="text"
                                                                    value={selectedBlock.settings.buttonText || ''}
                                                                    onChange={(e) => handleUpdateSelectedSettings('buttonText', e.target.value)}
                                                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-slate-400 font-bold mb-1">Button Link</label>
                                                                <input
                                                                    type="text"
                                                                    value={selectedBlock.settings.buttonLink || ''}
                                                                    onChange={(e) => handleUpdateSelectedSettings('buttonLink', e.target.value)}
                                                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Color Theme</label>
                                                            <select
                                                                value={selectedBlock.settings.bgColor || 'sky'}
                                                                onChange={(e) => handleUpdateSelectedSettings('bgColor', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                                                            >
                                                                <option value="sky">Sky Blue</option>
                                                                <option value="indigo">Deep Indigo</option>
                                                                <option value="emerald">Emerald Green</option>
                                                                <option value="rose">Rose Red</option>
                                                                <option value="amber">Warm Amber</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* --- 16. RICH TEXT --- */}
                                                {selectedBlock.type === 'rich_text' && (
                                                    <div className="space-y-3 text-xs">
                                                        <label className="block text-slate-400 font-bold mb-1 flex items-center justify-between">
                                                            <span>Content HTML</span>
                                                            <span className="text-[10px] text-amber-400">Supports HTML</span>
                                                        </label>
                                                        <textarea
                                                            rows={12}
                                                            value={selectedBlock.settings.content || ''}
                                                            onChange={(e) => handleUpdateSelectedSettings('content', e.target.value)}
                                                            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono text-xs leading-relaxed"
                                                        />
                                                    </div>
                                                )}

                                                {/* --- 17. VIDEO EMBED --- */}
                                                {selectedBlock.type === 'video_embed' && (
                                                    <div className="space-y-3 text-xs">
                                                        <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-[11px] text-emerald-300">
                                                            ✨ Modern Plyr.js player with hidden branding and full controls.
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Video URL (YouTube / Vimeo / MP4)</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.videoUrl || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('videoUrl', e.target.value)}
                                                                placeholder="https://www.youtube.com/watch?v=..."
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Title</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.title || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('title', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Subtitle</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.subtitle || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('subtitle', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* --- 18. COURSE TABS --- */}
                                                {selectedBlock.type === 'course_tabs' && (
                                                    <div className="space-y-4 text-xs">
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Heading Tag</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.headingTag || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('headingTag', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Main Title</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.headingTitle || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('headingTitle', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Course Display Limit</label>
                                                            <input
                                                                type="number"
                                                                value={selectedBlock.settings.limit || 12}
                                                                onChange={(e) => handleUpdateSelectedSettings('limit', parseInt(e.target.value) || 12)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1 flex items-center justify-between">
                                                                <span>Course Sort Order</span>
                                                                <span className="text-[10px] text-sky-400 font-normal">Arrangement</span>
                                                            </label>
                                                            <select
                                                                value={selectedBlock.settings.sortBy || 'best_selling'}
                                                                onChange={(e) => handleUpdateSelectedSettings('sortBy', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold cursor-pointer focus:ring-2 focus:ring-sky-500"
                                                            >
                                                                <option value="best_selling">Best Selling / Highest Sales (Most Enrolled)</option>
                                                                <option value="alphabetical_asc">Alphabetical (A - Z)</option>
                                                                <option value="alphabetical_desc">Alphabetical (Z - A)</option>
                                                                <option value="latest">Newest First (Latest Added)</option>
                                                                <option value="oldest">Oldest First</option>
                                                                <option value="price_low">Price (Low to High)</option>
                                                                <option value="price_high">Price (High to Low)</option>
                                                            </select>
                                                            <p className="text-[10px] text-slate-500 mt-1">
                                                                Choose whether courses are arranged by highest sales or alphabetically.
                                                            </p>
                                                        </div>

                                                        {/* Category Selection in Builder */}
                                                        <div className="pt-2 border-t border-slate-800 space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <label className="block text-slate-300 font-bold">Categories to Show</label>
                                                                <div className="flex items-center gap-2 text-[10px]">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const validCats = dbCategories.filter(c => c.slug !== 'free-courses' && c.slug !== 'paid-courses');
                                                                            const allSlugs = validCats.map(c => c.slug);
                                                                            const newTabs = [
                                                                                { id: 'tab_all', label: selectedBlock.settings.allTabLabel || 'All Courses', type: 'category' as const, categorySlug: 'all' },
                                                                                ...validCats.map(c => ({
                                                                                    id: `tab_${c.slug}`,
                                                                                    label: c.name,
                                                                                    type: 'category' as const,
                                                                                    categorySlug: c.slug,
                                                                                }))
                                                                            ];
                                                                            handleUpdateSelectedSettings('selectedCategorySlugs', allSlugs);
                                                                            handleUpdateSelectedSettings('tabs', newTabs);
                                                                        }}
                                                                        className="text-sky-400 hover:text-sky-300 font-bold cursor-pointer"
                                                                    >
                                                                        Select All
                                                                    </button>
                                                                    <span className="text-slate-600">•</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            handleUpdateSelectedSettings('selectedCategorySlugs', []);
                                                                            handleUpdateSelectedSettings('tabs', [
                                                                                { id: 'tab_all', label: selectedBlock.settings.allTabLabel || 'All Courses', type: 'category' as const, categorySlug: 'all' }
                                                                            ]);
                                                                        }}
                                                                        className="text-slate-400 hover:text-slate-300 cursor-pointer"
                                                                    >
                                                                        Clear
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-1.5 max-h-48 builder-sidebar-scroll pr-1">
                                                                {dbCategories
                                                                    .filter(c => c.slug !== 'free-courses' && c.slug !== 'paid-courses')
                                                                    .map(cat => {
                                                                        const currentSlugs: string[] = selectedBlock.settings.selectedCategorySlugs ||
                                                                            (selectedBlock.settings.tabs || [])
                                                                                .filter((t: CourseTabItem) => t.type === 'category' && t.categorySlug !== 'all')
                                                                                .map((t: CourseTabItem) => t.categorySlug as string);
                                                                        const isChecked = currentSlugs.includes(cat.slug);

                                                                        return (
                                                                            <label
                                                                                key={cat.id}
                                                                                className={`flex items-center gap-2 p-2 rounded-lg border text-[11px] font-bold cursor-pointer transition-all ${isChecked
                                                                                    ? 'bg-sky-950/40 border-sky-600 text-sky-200'
                                                                                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                                                                                    }`}
                                                                            >
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={isChecked}
                                                                                    onChange={() => {
                                                                                        const newSlugs = isChecked
                                                                                            ? currentSlugs.filter(s => s !== cat.slug)
                                                                                            : [...currentSlugs, cat.slug];

                                                                                        handleUpdateSelectedSettings('selectedCategorySlugs', newSlugs);

                                                                                        const currentTabs: CourseTabItem[] = selectedBlock.settings.tabs || [];
                                                                                        const allTab = currentTabs.find(t => t.categorySlug === 'all') || {
                                                                                            id: 'tab_all',
                                                                                            label: 'All Courses',
                                                                                            type: 'category' as const,
                                                                                            categorySlug: 'all',
                                                                                        };
                                                                                        const customHtmlTabs = currentTabs.filter(t => t.type === 'html');

                                                                                        const updatedCatTabs = dbCategories
                                                                                            .filter(c => newSlugs.includes(c.slug))
                                                                                            .map(c => {
                                                                                                const existing = currentTabs.find(t => t.categorySlug === c.slug);
                                                                                                return existing || {
                                                                                                    id: `tab_${c.slug}`,
                                                                                                    label: c.name,
                                                                                                    type: 'category' as const,
                                                                                                    categorySlug: c.slug,
                                                                                                };
                                                                                            });

                                                                                        handleUpdateSelectedSettings('tabs', [allTab, ...updatedCatTabs, ...customHtmlTabs]);
                                                                                    }}
                                                                                    className="rounded text-sky-500 focus:ring-sky-500"
                                                                                />
                                                                                <span className="truncate flex-1">{cat.name}</span>
                                                                                {cat.courses_count !== undefined && (
                                                                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400">
                                                                                        {cat.courses_count} course(s)
                                                                                    </span>
                                                                                )}
                                                                            </label>
                                                                        );
                                                                    })}
                                                            </div>
                                                        </div>

                                                        {/* Tabs Configuration */}
                                                        <div className="pt-2 border-t border-slate-800 space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <label className="block text-slate-300 font-bold">Manage Tabs</label>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const currentTabs: CourseTabItem[] = selectedBlock.settings.tabs || [];
                                                                        const newTab: CourseTabItem = {
                                                                            id: `tab_${Date.now()}`,
                                                                            label: 'New Tab',
                                                                            type: 'category',
                                                                            categorySlug: 'all',
                                                                        };
                                                                        handleUpdateSelectedSettings('tabs', [...currentTabs, newTab]);
                                                                    }}
                                                                    className="px-2.5 py-1 bg-sky-600/80 hover:bg-sky-600 text-white font-bold text-[11px] rounded-lg cursor-pointer"
                                                                >
                                                                    + Add Tab
                                                                </button>
                                                            </div>

                                                            <div className="space-y-3">
                                                                {(selectedBlock.settings.tabs || []).map((tab: CourseTabItem, tabIdx: number) => (
                                                                    <div key={tab.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="font-bold text-white text-[11px]">Tab #{tabIdx + 1}</span>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const updated = [...selectedBlock.settings.tabs];
                                                                                    updated.splice(tabIdx, 1);
                                                                                    handleUpdateSelectedSettings('tabs', updated);
                                                                                }}
                                                                                className="text-rose-400 hover:text-rose-300"
                                                                            >
                                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </div>

                                                                        <div>
                                                                            <label className="block text-slate-400 text-[10px] mb-1">Tab Label</label>
                                                                            <input
                                                                                type="text"
                                                                                value={tab.label}
                                                                                onChange={(e) => {
                                                                                    const updated = [...selectedBlock.settings.tabs];
                                                                                    updated[tabIdx].label = e.target.value;
                                                                                    handleUpdateSelectedSettings('tabs', updated);
                                                                                }}
                                                                                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-white"
                                                                            />
                                                                        </div>

                                                                        <div>
                                                                            <label className="block text-slate-400 text-[10px] mb-1">Tab Type</label>
                                                                            <select
                                                                                value={tab.type}
                                                                                onChange={(e) => {
                                                                                    const updated = [...selectedBlock.settings.tabs];
                                                                                    updated[tabIdx].type = e.target.value as any;
                                                                                    handleUpdateSelectedSettings('tabs', updated);
                                                                                }}
                                                                                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-white font-bold"
                                                                            >
                                                                                <option value="category">Category Courses</option>
                                                                                <option value="html">Custom HTML Widget</option>
                                                                            </select>
                                                                        </div>

                                                                        {tab.type === 'category' ? (
                                                                            <div>
                                                                                <label className="block text-slate-400 text-[10px] mb-1">Category</label>
                                                                                <select
                                                                                    value={tab.categorySlug || 'all'}
                                                                                    onChange={(e) => {
                                                                                        const updated = [...selectedBlock.settings.tabs];
                                                                                        updated[tabIdx].categorySlug = e.target.value;
                                                                                        handleUpdateSelectedSettings('tabs', updated);
                                                                                    }}
                                                                                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-white font-bold"
                                                                                >
                                                                                    <option value="all">All Courses</option>
                                                                                    {dbCategories.map(cat => (
                                                                                        <option key={cat.id} value={cat.slug}>{cat.name} ({cat.slug})</option>
                                                                                    ))}
                                                                                </select>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="space-y-2">
                                                                                <label className="block text-slate-400 text-[10px]">Custom HTML Code for this Tab</label>
                                                                                <textarea
                                                                                    rows={4}
                                                                                    value={tab.htmlContent || ''}
                                                                                    onChange={(e) => {
                                                                                        const updated = [...selectedBlock.settings.tabs];
                                                                                        updated[tabIdx].htmlContent = e.target.value;
                                                                                        handleUpdateSelectedSettings('tabs', updated);
                                                                                    }}
                                                                                    placeholder="<div>Custom content...</div>"
                                                                                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-white font-mono text-[11px]"
                                                                                />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* --- 19. HTML WIDGET --- */}
                                                {selectedBlock.type === 'html_widget' && (
                                                    <div className="space-y-4 text-xs">
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Container Width</label>
                                                            <select
                                                                value={selectedBlock.settings.containerWidth || 'boxed'}
                                                                onChange={(e) => handleUpdateSelectedSettings('containerWidth', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                                                            >
                                                                <option value="boxed">Boxed (Centered Container)</option>
                                                                <option value="full">Full Width (100% Screen)</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 font-bold mb-1">Background Color</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.settings.bgColor || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('bgColor', e.target.value)}
                                                                placeholder="#ffffff or transparent"
                                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-300 font-bold mb-1 flex items-center justify-between">
                                                                <span>HTML Code</span>
                                                                <span className="text-[10px] text-amber-400">Live Rendered</span>
                                                            </label>
                                                            <textarea
                                                                rows={10}
                                                                value={selectedBlock.settings.html || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('html', e.target.value)}
                                                                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 font-mono text-xs leading-relaxed focus:border-sky-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-300 font-bold mb-1 flex items-center justify-between">
                                                                <span>Custom Scoped CSS</span>
                                                                <span className="text-[10px] text-sky-400">Styling</span>
                                                            </label>
                                                            <textarea
                                                                rows={6}
                                                                value={selectedBlock.settings.css || ''}
                                                                onChange={(e) => handleUpdateSelectedSettings('css', e.target.value)}
                                                                placeholder=".my-class { border-radius: 12px; }"
                                                                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sky-300 font-mono text-xs leading-relaxed focus:border-sky-500"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* SUBTAB 2: STYLE */}
                                        {inspectorSubTab === 'style' && (
                                            <div className="space-y-4 text-xs">
                                                {/* Alignment */}
                                                <div>
                                                    <label className="block text-slate-400 font-bold mb-1.5">Alignment</label>
                                                    <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                                                        {(['left', 'center', 'right'] as const).map(align => (
                                                            <button
                                                                key={align}
                                                                type="button"
                                                                onClick={() => handleUpdateSelectedSettings('textAlign', align)}
                                                                className={`py-1.5 capitalize rounded-lg text-xs font-bold transition-all cursor-pointer ${selectedBlock.settings.textAlign === align
                                                                    ? 'bg-sky-600 text-white shadow-xs'
                                                                    : 'text-slate-400 hover:text-white'
                                                                    }`}
                                                            >
                                                                {align}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Background Color */}
                                                <div>
                                                    <label className="block text-slate-400 font-bold mb-1.5">Background Color</label>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="color"
                                                            value={selectedBlock.settings.bgColor || '#ffffff'}
                                                            onChange={(e) => handleUpdateSelectedSettings('bgColor', e.target.value)}
                                                            className="w-8 h-8 rounded-lg bg-transparent border border-slate-700 cursor-pointer shrink-0"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={selectedBlock.settings.bgColor || ''}
                                                            onChange={(e) => handleUpdateSelectedSettings('bgColor', e.target.value)}
                                                            placeholder="#ffffff or transparent"
                                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Text Color */}
                                                <div>
                                                    <label className="block text-slate-400 font-bold mb-1.5">Text Color</label>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="color"
                                                            value={selectedBlock.settings.textColor || '#0f172a'}
                                                            onChange={(e) => handleUpdateSelectedSettings('textColor', e.target.value)}
                                                            className="w-8 h-8 rounded-lg bg-transparent border border-slate-700 cursor-pointer shrink-0"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={selectedBlock.settings.textColor || ''}
                                                            onChange={(e) => handleUpdateSelectedSettings('textColor', e.target.value)}
                                                            placeholder="#0f172a or inherit"
                                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Padding Top & Bottom */}
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="block text-slate-400 font-bold mb-1.5">Padding Top (px)</label>
                                                        <input
                                                            type="number"
                                                            value={selectedBlock.settings.paddingTop ?? ''}
                                                            onChange={(e) => handleUpdateSelectedSettings('paddingTop', e.target.value === '' ? undefined : parseInt(e.target.value))}
                                                            placeholder="e.g. 48"
                                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-slate-400 font-bold mb-1.5">Padding Bottom (px)</label>
                                                        <input
                                                            type="number"
                                                            value={selectedBlock.settings.paddingBottom ?? ''}
                                                            onChange={(e) => handleUpdateSelectedSettings('paddingBottom', e.target.value === '' ? undefined : parseInt(e.target.value))}
                                                            placeholder="e.g. 48"
                                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* SUBTAB 3: ADVANCED */}
                                        {inspectorSubTab === 'advanced' && (
                                            <div className="space-y-4 text-xs">
                                                <div>
                                                    <label className="block text-slate-400 font-bold mb-1.5">CSS Class Name</label>
                                                    <input
                                                        type="text"
                                                        value={selectedBlock.settings.customClass || ''}
                                                        onChange={(e) => handleUpdateSelectedSettings('customClass', e.target.value)}
                                                        placeholder="my-custom-section"
                                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-slate-400 font-bold mb-1.5">HTML Anchor / ID</label>
                                                    <input
                                                        type="text"
                                                        value={selectedBlock.settings.htmlId || ''}
                                                        onChange={(e) => handleUpdateSelectedSettings('htmlId', e.target.value)}
                                                        placeholder="e.g. about-us"
                                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-slate-400 font-bold mb-1.5 flex items-center justify-between">
                                                        <span>Scoped Widget CSS</span>
                                                        <span className="text-[10px] text-sky-400">Elementor Style</span>
                                                    </label>
                                                    <p className="text-[11px] text-slate-500 mb-2">
                                                        CSS written here applies only to this specific widget instance.
                                                    </p>
                                                    <textarea
                                                        rows={8}
                                                        value={selectedBlock.settings.scopedCss || ''}
                                                        onChange={(e) => handleUpdateSelectedSettings('scopedCss', e.target.value)}
                                                        placeholder={`/* Scoped CSS example: */\n.elementor-block-wrapper h2 { color: #0284c7; }`}
                                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sky-300 font-mono text-xs leading-relaxed focus:border-sky-500"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 3: PAGE GLOBAL CSS */}
                        {activeSidebarTab === 'css' && (
                            <div className="space-y-4 text-xs">
                                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    Global CSS for this Page
                                </div>
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                    Write any custom CSS rules here. They will automatically apply to both the live canvas and the published page.
                                </p>
                                <textarea
                                    rows={16}
                                    value={customCss}
                                    onChange={(e) => setCustomCss(e.target.value)}
                                    placeholder="/* Example: */&#10;.custom-title { color: #0284c7; }&#10;section { scroll-margin-top: 80px; }"
                                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sky-400 font-mono text-xs leading-relaxed focus:border-sky-500"
                                />
                            </div>
                        )}
                    </div>
                </aside>

                {/* Sidebar Toggle Handle */}
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="self-center -ml-3 z-30 w-6 h-12 bg-slate-800 hover:bg-sky-600 text-slate-400 hover:text-white rounded-r-lg border border-l-0 border-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                    title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
                >
                    {sidebarOpen ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeftOpen className="w-3.5 h-3.5" />}
                </button>

                {/* ---------------- CENTER CANVAS AREA ---------------- */}
                <main
                    ref={mainCanvasRef}
                    className="flex-1 min-h-0 h-full bg-slate-950 p-3 sm:p-5 flex flex-col items-center justify-start overflow-hidden relative"
                >
                    {/* Responsive Frame Container */}
                    <div
                        ref={canvasFrameRef}
                        tabIndex={0}
                        className={`transition-all duration-300 bg-white rounded-2xl shadow-2xl border border-slate-800 text-slate-900 flex flex-col h-[calc(100vh-5.5rem)] max-h-[calc(100vh-5.5rem)] overflow-y-scroll builder-frame-scroll relative outline-none ${deviceView === 'desktop'
                            ? 'w-full max-w-[1280px]'
                            : deviceView === 'tablet'
                                ? 'w-[768px]'
                                : 'w-[375px]'
                            }`}
                    >
                        {blocks.length === 0 ? (
                            <div
                                onDragOver={(e) => handleDragOver(e, 0)}
                                onDragLeave={() => setActiveDropZoneIndex(null)}
                                onDrop={(e) => handleDrop(e, 0)}
                                className={`py-32 text-center transition-all m-4 rounded-2xl border-2 border-dashed ${isDragging && activeDropZoneIndex === 0
                                    ? 'bg-sky-500/20 border-sky-500 ring-4 ring-sky-500/20 text-sky-600 scale-[1.01]'
                                    : 'border-slate-300 text-slate-400'
                                    }`}
                            >
                                <Layers className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-slate-700">
                                    {isDragging ? 'Drop widget here!' : 'No widgets added to this page yet'}
                                </h3>
                                <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">
                                    Drag and drop any widget from the left panel here, or click to add.
                                </p>
                                {!isDragging && (
                                    <button
                                        type="button"
                                        onClick={() => handleAddBlock('hero')}
                                        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 text-white font-bold text-sm shadow-md cursor-pointer hover:bg-sky-700"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span>Add Hero Banner</span>
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="p-3 pb-24 space-y-0">
                                {/* Drop Zone at Top (index 0) */}
                                <DropZone
                                    index={0}
                                    isDragging={isDragging}
                                    isActive={activeDropZoneIndex === 0}
                                    onDragOver={(e) => handleDragOver(e, 0)}
                                    onDragLeave={() => setActiveDropZoneIndex(null)}
                                    onDrop={(e) => handleDrop(e, 0)}
                                    onQuickAdd={() => handleAddBlock('html_widget', 0)}
                                />

                                {blocks.map((block, idx) => {
                                    const isSelected = selectedBlockId === block.id;
                                    const isBlockBeingDragged = draggedBlockIndex === idx;

                                    return (
                                        <React.Fragment key={block.id}>
                                            <div
                                                onClick={() => {
                                                    setSelectedBlockId(block.id);
                                                    setActiveSidebarTab('inspector');
                                                }}
                                                className={`relative group transition-all rounded-xl cursor-pointer ${isBlockBeingDragged
                                                    ? 'opacity-40 border-2 border-dashed border-sky-500 scale-[0.98]'
                                                    : isSelected
                                                        ? 'ring-3 ring-sky-500 ring-inset shadow-md'
                                                        : 'hover:outline hover:outline-2 hover:outline-sky-400/60'
                                                    }`}
                                            >
                                                {/* Hover / Active Block Toolbar */}
                                                <div className="absolute top-2 right-2 z-30 flex items-center gap-1 bg-slate-900/95 backdrop-blur-xs text-white p-1 rounded-xl shadow-lg border border-slate-700 opacity-90 group-hover:opacity-100 transition-opacity">
                                                    {/* Drag to Reorder Handle */}
                                                    <div
                                                        draggable={true}
                                                        onDragStart={(e) => handleBlockDragStart(e, idx)}
                                                        onDragEnd={handleDragEnd}
                                                        className="px-2 py-1 flex items-center gap-1 text-slate-300 hover:text-white cursor-grab active:cursor-grabbing rounded hover:bg-slate-800"
                                                        title="Drag to reorder"
                                                    >
                                                        <GripVertical className="w-3.5 h-3.5 text-sky-400" />
                                                        <span className="text-[10px] font-bold">Move</span>
                                                    </div>

                                                    <div className="h-3 w-px bg-slate-700" />

                                                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-400">
                                                        {block.type}
                                                    </span>

                                                    <div className="h-3 w-px bg-slate-700" />

                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); handleMoveBlock(idx, 'up'); }}
                                                        disabled={idx === 0}
                                                        className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                                                        title="Move Up"
                                                    >
                                                        <ChevronUp className="w-3.5 h-3.5" />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); handleMoveBlock(idx, 'down'); }}
                                                        disabled={idx === blocks.length - 1}
                                                        className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                                                        title="Move Down"
                                                    >
                                                        <ChevronDown className="w-3.5 h-3.5" />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedBlockId(block.id);
                                                            setActiveSidebarTab('inspector');
                                                        }}
                                                        className="p-1 rounded hover:bg-slate-800 cursor-pointer text-sky-400"
                                                        title="Edit Settings"
                                                    >
                                                        <Sliders className="w-3.5 h-3.5" />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); handleDuplicateBlock(idx); }}
                                                        className="p-1 rounded hover:bg-slate-800 cursor-pointer"
                                                        title="Clone"
                                                    >
                                                        <Copy className="w-3.5 h-3.5" />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteBlock(idx); }}
                                                        className="p-1 rounded hover:bg-rose-900/50 text-rose-400 cursor-pointer"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>

                                                {/* Live Rendered Block Content */}
                                                <PageBlockRenderer block={block} isBuilder={true} />
                                            </div>

                                            {/* Drop Zone after this block (index idx + 1) */}
                                            <DropZone
                                                index={idx + 1}
                                                isDragging={isDragging}
                                                isActive={activeDropZoneIndex === idx + 1}
                                                onDragOver={(e) => handleDragOver(e, idx + 1)}
                                                onDragLeave={() => setActiveDropZoneIndex(null)}
                                                onDrop={(e) => handleDrop(e, idx + 1)}
                                                onQuickAdd={() => handleAddBlock('html_widget', idx + 1)}
                                            />
                                        </React.Fragment>
                                    );
                                })}

                                {/* Bottom Action: Add New Section / Open Widgets */}
                                <div className="py-8 my-6 text-center border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50/70 hover:bg-sky-50/50 transition-colors flex flex-col items-center justify-center gap-3">
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setActiveSidebarTab('widgets');
                                                setSidebarOpen(true);
                                            }}
                                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-600/30 transition-all cursor-pointer"
                                        >
                                            <Plus className="w-4 h-4" />
                                            <span>Add New Widget</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={scrollToTop}
                                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs shadow-xs transition-colors cursor-pointer"
                                        >
                                            <ChevronUp className="w-4 h-4 text-sky-500" />
                                            <span>Back to Top</span>
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-slate-400">
                                        Choose from 19 widgets in the left sidebar or drag & drop anywhere onto the canvas.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Floating Quick Navigation & Scroll Controller */}
                    <div className="fixed bottom-6 right-8 z-40 flex items-center gap-1.5 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 p-1.5 rounded-2xl shadow-2xl">
                        <button
                            type="button"
                            onClick={scrollToTop}
                            className="px-2.5 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                            title="Scroll to Top"
                        >
                            <ChevronUp className="w-4 h-4 text-sky-400" />
                            <span className="hidden sm:inline">Top</span>
                        </button>
                        <div className="w-px h-4 bg-slate-700" />
                        <span className="text-[11px] font-bold text-slate-400 px-1.5 hidden md:inline">
                            {blocks.length} Sections
                        </span>
                        <div className="w-px h-4 bg-slate-700 hidden md:block" />
                        <button
                            type="button"
                            onClick={scrollToBottom}
                            className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-md shadow-sky-600/30"
                            title="Scroll to Bottom"
                        >
                            <ChevronDown className="w-4 h-4 animate-bounce" />
                            <span>Bottom</span>
                        </button>
                    </div>
                </main>
            </div>

            {/* Testimonials Review Screenshot Media Picker Modal */}
            {testimonialMediaPickerOpen && (
                <MediaPickerModal
                    isOpen={testimonialMediaPickerOpen}
                    onClose={() => setTestimonialMediaPickerOpen(false)}
                    filterType="image"
                    title="Select Testimonial / Review Screenshot"
                    onSelect={(url, item) => {
                        if (!selectedBlock) return;
                        const currentImages = Array.isArray(selectedBlock.settings?.images)
                            ? [...selectedBlock.settings.images]
                            : [];
                        const newImg = {
                            id: item?.id ? String(item.id) : String(Date.now()),
                            url: url,
                            title: item?.file_name || `Screenshot ${currentImages.length + 1}`,
                        };
                        handleUpdateSelectedSettings('images', [...currentImages, newImg]);
                        setTestimonialMediaPickerOpen(false);
                        showToast('Review screenshot added!');
                    }}
                />
            )}

            {/* Video Testimonial Thumbnail Media Picker Modal */}
            {videoThumbnailPickerIndex !== null && (
                <MediaPickerModal
                    isOpen={videoThumbnailPickerIndex !== null}
                    onClose={() => setVideoThumbnailPickerIndex(null)}
                    filterType="image"
                    title="Select Video Testimonial Cover Thumbnail"
                    onSelect={(url) => {
                        if (selectedBlock && videoThumbnailPickerIndex !== null) {
                            const items = [...(selectedBlock.settings?.items || [])];
                            if (items[videoThumbnailPickerIndex]) {
                                items[videoThumbnailPickerIndex] = {
                                    ...items[videoThumbnailPickerIndex],
                                    thumbnailUrl: url,
                                };
                                handleUpdateSelectedSettings('items', items);
                            }
                        }
                        setVideoThumbnailPickerIndex(null);
                        showToast('Video cover thumbnail updated!');
                    }}
                />
            )}
        </div>
    );
};