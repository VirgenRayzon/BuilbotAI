"use client";

import React, { useState } from 'react';
import { Plus, RefreshCcw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { SalesAnalytics } from '@/components/sales-analytics';
import { SalesVisualizer } from '@/components/sales-visualizer';
import { useFirestore } from '@/firebase';
import { resetSalesMetrics, ingestDummySalesData } from '@/firebase/database';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Part, PrebuiltSystem, Order } from '@/lib/types';

interface SalesTabProps {
    orders: Order[];
    parts: Part[];
    prebuiltSystems: PrebuiltSystem[];
}

export function SalesTab({
    orders,
    parts,
    prebuiltSystems
}: SalesTabProps) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isResettingSales, setIsResettingSales] = useState(false);
    const [isIngestingDummyData, setIsIngestingDummyData] = useState(false);
    const [showResetSalesConfirm, setShowResetSalesConfirm] = useState(false);
    const [showIngestDummyConfirm, setShowIngestDummyConfirm] = useState(false);

    const handleResetSales = async () => {
        if (!firestore || !orders) return;
        setIsResettingSales(true);
        try {
            const ordersToReset = orders?.map(o => ({ id: o.id })) || [];
            const partsToReset = parts?.map(p => ({ id: p.id, category: p.category })) || [];
            await resetSalesMetrics(firestore, ordersToReset, partsToReset);
            toast({ title: "Sales Metrics Reset", description: "All orders have been deleted and popularity metrics cleared." });
            setShowResetSalesConfirm(false);
        } catch (error) {
            console.error("Reset error:", error);
            toast({ title: "Reset Failed", description: "An error occurred while resetting sales data.", variant: "destructive" });
        } finally {
            setIsResettingSales(false);
        }
    };

    const handleIngestDummyData = async () => {
        if (!firestore) return;
        setIsIngestingDummyData(true);
        try {
            await ingestDummySalesData(firestore, parts, prebuiltSystems || []);
            toast({ 
                title: "Dummy Data Ingested", 
                description: "100 random orders and part popularity metrics have been generated.",
            });
            setShowIngestDummyConfirm(false);
        } catch (error) {
            console.error("Ingestion error:", error);
            toast({ 
                title: "Ingestion Failed", 
                description: "An error occurred while generating dummy data.", 
                variant: "destructive" 
            });
        } finally {
            setIsIngestingDummyData(false);
        }
    };

    const totalOrdersCount = orders?.filter(o => o.status !== 'cancelled').length || 0;

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">
                {/* Sales Activity Visualizer */}
                <div className="xl:col-span-1">
                    <div className="space-y-4 sticky top-8">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <h3 className="text-2xl font-headline font-bold uppercase tracking-tight text-foreground">
                                    Business Pulse
                                </h3>
                                <p className="text-xs text-muted-foreground uppercase tracking-widest opacity-60 mt-1">
                                    Neural data synchronization
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <AlertDialog open={showIngestDummyConfirm} onOpenChange={setShowIngestDummyConfirm}>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                        onClick={() => setShowIngestDummyConfirm(true)}
                                        title="Ingest Dummy Data"
                                    >
                                        <Plus className={cn("h-4 w-4", isIngestingDummyData && "animate-pulse")} />
                                    </Button>
                                    <AlertDialogContent className="bg-background/95 backdrop-blur-2xl border-border max-w-[400px]">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle className="flex items-center gap-2 text-xl font-headline font-bold">
                                                <Plus className="h-5 w-5 text-primary" />
                                                Ingest Dummy Data?
                                            </AlertDialogTitle>
                                            <AlertDialogDescription className="text-muted-foreground pt-2">
                                                This will generate 100 random orders over the last 12 months and update part popularity scores.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter className="pt-6">
                                            <AlertDialogCancel className="bg-transparent border-border hover:bg-muted">Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                className="bg-primary hover:bg-primary/90 text-white font-bold"
                                                onClick={handleIngestDummyData}
                                                disabled={isIngestingDummyData}
                                            >
                                                {isIngestingDummyData ? "Ingesting..." : "Confirm Ingestion"}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>

                                <AlertDialog open={showResetSalesConfirm} onOpenChange={setShowResetSalesConfirm}>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                        onClick={() => setShowResetSalesConfirm(true)}
                                        title="Reset Sales Metrics"
                                    >
                                        <RefreshCcw className={cn("h-4 w-4", isResettingSales && "animate-spin")} />
                                    </Button>
                                    <AlertDialogContent className="bg-background/95 backdrop-blur-2xl border-border max-w-[400px]">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle className="flex items-center gap-2 text-xl font-headline font-bold">
                                                <RefreshCcw className="h-5 w-5 text-destructive" />
                                                Reset Sales Analytics?
                                            </AlertDialogTitle>
                                            <AlertDialogDescription className="text-muted-foreground pt-2">
                                                This will PERMANENTLY delete all existing orders and reset component popularity metrics.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter className="pt-6">
                                            <AlertDialogCancel className="bg-transparent border-border hover:bg-muted">Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                className="bg-destructive hover:bg-destructive/90 text-white font-bold"
                                                onClick={handleResetSales}
                                                disabled={isResettingSales}
                                            >
                                                {isResettingSales ? "Resetting..." : "Confirm Full Reset"}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                        <SalesVisualizer orderCount={totalOrdersCount} />
                        <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
                            <p className="text-xs text-primary/80 font-medium leading-relaxed">
                                The Neural Core reflects real-time reservation intensity. Higher pulse rates indicate increased customer engagement cycles.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="xl:col-span-3">
                    <SalesAnalytics
                        orders={orders || []}
                        parts={parts || []}
                        prebuilts={prebuiltSystems || []}
                    />
                </div>
            </div>
        </div>
    );
}
