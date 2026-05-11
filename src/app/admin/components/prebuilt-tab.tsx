"use client";

import React, { useState, useMemo } from 'react';
import { Filter, CheckSquare, PackageCheck, Archive, Trash2, LayoutGrid, Table as TableIcon, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
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
    const [prebuiltItemsPerPage, setPrebuiltItemsPerPage] = useState(10);
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
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/30 p-4 rounded-xl border border-white/5 backdrop-blur-md">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-11 gap-2 border-white/10 bg-background/50 hover:bg-primary/5 hover:border-primary/30">
                                <Filter className="h-4 w-4" />
                                Filter Tiers
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-background/95 backdrop-blur-xl border-white/10">
                            {prebuiltCategories.map((category) => (
                                <DropdownMenuCheckboxItem
                                    key={category.name}
                                    checked={category.selected}
                                    onCheckedChange={() => {
                                        onSetCategories(prebuiltCategories.map(c =>
                                            c.name === category.name ? { ...c, selected: !c.selected } : c
                                        ));
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
                        variant={isPrebuiltSelectionMode ? "secondary" : "outline"}
                        className={cn(
                            "h-11 gap-2 border-white/10 bg-background/50 transition-all",
                            isPrebuiltSelectionMode && "bg-primary/20 border-primary/50 text-white shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]"
                        )}
                        onClick={() => {
                            setIsPrebuiltSelectionMode(!isPrebuiltSelectionMode);
                            if (isPrebuiltSelectionMode) setSelectedPrebuiltIds([]);
                        }}
                    >
                        <CheckSquare className="h-4 w-4" />
                        {isPrebuiltSelectionMode ? "Finish Selection" : "Select"}
                    </Button>

                    {isPrebuiltSelectionMode && (
                        <Button
                            variant="outline"
                            className="h-11 gap-2 border-white/10 bg-background/50 hover:bg-primary/5"
                            onClick={() => toggleAllPrebuiltsSelection(currentPrebuilts)}
                        >
                            <PackageCheck className="h-4 w-4" />
                            {currentPrebuilts.length > 0 && currentPrebuilts.every(s => selectedPrebuiltIds.includes(s.id)) ? "Deselect All" : "Select All"}
                        </Button>
                    )}

                    {selectedPrebuiltIds.length > 0 && (
                        <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 animate-in fade-in slide-in-from-right-2">
                            <span className="text-xs font-bold text-primary">{selectedPrebuiltIds.length} Selected</span>
                            <Separator orientation="vertical" className="h-4 bg-primary/20" />
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs hover:bg-primary/20"
                                onClick={() => setConfirmAction({ isOpen: true, type: 'archive', target: 'prebuilts' })}
                            >
                                <Archive className="mr-1.5 h-3 w-3" /> Archive
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
                    <AddPrebuiltDialog
                        parts={parts || []}
                        onSave={onAddPrebuilt}
                    >
                        <Button className="h-11 gap-2 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 px-6 shrink-0 transition-transform active:scale-95">
                            <Plus className="h-4 w-4" />
                            Add System
                        </Button>
                    </AddPrebuiltDialog>
                </div>
            </div>

            {activeView === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                <div className="rounded-xl border border-white/10 bg-background/50 backdrop-blur-md overflow-hidden">
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
                </div>
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
