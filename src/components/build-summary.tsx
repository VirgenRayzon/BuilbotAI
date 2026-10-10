"use client";

import React from "react";
import type { Build } from "@/lib/types";
import { ComponentCard } from "./component-card";
import { Button } from "@/components/ui/button";
import { Paper, Text, Group, ThemeIcon, Box } from "@mantine/core";
import { Sparkles, AlertTriangle, Zap, Bot, Loader2, Cpu, Server, CircuitBoard, MemoryStick, Database, Power, RectangleVertical, Wind, Heart } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useUser, useFirestore } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

interface BuildSummaryProps {
    build: Build | null;
    isPending: boolean;
    onCancel?: () => void;
    elapsedTime?: number;
    finalResponseTime?: number | null;
    totalPrice?: number;
    error?: string | null;
}

const COMPONENT_SLOTS = [
    { key: "cpu", name: "CPU", icon: Cpu },
    { key: "gpu", name: "Graphics Card", icon: Server },
    { key: "motherboard", name: "Motherboard", icon: CircuitBoard },
    { key: "ram", name: "RAM", icon: MemoryStick },
    { key: "storage", name: "Storage", icon: Database },
    { key: "psu", name: "Power Supply", icon: Power },
    { key: "case", name: "Case", icon: RectangleVertical },
    { key: "cooler", name: "Cooler", icon: Wind },
] as const;

const STREAMING_STEPS = [
    { title: "Analyzing Hardware Balance", sub: "Evaluating CPU and GPU pairing..." },
    { title: "Checking Compatibility", sub: "Verifying socket, RAM, and motherboard match..." },
    { title: "Sourcing Inventory", sub: "Scanning real-time component availability & pricing..." },
    { title: "Finalizing System Architecture", sub: "Streaming component selection live..." }
];

