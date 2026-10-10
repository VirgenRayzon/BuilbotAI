"use client";

import React from 'react';
import { 
    Package, 
    Monitor, 
    Archive, 
    BarChart3, 
    ShoppingBag,
    Shield, 
    Sliders, 
    Bot, 
    FileText,
    Clock,
    Plus,
    RefreshCcw,
    Sparkles,
    AlertTriangle
} from 'lucide-react';
import { 
    ThemeIcon, 
    Title, 
    Text, 
    Badge, 
    Button, 
    Group, 
    Modal, 
    Stack 
} from '@mantine/core';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";

export interface AdminTabHeaderProps {
    currentTab: string;
    isSuperAdmin?: boolean;
    pendingOrdersCount?: number;
    auditLogsCount?: number;
    intelligenceBadge?: string;
    intelligenceBadgeColor?: string;
    // Sales actions & modals
    onOpenIngestDummy?: () => void;
    onOpenResetSales?: () => void;
    isIngestingDummyData?: boolean;
    isResettingSales?: boolean;
    showIngestDummyConfirm?: boolean;
    onCloseIngestDummyConfirm?: () => void;
    onConfirmIngestDummy?: () => void;
    showResetSalesConfirm?: boolean;
    onCloseResetSalesConfirm?: () => void;
    onConfirmResetSales?: () => void;
}

interface TabMetadata {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    color: 'cyan' | 'indigo' | 'teal';
}

