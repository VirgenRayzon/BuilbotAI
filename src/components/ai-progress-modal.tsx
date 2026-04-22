"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Loader2, CheckCircle2, Terminal, Cpu, Zap, Sparkles, Image as ImageIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type ProgressPhase = 'init' | 'ai-requesting' | 'ai-complete' | 'ai-formatting' | 'image-fetch' | 'saving' | 'done';

interface AIProgressModalProps {
    isOpen: boolean;
    onComplete?: () => void;
    title?: string;
    currentPhase?: ProgressPhase;
}

const PHASE_CONFIG: Record<ProgressPhase, { text: string; icon: React.ComponentType<{ className?: string }> }> = {
    'init': { text: "Initializing Buildbot AI Engine...", icon: Bot },
    'ai-requesting': { text: "Requesting Stage 1 Analysis (with Google Search)...", icon: Cpu },
    'ai-complete': { text: "Stage 1 Analysis complete.", icon: Terminal },
    'ai-formatting': { text: "Requesting Stage 2 Formatting...", icon: Zap },
    'image-fetch': { text: "Asset Retrieval: Fetching high-fidelity product imagery...", icon: ImageIcon },
    'saving': { text: "Finalizing Prebuilt configuration and deploying...", icon: Sparkles },
    'done': { text: "SYSTEM DEPLOYMENT SUCCESSFUL: PREBUILT ADDED TO CATALOG", icon: CheckCircle2 },
};

const PHASE_ORDER: ProgressPhase[] = ['init', 'ai-requesting', 'ai-complete', 'ai-formatting', 'image-fetch', 'saving', 'done'];

