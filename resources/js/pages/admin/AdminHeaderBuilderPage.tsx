import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../api/client';
import { HeaderSettings, HeaderMenuItem } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { MediaPickerModal } from '../../components/shared/MediaPickerModal';
import { getLocalizedText } from '../../utils/localization';
import {
    Sliders,
    Save,
    CheckCircle2,
    Plus,
    Trash2,
    MoveUp,
    MoveDown,
    ExternalLink,
    Sparkles,
    Image as ImageIcon,
    UploadCloud,
    Loader2,
    Eye,
    Monitor,
    Smartphone,
    RotateCcw,
    Layers,
    Bell,
    Check,
    Palette,
    ChevronDown,
    ChevronRight,
    X,
    PhoneCall
} from 'lucide-react';

const DEFAULT_HEADER_SETTINGS: HeaderSettings = {
    sticky: true,
    show_theme_toggle: true,
    show_auth_buttons: true,
    logo_url: null,
    logo_height: 44,
    brand_title: 'DoctorWallah',
    brand_title_en: 'DoctorWallah',
    brand_subtitle: '',
    brand_subtitle_en: '',
    announcement_enabled: false,
    announcement_text: '🎉 New batch admission open! Enroll now with special discount.',
    announcement_text_en: '🎉 New batch admission open! Enroll now with special discount.',
    announcement_link: '/courses',
    announcement_bg: '#CC1200',
    cta_button_enabled: false,
    cta_button_text: 'Free Classes',
    cta_button_text_en: 'Free Classes',
    cta_button_link: '/courses?type=free',
    banner_enabled: false,
    banner_mode: 'image',
    banner_image_url: null,
    banner_link: '/courses',
    banner_link_open_new_tab: false,
    banner_bg_color: '#8a0000',
    banner_text_color: '#ffffff',
    banner_title: 'First class of the new batch is completely free!',
    banner_subtitle: 'Join now to register',
    banner_btn_text: 'Click Here',
    banner_btn_link: '/courses',
    banner_btn_bg: '#16a34a',
    banner_btn_text_color: '#ffffff',
    banner_secondary_text: 'Hotline 16910',
    banner_secondary_link: 'tel:16910',
    banner_closeable: true,
    banner_show_on: 'all',
    menu_items: [
        {
            id: '1',
            label: 'Home',
            label_en: 'Home',
            url: '/',
            is_external: false,
            highlight: false,
        },
        {
            id: '2',
            label: 'Courses',
            label_en: 'Courses',
            url: '/courses',
            is_external: false,
            highlight: false,
            children: [
                { id: '2-1', label: 'All Courses', label_en: 'All Courses', url: '/courses' },
                { id: '2-2', label: 'HSC Academic Cycle', label_en: 'HSC Academic Cycle', url: '/courses' },
                { id: '2-3', label: 'Engineering & Varsity Admission', label_en: 'Engineering & Varsity Admission', url: '/courses' },
                { id: '2-4', label: 'Free Trial Classes', label_en: 'Free Trial Classes', url: '/courses?type=free' },
            ],
        },
        {
            id: '3',
            label: 'Books & Bundles',
            label_en: 'Books & Bundles',
            url: '/courses',
            is_external: false,
            highlight: false,
            children: [
                { id: '3-1', label: 'Combo Course Bundles', label_en: 'Combo Course Bundles', url: '/courses' },
                { id: '3-2', label: 'Lecture Sheets & Notes', label_en: 'Lecture Sheets & Notes', url: '/courses' },
            ],
        },
        {
            id: '4',
            label: 'Free Resources',
            label_en: 'Free Resources',
            url: '/courses?type=free',
            is_external: false,
            highlight: false,
        },
        {
            id: '5',
            label: 'Contact Us',
            label_en: 'Contact Us',
            url: '/p/contact',
            is_external: false,
            highlight: false,
        },
        {
            id: '6',
            label: 'E-Books & Exams',
            label_en: 'E-Books & Exams',
            url: '/student/exams',
            is_external: false,
            highlight: true,
        },
    ],
};

