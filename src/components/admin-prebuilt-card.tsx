'use client';

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import type { PrebuiltSystem } from '@/lib/types';
import { Trash2, Info, ChevronUp, ChevronDown } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import React, { useState } from 'react';
import { PrebuiltCardSpecs } from './prebuilt-card-specs';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminPrebuiltCardProps {
    system: PrebuiltSystem;
    onDelete: (systemId: string) => void;
}

export function AdminPrebuiltCard({ system, onDelete }: AdminPrebuiltCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <Card className={cn(
            "flex flex-col h-full transform transition-all duration-300 ease-in-out hover:-translate-y-1 relative group overflow-hidden border-border/50",
        )}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent transition-opacity duration-300 opacity-0 group-hover:opacity-100" />

            <div className="p-3.5 pb-0 space-y-2.5 z-10 flex-grow flex flex-col">
                <div className="flex justify-between items-start gap-2">
                    <div className="space-y-0.5 flex-grow">
                        <div className="flex items-center gap-2">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">PREBUILT SYSTEM</p>
                            <Badge variant="outline" className="h-4 px-1 text-[8px] uppercase tracking-tighter border-primary/20 text-primary/70">
                                {system.tier}
                            </Badge>
                        </div>
                        <CardTitle className="text-base font-headline leading-snug line-clamp-2 h-10">{system.name}</CardTitle>
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
                                    This action cannot be undone. This will permanently delete the prebuilt system: {system.name}.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => onDelete(system.id)}
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
                        src={system.imageUrl}
                        alt={system.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                </div>

                <div className="flex justify-between items-center py-1">
                    <p className="text-xl font-bold font-headline tracking-tight">{formatCurrency(system.price)}</p>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground/60 hover:text-primary transition-colors"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                </div>

                <CardDescription className="text-[11px] line-clamp-2 leading-relaxed h-8 text-muted-foreground/80">
                    {system.description}
                </CardDescription>

                <AnimatePresence initial={false}>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="overflow-hidden"
                        >
                            <div className="py-2 border-t border-border/40 mt-1">
                                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Component Breakdown</p>
                                <PrebuiltCardSpecs components={system.components} expanded={true} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {!isExpanded && (
                    <div className="min-h-[50px] transition-all duration-300">
                        <PrebuiltCardSpecs components={system.components} />
                    </div>
                )}
            </div>

            <div className="mt-auto p-3 pt-0 z-10 flex gap-2">
                <Button variant="outline" size="sm" className="w-full text-[10px] uppercase font-bold tracking-widest h-8" asChild>
                    <a href={`/pre-builts/`} className="flex items-center justify-center">
                        <Info className="mr-2 h-3 w-3" />
                        View Page
                    </a>
                </Button>
            </div>
        </Card>
    );
}
