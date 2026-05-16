/**
 * YourBuild — The main "Your Build" sidebar panel.
 * Displays selected components, total price, wattage, and action buttons
 * (Analyze, Checkout, Clear). Delegates business logic to useBuildActions hook.
 */
import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SparkleButton } from "./ui/sparkle-button";
import type { ComponentData } from "@/lib/types";
import { X as CloseIcon, BrainCircuit, ShieldCheck, CheckCircle2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Resolution, WorkloadType, Part } from "@/lib/types";
import { Separator } from "@/components/ui/separator";

import { useUser, useFirestore, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { type PrebuiltBuilderAddFormSchema } from "./prebuilt-builder-add-dialog";
import { AIProgressModal } from "./ai-progress-modal";
import { AnimatedIconButton, AnimatedRotateIcon, AnimatedShieldIcon, AnimatedCaseIcon } from "./ui/animated-icons";

// Extracted Components & Hooks
import { BuildContent } from "./build/build-content";
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

export function YourBuild({
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
    const desktopCardRef = useRef<HTMLDivElement>(null);
    const prevSelectedPartsRef = useRef(0);

    const firestore = useFirestore();
    const settingsDocRef = useMemo(() => {
        if (firestore) return doc(firestore, 'siteSettings', 'main');
        return null;
    }, [firestore]);
    const { data: settings } = useDoc<any>(settingsDocRef);
    const isAiKillSwitch = settings?.isAiKillSwitch || false;

    const user = useUser();
    const { toast } = useToast();
    const router = useRouter();

    const mandatoryCategories = ['Case', 'Motherboard', 'CPU', 'GPU', 'RAM', 'Storage', 'PSU', 'Cooler'];
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

    useEffect(() => {
        const prevCount = prevSelectedPartsRef.current;
        prevSelectedPartsRef.current = selectedParts;
        if (prevCount === 0 && selectedParts > 0 && desktopCardRef.current) {
            desktopCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [selectedParts]);

    const activeFilter = useMemo(() => {
        const selected = categories?.filter(c => c.selected);
        return selected?.length === 1 ? selected[0].name : null;
    }, [categories]);

    const renderBuildContent = () => (
        <>
            <BuildContent
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
            <CardFooter className="flex-none flex flex-col items-stretch gap-4 pb-6">
                <div className="flex flex-row lg:flex-col gap-3 w-full items-center justify-end lg:justify-center">
                    {!isManagerMode && (
                        <SparkleButton
                            icon={<Sparkles className="h-4 w-4" />}
                            containerClassName="order-1 flex-none lg:w-full"
                            className="w-12 lg:w-full h-12 text-xs font-black uppercase tracking-widest px-0 lg:px-8"
                            disabled={selectedParts === 0}
                            onClick={() => handleAnalyze()}
                        >
                            <span className="hidden lg:inline">{analysis ? "REFRESH ANALYSIS" : "ANALYZE BUILD"}</span>
                        </SparkleButton>
                    )}

                    <AnimatedIconButton 
                        icon={<AnimatedRotateIcon className="h-4 w-4" />}
                        className="order-2 flex-none w-12 lg:w-full text-muted-foreground hover:text-destructive h-12 lg:h-8 text-[9px] font-bold uppercase tracking-widest transition-all bg-transparent lg:bg-transparent border-border/20 lg:border-transparent hover:bg-destructive/5 px-0 lg:px-4" 
                        onClick={onClearBuild} 
                        disabled={selectedParts === 0}
                    >
                        <span className="hidden lg:inline">Clear Build</span>
                    </AnimatedIconButton>

                    {isManagerMode ? (
                        <SparkleButton
                            containerClassName="order-3 flex-none lg:w-full"
                            className="w-12 lg:w-full h-12 text-xs font-black uppercase tracking-widest px-0 lg:px-8"
                            disabled={!isBuildComplete || isAiPending}
                            onClick={handleAddPrebuiltWithAi}
                            isLoading={isAiPending}
                            icon={<Sparkles className="h-4 w-4" />}
                        >
                            <span className="hidden lg:inline">{isAiPending ? "GENERATING IDENTITY..." : "ADD NEW PREBUILT"}</span>
                        </SparkleButton>
                    ) : (
                        <Dialog open={isCheckoutDialogOpen} onOpenChange={setIsCheckoutDialogOpen}>
                            <DialogTrigger asChild>
                                <AnimatedIconButton
                                    icon={<AnimatedShieldIcon className="h-5 w-5" />}
                                    className="order-3 flex-none w-12 lg:w-full h-12 text-xs font-black uppercase tracking-widest bg-emerald-600/20 hover:bg-emerald-600/30 border-emerald-500/30 hover:border-emerald-500/50 text-emerald-500 px-0 lg:px-8"
                                    disabled={!isBuildComplete}
                                    glowColor="rgba(16, 185, 129, 0.5)"
                                >
                                    <span className="hidden lg:inline">Reserve Build</span>
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
                                            {['Case', 'Motherboard', 'CPU', 'GPU', 'RAM', 'Storage', 'PSU', 'Cooler', 'Monitor', 'Keyboard', 'Mouse', 'Headset'].map((category) => {
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
                    )}
                </div>
            </CardFooter>
        </>
    );

    return (
        <>
            <div ref={desktopCardRef} className="hidden lg:block">
            <Card className={`flex flex-col border-primary/20 shadow-[0_0_40px_rgba(34,211,238,0.05)] overflow-hidden relative glass-panel sticky top-24 ${className || ""}`}>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-500 to-primary animate-pulse z-20"></div>
                <CardHeader className="flex flex-row items-center justify-between py-5 bg-muted/20 border-b border-border/40 flex-none">
                    <CardTitle className="font-headline text-xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent uppercase">Your Build</CardTitle>
                    <div className="flex flex-col gap-2 items-end">
                        <Badge variant="secondary" className="font-headline font-bold text-[10px] px-2 py-0.5 whitespace-nowrap bg-primary/20 text-primary border-primary/30 uppercase tracking-widest">{selectedParts}/{totalParts} PARTS</Badge>
                    </div>
                </CardHeader>
                {renderBuildContent()}
            </Card>
            </div>

            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/80 backdrop-blur-xl border-t border-border shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
                <Sheet>
                    <SheetTrigger asChild>
                        <AnimatedIconButton 
                            className="w-full h-14 shadow-2xl bg-primary text-primary-foreground hover:bg-primary/90 border-none px-4"
                            icon={<AnimatedCaseIcon className="w-5 h-5 shrink-0" />}
                        >
                            <div className="flex items-center justify-between w-full">
                                <div className="flex flex-col items-start leading-tight">
                                    <span className="font-headline font-bold uppercase tracking-widest text-sm">View Build</span>
                                    <span className="text-[10px] font-bold text-primary-foreground/80 tracking-widest">
                                        {selectedParts}/{totalParts} PARTS
                                    </span>
                                </div>
                                <span className="font-black tracking-tighter text-lg">{formatCurrency(totalPrice)}</span>
                            </div>
                        </AnimatedIconButton>
                    </SheetTrigger>
                    <SheetContent side="bottom" hideClose className="h-[85vh] p-0 flex flex-col rounded-t-3xl border-primary/20">
                        <SheetHeader className="py-4 px-5 border-b border-border/40 bg-muted/20 flex flex-row items-center justify-between sticky top-0 z-10 text-left">
                            <SheetTitle className="font-headline text-xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent uppercase m-0 pt-1">
                                Your Build
                            </SheetTitle>
                            <div className="flex items-center gap-3">
                                <Badge variant="secondary" className="font-headline font-bold text-[10px] px-2 py-0.5 whitespace-nowrap bg-primary/20 text-primary border-primary/30 uppercase tracking-widest m-0 mt-1">
                                    {selectedParts}/{totalParts} PARTS
                                </Badge>
                                <SheetClose asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-muted/50 hover:bg-muted text-foreground/70 hover:text-foreground transition-colors shrink-0">
                                        <CloseIcon className="h-4 w-4" />
                                        <span className="sr-only">Close</span>
                                    </Button>
                                </SheetClose>
                            </div>
                        </SheetHeader>
                        <ScrollArea className="flex-1 w-full h-full pr-0">
                            {renderBuildContent()}
                        </ScrollArea>
                    </SheetContent>
                </Sheet>
            </div>

            <AIProgressModal
                isOpen={showLocalAiProgress}
                onComplete={() => setShowLocalAiProgress(false)}
                onCancel={handleCancelAi}
                title="Architecting Prebuilt"
                currentPhase={aiPhase}
            />
        </>
    )
}
