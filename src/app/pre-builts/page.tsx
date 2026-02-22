"use client";

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { InventoryToolbar } from '@/components/inventory-toolbar';

const prebuiltCategories = [
    { name: "Gaming", selected: true },
    { name: "Workstation", selected: true },
    { name: "Budget", selected: true },
];

export default function PreBuiltsPage() {
    const [categories, setCategories] = useState(prebuiltCategories);

    const handleCategoryChange = (categoryName: string, selected: boolean) => {
        setCategories(prev =>
            prev.map(cat => (cat.name === categoryName ? { ...cat, selected } : cat))
        );
    };

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
                itemCount={0}
            />

            <Card className="mt-6 min-h-[400px] flex items-center justify-center">
                <CardContent className="text-center text-muted-foreground p-6">
                    <p>No pre-built rigs available.</p>
                </CardContent>
            </Card>
        </main>
    )
}