export function BuildSummary({ build, isPending, onCancel, elapsedTime, finalResponseTime, totalPrice, error }: BuildSummaryProps) {
    const [isSaving, setIsSaving] = React.useState(false);
    const [isSaved, setIsSaved] = React.useState(false);
    const user = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    // Telemetry history for rolling average
    const [telemetryHistory, setTelemetryHistory] = React.useState<number[]>([]);

    React.useEffect(() => {
        const saved = localStorage.getItem('pc_recommendations_telemetry_v1');
        if (saved) {
            try {
                setTelemetryHistory(JSON.parse(saved));
            } catch (e) {
                console.error(e);
            }
        }
    }, []);

    React.useEffect(() => {
        if (!isPending && build && finalResponseTime) {
            const saved = localStorage.getItem('pc_recommendations_telemetry_v1');
            let list: number[] = [];
            if (saved) {
                try {
                    list = JSON.parse(saved);
                } catch (e) {
                    console.error(e);
                }
            }
            if (list[list.length - 1] !== finalResponseTime) {
                list.push(finalResponseTime);
                localStorage.setItem('pc_recommendations_telemetry_v1', JSON.stringify(list));
                setTelemetryHistory(list);
            }
        }
    }, [isPending, build, finalResponseTime]);

    const averageTime = telemetryHistory.length > 0
        ? telemetryHistory.reduce((sum, val) => sum + val, 0) / telemetryHistory.length
        : 0;

    const diff = averageTime > 0 && finalResponseTime
        ? averageTime - finalResponseTime
        : 0;

    const comparisonText = diff !== 0
        ? `${Math.abs(diff).toFixed(1)}s ${diff > 0 ? 'faster' : 'slower'} than average`
        : 'On par with average';

    // Reset saved state when build changes
    React.useEffect(() => {
        setIsSaved(false);
    }, [build]);

    const handleSaveToFavorites = async () => {
        if (!user || !firestore || !build) return;
        setIsSaving(true);
        try {
            const categoryMap: Record<string, string> = {
                cpu: 'CPU', gpu: 'GPU', motherboard: 'Motherboard', ram: 'RAM',
                storage: 'Storage', psu: 'PSU', case: 'Case', cooler: 'Cooler'
            };
            const parts = Object.entries(categoryMap).map(([key, category]) => {
                const comp = (build as any)[key];
                return comp ? {
                    category,
                    partId: comp.id || `ai-${key}`,
                    name: comp.model || '',
                    price: comp.price || 0,
                } : null;
            }).filter(Boolean);

            await addDoc(collection(firestore, "users", user.uid, "favorites"), {
                name: `AI Build — ${new Date().toLocaleDateString()}`,
                parts,
                totalPrice: totalPrice || 0,
                source: 'advisor',
                createdAt: serverTimestamp(),
            });
            setIsSaved(true);
            toast({ title: "Saved to Favorites", description: "AI build has been added to your favorites." });
        } catch (err) {
            console.error(err);
            toast({ title: "Error", description: "Failed to save build.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const hasAnyStreamedPart = build && COMPONENT_SLOTS.some(s => Boolean((build as any)[s.key]?.model));

    return (
        <Paper
            radius="lg"
            withBorder
            shadow="xl"
            className="w-full overflow-hidden bg-white/95 dark:bg-[#0d1117]/95 border-slate-200 dark:border-cyan-500/20 backdrop-blur-xl relative shadow-xl dark:shadow-[0_0_35px_rgba(0,0,0,0.5)]"
        >
            {/* Header Box */}
            <Box className="p-3 bg-slate-50/90 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10">
                <Group justify="space-between" align="center">
                    <Group gap="xs" align="center">
                        <ThemeIcon size={32} radius="md" variant="light" color="cyan" className="shadow-sm">
                            <Bot className="h-5 w-5 text-cyan-500 dark:text-cyan-400" />
                        </ThemeIcon>
                        <Text fw={900} size="xl" className="font-headline tracking-tight text-slate-900 dark:text-white">
                            Build Overview
                        </Text>
                    </Group>

                    {/* Turnaround Badge */}
                    {finalResponseTime && !isPending && (
                        <div className="relative group/tooltip">
                            <span className="cursor-help px-3 py-1 rounded-full border border-cyan-300 dark:border-cyan-400/80 bg-cyan-50/80 dark:bg-gradient-to-r dark:from-cyan-950/70 dark:via-cyan-900/60 dark:to-blue-950/70 text-cyan-800 dark:text-cyan-300 font-mono text-xs font-black uppercase tracking-widest select-none shadow-sm dark:shadow-[0_0_15px_rgba(34,211,238,0.45)] hover:shadow-md hover:scale-105 transition-all duration-300 flex items-center gap-1.5">
                                <span className="text-amber-500 drop-shadow-[0_0_6px_rgba(251,191,36,0.9)]">⚡</span>
                                <span>{finalResponseTime.toFixed(1)}s Turnaround Time</span>
                            </span>

                            <div className="absolute right-0 top-full mt-2 w-64 p-3 rounded-xl border border-slate-200 dark:border-cyan-500/20 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl shadow-2xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-300 pointer-events-none z-50 text-[10px] font-mono text-slate-700 dark:text-zinc-300 space-y-1.5 leading-relaxed">
                                <div className="border-b border-slate-200 dark:border-white/5 pb-1 flex justify-between">
                                    <span className="text-[9px] font-black text-cyan-600 dark:text-cyan-400 uppercase">Generation Time</span>
                                    <span className="text-[8px] text-slate-500 dark:text-zinc-500 font-sans">Compare: {comparisonText}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500 dark:text-zinc-500">This build:</span>
                                    <span className="text-slate-800 dark:text-zinc-200">{finalResponseTime.toFixed(1)}s</span>
                                </div>
                                <div className="pt-1.5 border-t border-slate-200 dark:border-white/5 flex justify-between text-[9px] font-sans">
                                    <span className="text-slate-600 dark:text-zinc-400">Average: {averageTime > 0 ? `${averageTime.toFixed(1)}s` : 'Calculating...'}</span>
                                    <span className="text-slate-600 dark:text-slate-400">{comparisonText}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </Group>
            </Box>

            <div className="p-3 space-y-5">
                <AnimatePresence mode="wait">
                    {/* Error State */}
                    {error ? (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-16 px-8 border-2 border-dashed rounded-xl space-y-6 border-red-500/20 bg-red-500/5"
                        >
                            <AlertTriangle className="h-20 w-20 text-red-500/50" />
                            <div className="text-center space-y-3">
                                <h3 className="text-2xl font-headline font-semibold tracking-tight uppercase text-red-500">System Error</h3>
                                <p className="text-red-400/80 max-w-sm mx-auto text-sm leading-relaxed">
                                    {error}
                                </p>
                                <p className="text-muted-foreground max-w-sm mx-auto text-xs leading-relaxed mt-4">
                                    Try adjusting your budget, relaxing your performance requirements, or enabling AI Search.
                                </p>
                            </div>
                        </motion.div>
                    ) : isPending ? (
                        /* Progressive Streaming Grid View */
                        <motion.div
                            key="streaming"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-6"
                        >
                            {/* Streaming Status Banner */}
                            <div className="p-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 shrink-0">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-headline font-bold uppercase tracking-wider text-xs text-cyan-700 dark:text-cyan-300">
                                                AI Generation in Progress
                                            </span>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-800 dark:text-cyan-200">
                                                ⚡ {elapsedTime || 0}s elapsed
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                                            {hasAnyStreamedPart
                                                ? "Streaming components into your build in real time..."
                                                : STREAMING_STEPS[Math.min(Math.floor((elapsedTime || 0) / 3), STREAMING_STEPS.length - 1)].sub}
                                        </p>
                                    </div>
                                </div>

                                {onCancel && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={onCancel}
                                        className="h-8 px-4 rounded-full border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all font-bold uppercase tracking-widest text-[10px]"
                                    >
                                        <Zap className="h-3 w-3 mr-1.5 fill-current" />
                                        Stop Generation
                                    </Button>
                                )}
                            </div>

                            {/* Summary Banner if partially streamed */}
                            {build?.summary && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-emerald-500/10 rounded-2xl p-4 border border-emerald-500/20"
                                >
                                    <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400">
                                        <Sparkles className="h-4 w-4" />
                                        <h4 className="font-headline font-bold uppercase tracking-wider text-xs">Build Strategy</h4>
                                    </div>
                                    <p className="text-sm text-foreground/90 leading-relaxed italic pl-3 border-l-2 border-emerald-500/40">
                                        "{build.summary}"
                                    </p>
                                </motion.div>
                            )}

                            {/* Progressive Slots Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                {COMPONENT_SLOTS.map((slot, index) => {
                                    const compData = build ? (build as any)[slot.key] : null;
                                    const isSlotLoaded = Boolean(compData && compData.model);

                                    return (
                                        <div key={slot.key} className="h-full">
                                            {isSlotLoaded ? (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ duration: 0.3 }}
                                                    className="h-full"
                                                >
                                                    <ComponentCard
                                                        name={slot.name}
                                                        component={compData}
                                                        icon={slot.icon}
                                                    />
                                                </motion.div>
                                            ) : (
                                                <div className="h-full p-4 rounded-[var(--mantine-radius-lg)] border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#141a23]/90 backdrop-blur-md flex flex-col justify-between transition-all">
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-7 h-7 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                                                                <slot.icon className="h-4 w-4" />
                                                            </div>
                                                            <div className="space-y-1.5 flex-1">
                                                                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
                                                                    {slot.name}
                                                                </span>
                                                                <div className="h-3.5 w-4/5 rounded bg-slate-200 dark:bg-white/10 animate-pulse" />
                                                            </div>
                                                        </div>
                                                        <div className="aspect-square w-full rounded-xl bg-slate-100/70 dark:bg-white/[0.03] border border-slate-200/50 dark:border-white/5 flex items-center justify-center">
                                                            <slot.icon className="h-8 w-8 text-slate-300 dark:text-slate-700" />
                                                        </div>
                                                    </div>
                                                    <div className="pt-3 mt-2 flex items-center justify-between border-t border-slate-100 dark:border-white/5 text-[11px] font-mono text-slate-400 dark:text-slate-500">
                                                        <span>Selecting component...</span>
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-500" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    ) : !build ? (
                        /* Empty State */
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <Paper
                                radius="md"
                                p={12}
                                withBorder
                                className="py-8 px-3 border-2 border-dashed border-slate-300 dark:border-white/15 rounded-2xl bg-slate-50/60 dark:bg-slate-900/40 text-center"
                            >
                                <div className="flex flex-col items-center justify-center space-y-4 max-w-md mx-auto w-full">
                                    <ThemeIcon size={76} radius="xl" variant="light" color="cyan" className="bg-cyan-500/10 dark:bg-cyan-500/10 border border-cyan-500/20">
                                        <Bot className="h-10 w-10 text-cyan-600 dark:text-cyan-400" />
                                    </ThemeIcon>
                                    <div className="text-center space-y-2">
                                        <Text fw={800} size="xl" className="font-headline tracking-tight text-slate-900 dark:text-slate-100">
                                            Buildbot Idle
                                        </Text>
                                        <Text size="sm" className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                            Enter your budget and requirements on the left to start generating your PC build.
                                        </Text>
                                    </div>
                                </div>
                            </Paper>
                        </motion.div>
                    ) : (
                        /* Complete Build Ready View */
                        <motion.div
                            key="content"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-5"
                        >
                            {/* Top Panel Grid: Price Total & Save Control */}
                            <div className="grid md:grid-cols-2 gap-3">
                                <div className="h-fit self-start bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/10 p-3 rounded-xl backdrop-blur-xl flex items-center gap-3 shadow-sm">
                                    <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 w-16 h-16 flex items-center justify-center select-none shrink-0">
                                        <span className="text-3xl font-black font-sans text-cyan-600 dark:text-cyan-400 leading-none">₱</span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-700 dark:text-cyan-400/80 mb-1">Estimated Build Total</p>
                                        <p className="text-4xl font-black font-headline tracking-tighter text-slate-900 dark:text-white">
                                            ₱{(totalPrice || 0).toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/10 p-3 rounded-xl backdrop-blur-xl flex flex-col justify-between gap-3 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shrink-0">
                                            <Sparkles className="h-5 w-5 text-emerald-500" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-headline font-bold uppercase tracking-wider text-sm text-slate-900 dark:text-white">Build Ready</h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Your component recommendations are ready.</p>
                                        </div>
                                    </div>
                                    {user && (
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "h-10 px-5 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all w-full",
                                                isSaved
                                                    ? "border-rose-500/40 text-rose-500 bg-rose-500/10"
                                                    : "border-rose-500/20 text-rose-500 hover:bg-rose-500/10"
                                            )}
                                            onClick={handleSaveToFavorites}
                                            disabled={isSaving || isSaved}
                                        >
                                            <Heart className={cn("h-3.5 w-3.5 mr-2", isSaved && "fill-rose-500")} />
                                            {isSaving ? "Saving..." : isSaved ? "Saved to Favorites" : "Save to Favorites"}
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Summary Section */}
                            <div className="bg-emerald-500/10 rounded-2xl p-4 border border-emerald-500/20 relative overflow-hidden group">
                                <div className="flex items-center gap-3 mb-4 text-emerald-600 dark:text-emerald-400">
                                    <Sparkles className="h-5 w-5" />
                                    <h4 className="font-headline font-bold uppercase tracking-widest text-sm">Buildbot Summary</h4>
                                </div>
                                <p className="text-base text-foreground/90 leading-relaxed italic pl-4 border-l-2 border-emerald-500/40">
                                    "{build.summary}"
                                </p>
                            </div>

                            {/* Components Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                {COMPONENT_SLOTS.map((slot, index) => {
                                    const compData = (build as any)[slot.key];
                                    return (
                                        <motion.div
                                            key={slot.key}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.3, delay: index * 0.05 }}
                                            className="h-full"
                                        >
                                            <ComponentCard
                                                name={slot.name}
                                                component={compData}
                                                icon={slot.icon}
                                            />
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </Paper>
    );
}
