"use client";

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
    Archive, Trash2
} from 'lucide-react';
import { Text, ThemeIcon, Modal, Group, Stack, Button } from '@mantine/core';
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/theme-provider";

// Custom Hooks
import { useAdminCore } from './hooks/use-admin-core';
import { useInventory } from './hooks/use-inventory';
import { useOrders } from './hooks/use-orders';
import { useBulkActions } from './hooks/use-bulk-actions';
import { usePersistentState } from '@/hooks/use-persistent-state';
import { RouteGuard } from '@/components/auth/route-guard';
import { useAuditLogs } from '@/app/profile/hooks/use-audit-logs';
import { useSiteSettings } from '@/context/site-settings-context';

// Sidebar & Layout Components
import { AdminSidebar, SidebarInset, SidebarProvider } from './components/admin-sidebar';
import { AdminTopbar } from './components/admin-topbar';

// Sub-components
import { StockTab } from './components/stock-tab';
import { AdminProductFocus } from '@/components/admin-product-focus';
import { safeStaffProductReturn } from '@/lib/product-identity';
import { AdminTabHeader, AdminTabHeaderProvider } from './components/admin-tab-header';
import { useSalesActions } from './hooks/use-sales-actions';

const PanelLoading = () => <div role="status" className="min-h-40 flex items-center justify-center text-slate-600 dark:text-slate-400">Loading section...</div>;
const PrebuiltTab = dynamic(() => import('./components/prebuilt-tab').then(module => module.PrebuiltTab), { loading: PanelLoading });
const ReservationsTab = dynamic(() => import('./components/reservations-tab').then(module => module.ReservationsTab), { loading: PanelLoading });
const SalesTab = dynamic(() => import('./components/sales-tab').then(module => module.SalesTab), { loading: PanelLoading });
const ArchiveTab = dynamic(() => import('./components/archive-tab').then(module => module.ArchiveTab), { loading: PanelLoading });
const SuperAdminSettings = dynamic(() => import('@/components/super-admin-settings').then(module => module.SuperAdminSettings), { loading: PanelLoading });
const AuditLogsSection = dynamic(() => import('@/app/profile/components/audit-logs-section').then(module => module.AuditLogsSection), { loading: PanelLoading });
const AiModelSettings = dynamic(() => import('@/components/ai-model-settings').then(module => module.AiModelSettings), { loading: PanelLoading });
const AiSystemPromptsSettings = dynamic(() => import('@/components/ai-system-prompts-settings').then(module => module.AiSystemPromptsSettings), { loading: PanelLoading });

/**
 * Admin Dashboard - Orchestrator Component
 */
