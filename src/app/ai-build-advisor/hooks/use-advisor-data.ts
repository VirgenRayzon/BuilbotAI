"use client";

import { useMemo } from 'react';
import { useFirestore, useDoc } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, doc } from 'firebase/firestore';
import type { Part } from '@/lib/types';

/**
 * Hook to fetch all inventory data and site settings for the Advisor.
 */
export function useAdvisorData() {
    const firestore = useFirestore();

    const settingsDocRef = useMemo(() => firestore ? doc(firestore, 'siteSettings', 'main') : null, [firestore]);
    const { data: settings } = useDoc<any>(settingsDocRef);
    const isAiKillSwitch = settings?.isAiKillSwitch || false;

    const partsQuery = useMemo(() => firestore ? collection(firestore, 'parts') : null, [firestore]);
    const { data: rawParts, loading: partsLoading } = useCollection<Part>(partsQuery);

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
