"use client";

import { useMemo } from 'react';
import { useFirestore } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection } from 'firebase/firestore';
import type { Part } from '@/lib/types';

type PartWithoutCategory = Omit<Part, 'category'>;

/**
 * Hook to fetch all PC components from Firestore and combine them.
 */
export function useInventoryQuery() {
    const firestore = useFirestore();

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
        cpus?.filter(p => !p.isArchived).forEach(p => parts.push({ ...p, category: 'CPU' }));
        gpus?.filter(p => !p.isArchived).forEach(p => parts.push({ ...p, category: 'GPU' }));
        motherboards?.filter(p => !p.isArchived).forEach(p => parts.push({ ...p, category: 'Motherboard' }));
        rams?.filter(p => !p.isArchived).forEach(p => parts.push({ ...p, category: 'RAM' }));
        storages?.filter(p => !p.isArchived).forEach(p => parts.push({ ...p, category: 'Storage' }));
        psus?.filter(p => !p.isArchived).forEach(p => parts.push({ ...p, category: 'PSU' }));
        cases?.filter(p => !p.isArchived).forEach(p => parts.push({ ...p, category: 'Case' }));
        coolers?.filter(p => !p.isArchived).forEach(p => parts.push({ ...p, category: 'Cooler' }));
        monitors?.filter(p => !p.isArchived).forEach(p => parts.push({ ...p, category: 'Monitor' }));
        keyboards?.filter(p => !p.isArchived).forEach(p => parts.push({ ...p, category: 'Keyboard' }));
        mice?.filter(p => !p.isArchived).forEach(p => parts.push({ ...p, category: 'Mouse' }));
        headsets?.filter(p => !p.isArchived).forEach(p => parts.push({ ...p, category: 'Headset' }));
        return parts;
    }, [cpus, gpus, motherboards, rams, storages, psus, cases, coolers, monitors, keyboards, mice, headsets]);

    const loading = cpusLoading || gpusLoading || motherboardsLoading || ramsLoading || storagesLoading || psusLoading || casesLoading || coolersLoading || monitorsLoading || keyboardsLoading || miceLoading || headsetsLoading;

    return { allParts, loading };
}
