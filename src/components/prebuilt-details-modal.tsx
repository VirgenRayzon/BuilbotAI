"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency } from "@/lib/utils";
import type { PrebuiltSystem, Part } from "@/lib/types";
import { getMissingParts } from "@/lib/prebuilt-utils";
import { BrainCircuit, ShoppingCart, Loader2, AlertCircle, ThumbsUp, ThumbsDown, MonitorPlay, Zap, ExternalLink, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAiBuildCritique } from "@/app/actions";
import { doc, getDoc } from "firebase/firestore";
import { useFirestore } from "@/firebase";

interface PrebuiltDetailsModalProps {
    system: PrebuiltSystem;
    children: React.ReactNode;
}

export function PrebuiltDetailsModal({ system, children }: PrebuiltDetailsModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [components, setComponents] = useState<Record<string, Part | null>>({});
    const [loadingParts, setLoadingParts] = useState(false);

    const [analysis, setAnalysis] = useState<any>(null);
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);

    const { toast } = useToast();
    const firestore = useFirestore();

    const missingParts = getMissingParts(system);
    const isComplete = missingParts.length === 0;

    useEffect(() => {
        if (isOpen && firestore && Object.keys(components).length === 0) {
            const fetchComponents = async () => {
                setLoadingParts(true);
                const partsRecord: Record<string, Part | null> = {};

                try {
                    const promises = Object.entries(system.components).map(async ([category, id]) => {
                        if (!id) {
                            partsRecord[category] = null;
                            return;
                        }

                        const collectionName = category.charAt(0).toUpperCase() + category.slice(1);
                        const partRef = doc(firestore, collectionName, id as string);
                        const snap = await getDoc(partRef);

                        if (snap.exists()) {
                            partsRecord[category] = { id: snap.id, ...snap.data() } as Part;
                        } else {
                            partsRecord[category] = null;
                        }
                    });

                    await Promise.all(promises);
                    setComponents(partsRecord);
                } catch (error) {
                    console.error("Error fetching parts:", error);
                    toast({
                        title: "Error loading build details",
                        description: "Could not fetch some component details. Please try again.",
                        variant: "destructive"
                    });
                } finally {
                    setLoadingParts(false);
                }
            };

            fetchComponents();
        }
    }, [isOpen, firestore, system.components, components, toast]);

    const handleAddToCart = () => {
        if (!isComplete) return;
        toast({
            title: 'Added to Cart',
            description: `${system.name} has been added to your cart.`,
        });
        setIsOpen(false);
    };

    const handleAnalyze = async () => {
        setLoadingAnalysis(true);
        setAnalysisError(null);

        const inputData: any = {};
        Object.entries(components).forEach(([key, val]) => {
            if (val) {
                inputData[key.charAt(0).toUpperCase() + key.slice(1)] = {
                    model: val.name,
                    price: val.price,
                    brand: val.brand
                };
            }
        });

        try {
            const result = await getAiBuildCritique(inputData);
            if ('error' in result) {
                setAnalysisError(result.error as string);
            } else {
                setAnalysis(result);
            }
        } catch (err) {
            setAnalysisError("An unexpected error occurred during analysis.");
        } finally {
            setLoadingAnalysis(false);
        }
    };


    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden gap-0 bg-background/95 backdrop-blur-xl border-primary/20 shadow-2xl">
                {/* Header Section */}
                <div className="flex-none bg-muted/40 p-6 border-b flex flex-col sm:flex-row gap-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
                    <div className="relative w-full sm:w-1/3 aspect-video shrink-0 rounded-lg overflow-hidden border shadow-sm group">
                        <Image
                            src={system.imageUrl}
                            alt={system.name}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1 relative z-10">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Badge variant="secondary" className="px-2.5 py-0.5 font-bold tracking-wide uppercase text-xs text-primary/80 bg-primary/10 border-primary/20">
                                    {system.tier}
                                </Badge>
                                {isComplete && (
                                    <Badge variant="outline" className="text-emerald-500 border-emerald-200/50 bg-emerald-500/10">
                                        <ShieldCheck className="h-3 w-3 mr-1" /> Ready to Build
                                    </Badge>
                                )}
                            </div>
                            <DialogTitle className="text-3xl font-headline font-bold leading-tight mb-2 tracking-tight">
                                {system.name}
                            </DialogTitle>
                            <DialogDescription className="text-base text-muted-foreground/90 max-w-2xl leading-relaxed">
                                {system.description}
                            </DialogDescription>
                        </div>

                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
                            <div>
                                <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-1">Total System Cost</p>
                                <p className="text-3xl font-bold font-headline text-primary">{formatCurrency(system.price)}</p>
                            </div>
                            <div>
                                <Button
                                    size="lg"
                                    className="font-headline tracking-wide h-12 px-8 shadow-md"
                                    disabled={!isComplete}
                                    onClick={handleAddToCart}
                                >
                                    <ShoppingCart className="mr-2 h-5 w-5" /> Buy this Rig
                                </Button>
                                {!isComplete && (
                                    <p className="text-xs text-destructive text-right mt-2 flex items-center justify-end gap-1 font-medium">
                                        <AlertCircle className="h-3 w-3" /> Missing {missingParts.length} Parts
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 overflow-hidden flex flex-col min-h-0 container">
                    <Tabs defaultValue="specs" className="flex-1 flex flex-col h-full w-full">
                        <div className="border-b px-6 flex-none bg-background/50 backdrop-blur-sm sticky top-0 z-10">
                            <TabsList className="bg-transparent border-b-0 h-14 w-full justify-start gap-8 rounded-none p-0">
                                <TabsTrigger
                                    value="specs"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary h-full px-2 font-headline text-base"
                                >
                                    System Specifications
                                </TabsTrigger>
                                <TabsTrigger
                                    value="performance"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary h-full px-2 flex items-center gap-2 font-headline text-base"
                                >
                                    <BrainCircuit className="h-4 w-4" /> AI Performance Report
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-hidden relative">
                            {/* SPECS TAB */}
                            <TabsContent value="specs" className="h-full m-0 border-none outline-none">
                                <ScrollArea className="h-full">
                                    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-8 pb-12">
                                        {loadingParts ? (
                                            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                                <p className="text-muted-foreground animate-pulse">Loading component details...</p>
                                            </div>
                                        ) : (
                                            <div className="grid gap-6">
                                                {Object.entries(components).map(([category, part]) => (
                                                    <div key={category} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border bg-card hover:border-primary/30 transition-colors shadow-sm">
                                                        <div className="w-full sm:w-32 text-sm font-bold text-muted-foreground uppercase tracking-wider">
                                                            {category}
                                                        </div>
                                                        <div className="flex-1">
                                                            {part ? (
                                                                <div className="flex items-center justify-between gap-4">
                                                                    <div>
                                                                        <p className="font-semibold text-lg leading-tight">{part.name}</p>
                                                                        <p className="text-sm text-muted-foreground max-w-md line-clamp-1">{part.brand}</p>
                                                                    </div>
                                                                    <div className="text-right shrink-0 hidden sm:block">
                                                                        <p className="font-medium">{formatCurrency(part.price)}</p>
                                                                        {part.stock > 0 ? (
                                                                            <p className="text-xs text-emerald-500 font-medium">In Stock</p>
                                                                        ) : (
                                                                            <p className="text-xs text-destructive font-medium">Out of Stock</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-2 text-warning/80 italic text-sm py-2">
                                                                    <AlertCircle className="h-4 w-4" /> Part missing from build
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </TabsContent>

                            {/* PERFORMANCE TAB */}
                            <TabsContent value="performance" className="h-full m-0 border-none outline-none">
                                <ScrollArea className="h-full">
                                    <div className="p-6 lg:p-8 max-w-5xl mx-auto pb-12">

                                        {!analysis && !loadingAnalysis && !analysisError && (
                                            <div className="flex flex-col items-center justify-center py-24 text-center max-w-md mx-auto relative">
                                                <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full w-64 h-64 -z-10 m-auto" />
                                                <BrainCircuit className="h-20 w-20 text-primary/80 mb-6" />
                                                <h3 className="text-2xl font-headline font-bold mb-3">AI Build Critique</h3>
                                                <p className="text-muted-foreground mb-8">
                                                    Run our advanced AI analysis on this specific configuration to get personalized performance estimations, pros, cons, and bottleneck detection.
                                                </p>
                                                <Button size="lg" onClick={handleAnalyze} className="font-headline px-8 w-full sm:w-auto h-12 shadow-lg hover:shadow-primary/25 transition-all">
                                                    Run Analysis for {system.name}
                                                </Button>
                                            </div>
                                        )}

                                        {loadingAnalysis && (
                                            <div className="flex flex-col items-center justify-center py-32 space-y-6">
                                                <div className="relative">
                                                    <div className="absolute inset-0 bg-primary/20 animate-ping rounded-full" />
                                                    <BrainCircuit className="h-16 w-16 text-primary relative z-10 animate-pulse" />
                                                </div>
                                                <p className="text-lg font-medium animate-pulse text-muted-foreground">Running complex diagnostics...</p>
                                            </div>
                                        )}

                                        {analysisError && (
                                            <div className="bg-destructive/5 border border-destructive/20 text-destructive p-8 rounded-xl max-w-lg mx-auto mt-20 text-center shadow-inner">
                                                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-80" />
                                                <h3 className="text-xl font-bold mb-2">Analysis Failed</h3>
                                                <p className="mb-6 opacity-90">{analysisError}</p>
                                                <Button variant="outline" onClick={handleAnalyze}>Try Again</Button>
                                            </div>
                                        )}

                                        {analysis && !loadingAnalysis && (
                                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                                                {/* Pros and Cons */}
                                                <div className="grid md:grid-cols-2 gap-6">
                                                    <div className="bg-green-500/5 rounded-2xl p-6 lg:p-8 border border-green-500/10 shadow-sm relative overflow-hidden">
                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                                                        <h4 className="font-bold font-headline text-green-600 dark:text-green-400 flex items-center gap-3 mb-6 text-xl">
                                                            <div className="bg-green-500/10 p-2 rounded-lg">
                                                                <ThumbsUp className="h-6 w-6" />
                                                            </div>
                                                            Strengths
                                                        </h4>
                                                        <ul className="space-y-4">
                                                            {analysis.prosCons.pros.map((pro: string, idx: number) => (
                                                                <li key={idx} className="flex gap-3 leading-relaxed text-sm lg:text-base">
                                                                    <div className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-green-500" />
                                                                    <span className="text-foreground/90">{pro}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <div className="bg-red-500/5 rounded-2xl p-6 lg:p-8 border border-red-500/10 shadow-sm relative overflow-hidden">
                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                                                        <h4 className="font-bold font-headline text-red-600 dark:text-red-400 flex items-center gap-3 mb-6 text-xl">
                                                            <div className="bg-red-500/10 p-2 rounded-lg">
                                                                <ThumbsDown className="h-6 w-6" />
                                                            </div>
                                                            Limitations
                                                        </h4>
                                                        <ul className="space-y-4">
                                                            {analysis.prosCons.cons.map((con: string, idx: number) => (
                                                                <li key={idx} className="flex gap-3 leading-relaxed text-sm lg:text-base">
                                                                    <div className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-red-500" />
                                                                    <span className="text-foreground/90">{con}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>

                                                {/* Bottleneck Analysis */}
                                                <div className="bg-secondary/20 rounded-2xl p-6 lg:p-8 border shadow-sm">
                                                    <h4 className="font-bold font-headline flex items-center gap-3 mb-4 text-xl">
                                                        <div className="bg-yellow-500/10 p-2 rounded-lg">
                                                            <AlertCircle className="h-6 w-6 text-yellow-500" />
                                                        </div>
                                                        System Bottleneck
                                                    </h4>
                                                    <p className="text-base text-foreground/80 leading-relaxed max-w-4xl border-l-2 border-yellow-500/50 pl-4 py-1 italic">
                                                        "{analysis.bottleneckAnalysis}"
                                                    </p>
                                                </div>

                                                {/* FPS Estimates */}
                                                <div className="space-y-6 pt-4">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-bold font-headline flex items-center gap-3 text-xl">
                                                            <MonitorPlay className="h-7 w-7 text-primary" /> Estimated Gaming Performance
                                                        </h4>
                                                        <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold bg-muted px-2 py-1 rounded">Avg FPS</span>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                        {analysis.fpsEstimates.map((est: any, idx: number) => (
                                                            <div key={idx} className="bg-card border-2 rounded-xl p-5 text-center shadow-sm hover:border-primary/40 hover:shadow-md transition-all group">
                                                                <p className="text-[11px] text-muted-foreground uppercase font-black tracking-widest mb-3 line-clamp-1 group-hover:text-foreground transition-colors">{est.game}</p>
                                                                <div className="flex flex-col items-center justify-center min-h-[5rem]">
                                                                    <p className="text-4xl font-headline font-black text-primary mb-2 transform group-hover:scale-110 transition-transform origin-bottom">{est.estimatedFps}</p>
                                                                    <Badge variant="outline" className="text-[10px] font-bold uppercase py-0 group-hover:bg-primary group-hover:text-primary-foreground">{est.resolution}</Badge>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Suggestions */}
                                                {analysis.suggestions && analysis.suggestions.length > 0 && (
                                                    <div className="space-y-6 pt-4">
                                                        <h4 className="font-bold font-headline flex items-center gap-3 text-xl">
                                                            <div className="bg-orange-500/10 p-2 rounded-lg">
                                                                <Zap className="h-6 w-6 text-orange-500" />
                                                            </div>
                                                            Upgrade Paths
                                                        </h4>
                                                        <div className="grid gap-4">
                                                            {analysis.suggestions.map((sug: any, idx: number) => (
                                                                <div key={idx} className="bg-card border rounded-xl p-5 shadow-sm hover:border-orange-500/30 transition-colors flex flex-col md:flex-row gap-4 md:items-center">
                                                                    <div className="flex-1">
                                                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                                                            <span className="line-through text-muted-foreground text-sm decoration-destructive/50">{sug.originalComponent}</span>
                                                                            <span className="text-orange-500 font-black px-1">→</span>
                                                                            <span className="font-bold text-base text-foreground">{sug.suggestedComponent}</span>
                                                                        </div>
                                                                        <p className="text-muted-foreground text-sm leading-relaxed max-w-3xl">{sug.reason}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="pt-8 pb-4 flex justify-center border-t mt-8">
                                                    <Button variant="outline" onClick={handleAnalyze} disabled={loadingAnalysis} className="rounded-full px-8">
                                                        Re-run Diagnostics
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
}