export function AIProgressModal({ isOpen, onComplete, title = "Architecting Prebuilt", currentPhase = 'init' }: AIProgressModalProps) {
    const [logs, setLogs] = useState<{ text: string; type: 'info' | 'success'; timestamp: string }[]>([]);
    const [elapsedTime, setElapsedTime] = useState(0);
    const startTimeRef = useRef<number>(Date.now());
    const processedPhasesRef = useRef<Set<ProgressPhase>>(new Set());
    const logsEndRef = useRef<HTMLDivElement>(null);

    const isFinished = currentPhase === 'done';
    const currentStepIndex = Math.max(0, PHASE_ORDER.indexOf(currentPhase));

    // Reset when modal opens
    useEffect(() => {
        if (isOpen) {
            setLogs([]);
            setElapsedTime(0);
            startTimeRef.current = Date.now();
            processedPhasesRef.current = new Set();
        }
    }, [isOpen]);

    // Elapsed timer
    useEffect(() => {
        if (!isOpen) return;
        const interval = setInterval(() => {
            if (!isFinished) {
                setElapsedTime(Math.round((Date.now() - startTimeRef.current) / 1000));
            }
        }, 100);
        return () => clearInterval(interval);
    }, [isOpen, isFinished]);

    // Add log entry when phase changes
    useEffect(() => {
        if (!isOpen || !currentPhase) return;
        if (processedPhasesRef.current.has(currentPhase)) return;

        processedPhasesRef.current.add(currentPhase);
        const config = PHASE_CONFIG[currentPhase];
        if (config) {
            setLogs(prev => [...prev, {
                text: config.text,
                type: currentPhase === 'done' ? 'success' : 'info',
                timestamp: new Date().toLocaleTimeString([], { hour12: false }),
            }]);
        }

        if (isFinished) {
            setElapsedTime(Math.round((Date.now() - startTimeRef.current) / 1000));
        }
    }, [currentPhase, isOpen, isFinished]);

    // Auto-scroll to bottom when logs update
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                        className="w-full max-w-2xl"
                    >
                        <Card className="border-primary/20 bg-card/95 shadow-[0_0_50px_-12px_rgba(var(--primary),0.3)] overflow-hidden">
                            {/* Header */}
                            <div className="bg-primary/5 border-b border-primary/10 p-6 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                                        <Bot className="w-6 h-6 text-primary animate-pulse" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-headline font-black uppercase tracking-tighter">{title}</h2>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                            {isFinished ? "Neural Processing Complete" : "Neural Processing Active"}
                                        </p>
                                    </div>
                                </div>
                                <div className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors",
                                    isFinished ? "bg-emerald-500/20 border-emerald-500/30" : "bg-emerald-500/10 border-emerald-500/20"
                                )}>
                                    <div className={cn("w-2 h-2 rounded-full bg-emerald-500", !isFinished && "animate-pulse")} />
                                    <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                                        {isFinished ? `COMPLETED IN ${elapsedTime}s` : `${elapsedTime}s elapsed`}
                                    </span>
                                </div>
                            </div>

                            {/* Terminal Area */}
                            <div className="p-6 space-y-6">
                                <div className="bg-black/90 rounded-xl border border-white/5 p-6 font-mono text-sm relative group overflow-hidden h-[300px] flex flex-col">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

                                    <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                                        {logs.map((log, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="flex gap-3"
                                            >
                                                <span className="text-primary/40">[{log.timestamp}]</span>
                                                <span className={cn(
                                                    "flex-1",
                                                    log.type === 'success' ? "text-emerald-500 font-bold" : "text-primary/90"
                                                )}>
                                                    {log.type === 'success' ? "✓ " : "> "}{log.text}
                                                </span>
                                            </motion.div>
                                        ))}
                                        {isFinished && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="pt-4 mt-4 border-t border-white/10 text-emerald-500 font-bold flex items-center gap-2"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                                SYSTEM DEPLOYMENT SUCCESSFUL: PREBUILT ADDED TO CATALOG
                                            </motion.div>
                                        )}
                                        {!isFinished && (
                                            <div className="flex gap-3 items-center text-primary/60">
                                                <span>[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                                                <span className="animate-pulse flex items-center gap-2">
                                                    Architecting next layer...
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                </span>
                                            </div>
                                        )}
                                        <div ref={logsEndRef} />
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between opacity-50">
                                        <div className="flex gap-2">
                                            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/30" />
                                            <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/30" />
                                            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/30" />
                                        </div>
                                        <div className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-primary">
                                            <Terminal className="w-3 h-3" />
                                            Buildbot-v3-Flash-Preview
                                        </div>
                                    </div>
                                </div>

                                {/* Progress Bar & Button */}
                                <div className="space-y-6">
                                    {!isFinished ? (
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-end">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Current Stage</p>
                                                    <p className="text-sm font-bold truncate max-w-[400px]">
                                                        {PHASE_CONFIG[currentPhase]?.text || "Processing..."}
                                                    </p>
                                                </div>
                                                <p className="text-xl font-black font-headline text-primary italic">
                                                    {Math.round(((currentStepIndex + 1) / PHASE_ORDER.length) * 100)}%
                                                </p>
                                            </div>
                                            <div className="h-2 w-full bg-primary/5 rounded-full overflow-hidden border border-primary/10 p-0.5">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${((currentStepIndex + 1) / PHASE_ORDER.length) * 100}%` }}
                                                    transition={{ duration: 0.6, ease: "easeOut" }}
                                                    className="h-full bg-gradient-to-r from-primary via-emerald-500 to-primary rounded-full relative"
                                                >
                                                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)] animate-[shimmer_2s_infinite]" />
                                                </motion.div>
                                            </div>
                                        </div>
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex flex-col items-center gap-4"
                                        >
                                            <div className="text-center">
                                                <h3 className="text-2xl font-headline font-black uppercase text-emerald-500 tracking-tight">Done Adding Prebuilt!</h3>
                                                <p className="text-muted-foreground text-sm">Deployment sequence complete. Inventory updated.</p>
                                            </div>
                                            <button
                                                onClick={onComplete}
                                                className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-headline font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(16,185,129,0.5)] active:scale-[0.98] flex items-center justify-center gap-3 group"
                                            >
                                                Finalize & Close
                                                <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                            </button>
                                        </motion.div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-primary/5 p-4 flex items-center justify-center gap-4 text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-primary" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Optimized for Gemini 3</span>
                                </div>
                                <div className="w-1 h-1 rounded-full bg-primary/30" />
                                <div className="flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-emerald-500" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Low Latency Active</span>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
