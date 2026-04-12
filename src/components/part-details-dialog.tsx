"use client";

import Image from "next/image";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatToPHP, getOptimizedStorageUrl } from "@/lib/utils";
import type { Part } from "@/lib/types";
import { Cpu, Server, CircuitBoard, MemoryStick, Database, Power, RectangleVertical, Wind, Monitor, Keyboard, Mouse, Headphones, Info, Plus, CheckCircle2 } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import React from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface PartDetailsDialogProps {
    part: Part;
    children: React.ReactNode;
    isAdded?: boolean;
    onToggle?: () => void;
    isDisabled?: boolean;
}

const iconMap: Record<string, any> = {
    CPU: Cpu,
    GPU: Server,
    Motherboard: CircuitBoard,
    RAM: MemoryStick,
    Storage: Database,
    PSU: Power,
    Case: RectangleVertical,
    Cooler: Wind,
    Monitor: Monitor,
    Keyboard: Keyboard,
    Mouse: Mouse,
    Headset: Headphones,
};

export function PartDetailsDialog({ part, children, isAdded, onToggle, isDisabled }: PartDetailsDialogProps) {
    const Icon = iconMap[part.category] || Info;

    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-screen-2xl p-0 gap-0 overflow-hidden bg-background/95 backdrop-blur-xl border-primary/20 shadow-2xl">
                <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
                    {/* Image Section */}
                    <div className="w-full md:w-[40%] flex flex-col bg-muted/30 relative">
                        <div className="flex-1 relative aspect-square md:aspect-auto">
                            <Image
                                src={getOptimizedStorageUrl(part.imageUrl) || "/placeholder-part.png"}
                                alt={part.name}
                                fill
                                unoptimized
                                className="object-contain p-8"
                                sizes="(max-width: 768px) 100vw, 40vw"
                            />
                            <div className="absolute top-4 left-4">
                                <Badge variant="secondary" className="bg-background/80 backdrop-blur-md border-primary/20 text-primary px-3 py-1 font-headline font-bold uppercase tracking-wider text-xs">
                                    {part.category}
                                </Badge>
                            </div>
                        </div>

                        {onToggle && (
                            <div className="p-6 md:p-8 bg-background/40 backdrop-blur-sm border-t border-primary/10">
                                <Button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onToggle();
                                    }}
                                    disabled={isDisabled || (part.stock === 0 && !isAdded)}
                                    className={cn(
                                        "w-full h-14 rounded-xl font-bold uppercase tracking-widest transition-all duration-300 shadow-lg",
                                        isAdded
                                            ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
                                            : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20"
                                    )}
                                >
                                    {isAdded ? (
                                        <div className="flex items-center gap-3">
                                            <CheckCircle2 className="h-5 w-5" />
                                            <span className="text-sm">Added to Build</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <Plus className="h-5 w-5" />
                                            <span className="text-sm">Add to Build</span>
                                        </div>
                                    )}
                                </Button>
                                {part.stock === 0 && !isAdded && (
                                    <p className="text-[10px] text-destructive font-bold uppercase tracking-tighter text-center mt-2">Currently Out of Stock</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Details Section */}
                    <div className="w-full md:w-[60%] flex flex-col p-6 md:p-8 bg-card/50 border-l border-primary/10">
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-tighter text-xs">
                                    <Icon className="w-3.5 h-3.5" />
                                    {part.brand}
                                </div>
                                <DialogTitle className="text-3xl font-headline font-bold leading-tight tracking-tight">
                                    {part.name}
                                </DialogTitle>
                            </div>

                            <div className="flex items-baseline gap-3">
                                <span className="text-3xl font-bold font-headline text-primary">
                                    {formatCurrency(part.price)}
                                </span>
                                {part.usdSrp && (
                                    <span className="text-sm text-muted-foreground font-medium">
                                        (Est. PHP {formatToPHP(part.usdSrp)})
                                    </span>
                                )}
                            </div>

                            <Separator className="bg-border/40" />

                             <ScrollArea className="h-[65vh] pr-4">
                                <div className="space-y-8">
                                    {part.description && (
                                        <div>
                                            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                                                <span className="h-px flex-1 bg-border/40"></span>
                                                Product Highlights
                                                <span className="h-px flex-1 bg-border/40"></span>
                                            </h3>
                                            <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/80 leading-relaxed font-medium">
                                                <ReactMarkdown>
                                                    {part.description}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                                            <span className="h-px flex-1 bg-border/40"></span>
                                            Technical Specifications
                                            <span className="h-px flex-1 bg-border/40"></span>
                                        </h3>
                                        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                            {Object.entries(part.specifications || {}).map(([key, value]) => (
                                                <div key={key} className="space-y-1">
                                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">{key}</p>
                                                    <p className="font-bold text-sm tracking-tight">{String(value)}</p>
                                                </div>
                                            ))}
                                            {part.wattage && (
                                                <div className="space-y-1">
                                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">TDP / Wattage</p>
                                                    <p className="font-bold text-sm tracking-tight">{part.wattage}W</p>
                                                </div>
                                            )}
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Status</p>
                                                <p className={part.stock > 0 ? "text-emerald-500 font-bold text-sm" : "text-destructive font-bold text-sm"}>
                                                    {part.stock > 0 ? `${part.stock} in stock` : "Out of stock"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
