'use client';

import { AddPartDialog, type AddPartFormSchema } from './add-part-dialog';

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import type { Part } from '@/lib/types';
import { Trash2, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
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
import { StockEditor } from './stock-editor';
import { Separator } from '@/components/ui/separator';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import React from 'react';

interface AdminPartCardProps {
    part: Part;
    onDelete: (partId: string, category: Part['category']) => void;
    onUpdateStock: (partId: string, category: Part['category'], newStock: number) => void;
    onUpdatePart: (partId: string, category: Part['category'], data: AddPartFormSchema) => Promise<void>;
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

export function AdminPartCard({ part, onDelete, onUpdateStock, onUpdatePart }: AdminPartCardProps) {
    const specKeys = categorySpecsMap[part.category] || Object.keys(part.specifications || {}).slice(0, 4);

    return (
        <TooltipProvider>
            <AddPartDialog
                initialData={part}
                onSave={(data) => onUpdatePart(part.id, part.category, data)}
            >
                <Card className={cn(
                    "flex flex-col justify-between h-full transform transition-all duration-500 ease-out hover:-translate-y-2 relative group overflow-hidden border-primary/10 hover:border-primary/40 bg-background/40 backdrop-blur-xl shadow-lg hover:shadow-primary/10 cursor-pointer",
                    part.stock === 0 && "grayscale opacity-60"
                )}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent transition-opacity duration-300 opacity-0 group-hover:opacity-100" />

                    <div className="p-3.5 pb-0 space-y-2.5 z-10 flex-grow flex flex-col">
                        <div className="flex justify-between items-start gap-2">
                            <div className="space-y-0.5 flex-grow">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{part.brand}</p>
                                <CardTitle className="text-base font-headline leading-snug line-clamp-2 h-10">{part.name}</CardTitle>
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => e.stopPropagation()}
                                        className="h-8 w-8 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors -mt-1 -mr-1"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete {part.name}.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(part.id, part.category);
                                            }}
                                            className="bg-destructive hover:bg-destructive/90"
                                        >
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>

                        <div className="aspect-square relative w-full overflow-hidden rounded-lg bg-muted/10 border border-white/5 p-2">
                            <Image
                                src={part.imageUrl || '/placeholder-part.png'}
                                alt={part.name}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-contain transition-transform duration-500 group-hover:scale-105"
                            />
                        </div>

                        <div className="flex justify-between items-center py-1">
                            <p className="text-xl font-bold font-headline tracking-tight">{formatCurrency(part.price)}</p>
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

                    <div className="mt-auto p-3 pt-0 z-20" onClick={(e) => e.stopPropagation()}>
                        <StockEditor
                            stock={part.stock}
                            onStockChange={(newStock) => onUpdateStock(part.id, part.category, newStock)}
                        />
                    </div>
                </Card>
            </AddPartDialog>
        </TooltipProvider>
    );
}