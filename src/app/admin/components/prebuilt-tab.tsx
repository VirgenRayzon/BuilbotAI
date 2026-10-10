"use client";

import React, { useState, useMemo } from 'react';
import {
    Paper,
    Button,
    ActionIcon,
    Menu,
    Checkbox,
    ScrollArea,
    Badge,
    SegmentedControl,
} from "@mantine/core";
import {
    Filter,
    CheckSquare,
    PackageCheck,
    Archive,
    Trash2,
    LayoutGrid,
    Table as TableIcon,
    Plus,
} from 'lucide-react';
import { AddPrebuiltDialog } from '@/components/add-prebuilt-dialog';
import { InventoryPrebuiltCard } from '@/components/inventory-prebuilt-card';
import { PrebuiltsTable } from '@/components/prebuilts-table';
import { PaginationControls } from "@/components/pagination-controls";
import { cn } from "@/lib/utils";
import type { Part, PrebuiltSystem } from '@/lib/types';
import { AddPrebuiltFormSchema } from '@/components/add-prebuilt-dialog';

interface PrebuiltTabProps {
    prebuiltSystems: PrebuiltSystem[];
    prebuiltsLoading: boolean;
    parts: Part[];
    profile: any;
    prebuiltCategories: { name: string, selected: boolean }[];
    onSetCategories: (cats: any) => void;
    onAddPrebuilt: (data: AddPrebuiltFormSchema) => Promise<void>;
    onUpdatePrebuilt: (id: string, data: AddPrebuiltFormSchema) => Promise<void>;
    onDeletePrebuilt: (id: string) => Promise<void>;
    onArchivePrebuilt: (id: string, isArchived?: boolean) => Promise<void>;
    
    // Bulk state from useBulkActions
    isPrebuiltSelectionMode: boolean;
    setIsPrebuiltSelectionMode: (val: boolean) => void;
    selectedPrebuiltIds: string[];
    setSelectedPrebuiltIds: (val: any) => void;
    togglePrebuiltSelection: (id: string) => void;
    toggleAllPrebuiltsSelection: (systems: PrebuiltSystem[]) => void;
    setConfirmAction: (val: any) => void;
}

