/**
 * InventoryPartCard — Grid-view card for a single inventory part in the admin dashboard.
 * Shows image, specs, stock, price, and provides archive/delete/edit actions with tooltips.
 */
'use client';

import { AddPartDialog } from './add-part-dialog';
import { type AddPartFormSchema } from '@/hooks/use-part-form';
import { OptimizedImage } from './ui/optimized-image';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, getOptimizedStorageUrl } from '@/lib/utils';
import type { Part } from '@/lib/types';
import { Trash2, Archive, RotateCcw, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useSiteSettings } from '@/context/site-settings-context';
import { AddStockDialog } from './add-stock-dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from '@/components/ui/separator';
import { TooltipProvider } from "@/components/ui/tooltip";
import React from 'react';

interface InventoryPartCardProps {
    part: Part;
    priority?: boolean;
    imageSizes?: string;
    onDelete: (partId: string, category: Part['category']) => void;
    onArchive: (partId: string, category: Part['category'], isArchived?: boolean) => void;
    onUpdateStock: (partId: string, category: Part['category'], newStock: number) => void;
    onAddStock?: (partId: string, category: Part['category'], amount: number) => Promise<void> | void;
    onUpdatePart: (partId: string, category: Part['category'], data: AddPartFormSchema) => Promise<void>;
    isSelected?: boolean;
    onToggleSelection?: (id: string, category: Part['category']) => void;
    isSelectionMode?: boolean;
    isSuperAdmin?: boolean;
    isArchiveView?: boolean;
}

