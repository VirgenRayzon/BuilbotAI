'use client';

import { cn } from "@/lib/utils";
import { useTheme } from "@/context/theme-provider";

interface SectionHeaderProps {
    title: string;
    subtitle?: string;
    badge?: string;
    centered?: boolean;
    className?: string;
}

export function SectionHeader({
    title,
    subtitle,
    badge,
    centered = true,
    className,
}: SectionHeaderProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div className={cn(
            "mb-16 flex flex-col gap-5",
            centered ? "items-center text-center" : "items-start text-left",
            className
        )}>
            {badge && (
                <div className="flex items-center gap-2 mb-2">
                    <div className="h-px w-8 bg-primary/40" />
                    <span className={cn(
                        "inline-flex items-center rounded-full border px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em]",
                        isDark ? "bg-primary/10 border-primary/20 text-primary" : "bg-primary/5 border-primary/10 text-primary shadow-sm"
                    )}>
                        {badge}
                    </span>
                    <div className="h-px w-8 bg-primary/40" />
                </div>
            )}
            <h2 className={cn(
                "text-4xl font-black tracking-tighter sm:text-6xl font-headline uppercase leading-[0.9]",
                isDark ? "text-white" : "text-slate-900"
            )}>
                {title}
            </h2>
            {subtitle && (
                <p className={cn(
                    "max-w-2xl text-lg md:text-xl font-medium leading-relaxed",
                    isDark ? "text-slate-400" : "text-slate-600"
                )}>
                    {subtitle}
                </p>
            )}
        </div>
    );
}
