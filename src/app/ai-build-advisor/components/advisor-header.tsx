"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface AdvisorHeaderProps {
    isAiKillSwitch: boolean;
}

export function AdvisorHeader({ isAiKillSwitch }: AdvisorHeaderProps) {
    return (
        <>
            {isAiKillSwitch && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4"
                >
                    <Alert variant="destructive" className="border-destructive/50 bg-destructive/10 backdrop-blur-xl rounded-2xl py-4 shadow-lg shadow-destructive/20">
                        <AlertCircle className="h-5 w-5" />
                        <div className="ml-3">
                            <AlertTitle className="text-base font-headline font-bold uppercase tracking-tight mb-1">AI Service Temporarily Paused</AlertTitle>
                            <AlertDescription className="text-xs font-medium opacity-90">
                                AI-driven build optimization and critiques have been temporarily disabled by the system administrator for maintenance.
                            </AlertDescription>
                        </div>
                    </Alert>
                </motion.div>
            )}

            <div className="relative mb-4">
                <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="relative z-10 flex flex-col gap-0.5"
                >
                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-cyan-600 dark:text-cyan-400 font-headline">
                        System Advisor
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-headline font-bold uppercase tracking-tight text-slate-900 dark:text-slate-100">
                        Build <span className="text-cyan-600 dark:text-cyan-400 italic">Advisor</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                        Get hardware recommendations and critiques for your custom build through AI-enhanced suggestions.
                    </p>
                </motion.div>
            </div>
        </>
    );
}
