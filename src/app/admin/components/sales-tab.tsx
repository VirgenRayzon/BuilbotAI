"use client";

import React, { useState } from 'react';
import { Plus, RefreshCcw, BarChart3, AlertTriangle, Sparkles } from 'lucide-react';
import {
    Paper,
    Title,
    Text,
    Button,
    Group,
    ThemeIcon,
    Modal,
    Stack,
    Box
} from '@mantine/core';
import { SalesAnalytics } from '@/components/sales-analytics';
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

    return (
        <div className="space-y-6">
            {/* Sales Control Header Panel */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-3">
                    <ThemeIcon size={44} radius="lg" color="cyan" variant="light">
                        <BarChart3 className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                    </ThemeIcon>
                    <div>
                        <Title order={2} className="text-2xl font-headline font-bold uppercase tracking-tight text-slate-900 dark:text-white">
                            Sales & Analytics Dashboard
                        </Title>
                        <Text size="xs" className="text-slate-600 dark:text-slate-400 font-medium">
                            Track reservations performance, revenue distributions, and component demand.
                        </Text>
                    </div>
                </div>

                <Group gap="sm">
                    <Button
                        variant="light"
                        color="cyan"
                        radius="md"
                        size="sm"
                        leftSection={<Plus className={cn("h-4 w-4", isIngestingDummyData && "animate-pulse")} />}
                        onClick={() => setShowIngestDummyConfirm(true)}
                        loading={isIngestingDummyData}
                        className="font-headline font-bold text-xs uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Ingest Dummy Data
                    </Button>

                    <Button
                        variant="subtle"
                        color="red"
                        radius="md"
                        size="sm"
                        leftSection={<RefreshCcw className={cn("h-4 w-4", isResettingSales && "animate-spin")} />}
                        onClick={() => setShowResetSalesConfirm(true)}
                        loading={isResettingSales}
                        className="font-headline font-bold text-xs uppercase tracking-wider text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Reset Analytics
                    </Button>
                </Group>
            </div>

            {/* Ingest Dummy Data Modal */}
            <Modal
                opened={showIngestDummyConfirm}
                onClose={() => setShowIngestDummyConfirm(false)}
                title={
                    <Group gap="xs">
                        <ThemeIcon size="md" color="cyan" variant="light" radius="md">
                            <Sparkles size={16} />
                        </ThemeIcon>
                        <Text fw={700} className="font-headline text-base text-slate-900 dark:text-white uppercase tracking-tight">
                            Ingest Dummy Sales Data
                        </Text>
                    </Group>
                }
                centered
                radius="lg"
                overlayProps={{ backgroundOpacity: 0.65, blur: 5 }}
                classNames={{
                    content: "bg-white dark:bg-[#111722] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 shadow-2xl rounded-2xl overflow-hidden",
                    header: "bg-white dark:bg-[#111722] border-b border-slate-200 dark:border-white/10 px-6 py-4",
                    body: "!px-6 !pt-5 !pb-6",
                    close: "text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors",
                }}
            >
                <Stack gap="md" className="pt-2">
                    <Text size="sm" className="text-slate-600 dark:text-slate-300">
                        This action will generate <strong>100 randomized customer reservations</strong> distributed over the past 12 months, calculating component demand and updating popularity scores.
                    </Text>

                    <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-800 dark:text-cyan-300">
                        Ideal for demoing charts, revenue trajectories, and component popularity matrices.
                    </div>

                    <Group justify="flex-end" gap="sm" className="pt-2">
                        <Button
                            variant="subtle"
                            color="gray"
                            radius="md"
                            size="sm"
                            onClick={() => setShowIngestDummyConfirm(false)}
                            disabled={isIngestingDummyData}
                        >
                            Cancel
                        </Button>
                        <Button
                            color="cyan"
                            radius="md"
                            size="sm"
                            onClick={handleIngestDummyData}
                            loading={isIngestingDummyData}
                            className="font-bold uppercase tracking-wider text-xs shadow-md shadow-cyan-500/20 text-white"
                        >
                            Confirm Ingestion
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Reset Sales Analytics Modal */}
            <Modal
                opened={showResetSalesConfirm}
                onClose={() => setShowResetSalesConfirm(false)}
                title={
                    <Group gap="xs">
                        <ThemeIcon size="md" color="red" variant="light" radius="md">
                            <AlertTriangle size={16} />
                        </ThemeIcon>
                        <Text fw={700} className="font-headline text-base text-slate-900 dark:text-white uppercase tracking-tight">
                            Reset Sales Analytics?
                        </Text>
                    </Group>
                }
                centered
                radius="lg"
                overlayProps={{ backgroundOpacity: 0.65, blur: 5 }}
                classNames={{
                    content: "bg-white dark:bg-[#111722] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 shadow-2xl rounded-2xl overflow-hidden",
                    header: "bg-white dark:bg-[#111722] border-b border-slate-200 dark:border-white/10 px-6 py-4",
                    body: "!px-6 !pt-5 !pb-6",
                    close: "text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors",
                }}
            >
                <Stack gap="md" className="pt-2">
                    <Text size="sm" className="text-slate-600 dark:text-slate-300">
                        Are you sure you want to <strong>permanently delete all existing reservations</strong> and clear all component popularity scores?
                    </Text>

                    <Text size="xs" c="red" className="font-semibold flex items-center gap-1.5">
                        <AlertTriangle size={14} />
                        This action is irreversible and cannot be undone.
                    </Text>

                    <Group justify="flex-end" gap="sm" className="pt-2">
                        <Button
                            variant="subtle"
                            color="gray"
                            radius="md"
                            size="sm"
                            onClick={() => setShowResetSalesConfirm(false)}
                            disabled={isResettingSales}
                        >
                            Cancel
                        </Button>
                        <Button
                            color="red"
                            radius="md"
                            size="sm"
                            onClick={handleResetSales}
                            loading={isResettingSales}
                            className="font-bold uppercase tracking-wider text-xs"
                        >
                            Confirm Full Reset
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Main Sales Analytics Component */}
            <div className="w-full">
                <SalesAnalytics
                    orders={orders || []}
                    parts={parts || []}
                    prebuilts={prebuiltSystems || []}
                />
            </div>
        </div>
    );
}
