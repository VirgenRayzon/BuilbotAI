
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Package, PackageCheck, ServerCrash, Loader2 } from "lucide-react";
import { InventoryToolbar } from '@/components/inventory-toolbar';
import { Card, CardContent } from '@/components/ui/card';
import { AddPartDialog, type AddPartFormSchema } from '@/components/add-part-dialog';
import { AddPrebuiltDialog, type AddPrebuiltFormSchema } from '@/components/add-prebuilt-dialog';
import type { Part, PrebuiltSystem } from '@/lib/types';
import { InventoryTable } from '@/components/inventory-table';
import { PrebuiltsTable } from '@/components/prebuilts-table';
import { useCollection } from '@/firebase/firestore/use-collection';
import { addPart, deletePart, addPrebuiltSystem, deletePrebuiltSystem } from '@/firebase/database';
import { collection } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { TableSkeleton } from '@/components/table-skeleton';
import { useUserProfile } from '@/context/user-profile';

const componentCategories: { name: Part['category'], selected: boolean }[] = [
  { name: "CPU", selected: true },
  { name: "GPU", selected: true },
  { name: "Motherboard", selected: true },
  { name: "RAM", selected: true },
  { name: "Storage", selected: true },
  { name: "PSU", selected: true },
  { name: "Case", selected: true },
  { name: "Cooler", selected: true },
];

const prebuiltTiers = [
    { name: "Entry", selected: true },
    { name: "Mid-Range", selected: true },
    { name: "High-End", selected: true },
    { name: "Workstation", selected: true },
];

type PartWithoutCategory = Omit<Part, 'category'>;

