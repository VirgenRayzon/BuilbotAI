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
    handleCancelRecommendations: () => void;
    build: any;
    elapsedTime: number;
    finalResponseTime: number | null;
    totalPrice: number;
    error?: string | null;
}

export function RecommendationTab({
    isDark,
    isPending,
    handleGetRecommendations,
    handleCancelRecommendations,
    build,
    elapsedTime,
    finalResponseTime,
    totalPrice,
    error
}: RecommendationTabProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid lg:grid-cols-12 gap-8 h-full"
        >
            <aside className="lg:col-span-4 lg:sticky lg:top-24 self-start">
                <div className={cn(
                    "p-8 rounded-3xl border transition-all duration-500 relative overflow-hidden glass-panel border-primary/30 shadow-[0_0_30px_rgba(34,211,238,0.08),0_0_60px_rgba(34,211,238,0.04)]",
                    isDark ? "bg-slate-900/40" : "bg-white/60"
                )}>
                    {/* Animated top accent */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent z-20" />
                    
                    {/* Subtle corner glow accents */}
                    <div className="absolute -top-6 -left-6 w-32 h-32 bg-primary/10 rounded-full blur-[40px] pointer-events-none z-0" />
                    <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-purple-500/8 rounded-full blur-[30px] pointer-events-none z-0" />

                    <div className="relative z-10">
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
                </div>
            </aside>

            <div className="lg:col-span-8">
                <BuildSummary 
                    build={build} 
                    isPending={isPending} 
                    onCancel={handleCancelRecommendations}
                    elapsedTime={elapsedTime} 
                    finalResponseTime={finalResponseTime} 
                    totalPrice={totalPrice} 
                    error={error}
                />
            </div>
        </motion.div>
    );
}
