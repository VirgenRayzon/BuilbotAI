"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Package, PackageCheck } from "lucide-react";
import { InventoryToolbar } from '@/components/inventory-toolbar';
import { Card, CardContent } from '@/components/ui/card';
import { AddPartDialog } from '@/components/add-part-dialog';
import { AddPrebuiltDialog } from '@/components/add-prebuilt-dialog';

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

    const handleCategoryChange = (categoryName: string, selected: boolean) => {
        setCategories(prev =>
            prev.map(cat => (cat.name === categoryName ? { ...cat, selected } : cat))
        );
    };
    
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
                            <AddPartDialog>
                                <Button>
                                    <Plus className="mr-2" />
                                    Add New Part
                                </Button>
                            </AddPartDialog>
                        </div>
                        <InventoryToolbar 
                            categories={categories}
                            onCategoryChange={handleCategoryChange}
                            itemCount={0}
                        />
                        <Card className="mt-6 min-h-[300px] flex items-center justify-center">
                            <CardContent className="text-center text-muted-foreground p-6">
                                <p>No items in inventory.</p>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
                <TabsContent value="prebuilts">
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-headline font-bold">PREBUILTS OVERVIEW</h2>
                            <AddPrebuiltDialog>
                                <Button>
                                    <Plus className="mr-2" />
                                    Add New Prebuilt
                                </Button>
                            </AddPrebuiltDialog>
                        </div>
                        <Card className="mt-6 min-h-[300px] flex items-center justify-center">
                            <CardContent className="text-center text-muted-foreground p-6">
                                <p>No pre-built systems configured.</p>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