export function AdminTabHeader({
    currentTab,
    isSuperAdmin = false,
    pendingOrdersCount = 0,
    auditLogsCount = 0,
    intelligenceBadge = 'Ready',
    intelligenceBadgeColor = 'teal',
    onOpenIngestDummy,
    onOpenResetSales,
    isIngestingDummyData = false,
    isResettingSales = false,
    showIngestDummyConfirm = false,
    onCloseIngestDummyConfirm,
    onConfirmIngestDummy,
    showResetSalesConfirm = false,
    onCloseResetSalesConfirm,
    onConfirmResetSales,
}: AdminTabHeaderProps) {
    const tabMetaMap: Record<string, TabMetadata> = {
        stock: {
            title: "Manage Stock & Inventory",
            description: "Monitor component availability, update pricing, and restock hardware components.",
            icon: Package,
            color: "cyan",
        },
        prebuilts: {
            title: "Manage Prebuilt Systems",
            description: "Configure curated PC builds, set tier classifications, and manage showcase listings.",
            icon: Monitor,
            color: "cyan",
        },
        reservations: {
            title: "Reservations Management",
            description: "Live customer reservations, assembly tracking, and pipeline breakdown.",
            icon: ShoppingBag,
            color: "cyan",
        },
        sales: {
            title: "Sales & Analytics Dashboard",
            description: "Track reservations performance, revenue distributions, and component demand.",
            icon: BarChart3,
            color: "cyan",
        },
        archive: {
            title: "Inventory & Systems Archive",
            description: "Review decommissioned components and archived prebuilt systems, or restore them to active stock.",
            icon: Archive,
            color: "cyan",
        },
        audit: {
            title: isSuperAdmin ? "Admin Audit Logs" : "Staff Audit Logs",
            description: "Review staff activity, inventory changes, and account events.",
            icon: Shield,
            color: "cyan",
        },
        management: {
            title: "Management Portal",
            description: "Manage staff credentials, manager keys, and password reset requests.",
            icon: Sliders,
            color: "cyan",
        },
        ai: {
            title: "AI Engine & Directives",
            description: "Configure foundation models, provider routing, and agent persona system instructions.",
            icon: Bot,
            color: "indigo",
        },
        content: {
            title: "Site Content & Branding",
            description: "Update customer-facing company information, mission statement, and story.",
            icon: FileText,
            color: "teal",
        },
    };

    const currentMeta = tabMetaMap[currentTab] || {
        title: "Admin Dashboard",
        description: "Master control for system configurations, inventory, and operations.",
        icon: Package,
        color: "cyan",
    };

    const TabIcon = currentMeta.icon;

    return (
        <div className="mb-8">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentTab}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2"
                >
                    <div className="flex items-center gap-3.5">
                        <ThemeIcon size={44} radius="lg" color={currentMeta.color} variant="light">
                            <TabIcon className={cn(
                                "h-6 w-6",
                                currentMeta.color === 'cyan' && "text-cyan-600 dark:text-cyan-400",
                                currentMeta.color === 'indigo' && "text-indigo-600 dark:text-indigo-400",
                                currentMeta.color === 'teal' && "text-teal-600 dark:text-teal-400"
                            )} />
                        </ThemeIcon>
                        <div>
                            <Title order={1} className="text-2xl sm:text-3xl font-headline font-bold uppercase tracking-tight text-slate-900 dark:text-white">
                                {currentMeta.title}
                            </Title>
                            <Text size="xs" className="text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                                {currentMeta.description}
                            </Text>
                        </div>
                    </div>

                    {/* Dynamic Action Slots */}
                    <div className="flex items-center gap-3">
                        {currentTab === 'sales' && (
                            <Group gap="sm">
                                <Button
                                    variant="light"
                                    color="cyan"
                                    radius="md"
                                    size="sm"
                                    leftSection={<Plus className={cn("h-4 w-4", isIngestingDummyData && "animate-pulse")} />}
                                    onClick={onOpenIngestDummy}
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
                                    onClick={onOpenResetSales}
                                    loading={isResettingSales}
                                    className="font-headline font-bold text-xs uppercase tracking-wider text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    Reset Analytics
                                </Button>
                            </Group>
                        )}

                        {currentTab === 'reservations' && pendingOrdersCount > 0 && (
                            <Badge
                                size="md"
                                color="yellow"
                                variant="filled"
                                leftSection={<Clock className="h-3.5 w-3.5" />}
                                className="font-headline font-bold uppercase tracking-wider text-slate-950 bg-yellow-400 animate-pulse px-3 py-1"
                            >
                                {pendingOrdersCount} Pending Review
                            </Badge>
                        )}

                        {currentTab === 'audit' && auditLogsCount > 0 && (
                            <Badge size="sm" color="indigo" variant="light" className="font-bold">
                                {auditLogsCount} Records
                            </Badge>
                        )}

                        {currentTab === 'management' && (
                            <Badge size="sm" color="cyan" variant="light" className="font-bold">
                                Admin Portal
                            </Badge>
                        )}

                        {currentTab === 'ai' && (
                            <Badge size="sm" color={intelligenceBadgeColor} variant="light" className="font-bold">
                                {intelligenceBadge}
                            </Badge>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Ingest Dummy Data Modal */}
            {onCloseIngestDummyConfirm && onConfirmIngestDummy && (
                <Modal
                    opened={showIngestDummyConfirm}
                    onClose={onCloseIngestDummyConfirm}
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
                        content: "bg-white/95 dark:bg-[#141a23]/95 backdrop-blur-md border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-slate-100 shadow-xl rounded-xl overflow-hidden",
                        header: "bg-white/95 dark:bg-[#141a23]/95 border-b border-slate-200/80 dark:border-white/10 px-4 py-3",
                        body: "!px-4 !pt-3.5 !pb-4",
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
                                onClick={onCloseIngestDummyConfirm}
                                disabled={isIngestingDummyData}
                            >
                                Cancel
                            </Button>
                            <Button
                                color="cyan"
                                radius="md"
                                size="sm"
                                onClick={onConfirmIngestDummy}
                                loading={isIngestingDummyData}
                                className="font-bold uppercase tracking-wider text-xs shadow-md shadow-cyan-500/20 text-white"
                            >
                                Confirm Ingestion
                            </Button>
                        </Group>
                    </Stack>
                </Modal>
            )}

            {/* Reset Sales Analytics Modal */}
            {onCloseResetSalesConfirm && onConfirmResetSales && (
                <Modal
                    opened={showResetSalesConfirm}
                    onClose={onCloseResetSalesConfirm}
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
                        content: "bg-white/95 dark:bg-[#141a23]/95 backdrop-blur-md border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-slate-100 shadow-xl rounded-xl overflow-hidden",
                        header: "bg-white/95 dark:bg-[#141a23]/95 border-b border-slate-200/80 dark:border-white/10 px-4 py-3",
                        body: "!px-4 !pt-3.5 !pb-4",
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
                                onClick={onCloseResetSalesConfirm}
                                disabled={isResettingSales}
                            >
                                Cancel
                            </Button>
                            <Button
                                color="red"
                                radius="md"
                                size="sm"
                                onClick={onConfirmResetSales}
                                loading={isResettingSales}
                                className="font-bold uppercase tracking-wider text-xs"
                            >
                                Confirm Full Reset
                            </Button>
                        </Group>
                    </Stack>
                </Modal>
            )}
        </div>
    );
}
