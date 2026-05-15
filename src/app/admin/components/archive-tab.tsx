"use client";

import React, { useState } from 'react';
import { Archive, Filter, PackageCheck, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { InventoryTable } from '@/components/inventory-table';
import { PrebuiltsTable } from '@/components/prebuilts-table';
import { cn } from "@/lib/utils";
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
    selectedPartIds: { id: string, category: Part['category'] }[];
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
    setConfirmAction
}: ArchiveTabProps) {
    const [archivePartCategories, setArchivePartCategories] = useState<{ name: string, selected: boolean }[]>([
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

    const archivedParts = parts?.filter(p => p.isArchived && archivePartCategories.find(c => c.name === p.category)?.selected) || [];
    const archivedPrebuilts = prebuiltSystems?.filter(s => s.isArchived) || [];

    return (
        <div className="mt-6 space-y-8">
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h2 className="text-xl font-headline font-bold flex items-center gap-2">
                        <Archive className="h-5 w-5 text-primary" />
                        Archived Parts
                    </h2>
                    <div className="flex items-center gap-3">
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
                                <Button variant="outline" className="h-9 gap-2 border-white/10 bg-background/50 hover:bg-primary/5 hover:border-primary/30 text-xs">
                                    <Filter className="h-3 w-3" />
                                    Categories
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 bg-background/95 backdrop-blur-xl border-white/10">
                                <DropdownMenuCheckboxItem
                                    checked={archivePartCategories.every(c => c.selected)}
                                    onCheckedChange={() => {
                                        const anyUnselected = archivePartCategories.some(cat => !cat.selected);
                                        setArchivePartCategories(prev => prev.map(c => ({ ...c, selected: anyUnselected })));
                                    }}
                                >
                                    All Categories
                                </DropdownMenuCheckboxItem>
                                <Separator className="my-1 opacity-50" />
                                {archivePartCategories.map((category) => (
                                    <DropdownMenuCheckboxItem
                                        key={category.name}
                                        checked={category.selected && !archivePartCategories.every(c => c.selected)}
                                        onCheckedChange={() => {
                                            // STRICT SINGLE-SELECT: Clicking any category selects ONLY that one.
                                            setArchivePartCategories(prev => prev.map(c => ({
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
                </div>
                <div className="rounded-xl border border-white/10 bg-background/50 backdrop-blur-md overflow-hidden">
                    {partsLoading ? null : (
                        <InventoryTable
                            parts={archivedParts}
                            onDelete={onDeletePart}
                            onArchive={onArchivePart}
                            onUpdateStock={onUpdatePartStock}
                            onUpdatePart={onUpdatePart}
                            selectedIds={selectedPartIds}
                            onToggleSelection={togglePartSelection}
                            onToggleSelectAll={() => toggleAllPartsSelection(parts?.filter(p => p.isArchived) || [])}
                            isSuperAdmin={profile?.isSuperAdmin}
                            isArchiveView={true}
                        />
                    )}
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h2 className="text-xl font-headline font-bold flex items-center gap-2">
                        <Archive className="h-5 w-5 text-primary" />
                        Archived Prebuilts
                    </h2>
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
                </div>
                <div className="rounded-xl border border-white/10 bg-background/50 backdrop-blur-md overflow-hidden">
                    {prebuiltsLoading ? null : (
                        <PrebuiltsTable
                            systems={archivedPrebuilts}
                            parts={parts || []}
                            onDelete={onDeletePrebuilt}
                            onArchive={onArchivePrebuilt}
                            onUpdate={onUpdatePrebuilt}
                            expandedIds={[]}
                            onToggleExpand={() => { }}
                            selectedIds={selectedPrebuiltIds}
                            onToggleSelection={togglePrebuiltSelection}
                            onToggleSelectAll={() => toggleAllPrebuiltsSelection(prebuiltSystems?.filter(s => s.isArchived) || [])}
                            isSuperAdmin={profile?.isSuperAdmin}
                            isArchiveView={true}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
