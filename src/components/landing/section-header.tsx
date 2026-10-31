'use client';

import { cn } from "@/lib/utils";
import { useTheme } from "@/context/theme-provider";
import { Badge } from "@mantine/core";

interface SectionHeaderProps {
    title: string;
    subtitle?: React.ReactNode;
    badge?: string;
    centered?: boolean;
    className?: string;
    subtitleClassName?: string;
    id?: string;
    action?: React.ReactNode;
}

export function SectionHeader({
    title,
    subtitle,
    badge,
    centered = true,
    className,
    subtitleClassName,
    id,
    action,
}: SectionHeaderProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div className={cn(
            "mb-16 flex flex-col gap-4",
            centered ? "items-center text-center" : "items-start text-left",
            className
        )}>
            {badge && (
                <div className="flex items-center gap-2 mb-1">
                    <div className="h-px w-8 bg-cyan-500/40" />
                    <Badge
                        variant="light"
                        color="cyan"
                        size="md"
                        radius="xl"
                        className="font-bold tracking-widest uppercase px-3 py-1"
                    >
                        {badge}
                    </Badge>
                    <div className="h-px w-8 bg-cyan-500/40" />
                </div>
            )}
            <h2 id={id} className={cn(
                "text-3xl sm:text-5xl md:text-6xl font-black tracking-tight font-headline uppercase leading-tight",
                isDark ? "text-slate-100" : "text-slate-900"
            )}>
                {title}
            </h2>
            {subtitle && (
                <div className={cn(
                    "max-w-3xl text-base sm:text-lg md:text-xl font-medium leading-relaxed",
                    isDark ? "text-slate-400" : "text-slate-600",
                    subtitleClassName
                )}>
                    {subtitle}
                </div>
            )}
            {action && (
                <div className="mt-2">
                    {action}
                </div>
            )}
        </div>
    );
}