export default function AdminPage() {
    const firestore = useFirestore();
    const router = useRouter();
    const { authUser, profile, loading: userLoading } = useUserProfile();

    // Route protection
    useEffect(() => {
        if (!userLoading && (!authUser || !profile?.isAdmin)) {
            router.replace('/signin');
        }
    }, [authUser, profile, userLoading, router]);

    // Parts state
    const [partCategories, setPartCategories] = useState(componentCategories);
    const [partSortBy, setPartSortBy] = useState('Name');
    const [partSortDirection, setPartSortDirection] = useState<'asc' | 'desc'>('asc');

    // Prebuilts state
    const [prebuiltCategories, setPrebuiltCategories] = useState(prebuiltTiers);
    const [prebuiltSortBy, setPrebuiltSortBy] = useState('Name');
    const [prebuiltSortDirection, setPrebuiltSortDirection] = useState<'asc' | 'desc'>('asc');

    // Fetch each category collection
    const cpuQuery = useMemo(() => firestore ? collection(firestore, 'CPU') : null, [firestore]);
    const { data: cpus, loading: cpusLoading } = useCollection<PartWithoutCategory>(cpuQuery);
    const gpuQuery = useMemo(() => firestore ? collection(firestore, 'GPU') : null, [firestore]);
    const { data: gpus, loading: gpusLoading } = useCollection<PartWithoutCategory>(gpuQuery);
    const motherboardQuery = useMemo(() => firestore ? collection(firestore, 'Motherboard') : null, [firestore]);
    const { data: motherboards, loading: motherboardsLoading } = useCollection<PartWithoutCategory>(motherboardQuery);
    const ramQuery = useMemo(() => firestore ? collection(firestore, 'RAM') : null, [firestore]);
    const { data: rams, loading: ramsLoading } = useCollection<PartWithoutCategory>(ramQuery);
    const storageQuery = useMemo(() => firestore ? collection(firestore, 'Storage') : null, [firestore]);
    const { data: storages, loading: storagesLoading } = useCollection<PartWithoutCategory>(storageQuery);
    const psuQuery = useMemo(() => firestore ? collection(firestore, 'PSU') : null, [firestore]);
    const { data: psus, loading: psusLoading } = useCollection<PartWithoutCategory>(psuQuery);
    const caseQuery = useMemo(() => firestore ? collection(firestore, 'Case') : null, [firestore]);
    const { data: cases, loading: casesLoading } = useCollection<PartWithoutCategory>(caseQuery);
    const coolerQuery = useMemo(() => firestore ? collection(firestore, 'Cooler') : null, [firestore]);
    const { data: coolers, loading: coolersLoading } = useCollection<PartWithoutCategory>(coolerQuery);

    const prebuiltSystemsQuery = useMemo(() => firestore ? collection(firestore, 'prebuiltSystems') : null, [firestore]);
    const { data: prebuiltSystems, loading: prebuiltsLoading } = useCollection<PrebuiltSystem>(prebuiltSystemsQuery);

    const parts = useMemo(() => {
        const allParts: Part[] = [];
        cpus?.forEach(p => allParts.push({ ...p, category: 'CPU' }));
        gpus?.forEach(p => allParts.push({ ...p, category: 'GPU' }));
        motherboards?.forEach(p => allParts.push({ ...p, category: 'Motherboard' }));
        rams?.forEach(p => allParts.push({ ...p, category: 'RAM' }));
        storages?.forEach(p => allParts.push({ ...p, category: 'Storage' }));
        psus?.forEach(p => allParts.push({ ...p, category: 'PSU' }));
        cases?.forEach(p => allParts.push({ ...p, category: 'Case' }));
        coolers?.forEach(p => allParts.push({ ...p, category: 'Cooler' }));
        return allParts;
    }, [cpus, gpus, motherboards, rams, storages, psus, cases, coolers]);
    
    const partsLoading = cpusLoading || gpusLoading || motherboardsLoading || ramsLoading || storagesLoading || psusLoading || casesLoading || coolersLoading;

    const handlePartCategoryChange = (categoryName: string, selected: boolean) => {
        setPartCategories(prev => prev.map(cat => (cat.name === categoryName ? { ...cat, selected } : cat)));
    };
    
    const handlePrebuiltCategoryChange = (categoryName: string, selected: boolean) => {
        setPrebuiltCategories(prev => prev.map(cat => (cat.name === categoryName ? { ...cat, selected } : cat)));
    };

    const handleAddPart = async (newPartData: AddPartFormSchema) => {
        if (!firestore) return;
        await addPart(firestore, newPartData);
    };

    const handleDeletePart = async (partId: string, category: Part['category']) => {
        if (!firestore) return;
        await deletePart(firestore, partId, category);
    };

    const handleAddPrebuilt = async (newPrebuiltData: AddPrebuiltFormSchema) => {
        if (!firestore) return;
        await addPrebuiltSystem(firestore, newPrebuiltData);
    };

    const handleDeletePrebuilt = async (systemId: string) => {
        if (!firestore) return;
        await deletePrebuiltSystem(firestore, systemId);
    };
    
    const filteredAndSortedParts = useMemo(() => {
        const selectedCategories = partCategories.filter(c => c.selected).map(c => c.name);
        return (parts?.filter(part => selectedCategories.includes(part.category)) ?? [])
            .sort((a, b) => {
                let compare = 0;
                if (partSortBy === 'Name') compare = a.name.localeCompare(b.name);
                else if (partSortBy === 'Price') compare = a.price - b.price;
                else if (partSortBy === 'Brand') compare = a.brand.localeCompare(b.brand);
                else if (partSortBy === 'Stock') compare = a.stock - b.stock;
                return partSortDirection === 'asc' ? compare : -compare;
            });
    }, [parts, partCategories, partSortBy, partSortDirection]);

    const filteredAndSortedPrebuilts = useMemo(() => {
        const selectedCategories = prebuiltCategories.filter(c => c.selected).map(c => c.name);
        return (prebuiltSystems?.filter(system => selectedCategories.includes(system.tier)) ?? [])
            .sort((a, b) => {
                let compare = 0;
                if (prebuiltSortBy === 'Name') compare = a.name.localeCompare(b.name);
                else if (prebuiltSortBy === 'Price') compare = a.price - b.price;
                else if (prebuiltSortBy === 'Tier') compare = a.tier.localeCompare(b.tier);
                return prebuiltSortDirection === 'asc' ? compare : -compare;
            });
    }, [prebuiltSystems, prebuiltCategories, prebuiltSortBy, prebuiltSortDirection]);

    if (userLoading || !authUser || !profile?.isAdmin) {
        return (
            <div className="flex items-center justify-center min-h-[80vh]">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        );
    }

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
                            categories={partCategories}
                            onCategoryChange={handlePartCategoryChange}
                            itemCount={filteredAndSortedParts.length}
                            sortBy={partSortBy}
                            onSortByChange={setPartSortBy}
                            sortDirection={partSortDirection}
                            onSortDirectionChange={setPartSortDirection}
                            supportedSorts={['Name', 'Price', 'Brand', 'Stock']}
                        />
                        <Card className="mt-6">
                            {partsLoading ? <TableSkeleton columns={6} /> : (
                                (parts?.length ?? 0) > 0 ? (
                                    filteredAndSortedParts.length > 0 ? (
                                        <InventoryTable parts={filteredAndSortedParts} onDelete={handleDeletePart} />
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
                        <InventoryToolbar 
                            categories={prebuiltCategories}
                            onCategoryChange={handlePrebuiltCategoryChange}
                            itemCount={filteredAndSortedPrebuilts.length}
                            sortBy={prebuiltSortBy}
                            onSortByChange={setPrebuiltSortBy}
                            sortDirection={prebuiltSortDirection}
                            onSortDirectionChange={setPrebuiltSortDirection}
                            supportedSorts={['Name', 'Price', 'Tier']}
                        />
                        <Card className="mt-6">
                            {prebuiltsLoading ? <TableSkeleton columns={4} /> : (
                                (prebuiltSystems?.length ?? 0) > 0 ? (
                                     filteredAndSortedPrebuilts.length > 0 ? (
                                        <PrebuiltsTable systems={filteredAndSortedPrebuilts} onDelete={handleDeletePrebuilt} />
                                    ) : (
                                        <CardContent className="min-h-[300px] flex items-center justify-center text-center text-muted-foreground p-6">
                                            <p>No systems match the selected categories.</p>
                                        </CardContent>
                                    )
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
