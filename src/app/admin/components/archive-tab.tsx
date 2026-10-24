"use client";

import React, { useMemo, useState } from 'react';
import { PackageCheck, Trash2, Layers, Boxes, CalendarClock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Separator } from '@/components/ui/separator';
import { InventoryTable } from '@/components/inventory-table';
import { PrebuiltsTable } from '@/components/prebuilts-table';
import { InventoryToolbar } from '@/components/inventory-toolbar';
import { Paper, Tabs } from '@mantine/core';
import type { Order, Part, PrebuiltSystem } from '@/lib/types';
import { ReservationsTab } from './reservations-tab';

interface ArchiveTabProps {
  parts: Part[];
  partsLoading?: boolean;
  prebuiltSystems: PrebuiltSystem[];
  prebuiltsLoading?: boolean;
  orders: Order[];
  ordersLoading: boolean;
  onReservationAction: (id: string, action: 'archive' | 'restore' | 'delete') => Promise<boolean>;
  onUpdateOrder: (id: string, status: Order['status']) => Promise<void>;
  profile: any;
  onDeletePart: (id: string, category: Part['category']) => Promise<void>;
  onArchivePart: (id: string, category: Part['category'], isArchived?: boolean) => Promise<void>;
  onUpdatePartStock: (id: string, category: Part['category'], stock: number) => Promise<void>;
  onUpdatePart: (id: string, category: Part['category'], data: any) => Promise<void>;
  onDeletePrebuilt: (id: string) => Promise<void>;
  onArchivePrebuilt: (id: string, isArchived?: boolean) => Promise<void>;
  onUpdatePrebuilt: (id: string, data: any) => Promise<void>;

  // Bulk state from useBulkActions
  selectedPartIds: { id: string; category: Part['category'] }[];
  setSelectedPartIds: (val: any) => void;
  togglePartSelection: (id: string, category: Part['category']) => void;
  toggleAllPartsSelection: (parts: Part[]) => void;
  selectedPrebuiltIds: string[];
  setSelectedPrebuiltIds: (val: any) => void;
  togglePrebuiltSelection: (id: string) => void;
  toggleAllPrebuiltsSelection: (systems: PrebuiltSystem[]) => void;
  setConfirmAction: (val: any) => void;
}

