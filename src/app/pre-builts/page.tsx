"use client";

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { InventoryToolbar } from '@/components/inventory-toolbar';
import { prebuiltSystems } from '@/lib/database';
import { PrebuiltSystemCard } from '@/components/prebuilt-system-card';
import type { PrebuiltSystem } from '@/lib/types';

const prebuiltCategories = [
    { name: "Entry", selected: true },
    { name: "Mid-Range", selected: true },
    { name: "High-End", selected: true },
    { name: "Workstation", selected: true },
];

export default function PreBuiltsPage() {
    const [categories, setCategories] = useState(prebuiltCategories);

    const handleCategoryChange = (categoryName: string, selected: boolean) => {
        setCategories(prev =>
            prev.map(cat => (cat.name === categoryName ? { ...cat, selected } : cat))
        );
    };

    const selectedCategories = categories.filter(c => c.selected).map(c => c.name);
    const filteredSystems = prebuiltSystems.filter(system => selectedCategories.includes(system.tier));

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
                itemCount={filteredSystems.length}
            />
            
            {filteredSystems.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                    {filteredSystems.map(system => (
                        <PrebuiltSystemCard key={system.id} system={system} />
                    ))}
                </div>
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
