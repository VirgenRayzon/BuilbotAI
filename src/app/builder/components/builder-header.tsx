"use client";

import React from 'react';
import { motion } from 'framer-motion';

export function BuilderHeader() {
    return (
        <div className="relative mb-4">
            <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="relative z-10 flex flex-col gap-0.5"
            >
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-cyan-600 dark:text-cyan-400 font-headline">
                    Build Your PC
                </span>
                <h1 className="text-2xl sm:text-3xl font-headline font-bold uppercase tracking-tight text-slate-900 dark:text-slate-100">
                    Select PC <span className="text-cyan-600 dark:text-cyan-400 italic">Components</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    Select from our wide range of PC components for reservation or ask AI for a build review.
                </p>
            </motion.div>
        </div>
    );
}
