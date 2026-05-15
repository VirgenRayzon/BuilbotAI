"use client";

import React, { useState, useMemo } from 'react';
import { Search, Filter, CheckSquare, PackageCheck, Archive, Trash2, LayoutGrid, Table as TableIcon, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
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
    isPartSelectionMode,
    setIsPartSelectionMode,
    selectedPartIds,
    setSelectedPartIds,
    togglePartSelection,
    toggleAllPartsSelection,
    setConfirmAction
}: StockTabProps) {
    const [partSearchQuery, setPartSearchQuery] = useState('');
    const [partSortBy, setPartSortBy] = useState('Date Added');
    const [partSortDirection, setPartSortDirection] = useState<'asc' | 'desc'>('desc');
    const [activeView, setActiveView] = useState<'grid' | 'table'>('grid');
    const [partCurrentPage, setPartCurrentPage] = useState(1);
    const [partItemsPerPage, setPartItemsPerPage] = useState(10);

    const filteredAndSortedParts = useMemo(() => {
        const selectedCategories = partCategories.filter(c => c.selected).map(c => c.name);
        return (parts?.filter(part => {
            const matchesCategory = selectedCategories.includes(part.category);
            const matchesSearch = part.name.toLowerCase().includes(partSearchQuery.toLowerCase()) ||
                part.brand.toLowerCase().includes(partSearchQuery.toLowerCase());
            const isNotArchived = !part.isArchived;
            return matchesCategory && matchesSearch && isNotArchived;
        }) ?? [])
            .sort((a, b) => {
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
    }, [parts, partCategories, partSortBy, partSortDirection, partSearchQuery]);

    const partTotalPages = Math.ceil(filteredAndSortedParts.length / partItemsPerPage);
    const currentParts = useMemo(() => {
        const startIndex = (partCurrentPage - 1) * partItemsPerPage;
        return filteredAndSortedParts.slice(startIndex, startIndex + partItemsPerPage);
    }, [filteredAndSortedParts, partCurrentPage, partItemsPerPage]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/30 p-4 rounded-xl border border-white/5 backdrop-blur-md">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-grow md:flex-grow-0 md:w-80 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Search parts by name or brand..."
                            value={partSearchQuery}
                            onChange={(e) => setPartSearchQuery(e.target.value)}
                            className="pl-10 h-11 bg-background/50 border-white/10 focus:border-primary/50 transition-all rounded-lg"
                        />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-11 gap-2 border-white/10 bg-background/50 hover:bg-primary/5 hover:border-primary/30">
                                <Filter className="h-4 w-4" />
                                Categories
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-background/95 backdrop-blur-xl border-white/10">
                            <DropdownMenuCheckboxItem
                                checked={partCategories.every(c => c.selected)}
                                onCheckedChange={() => {
                                    const anyUnselected = partCategories.some(cat => !cat.selected);
                                    onSetCategories(partCategories.map(c => ({ ...c, selected: anyUnselected })));
                                }}
                            >
                                All Categories
                            </DropdownMenuCheckboxItem>
                            <Separator className="my-1 opacity-50" />
                            {partCategories.map((category) => (
                                <DropdownMenuCheckboxItem
                                    key={category.name}
                                    checked={category.selected && !partCategories.every(c => c.selected)}
                                    onCheckedChange={() => {
                                        // STRICT SINGLE-SELECT: Clicking any category selects ONLY that one.
                                        onSetCategories(partCategories.map(c => ({
                                            ...c,
                                            selected: c.name === category.name
                                        })));
                                    }}
                                >
                                    {category.name}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <Button
                        variant={isPartSelectionMode ? "secondary" : "outline"}
                        className={cn(
                            "h-11 gap-2 border-white/10 bg-background/50 transition-all",
                            isPartSelectionMode && "bg-primary/20 border-primary/50 text-white shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]"
                        )}
                        onClick={() => {
                            setIsPartSelectionMode(!isPartSelectionMode);
                            if (isPartSelectionMode) setSelectedPartIds([]);
                        }}
                    >
                        <CheckSquare className="h-4 w-4" />
                        {isPartSelectionMode ? "Finish Selection" : "Select"}
                    </Button>

                    {isPartSelectionMode && (
                        <Button
                            variant="outline"
                            className="h-11 gap-2 border-white/10 bg-background/50 hover:bg-primary/5"
                            onClick={() => toggleAllPartsSelection(currentParts)}
                        >
                            <PackageCheck className="h-4 w-4" />
                            {currentParts.length > 0 && currentParts.every(p => selectedPartIds.some(s => s.id === p.id)) ? "Deselect All" : "Select All"}
                        </Button>
                    )}

                    {selectedPartIds.length > 0 && (
                        <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 animate-in fade-in slide-in-from-right-2">
                            <span className="text-xs font-bold text-primary">{selectedPartIds.length} Selected</span>
                            <Separator orientation="vertical" className="h-4 bg-primary/20" />
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs hover:bg-primary/20"
                                onClick={() => setConfirmAction({ isOpen: true, type: 'archive', target: 'parts' })}
                            >
                                <Archive className="mr-1.5 h-3 w-3" /> Archive
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
                    <div className="flex bg-muted/50 p-1 rounded-lg border border-white/10 shrink-0">
                        <Button
                            variant={activeView === 'grid' ? 'secondary' : 'ghost'}
                            size="icon"
                            onClick={() => setActiveView('grid')}
                            className={cn("h-9 w-9", activeView === 'grid' && "bg-background shadow-sm")}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={activeView === 'table' ? 'secondary' : 'ghost'}
                            size="icon"
                            onClick={() => setActiveView('table')}
                            className={cn("h-9 w-9", activeView === 'table' && "bg-background shadow-sm")}
                        >
                            <TableIcon className="h-4 w-4" />
                        </Button>
                    </div>
                    <AddPartDialog onSave={onAddPart}>
                        <Button className="h-11 gap-2 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 px-6 shrink-0 transition-transform active:scale-95">
                            <Plus className="h-4 w-4" />
                            Add Part
                        </Button>
                    </AddPartDialog>
                </div>
            </div>

            {activeView === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                    {partsLoading ? null : (
                        currentParts.map((part) => (
                            <InventoryPartCard
                                key={part.id}
                                part={part}
                                onDelete={onDeletePart}
                                onArchive={onArchivePart}
                                onUpdateStock={onUpdatePartStock}
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
