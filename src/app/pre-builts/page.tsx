
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
    const [sortBy, setSortBy] = useState('Name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [view, setView] = useState<'grid' | 'list'>('grid');

    const handleCategoryChange = (categoryName: string, selected: boolean) => {
        setCategories(prev =>
            prev.map(cat => (cat.name === categoryName ? { ...cat, selected } : cat))
        );
    };

    const filteredAndSortedSystems = useMemo(() => {
        const selectedCategories = categories.filter(c => c.selected).map(c => c.name);
        return (prebuiltSystems?.filter(system => selectedCategories.includes(system.tier)) ?? [])
            .sort((a, b) => {
                let compare = 0;
                if (sortBy === 'Name') compare = a.name.localeCompare(b.name);
                else if (sortBy === 'Price') compare = a.price - b.price;
                else if (sortBy === 'Tier') compare = a.tier.localeCompare(b.tier);
                return sortDirection === 'asc' ? compare : -compare;
            });
    }, [prebuiltSystems, categories, sortBy, sortDirection]);

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
                supportedSorts={['Name', 'Price', 'Tier']}
                view={view}
                onViewChange={setView}
                showViewToggle={true}
            />
            
            {loading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i}>
                            <CardContent className="p-4"><Skeleton className="aspect-video w-full mb-2" /></CardContent>
                            <CardContent className="p-4 pt-0 space-y-2"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /></CardContent>
                            <CardFooter className="p-4 pt-0 flex justify-between items-center"><Skeleton className="h-6 w-1/3" /><Skeleton className="h-9 w-28" /></CardFooter>
                        </Card>
                    ))}
                </div>
            ) : filteredAndSortedSystems.length > 0 ? (
                view === 'grid' ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                        {filteredAndSortedSystems.map(system => (
                            <PrebuiltSystemCard key={system.id} system={system} />
                        ))}
                    </div>
                ) : (
                    <Card className="mt-6">
                        <PrebuiltsTable systems={filteredAndSortedSystems} showActions={false} />
                    </Card>
                )
            ) : (
                 <Card className="mt-6 min-h-[400px] flex items-center justify-center">
                    <CardContent className="text-center text-muted-foreground p-6">
                        <p>No pre-built rigs match the selected categories.</p>
                    </CardContent>
                </Card>
            )}
        </main>
    )
}
