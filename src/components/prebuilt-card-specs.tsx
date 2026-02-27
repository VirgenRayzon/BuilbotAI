"use client";

import { useEffect, useState } from "react";
import { useFirestore } from "@/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import type { Part } from "@/lib/types";
import { Cpu, HardDrive, MemoryStick, MonitorPlay } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

interface PrebuiltCardSpecsProps {
    components: {
        cpu?: string;
        gpu?: string;
        motherboard?: string;
        ram?: string;
        storage?: string;
        psu?: string;
        case?: string;
        cooler?: string;
        [key: string]: string | undefined;
    };
    expanded?: boolean;
}

export function PrebuiltCardSpecs({ components, expanded = false }: PrebuiltCardSpecsProps) {
    const [specs, setSpecs] = useState<{
        cpu: string | null;
        gpu: string | null;
        motherboard: string | null;
        ram: string | null;
        storage: string | null;
        psu: string | null;
        case: string | null;
        cooler: string | null;
    }>({
        cpu: null,
        gpu: null,
        motherboard: null,
        ram: null,
        storage: null,
        psu: null,
        case: null,
        cooler: null,
    });
    const [loading, setLoading] = useState(true);
    const firestore = useFirestore();

    useEffect(() => {
        if (!firestore) return;

        let isMounted = true;

        const fetchSpecs = async () => {
            setLoading(true);
            try {
                const fetchPartName = async (collectionName: string, idOrName: string | undefined) => {
                    if (!idOrName) return "N/A";
                    // First try looking up by document ID
                    const docRef = doc(firestore, collectionName, idOrName);
                    const snap = await getDoc(docRef);
                    if (snap.exists()) {
                        return (snap.data() as Part).name;
                    }
                    // Fall back: query by name field (for legacy data that stored names instead of IDs)
                    const q = query(collection(firestore, collectionName), where("name", "==", idOrName));
                    const querySnap = await getDocs(q);
                    if (!querySnap.empty) {
                        return (querySnap.docs[0].data() as Part).name;
                    }
                    return "Unknown";
                };

                const [cpuName, gpuName, moboName, ramName, storageName, psuName, caseName, coolerName] = await Promise.all([
                    fetchPartName('CPU', components.cpu),
                    fetchPartName('GPU', components.gpu),
                    fetchPartName('Motherboard', components.motherboard),
                    fetchPartName('RAM', components.ram),
                    fetchPartName('Storage', components.storage),
                    fetchPartName('PSU', components.psu),
                    fetchPartName('Case', components.case),
                    fetchPartName('Cooler', components.cooler),
                ]);

                if (isMounted) {
                    setSpecs({
                        cpu: cpuName,
                        gpu: gpuName,
                        motherboard: moboName,
                        ram: ramName,
                        storage: storageName,
                        psu: psuName,
                        case: caseName,
                        cooler: coolerName,
                    });
                }
            } catch (error) {
                console.error("Failed to fetch card specs:", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchSpecs();

        return () => { isMounted = false; };
    }, [firestore, components]);

    if (loading) {
        return (
            <div className="space-y-1.5 mt-3 mb-1">
                <Skeleton className="h-4 w-full opacity-50" />
                <Skeleton className="h-4 w-11/12 opacity-50" />
                <Skeleton className="h-4 w-4/5 opacity-50" />
                {expanded && (
                    <>
                        <Skeleton className="h-4 w-full opacity-50" />
                        <Skeleton className="h-4 w-10/12 opacity-50" />
                    </>
                )}
            </div>
        );
    }

    if (!expanded) {
        return (
            <div className="space-y-1.5 mt-3 mb-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                    <Cpu className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                    <span className="truncate" title={specs.cpu || "No CPU listed"}>{specs.cpu || "No CPU listed"}</span>
                </div>
                <div className="flex items-center gap-2">
                    <MonitorPlay className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                    <span className="truncate" title={specs.gpu || "No GPU listed"}>{specs.gpu || "No GPU listed"}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground/80">
                    <MemoryStick className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate" title={specs.ram || "No RAM listed"}>{specs.ram || "No RAM listed"}</span>
                    <span className="mx-1 opacity-50">•</span>
                    <HardDrive className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate" title={specs.storage || "No Storage listed"}>{specs.storage || "No Storage listed"}</span>
                </div>
            </div>
        );
    }

    const allSpecs = [
        { label: 'CPU', value: specs.cpu, icon: Cpu },
        { label: 'GPU', value: specs.gpu, icon: MonitorPlay },
        { label: 'Mobo', value: specs.motherboard, icon: HardDrive },
        { label: 'RAM', value: specs.ram, icon: MemoryStick },
        { label: 'Disk', value: specs.storage, icon: HardDrive },
        { label: 'PSU', value: specs.psu, icon: HardDrive },
        { label: 'Case', value: specs.case, icon: HardDrive },
        { label: 'Fan', value: specs.cooler, icon: HardDrive },
    ].filter(s => s.value && s.value !== "N/A");

    return (
        <div className="space-y-2 mt-4 mb-2 text-xs">
            <div className="grid grid-cols-1 gap-2">
                {allSpecs.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 py-0.5 border-b border-primary/5 last:border-0">
                        <s.icon className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                        <span className="font-semibold text-primary/80 shrink-0">{s.label}:</span>
                        <span className="truncate text-muted-foreground" title={s.value || ""}>{s.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
