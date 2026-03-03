import { cn } from "@/lib/utils";

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
    return (
        <div className={cn(
            "mb-12 flex flex-col gap-4",
            centered ? "items-center text-center" : "items-start text-left",
            className
        )}>
            {badge && (
                <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary uppercase tracking-widest">
                    {badge}
                </span>
            )}
            <h2 className="text-3xl font-bold tracking-tight sm:text-5xl font-headline">
                {title}
            </h2>
            {subtitle && (
                <p className="max-w-2xl text-lg text-slate-400">
                    {subtitle}
                </p>
            )}
        </div>
    );
}
