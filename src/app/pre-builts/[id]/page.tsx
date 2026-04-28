"use client";

import { useState, useEffect, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/theme-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getOptimizedStorageUrl, cn } from "@/lib/utils";
import type { PrebuiltSystem, Part } from "@/lib/types";
import { getMissingParts } from "@/lib/prebuilt-utils";
import { Sparkles, ShieldCheck, Loader2, AlertCircle, ThumbsUp, ThumbsDown, MonitorPlay, Zap, ExternalLink, Gamepad2, ArrowLeft, ChevronLeft, CircuitBoard, Database, Box } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAiPrebuiltPerformance } from "@/app/actions";
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import ReactMarkdown from 'react-markdown';
import { SmartImageMagnifier } from "@/components/smart-image-magnifier";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { useUserProfile } from "@/context/user-profile";
import { reservePrebuiltSystem } from "@/app/prebuilt-reservation-actions";
import { checkSystemStock } from "@/lib/prebuilt-utils";
import { SparkleButton } from "@/components/ui/sparkle-button";

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
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const { id: systemId } = use(params);
    const [system, setSystem] = useState<PrebuiltSystem | null>(null);
    const [loadingSystem, setLoadingSystem] = useState(true);

    const [components, setComponents] = useState<Record<string, Part | null>>({});
    const [loadingParts, setLoadingParts] = useState(false);

    const [localAnalysis, setLocalAnalysis] = useState<any>(null);
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);
    const [isReserving, setIsReserving] = useState(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);

    const { profile, authUser } = useUserProfile();
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
                    const data = snap.data() as PrebuiltSystem;
                    // Protect archived systems from non-admin users
                    if (data.isArchived && !(profile?.isManager || profile?.isSuperAdmin)) {
                        toast({
                            title: "Access Denied",
                            description: "This system is no longer available.",
                            variant: "destructive"
                        });
                        router.push('/pre-builts');
                        return;
                    }
                    setSystem({ ...data, id: snap.id });
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

    const isInStock = checkSystemStock(components);

    const handleReserve = async () => {
        if (!isComplete || !system || !profile || !authUser || !isInStock || isReserving) return;

        setIsReserving(true);
        try {
            // Prepare component map for the reservation action
            const componentsMap: Record<string, { id: string, name: string, price: number, category: string }> = {};
            Object.entries(components).forEach(([category, part]) => {
                if (part) {
                    componentsMap[category] = {
                        id: part.id,
                        name: part.name,
                        price: part.price,
                        category: category
                    };
                }
            });

            // Sanitize system object for Server Action (remove Firestore Timestamps/toJSON methods)
            const sanitizedSystem = JSON.parse(JSON.stringify(system));

            const result = await reservePrebuiltSystem(
                authUser.uid,
                profile.email,
                profile.name || profile.email.split('@')[0],
                sanitizedSystem,
                componentsMap
            );

            if (result.success) {
                toast({
                    title: 'Reservation Successful',
                    description: `Your reservation for ${system.name} has been recorded.`,
                });
                router.push('/profile');
            } else {
                toast({
                    title: 'Reservation Failed',
                    description: result.error || 'An error occurred during reservation.',
                    variant: 'destructive'
                });
            }
        } catch (error) {
            console.error("Reservation error:", error);
            toast({
                title: 'Error',
                description: 'An unexpected error occurred.',
                variant: 'destructive'
            });
        } finally {
            setIsReserving(false);
        }
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
        <div className={cn(
            "min-h-screen transition-colors duration-500 overflow-x-hidden",
            isDark ? "bg-[#0c0f14] text-slate-50" : "bg-white text-slate-900"
        )}>
            {/* Circuit Pattern Background */}
            <div className={cn(
                "fixed inset-0 opacity-[0.03] pointer-events-none z-0",
                isDark ? "invert" : ""
            )} style={{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />

            <main className="w-full max-w-[1800px] mx-auto p-4 md:p-8 pt-24 md:pt-32 animate-in fade-in duration-700 relative z-10">
            {/* Top Navigation */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-12"
            >
                <Button variant="ghost" asChild className="group text-muted-foreground hover:text-primary transition-colors">
                    <Link href={backLink} className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[10px] uppercase font-bold tracking-[0.2em]">{backText}</span>
                    </Link>
                </Button>
            </motion.div>

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
                <div className="lg:col-span-7 space-y-12">
                    {/* Header Details */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <Badge className="px-4 py-1.5 font-black tracking-[0.2em] uppercase text-[10px] bg-primary text-white border-none shadow-lg shadow-primary/20">
                                {system.tier}
                            </Badge>
                            {isComplete && (
                                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                                    <ShieldCheck className="h-3 w-3" />
                                    Diagnostics Validated
                                </div>
                            )}
                        </div>
                        <h1 className="text-5xl md:text-7xl font-headline font-black uppercase tracking-tighter leading-none mb-6">
                            {system.name}
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed font-medium">
                            {system.description}
                        </p>
                    </motion.div>

                    {/* Price and Action Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className={cn(
                          "rounded-3xl border backdrop-blur-xl shadow-2xl overflow-hidden group",
                          isDark ? "bg-slate-900/40 border-white/5 shadow-black/40" : "bg-white/60 border-slate-200 shadow-slate-200/50"
                        )}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                        <CardContent className="p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-black mb-2">Architected Configuration Value</p>
                                <p className="text-5xl md:text-6xl font-black font-headline text-primary tracking-tighter">{formatCurrency(system.price)}</p>
                            </div>
                            <div className="flex-shrink-0 w-full md:w-auto">
                                <SparkleButton
                                    onClick={handleReserve}
                                    isLoading={isReserving}
                                    disabled={!isComplete || loadingParts || !isInStock || isReserving}
                                    icon={<Zap className="h-6 w-6" />}
                                    className="px-12 h-16 text-lg shadow-2xl"
                                >
                                    {loadingParts ? "Validating Stock..." : !isInStock ? "Diagnostics Failed" : "Reserve this Prebuilt"}
                                </SparkleButton>
                                {!isComplete && (
                                    <div className="mt-4 flex items-center justify-center md:justify-end gap-2 text-destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Critical: Missing {missingParts.length} Components</span>
                                    </div>
                                )}
                                {isComplete && !loadingParts && !isInStock && (
                                    <div className="mt-4 flex items-center justify-center md:justify-end gap-2 text-destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">One or more components are out of stock</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </motion.div>

                    {/* Component Breakdown */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-6 pt-6"
                    >
                        <div className="flex items-center gap-4">
                            <Box className="w-6 h-6 text-primary" />
                            <h3 className="text-2xl font-headline font-black uppercase tracking-tight">
                                Integrated Architecture
                            </h3>
                        </div>

                        {loadingParts ? (
                            <div className={cn(
                                "flex flex-col items-center justify-center py-20 gap-4 rounded-3xl border border-dashed backdrop-blur-md",
                                isDark ? "bg-slate-900/20 border-white/5" : "bg-white/40 border-slate-200"
                            )}>
                                <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
                                <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground animate-pulse">Running Component Validation...</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {Object.entries(components).map(([category, part], idx) => (
                                    <motion.div 
                                        key={category}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 * idx }}
                                        className={cn(
                                            "flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-2xl border transition-all duration-300 group",
                                            isDark 
                                                ? "bg-slate-900/40 border-white/5 hover:border-primary/40 hover:bg-slate-900/60" 
                                                : "bg-white/60 border-slate-200 hover:border-primary/30 hover:bg-white/80"
                                        )}
                                    >
                                        <div className="w-full sm:w-28 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] shrink-0">
                                            {category}
                                        </div>
                                        <div className="flex-1">
                                            {part ? (
                                                <div className="flex items-center justify-between gap-6">
                                                    <div>
                                                        <p className="font-bold text-lg leading-none mb-1 group-hover:text-primary transition-colors">{part.name}</p>
                                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{part.brand}</p>
                                                    </div>
                                                    <div className="text-right shrink-0 hidden sm:block">
                                                        <p className="font-mono font-bold text-sm mb-1">{formatCurrency(part.price)}</p>
                                                        {part.stock > 0 ? (
                                                            <div className="flex items-center justify-end gap-1.5 text-emerald-500">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                                <span className="text-[9px] font-black uppercase tracking-widest">In Stock</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center justify-end gap-1.5 text-destructive">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                                                                <span className="text-[9px] font-black uppercase tracking-widest">Depleted</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3 text-destructive/80 font-bold uppercase tracking-widest text-[10px] py-1">
                                                    <AlertCircle className="h-4 w-4" /> Component Missing From Configuration
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* AI Performance Section */}
            <div className="mt-24 pt-24 border-t border-border/50">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-3xl mb-6">
                        <Sparkles className="h-10 w-10 text-primary animate-pulse" />
                    </div>
                    <h2 className="text-4xl md:text-5xl font-headline font-black uppercase tracking-tighter mb-6">Synergy Diagnostics</h2>
                    <p className="text-muted-foreground max-w-3xl mx-auto text-xl leading-relaxed font-medium">
                        Our neural engine calculates the intersection of component capability to determine the absolute performance ceiling for this specific machine architecture.
                    </p>
                </motion.div>

                <div className="w-full mx-auto relative">
                    {!analysis && !loadingAnalysis && !analysisError && (
                        <Card className="border-dashed shadow-none bg-transparent">
                            <CardContent className="flex flex-col items-center justify-center py-24 text-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full w-[500px] h-[500px] -z-10 m-auto opacity-30 animate-pulse" />
                                {canGenerateReport ? (
                                    <SparkleButton 
                                        onClick={handleAnalyze} 
                                        isLoading={loadingAnalysis}
                                        icon={<Sparkles className="h-6 w-6" />}
                                        className="px-12 h-16 text-lg shadow-2xl"
                                    >
                                        Initialize Neural Analysis
                                    </SparkleButton>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
                                            <Sparkles className="h-10 w-10 text-muted-foreground/30" />
                                        </div>
                                        <h3 className="text-2xl font-headline font-bold uppercase tracking-tight mb-2">Diagnostic Data Unavailable</h3>
                                        <p className="text-muted-foreground max-w-md">The performance architectural report for this system has not been authorized yet.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {loadingAnalysis && (
                        <div className="flex flex-col items-center justify-center py-32 gap-8">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 animate-ping rounded-full scale-150" />
                                <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center border border-primary/30 relative z-10 backdrop-blur-md">
                                    <Sparkles className="h-12 w-12 text-primary animate-pulse" />
                                </div>
                            </div>
                            <div className="text-center space-y-2">
                                <p className="text-2xl font-headline font-black uppercase tracking-widest text-primary animate-pulse">Running Diagnostics</p>
                                <p className="text-xs font-mono text-muted-foreground uppercase tracking-[0.3em]">Processing Hardware Synergy Vectors...</p>
                            </div>
                        </div>
                    )}

                    {analysisError && (
                        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-12 rounded-3xl max-w-2xl mx-auto text-center shadow-2xl backdrop-blur-md">
                            <AlertCircle className="h-16 w-16 mx-auto mb-6 opacity-80" />
                            <h3 className="text-2xl font-headline font-black uppercase tracking-tight mb-3">Diagnostic Failure</h3>
                            <p className="mb-8 text-lg font-medium">{analysisError}</p>
                            {canGenerateReport && (
                                <SparkleButton 
                                    onClick={handleAnalyze} 
                                    className="px-10 h-12 text-xs"
                                    icon={<Zap className="h-4 w-4" />}
                                >
                                    Re-Attempt Sync
                                </SparkleButton>
                            )}
                        </div>
                    )}

                    {analysis && !loadingAnalysis && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000">
                            {/* Pros / Strengths */}
                            <div className="w-full mx-auto">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={cn(
                                        "rounded-[2.5rem] border backdrop-blur-xl shadow-2xl relative overflow-hidden",
                                        isDark ? "bg-slate-900/40 border-white/5" : "bg-white/60 border-slate-200"
                                    )}
                                >
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none" />
                                    <div className="p-8 md:p-16">
                                        <div className="flex flex-col items-center text-center mb-12">
                                            <div className="bg-emerald-500/10 p-5 rounded-[2rem] mb-6">
                                                <ThumbsUp className="h-10 w-10 text-emerald-500" />
                                            </div>
                                            <h4 className="text-3xl md:text-4xl font-headline font-black uppercase tracking-tight text-emerald-500">
                                                Architecture Strengths
                                            </h4>
                                        </div>
                                        
                                        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                                            {(analysis?.pros || []).map((pro: string, idx: number) => (
                                                <motion.div 
                                                    key={idx}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.1 * idx }}
                                                    className={cn(
                                                        "p-6 rounded-3xl border flex gap-5 group transition-all duration-300",
                                                        isDark ? "bg-slate-900/30 border-white/5 hover:border-emerald-500/40" : "bg-white/40 border-slate-100 hover:border-emerald-500/30"
                                                    )}
                                                >
                                                    <div className="mt-1 flex-shrink-0 w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                                    </div>
                                                    <span className="text-lg font-medium leading-relaxed group-hover:text-foreground transition-colors">{pro}</span>
                                                </motion.div>
                                            ))}
                                            {(!analysis?.pros || analysis?.pros?.length === 0) && (
                                                <div className="col-span-2 py-12 text-center text-muted-foreground/50 italic text-xl">No specific architectural strengths identified for this configuration.</div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            {canGenerateReport && (
                                <div className="py-8 flex justify-center">
                                    <SparkleButton 
                                        onClick={handleAnalyze} 
                                        isLoading={loadingAnalysis} 
                                        className="h-12 text-[10px]"
                                        icon={<ArrowLeft className="h-4 w-4" />}
                                    >
                                        Reset Diagnostic Matrix
                                    </SparkleButton>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </main>
        </div>
    );
}
