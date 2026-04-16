
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
                    {compatibility && !compatibility.compatible && (
                        <div className="absolute inset-0 z-30 bg-background/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-300 border-2 border-destructive/50 ring-2 ring-destructive/20 ring-inset">
                            <div className="bg-destructive/20 p-4 rounded-full mb-4 border-2 border-destructive/50 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                                <AlertTriangle className="h-10 w-10 text-destructive scale-110 drop-shadow-lg animate-pulse" />
                            </div>
                            <h3 className="text-2xl font-headline font-black text-destructive tracking-tighter mb-2 drop-shadow-md leading-none">
                                {compatibility.message.toLowerCase().includes('slot is full') ? 'SLOTS FULL!' : 'INCOMPATIBLE'}
                            </h3>
                            <p className="text-xs font-bold text-foreground/90 leading-relaxed max-w-[200px] drop-shadow-sm mb-4 uppercase tracking-tight">
                                {compatibility.message}
                            </p>
                            <Badge variant="destructive" className="font-black animate-bounce px-4 py-1.5 shadow-lg">
                                ACTION REQUIRED
                            </Badge>
                        </div>
                    )}

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
