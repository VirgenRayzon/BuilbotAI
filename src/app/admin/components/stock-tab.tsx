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
import { AddPartDialog } from '@/components/add-part-dialog';
import { InventoryPartCard } from '@/components/inventory-part-card';
import { InventoryTable } from '@/components/inventory-table';
import { InventoryToolbar, AvailabilityFilter } from '@/components/inventory-toolbar';
import { PaginationControls } from "@/components/pagination-controls";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Part, UserProfile } from '@/lib/types';
import { AddPartFormSchema } from '@/hooks/use-part-form';
import { useInventoryImageCount } from '@/hooks/use-inventory-image-count';
import { ADMIN_PART_IMAGE_SIZES } from '@/lib/inventory-image-sizes';

type PartSelection = { id: string; category: Part['category'] };
type PartCategorySelection = { name: Part['category']; selected: boolean };
type BulkConfirmAction = {
    isOpen: boolean;
    type: 'archive' | 'restore' | 'delete';
    target: 'parts' | 'prebuilts';
};

function getCreatedAtTime(value: unknown): number {
    if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
        return value.toDate().getTime();
    }

    return value ? new Date(value as string | number | Date).getTime() : 0;
}

interface StockTabProps {
    parts: Part[];
    partsLoading: boolean;
    profile: Pick<UserProfile, 'isSuperAdmin'> | null;
    partCategories: PartCategorySelection[];
    onSetCategories: (categories: PartCategorySelection[]) => void;
    onAddPart: (data: AddPartFormSchema, operationId?: string) => Promise<import('@/lib/product-identity').CreatedProduct | void>;
    onUpdatePart: (id: string, category: Part['category'], data: AddPartFormSchema) => Promise<void>;
    onDeletePart: (id: string, category: Part['category']) => Promise<void>;
    onArchivePart: (id: string, category: Part['category'], isArchived?: boolean) => Promise<void>;
    onUpdatePartStock: (id: string, category: Part['category'], stock: number) => Promise<void>;
    onAddPartStock?: (id: string, category: Part['category'], amount: number) => Promise<void>;

    // Bulk state from useBulkActions
    isPartSelectionMode: boolean;
    setIsPartSelectionMode: (val: boolean) => void;
    selectedPartIds: PartSelection[];
    setSelectedPartIds: (parts: PartSelection[]) => void;
    togglePartSelection: (id: string, category: Part['category']) => void;
    toggleAllPartsSelection: (parts: Part[]) => void;
    setConfirmAction: (action: BulkConfirmAction) => void;

    // Optional controlled search from AdminTopbar
    searchQuery?: string;
    onSearchQueryChange?: (val: string) => void;
}

