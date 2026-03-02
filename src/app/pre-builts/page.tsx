
"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { InventoryToolbar } from '@/components/inventory-toolbar';
import { PrebuiltSystemCard } from '@/components/prebuilt-system-card';
import type { PrebuiltSystem } from '@/lib/types';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { PrebuiltsTable } from '@/components/prebuilts-table';
import { SearchX, MonitorOff } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const prebuiltCategories = [
    { name: "Entry", selected: true },
    { name: "Mid-Range", selected: true },
    { name: "High-End", selected: true },
    { name: "Workstation", selected: true },
];

export default function PreBuiltsPage() {
    const firestore = useFirestore();
    const prebuiltSystemsQuery = useMemo(() => firestore ? collection(firestore, 'prebuiltSystems') : null, [firestore]);
    const { data: prebuiltSystems, loading } = useCollection<PrebuiltSystem>(prebuiltSystemsQuery);

    const [categories, setCategories] = useState(prebuiltCategories);
    const [sortBy, setSortBy] = useState('Date Added');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');

    const handleCategoryChange = (categoryName: string, selected: boolean) => {
        setCategories(prev => {
            if (categoryName === 'All') {
                const anyUnselected = prev.some(cat => !cat.selected);
                return prev.map(cat => ({ ...cat, selected: anyUnselected }));
            }
            return prev.map(cat => ({
                ...cat,
                selected: cat.name === categoryName ? true : false
            }));
        });
    };

    const filteredAndSortedSystems = useMemo(() => {
        const selectedCategories = categories.filter(c => c.selected).map(c => c.name);
        const searchLower = searchQuery.toLowerCase();

        return (prebuiltSystems?.filter(system => {
            const matchesCategory = selectedCategories.includes(system.tier);
            const matchesSearch = system.name.toLowerCase().includes(searchLower) ||
                (system.description?.toLowerCase() || '').includes(searchLower);
            return matchesCategory && matchesSearch;
        }) ?? [])
            .sort((a, b) => {
                let compare = 0;
                if (sortBy === 'Name') compare = a.name.localeCompare(b.name);
                else if (sortBy === 'Price') compare = a.price - b.price;
                else if (sortBy === 'Tier') compare = a.tier.localeCompare(b.tier);
                else if (sortBy === 'Date Added') {
                    const dateA = a.createdAt?.toDate?.() || a.createdAt || 0;
                    const dateB = b.createdAt?.toDate?.() || b.createdAt || 0;
                    compare = new Date(dateA).getTime() - new Date(dateB).getTime();
                }
                return sortDirection === 'asc' ? compare : -compare;
            });
    }, [prebuiltSystems, categories, sortBy, sortDirection, searchQuery]);

    return (
        <main className="container mx-auto p-4 md:p-8">
            <div className="text-left mb-8">
                <h1 className="text-4xl font-headline font-bold">Pre-built Rigs</h1>
                <p className="text-muted-foreground mt-2">
                    Expertly crafted builds for every need and budget.
                </p>
            </div>

            <InventoryToolbar
                categories={categories}
                onCategoryChange={handleCategoryChange}
                itemCount={filteredAndSortedSystems.length}
                sortBy={sortBy}
                onSortByChange={setSortBy}
                sortDirection={sortDirection}
                onSortDirectionChange={setSortDirection}
                supportedSorts={['Date Added', 'Name', 'Price', 'Tier']}
                view={view}
                onViewChange={setView}
                showViewToggle={true}
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
            />

            {loading ? (
                view === 'grid' ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
                        {[...Array(8)].map((_, i) => (
                            <Card key={i} className="overflow-hidden">
                                <CardContent className="p-0">
                                    <Skeleton className="aspect-video w-full rounded-none" />
                                </CardContent>
                                <CardContent className="p-4 space-y-3 mt-2">
                                    <Skeleton className="h-6 w-3/4" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-5/6" />
                                    <Skeleton className="h-5 w-24 mt-4" />
                                </CardContent>
                                <CardFooter className="p-4 pt-0 flex justify-between items-center mt-2">
                                    <Skeleton className="h-8 w-1/3" />
                                    <Skeleton className="h-10 w-28" />
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="mt-6">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>System Name</TableHead>
                                    <TableHead>Tier</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {[...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Skeleton className="w-10 h-10 rounded-sm" />
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-40" />
                                                    <Skeleton className="h-3 w-64" />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                                        <TableCell align="right"><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                )
            ) : filteredAndSortedSystems.length > 0 ? (
                view === 'grid' ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
                        {filteredAndSortedSystems.map(system => (
                            <PrebuiltSystemCard key={system.id} system={system} />
                        ))}
                    </div>
                ) : (
                    <Card className="mt-6 overflow-hidden">
                        <PrebuiltsTable systems={filteredAndSortedSystems} showActions={false} />
                    </Card>
                )
            ) : (
                <Card className="mt-6 min-h-[400px] flex items-center justify-center border-dashed">
                    <CardContent className="text-center text-muted-foreground p-12 flex flex-col items-center justify-center space-y-4">
                        <div className="p-4 bg-muted rounded-full">
                            {searchQuery ? (
                                <SearchX className="h-12 w-12 text-muted-foreground/60" />
                            ) : (
                                <MonitorOff className="h-12 w-12 text-muted-foreground/60" />
                            )}
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-headline font-semibold text-foreground">No pre-built rigs found</h3>
                            <p className="max-w-md mx-auto">
                                {searchQuery
                                    ? `We couldn't find any systems matching "${searchQuery}". Try adjusting your search or category filters.`
                                    : "No pre-built rigs match the currently selected categories."}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </main>
    )
}
