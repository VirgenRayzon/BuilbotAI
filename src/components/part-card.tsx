
"use client";

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatToPHP } from '@/lib/utils';
import type { Part } from '@/lib/types';
import { Plus, Info, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import React from 'react';

interface PartCardProps {
    part: Part;
    onToggleBuild: (part: Part) => void;
    isSelected: boolean;
    compatibility?: { compatible: boolean; message: string };
    effectiveStock?: number;
}

export function PartCard({ part, onToggleBuild, isSelected, compatibility, effectiveStock }: PartCardProps) {
    const currentStock = effectiveStock !== undefined ? effectiveStock : part.stock;

    const handleToggle = () => {
        if (currentStock === 0 && !isSelected) return;
        onToggleBuild(part);
    }

    const specKeys = categorySpecsMap[part.category] || Object.keys(part.specifications || {}).slice(0, 4);

    return (
        <TooltipProvider>
            <Card className={cn(
                "flex flex-col justify-between h-full transform transition-all duration-300 ease-in-out hover:-translate-y-1 relative group overflow-hidden border-border/50",
                currentStock === 0 && "grayscale opacity-60"
            )}>
                {/* --- Incompatibility Overlay --- */}
                {compatibility && !compatibility.compatible && (
                    <div className="absolute inset-0 z-30 bg-destructive/85 backdrop-blur-[3px] flex flex-col items-center justify-center p-4 text-center animate-in fade-in zoom-in-95 duration-300">
                        <div className="bg-white/10 p-2.5 rounded-full mb-3 border border-white/20">
                            <AlertTriangle className="h-7 w-7 text-white scale-110 drop-shadow-lg" />
                        </div>
                        <h3 className="text-lg font-headline font-black text-white tracking-tighter mb-1.5 drop-shadow-md">
                            WARNING: PART MISMATCH!
                        </h3>
                        <p className="text-xs font-semibold text-white/90 leading-tight max-w-[180px] drop-shadow-sm mb-4">
                            {compatibility.message}
                        </p>
                        <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/60">
                            Selection must be updated
                        </p>
                    </div>
                )}

                <div className={cn(
                    "absolute inset-0 bg-gradient-to-t from-black/5 to-transparent transition-opacity duration-300 opacity-0 group-hover:opacity-100",
                    isSelected && "opacity-100"
                )} />

                <div className="p-3.5 pb-0 space-y-2.5 z-10 flex-grow flex flex-col">
                    <div className="space-y-0.5">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{part.brand}</p>
                        <CardTitle className="text-base font-headline leading-snug line-clamp-2 h-10">{part.name}</CardTitle>
                    </div>

                    <div className="aspect-video relative w-full overflow-hidden rounded-lg bg-muted/30">
                        <Image
                            src={part.imageUrl || '/placeholder-part.png'}
                            alt={part.name}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    </div>

                    <div className="flex justify-between items-center py-1">
                        <div className="flex flex-col">
                            <p className="text-xl font-bold font-headline tracking-tight">{formatCurrency(part.price)}</p>
                            {part.usdSrp && (
                                <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                                    ~{formatToPHP(part.usdSrp)} local est.
                                </p>
                            )}
                        </div>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/60 hover:text-primary transition-colors">
                                    <Info className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" align="end" className="z-50 p-0 border-none shadow-2xl">
                                <div className="grid grid-cols-2 gap-x-6 gap-y-2 p-3 bg-card rounded-lg min-w-[200px]">
                                    {Object.entries(part.specifications || {}).map(([key, value]) => (
                                        <React.Fragment key={key}>
                                            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">{key}</div>
                                            <div className="text-[10px] font-semibold text-right truncate" title={String(value)}>{String(value)}</div>
                                        </React.Fragment>
                                    ))}
                                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter col-span-1">Stock</div>
                                    <div className="text-[10px] font-semibold text-right col-span-1">{currentStock > 0 ? currentStock : 'Out of stock'}</div>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </div>

                    <Separator className="bg-border/40" />

                    <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 py-1">
                        {specKeys.map((key) => {
                            const value = part.specifications?.[key] || (key === 'Wattage' ? part.wattage : null);
                            return (
                                <div key={key} className="min-w-0">
                                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tight mb-0.5">{key}</p>
                                    <p className="font-bold text-[11px] truncate leading-none uppercase" title={String(value || 'N/A')}>{String(value || 'N/A')}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* --- Bottom Action Button --- */}
                {(!compatibility || compatibility.compatible || isSelected) && (
                    <Button
                        onClick={handleToggle}
                        disabled={(currentStock === 0 && !isSelected)}
                        className={cn(
                            "w-full rounded-none h-10 mt-auto z-[41] transition-all duration-300 font-bold text-xs uppercase tracking-widest border-t",
                            isSelected
                                ? "bg-green-600 hover:bg-green-700 text-white border-green-700/50"
                                : "bg-primary/5 hover:bg-primary/10 text-primary border-border/50 hover:border-primary/20"
                        )}
                        variant="ghost"
                    >
                        {isSelected ? (
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4" />
                                <span>Added</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                <span>Add to Build</span>
                            </div>
                        )}
                    </Button>
                )}
            </Card>
        </TooltipProvider>
    );
}

const categorySpecsMap: Record<string, string[]> = {
    CPU: ["Socket", "Cores", "Threads", "Wattage"],
    GPU: ["VRAM Capacity", "Memory Type", "Bus Width", "CUDA Cores"],
    Motherboard: ["Socket", "Form Factor", "Chipset", "Memory Type"],
    RAM: ["Type", "Capacity", "Speed", "CAS Latency"],
    Storage: ["Type", "Capacity", "Interface", "Form Factor"],
    PSU: ["Wattage (W)", "Efficiency Rating", "Form Factor", "Modularity"],
    Case: ["Type", "Mobo Support", "Max GPU Length", "Max Radiator Size (mm)"],
    Cooler: ["Type", "Socket Support", "Radiator Size", "Fan Speed"],
    Monitor: ["Size", "Resolution", "Refresh Rate", "Panel Type"],
    Keyboard: ["Type", "Switches", "Layout", "Connectivity"],
    Mouse: ["DPI", "Sensor", "Type", "Connectivity"],
    Headset: ["Type", "Drivers", "Mic", "Connectivity"],
};
