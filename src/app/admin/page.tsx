
"use client";

import React, { useState, useTransition, useMemo, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Package, PackageCheck, ServerCrash } from "lucide-react";
import { InventoryToolbar } from '@/components/inventory-toolbar';
import { Card, CardContent } from '@/components/ui/card';
import { AddPartDialog, type AddPartFormSchema } from '@/components/add-part-dialog';
import { AddPrebuiltDialog, type AddPrebuiltFormSchema } from '@/components/add-prebuilt-dialog';
import type { Part, PrebuiltSystem } from '@/lib/types';
import { InventoryTable } from '@/components/inventory-table';
import { PrebuiltsTable } from '@/components/prebuilts-table';
import { useCollection } from '@/firebase/firestore/use-collection';
import { addPart, deletePart, addPrebuiltSystem, deletePrebuiltSystem, seedDatabase } from '@/firebase/database';
import { collection } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { TableSkeleton } from '@/components/table-skeleton';

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
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSeeding, startSeedingTransition] = useTransition();
    const [hasCheckedAndSeeded, setHasCheckedAndSeeded] = useState(false);

    const partsQuery = useMemo(() => firestore ? collection(firestore, 'pcParts') : null, [firestore]);
    const { data: parts, loading: partsLoading, error: partsError } = useCollection<Part>(partsQuery);

    const prebuiltSystemsQuery = useMemo(() => firestore ? collection(firestore, 'prebuiltSystems') : null, [firestore]);
    const { data: prebuiltSystems, loading: prebuiltsLoading, error: prebuiltsError } = useCollection<PrebuiltSystem>(prebuiltSystemsQuery);

    const [categories, setCategories] = useState(componentCategories);

    useEffect(() => {
        if (!firestore || partsLoading || prebuiltsLoading || hasCheckedAndSeeded || isSeeding) {
            return;
        }

        // Only seed if there are no errors and the collections are confirmed to be empty
        if (!partsError && !prebuiltsError && parts?.length === 0 && prebuiltSystems?.length === 0) {
            startSeedingTransition(async () => {
                try {
                    await seedDatabase(firestore);
                    toast({
                        title: "Database Seeded!",
                        description: "Your database was empty, so initial parts and prebuilt systems have been added.",
                    });
                } catch (e) {
                    console.error("Seeding failed:", e);
                    toast({
                        variant: "destructive",
                        title: "Seeding Failed",
                        description: "Could not add initial data to the database. Please check your Firestore permissions.",
                    });
                }
            });
        }
        setHasCheckedAndSeeded(true);

    }, [firestore, parts, prebuiltSystems, partsLoading, prebuiltsLoading, hasCheckedAndSeeded, isSeeding, toast, partsError, prebuiltsError]);


    const handleCategoryChange = (categoryName: string, selected: boolean) => {
        setCategories(prev =>
            prev.map(cat => (cat.name === categoryName ? { ...cat, selected } : cat))
        );
    };

    const handleAddPart = async (newPartData: AddPartFormSchema) => {
        if (!firestore) return;
        await addPart(firestore, newPartData);
    };

    const handleDeletePart = async (partId: string) => {
        if (!firestore) return;
        await deletePart(firestore, partId);
    };

    const handleAddPrebuilt = async (newPrebuiltData: AddPrebuiltFormSchema) => {
        if (!firestore) return;
        await addPrebuiltSystem(firestore, newPrebuiltData);
    };

    const handleDeletePrebuilt = async (systemId: string) => {
        if (!firestore) return;
        await deletePrebuiltSystem(firestore, systemId);
    };
    
    const selectedCategories = categories.filter(c => c.selected).map(c => c.name);
    const filteredParts = parts?.filter(part => selectedCategories.includes(part.category)) ?? [];

    const stockIsLoading = partsLoading || isSeeding;
    const prebuiltsAreLoading = prebuiltsLoading || isSeeding;

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
                            {stockIsLoading ? <TableSkeleton columns={6} /> : (
                                (parts?.length ?? 0) > 0 ? (
                                    filteredParts.length > 0 ? (
                                        <InventoryTable parts={filteredParts} onDelete={handleDeletePart} />
                                    ) : (
                                        <CardContent className="min-h-[300px] flex items-center justify-center text-center text-muted-foreground p-6">
                                            <p>No items match the selected categories.</p>
                                        </CardContent>
                                    )
                                ) : (
                                    <CardContent className="min-h-[300px] flex items-center justify-center text-center text-muted-foreground p-6">
                                        <div className='text-center'>
                                            <ServerCrash className="mx-auto h-12 w-12 text-muted-foreground" />
                                            <h3 className="mt-4 text-lg font-medium">No items in inventory.</h3>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Your inventory is currently empty.
                                            </p>
                                        </div>
                                    </CardContent>
                                )
                            )}
                        </Card>
                    </div>
                </TabsContent>
                <TabsContent value="prebuilts">
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-headline font-bold">PREBUILTS OVERVIEW</h2>
                            <AddPrebuiltDialog onAddPrebuilt={handleAddPrebuilt} parts={parts ?? []}>
                                <Button>
                                    <Plus className="mr-2" />
                                    Add New Prebuilt
                                </Button>
                            </AddPrebuiltDialog>
                        </div>
                        <Card className="mt-6">
                            {prebuiltsAreLoading ? <TableSkeleton columns={4} /> : (
                                (prebuiltSystems?.length ?? 0) > 0 ? (
                                    <PrebuiltsTable systems={prebuiltSystems!} onDelete={handleDeletePrebuilt} />
                                ) : (
                                     <CardContent className="min-h-[300px] flex items-center justify-center text-center text-muted-foreground p-6">
                                        <div className='text-center'>
                                            <ServerCrash className="mx-auto h-12 w-12 text-muted-foreground" />
                                            <h3 className="mt-4 text-lg font-medium">No pre-built systems configured.</h3>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Your pre-built systems inventory is currently empty.
                                            </p>
                                        </div>
                                    </CardContent>
                                )
                            )}
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
