
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
                    "flex flex-col justify-between h-full transform transition-all duration-500 ease-out hover:-translate-y-2 relative group overflow-hidden border-primary/10 hover:border-primary/40 bg-background/40 backdrop-blur-xl shadow-lg hover:shadow-primary/20 cursor-pointer rounded-3xl",
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

                    <div className="p-2 md:p-2.5 pb-0 space-y-1.5 md:space-y-2.5 z-10 flex-grow flex flex-col">
                        <div className="space-y-0.5 md:space-y-1">
                            <div className="flex items-center gap-1.5 md:gap-2">
                                <div className="h-px w-2 md:w-3 bg-primary/40" />
                                <p className="text-[7px] md:text-[9px] text-muted-foreground uppercase tracking-[0.2em] font-black">{part.brand}</p>
                            </div>
                            <CardTitle className="text-xs md:text-lg font-headline font-black uppercase tracking-tight leading-[1.1] line-clamp-2 h-8 md:h-10 group-hover:text-primary transition-colors">{part.name}</CardTitle>
                        </div>

                        <div className="aspect-square relative w-full overflow-hidden rounded-2xl bg-slate-900/5 dark:bg-white/5 border border-white/5 p-4 group-hover:bg-primary/[0.03] transition-colors duration-500">
                            <Image
                                src={getOptimizedStorageUrl(part.imageUrl) || '/placeholder-part.png'}
                                alt={part.name}
                                fill
                                unoptimized
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-contain transition-transform duration-700 group-hover:scale-110"
                            />
                        </div>

                        <div className="flex justify-between items-end py-0.5 md:py-1">
                            <div className="flex flex-col">
                                <p className="text-[7px] md:text-[9px] text-muted-foreground uppercase font-black tracking-widest mb-0.5 md:mb-1">MSRP VALUE</p>
                                <p className="text-sm md:text-2xl font-black font-headline tracking-tighter text-primary leading-none">{formatCurrency(part.price)}</p>
                                {part.usdSrp && (
                                    <p className="text-[9px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-tight mt-1 opacity-70">
                                        EST. {formatToPHP(part.usdSrp)}
                                    </p>
                                )}
                            </div>
                            <div className="h-6 w-6 md:h-8 md:w-8 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10 group-hover:border-primary/30 transition-colors">
                                <Info className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                            </div>
                        </div>

                        <Separator className="bg-border/40" />

                        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 md:gap-x-3 md:gap-y-2.5 py-0.5 md:py-1">
                            {specKeys.map((key) => {
                                const value = part.specifications?.[key] || (key === 'Wattage' ? part.wattage : null);
                                return (
                                    <div key={key} className="min-w-0 group/spec">
                                        <p className="text-[6px] md:text-[8px] text-muted-foreground uppercase font-black tracking-[0.1em] mb-0.5 group-hover/spec:text-primary transition-colors">{key}</p>
                                        <p className="font-bold text-[8px] md:text-[11px] truncate leading-none uppercase tracking-tight" title={String(value || 'N/A')}>{String(value || 'N/A')}</p>
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
                                "w-full rounded-none h-9 md:h-12 mt-auto z-[41] transition-all duration-300 font-headline uppercase tracking-[0.2em] border-t text-[8px] md:text-[11px]",
                                isSelected
                                    ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                                    : "bg-primary/5 hover:bg-primary/10 text-primary border-border/50 hover:border-primary/30"
                            )}
                            variant="ghost"
                        >
                            {isSelected ? (
                                <div className="flex items-center gap-1.5 md:gap-2">
                                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-white animate-pulse" />
                                    <span>Added</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 md:gap-2">
                                    <Plus className="h-3 w-3 md:h-4 md:w-4" />
                                    <span>Sync Rig</span>
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
