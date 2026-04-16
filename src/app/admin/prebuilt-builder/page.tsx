"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { YourBuild } from "@/components/your-build";
import {
    Cpu,
    Server,
    CircuitBoard,
    MemoryStick,
    Database,
    Power,
    RectangleVertical,
    Wind,
    Plus,
    X,
    Monitor,
    Keyboard,
    Mouse,
    Headphones,
    Loader2
} from "lucide-react";
import type { ComponentData, Part, Resolution, WorkloadType } from "@/lib/types";
import { InventoryToolbar } from "@/components/inventory-toolbar";
import { PartCard } from "@/components/part-card";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useFirestore } from "@/firebase";
import { collection } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { formatCurrency, cn, getOptimizedStorageUrl } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { PaginationControls } from "@/components/pagination-controls";
import { PCVisualizer } from "@/components/pc-visualizer";
import { useUserProfile } from "@/context/user-profile";
import { BuilderSidebarLeft } from "@/components/builder-sidebar-left";
import { BuilderFloatingChat } from "@/components/builder-floating-chat";
import { addPrebuiltSystem } from "@/firebase/database";
import type { PrebuiltBuilderAddFormSchema } from "@/components/prebuilt-builder-add-dialog";
import { checkCompatibility } from "@/lib/compatibility";

type PartWithoutCategory = Omit<Part, 'category'>;

const componentCategories = [
    { name: "Case", icon: RectangleVertical },
    { name: "Motherboard", icon: CircuitBoard },
    { name: "CPU", icon: Cpu },
    { name: "GPU", icon: Server },
    { name: "RAM", icon: MemoryStick },
    { name: "Storage", icon: Database },
    { name: "PSU", icon: Power },
    { name: "Cooler", icon: Wind },
    { name: "Monitor", icon: Monitor },
    { name: "Keyboard", icon: Keyboard },
    { name: "Mouse", icon: Mouse },
    { name: "Headset", icon: Headphones },
];

