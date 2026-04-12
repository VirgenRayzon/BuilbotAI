'use client';

import { AddPrebuiltDialog, type AddPrebuiltFormSchema } from './add-prebuilt-dialog';
import type { Part, PrebuiltSystem } from '@/lib/types';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, getOptimizedStorageUrl } from '@/lib/utils';
import { Trash2, Info, ChevronUp, ChevronDown, ChevronRight } from 'lucide-react';
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


interface InventoryPrebuiltCardProps {
    system: PrebuiltSystem;
    parts: Part[];
    onDelete: (systemId: string) => void;
    onUpdate: (systemId: string, data: AddPrebuiltFormSchema) => Promise<void>;
    isExpanded: boolean;
    onToggleExpand: () => void;
}

export function InventoryPrebuiltCard({ system, parts, onDelete, onUpdate, isExpanded, onToggleExpand }: InventoryPrebuiltCardProps) {

    return (
        <AddPrebuiltDialog
            initialData={system}
            parts={parts}
            onSave={(data) => onUpdate(system.id, data)}
        >
            <Card className={cn(
                "flex flex-col h-full transform transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] relative group overflow-hidden border-border/50 cursor-pointer bg-card/40 backdrop-blur-sm",
                isExpanded ? "ring-2 ring-primary/40 shadow-[0_0_30px_rgba(var(--primary-rgb),0.15)] bg-card/60 -translate-y-1.5" : "hover:-translate-y-1 hover:shadow-xl hover:border-primary/30"
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
                                        This action cannot be undone. This will permanently delete the prebuilt system: {system.name}.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(system.id);
                                        }}
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
                            src={getOptimizedStorageUrl(system.imageUrl) || '/placeholder-system.png'}
                            alt={system.name}
                            fill
                            unoptimized
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    </div>

                    <div className="flex justify-between items-center py-2 border-t border-border/10 mt-2">
                        <div className="flex flex-col">
                           <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Starting Price</p>
                           <p className="text-2xl font-black font-headline tracking-tighter text-primary">{formatCurrency(system.price)}</p>
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            className={cn(
                                "h-8 px-3 gap-2 text-[10px] uppercase font-bold tracking-widest transition-all duration-300",
                                isExpanded ? "bg-primary text-white hover:bg-primary/90" : "hover:bg-primary/10 hover:text-primary"
                            )}
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleExpand();
                            }}
                        >
                            {isExpanded ? (
                                <>Hide Specs <ChevronUp className="h-3 w-3" /></>
                            ) : (
                                <>View Specs <ChevronDown className="h-3 w-3" /></>
                            )}
                        </Button>
                    </div>

                    <div className="min-h-[40px]">
                        <CardDescription className="text-[11px] line-clamp-2 leading-relaxed text-muted-foreground/80">
                            {system.description}
                        </CardDescription>
                    </div>

                    <AnimatePresence initial={false}>
                        {isExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                                className="overflow-hidden"
                            >
                                <div className="py-4 border-t border-primary/20 mt-3 bg-primary/[0.03] backdrop-blur-md -mx-3.5 px-3.5 rounded-b-xl border-dashed shadow-inner">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
                                            <Info className="h-3 w-3 text-primary" />
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">System Inventory List</p>
                                    </div>
                                    <div className="space-y-1">
                                        <PrebuiltCardSpecs components={system.components} expanded={true} />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>


                </div>

                <div className="mt-auto p-3 pt-0 z-10 flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-[10px] uppercase font-bold tracking-widest h-9 bg-background/50 border-white/10 hover:border-primary/50 hover:bg-primary/5 group"
                        onClick={(e) => e.stopPropagation()}
                        asChild
                    >
                        <a href={`/pre-builts/${system.id}`} className="flex items-center justify-center">
                            <Info className="mr-2 h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                            Launch Product Page
                            <ChevronRight className="ml-2 h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                        </a>
                    </Button>
                </div>
            </Card>
        </AddPrebuiltDialog>
    );
}
