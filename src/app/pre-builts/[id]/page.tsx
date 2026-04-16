"use client";

import { useState, useEffect, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getOptimizedStorageUrl } from "@/lib/utils";
import type { PrebuiltSystem, Part } from "@/lib/types";
import { getMissingParts } from "@/lib/prebuilt-utils";
import { BrainCircuit, ShoppingCart, Loader2, AlertCircle, ThumbsUp, ThumbsDown, MonitorPlay, Zap, ExternalLink, ShieldCheck, Gamepad2, ArrowLeft, ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAiPrebuiltPerformance } from "@/app/actions";
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import ReactMarkdown from 'react-markdown';
import { SmartImageMagnifier } from "@/components/smart-image-magnifier";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { useUserProfile } from "@/context/user-profile";

const getPerformanceStyle = (fps: string) => {
    const minFps = parseInt(fps.match(/\d+/)?.[0] || "0");
    if (minFps >= 100) return { color: "bg-emerald-500", text: "text-emerald-500", percent: 100, label: "Legendary" };
    if (minFps >= 75) return { color: "bg-green-500", text: "text-green-500", percent: 85, label: "Excellent" };
    if (minFps >= 60) return { color: "bg-green-400", text: "text-green-400", percent: 70, label: "Smooth" };
    if (minFps >= 45) return { color: "bg-yellow-500", text: "text-yellow-500", percent: 50, label: "Playable" };
    if (minFps >= 30) return { color: "bg-orange-500", text: "text-orange-500", percent: 35, label: "Entry" };
    return { color: "bg-red-500", text: "text-red-500", percent: 15, label: "Low" };
};

