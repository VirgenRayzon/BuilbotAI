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
import { Text, Group, Stack } from "@mantine/core";

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
                            const docRef = doc(firestore, collectionName, val);
                            const snap = await getDoc(docRef);
                            if (snap.exists()) {
                                return (snap.data() as Part).name;
                            }
                            const q = query(collection(firestore, collectionName), where("name", "==", val));
                            const querySnap = await getDocs(q);
                            if (!querySnap.empty) {
                                return (querySnap.docs[0].data() as Part).name;
                            }
                            return "Unknown";
                        } catch (e) {
                            return "Unknown";
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
            <div className="space-y-2 py-2 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-4 bg-slate-200/60 dark:bg-white/5 rounded w-full" />
                ))}
            </div>
        );
    }

    if (!expanded) {
        return (
            <div className="space-y-1.5 py-1 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                    <Cpu className="h-3.5 w-3.5 text-cyan-500 shrink-0" />
                    <span className="truncate" title={specs.cpu || "No CPU listed"}>{specs.cpu || "No CPU listed"}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Gpu className="h-3.5 w-3.5 text-cyan-500 shrink-0" />
                    <span className="truncate" title={specs.gpu || "No GPU listed"}>{specs.gpu || "No GPU listed"}</span>
                </div>
                <div className="flex items-center gap-2">
                    <MemoryStick className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate" title={specs.ram || "No RAM listed"}>{specs.ram || "No RAM listed"}</span>
                    <span className="mx-1 opacity-40">•</span>
                    <HardDrive className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate" title={specs.storage || "No Storage listed"}>{specs.storage || "No Storage listed"}</span>
                </div>
            </div>
        );
    }

    const allSpecs = [
        { label: 'CPU', value: specs.cpu, icon: Cpu },
        { label: 'GPU', value: specs.gpu, icon: Gpu },
        { label: 'Motherboard', value: specs.motherboard, icon: CircuitBoard },
        { label: 'RAM', value: specs.ram, icon: MemoryStick },
        { label: 'Storage', value: specs.storage, icon: HardDrive },
        { label: 'PSU', value: specs.psu, icon: Psu },
        { label: 'Case', value: specs.case, icon: Case },
        { label: 'Cooler', value: specs.cooler, icon: Cooler },
    ].filter(s => s.value && s.value !== "N/A" && s.value !== "Unknown");

    return (
        <div className="space-y-1 py-1 text-xs">
            {allSpecs.map((s, i) => (
                <div key={i} className="flex items-center gap-2 py-1 border-b border-slate-200/60 dark:border-white/5 last:border-0">
                    <s.icon className="h-3.5 w-3.5 text-cyan-500 shrink-0" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300 shrink-0 text-[11px]">{s.label}:</span>
                    <span className="truncate text-slate-500 dark:text-slate-400 text-[11px]" title={s.value || ""}>{s.value}</span>
                </div>
            ))}
        </div>
    );
}
