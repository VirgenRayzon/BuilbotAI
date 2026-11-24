"use client";

import { useState } from 'react';
import { useUserProfile } from '@/context/user-profile';
import {
    ingestDummySalesDataByAdmin,
    resetSalesMetricsByAdmin,
} from '@/app/admin/sales-admin-actions';
import { useToast } from "@/hooks/use-toast";
import type { Part, PrebuiltSystem, Order } from '@/lib/types';

interface UseSalesActionsProps {
    orders?: Order[];
    parts?: Part[];
    prebuiltSystems?: PrebuiltSystem[];
}

export function useSalesActions({ orders: _orders, parts: _parts, prebuiltSystems: _prebuilts }: UseSalesActionsProps = {}) {
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

    const handleExportSales = async () => {
        if (!authUser) {
            toast({
                title: "Authentication Required",
                description: "You must be signed in as staff to export sales data.",
                variant: "destructive",
            });
            return;
        }

        setIsExportingSales(true);
        try {
            const idToken = await authUser.getIdToken();
            const response = await fetch('/api/admin/sales-export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    idToken,
                    timeRange: 'all',
                    format: 'xlsx',
                }),
            });

            if (!response.ok) {
                const errorData = (await response.json().catch(() => ({}))) as { error?: string };
                throw new Error(errorData.error || `Export failed with status ${response.status}`);
            }

            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const downloadLink = document.createElement('a');
            const dateFormatted = new Date().toISOString().split('T')[0];
            downloadLink.href = blobUrl;
            downloadLink.download = `Netcodex_Sales_Analytics_${dateFormatted}.xlsx`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            window.URL.revokeObjectURL(blobUrl);
            document.body.removeChild(downloadLink);

            toast({
                title: "Excel Export Complete",
                description: "Your multi-sheet Sales & Analytics workbook has been downloaded.",
            });
        } catch (error) {
            console.error("Export error:", error);
            toast({
                title: "Export Failed",
                description: error instanceof Error ? error.message : "Failed to generate Excel file. Please try again.",
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
