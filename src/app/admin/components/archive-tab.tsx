"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PackageCheck, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Separator } from '@/components/ui/separator';
import { InventoryTable } from '@/components/inventory-table';
import { PrebuiltsTable } from '@/components/prebuilts-table';
import { InventoryToolbar } from '@/components/inventory-toolbar';
import { Paper } from '@mantine/core';
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
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
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
  searchQuery = '',
  onSearchQueryChange,
}: ArchiveTabProps) {
  const searchParams = useSearchParams();
  const [archiveSubTab, setArchiveSubTab] = useState<'parts' | 'prebuilts' | 'reservations'>('parts');
  const [partBrands, setPartBrands] = useState<string[]>([]);
  const [partSortBy, setPartSortBy] = useState('Name');
  const [partSortDirection, setPartSortDirection] = useState<'asc' | 'desc'>('asc');
  const [prebuiltSortBy, setPrebuiltSortBy] = useState('Name');
  const [prebuiltSortDirection, setPrebuiltSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const requestedSubTab = searchParams.get('sub');
    if (requestedSubTab === 'parts' || requestedSubTab === 'prebuilts' || requestedSubTab === 'reservations') {
      setArchiveSubTab(requestedSubTab);
    }
  }, [searchParams]);

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
    const query = searchQuery.trim().toLowerCase();
    return allArchivedParts
      .filter((part) => selectedCategories.includes(part.category))
      .filter((part) => partBrands.length === 0 || partBrands.includes(part.brand))
      .filter((part) => !query || part.name.toLowerCase().includes(query) || part.brand.toLowerCase().includes(query) || part.sku?.toLowerCase().includes(query))
      .sort((a, b) => {
        let comparison = 0;
        if (partSortBy === 'Price') comparison = a.price - b.price;
        else if (partSortBy === 'Brand') comparison = a.brand.localeCompare(b.brand);
        else if (partSortBy === 'Stock') comparison = a.stock - b.stock;
        else comparison = a.name.localeCompare(b.name);
        return partSortDirection === 'asc' ? comparison : -comparison;
      });
  }, [allArchivedParts, partBrands, partSortBy, partSortDirection, searchQuery, selectedCategories]);
  const selectedTiers = archivePrebuiltTiers.filter((t) => t.selected).map((t) => t.name);
  const archivedPrebuilts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return (prebuiltSystems || [])
      .filter((system) => system.isArchived && selectedTiers.includes(system.tier))
      .filter((system) => !query || system.name.toLowerCase().includes(query) || system.description?.toLowerCase().includes(query) || system.sku?.toLowerCase().includes(query))
      .sort((a, b) => {
        let comparison = 0;
        if (prebuiltSortBy === 'Price') comparison = a.price - b.price;
        else if (prebuiltSortBy === 'Tier') comparison = a.tier.localeCompare(b.tier);
        else comparison = a.name.localeCompare(b.name);
        return prebuiltSortDirection === 'asc' ? comparison : -comparison;
      });
  }, [prebuiltSortBy, prebuiltSortDirection, prebuiltSystems, searchQuery, selectedTiers]);

  return (
    <div className="space-y-4">

      {archiveSubTab === 'reservations' && (
        <ReservationsTab
          archived
          orders={orders}
          ordersLoading={ordersLoading}
          isSuperAdmin={profile?.isSuperAdmin === true}
          onReservationAction={onReservationAction}
          onUpdateOrder={onUpdateOrder}
          searchQuery={searchQuery}
          onSearchQueryChange={onSearchQueryChange}
        />
      )}

      {/* --- Tab 1: Archived Parts --- */}
      {archiveSubTab === 'parts' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <InventoryToolbar
            categories={archivePartCategories}
            onCategoryChange={(categoryName, selected) => {
              setArchivePartCategories((current) => current.map((category) => ({
                ...category,
                selected: categoryName === 'All' ? true : category.name === categoryName ? selected : category.selected,
              })));
            }}
            onClearCategories={() => {
              setArchivePartCategories((current) => current.map((category) => ({
                ...category,
                selected: false,
              })));
            }}
            itemCount={archivedParts.length}
            availableBrands={availableArchiveBrands}
            selectedBrands={partBrands}
            onBrandChange={setPartBrands}
            sortBy={partSortBy}
            onSortByChange={setPartSortBy}
            sortDirection={partSortDirection}
            onSortDirectionChange={setPartSortDirection}
            supportedSorts={['Name', 'Price', 'Brand', 'Stock']}
            defaultSort="Name:asc"
            categoryLabel="Categories"
            itemLabel="parts"
            onResetAll={() => {
              setArchivePartCategories((current) => current.map((c) => ({ ...c, selected: true })));
              setPartBrands([]);
              setPartSortBy('Name');
              setPartSortDirection('asc');
            }}
            variant="admin-header"
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
            onCategoryChange={(tierName, selected) => {
              setArchivePrebuiltTiers((current) => current.map((tier) => ({
                ...tier,
                selected: tierName === 'All' ? true : tier.name === tierName ? selected : tier.selected,
              })));
            }}
            onClearCategories={() => {
              setArchivePrebuiltTiers((current) => current.map((tier) => ({
                ...tier,
                selected: false,
              })));
            }}
            itemCount={archivedPrebuilts.length}
            sortBy={prebuiltSortBy}
            onSortByChange={setPrebuiltSortBy}
            sortDirection={prebuiltSortDirection}
            onSortDirectionChange={setPrebuiltSortDirection}
            supportedSorts={['Name', 'Price', 'Tier']}
            defaultSort="Name:asc"
            categoryLabel="Tiers"
            itemLabel="systems"
            onResetAll={() => {
              setArchivePrebuiltTiers((current) => current.map((t) => ({ ...t, selected: true })));
              setPrebuiltSortBy('Name');
              setPrebuiltSortDirection('asc');
            }}
            variant="admin-header"
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
                onDelete={onDeletePrebuilt}
                onArchive={onArchivePrebuilt}
                parts={parts || []}
                onUpdate={onUpdatePrebuilt}
                showActions={true}
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