export default function PrebuiltBuilderPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { authUser, profile, loading: authLoading } = useUserProfile();
    const router = useRouter();

    // Redirect non-admins
    useEffect(() => {
        if (!authLoading) {
            if (!authUser) {
                router.push('/signin');
            } else if (!profile?.isManager) {
                router.push('/builder');
            }
        }
    }, [authUser, profile, authLoading, router]);

    // Fetch collections
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

    const allParts = useMemo(() => {
        const parts: Part[] = [];
        cpus?.forEach(p => parts.push({ ...p, category: 'CPU' }));
        gpus?.forEach(p => parts.push({ ...p, category: 'GPU' }));
        motherboards?.forEach(p => parts.push({ ...p, category: 'Motherboard' }));
        rams?.forEach(p => parts.push({ ...p, category: 'RAM' }));
        storages?.forEach(p => parts.push({ ...p, category: 'Storage' }));
        psus?.forEach(p => parts.push({ ...p, category: 'PSU' }));
        cases?.forEach(p => parts.push({ ...p, category: 'Case' }));
        coolers?.forEach(p => parts.push({ ...p, category: 'Cooler' }));
        monitors?.forEach(p => parts.push({ ...p, category: 'Monitor' }));
        keyboards?.forEach(p => parts.push({ ...p, category: 'Keyboard' }));
        mice?.forEach(p => parts.push({ ...p, category: 'Mouse' }));
        headsets?.forEach(p => parts.push({ ...p, category: 'Headset' }));
        return parts;
    }, [cpus, gpus, motherboards, rams, storages, psus, cases, coolers, monitors, keyboards, mice, headsets]);

    const [build, setBuild] = useState<Record<string, ComponentData | ComponentData[] | null>>({
        CPU: null, GPU: null, Motherboard: null, RAM: [], Storage: [], PSU: null, Case: null, Cooler: null,
        Monitor: null, Keyboard: null, Mouse: null, Headset: null,
    });
    const [resolution, setResolution] = useState<Resolution>('1440p');
    const [workload, setWorkload] = useState<WorkloadType>('Balanced');
    const [isLoaded, setIsLoaded] = useState(false);

    // Persistence
    useEffect(() => {
        const saved = localStorage.getItem('admin_pc_builder_state');
        if (saved) {
            try {
                const parsedState = JSON.parse(saved);
                setBuild(prev => ({ ...prev, ...parsedState }));
            } catch (e) {
                console.error("Failed to parse saved builder state", e);
            }
        }
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('admin_pc_builder_state', JSON.stringify(build));
        }
    }, [build, isLoaded]);

    const handleClearBuild = () => {
        setBuild({
            CPU: null, GPU: null, Motherboard: null, RAM: [], Storage: [], PSU: null, Case: null, Cooler: null,
            Monitor: null, Keyboard: null, Mouse: null, Headset: null,
        });
        toast({ title: 'Build Cleared', description: 'Builder has been reset.' });
    };

    const handleRemovePart = (category: string, index?: number) => {
        setBuild(prev => {
            const next = { ...prev };
            if ((category === 'Storage' || category === 'RAM') && typeof index === 'number') {
                const currentItems = [...(next[category] as ComponentData[])];
                currentItems.splice(index, 1);
                next[category] = currentItems;
            } else {
                next[category] = null;

                // CASCADING REMOVAL LOGIC
                if (category === 'Case') {
                    // Remove Motherboard and everything else
                    Object.keys(next).forEach(key => {
                        if (key === 'RAM' || key === 'Storage') next[key] = [];
                        else next[key] = null;
                    });
                    toast({ title: 'Build Reset', description: 'Removing the case removes all other components.' });
                } else if (category === 'Motherboard') {
                    // Remove everything except Case
                    Object.keys(next).forEach(key => {
                        if (key !== 'Case') {
                            if (key === 'RAM' || key === 'Storage') next[key] = [];
                            else next[key] = null;
                        }
                    });
                    toast({ title: 'Components Removed', description: 'Changing or removing the motherboard removes all dependent parts.' });
                }
            }
            return next;
        });
    };

    const [categories, setCategories] = useState(
        componentCategories.map(c => ({ name: c.name, selected: true }))
    );


    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('Date Added');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12);

    const getCountInBuild = (partName: string) => {
        let count = 0;
        Object.entries(build).forEach(([category, data]) => {
            if (Array.isArray(data)) {
                count += data.filter(d => d.model === partName).length;
            } else if (data && data.model === partName) {
                count++;
            }
        });
        return count;
    };

    const handleCategoryChange = (categoryName: string, selected: boolean) => {
        setCurrentPage(1);
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

    const handlePartToggle = (part: Part) => {
        const category = part.category;

        // SELECTION ORDER ENFORCEMENT
        if (category !== 'Case' && !build['Case']) {
            toast({
                variant: 'destructive',
                title: 'Selection Order',
                description: 'Please select a Case first before adding other components.'
            });
            return;
        }

        if (category !== 'Case' && category !== 'Motherboard' && !build['Motherboard']) {
            toast({
                variant: 'destructive',
                title: 'Selection Order',
                description: 'Please select a Motherboard before adding other components.'
            });
            return;
        }

        if (category === 'Storage' || category === 'RAM') {
            const buildItems = Array.isArray(build[category]) ? (build[category] as ComponentData[]) : (build[category] ? [build[category] as ComponentData] : []);
            
            const { compatible, message } = checkCompatibility(part, build);
            if (!compatible) {
                toast({
                    variant: 'destructive',
                    title: 'Compatibility Error',
                    description: message || `This ${category} is not compatible with your current build.`
                });
                return;
            }

            const currentCount = getCountInBuild(part.name);
            if (currentCount >= part.stock) {
                toast({ variant: 'destructive', title: 'Out of Stock', description: `No more units of ${part.name} available.` });
                return;
            }

            const componentData: ComponentData = {
                id: part.id,
                model: part.name,
                price: part.price,
                description: Object.entries(part.specifications || {}).slice(0, 2).map(([key, value]) => `${key}: ${value}`).join(' | '),
                image: part.imageUrl,
                imageHint: part.name.toLowerCase().split(' ').slice(0, 2).join(' '),
                icon: componentCategories.find(c => c.name === category)!.icon,
                wattage: part.wattage,
                socket: part.socket || part.specifications?.['Socket']?.toString() || part.specifications?.['socket']?.toString(),
                ramType: part.ramType || part.specifications?.['Memory Type']?.toString() || part.specifications?.['RAM Type']?.toString() || part.specifications?.['Memory']?.toString(),
                performanceScore: part.performanceScore,
                performanceTier: part.performanceTier,
                specifications: part.specifications,
                dimensions: part.dimensions,
            };

            setBuild(prevBuild => {
                const currentItems = Array.isArray(prevBuild[category]) ? (prevBuild[category] as ComponentData[]) : (prevBuild[category] ? [prevBuild[category] as ComponentData] : []);
                return {
                    ...prevBuild,
                    [category]: [...currentItems, componentData]
                };
            });
            toast({ title: 'Part Added', description: `${part.name} has been added to your build.` });
            return;
        }

        const { compatible, message } = checkCompatibility(part, build);
        const isCurrentlySelected = (build[category] as ComponentData)?.model === part.name;

        if (isCurrentlySelected) {
            setBuild(prevBuild => {
                const nextBuild = { ...prevBuild, [category]: null };

                // CASCADING REMOVAL ON TOGGLE OFF
                if (category === 'Case') {
                    // Remove Motherboard and everything else
                    Object.keys(nextBuild).forEach(key => {
                        if (key === 'RAM' || key === 'Storage') nextBuild[key] = [];
                        else nextBuild[key] = null;
                    });
                    toast({ title: 'Build Reset', description: 'Removing the case removes all other components.' });
                } else if (category === 'Motherboard') {
                    // Remove everything except Case
                    Object.keys(nextBuild).forEach(key => {
                        if (key !== 'Case') {
                            if (key === 'RAM' || key === 'Storage') nextBuild[key] = [];
                            else nextBuild[key] = null;
                        }
                    });
                    toast({ title: 'Components Removed', description: 'Changing or removing the motherboard removes all dependent parts.' });
                }

                return nextBuild;
            });
            toast({ title: 'Part Removed', description: `${part.name} has been removed from your build.` });
        } else {
            if (!compatible) {
                toast({
                    variant: 'destructive',
                    title: 'Compatibility Error',
                    description: message || `This ${category} is not compatible with your current build.`
                });
                return;
            }

            const currentCount = getCountInBuild(part.name);
            if (currentCount >= part.stock) {
                toast({ variant: 'destructive', title: 'Out of Stock', description: `${part.name} is currently unavailable.` });
                return;
            }

            const componentData: ComponentData = {
                id: part.id,
                model: part.name,
                price: part.price,
                description: Object.entries(part.specifications || {}).slice(0, 2).map(([key, value]) => `${key}: ${value}`).join(' | '),
                image: part.imageUrl,
                imageHint: part.name.toLowerCase().split(' ').slice(0, 2).join(' '),
                icon: componentCategories.find(c => c.name === category)!.icon,
                wattage: part.wattage,
                socket: part.specifications?.['Socket']?.toString() || part.specifications?.['socket']?.toString(),
                ramType: part.specifications?.['Memory Type']?.toString() || part.specifications?.['RAM Type']?.toString() || part.specifications?.['Memory']?.toString(),
                performanceScore: part.performanceScore,
                performanceTier: part.performanceTier,
                specifications: part.specifications,
                dimensions: part.dimensions,
            };

            setBuild(prevBuild => {
                const nextBuild = { ...prevBuild, [category]: componentData };

                // CASCADING REMOVAL ON CHANGE
                if (category === 'Case' && prevBuild['Case'] && (prevBuild['Case'] as ComponentData).id !== componentData.id) {
                    // If changing case, remove everything else
                    Object.keys(nextBuild).forEach(key => {
                        if (key !== 'Case') {
                            if (key === 'RAM' || key === 'Storage') nextBuild[key] = [];
                            else nextBuild[key] = null;
                        }
                    });
                    toast({ title: 'Build Updated', description: 'Changing the case removed dependent components.' });
                } else if (category === 'Motherboard' && prevBuild['Motherboard'] && (prevBuild['Motherboard'] as ComponentData).id !== componentData.id) {
                    // If changing motherboard, remove everything except Case
                    Object.keys(nextBuild).forEach(key => {
                        if (key !== 'Case' && key !== 'Motherboard') {
                            if (key === 'RAM' || key === 'Storage') nextBuild[key] = [];
                            else nextBuild[key] = null;
                        }
                    });
                    toast({ title: 'Build Updated', description: 'Changing the motherboard removed dependent components.' });
                }

                return nextBuild;
            });
            toast({ title: 'Part Added', description: `${part.name} has been added to your build.` });
        }
    };


    const sortedAndFilteredParts = useMemo(() => {
        const selectedCategories = categories.filter(c => c.selected).map(c => c.name);
        const searchLower = searchQuery.toLowerCase();

        const parts = (allParts?.filter(part => {
            const matchesCategory = selectedCategories.includes(part.category);
            const matchesSearch = part.name.toLowerCase().includes(searchLower) ||
                (part.brand?.toLowerCase() || '').includes(searchLower) ||
                part.category.toLowerCase().includes(searchLower);
            return matchesCategory && matchesSearch;
        }) ?? [])
            .sort((a, b) => {
                let compare = 0;
                if (sortBy === 'Name') compare = (a.name || '').localeCompare(b.name || '');
                else if (sortBy === 'Price') compare = (a.price || 0) - (b.price || 0);
                else if (sortBy === 'Date Added') {
                    const dateA = a.createdAt?.toDate?.() || a.createdAt || 0;
                    const dateB = b.createdAt?.toDate?.() || b.createdAt || 0;
                    compare = new Date(dateA).getTime() - new Date(dateB).getTime();
                }
                return sortDirection === 'asc' ? compare : -compare;
            });

        return parts.map(part => {
            const effectiveStock = part.stock - getCountInBuild(part.name);
            return {
                ...part,
                effectiveStock,
                compatibility: checkCompatibility(part, build)
            };
        });
    }, [allParts, categories, sortBy, sortDirection, build, searchQuery]);

    const totalPages = Math.ceil(sortedAndFilteredParts.length / itemsPerPage);
    const paginatedParts = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedAndFilteredParts.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedAndFilteredParts, currentPage, itemsPerPage]);

    const isSelected = (part: Part) => {
        if (part.category === 'Storage' || part.category === 'RAM') {
            const items = build[part.category];
            if (Array.isArray(items)) {
                return items.some(c => c.model === part.name);
            }
            return (items as ComponentData)?.model === part.name;
        }
        return (build[part.category] as ComponentData)?.model === part.name;
    };

    const handleAddPrebuilt = async (data: PrebuiltBuilderAddFormSchema) => {
        if (!firestore) return;
        try {
            await addPrebuiltSystem(firestore, data);
            toast({ 
                title: "Prebuilt Added Successfully!", 
                description: `${data.name} is now available in the Prebuilt Overview tab.`,
                variant: "default"
            });
            // Optional: clear build after adding? User didn't specify, I'll keep it for now.
        } catch (err: any) {
            toast({ variant: "destructive", title: "Add Failed", description: err.message });
        }
    };

    const isBuilderLoading = cpusLoading || gpusLoading || motherboardsLoading || ramsLoading || storagesLoading || psusLoading || casesLoading || coolersLoading || monitorsLoading || keyboardsLoading || miceLoading || headsetsLoading || authLoading;

    if (authLoading || !profile?.isManager) {
        return (
            <div className="flex items-center justify-center min-h-[80vh]">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <main className="w-full max-w-[1800px] mx-auto px-4 md:px-8 py-4 md:py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                <div className="text-left">
                    <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 uppercase tracking-widest text-[10px] py-0.5">Admin Interface</Badge>
                    </div>
                    <h1 className="text-4xl font-headline font-bold uppercase">Prebuilt Builder</h1>
                    <p className="text-muted-foreground mt-2">
                        Configure new pre-built systems for the catalog using current inventory.
                    </p>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-6 xl:gap-8">
                <div className="lg:col-span-9 flex flex-col gap-6">
                    <InventoryToolbar
                        categories={categories}
                        onCategoryChange={handleCategoryChange}
                        itemCount={sortedAndFilteredParts.length}
                        sortBy={sortBy}
                        onSortByChange={(val) => { setSortBy(val); setCurrentPage(1); }}
                        sortDirection={sortDirection}
                        onSortDirectionChange={(val) => { setSortDirection(val); setCurrentPage(1); }}
                        supportedSorts={['Date Added', 'Name', 'Price']}
                        view={view}
                        onViewChange={setView}
                        showViewToggle={true}
                        searchQuery={searchQuery}
                        onSearchQueryChange={(val) => { setSearchQuery(val); setCurrentPage(1); }}
                    />

                    {isBuilderLoading ? (
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-6">
                            {[...Array(8)].map((_, i) => (
                                <Card key={i} className="animate-pulse">
                                    <CardContent className="p-4"><Skeleton className="aspect-video w-full mb-2" /></CardContent>
                                    <CardContent className="p-4 pt-0 space-y-2"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /></CardContent>
                                    <CardFooter className="p-4 pt-0 flex justify-between items-center"><Skeleton className="h-6 w-1/3" /><Skeleton className="h-9 w-20" /></CardFooter>
                                </Card>
                            ))}
                        </div>
                    ) : sortedAndFilteredParts.length > 0 ? (
                        view === 'grid' ? (
                            <>
                                <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-6">
                                    {paginatedParts.map(part => (
                                        <PartCard
                                            key={part.id}
                                            part={part}
                                            effectiveStock={(part as any).effectiveStock}
                                            onToggleBuild={handlePartToggle}
                                            isSelected={isSelected(part)}
                                            compatibility={(part as any).compatibility}
                                        />
                                    ))}
                                </div>
                                <PaginationControls
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    itemsPerPage={itemsPerPage}
                                    onPageChange={setCurrentPage}
                                    onItemsPerPageChange={setItemsPerPage}
                                />
                            </>
                        ) : (
                            <Card className="mt-6">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Item</TableHead>
                                            <TableHead>Stock</TableHead>
                                            <TableHead className="text-right">Price</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedParts.map(part => {
                                            const selected = isSelected(part);
                                            const currentStock = part.stock - getCountInBuild(part.name);
                                            return (
                                                <TableRow key={part.id} className={cn(
                                                    (part as any).effectiveStock === 0 && !selected && "opacity-50 grayscale",
                                                    (part as any).compatibility && !(part as any).compatibility.compatible && "bg-destructive/[0.03] hover:bg-destructive/[0.06] border-l-2 border-l-destructive shadow-[inset_4px_0_0_-2px_rgba(239,68,68,0.5)]"
                                                )}>
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-3">
                                                            <Image src={getOptimizedStorageUrl(part.imageUrl) || "/placeholder-part.png"} alt={part.name} width={40} height={40} className="rounded-sm object-cover" />
                                                            <div>
                                                                <p className="font-semibold">{part.name}</p>
                                                                <p className="text-xs text-muted-foreground">{part.brand}</p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={currentStock > 5 ? "secondary" : currentStock > 0 ? "destructive" : "outline"}>
                                                            {currentStock > 0 ? `${currentStock} in stock` : "Out of stock"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">{formatCurrency(part.price)}</TableCell>
                                                    <TableCell>
                                                        {(!((part as any).compatibility && !(part as any).compatibility.compatible) || selected) && (
                                                            <Button
                                                                size="icon"
                                                                onClick={() => handlePartToggle(part)}
                                                                disabled={currentStock === 0 && !selected}
                                                                variant={selected ? 'destructive' : 'default'}
                                                            >
                                                                {selected ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                                <PaginationControls
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    itemsPerPage={itemsPerPage}
                                    onPageChange={setCurrentPage}
                                    onItemsPerPageChange={setItemsPerPage}
                                />
                            </Card>
                        )
                    ) : (
                        <Card className="mt-6 min-h-[400px] flex items-center justify-center">
                            <CardContent className="text-center text-muted-foreground p-6">
                                <p>No components found for the selected categories.</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="lg:col-span-3">
                    <div className="sticky top-20 flex flex-col gap-6 pb-4 pr-2">
                        <YourBuild
                            build={build}
                            onClearBuild={handleClearBuild}
                            onRemovePart={handleRemovePart}
                            resolution={resolution}
                            onResolutionChange={setResolution}
                            workload={workload}
                            onWorkloadChange={setWorkload}
                            showSystemBalance={true}
                            isManagerMode={true}
                            allParts={allParts}
                            onAddPrebuilt={handleAddPrebuilt}
                        />
                    </div>
                </div>
            </div>
            <BuilderFloatingChat />
        </main >
    );
}
