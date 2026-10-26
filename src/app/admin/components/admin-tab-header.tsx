"use client";

import React, { createContext, useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import { 
    Clock,
    Plus,
    RefreshCcw,
    Sparkles,
    AlertTriangle,
    FileSpreadsheet,
    QrCode,
    Scan
} from 'lucide-react';
import { 
    ActionIcon,
    ThemeIcon, 
    Text, 
    Badge, 
    Button, 
    Group, 
    Modal, 
    Stack,
    Menu,
    Tooltip
} from '@mantine/core';
import { cn } from "@/lib/utils";
import { QRHealthDialog } from '@/components/qr-health-dialog';
import { QRScannerDialog } from '@/components/qr-scanner-dialog';

interface AdminTabHeaderContextValue {
    countSlot: HTMLElement | null;
    actionsSlot: HTMLElement | null;
    chipsSlot: HTMLElement | null;
    setCountSlot: (el: HTMLElement | null) => void;
    setActionsSlot: (el: HTMLElement | null) => void;
    setChipsSlot: (el: HTMLElement | null) => void;
}

const AdminTabHeaderContext = createContext<AdminTabHeaderContextValue | null>(null);

export function AdminTabHeaderProvider({ children }: { children: React.ReactNode }) {
    const [countSlot, setCountSlot] = useState<HTMLElement | null>(null);
    const [actionsSlot, setActionsSlot] = useState<HTMLElement | null>(null);
    const [chipsSlot, setChipsSlot] = useState<HTMLElement | null>(null);

    return (
        <AdminTabHeaderContext.Provider
            value={{
                countSlot,
                actionsSlot,
                chipsSlot,
                setCountSlot,
                setActionsSlot,
                setChipsSlot,
            }}
        >
            {children}
        </AdminTabHeaderContext.Provider>
    );
}

export function AdminHeaderSlot({
    countBadge,
    actions,
    chips,
}: {
    countBadge?: React.ReactNode;
    actions?: React.ReactNode;
    chips?: React.ReactNode;
}) {
    const ctx = useContext(AdminTabHeaderContext);

    if (ctx && ctx.actionsSlot) {
        return (
            <>
                {countBadge && ctx.countSlot ? createPortal(countBadge, ctx.countSlot) : null}
                {actions && ctx.actionsSlot ? createPortal(actions, ctx.actionsSlot) : null}
            </>
        );
    }

    // Fallback when rendered standalone outside AdminTabHeaderProvider
    return (
        <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">{countBadge}</div>
                <div className="flex flex-wrap items-center gap-2">{actions}</div>
            </div>
            {chips}
        </div>
    );
}

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
    onExportSales?: () => void;
    isIngestingDummyData?: boolean;
    isResettingSales?: boolean;
    isExportingSales?: boolean;
    showIngestDummyConfirm?: boolean;
    onCloseIngestDummyConfirm?: () => void;
    onConfirmIngestDummy?: () => void;
    showResetSalesConfirm?: boolean;
    onCloseResetSalesConfirm?: () => void;
    onConfirmResetSales?: () => void;
}

