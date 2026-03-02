
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Package, PackageCheck, ServerCrash, Loader2, BarChart3, History, TrendingUp, DollarSign, Cpu, Monitor, CircuitBoard, MemoryStick, HardDrive, PlugZap, Square, Wind, Mouse, Headset } from "lucide-react";
import { Order } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import { AdminPrebuiltCard } from '@/components/admin-prebuilt-card';
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
    { name: "Monitor", selected: true },
    { name: "Keyboard", selected: true },
    { name: "Mouse", selected: true },
    { name: "Headset", selected: true },
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
    const [partSortBy, setPartSortBy] = useState('Date Added');
    const [partSortDirection, setPartSortDirection] = useState<'asc' | 'desc'>('desc');
    const [partView, setPartView] = useState<'grid' | 'list'>('grid');
    const [partCurrentPage, setPartCurrentPage] = useState(1);
    const [partItemsPerPage, setPartItemsPerPage] = useState(10);
    const [partSearchQuery, setPartSearchQuery] = useState('');

    // Prebuilts state
    const [prebuiltCategories, setPrebuiltCategories] = useState(prebuiltTiers);
    const [prebuiltSortBy, setPrebuiltSortBy] = useState('Date Added');
    const [prebuiltSortDirection, setPrebuiltSortDirection] = useState<'asc' | 'desc'>('desc');
    const [prebuiltView, setPrebuiltView] = useState<'grid' | 'list'>('grid');
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

    const monitorQuery = useMemo(() => firestore ? collection(firestore, 'Monitor') : null, [firestore]);
    const { data: monitors, loading: monitorsLoading } = useCollection<PartWithoutCategory>(monitorQuery);
    const keyboardQuery = useMemo(() => firestore ? collection(firestore, 'Keyboard') : null, [firestore]);
    const { data: keyboards, loading: keyboardsLoading } = useCollection<PartWithoutCategory>(keyboardQuery);
    const mouseQuery = useMemo(() => firestore ? collection(firestore, 'Mouse') : null, [firestore]);
    const { data: mice, loading: miceLoading } = useCollection<PartWithoutCategory>(mouseQuery);
    const headsetQuery = useMemo(() => firestore ? collection(firestore, 'Headset') : null, [firestore]);
    const { data: headsets, loading: headsetsLoading } = useCollection<PartWithoutCategory>(headsetQuery);

    const prebuiltSystemsQuery = useMemo(() => firestore ? collection(firestore, 'prebuiltSystems') : null, [firestore]);
    const { data: prebuiltSystems, loading: prebuiltsLoading } = useCollection<PrebuiltSystem>(prebuiltSystemsQuery);

    const ordersQuery = useMemo(() => firestore ? collection(firestore, 'orders') : null, [firestore]);
    const { data: orders, loading: ordersLoading } = useCollection<Order>(ordersQuery);

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
        monitors?.forEach(p => allParts.push({ ...p, category: 'Monitor' }));
        keyboards?.forEach(p => allParts.push({ ...p, category: 'Keyboard' }));
        mice?.forEach(p => allParts.push({ ...p, category: 'Mouse' }));
        headsets?.forEach(p => allParts.push({ ...p, category: 'Headset' }));
        return allParts;
    }, [cpus, gpus, motherboards, rams, storages, psus, cases, coolers, monitors, keyboards, mice, headsets]);

    const partsLoading = cpusLoading || gpusLoading || motherboardsLoading || ramsLoading || storagesLoading || psusLoading || casesLoading || coolersLoading || monitorsLoading || keyboardsLoading || miceLoading || headsetsLoading;

    const handlePartCategoryChange = (categoryName: string, selected: boolean) => {
        setPartCurrentPage(1);
        setPartCategories(prev => {
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

    const handlePrebuiltCategoryChange = (tierName: string, selected: boolean) => {
        setPrebuiltCurrentPage(1);
        setPrebuiltCategories(prev => {
            if (tierName === 'All') {
                const anyUnselected = prev.some(t => !t.selected);
                return prev.map(t => ({ ...t, selected: anyUnselected }));
            }
            return prev.map(tier => ({
                ...tier,
                selected: tier.name === tierName ? true : false
            }));
        });
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
        return (parts?.filter(part => {
            const matchesCategory = selectedCategories.includes(part.category);
            const matchesSearch = part.name.toLowerCase().includes(partSearchQuery.toLowerCase()) ||
                part.brand.toLowerCase().includes(partSearchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        }) ?? [])
            .sort((a, b) => {
                let compare = 0;
                if (partSortBy === 'Name') compare = a.name.localeCompare(b.name);
                else if (partSortBy === 'Price') compare = a.price - b.price;
                else if (partSortBy === 'Brand') compare = a.brand.localeCompare(b.brand);
                else if (partSortBy === 'Stock') compare = a.stock - b.stock;
                else if (partSortBy === 'Date Added') {
                    const aDate = (a as any).createdAt?.toDate?.() || a.createdAt || 0;
                    const bDate = (b as any).createdAt?.toDate?.() || b.createdAt || 0;
                    compare = new Date(aDate).getTime() - new Date(bDate).getTime();
                }
                return partSortDirection === 'asc' ? compare : -compare;
            });
    }, [parts, partCategories, partSortBy, partSortDirection, partSearchQuery]);

    const filteredAndSortedPrebuilts = useMemo(() => {
        const selectedCategories = prebuiltCategories.filter(c => c.selected).map(c => c.name);
        return (prebuiltSystems?.filter(system => selectedCategories.includes(system.tier)) ?? [])
            .sort((a, b) => {
                let compare = 0;
                if (prebuiltSortBy === 'Name') compare = a.name.localeCompare(b.name);
                else if (prebuiltSortBy === 'Price') compare = a.price - b.price;
                else if (prebuiltSortBy === 'Tier') compare = a.tier.localeCompare(b.tier);
                else if (prebuiltSortBy === 'Date Added') {
                    const aDate = (a as any).createdAt?.toDate?.() || a.createdAt || 0;
                    const bDate = (b as any).createdAt?.toDate?.() || b.createdAt || 0;
                    compare = new Date(aDate).getTime() - new Date(bDate).getTime();
                }
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

    const stats = useMemo(() => {
        const totalSales = orders?.reduce((acc, order) => acc + order.totalPrice, 0) || 0;
        const totalOrders = orders?.length || 0;

        // Calculate popular items from parts (assuming popularity field is updated on checkout)
        const popularItems = [...parts].sort((a, b) => ((b as any).popularity || 0) - ((a as any).popularity || 0)).slice(0, 5);

        return { totalSales, totalOrders, popularItems };
    }, [orders, parts]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(amount);
    };

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
                            <PackageCheck className="mr-2 h-4 w-4" />
                            Manage Prebuilts
                        </TabsTrigger>
                        <TabsTrigger value="analytics">
                            <BarChart3 className="mr-2 h-4 w-4" />
                            Sales & Analytics
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
                            supportedSorts={['Date Added', 'Name', 'Price', 'Brand', 'Stock']}
                            showViewToggle={true}
                            view={partView}
                            onViewChange={(v) => v && setPartView(v as 'grid' | 'list')}
                            searchQuery={partSearchQuery}
                            onSearchQueryChange={setPartSearchQuery}
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
                            supportedSorts={['Date Added', 'Name', 'Price', 'Tier']}
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
                                                    <AdminPrebuiltCard key={system.id} system={system} onDelete={handleDeletePrebuilt} />
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
                <TabsContent value="analytics">
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
                                            <h3 className="text-2xl font-bold">{formatCurrency(stats.totalSales)}</h3>
                                        </div>
                                        <div className="p-3 bg-emerald-500/10 rounded-full">
                                            <DollarSign className="w-6 h-6 text-emerald-500" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                                            <h3 className="text-2xl font-bold">{stats.totalOrders}</h3>
                                        </div>
                                        <div className="p-3 bg-blue-500/10 rounded-full">
                                            <History className="w-6 h-6 text-blue-500" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Top Item Popularity</p>
                                            <h3 className="text-2xl font-bold">{(stats.popularItems[0] as any)?.popularity || 0}</h3>
                                        </div>
                                        <div className="p-3 bg-orange-500/10 rounded-full">
                                            <TrendingUp className="w-6 h-6 text-orange-500" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-xl font-headline font-bold mb-4 flex items-center gap-2">
                                    <History className="h-5 w-5" /> Recent Orders
                                </h3>
                                <Card>
                                    <CardContent className="p-0">
                                        {ordersLoading ? <TableSkeleton columns={3} /> : (
                                            orders && orders.length > 0 ? (
                                                <div className="divide-y">
                                                    {[...orders].sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds).slice(0, 10).map(order => (
                                                        <div key={order.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                            <div>
                                                                <p className="font-medium text-sm">{order.userEmail}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {order.items.length} items • {order.createdAt?.toDate().toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="font-bold text-emerald-500">{formatCurrency(order.totalPrice)}</p>
                                                                <Badge variant="outline" className="text-[10px] h-4">Processed</Badge>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-8 text-center text-muted-foreground">No orders yet.</div>
                                            )
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            <div>
                                <h3 className="text-xl font-headline font-bold mb-4 flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" /> Popular Items
                                </h3>
                                <Card>
                                    <CardContent className="p-0">
                                        <div className="divide-y">
                                            {stats.popularItems.map((item, index) => (
                                                <div key={item.id} className="p-4 flex items-center gap-4">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0">
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm truncate">{item.name}</p>
                                                        <p className="text-xs text-muted-foreground">{item.category}</p>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <p className="font-bold">{(item as any).popularity || 0}</p>
                                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Purchases</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {stats.popularItems.length === 0 && (
                                                <div className="p-8 text-center text-muted-foreground">No purchase data yet.</div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
