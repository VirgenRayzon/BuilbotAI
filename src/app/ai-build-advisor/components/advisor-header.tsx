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
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <Alert variant="destructive" className="border-destructive/50 bg-destructive/10 backdrop-blur-xl rounded-2xl py-6 shadow-2xl shadow-destructive/20">
                        <AlertCircle className="h-6 w-6" />
                        <div className="ml-4">
                            <AlertTitle className="text-xl font-headline font-black uppercase tracking-tight mb-2">Neural Core Suspended</AlertTitle>
                            <AlertDescription className="text-sm font-medium opacity-90">
                                AI-driven build optimization and critiques have been temporarily disabled by the system administrator for maintenance.
                            </AlertDescription>
                        </div>
                    </Alert>
                </motion.div>
            )}

            <div className="relative mb-12">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative z-10"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-px w-8 bg-primary" />
                        <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary">System Advisor V2</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-headline font-black uppercase tracking-tighter leading-none">
                        AI Build <span className="text-primary italic">Advisor</span>
                    </h1>
                    <p className="text-muted-foreground mt-4 max-w-2xl text-lg leading-relaxed">
                        Get intelligent hardware recommendations and professional critiques for your custom build through our neural-trained AI model.
                    </p>
                </motion.div>
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
            </div>
        </>
    );
}
