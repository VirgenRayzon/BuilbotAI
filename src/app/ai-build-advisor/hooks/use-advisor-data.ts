"use client";

import { useMemo } from 'react';
import { useFirestore, useDoc } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, doc } from 'firebase/firestore';
import type { Part } from '@/lib/types';

type PartWithoutCategory = Omit<Part, 'category'>;

/**
 * Hook to fetch all inventory data and site settings for the Advisor.
 */
export function useAdvisorData() {
    const firestore = useFirestore();

    const settingsDocRef = useMemo(() => firestore ? doc(firestore, 'siteSettings', 'main') : null, [firestore]);
    const { data: settings } = useDoc<any>(settingsDocRef);
    const isAiKillSwitch = settings?.isAiKillSwitch || false;

    const cpuQuery = useMemo(() => firestore ? collection(firestore, 'CPU') : null, [firestore]);
    const { data: cpus } = useCollection<PartWithoutCategory>(cpuQuery);
    const gpuQuery = useMemo(() => firestore ? collection(firestore, 'GPU') : null, [firestore]);
    const { data: gpus } = useCollection<PartWithoutCategory>(gpuQuery);
    const motherboardQuery = useMemo(() => firestore ? collection(firestore, 'Motherboard') : null, [firestore]);
    const { data: motherboards } = useCollection<PartWithoutCategory>(motherboardQuery);
    const ramQuery = useMemo(() => firestore ? collection(firestore, 'RAM') : null, [firestore]);
    const { data: rams } = useCollection<PartWithoutCategory>(ramQuery);
    const storageQuery = useMemo(() => firestore ? collection(firestore, 'Storage') : null, [firestore]);
    const { data: storages } = useCollection<PartWithoutCategory>(storageQuery);
    const psuQuery = useMemo(() => firestore ? collection(firestore, 'PSU') : null, [firestore]);
    const { data: psus } = useCollection<PartWithoutCategory>(psuQuery);
    const caseQuery = useMemo(() => firestore ? collection(firestore, 'Case') : null, [firestore]);
    const { data: cases } = useCollection<PartWithoutCategory>(caseQuery);
    const coolerQuery = useMemo(() => firestore ? collection(firestore, 'Cooler') : null, [firestore]);
    const { data: coolers } = useCollection<PartWithoutCategory>(coolerQuery);

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
        return parts;
    }, [cpus, gpus, motherboards, rams, storages, psus, cases, coolers]);

    const loading = !cpus || !gpus || !motherboards || !rams || !storages || !psus || !cases || !coolers;

    return { 
        allParts, 
        isAiKillSwitch,
        loading,
        collections: { cpus, gpus, motherboards, rams, storages, psus, cases, coolers } 
    };
}
