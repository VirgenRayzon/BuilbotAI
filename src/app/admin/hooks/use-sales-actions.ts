"use client";

import { useState } from 'react';
import { useFirestore } from '@/firebase';
import { resetSalesMetrics, ingestDummySalesData } from '@/firebase/database';
import { useToast } from "@/hooks/use-toast";
import type { Part, PrebuiltSystem, Order } from '@/lib/types';

interface UseSalesActionsProps {
    orders: Order[];
    parts: Part[];
    prebuiltSystems: PrebuiltSystem[];
}

export function useSalesActions({ orders, parts, prebuiltSystems }: UseSalesActionsProps) {
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
            toast({
                title: "Sales Metrics Reset",
                description: "All orders have been deleted and popularity metrics cleared."
            });
            setShowResetSalesConfirm(false);
        } catch (error) {
            console.error("Reset error:", error);
            toast({
                title: "Reset Failed",
                description: "An error occurred while resetting sales data.",
                variant: "destructive"
            });
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

    return {
        isResettingSales,
        isIngestingDummyData,
        showResetSalesConfirm,
        setShowResetSalesConfirm,
        showIngestDummyConfirm,
        setShowIngestDummyConfirm,
        handleResetSales,
        handleIngestDummyData,
    };
}
