/**
 * AddStockDialog / EditStockDialog — Modal allowing admins/managers to manually adjust (add or reduce) stock of an inventory part.
 * Automatically triggers system notification to staff (excluding actor & non-admins) and writes an audit log.
 */
'use client';

import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Boxes, Plus, Minus, ArrowRight, ShieldAlert, AlertTriangle, Loader2 } from "lucide-react";
import type { Part } from "@/lib/types";

interface AddStockDialogProps {
    part: Part;
    onAddStock?: (partId: string, category: Part['category'], amount: number) => Promise<void> | void;
    children?: React.ReactNode;
}

export function AddStockDialog({ part, onAddStock, children }: AddStockDialogProps) {
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<'add' | 'reduce'>('add');
    const [quantity, setQuantity] = useState<number>(10);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const currentStock = part.stock ?? 0;
    const validQuantity = Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 0;
    
    // Calculate new stock depending on add or reduce mode
    const effectiveDelta = mode === 'add' ? validQuantity : -Math.min(currentStock, validQuantity);
    const newStock = Math.max(0, currentStock + effectiveDelta);
    const isReducing = mode === 'reduce' && validQuantity > 0;

    const handleConfirm = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (effectiveDelta === 0 || !onAddStock) return;

        try {
            setIsSubmitting(true);
            await onAddStock(part.id, part.category, effectiveDelta);
            setOpen(false);
            setQuantity(10);
            setMode('add');
        } catch (error) {
            console.error("Failed to update stock:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenChange = (isOpen: boolean) => {
        if (!isSubmitting) {
            setOpen(isOpen);
            if (isOpen) {
                setQuantity(10);
                setMode('add');
            }
        }
    };

    const PRESETS = [1, 5, 10, 20, 50];

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            {children ? (
                <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                    {children}
                </DialogTrigger>
            ) : (
                <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-8 md:h-9 text-xs md:text-sm font-semibold border-primary/20 hover:border-primary/50 hover:bg-primary/10 transition-all gap-1.5"
                    >
                        <span>Edit Stock</span>
                    </Button>
                </DialogTrigger>
            )}

            <DialogContent 
                className="sm:max-w-[440px] bg-background/95 backdrop-blur-2xl border-white/10 shadow-2xl !p-3"
                onClick={(e) => e.stopPropagation()}
            >
                <DialogHeader className="space-y-1.5 p-3 pb-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                            <Boxes className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="font-headline text-lg font-bold">
                                Edit Stock
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground line-clamp-1">
                                {part.name}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-3.5 p-3 py-1">
                    {/* Action Selector: Add Stock vs Reduce Stock */}
                    <div className="grid grid-cols-2 gap-1.5 p-1 bg-muted/50 rounded-lg border border-white/5">
                        <button
                            type="button"
                            onClick={() => setMode('add')}
                            className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
                                mode === 'add'
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Add Stock</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('reduce')}
                            className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
                                mode === 'reduce'
                                    ? 'bg-amber-600 text-white shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <Minus className="h-3.5 w-3.5" />
                            <span>Reduce Stock</span>
                        </button>
                    </div>

                    {/* Warning banner when about to reduce stock */}
                    {isReducing && (
                        <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-medium animate-in fade-in duration-200">
                            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                            <div className="flex flex-col gap-0.5">
                                <span className="font-semibold text-amber-400">Warning</span>
                                <span className="text-[11px] leading-snug text-amber-300/90">
                                    You are now reducing the stock.
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Stock Projection Card */}
                    <div className="p-3 rounded-xl bg-muted/40 border border-white/5 space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                            <span>Current Stock</span>
                            <span>{mode === 'add' ? 'Adding' : 'Reducing'}</span>
                            <span>Projected Stock</span>
                        </div>
                        <div className="flex items-center justify-between font-mono font-bold text-base">
                            <span className="text-muted-foreground">{currentStock} units</span>
                            <div className={`flex items-center gap-1 ${mode === 'add' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {mode === 'add' ? (
                                    <>
                                        <Plus className="h-3.5 w-3.5" />
                                        <span>{validQuantity}</span>
                                    </>
                                ) : (
                                    <>
                                        <Minus className="h-3.5 w-3.5" />
                                        <span>{Math.min(currentStock, validQuantity)}</span>
                                    </>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 text-primary">
                                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-lg underline underline-offset-4 decoration-primary/40">
                                    {newStock} units
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Quantity Input Stepper */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            {mode === 'add' ? 'Quantity to Add' : 'Quantity to Reduce'}
                        </label>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 shrink-0 border-white/10 hover:bg-muted"
                                onClick={() => setQuantity(prev => Math.max(1, (prev || 0) - 1))}
                                disabled={validQuantity <= 1 || isSubmitting}
                            >
                                <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                                type="number"
                                min={1}
                                max={mode === 'reduce' ? currentStock : undefined}
                                step={1}
                                value={quantity === 0 ? '' : quantity}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    setQuantity(isNaN(val) ? 0 : Math.max(0, val));
                                }}
                                className="h-10 text-center font-mono text-base font-bold bg-muted/30 border-white/10"
                                disabled={isSubmitting}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 shrink-0 border-white/10 hover:bg-muted"
                                onClick={() => setQuantity(prev => (prev || 0) + 1)}
                                disabled={isSubmitting || (mode === 'reduce' && validQuantity >= currentStock)}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Quick Presets */}
                    <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                            {mode === 'add' ? 'Quick Add Presets' : 'Quick Presets'}
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {PRESETS.map((preset) => (
                                <Badge
                                    key={preset}
                                    variant="outline"
                                    onClick={() => setQuantity(preset)}
                                    className={`cursor-pointer px-2.5 py-1 text-xs font-mono font-medium transition-all ${
                                        mode === 'add'
                                            ? 'hover:bg-primary/20 hover:text-primary hover:border-primary/40'
                                            : 'hover:bg-amber-500/20 hover:text-amber-400 hover:border-amber-500/40'
                                    }`}
                                >
                                    {mode === 'add' ? `+${preset}` : `-${preset}`}
                                </Badge>
                            ))}
                            {mode === 'add' ? (
                                <Badge
                                    variant="outline"
                                    onClick={() => setQuantity(prev => (prev || 0) + 10)}
                                    className="cursor-pointer hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/40 px-2.5 py-1 text-xs font-mono font-medium transition-all ml-auto text-muted-foreground"
                                >
                                    Add +10 to input
                                </Badge>
                            ) : (
                                <Badge
                                    variant="outline"
                                    onClick={() => setQuantity(currentStock)}
                                    className="cursor-pointer hover:bg-amber-500/20 hover:text-amber-400 hover:border-amber-500/40 px-2.5 py-1 text-xs font-mono font-medium transition-all ml-auto text-muted-foreground"
                                >
                                    All ({currentStock})
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Notice */}
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10 text-muted-foreground text-[11px] leading-relaxed">
                        <ShieldAlert className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>
                            {mode === 'add'
                                ? 'Adding stock will record an entry in the system audit logs and broadcast a notification to all other managers and administrators.'
                                : 'Reducing stock will record an audit log entry tracking this inventory adjustment and notify staff.'}
                        </span>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0 p-3 pt-0">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setOpen(false)}
                        disabled={isSubmitting}
                        className="text-xs"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        disabled={validQuantity <= 0 || effectiveDelta === 0 || isSubmitting}
                        className={`gap-1.5 text-xs font-semibold px-5 ${
                            mode === 'add'
                                ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                                : 'bg-amber-600 hover:bg-amber-700 text-white'
                        }`}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span>Updating...</span>
                            </>
                        ) : mode === 'add' ? (
                            <>
                                <Plus className="h-3.5 w-3.5" />
                                <span>Add {validQuantity} Stock{validQuantity === 1 ? '' : 's'}</span>
                            </>
                        ) : (
                            <>
                                <Minus className="h-3.5 w-3.5" />
                                <span>Reduce {Math.min(currentStock, validQuantity)} Stock{validQuantity === 1 ? '' : 's'}</span>
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
