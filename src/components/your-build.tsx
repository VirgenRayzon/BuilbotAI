import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { ComponentData } from "@/lib/types";
import { Cpu, Server, CircuitBoard, MemoryStick, HardDrive, Power, RectangleVertical as CaseIcon, Wind, AlertCircle, X as CloseIcon, BrainCircuit, Loader2, ThumbsUp, ThumbsDown, MonitorPlay, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAiBuildCritique } from "@/app/actions";

import Link from "next/link";
import { processCheckout } from "@/app/checkout-actions";
import { useUser } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { OrderItem } from "@/lib/types";
import { ShoppingCart, CheckCircle2 } from "lucide-react";

interface YourBuildProps {
    build: Record<string, ComponentData | ComponentData[] | null>;
    onClearBuild: () => void;
    onRemovePart: (category: string, index?: number) => void;
    className?: string;
}

function PowerMeter({ value, max }: { value: number; max: number }) {
    const maxToUse = max > 0 ? max : Math.max(value + 200, 600);
    const percentage = Math.min((value / maxToUse) * 100, 100);

    let colorClass = "bg-emerald-500 text-emerald-500";
    if (percentage > 90) colorClass = "bg-red-500 text-red-500";
    else if (percentage > 70) colorClass = "bg-amber-500 text-amber-500";

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Power Demand</span>
                <span className="text-base font-bold font-headline">{value}W <span className="text-muted-foreground font-normal text-xs">/ {maxToUse}W</span></span>
            </div>
            <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden border border-border/50">
                <div
                    className={`h-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(0,0,0,0.2)] ${colorClass.split(' ')[0]}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

const componentIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    CPU: Cpu,
    GPU: Server,
    Motherboard: CircuitBoard,
    RAM: MemoryStick,
    Storage: HardDrive,
    PSU: Power,
    Case: CaseIcon,
    Cooler: Wind,
};

export function YourBuild({ build, onClearBuild, onRemovePart, className }: YourBuildProps) {
    const [analysis, setAnalysis] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
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

    const handleCheckout = async () => {
        if (!user) {
            toast({
                title: "Authentication Required",
                description: "Please sign in to complete your purchase.",
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
                title: "Order Placed Successfully!",
                description: "Your build has been recorded and stock has been updated.",
            });
            setIsCheckoutDialogOpen(false);
            onClearBuild();
        } else {
            toast({
                title: "Checkout Failed",
                description: result.error,
                variant: "destructive"
            });
        }
        setIsCheckingOut(false);
    };

    const handleAnalyze = async () => {
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

    const totalWattage = Object.entries(build).reduce((acc, [name, component]) => {
        if (name === 'Storage' && Array.isArray(component)) {
            return acc + component.reduce((sum, c) => sum + (c.wattage || 0), 0);
        }
        if ((name === 'CPU' || name === 'GPU') && component && !Array.isArray(component) && typeof component.wattage === 'number') {
            return acc + component.wattage;
        }
        return acc;
    }, 0);

    const psu = build['PSU'] as ComponentData | null;
    const psuWattage = psu && typeof psu.wattage === 'number' ? psu.wattage : 0;
    const showPsuWarning = psuWattage > 0 && totalWattage > 0 && psuWattage < totalWattage;

    const totalPrice = Object.values(build).reduce((acc, component) => {
        if (Array.isArray(component)) {
            return acc + component.reduce((sum, c) => sum + (c.price || 0), 0);
        }
        return acc + (component?.price || 0);
    }, 0);

    return (
        <Card className={`h-full flex flex-col border-primary/20 shadow-2xl overflow-hidden ring-1 ring-primary/5 ${className || ""}`}>
            <CardHeader className="flex flex-row items-center justify-between py-5 bg-muted/40 border-b flex-none">
                <CardTitle className="font-headline text-xl">Your Build</CardTitle>
                <Badge variant="secondary" className="font-mono text-xs px-2 py-0.5">{selectedParts}/{totalParts} PARTS</Badge>
            </CardHeader>
            <CardContent className="px-5 py-4 flex-1 flex flex-col min-h-0">
                <ScrollArea className="flex-1 pr-4 -mr-4">
                    <div className="space-y-3 py-1">
                        {Object.entries(build).map(([name, component]) => {
                            const Icon = componentIcons[name] || Cpu;
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
                                            <div className="p-2 bg-primary/15 rounded flex items-center justify-center border border-primary/20 shadow-sm">
                                                <Icon className="w-4 h-4 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-primary uppercase tracking-wider leading-none mb-1">
                                                    {name === 'Storage' && components.length > 1 ? `${name} ${idx + 1}` : name}
                                                </p>
                                                <p className="text-sm font-semibold truncate leading-tight tracking-tight">{c.model}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {typeof c.wattage === 'number' && (name === 'CPU' || name === 'GPU' || name === 'Storage') && (
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
                    </div>
                </ScrollArea>

                <div className="pt-4 flex-none">
                    <Separator className="mb-3 opacity-50" />
                    <PowerMeter value={totalWattage} max={psuWattage} />

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
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <Button
                            className="w-full font-headline tracking-wide flex items-center gap-2 bg-primary hover:bg-primary/90"
                            size="lg"
                            disabled={selectedParts === 0}
                            onClick={handleAnalyze}
                        >
                            <BrainCircuit className="h-5 w-5" /> Analyze My Build
                        </Button>
                        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                            <DialogHeader className="p-6 pb-2">
                                <DialogTitle className="flex items-center gap-2 font-headline text-3xl">
                                    <BrainCircuit className="h-8 w-8 text-primary" />
                                    AI Build Critique
                                </DialogTitle>
                                <DialogDescription className="text-base">
                                    Expert AI analysis of your current parts selection.
                                </DialogDescription>
                            </DialogHeader>

                            <ScrollArea className="flex-1 p-6 pt-2">
                                {loading && (
                                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                                        <p className="text-lg font-medium animate-pulse">Our AI is analyzing your components...</p>
                                    </div>
                                )}

                                {error && (
                                    <div className="bg-destructive/10 text-destructive p-6 rounded-lg border border-destructive/20">
                                        <div className="flex items-center gap-2 mb-2 font-bold text-lg">
                                            <AlertCircle className="h-6 w-6" />
                                            Analysis Failed
                                        </div>
                                        <p className="mb-4">{error}</p>
                                        <Button variant="outline" onClick={handleAnalyze}>Try Again</Button>
                                    </div>
                                )}

                                {analysis && !loading && (
                                    <div className="space-y-8 py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        {/* Pros and Cons */}
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="bg-green-500/10 rounded-xl p-5 border border-green-500/20">
                                                <h4 className="font-bold text-green-600 dark:text-green-400 flex items-center gap-2 mb-4 text-lg">
                                                    <ThumbsUp className="h-5 w-5" /> Pros
                                                </h4>
                                                <ul className="space-y-3 text-sm">
                                                    {analysis.prosCons.pros.map((pro: string, idx: number) => (
                                                        <li key={idx} className="flex gap-2 leading-relaxed">
                                                            <span className="text-green-500 font-bold">•</span> {pro}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="bg-red-500/10 rounded-xl p-5 border border-red-500/20">
                                                <h4 className="font-bold text-red-600 dark:text-red-400 flex items-center gap-2 mb-4 text-lg">
                                                    <ThumbsDown className="h-5 w-5" /> Cons
                                                </h4>
                                                <ul className="space-y-3 text-sm">
                                                    {analysis.prosCons.cons.map((con: string, idx: number) => (
                                                        <li key={idx} className="flex gap-2 leading-relaxed">
                                                            <span className="text-red-500 font-bold">•</span> {con}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>

                                        {/* Bottleneck Analysis */}
                                        <div className="bg-secondary/30 rounded-xl p-5 border border-border/50">
                                            <h4 className="font-bold flex items-center gap-2 mb-3 text-lg">
                                                <AlertCircle className="h-5 w-5 text-yellow-500" /> Bottleneck Analysis
                                            </h4>
                                            <p className="text-sm text-foreground/90 leading-relaxed italic">
                                                "{analysis.bottleneckAnalysis}"
                                            </p>
                                        </div>

                                        {/* FPS Estimates */}
                                        <div className="space-y-4">
                                            <h4 className="font-bold flex items-center gap-2 text-lg">
                                                <MonitorPlay className="h-6 w-6 text-primary" /> Estimated Gaming Performance
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                {analysis.fpsEstimates.map((est: any, idx: number) => (
                                                    <div key={idx} className="bg-card border-2 rounded-xl p-4 text-center shadow-sm">
                                                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-2">{est.game}</p>
                                                        <p className="text-3xl font-headline font-black text-primary mb-1">{est.estimatedFps}</p>
                                                        <Badge variant="outline" className="text-[10px] font-bold py-0">{est.resolution}</Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Suggestions */}
                                        {analysis.suggestions && analysis.suggestions.length > 0 && (
                                            <div className="space-y-4 pt-2">
                                                <h4 className="font-bold flex items-center gap-2 text-lg">
                                                    <Zap className="h-6 w-6 text-orange-500" /> AI Optimization Suggestions
                                                </h4>
                                                <div className="space-y-3">
                                                    {analysis.suggestions.map((sug: any, idx: number) => (
                                                        <div key={idx} className="bg-card border rounded-xl p-4 shadow-sm hover:border-primary/30 transition-colors">
                                                            <div className="flex flex-wrap items-center gap-2 mb-2">
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
                                            <Button variant="outline" className="w-full" onClick={handleAnalyze} disabled={loading}>
                                                Refresh Analysis
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </ScrollArea>
                        </DialogContent>
                    </Dialog>

                    <Button variant="ghost" className="w-full text-muted-foreground hover:text-destructive h-8 text-xs" onClick={onClearBuild} disabled={selectedParts === 0}>
                        Clear Build
                    </Button>

                    <Dialog open={isCheckoutDialogOpen} onOpenChange={setIsCheckoutDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                className="w-full font-headline tracking-wide flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                                size="lg"
                                disabled={!isBuildComplete}
                            >
                                <ShoppingCart className="h-5 w-5" /> Checkout Build
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <ShoppingCart className="h-6 w-6 text-emerald-600" />
                                    Confirm Order
                                </DialogTitle>
                                <DialogDescription>
                                    Review your components before completing the purchase.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <ScrollArea className="max-h-[30vh]">
                                    <div className="space-y-2">
                                        {Object.entries(build).map(([category, val]) => {
                                            const components = Array.isArray(val) ? val : (val ? [val] : []);
                                            return components.map((c, idx) => (
                                                <div key={`${category}-${idx}`} className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">{category}: {c.model}</span>
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
                                    By confirming, your order will be processed and stock will be reserved for you.
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1" onClick={() => setIsCheckoutDialogOpen(false)}>Cancel</Button>
                                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={handleCheckout} disabled={isCheckingOut}>
                                    {isCheckingOut ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Confirm Purchase
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardFooter>
        </Card >
    )
}