export function PrebuiltTab({
    prebuiltSystems,
    prebuiltsLoading,
    parts,
    profile,
    prebuiltCategories,
    onSetCategories,
    onAddPrebuilt,
    onUpdatePrebuilt,
    onDeletePrebuilt,
    onArchivePrebuilt,
    isPrebuiltSelectionMode,
    setIsPrebuiltSelectionMode,
    selectedPrebuiltIds,
    setSelectedPrebuiltIds,
    togglePrebuiltSelection,
    toggleAllPrebuiltsSelection,
    setConfirmAction
}: PrebuiltTabProps) {
    const [prebuiltSortBy, setPrebuiltSortBy] = useState('Date Added');
    const [prebuiltSortDirection, setPrebuiltSortDirection] = useState<'asc' | 'desc'>('desc');
    const [activeView, setActiveView] = useState<'grid' | 'table'>('grid');
    const [prebuiltCurrentPage, setPrebuiltCurrentPage] = useState(1);
    const [prebuiltItemsPerPage, setPrebuiltItemsPerPage] = useState(8);
    const [expandedPrebuiltIds, setExpandedPrebuiltIds] = useState<string[]>([]);

    const filteredAndSortedPrebuilts = useMemo(() => {
        const selectedCategories = prebuiltCategories.filter(c => c.selected).map(c => c.name);
        return (prebuiltSystems?.filter(system => selectedCategories.includes(system.tier) && !system.isArchived) ?? [])
            .sort((a, b) => {
                let compare = 0;
                if (prebuiltSortBy === 'Name') compare = a.name.localeCompare(b.name);
                else if (prebuiltSortBy === 'Price') compare = a.price - b.price;
                else if (prebuiltSortBy === 'Tier') compare = a.tier.localeCompare(b.tier);
                else if (prebuiltSortBy === 'Date Added') {
                    const aDate = (a as any).createdAt?.toDate?.() || a.createdAt || 0;
                    const bDate = (b as any).createdAt?.toDate?.() || b.createdAt || 0;
                    compare = new Date(aDate).getTime() - new Date(bDate).getTime();
                }
                return prebuiltSortDirection === 'asc' ? compare : -compare;
            });
    }, [prebuiltSystems, prebuiltCategories, prebuiltSortBy, prebuiltSortDirection]);

    const prebuiltTotalPages = Math.ceil(filteredAndSortedPrebuilts.length / prebuiltItemsPerPage);
    const currentPrebuilts = useMemo(() => {
        const startIndex = (prebuiltCurrentPage - 1) * prebuiltItemsPerPage;
        return filteredAndSortedPrebuilts.slice(startIndex, startIndex + prebuiltItemsPerPage);
    }, [filteredAndSortedPrebuilts, prebuiltCurrentPage, prebuiltItemsPerPage]);

    const togglePrebuiltExpand = (id: string) => {
        setExpandedPrebuiltIds(prev =>
            prev.includes(id) ? [] : filteredAndSortedPrebuilts.map(s => s.id)
        );
    };

    return (
        <div className="space-y-6">
            <Paper
                withBorder
                radius="lg"
                p="xs"
                className="bg-white/80 dark:bg-[#141a23]/90 border-slate-200/80 dark:border-white/10 shadow-xs"
            >
                <div className="flex items-center justify-between gap-2 sm:gap-3 flex-nowrap overflow-x-auto no-scrollbar py-0.5">
                    {/* Left Controls: Filter Tiers */}
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <Menu shadow="md" width={220} radius="md" closeOnItemClick={false}>
                            <Menu.Target>
                                <Button
                                    variant={!prebuiltCategories.every(c => c.selected) ? "light" : "default"}
                                    color={!prebuiltCategories.every(c => c.selected) ? "cyan" : undefined}
                                    size="xs"
                                    radius="md"
                                    leftSection={<Filter size={13} className={!prebuiltCategories.every(c => c.selected) ? "text-cyan-500" : "text-slate-400"} />}
                                >
                                    Filter Tiers
                                    {!prebuiltCategories.every(c => c.selected) && (
                                        <Badge size="xs" variant="filled" color="cyan" circle ml={5}>
                                            {prebuiltCategories.filter(c => c.selected).length}
                                        </Badge>
                                    )}
                                </Button>
                            </Menu.Target>
                            <Menu.Dropdown>
                                <Menu.Label>Filter by Tier</Menu.Label>
                                <div className="px-2 py-1.5">
                                    <Checkbox
                                        label="All Tiers"
                                        size="xs"
                                        checked={prebuiltCategories.every(c => c.selected)}
                                        onChange={() => {
                                            onSetCategories(prebuiltCategories.map(c => ({ ...c, selected: true })));
                                        }}
                                    />
                                </div>
                                <Menu.Divider />
                                <ScrollArea.Autosize mah={240}>
                                    <div className="space-y-1 px-2 py-1">
                                        {prebuiltCategories.map((category) => (
                                            <Checkbox
                                                key={category.name}
                                                label={category.name}
                                                size="xs"
                                                checked={category.selected && !prebuiltCategories.every(c => c.selected)}
                                                onChange={() => {
                                                    onSetCategories(prebuiltCategories.map(c => ({
                                                        ...c,
                                                        selected: c.name === category.name
                                                    })));
                                                }}
                                            />
                                        ))}
                                    </div>
                                </ScrollArea.Autosize>
                            </Menu.Dropdown>
                        </Menu>
                    </div>

                    {/* Right Controls: Bulk Selection, Grid/Table Toggle & Add System */}
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <Button
                            variant={isPrebuiltSelectionMode ? "light" : "default"}
                            color={isPrebuiltSelectionMode ? "cyan" : undefined}
                            size="xs"
                            radius="md"
                            leftSection={<CheckSquare size={13} />}
                            onClick={() => {
                                setIsPrebuiltSelectionMode(!isPrebuiltSelectionMode);
                                if (isPrebuiltSelectionMode) setSelectedPrebuiltIds([]);
                            }}
                        >
                            <span className="hidden sm:inline">{isPrebuiltSelectionMode ? "Finish Selection" : "Select"}</span>
                            <span className="sm:hidden">{isPrebuiltSelectionMode ? "Done" : "Select"}</span>
                        </Button>

                        {isPrebuiltSelectionMode && (
                            <Button
                                variant="default"
                                size="xs"
                                radius="md"
                                leftSection={<PackageCheck size={13} />}
                                onClick={() => toggleAllPrebuiltsSelection(currentPrebuilts)}
                            >
                                {currentPrebuilts.length > 0 && currentPrebuilts.every(s => selectedPrebuiltIds.includes(s.id)) ? "Deselect All" : "Select All"}
                            </Button>
                        )}

                        {selectedPrebuiltIds.length > 0 && (
                            <div className="flex items-center gap-1.5 bg-cyan-500/10 px-2 py-1 rounded-md border border-cyan-500/20">
                                <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">{selectedPrebuiltIds.length} Selected</span>
                                <Button
                                    size="xs"
                                    variant="subtle"
                                    color="gray"
                                    onClick={() => setConfirmAction({ isOpen: true, type: 'archive', target: 'prebuilts' })}
                                    leftSection={<Archive size={12} />}
                                >
                                    Archive
                                </Button>
                                {profile?.isSuperAdmin && (
                                    <Button
                                        size="xs"
                                        variant="subtle"
                                        color="red"
                                        onClick={() => setConfirmAction({ isOpen: true, type: 'delete', target: 'prebuilts' })}
                                        leftSection={<Trash2 size={12} />}
                                    >
                                        Delete
                                    </Button>
                                )}
                                <Button size="xs" variant="subtle" color="gray" onClick={() => setSelectedPrebuiltIds([])}>
                                    Cancel
                                </Button>
                            </div>
                        )}

                        <SegmentedControl
                            value={activeView}
                            onChange={(val) => setActiveView(val as 'grid' | 'table')}
                            size="xs"
                            radius="md"
                            data={[
                                {
                                    value: "grid",
                                    label: (
                                        <div className="flex items-center justify-center p-0.5" title="Grid View">
                                            <LayoutGrid size={14} />
                                        </div>
                                    ),
                                },
                                {
                                    value: "table",
                                    label: (
                                        <div className="flex items-center justify-center p-0.5" title="Table View">
                                            <TableIcon size={14} />
                                        </div>
                                    ),
                                },
                            ]}
                        />

                        <AddPrebuiltDialog
                            parts={parts || []}
                            onSave={onAddPrebuilt}
                        >
                            <Button
                                size="xs"
                                radius="md"
                                color="cyan"
                                variant="filled"
                                leftSection={<Plus size={14} />}
                                className="font-semibold shadow-xs"
                            >
                                Add System
                            </Button>
                        </AddPrebuiltDialog>
                    </div>
                </div>
            </Paper>

            {activeView === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {prebuiltsLoading ? null : (
                        currentPrebuilts.map((system) => (
                            <InventoryPrebuiltCard
                                key={system.id}
                                system={system}
                                parts={parts || []}
                                onDelete={onDeletePrebuilt}
                                onArchive={onArchivePrebuilt}
                                onUpdate={onUpdatePrebuilt}
                                isExpanded={expandedPrebuiltIds.includes(system.id)}
                                onToggleExpand={() => togglePrebuiltExpand(system.id)}
                                isSelected={selectedPrebuiltIds.includes(system.id)}
                                onToggleSelection={togglePrebuiltSelection}
                                isSelectionMode={isPrebuiltSelectionMode}
                                isSuperAdmin={profile?.isSuperAdmin}
                            />
                        ))
                    )}
                </div>
            ) : (
                <Paper
                    withBorder
                    radius="md"
                    className="overflow-hidden border-slate-200 bg-white/80 shadow-sm dark:border-white/10 dark:bg-[#141a23]/80"
                >
                    <PrebuiltsTable
                        systems={currentPrebuilts}
                        parts={parts || []}
                        onDelete={onDeletePrebuilt}
                        onArchive={onArchivePrebuilt}
                        onUpdate={onUpdatePrebuilt}
                        expandedIds={expandedPrebuiltIds}
                        onToggleExpand={togglePrebuiltExpand}
                        selectedIds={selectedPrebuiltIds}
                        onToggleSelection={togglePrebuiltSelection}
                        onToggleSelectAll={() => toggleAllPrebuiltsSelection(currentPrebuilts)}
                        isSuperAdmin={profile?.isSuperAdmin}
                    />
                </Paper>
            )}
            <PaginationControls
                currentPage={prebuiltCurrentPage}
                totalPages={prebuiltTotalPages}
                itemsPerPage={prebuiltItemsPerPage}
                onPageChange={setPrebuiltCurrentPage}
                onItemsPerPageChange={setPrebuiltItemsPerPage}
            />
        </div>
    );
}
