import React from 'react';
import { Link } from 'react-router-dom';
import { 
    Phone, 
    Mail, 
    MapPin, 
    Stethoscope, 
    ShieldCheck, 
    MessageCircle, 
    ExternalLink,
    ArrowUpRight,
    Lock
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';
import { getLocalizedText } from '../../utils/localization';

export const Footer: React.FC = () => {
    const { language } = useLanguage();
    const { settings } = useSettings();
    const footer = settings?.footer_settings;
    const [logoError, setLogoError] = React.useState(false);

    const logoUrl = footer?.logo_url || settings?.logo_url || settings?.header_settings?.logo_url;

    const brandTitle = getLocalizedText(footer?.brand_title, footer?.brand_title_en, language)
        || (settings?.site_name ? settings.site_name.split(' ')[0] : 'DoctorWallah');
    const brandSubtitle = getLocalizedText(footer?.brand_subtitle, footer?.brand_subtitle_en, language)
        || (settings?.site_name && settings.site_name.split(' ').length > 1 ? settings.site_name.split(' ').slice(1).join(' ') : 'Medical Academy');

    const description = getLocalizedText(footer?.description, footer?.description_en, language) 
        || 'The premier digital medical academy for MBBS students in Bangladesh. BMDC curriculum-aligned clinical lectures, Prof card mastery, and high-yield notes.';

    const showBadge = footer?.show_badge !== false;
    const badgeText = getLocalizedText(footer?.badge_text, footer?.badge_text_en, language) 
        || 'BMDC Syllabus Aligned • Qualified Medical Faculty';

    const col2Title = getLocalizedText(footer?.column_2_title, footer?.column_2_title_en, language) || 'Medical Programs';
    const rawCol2Links = footer?.column_2_links && footer.column_2_links.length > 0
        ? footer.column_2_links
        : [
            { id: '1', label: 'All Medical Courses', url: '/courses' },
            { id: '2', label: '1st Prof Clinical Combos', url: '/courses?category=1st-prof' },
            { id: '3', label: 'Anatomy & Embryology', url: '/courses?category=anatomy' },
            { id: '4', label: 'Physiology & Biophysics', url: '/courses?category=physiology' },
            { id: '5', label: 'Biochemistry & Metabolism', url: '/courses?category=biochemistry' },
        ];
    const col2Links = rawCol2Links.map(link => ({
        ...link,
        label: getLocalizedText(link.label, link.label_en, language) || link.label,
    }));

    const col3Title = getLocalizedText(footer?.column_3_title, footer?.column_3_title_en, language) || 'Student Resources';
    const rawCol3Links = footer?.column_3_links && footer.column_3_links.length > 0
        ? footer.column_3_links
        : [
            { id: '1', label: 'My Enrolled Classes', url: '/student/my-courses' },
            { id: '2', label: 'Marked Books & Viva Bank', url: '/earn-points' },
            { id: '3', label: 'OSPE / OSCE Question Bank', url: '/courses?category=osce' },
            { id: '4', label: 'Academic Doubt Support', url: '/courses' },
            { id: '5', label: 'Reward Points & Rewards', url: '/earn-points' },
        ];
    const col3Links = rawCol3Links.map(link => ({
        ...link,
        label: getLocalizedText(link.label, link.label_en, language) || link.label,
    }));

    const col4Title = getLocalizedText(footer?.column_4_title, footer?.column_4_title_en, language) || 'Helpline & Office';
    const phone = footer?.phone || settings?.contact_phone || '01580401289';
    const phoneHours = getLocalizedText(footer?.phone_hours, footer?.phone_hours_en, language) || 'Daily 9:00 AM – 11:00 PM';
    const email = footer?.email || settings?.contact_email || 'support@doctorwallah.com';
    const address = getLocalizedText(footer?.address, footer?.address_en, language) || 'Dhaka, Bangladesh';
    const socialLinks = footer?.social_links || [
        { platform: 'Facebook', url: 'https://facebook.com' },
        { platform: 'YouTube', url: 'https://youtube.com' },
        { platform: 'Telegram', url: 'https://telegram.org' },
        { platform: 'WhatsApp', url: 'https://whatsapp.com' },
    ];

    const defaultCopyright = `© ${new Date().getFullYear()} ${brandTitle} Medical Academy. All rights reserved.`;
    const copyrightText = getLocalizedText(footer?.copyright_text, footer?.copyright_text_en, language)
        || settings?.copyright_text
        || defaultCopyright;

    const renderSocialIcon = (platformName: string) => {
        const p = (platformName || '').toLowerCase();
        if (p.includes('facebook') || p.includes('fb')) {
            return (
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
            );
        }
        if (p.includes('youtube') || p.includes('yt')) {
            return (
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
            );
        }
        if (p.includes('telegram') || p.includes('tg')) {
            return (
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.46c.537-.196 1.006.128.832.93z"/>
                </svg>
            );
        }
        if (p.includes('whatsapp') || p.includes('wa')) {
            return (
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.978-.276-.101-.477-.15-.678.15-.2.301-.777.978-.953 1.18-.175.201-.351.226-.652.075-.3-.15-1.267-.467-2.414-1.49-1.005-.896-1.684-2.003-1.88-2.341-.196-.338-.021-.52.13-.67.135-.135.301-.351.451-.527.151-.176.201-.301.302-.502.1-.2.05-.376-.026-.526-.075-.15-.677-1.633-.928-2.238-.244-.589-.493-.509-.678-.519-.176-.008-.376-.01-.577-.01-.2 0-.527.075-.803.376s-1.054 1.03-1.054 2.511 1.08 2.912 1.23 3.113c.15.201 2.124 3.244 5.147 4.551.719.31 1.28.496 1.718.636.723.23 1.38.197 1.9.12.58-.087 1.78-.727 2.03-1.43.25-.703.25-1.306.175-1.431-.075-.126-.276-.201-.577-.352z"/>
                </svg>
            );
        }
        return <ExternalLink className="w-3.5 h-3.5" />;
    };

    return (
        <footer className="relative bg-white dark:bg-[#060202] text-slate-600 dark:text-slate-400 border-t border-slate-200/80 dark:border-white/[0.08] transition-colors">
            {/* Top Brand Accent Line */}
            <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-[#A60201] to-transparent opacity-80" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Minimalist Helpline Strip */}
                <div className="py-7 sm:py-8 border-b border-slate-200/70 dark:border-white/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#A60201] animate-pulse" />
                            <span className="text-[11px] font-bold uppercase tracking-widest text-[#A60201] dark:text-red-400">
                                24/7 Academic Helpline
                            </span>
                        </div>
                        <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
                            কোর্স এনরোলমেন্ট বা প্রফ সিলেবাস নিয়ে যেকোনো প্রশ্ন? আমাদের কল করুন।
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                        <a
                            href={`tel:${phone}`}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#A60201] hover:bg-[#880101] text-white text-xs font-bold transition-all shadow-xs cursor-pointer group"
                        >
                            <Phone className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                            <span>{phone}</span>
                        </a>

                        <a
                            href={`https://wa.me/88${phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer"
                        >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                            <span>WhatsApp</span>
                        </a>
                    </div>
                </div>

                {/* 4 Clean Columns Grid */}
                <div className="py-12 sm:py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
                    {/* Column 1: Brand & Mission (lg:col-span-4) */}
                    <div className="lg:col-span-4 space-y-4">
                        <div className="flex items-center gap-3">
                            {logoUrl && !logoError ? (
                                <Link to="/" className="inline-flex items-center transition-opacity hover:opacity-90">
                                    <img
                                        src={logoUrl}
                                        alt={`${brandTitle} ${brandSubtitle}`}
                                        onError={() => setLogoError(true)}
                                        className="h-9 sm:h-10 w-auto object-contain max-w-[200px]"
                                    />
                                </Link>
                            ) : (
                                <Link to="/" className="flex items-center gap-2.5 group">
                                    <div className="w-9 h-9 rounded-xl bg-[#A60201] flex items-center justify-center text-white shadow-md shadow-[#A60201]/30">
                                        <Stethoscope className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight block leading-none">
                                            {brandTitle}
                                        </span>
                                        <span className="text-[10px] font-bold text-[#A60201] tracking-widest uppercase block mt-0.5">
                                            {brandSubtitle}
                                        </span>
                                    </div>
                                </Link>
                            )}
                        </div>

                        <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
                            {description}
                        </p>

                        {showBadge && (
                            <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] px-3 py-1.5 rounded-lg">
                                <ShieldCheck className="w-3.5 h-3.5 text-[#A60201] shrink-0" />
                                <span>{badgeText}</span>
                            </div>
                        )}

                        {/* Minimalist Social Icons */}
                        <div className="pt-2 flex items-center gap-2">
                            {socialLinks.map((soc: any) => (
                                <a
                                    key={soc.id || soc.platform}
                                    href={soc.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={soc.platform}
                                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-[#A60201] hover:text-white dark:bg-white/[0.04] dark:hover:bg-[#A60201] dark:hover:text-white border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400 flex items-center justify-center transition-all cursor-pointer"
                                    title={soc.platform}
                                >
                                    {renderSocialIcon(soc.platform)}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Column 2: Medical Programs (lg:col-span-3) */}
                    <div className="lg:col-span-3 space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white">
                            {col2Title}
                        </h4>
                        <ul className="space-y-2.5 text-xs sm:text-[13px]">
                            {col2Links.map((link) => (
                                <li key={link.id || link.label}>
                                    {link.url.startsWith('http') ? (
                                        <a 
                                            href={link.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="text-slate-500 dark:text-slate-400 hover:text-[#A60201] dark:hover:text-white transition-colors inline-flex items-center gap-1"
                                        >
                                            <span>{link.label}</span>
                                            <ArrowUpRight className="w-3 h-3 opacity-60" />
                                        </a>
                                    ) : (
                                        <Link 
                                            to={link.url} 
                                            className="text-slate-500 dark:text-slate-400 hover:text-[#A60201] dark:hover:text-white transition-colors block"
                                        >
                                            {link.label}
                                        </Link>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 3: Student Resources (lg:col-span-2) */}
                    <div className="lg:col-span-2 space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white">
                            {col3Title}
                        </h4>
                        <ul className="space-y-2.5 text-xs sm:text-[13px]">
                            {col3Links.map((link) => (
                                <li key={link.id || link.label}>
                                    {link.url.startsWith('http') ? (
                                        <a 
                                            href={link.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="text-slate-500 dark:text-slate-400 hover:text-[#A60201] dark:hover:text-white transition-colors block"
                                        >
                                            {link.label}
                                        </a>
                                    ) : (
                                        <Link 
                                            to={link.url} 
                                            className="text-slate-500 dark:text-slate-400 hover:text-[#A60201] dark:hover:text-white transition-colors block"
                                        >
                                            {link.label}
                                        </Link>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 4: Contact & Office (lg:col-span-3) */}
                    <div className="lg:col-span-3 space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white">
                            {col4Title}
                        </h4>

                        <div className="space-y-2.5 text-xs sm:text-[13px]">
                            {phone && (
                                <div className="flex items-start gap-2.5">
                                    <Phone className="w-4 h-4 text-[#A60201] shrink-0 mt-0.5" />
                                    <div>
                                        <a href={`tel:${phone}`} className="font-semibold text-slate-900 dark:text-white hover:text-[#A60201] transition-colors">
                                            {phone}
                                        </a>
                                        {phoneHours && (
                                            <span className="text-[11px] text-slate-400 block mt-0.5">{phoneHours}</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {email && (
                                <div className="flex items-center gap-2.5">
                                    <Mail className="w-4 h-4 text-[#A60201] shrink-0" />
                                    <a href={`mailto:${email}`} className="text-slate-600 dark:text-slate-300 hover:text-[#A60201] transition-colors truncate">
                                        {email}
                                    </a>
                                </div>
                            )}

                            {address && (
                                <div className="flex items-start gap-2.5">
                                    <MapPin className="w-4 h-4 text-[#A60201] shrink-0 mt-0.5" />
                                    <span className="text-slate-600 dark:text-slate-400">{address}</span>
                                </div>
                            )}
                        </div>

                        {/* Minimalist Verified Payment Notice */}
                        <div className="pt-2 border-t border-slate-200/60 dark:border-white/[0.06]">
                            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 mb-1.5">
                                <Lock className="w-3 h-3 text-[#A60201]" />
                                <span>Secured Instant Payment</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06]">bKash</span>
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06]">Nagad</span>
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06]">Rocket</span>
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06]">Cards</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Legal, Privacy & Copyright Strip */}
                <div className="py-6 border-t border-slate-200/70 dark:border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-500">
                    <div>
                        <span>{copyrightText}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 font-medium text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs">
                        <Link to="/courses" className="hover:text-[#A60201] dark:hover:text-white transition-colors">Courses</Link>
                        <span>•</span>
                        <Link to="/login" className="hover:text-[#A60201] dark:hover:text-white transition-colors">Student Login</Link>
                        <span>•</span>
                        <Link to="/register" className="hover:text-[#A60201] dark:hover:text-white transition-colors">Enroll</Link>
                        <span>•</span>
                        <span className="text-slate-400 dark:text-slate-600">Built for Future Doctors</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};