export default function AdminPage() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { authUser, profile, handleTabAccess, currentTab, searchParams } = useAdminCore();
    const requestedAction = searchParams.get('action') === 'stock' ? '&action=stock' : '';
    const itemReturn = safeStaffProductReturn(`/admin?tab=${searchParams.get('tab') || 'stock'}&product=${searchParams.get('product') || ''}${requestedAction}`);

    // AI & Sales sub-view state synced with URL `?sub=` or legacy `?tab=prompts`
    const [aiSubTab, setAiSubTab] = useState<'intelligence' | 'prompts'>('intelligence');
    const [salesSubTab, setSalesSubTab] = useState<'overview' | 'popularity'>('overview');

    useEffect(() => {
        const rawTab = searchParams.get('tab');
        const subParam = searchParams.get('sub');
        if (rawTab === 'prompts' || subParam === 'prompts') {
            setAiSubTab('prompts');
        } else if (subParam === 'intelligence') {
            setAiSubTab('intelligence');
        } else if (subParam === 'popularity') {
            setSalesSubTab('popularity');
        } else if (subParam === 'overview') {
            setSalesSubTab('overview');
        }
    }, [searchParams]);

    // Relocated data hooks
    const { auditLogs, auditLogsLoading } = useAuditLogs(currentTab === 'audit');
    const { featureModelRouting, aiModelProvider } = useSiteSettings();
    const routingValues = featureModelRouting ? Object.values(featureModelRouting) : [aiModelProvider];
    const allVertex = routingValues.every((v) => v === 'finetuned');
    const allGemini = routingValues.every((v) => v === 'default');
    const intelligenceBadge = allVertex ? 'Vertex' : allGemini ? 'Gemini' : 'Hybrid';
    const intelligenceBadgeColor = allVertex ? 'indigo' : allGemini ? 'cyan' : 'violet';

    const {
        parts, partsLoading, prebuiltSystems, prebuiltsLoading,
        handleAddPart, handleUpdatePart, handleUpdatePartStock, handleAddPartStock, handleDeletePart, handleArchivePart,
        handleAddPrebuilt, handleUpdatePrebuilt, handleDeletePrebuilt, handleArchivePrebuilt,
        componentCategories: initialCategories
    } = useInventory(profile);

    const { orders, ordersLoading, handleReservationAction, handleUpdateOrder, stats } = useOrders(profile);

    const salesActions = useSalesActions({
        orders: orders || [],
        parts: parts || [],
        prebuiltSystems: prebuiltSystems || []
    });

    const {
        selectedPartIds, setSelectedPartIds, selectedPrebuiltIds, setSelectedPrebuiltIds,
        isPartSelectionMode, setIsPartSelectionMode, isPrebuiltSelectionMode, setIsPrebuiltSelectionMode,
        confirmAction, setConfirmAction, togglePartSelection, toggleAllPartsSelection,
        togglePrebuiltSelection, toggleAllPrebuiltsSelection, executeBulkAction
    } = useBulkActions(profile);

    // Persistent State for filters
    const [partCategories, setPartCategories] = usePersistentState('admin_part_categories', initialCategories);
    const [prebuiltCategories, setPrebuiltCategories] = usePersistentState('admin_prebuilt_categories', [
        { name: "Entry", selected: true },
        { name: "Mid-Range", selected: true },
        { name: "High-End", selected: true },
        { name: "Workstation", selected: true }
    ]);

    const activePartsCount = useMemo(
        () => (parts || []).filter((part) => !part.isArchived).length,
        [parts]
    );
    const activePrebuiltsCount = useMemo(
        () => (prebuiltSystems || []).filter((system) => !system.isArchived).length,
        [prebuiltSystems]
    );

    // Tab-level search state connected to AdminTopbar
    const [tabSearchQueries, setTabSearchQueries] = useState<Record<string, string>>({
        stock: '',
        prebuilts: '',
        reservations: '',
        archive: '',
        audit: '',
    });

    const searchPlaceholders: Record<string, string> = {
        stock: 'Search parts by name, brand, or SKU...',
        prebuilts: 'Search systems by name, SKU, or specs...',
        reservations: 'Search by email, rig, or ID...',
        archive: 'Search archived assets...',
        audit: 'Search audit logs...',
    };

    const hasSearch = currentTab in searchPlaceholders;
    const currentSearchQuery = tabSearchQueries[currentTab] ?? '';
    const handleSearchQueryChange = (val: string) => {
        setTabSearchQueries(prev => ({ ...prev, [currentTab]: val }));
    };

    return (
        <RouteGuard requiredPermission="canAccessAdmin" fallbackPath={itemReturn === '/admin' ? '/system-access' : `/system-access?returnTo=${encodeURIComponent(itemReturn)}`}>
            <SidebarProvider defaultOpen={true}>
                <AdminSidebar
                    currentTab={currentTab}
                    onSelectTab={handleTabAccess}
                    aiSubTab={aiSubTab}
                    onSelectAiSubTab={setAiSubTab}
                    salesSubTab={salesSubTab}
                    onSelectSalesSubTab={setSalesSubTab}
                    profile={profile}
                    authUser={authUser}
                    partsCount={activePartsCount}
                    prebuiltsCount={activePrebuiltsCount}
                    pendingOrdersCount={stats.pendingOrdersCount}
                    auditLogsCount={auditLogs.length}
                    intelligenceBadge={intelligenceBadge}
                    intelligenceBadgeColor={intelligenceBadgeColor}
                />

                <SidebarInset
                    className={cn(
                        "min-h-svh transition-colors duration-300 overflow-x-hidden",
                        isDark ? "bg-[#0c0f14] text-slate-50" : "bg-slate-50 text-slate-900"
                    )}
                >
                    {/* Circuit Pattern Background */}
                    <div
                        className={cn(
                            "fixed inset-0 opacity-[0.03] pointer-events-none z-0",
                            isDark ? "invert" : ""
                        )}
                        style={{
                            backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px)',
                            backgroundSize: '24px 24px',
                        }}
                    />

                    <AdminTopbar
                        currentTab={currentTab}
                        aiSubTab={aiSubTab}
                        salesSubTab={salesSubTab}
                        profile={profile}
                        authUser={authUser}
                        showSearch={hasSearch}
                        searchQuery={currentSearchQuery}
                        onSearchQueryChange={handleSearchQueryChange}
                        searchPlaceholder={searchPlaceholders[currentTab]}
                    />

                    <AdminTabHeaderProvider>
                        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-8 xl:px-10 py-4 sm:py-6 md:py-8 relative z-10 flex-1">
                            <AdminTabHeader
                                currentTab={currentTab}
                                isSuperAdmin={profile?.isSuperAdmin}
                                pendingOrdersCount={stats.pendingOrdersCount}
                                auditLogsCount={auditLogs.length}
                                intelligenceBadge={intelligenceBadge}
                                intelligenceBadgeColor={intelligenceBadgeColor}
                                onOpenIngestDummy={() => salesActions.setShowIngestDummyConfirm(true)}
                                onOpenResetSales={() => salesActions.setShowResetSalesConfirm(true)}
                                onExportSales={salesActions.handleExportSales}
                                isIngestingDummyData={salesActions.isIngestingDummyData}
                                isResettingSales={salesActions.isResettingSales}
                                isExportingSales={salesActions.isExportingSales}
                                showIngestDummyConfirm={salesActions.showIngestDummyConfirm}
                                onCloseIngestDummyConfirm={() => salesActions.setShowIngestDummyConfirm(false)}
                                onConfirmIngestDummy={salesActions.handleIngestDummyData}
                                showResetSalesConfirm={salesActions.showResetSalesConfirm}
                                onCloseResetSalesConfirm={() => salesActions.setShowResetSalesConfirm(false)}
                                onConfirmResetSales={salesActions.handleResetSales}
                            />

                            <AdminProductFocus
                                parts={parts || []}
                                systems={prebuiltSystems || []}
                                loading={partsLoading || prebuiltsLoading}
                                addPartStock={handleAddPartStock}
                            />

                            {currentTab === "stock" && (
                                <StockTab
                                    parts={parts}
                                    partsLoading={partsLoading}
                                    profile={profile}
                                    partCategories={partCategories}
                                    onSetCategories={setPartCategories}
                                    onAddPart={handleAddPart}
                                    onUpdatePart={handleUpdatePart}
                                    onDeletePart={handleDeletePart}
                                    onArchivePart={handleArchivePart}
                                    onUpdatePartStock={handleUpdatePartStock}
                                    onAddPartStock={handleAddPartStock}
                                    isPartSelectionMode={isPartSelectionMode}
                                    setIsPartSelectionMode={setIsPartSelectionMode}
                                    selectedPartIds={selectedPartIds}
                                    setSelectedPartIds={setSelectedPartIds}
                                    togglePartSelection={togglePartSelection}
                                    toggleAllPartsSelection={toggleAllPartsSelection}
                                    setConfirmAction={setConfirmAction}
                                    searchQuery={tabSearchQueries.stock}
                                    onSearchQueryChange={(val) => setTabSearchQueries(prev => ({ ...prev, stock: val }))}
                                />
                            )}

                            {currentTab === "prebuilts" && (
                                <div className="mt-4">
                                    <PrebuiltTab
                                        prebuiltSystems={prebuiltSystems || []}
                                        prebuiltsLoading={prebuiltsLoading}
                                        parts={parts}
                                        profile={profile}
                                        prebuiltCategories={prebuiltCategories}
                                        onSetCategories={setPrebuiltCategories}
                                        onAddPrebuilt={handleAddPrebuilt}
                                        onUpdatePrebuilt={handleUpdatePrebuilt}
                                        onDeletePrebuilt={handleDeletePrebuilt}
                                        onArchivePrebuilt={handleArchivePrebuilt}
                                        isPrebuiltSelectionMode={isPrebuiltSelectionMode}
                                        setIsPrebuiltSelectionMode={setIsPrebuiltSelectionMode}
                                        selectedPrebuiltIds={selectedPrebuiltIds}
                                        setSelectedPrebuiltIds={setSelectedPrebuiltIds}
                                        togglePrebuiltSelection={togglePrebuiltSelection}
                                        toggleAllPrebuiltsSelection={toggleAllPrebuiltsSelection}
                                        setConfirmAction={setConfirmAction}
                                        searchQuery={tabSearchQueries.prebuilts}
                                        onSearchQueryChange={(val) => setTabSearchQueries(prev => ({ ...prev, prebuilts: val }))}
                                    />
                                </div>
                            )}

                            {currentTab === "reservations" && (
                                <div className="mt-4">
                                    <ReservationsTab
                                        orders={(orders || []).filter(order => !order.isArchived)}
                                        ordersLoading={ordersLoading}
                                        isSuperAdmin={profile?.isSuperAdmin === true}
                                        onReservationAction={handleReservationAction}
                                        onUpdateOrder={handleUpdateOrder}
                                        searchQuery={tabSearchQueries.reservations}
                                        onSearchQueryChange={(val) => setTabSearchQueries(prev => ({ ...prev, reservations: val }))}
                                    />
                                </div>
                            )}

                            {currentTab === "sales" && profile?.isSuperAdmin && (
                                <div className="mt-4">
                                    <SalesTab
                                        orders={orders || []}
                                        parts={parts}
                                        prebuiltSystems={prebuiltSystems || []}
                                        activeSubTab={salesSubTab}
                                    />
                                </div>
                            )}

                            {currentTab === "archive" && (
                                <div className="mt-4">
                                    <ArchiveTab
                                        parts={parts}
                                        partsLoading={partsLoading}
                                        prebuiltSystems={prebuiltSystems || []}
                                        prebuiltsLoading={prebuiltsLoading}
                                        orders={(orders || []).filter(order => Boolean(order.isArchived))}
                                        ordersLoading={ordersLoading}
                                        onReservationAction={handleReservationAction}
                                        onUpdateOrder={handleUpdateOrder}
                                        profile={profile}
                                        onDeletePart={handleDeletePart}
                                        onArchivePart={handleArchivePart}
                                        onUpdatePartStock={handleUpdatePartStock}
                                        onUpdatePart={handleUpdatePart}
                                        onDeletePrebuilt={handleDeletePrebuilt}
                                        onArchivePrebuilt={handleArchivePrebuilt}
                                        onUpdatePrebuilt={handleUpdatePrebuilt}
                                        selectedPartIds={selectedPartIds}
                                        setSelectedPartIds={setSelectedPartIds}
                                        togglePartSelection={togglePartSelection}
                                        toggleAllPartsSelection={toggleAllPartsSelection}
                                        selectedPrebuiltIds={selectedPrebuiltIds}
                                        setSelectedPrebuiltIds={setSelectedPrebuiltIds}
                                        togglePrebuiltSelection={togglePrebuiltSelection}
                                        toggleAllPrebuiltsSelection={toggleAllPrebuiltsSelection}
                                        setConfirmAction={setConfirmAction}
                                        searchQuery={tabSearchQueries.archive}
                                        onSearchQueryChange={(val) => setTabSearchQueries(prev => ({ ...prev, archive: val }))}
                                    />
                                </div>
                            )}

                            {currentTab === "audit" && (
                                <div className="mt-4 flex flex-col gap-6">
                                    <AuditLogsSection
                                        logs={auditLogs}
                                        loading={auditLogsLoading}
                                        searchQuery={tabSearchQueries.audit}
                                        onSearchQueryChange={(val) => setTabSearchQueries(prev => ({ ...prev, audit: val }))}
                                    />
                                </div>
                            )}

                            {currentTab === "management" && profile?.isSuperAdmin && (
                                <div className="mt-4 flex flex-col gap-6">
                                    <SuperAdminSettings />
                                </div>
                            )}

                            {currentTab === "ai" && profile?.isSuperAdmin && (
                                <div className="mt-4 flex flex-col gap-6">
                                    {aiSubTab === 'intelligence' ? (
                                        <AiModelSettings />
                                    ) : (
                                        <AiSystemPromptsSettings />
                                    )}
                                </div>
                            )}

                            {/* Global Bulk Action Confirmation Modal */}
                            <Modal
                                opened={confirmAction.isOpen}
                                onClose={() => setConfirmAction(prev => ({ ...prev, isOpen: false }))}
                                title={
                                    <Group gap="xs">
                                        <ThemeIcon
                                            size="md"
                                            color={confirmAction.type === 'delete' ? 'red' : confirmAction.type === 'archive' ? 'orange' : 'cyan'}
                                            variant="light"
                                            radius="md"
                                        >
                                            {confirmAction.type === 'delete' ? <Trash2 size={16} /> : <Archive size={16} />}
                                        </ThemeIcon>
                                        <Text fw={700} className="font-headline text-base text-slate-900 dark:text-white uppercase tracking-tight">
                                            Confirm {confirmAction.type.charAt(0).toUpperCase() + confirmAction.type.slice(1)} Action
                                        </Text>
                                    </Group>
                                }
                                centered
                                radius="lg"
                                size="sm"
                                overlayProps={{ backgroundOpacity: 0.65, blur: 5 }}
                                classNames={{
                                    content: "bg-white/95 dark:bg-[#141a23]/95 backdrop-blur-md border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-slate-100 shadow-xl rounded-xl overflow-hidden",
                                    header: "bg-white/95 dark:bg-[#141a23]/95 border-b border-slate-200/80 dark:border-white/10 p-3",
                                    body: "!p-3",
                                    close: "text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors",
                                }}
                            >
                                <Stack gap="md" className="pt-1">
                                    <Text size="sm" className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                        {confirmAction.type === 'delete'
                                            ? "This action is PERMANENT and cannot be undone. All selected items will be removed forever."
                                            : confirmAction.type === 'archive'
                                                ? "Are you sure you want to move the selected items to the archive?"
                                                : "Are you sure you want to restore the selected items to the main inventory?"}
                                    </Text>

                                    <Group justify="flex-end" gap="xs" pt="xs">
                                        <Button
                                            variant="default"
                                            size="sm"
                                            radius="md"
                                            onClick={() => setConfirmAction(prev => ({ ...prev, isOpen: false }))}
                                            className="border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            size="sm"
                                            radius="md"
                                            color={confirmAction.type === 'delete' ? 'red' : confirmAction.type === 'archive' ? 'orange' : 'cyan'}
                                            className="font-bold text-xs uppercase tracking-wider"
                                            onClick={executeBulkAction}
                                        >
                                            Confirm {confirmAction.type.charAt(0).toUpperCase() + confirmAction.type.slice(1)}
                                        </Button>
                                    </Group>
                                </Stack>
                            </Modal>
                        </div>
                    </AdminTabHeaderProvider>
                </SidebarInset>
            </SidebarProvider>
        </RouteGuard>
    );
}
