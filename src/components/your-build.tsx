
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { ComponentData } from "@/lib/types";
import { Cpu, Server, CircuitBoard, MemoryStick, HardDrive, Power, RectangleVertical as CaseIcon, Wind, AlertCircle, X as CloseIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";

import Link from "next/link";

interface YourBuildProps {
    build: Record<string, ComponentData | ComponentData[] | null>;
    onClearBuild: () => void;
    onRemovePart: (category: string, index?: number) => void;
    hideReviewButton?: boolean;
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

const componentIcons: { [key: string]: React.ElementType } = {
    CPU: Cpu,
    GPU: Server,
    Motherboard: CircuitBoard,
    RAM: MemoryStick,
    Storage: HardDrive,
    PSU: Power,
    Case: CaseIcon,
    Cooler: Wind,
};

export function YourBuild({ build, onClearBuild, onRemovePart, hideReviewButton }: YourBuildProps) {
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
        <Card className="flex flex-col border-primary/20 shadow-2xl overflow-hidden ring-1 ring-primary/5">
            <CardHeader className="flex flex-row items-center justify-between py-5 bg-muted/40 border-b">
                <CardTitle className="font-headline text-xl">Your Build</CardTitle>
                <Badge variant="secondary" className="font-mono text-xs px-2 py-0.5">{selectedParts}/{totalParts} PARTS</Badge>
            </CardHeader>
            <CardContent className="px-5 py-4 space-y-3">
                {Object.entries(build).map(([name, component]) => {
                    const Icon = componentIcons[name];
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

                <div className="pt-2">
                    <Separator className="mb-3 opacity-50" />
                    <PowerMeter value={totalWattage} max={psuWattage} />
                </div>

                <div className="flex justify-between items-center pt-3 mt-2 border-t border-dashed">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Total Cost</span>
                    <span className="text-2xl font-bold font-headline text-primary">{formatCurrency(totalPrice)}</span>
                </div>
            </CardContent>
            <CardFooter className="flex-col items-stretch gap-4">
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
                    {!hideReviewButton && (
                        <Button className="w-full" size="lg" disabled={selectedParts === 0} asChild>
                            <Link href="/ai-build-advisor">Review with Build Advisor</Link>
                        </Button>
                    )}
                    <Button variant="outline" className="w-full" onClick={onClearBuild} disabled={selectedParts === 0}>
                        Clear Build
                    </Button>
                </div>
            </CardFooter>
        </Card >
    )
}
