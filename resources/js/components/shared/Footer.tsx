import React from 'react';
import { Link } from 'react-router-dom';
import { 
    BookOpen, 
    Phone, 
    Mail, 
    MapPin, 
    Heart, 
    ShieldCheck, 
    Stethoscope, 
    ArrowRight, 
    Sparkles, 
    Clock, 
    MessageCircle, 
    CheckCircle2, 
    ExternalLink,
    Activity,
    CreditCard
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';
import { getLocalizedText } from '../../utils/localization';

export const Footer: React.FC = () => {
    const { t, language } = useLanguage();
    const { settings } = useSettings();
    const footer = settings?.footer_settings;
    const [logoError, setLogoError] = React.useState(false);

    const logoUrl = footer?.logo_url || settings?.logo_url || settings?.header_settings?.logo_url;

    const brandTitle = getLocalizedText(footer?.brand_title, footer?.brand_title_en, language)
        || (settings?.site_name ? settings.site_name.split(' ')[0] : 'DoctorWallah');
    const brandSubtitle = getLocalizedText(footer?.brand_subtitle, footer?.brand_subtitle_en, language)
        || (settings?.site_name && settings.site_name.split(' ').length > 1 ? settings.site_name.split(' ').slice(1).join(' ') : 'Medical Academy');

    const description = getLocalizedText(footer?.description, footer?.description_en, language) 
        || 'The premier digital medical academy for MBBS students across Bangladesh. Comprehensive clinical mastery, BMDC syllabus-aligned video lectures, and high-yield notes.';

    const showBadge = footer?.show_badge !== false;
    const badgeText = getLocalizedText(footer?.badge_text, footer?.badge_text_en, language) 
        || 'BMDC Syllabus Aligned • 100% Qualified Doctors';

    const col2Title = getLocalizedText(footer?.column_2_title, footer?.column_2_title_en, language) || 'Medical Programs';
    const rawCol2Links = footer?.column_2_links && footer.column_2_links.length > 0
        ? footer.column_2_links
        : [
            { id: '1', label: 'All Medical Courses', url: '/courses' },
            { id: '2', label: '1st Prof Clinical Combos', url: '/courses?category=1st-prof' },
            { id: '3', label: 'General Anatomy & Embryology', url: '/courses?category=anatomy' },
            { id: '4', label: 'Systemic Physiology & Biophysics', url: '/courses?category=physiology' },
            { id: '5', label: 'Clinical Biochemistry & Metabolism', url: '/courses?category=biochemistry' },
        ];
    const col2Links = rawCol2Links.map(link => ({
        ...link,
        label: getLocalizedText(link.label, link.label_en, language) || link.label,
    }));

    const col3Title = getLocalizedText(footer?.column_3_title, footer?.column_3_title_en, language) || 'Student Resources';
    const rawCol3Links = footer?.column_3_links && footer.column_3_links.length > 0
        ? footer.column_3_links
        : [
            { id: '1', label: 'Student Dashboard & My Classes', url: '/student/my-courses' },
            { id: '2', label: 'High-Yield Marked Books & Notes', url: '/earn-points' },
            { id: '3', label: 'OSCE / OSPE Model Test Bank', url: '/courses?category=osce' },
            { id: '4', label: 'Live Academic Doubt Support', url: '/courses' },
            { id: '5', label: 'Student Reward Points & Badges', url: '/earn-points' },
        ];
    const col3Links = rawCol3Links.map(link => ({
        ...link,
        label: getLocalizedText(link.label, link.label_en, language) || link.label,
    }));

    const col4Title = getLocalizedText(footer?.column_4_title, footer?.column_4_title_en, language) || 'Clinical Helpline';
    const phone = footer?.phone || settings?.contact_phone || '01580401289';
    const phoneHours = getLocalizedText(footer?.phone_hours, footer?.phone_hours_en, language) || 'Everyday 9:00 AM – 11:00 PM';
    const email = footer?.email || settings?.contact_email || 'support@doctorwallah.com';
    const address = getLocalizedText(footer?.address, footer?.address_en, language) || 'Dhaka, Bangladesh';
    const socialLinks = footer?.social_links || [
        { platform: 'Facebook Group', url: 'https://facebook.com' },
        { platform: 'YouTube', url: 'https://youtube.com' },
        { platform: 'Telegram', url: 'https://telegram.org' },
        { platform: 'WhatsApp', url: 'https://whatsapp.com' },
    ];

    const defaultCopyright = `© 2026 ${brandTitle} Medical Academy. All rights reserved. BMDC Exam & MBBS Guidance.`;
    const copyrightText = getLocalizedText(footer?.copyright_text, footer?.copyright_text_en, language)
        || settings?.copyright_text
        || defaultCopyright;

    return (
        <footer className="relative bg-slate-100 dark:bg-[#060202] text-slate-600 dark:text-slate-300 border-t border-slate-200 dark:border-[#A60201]/30 transition-colors overflow-hidden">
            {/* Top Atmospheric Radial Velvet Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-48 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(166,2,1,0.22),transparent)] pointer-events-none -z-0" />
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#A60201] to-transparent shadow-[0_0_15px_#A60201]" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-12 sm:pt-16 pb-8">
                {/* Pre-Footer Action Bar: 24/7 Medical Student Hotline & Helpline */}
                <div className="mb-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-red-50 via-white to-red-50 dark:from-[#0F0404] dark:via-[#140505] dark:to-[#0A0303] border border-red-200 dark:border-[#A60201]/35 shadow-lg dark:shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-6 relative overflow-hidden">
                    {/* Glowing corner glow */}
                    <div className="absolute -top-12 -left-12 w-36 h-36 bg-[#A60201]/10 dark:bg-[#A60201]/25 rounded-full blur-2xl pointer-events-none" />

                    <div className="space-y-1.5 text-center lg:text-left z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 dark:bg-[#A60201]/20 border border-red-200 dark:border-[#A60201]/40 text-[#A60201] dark:text-red-200 text-xs font-bold uppercase tracking-wider">
                            <Stethoscope className="w-3.5 h-3.5 text-[#A60201]" />
                            <span>Dedicated Medical Academic Helpline</span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            যেকোনো কোর্স, সিলেবাস বা এনরোলমেন্ট সহায়তায় আমাদের সরাসরি কল করুন
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                            সিনিয়র ডাক্তার ও একাডেমিক মেন্টররা প্রতিদিন সকাল ৯টা থেকে রাত ১১টা পর্যন্ত সহায়তার জন্য উপস্থিত।
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3 shrink-0 z-10">
                        <a
                            href={`tel:${phone}`}
                            className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#A60201] hover:bg-[#880101] text-white font-black text-sm shadow-lg shadow-[#A60201]/35 hover:shadow-xl transition-all cursor-pointer"
                        >
                            <Phone className="w-4 h-4" />
                            <span>Call: {phone}</span>
                        </a>

                        <a
                            href={`https://wa.me/88${phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white hover:bg-slate-50 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.12] text-slate-800 dark:text-white font-bold text-sm shadow-xs transition-all cursor-pointer"
                        >
                            <MessageCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                            <span>WhatsApp Support</span>
                        </a>
                    </div>
                </div>

                {/* 4 Primary Footer Columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-12 border-b border-slate-200 dark:border-white/[0.08]">
                    {/* Column 1: Brand Info & Medical Mission (4 cols on lg) */}
                    <div className="lg:col-span-4 space-y-4">
                        <div className="flex items-center gap-3">
                            {logoUrl && !logoError ? (
                                <Link to="/" className="inline-flex items-center transition-transform hover:opacity-90">
                                    <img
                                        src={logoUrl}
                                        alt={`${brandTitle} ${brandSubtitle}`}
                                        onError={() => setLogoError(true)}
                                        className="h-10 sm:h-12 w-auto object-contain max-w-[220px]"
                                    />
                                </Link>
                            ) : (
                                <Link to="/" className="flex items-center gap-2.5 group">
                                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#A60201] to-[#880101] flex items-center justify-center text-white shadow-lg shadow-[#A60201]/30 group-hover:scale-105 transition-transform">
                                        <Stethoscope className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight block leading-none">
                                            {brandTitle}
                                        </span>
                                        <span className="text-[11px] font-black text-[#A60201] tracking-widest uppercase block mt-1">
                                            {brandSubtitle}
                                        </span>
                                    </div>
                                </Link>
                            )}
                        </div>

                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                            {description}
                        </p>

                        {showBadge && (
                            <div className="flex items-center gap-2 text-xs text-[#A60201] dark:text-red-200 font-semibold bg-red-50 dark:bg-[#120404] border border-red-200 dark:border-[#A60201]/35 px-3.5 py-2 rounded-xl w-fit shadow-xs">
                                <ShieldCheck className="w-4 h-4 text-[#A60201] shrink-0" />
                                <span>{badgeText}</span>
                            </div>
                        )}

                        {/* Social Links Chips */}
                        <div className="pt-2">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Connect with Community</span>
                            <div className="flex flex-wrap items-center gap-2">
                                {socialLinks.map((soc: any) => (
                                    <a
                                        key={soc.id || soc.platform}
                                        href={soc.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-white/[0.03] hover:bg-[#A60201] hover:text-white dark:hover:bg-[#A60201] dark:hover:text-white border border-slate-200 dark:border-white/[0.08] hover:border-[#A60201] text-slate-700 dark:text-slate-300 text-xs font-bold transition shadow-2xs"
                                    >
                                        {soc.platform}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Column 2: Medical Programs (3 cols on lg) */}
                    <div className="lg:col-span-3 space-y-3.5">
                        <h4 className="text-slate-900 dark:text-white font-black text-sm uppercase tracking-wider flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#A60201]" />
                            <span>{col2Title}</span>
                        </h4>
                        <ul className="space-y-2.5 text-xs sm:text-sm">
                            {col2Links.map((link) => (
                                <li key={link.id || link.label}>
                                    {link.url.startsWith('http') ? (
                                        <a 
                                            href={link.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="text-slate-600 dark:text-slate-400 hover:text-[#A60201] dark:hover:text-white hover:translate-x-1 inline-flex items-center gap-1.5 transition-all"
                                        >
                                            <span>{link.label}</span>
                                            <ExternalLink className="w-3 h-3 text-slate-400 dark:text-slate-600" />
                                        </a>
                                    ) : (
                                        <Link 
                                            to={link.url} 
                                            className="text-slate-600 dark:text-slate-400 hover:text-[#A60201] dark:hover:text-white hover:translate-x-1 inline-block transition-all"
                                        >
                                            {link.label}
                                        </Link>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 3: Student Resources (2 cols on lg) */}
                    <div className="lg:col-span-2 space-y-3.5">
                        <h4 className="text-slate-900 dark:text-white font-black text-sm uppercase tracking-wider flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#A60201]" />
                            <span>{col3Title}</span>
                        </h4>
                        <ul className="space-y-2.5 text-xs sm:text-sm">
                            {col3Links.map((link) => (
                                <li key={link.id || link.label}>
                                    {link.url.startsWith('http') ? (
                                        <a 
                                            href={link.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="text-slate-600 dark:text-slate-400 hover:text-[#A60201] dark:hover:text-white hover:translate-x-1 inline-block transition-all"
                                        >
                                            {link.label}
                                        </a>
                                    ) : (
                                        <Link 
                                            to={link.url} 
                                            className="text-slate-600 dark:text-slate-400 hover:text-[#A60201] dark:hover:text-white hover:translate-x-1 inline-block transition-all"
                                        >
                                            {link.label}
                                        </Link>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 4: Contact & Verified Payments (3 cols on lg) */}
                    <div className="lg:col-span-3 space-y-3.5">
                        <h4 className="text-slate-900 dark:text-white font-black text-sm uppercase tracking-wider flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#A60201]" />
                            <span>{col4Title}</span>
                        </h4>

                        <div className="space-y-3 text-xs sm:text-sm">
                            {phone && (
                                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] shadow-xs">
                                    <Phone className="w-4 h-4 text-[#A60201] mt-0.5 shrink-0" />
                                    <div>
                                        <span className="font-bold text-slate-900 dark:text-white block">{phone}</span>
                                        {phoneHours && (
                                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">{phoneHours}</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {email && (
                                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] shadow-xs">
                                    <Mail className="w-4 h-4 text-[#A60201] shrink-0" />
                                    <span className="text-slate-700 dark:text-slate-300 font-medium truncate">{email}</span>
                                </div>
                            )}

                            {address && (
                                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] shadow-xs">
                                    <MapPin className="w-4 h-4 text-[#A60201] shrink-0" />
                                    <span className="text-slate-700 dark:text-slate-300 font-medium">{address}</span>
                                </div>
                            )}
                        </div>

                        {/* Payment Security Pills */}
                        <div className="pt-2">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                                <CreditCard className="w-3.5 h-3.5 text-[#A60201]" />
                                <span>Verified Payment Gateways</span>
                            </span>
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] shadow-2xs">bKash</span>
                                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] shadow-2xs">Nagad</span>
                                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] shadow-2xs">Rocket</span>
                                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] shadow-2xs">Cards / Net Banking</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Legal, Privacy & Copyright Strip */}
                <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                        <span>{copyrightText}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-slate-500 dark:text-slate-400 font-medium">
                        <Link to="/courses" className="hover:text-[#A60201] dark:hover:text-white transition-colors">Courses</Link>
                        <span>•</span>
                        <Link to="/login" className="hover:text-[#A60201] dark:hover:text-white transition-colors">Student Login</Link>
                        <span>•</span>
                        <Link to="/register" className="hover:text-[#A60201] dark:hover:text-white transition-colors">Registration</Link>
                        <span>•</span>
                        <span className="text-slate-400 dark:text-slate-600">Built for Medical Doctors</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};