export function ArchiveTab({
  parts,
  partsLoading,
  prebuiltSystems,
  prebuiltsLoading,
  orders,
  ordersLoading,
  onReservationAction,
  onUpdateOrder,
  profile,
  onDeletePart,
  onArchivePart,
  onUpdatePartStock,
  onUpdatePart,
  onDeletePrebuilt,
  onArchivePrebuilt,
  onUpdatePrebuilt,
  selectedPartIds,
  setSelectedPartIds,
  togglePartSelection,
  toggleAllPartsSelection,
  selectedPrebuiltIds,
  setSelectedPrebuiltIds,
  togglePrebuiltSelection,
  toggleAllPrebuiltsSelection,
  setConfirmAction,
}: ArchiveTabProps) {
  const [archiveSubTab, setArchiveSubTab] = useState<'parts' | 'prebuilts' | 'reservations'>('parts');
  const [partSearchQuery, setPartSearchQuery] = useState('');
  const [partBrands, setPartBrands] = useState<string[]>([]);
  const [partSortBy, setPartSortBy] = useState('Name');
  const [partSortDirection, setPartSortDirection] = useState<'asc' | 'desc'>('asc');
  const [prebuiltSearchQuery, setPrebuiltSearchQuery] = useState('');
  const [prebuiltSortBy, setPrebuiltSortBy] = useState('Name');
  const [prebuiltSortDirection, setPrebuiltSortDirection] = useState<'asc' | 'desc'>('asc');

  const [archivePartCategories, setArchivePartCategories] = useState<{ name: string; selected: boolean }[]>([
    { name: "CPU", selected: true },
    { name: "GPU", selected: true },
    { name: "Motherboard", selected: true },
    { name: "RAM", selected: true },
    { name: "Storage", selected: true },
    { name: "PSU", selected: true },
    { name: "Case", selected: true },
    { name: "Cooler", selected: true },
    { name: "Monitor", selected: true },
    { name: "Keyboard", selected: true },
    { name: "Mouse", selected: true },
    { name: "Headset", selected: true },
  ]);

  const [archivePrebuiltTiers, setArchivePrebuiltTiers] = useState<{ name: string; selected: boolean }[]>([
    { name: "Entry-Level", selected: true },
    { name: "Mid-Range", selected: true },
    { name: "High-End", selected: true },
    { name: "Workstation", selected: true },
  ]);

  const [expandedPrebuiltIds, setExpandedPrebuiltIds] = useState<string[]>([]);
  const togglePrebuiltExpand = (id: string) => {
    setExpandedPrebuiltIds((prev) =>
      prev.includes(id) ? [] : archivedPrebuilts.map((s) => s.id)
    );
  };

  const selectedCategories = archivePartCategories.filter((c) => c.selected).map((c) => c.name);
  const allArchivedParts = useMemo(() => parts?.filter((part) => part.isArchived) || [], [parts]);
  const availableArchiveBrands = useMemo(
    () => Array.from(new Set(allArchivedParts.map((part) => part.brand).filter(Boolean))).sort(),
    [allArchivedParts]
  );
  const archivedParts = useMemo(() => {
    const query = partSearchQuery.trim().toLowerCase();
    return allArchivedParts
      .filter((part) => selectedCategories.includes(part.category))
      .filter((part) => partBrands.length === 0 || partBrands.includes(part.brand))
      .filter((part) => !query || part.name.toLowerCase().includes(query) || part.brand.toLowerCase().includes(query))
      .sort((a, b) => {
        let comparison = 0;
        if (partSortBy === 'Price') comparison = a.price - b.price;
        else if (partSortBy === 'Brand') comparison = a.brand.localeCompare(b.brand);
        else if (partSortBy === 'Stock') comparison = a.stock - b.stock;
        else comparison = a.name.localeCompare(b.name);
        return partSortDirection === 'asc' ? comparison : -comparison;
      });
  }, [allArchivedParts, partBrands, partSearchQuery, partSortBy, partSortDirection, selectedCategories]);
  const totalArchivedPartsCount = parts?.filter((p) => p.isArchived).length || 0;

  const selectedTiers = archivePrebuiltTiers.filter((t) => t.selected).map((t) => t.name);
  const archivedPrebuilts = useMemo(() => {
    const query = prebuiltSearchQuery.trim().toLowerCase();
    return (prebuiltSystems || [])
      .filter((system) => system.isArchived && selectedTiers.includes(system.tier))
      .filter((system) => !query || system.name.toLowerCase().includes(query) || system.description?.toLowerCase().includes(query))
      .sort((a, b) => {
        let comparison = 0;
        if (prebuiltSortBy === 'Price') comparison = a.price - b.price;
        else if (prebuiltSortBy === 'Tier') comparison = a.tier.localeCompare(b.tier);
        else comparison = a.name.localeCompare(b.name);
        return prebuiltSortDirection === 'asc' ? comparison : -comparison;
      });
  }, [prebuiltSearchQuery, prebuiltSortBy, prebuiltSortDirection, prebuiltSystems, selectedTiers]);
  const totalArchivedPrebuiltsCount = prebuiltSystems?.filter((s) => s.isArchived).length || 0;

  return (
    <div className="mt-6 space-y-6">
      {/* Sub-tabs Selection Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Tabs
            value={archiveSubTab}
            onChange={(val) => val && setArchiveSubTab(val as 'parts' | 'prebuilts' | 'reservations')}
            variant="pills"
            radius="md"
            color="cyan"
          >
            <Tabs.List className="inline-flex flex-wrap gap-1">
              <Tabs.Tab
                value="parts"
                leftSection={<Layers className="h-4 w-4" />}
                className="font-headline font-bold text-xs uppercase tracking-wider min-h-[44px] py-2 px-4 rounded-lg data-[active=true]:bg-white dark:data-[active=true]:bg-[#1e2634] data-[active=true]:text-cyan-600 dark:data-[active=true]:text-cyan-400 data-[active=true]:shadow-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
              >
                Parts Archive ({totalArchivedPartsCount})
              </Tabs.Tab>
              <Tabs.Tab
                value="prebuilts"
                leftSection={<Boxes className="h-4 w-4" />}
                className="font-headline font-bold text-xs uppercase tracking-wider min-h-[44px] py-2 px-4 rounded-lg data-[active=true]:bg-white dark:data-[active=true]:bg-[#1e2634] data-[active=true]:text-cyan-600 dark:data-[active=true]:text-cyan-400 data-[active=true]:shadow-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
              >
                Prebuilts Archive ({totalArchivedPrebuiltsCount})
              </Tabs.Tab>
              <Tabs.Tab
                value="reservations"
                leftSection={<CalendarClock className="h-4 w-4" />}
                className="font-headline font-bold text-xs uppercase tracking-wider min-h-[44px] py-2 px-4 rounded-lg data-[active=true]:bg-white dark:data-[active=true]:bg-[#1e2634] data-[active=true]:text-cyan-600 dark:data-[active=true]:text-cyan-400 data-[active=true]:shadow-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
              >
                Reservations Archive ({orders.length})
              </Tabs.Tab>
            </Tabs.List>
          </Tabs>
      </div>

      {archiveSubTab === 'reservations' && (
        <ReservationsTab
          archived
          orders={orders}
          ordersLoading={ordersLoading}
          isSuperAdmin={profile?.isSuperAdmin === true}
          onReservationAction={onReservationAction}
          onUpdateOrder={onUpdateOrder}
        />
      )}

      {/* --- Tab 1: Archived Parts --- */}
      {archiveSubTab === 'parts' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <InventoryToolbar
            categories={archivePartCategories}
            onCategoryChange={(categoryName) => {
              setArchivePartCategories((current) => current.map((category) => ({
                ...category,
                selected: categoryName === 'All' || category.name === categoryName,
              })));
            }}
            itemCount={archivedParts.length}
            searchQuery={partSearchQuery}
            onSearchQueryChange={setPartSearchQuery}
            availableBrands={availableArchiveBrands}
            selectedBrands={partBrands}
            onBrandChange={setPartBrands}
            sortBy={partSortBy}
            onSortByChange={setPartSortBy}
            sortDirection={partSortDirection}
            onSortDirectionChange={setPartSortDirection}
            supportedSorts={['Name', 'Price', 'Brand', 'Stock']}
          />

          {selectedPartIds.length > 0 && (
            <div className="flex w-fit items-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 animate-in fade-in slide-in-from-right-2">
              <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">{selectedPartIds.length} Selected</span>
              <Separator orientation="vertical" className="h-4 bg-cyan-500/20" />
              <Button size="sm" variant="ghost" className="h-7 text-xs text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400" onClick={() => setConfirmAction({ isOpen: true, type: 'restore', target: 'parts' })}>
                <PackageCheck className="mr-1.5 h-3 w-3" /> Restore
              </Button>
              {profile?.isSuperAdmin && (
                <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:bg-destructive/10" onClick={() => setConfirmAction({ isOpen: true, type: 'delete', target: 'parts' })}>
                  <Trash2 className="mr-1.5 h-3 w-3" /> Delete
                </Button>
              )}
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelectedPartIds([])}>Cancel</Button>
            </div>
          )}

          <Paper
            withBorder
            radius="md"
            className="overflow-hidden border-slate-200 bg-white/80 shadow-sm dark:border-white/10 dark:bg-[#141a23]/80"
          >
            {partsLoading ? null : (
              <InventoryTable
                parts={archivedParts}
                onDelete={onDeletePart}
                onArchive={onArchivePart}
                onUpdateStock={onUpdatePartStock}
                onUpdatePart={onUpdatePart}
                selectedIds={selectedPartIds}
                onToggleSelection={togglePartSelection}
                onToggleSelectAll={() => toggleAllPartsSelection(parts?.filter((p) => p.isArchived) || [])}
                isSuperAdmin={profile?.isSuperAdmin}
                isArchiveView={true}
              />
            )}
          </Paper>
        </div>
      )}

      {/* --- Tab 2: Archived Prebuilts --- */}
      {archiveSubTab === 'prebuilts' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <InventoryToolbar
            categories={archivePrebuiltTiers}
            onCategoryChange={(tierName) => {
              setArchivePrebuiltTiers((current) => current.map((tier) => ({
                ...tier,
                selected: tierName === 'All' || tier.name === tierName,
              })));
            }}
            itemCount={archivedPrebuilts.length}
            searchQuery={prebuiltSearchQuery}
            onSearchQueryChange={setPrebuiltSearchQuery}
            sortBy={prebuiltSortBy}
            onSortByChange={setPrebuiltSortBy}
            sortDirection={prebuiltSortDirection}
            onSortDirectionChange={setPrebuiltSortDirection}
            supportedSorts={['Name', 'Price', 'Tier']}
          />

          {selectedPrebuiltIds.length > 0 && (
            <div className="flex w-fit items-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 animate-in fade-in slide-in-from-right-2">
              <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">{selectedPrebuiltIds.length} Selected</span>
              <Separator orientation="vertical" className="h-4 bg-cyan-500/20" />
              <Button size="sm" variant="ghost" className="h-7 text-xs text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400" onClick={() => setConfirmAction({ isOpen: true, type: 'restore', target: 'prebuilts' })}>
                <PackageCheck className="mr-1.5 h-3 w-3" /> Restore
              </Button>
              {profile?.isSuperAdmin && (
                <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:bg-destructive/10" onClick={() => setConfirmAction({ isOpen: true, type: 'delete', target: 'prebuilts' })}>
                  <Trash2 className="mr-1.5 h-3 w-3" /> Delete
                </Button>
              )}
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelectedPrebuiltIds([])}>Cancel</Button>
            </div>
          )}

          <Paper
            withBorder
            radius="md"
            className="overflow-hidden border-slate-200 bg-white/80 shadow-sm dark:border-white/10 dark:bg-[#141a23]/80"
          >
            {prebuiltsLoading ? null : (
              <PrebuiltsTable
                systems={archivedPrebuilts}
                parts={parts || []}
                onDelete={onDeletePrebuilt}
                onArchive={onArchivePrebuilt}
                onUpdate={onUpdatePrebuilt}
                expandedIds={expandedPrebuiltIds}
                onToggleExpand={togglePrebuiltExpand}
                selectedIds={selectedPrebuiltIds}
                onToggleSelection={togglePrebuiltSelection}
                onToggleSelectAll={() => toggleAllPrebuiltsSelection(prebuiltSystems?.filter((s) => s.isArchived) || [])}
                isSuperAdmin={profile?.isSuperAdmin}
                isArchiveView={true}
              />
            )}
          </Paper>
        </div>
      )}
    </div>
  );
}
