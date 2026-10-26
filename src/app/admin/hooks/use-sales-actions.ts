"use client";

import { useState } from 'react';
import { useFirestore } from '@/firebase';
import { resetSalesMetrics, ingestDummySalesData } from '@/firebase/database';
import { exportSalesAnalyticsToExcel } from '@/lib/export-excel';
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
    const [isExportingSales, setIsExportingSales] = useState(false);
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

    const handleExportSales = () => {
        setIsExportingSales(true);
        try {
            const now = new Date();
            const dataPoints = Array.from({ length: 7 }, (_, i) => {
                const d = new Date(now);
                d.setDate(d.getDate() - (6 - i));
                return {
                    name: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                };
            });
            const dataMap = new Map<string, number>();
            dataPoints.forEach(p => dataMap.set(p.name, 0));

            (orders || []).filter(o => o.status !== 'cancelled').forEach(order => {
                const date = order.createdAt?.toDate?.() || (order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000) : new Date(order.createdAt));
                const key = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                if (dataMap.has(key)) {
                    dataMap.set(key, (dataMap.get(key) || 0) + (order.totalPrice || 0));
                }
            });

            const revenueData = dataPoints.map(p => ({
                name: p.name,
                revenue: dataMap.get(p.name) || 0,
            }));

            exportSalesAnalyticsToExcel({
                orders: orders || [],
                parts: parts || [],
                prebuilts: prebuiltSystems || [],
                revenueData,
                timeRange: 'week',
            });
            toast({
                title: "Excel Export Complete",
                description: "Your comprehensive multi-sheet Sales & Analytics workbook has been downloaded.",
            });
        } catch (error) {
            console.error("Export error:", error);
            toast({
                title: "Export Failed",
                description: "Failed to generate Excel file. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsExportingSales(false);
        }
    };

    return {
        isResettingSales,
        isIngestingDummyData,
        isExportingSales,
        showResetSalesConfirm,
        setShowResetSalesConfirm,
        showIngestDummyConfirm,
        setShowIngestDummyConfirm,
        handleResetSales,
        handleIngestDummyData,
        handleExportSales,
    };
}
