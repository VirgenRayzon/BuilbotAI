'use client';

import { AddPrebuiltDialog, type AddPrebuiltFormSchema } from './add-prebuilt-dialog';
import type { Part, PrebuiltSystem } from '@/lib/types';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, getOptimizedStorageUrl } from '@/lib/utils';
import { Trash2, Info, ChevronUp, ChevronDown, ChevronRight, Archive, RotateCcw, Check, CheckSquare } from 'lucide-react';
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
import { useSiteSettings } from '@/context/site-settings-context';
import React, { useState } from 'react';
import { PrebuiltCardSpecs } from './prebuilt-card-specs';
import { motion, AnimatePresence } from 'framer-motion';
import { Checkbox } from "@/components/ui/checkbox";


interface InventoryPrebuiltCardProps {
    system: PrebuiltSystem;
    parts: Part[];
    onDelete: (systemId: string) => void;
    onArchive: (systemId: string, isArchived: boolean) => void;
    onUpdate: (systemId: string, data: AddPrebuiltFormSchema) => Promise<void>;
    isExpanded: boolean;
    onToggleExpand: () => void;
    isSelected?: boolean;
    onToggleSelection?: (id: string) => void;
    isSelectionMode?: boolean;
    isSuperAdmin?: boolean;
    isArchiveView?: boolean;
}

