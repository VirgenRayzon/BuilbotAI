import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BrainCircuit, Loader2, ThumbsUp, ThumbsDown, AlertTriangle, MonitorPlay, Zap, Bot, Plus, Sparkles, Gamepad2 } from "lucide-react";
import { getAiBuildCritique } from "@/app/actions";
import { ComponentData } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from 'react-markdown';

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
    externalLoading?: boolean;
    externalError?: string | null;
    onRefresh?: () => void;
}

export function AIBuildCritique({ build, externalAnalysis, externalLoading, externalError, onRefresh }: AIBuildCritiqueProps) {
    const [internalAnalysis, setInternalAnalysis] = useState<any>(null);
    const [internalLoading, setInternalLoading] = useState(false);
    const [internalError, setInternalError] = useState<string | null>(null);
    const [loadingStep, setLoadingStep] = useState(0);

    // Dynamic loading message logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (internalLoading || externalLoading) {
            interval = setInterval(() => {
                setLoadingStep((prev) => (prev + 1) % LOADING_STEPS.length);
            }, 3000);
        } else {
            setLoadingStep(0);
        }
        return () => clearInterval(interval);
    }, [internalLoading, externalLoading]);

    const isControlled = externalAnalysis !== undefined || externalLoading !== undefined || externalError !== undefined;
    const analysis = isControlled ? externalAnalysis : internalAnalysis;
    const loading = isControlled ? externalLoading : internalLoading;
    const error = isControlled ? externalError : internalError;

    const { toast } = useToast();

    const handleApplySuggestion = (modelName: string, partId?: string) => {
        const parentWindow = window as any;
        if (parentWindow.__BOT_ADD_PART__) {
            parentWindow.__BOT_ADD_PART__(modelName, partId);
            toast({
                title: "Finding part...",
                description: `Searching for ${modelName} in inventory.`,
            });
        } else {
            const event = new CustomEvent('add-suggestion', { 
                detail: { 
                    model: modelName,
                    id: partId
                } 
            });
            window.dispatchEvent(event);
            toast({
                title: "Applying Suggestion",
                description: `Adding ${modelName} to your build...`,
            });
        }
    };

    const handleAnalyze = async () => {
        setInternalLoading(true);
        setInternalError(null);

        const inputData: any = {};
        Object.entries(build).forEach(([key, val]) => {
            if (val) {
                if (Array.isArray(val)) {
                    inputData[key] = val.map((v: any) => ({
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
                    inputData[key] = {
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
            const result = await getAiBuildCritique(inputData);
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
        <Card className="w-full mt-6 bg-gradient-to-br from-card to-secondary/10 border-primary/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-500 to-primary animate-pulse z-20"></div>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                    <BrainCircuit className="h-6 w-6 text-primary" />
                    Buildbot Build Critique
                </CardTitle>
                <CardDescription>
                    Get an expert AI analysis of your current parts selection.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {!analysis && !loading && !error && (
                    <div className="flex flex-col items-center justify-center py-16 px-8 border-2 border-dashed border-muted-foreground/20 rounded-xl bg-muted/10 space-y-6">
                        <Bot className="h-20 w-20 text-muted-foreground/30" />
                        <div className="text-center space-y-3">
                            <h3 className="text-2xl font-headline font-semibold tracking-tight">Your build awaits</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto text-lg leading-relaxed">
                                Use the Buildbot Advisor to generate your personalized PC component list, or start adding parts to your build.
                            </p>
                        </div>
                        {!isControlled && (
                            <Button onClick={handleAnalyze} size="lg" className="mt-6 font-headline tracking-widest uppercase text-xs h-12 px-10">
                                Analyze My Build
                            </Button>
                        )}
                    </div>
                )}

                {loading && (
                    <div className="flex flex-col items-center justify-center py-10 space-y-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                            <Loader2 className="h-12 w-12 animate-spin text-primary relative z-10" />
                        </div>
                        <div className="text-center h-12 flex flex-col items-center justify-center overflow-hidden">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={loadingStep}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-1"
                                >
                                    <p className="text-sm font-black font-headline text-primary uppercase tracking-[0.2em]">
                                        {LOADING_STEPS[loadingStep].title}…
                                    </p>
                                    <p className="text-[11px] text-muted-foreground font-medium tracking-wide">
                                        {LOADING_STEPS[loadingStep].sub}
                                    </p>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="bg-destructive/10 text-destructive p-4 rounded-md">
                        <p className="font-semibold flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Analysis Failed</p>
                        <p className="text-sm mt-1">{error}</p>
                        <Button variant="outline" size="sm" onClick={handleAnalyze} className="mt-3">Try Again</Button>
                    </div>
                )}

                {analysis && !loading && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                        {/* Pros and Cons */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
                                <h4 className="font-semibold text-green-600 dark:text-green-400 flex items-center gap-2 mb-3">
                                    <ThumbsUp className="h-5 w-5" /> Pros
                                </h4>
                                <ul className="space-y-2 text-sm">
                                    {(analysis.pros || analysis.prosCons?.pros || []).map((pro: string, idx: number) => (
                                        <li key={idx} className="flex gap-2"><span className="text-green-500">•</span> {pro}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
                                <h4 className="font-semibold text-red-600 dark:text-red-400 flex items-center gap-2 mb-3">
                                    <ThumbsDown className="h-5 w-5" /> Optimization Opportunities
                                </h4>
                                <ul className="space-y-2 text-sm">
                                    {(analysis.cons || analysis.prosCons?.cons || []).map((con: string, idx: number) => (
                                        <li key={idx} className="flex gap-2"><span className="text-red-500">•</span> {con}</li>
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
                                            className="bg-card border rounded-xl p-4 shadow-sm hover:border-primary/50 transition-all group flex flex-col gap-3 relative cursor-pointer active:scale-[0.98]"
                                            onClick={() => handleApplySuggestion(sug.suggestedComponent, sug.suggestedPartId)}
                                        >
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <span className="line-through text-muted-foreground text-xs">{sug.originalComponent}</span>
                                                <span className="text-primary font-black text-xs">→</span>
                                                <span className="font-bold text-primary group-hover:underline">{sug.suggestedComponent}</span>
                                            </div>
                                            <p className="text-muted-foreground text-xs leading-relaxed pr-8">{sug.reason}</p>
                                            <div className="absolute top-4 right-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Plus className="h-4 w-4" />
                                            </div>
                                            <div className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mt-1 opacity-100 flex items-center gap-1">
                                                <Sparkles className="h-3 w-3" /> Quick Add
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="pt-4 pb-2">
                            <Button variant="outline" className="w-full" onClick={isControlled && onRefresh ? onRefresh : handleAnalyze} disabled={loading}>
                                Refresh Analysis
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