export function StockTab({
    parts,
    partsLoading,
    profile,
    partCategories,
    onSetCategories,
    onAddPart,
    onUpdatePart,
    onDeletePart,
    onArchivePart,
    onUpdatePartStock,
    onAddPartStock,
    isPartSelectionMode,
    setIsPartSelectionMode,
    selectedPartIds,
    setSelectedPartIds,
    togglePartSelection,
    toggleAllPartsSelection,
    setConfirmAction,
    searchQuery: controlledSearchQuery,
    onSearchQueryChange: controlledOnSearchQueryChange,
}: StockTabProps) {
    const priorityImageCount = useInventoryImageCount('admin');
    const [internalSearchQuery, setInternalSearchQuery] = useState('');
    const partSearchQuery = controlledSearchQuery !== undefined ? controlledSearchQuery : internalSearchQuery;
    const setPartSearchQuery = controlledOnSearchQueryChange || setInternalSearchQuery;

    const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
    const [availability, setAvailability] = useState<AvailabilityFilter>('all');
    const [partSortBy, setPartSortBy] = useState('Date Added');
    const [partSortDirection, setPartSortDirection] = useState<'asc' | 'desc'>('desc');
    const [activeView, setActiveView] = useState<'grid' | 'table'>('grid');
    const [partCurrentPage, setPartCurrentPage] = useState(1);
    const [partItemsPerPage, setPartItemsPerPage] = useState(8);

    useEffect(() => {
        setPartCurrentPage(1);
    }, [partSearchQuery]);

    const filteredAndSortedParts = useMemo(() => {
        const selectedCategories = partCategories.filter(c => c.selected).map(c => c.name);
        const searchLower = partSearchQuery.toLowerCase();

        return (parts || [])
            .filter(part => {
                const isNotArchived = !part.isArchived;
                const matchesCategory = selectedCategories.includes(part.category);
                const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(part.brand || '');
                const matchesSearch =
                    part.name.toLowerCase().includes(searchLower) ||
                    (part.brand && part.brand.toLowerCase().includes(searchLower)) ||
                    (part.sku && part.sku.toLowerCase().includes(searchLower));

                // Availability Filter Logic
                let matchesAvailability = true;
                if (availability === 'in-stock') {
                    matchesAvailability = (part.stock || 0) > 0;
                } else if (availability === 'out-of-stock') {
                    matchesAvailability = (part.stock || 0) <= 0;
                }

                return isNotArchived && matchesCategory && matchesBrand && matchesSearch && matchesAvailability;
            })
            .sort((a, b) => {
                let compare = 0;
                if (partSortBy === 'Name') compare = a.name.localeCompare(b.name);
                else if (partSortBy === 'Price') compare = a.price - b.price;
                else if (partSortBy === 'Brand') compare = (a.brand || '').localeCompare(b.brand || '');
                else if (partSortBy === 'Stock') compare = a.stock - b.stock;
                else if (partSortBy === 'Date Added') {
                    compare = getCreatedAtTime(a.createdAt) - getCreatedAtTime(b.createdAt);
                }
                return partSortDirection === 'asc' ? compare : -compare;
            });
    }, [parts, partCategories, selectedBrands, partSearchQuery, availability, partSortBy, partSortDirection]);

    const availableBrands = useMemo(() => {
        const selectedCategories = partCategories.filter(c => c.selected).map(c => c.name);
        const searchLower = partSearchQuery.toLowerCase();

        const activeParts = (parts || []).filter(part => {
            const isNotArchived = !part.isArchived;
            const matchesCategory = selectedCategories.includes(part.category);
            const matchesSearch =
                part.name.toLowerCase().includes(searchLower) ||
                (part.brand && part.brand.toLowerCase().includes(searchLower));
            return isNotArchived && matchesCategory && matchesSearch;
        });

        const brands = new Set<string>();
        activeParts.forEach(part => {
            if (part.brand && part.brand.trim() !== '') {
                brands.add(part.brand.trim());
            }
        });
        return Array.from(brands).sort();
    }, [parts, partCategories, partSearchQuery]);

    const partTotalPages = Math.ceil(filteredAndSortedParts.length / partItemsPerPage);
    const currentParts = useMemo(() => {
        const startIndex = (partCurrentPage - 1) * partItemsPerPage;
        return filteredAndSortedParts.slice(startIndex, startIndex + partItemsPerPage);
    }, [filteredAndSortedParts, partCurrentPage, partItemsPerPage]);

    return (
        <div className="space-y-6">
            <InventoryToolbar
                variant="admin-header"
                categories={partCategories}
                onCategoryChange={(categoryName, selected) => {
                    if (categoryName === 'All') {
                        const anyUnselected = partCategories.some(cat => !cat.selected);
                        setSelectedBrands([]);
                        onSetCategories(partCategories.map(c => ({ ...c, selected: anyUnselected })));
                    } else {
                        setSelectedBrands([]);
                        onSetCategories(partCategories.map(c => ({
                            ...c,
                            selected: c.name === categoryName ? selected : c.selected
                        })));
                    }
                    setPartCurrentPage(1);
                }}
                onClearCategories={() => {
                    setSelectedBrands([]);
                    onSetCategories(partCategories.map(c => ({ ...c, selected: false })));
                    setPartCurrentPage(1);
                }}
                itemCount={filteredAndSortedParts.length}
                itemLabel="parts"
                categoryLabel="Categories"
                searchQuery={partSearchQuery}
                onSearchQueryChange={(val) => {
                    setPartSearchQuery(val);
                    setPartCurrentPage(1);
                }}
                searchPlaceholder="Search parts by name, brand, or SKU..."
                availableBrands={availableBrands}
                selectedBrands={selectedBrands}
                onBrandChange={(brands) => {
                    setSelectedBrands(brands);
                    setPartCurrentPage(1);
                }}
                availability={availability}
                onAvailabilityChange={(val) => {
                    setAvailability(val);
                    setPartCurrentPage(1);
                }}
                sortBy={partSortBy}
                onSortByChange={(val) => {
                    setPartSortBy(val);
                    setPartCurrentPage(1);
                }}
                sortDirection={partSortDirection}
                onSortDirectionChange={(val) => {
                    setPartSortDirection(val);
                    setPartCurrentPage(1);
                }}
                supportedSorts={['Date Added', 'Name', 'Price', 'Brand', 'Stock']}
                defaultSort="Date Added:desc"
                view={activeView}
                onViewChange={setActiveView}
                showViewToggle={true}
                supportedViews={['grid', 'table']}
                leadingActions={
                    <Tooltip label={isPartSelectionMode ? "Exit Selection Mode" : "Bulk Select Mode"} withArrow position="top">
                        <ActionIcon
                            variant={isPartSelectionMode ? "filled" : "default"}
                            color={isPartSelectionMode ? "cyan" : "gray"}
                            size={36}
                            radius="md"
                            onClick={() => {
                                setIsPartSelectionMode(!isPartSelectionMode);
                                if (isPartSelectionMode) setSelectedPartIds([]);
                            }}
                            aria-label="Toggle Bulk Selection Mode"
                            className="border-slate-200 dark:border-white/10 bg-white dark:bg-[#141a23]"
                        >
                            <CheckSquare size={16} />
                        </ActionIcon>
                    </Tooltip>
                }
                actions={
                    <AddPartDialog onSave={onAddPart}>
                        <Button
                            size="sm"
                            radius="md"
                            color="cyan"
                            variant="filled"
                            aria-label="Add Part"
                            className="!size-11 !p-0 font-semibold shadow-xs sm:!h-9 sm:!w-auto sm:!px-3"
                        >
                            <Plus size={16} />
                            <span className="hidden sm:inline">Add Part</span>
                        </Button>
                    </AddPartDialog>
                }
                onResetAll={() => {
                    onSetCategories(partCategories.map(c => ({ ...c, selected: true })));
                    setSelectedBrands([]);
                    setAvailability('all');
                    setPartSearchQuery('');
                    setPartSortBy('Date Added');
                    setPartSortDirection('desc');
                    setPartCurrentPage(1);
                }}
            />

            {/* Bulk Selection Actions Bar when selection mode is active */}
            {isPartSelectionMode && (
                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-2 animate-in fade-in">
                    <Button
                        variant="default"
                        size="xs"
                        radius="md"
                        leftSection={<PackageCheck size={13} />}
                        onClick={() => toggleAllPartsSelection(currentParts)}
                    >
                        {currentParts.length > 0 && currentParts.every(p => selectedPartIds.some(s => s.id === p.id)) ? "Deselect All" : "Select All"}
                    </Button>

                    {selectedPartIds.length > 0 && (
                        <div className="flex items-center gap-1.5 bg-cyan-500/20 px-2 py-1 rounded-md">
                            <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">{selectedPartIds.length} Selected</span>
                            <Button
                                size="xs"
                                variant="subtle"
                                color="gray"
                                onClick={() => setConfirmAction({ isOpen: true, type: 'archive', target: 'parts' })}
                                leftSection={<Archive size={12} />}
                            >
                                Archive
                            </Button>
                            {profile?.isSuperAdmin && (
                                <Button
                                    size="xs"
                                    variant="subtle"
                                    color="red"
                                    onClick={() => setConfirmAction({ isOpen: true, type: 'delete', target: 'parts' })}
                                    leftSection={<Trash2 size={12} />}
                                >
                                    Delete
                                </Button>
                            )}
                            <Button size="xs" variant="subtle" color="gray" onClick={() => setSelectedPartIds([])}>
                                Cancel
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {activeView === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                    {partsLoading ? (
                        Array.from({ length: 8 }).map((_, i) => (
                            <Card
                                key={`stock-skeleton-${i}`}
                                className="flex flex-col justify-between overflow-hidden relative border border-border/80 bg-white/80 dark:bg-card/40 animate-pulse select-none h-full"
                            >
                                <div className="p-2 md:p-3.5 flex flex-col justify-between h-full space-y-2 md:space-y-3">
                                    <div className="space-y-1.5 md:space-y-2">
                                        <div className="flex justify-between items-start gap-1">
                                            <div className="min-w-0 flex-1 space-y-1">
                                                <div className="h-2.5 w-12 bg-cyan-500/20 rounded" />
                                                <div className="h-3.5 w-3/4 bg-slate-200 dark:bg-white/10 rounded" />
                                                <div className="h-2.5 w-1/3 bg-slate-200/60 dark:bg-white/5 rounded" />
                                            </div>
                                            <div className="h-7 w-7 rounded bg-slate-200/40 dark:bg-white/5 shrink-0" />
                                        </div>

                                        <div className="aspect-square relative -mx-2 md:-mx-3.5 w-auto overflow-hidden border-y border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/[0.03] flex items-center justify-center p-2">
                                            <PackageCheck className="h-10 w-10 text-slate-300/70 dark:text-white/10" />
                                        </div>

                                        <div className="flex justify-between items-center gap-2 pt-0.5">
                                            <div className="h-5 md:h-6 w-20 md:w-24 bg-slate-200 dark:bg-white/10 rounded" />
                                            <div className="h-4 w-16 bg-slate-200/60 dark:bg-white/5 rounded-full" />
                                        </div>

                                        <Separator className="bg-border/40" />

                                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 md:gap-x-3 md:gap-y-1.5 py-0.5">
                                            {Array.from({ length: 4 }).map((_, s) => (
                                                <div key={s} className="space-y-1">
                                                    <div className="h-2 w-10 bg-slate-200/50 dark:bg-white/5 rounded" />
                                                    <div className="h-3 w-16 bg-slate-200 dark:bg-white/10 rounded" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mt-auto p-2 md:p-3 pt-0">
                                        <div className="w-full h-8 md:h-9 rounded-md bg-slate-200 dark:bg-white/10" />
                                    </div>
                                </div>
                            </Card>
                        ))
                    ) : (
                        currentParts.map((part, index) => (
                            <InventoryPartCard
                                key={part.id}
                                part={part}
                                priority={index < priorityImageCount}
                                imageSizes={ADMIN_PART_IMAGE_SIZES}
                                onDelete={onDeletePart}
                                onArchive={onArchivePart}
                                onUpdateStock={onUpdatePartStock}
                                onAddStock={onAddPartStock}
                                onUpdatePart={onUpdatePart}
                                isSelected={selectedPartIds.some(p => p.id === part.id)}
                                onToggleSelection={togglePartSelection}
                                isSelectionMode={isPartSelectionMode}
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
                    <InventoryTable
                        parts={currentParts}
                        onDelete={onDeletePart}
                        onArchive={onArchivePart}
                        onUpdateStock={onUpdatePartStock}
                        onAddStock={onAddPartStock}
                        onUpdatePart={onUpdatePart}
                        selectedIds={selectedPartIds}
                        onToggleSelection={togglePartSelection}
                        onToggleSelectAll={() => toggleAllPartsSelection(currentParts)}
                        isSuperAdmin={profile?.isSuperAdmin}
                    />
                </Paper>
            )}
            <PaginationControls
                currentPage={partCurrentPage}
                totalPages={partTotalPages}
                itemsPerPage={partItemsPerPage}
                onPageChange={setPartCurrentPage}
                onItemsPerPageChange={setPartItemsPerPage}
            />
        </div>
    );
}