export function InventoryPrebuiltCard({ 
    system, 
    parts, 
    onDelete, 
    onArchive,
    onUpdate, 
    isExpanded, 
    onToggleExpand,
    isSelected = false,
    onToggleSelection = () => {},
    isSelectionMode = false,
    isSuperAdmin = false,
    isArchiveView = false
}: InventoryPrebuiltCardProps) {
    const { shouldCorruptImages } = useSiteSettings();

    return (
        <div className="relative group/card-wrapper h-full">
            <Card 
                className={cn(
                    "flex flex-col h-full transform transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] relative group overflow-hidden border-border/50 cursor-pointer bg-card/40 backdrop-blur-sm",
                    isExpanded ? "ring-2 ring-primary/40 shadow-[0_0_30px_rgba(var(--primary-rgb),0.15)] bg-card/60 -translate-y-1.5" : "hover:-translate-y-1 hover:shadow-xl hover:border-primary/30",
                    isSelected && "border-primary border-2 shadow-primary/20 bg-primary/[0.05]"
                )}
                onClick={() => {
                    if (isSelectionMode) {
                        onToggleSelection(system.id);
                    }
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent transition-opacity duration-300 opacity-0 group-hover:opacity-100" />
                
                {/* Multi-select Checkmark (shown only when selected) */}
                {isSelected && (
                    <div className="absolute top-3 left-3 z-30 p-1 rounded-md bg-primary text-primary-foreground shadow-lg animate-in zoom-in-50 duration-200">
                        <Check className="h-4 w-4 stroke-[3px]" />
                    </div>
                )}

                <div className="p-2 md:p-3.5 pb-0 space-y-1.5 md:space-y-2.5 z-10 flex-grow flex flex-col">
                    <div className="flex justify-between items-start gap-2">
                        <div className={cn("space-y-0.5 flex-grow", isSelected ? "pl-5" : "")}>
                            <div className="flex items-center gap-2">
                                <p className="text-[8px] md:text-[10px] text-muted-foreground uppercase tracking-widest font-bold">PREBUILT</p>
                                <Badge variant="outline" className="h-3 md:h-4 px-1 text-[7px] md:text-[8px] uppercase tracking-tighter border-primary/20 text-primary/70">
                                    {system.tier}
                                </Badge>
                            </div>
                            {isSelectionMode ? (
                                <CardTitle className="text-base font-headline leading-snug line-clamp-2 h-10 hover:text-primary transition-colors">{system.name}</CardTitle>
                            ) : (
                                <AddPrebuiltDialog
                                    initialData={system}
                                    parts={parts}
                                    onSave={(data) => onUpdate(system.id, data)}
                                >
                                    <div className="h-10 md:h-12 flex flex-col justify-center overflow-hidden">
                                        <CardTitle className="text-xs md:text-base font-headline leading-snug line-clamp-2 hover:text-primary transition-colors m-0 p-0">
                                            {system.name.length > 60 ? system.name.substring(0, 57) + "......." : system.name}
                                        </CardTitle>
                                    </div>
                                </AddPrebuiltDialog>
                            )}
                        </div>
                        <div className="flex items-start gap-1">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground/40 hover:text-primary hover:bg-primary/10 transition-colors -mt-1"
                                            onClick={(e) => e.stopPropagation()}
                                            title={isArchiveView ? "Restore" : "Archive"}
                                        >
                                            {isArchiveView ? <RotateCcw className="h-3 w-3 md:h-4 md:w-4" /> : <Archive className="h-3 w-3 md:h-4 md:w-4" />}
                                        </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>{isArchiveView ? "Restore System?" : "Archive System?"}</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            {isArchiveView 
                                                ? `This will restore ${system.name} to the active showcase.`
                                                : `This will move ${system.name} to the archive. It will no longer be visible to customers.`
                                            }
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onArchive(system.id, !isArchiveView);
                                            }}
                                            className={isArchiveView ? "bg-primary hover:bg-primary/90" : "bg-orange-500 hover:bg-orange-600"}
                                        >
                                            {isArchiveView ? "Restore" : "Archive"}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            {isSuperAdmin && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => e.stopPropagation()}
                                            className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors -mt-1 -mr-1"
                                        >
                                            <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
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
                            )}
                        </div>
                    </div>

                    {isSelectionMode ? (
                        <div className="aspect-square relative w-full overflow-hidden rounded-lg bg-muted/30">
                            <Image
                                src={getOptimizedStorageUrl(system.imageUrl, shouldCorruptImages) || '/placeholder-system.png'}
                                alt={system.name}
                                fill
                                unoptimized
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                        </div>
                    ) : (
                        <AddPrebuiltDialog
                            initialData={system}
                            parts={parts}
                            onSave={(data) => onUpdate(system.id, data)}
                        >
                            <div className="aspect-square relative w-full overflow-hidden rounded-lg bg-muted/30 cursor-pointer">
                                <Image
                                    src={getOptimizedStorageUrl(system.imageUrl, shouldCorruptImages) || '/placeholder-system.png'}
                                    alt={system.name}
                                    fill
                                    unoptimized
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            </div>
                        </AddPrebuiltDialog>
                    )}

                     <div className="flex justify-between items-center py-0.5 md:py-1 border-t border-border/10 mt-1 md:mt-2">
                        <div className="flex flex-col">
                           <p className="text-[7px] md:text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Starting Price</p>
                           <p className="text-sm md:text-2xl font-black font-headline tracking-tighter text-primary">{formatCurrency(system.price)}</p>
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            className={cn(
                                "h-6 md:h-8 px-2 md:px-3 gap-1 md:gap-2 text-[7px] md:text-[10px] uppercase font-bold tracking-widest transition-all duration-300",
                                isExpanded ? "bg-primary text-white hover:bg-primary/90" : "hover:bg-primary/10 hover:text-primary"
                            )}
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleExpand();
                            }}
                        >
                            {isExpanded ? (
                                <>Hide <ChevronUp className="h-2 w-2 md:h-3 md:w-3" /></>
                            ) : (
                                <>Specs <ChevronDown className="h-2 w-2 md:h-3 md:w-3" /></>
                            )}
                        </Button>
                    </div>

                    <div className="min-h-[30px] md:min-h-[40px]">
                        <CardDescription className="text-[9px] md:text-[11px] line-clamp-2 leading-tight md:leading-relaxed text-muted-foreground/80">
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

                <div className="mt-auto p-2 md:p-3 pt-0 z-10 flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-[8px] md:text-[10px] uppercase font-bold tracking-widest h-7 md:h-9 bg-background/50 border-white/10 hover:border-primary/50 hover:bg-primary/5 group"
                        onClick={(e) => e.stopPropagation()}
                        asChild
                    >
                        <a href={`/pre-builts/${system.id}`} className="flex items-center justify-center">
                            Launch Page
                            <ChevronRight className="ml-1 md:ml-2 h-2.5 md:h-3 w-2.5 md:w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                        </a>
                    </Button>
                </div>
            </Card>
        </div>
    );
}
