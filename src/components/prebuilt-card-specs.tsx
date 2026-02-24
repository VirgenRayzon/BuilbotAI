"use client";

import { useEffect, useState } from "react";
import { useFirestore } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import type { Part } from "@/lib/types";
import { Cpu, HardDrive, MemoryStick, MonitorPlay } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

interface PrebuiltCardSpecsProps {
    components: {
        cpu?: string;
        gpu?: string;
        ram?: string;
        storage?: string;
        [key: string]: string | undefined;
    };
}

export function PrebuiltCardSpecs({ components }: PrebuiltCardSpecsProps) {
    const [specs, setSpecs] = useState<{ cpu: string | null; gpu: string | null; ram: string | null; storage: string | null }>({
        cpu: null,
        gpu: null,
        ram: null,
        storage: null,
    });
    const [loading, setLoading] = useState(true);
    const firestore = useFirestore();

    useEffect(() => {
        if (!firestore) return;

        let isMounted = true;

        const fetchSpecs = async () => {
            setLoading(true);
            try {
                const fetchPartName = async (category: string, id: string | undefined) => {
                    if (!id) return "N/A";
                    // Attempt to fetch from cache/firestore
                    const docRef = doc(firestore, category, id);
                    const snap = await getDoc(docRef);
                    if (snap.exists()) {
                        return (snap.data() as Part).name;
                    }
                    return "Unknown";
                };

                const [cpuName, gpuName, ramName, storageName] = await Promise.all([
                    fetchPartName('Cpu', components.cpu),
                    fetchPartName('Gpu', components.gpu),
                    fetchPartName('Ram', components.ram),
                    fetchPartName('Storage', components.storage),
                ]);

                if (isMounted) {
                    setSpecs({
                        cpu: cpuName,
                        gpu: gpuName,
                        ram: ramName,
                        storage: storageName,
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
            </div>
        );
    }

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
