"use client";

import { useState } from 'react';
import { useFirestore } from '@/firebase';
import type { Part } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { 
    bulkArchiveParts, bulkDeleteParts,
    bulkArchivePrebuilts, bulkDeletePrebuilts,
    createSystemNotification
} from '@/firebase/database';

/**
 * Hook to manage multi-select and bulk actions for parts and prebuilts.
 */
export function useBulkActions(profile: any) {
    const firestore = useFirestore();
    const { toast } = useToast();

    const [selectedPartIds, setSelectedPartIds] = useState<{ id: string, category: Part['category'] }[]>([]);
    const [selectedPrebuiltIds, setSelectedPrebuiltIds] = useState<string[]>([]);
    const [isPrebuiltSelectionMode, setIsPrebuiltSelectionMode] = useState(false);
    const [isPartSelectionMode, setIsPartSelectionMode] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{
        isOpen: boolean;
        type: 'archive' | 'restore' | 'delete';
        target: 'parts' | 'prebuilts';
    }>({ isOpen: false, type: 'archive', target: 'parts' });

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
            setSelectedPartIds(prev => prev.filter(p => !currentParts.some(cp => cp.id === p.id)));
        } else {
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

    const toggleAllPrebuiltsSelection = (currentSystems: any[]) => {
        const allVisibleSelected = currentSystems.length > 0 && currentSystems.every(s => selectedPrebuiltIds.includes(s.id));
        if (allVisibleSelected) {
            setSelectedPrebuiltIds(prev => prev.filter(id => !currentSystems.some(cs => cs.id === id)));
        } else {
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

    return {
        selectedPartIds,
        setSelectedPartIds,
        selectedPrebuiltIds,
        setSelectedPrebuiltIds,
        isPrebuiltSelectionMode,
        setIsPrebuiltSelectionMode,
        isPartSelectionMode,
        setIsPartSelectionMode,
        confirmAction,
        setConfirmAction,
        togglePartSelection,
        toggleAllPartsSelection,
        togglePrebuiltSelection,
        toggleAllPrebuiltsSelection,
        executeBulkAction
    };
}
