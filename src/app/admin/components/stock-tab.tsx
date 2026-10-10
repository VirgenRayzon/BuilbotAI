"use client";

import React, { useState, useMemo } from 'react';
import {
    Paper,
    TextInput,
    Button,
    ActionIcon,
    Menu,
    Checkbox,
    ScrollArea,
    Badge,
    SegmentedControl,
    Tooltip,
} from "@mantine/core";
import {
    Search,
    Filter,
    CheckSquare,
    PackageCheck,
    Archive,
    Trash2,
    LayoutGrid,
    Table as TableIcon,
    Plus,
    ArrowUpDown,
    ArrowUpAZ,
    ArrowDownAZ,
    Check,
} from 'lucide-react';
import { AddPartDialog } from '@/components/add-part-dialog';
import { InventoryPartCard } from '@/components/inventory-part-card';
import { InventoryTable } from '@/components/inventory-table';
import { PaginationControls } from "@/components/pagination-controls";
import { cn } from "@/lib/utils";
import type { Part } from '@/lib/types';
import { AddPartFormSchema } from '@/hooks/use-part-form';

interface StockTabProps {
    parts: Part[];
    partsLoading: boolean;
    profile: any;
    partCategories: { name: string, selected: boolean }[];
    onCategoryChange: (name: string, selected: boolean) => void;
    onSetCategories: (cats: any) => void;
    onAddPart: (data: AddPartFormSchema) => Promise<void>;
    onUpdatePart: (id: string, category: Part['category'], data: AddPartFormSchema) => Promise<void>;
    onDeletePart: (id: string, category: Part['category']) => Promise<void>;
    onArchivePart: (id: string, category: Part['category'], isArchived?: boolean) => Promise<void>;
    onUpdatePartStock: (id: string, category: Part['category'], stock: number) => Promise<void>;
    onAddPartStock?: (id: string, category: Part['category'], amount: number) => Promise<void>;
    
    // Bulk state from useBulkActions
    isPartSelectionMode: boolean;
    setIsPartSelectionMode: (val: boolean) => void;
    selectedPartIds: { id: string, category: Part['category'] }[];
    setSelectedPartIds: (val: any) => void;
    togglePartSelection: (id: string, category: Part['category']) => void;
    toggleAllPartsSelection: (parts: Part[]) => void;
    setConfirmAction: (val: any) => void;
}

