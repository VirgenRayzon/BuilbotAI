"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Bot, CircuitBoard, Database } from 'lucide-react';
import { ChatForm } from '@/components/chat-form';
import { BuildSummary } from '@/components/build-summary';
import { cn } from '@/lib/utils';

interface RecommendationTabProps {
    isDark: boolean;
    isPending: boolean;
    handleGetRecommendations: (data: any) => void;
    build: any;
    elapsedTime: number;
    finalResponseTime: number | null;
    totalPrice: number;
}

export function RecommendationTab({
    isDark,
    isPending,
    handleGetRecommendations,
    build,
    elapsedTime,
    finalResponseTime,
    totalPrice
}: RecommendationTabProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid lg:grid-cols-12 gap-8 h-full"
        >
            <aside className="lg:col-span-4 lg:sticky lg:top-24 self-start">
                <div className={cn(
                    "p-8 rounded-3xl border backdrop-blur-xl shadow-2xl transition-all duration-500",
                    isDark
                        ? "bg-slate-900/40 border-white/5 shadow-black/40"
                        : "bg-white/60 border-slate-200 shadow-slate-200/50"
                )}>
                    <div className="flex items-center gap-4 mb-8">
                        <div className={cn(
                            "p-3 rounded-2xl",
                            isDark ? "bg-primary/10" : "bg-primary/5"
                        )}>
                            <Bot className="w-8 h-8 text-primary animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-headline font-bold tracking-tight">
                                Buildbot Advisor
                            </h2>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Neural Engine Active</span>
                            </div>
                        </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                        Describe your hardware requirements, budget, or preferred games. Our neural engine will architect the perfect build for you.
                    </p>

                    <ChatForm
                        getRecommendations={handleGetRecommendations}
                        isPending={isPending}
                    />

                    <div className="mt-8 pt-8 border-t border-border/50">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
                            <div className="flex items-center gap-1.5">
                                <CircuitBoard className="w-3 h-3" />
                                V2.4.0-CORE
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Database className="w-3 h-3" />
                                LIVE INVENTORY
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            <div className="lg:col-span-8">
                <BuildSummary 
                    build={build} 
                    isPending={isPending} 
                    elapsedTime={elapsedTime} 
                    finalResponseTime={finalResponseTime} 
                    totalPrice={totalPrice} 
                />
            </div>
        </motion.div>
    );
}
