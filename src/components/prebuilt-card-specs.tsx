"use client";

import { useEffect, useState } from "react";
import { useFirestore } from "@/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import type { Part } from "@/lib/types";
import { 
    Cpu, 
    MonitorPlay as Gpu, 
    CircuitBoard, 
    MemoryStick, 
    HardDrive, 
    Zap as Psu, 
    RectangleVertical as Case, 
    Wind as Cooler 
} from "lucide-react";
import { Collapse } from "@mantine/core";
import { cn } from "@/lib/utils";
import { inventoryItemPath, inventoryItemsPath } from "@/lib/inventory-paths";
import { INCLUDED_INTEGRATED_GPU_ID, createIntegratedGpuPart } from '@/lib/integrated-graphics';

interface PrebuiltCardSpecsProps {
    components: {
        cpu?: string;
        gpu?: string;
        motherboard?: string;
        ram?: string | string[];
        storage?: string | string[];
        psu?: string;
        case?: string;
        cooler?: string;
        [key: string]: string | string[] | undefined;
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
                const fetchPartName = async (collectionName: string, idOrName: string | string[] | undefined) => {
                    if (!idOrName) return "N/A";

                    const lookupSingle = async (val: string) => {
                        try {
                            if (collectionName === 'GPU' && val === INCLUDED_INTEGRATED_GPU_ID && components.cpu) {
                                const cpuSnap = await getDoc(doc(firestore, inventoryItemPath('CPU', components.cpu)));
                                const cpu = cpuSnap.exists() ? { id: cpuSnap.id, ...cpuSnap.data() } as Part : null;
                                return cpu ? createIntegratedGpuPart(cpu)?.name || 'Integrated Graphics' : 'Integrated Graphics';
                            }
                            const canonicalRef = doc(firestore, inventoryItemPath(collectionName, val));
                            const snap = await getDoc(canonicalRef);
                            if (snap.exists()) {
                                return (snap.data() as Part).name;
                            }

                            const canonicalQuery = query(
                                collection(firestore, inventoryItemsPath(collectionName)),
                                where("name", "==", val)
                            );
                            const querySnap = await getDocs(canonicalQuery);
                            if (!querySnap.empty) {
                                return (querySnap.docs[0].data() as Part).name;
                            }

                            // Keep older prebuilt records readable while legacy inventory
                            // collections are phased out.
                            const legacyRef = doc(firestore, collectionName, val);
                            const legacySnap = await getDoc(legacyRef);
                            if (legacySnap.exists()) {
                                return (legacySnap.data() as Part).name;
                            }
                            const legacyQuery = query(collection(firestore, collectionName), where("name", "==", val));
                            const legacyQuerySnap = await getDocs(legacyQuery);
                            if (!legacyQuerySnap.empty) {
                                return (legacyQuerySnap.docs[0].data() as Part).name;
                            }
                            return val;
                        } catch (e) {
                            return val || "Unknown";
                        }
                    };

                    if (Array.isArray(idOrName)) {
                        const names = await Promise.all(idOrName.map(id => lookupSingle(id)));
                        return names.filter(n => n !== "N/A" && n !== "Unknown").join(", ") || "Unknown";
                    }

                    return lookupSingle(idOrName);
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
            <div className="space-y-1.5 py-1 animate-pulse">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-4 bg-slate-200/60 dark:bg-white/5 rounded w-full" />
                ))}
            </div>
        );
    }

    const coreSpecs = [
        { label: 'CPU', value: specs.cpu, icon: Cpu },
        { label: 'GPU', value: specs.gpu, icon: Gpu },
        { label: 'RAM', value: specs.ram, icon: MemoryStick },
        { label: 'Storage', value: specs.storage, icon: HardDrive },
    ].filter(s => s.value && s.value !== "N/A" && s.value !== "Unknown");

    const remainingSpecs = [
        { label: 'Motherboard', value: specs.motherboard, icon: CircuitBoard },
        { label: 'Cooler', value: specs.cooler, icon: Cooler },
        { label: 'PSU', value: specs.psu, icon: Psu },
        { label: 'Case', value: specs.case, icon: Case },
    ].filter(s => s.value && s.value !== "N/A" && s.value !== "Unknown");

    if (coreSpecs.length === 0 && remainingSpecs.length === 0) {
        return (
            <div className="py-1 text-xs text-slate-400 dark:text-slate-500 italic">
                No specifications listed
            </div>
        );
    }

    return (
        <div className="space-y-0 text-xs">
            <div className="space-y-0.5">
                {coreSpecs.map((s, i) => (
                    <div
                        key={s.label}
                        className={cn(
                            "flex items-center gap-2 py-1",
                            ((expanded && remainingSpecs.length > 0) || i < coreSpecs.length - 1) &&
                                "border-b border-slate-200/60 dark:border-white/5"
                        )}
                    >
                        <s.icon className="h-3.5 w-3.5 text-cyan-500 shrink-0" />
                        <span className="font-semibold text-slate-700 dark:text-slate-300 shrink-0 text-[11px]">{s.label}:</span>
                        <span className="truncate text-slate-500 dark:text-slate-400 text-[11px]" title={s.value || ""}>
                            {s.value}
                        </span>
                    </div>
                ))}
            </div>

            {remainingSpecs.length > 0 && (
                <Collapse in={expanded}>
                    <div className="space-y-0.5">
                        {remainingSpecs.map((s, i) => (
                            <div
                                key={s.label}
                                className={cn(
                                    "flex items-center gap-2 py-1",
                                    i < remainingSpecs.length - 1 && "border-b border-slate-200/60 dark:border-white/5"
                                )}
                            >
                                <s.icon className="h-3.5 w-3.5 text-cyan-500 shrink-0" />
                                <span className="font-semibold text-slate-700 dark:text-slate-300 shrink-0 text-[11px]">{s.label}:</span>
                                <span className="truncate text-slate-500 dark:text-slate-400 text-[11px]" title={s.value || ""}>
                                    {s.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </Collapse>
            )}
        </div>
    );
}
