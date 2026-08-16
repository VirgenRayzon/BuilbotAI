import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SparkleButton } from "./ui/sparkle-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedIconButton, AnimatedRotateIcon, AnimatedBrainIcon, AnimatedBotIcon } from "./ui/animated-icons";
import { BrainCircuit, ThumbsUp, ThumbsDown, AlertTriangle, MonitorPlay, Zap, Plus, Sparkles, Gamepad2, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { getAiBuildCritique } from "@/app/actions";
import { ComponentData } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from 'react-markdown';
import { useFirestore, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";
import { cn } from "@/lib/utils";

const getPerformanceStyle = (fps: string) => {
    const minFps = parseInt(fps.match(/\d+/)?.[0] || "0");
    if (minFps >= 100) return { color: "bg-emerald-500", text: "text-emerald-500", percent: 100, label: "Legendary" };
    if (minFps >= 75) return { color: "bg-green-500", text: "text-green-500", percent: 85, label: "Excellent" };
    if (minFps >= 60) return { color: "bg-green-400", text: "text-green-400", percent: 70, label: "Smooth" };
    if (minFps >= 45) return { color: "bg-yellow-500", text: "text-yellow-500", percent: 50, label: "Playable" };
    if (minFps >= 30) return { color: "bg-orange-500", text: "text-orange-500", percent: 35, label: "Entry" };
    return { color: "bg-red-500", text: "text-red-500", percent: 15, label: "Low" };
};

const LOADING_STEPS = [
    { title: "Reviewing Components", sub: "Checking build compatibility..." },
    { title: "Performing Analysis", sub: "Identifying potential bottlenecks..." },
    { title: "Grounding Knowledge", sub: "Searching for real-world benchmarks..." },
    { title: "Evaluating Value", sub: "Analyzing performance-to-value ratio..." },
    { title: "Finalizing Critique", sub: "Generating expert suggestions..." }
];

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
    const [loadingStep, setLoadingStep] = useState(0);

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

    // Dynamic loading message and timer logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        let timerInterval: NodeJS.Timeout;

        if (loading) {
            setFinalResponseTime(null);
            setElapsedTime(0);
            startTimeRef.current = Date.now();

            // Steps interval
            interval = setInterval(() => {
                setLoadingStep((prev) => (prev + 1) % LOADING_STEPS.length);
            }, 2500);

            // Timer interval (updates elapsed time state)
            timerInterval = setInterval(() => {
                if (startTimeRef.current) {
                    setElapsedTime((Date.now() - startTimeRef.current) / 1000);
                }
            }, 100);
        } else {
            setLoadingStep(0);
            if (startTimeRef.current) {
                const duration = (Date.now() - startTimeRef.current) / 1000;
                setFinalResponseTime(duration);
                startTimeRef.current = null;
            }
        }
        return () => {
            clearInterval(interval);
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
        <Card className={cn("w-full bg-gradient-to-br from-card to-secondary/10 border-primary/20 relative overflow-hidden", className !== undefined ? className : "mt-6")}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-500 to-primary animate-pulse z-20"></div>
            <CardHeader>
                <CardTitle className="flex items-center justify-between font-headline text-2xl">
                    <div className="flex items-center gap-2">
                        <AnimatedBrainIcon className="h-6 w-6 text-primary" />
                        Buildbot Build Review
                    </div>
                    {activeDuration && !loading && (
                        <div className="relative group/tooltip">
                            <span className="cursor-help px-3 py-1 rounded-full border border-cyan-400/80 bg-gradient-to-r from-cyan-950/70 via-cyan-900/60 to-blue-950/70 text-cyan-300 font-mono text-xs font-black uppercase tracking-widest select-none shadow-[0_0_15px_rgba(34,211,238,0.45)] hover:shadow-[0_0_25px_rgba(34,211,238,0.65)] hover:scale-105 transition-all duration-300 flex items-center gap-1.5">
                                <span className="text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.9)]">⚡</span>
                                <span>{activeDuration.toFixed(1)}s Turnaround Time</span>
                            </span>

                            {/* Tooltip Content positioned downwards and leftwards so it stays visible */}
                            <div className="absolute right-0 top-full mt-2 w-64 p-3 rounded-xl border border-cyan-500/20 bg-slate-950/95 backdrop-blur-xl shadow-2xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-300 pointer-events-none z-50 text-[10px] font-mono text-zinc-300 space-y-1.5 leading-relaxed">
                                <div className="border-b border-white/5 pb-1 flex justify-between">
                                    <span className="text-[9px] font-black text-cyan-400 uppercase">Telemetry Analysis</span>
                                    <span className="text-[8px] text-zinc-500 font-sans">Compare: {comparisonText}</span>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500">LLM Diagnostics:</span>
                                        <span className="text-zinc-200">{(activeDuration * 0.65).toFixed(1)}s</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500">Compatibility Checks:</span>
                                        <span className="text-zinc-200">{(activeDuration * 0.20).toFixed(1)}s</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500">Knowledge Grounding:</span>
                                        <span className="text-zinc-200">{(activeDuration * 0.15).toFixed(1)}s</span>
                                    </div>
                                    <div className="flex justify-between border-t border-white/5 pt-1.5 mt-1">
                                        <span className="text-zinc-500">Tokens Used:</span>
                                        <span className="text-cyan-400 font-bold">{Math.round(JSON.stringify(analysis).length / 4)}</span>
                                    </div>
                                </div>
                                <div className="pt-1.5 border-t border-white/5 flex justify-between text-[9px] font-sans">
                                    <span className="text-zinc-400">Average: {averageTime > 0 ? `${averageTime.toFixed(1)}s` : 'Calculating...'}</span>
                                    <span className={diff >= 0 ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                                        {diff >= 0 ? "Optimal Speed" : "Nominal Speed"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {!analysis && !loading && !error && (
                    <div className="flex flex-col items-center justify-center py-16 px-8 border-2 border-dashed border-muted-foreground/20 rounded-xl bg-muted/10 space-y-6">
                        <AnimatedBotIcon className="h-20 w-20 text-muted-foreground/30" size={80} />
                        <div className="text-center space-y-3">
                            <h3 className="text-2xl font-headline font-semibold tracking-tight">Buildbot Idle...</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto text-lg leading-relaxed">
                                Use the Build Advisor to review your PC component selection.
                            </p>
                        </div>
                        {!isControlled && (
                            <SparkleButton
                                onClick={handleAnalyze}
                                icon={<Sparkles className="h-4 w-4" />}
                                className="mt-6 px-10 text-xs font-black uppercase tracking-widest"
                            >
                                ANALYZE MY BUILD
                            </SparkleButton>
                        )}
                    </div>
                )}

                {loading && (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-8 space-y-8"
                    >
                        {/* Glowing Radial ETA Progress Ring */}
                        {(() => {
                            const targetSeconds = 8;
                            const elapsed = elapsedTime || 0;
                            let remaining = targetSeconds - elapsed;
                            let percent = (remaining / targetSeconds) * 100;

                            if (elapsed >= targetSeconds) {
                                const overshoot = elapsed - targetSeconds;
                                percent = Math.max(1, 4 / (1 + overshoot * 0.1));
                                remaining = 0.5 / (1 + overshoot * 0.1);
                            }

                            const radius = 45;
                            const strokeWidth = 4;
                            const circumference = 2 * Math.PI * radius;
                            const strokeDashoffset = circumference - (percent / 100) * circumference;
                            const pctDisplay = Math.round(100 - percent);
                            const remainingText = elapsed >= targetSeconds
                                ? `+${(Math.floor(elapsed - targetSeconds) + 1).toString().padStart(2, '0')}s`
                                : `00:${Math.ceil(remaining).toString().padStart(2, '0')}s`;

                            return (
                                <div className="relative flex items-center justify-center">
                                    <div className="absolute inset-0 bg-cyan-500/15 blur-3xl rounded-full animate-pulse pointer-events-none" />

                                    <svg className="w-32 h-32 transform -rotate-90 relative z-10">
                                        {/* Background ring */}
                                        <circle
                                            cx="64"
                                            cy="64"
                                            r={radius}
                                            stroke="rgba(34, 211, 238, 0.05)"
                                            strokeWidth={strokeWidth}
                                            fill="transparent"
                                        />
                                        {/* Progress ring */}
                                        <motion.circle
                                            cx="64"
                                            cy="64"
                                            r={radius}
                                            stroke="#22D3EE"
                                            strokeWidth={strokeWidth}
                                            strokeDasharray={circumference}
                                            strokeDashoffset={strokeDashoffset}
                                            strokeLinecap="round"
                                            fill="transparent"
                                            className="transition-all duration-300 ease-out"
                                            style={{
                                                filter: "drop-shadow(0px 0px 8px rgba(34, 211, 238, 0.5))"
                                            }}
                                        />
                                    </svg>

                                    {/* Center Text */}
                                    <div className="absolute z-20 flex flex-col items-center justify-center text-center font-mono">
                                        <span className="text-[20px] font-black text-cyan-400 tracking-tighter leading-none">
                                            {remainingText}
                                        </span>
                                        <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-bold mt-1">
                                            {pctDisplay}% EST
                                        </span>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Stage Checklist Grid */}
                        <div className="grid md:grid-cols-2 gap-4 w-full max-w-lg mx-auto">
                            {LOADING_STEPS.map((step, idx) => {
                                const stepTime = 1.6;
                                const start = idx * stepTime;
                                const elapsed = elapsedTime || 0;
                                const status = elapsed < start
                                    ? "pending"
                                    : (elapsed >= start && (elapsed < start + stepTime || idx === LOADING_STEPS.length - 1))
                                        ? "active"
                                        : "completed";

                                return (
                                    <div
                                        key={idx}
                                        className={cn(
                                            "p-4 rounded-xl border flex items-start gap-3 backdrop-blur-md transition-all duration-500",
                                            status === "completed"
                                                ? "bg-cyan-500/5 border-cyan-500/20 text-cyan-100"
                                                : status === "active"
                                                    ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-100 shadow-[0_0_15px_rgba(34,211,238,0.1)]"
                                                    : "bg-zinc-900/10 border-zinc-800 text-zinc-500"
                                        )}
                                    >
                                        <div className="shrink-0 mt-0.5">
                                            {status === "completed" ? (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                                >
                                                    <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                                                </motion.div>
                                            ) : status === "active" ? (
                                                <div className="relative">
                                                    <span className="absolute inset-0 rounded-full bg-cyan-400/50 blur-sm animate-ping"></span>
                                                    <Loader2 className="h-4 w-4 text-cyan-400 animate-spin relative z-10" />
                                                </div>
                                            ) : (
                                                <Circle className="h-4 w-4 text-zinc-700" />
                                            )}
                                        </div>
                                        <div className="text-left">
                                            <h5 className={cn(
                                                "font-headline text-[11px] font-black uppercase tracking-wider",
                                                status === "completed" ? "text-cyan-400" : status === "active" ? "text-cyan-400" : "text-zinc-500"
                                            )}>
                                                {step.title}
                                            </h5>
                                            <p className="text-[10px] text-zinc-400 font-medium leading-tight">
                                                {step.sub}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {onCancel && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onCancel}
                                    className="h-9 px-6 rounded-full border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all font-bold uppercase tracking-widest text-[10px]"
                                >
                                    <Zap className="h-3 w-3 mr-2 fill-current" />
                                    Stop Diagnostics
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
            </CardContent>
        </Card>
    );
}
