
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { ComponentData } from "@/lib/types";
import { Cpu, Server, CircuitBoard, MemoryStick, HardDrive, Power, RectangleVertical as CaseIcon, Wind, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";

interface YourBuildProps {
    build: Record<string, ComponentData | ComponentData[] | null>;
}

function RadialGauge({ value, max, size = 120, strokeWidth = 10 }: { value: number; max: number; size?: number; strokeWidth?: number }) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const maxToUse = max > 0 ? max : Math.max(value + 200, 600); // 600W baseline or 200W headroom
    const clampedValue = Math.min(Math.max(value, 0), maxToUse);
    const percentage = clampedValue / maxToUse;
    const strokeDashoffset = circumference - percentage * circumference;

    let color = 'text-emerald-500';
    if (percentage > 0.9) color = 'text-red-500';
    else if (percentage > 0.7) color = 'text-amber-500';

    return (
        <div className="relative flex items-center justify-center flex-col" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90 origin-center drop-shadow-md">
                {/* Background track */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    className="text-muted/20"
                />
                {/* Fill track */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className={`transition-all duration-1000 ease-out drop-shadow-lg ${color}`}
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-bold font-headline leading-none mb-1">{value}<span className="text-sm font-medium">W</span></span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                    {max > 0 ? `/ ${max}W PSU` : 'Estimated'}
                </span>
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

export function YourBuild({ build }: YourBuildProps) {
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
        <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-headline">Your Build</CardTitle>
                <Badge variant="secondary">{selectedParts} / {totalParts} Parts</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
                {Object.entries(build).map(([name, component]) => {
                    const Icon = componentIcons[name];
                    const components = Array.isArray(component) ? component : (component ? [component] : []);

                    if (components.length === 0) {
                        return (
                            <div key={name} className="flex items-center gap-4">
                                <div className="p-2 bg-muted rounded-md">
                                    <Icon className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-sm">{name}</p>
                                    <p className="text-xs text-muted-foreground">Not selected</p>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div key={name} className="space-y-2">
                            {components.map((c, idx) => (
                                <div key={`${name}-${idx}`} className="flex items-center gap-4">
                                    <div className="p-2 bg-muted rounded-md">
                                        <Icon className="w-6 h-6 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm">{name === 'Storage' && components.length > 1 ? `${name} ${idx + 1}` : name}</p>
                                        <p className="text-xs text-muted-foreground">{c.model}</p>
                                    </div>
                                    {typeof c.wattage === 'number' && (name === 'CPU' || name === 'GPU' || name === 'Storage') && (
                                        <p className="text-xs font-semibold text-muted-foreground">
                                            {`~${c.wattage}W`}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )
                })}

                <Separator className="mt-4" />

                <div className="flex flex-col items-center gap-2 py-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider w-full text-left">Power Consumption</p>
                    <RadialGauge value={totalWattage} max={psuWattage} size={140} strokeWidth={12} />
                </div>

                <Separator />

                <div className="flex justify-between items-center py-2">
                    <p className="text-muted-foreground">Estimated Total</p>
                    <p className="text-2xl font-bold font-headline">{formatCurrency(totalPrice)}</p>
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
                <Button className="w-full" size="lg" disabled={selectedParts === 0}>Checkout Build</Button>
            </CardFooter>
        </Card >
    )
}
