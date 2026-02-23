
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
import { addPart, deletePart, addPrebuiltSystem, deletePrebuiltSystem, updatePart } from '@/firebase/database';
import { collection } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { TableSkeleton } from '@/components/table-skeleton';
import { useUserProfile } from '@/context/user-profile';
import { AdminPartCard } from '@/components/admin-part-card';
import { PrebuiltSystemCard } from '@/components/prebuilt-system-card';
import { PaginationControls } from "@/components/pagination-controls";

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
    const [partView, setPartView] = useState<'grid' | 'list'>('list');
    const [partCurrentPage, setPartCurrentPage] = useState(1);
    const [partItemsPerPage, setPartItemsPerPage] = useState(10);

    // Prebuilts state
    const [prebuiltCategories, setPrebuiltCategories] = useState(prebuiltTiers);
    const [prebuiltSortBy, setPrebuiltSortBy] = useState('Name');
    const [prebuiltSortDirection, setPrebuiltSortDirection] = useState<'asc' | 'desc'>('asc');
    const [prebuiltView, setPrebuiltView] = useState<'grid' | 'list'>('list');
    const [prebuiltCurrentPage, setPrebuiltCurrentPage] = useState(1);
    const [prebuiltItemsPerPage, setPrebuiltItemsPerPage] = useState(10);

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
        setPartCurrentPage(1);
        setPartCategories(prev =>
            prev.map(cat => (cat.name === categoryName ? { ...cat, selected } : cat))
        );
    };

    const handlePrebuiltCategoryChange = (tierName: string, selected: boolean) => {
        setPrebuiltCurrentPage(1);
        setPrebuiltCategories(prev =>
            prev.map(tier => (tier.name === tierName ? { ...tier, selected } : tier))
        );
    };

    const handleAddPart = async (newPartData: AddPartFormSchema) => {
        if (!firestore) return;

        if (parts.some(part => part.name.toLowerCase() === newPartData.partName.toLowerCase())) {
            throw new Error(`A part named "${newPartData.partName}" already exists.`);
        }

        await addPart(firestore, newPartData);
    };

    const handleUpdatePartStock = async (partId: string, category: Part['category'], newStock: number) => {
        if (!firestore) return;
        await updatePart(firestore, category, partId, { stock: newStock });
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

    const partTotalPages = Math.ceil(filteredAndSortedParts.length / partItemsPerPage);
    const paginatedParts = useMemo(() => {
        const startIndex = (partCurrentPage - 1) * partItemsPerPage;
        return filteredAndSortedParts.slice(startIndex, startIndex + partItemsPerPage);
    }, [filteredAndSortedParts, partCurrentPage, partItemsPerPage]);

    const prebuiltTotalPages = Math.ceil(filteredAndSortedPrebuilts.length / prebuiltItemsPerPage);
    const paginatedPrebuilts = useMemo(() => {
        const startIndex = (prebuiltCurrentPage - 1) * prebuiltItemsPerPage;
        return filteredAndSortedPrebuilts.slice(startIndex, startIndex + prebuiltItemsPerPage);
    }, [filteredAndSortedPrebuilts, prebuiltCurrentPage, prebuiltItemsPerPage]);

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
                            onSortByChange={(val) => { setPartSortBy(val); setPartCurrentPage(1); }}
                            sortDirection={partSortDirection}
                            onSortDirectionChange={(val) => { setPartSortDirection(val); setPartCurrentPage(1); }}
                            supportedSorts={['Name', 'Price', 'Brand', 'Stock']}
                            showViewToggle={true}
                            view={partView}
                            onViewChange={(v) => v && setPartView(v as 'grid' | 'list')}
                        />
                        {partsLoading ? <TableSkeleton columns={6} /> : (
                            (parts?.length ?? 0) > 0 ? (
                                filteredAndSortedParts.length > 0 ? (
                                    partView === 'list' ? (
                                        <>
                                            <Card className="mt-6">
                                                <InventoryTable parts={paginatedParts} onDelete={handleDeletePart} onUpdateStock={handleUpdatePartStock} />
                                            </Card>
                                            <PaginationControls
                                                currentPage={partCurrentPage}
                                                totalPages={partTotalPages}
                                                itemsPerPage={partItemsPerPage}
                                                onPageChange={setPartCurrentPage}
                                                onItemsPerPageChange={setPartItemsPerPage}
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
                                                {paginatedParts.map(part => (
                                                    <AdminPartCard key={part.id} part={part} onDelete={handleDeletePart} onUpdateStock={handleUpdatePartStock} />
                                                ))}
                                            </div>
                                            <PaginationControls
                                                currentPage={partCurrentPage}
                                                totalPages={partTotalPages}
                                                itemsPerPage={partItemsPerPage}
                                                onPageChange={setPartCurrentPage}
                                                onItemsPerPageChange={setPartItemsPerPage}
                                            />
                                        </>
                                    )
                                ) : (
                                    <Card className="mt-6">
                                        <CardContent className="min-h-[300px] flex items-center justify-center text-center text-muted-foreground p-6">
                                            <p>No items match the selected categories.</p>
                                        </CardContent>
                                    </Card>
                                )
                            ) : (
                                <Card className="mt-6">
                                    <CardContent className="min-h-[300px] flex items-center justify-center text-center text-muted-foreground p-6">
                                        <div className='text-center'>
                                            <ServerCrash className="mx-auto h-12 w-12 text-muted-foreground" />
                                            <h3 className="mt-4 text-lg font-medium">No items in inventory.</h3>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Your inventory is currently empty.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        )}
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
                            onSortByChange={(val) => { setPrebuiltSortBy(val); setPrebuiltCurrentPage(1); }}
                            sortDirection={prebuiltSortDirection}
                            onSortDirectionChange={(val) => { setPrebuiltSortDirection(val); setPrebuiltCurrentPage(1); }}
                            supportedSorts={['Name', 'Price', 'Tier']}
                            showViewToggle={true}
                            view={prebuiltView}
                            onViewChange={(v) => v && setPrebuiltView(v as 'grid' | 'list')}
                        />

                        {prebuiltsLoading ? <TableSkeleton columns={4} /> : (
                            (prebuiltSystems?.length ?? 0) > 0 ? (
                                filteredAndSortedPrebuilts.length > 0 ? (
                                    prebuiltView === 'list' ? (
                                        <>
                                            <Card className="mt-6">
                                                <PrebuiltsTable systems={paginatedPrebuilts} onDelete={handleDeletePrebuilt} />
                                            </Card>
                                            <PaginationControls
                                                currentPage={prebuiltCurrentPage}
                                                totalPages={prebuiltTotalPages}
                                                itemsPerPage={prebuiltItemsPerPage}
                                                onPageChange={setPrebuiltCurrentPage}
                                                onItemsPerPageChange={setPrebuiltItemsPerPage}
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                                                {paginatedPrebuilts.map(system => (
                                                    <PrebuiltSystemCard key={system.id} system={system} />
                                                ))}
                                            </div>
                                            <PaginationControls
                                                currentPage={prebuiltCurrentPage}
                                                totalPages={prebuiltTotalPages}
                                                itemsPerPage={prebuiltItemsPerPage}
                                                onPageChange={setPrebuiltCurrentPage}
                                                onItemsPerPageChange={setPrebuiltItemsPerPage}
                                            />
                                        </>
                                    )
                                ) : (
                                    <Card className="mt-6">
                                        <CardContent className="min-h-[300px] flex items-center justify-center text-center text-muted-foreground p-6">
                                            <p>No systems match the selected categories.</p>
                                        </CardContent>
                                    </Card>
                                )
                            ) : (
                                <Card className="mt-6">
                                    <CardContent className="min-h-[300px] flex items-center justify-center text-center text-muted-foreground p-6">
                                        <div className='text-center'>
                                            <ServerCrash className="mx-auto h-12 w-12 text-muted-foreground" />
                                            <h3 className="mt-4 text-lg font-medium">No pre-built systems configured.</h3>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Your pre-built systems inventory is currently empty.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
