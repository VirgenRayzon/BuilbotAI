
"use client";

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatToPHP, getOptimizedStorageUrl } from '@/lib/utils';
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

import { PartDetailsDialog } from './part-details-dialog';

export function PartCard({ part, onToggleBuild, isSelected, compatibility, effectiveStock }: PartCardProps) {
    const currentStock = effectiveStock !== undefined ? effectiveStock : part.stock;

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (currentStock === 0 && !isSelected) return;
        onToggleBuild(part);
    }

    const specKeys = (categorySpecsMap[part.category] || Object.keys(part.specifications || {})).slice(0, 2);

    return (
        <TooltipProvider>
            <PartDetailsDialog 
                part={part} 
                isAdded={isSelected} 
                onToggle={() => {
                    if (currentStock === 0 && !isSelected) return;
                    onToggleBuild(part);
                }}
                isDisabled={(!compatibility || !compatibility.compatible) && !isSelected}
            >
                <Card className={cn(
                    "flex flex-col justify-between h-full transform transition-all duration-500 ease-out hover:-translate-y-2 relative group overflow-hidden border-primary/10 hover:border-primary/40 bg-background/40 backdrop-blur-xl shadow-lg hover:shadow-primary/10 cursor-pointer",
                    (currentStock === 0 || (compatibility && !compatibility.compatible)) && "grayscale opacity-60"
                )}>
                    {/* --- Incompatibility Overlay --- */}
                    {compatibility && !compatibility.compatible && (() => {
                        const isSlotFull = compatibility.message.toLowerCase().includes('slot is full');
                        const theme = isSlotFull 
                            ? { 
                                bg: "bg-amber-500/20", 
                                border: "border-amber-500/50", 
                                text: "text-amber-500", 
                                shadow: "shadow-[0_0_30px_rgba(245,158,11,0.2)]",
                                ring: "ring-amber-500/20",
                                title: "SLOTS FULL!"
                              }
                            : { 
                                bg: "bg-destructive/20", 
                                border: "border-destructive/50", 
                                text: "text-destructive", 
                                shadow: "shadow-[0_0_30px_rgba(239,68,68,0.2)]",
                                ring: "ring-destructive/20",
                                title: "INCOMPATIBLE"
                              };

                        return (
                            <div className={cn(
                                "absolute inset-0 z-30 bg-background/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-300 border-2 ring-4 ring-inset",
                                theme.border,
                                theme.ring
                            )}>
                                <div className={cn("p-5 rounded-full mb-5 border-2 shadow-2xl transition-transform duration-700 animate-pulse", theme.bg, theme.border, theme.shadow)}>
                                    <AlertTriangle className={cn("h-12 w-12 scale-110 drop-shadow-2xl", theme.text)} />
                                </div>
                                <h3 className={cn("text-3xl font-headline font-black tracking-tighter mb-3 drop-shadow-md leading-none uppercase", theme.text)}>
                                    {theme.title}
                                </h3>
                                <p className="text-sm font-bold text-foreground leading-relaxed max-w-[220px] drop-shadow-sm uppercase tracking-tight">
                                    {compatibility.message}
                                </p>
                            </div>
                        );
                    })()}

                    <div className={cn(
                        "absolute inset-0 bg-gradient-to-t from-black/5 to-transparent transition-opacity duration-300 opacity-0 group-hover:opacity-100",
                        isSelected && "opacity-100"
                    )} />

                    <div className="p-2.5 pb-0 space-y-2.5 z-10 flex-grow flex flex-col">
                        <div className="space-y-0.5">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{part.brand}</p>
                            <CardTitle className="text-base font-headline leading-snug line-clamp-2 h-10">{part.name}</CardTitle>
                        </div>

                        <div className="aspect-square relative w-full overflow-hidden rounded-lg bg-muted/10 border border-white/5 p-2">
                            <Image
                                src={getOptimizedStorageUrl(part.imageUrl) || '/placeholder-part.png'}
                                alt={part.name}
                                fill
                                unoptimized
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-contain transition-transform duration-500 group-hover:scale-105"
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
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/60 hover:text-primary transition-colors">
                                <Info className="h-4 w-4" />
                            </Button>
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
            </PartDetailsDialog>
        </TooltipProvider>
    );
}

const categorySpecsMap: Record<string, string[]> = {
    CPU: ["Socket", "Cores"],
    GPU: ["VRAM Capacity", "Memory Type"],
    Motherboard: ["Socket", "Form Factor"],
    RAM: ["Type", "Capacity"],
    Storage: ["Type", "Capacity"],
    PSU: ["Wattage (W)", "Efficiency Rating"],
    Case: ["Type", "Mobo Support"],
    Cooler: ["Type", "Radiator Size"],
    Monitor: ["Size", "Resolution"],
    Keyboard: ["Type", "Switches"],
    Mouse: ["DPI", "Sensor"],
    Headset: ["Type", "Drivers"],
};
