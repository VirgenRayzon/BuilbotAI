"use client";

import Image from "next/image";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatToPHP } from "@/lib/utils";
import type { Part } from "@/lib/types";
import { Cpu, Server, CircuitBoard, MemoryStick, Database, Power, RectangleVertical, Wind, Monitor, Keyboard, Mouse, Headphones, Info } from "lucide-react";
import React from "react";

interface PartDetailsDialogProps {
    part: Part;
    children: React.ReactNode;
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

export function PartDetailsDialog({ part, children }: PartDetailsDialogProps) {
    const Icon = iconMap[part.category] || Info;

    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden bg-background/95 backdrop-blur-xl border-primary/20 shadow-2xl">
                <div className="flex flex-col md:flex-row h-full max-h-[85vh]">
                    {/* Image Section */}
                    <div className="w-full md:w-1/2 aspect-square md:aspect-auto relative bg-muted/30">
                        <Image
                            src={part.imageUrl || "/placeholder-part.png"}
                            alt={part.name}
                            fill
                            className="object-contain p-8"
                            sizes="(max-width: 768px) 100vw, 50vw"
                        />
                        <div className="absolute top-4 left-4">
                            <Badge variant="secondary" className="bg-background/80 backdrop-blur-md border-primary/20 text-primary px-3 py-1 font-headline font-bold uppercase tracking-wider text-xs">
                                {part.category}
                            </Badge>
                        </div>
                    </div>

                    {/* Details Section */}
                    <div className="w-full md:w-1/2 flex flex-col p-6 md:p-8 bg-card/50">
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-tighter text-xs">
                                    <Icon className="w-3.5 h-3.5" />
                                    {part.brand}
                                </div>
                                <DialogTitle className="text-3xl font-headline font-bold leading-tight tracking-tight">
                                    {part.name}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground">
                                    Technical specifications and details for the {part.brand} {part.name} {part.category}.
                                </DialogDescription>
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

                            <ScrollArea className="h-[40vh] pr-4">
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                                            <span className="h-px flex-1 bg-border/40"></span>
                                            Specifications
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
