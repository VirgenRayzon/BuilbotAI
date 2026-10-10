"use client";

import { useMemo } from 'react';
import { useFirestore, useDoc } from '@/firebase';
import { useInventoryParts } from '@/firebase/firestore/use-inventory-parts';
import { doc } from 'firebase/firestore';

/**
 * Hook to fetch all inventory data and site settings for the Advisor.
 */
export function useAdvisorData() {
    const firestore = useFirestore();

    const settingsDocRef = useMemo(() => firestore ? doc(firestore, 'siteSettings', 'main') : null, [firestore]);
    const { data: settings } = useDoc<any>(settingsDocRef);
    const isAiKillSwitch = settings?.isAiKillSwitch || false;

    const { data: rawParts, loading: partsLoading } = useInventoryParts(firestore);

    const allParts = useMemo(() => {
        return (rawParts || []).filter(p => !p.isArchived);
    }, [rawParts]);

    const loading = partsLoading;

    return { 
        allParts, 
        isAiKillSwitch,
        loading
    };
}