export function StockTab({
    parts,
    partsLoading,
    profile,
    partCategories,
    onCategoryChange,
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
    setConfirmAction
}: StockTabProps) {
    const [partSearchQuery, setPartSearchQuery] = useState('');
    const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
    const [partSortBy, setPartSortBy] = useState('Date Added');
    const [partSortDirection, setPartSortDirection] = useState<'asc' | 'desc'>('desc');
    const [activeView, setActiveView] = useState<'grid' | 'table'>('grid');
    const [partCurrentPage, setPartCurrentPage] = useState(1);
    const [partItemsPerPage, setPartItemsPerPage] = useState(8);

    const filteredAndSortedParts = useMemo(() => {
        const selectedCategories = partCategories.filter(c => c.selected).map(c => c.name);
        
        const baseFilteredParts = parts?.filter(part => {
            const matchesCategory = selectedCategories.includes(part.category);
            const matchesSearch = part.name.toLowerCase().includes(partSearchQuery.toLowerCase()) ||
                part.brand.toLowerCase().includes(partSearchQuery.toLowerCase());
            const isNotArchived = !part.isArchived;
            return matchesCategory && matchesSearch && isNotArchived;
        }) ?? [];

        return baseFilteredParts.filter(part => {
            if (selectedBrands.length === 0) return true;
            return part.brand && selectedBrands.includes(part.brand);
        }).sort((a, b) => {
                let compare = 0;
                if (partSortBy === 'Name') compare = a.name.localeCompare(b.name);
                else if (partSortBy === 'Price') compare = a.price - b.price;
                else if (partSortBy === 'Brand') compare = a.brand.localeCompare(b.brand);
                else if (partSortBy === 'Stock') compare = a.stock - b.stock;
                else if (partSortBy === 'Date Added') {
                    const aDate = (a as any).createdAt?.toDate?.() || a.createdAt || 0;
                    const bDate = (b as any).createdAt?.toDate?.() || b.createdAt || 0;
                    compare = new Date(aDate).getTime() - new Date(bDate).getTime();
                }
                return partSortDirection === 'asc' ? compare : -compare;
            });
    }, [parts, partCategories, partSortBy, partSortDirection, partSearchQuery, selectedBrands]);

    const availableBrands = useMemo(() => {
        const selectedCategories = partCategories.filter(c => c.selected).map(c => c.name);
        
        const baseFilteredParts = parts?.filter(part => {
            const matchesCategory = selectedCategories.includes(part.category);
            const matchesSearch = part.name.toLowerCase().includes(partSearchQuery.toLowerCase()) ||
                part.brand.toLowerCase().includes(partSearchQuery.toLowerCase());
            const isNotArchived = !part.isArchived;
            return matchesCategory && matchesSearch && isNotArchived;
        }) ?? [];

        const brands = new Set<string>();
        baseFilteredParts.forEach(part => {
            if (part.brand) brands.add(part.brand);
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
            <Paper
                withBorder
                radius="lg"
                p="xs"
                className="bg-white/80 dark:bg-[#141a23]/90 border-slate-200/80 dark:border-white/10 shadow-xs"
            >
                <div className="flex items-center justify-between gap-2 sm:gap-3 flex-nowrap overflow-x-auto no-scrollbar py-0.5">
                    {/* Left Controls: Search, Categories, Brands, Sort & Direction */}
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <TextInput
                            placeholder="Search parts by name or brand..."
                            value={partSearchQuery}
                            onChange={(e) => setPartSearchQuery(e.currentTarget.value)}
                            leftSection={<Search size={14} className="text-slate-400" />}
                            size="xs"
                            radius="md"
                            className="w-36 sm:w-48 lg:w-56 shrink-0"
                        />

                        {/* Categories Dropdown Filter */}
                        <Menu shadow="md" width={220} radius="md" closeOnItemClick={false}>
                            <Menu.Target>
                                <Button
                                    variant={!partCategories.every(c => c.selected) ? "light" : "default"}
                                    color={!partCategories.every(c => c.selected) ? "cyan" : undefined}
                                    size="xs"
                                    radius="md"
                                    leftSection={<Filter size={13} className={!partCategories.every(c => c.selected) ? "text-cyan-500" : "text-slate-400"} />}
                                >
                                    Categories
                                    {!partCategories.every(c => c.selected) && (
                                        <Badge size="xs" variant="filled" color="cyan" circle ml={5}>
                                            {partCategories.filter(c => c.selected).length}
                                        </Badge>
                                    )}
                                </Button>
                            </Menu.Target>
                            <Menu.Dropdown>
                                <Menu.Label>Filter by Category</Menu.Label>
                                <div className="px-2 py-1.5">
                                    <Checkbox
                                        label="All Categories"
                                        size="xs"
                                        checked={partCategories.every(c => c.selected)}
                                        onChange={() => {
                                            const anyUnselected = partCategories.some(cat => !cat.selected);
                                            setSelectedBrands([]);
                                            onSetCategories(partCategories.map(c => ({ ...c, selected: anyUnselected })));
                                        }}
                                    />
                                </div>
                                <Menu.Divider />
                                <ScrollArea.Autosize mah={240}>
                                    <div className="space-y-1 px-2 py-1">
                                        {partCategories.map((category) => (
                                            <Checkbox
                                                key={category.name}
                                                label={category.name}
                                                size="xs"
                                                checked={category.selected && !partCategories.every(c => c.selected)}
                                                onChange={() => {
                                                    setSelectedBrands([]);
                                                    onSetCategories(partCategories.map(c => ({
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

                        {/* Brands Dropdown Filter */}
                        {availableBrands.length > 0 && (
                            <Menu shadow="md" width={220} radius="md" closeOnItemClick={false}>
                                <Menu.Target>
                                    <Button
                                        variant={selectedBrands.length > 0 ? "light" : "default"}
                                        color={selectedBrands.length > 0 ? "cyan" : undefined}
                                        size="xs"
                                        radius="md"
                                        leftSection={<Filter size={13} className={selectedBrands.length > 0 ? "text-cyan-500" : "text-slate-400"} />}
                                    >
                                        Brands
                                        {selectedBrands.length > 0 && (
                                            <Badge size="xs" variant="filled" color="cyan" circle ml={5}>
                                                {selectedBrands.length}
                                            </Badge>
                                        )}
                                    </Button>
                                </Menu.Target>
                                <Menu.Dropdown>
                                    <Menu.Label>Filter by Brand</Menu.Label>
                                    <div className="px-2 py-1.5">
                                        <Checkbox
                                            label="All Brands"
                                            size="xs"
                                            checked={selectedBrands.length === 0}
                                            onChange={() => setSelectedBrands([])}
                                        />
                                    </div>
                                    <Menu.Divider />
                                    <ScrollArea.Autosize mah={240}>
                                        <div className="space-y-1 px-2 py-1">
                                            {availableBrands.map((brand) => (
                                                <Checkbox
                                                    key={brand}
                                                    label={brand}
                                                    size="xs"
                                                    checked={selectedBrands.includes(brand)}
                                                    onChange={(e) => {
                                                        if (e.currentTarget.checked) {
                                                            setSelectedBrands([brand]);
                                                        } else {
                                                            setSelectedBrands([]);
                                                        }
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </ScrollArea.Autosize>
                                </Menu.Dropdown>
                            </Menu>
                        )}

                        {/* Sort Menu */}
                        <Menu shadow="md" width={180} radius="md">
                            <Menu.Target>
                                <Button
                                    variant="default"
                                    size="xs"
                                    radius="md"
                                    leftSection={<ArrowUpDown size={13} className="text-slate-400" />}
                                >
                                    <span className="hidden sm:inline text-slate-400 font-normal mr-1">Sort:</span>
                                    {partSortBy}
                                </Button>
                            </Menu.Target>
                            <Menu.Dropdown>
                                <Menu.Label>Sort By</Menu.Label>
                                {['Date Added', 'Name', 'Price'].map((option) => (
                                    <Menu.Item
                                        key={option}
                                        onClick={() => {
                                            setPartSortBy(option);
                                            setPartCurrentPage(1);
                                        }}
                                        rightSection={
                                            partSortBy === option ? (
                                                <Check size={14} className="text-cyan-500" />
                                            ) : null
                                        }
                                    >
                                        {option}
                                    </Menu.Item>
                                ))}
                            </Menu.Dropdown>
                        </Menu>

                        {/* Sort Direction Toggle */}
                        <Tooltip
                            label={partSortDirection === "asc" ? "Ascending order" : "Descending order"}
                            withArrow
                            position="top"
                        >
                            <ActionIcon
                                variant="default"
                                size="input-xs"
                                radius="md"
                                onClick={() => {
                                    setPartSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                                    setPartCurrentPage(1);
                                }}
                                aria-label={`Sort Direction: ${partSortDirection.toUpperCase()}`}
                            >
                                {partSortDirection === 'asc' ? (
                                    <ArrowUpAZ size={15} className="text-cyan-500" />
                                ) : (
                                    <ArrowDownAZ size={15} className="text-cyan-500" />
                                )}
                            </ActionIcon>
                        </Tooltip>
                    </div>

                    {/* Right Controls: Bulk Selection, Grid/Table Toggle & Add Part */}
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <Button
                            variant={isPartSelectionMode ? "light" : "default"}
                            color={isPartSelectionMode ? "cyan" : undefined}
                            size="xs"
                            radius="md"
                            leftSection={<CheckSquare size={13} />}
                            onClick={() => {
                                setIsPartSelectionMode(!isPartSelectionMode);
                                if (isPartSelectionMode) setSelectedPartIds([]);
                            }}
                        >
                            <span className="hidden sm:inline">{isPartSelectionMode ? "Finish Selection" : "Select"}</span>
                            <span className="sm:hidden">{isPartSelectionMode ? "Done" : "Select"}</span>
                        </Button>

                        {isPartSelectionMode && (
                            <Button
                                variant="default"
                                size="xs"
                                radius="md"
                                leftSection={<PackageCheck size={13} />}
                                onClick={() => toggleAllPartsSelection(currentParts)}
                            >
                                {currentParts.length > 0 && currentParts.every(p => selectedPartIds.some(s => s.id === p.id)) ? "Deselect All" : "Select All"}
                            </Button>
                        )}

                        {selectedPartIds.length > 0 && (
                            <div className="flex items-center gap-1.5 bg-cyan-500/10 px-2 py-1 rounded-md border border-cyan-500/20">
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

                        <AddPartDialog onSave={onAddPart}>
                            <Button
                                size="xs"
                                radius="md"
                                color="cyan"
                                variant="filled"
                                leftSection={<Plus size={14} />}
                                className="font-semibold shadow-xs"
                            >
                                Add Part
                            </Button>
                        </AddPartDialog>
                    </div>
                </div>
            </Paper>

            {activeView === 'grid' ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                    {partsLoading ? null : (
                        currentParts.map((part) => (
                            <InventoryPartCard
                                key={part.id}
                                part={part}
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
                <div className="rounded-xl border border-white/10 bg-background/50 backdrop-blur-md overflow-hidden">
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
                </div>
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
