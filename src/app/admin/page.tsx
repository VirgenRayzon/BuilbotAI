"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
    Package, Monitor,
    Archive, Trash2, BarChart3, ShoppingBag,
    Shield, Sliders, Bot, FileText, Cpu, FileCode
} from 'lucide-react';
import { Tabs, Badge, Text, ThemeIcon, Modal, Group, Stack, Button } from '@mantine/core';
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

// Sub-components
import { StockTab } from './components/stock-tab';
import { PrebuiltTab } from './components/prebuilt-tab';
import { ReservationsTab } from './components/reservations-tab';
import { SalesTab } from './components/sales-tab';
import { ArchiveTab } from './components/archive-tab';
import { AdminTabHeader } from './components/admin-tab-header';
import { useSalesActions } from './hooks/use-sales-actions';
import { SuperAdminSettings } from '@/components/super-admin-settings';
import { AuditLogsSection } from '@/app/profile/components/audit-logs-section';
import { AiModelSettings } from '@/components/ai-model-settings';
import { AiSystemPromptsSettings } from '@/components/ai-system-prompts-settings';
import { AboutManagement } from '@/components/about-management';

/**
 * Admin Dashboard - Orchestrator Component
 */
export default function AdminPage() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { profile, handleTabAccess, currentTab } = useAdminCore();

    // Horizontal tabs scroll reference
    const tabsScrollRef = useRef<HTMLDivElement>(null);

    // AI sub-view state (SegmentedControl switcher)
    const [aiSubTab, setAiSubTab] = useState<'intelligence' | 'prompts'>('intelligence');

    // Relocated data hooks
    const { auditLogs, auditLogsLoading } = useAuditLogs();
    const { featureModelRouting, aiModelProvider } = useSiteSettings();
    const routingValues = featureModelRouting ? Object.values(featureModelRouting) : [aiModelProvider];
    const allVertex = routingValues.every((v) => v === 'finetuned');
    const allGemini = routingValues.every((v) => v === 'default');
    const intelligenceBadge = allVertex ? 'Vertex' : allGemini ? 'Gemini' : 'Hybrid';
    const intelligenceBadgeColor = allVertex ? 'indigo' : allGemini ? 'cyan' : 'violet';

    // Horizontal wheel scroll handler for tabs
    useEffect(() => {
        const el = tabsScrollRef.current;
        if (!el) return;
        const onWheel = (e: WheelEvent) => {
            if (e.deltaY !== 0 && el.scrollWidth > el.clientWidth) {
                e.preventDefault();
                el.scrollLeft += e.deltaY;
            }
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, []);

    const {
        parts, partsLoading, prebuiltSystems, prebuiltsLoading,
        handleAddPart, handleUpdatePart, handleUpdatePartStock, handleAddPartStock, handleDeletePart, handleArchivePart,
        handleAddPrebuilt, handleUpdatePrebuilt, handleDeletePrebuilt, handleArchivePrebuilt,
        componentCategories: initialCategories
    } = useInventory(profile);

    const { orders, ordersLoading, handleDeleteOrder, handleUpdateOrder, stats } = useOrders(profile);

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

    return (
        <RouteGuard requiredPermission="canAccessAdmin" fallbackPath="/system-access">
            <div className={cn(
                "min-h-screen transition-colors duration-500 overflow-x-hidden",
                isDark ? "bg-[#0c0f14] text-slate-50" : "bg-white text-slate-900"
            )}>
                {/* Circuit Pattern Background */}
                <div className={cn(
                    "fixed inset-0 opacity-[0.03] pointer-events-none z-0",
                    isDark ? "invert" : ""
                )} style={{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />

                <div className="w-full px-3 sm:px-6 md:px-8 lg:px-10 py-4 sm:py-6 md:py-8 relative z-10">
                    <AdminTabHeader
                        currentTab={currentTab}
                        isSuperAdmin={profile?.isSuperAdmin}
                        pendingOrdersCount={stats.pendingOrdersCount}
                        auditLogsCount={auditLogs.length}
                        intelligenceBadge={intelligenceBadge}
                        intelligenceBadgeColor={intelligenceBadgeColor}
                        onOpenIngestDummy={() => salesActions.setShowIngestDummyConfirm(true)}
                        onOpenResetSales={() => salesActions.setShowResetSalesConfirm(true)}
                        isIngestingDummyData={salesActions.isIngestingDummyData}
                        isResettingSales={salesActions.isResettingSales}
                        showIngestDummyConfirm={salesActions.showIngestDummyConfirm}
                        onCloseIngestDummyConfirm={() => salesActions.setShowIngestDummyConfirm(false)}
                        onConfirmIngestDummy={salesActions.handleIngestDummyData}
                        showResetSalesConfirm={salesActions.showResetSalesConfirm}
                        onCloseResetSalesConfirm={() => salesActions.setShowResetSalesConfirm(false)}
                        onConfirmResetSales={salesActions.handleResetSales}
                    />

                    <Tabs
                        value={currentTab}
                        onChange={(val) => val && handleTabAccess(val)}
                        variant="pills"
                        radius="md"
                        color="cyan"
                        className="w-full"
                        keepMounted={false}
                    >
                        {/* Horizontal Tab Strip Container with Fluid Touch Scrolling */}
                        <div className="w-full mb-6 border-b border-slate-200 dark:border-white/10 pb-3">
                            <div
                                ref={tabsScrollRef}
                                className="w-full overflow-x-auto pb-1 no-scrollbar sm:scrollbar-thin sm:scrollbar-thumb-slate-300 sm:dark:scrollbar-thumb-slate-700/80 hover:scrollbar-thumb-cyan-500/60 dark:hover:scrollbar-thumb-cyan-500/60 scrollbar-track-transparent transition-colors"
                            >
                                <Tabs.List className="bg-slate-100 dark:bg-[#141a23] p-1.5 rounded-xl border border-slate-200 dark:border-white/10 inline-flex flex-nowrap gap-1.5 min-w-max">
                                    <Tabs.Tab
                                        value="stock"
                                        leftSection={<Package className="h-4 w-4" />}
                                        className="font-headline font-bold text-xs uppercase tracking-wider min-h-[44px] py-2 px-3.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all whitespace-nowrap data-[active=true]:bg-white dark:data-[active=true]:bg-[#1e2634] data-[active=true]:text-cyan-600 dark:data-[active=true]:text-cyan-400 data-[active=true]:shadow-sm"
                                    >
                                        Manage Stock
                                    </Tabs.Tab>
                                    <Tabs.Tab
                                        value="prebuilts"
                                        leftSection={<Monitor className="h-4 w-4" />}
                                        className="font-headline font-bold text-xs uppercase tracking-wider min-h-[44px] py-2 px-3.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all whitespace-nowrap data-[active=true]:bg-white dark:data-[active=true]:bg-[#1e2634] data-[active=true]:text-cyan-600 dark:data-[active=true]:text-cyan-400 data-[active=true]:shadow-sm"
                                    >
                                        Manage Prebuilts
                                    </Tabs.Tab>
                                    <Tabs.Tab
                                        value="reservations"
                                        leftSection={<ShoppingBag className="h-4 w-4" />}
                                        className="font-headline font-bold text-xs uppercase tracking-wider min-h-[44px] py-2 px-3.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all whitespace-nowrap data-[active=true]:bg-white dark:data-[active=true]:bg-[#1e2634] data-[active=true]:text-cyan-600 dark:data-[active=true]:text-cyan-400 data-[active=true]:shadow-sm"
                                    >
                                        Reservations
                                    </Tabs.Tab>
                                    {profile?.isSuperAdmin && (
                                        <Tabs.Tab
                                            value="sales"
                                            leftSection={<BarChart3 className="h-4 w-4" />}
                                            className="font-headline font-bold text-xs uppercase tracking-wider min-h-[44px] py-2 px-3.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all whitespace-nowrap data-[active=true]:bg-white dark:data-[active=true]:bg-[#1e2634] data-[active=true]:text-cyan-600 dark:data-[active=true]:text-cyan-400 data-[active=true]:shadow-sm"
                                        >
                                            Sales & Analytics
                                        </Tabs.Tab>
                                    )}
                                    <Tabs.Tab
                                        value="archive"
                                        leftSection={<Archive className="h-4 w-4" />}
                                        className="font-headline font-bold text-xs uppercase tracking-wider min-h-[44px] py-2 px-3.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all whitespace-nowrap data-[active=true]:bg-white dark:data-[active=true]:bg-[#1e2634] data-[active=true]:text-cyan-600 dark:data-[active=true]:text-cyan-400 data-[active=true]:shadow-sm"
                                    >
                                        Archive
                                    </Tabs.Tab>

                                    {/* Relocated Tabs */}
                                    <Tabs.Tab
                                        value="audit"
                                        leftSection={<Shield className="h-4 w-4" />}
                                        className="font-headline font-bold text-xs uppercase tracking-wider min-h-[44px] py-2 px-3.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all whitespace-nowrap data-[active=true]:bg-white dark:data-[active=true]:bg-[#1e2634] data-[active=true]:text-cyan-600 dark:data-[active=true]:text-cyan-400 data-[active=true]:shadow-sm"
                                    >
                                        Audit Logs
                                    </Tabs.Tab>

                                    {profile?.isSuperAdmin && (
                                        <Tabs.Tab
                                            value="management"
                                            leftSection={<Sliders className="h-4 w-4" />}
                                            className="font-headline font-bold text-xs uppercase tracking-wider min-h-[44px] py-2 px-3.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all whitespace-nowrap data-[active=true]:bg-white dark:data-[active=true]:bg-[#1e2634] data-[active=true]:text-cyan-600 dark:data-[active=true]:text-cyan-400 data-[active=true]:shadow-sm"
                                        >
                                            Management Portal
                                        </Tabs.Tab>
                                    )}

                                    {profile?.isSuperAdmin && (
                                        <Tabs.Tab
                                            value="ai"
                                            leftSection={<Bot className="h-4 w-4" />}
                                            rightSection={
                                                <Badge size="xs" color={intelligenceBadgeColor} variant="light" className="font-bold ml-1">
                                                    {intelligenceBadge}
                                                </Badge>
                                            }
                                            className="font-headline font-bold text-xs uppercase tracking-wider min-h-[44px] py-2 px-3.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all whitespace-nowrap data-[active=true]:bg-white dark:data-[active=true]:bg-[#1e2634] data-[active=true]:text-cyan-600 dark:data-[active=true]:text-cyan-400 data-[active=true]:shadow-sm"
                                        >
                                            AI
                                        </Tabs.Tab>
                                    )}

                                    {profile?.isSuperAdmin && (
                                        <Tabs.Tab
                                            value="content"
                                            leftSection={<FileText className="h-4 w-4" />}
                                            className="font-headline font-bold text-xs uppercase tracking-wider min-h-[44px] py-2 px-3.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all whitespace-nowrap data-[active=true]:bg-white dark:data-[active=true]:bg-[#1e2634] data-[active=true]:text-cyan-600 dark:data-[active=true]:text-cyan-400 data-[active=true]:shadow-sm"
                                        >
                                            Site Content
                                        </Tabs.Tab>
                                    )}
                                </Tabs.List>
                            </div>
                        </div>

                        <Tabs.Panel value="stock">
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
                            />
                        </Tabs.Panel>

                        <Tabs.Panel value="prebuilts" className="mt-6">
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
                            />
                        </Tabs.Panel>

                        <Tabs.Panel value="reservations" className="mt-6">
                            <ReservationsTab
                                orders={orders || []}
                                ordersLoading={ordersLoading}
                                onDeleteOrder={handleDeleteOrder}
                                onUpdateOrder={handleUpdateOrder}
                            />
                        </Tabs.Panel>

                        {profile?.isSuperAdmin && (
                            <Tabs.Panel value="sales" className="mt-6">
                                <SalesTab
                                    orders={orders || []}
                                    parts={parts}
                                    prebuiltSystems={prebuiltSystems || []}
                                />
                            </Tabs.Panel>
                        )}

                        <Tabs.Panel value="archive" className="mt-6">
                            <ArchiveTab
                                parts={parts}
                                partsLoading={partsLoading}
                                prebuiltSystems={prebuiltSystems || []}
                                prebuiltsLoading={prebuiltsLoading}
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
                            />
                        </Tabs.Panel>

                        {/* Relocated Tab Panels */}
                        <Tabs.Panel value="audit" className="mt-6">
                            <div className="space-y-6">
                                <AuditLogsSection
                                    logs={auditLogs}
                                    loading={auditLogsLoading}
                                />
                            </div>
                        </Tabs.Panel>

                        {profile?.isSuperAdmin && (
                            <Tabs.Panel value="management" className="mt-6">
                                <div className="space-y-6">
                                    <SuperAdminSettings />
                                </div>
                            </Tabs.Panel>
                        )}

                        {profile?.isSuperAdmin && (
                            <Tabs.Panel value="ai" className="mt-6">
                                <div className="space-y-6">

                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <Tabs
                                            value={aiSubTab}
                                            onChange={(val) => val && setAiSubTab(val as 'intelligence' | 'prompts')}
                                            variant="pills"
                                            radius="md"
                                            color="cyan"
                                        >
                                            <Tabs.List className="inline-flex flex-wrap gap-1">
                                                <Tabs.Tab
                                                    value="intelligence"
                                                    leftSection={<Cpu className="h-4 w-4" />}
                                                    className="font-headline font-bold text-xs uppercase tracking-wider min-h-[44px] py-2 px-4 rounded-lg data-[active=true]:bg-white dark:data-[active=true]:bg-[#1e2634] data-[active=true]:text-cyan-600 dark:data-[active=true]:text-cyan-400 data-[active=true]:shadow-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
                                                >
                                                    Model Intelligence
                                                </Tabs.Tab>
                                                <Tabs.Tab
                                                    value="prompts"
                                                    leftSection={<FileCode className="h-4 w-4" />}
                                                    className="font-headline font-bold text-xs uppercase tracking-wider min-h-[44px] py-2 px-4 rounded-lg data-[active=true]:bg-white dark:data-[active=true]:bg-[#1e2634] data-[active=true]:text-cyan-600 dark:data-[active=true]:text-cyan-400 data-[active=true]:shadow-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
                                                >
                                                    System Prompts
                                                </Tabs.Tab>
                                            </Tabs.List>
                                        </Tabs>
                                    </div>

                                    {aiSubTab === 'intelligence' ? (
                                        <AiModelSettings />
                                    ) : (
                                        <AiSystemPromptsSettings />
                                    )}
                                </div>
                            </Tabs.Panel>
                        )}

                        {profile?.isSuperAdmin && (
                            <Tabs.Panel value="content" className="mt-6">
                                <div className="space-y-6">
                                    <AboutManagement />
                                </div>
                            </Tabs.Panel>
                        )}
                    </Tabs>

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
            </div>
        </RouteGuard>
    );
}
