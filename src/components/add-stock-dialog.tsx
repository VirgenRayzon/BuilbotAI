/**
 * AddStockDialog — Modal allowing admins/managers to manually add stock to an inventory part.
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
import { PackagePlus, Plus, Minus, ArrowRight, ShieldAlert, Loader2 } from "lucide-react";
import type { Part } from "@/lib/types";

interface AddStockDialogProps {
    part: Part;
    onAddStock?: (partId: string, category: Part['category'], amount: number) => Promise<void> | void;
    children?: React.ReactNode;
}

export function AddStockDialog({ part, onAddStock, children }: AddStockDialogProps) {
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState<number>(10);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const currentStock = part.stock ?? 0;
    const validAmount = Number.isFinite(amount) && amount > 0 ? Math.floor(amount) : 0;
    const newStock = currentStock + validAmount;

    const handleConfirm = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (validAmount <= 0 || !onAddStock) return;

        try {
            setIsSubmitting(true);
            await onAddStock(part.id, part.category, validAmount);
            setOpen(false);
            setAmount(10);
        } catch (error) {
            console.error("Failed to add stock:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenChange = (isOpen: boolean) => {
        if (!isSubmitting) {
            setOpen(isOpen);
            if (isOpen) {
                setAmount(10);
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
                        <Plus className="h-3.5 w-3.5 text-primary" />
                        <span>Add Stock</span>
                    </Button>
                </DialogTrigger>
            )}

            <DialogContent 
                className="sm:max-w-[440px] bg-background/95 backdrop-blur-2xl border-white/10 shadow-2xl p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <DialogHeader className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                            <PackagePlus className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="font-headline text-lg font-bold">
                                Add Inventory Stock
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground line-clamp-1">
                                {part.name}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4 py-3">
                    {/* Stock Projection Card */}
                    <div className="p-3.5 rounded-xl bg-muted/40 border border-white/5 space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                            <span>Current Stock</span>
                            <span>Adding</span>
                            <span>Projected Stock</span>
                        </div>
                        <div className="flex items-center justify-between font-mono font-bold text-base">
                            <span className="text-muted-foreground">{currentStock} units</span>
                            <div className="flex items-center gap-1 text-emerald-400">
                                <Plus className="h-3.5 w-3.5" />
                                <span>{validAmount}</span>
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
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Quantity to Add
                        </label>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 shrink-0 border-white/10 hover:bg-muted"
                                onClick={() => setAmount(prev => Math.max(1, (prev || 0) - 1))}
                                disabled={validAmount <= 1 || isSubmitting}
                            >
                                <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                                type="number"
                                min={1}
                                step={1}
                                value={amount === 0 ? '' : amount}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    setAmount(isNaN(val) ? 0 : Math.max(0, val));
                                }}
                                className="h-10 text-center font-mono text-base font-bold bg-muted/30 border-white/10"
                                disabled={isSubmitting}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 shrink-0 border-white/10 hover:bg-muted"
                                onClick={() => setAmount(prev => (prev || 0) + 1)}
                                disabled={isSubmitting}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Quick Presets */}
                    <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                            Quick Add Presets
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {PRESETS.map((preset) => (
                                <Badge
                                    key={preset}
                                    variant="outline"
                                    onClick={() => setAmount(preset)}
                                    className="cursor-pointer hover:bg-primary/20 hover:text-primary hover:border-primary/40 px-2.5 py-1 text-xs font-mono font-medium transition-all"
                                >
                                    +{preset}
                                </Badge>
                            ))}
                            <Badge
                                variant="outline"
                                onClick={() => setAmount(prev => (prev || 0) + 10)}
                                className="cursor-pointer hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/40 px-2.5 py-1 text-xs font-mono font-medium transition-all ml-auto text-muted-foreground"
                            >
                                Add +10 to input
                            </Badge>
                        </div>
                    </div>

                    {/* Notice */}
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10 text-muted-foreground text-[11px] leading-relaxed">
                        <ShieldAlert className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>
                            Adding stock will record an entry in the system audit logs and broadcast a notification to all other managers and administrators.
                        </span>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
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
                        disabled={validAmount <= 0 || isSubmitting}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 text-xs font-semibold px-5"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span>Updating...</span>
                            </>
                        ) : (
                            <>
                                <PackagePlus className="h-3.5 w-3.5" />
                                <span>Add {validAmount} Stock{validAmount === 1 ? '' : 's'}</span>
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