const categorySpecsMap: Record<string, string[]> = {
    CPU: ["Socket", "Cores", "Threads", "Wattage"],
    GPU: ["VRAM Capacity", "Memory Type", "CUDA Cores"],
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

export function InventoryPartCard({
    part,
    priority = false,
    imageSizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
    onDelete,
    onArchive,
    onUpdateStock,
    onAddStock,
    onUpdatePart,
    isSelected = false,
    onToggleSelection = () => { },
    isSelectionMode = false,
    isSuperAdmin = false,
    isArchiveView = false
}: InventoryPartCardProps) {
    const { shouldCorruptImages } = useSiteSettings();
    const specKeys = categorySpecsMap[part.category] || Object.keys(part.specifications || {}).slice(0, 4);
    const isOutOfStock = part.stock <= 0;

    return (
        <TooltipProvider>
            <div className="relative group/card-wrapper h-full">
                <Card
                    className={cn(
                        "flex flex-col justify-between h-full transform transition-all duration-500 ease-out relative group overflow-hidden border-primary/10 bg-background/40 backdrop-blur-xl shadow-lg cursor-pointer",
                        isOutOfStock && "border-yellow-500/60 dark:border-yellow-400/60 bg-yellow-50/50 dark:!bg-black/30 shadow-sm shadow-yellow-500/10 dark:shadow-black/30 hover:border-yellow-500/80 dark:hover:border-yellow-400/80",
                        isSelected ? "border-primary border-2 shadow-primary/20 bg-primary/[0.05] -translate-y-2" : "hover:-translate-y-2 hover:shadow-primary/10 hover:border-primary/40",
                    )}
                    onClick={() => {
                        if (isSelectionMode) {
                            onToggleSelection(part.id, part.category);
                        }
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent transition-opacity duration-300 opacity-0 group-hover:opacity-100" />
                    {isSelected && (
                        <div className="absolute top-3 left-3 z-30 p-1 rounded-md bg-primary text-primary-foreground shadow-lg animate-in zoom-in-50 duration-200">
                            <Check className="h-4 w-4 stroke-[3px]" />
                        </div>
                    )}

                    <div className="p-2 md:p-3.5 pb-0 space-y-1.5 md:space-y-2.5 z-10 flex-grow flex flex-col">
                        <div className="flex justify-between items-start gap-2">
                            <div className={cn("space-y-0.5 flex-grow", isSelected && "pl-5")}>
                                <p className="text-[8px] md:text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{part.brand}</p>
                                <div className="h-10 md:h-12 flex flex-col justify-center overflow-hidden">
                                    <CardTitle className="text-xs md:text-base font-headline leading-snug line-clamp-2 m-0 p-0">
                                        {part.name.length > 60 ? `${part.name.substring(0, 57)}...` : part.name}
                                    </CardTitle>
                                </div>
                            </div>
                            <div className="flex items-start gap-1">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground/40 hover:text-primary hover:bg-primary/10 transition-colors -mt-1" onClick={(event) => event.stopPropagation()} title={isArchiveView ? "Restore" : "Archive"}>
                                            {isArchiveView ? <RotateCcw className="h-3 w-3 md:h-4 md:w-4" /> : <Archive className="h-3 w-3 md:h-4 md:w-4" />}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent onClick={(event) => event.stopPropagation()}>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>{isArchiveView ? "Restore Part?" : "Archive Part?"}</AlertDialogTitle>
                                            <AlertDialogDescription>{isArchiveView ? `This will restore ${part.name} to the active inventory.` : `This will move ${part.name} to the archive. It will no longer be visible to customers.`}</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel onClick={(event) => event.stopPropagation()}>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={(event) => { event.stopPropagation(); onArchive(part.id, part.category, !isArchiveView); }} className={isArchiveView ? "bg-primary hover:bg-primary/90" : "bg-orange-500 hover:bg-orange-600"}>{isArchiveView ? "Restore" : "Archive"}</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>

                                {isSuperAdmin && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" onClick={(event) => event.stopPropagation()} className="h-8 w-8 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors -mt-1 -mr-1">
                                                <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent onClick={(event) => event.stopPropagation()}>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>This action cannot be undone. This will permanently delete {part.name}.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel onClick={(event) => event.stopPropagation()}>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={(event) => { event.stopPropagation(); onDelete(part.id, part.category); }} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </div>
                        </div>

                        {isSelectionMode ? (
                            <div className={cn("aspect-square relative -mx-2 md:-mx-3.5 w-auto overflow-hidden border-y p-2 cursor-pointer", isOutOfStock ? "bg-transparent border-yellow-500/30 dark:border-yellow-400/20" : "bg-white border-slate-200")}>
                                <OptimizedImage src={getOptimizedStorageUrl(part.imageUrl, shouldCorruptImages) || '/placeholder-part.png'} alt={part.name} fill priority={priority} sizes={imageSizes} className="object-contain transition-transform duration-500" />
                            </div>
                        ) : (
                            <AddPartDialog initialData={part} onSave={(data) => onUpdatePart(part.id, part.category, data)}>
                                <div className={cn("aspect-square relative -mx-2 md:-mx-3.5 w-auto overflow-hidden border-y p-2 cursor-pointer", isOutOfStock ? "bg-transparent border-yellow-500/30 dark:border-yellow-400/20" : "bg-white border-slate-200")}>
                                    <OptimizedImage src={getOptimizedStorageUrl(part.imageUrl, shouldCorruptImages) || '/placeholder-part.png'} alt={part.name} fill priority={priority} sizes={imageSizes} className="object-contain transition-transform duration-500" />
                                </div>
                            </AddPartDialog>
                        )}

                        <div className="flex justify-between items-center gap-2">
                            <p className="text-sm md:text-xl font-bold font-headline tracking-tight">{formatCurrency(part.price)}</p>
                            <Badge variant={part.stock > 0 ? "outline" : "destructive"} className={cn("text-[9px] md:text-[11px] font-mono font-bold px-2 py-0.5 shrink-0", part.stock > 5 ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" : part.stock > 0 ? "border-amber-500/30 text-amber-400 bg-amber-500/10" : "border-yellow-500/40 text-yellow-500 bg-yellow-500/10")}>{part.stock > 0 ? `${part.stock} in stock` : 'Out of stock'}</Badge>
                        </div>

                        <Separator className={isOutOfStock ? "bg-yellow-500/20" : "bg-border/40"} />

                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 md:gap-x-3 md:gap-y-1.5 py-0.5">
                            {specKeys.map((key) => {
                                const value = part.specifications?.[key] || (key === 'Wattage' ? part.wattage : null);
                                return (
                                    <div key={key} className="min-w-0">
                                        <p className="text-[7px] md:text-[9px] text-muted-foreground uppercase font-bold tracking-tight mb-0">{key}</p>
                                        <p className="font-bold text-[9px] md:text-[11px] truncate leading-none uppercase" title={String(value || 'N/A')}>{String(value || 'N/A')}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-auto p-2 md:p-3 pt-0 z-20" onClick={(event) => event.stopPropagation()}>
                        <AddStockDialog part={part} onAddStock={onAddStock || ((id, category, amount) => onUpdateStock(id, category, part.stock + amount))}>
                            <Button variant="outline" size="sm" className={cn("w-full h-8 md:h-9 text-xs md:text-sm font-semibold transition-all gap-1.5 shadow-sm", isOutOfStock ? "border-yellow-500/30 hover:border-yellow-500/60 hover:bg-yellow-500/10" : "border-primary/20 hover:border-primary/50 hover:bg-primary/10")}>
                                <span>Edit Stock</span>
                            </Button>
                        </AddStockDialog>
                    </div>
                </Card>
            </div>
        </TooltipProvider>
    );
}
