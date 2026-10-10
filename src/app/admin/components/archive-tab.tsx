"use client";

import React, { useState } from 'react';
import { Archive, Filter, PackageCheck, Trash2, Layers, Boxes } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { InventoryTable } from '@/components/inventory-table';
import { PrebuiltsTable } from '@/components/prebuilts-table';
import { Paper, Tabs, Badge } from '@mantine/core';
import type { Part, PrebuiltSystem } from '@/lib/types';

interface ArchiveTabProps {
  parts: Part[];
  partsLoading?: boolean;
  prebuiltSystems: PrebuiltSystem[];
  prebuiltsLoading?: boolean;
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
  const [archiveSubTab, setArchiveSubTab] = useState<'parts' | 'prebuilts'>('parts');

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
  const archivedParts = parts?.filter((p) => p.isArchived && selectedCategories.includes(p.category)) || [];
  const totalArchivedPartsCount = parts?.filter((p) => p.isArchived).length || 0;

  const selectedTiers = archivePrebuiltTiers.filter((t) => t.selected).map((t) => t.name);
  const archivedPrebuilts = prebuiltSystems?.filter((s) => s.isArchived && selectedTiers.includes(s.tier)) || [];
  const totalArchivedPrebuiltsCount = prebuiltSystems?.filter((s) => s.isArchived).length || 0;

  return (
    <div className="mt-6 space-y-6">
      {/* Sub-tabs Selection Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Tabs
            value={archiveSubTab}
            onChange={(val) => val && setArchiveSubTab(val as 'parts' | 'prebuilts')}
            variant="pills"
            radius="md"
            color="cyan"
          >
            <Tabs.List className="inline-flex flex-wrap gap-1">
              <Tabs.Tab
                value="parts"
                leftSection={<Layers className="h-4 w-4" />}
                className="font-headline font-bold text-xs uppercase tracking-wider py-2 px-4 rounded-lg data-[active=true]:bg-white dark:data-[active=true]:bg-[#1e2634] data-[active=true]:text-cyan-600 dark:data-[active=true]:text-cyan-400 data-[active=true]:shadow-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
              >
                Parts Archive ({totalArchivedPartsCount})
              </Tabs.Tab>
              <Tabs.Tab
                value="prebuilts"
                leftSection={<Boxes className="h-4 w-4" />}
                className="font-headline font-bold text-xs uppercase tracking-wider py-2 px-4 rounded-lg data-[active=true]:bg-white dark:data-[active=true]:bg-[#1e2634] data-[active=true]:text-cyan-600 dark:data-[active=true]:text-cyan-400 data-[active=true]:shadow-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
              >
                Prebuilts Archive ({totalArchivedPrebuiltsCount})
              </Tabs.Tab>
            </Tabs.List>
          </Tabs>
      </div>

      {/* --- Tab 1: Archived Parts --- */}
      {archiveSubTab === 'parts' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Enclosed Categories & Bulk Filter Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-headline font-bold flex items-center gap-2">
                <Archive className="h-5 w-5 text-primary" />
                Archived Parts
              </h2>
              <Badge variant="light" color="cyan" size="sm" radius="sm">
                {archivedParts.length}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
              {selectedPartIds.length > 0 && (
                <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 animate-in fade-in slide-in-from-right-2">
                  <span className="text-xs font-bold text-primary">{selectedPartIds.length} Selected</span>
                  <Separator orientation="vertical" className="h-4 bg-primary/20" />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs hover:bg-primary/20 text-emerald-400"
                    onClick={() => setConfirmAction({ isOpen: true, type: 'restore', target: 'parts' })}
                  >
                    <PackageCheck className="mr-1.5 h-3 w-3" /> Restore
                  </Button>
                  {profile?.isSuperAdmin && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-destructive hover:bg-destructive/20"
                      onClick={() => setConfirmAction({ isOpen: true, type: 'delete', target: 'parts' })}
                    >
                      <Trash2 className="mr-1.5 h-3 w-3" /> Delete
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelectedPartIds([])}>
                    Cancel
                  </Button>
                </div>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-10 gap-2 border-white/10 bg-background/50 hover:bg-primary/5 hover:border-primary/30 text-xs">
                    <Filter className="h-3.5 w-3.5" />
                    Categories
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-background/95 backdrop-blur-xl border-white/10">
                  <DropdownMenuCheckboxItem
                    checked={archivePartCategories.every((c) => c.selected)}
                    onCheckedChange={() => {
                      const anyUnselected = archivePartCategories.some((cat) => !cat.selected);
                      setArchivePartCategories((prev) => prev.map((c) => ({ ...c, selected: anyUnselected })));
                    }}
                  >
                    All Categories
                  </DropdownMenuCheckboxItem>
                  <Separator className="my-1 opacity-50" />
                  {archivePartCategories.map((category) => (
                    <DropdownMenuCheckboxItem
                      key={category.name}
                      checked={category.selected && !archivePartCategories.every((c) => c.selected)}
                      onCheckedChange={() => {
                        setArchivePartCategories((prev) =>
                          prev.map((c) => ({
                            ...c,
                            selected: c.name === category.name,
                          }))
                        );
                      }}
                    >
                      {category.name}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

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
          {/* Enclosed Tiers & Bulk Filter Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-headline font-bold flex items-center gap-2">
                <Archive className="h-5 w-5 text-primary" />
                Archived Prebuilts
              </h2>
              <Badge variant="light" color="cyan" size="sm" radius="sm">
                {archivedPrebuilts.length}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
              {selectedPrebuiltIds.length > 0 && (
                <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 animate-in fade-in slide-in-from-right-2">
                  <span className="text-xs font-bold text-primary">{selectedPrebuiltIds.length} Selected</span>
                  <Separator orientation="vertical" className="h-4 bg-primary/20" />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs hover:bg-primary/20 text-emerald-400"
                    onClick={() => setConfirmAction({ isOpen: true, type: 'restore', target: 'prebuilts' })}
                  >
                    <PackageCheck className="mr-1.5 h-3 w-3" /> Restore
                  </Button>
                  {profile?.isSuperAdmin && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-destructive hover:bg-destructive/20"
                      onClick={() => setConfirmAction({ isOpen: true, type: 'delete', target: 'prebuilts' })}
                    >
                      <Trash2 className="mr-1.5 h-3 w-3" /> Delete
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelectedPrebuiltIds([])}>
                    Cancel
                  </Button>
                </div>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-10 gap-2 border-white/10 bg-background/50 hover:bg-primary/5 hover:border-primary/30 text-xs">
                    <Filter className="h-3.5 w-3.5" />
                    Tiers
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-background/95 backdrop-blur-xl border-white/10">
                  <DropdownMenuCheckboxItem
                    checked={archivePrebuiltTiers.every((t) => t.selected)}
                    onCheckedChange={() => {
                      const anyUnselected = archivePrebuiltTiers.some((t) => !t.selected);
                      setArchivePrebuiltTiers((prev) => prev.map((t) => ({ ...t, selected: anyUnselected })));
                    }}
                  >
                    All Tiers
                  </DropdownMenuCheckboxItem>
                  <Separator className="my-1 opacity-50" />
                  {archivePrebuiltTiers.map((tier) => (
                    <DropdownMenuCheckboxItem
                      key={tier.name}
                      checked={tier.selected && !archivePrebuiltTiers.every((t) => t.selected)}
                      onCheckedChange={() => {
                        setArchivePrebuiltTiers((prev) =>
                          prev.map((t) => ({
                            ...t,
                            selected: t.name === tier.name,
                          }))
                        );
                      }}
                    >
                      {tier.name}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

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
