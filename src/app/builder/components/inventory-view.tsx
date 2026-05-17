"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Database, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { formatCurrency, cn, getOptimizedStorageUrl } from "@/lib/utils";
import { InventoryToolbar } from "@/components/inventory-toolbar";
import { PartCard } from "@/components/part-card";
import { PaginationControls } from "@/components/pagination-controls";
import type { Part } from '@/lib/types';

interface InventoryViewProps {
    loading: boolean;
    paginatedParts: any[];
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange: (count: number) => void;
    view: 'grid' | 'list';
    onViewChange: (view: 'grid' | 'list') => void;
    categories: any[];
    onCategoryChange: (name: string, selected: boolean) => void;
    searchQuery: string;
    onSearchQueryChange: (query: string) => void;
    sortBy: string;
    onSortByChange: (sort: string) => void;
    sortDirection: 'asc' | 'desc';
    onSortDirectionChange: (dir: 'asc' | 'desc') => void;
    onTogglePart: (part: Part) => void;
    isSelected: (part: Part) => boolean;
    itemCount: number;
}

export function InventoryView({
    loading,
    paginatedParts,
    totalPages,
    currentPage,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
    view,
    onViewChange,
    categories,
    onCategoryChange,
    searchQuery,
    onSearchQueryChange,
    sortBy,
    onSortByChange,
    sortDirection,
    onSortDirectionChange,
    onTogglePart,
    isSelected,
    itemCount
}: InventoryViewProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-3xl border shadow-2xl transition-all duration-500 glass-panel lg:col-span-9"
        >
            <div className="mb-8">
                <InventoryToolbar
                    categories={categories}
                    onCategoryChange={onCategoryChange}
                    itemCount={itemCount}
                    sortBy={sortBy}
                    onSortByChange={onSortByChange}
                    sortDirection={sortDirection}
                    onSortDirectionChange={onSortDirectionChange}
                    supportedSorts={['Date Added', 'Name', 'Price']}
                    view={view}
                    onViewChange={onViewChange}
                    showViewToggle={true}
                    searchQuery={searchQuery}
                    onSearchQueryChange={onSearchQueryChange}
                />
            </div>

            {loading ? null : paginatedParts.length > 0 ? (
                view === 'grid' ? (
                    <>
                        <div className="grid gap-3 md:gap-6 grid-cols-2 lg:grid-cols-4">
                            {paginatedParts.map(part => (
                                <PartCard
                                    key={part.id}
                                    part={part}
                                    effectiveStock={part.effectiveStock}
                                    onToggleBuild={onTogglePart}
                                    isSelected={isSelected(part)}
                                    compatibility={part.compatibility}
                                />
                            ))}
                        </div>
                        <div className="mt-12">
                            <PaginationControls
                                currentPage={currentPage}
                                totalPages={totalPages}
                                itemsPerPage={itemsPerPage}
                                onPageChange={onPageChange}
                                onItemsPerPageChange={onItemsPerPageChange}
                            />
                        </div>
                    </>
                ) : (
                    <div className="overflow-hidden rounded-2xl border border-border/50 bg-background/20">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow>
                                    <TableHead className="uppercase text-[10px] font-bold tracking-widest">Component Identity</TableHead>
                                    <TableHead className="uppercase text-[10px] font-bold tracking-widest">Inventory State</TableHead>
                                    <TableHead className="text-right uppercase text-[10px] font-bold tracking-widest">Value (PHP)</TableHead>
                                    <TableHead className="w-[80px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedParts.map(part => {
                                    const isPartSelected = isSelected(part);
                                    return (
                                        <TableRow key={part.id} className={cn(
                                            "transition-all duration-300",
                                            part.effectiveStock === 0 && !isPartSelected && "opacity-50 grayscale",
                                            part.compatibility && !part.compatibility.compatible && "bg-destructive/[0.03] hover:bg-destructive/[0.06] border-l-2 border-l-destructive shadow-[inset_4px_0_0_-2px_rgba(239,68,68,0.5)]"
                                        )}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-border/50">
                                                        <Image src={getOptimizedStorageUrl(part.imageUrl) || "/placeholder-part.png"} alt={part.name} fill className="object-cover" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-bold text-sm">{part.name}</p>
                                                        </div>
                                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{part.brand}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={part.effectiveStock > 5 ? "secondary" : part.effectiveStock > 0 ? "destructive" : "outline"} className="rounded-md uppercase text-[9px] font-bold">
                                                    {part.effectiveStock > 0 ? `${part.effectiveStock} UNITS` : "DEPLETED"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-bold">{formatCurrency(part.price)}</TableCell>
                                            <TableCell>
                                                <div className="flex justify-end">
                                                    {(!(part.compatibility && !part.compatibility.compatible) || isPartSelected) && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => onTogglePart(part)}
                                                            disabled={part.effectiveStock === 0 && !isPartSelected}
                                                            variant={isPartSelected ? 'destructive' : 'default'}
                                                            className="rounded-lg gap-2"
                                                        >
                                                            {isPartSelected ? <Trash2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                                            <span className="hidden sm:inline text-[10px] font-bold uppercase">{isPartSelected ? 'Remove' : 'Add'}</span>
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                        <div className="p-4 border-t border-border/50">
                            <PaginationControls
                                currentPage={currentPage}
                                totalPages={totalPages}
                                itemsPerPage={itemsPerPage}
                                onPageChange={onPageChange}
                                onItemsPerPageChange={onItemsPerPageChange}
                            />
                        </div>
                    </div>
                )
            ) : (
                <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-12">
                    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                        <Database className="w-8 h-8 text-muted-foreground opacity-20" />
                    </div>
                    <h3 className="text-lg font-bold mb-1 italic">Query Returned No Results</h3>
                    <p className="text-muted-foreground text-sm max-w-xs">Adjust your diagnostic filters to explore alternative component configurations.</p>
                </div>
            )}
        </motion.div>
    );
}
