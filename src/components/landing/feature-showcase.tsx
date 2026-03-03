'use client';

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import React from "react";

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
    return (
        <div className={cn(
            "grid lg:grid-cols-2 gap-12 items-center py-16",
            reversed ? "lg:flex-row-reverse" : "",
            className
        )}>
            <motion.div
                initial={{ opacity: 0, x: reversed ? 40 : -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={cn("flex flex-col gap-6", reversed ? "lg:order-last" : "")}
            >
                <h3 className="text-3xl font-bold tracking-tight font-headline">{title}</h3>
                <p className="text-lg text-slate-400 leading-relaxed">
                    {description}
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                className="relative aspect-video rounded-2xl overflow-hidden glass-panel border-white/20 p-4"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-500 to-primary animate-pulse z-20"></div>
                {visual}
            </motion.div>
        </div>
    );
}
