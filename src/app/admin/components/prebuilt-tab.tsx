"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
    Paper,
    Button,
    ActionIcon,
    Tooltip,
} from "@mantine/core";
import {
    CheckSquare,
    PackageCheck,
    Archive,
    Trash2,
    Plus,
} from 'lucide-react';
import { AddPrebuiltDialog } from '@/components/add-prebuilt-dialog';
import { InventoryPrebuiltCard } from '@/components/inventory-prebuilt-card';
import { PrebuiltsTable } from '@/components/prebuilts-table';
import { InventoryToolbar } from '@/components/inventory-toolbar';
import { PaginationControls } from "@/components/pagination-controls";
import type { Part, PrebuiltSystem } from '@/lib/types';
import { AddPrebuiltFormSchema } from '@/components/add-prebuilt-dialog';

interface PrebuiltTabProps {
    prebuiltSystems: PrebuiltSystem[];
    prebuiltsLoading: boolean;
    parts: Part[];
    profile: any;
    prebuiltCategories: { name: string, selected: boolean }[];
    onSetCategories: (cats: any) => void;
    onAddPrebuilt: (data: AddPrebuiltFormSchema, operationId?: string) => Promise<import('@/lib/product-identity').CreatedProduct | void>;
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

    // Optional controlled search from AdminTopbar
    searchQuery?: string;
    onSearchQueryChange?: (val: string) => void;
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
    setConfirmAction,
    searchQuery: controlledSearchQuery,
    onSearchQueryChange: controlledOnSearchQueryChange,
}: PrebuiltTabProps) {
    const [prebuiltSortBy, setPrebuiltSortBy] = useState('Date Added');
    const [prebuiltSortDirection, setPrebuiltSortDirection] = useState<'asc' | 'desc'>('desc');
    const [activeView, setActiveView] = useState<'grid' | 'table'>('grid');
    const [prebuiltCurrentPage, setPrebuiltCurrentPage] = useState(1);
    const [prebuiltItemsPerPage, setPrebuiltItemsPerPage] = useState(8);
    const [expandedPrebuiltIds, setExpandedPrebuiltIds] = useState<string[]>([]);

    const [internalProductSearch, setInternalProductSearch] = useState('');
    const productSearch = controlledSearchQuery !== undefined ? controlledSearchQuery : internalProductSearch;
    const setProductSearch = controlledOnSearchQueryChange || setInternalProductSearch;

    useEffect(() => {
        setPrebuiltCurrentPage(1);
    }, [productSearch]);

    const filteredAndSortedPrebuilts = useMemo(() => {
        const selectedCategories = prebuiltCategories.filter(c => c.selected).map(c => c.name);
        return (prebuiltSystems?.filter(system => selectedCategories.includes(system.tier) && !system.isArchived && `${system.name} ${system.sku || ''} ${system.productId || ''}`.toLowerCase().includes(productSearch.toLowerCase())) ?? [])
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
    }, [prebuiltSystems, prebuiltCategories, prebuiltSortBy, prebuiltSortDirection, productSearch]);

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
            <InventoryToolbar
                variant="admin-header"
                categories={prebuiltCategories}
                onCategoryChange={(tierName, selected) => {
                    if (tierName === 'All') {
                        onSetCategories(prebuiltCategories.map(c => ({ ...c, selected: true })));
                    } else {
                        onSetCategories(prebuiltCategories.map(c => ({
                            ...c,
                            selected: c.name === tierName ? selected : c.selected
                        })));
                    }
                    setPrebuiltCurrentPage(1);
                }}
                onClearCategories={() => {
                    onSetCategories(prebuiltCategories.map(c => ({ ...c, selected: false })));
                    setPrebuiltCurrentPage(1);
                }}
                itemCount={filteredAndSortedPrebuilts.length}
                itemLabel="systems"
                categoryLabel="Tiers"
                searchQuery={productSearch}
                onSearchQueryChange={(query) => {
                    setProductSearch(query);
                    setPrebuiltCurrentPage(1);
                }}
                searchPlaceholder="Search systems by name, SKU, or specs..."
                sortBy={prebuiltSortBy}
                onSortByChange={(val) => {
                    setPrebuiltSortBy(val);
                    setPrebuiltCurrentPage(1);
                }}
                sortDirection={prebuiltSortDirection}
                onSortDirectionChange={(val) => {
                    setPrebuiltSortDirection(val);
                    setPrebuiltCurrentPage(1);
                }}
                supportedSorts={['Date Added', 'Name', 'Price', 'Tier']}
                defaultSort="Date Added:desc"
                view={activeView}
                onViewChange={setActiveView}
                showViewToggle={true}
                supportedViews={['grid', 'table']}
                leadingActions={
                    <Tooltip label={isPrebuiltSelectionMode ? "Exit Selection Mode" : "Bulk Select Mode"} withArrow position="top">
                        <ActionIcon
                            variant={isPrebuiltSelectionMode ? "filled" : "default"}
                            color={isPrebuiltSelectionMode ? "cyan" : "gray"}
                            size={36}
                            radius="md"
                            onClick={() => {
                                setIsPrebuiltSelectionMode(!isPrebuiltSelectionMode);
                                if (isPrebuiltSelectionMode) setSelectedPrebuiltIds([]);
                            }}
                            aria-label="Toggle Bulk Selection Mode"
                            className="border-slate-200 dark:border-white/10 bg-white dark:bg-[#141a23]"
                        >
                            <CheckSquare size={16} />
                        </ActionIcon>
                    </Tooltip>
                }
                actions={
                    <AddPrebuiltDialog
                        parts={parts || []}
                        onSave={onAddPrebuilt}
                    >
                        <Button
                            size="sm"
                            h={36}
                            radius="md"
                            color="cyan"
                            variant="filled"
                            leftSection={<Plus size={16} />}
                            className="font-semibold shadow-xs"
                        >
                            Add System
                        </Button>
                    </AddPrebuiltDialog>
                }
                onResetAll={() => {
                    onSetCategories(prebuiltCategories.map(c => ({ ...c, selected: true })));
                    setProductSearch('');
                    setPrebuiltSortBy('Date Added');
                    setPrebuiltSortDirection('desc');
                    setPrebuiltCurrentPage(1);
                }}
            />

            {/* Bulk Selection Actions Bar when selection mode is active */}
            {isPrebuiltSelectionMode && (
                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-2 animate-in fade-in">
                    <Button
                        variant="default"
                        size="xs"
                        radius="md"
                        leftSection={<PackageCheck size={13} />}
                        onClick={() => toggleAllPrebuiltsSelection(currentPrebuilts)}
                    >
                        {currentPrebuilts.length > 0 && currentPrebuilts.every(s => selectedPrebuiltIds.includes(s.id)) ? "Deselect All" : "Select All"}
                    </Button>

                    {selectedPrebuiltIds.length > 0 && (
                        <div className="flex items-center gap-1.5 bg-cyan-500/20 px-2 py-1 rounded-md">
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
                </div>
            )}

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
