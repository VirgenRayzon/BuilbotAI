"use client";

import React, { useState, useEffect } from 'react';
import { 
    Package, Monitor, 
    Archive, Trash2 
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
        handleAddPart, handleUpdatePart, handleUpdatePartStock, handleDeletePart, handleArchivePart,
        handleAddPrebuilt, handleUpdatePrebuilt, handleDeletePrebuilt, handleArchivePrebuilt,
        componentCategories: initialCategories
    } = useInventory(profile);
    
    const { orders, ordersLoading, handleDeleteOrder, handleUpdateOrder, stats } = useOrders(profile);
    const { setIsPageLoading } = useLoading();

    // Sync global loading state
    useEffect(() => {
        setIsPageLoading(partsLoading || prebuiltsLoading || ordersLoading);
        return () => setIsPageLoading(false);
    }, [partsLoading, prebuiltsLoading, ordersLoading, setIsPageLoading]);
    
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
        <RouteGuard requiredPermission="canAccessAdmin">
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

                    <Tabs value={currentTab} className="w-full" onValueChange={handleTabAccess}>
                        <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                            <TabsList className="inline-flex w-auto min-w-full md:min-w-0">
                                <TabsTrigger value="stock" className="whitespace-nowrap">
                                    Manage Stock
                                </TabsTrigger>
                                <TabsTrigger value="prebuilts" className="whitespace-nowrap">
                                    Manage Prebuilts
                                </TabsTrigger>
                                <TabsTrigger value="reservations" className="relative whitespace-nowrap">
                                    Reservations
                                    {stats.pendingOrdersCount > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground animate-bounce">
                                            {stats.pendingOrdersCount}
                                        </span>
                                    )}
                                </TabsTrigger>
                                {profile?.isSuperAdmin && (
                                    <>
                                        <TabsTrigger value="sales" className="whitespace-nowrap">
                                            Sales & Analytics
                                        </TabsTrigger>
                                        <TabsTrigger value="settings" className="whitespace-nowrap">
                                            System Control
                                        </TabsTrigger>
                                    </>
                                )}
                                <TabsTrigger value="archive" className="whitespace-nowrap">
                                    Archive
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="stock">
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
                                isPartSelectionMode={isPartSelectionMode}
                                setIsPartSelectionMode={setIsPartSelectionMode}
                                selectedPartIds={selectedPartIds}
                                setSelectedPartIds={setSelectedPartIds}
                                togglePartSelection={togglePartSelection}
                                toggleAllPartsSelection={toggleAllPartsSelection}
                                setConfirmAction={setConfirmAction}
                            />
                        </TabsContent>

                        <TabsContent value="prebuilts" className="mt-6">
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
                        </TabsContent>

                        <TabsContent value="reservations" className="mt-6">
                            <ReservationsTab 
                                orders={orders || []}
                                ordersLoading={ordersLoading}
                                onDeleteOrder={handleDeleteOrder}
                                onUpdateOrder={handleUpdateOrder}
                            />
                        </TabsContent>

                        {profile?.isSuperAdmin && (
                            <>
                                <TabsContent value="sales" className="mt-6">
                                    <SalesTab 
                                        orders={orders || []}
                                        parts={parts}
                                        prebuiltSystems={prebuiltSystems || []}
                                    />
                                </TabsContent>
                                <TabsContent value="settings" className="mt-6">
                                    <SuperAdminSettings />
                                </TabsContent>
                            </>
                        )}

                        <TabsContent value="archive" className="mt-6">
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
                        </TabsContent>
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
