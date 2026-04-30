"use client";

import React from "react";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface PowerMeterProps {
    value: number;
    max: number;
    className?: string;
}

export function PowerMeter({ value, max, className }: PowerMeterProps) {
    const maxToUse = max > 0 ? max : Math.max(value + 200, 600);
    const percentage = Math.min((value / maxToUse) * 100, 100);

    // Color logic based on percentage
    let colorClass = "bg-cyan-500 shadow-[0_0_10px_theme('colors.cyan.500')]";
    if (percentage > 90) {
        colorClass = "bg-red-500 shadow-[0_0_10px_theme('colors.red.500')]";
    } else if (percentage > 70) {
        colorClass = "bg-fuchsia-500 shadow-[0_0_10px_theme('colors.fuchsia.500')]";
    }

    return (
        <div className={cn("space-y-2 mb-4", className)}>
            <div className="flex justify-between items-baseline mb-1">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-cyan-400" /> Power Load
                </span>
                <span className="text-sm font-bold font-headline tabular-nums">
                    {value}W 
                    <span className="text-muted-foreground font-medium text-[10px] ml-1.5 opacity-60">
                        / {maxToUse}W
                    </span>
                </span>
            </div>
            <div className="h-2 w-full bg-secondary/50 dark:bg-secondary/30 rounded-full overflow-hidden border border-border/40 relative">
                {/* Background glow for the bar */}
                <div 
                    className={cn(
                        "h-full transition-all duration-1000 ease-out relative z-10", 
                        colorClass
                    )}
                    style={{ width: `${percentage}%` }}
                />
                
                {/* Subtle track markers */}
                <div className="absolute inset-0 flex justify-between px-2 pointer-events-none">
                    {[25, 50, 75].map((mark) => (
                        <div key={mark} className="w-px h-full bg-foreground/5 opacity-10" />
                    ))}
                </div>
            </div>
            
            {/* Contextual Label */}
            <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-tighter opacity-50">
                <span className={cn(percentage > 90 ? "text-red-500" : "text-muted-foreground")}>
                    {percentage > 90 ? "Critical Load" : percentage > 70 ? "High Load" : "Optimal"}
                </span>
                <span className="text-muted-foreground">{Math.round(percentage)}%</span>
            </div>
        </div>
    );
}