export default function PrebuiltProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: systemId } = use(params);
    const [system, setSystem] = useState<PrebuiltSystem | null>(null);
    const [loadingSystem, setLoadingSystem] = useState(true);

    const [components, setComponents] = useState<Record<string, Part | null>>({});
    const [loadingParts, setLoadingParts] = useState(false);

    const [localAnalysis, setLocalAnalysis] = useState<any>(null);
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);

    const { profile } = useUserProfile();
    const canGenerateReport = profile?.isManager || profile?.isSuperAdmin;
    const analysis = system?.aiReport || localAnalysis;

    const { toast } = useToast();
    const firestore = useFirestore();
    const router = useRouter();

    const backLink = (profile?.isManager || profile?.isSuperAdmin) ? "/admin?tab=prebuilts" : "/pre-builts";
    const backText = (profile?.isManager || profile?.isSuperAdmin) ? "Back to Manage Prebuilts" : "Back to Pre-built Rigs";

    const missingParts = system ? getMissingParts(system) : [];
    const isComplete = system ? missingParts.length === 0 : false;

    useEffect(() => {
        if (!firestore || !systemId) return;

        const fetchSystem = async () => {
            try {
                const docRef = doc(firestore, 'prebuiltSystems', systemId);
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    setSystem({ id: snap.id, ...snap.data() } as PrebuiltSystem);
                } else {
                    toast({
                        title: "System Not Found",
                        description: "The prebuilt system you are looking for does not exist.",
                        variant: "destructive"
                    });
                }
            } catch (error) {
                console.error("Error fetching system:", error);
            } finally {
                setLoadingSystem(false);
            }
        };

        fetchSystem();
    }, [firestore, systemId, toast]);

    useEffect(() => {
        if (system && firestore && Object.keys(components).length === 0) {
            const fetchComponents = async () => {
                setLoadingParts(true);
                const partsRecord: Record<string, Part | null> = {};

                try {
                    const promises = Object.entries(system.components).map(async ([category, id]) => {
                        const collectionMap: Record<string, string> = {
                            cpu: 'CPU', gpu: 'GPU', motherboard: 'Motherboard',
                            ram: 'RAM', storage: 'Storage', psu: 'PSU',
                            case: 'Case', cooler: 'Cooler',
                        };
                        const collectionName = collectionMap[category] || category;

                        // Handle potential array of IDs (e.g. for RAM or Storage)
                        const partId = Array.isArray(id) ? id[0] : id;

                        if (!partId) {
                            partsRecord[category] = null;
                            return;
                        }

                        // First try looking up by document ID
                        const partRef = doc(firestore, collectionName, partId as string);
                        const snap = await getDoc(partRef);

                        if (snap.exists()) {
                            partsRecord[category] = { id: snap.id, ...snap.data() } as Part;
                        } else {
                            // Fall back: query by name field (for legacy data that stored names instead of IDs)
                            const q = query(collection(firestore, collectionName), where("name", "==", partId));
                            const querySnap = await getDocs(q);
                            if (!querySnap.empty) {
                                const docSnap = querySnap.docs[0];
                                partsRecord[category] = { id: docSnap.id, ...docSnap.data() } as Part;
                            } else {
                                partsRecord[category] = null;
                            }
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
    }, [firestore, system, toast, components]);

    const handleAddToCart = () => {
        if (!isComplete || !system) return;

        // Convert resolved parts into a builder-compatible build state
        const categoryMap: Record<string, string> = {
            cpu: 'CPU', gpu: 'GPU', motherboard: 'Motherboard',
            ram: 'RAM', storage: 'Storage', psu: 'PSU',
            case: 'Case', cooler: 'Cooler',
        };

        const buildState: Record<string, any> = {
            CPU: null, GPU: null, Motherboard: null, RAM: null,
            Storage: [], PSU: null, Case: null, Cooler: null,
        };

        Object.entries(components).forEach(([category, part]) => {
            if (!part) return;
            const buildCategory = categoryMap[category] || category;
            const componentData = {
                id: part.id,
                model: part.name,
                price: part.price,
                description: Object.entries(part.specifications || {}).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(' | '),
                image: part.imageUrl,
                imageHint: part.name.toLowerCase().split(' ').slice(0, 2).join(' '),
                wattage: part.wattage,
                socket: part.socket || part.specifications?.['Socket']?.toString(),
                ramType: part.ramType || part.specifications?.['Memory Type']?.toString(),
                performanceScore: part.performanceScore,
                specifications: part.specifications,
                dimensions: part.dimensions,
            };

            if (buildCategory === 'Storage') {
                buildState['Storage'] = [componentData];
            } else {
                buildState[buildCategory] = componentData;
            }
        });

        localStorage.setItem('pc_builder_state', JSON.stringify(buildState));

        toast({
            title: 'Build Loaded',
            description: `${system.name} components have been loaded into the builder. Proceed to checkout!`,
        });
        router.push('/builder');
    };

    const handleAnalyze = async () => {
        if (!system || !firestore || !systemId) return;
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
            const result = await getAiPrebuiltPerformance(inputData);
            if ('error' in result) {
                setAnalysisError(result.error as string);
            } else {
                // Save report to firestore cache
                const docRef = doc(firestore, 'prebuiltSystems', systemId);
                await updateDoc(docRef, { aiReport: result });
                setLocalAnalysis(result);
                toast({
                    title: "Report Saved",
                    description: "AI Performance Analysis has been generated and cached publicly.",
                });
            }
        } catch (err) {
            setAnalysisError("An unexpected error occurred during analysis.");
        } finally {
            setLoadingAnalysis(false);
        }
    };

    if (loadingSystem) {
        return (
            <div className="container mx-auto p-4 md:p-8 flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground animate-pulse font-medium">Loading prebuilt rigorous specifications...</p>
                </div>
            </div>
        );
    }

    if (!system) {
        return (
            <div className="container mx-auto p-4 md:p-8 flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <MonitorPlay className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                    <h2 className="text-2xl font-bold font-headline mb-2">System Not Found</h2>
                    <p className="text-muted-foreground mb-6">The system you are looking for might have been removed or is unavailable.</p>
                    <Button asChild>
                        <Link href={backLink}>{backText}</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <main className="container mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            {/* Top Navigation */}
            <div>
                <Button variant="ghost" asChild className="mb-6 -ml-4 text-muted-foreground hover:text-foreground">
                    <Link href={backLink} className="flex items-center gap-2">
                        <ChevronLeft className="h-4 w-4" /> {backText}
                    </Link>
                </Button>
            </div>

            {/* Product Split Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative items-start">
                {/* Left side: Sticky Image */}
                <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
                    <div className="aspect-square relative w-full overflow-hidden rounded-2xl shadow-xl border bg-card/50 backdrop-blur-sm group">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none z-10" />
                        <SmartImageMagnifier
                            src={getOptimizedStorageUrl(system.imageUrl) || "/placeholder-system.png"}
                            alt={system.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                    </div>
                </div>

                {/* Right side: Details & Specs */}
                <div className="lg:col-span-7 space-y-8">
                    {/* Header Details */}
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <Badge variant="secondary" className="px-3 py-1 font-bold tracking-wide uppercase text-xs text-primary/90 bg-primary/10 border-primary/20">
                                {system.tier}
                            </Badge>
                            {isComplete && (
                                <Badge variant="outline" className="px-3 py-1 text-emerald-500 border-emerald-200/50 bg-emerald-500/10">
                                    <ShieldCheck className="h-3.5 w-3.5 mr-1.5" /> Ready to Build
                                </Badge>
                            )}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-headline font-bold leading-tight mb-4 tracking-tight">
                            {system.name}
                        </h1>
                        <p className="text-lg text-muted-foreground/90 max-w-2xl leading-relaxed">
                            {system.description}
                        </p>
                    </div>

                    {/* Price and Action Card */}
                    <Card className="bg-card/50 backdrop-blur-sm border-primary/10 shadow-lg overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent pointer-events-none" />
                        <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                            <div>
                                <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-1">Total System Cost</p>
                                <p className="text-4xl font-bold font-headline text-primary">{formatCurrency(system.price)}</p>
                            </div>
                            <div className="flex-shrink-0 w-full md:w-auto">
                                <Button
                                    size="lg"
                                    className="font-headline tracking-wide h-14 px-8 shadow-md w-full md:w-auto text-lg transition-transform hover:-translate-y-0.5"
                                    disabled={!isComplete}
                                    onClick={handleAddToCart}
                                >
                                    <ShoppingCart className="mr-2 h-5 w-5" /> Buy this Rig
                                </Button>
                                {!isComplete && (
                                    <p className="text-xs text-destructive text-center md:text-right mt-2 flex items-center justify-center md:justify-end gap-1 font-medium">
                                        <AlertCircle className="h-3 w-3" /> Missing {missingParts.length} Parts
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Component Breakdown */}
                    <div className="pt-4">
                        <h3 className="text-2xl font-headline font-bold mb-6 flex items-center gap-2">
                            Component Breakdown
                        </h3>

                        {loadingParts ? (
                            <div className="flex flex-col items-center justify-center py-12 space-y-4 rounded-xl border border-dashed">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="text-muted-foreground animate-pulse text-sm">Validating component compatibility...</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {Object.entries(components).map(([category, part]) => (
                                    <div key={category} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border bg-card/40 hover:bg-card hover:border-primary/30 transition-all shadow-sm">
                                        <div className="w-full sm:w-32 text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                            {category}
                                        </div>
                                        <div className="flex-1">
                                            {part ? (
                                                <div className="flex items-center justify-between gap-4">
                                                    <div>
                                                        <p className="font-semibold text-base leading-tight">{part.name}</p>
                                                        <p className="text-xs text-muted-foreground max-w-md line-clamp-1 mt-0.5">{part.brand}</p>
                                                    </div>
                                                    <div className="text-right shrink-0 hidden sm:block">
                                                        <p className="font-medium text-sm">{formatCurrency(part.price)}</p>
                                                        {part.stock > 0 ? (
                                                            <p className="text-[10px] uppercase tracking-wider text-emerald-500 font-bold mt-0.5">In Stock</p>
                                                        ) : (
                                                            <p className="text-[10px] uppercase tracking-wider text-destructive font-bold mt-0.5">Out of Stock</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-warning/80 italic text-sm py-1.5 font-medium">
                                                    <AlertCircle className="h-4 w-4" /> Part missing from build
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* AI Performance Section */}
            <div className="mt-16 pt-16 border-t border-border/50">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4">
                        <BrainCircuit className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-headline font-bold mb-4">AI Performance Analysis</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                        Our advanced AI engine analyzes the synergy of these specific components to highlight the system's absolute strengths and performance capabilities.
                    </p>
                </div>

                <div className="w-[100%] mx-auto relative">
                    {!analysis && !loadingAnalysis && !analysisError && (
                        <Card className="border-dashed shadow-none bg-transparent">
                            <CardContent className="flex flex-col items-center justify-center py-20 text-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full w-[400px] h-[400px] -z-10 m-auto opacity-50" />
                                {canGenerateReport ? (
                                    <Button size="lg" onClick={handleAnalyze} className="font-headline px-10 h-14 text-lg shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-1 rounded-full group">
                                        <BrainCircuit className="mr-2 h-6 w-6 group-hover:rotate-12 transition-transform" />
                                        Generate Comprehensive Report
                                    </Button>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <BrainCircuit className="h-12 w-12 text-muted-foreground/40 mb-4" />
                                        <h3 className="text-xl font-headline font-semibold text-foreground mb-2">Report Not Yet Available</h3>
                                        <p className="text-muted-foreground">The AI Performance Report for this system has not been generated by an administrator yet.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {loadingAnalysis && (
                        <div className="flex flex-col items-center justify-center py-28 space-y-6">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 animate-ping rounded-full" />
                                <BrainCircuit className="h-20 w-20 text-primary relative z-10 animate-pulse" />
                            </div>
                            <p className="text-xl font-headline font-medium animate-pulse text-muted-foreground">Diagnosing system synergy...</p>
                        </div>
                    )}

                    {analysisError && (
                        <div className="bg-destructive/5 border border-destructive/20 text-destructive p-8 rounded-xl max-w-lg mx-auto text-center shadow-inner">
                            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-80 text-destructive" />
                            <h3 className="text-xl font-bold mb-2">Analysis Failed</h3>
                            <p className="mb-6 opacity-90">{analysisError}</p>
                            {canGenerateReport && (
                                <Button variant="outline" onClick={handleAnalyze}>Try Again</Button>
                            )}
                        </div>
                    )}

                    {analysis && !loadingAnalysis && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-12 duration-700">
                            {/* Pros / Strengths */}
                            <div className="w-full mx-auto">
                                <Card className="bg-green-500/5 border-green-500/10 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-green-500/10 rounded-full blur-[60px] -mr-10 -mt-10 pointer-events-none" />
                                    <CardContent className="p-8 lg:p-12">
                                        <h4 className="font-bold font-headline text-green-600 dark:text-green-400 flex items-center justify-center gap-3 mb-8 text-2xl">
                                            <div className="bg-green-500/10 p-2.5 rounded-xl">
                                                <ThumbsUp className="h-6 w-6" />
                                            </div>
                                            System Strengths
                                        </h4>
                                        <ul className="space-y-6">
                                            {(analysis?.pros || []).map((pro: string, idx: number) => (
                                                <li key={idx} className="flex gap-4 leading-relaxed text-base md:text-lg">
                                                    <div className="mt-2.5 flex-shrink-0 w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                                    <span className="text-foreground/90">{pro}</span>
                                                </li>
                                            ))}
                                            {(!analysis?.pros || analysis?.pros?.length === 0) && (
                                                <li className="text-center text-muted-foreground/50 italic">No specific strengths identified.</li>
                                            )}
                                        </ul>
                                    </CardContent>
                                </Card>
                            </div>

                            {canGenerateReport && (
                                <div className="py-4 mt-8 flex justify-center">
                                    <Button variant="outline" onClick={handleAnalyze} disabled={loadingAnalysis} className="rounded-full px-8 gap-2 bg-background hover:bg-muted">
                                        <ArrowLeft className="h-4 w-4" /> Reset Analysis
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
