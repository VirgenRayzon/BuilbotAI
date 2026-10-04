"use client";

import React, { useState, useEffect } from 'react';
import { 
    Package, Monitor, 
    Archive, Trash2, BarChart3, ShoppingBag 
} from 'lucide-react';
import { Tabs, Badge } from '@mantine/core';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/theme-provider";
import { useLoading } from "@/context/loading-context";

// Custom Hooks
import { useAdminCore } from './hooks/use-admin-core';
import { useInventory } from './hooks/use-inventory';
import { useOrders } from './hooks/use-orders';
import { useBulkActions } from './hooks/use-bulk-actions';
import { usePersistentState } from '@/hooks/use-persistent-state';
import { RouteGuard } from '@/components/auth/route-guard';

// Sub-components
import { StockTab } from './components/stock-tab';
import { PrebuiltTab } from './components/prebuilt-tab';
import { ReservationsTab } from './components/reservations-tab';
import { SalesTab } from './components/sales-tab';
import { ArchiveTab } from './components/archive-tab';
import { SuperAdminSettings } from '@/components/super-admin-settings';

/**
 * Admin Dashboard - Orchestrator Component
 */
export default function AdminPage() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { profile, handleTabAccess, currentTab } = useAdminCore();
    
    const { 
        parts, partsLoading, prebuiltSystems, prebuiltsLoading,
        handleAddPart, handleUpdatePart, handleUpdatePartStock, handleAddPartStock, handleDeletePart, handleArchivePart,
        handleAddPrebuilt, handleUpdatePrebuilt, handleDeletePrebuilt, handleArchivePrebuilt,
        componentCategories: initialCategories
    } = useInventory(profile);
    
    const { orders, ordersLoading, handleDeleteOrder, handleUpdateOrder, stats } = useOrders(profile);

    
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

    const handlePartCategoryChange = (name: string, selected: boolean) => {
        setPartCategories(prev => prev.map(c => 
            c.name === name ? { ...c, selected } : c
        ));
    };

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

                <div className="w-full max-w-[1800px] mx-auto px-4 md:px-8 py-8 relative z-10">
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-headline font-bold uppercase tracking-tight text-slate-900 dark:text-slate-50">
                                Dashboard
                            </h1>
                            <p className="text-muted-foreground mt-2 font-medium italic">
                                {profile?.isSuperAdmin
                                    ? "Master control for system configurations, inventory, and analytics."
                                    : "Manage stock inventory, prebuilt systems, and track sales performance."}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Header actions can go here */}
                        </div>
                    </div>

                    <Tabs 
                        value={currentTab} 
                        onChange={(val) => val && handleTabAccess(val)}
                        variant="pills"
                        radius="md"
                        color="cyan"
                        className="w-full"
                    >
                        <div className="flex items-center justify-between mb-6 border-b border-slate-200 dark:border-white/10 pb-4 overflow-x-auto">
                            <Tabs.List className="bg-slate-100 dark:bg-[#141a23] p-1.5 rounded-xl border border-slate-200 dark:border-white/10 inline-flex flex-nowrap md:flex-wrap gap-1.5 w-auto">
                                <Tabs.Tab 
                                    value="stock" 
                                    leftSection={<Package className="h-4 w-4" />}
                                    className="font-headline font-bold text-xs uppercase tracking-wider py-2 px-3.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all whitespace-nowrap data-[active=true]:bg-white dark:data-[active=true]:bg-[#1e2634] data-[active=true]:text-cyan-600 dark:data-[active=true]:text-cyan-400 data-[active=true]:shadow-sm"
                                >
                                    Manage Stock
                                </Tabs.Tab>
                                <Tabs.Tab 
                                    value="prebuilts" 
                                    leftSection={<Monitor className="h-4 w-4" />}
                                    className="font-headline font-bold text-xs uppercase tracking-wider py-2 px-3.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all whitespace-nowrap data-[active=true]:bg-white dark:data-[active=true]:bg-[#1e2634] data-[active=true]:text-cyan-600 dark:data-[active=true]:text-cyan-400 data-[active=true]:shadow-sm"
                                >
                                    Manage Prebuilts
                                </Tabs.Tab>
                                <Tabs.Tab 
                                    value="reservations" 
                                    leftSection={<ShoppingBag className="h-4 w-4" />}
                                    rightSection={
                                        stats.pendingOrdersCount > 0 ? (
                                            <Badge 
                                                size="xs" 
                                                color="yellow" 
                                                variant="filled" 
                                                circle 
                                                className="font-bold text-slate-950 bg-yellow-400 animate-pulse ml-1"
                                            >
                                                {stats.pendingOrdersCount}
                                            </Badge>
                                        ) : null
                                    }
                                    className="font-headline font-bold text-xs uppercase tracking-wider py-2 px-3.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all whitespace-nowrap data-[active=true]:bg-white dark:data-[active=true]:bg-[#1e2634] data-[active=true]:text-cyan-600 dark:data-[active=true]:text-cyan-400 data-[active=true]:shadow-sm"
                                >
                                    Reservations
                                </Tabs.Tab>
                                {profile?.isSuperAdmin && (
                                    <Tabs.Tab 
                                        value="sales" 
                                        leftSection={<BarChart3 className="h-4 w-4" />}
                                        className="font-headline font-bold text-xs uppercase tracking-wider py-2 px-3.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all whitespace-nowrap data-[active=true]:bg-white dark:data-[active=true]:bg-[#1e2634] data-[active=true]:text-cyan-600 dark:data-[active=true]:text-cyan-400 data-[active=true]:shadow-sm"
                                    >
                                        Sales & Analytics
                                    </Tabs.Tab>
                                )}
                                <Tabs.Tab 
                                    value="archive" 
                                    leftSection={<Archive className="h-4 w-4" />}
                                    className="font-headline font-bold text-xs uppercase tracking-wider py-2 px-3.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all whitespace-nowrap data-[active=true]:bg-white dark:data-[active=true]:bg-[#1e2634] data-[active=true]:text-cyan-600 dark:data-[active=true]:text-cyan-400 data-[active=true]:shadow-sm"
                                >
                                    Archive
                                </Tabs.Tab>
                            </Tabs.List>
                        </div>

                        <Tabs.Panel value="stock">
                            <StockTab 
                                parts={parts}
                                partsLoading={partsLoading}
                                profile={profile}
                                partCategories={partCategories}
                                onCategoryChange={handlePartCategoryChange}
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
                    </Tabs>

                    {/* Global Bulk Action Confirmation Dialog */}
                    <AlertDialog open={confirmAction.isOpen} onOpenChange={(open) => setConfirmAction(prev => ({ ...prev, isOpen: open }))}>
                        <AlertDialogContent className="bg-background/95 backdrop-blur-2xl border-white/10 max-w-[400px]">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2 text-xl font-headline font-bold">
                                    {confirmAction.type === 'delete' ? <Trash2 className="h-5 w-5 text-destructive" /> : <Archive className="h-5 w-5 text-primary" />}
                                    Confirm {confirmAction.type.charAt(0).toUpperCase() + confirmAction.type.slice(1)} Action
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-muted-foreground pt-2">
                                    {confirmAction.type === 'delete'
                                        ? "This action is PERMANENT and cannot be undone. All selected items will be removed forever."
                                        : confirmAction.type === 'archive'
                                            ? "Are you sure you want to move the selected items to the archive?"
                                            : "Are you sure you want to restore the selected items to the main inventory?"}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="pt-6">
                                <AlertDialogCancel className="bg-transparent border-white/10 hover:bg-white/5">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    className={cn(
                                        "text-white font-bold",
                                        confirmAction.type === 'delete' ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"
                                    )}
                                    onClick={executeBulkAction}
                                >
                                    Confirm {confirmAction.type.charAt(0).toUpperCase() + confirmAction.type.slice(1)}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        </RouteGuard>
    );
}
