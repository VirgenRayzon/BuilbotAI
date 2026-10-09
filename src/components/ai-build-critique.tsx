import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SparkleButton } from "./ui/sparkle-button";
import { Badge } from "@/components/ui/badge";
import { Paper, Text, Group, ThemeIcon, Box, Stack } from "@mantine/core";
import { AnimatedIconButton, AnimatedRotateIcon, AnimatedBrainIcon, AnimatedBotIcon } from "./ui/animated-icons";
import { BrainCircuit, ThumbsUp, ThumbsDown, AlertTriangle, MonitorPlay, Zap, Plus, Sparkles, Gamepad2, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { getAiBuildCritique } from "@/app/actions";
import { ComponentData } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from 'react-markdown';
import { useFirestore, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useQuickBuildChecks } from '@/hooks/use-quick-build-checks';
import { QuickReviewChecks } from '@/components/build/quick-review-checks';

const getPerformanceStyle = (fps: string) => {
    const minFps = parseInt(fps.match(/\d+/)?.[0] || "0");
    if (minFps >= 100) return { color: "bg-emerald-500", text: "text-emerald-500", percent: 100, label: "Legendary" };
    if (minFps >= 75) return { color: "bg-green-500", text: "text-green-500", percent: 85, label: "Excellent" };
    if (minFps >= 60) return { color: "bg-green-400", text: "text-green-400", percent: 70, label: "Smooth" };
    if (minFps >= 45) return { color: "bg-yellow-500", text: "text-yellow-500", percent: 50, label: "Playable" };
    if (minFps >= 30) return { color: "bg-orange-500", text: "text-orange-500", percent: 35, label: "Entry" };
    return { color: "bg-red-500", text: "text-red-500", percent: 15, label: "Low" };
};

interface AIBuildCritiqueProps {
    build: Record<string, ComponentData | ComponentData[] | null>;
    externalAnalysis?: any;
    externalDuration?: number | null;
    externalLoading?: boolean;
    externalError?: string | null;
    onRefresh?: () => void;
    onCancel?: () => void;
    intendedUse?: string;
    performanceLevel?: string;
    additionalNotes?: string;
    className?: string;
}

export function AIBuildCritique({
    build,
    externalAnalysis,
    externalDuration,
    externalLoading,
    externalError,
    onRefresh,
    onCancel,
    intendedUse,
    performanceLevel,
    additionalNotes,
    className
}: AIBuildCritiqueProps) {
    const [internalAnalysis, setInternalAnalysis] = useState<any>(null);
    const [internalLoading, setInternalLoading] = useState(false);
    const [internalError, setInternalError] = useState<string | null>(null);

    const firestore = useFirestore();
    const settingsDocRef = useMemo(() => {
        if (firestore) return doc(firestore, 'siteSettings', 'main');
        return null;
    }, [firestore]);
    const { data: settings } = useDoc<any>(settingsDocRef);
    const isAiKillSwitch = settings?.isAiKillSwitch || false;

    const [elapsedTime, setElapsedTime] = useState(0);
    const [finalResponseTime, setFinalResponseTime] = useState<number | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const [telemetryHistory, setTelemetryHistory] = useState<number[]>([]);

    const isControlled = externalAnalysis !== undefined || externalLoading !== undefined || externalError !== undefined;
    const analysis = isControlled ? externalAnalysis : internalAnalysis;
    const loading = isControlled ? externalLoading : internalLoading;
    const error = isControlled ? externalError : internalError;
    const activeDuration = isControlled ? (externalDuration ?? finalResponseTime) : finalResponseTime;
    const quickChecks = useQuickBuildChecks(build, performanceLevel, intendedUse);

    // Load critique telemetry history from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('pc_critique_telemetry_v1');
        if (saved) {
            try {
                setTelemetryHistory(JSON.parse(saved));
            } catch (e) {
                console.error(e);
            }
        }
    }, []);

    // Save critique telemetry to history on completion
    useEffect(() => {
        if (!loading && analysis && activeDuration) {
            const saved = localStorage.getItem('pc_critique_telemetry_v1');
            let list: number[] = [];
            if (saved) {
                try {
                    list = JSON.parse(saved);
                } catch (e) {
                    console.error(e);
                }
            }
            if (list.length === 0 || list[list.length - 1] !== activeDuration) {
                list.push(activeDuration);
                localStorage.setItem('pc_critique_telemetry_v1', JSON.stringify(list));
                setTelemetryHistory(list);
            }
        }
    }, [loading, analysis, activeDuration]);

    // Timer logic (counts up elapsed seconds)
    useEffect(() => {
        let timerInterval: NodeJS.Timeout;

        if (loading) {
            setFinalResponseTime(null);
            setElapsedTime(0);
            startTimeRef.current = Date.now();

            timerInterval = setInterval(() => {
                if (startTimeRef.current) {
                    setElapsedTime((Date.now() - startTimeRef.current) / 1000);
                }
            }, 100);
        } else {
            if (startTimeRef.current) {
                const duration = (Date.now() - startTimeRef.current) / 1000;
                setFinalResponseTime(duration);
                startTimeRef.current = null;
            }
        }
        return () => {
            clearInterval(timerInterval);
        };
    }, [loading]);

    const averageTime = telemetryHistory.length > 0
        ? telemetryHistory.reduce((sum, val) => sum + val, 0) / telemetryHistory.length
        : 0;

    const diff = averageTime > 0 && activeDuration
        ? averageTime - activeDuration
        : 0;

    const comparisonText = diff !== 0
        ? `${Math.abs(diff).toFixed(1)}s ${diff > 0 ? 'faster' : 'slower'} than average`
        : 'On par with average';

    const { toast } = useToast();



    const handleAnalyze = async () => {
        if (isAiKillSwitch) {
            toast({
                title: "AI Disabled",
                description: "AI is disable by Administrator.",
                variant: "destructive"
            });
            return;
        }
        setInternalLoading(true);
        setInternalError(null);

        const buildData: any = {};
        Object.entries(build).forEach(([key, val]) => {
            if (val) {
                if (Array.isArray(val)) {
                    buildData[key] = val.map((v: any) => ({
                        model: v.model,
                        price: v.price,
                        brand: v.brand,
                        description: v.description || "",
                        wattage: v.wattage,
                        socket: v.socket,
                        ramType: v.ramType,
                        performanceScore: v.performanceScore,
                        dimensions: v.dimensions,
                        specifications: v.specifications,
                    }));
                } else {
                    const singleVal = val as any;
                    buildData[key] = {
                        model: singleVal.model,
                        price: singleVal.price,
                        brand: singleVal.brand,
                        description: singleVal.description || "",
                        wattage: singleVal.wattage,
                        socket: singleVal.socket,
                        ramType: singleVal.ramType,
                        performanceScore: singleVal.performanceScore,
                        dimensions: singleVal.dimensions,
                        specifications: singleVal.specifications,
                    };
                }
            }
        });

        try {
            const result = await getAiBuildCritique({
                build: buildData,
                intendedUse: intendedUse,
                performanceLevel: performanceLevel,
                additionalNotes: additionalNotes
            });
            if ('error' in result) {
                setInternalError(result.error as string);
            } else {
                setInternalAnalysis(result);
            }
        } catch (err) {
            setInternalError("An unexpected error occurred during analysis.");
        } finally {
            setInternalLoading(false);
        }
    };

    return (
        <Paper
            radius="lg"
            withBorder
            shadow="xl"
            className={cn("w-full overflow-hidden bg-white/95 dark:bg-[#0d1117]/95 border-slate-200 dark:border-cyan-500/20 backdrop-blur-xl relative shadow-xl dark:shadow-[0_0_35px_rgba(0,0,0,0.5)]", className !== undefined ? className : "mt-6")}
        >
            <Box className="p-5 md:p-6 bg-slate-50/90 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10">
                <Group justify="space-between" align="center">
                    <Group gap="xs" align="center">
                        <ThemeIcon size={32} radius="md" variant="light" color="cyan" className="shadow-sm">
                            <AnimatedBrainIcon className="h-5 w-5 text-cyan-500 dark:text-cyan-400" />
                        </ThemeIcon>
                        <Text fw={900} size="xl" className="font-headline tracking-tight text-slate-900 dark:text-white">
                            Build Overview
                        </Text>
                    </Group>
                    {activeDuration && !loading && (
                        <div className="relative group/tooltip">
                            <span className="cursor-help px-3 py-1 rounded-full border border-cyan-300 dark:border-cyan-400/80 bg-cyan-50/80 dark:bg-gradient-to-r dark:from-cyan-950/70 dark:via-cyan-900/60 dark:to-blue-950/70 text-cyan-800 dark:text-cyan-300 font-mono text-xs font-black uppercase tracking-widest select-none shadow-sm dark:shadow-[0_0_15px_rgba(34,211,238,0.45)] hover:shadow-md hover:scale-105 transition-all duration-300 flex items-center gap-1.5">
                                <span className="text-amber-500 drop-shadow-[0_0_6px_rgba(251,191,36,0.9)]">⚡</span>
                                <span>{activeDuration.toFixed(1)}s Turnaround Time</span>
                            </span>

                            {/* Tooltip Content positioned downwards and leftwards so it stays visible */}
                            <div className="absolute right-0 top-full mt-2 w-64 p-3 rounded-xl border border-slate-200 dark:border-cyan-500/20 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl shadow-2xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-300 pointer-events-none z-50 text-[10px] font-mono text-slate-700 dark:text-zinc-300 space-y-1.5 leading-relaxed">
                                <div className="border-b border-slate-200 dark:border-white/5 pb-1 flex justify-between">
                                    <span className="text-[9px] font-black text-cyan-600 dark:text-cyan-400 uppercase">Review Time</span>
                                    <span className="text-[8px] text-slate-500 dark:text-zinc-500 font-sans">Compare: {comparisonText}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500 dark:text-zinc-500">This review:</span>
                                    <span className="text-slate-800 dark:text-zinc-200">{activeDuration.toFixed(1)}s</span>
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
            <div className="p-5 md:p-6 space-y-6">
                {!analysis && !loading && !error && (
                    <Paper
                        radius="md"
                        p="xl"
                        withBorder
                        className="py-14 px-8 border-2 border-dashed border-slate-300 dark:border-white/15 rounded-2xl bg-slate-50/60 dark:bg-slate-900/40 text-center"
                    >
                        <Stack align="center" justify="center" gap="md" className="w-full">
                            <ThemeIcon size={76} radius="xl" variant="light" color="cyan" className="bg-cyan-500/10 dark:bg-cyan-500/10 border border-cyan-500/20">
                                <AnimatedBotIcon className="h-10 w-10 text-cyan-600 dark:text-cyan-400" size={40} />
                            </ThemeIcon>
                            <div className="text-center space-y-2 max-w-md mx-auto w-full">
                                <Text fw={800} size="xl" className="font-headline tracking-tight text-slate-900 dark:text-slate-100">
                                    Ready to review
                                </Text>
                                <Text size="sm" className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                    Click the &quot;Analyze Build&quot; button to review your PC component selection.
                                </Text>
                            </div>
                            {!isControlled && (
                                <SparkleButton
                                    onClick={handleAnalyze}
                                    icon={<Sparkles className="h-4 w-4" />}
                                    className="mt-2 px-8 text-xs font-black uppercase tracking-widest"
                                >
                                    ANALYZE MY BUILD
                                </SparkleButton>
                            )}
                        </Stack>
                    </Paper>
                )}

                {loading && (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        className="flex flex-col items-center justify-center py-14 space-y-7"
                    >
                        {/* Glowing Radial Elapsed Timer (Counting UP) */}
                        <div className="relative flex items-center justify-center">
                            <div className="absolute inset-0 bg-cyan-500/15 blur-3xl rounded-full animate-pulse pointer-events-none" />

                            <svg className="w-36 h-36 transform -rotate-90 relative z-10">
                                {/* Subtle background ring */}
                                <circle
                                    cx="72"
                                    cy="72"
                                    r="52"
                                    stroke="rgba(34, 211, 238, 0.08)"
                                    strokeWidth="4"
                                    fill="transparent"
                                />
                                {/* Smooth rotating active ring */}
                                <motion.circle
                                    cx="72"
                                    cy="72"
                                    r="52"
                                    stroke="#22D3EE"
                                    strokeWidth="4"
                                    strokeDasharray="80 180"
                                    strokeLinecap="round"
                                    fill="transparent"
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
                                    style={{
                                        transformOrigin: "72px 72px",
                                        filter: "drop-shadow(0px 0px 10px rgba(34, 211, 238, 0.55))"
                                    }}
                                />
                            </svg>

                            {/* Center Elapsed Counter */}
                            <div className="absolute z-20 flex flex-col items-center justify-center text-center font-mono">
                                <span className="text-[22px] font-black text-cyan-400 tracking-tight leading-none">
                                    {(() => {
                                        const mins = Math.floor(elapsedTime / 60);
                                        const secs = Math.floor(elapsedTime % 60);
                                        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}s`;
                                    })()}
                                </span>
                                <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold mt-2 flex items-center gap-1.5">
                                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping inline-block" />
                                    ANALYZING
                                </span>
                            </div>
                        </div>

                        <QuickReviewChecks checks={quickChecks} />

                        {/* Stop Diagnostics Button */}
                        {onCancel && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                            >
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onCancel}
                                    className="h-9 px-6 rounded-full border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all font-bold uppercase tracking-widest text-[10px] shadow-sm hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                                >
                                    <Zap className="h-3.5 w-3.5 mr-2 fill-current" />
                                    Stop analysis
                                </Button>
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {error && (
                    <div className="bg-destructive/10 text-destructive p-4 rounded-md">
                        <p className="font-semibold flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Analysis Failed</p>
                        <p className="text-sm mt-1">{error}</p>
                        <SparkleButton onClick={isControlled && onRefresh ? onRefresh : handleAnalyze} className="mt-3">Try Again</SparkleButton>
                    </div>
                )}

                {analysis && !loading && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                        {/* Strengths and Opportunities */}
                        <div className="space-y-4">
                            <div className="bg-emerald-500/10 rounded-lg p-5 border border-emerald-500/20">
                                <h4 className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 mb-3">
                                    <ThumbsUp className="h-5 w-5" /> Strengths
                                </h4>
                                <ul className="space-y-2 text-sm">
                                    {(analysis.pros || analysis.prosCons?.pros || []).map((pro: string, idx: number) => (
                                        <li key={idx} className="flex gap-2"><span className="text-emerald-500">•</span> {pro}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="bg-blue-500/10 rounded-lg p-5 border border-blue-500/20">
                                <h4 className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-2 mb-3">
                                    <Sparkles className="h-5 w-5" /> Optimization Opportunities
                                </h4>
                                <ul className="space-y-2 text-sm">
                                    {(analysis.cons || analysis.prosCons?.cons || []).map((con: string, idx: number) => (
                                        <li key={idx} className="flex gap-2"><span className="text-blue-500">•</span> {con}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Bottleneck Analysis */}
                        <div className="space-y-3">
                            <h4 className="font-semibold flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-yellow-500" /> Bottleneck Analysis
                            </h4>
                            <div className="text-sm text-muted-foreground leading-relaxed bg-muted/30 p-4 rounded-lg border prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown>{analysis.bottleneck?.analysis || analysis.bottleneckAnalysis || ""}</ReactMarkdown>
                            </div>
                        </div>

                        {/* FPS Estimates */}
                        <div className="space-y-3">
                            <h4 className="font-semibold flex items-center gap-2">
                                <MonitorPlay className="h-5 w-5 text-primary" /> Estimated Performance
                            </h4>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                {analysis.fpsEstimates && Array.isArray(analysis.fpsEstimates) && analysis.fpsEstimates.map((est: any, idx: number) => {
                                    if (!est.fps) return null; // Skip old format
                                    const perf = getPerformanceStyle(est.fps);
                                    return (
                                        <div key={idx} className="bg-card border rounded-xl overflow-hidden flex flex-col hover:border-primary/30 transition-all shadow-sm">
                                            <div className="bg-muted/30 px-4 py-2 border-b flex items-center justify-between">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-foreground/80">{est.game}</p>
                                                <Gamepad2 className="h-3 w-3 text-muted-foreground opacity-50" />
                                            </div>
                                            <div className="p-4 space-y-3 flex-1 flex flex-col">
                                                <div className="flex items-center justify-between">
                                                    <Badge variant="secondary" className="text-[9px] font-bold px-1.5 py-0 h-4 border-primary/10">{est.settings}</Badge>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-xl font-black font-headline text-foreground">{est.fps}</span>
                                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">FPS</span>
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${perf.percent}%` }}
                                                            transition={{ duration: 1, ease: "easeOut", delay: 0.1 * idx }}
                                                            className={`h-full ${perf.color}`}
                                                        />
                                                    </div>
                                                    <div className="flex justify-between items-center opacity-80">
                                                        <span className={`text-[9px] font-bold uppercase tracking-tighter ${perf.text}`}>{perf.label}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Suggestions */}
                        {analysis.suggestions && analysis.suggestions.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="font-semibold flex items-center gap-2">
                                    <Zap className="h-5 w-5 text-orange-500" /> Buildbot Suggestions
                                </h4>
                                <div className="space-y-2">
                                    {analysis.suggestions.map((sug: any, idx: number) => (
                                        <div
                                            key={idx}
                                            className="bg-card border rounded-xl p-4 shadow-sm hover:border-primary/20 transition-all group flex flex-col gap-3 relative"
                                        >
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <span className="line-through text-muted-foreground text-xs">{sug.originalComponent}</span>
                                                <span className="text-primary font-black text-xs">→</span>
                                                <span className="font-bold text-primary">{sug.suggestedComponent}</span>
                                            </div>
                                            <p className="text-muted-foreground text-xs leading-relaxed">{sug.reason}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="pt-4 pb-2">
                            <AnimatedIconButton
                                icon={<AnimatedRotateIcon className="h-4 w-4" />}
                                className="w-full h-11"
                                onClick={isControlled && onRefresh ? onRefresh : handleAnalyze}
                                disabled={loading}
                                isLoading={loading}
                            >
                                Refresh Analysis
                            </AnimatedIconButton>
                        </div>
                    </div>
                )}
            </div>
        </Paper>
    );
}
