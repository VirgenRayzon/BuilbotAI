import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BrainCircuit, Loader2, ThumbsUp, ThumbsDown, AlertTriangle, MonitorPlay, Zap, Bot, Plus, Sparkles } from "lucide-react";
import { getAiBuildCritique } from "@/app/actions";
import { ComponentData } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

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

    const isControlled = externalAnalysis !== undefined || externalLoading !== undefined || externalError !== undefined;
    const analysis = isControlled ? externalAnalysis : internalAnalysis;
    const loading = isControlled ? externalLoading : internalLoading;
    const error = isControlled ? externalError : internalError;

    const { toast } = useToast();

    const handleApplySuggestion = (modelName: string) => {
        const parentWindow = window as any;
        if (parentWindow.__BOT_ADD_PART__) {
            parentWindow.__BOT_ADD_PART__(modelName);
            toast({
                title: "Finding part...",
                description: `Searching for ${modelName} in inventory.`,
            });
        } else {
            const event = new CustomEvent('add-suggestion', { detail: { model: modelName } });
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
        <Card className="w-full mt-6 bg-gradient-to-br from-card to-secondary/10 border-primary/20">
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
                    <div className="flex flex-col items-center justify-center py-10 space-y-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <div className="text-center space-y-1">
                            <p className="text-sm font-semibold text-primary animate-pulse">Buildbot is Reviewing Your Components…</p>
                            <p className="text-xs text-muted-foreground">Analyzing compatibility, performance, and value.</p>
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
                                    {analysis.prosCons.pros.map((pro: string, idx: number) => (
                                        <li key={idx} className="flex gap-2"><span className="text-green-500">•</span> {pro}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
                                <h4 className="font-semibold text-red-600 dark:text-red-400 flex items-center gap-2 mb-3">
                                    <ThumbsDown className="h-5 w-5" /> Cons
                                </h4>
                                <ul className="space-y-2 text-sm">
                                    {analysis.prosCons.cons.map((con: string, idx: number) => (
                                        <li key={idx} className="flex gap-2"><span className="text-red-500">•</span> {con}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Bottleneck Analysis */}
                        <div className="bg-secondary/20 rounded-lg p-4">
                            <h4 className="font-semibold flex items-center gap-2 mb-2">
                                <AlertTriangle className="h-5 w-5 text-yellow-500" /> Bottleneck Analysis
                            </h4>
                            <p className="text-sm text-muted-foreground">{analysis.bottleneckAnalysis}</p>
                        </div>

                        {/* FPS Estimates */}
                        <div className="space-y-3">
                            <h4 className="font-semibold flex items-center gap-2">
                                <MonitorPlay className="h-5 w-5 text-primary" /> Estimated Performance
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {analysis.fpsEstimates.map((est: any, idx: number) => (
                                    <div key={idx} className="bg-card border rounded-md p-3 text-center">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider">{est.game}</p>
                                        <p className="text-2xl font-headline font-bold text-primary my-1">{est.estimatedFps}</p>
                                        <Badge variant="secondary" className="text-xs">{est.resolution}</Badge>
                                    </div>
                                ))}
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
                                            onClick={() => handleApplySuggestion(sug.suggestedComponent)}
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
