"use client";

import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Heart, Trash2, ChevronRight, CreditCard, Pencil, Check, X,
    Sparkles, Bot, Wrench, AlertTriangle
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import type { FavoriteBuild } from "@/lib/types";
import { useRouter } from "next/navigation";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { useCollection, useFirestore } from "@/firebase";
import { collection } from "firebase/firestore";
import { useMemo } from "react";

interface FavoritesListProps {
    favorites: FavoriteBuild[];
    loading: boolean;
    onDelete: (id: string) => void;
    onRename: (id: string, newName: string) => void;
}

export function FavoritesList({ favorites, loading, onDelete, onRename }: FavoritesListProps) {
    const router = useRouter();
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");

    // Fetch live inventory to validate stock
    const firestore = useFirestore();
    const inventoryCategories = ['CPU', 'GPU', 'Motherboard', 'RAM', 'Storage', 'PSU', 'Case', 'Cooler', 'Monitor', 'Keyboard', 'Mouse', 'Headset'];

    const collectionRefs = useMemo(() => {
        if (!firestore) return [];
        return inventoryCategories.map(cat => collection(firestore, cat));
    }, [firestore]);

    const inventoryResults = collectionRefs.map(ref => useCollection<any>(ref));
    const allParts = useMemo(() => {
        return inventoryResults.flatMap((result, idx) => {
            const data = result.data || [];
            return data.map((part: any) => ({
                ...part,
                category: inventoryCategories[idx],
            }));
        });
    }, [inventoryResults]);

    const getPartStatus = (partId: string, partName: string) => {
        const livePart = allParts.find(p => p.id === partId);
        if (!livePart) return 'missing'; // Part no longer exists
        if (livePart.stock <= 0 || livePart.isArchived) return 'out_of_stock';
        return 'available';
    };

    const getLivePrice = (partId: string, fallbackPrice: number) => {
        const livePart = allParts.find(p => p.id === partId);
        return livePart?.price ?? fallbackPrice;
    };

    const handleLoadInBuilder = (favorite: FavoriteBuild) => {
        // Store the favorite ID in localStorage so the builder page can load it
        localStorage.setItem('pc_builder_load_favorite', JSON.stringify(favorite));
        router.push('/builder');
    };

    const handleStartRename = (fav: FavoriteBuild) => {
        setEditingId(fav.id);
        setEditName(fav.name);
    };

    const handleConfirmRename = () => {
        if (editingId && editName.trim()) {
            onRename(editingId, editName.trim());
        }
        setEditingId(null);
        setEditName("");
    };

    if (loading) return null;

    if (favorites.length === 0) {
        return (
            <Card className="border-dashed border-white/10 bg-transparent">
                <CardContent className="p-16 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="h-20 w-20 rounded-full bg-muted/20 flex items-center justify-center border border-white/5">
                        <Heart className="h-10 w-10 text-muted-foreground opacity-30" />
                    </div>
                    <div className="space-y-2 max-w-sm">
                        <h3 className="text-xl font-bold">No saved builds</h3>
                        <p className="text-sm text-muted-foreground">Save your favorite PC builds from the Builder or AI Advisor for quick access later.</p>
                    </div>
                    <Button className="relative z-30 mt-4 shadow-xl shadow-primary/20 group" asChild>
                        <a href="/builder">
                            Start Building
                            <ChevronRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                        </a>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 gap-6">
                {favorites.map((favorite) => {
                    const liveTotal = favorite.parts.reduce((sum, p) => sum + getLivePrice(p.partId, p.price), 0);
                    const hasIssues = favorite.parts.some(p => getPartStatus(p.partId, p.name) !== 'available');

                    return (
                        <Card key={favorite.id} className="group border-white/5 bg-muted/5 hover:bg-muted/10 transition-all duration-300 overflow-hidden shadow-inner">
                            <div className="p-6">
                                <div className="flex flex-col md:flex-row justify-between gap-6 mb-6">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            {editingId === favorite.id ? (
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        className="h-8 w-48 text-sm"
                                                        onKeyDown={(e) => e.key === 'Enter' && handleConfirmRename()}
                                                        autoFocus
                                                    />
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleConfirmRename}>
                                                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingId(null)}>
                                                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <>
                                                    <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
                                                    <p className="text-lg font-bold tracking-tight">{favorite.name}</p>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => handleStartRename(favorite)}
                                                    >
                                                        <Pencil className="h-3 w-3 text-muted-foreground" />
                                                    </Button>
                                                </>
                                            )}
                                            <Badge variant="secondary" className={cn(
                                                "text-[10px] font-bold uppercase tracking-wider",
                                                favorite.source === 'advisor'
                                                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                                    : "bg-primary/10 text-primary border-primary/20"
                                            )}>
                                                {favorite.source === 'advisor' ? (
                                                    <><Bot className="h-3 w-3 mr-1" /> AI Advisor</>
                                                ) : (
                                                    <><Wrench className="h-3 w-3 mr-1" /> Builder</>
                                                )}
                                            </Badge>
                                            {hasIssues && (
                                                <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border-amber-500/20">
                                                    <AlertTriangle className="h-3 w-3 mr-1" /> Stock Issues
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {favorite.parts.length} components • Saved {favorite.createdAt?.toDate?.()
                                                ? favorite.createdAt.toDate().toLocaleDateString(undefined, { dateStyle: 'medium' })
                                                : 'recently'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3 md:text-right self-start sm:self-center">
                                        <div className="text-right pr-4 border-r border-white/10 hidden sm:block">
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Current Price</p>
                                            <p className="text-xl font-headline font-bold text-primary leading-none">{formatCurrency(liveTotal)}</p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="relative z-30 h-8 text-[10px] font-bold uppercase tracking-wider text-primary border-primary/20 hover:bg-primary/10"
                                            onClick={() => handleLoadInBuilder(favorite)}
                                        >
                                            Load Build
                                            <ChevronRight className="h-3 w-3 ml-1" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="relative z-30 h-9 w-9 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                                            onClick={() => setDeleteTarget(favorite.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Parts list */}
                                <div className="bg-background/40 rounded-xl border border-white/5 overflow-hidden">
                                    <div className="max-h-[180px] overflow-y-auto divide-y divide-white/5">
                                        {favorite.parts.map((part, idx) => {
                                            const status = getPartStatus(part.partId, part.name);
                                            const livePrice = getLivePrice(part.partId, part.price);
                                            return (
                                                <div key={`${favorite.id}-part-${idx}`} className={cn(
                                                    "p-3 px-4 flex justify-between items-center text-sm hover:bg-white/[0.02] transition-colors",
                                                    status === 'missing' && "opacity-40 line-through",
                                                    status === 'out_of_stock' && "opacity-60"
                                                )}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "h-8 w-8 rounded-lg flex items-center justify-center border",
                                                            status === 'available' ? "bg-muted/60 border-white/5" :
                                                            status === 'out_of_stock' ? "bg-amber-500/10 border-amber-500/20" :
                                                            "bg-rose-500/10 border-rose-500/20"
                                                        )}>
                                                            {status === 'missing' ? (
                                                                <X className="h-3.5 w-3.5 text-rose-500" />
                                                            ) : status === 'out_of_stock' ? (
                                                                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                                                            ) : (
                                                                <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[9px] font-bold text-primary uppercase tracking-tighter opacity-70">{part.category}</span>
                                                            <span className="font-medium truncate max-w-[180px] sm:max-w-md">{part.name}</span>
                                                            {status === 'missing' && <span className="text-[9px] text-rose-500 font-bold">No longer available</span>}
                                                            {status === 'out_of_stock' && <span className="text-[9px] text-amber-500 font-bold">Out of stock</span>}
                                                        </div>
                                                    </div>
                                                    <span className="text-muted-foreground font-mono text-xs">{formatCurrency(livePrice)}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="p-3 px-4 bg-muted/30 flex justify-between items-center sm:hidden">
                                        <span className="text-xs font-bold text-muted-foreground">Total</span>
                                        <span className="font-bold text-primary">{formatCurrency(favorite.parts.reduce((s, p) => s + getLivePrice(p.partId, p.price), 0))}</span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent className="bg-slate-900 border-white/10 rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold font-headline uppercase">Remove Favorite?</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                            This will permanently remove this build from your favorites.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl border-white/10 hover:bg-white/5">Keep</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (deleteTarget) onDelete(deleteTarget);
                                setDeleteTarget(null);
                            }}
                            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
