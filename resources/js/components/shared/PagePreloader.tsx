import React from 'react';
import { useSettings } from '../../context/SettingsContext';

interface PagePreloaderProps {
    title?: string;
    subtitle?: string;
    fullScreen?: boolean;
    className?: string;
}

export const PagePreloader: React.FC<PagePreloaderProps> = ({
    title = 'Loading experience...',
    subtitle = 'Please wait while we prepare the best learning content for you',
    fullScreen = false,
    className = '',
}) => {
    const { settings } = useSettings();
    const logoUrl = settings?.logo_url;

    const content = (
        <div className="flex flex-col items-center justify-center text-center p-6 space-y-4 max-w-sm mx-auto select-none">
            {/* Animated Dual Glowing Rings & Logo */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
                {/* Outer pulsing soft glow */}
                <div className="absolute inset-0 rounded-full bg-[#A60201]/15 blur-xl animate-pulse pointer-events-none" />

                {/* Outer spinning ring */}
                <div
                    className="absolute inset-0 rounded-full border-3 border-transparent border-t-[#A60201] border-r-[#A60201]/50 animate-spin"
                    style={{ animationDuration: '1.2s' }}
                />

                {/* Inner counter-spinning ring */}
                <div
                    className="absolute inset-2.5 rounded-full border-3 border-transparent border-b-[#A60201] border-l-[#A60201]/50 animate-spin"
                    style={{ animationDuration: '0.9s', animationDirection: 'reverse' }}
                />

                {/* Center Core Badge */}
                <div className="relative w-12 h-12 rounded-full bg-white dark:bg-slate-900 shadow-md border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden p-1.5">
                    {logoUrl ? (
                        <img
                            src={logoUrl}
                            alt="DoctorWallah"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                            }}
                        />
                    ) : (
                        <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#A60201] to-[#880101] flex items-center justify-center text-white font-black text-sm shadow-inner">
                            D
                        </div>
                    )}
                </div>
            </div>

            {/* Title with bouncing dots */}
            <div className="space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-slate-800 dark:text-slate-100 font-extrabold text-sm sm:text-base tracking-tight">
                    <span>{title}</span>
                    <span className="flex items-center gap-0.5 text-[#A60201]">
                        <span className="w-1 h-1 rounded-full bg-[#A60201] animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1 h-1 rounded-full bg-[#A60201] animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1 h-1 rounded-full bg-[#A60201] animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                </div>
                {subtitle && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed font-medium">
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
    );

    if (fullScreen) {
        return (
            <div className={`fixed inset-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-center ${className}`}>
                {content}
            </div>
        );
    }

    return (
        <div className={`min-h-[55vh] flex items-center justify-center py-16 ${className}`}>
            {content}
        </div>
    );
};
