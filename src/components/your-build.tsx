import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { ComponentData } from "@/lib/types";
import { Cpu, Server, CircuitBoard, MemoryStick, Database, Power, RectangleVertical as CaseIcon, Wind, AlertCircle, X as CloseIcon, BrainCircuit, Loader2, ThumbsUp, ThumbsDown, MonitorPlay, Zap, Plus, Sparkles, Monitor, Keyboard, Mouse, Headphones } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAiBuildCritique, getAiPrebuiltSuggestions } from "@/app/actions";
import { Resolution, WorkloadType } from "@/lib/types";

import Link from "next/link";
import { processCheckout } from "@/app/checkout-actions";
import { useUser } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { OrderItem } from "@/lib/types";
import { ShoppingCart, CheckCircle2, Gauge } from "lucide-react";
import { calculateBottleneck } from "@/lib/bottleneck";
import { type PrebuiltBuilderAddFormSchema } from "./prebuilt-builder-add-dialog";
import { Part, PrebuiltSystem } from "@/lib/types";

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
    onAddPrebuilt?: (data: PrebuiltBuilderAddFormSchema) => void;
    hasAnalysis?: boolean;
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
    hasAnalysis = false
}: YourBuildProps) {
    const [analysis, setAnalysis] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // resolution and workload are now passed as props
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const user = useUser();
    const { toast } = useToast();

    const mandatoryCategories = ['CPU', 'GPU', 'Motherboard', 'RAM', 'Storage', 'PSU', 'Case', 'Cooler'];
    const isBuildComplete = mandatoryCategories.every(cat => {
        const val = build[cat];
        return Array.isArray(val) ? val.length > 0 : !!val;
    });

    const [isAiPending, startAiTransition] = useTransition();

    const handleAddPrebuiltWithAi = () => {
        if (!onAddPrebuilt) return;

        startAiTransition(async () => {
            toast({
                title: "Generating Identity...",
                description: "Buildbot is creating a name, description, and image for this system.",
            });
            try {
                // Prepare component names for AI context
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

                // Trigger AI generation
                const result = await getAiPrebuiltSuggestions({
                    components: selectedComponents
                });

                if (result && "systemName" in result) {
                    // Force a valid image path based on the system name
                    const randomNum = Math.floor(Math.random() * 1000);
                    const systemSlug = result.systemName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
                    const finalImage = `https://picsum.photos/seed/${systemSlug}${randomNum}/800/600`;

                    // Construct final data to save
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

                    onAddPrebuilt(finalData);
                } else {
                    toast({
                        variant: "destructive",
                        title: "AI Generation Failed",
                        description: "Could not generate name and description. Please try again or check API configuration."
                    });
                }
            } catch (error: any) {
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
                        brand: v.model.split(' ')[0] // Basic heuristic for brand
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

    const selectedParts = Object.entries(build).reduce((acc, [name, value]) => {
        if (Array.isArray(value)) return acc + value.length;
        return acc + (value ? 1 : 0);
    }, 0);
    const totalParts = Object.keys(build).length;

    const totalWattage = Object.entries(build).reduce((acc, [key, component]) => {
        // Exclude PSU (supply) and passive/fan-only parts like Case and Cooler from power demand
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
    const showPsuWarning = psuWattage > 0 && totalWattage > 0 && psuWattage < totalWattage * 1.2;

    const totalPrice = Object.values(build).reduce((acc, component) => {
        if (Array.isArray(component)) {
            return acc + component.reduce((sum, c) => sum + (c.price || 0), 0);
        }
        return acc + (component?.price || 0);
    }, 0);

    const router = useRouter();

    const handleApplySuggestion = (modelName: string) => {
        // This relies on the parent having access to the full part catalog or being able to trigger a selection
        // Since we are in YourBuild, we communicate back via event or if global parts available
        // For now, we'll try to find the part in the actual inventory if passed down, 
        // but often we just need to trigger the parent's toggle function.
        const parentWindow = window as any;
        if (parentWindow.__BOT_ADD_PART__) {
            parentWindow.__BOT_ADD_PART__(modelName);
            toast({
                title: "Finding part...",
                description: `Searching for ${modelName} in inventory.`,
            });
        } else {
            // Alternative: Dispatch a custom event
            const event = new CustomEvent('add-suggestion', { detail: { model: modelName } });
            window.dispatchEvent(event);
            toast({
                title: "Applying Suggestion",
                description: `Adding ${modelName} to your build...`,
            });
        }
    };

    return (
        <Card className={`flex flex-col border-primary/20 shadow-[0_0_40px_rgba(34,211,238,0.05)] overflow-hidden bg-background/40 backdrop-blur-2xl ring-1 ring-white/5 relative ${className || ""}`}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-500 to-primary animate-pulse z-20"></div>
            <CardHeader className="flex flex-row items-center justify-between py-5 bg-white/5 border-b border-white/5 flex-none">
                <CardTitle className="font-headline text-xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Your Build</CardTitle>
                <div className="flex flex-col gap-2 items-end">
                    <Badge variant="secondary" className="font-mono text-[10px] px-2 py-0.5 whitespace-nowrap bg-primary/20 text-primary border-primary/30">{selectedParts}/{totalParts} PARTS</Badge>
                </div>
            </CardHeader>
            <CardContent className="px-5 py-4 flex flex-col">
                <div className="flex-1 pr-4">
                    <div className="space-y-3 py-1">
                        {/* Internal Parts Section */}
                        {['Case', 'Motherboard', 'CPU', 'GPU', 'RAM', 'Storage', 'PSU', 'Cooler'].map((name) => {
                            const component = build[name];
                            const Icon = componentIcons[name.toLowerCase()] || Cpu;
                            const components = Array.isArray(component) ? component : (component ? [component] : []);

                            if (components.length === 0) {
                                return (
                                    <div key={name} className="flex items-center gap-4 py-1.5 opacity-40 grayscale group cursor-default transition-all hover:opacity-100 hover:grayscale-0">
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
                                                className="p-2 bg-primary/15 rounded flex items-center justify-center border border-primary/20 shadow-sm cursor-pointer transition-all hover:bg-destructive/20 hover:border-destructive/30 hover:scale-105 active:scale-95 group/icon"
                                                onClick={() => onRemovePart(name, name === 'Storage' ? idx : undefined)}
                                                title={`Remove ${name}`}
                                            >
                                                <Icon className="w-4 h-4 text-primary group-hover/icon:text-destructive transition-colors" />
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
                                                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
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

                        {/* Accessories Section Divider */}
                        <div className="pt-4 pb-2">
                            <div className="flex items-center gap-2">
                                <Separator className="flex-1 opacity-30" />
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] whitespace-nowrap">Accessories</span>
                                <Separator className="flex-1 opacity-30" />
                            </div>
                        </div>

                        {/* Accessories Slots */}
                        {['Monitor', 'Keyboard', 'Mouse', 'Headset'].map((name) => {
                            const component = build[name];
                            const Icon = componentIcons[name.toLowerCase()] || Monitor;

                            if (!component) {
                                return (
                                    <div key={name} className="flex items-center gap-4 py-1.5 opacity-40 grayscale group cursor-default transition-all hover:opacity-100 hover:grayscale-0">
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
                                        className="p-2 bg-primary/10 rounded flex items-center justify-center border border-primary/10 shadow-sm cursor-pointer transition-all hover:bg-destructive/20 hover:border-destructive/30 hover:scale-105 active:scale-95 group/icon"
                                        onClick={() => onRemovePart(name)}
                                        title={`Remove ${name}`}
                                    >
                                        <Icon className="w-4 h-4 text-primary/80 group-hover/icon:text-destructive transition-colors" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-primary/80 uppercase tracking-wider leading-none mb-1">{name}</p>
                                        <p className="text-sm font-semibold truncate leading-tight tracking-tight">{(c as any).name || c.model}</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
                                        onClick={() => onRemovePart(name)}
                                    >
                                        <CloseIcon className="h-4 w-4" />
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="pt-4 flex-none">
                    <Separator className="mb-3 opacity-50" />
                    {showSystemBalance !== false && <BottleneckMeter build={build} resolution={resolution} />}

                    <div className="flex justify-between items-center pt-3 mt-3 border-t border-dashed">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Total Cost</span>
                        <span className="text-2xl font-bold font-headline text-primary">{formatCurrency(totalPrice)}</span>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex-none flex flex-col items-stretch gap-4 pb-6">
                {showPsuWarning && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Power Supply Warning</AlertTitle>
                        <AlertDescription>
                            Your PSU ({psuWattage}W) may be insufficient for the estimated {totalWattage}W load.
                        </AlertDescription>
                    </Alert>
                )}
                <div className="flex flex-col gap-3 w-full">
                    {hasAnalysis ? (
                        <Button
                            variant="outline"
                            className="w-full font-headline tracking-wide flex items-center gap-2 border-primary/50 hover:bg-primary/10 transition-colors group/analyze"
                            size="lg"
                            disabled={selectedParts === 0}
                            onClick={() => {
                                if (onAnalyze) {
                                    onAnalyze(true);
                                } else {
                                    router.push('/ai-build-advisor');
                                }
                            }}
                        >
                            <BrainCircuit className="h-5 w-5 text-primary" />
                            Refresh Analysis
                        </Button>
                    ) : (
                        <Button
                            className="w-full font-headline tracking-wide flex items-center gap-2 bg-primary hover:bg-primary/90 relative overflow-hidden group/analyze shadow-md transition-all"
                            size="lg"
                            disabled={selectedParts === 0}
                            onClick={() => {
                                if (onAnalyze) {
                                    onAnalyze();
                                } else {
                                    router.push('/ai-build-advisor');
                                }
                            }}
                        >
                            <BrainCircuit className="h-5 w-5 animate-pulse" />
                            <Sparkles className="absolute left-4 w-4 h-4 text-white/40 animate-sparkle" />
                            Analyze My Build
                            <div className="absolute inset-0 animate-shimmer pointer-events-none opacity-0 group-hover/analyze:opacity-100 transition-opacity" />
                        </Button>
                    )}

                    <Button variant="ghost" className="w-full text-muted-foreground hover:text-destructive h-8 text-xs" onClick={onClearBuild} disabled={selectedParts === 0}>
                        Clear Build
                    </Button>

                    {isManagerMode ? (
                        <Button
                            className="w-full font-headline tracking-wide flex items-center gap-2 bg-primary hover:bg-primary/90 text-white relative overflow-hidden group/add-prebuilt"
                            size="lg"
                            disabled={!isBuildComplete || isAiPending}
                            onClick={handleAddPrebuiltWithAi}
                        >
                            {isAiPending ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span>Generating Identity...</span>
                                </>
                            ) : (
                                <>
                                    <Plus className="h-5 w-5" />
                                    <span>Add New Prebuilt</span>
                                </>
                            )}
                            <div className="absolute inset-0 animate-shimmer pointer-events-none opacity-0 group-hover/add-prebuilt:opacity-100 transition-opacity" />
                        </Button>
                    ) : (
                        <Dialog open={isCheckoutDialogOpen} onOpenChange={setIsCheckoutDialogOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    className="w-full font-headline tracking-wide flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                                    size="lg"
                                    disabled={!isBuildComplete}
                                >
                                    <ShoppingCart className="h-5 w-5" /> Reserve Build
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <ShoppingCart className="h-6 w-6 text-emerald-600" />
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
                                    <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={handleCheckout} disabled={isCheckingOut}>
                                        {isCheckingOut ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                        Confirm Reservation
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </CardFooter>
        </Card >
    )
}
