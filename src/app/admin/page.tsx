"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Plus, Package, PackageCheck, ServerCrash, Loader2, BarChart3, 
    History, TrendingUp, DollarSign, Cpu, Monitor, CircuitBoard, 
    MemoryStick, HardDrive, PlugZap, Square, Wind, Mouse, Headset, 
    ChevronRight, Settings, Trash2, ChevronDown, Search, Filter, 
    Archive, LayoutGrid, Table as TableIcon, CheckSquare 
} from "lucide-react";
import { Order } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
    DropdownMenu, 
    DropdownMenuTrigger, 
    DropdownMenuContent, 
    DropdownMenuCheckboxItem 
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { InventoryToolbar } from '@/components/inventory-toolbar';
import { Card, CardContent } from '@/components/ui/card';
import { AddPartDialog, type AddPartFormSchema } from '@/components/add-part-dialog';
import { AddPrebuiltDialog, type AddPrebuiltFormSchema } from '@/components/add-prebuilt-dialog';
import type { Part, PrebuiltSystem } from '@/lib/types';
import { InventoryTable } from '@/components/inventory-table';
import { PrebuiltsTable } from '@/components/prebuilts-table';
import { useCollection } from '@/firebase/firestore/use-collection';
import { 
    addPart, deletePart, archivePart, bulkArchiveParts, bulkDeleteParts,
    addPrebuiltSystem, deletePrebuiltSystem, archivePrebuiltSystem, 
    bulkArchivePrebuilts, bulkDeletePrebuilts,
    updatePart, updatePrebuiltSystem,
    createSystemNotification 
} from '@/firebase/database';
import { collection, deleteDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { TableSkeleton } from '@/components/table-skeleton';
import { SuperAdminSettings } from '@/components/super-admin-settings';
import { useUserProfile } from '@/context/user-profile';
import { useToast } from "@/hooks/use-toast";
import { InventoryPartCard } from '@/components/inventory-part-card';
import { InventoryPrebuiltCard } from '@/components/inventory-prebuilt-card';
import { updateReservationStatus } from '@/app/checkout-actions';
import { PaginationControls } from "@/components/pagination-controls";
import { formatCurrency, cn } from "@/lib/utils";
import { NotificationCenter } from '@/components/notification-center';
import { SalesAnalytics } from '@/components/sales-analytics';
import { SalesVisualizer } from '@/components/sales-visualizer';

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
    const { toast } = useToast();

    // Route protection
    useEffect(() => {
        if (!userLoading) {
            if (!authUser) {
                router.replace('/signin');
            } else if (!(profile?.isManager || profile?.isSuperAdmin)) {
                router.replace('/builder');
            }
        }
    }, [authUser, profile, userLoading, router]);

    // Parts state
    const [partCategories, setPartCategories] = useState(componentCategories);
    const [archivePartCategories, setArchivePartCategories] = useState(componentCategories);
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
    const [expandedPrebuiltIds, setExpandedPrebuiltIds] = useState<string[]>([]);
    const [orderCurrentPage, setOrderCurrentPage] = useState(1);
    const [orderItemsPerPage, setOrderItemsPerPage] = useState(5);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const [activeView, setActiveView] = useState<'grid' | 'table'>('grid');
    
    // Selection state
    const [selectedPartIds, setSelectedPartIds] = useState<{ id: string, category: Part['category'] }[]>([]);
    const [selectedPrebuiltIds, setSelectedPrebuiltIds] = useState<string[]>([]);
    const [isPrebuiltSelectionMode, setIsPrebuiltSelectionMode] = useState(false);
    const [isPartSelectionMode, setIsPartSelectionMode] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{
        isOpen: boolean;
        type: 'archive' | 'restore' | 'delete';
        target: 'parts' | 'prebuilts';
    }>({ isOpen: false, type: 'archive', target: 'parts' });


    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') || 'stock';
    const [currentTab, setCurrentTab] = useState(
        (initialTab === 'sales' && !profile?.isSuperAdmin) ? 'stock' : initialTab
    );

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab) {
            if (tab === 'sales' && !profile?.isSuperAdmin) {
                setCurrentTab('stock');
                router.replace('/admin?tab=stock');
            } else {
                setCurrentTab(tab);
            }
        }
    }, [searchParams, profile, router]);

    const handleTabChange = (val: string) => {
        // Restrict Sales tab to Super Admin only
        if (val === 'sales' && !profile?.isSuperAdmin) {
            toast({
                title: "Access Restricted",
                description: "The Sales performance page is reserved for Super Admins.",
                variant: "destructive"
            });
            return;
        }
        setCurrentTab(val);
        router.push(`/admin?tab=${val}`, { scroll: false });
    };

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

    const handleUpdatePart = async (partId: string, category: Part['category'], data: AddPartFormSchema) => {
        if (!firestore) return;
        await updatePart(firestore, category, partId, {
            name: data.partName,
            brand: data.brand,
            price: data.price,
            stock: data.stockCount,
            imageUrl: data.imageUrl,
            wattage: data.wattage,
            performanceScore: data.performanceScore,
            dimensions: data.dimensions,
            description: data.description,
            specifications: Object.fromEntries(data.specifications.map(s => [s.key, s.value])),
            packageType: data.packageType === "" ? undefined : data.packageType
        });
    };

    const handleUpdatePartStock = async (partId: string, category: Part['category'], newStock: number) => {
        if (!firestore) return;
        await updatePart(firestore, category, partId, { stock: newStock });
    };

    const handleDeletePart = async (partId: string, category: Part['category']) => {
        if (!firestore) return;
        if (!profile?.isSuperAdmin) {
            toast({ title: "Permission Denied", description: "Only Super Admins can delete items. Use Archive instead.", variant: "destructive" });
            return;
        }
        await deletePart(firestore, partId, category);
    };

    const handleArchivePart = async (partId: string, category: Part['category'], isArchived: boolean = true) => {
        if (!firestore) return;
        try {
            await archivePart(firestore, partId, category, isArchived);
            
            // Resolve part name for notification
            const partName = parts.find(p => p.id === partId)?.name || partId;

            // System Notification for Super Admin
            if (profile?.isManager && !profile?.isSuperAdmin) {
                await createSystemNotification(firestore, {
                    type: 'item_archived',
                    actorId: profile.id,
                    actorName: profile.name || profile.email,
                    title: isArchived ? "Item Archived" : "Item Restored",
                    message: `Manager ${profile.name || profile.email} ${isArchived ? 'archived' : 'restored'} part: ${partName}`,
                    targetId: partId
                });
            }

            toast({ title: isArchived ? "Item Archived" : "Item Restored", description: `${isArchived ? "Moved to archive." : "Restored to stock."}` });
        } catch (error) {
            console.error("Archive error:", error);
        }
    };

    const handleAddPrebuilt = async (newPrebuiltData: AddPrebuiltFormSchema) => {
        if (!firestore) return;
        await addPrebuiltSystem(firestore, newPrebuiltData);
    };

    const handleUpdatePrebuilt = async (systemId: string, data: AddPrebuiltFormSchema) => {
        if (!firestore) return;
        await updatePrebuiltSystem(firestore, systemId, data);
    };

    const handleDeletePrebuilt = async (systemId: string) => {
        if (!firestore) return;
        if (!profile?.isSuperAdmin) {
            toast({ title: "Permission Denied", description: "Only Super Admins can delete items.", variant: "destructive" });
            return;
        }
        await deletePrebuiltSystem(firestore, systemId);
    };

    const handleArchivePrebuilt = async (systemId: string, isArchived: boolean = true) => {
        if (!firestore) return;
        try {
            await archivePrebuiltSystem(firestore, systemId, isArchived);

            // Resolve system name for notification
            const systemName = prebuiltSystems?.find(s => s.id === systemId)?.name || systemId;

            // System Notification for Super Admin
            if (profile?.isManager && !profile?.isSuperAdmin) {
                await createSystemNotification(firestore, {
                    type: 'item_archived',
                    actorId: profile.id,
                    actorName: profile.name || profile.email,
                    title: isArchived ? "Prebuilt Archived" : "Prebuilt Restored",
                    message: `Manager ${profile.name || profile.email} ${isArchived ? 'archived' : 'restored'} prebuilt: ${systemName}`,
                    targetId: systemId
                });
            }

            toast({ title: isArchived ? "Prebuilt Archived" : "Prebuilt Restored", description: `${isArchived ? "Moved to archive." : "Restored to systems."}` });
        } catch (error) {
            console.error("Archive error:", error);
        }
    };

    const togglePartSelection = (id: string, category: Part['category']) => {
        setSelectedPartIds(prev =>
            prev.some(p => p.id === id)
                ? prev.filter(p => p.id !== id)
                : [...prev, { id, category }]
        );
    };

    const toggleAllPartsSelection = (currentParts: Part[]) => {
        const allVisibleSelected = currentParts.length > 0 && currentParts.every(p => selectedPartIds.some(s => s.id === p.id));
        
        if (allVisibleSelected) {
            // Deselect ONLY the visible items
            setSelectedPartIds(prev => prev.filter(p => !currentParts.some(cp => cp.id === p.id)));
        } else {
            // Select ALL visible items, keeping existing external selections
            setSelectedPartIds(prev => {
                const newSelections = [...prev];
                currentParts.forEach(cp => {
                    if (!newSelections.some(s => s.id === cp.id)) {
                        newSelections.push({ id: cp.id, category: cp.category });
                    }
                });
                return newSelections;
            });
        }
    };

    const togglePrebuiltSelection = (id: string) => {
        setSelectedPrebuiltIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleAllPrebuiltsSelection = (currentSystems: PrebuiltSystem[]) => {
        const allVisibleSelected = currentSystems.length > 0 && currentSystems.every(s => selectedPrebuiltIds.includes(s.id));

        if (allVisibleSelected) {
            // Deselect ONLY the visible items
            setSelectedPrebuiltIds(prev => prev.filter(id => !currentSystems.some(cs => cs.id === id)));
        } else {
            // Select ALL visible items, keeping existing external selections
            setSelectedPrebuiltIds(prev => {
                const newSelections = [...prev];
                currentSystems.forEach(cs => {
                    if (!newSelections.includes(cs.id)) {
                        newSelections.push(cs.id);
                    }
                });
                return newSelections;
            });
        }
    };

    const handleBulkArchiveParts = async (isArchived: boolean = true) => {
        if (!firestore || selectedPartIds.length === 0) return;
        try {
            await bulkArchiveParts(firestore, selectedPartIds, isArchived);

            // System Notification for Super Admin
            if (profile?.isManager && !profile?.isSuperAdmin) {
                await createSystemNotification(firestore, {
                    type: 'item_archived',
                    actorId: profile.id,
                    actorName: profile.name || profile.email,
                    title: `Bulk ${isArchived ? 'Archive' : 'Restore'}`,
                    message: `Manager ${profile.name || profile.email} ${isArchived ? 'archived' : 'restored'} ${selectedPartIds.length} parts.`,
                    targetId: 'bulk'
                });
            }

            toast({ title: "Bulk Action Complete", description: `${isArchived ? 'Archived' : 'Restored'} ${selectedPartIds.length} items.` });
            setSelectedPartIds([]);
        } catch (error) {
            console.error(error);
        }
    };

    const handleBulkDeleteParts = async () => {
        if (!firestore || selectedPartIds.length === 0 || !profile?.isSuperAdmin) return;
        try {
            await bulkDeleteParts(firestore, selectedPartIds);
            toast({ title: "Bulk Delete Complete", description: `Deleted ${selectedPartIds.length} items.` });
            setSelectedPartIds([]);
        } catch (error) {
            console.error(error);
        }
    };

    const handleBulkArchivePrebuilts = async (isArchived: boolean = true) => {
        if (!firestore || selectedPrebuiltIds.length === 0) return;
        try {
            await bulkArchivePrebuilts(firestore, selectedPrebuiltIds, isArchived);

            // System Notification for Super Admin
            if (profile?.isManager && !profile?.isSuperAdmin) {
                await createSystemNotification(firestore, {
                    type: 'item_archived',
                    actorId: profile.id,
                    actorName: profile.name || profile.email,
                    title: `Bulk ${isArchived ? 'Archive' : 'Restore'}`,
                    message: `Manager ${profile.name || profile.email} ${isArchived ? 'archived' : 'restored'} ${selectedPrebuiltIds.length} systems.`,
                    targetId: 'bulk'
                });
            }

            toast({ title: "Bulk Action Complete", description: `${isArchived ? 'Archived' : 'Restored'} ${selectedPrebuiltIds.length} systems.` });
            setSelectedPrebuiltIds([]);
        } catch (error) {
            console.error(error);
        }
    };

    const handleBulkDeletePrebuilts = async () => {
        if (!firestore || selectedPrebuiltIds.length === 0 || !profile?.isSuperAdmin) return;
        try {
            await bulkDeletePrebuilts(firestore, selectedPrebuiltIds);
            toast({ title: "Bulk Delete Complete", description: `Deleted ${selectedPrebuiltIds.length} systems.` });
            setSelectedPrebuiltIds([]);
        } catch (error) {
            console.error(error);
        }
    };

    const togglePrebuiltExpandAll = (id: string) => {
        setExpandedPrebuiltIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleDeleteOrder = async (orderId: string) => {
        if (!firestore) return;
        if (!window.confirm("Are you sure you want to delete this reservation? This cannot be undone.")) return;

        try {
            await deleteDoc(doc(firestore, "orders", orderId));
            toast({
                title: "Reservation Deleted",
                description: "The reservation has been permanently removed.",
            });
        } catch (error) {
            console.error("Error deleting order:", error);
            toast({
                title: "Error",
                description: "Failed to delete the reservation.",
                variant: "destructive"
            });
        }
    };

    const handleUpdateOrder = async (orderId: string, newStatus: Order['status']) => {
        if (!firestore) return;
        try {
            const actorInfo = profile ? {
                id: profile.id,
                name: profile.name || profile.email,
                isManager: profile.isManager,
                isSuperAdmin: profile.isSuperAdmin
            } : undefined;

            const result = await updateReservationStatus(orderId, newStatus, actorInfo);
            if (result.success) {
                toast({
                    title: "Status Updated",
                    description: `Order ${orderId.substring(0, 8)} status changed to ${newStatus}.`,
                });
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error("Error updating order status:", error);
            toast({
                title: "Update Failed",
                description: error instanceof Error ? error.message : "Failed to update order status.",
                variant: "destructive"
            });
        }
    };

    const filteredAndSortedParts = useMemo(() => {
        const selectedCategories = partCategories.filter(c => c.selected).map(c => c.name);
        return (parts?.filter(part => {
            const matchesCategory = selectedCategories.includes(part.category);
            const matchesSearch = part.name.toLowerCase().includes(partSearchQuery.toLowerCase()) ||
                part.brand.toLowerCase().includes(partSearchQuery.toLowerCase());
            const isNotArchived = !part.isArchived;
            return matchesCategory && matchesSearch && isNotArchived;
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

    const paginatedOrders = useMemo(() => {
        if (!orders) return [];
        const sorted = [...orders].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        const startIndex = (orderCurrentPage - 1) * orderItemsPerPage;
        return sorted.slice(startIndex, startIndex + orderItemsPerPage);
    }, [orders, orderCurrentPage, orderItemsPerPage]);

    const orderTotalPages = Math.ceil((orders?.length || 0) / orderItemsPerPage);

    const filteredAndSortedPrebuilts = useMemo(() => {
        const selectedCategories = prebuiltCategories.filter(c => c.selected).map(c => c.name);
        return (prebuiltSystems?.filter(system => selectedCategories.includes(system.tier) && !system.isArchived) ?? [])
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
    const currentParts = useMemo(() => {
        const startIndex = (partCurrentPage - 1) * partItemsPerPage;
        return filteredAndSortedParts.slice(startIndex, startIndex + partItemsPerPage);
    }, [filteredAndSortedParts, partCurrentPage, partItemsPerPage]);

    const prebuiltTotalPages = Math.ceil(filteredAndSortedPrebuilts.length / prebuiltItemsPerPage);
    const currentPrebuilts = useMemo(() => {
        const startIndex = (prebuiltCurrentPage - 1) * prebuiltItemsPerPage;
        return filteredAndSortedPrebuilts.slice(startIndex, startIndex + prebuiltItemsPerPage);
    }, [filteredAndSortedPrebuilts, prebuiltCurrentPage, prebuiltItemsPerPage]);

    const stats = useMemo(() => {
        const totalSales = orders?.reduce((acc, order) => acc + (order.status !== 'cancelled' ? order.totalPrice : 0), 0) || 0;
        const totalOrders = orders?.filter(o => o.status !== 'cancelled').length || 0;
        const pendingOrdersCount = orders?.filter(o => o.status === 'pending').length || 0;

        const popularItems = [...parts].sort((a, b) => ((b as any).popularity || 0) - ((a as any).popularity || 0)).slice(0, 5);

        return { totalSales, totalOrders, popularItems, pendingOrdersCount };
    }, [orders, parts]);

    const executeBulkAction = async () => {
        const { type, target } = confirmAction;
        if (target === 'parts') {
            if (type === 'archive') await handleBulkArchiveParts(true);
            else if (type === 'restore') await handleBulkArchiveParts(false);
            else if (type === 'delete') await handleBulkDeleteParts();
        } else {
            if (type === 'archive') await handleBulkArchivePrebuilts(true);
            else if (type === 'restore') await handleBulkArchivePrebuilts(false);
            else if (type === 'delete') await handleBulkDeletePrebuilts();
        }
        setConfirmAction(prev => ({ ...prev, isOpen: false }));
    };

    if (userLoading || !authUser || !profile?.isManager) {
        return (
            <div className="flex items-center justify-center min-h-[80vh]">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="w-full max-w-[1800px] mx-auto px-4 md:px-8 py-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-headline font-bold uppercase tracking-tight text-foreground">
                        {profile?.isSuperAdmin ? "Super Admin" : "Manager"} Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        {profile?.isSuperAdmin 
                            ? "Master control for system configurations, inventory, and analytics." 
                            : "Manage stock inventory, prebuilt systems, and track sales performance."}
                    </p>
                </div>
            </div>
            
            <Tabs value={currentTab} onValueChange={handleTabChange}>
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
                        <TabsTrigger value="reservations" className="relative">
                            <History className="mr-2 h-4 w-4" />
                            Reservations
                            {stats.pendingOrdersCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground animate-bounce">
                                    {stats.pendingOrdersCount}
                                </span>
                            )}
                        </TabsTrigger>
                        {profile?.isSuperAdmin && (
                            <TabsTrigger value="sales">
                                <BarChart3 className="mr-2 h-4 w-4" />
                                Sales
                            </TabsTrigger>
                        )}
                        <TabsTrigger value="archive">
                            <Archive className="mr-2 h-4 w-4" />
                            Archive
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="stock" className="mt-6 space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/30 p-4 rounded-xl border border-white/5 backdrop-blur-md">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="relative flex-grow md:flex-grow-0 md:w-80 group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder="Search parts by name or brand..."
                                    value={partSearchQuery}
                                    onChange={(e) => setPartSearchQuery(e.target.value)}
                                    className="pl-10 h-11 bg-background/50 border-white/10 focus:border-primary/50 transition-all rounded-lg"
                                />
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="h-11 gap-2 border-white/10 bg-background/50 hover:bg-primary/5 hover:border-primary/30">
                                        <Filter className="h-4 w-4" />
                                        Categories
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 bg-background/95 backdrop-blur-xl border-white/10">
                                    <DropdownMenuCheckboxItem
                                        checked={partCategories.every(c => c.selected)}
                                        onCheckedChange={() => {
                                            const anyUnselected = partCategories.some(cat => !cat.selected);
                                            setPartCategories(prev => prev.map(c => ({ ...c, selected: anyUnselected })));
                                        }}
                                    >
                                        All Categories
                                    </DropdownMenuCheckboxItem>
                                    <Separator className="my-1 opacity-50" />
                                    {partCategories.map((category) => (
                                        <DropdownMenuCheckboxItem
                                            key={category.name}
                                            checked={category.selected}
                                            onCheckedChange={() => {
                                                setPartCategories(prev => prev.map(c => ({
                                                    ...c,
                                                    selected: c.name === category.name ? true : false
                                                })));
                                            }}
                                        >
                                            {category.name}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            <Button 
                                variant={isPartSelectionMode ? "secondary" : "outline"}
                                className={cn(
                                    "h-11 gap-2 border-white/10 bg-background/50 transition-all",
                                    isPartSelectionMode && "bg-primary/20 border-primary/50 text-white shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]"
                                )}
                                onClick={() => {
                                    setIsPartSelectionMode(!isPartSelectionMode);
                                    if (isPartSelectionMode) setSelectedPartIds([]);
                                }}
                            >
                                <CheckSquare className="h-4 w-4" />
                                {isPartSelectionMode ? "Finish Selection" : "Select"}
                            </Button>

                            {isPartSelectionMode && (
                                <Button
                                    variant="outline"
                                    className="h-11 gap-2 border-white/10 bg-background/50 hover:bg-primary/5"
                                    onClick={() => toggleAllPartsSelection(currentParts)}
                                >
                                    <PackageCheck className="h-4 w-4" />
                                    {currentParts.length > 0 && currentParts.every(p => selectedPartIds.some(s => s.id === p.id)) ? "Deselect All" : "Select All"}
                                </Button>
                            )}

                            {selectedPartIds.length > 0 && (
                                <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 animate-in fade-in slide-in-from-right-2">
                                    <span className="text-xs font-bold text-primary">{selectedPartIds.length} Selected</span>
                                    <Separator orientation="vertical" className="h-4 bg-primary/20" />
                                    <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="h-7 text-xs hover:bg-primary/20"
                                        onClick={() => setConfirmAction({ isOpen: true, type: 'archive', target: 'parts' })}
                                    >
                                        <Archive className="mr-1.5 h-3 w-3" /> Archive
                                    </Button>
                                    {profile?.isSuperAdmin && (
                                        <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            className="h-7 text-xs text-destructive hover:bg-destructive/20"
                                            onClick={() => setConfirmAction({ isOpen: true, type: 'delete', target: 'parts' })}
                                        >
                                            <Trash2 className="mr-1.5 h-3 w-3" /> Delete
                                        </Button>
                                    )}
                                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelectedPartIds([])}>
                                        Cancel
                                    </Button>
                                </div>
                            )}
                            <div className="flex bg-muted/50 p-1 rounded-lg border border-white/10 shrink-0">
                                <Button
                                    variant={activeView === 'grid' ? 'secondary' : 'ghost'}
                                    size="icon"
                                    onClick={() => setActiveView('grid')}
                                    className={cn("h-9 w-9", activeView === 'grid' && "bg-background shadow-sm")}
                                >
                                    <LayoutGrid className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant={activeView === 'table' ? 'secondary' : 'ghost'}
                                    size="icon"
                                    onClick={() => setActiveView('table')}
                                    className={cn("h-9 w-9", activeView === 'table' && "bg-background shadow-sm")}
                                >
                                    <TableIcon className="h-4 w-4" />
                                </Button>
                            </div>
                            <AddPartDialog onSave={handleAddPart}>
                                <Button className="h-11 gap-2 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 px-6 shrink-0 transition-transform active:scale-95">
                                    <Plus className="h-4 w-4" />
                                    Add Part
                                </Button>
                            </AddPartDialog>
                        </div>
                    </div>

                    {activeView === 'grid' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {currentParts.map((part) => (
                                <InventoryPartCard
                                    key={part.id}
                                    part={part}
                                    onDelete={handleDeletePart}
                                    onArchive={handleArchivePart}
                                    onUpdateStock={handleUpdatePartStock}
                                    onUpdatePart={handleUpdatePart}
                                    isSelected={selectedPartIds.some(p => p.id === part.id)}
                                    onToggleSelection={togglePartSelection}
                                    isSelectionMode={isPartSelectionMode}
                                    isSuperAdmin={profile?.isSuperAdmin}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-white/10 bg-background/50 backdrop-blur-md overflow-hidden">
                            <InventoryTable
                                parts={currentParts}
                                onDelete={handleDeletePart}
                                onArchive={handleArchivePart}
                                onUpdateStock={handleUpdatePartStock}
                                onUpdatePart={handleUpdatePart}
                                selectedIds={selectedPartIds}
                                onToggleSelection={togglePartSelection}
                                onToggleSelectAll={() => toggleAllPartsSelection(currentParts)}
                                isSuperAdmin={profile?.isSuperAdmin}
                            />
                        </div>
                    )}
                    <PaginationControls
                        currentPage={partCurrentPage}
                        totalPages={partTotalPages}
                        itemsPerPage={partItemsPerPage}
                        onPageChange={setPartCurrentPage}
                        onItemsPerPageChange={setPartItemsPerPage}
                    />
                </TabsContent>

                <TabsContent value="prebuilts" className="mt-6 space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/30 p-4 rounded-xl border border-white/5 backdrop-blur-md">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="h-11 gap-2 border-white/10 bg-background/50 hover:bg-primary/5 hover:border-primary/30">
                                        <Filter className="h-4 w-4" />
                                        Filter Tiers
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 bg-background/95 backdrop-blur-xl border-white/10">
                                    {prebuiltCategories.map((category) => (
                                        <DropdownMenuCheckboxItem
                                            key={category.name}
                                            checked={category.selected}
                                            onCheckedChange={() => {
                                                setPrebuiltCategories(prev => prev.map(c =>
                                                    c.name === category.name ? { ...c, selected: !c.selected } : c
                                                ));
                                            }}
                                        >
                                            {category.name}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            <Button 
                                variant={isPrebuiltSelectionMode ? "secondary" : "outline"}
                                className={cn(
                                    "h-11 gap-2 border-white/10 bg-background/50 transition-all",
                                    isPrebuiltSelectionMode && "bg-primary/20 border-primary/50 text-white shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]"
                                )}
                                onClick={() => {
                                    setIsPrebuiltSelectionMode(!isPrebuiltSelectionMode);
                                    if (isPrebuiltSelectionMode) setSelectedPrebuiltIds([]);
                                }}
                            >
                                <CheckSquare className="h-4 w-4" />
                                {isPrebuiltSelectionMode ? "Finish Selection" : "Select"}
                            </Button>

                            {isPrebuiltSelectionMode && (
                                <Button
                                    variant="outline"
                                    className="h-11 gap-2 border-white/10 bg-background/50 hover:bg-primary/5"
                                    onClick={() => toggleAllPrebuiltsSelection(currentPrebuilts)}
                                >
                                    <PackageCheck className="h-4 w-4" />
                                    {currentPrebuilts.length > 0 && currentPrebuilts.every(s => selectedPrebuiltIds.includes(s.id)) ? "Deselect All" : "Select All"}
                                </Button>
                            )}

                            {selectedPrebuiltIds.length > 0 && (
                                <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 animate-in fade-in slide-in-from-right-2">
                                    <span className="text-xs font-bold text-primary">{selectedPrebuiltIds.length} Selected</span>
                                    <Separator orientation="vertical" className="h-4 bg-primary/20" />
                                    <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="h-7 text-xs hover:bg-primary/20"
                                        onClick={() => setConfirmAction({ isOpen: true, type: 'archive', target: 'prebuilts' })}
                                    >
                                        <Archive className="mr-1.5 h-3 w-3" /> Archive
                                    </Button>
                                    {profile?.isSuperAdmin && (
                                        <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            className="h-7 text-xs text-destructive hover:bg-destructive/20"
                                            onClick={() => setConfirmAction({ isOpen: true, type: 'delete', target: 'prebuilts' })}
                                        >
                                            <Trash2 className="mr-1.5 h-3 w-3" /> Delete
                                        </Button>
                                    )}
                                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelectedPrebuiltIds([])}>
                                        Cancel
                                    </Button>
                                </div>
                            )}
                            <div className="flex bg-muted/50 p-1 rounded-lg border border-white/10 shrink-0">
                                <Button
                                    variant={activeView === 'grid' ? 'secondary' : 'ghost'}
                                    size="icon"
                                    onClick={() => setActiveView('grid')}
                                    className={cn("h-9 w-9", activeView === 'grid' && "bg-background shadow-sm")}
                                >
                                    <LayoutGrid className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant={activeView === 'table' ? 'secondary' : 'ghost'}
                                    size="icon"
                                    onClick={() => setActiveView('table')}
                                    className={cn("h-9 w-9", activeView === 'table' && "bg-background shadow-sm")}
                                >
                                    <TableIcon className="h-4 w-4" />
                                </Button>
                            </div>
                            <AddPrebuiltDialog
                                parts={parts || []}
                                onSave={handleAddPrebuilt}
                            >
                                <Button className="h-11 gap-2 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 px-6 shrink-0 transition-transform active:scale-95">
                                    <Plus className="h-4 w-4" />
                                    Add System
                                </Button>
                            </AddPrebuiltDialog>
                        </div>
                    </div>

                    {activeView === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {currentPrebuilts.map((system) => (
                                <InventoryPrebuiltCard
                                    key={system.id}
                                    system={system}
                                    parts={parts || []}
                                    onDelete={handleDeletePrebuilt}
                                    onArchive={handleArchivePrebuilt}
                                    onUpdate={handleUpdatePrebuilt}
                                    isExpanded={expandedPrebuiltIds.includes(system.id)}
                                    onToggleExpand={() => togglePrebuiltExpandAll(system.id)}
                                    isSelected={selectedPrebuiltIds.includes(system.id)}
                                    onToggleSelection={togglePrebuiltSelection}
                                    isSelectionMode={isPrebuiltSelectionMode}
                                    isSuperAdmin={profile?.isSuperAdmin}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-white/10 bg-background/50 backdrop-blur-md overflow-hidden">
                            <PrebuiltsTable
                                systems={currentPrebuilts}
                                parts={parts || []}
                                onDelete={handleDeletePrebuilt}
                                onArchive={handleArchivePrebuilt}
                                onUpdate={handleUpdatePrebuilt}
                                isExpanded={expandedPrebuiltIds.length > 0}
                                onToggleExpand={() => togglePrebuiltExpandAll(currentPrebuilts[0]?.id || '')}
                                selectedIds={selectedPrebuiltIds}
                                onToggleSelection={togglePrebuiltSelection}
                                onToggleSelectAll={() => toggleAllPrebuiltsSelection(currentPrebuilts)}
                                isSuperAdmin={profile?.isSuperAdmin}
                            />
                        </div>
                    )}
                    <PaginationControls
                        currentPage={prebuiltCurrentPage}
                        totalPages={prebuiltTotalPages}
                        itemsPerPage={prebuiltItemsPerPage}
                        onPageChange={setPrebuiltCurrentPage}
                        onItemsPerPageChange={setPrebuiltItemsPerPage}
                    />
                </TabsContent>

                <TabsContent value="reservations">
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-8">
                            <div>
                                <h2 className="text-2xl font-headline font-bold mb-4 flex items-center gap-2 uppercase">
                                    <Package className="h-6 w-6 text-primary" /> Current Reservations
                                </h2>
                                <Card>
                                    <CardContent className="p-0">
                                        {ordersLoading ? <TableSkeleton columns={3} /> : (
                                            orders && orders.length > 0 ? (
                                                <>
                                                    <div className="divide-y overflow-hidden rounded-md border border-white/5">
                                                        {paginatedOrders.map(order => (
                                                            <div 
                                                                key={order.id} 
                                                                className={cn(
                                                                    "flex flex-col transition-all duration-300",
                                                                    order.status === 'pending' 
                                                                        ? "border-l-4 border-l-primary shadow-[0_0_20px_rgba(34,211,238,0.05)]" 
                                                                        : "border-l-4 border-l-transparent",
                                                                    order.status === 'cancelled' && "opacity-60 grayscale-[0.5]"
                                                                )}
                                                            >
                                                                <div 
                                                                    className={cn(
                                                                        "p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-muted/20 transition-colors",
                                                                        expandedOrderId === order.id && "bg-muted/30 pb-3"
                                                                    )}
                                                                    onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                                                                >
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="p-2.5 rounded-xl bg-muted/50 border border-white/5 shadow-sm">
                                                                            <Package className="h-4 w-4 text-muted-foreground" />
                                                                        </div>
                                                                        <div>
                                                                            <div className="flex items-center gap-2 mb-1.5">
                                                                                <p className="font-bold text-base tracking-tight">{order.userEmail}</p>
                                                                                {order.status === 'pending' && <Badge className="bg-primary hover:bg-primary text-[10px] h-4 animate-pulse">NEW</Badge>}
                                                                            </div>
                                                                            <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest opacity-70">
                                                                                ID: {order.id.substring(0, 12)} • {order.items.length} items • {order.createdAt?.toDate().toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex flex-row items-center justify-between md:justify-end gap-5 shrink-0" onClick={e => e.stopPropagation()}>
                                                                        <div className="text-right">
                                                                            <p className="text-[10px] text-muted-foreground uppercase tracking-tighter mb-0.5">Amount</p>
                                                                            <p className="font-headline font-bold text-base text-emerald-500 tracking-tight">{formatCurrency(order.totalPrice)}</p>
                                                                        </div>
                                                                        <Select
                                                                            defaultValue={order.status || 'pending'}
                                                                            onValueChange={(val) => handleUpdateOrder(order.id, val as Order['status'])}
                                                                        >
                                                                            <SelectTrigger className={cn(
                                                                                "w-[140px] h-9 text-[10px] font-bold uppercase tracking-wider",
                                                                                order.status === 'pending' && "border-primary/50 text-primary",
                                                                                order.status === 'cancelled' && "text-destructive border-destructive/30"
                                                                            )}>
                                                                                <SelectValue placeholder="Status" />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="pending" className="font-bold text-primary">Pending</SelectItem>
                                                                                <SelectItem value="building" className="font-bold text-blue-400">Building</SelectItem>
                                                                                <SelectItem value="finished building" className="font-bold text-emerald-400">Finished Building</SelectItem>
                                                                                <SelectItem value="cancelled" className="text-destructive font-bold bg-destructive/5">Cancelled</SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteOrder(order.id)}>
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button variant="ghost" size="icon" className={cn("h-8 w-8 transition-transform", expandedOrderId === order.id && "rotate-180")}>
                                                                            <ChevronRight className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                                
                                                                {expandedOrderId === order.id && (
                                                                    <div className="px-5 pb-5 pt-0 animate-in fade-in slide-in-from-top-2 duration-300">
                                                                        <div className="grid grid-cols-1 gap-1.5 bg-background/40 rounded-xl p-4 border border-white/5 shadow-inner">
                                                                            <div className="flex justify-between items-center mb-2 px-1 pb-1 border-b border-white/5">
                                                                                <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60">Full Component List</span>
                                                                                <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60">Price</span>
                                                                            </div>
                                                                            {order.items.map((item, idx) => (
                                                                                <div key={idx} className="flex justify-between items-baseline group py-1 border-t border-white/[0.03] first:border-t-0">
                                                                                    <div className="flex flex-col">
                                                                                        <span className="text-[8px] uppercase font-bold text-primary/60 tracking-tighter">{item.category}</span>
                                                                                        <span className="text-sm font-medium text-foreground/80 leading-tight group-hover:text-primary transition-colors pr-4">{item.name}</span>
                                                                                    </div>
                                                                                    <span className="font-mono text-xs text-primary/70 shrink-0">{formatCurrency(item.price)}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="mt-4">
                                                        <PaginationControls
                                                            currentPage={orderCurrentPage}
                                                            totalPages={orderTotalPages}
                                                            itemsPerPage={orderItemsPerPage}
                                                            onPageChange={setOrderCurrentPage}
                                                            onItemsPerPageChange={setOrderItemsPerPage}
                                                        />
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="p-8 text-center text-muted-foreground">No reservations yet.</div>
                                            )
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {profile?.isSuperAdmin && (
                    <TabsContent value="sales" className="mt-6">
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">
                                {/* 3D Visualizer Section */}
                                <div className="xl:col-span-1">
                                    <div className="space-y-4 sticky top-8">
                                        <div className="flex flex-col">
                                            <h3 className="text-2xl font-headline font-bold uppercase tracking-tight text-foreground">
                                                Business Pulse
                                            </h3>
                                            <p className="text-xs text-muted-foreground uppercase tracking-widest opacity-60 mt-1">
                                                Neural data synchronization
                                            </p>
                                        </div>
                                        <SalesVisualizer orderCount={stats.totalOrders} />
                                        <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
                                            <p className="text-xs text-primary/80 font-medium leading-relaxed">
                                                The Neural Core reflects real-time reservation intensity. Higher pulse rates indicate increased customer engagement cycles.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Analytics Dashboard Section */}
                                <div className="xl:col-span-3">
                                    <SalesAnalytics orders={orders || []} parts={parts || []} />
                                </div>
                            </div>

                            {/* Most Popular Components Section (Retained but restyled) */}
                            <div className="grid grid-cols-1 gap-8">
                                <div>
                                    <h3 className="text-xl font-headline font-bold mb-4 flex items-center gap-2 uppercase tracking-tight">
                                        <TrendingUp className="h-5 w-5 text-primary" /> Most Popular Components
                                    </h3>
                                    <Card className="bg-background/40 backdrop-blur-xl border-border/50 shadow-2xl">
                                        <CardContent className="p-0">
                                            <div className="divide-y border border-white/5 rounded-md overflow-hidden">
                                                {stats.popularItems.slice(0, 5).map((item, index) => (
                                                    <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-muted/10 transition-colors group">
                                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary shrink-0 border border-primary/20 group-hover:scale-110 transition-transform">
                                                            {index + 1}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-base truncate leading-tight group-hover:text-primary transition-colors">{item.name}</p>
                                                            <p className="text-[10px] text-muted-foreground uppercase opacity-70 tracking-[0.2em] mt-0.5">{item.category}</p>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <p className="font-mono font-bold text-lg">{(item as any).popularity || 0}</p>
                                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest opacity-60">Purchases</p>
                                                        </div>
                                                    </div>
                                                ))}
                                                {stats.popularItems.length === 0 && (
                                                    <div className="p-8 text-center text-muted-foreground italic">No purchase data synchronized yet.</div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                )}

                <TabsContent value="archive" className="mt-6 space-y-8">
                    <div className="space-y-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <h2 className="text-xl font-headline font-bold flex items-center gap-2">
                                <Archive className="h-5 w-5 text-primary" />
                                Archived Parts
                            </h2>
                            <div className="flex items-center gap-3">
                                {selectedPartIds.length > 0 && (
                                    <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 animate-in fade-in slide-in-from-right-2">
                                        <span className="text-xs font-bold text-primary">{selectedPartIds.length} Selected</span>
                                        <Separator orientation="vertical" className="h-4 bg-primary/20" />
                                        <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            className="h-7 text-xs hover:bg-primary/20 text-emerald-400"
                                            onClick={() => setConfirmAction({ isOpen: true, type: 'restore', target: 'parts' })}
                                        >
                                            <PackageCheck className="mr-1.5 h-3 w-3" /> Restore
                                        </Button>
                                        {profile?.isSuperAdmin && (
                                            <Button 
                                                size="sm" 
                                                variant="ghost" 
                                                className="h-7 text-xs text-destructive hover:bg-destructive/20"
                                                onClick={() => setConfirmAction({ isOpen: true, type: 'delete', target: 'parts' })}
                                            >
                                                <Trash2 className="mr-1.5 h-3 w-3" /> Delete
                                            </Button>
                                        )}
                                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelectedPartIds([])}>
                                            Cancel
                                        </Button>
                                    </div>
                                )}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="h-9 gap-2 border-white/10 bg-background/50 hover:bg-primary/5 hover:border-primary/30 text-xs">
                                            <Filter className="h-3 w-3" />
                                            Categories
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 bg-background/95 backdrop-blur-xl border-white/10">
                                        <DropdownMenuCheckboxItem
                                            checked={archivePartCategories.every(c => c.selected)}
                                            onCheckedChange={() => {
                                                const anyUnselected = archivePartCategories.some(cat => !cat.selected);
                                                setArchivePartCategories(prev => prev.map(c => ({ ...c, selected: anyUnselected })));
                                            }}
                                        >
                                            All Categories
                                        </DropdownMenuCheckboxItem>
                                        <Separator className="my-1 opacity-50" />
                                        {archivePartCategories.map((category) => (
                                            <DropdownMenuCheckboxItem
                                                key={category.name}
                                                checked={category.selected}
                                                onCheckedChange={() => {
                                                    setArchivePartCategories(prev => prev.map(c => ({
                                                        ...c,
                                                        selected: c.name === category.name ? true : false
                                                    })));
                                                }}
                                            >
                                                {category.name}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-background/50 backdrop-blur-md overflow-hidden">
                            <InventoryTable
                                parts={parts?.filter(p => p.isArchived && archivePartCategories.find(c => c.name === p.category)?.selected) || []}
                                onDelete={handleDeletePart}
                                onArchive={handleArchivePart}
                                onUpdateStock={handleUpdatePartStock}
                                onUpdatePart={handleUpdatePart}
                                selectedIds={selectedPartIds}
                                onToggleSelection={togglePartSelection}
                                onToggleSelectAll={() => toggleAllPartsSelection(parts?.filter(p => p.isArchived) || [])}
                                isSuperAdmin={profile?.isSuperAdmin}
                                isArchiveView={true}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <h2 className="text-xl font-headline font-bold flex items-center gap-2">
                                <Archive className="h-5 w-5 text-primary" />
                                Archived Prebuilts
                            </h2>
                            {selectedPrebuiltIds.length > 0 && (
                                <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 animate-in fade-in slide-in-from-right-2">
                                    <span className="text-xs font-bold text-primary">{selectedPrebuiltIds.length} Selected</span>
                                    <Separator orientation="vertical" className="h-4 bg-primary/20" />
                                    <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="h-7 text-xs hover:bg-primary/20 text-emerald-400"
                                        onClick={() => setConfirmAction({ isOpen: true, type: 'restore', target: 'prebuilts' })}
                                    >
                                        <PackageCheck className="mr-1.5 h-3 w-3" /> Restore
                                    </Button>
                                    {profile?.isSuperAdmin && (
                                        <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            className="h-7 text-xs text-destructive hover:bg-destructive/20"
                                            onClick={() => setConfirmAction({ isOpen: true, type: 'delete', target: 'prebuilts' })}
                                        >
                                            <Trash2 className="mr-1.5 h-3 w-3" /> Delete
                                        </Button>
                                    )}
                                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelectedPrebuiltIds([])}>
                                        Cancel
                                    </Button>
                                </div>
                            )}
                        </div>
                        <div className="rounded-xl border border-white/10 bg-background/50 backdrop-blur-md overflow-hidden">
                            <PrebuiltsTable
                                systems={prebuiltSystems?.filter(s => s.isArchived) || []}
                                parts={parts || []}
                                onDelete={handleDeletePrebuilt}
                                onArchive={handleArchivePrebuilt}
                                onUpdate={handleUpdatePrebuilt}
                                isExpanded={false}
                                selectedIds={selectedPrebuiltIds}
                                onToggleSelection={togglePrebuiltSelection}
                                onToggleSelectAll={() => toggleAllPrebuiltsSelection(prebuiltSystems?.filter(s => s.isArchived) || [])}
                                isSuperAdmin={profile?.isSuperAdmin}
                                isArchiveView={true}
                            />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Global Bulk Action Confirmation Dialog */}
            <AlertDialog open={confirmAction.isOpen} onOpenChange={(open) => setConfirmAction(prev => ({ ...prev, isOpen: open }))}>
                <AlertDialogContent className="bg-background/95 backdrop-blur-2xl border-white/10 max-w-[400px]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-xl font-headline font-bold">
                            {confirmAction.type === 'delete' ? <Trash2 className="h-5 w-5 text-destructive" /> : <Archive className="h-5 w-5 text-primary" />}
                            Confirm {confirmAction.type.charAt(0).toUpperCase() + confirmAction.type.slice(1)} Action
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground pt-2">
                            {confirmAction.type === 'delete' 
                                ? "This action is PERMANENT and cannot be undone. All selected items will be removed forever."
                                : confirmAction.type === 'archive'
                                    ? "Are you sure you want to move the selected items to the archive?"
                                    : "Are you sure you want to restore the selected items to the main inventory?"}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="pt-6">
                        <AlertDialogCancel className="bg-transparent border-white/10 hover:bg-white/5">Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            className={cn(
                                "text-white font-bold",
                                confirmAction.type === 'delete' ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"
                            )}
                            onClick={executeBulkAction}
                        >
                            Confirm {confirmAction.type.charAt(0).toUpperCase() + confirmAction.type.slice(1)}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
