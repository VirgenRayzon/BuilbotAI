
"use client";

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
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
        // Prevent adding out of stock items, but allow removing them
        if (currentStock === 0 && !isSelected) return;
        onToggleBuild(part);
    }

    const mainSpecs = Object.entries(part.specifications).slice(0, 4);

    return (
        <TooltipProvider>
            <Card className={cn(
                "flex flex-col justify-between h-full transform transition-transform duration-300 ease-in-out hover:-translate-y-1 relative group",
                currentStock === 0 && "grayscale opacity-60"
            )}>
                <div className={cn(
                    "absolute inset-0 bg-gradient-to-t from-black/20 to-transparent transition-opacity duration-300 opacity-0 group-hover:opacity-100",
                    isSelected && "opacity-100"
                )} />
                <CardHeader className="p-4 relative">
                    <div className="flex justify-between items-start pr-10">
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">{part.brand}</p>
                            <CardTitle className="text-lg font-headline leading-tight">{part.name}</CardTitle>
                        </div>
                        {compatibility && !compatibility.compatible && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Badge variant="destructive" className="flex items-center gap-1 cursor-help">
                                        <AlertTriangle className="h-3 w-3" />
                                        <span>Incompatible</span>
                                    </Badge>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                    <p className="text-xs">{compatibility.message}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                    <Button
                        size="icon"
                        onClick={handleToggle}
                        disabled={currentStock === 0 && !isSelected}
                        variant={isSelected ? 'destructive' : 'default'}
                        className="absolute top-4 right-4 h-8 w-8 rounded-full z-20"
                    >
                        {isSelected ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </Button>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex-grow flex flex-col z-10">
                    <div className="aspect-video relative w-full overflow-hidden rounded-md mb-4">
                        <Image
                            src={part.imageUrl}
                            alt={part.name}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    </div>
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-2xl font-bold font-headline">{formatCurrency(part.price)}</p>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                    <Info className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" align="end" className="z-50">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 p-2 max-w-xs">
                                    {Object.entries(part.specifications).map(([key, value]) => (
                                        <React.Fragment key={key}>
                                            <div className="text-xs text-muted-foreground uppercase">{key}</div>
                                            <div className="text-xs font-semibold text-right truncate" title={String(value)}>{String(value)}</div>
                                        </React.Fragment>
                                    ))}
                                    {part.wattage && (
                                        <>
                                            <div className="text-xs text-muted-foreground uppercase">Wattage</div>
                                            <div className="text-xs font-semibold text-right">{part.wattage}W</div>
                                        </>
                                    )}
                                    <React.Fragment>
                                        <div className="text-xs text-muted-foreground uppercase">Stock</div>
                                        <div className="text-xs font-semibold text-right">{currentStock > 0 ? currentStock : 'Out of stock'}</div>
                                    </React.Fragment>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 flex-grow content-start">
                        {mainSpecs.map(([key, value]) => (
                            <div key={key} className="min-w-0">
                                <p className="text-xs text-muted-foreground uppercase">{key}</p>
                                <p className="font-semibold text-sm truncate" title={String(value)}>{String(value)}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </TooltipProvider>
    );
}
