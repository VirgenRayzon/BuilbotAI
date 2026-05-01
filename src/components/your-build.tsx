import { useState, useTransition, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SparkleButton } from "./ui/sparkle-button";
import { Separator } from "@/components/ui/separator";
import type { ComponentData } from "@/lib/types";
import { Cpu, Server, CircuitBoard, MemoryStick, Database, Power, RectangleVertical as CaseIcon, Wind, AlertCircle, X as CloseIcon, BrainCircuit, Loader2, ThumbsUp, ThumbsDown, MonitorPlay, Zap, Plus, Sparkles, Monitor, Keyboard, Mouse, Headphones, ShieldCheck, CheckCircle2, Gauge, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, cn } from "@/lib/utils";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { getAiBuildCritique, getAiPrebuiltSuggestions } from "@/app/actions";
import { Resolution, WorkloadType } from "@/lib/types";
import { PowerMeter } from "./ui/power-meter";

import Link from "next/link";
import { processCheckout } from "@/app/checkout-actions";
import { useUser, useFirestore, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { OrderItem } from "@/lib/types";
import { calculateBottleneck } from "@/lib/bottleneck";
import { type PrebuiltBuilderAddFormSchema } from "./prebuilt-builder-add-dialog";
import { Part, PrebuiltSystem } from "@/lib/types";
import { AIProgressModal, type ProgressPhase } from "./ai-progress-modal";
import { AnimatedIconButton, AnimatedRotateIcon, AnimatedBrainIcon, AnimatedShieldIcon, AnimatedXIcon, AnimatedCaseIcon } from "./ui/animated-icons";

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
    hasAnalysis?: boolean;
    onCategorySelect?: (category: string) => void;
}

function BottleneckMeter({ build, resolution }: { build: Record<string, ComponentData | ComponentData[] | null>, resolution: Resolution }) {
    const result = calculateBottleneck(build, resolution);

    if (result.status === 'Incomplete') return null;

    return (
        <div
            className="mt-4 p-4 border-l-4 rounded-r-md bg-muted/40 transition-colors duration-300"
            style={{ borderColor: result.color }}
        >
            <h4 className="font-headline font-bold mb-1 flex items-center gap-2" style={{ color: result.color }}>
                <Gauge className="w-4 h-4" /> System Balance: {result.status}
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
                {result.message}
            </p>
        </div>
    );
}

const componentIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    cpu: Cpu,
    gpu: Server,
    motherboard: CircuitBoard,
    ram: MemoryStick,
    storage: Database,
    psu: Power,
    case: CaseIcon,
    cooler: Wind,
    monitor: Monitor,
    keyboard: Keyboard,
    mouse: Mouse,
    headset: Headphones,
};

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
    allParts = [],
    onAddPrebuilt,
    hasAnalysis = false,
    onCategorySelect
}: YourBuildProps) {
    const [analysis, setAnalysis] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [showLocalAiProgress, setShowLocalAiProgress] = useState(false);
    const [aiPhase, setAiPhase] = useState<ProgressPhase>('init');
    const [showAccessories, setShowAccessories] = useState(false);
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

    const mandatoryCategories = ['CPU', 'GPU', 'Motherboard', 'RAM', 'Storage', 'PSU', 'Case', 'Cooler'];
    const isBuildComplete = mandatoryCategories.every(cat => {
        const val = build[cat];
        return Array.isArray(val) ? val.length > 0 : !!val;
    });

    const [isAiPending, startAiTransition] = useTransition();

    const selectedParts = Object.entries(build).reduce((acc, [name, value]) => {
        if (Array.isArray(value)) return acc + value.length;
        return acc + (value ? 1 : 0);
    }, 0);
    const totalParts = Object.keys(build).length;

    // Scroll to "Your Build" when the first part is added
    useEffect(() => {
        const prevCount = prevSelectedPartsRef.current;
        prevSelectedPartsRef.current = selectedParts;
        if (prevCount === 0 && selectedParts > 0 && desktopCardRef.current) {
            desktopCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [selectedParts]);

    const handleAddPrebuiltWithAi = () => {
        if (!onAddPrebuilt) return;

        if (isAiKillSwitch) {
            toast({
                title: "AI Disabled",
                description: "AI is disable by Administrator.",
                variant: "destructive"
            });
            return;
        }

        // Show modal immediately with init phase
        setAiPhase('init');
        setShowLocalAiProgress(true);

        startAiTransition(async () => {
            try {
                // Phase: AI Requesting
                await new Promise(r => setTimeout(r, 400));
                setAiPhase('ai-requesting');

                const selectedComponents = {
                    cpu: (build['CPU'] as ComponentData)?.model,
                    gpu: (build['GPU'] as ComponentData)?.model,
                    motherboard: (build['Motherboard'] as ComponentData)?.model,
                    ram: Array.isArray(build['RAM']) 
                        ? (build['RAM'] as ComponentData[]).map(r => r.model).join(", ") 
                        : (build['RAM'] as ComponentData)?.model,
                    storage: Array.isArray(build['Storage']) 
                        ? (build['Storage'] as ComponentData[]).map(s => s.model).join(", ") 
                        : (build['Storage'] as ComponentData)?.model,
                    psu: (build['PSU'] as ComponentData)?.model,
                    case: (build['Case'] as ComponentData)?.model,
                    cooler: (build['Cooler'] as ComponentData)?.model,
                };

                const result = await getAiPrebuiltSuggestions({
                    components: selectedComponents
                });

                // Phase: AI Complete
                setAiPhase('ai-complete');

                // Phase: Formatting
                await new Promise(r => setTimeout(r, 300));
                setAiPhase('ai-formatting');

                if (result && "systemName" in result) {
                    // Phase: Image Fetch
                    await new Promise(r => setTimeout(r, 300));
                    setAiPhase('image-fetch');

                    const randomNum = Math.floor(Math.random() * 1000);
                    const systemSlug = result.systemName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
                    const finalImage = `https://picsum.photos/seed/${systemSlug}${randomNum}/800/600`;

                    const finalData: PrebuiltBuilderAddFormSchema = {
                        name: result.systemName,
                        description: result.description || "High-performance prebuilt system.",
                        price: Math.round(totalPrice * 100) / 100,
                        tier: result.tier || "Mid-Range",
                        imageUrl: finalImage,
                        cpu: (build['CPU'] as ComponentData)?.id || "",
                        gpu: (build['GPU'] as ComponentData)?.id || "",
                        motherboard: (build['Motherboard'] as ComponentData)?.id || "",
                        ram: Array.isArray(build['RAM']) ? (build['RAM'] as ComponentData[]).map(r => r.id) : (build['RAM'] ? [(build['RAM'] as ComponentData).id] : []),
                        storage: Array.isArray(build['Storage']) ? (build['Storage'] as ComponentData[]).map(s => s.id) : (build['Storage'] ? [(build['Storage'] as ComponentData).id] : []),
                        psu: (build['PSU'] as ComponentData)?.id || "",
                        case: (build['Case'] as ComponentData)?.id || "",
                        cooler: (build['Cooler'] as ComponentData)?.id || "",
                    };

                    // Phase: Saving to Firestore
                    await new Promise(r => setTimeout(r, 300));
                    setAiPhase('saving');

                    await onAddPrebuilt(finalData);

                    // Phase: Done
                    setAiPhase('done');
                } else {
                    setShowLocalAiProgress(false);
                    const errorMessage = (result as any)?.error || "Could not generate name and description. Please try again or check API configuration.";
                    toast({
                        variant: "destructive",
                        title: "AI Generation Failed",
                        description: errorMessage
                    });
                }
            } catch (error: any) {
                setShowLocalAiProgress(false);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: error.message || "An unexpected error occurred."
                });
            }
        });
    };

    const handleCheckout = async () => {
        if (!user) {
            toast({
                title: "Authentication Required",
                description: "Please sign in to reserve your build.",
                variant: "destructive"
            });
            return;
        }

        setIsCheckingOut(true);
        const orderItems: OrderItem[] = [];
        Object.entries(build).forEach(([category, val]) => {
            if (val) {
                if (Array.isArray(val)) {
                    val.forEach(v => orderItems.push({
                        id: v.id,
                        name: v.model,
                        category,
                        price: v.price
                    }));
                } else {
                    orderItems.push({
                        id: (val as any).id,
                        name: (val as any).model,
                        category,
                        price: (val as any).price
                    });
                }
            }
        });

        const result = await processCheckout(user.uid, user.email || "guest", orderItems);

        if (result.success) {
            toast({
                title: "Build Reserved!",
                description: "Your build reservation has been recorded and is now pending.",
            });
            setIsCheckoutDialogOpen(false);
            onClearBuild();
        } else {
            toast({
                title: "Reservation Failed",
                description: result.error,
                variant: "destructive"
            });
        }
        setIsCheckingOut(false);
    };

    const handleAnalyze = async () => {
        if (isAiKillSwitch) {
            toast({
                title: "AI Disabled",
                description: "AI is disable by Administrator.",
                variant: "destructive"
            });
            return;
        }

        if (onAnalyze) {
            onAnalyze();
            return;
        }
        setLoading(true);
        setError(null);
        setIsDialogOpen(true);

        const inputData: any = {};
        Object.entries(build).forEach(([key, val]) => {
            if (val) {
                if (Array.isArray(val)) {
                    inputData[key] = val.map((v: any) => ({
                        model: v.model,
                        price: v.price,
                        category: key,
                        brand: v.model.split(' ')[0]
                    }));
                } else {
                    const singleVal = val as any;
                    inputData[key] = {
                        model: singleVal.model,
                        price: singleVal.price,
                        category: key,
                        brand: singleVal.model.split(' ')[0]
                    };
                }
            }
        });

        try {
            const result = await getAiBuildCritique(inputData);
            if ('error' in result) {
                setError(result.error as string);
            } else {
                setAnalysis(result);
            }
        } catch (err) {
            setError("An unexpected error occurred during analysis.");
        } finally {
            setLoading(false);
        }
    };

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

    const router = useRouter();

    const renderBuildContent = () => (
        <>
            <CardContent className="px-5 py-4 flex flex-col flex-1 min-h-0">
                <ScrollArea className="flex-1">
                    <div className="space-y-3 py-1 overflow-hidden">
                        {['Case', 'Motherboard', 'CPU', 'GPU', 'RAM', 'Storage', 'PSU', 'Cooler'].map((name) => {
                            const component = build[name];
                            const Icon = componentIcons[name.toLowerCase()] || Cpu;
                            const components = Array.isArray(component) ? component : (component ? [component] : []);

                            if (components.length === 0) {
                                return (
                                    <div 
                                        key={name} 
                                        className={cn(
                                            "flex items-center gap-4 py-1.5 opacity-40 grayscale group transition-all hover:opacity-100 hover:grayscale-0",
                                            onCategorySelect ? "cursor-pointer" : "cursor-default"
                                        )}
                                        onClick={() => onCategorySelect?.(name)}
                                    >
                                        <div className="p-2 bg-secondary/80 rounded flex items-center justify-center">
                                            <Icon className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider leading-none mb-1">{name}</p>
                                            <p className="text-[10px] text-muted-foreground/80 italic font-medium">Click to add</p>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div key={name} className="space-y-1.5">
                                    {components.map((c, idx) => (
                                        <div key={`${name}-${idx}`} className="flex items-center gap-4 py-1.5 animate-in fade-in slide-in-from-left-3 duration-300 group">
                                            <div
                                                className="relative p-2 bg-primary/15 rounded flex items-center justify-center border border-primary/20 shadow-sm cursor-pointer transition-all hover:bg-destructive/20 hover:border-destructive/30 hover:scale-105 active:scale-95 group/icon"
                                                onClick={() => onRemovePart(name, name === 'Storage' ? idx : undefined)}
                                                title={`Remove ${name}`}
                                            >
                                                <Icon className="w-4 h-4 text-primary group-hover/icon:text-destructive transition-colors" />
                                                <div className="absolute -top-1.5 -right-1.5 lg:hidden bg-destructive text-white rounded-full p-0.5 shadow-lg border border-background">
                                                    <CloseIcon className="w-2.5 h-2.5" />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-primary uppercase tracking-wider leading-none mb-1">
                                                    {(name === 'Storage' || name === 'RAM') && components.length > 1 ? `${name} ${idx + 1}` : name}
                                                </p>
                                                <p className="text-sm font-semibold truncate leading-tight tracking-tight">{(c as any).name || c.model}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {typeof c.wattage === 'number' && (
                                                    <span className="text-[10px] font-bold text-muted-foreground bg-secondary px-1.5 py-0.5 rounded shadow-inner">
                                                        {c.wattage}W
                                                    </span>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="hidden lg:flex h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20 hover:text-destructive text-muted-foreground"
                                                    onClick={() => onRemovePart(name, name === 'Storage' ? idx : undefined)}
                                                >
                                                    <CloseIcon className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })}

                        <button 
                            type="button"
                            className="w-full pt-6 pb-3 cursor-pointer group/acc border-none bg-transparent outline-none"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowAccessories(!showAccessories);
                            }}
                        >
                            <div className="flex items-center gap-3 w-full">
                                <span className="flex items-center gap-1.5 shrink-0">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] group-hover/acc:text-primary transition-colors">
                                        Accessories
                                    </span>
                                    <ChevronDown className={cn(
                                        "w-4 h-4 text-muted-foreground transition-transform duration-300 group-hover/acc:text-primary",
                                        showAccessories && "rotate-180"
                                    )} />
                                </span>
                                <div className="h-px flex-1 bg-border/30 group-hover/acc:bg-primary/40 transition-colors" />
                            </div>
                        </button>

                        {showAccessories && ['Monitor', 'Keyboard', 'Mouse', 'Headset'].map((name) => {
                            const component = build[name];
                            const Icon = componentIcons[name.toLowerCase()] || Monitor;

                            if (!component) {
                                return (
                                    <div 
                                        key={name} 
                                        className={cn(
                                            "flex items-center gap-4 py-1.5 opacity-40 grayscale group transition-all hover:opacity-100 hover:grayscale-0",
                                            onCategorySelect ? "cursor-pointer" : "cursor-default"
                                        )}
                                        onClick={() => onCategorySelect?.(name)}
                                    >
                                        <div className="p-2 bg-secondary/80 rounded flex items-center justify-center">
                                            <Icon className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider leading-none mb-1">{name}</p>
                                            <p className="text-[10px] text-muted-foreground/80 italic font-medium">Click to add</p>
                                        </div>
                                    </div>
                                );
                            }

                            const c = component as ComponentData;
                            return (
                                <div key={name} className="flex items-center gap-4 py-1.5 animate-in fade-in slide-in-from-left-3 duration-300 group">
                                    <div
                                        className="relative p-2 bg-primary/10 rounded flex items-center justify-center border border-primary/10 shadow-sm cursor-pointer transition-all hover:bg-destructive/20 hover:border-destructive/30 hover:scale-105 active:scale-95 group/icon"
                                        onClick={() => onRemovePart(name)}
                                        title={`Remove ${name}`}
                                    >
                                        <Icon className="w-4 h-4 text-primary/80 group-hover/icon:text-destructive transition-colors" />
                                        <div className="absolute -top-1.5 -right-1.5 lg:hidden bg-destructive text-white rounded-full p-0.5 shadow-lg border border-background">
                                            <CloseIcon className="w-2.5 h-2.5" />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-primary/80 uppercase tracking-wider leading-none mb-1">{name}</p>
                                        <p className="text-sm font-semibold truncate leading-tight tracking-tight">{(c as any).name || c.model}</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="hidden lg:flex h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20 hover:text-destructive text-muted-foreground"
                                        onClick={() => onRemovePart(name)}
                                    >
                                        <CloseIcon className="h-4 w-4" />
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>

                <div className="pt-4 flex-none space-y-4">
                    <Separator className="opacity-50" />
                    {showSystemBalance !== false && <BottleneckMeter build={build} resolution={resolution} />}
                    
                    {totalWattage > 0 && (
                        <PowerMeter value={totalWattage} max={psuWattage} className="mt-2" />
                    )}

                    <div className="flex justify-between items-center pt-3 border-t border-dashed border-border/40">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Total Value</span>
                        <span className="text-2xl font-bold font-headline text-primary tracking-tighter">{formatCurrency(totalPrice)}</span>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex-none flex flex-col items-stretch gap-4 pb-6">
                <div className="flex flex-row lg:flex-col gap-3 w-full items-center justify-end lg:justify-center">
                    {!isManagerMode && (
                        hasAnalysis ? (
                            <SparkleButton
                                icon={<Sparkles className="h-4 w-4" />}
                                containerClassName="order-1 flex-none lg:w-full"
                                className="w-12 lg:w-full h-12 text-xs font-black uppercase tracking-widest px-0 lg:px-8"
                                disabled={selectedParts === 0}
                                onClick={() => {
                                    if (onAnalyze) {
                                        onAnalyze(true);
                                    } else {
                                        router.push('/ai-build-advisor');
                                    }
                                }}
                            >
                                <span className="hidden lg:inline">REFRESH ANALYSIS</span>
                            </SparkleButton>
                        ) : (
                            <SparkleButton
                                icon={<Sparkles className="h-4 w-4" />}
                                containerClassName="order-1 flex-none lg:w-full"
                                className="w-12 lg:w-full h-12 text-xs font-black uppercase tracking-widest px-0 lg:px-8"
                                disabled={selectedParts === 0}
                                onClick={() => {
                                    if (onAnalyze) {
                                        onAnalyze();
                                    } else {
                                        router.push('/ai-build-advisor');
                                    }
                                }}
                            >
                                <span className="hidden lg:inline">ANALYZE BUILD</span>
                            </SparkleButton>
                        )
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
                                            {Object.entries(build).map(([category, val]) => {
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
                                        onClick={handleCheckout} 
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
            {/* Desktop View */}
            {/* Scroll anchor for desktop — scrollIntoView lands here */}
            <div ref={desktopCardRef} className="hidden lg:block">
            <Card className={`flex flex-col border-primary/20 shadow-[0_0_40px_rgba(34,211,238,0.05)] overflow-hidden relative glass-panel sticky top-4 max-h-[calc(100vh-2rem)] ${className || ""}`}>
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

            {/* Mobile View */}
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
                        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
                            {renderBuildContent()}
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            {/* AI Progress Modal — renders centered on screen when adding prebuilt */}
            <AIProgressModal
                isOpen={showLocalAiProgress}
                onComplete={() => setShowLocalAiProgress(false)}
                title="Architecting Prebuilt"
                currentPhase={aiPhase}
            />
        </>
    )
}
