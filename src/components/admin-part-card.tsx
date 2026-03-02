'use client';

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import type { Part } from '@/lib/types';
import { Trash2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
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

export function AdminPartCard({ part, onDelete, onUpdateStock }: AdminPartCardProps) {
    const specKeys = categorySpecsMap[part.category] || Object.keys(part.specifications || {}).slice(0, 4);

    return (
        <TooltipProvider>
            <Card className={cn(
                "flex flex-col justify-between h-full transform transition-all duration-300 ease-in-out hover:-translate-y-1 relative group overflow-hidden border-border/50",
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
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors -mt-1 -mr-1">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete {part.name}.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => onDelete(part.id, part.category)}
                                        className="bg-destructive hover:bg-destructive/90"
                                    >
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>

                    <div className="aspect-video relative w-full overflow-hidden rounded-lg bg-muted/30">
                        <Image
                            src={part.imageUrl}
                            alt={part.name}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    </div>

                    <div className="flex justify-between items-center py-1">
                        <p className="text-xl font-bold font-headline tracking-tight">{formatCurrency(part.price)}</p>
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
                                    <div className="text-[10px] font-semibold text-right col-span-1">{part.stock}</div>
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

                <div className="mt-auto p-3 pt-0 z-10">
                    <StockEditor
                        stock={part.stock}
                        onStockChange={(newStock) => onUpdateStock(part.id, part.category, newStock)}
                    />
                </div>
            </Card>
        </TooltipProvider>
    );
}