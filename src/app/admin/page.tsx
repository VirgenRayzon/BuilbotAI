"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Package, PackageCheck } from "lucide-react";
import { InventoryToolbar } from '@/components/inventory-toolbar';
import { Card, CardContent } from '@/components/ui/card';
import { AddPartDialog, type AddPartFormSchema } from '@/components/add-part-dialog';
import { AddPrebuiltDialog, type AddPrebuiltFormSchema } from '@/components/add-prebuilt-dialog';
import { parts as initialParts, prebuiltSystems as initialPrebuilts } from '@/lib/database';
import type { Part, PrebuiltSystem } from '@/lib/types';
import { InventoryTable } from '@/components/inventory-table';
import { PrebuiltsTable } from '@/components/prebuilts-table';

const componentCategories = [
  { name: "CPU", selected: true },
  { name: "GPU", selected: true },
  { name: "Motherboard", selected: true },
  { name: "RAM", selected: true },
  { name: "Storage", selected: true },
  { name: "PSU", selected: true },
  { name: "Case", selected: true },
  { name: "Cooler", selected: true },
];

export default function AdminPage() {
    const [categories, setCategories] = useState(componentCategories);
    const [parts, setParts] = useState<Part[]>(initialParts);
    const [prebuiltSystems, setPrebuiltSystems] = useState<PrebuiltSystem[]>(initialPrebuilts);

    const handleCategoryChange = (categoryName: string, selected: boolean) => {
        setCategories(prev =>
            prev.map(cat => (cat.name === categoryName ? { ...cat, selected } : cat))
        );
    };

    const handleAddPart = (newPartData: AddPartFormSchema) => {
        const newPart: Part = {
            id: `part-${Date.now()}`,
            name: newPartData.partName,
            category: newPartData.category as Part['category'],
            brand: newPartData.brand,
            price: newPartData.price,
            stock: newPartData.stockCount,
            imageUrl: newPartData.imageUrl || `https://picsum.photos/seed/${newPartData.partName.replace(/\s+/g, '')}/800/600`,
            specifications: newPartData.specifications,
        };
        setParts(prev => [newPart, ...prev]);
    };

    const handleDeletePart = (partId: string) => {
        setParts(prev => prev.filter(p => p.id !== partId));
    };

    const handleAddPrebuilt = (newPrebuiltData: AddPrebuiltFormSchema) => {
        const newPrebuilt: PrebuiltSystem = {
            id: `prebuilt-${Date.now()}`,
            name: newPrebuiltData.name,
            tier: newPrebuiltData.tier as PrebuiltSystem['tier'],
            price: newPrebuiltData.price,
            description: newPrebuiltData.description,
            imageUrl: newPrebuiltData.imageUrl || `https://picsum.photos/seed/${newPrebuiltData.name.replace(/\s+/g, '')}/800/600`,
            components: {
                cpu: newPrebuiltData.cpu,
                gpu: newPrebuiltData.gpu,
                motherboard: newPrebuiltData.motherboard,
                ram: newPrebuiltData.ram,
                storage: newPrebuiltData.storage,
                psu: newPrebuiltData.psu,
                case: newPrebuiltData.case,
                cooler: newPrebuiltData.cooler,
            }
        };
        setPrebuiltSystems(prev => [newPrebuilt, ...prev]);
    };

    const handleDeletePrebuilt = (systemId: string) => {
        setPrebuiltSystems(prev => prev.filter(s => s.id !== systemId));
    };
    
    const selectedCategories = categories.filter(c => c.selected).map(c => c.name);
    const filteredParts = parts.filter(part => selectedCategories.includes(part.category));

    return (
        <div className="container mx-auto p-4 md:p-8">
            <Tabs defaultValue="stock">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                    <TabsList>
                        <TabsTrigger value="stock">
                            <Package className="mr-2" />
                            Manage Stock
                        </TabsTrigger>
                        <TabsTrigger value="prebuilts">
                            <PackageCheck className="mr-2" />
                            Manage Prebuilts
                        </TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="stock">
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-headline font-bold">INVENTORY OVERVIEW</h2>
                            <AddPartDialog onAddPart={handleAddPart}>
                                <Button>
                                    <Plus className="mr-2" />
                                    Add New Part
                                </Button>
                            </AddPartDialog>
                        </div>
                        <InventoryToolbar 
                            categories={categories}
                            onCategoryChange={handleCategoryChange}
                            itemCount={filteredParts.length}
                        />
                        <Card className="mt-6">
                            {parts.length > 0 ? (
                                filteredParts.length > 0 ? (
                                    <InventoryTable parts={filteredParts} onDelete={handleDeletePart} />
                                ) : (
                                    <CardContent className="min-h-[300px] flex items-center justify-center text-center text-muted-foreground p-6">
                                        <p>No items match the selected categories.</p>
                                    </CardContent>
                                )
                            ) : (
                                <CardContent className="min-h-[300px] flex items-center justify-center text-center text-muted-foreground p-6">
                                    <p>No items in inventory.</p>
                                </CardContent>
                            )}
                        </Card>
                    </div>
                </TabsContent>
                <TabsContent value="prebuilts">
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-headline font-bold">PREBUILTS OVERVIEW</h2>
                            <AddPrebuiltDialog onAddPrebuilt={handleAddPrebuilt}>
                                <Button>
                                    <Plus className="mr-2" />
                                    Add New Prebuilt
                                </Button>
                            </AddPrebuiltDialog>
                        </div>
                        <Card className="mt-6">
                             {prebuiltSystems.length > 0 ? (
                                <PrebuiltsTable systems={prebuiltSystems} onDelete={handleDeletePrebuilt} />
                            ) : (
                                <CardContent className="min-h-[300px] flex items-center justify-center text-center text-muted-foreground p-6">
                                    <p>No pre-built systems configured.</p>
                                </CardContent>
                            )}
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