export function AdminTabHeader({
    currentTab,
    pendingOrdersCount = 0,
    intelligenceBadge = 'Ready',
    intelligenceBadgeColor = 'teal',
    onOpenIngestDummy,
    onOpenResetSales,
    onExportSales,
    isIngestingDummyData = false,
    isResettingSales = false,
    isExportingSales = false,
    showIngestDummyConfirm = false,
    onCloseIngestDummyConfirm,
    onConfirmIngestDummy,
    showResetSalesConfirm = false,
    onCloseResetSalesConfirm,
    onConfirmResetSales,
}: AdminTabHeaderProps) {
    const ctx = useContext(AdminTabHeaderContext);

    return (
        <div className="relative mb-4 space-y-2.5">
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
                <div ref={ctx?.setCountSlot} className="contents" />
                {/* Unified 36px Action Bar */}
                <div className="ml-auto flex flex-wrap items-center gap-2 shrink-0">
                    {(currentTab === 'stock' || currentTab === 'prebuilts') && (
                        <Menu position="bottom-end" shadow="md" width={180} withinPortal>
                            <Menu.Target>
                                <Tooltip label="QR tools" withArrow position="top">
                                    <ActionIcon
                                        variant="default"
                                        radius="md"
                                        size={36}
                                        aria-label="QR tools"
                                    >
                                        <QrCode size={16} />
                                    </ActionIcon>
                                </Tooltip>
                            </Menu.Target>
                            <Menu.Dropdown>
                                <QRScannerDialog
                                    trigger={(open) => (
                                        <Menu.Item leftSection={<Scan size={16} />} onClick={open}>
                                            Scan QR
                                        </Menu.Item>
                                    )}
                                />
                                <QRHealthDialog
                                    trigger={(open) => (
                                        <Menu.Item leftSection={<QrCode size={16} />} onClick={open}>
                                            QR health
                                        </Menu.Item>
                                    )}
                                />
                            </Menu.Dropdown>
                        </Menu>
                    )}

                    {currentTab === 'reservations' && pendingOrdersCount > 0 && (
                        <Badge
                            size="lg"
                            color="yellow"
                            variant="filled"
                            radius="md"
                            leftSection={<Clock className="h-3.5 w-3.5" />}
                            className="h-9 font-headline font-bold uppercase tracking-wider text-slate-950 bg-yellow-400 px-3"
                        >
                            {pendingOrdersCount} Pending Review
                        </Badge>
                    )}

                    {/* Dynamic Tab Controls Slot (Bulk Select, Filters & sort, View Toggle, Primary CTA) */}
                    <div ref={ctx?.setActionsSlot} className="contents" />

                    {currentTab === 'sales' && (
                        <Group gap="xs">
                            <Button
                                onClick={onExportSales}
                                loading={isExportingSales}
                                color="cyan"
                                variant="filled"
                                radius="md"
                                size="sm"
                                h={36}
                                leftSection={<FileSpreadsheet className="h-4 w-4" />}
                                className="font-headline font-bold text-xs uppercase tracking-wider shadow-sm transition-all"
                            >
                                Export to Excel
                            </Button>

                            <Button
                                variant="light"
                                color="cyan"
                                radius="md"
                                size="sm"
                                h={36}
                                leftSection={<Plus className={cn("h-4 w-4", isIngestingDummyData && "animate-pulse")} />}
                                onClick={onOpenIngestDummy}
                                loading={isIngestingDummyData}
                                className="font-headline font-bold text-xs uppercase tracking-wider transition-all"
                            >
                                Ingest Dummy Data
                            </Button>

                            <Button
                                variant="subtle"
                                color="red"
                                radius="md"
                                size="sm"
                                h={36}
                                leftSection={<RefreshCcw className={cn("h-4 w-4", isResettingSales && "animate-spin")} />}
                                onClick={onOpenResetSales}
                                loading={isResettingSales}
                                className="font-headline font-bold text-xs uppercase tracking-wider text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-all"
                            >
                                Reset Analytics
                            </Button>
                        </Group>
                    )}

                    {currentTab === 'management' && (
                        <Badge size="md" color="cyan" variant="light" radius="md" className="font-bold">
                            Admin Portal
                        </Badge>
                    )}

                    {currentTab === 'ai' && (
                        <Badge size="md" color={intelligenceBadgeColor} variant="light" radius="md" className="font-bold">
                            {intelligenceBadge}
                        </Badge>
                    )}
                </div>
            </div>

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
                        header: "bg-white/95 dark:bg-[#141a23]/95 border-b border-slate-200/80 dark:border-white/10 p-3",
                        body: "!p-3",
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
                        header: "bg-white/95 dark:bg-[#141a23]/95 border-b border-slate-200/80 dark:border-white/10 p-3",
                        body: "!p-3",
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
