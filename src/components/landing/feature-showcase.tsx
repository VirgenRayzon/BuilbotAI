'use client';

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import React from "react";
import { useTheme } from "@/context/theme-provider";

interface FeatureShowcaseProps {
    title: string;
    description: string;
    visual: React.ReactNode;
    reversed?: boolean;
    className?: string;
}

export function FeatureShowcase({
    title,
    description,
    visual,
    reversed = false,
    className,
}: FeatureShowcaseProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div className={cn(
            "grid lg:grid-cols-2 gap-16 lg:gap-24 items-center py-20",
            reversed ? "lg:flex-row-reverse" : "",
            className
        )}>
            <motion.div
                initial={{ opacity: 0, x: reversed ? 40 : -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={cn("flex flex-col gap-8", reversed ? "lg:order-last" : "")}
            >
                <div className="flex items-center gap-3 md:gap-4">
                    <div className="h-px w-8 md:h-px md:w-10 bg-primary/40" />
                    <h3 className={cn(
                        "text-2xl sm:text-3xl md:text-5xl font-black tracking-tight font-headline uppercase leading-[1.1]",
                        isDark ? "text-white" : "text-slate-900"
                    )}>{title}</h3>
                </div>
                <p className={cn(
                    "text-base sm:text-lg md:text-xl leading-relaxed font-medium",
                    isDark ? "text-slate-400" : "text-slate-600"
                )}>
                    {description}
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                className={cn(
                    "relative aspect-video rounded-3xl overflow-hidden border backdrop-blur-xl p-4 shadow-2xl transition-all duration-500",
                    isDark ? "bg-slate-900/40 border-white/5 shadow-black/40" : "bg-white/60 border-slate-200 shadow-slate-200/50"
                )}
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-primary/50 to-primary animate-pulse z-20"></div>
                {visual}
                
                {/* HUD Decoration */}
                <div className="absolute bottom-4 right-4 flex gap-1.5 opacity-30">
                    <div className="w-1 h-1 rounded-full bg-primary" />
                    <div className="w-1 h-1 rounded-full bg-primary" />
                    <div className="w-4 h-1 rounded-full bg-primary" />
                </div>
            </motion.div>
        </div>
    );
}
