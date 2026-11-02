"use client";

import { useState } from 'react';
import { useUserProfile } from '@/context/user-profile';
import {
    ingestDummySalesDataByAdmin,
    resetSalesMetricsByAdmin,
} from '@/app/admin/sales-admin-actions';
import { exportSalesAnalyticsToExcel } from '@/lib/export-excel';
import { useToast } from "@/hooks/use-toast";
import type { Part, PrebuiltSystem, Order } from '@/lib/types';
import { getNetCollectedAmount } from '@/lib/order-workflow';

interface UseSalesActionsProps {
    orders: Order[];
    parts: Part[];
    prebuiltSystems: PrebuiltSystem[];
}

export function useSalesActions({ orders, parts, prebuiltSystems }: UseSalesActionsProps) {
    const { authUser } = useUserProfile();
    const { toast } = useToast();
    const [isResettingSales, setIsResettingSales] = useState(false);
    const [isIngestingDummyData, setIsIngestingDummyData] = useState(false);
    const [isExportingSales, setIsExportingSales] = useState(false);
    const [showResetSalesConfirm, setShowResetSalesConfirm] = useState(false);
    const [showIngestDummyConfirm, setShowIngestDummyConfirm] = useState(false);

    const handleResetSales = async () => {
        if (!authUser) return;
        setIsResettingSales(true);
        try {
            const idToken = await authUser.getIdToken();
            const res = await resetSalesMetricsByAdmin({ idToken });
            if (!res.success) {
                throw new Error(res.error || "Unable to reset sales metrics.");
            }
            toast({
                title: "Sales Metrics Reset",
                description: `Deleted ${res.deletedOrders ?? 0} order record(s) and cleared popularity metrics.`,
            });
            setShowResetSalesConfirm(false);
        } catch (error) {
            console.error("Reset error:", error);
            toast({
                title: "Reset Failed",
                description: error instanceof Error ? error.message : "An error occurred while resetting sales data.",
                variant: "destructive",
            });
        } finally {
            setIsResettingSales(false);
        }
    };

    const handleIngestDummyData = async () => {
        if (!authUser) return;
        setIsIngestingDummyData(true);
        try {
            const idToken = await authUser.getIdToken();
            const res = await ingestDummySalesDataByAdmin({ idToken });
            if (!res.success) {
                throw new Error(res.error || "Unable to generate sample orders.");
            }
            toast({
                title: "Sample Orders Generated",
                description: `${res.createdOrders ?? 60} sample orders and popularity metrics have been generated.`,
            });
            setShowIngestDummyConfirm(false);
        } catch (error) {
            console.error("Ingestion error:", error);
            toast({
                title: "Generation Failed",
                description: error instanceof Error ? error.message : "An error occurred while generating sample data.",
                variant: "destructive",
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

            (orders || []).filter(o => getNetCollectedAmount(o) > 0).forEach(order => {
                const paymentDate = order.paidAt || order.createdAt;
                const date = paymentDate?.toDate?.() || (paymentDate?.seconds ? new Date(paymentDate.seconds * 1000) : new Date(paymentDate));
                const key = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                if (dataMap.has(key)) {
                    dataMap.set(key, (dataMap.get(key) || 0) + getNetCollectedAmount(order));
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
                description: "Your multi-sheet Sales & Analytics workbook has been downloaded.",
            });
        } catch (error) {
            console.error("Export error:", error);
            toast({
                title: "Export Failed",
                description: "Failed to generate Excel file. Please try again.",
                variant: "destructive",
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
