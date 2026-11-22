import React from 'react';
import { Loader2 } from 'lucide-react';

interface PagePreloaderProps {
    title?: string;
    subtitle?: string;
    fullScreen?: boolean;
    className?: string;
}

export const PagePreloader: React.FC<PagePreloaderProps> = ({
    title,
    subtitle,
    fullScreen = false,
    className = '',
}) => {
    const content = (
        <div className="flex flex-col items-center justify-center text-center p-6 select-none">
            {/* Standard Normal Loading Animation */}
            <div className="flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-[#A60201] animate-spin" />
            </div>

            {/* Clean, simple title if provided */}
            {title && (
                <p className="mt-3.5 text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide">
                    {title}
                </p>
            )}
            {subtitle && (
                <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500 max-w-xs">
                    {subtitle}
                </p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className={`fixed inset-0 z-50 bg-white dark:bg-[#060202] flex items-center justify-center ${className}`}>
                {content}
            </div>
        );
    }

    return (
        <div className={`min-h-[50vh] flex items-center justify-center py-16 ${className}`}>
            {content}
        </div>
    );
};