export const AdminHeaderBuilderPage: React.FC = () => {
    const { settings, refreshSettings, updateSettingsLocally } = useSettings();

    const [headerSettings, setHeaderSettings] = useState<HeaderSettings>(DEFAULT_HEADER_SETTINGS);
    const [activeTab, setActiveTab] = useState<'branding' | 'menu' | 'banner' | 'announcement' | 'options'>('branding');
    const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
    const previewLang = 'en';

    const [saving, setSaving] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingBanner, setUploadingBanner] = useState(false);
    const [mediaPickerTarget, setMediaPickerTarget] = useState<'logo' | 'banner'>('logo');
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const logoFileInputRef = useRef<HTMLInputElement>(null);
    const bannerFileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (settings?.header_settings) {
            let items = settings.header_settings.menu_items;
            if (!items || items.length === 0 || (items.length === 2 && items[0]?.label === 'Home' && items[1]?.label === 'All Courses')) {
                items = DEFAULT_HEADER_SETTINGS.menu_items;
            }
            setHeaderSettings({
                ...DEFAULT_HEADER_SETTINGS,
                ...settings.header_settings,
                logo_url: settings.header_settings.logo_url ?? settings.logo_url ?? null,
                menu_items: items,
            });
        } else if (settings?.logo_url) {
            setHeaderSettings(prev => ({ ...prev, logo_url: settings.logo_url }));
        }
    }, [settings]);

    const handleUpdate = <K extends keyof HeaderSettings>(key: K, value: HeaderSettings[K]) => {
        setHeaderSettings(prev => {
            const next = { ...prev, [key]: value };
            const syncMap: Record<string, keyof HeaderSettings> = {
                brand_title: 'brand_title_en',
                brand_subtitle: 'brand_subtitle_en',
                announcement_text: 'announcement_text_en',
                cta_button_text: 'cta_button_text_en',
            };
            if (syncMap[key as string] && typeof value === 'string') {
                (next as any)[syncMap[key as string]] = value;
            }
            return next;
        });
    };

    const handleLogoUpload = async (file: File) => {
        setUploadingLogo(true);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await apiClient.post('/admin/media', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (res.data?.media?.url) {
                handleUpdate('logo_url', res.data.media.url);
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to upload logo file.');
        } finally {
            setUploadingLogo(false);
            if (logoFileInputRef.current) logoFileInputRef.current.value = '';
        }
    };

    const handleBannerUpload = async (file: File) => {
        setUploadingBanner(true);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await apiClient.post('/admin/media', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (res.data?.media?.url) {
                handleUpdate('banner_image_url', res.data.media.url);
                handleUpdate('banner_mode', 'image');
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to upload banner image.');
        } finally {
            setUploadingBanner(false);
            if (bannerFileInputRef.current) bannerFileInputRef.current.value = '';
        }
    };

    // Menu Item Helpers
    const handleAddMenuItem = () => {
        const newItem: HeaderMenuItem = {
            id: Date.now().toString(),
            label: 'New Menu',
            label_en: 'New Menu',
            url: '/',
            is_external: false,
            highlight: false,
            children: []
        };
        const updated = [...(headerSettings.menu_items || []), newItem];
        handleUpdate('menu_items', updated);
    };

    const handleUpdateMenuItem = (index: number, updates: Partial<HeaderMenuItem>) => {
        const current = [...(headerSettings.menu_items || [])];
        if (current[index]) {
            current[index] = { ...current[index], ...updates };
            handleUpdate('menu_items', current);
        }
    };

    const handleDeleteMenuItem = (index: number) => {
        const current = [...(headerSettings.menu_items || [])];
        current.splice(index, 1);
        handleUpdate('menu_items', current);
    };

    const handleMoveMenuItem = (index: number, direction: 'up' | 'down') => {
        const current = [...(headerSettings.menu_items || [])];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= current.length) return;
        const temp = current[index];
        current[index] = current[targetIndex];
        current[targetIndex] = temp;
        handleUpdate('menu_items', current);
    };

    // Sub-item Helpers
    const handleAddSubMenuItem = (parentIndex: number) => {
        const current = [...(headerSettings.menu_items || [])];
        const parent = current[parentIndex];
        if (!parent) return;

        const newSub = {
            id: Date.now().toString(),
            label: 'New Submenu',
            label_en: 'New Submenu',
            url: parent.url || '/courses',
            is_external: false,
        };

        const existingChildren = parent.children || [];
        current[parentIndex] = {
            ...parent,
            children: [...existingChildren, newSub],
        };
        handleUpdate('menu_items', current);
    };

    const handleUpdateSubMenuItem = (parentIndex: number, subIndex: number, updates: any) => {
        const current = [...(headerSettings.menu_items || [])];
        const parent = current[parentIndex];
        if (!parent || !parent.children) return;

        const children = [...parent.children];
        if (children[subIndex]) {
            children[subIndex] = { ...children[subIndex], ...updates };
            current[parentIndex] = { ...parent, children };
            handleUpdate('menu_items', current);
        }
    };

    const handleDeleteSubMenuItem = (parentIndex: number, subIndex: number) => {
        const current = [...(headerSettings.menu_items || [])];
        const parent = current[parentIndex];
        if (!parent || !parent.children) return;

        const children = [...parent.children];
        children.splice(subIndex, 1);
        current[parentIndex] = { ...parent, children };
        handleUpdate('menu_items', current);
    };

    const handleSave = async () => {
        setSaving(true);
        setSuccessMessage(null);
        try {
            const { data } = await apiClient.put('/admin/website-settings/header', {
                header_settings: headerSettings
            });
            updateSettingsLocally({
                header_settings: headerSettings,
                logo_url: headerSettings.logo_url ?? settings?.logo_url ?? null,
            });
            await refreshSettings();
            setSuccessMessage(data.message || 'Header builder settings saved successfully!');
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to save header settings.');
        } finally {
            setSaving(false);
        }
    };

    const handleResetDefaults = () => {
        if (window.confirm('Are you sure you want to reset header settings to defaults?')) {
            setHeaderSettings(DEFAULT_HEADER_SETTINGS);
        }
    };

    // Localized values for Live Preview based on previewLang toggle
    const previewBrandTitle = getLocalizedText(headerSettings.brand_title, headerSettings.brand_title_en, previewLang) || 'DoctorWallah';
    const previewBrandSubtitle = getLocalizedText(headerSettings.brand_subtitle, headerSettings.brand_subtitle_en, previewLang) || '';
    const previewAnnouncementText = getLocalizedText(headerSettings.announcement_text, headerSettings.announcement_text_en, previewLang);
    const previewCtaText = getLocalizedText(headerSettings.cta_button_text, headerSettings.cta_button_text_en, previewLang) || 'Free Classes';

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-16">
            {/* Header Title & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                        <Palette className="w-7 h-7 text-sky-600" />
                        <span>Header Builder</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Customize the website header logo, navigation menu, announcement bar, and layout options
                    </p>
                </div>
                <div className="flex items-center gap-2.5">
                    <button
                        type="button"
                        onClick={handleResetDefaults}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition cursor-pointer"
                        title="Reset to Defaults"
                    >
                        <RotateCcw className="w-4 h-4 text-slate-500" />
                        <span>Reset to Defaults</span>
                    </button>
                    <button
                        type="button"
                        disabled={saving}
                        onClick={handleSave}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20 transition disabled:opacity-50 cursor-pointer"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>{saving ? 'Saving...' : 'Save Header'}</span>
                    </button>
                </div>
            </div>

            {successMessage && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-semibold animate-in fade-in">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{successMessage}</span>
                </div>
            )}

            {/* LIVE PREVIEW CONTAINER */}
            <div className="bg-slate-900 text-white p-4 rounded-3xl border border-slate-800 shadow-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between px-2 gap-3 text-xs font-semibold text-slate-400">
                    <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-sky-400" />
                        <span>Live Header Preview</span>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Device Mode Toggle */}
                        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setPreviewMode('desktop')}
                                className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${previewMode === 'desktop' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                <Monitor className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Desktop</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setPreviewMode('mobile')}
                                className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${previewMode === 'mobile' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                <Smartphone className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Mobile</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Preview Frame */}
                <div className={`mx-auto bg-white text-slate-900 rounded-2xl overflow-hidden shadow-2xs border border-slate-200 transition-all duration-200 ${previewMode === 'mobile' ? 'max-w-sm' : 'w-full'
                    }`}>
                    {/* Announcement Bar Preview */}
                    {headerSettings.announcement_enabled && (
                        <div
                            style={{ backgroundColor: headerSettings.announcement_bg || '#0284c7' }}
                            className="px-4 py-2 text-white text-xs font-semibold text-center flex items-center justify-center gap-2 truncate"
                        >
                            <span>{previewAnnouncementText}</span>
                            {headerSettings.announcement_link && (
                                <span className="underline text-[11px] font-bold opacity-90 hover:opacity-100">
                                    View Details →
                                </span>
                            )}
                        </div>
                    )}

                    {/* Main Nav Bar Preview */}
                    <div className="px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between border-b border-slate-100 bg-white">
                        {/* Logo Left */}
                        <div className="flex items-center gap-3">
                            {headerSettings.logo_url ? (
                                <img
                                    src={headerSettings.logo_url}
                                    alt="Logo"
                                    style={{ height: `${headerSettings.logo_height || 44}px` }}
                                    className="w-auto object-contain max-w-[160px]"
                                />
                            ) : (
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-xl bg-[#A60201] flex items-center justify-center text-white font-black text-sm shadow-sm">
                                        N
                                    </div>
                                    <div>
                                        <span className="text-lg font-black text-slate-900 tracking-tight block">
                                            {previewBrandTitle}
                                        </span>
                                        <span className="text-[10px] font-bold text-[#CC1200] uppercase tracking-wider block -mt-1">
                                            {previewBrandSubtitle}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Navigation Links (Desktop) */}
                        {previewMode === 'desktop' && (
                            <div className="hidden md:flex items-center gap-6">
                                {(headerSettings.menu_items || []).map((item) => {
                                    const localizedLabel = getLocalizedText(item.label, item.label_en, previewLang) || item.label;
                                    const hasSubs = item.children && item.children.length > 0;
                                    return (
                                        <span
                                            key={item.id}
                                            className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-sky-600 flex items-center gap-1 cursor-default"
                                        >
                                            {item.highlight && <Sparkles className="w-3.5 h-3.5 text-sky-500" />}
                                            <span>{localizedLabel}</span>
                                            {hasSubs && <ChevronDown className="w-3 h-3 text-slate-400" />}
                                        </span>
                                    );
                                })}
                            </div>
                        )}

                        {/* Actions Right */}
                        <div className="flex items-center gap-2.5">
                            {headerSettings.cta_button_enabled && (
                                <span className="px-3.5 py-1.5 text-xs font-bold text-white bg-sky-600 rounded-xl shadow-xs">
                                    {previewCtaText}
                                </span>
                            )}
                            {headerSettings.show_auth_buttons && (
                                <div className="flex items-center gap-2">
                                    <span className="hidden sm:inline px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl">
                                        Login
                                    </span>
                                    <span className="hidden sm:inline px-3.5 py-1.5 text-xs font-bold text-white bg-[#CC1200] rounded-xl shadow-xs">
                                        Registration
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sub-Header Banner Live Preview (10MS Style) */}
                    {headerSettings.banner_enabled && (
                        <div
                            style={{
                                backgroundColor: headerSettings.banner_bg_color || '#8a0000',
                                color: headerSettings.banner_text_color || '#ffffff',
                            }}
                            className="relative overflow-hidden w-full transition-all border-t border-black/10 select-none"
                        >
                            {headerSettings.banner_mode !== 'text' && headerSettings.banner_image_url ? (
                                <div className="relative w-full h-[55px] sm:h-[70px] flex items-center justify-center overflow-hidden">
                                    <img
                                        src={headerSettings.banner_image_url}
                                        alt="Banner Preview"
                                        className="w-full h-full object-cover sm:object-contain object-center"
                                    />
                                </div>
                            ) : (
                                <div className="px-4 py-2 sm:py-2.5 max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm">
                                    <div className="flex items-center gap-2 truncate pr-6 sm:pr-0">
                                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                                        <span className="font-extrabold truncate text-white">
                                            {headerSettings.banner_title || 'First class of the new batch is free!'}
                                        </span>
                                        {headerSettings.banner_subtitle && (
                                            <span className="hidden md:inline text-xs opacity-90 truncate font-medium text-white/90">
                                                • {headerSettings.banner_subtitle}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {headerSettings.banner_btn_text && (
                                            <span
                                                style={{
                                                    backgroundColor: headerSettings.banner_btn_bg || '#16a34a',
                                                    color: headerSettings.banner_btn_text_color || '#ffffff',
                                                }}
                                                className="px-3 py-1 sm:px-3.5 sm:py-1 rounded-lg text-xs font-bold shadow-xs flex items-center gap-1"
                                            >
                                                <span>{headerSettings.banner_btn_text}</span>
                                                <ChevronRight className="w-3 h-3" />
                                            </span>
                                        )}
                                        {headerSettings.banner_secondary_text && (
                                            <span className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600/90 text-white text-[11px] font-bold">
                                                <PhoneCall className="w-3 h-3" />
                                                <span>{headerSettings.banner_secondary_text}</span>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {headerSettings.banner_closeable !== false && (
                                <div
                                    className="absolute top-1/2 -translate-y-1/2 right-2 sm:right-3 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-black/40 text-white flex items-center justify-center text-xs opacity-80 z-10"
                                    title="Close button preview"
                                >
                                    <X className="w-3 h-3" />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* BUILDER TABS & FORM CONTROLS */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                {/* Tab Navigation */}
                <div className="flex border-b border-slate-200 bg-slate-50/60 overflow-x-auto scrollbar-thin">
                    <button
                        type="button"
                        onClick={() => setActiveTab('branding')}
                        className={`px-6 py-4 text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${activeTab === 'branding'
                            ? 'border-sky-600 text-sky-600 bg-white'
                            : 'border-transparent text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        <ImageIcon className="w-4 h-4" />
                        <span>Logo & Branding</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('menu')}
                        className={`px-6 py-4 text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${activeTab === 'menu'
                            ? 'border-sky-600 text-sky-600 bg-white'
                            : 'border-transparent text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        <Layers className="w-4 h-4" />
                        <span>Navigation Menu ({headerSettings.menu_items?.length || 0})</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('banner')}
                        className={`px-6 py-4 text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${activeTab === 'banner'
                            ? 'border-sky-600 text-sky-600 bg-white'
                            : 'border-transparent text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>Header Banner (10MS Style)</span>
                        {headerSettings.banner_enabled && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active"></span>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('announcement')}
                        className={`px-6 py-4 text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${activeTab === 'announcement'
                            ? 'border-sky-600 text-sky-600 bg-white'
                            : 'border-transparent text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        <Bell className="w-4 h-4" />
                        <span>Announcement Bar</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('options')}
                        className={`px-6 py-4 text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${activeTab === 'options'
                            ? 'border-sky-600 text-sky-600 bg-white'
                            : 'border-transparent text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        <Sliders className="w-4 h-4" />
                        <span>Buttons & Options</span>
                    </button>
                </div>

                <div className="p-6 sm:p-8">
                    {/* TAB 1: LOGO & BRANDING */}
                    {activeTab === 'branding' && (
                        <div className="space-y-6">
                            {/* Logo Upload Section */}
                            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                                <h4 className="text-sm font-bold text-slate-900">Website Logo (Header Logo)</h4>
                                <div className="flex flex-col sm:flex-row items-center gap-6">
                                    <div className="w-36 h-20 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-2 shadow-2xs">
                                        {headerSettings.logo_url ? (
                                            <img
                                                src={headerSettings.logo_url}
                                                alt="Logo"
                                                className="max-h-full max-w-full object-contain"
                                            />
                                        ) : (
                                            <span className="text-[11px] text-slate-400 font-medium">No Logo</span>
                                        )}
                                    </div>

                                    <div className="space-y-3 flex-1 w-full">
                                        <div className="flex flex-wrap items-center gap-2.5">
                                            <input
                                                type="file"
                                                ref={logoFileInputRef}
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleLogoUpload(file);
                                                }}
                                                accept="image/*"
                                                className="hidden"
                                            />
                                            <button
                                                type="button"
                                                disabled={uploadingLogo}
                                                onClick={() => logoFileInputRef.current?.click()}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                                            >
                                                {uploadingLogo ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        <span>Uploading...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <UploadCloud className="w-4 h-4" />
                                                        <span>Upload from Device</span>
                                                    </>
                                                )}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setMediaPickerTarget('logo');
                                                    setIsMediaModalOpen(true);
                                                }}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-200 transition cursor-pointer"
                                            >
                                                <ImageIcon className="w-4 h-4 text-slate-600" />
                                                <span>Choose from Media Library</span>
                                            </button>

                                            {headerSettings.logo_url && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleUpdate('logo_url', null)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 transition cursor-pointer"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    <span>Remove Logo</span>
                                                </button>
                                            )}
                                        </div>

                                        <input
                                            type="text"
                                            value={headerSettings.logo_url || ''}
                                            onChange={(e) => handleUpdate('logo_url', e.target.value.trim() || null)}
                                            placeholder="Or paste image URL directly"
                                            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-sky-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Logo Height */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Logo Height ({headerSettings.logo_height || 44}px)
                                    </label>
                                    <input
                                        type="range"
                                        min="28"
                                        max="64"
                                        value={headerSettings.logo_height || 44}
                                        onChange={(e) => handleUpdate('logo_height', parseInt(e.target.value) || 44)}
                                        className="w-full cursor-pointer accent-sky-600"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                Brand Title
                                            </label>
                                            <input
                                                type="text"
                                                value={headerSettings.brand_title || ''}
                                                onChange={(e) => handleUpdate('brand_title', e.target.value)}
                                                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                                                placeholder="e.g. DoctorWallah"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                Brand Title (English)
                                            </label>
                                            <input
                                                type="text"
                                                value={headerSettings.brand_title_en || ''}
                                                onChange={(e) => handleUpdate('brand_title_en', e.target.value)}
                                                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                                                placeholder="e.g. DoctorWallah"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                Brand Subtitle
                                            </label>
                                            <input
                                                type="text"
                                                value={headerSettings.brand_subtitle || ''}
                                                onChange={(e) => handleUpdate('brand_subtitle', e.target.value)}
                                                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                                                placeholder="e.g. Edu"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                Brand Subtitle (English)
                                            </label>
                                            <input
                                                type="text"
                                                value={headerSettings.brand_subtitle_en || ''}
                                                onChange={(e) => handleUpdate('brand_subtitle_en', e.target.value)}
                                                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                                                placeholder="e.g. Edu"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: MENU ITEMS BUILDER */}
                    {activeTab === 'menu' && (
                        <div className="space-y-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900">Navigation Menu Items</h4>
                                    <p className="text-xs text-slate-500">
                                        Configure primary links displayed in the website header.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddMenuItem}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold hover:bg-sky-700 transition cursor-pointer"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Add New Menu Item</span>
                                </button>
                            </div>

                            <div className="space-y-3">
                                {(headerSettings.menu_items || []).map((item, idx) => (
                                    <div
                                        key={item.id || idx}
                                        className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 transition-all hover:border-slate-300"
                                    >
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    type="button"
                                                    disabled={idx === 0}
                                                    onClick={() => handleMoveMenuItem(idx, 'up')}
                                                    className="p-1.5 text-slate-400 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                                                    title="Move Up"
                                                >
                                                    <MoveUp className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={idx === (headerSettings.menu_items?.length || 0) - 1}
                                                    onClick={() => handleMoveMenuItem(idx, 'down')}
                                                    className="p-1.5 text-slate-400 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                                                    title="Move Down"
                                                >
                                                    <MoveDown className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 w-full">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Menu Label</label>
                                                    <input
                                                        type="text"
                                                        value={item.label}
                                                        onChange={(e) => handleUpdateMenuItem(idx, { label: e.target.value, label_en: e.target.value })}
                                                        placeholder="e.g. Courses"
                                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-sky-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Link URL</label>
                                                    <input
                                                        type="text"
                                                        value={item.url}
                                                        onChange={(e) => handleUpdateMenuItem(idx, { url: e.target.value })}
                                                        placeholder="e.g. /courses"
                                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-sky-500"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start pt-2 sm:pt-0 shrink-0">
                                                <label className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={Boolean(item.highlight)}
                                                        onChange={(e) => handleUpdateMenuItem(idx, { highlight: e.target.checked })}
                                                        className="w-4 h-4 text-sky-600 rounded"
                                                    />
                                                    <span>✨ Highlight</span>
                                                </label>

                                                <label className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={Boolean(item.is_external)}
                                                        onChange={(e) => handleUpdateMenuItem(idx, { is_external: e.target.checked })}
                                                        className="w-4 h-4 text-sky-600 rounded"
                                                    />
                                                    <span>External</span>
                                                </label>

                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteMenuItem(idx)}
                                                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Submenu Dropdown Items Section */}
                                        <div className="mt-2 pt-3 border-t border-slate-200/80 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                                                    <Layers className="w-3.5 h-3.5 text-sky-600" />
                                                    <span>Dropdown Submenu Links ({item.children?.length || 0})</span>
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddSubMenuItem(idx)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-sky-700 bg-white hover:bg-sky-50 border border-sky-200 rounded-lg cursor-pointer transition shadow-2xs"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                    <span>Add Submenu</span>
                                                </button>
                                            </div>

                                            {item.children && item.children.length > 0 && (
                                                <div className="space-y-2 pl-3 border-l-2 border-sky-300">
                                                    {item.children.map((sub, sIdx) => (
                                                        <div key={sub.id || sIdx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 bg-white rounded-xl border border-slate-200 items-center">
                                                            <div className="sm:col-span-5">
                                                                <input
                                                                    type="text"
                                                                    value={sub.label}
                                                                    onChange={(e) => handleUpdateSubMenuItem(idx, sIdx, { label: e.target.value, label_en: e.target.value })}
                                                                    placeholder="Submenu Label (e.g. HSC Cycle)"
                                                                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-sky-500"
                                                                />
                                                            </div>
                                                            <div className="sm:col-span-5">
                                                                <input
                                                                    type="text"
                                                                    value={sub.url}
                                                                    onChange={(e) => handleUpdateSubMenuItem(idx, sIdx, { url: e.target.value })}
                                                                    placeholder="URL (e.g. /courses)"
                                                                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:ring-1 focus:ring-sky-500"
                                                                />
                                                            </div>
                                                            <div className="sm:col-span-2 flex items-center justify-end gap-2">
                                                                <label className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold cursor-pointer" title="External link">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={Boolean(sub.is_external)}
                                                                        onChange={(e) => handleUpdateSubMenuItem(idx, sIdx, { is_external: e.target.checked })}
                                                                        className="w-3.5 h-3.5 text-sky-600 rounded"
                                                                    />
                                                                    <span>Ext</span>
                                                                </label>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteSubMenuItem(idx, sIdx)}
                                                                    className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {(headerSettings.menu_items?.length || 0) === 0 && (
                                    <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                                        No menu items configured. Click "Add New Menu Item" above.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB: 10 MINUTE SCHOOL STYLE HEADER BANNER */}
                    {activeTab === 'banner' && (
                        <div className="space-y-6">
                            {/* Master Toggle */}
                            <div className="flex items-center justify-between p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-sky-500/5 to-transparent border border-amber-200/80">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-bold text-slate-900">
                                            Enable Promotional Header Banner
                                        </h4>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white shadow-xs">
                                            Top Banner
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Displays an attractive, slim promotional ribbon directly beneath the main navbar.
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(headerSettings.banner_enabled)}
                                        onChange={(e) => handleUpdate('banner_enabled', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-12 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                                </label>
                            </div>

                            {headerSettings.banner_enabled && (
                                <div className="space-y-6">
                                    {/* Banner Mode Selector */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                            Select Banner Type
                                        </label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {/* Option A: Image Banner */}
                                            <div
                                                onClick={() => handleUpdate('banner_mode', 'image')}
                                                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${headerSettings.banner_mode !== 'text'
                                                    ? 'border-sky-600 bg-sky-50/50 shadow-xs'
                                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <ImageIcon className="w-4 h-4 text-sky-600" />
                                                        <span className="text-sm font-bold text-slate-900">Image Banner Graphic</span>
                                                    </div>
                                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${headerSettings.banner_mode !== 'text' ? 'border-sky-600 bg-sky-600' : 'border-slate-300'
                                                        }`}>
                                                        {headerSettings.banner_mode !== 'text' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                                    </div>
                                                </div>
                                                <p className="text-xs text-slate-500">
                                                    Upload a custom-designed wide graphic banner.
                                                </p>
                                            </div>

                                            {/* Option B: Custom Text & Background Color */}
                                            <div
                                                onClick={() => handleUpdate('banner_mode', 'text')}
                                                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${headerSettings.banner_mode === 'text'
                                                    ? 'border-sky-600 bg-sky-50/50 shadow-xs'
                                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <Palette className="w-4 h-4 text-emerald-600" />
                                                        <span className="text-sm font-bold text-slate-900">Color & Text Banner</span>
                                                    </div>
                                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${headerSettings.banner_mode === 'text' ? 'border-sky-600 bg-sky-600' : 'border-slate-300'
                                                        }`}>
                                                        {headerSettings.banner_mode === 'text' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                                    </div>
                                                </div>
                                                <p className="text-xs text-slate-500">
                                                    Configure background color with custom headline, subtitle and action button.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* MODE 1: IMAGE BANNER CONFIG */}
                                    {headerSettings.banner_mode !== 'text' && (
                                        <div className="space-y-5 p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                                <ImageIcon className="w-4 h-4 text-sky-600" />
                                                <span>Banner Graphic Upload & Settings</span>
                                            </h4>

                                            {/* Banner Image Preview / Upload Box */}
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                    Banner Graphic Image
                                                </label>
                                                {headerSettings.banner_image_url ? (
                                                    <div className="relative rounded-2xl border border-slate-200 p-2 bg-slate-900 overflow-hidden group">
                                                        <div className="h-20 sm:h-24 w-full flex items-center justify-center overflow-hidden rounded-xl">
                                                            <img
                                                                src={headerSettings.banner_image_url}
                                                                alt="Header Banner"
                                                                className="w-full h-full object-contain"
                                                            />
                                                        </div>
                                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity">
                                                            <button
                                                                type="button"
                                                                onClick={() => bannerFileInputRef.current?.click()}
                                                                className="px-3 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-bold shadow hover:bg-slate-100 cursor-pointer"
                                                            >
                                                                Change Image
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setMediaPickerTarget('banner');
                                                                    setIsMediaModalOpen(true);
                                                                }}
                                                                className="px-3 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-bold shadow hover:bg-sky-500 cursor-pointer"
                                                            >
                                                                Media Library
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleUpdate('banner_image_url', null)}
                                                                className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold shadow hover:bg-rose-500 cursor-pointer"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="border-2 border-dashed border-slate-200 hover:border-sky-400 rounded-2xl p-6 text-center transition-colors bg-slate-50/50">
                                                        <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                                        <p className="text-xs font-bold text-slate-700 mb-1">
                                                            Upload Your Banner Graphic
                                                        </p>
                                                        <p className="text-[11px] text-slate-400 mb-3">
                                                            Recommended size: 1200×120 or 1920×150 px (wide slim aspect ratio)
                                                        </p>
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                type="button"
                                                                disabled={uploadingBanner}
                                                                onClick={() => bannerFileInputRef.current?.click()}
                                                                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                                            >
                                                                {uploadingBanner ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                                                                <span>Upload from PC</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setMediaPickerTarget('banner');
                                                                    setIsMediaModalOpen(true);
                                                                }}
                                                                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 cursor-pointer"
                                                            >
                                                                <ImageIcon className="w-3.5 h-3.5" />
                                                                <span>Media Library</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                                <input
                                                    ref={bannerFileInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) handleBannerUpload(file);
                                                    }}
                                                    className="hidden"
                                                />
                                            </div>

                                            {/* Banner Click Link & Edge Color */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                                        Banner Click URL
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={headerSettings.banner_link || ''}
                                                        onChange={(e) => handleUpdate('banner_link', e.target.value)}
                                                        placeholder="e.g. /courses or https://..."
                                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                                    />
                                                    <span className="text-[11px] text-slate-400 mt-1 block">
                                                        Visitors will be redirected to this link when clicking the banner.
                                                    </span>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                                        Edge Fill Background Color
                                                    </label>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="color"
                                                            value={headerSettings.banner_bg_color || '#8a0000'}
                                                            onChange={(e) => handleUpdate('banner_bg_color', e.target.value)}
                                                            className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={headerSettings.banner_bg_color || '#8a0000'}
                                                            onChange={(e) => handleUpdate('banner_bg_color', e.target.value)}
                                                            className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-sky-500"
                                                        />
                                                    </div>
                                                    <span className="text-[11px] text-slate-400 mt-1 block">
                                                        Outer edges on wide screens will fill with this color.
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* MODE 2: CUSTOM TEXT & COLOR CONFIG */}
                                    {headerSettings.banner_mode === 'text' && (
                                        <div className="space-y-5 p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                                <Palette className="w-4 h-4 text-emerald-600" />
                                                <span>Background Color & Text Configuration</span>
                                            </h4>

                                            {/* Background Color Presets */}
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-2">
                                                    Select Background Color
                                                </label>
                                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                                    {[
                                                        { label: 'DoctorWallah Crimson Red', color: '#8a0000' },
                                                        { label: 'Deep Maroon', color: '#680000' },
                                                        { label: 'Royal Blue', color: '#1e40af' },
                                                        { label: 'Sky Blue', color: '#0284c7' },
                                                        { label: 'Emerald Green', color: '#065f46' },
                                                        { label: 'Dark Slate', color: '#0f172a' },
                                                        { label: 'Deep Purple', color: '#581c87' },
                                                    ].map((preset) => (
                                                        <button
                                                            key={preset.color}
                                                            type="button"
                                                            onClick={() => handleUpdate('banner_bg_color', preset.color)}
                                                            style={{ backgroundColor: preset.color }}
                                                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold text-white flex items-center gap-1.5 shadow-xs border transition-all cursor-pointer ${headerSettings.banner_bg_color === preset.color
                                                                ? 'ring-2 ring-offset-2 ring-sky-500 border-white'
                                                                : 'border-transparent opacity-90 hover:opacity-100'
                                                                }`}
                                                        >
                                                            {headerSettings.banner_bg_color === preset.color && <Check className="w-3 h-3" />}
                                                            <span>{preset.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="flex items-center gap-2 max-w-xs">
                                                    <input
                                                        type="color"
                                                        value={headerSettings.banner_bg_color || '#8a0000'}
                                                        onChange={(e) => handleUpdate('banner_bg_color', e.target.value)}
                                                        className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={headerSettings.banner_bg_color || '#8a0000'}
                                                        onChange={(e) => handleUpdate('banner_bg_color', e.target.value)}
                                                        className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono uppercase"
                                                    />
                                                </div>
                                            </div>

                                            {/* Title & Subtitle */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                                        Headline
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={headerSettings.banner_title || ''}
                                                        onChange={(e) => handleUpdate('banner_title', e.target.value)}
                                                        placeholder="e.g. First class of the new batch is free!"
                                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                                        Subtitle
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={headerSettings.banner_subtitle || ''}
                                                        onChange={(e) => handleUpdate('banner_subtitle', e.target.value)}
                                                        placeholder="e.g. Join now to register"
                                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                                    />
                                                </div>
                                            </div>

                                            {/* CTA Button Settings */}
                                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                                                <span className="text-xs font-bold text-slate-700 block">
                                                    Call to Action Button Settings
                                                </span>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                    <div>
                                                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Button Text</label>
                                                        <input
                                                            type="text"
                                                            value={headerSettings.banner_btn_text || ''}
                                                            onChange={(e) => handleUpdate('banner_btn_text', e.target.value)}
                                                            placeholder="e.g. Enroll Now"
                                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Button Link</label>
                                                        <input
                                                            type="text"
                                                            value={headerSettings.banner_btn_link || ''}
                                                            onChange={(e) => handleUpdate('banner_btn_link', e.target.value)}
                                                            placeholder="e.g. /courses"
                                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Button Color</label>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="color"
                                                                value={headerSettings.banner_btn_bg || '#16a34a'}
                                                                onChange={(e) => handleUpdate('banner_btn_bg', e.target.value)}
                                                                className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={headerSettings.banner_btn_bg || '#16a34a'}
                                                                onChange={(e) => handleUpdate('banner_btn_bg', e.target.value)}
                                                                className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono uppercase"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Secondary Hotline Badge */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                                        Hotline / Secondary Text (e.g. Call 16910)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={headerSettings.banner_secondary_text || ''}
                                                        onChange={(e) => handleUpdate('banner_secondary_text', e.target.value)}
                                                        placeholder="e.g. Call 16910"
                                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                                        Hotline Link / Phone Number
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={headerSettings.banner_secondary_link || ''}
                                                        onChange={(e) => handleUpdate('banner_secondary_link', e.target.value)}
                                                        placeholder="e.g. tel:16910"
                                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* COMMON BANNER OPTIONS */}
                                    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                            Visibility Settings
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <label className="flex items-center gap-3 cursor-pointer p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50">
                                                <input
                                                    type="checkbox"
                                                    checked={headerSettings.banner_closeable !== false}
                                                    onChange={(e) => handleUpdate('banner_closeable', e.target.checked)}
                                                    className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
                                                />
                                                <div>
                                                    <span className="text-xs font-bold text-slate-800 block">
                                                        Allow closing with Close (X) button
                                                    </span>
                                                    <span className="text-[11px] text-slate-500 block">
                                                        Visitors can dismiss the banner by clicking the close button.
                                                    </span>
                                                </div>
                                            </label>

                                            <div className="p-3.5 rounded-xl border border-slate-200 space-y-1">
                                                <span className="text-xs font-bold text-slate-800 block">
                                                    Banner Display Location
                                                </span>
                                                <select
                                                    value={headerSettings.banner_show_on || 'all'}
                                                    onChange={(e) => handleUpdate('banner_show_on', e.target.value as any)}
                                                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 bg-white"
                                                >
                                                    <option value="all">All Public Pages</option>
                                                    <option value="home">Home Page Only</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 3: ANNOUNCEMENT BAR */}
                    {activeTab === 'announcement' && (
                        <div className="space-y-5">
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-sky-50/50 border border-sky-100">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900">Enable Top Announcement Bar</h4>
                                    <p className="text-xs text-slate-500">Displays a prominent banner notice at the very top of the header</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(headerSettings.announcement_enabled)}
                                        onChange={(e) => handleUpdate('announcement_enabled', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600" />
                                </label>
                            </div>

                            {headerSettings.announcement_enabled && (
                                <div className="space-y-4 pt-2">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                Notice Message
                                            </label>
                                            <input
                                                type="text"
                                                value={headerSettings.announcement_text || ''}
                                                onChange={(e) => handleUpdate('announcement_text', e.target.value)}
                                                placeholder="e.g. 🎉 New batch admission open! Enroll now with 20% discount."
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-sky-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                Notice Link URL (Optional)
                                            </label>
                                            <input
                                                type="text"
                                                value={headerSettings.announcement_link || ''}
                                                onChange={(e) => handleUpdate('announcement_link', e.target.value)}
                                                placeholder="e.g. /courses or https://..."
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-sky-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            Background Color
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="color"
                                                value={headerSettings.announcement_bg || '#0284c7'}
                                                onChange={(e) => handleUpdate('announcement_bg', e.target.value)}
                                                className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0"
                                            />
                                            <input
                                                type="text"
                                                value={headerSettings.announcement_bg || '#0284c7'}
                                                onChange={(e) => handleUpdate('announcement_bg', e.target.value)}
                                                className="w-32 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono uppercase"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 4: OPTIONS & BUTTONS */}
                    {activeTab === 'options' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Sticky Header */}
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-bold text-slate-900">Sticky Header</div>
                                        <div className="text-[11px] text-slate-500">Keep header pinned at the top while scrolling</div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={Boolean(headerSettings.sticky)}
                                        onChange={(e) => handleUpdate('sticky', e.target.checked)}
                                        className="w-5 h-5 text-sky-600 rounded"
                                    />
                                </div>

                                {/* Theme Switcher */}
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-bold text-slate-900">Dark/Light Theme Toggle</div>
                                        <div className="text-[11px] text-slate-500">Display theme toggle button in header</div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={Boolean(headerSettings.show_theme_toggle)}
                                        onChange={(e) => handleUpdate('show_theme_toggle', e.target.checked)}
                                        className="w-5 h-5 text-sky-600 rounded"
                                    />
                                </div>

                                {/* Auth Buttons */}
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-bold text-slate-900">Login / Register Buttons</div>
                                        <div className="text-[11px] text-slate-500">Display user account buttons in header</div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={Boolean(headerSettings.show_auth_buttons)}
                                        onChange={(e) => handleUpdate('show_auth_buttons', e.target.checked)}
                                        className="w-5 h-5 text-sky-600 rounded"
                                    />
                                </div>

                                {/* Custom CTA Button */}
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-bold text-slate-900">Custom Action Button (CTA)</div>
                                        <div className="text-[11px] text-slate-500">e.g. "Free Class" or "Enroll Now" button</div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={Boolean(headerSettings.cta_button_enabled)}
                                        onChange={(e) => handleUpdate('cta_button_enabled', e.target.checked)}
                                        className="w-5 h-5 text-sky-600 rounded"
                                    />
                                </div>
                            </div>

                            {headerSettings.cta_button_enabled && (
                                <div className="p-5 rounded-2xl bg-sky-50/50 border border-sky-100 space-y-4">
                                    <h4 className="text-xs font-bold text-sky-900 uppercase tracking-wider">CTA Button Configuration</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                Button Text
                                            </label>
                                            <input
                                                type="text"
                                                value={headerSettings.cta_button_text || ''}
                                                onChange={(e) => handleUpdate('cta_button_text', e.target.value)}
                                                placeholder="e.g. Free Classes"
                                                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                Button Link URL
                                            </label>
                                            <input
                                                type="text"
                                                value={headerSettings.cta_button_link || ''}
                                                onChange={(e) => handleUpdate('cta_button_link', e.target.value)}
                                                placeholder="e.g. /courses"
                                                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Media Picker Modal */}
            <MediaPickerModal
                isOpen={isMediaModalOpen}
                onClose={() => setIsMediaModalOpen(false)}
                filterType="image"
                title={mediaPickerTarget === 'logo' ? 'Select Logo Image' : 'Select Banner Image'}
                onSelect={(url) => {
                    if (mediaPickerTarget === 'logo') {
                        handleUpdate('logo_url', url);
                    } else {
                        handleUpdate('banner_image_url', url);
                        handleUpdate('banner_mode', 'image');
                    }
                    setIsMediaModalOpen(false);
                }}
            />
        </div>
    );
};