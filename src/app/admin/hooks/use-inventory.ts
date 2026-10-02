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
import { logAdminAction, clearCatalogCache } from '@/app/actions';

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
    const partsQuery = useMemo(() => firestore ? collection(firestore, 'parts') : null, [firestore]);
    const { data: rawParts, loading: partsLoading } = useCollection<Part>(partsQuery);

    const prebuiltSystemsQuery = useMemo(() => firestore ? collection(firestore, 'prebuiltSystems') : null, [firestore]);
    const { data: prebuiltSystems, loading: prebuiltsLoading } = useCollection<PrebuiltSystem>(prebuiltSystemsQuery);

    const parts = useMemo(() => {
        return rawParts || [];
    }, [rawParts]);

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
            scope: 'Part',
            resourceName: newPartData.partName,
            details: `Added new part in category ${newPartData.category}`
        });
        await clearCatalogCache();
    };

    const handleUpdatePart = async (partId: string, category: Part['category'], data: AddPartFormSchema) => {
        if (!firestore) return;
        await updatePart(firestore, category, partId, {
            name: data.partName,
            brand: data.brand,
            price: data.price,
            stock: data.stockCount,
            imageUrl: data.imageUrl,
            images: data.images,
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
            scope: 'Part',
            resourceName: data.partName,
            resourceId: partId,
            details: `Updated part in category ${category}`
        });
        await clearCatalogCache();
    };

    const handleAddPartStock = async (partId: string, category: Part['category'], amountToAdd: number) => {
        if (!firestore || amountToAdd <= 0) return;
        const currentPart = parts.find(p => p.id === partId);
        const currentStock = currentPart?.stock ?? 0;
        const newStock = currentStock + amountToAdd;
        const partName = currentPart?.name || partId;
        const actorName = profile?.name || profile?.email || 'Admin';

        // 1. Update stock in Firestore
        await updatePart(firestore, category, partId, { stock: newStock });

        // 2. Create Audit Log (e.g. Admin added 10 stocks of Ryzen 7 7700X)
        await createAuditLog(firestore, {
            actionName: 'updated',
            actorId: profile?.id || 'unknown',
            actorName: actorName,
            actorEmail: profile?.email,
            scope: 'Part',
            resourceName: partName,
            resourceId: partId,
            details: `${actorName} added ${amountToAdd} stocks of ${partName} (Stock: ${currentStock} -> ${newStock})`
        });

        // 3. Create System Notification for other admins/managers (excluding the actor, non-admins never see system_notifications)
        await createSystemNotification(
            firestore,
            {
                type: 'stock_added',
                actorId: profile?.id || 'unknown',
                actorName: actorName,
                title: 'Stock Added',
                message: `${actorName} added ${amountToAdd} stocks of ${partName}. Total stock is now ${newStock}.`,
                targetId: partId
            },
            profile?.id ? [profile.id] : []
        );

        await clearCatalogCache();
        toast({
            title: "Stock Added",
            description: `Successfully added ${amountToAdd} stock(s) to ${partName}. New stock: ${newStock}.`,
        });
    };

    const handleUpdatePartStock = async (partId: string, category: Part['category'], newStock: number) => {
        if (!firestore) return;
        const currentPart = parts.find(p => p.id === partId);
        const currentStock = currentPart?.stock ?? 0;
        const diff = newStock - currentStock;
        await updatePart(firestore, category, partId, { stock: newStock });
        const partName = currentPart?.name || partId;
        const actorName = profile?.name || profile?.email || 'Admin';

        const details = diff > 0 
            ? `${actorName} added ${diff} stocks of ${partName} (Stock: ${currentStock} -> ${newStock})`
            : `Updated stock to ${newStock} for part in category ${category}`;

        await createAuditLog(firestore, {
            actionName: 'updated',
            actorId: profile?.id || 'unknown',
            actorName: actorName,
            actorEmail: profile?.email,
            scope: 'Part',
            resourceName: partName,
            resourceId: partId,
            details
        });

        if (diff > 0) {
            await createSystemNotification(
                firestore,
                {
                    type: 'stock_added',
                    actorId: profile?.id || 'unknown',
                    actorName: actorName,
                    title: 'Stock Added',
                    message: `${actorName} added ${diff} stocks of ${partName}. Total stock is now ${newStock}.`,
                    targetId: partId
                },
                profile?.id ? [profile.id] : []
            );
        }

        await clearCatalogCache();
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
            scope: 'Part',
            resourceName: partName,
            resourceId: partId,
            details: `Deleted part in category ${category}`
        });
        await clearCatalogCache();
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
                scope: 'Part',
                resourceName: partName,
                resourceId: partId,
                details: `${isArchived ? 'Archived' : 'Restored'} part in category ${category}`
            });
            await clearCatalogCache();
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
            scope: 'Prebuilt',
            resourceName: newPrebuiltData.name,
            details: `Added new prebuilt system`
        });
        await clearCatalogCache();
    };

    const handleUpdatePrebuilt = async (systemId: string, data: AddPrebuiltFormSchema) => {
        if (!firestore) return;
        await updatePrebuiltSystem(firestore, systemId, data);
        await createAuditLog(firestore, {
            actionName: 'updated',
            actorId: profile?.id || 'unknown',
            actorName: profile?.name || profile?.email || 'Unknown User',
            actorEmail: profile?.email,
            scope: 'Prebuilt',
            resourceName: data.name,
            resourceId: systemId,
            details: `Updated prebuilt system`
        });
        await clearCatalogCache();
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
            scope: 'Prebuilt',
            resourceName: systemName,
            resourceId: systemId,
            details: `Deleted prebuilt system`
        });
        await clearCatalogCache();
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
                scope: 'Prebuilt',
                resourceName: systemName,
                resourceId: systemId,
                details: `${isArchived ? 'Archived' : 'Restored'} prebuilt system`
            });
            await clearCatalogCache();
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
        handleAddPartStock,
        handleDeletePart,
        handleArchivePart,
        handleAddPrebuilt,
        handleUpdatePrebuilt,
        handleDeletePrebuilt,
        handleArchivePrebuilt,
        componentCategories
    };
}
