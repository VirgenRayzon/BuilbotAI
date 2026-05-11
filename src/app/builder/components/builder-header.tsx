"use client";

import React from 'react';
import { motion } from 'framer-motion';

export function BuilderHeader() {
    return (
        <div className="relative mb-12">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative z-10"
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-px w-8 bg-primary" />
                    <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary italic">Forge Your Machine</span>
                </div>
                <h1 className="text-3xl sm:text-5xl md:text-7xl font-headline font-bold uppercase tracking-tighter leading-none mb-6">
                    Masterpiece <span className="text-primary italic">Architect</span>
                </h1>
                <p className="text-muted-foreground max-w-2xl text-base md:text-lg leading-relaxed font-body">
                    Select high-performance components and let our AI ensure everything fits perfectly together through real-time compatibility diagnostics.
                </p>
            </motion.div>
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        </div>
    );
}
