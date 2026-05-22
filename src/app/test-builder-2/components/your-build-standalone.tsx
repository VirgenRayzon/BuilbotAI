"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SparkleButton } from "@/components/ui/sparkle-button";
import type { ComponentData } from "@/lib/types";
import { X as CloseIcon, BrainCircuit, ShieldCheck, CheckCircle2, Sparkles, Heart, FolderOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Resolution, WorkloadType, Part } from "@/lib/types";
import { Separator } from "@/components/ui/separator";

import { useUser, useFirestore, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { collection, addDoc, query, onSnapshot, orderBy, serverTimestamp } from "firebase/firestore";
import type { FavoriteBuild, FavoriteBuildPart } from "@/lib/types";
import { type PrebuiltBuilderAddFormSchema } from "@/components/prebuilt-builder-add-dialog";
import { AIProgressModal } from "@/components/ai-progress-modal";
import { AnimatedIconButton, AnimatedRotateIcon, AnimatedShieldIcon } from "@/components/ui/animated-icons";

// Extracted Components & Hooks
import { BuildContentStandalone } from "./build-content-standalone";
import { useBuildActions } from "@/hooks/use-build-actions";

interface YourBuildProps {
    build: Record<string, ComponentData | ComponentData[] | null>;
    onClearBuild: () => void;
    onRemovePart: (category: string, index?: number) => void;
    onAnalyze?: (forceRefresh?: boolean) => void;
    resolution: Resolution;
    onResolutionChange: (res: Resolution) => void;
    workload: WorkloadType;
    onWorkloadChange: (workload: WorkloadType) => void;
    showSystemBalance?: boolean;
    className?: string;
    isManagerMode?: boolean;
    allParts?: Part[];
    onAddPrebuilt?: (data: PrebuiltBuilderAddFormSchema) => void | Promise<void>;
    analysis?: any;
    onAnalysisUpdate?: (analysis: any) => void;
    onCategorySelect?: (category: string) => void;
    categories?: any[];
}

export function YourBuildStandalone({
    build,
    onClearBuild,
    onRemovePart,
    onAnalyze,
    resolution,
    onResolutionChange,
    workload,
    onWorkloadChange,
    showSystemBalance = true,
    className,
    isManagerMode = false,
    onAddPrebuilt,
    analysis,
    onAnalysisUpdate,
    onCategorySelect,
    categories
}: YourBuildProps) {
    const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
    const [saveName, setSaveName] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [showFavoritesDropdown, setShowFavoritesDropdown] = useState(false);
    const [favorites, setFavorites] = useState<FavoriteBuild[]>([]);
    const desktopCardRef = useRef<HTMLDivElement>(null);

    const firestore = useFirestore();
    const settingsDocRef = useMemo(() => {
        if (firestore) return doc(firestore, 'siteSettings', 'main');
        return null;
    }, [firestore]);
    const { data: settings } = useDoc<any>(settingsDocRef);
    const isAiKillSwitch = settings?.isAiKillSwitch || false;

    const user = useUser();
    const { toast } = useToast();

    const mandatoryCategories = ['Motherboard', 'CPU', 'GPU', 'RAM', 'Storage', 'PSU', 'Cooler', 'Case'];
    const isBuildComplete = mandatoryCategories.every(cat => {
        const val = build[cat];
        return Array.isArray(val) ? val.length > 0 : !!val;
    });

    const selectedParts = Object.entries(build).reduce((acc, [name, value]) => {
        if (Array.isArray(value)) return acc + value.length;
        return acc + (value ? 1 : 0);
    }, 0);
    const totalParts = Object.keys(build).length;

    const totalWattage = Object.entries(build).reduce((acc, [key, component]) => {
        const drawingParts = ['CPU', 'GPU', 'Motherboard', 'RAM', 'Storage'];
        if (!drawingParts.includes(key)) return acc;

        if (Array.isArray(component)) {
            return acc + component.reduce((sum, c) => sum + (c.wattage || 0), 0);
        }
        if (component && !Array.isArray(component) && typeof component.wattage === 'number') {
            return acc + component.wattage;
        }
        return acc;
    }, 0);

    const psu = build['PSU'] as ComponentData | null;
    const psuWattage = psu && typeof psu.wattage === 'number' ? psu.wattage : 0;

    const totalPrice = Object.values(build).reduce((acc, component) => {
        if (Array.isArray(component)) {
            return acc + component.reduce((sum, c) => sum + (c.price || 0), 0);
        }
        return acc + (component?.price || 0);
    }, 0);

    const {
        isCheckingOut,
        showLocalAiProgress,
        setShowLocalAiProgress,
        aiPhase,
        isAiPending,
        tokensUsed,
        handleAddPrebuiltWithAi,
        handleCancelAi,
        handleCheckout,
        handleAnalyze,
    } = useBuildActions({
        build,
        user,
        isAiKillSwitch,
        onClearBuild,
        onAnalyze,
        onAddPrebuilt,
        totalPrice,
        onAnalysisUpdate,
    });

    const activeFilter = useMemo(() => {
        const selected = categories?.filter(c => c.selected);
        return selected?.length === 1 ? selected[0].name : null;
    }, [categories]);

    // Listen for favorites
    useEffect(() => {
        if (isManagerMode || !user || !firestore) return;
        const q = query(
            collection(firestore, "users", user.uid, "favorites"),
            orderBy("createdAt", "desc")
        );
        const unsub = onSnapshot(q, (snap) => {
            const data: FavoriteBuild[] = [];
            snap.forEach(d => data.push({ id: d.id, ...d.data() } as FavoriteBuild));
            setFavorites(data);
        });
        return () => unsub();
    }, [isManagerMode, user, firestore]);

    const extractBuildParts = (): FavoriteBuildPart[] => {
        const parts: FavoriteBuildPart[] = [];
        const categories = ['Motherboard', 'CPU', 'GPU', 'RAM', 'Storage', 'PSU', 'Cooler', 'Case', 'Monitor', 'Keyboard', 'Mouse', 'Headset'];
        categories.forEach(cat => {
            const val = build[cat];
            if (Array.isArray(val)) {
                val.forEach(v => {
                    if (v) parts.push({ category: cat, partId: v.id, name: v.model, price: v.price || 0 });
                });
            } else if (val) {
                parts.push({ category: cat, partId: val.id, name: val.model, price: val.price || 0 });
            }
        });
        return parts;
    };

    const handleSaveFavorite = async () => {
        if (!user || !firestore || !saveName.trim()) return;
        setIsSaving(true);
        try {
            const parts = extractBuildParts();
            await addDoc(collection(firestore, "users", user.uid, "favorites"), {
                name: saveName.trim(),
                parts,
                totalPrice,
                source: 'builder',
                createdAt: serverTimestamp(),
            });
            toast({ title: "Build Saved", description: `"${saveName.trim()}" added to favorites.` });
            setIsSaveDialogOpen(false);
            setSaveName("");
        } catch (err) {
            console.error(err);
            toast({ title: "Error", description: "Failed to save favorite.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleLoadFavorite = (favorite: FavoriteBuild) => {
        localStorage.setItem('pc_builder_load_favorite', JSON.stringify(favorite));
        window.dispatchEvent(new CustomEvent('load-favorite-build', { detail: favorite }));
        setShowFavoritesDropdown(false);
        toast({ title: "Favorite Loaded", description: `"${favorite.name}" loaded into your build.` });
    };

    const renderBuildContent = () => (
        <>
            <BuildContentStandalone
                build={build}
                onRemovePart={onRemovePart}
                onCategorySelect={onCategorySelect}
                activeFilter={activeFilter}
                categories={categories}
                showSystemBalance={showSystemBalance}
                resolution={resolution}
                totalWattage={totalWattage}
                psuWattage={psuWattage}
                totalPrice={totalPrice}
            />
            <CardFooter className="flex-none flex flex-col items-stretch gap-4 pb-6 mt-4">
                <div className="flex flex-col gap-3 w-full">
                    {!isManagerMode && (
                        <SparkleButton
                            icon={<Sparkles className="h-4 w-4" />}
                            containerClassName="w-full"
                            className="w-full h-12 text-xs font-black uppercase tracking-widest px-8"
                            disabled={selectedParts === 0}
                            onClick={() => handleAnalyze()}
                        >
                            {analysis ? "REFRESH ANALYSIS" : "ANALYZE BUILD"}
                        </SparkleButton>
                    )}

                    <div className="flex gap-3">
                        <AnimatedIconButton 
                            icon={<AnimatedRotateIcon className="h-4 w-4" />}
                            className="flex-1 text-muted-foreground hover:text-destructive h-10 text-[9px] font-bold uppercase tracking-widest border border-border/40 hover:bg-destructive/5 px-4" 
                            onClick={onClearBuild} 
                            disabled={selectedParts === 0}
                        >
                            Clear Build
                        </AnimatedIconButton>

                        {!isManagerMode && (
                            <>
                                <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="flex-1 h-10 text-[9px] font-bold uppercase tracking-widest border-rose-500/20 text-rose-500 hover:bg-rose-500/10 hover:text-rose-400 transition-all flex items-center justify-center gap-1.5"
                                            disabled={selectedParts === 0}
                                        >
                                            <Heart className="h-3 w-3" /> Save
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-sm">
                                        <DialogHeader>
                                            <DialogTitle className="flex items-center gap-2">
                                                <Heart className="h-5 w-5 text-rose-500 fill-rose-500" />
                                                Save to Favorites
                                            </DialogTitle>
                                            <DialogDescription>Give your build a name for easy access later.</DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <Input
                                                value={saveName}
                                                onChange={(e) => setSaveName(e.target.value)}
                                                placeholder="e.g. My Dream 4K Build"
                                                onKeyDown={(e) => e.key === 'Enter' && handleSaveFavorite()}
                                                autoFocus
                                            />
                                        </div>
                                        <div className="flex gap-3">
                                            <Button variant="outline" className="flex-1" onClick={() => setIsSaveDialogOpen(false)}>Cancel</Button>
                                            <Button
                                                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
                                                onClick={handleSaveFavorite}
                                                disabled={!saveName.trim() || isSaving}
                                            >
                                                {isSaving ? "Saving..." : "Save Build"}
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                                <Button
                                    variant="outline"
                                    className="flex-1 h-10 text-[9px] font-bold uppercase tracking-widest border-primary/20 text-primary hover:bg-primary/10 hover:text-primary/80 transition-all flex items-center justify-center gap-1.5"
                                    disabled={favorites.length === 0}
                                    onClick={() => setShowFavoritesDropdown(!showFavoritesDropdown)}
                                >
                                    <FolderOpen className="h-3 w-3" /> Load {favorites.length > 0 && `(${favorites.length})`}
                                </Button>
                            </>
                        )}
                    </div>

                    {showFavoritesDropdown && favorites.length > 0 && (
                        <div className="w-full">
                            <div className="bg-background/80 border border-border/40 rounded-xl overflow-hidden backdrop-blur-sm">
                                <ScrollArea className="max-h-[200px]">
                                    <div className="divide-y divide-border/30">
                                        {favorites.map((fav) => (
                                            <button
                                                key={fav.id}
                                                className="w-full p-3 text-left hover:bg-muted/40 transition-colors flex items-center justify-between gap-2"
                                                onClick={() => handleLoadFavorite(fav)}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold truncate">{fav.name}</p>
                                                    <p className="text-[9px] text-muted-foreground">{fav.parts.length} parts • {formatCurrency(fav.totalPrice)}</p>
                                                </div>
                                                <Heart className="h-3 w-3 text-rose-500 fill-rose-500 flex-none" />
                                            </button>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>
                    )}

                    <Dialog open={isCheckoutDialogOpen} onOpenChange={setIsCheckoutDialogOpen}>
                        <DialogTrigger asChild>
                            <AnimatedIconButton
                                icon={<AnimatedShieldIcon className="h-5 w-5" />}
                                className="w-full h-12 text-xs font-black uppercase tracking-widest bg-emerald-600/20 hover:bg-emerald-600/30 border-emerald-500/30 hover:border-emerald-500/50 text-emerald-500 px-8"
                                disabled={!isBuildComplete}
                                glowColor="rgba(16, 185, 129, 0.5)"
                            >
                                Reserve Build
                            </AnimatedIconButton>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <ShieldCheck className="h-6 w-6 text-emerald-600" />
                                    Confirm Reservation
                                </DialogTitle>
                                <DialogDescription>
                                    Review your components before reserving this build.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <ScrollArea className="max-h-[30vh]">
                                    <div className="space-y-2">
                                        {['Motherboard', 'CPU', 'GPU', 'RAM', 'Storage', 'PSU', 'Cooler', 'Case', 'Monitor', 'Keyboard', 'Mouse', 'Headset'].map((category) => {
                                            const val = build[category];
                                            const components = Array.isArray(val) ? val : (val ? [val] : []);
                                            return components.map((c, idx) => (
                                                <div key={`${category}-${idx}`} className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">{category}: {(c as any).name || c.model}</span>
                                                    <span className="font-medium">{formatCurrency(c.price)}</span>
                                                </div>
                                            ));
                                        })}
                                    </div>
                                </ScrollArea>
                                <Separator />
                                <div className="flex justify-between items-center font-bold text-lg">
                                    <span>Total Price</span>
                                    <span className="text-primary">{formatCurrency(totalPrice)}</span>
                                </div>
                                <div className="bg-muted/30 p-3 rounded-lg text-xs text-muted-foreground flex gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                    By confirming, your reservation will be processed and stock will be held for you.
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1" onClick={() => setIsCheckoutDialogOpen(false)}>Cancel</Button>
                                <AnimatedIconButton 
                                    className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white border-none" 
                                    onClick={() => handleCheckout(() => setIsCheckoutDialogOpen(false))} 
                                    disabled={isCheckingOut}
                                    isLoading={isCheckingOut}
                                    icon={<AnimatedShieldIcon className="h-4 w-4" />}
                                    glowColor="rgba(255, 255, 255, 0.3)"
                                >
                                    Confirm Reservation
                                </AnimatedIconButton>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardFooter>
        </>
    );

    return (
        <div ref={desktopCardRef} className="w-full">
            <Card className={`flex flex-col overflow-hidden relative glass-panel border-primary/30 shadow-[0_0_30px_rgba(34,211,238,0.08),0_0_60px_rgba(34,211,238,0.04)] ${className || ""}`}>
                {/* Animated top accent */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent z-20" />
                
                {/* Subtle corner glow accents */}
                <div className="absolute -top-6 -left-6 w-32 h-32 bg-primary/10 rounded-full blur-[40px] pointer-events-none z-0" />
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-purple-500/8 rounded-full blur-[30px] pointer-events-none z-0" />

                <CardHeader className="flex flex-col gap-3 py-5 bg-muted/20 border-b border-border/40 flex-none relative z-10">
                    <div className="flex items-center justify-between">
                        <CardTitle className="font-headline text-xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent uppercase">Your Build Summary</CardTitle>
                        <Badge variant="secondary" className="font-headline font-bold text-[10px] px-2 py-0.5 whitespace-nowrap bg-primary/20 text-primary border-primary/30 uppercase tracking-widest">{selectedParts}/{totalParts} PARTS</Badge>
                    </div>
                    {/* Build Progress Bar */}
                    <div className="w-full">
                        <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${(selectedParts / totalParts) * 100}%` }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                style={{
                                    background: selectedParts === totalParts
                                        ? 'linear-gradient(90deg, #10b981, #06b6d4)'
                                        : selectedParts > 0
                                            ? 'linear-gradient(90deg, #06b6d4, #8b5cf6)'
                                            : 'transparent',
                                }}
                            />
                        </div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 mt-1.5">
                            {selectedParts === 0 
                                ? "Select components to begin" 
                                : selectedParts === totalParts 
                                    ? "Build complete — Ready for analysis" 
                                    : `${totalParts - selectedParts} slots remaining`
                            }
                        </p>
                    </div>
                </CardHeader>
                {renderBuildContent()}
            </Card>

            <AIProgressModal
                isOpen={showLocalAiProgress}
                onComplete={() => setShowLocalAiProgress(false)}
                onCancel={handleCancelAi}
                title="Architecting Prebuilt"
                currentPhase={aiPhase}
                tokensUsed={tokensUsed || undefined}
            />
        </div>
    );
}
