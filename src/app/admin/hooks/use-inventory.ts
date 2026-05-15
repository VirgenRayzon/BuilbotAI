"use client";

import { useState, useMemo } from 'react';
import { useFirestore } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection } from 'firebase/firestore';
import type { Part, PrebuiltSystem } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { 
    addPart, updatePart, deletePart, archivePart, 
    bulkArchiveParts, bulkDeleteParts,
    addPrebuiltSystem, updatePrebuiltSystem, deletePrebuiltSystem, archivePrebuiltSystem,
    bulkArchivePrebuilts, bulkDeletePrebuilts,
    createSystemNotification
} from '@/firebase/database';
import { createAuditLog } from '@/firebase/audit';
import { AddPartFormSchema } from '@/hooks/use-part-form';
import { AddPrebuiltFormSchema } from '@/components/add-prebuilt-dialog';
import { logAdminAction } from '@/app/actions';

type PartWithoutCategory = Omit<Part, 'category'>;

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

/**
 * Hook to manage parts and prebuilt systems inventory.
 */
export function useInventory(profile: any) {
    const firestore = useFirestore();
    const { toast } = useToast();

    // Data Fetching
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

    // Handlers
    const handleAddPart = async (newPartData: AddPartFormSchema) => {
        if (!firestore) return;
        if (parts.some(part => part.name.toLowerCase() === newPartData.partName.toLowerCase())) {
            throw new Error(`A part named "${newPartData.partName}" already exists.`);
        }
        await addPart(firestore, newPartData);
        await logAdminAction('Add Part', `${newPartData.partName} added to ${newPartData.category}`, newPartData);
        
        await createAuditLog(firestore, {
            actionName: 'created',
            actorId: profile?.id || 'unknown',
            actorName: profile?.name || profile?.email || 'Unknown User',
            actorEmail: profile?.email,
            resourceType: 'Part',
            resourceName: newPartData.partName,
            details: `Added new part in category ${newPartData.category}`
        });
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
            specifications: Object.fromEntries(data.specifications.map((s: { key: string; value: string }) => [s.key, s.value])),
            packageType: data.packageType === "" ? undefined : data.packageType
        });
        await createAuditLog(firestore, {
            actionName: 'updated',
            actorId: profile?.id || 'unknown',
            actorName: profile?.name || profile?.email || 'Unknown User',
            actorEmail: profile?.email,
            resourceType: 'Part',
            resourceName: data.partName,
            resourceId: partId,
            details: `Updated part in category ${category}`
        });
    };

    const handleUpdatePartStock = async (partId: string, category: Part['category'], newStock: number) => {
        if (!firestore) return;
        await updatePart(firestore, category, partId, { stock: newStock });
        const partName = parts.find(p => p.id === partId)?.name || partId;
        await createAuditLog(firestore, {
            actionName: 'updated',
            actorId: profile?.id || 'unknown',
            actorName: profile?.name || profile?.email || 'Unknown User',
            actorEmail: profile?.email,
            resourceType: 'Part',
            resourceName: partName,
            resourceId: partId,
            details: `Updated stock to ${newStock} for part in category ${category}`
        });
    };

    const handleDeletePart = async (partId: string, category: Part['category']) => {
        if (!firestore) return;
        if (!profile?.isSuperAdmin) {
            toast({ title: "Permission Denied", description: "Only Super Admins can delete items.", variant: "destructive" });
            return;
        }
        const partName = parts.find(p => p.id === partId)?.name || partId;
        await deletePart(firestore, partId, category);
        await createAuditLog(firestore, {
            actionName: 'deleted',
            actorId: profile?.id || 'unknown',
            actorName: profile?.name || profile?.email || 'Unknown User',
            actorEmail: profile?.email,
            resourceType: 'Part',
            resourceName: partName,
            resourceId: partId,
            details: `Deleted part in category ${category}`
        });
    };

    const handleArchivePart = async (partId: string, category: Part['category'], isArchived: boolean = true) => {
        if (!firestore) return;
        try {
            await archivePart(firestore, partId, category, isArchived);
            const partName = parts.find(p => p.id === partId)?.name || partId;
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
            await createAuditLog(firestore, {
                actionName: isArchived ? 'archived' : 'restored',
                actorId: profile?.id || 'unknown',
                actorName: profile?.name || profile?.email || 'Unknown User',
                actorEmail: profile?.email,
                resourceType: 'Part',
                resourceName: partName,
                resourceId: partId,
                details: `${isArchived ? 'Archived' : 'Restored'} part in category ${category}`
            });
            toast({ title: isArchived ? "Item Archived" : "Item Restored", description: `${isArchived ? "Moved to archive." : "Restored to stock."}` });
        } catch (error) {
            console.error("Archive error:", error);
        }
    };

    const handleAddPrebuilt = async (newPrebuiltData: AddPrebuiltFormSchema) => {
        if (!firestore) return;
        await addPrebuiltSystem(firestore, newPrebuiltData);
        await logAdminAction('Deploy System', `${newPrebuiltData.name} deployed in ${newPrebuiltData.tier} tier`, newPrebuiltData);
        
        await createAuditLog(firestore, {
            actionName: 'created',
            actorId: profile?.id || 'unknown',
            actorName: profile?.name || profile?.email || 'Unknown User',
            actorEmail: profile?.email,
            resourceType: 'Prebuilt',
            resourceName: newPrebuiltData.name,
            details: `Added new prebuilt system`
        });
    };

    const handleUpdatePrebuilt = async (systemId: string, data: AddPrebuiltFormSchema) => {
        if (!firestore) return;
        await updatePrebuiltSystem(firestore, systemId, data);
        await createAuditLog(firestore, {
            actionName: 'updated',
            actorId: profile?.id || 'unknown',
            actorName: profile?.name || profile?.email || 'Unknown User',
            actorEmail: profile?.email,
            resourceType: 'Prebuilt',
            resourceName: data.name,
            resourceId: systemId,
            details: `Updated prebuilt system`
        });
    };

    const handleDeletePrebuilt = async (systemId: string) => {
        if (!firestore) return;
        if (!profile?.isSuperAdmin) {
            toast({ title: "Permission Denied", description: "Only Super Admins can delete items.", variant: "destructive" });
            return;
        }
        const systemName = prebuiltSystems?.find(s => s.id === systemId)?.name || systemId;
        await deletePrebuiltSystem(firestore, systemId);
        await createAuditLog(firestore, {
            actionName: 'deleted',
            actorId: profile?.id || 'unknown',
            actorName: profile?.name || profile?.email || 'Unknown User',
            actorEmail: profile?.email,
            resourceType: 'Prebuilt',
            resourceName: systemName,
            resourceId: systemId,
            details: `Deleted prebuilt system`
        });
    };

    const handleArchivePrebuilt = async (systemId: string, isArchived: boolean = true) => {
        if (!firestore) return;
        try {
            await archivePrebuiltSystem(firestore, systemId, isArchived);
            const systemName = prebuiltSystems?.find(s => s.id === systemId)?.name || systemId;
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
            await createAuditLog(firestore, {
                actionName: isArchived ? 'archived' : 'restored',
                actorId: profile?.id || 'unknown',
                actorName: profile?.name || profile?.email || 'Unknown User',
                actorEmail: profile?.email,
                resourceType: 'Prebuilt',
                resourceName: systemName,
                resourceId: systemId,
                details: `${isArchived ? 'Archived' : 'Restored'} prebuilt system`
            });
            toast({ title: isArchived ? "Prebuilt Archived" : "Prebuilt Restored", description: `${isArchived ? "Moved to archive." : "Restored to systems."}` });
        } catch (error) {
            console.error("Archive error:", error);
        }
    };

    return {
        parts,
        partsLoading,
        prebuiltSystems,
        prebuiltsLoading,
        handleAddPart,
        handleUpdatePart,
        handleUpdatePartStock,
        handleDeletePart,
        handleArchivePart,
        handleAddPrebuilt,
        handleUpdatePrebuilt,
        handleDeletePrebuilt,
        handleArchivePrebuilt,
        componentCategories
    };
}
