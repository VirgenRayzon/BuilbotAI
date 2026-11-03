import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
    CircuitBoard, Cpu, Database, MemoryStick, Power, RectangleVertical, Server, Wind,
} from "lucide-react";
import type { ComponentData, FavoriteBuild, Part, PrebuiltSystem } from "@/lib/types";
import { INCLUDED_INTEGRATED_GPU_ID, syncIntegratedGraphics } from '@/lib/integrated-graphics';
import { useToast } from "@/hooks/use-toast";
import { includedCpuCoolerName, isIncludedStockCoolerPart } from '@/lib/included-cpu-cooler';
import { useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

type BuilderState = Record<string, ComponentData | ComponentData[] | null>;
export const PREBUILT_EDIT_SESSION_KEY = 'admin_pc_builder_edit_prebuilt_id';

const componentIcons = {
    CPU: Cpu,
    GPU: Server,
    Motherboard: CircuitBoard,
    RAM: MemoryStick,
    Storage: Database,
    PSU: Power,
    Case: RectangleVertical,
    Cooler: Wind,
};

const emptyBuild = (): BuilderState => ({
    Case: null, Motherboard: null, CPU: null, GPU: null, RAM: [], Storage: [], PSU: null, Cooler: null,
    Monitor: null, Keyboard: null, Mouse: null, Headset: null,
});

export function usePrebuiltBuilderImport(
    allParts: Part[],
    isLoaded: boolean,
    setBuild: Dispatch<SetStateAction<BuilderState>>,
    setEditingPrebuilt: Dispatch<SetStateAction<PrebuiltSystem | null>>,
) {
    const { toast } = useToast();
    const firestore = useFirestore();

    useEffect(() => {
        if (!isLoaded || allParts.length === 0 || !firestore) return;

        const pending = localStorage.getItem("admin_pc_builder_load_prebuilt");
        if (!pending) {
            const editingId = sessionStorage.getItem(PREBUILT_EDIT_SESSION_KEY);
            if (editingId) {
                void getDoc(doc(firestore, 'prebuiltSystems', editingId)).then(snapshot => {
                    if (snapshot.exists()) setEditingPrebuilt({ ...snapshot.data(), id: snapshot.id } as PrebuiltSystem);
                    else sessionStorage.removeItem(PREBUILT_EDIT_SESSION_KEY);
                }).catch(() => sessionStorage.removeItem(PREBUILT_EDIT_SESSION_KEY));
            }
            return;
        }

        let favorite: FavoriteBuild;
        try {
            const parsed: unknown = JSON.parse(pending);
            if (!parsed || typeof parsed !== "object" || !("parts" in parsed) || !Array.isArray(parsed.parts)) {
                throw new Error("Invalid prebuilt build payload");
            }
            favorite = parsed as FavoriteBuild;
        } catch (error) {
            console.error("Could not load prebuilt into admin builder:", error);
            localStorage.removeItem("admin_pc_builder_load_prebuilt");
            return;
        }

        localStorage.removeItem("admin_pc_builder_load_prebuilt");
        void (async () => {
            try {
                if (favorite.loadContext?.type !== 'prebuilt') throw new Error('This import is not a prebuilt system.');
                const systemSnap = await getDoc(doc(firestore, 'prebuiltSystems', favorite.id));
                if (!systemSnap.exists()) throw new Error('This prebuilt no longer exists.');
                const system = { ...systemSnap.data(), id: systemSnap.id } as PrebuiltSystem;

                const next = emptyBuild();
        const unavailable: string[] = [];
        const selectedCounts = new Map<string, number>();
        let loadedCount = 0;

        for (const selected of favorite.parts) {
            if (selected?.category === 'GPU' && selected.partId === INCLUDED_INTEGRATED_GPU_ID) continue;
            if (!selected || typeof selected.partId !== "string" || typeof selected.category !== "string") continue;
            if (!(selected.category in componentIcons)) continue;

            if (selected.category === 'Cooler' && (selected.partId === 'included-stock-cooler' || isIncludedStockCoolerPart(selected))) {
                const cpuSelection = favorite.parts.find(part => part.category === 'CPU');
                const cpu = allParts.find(part => part.category === 'CPU' && (part.id === cpuSelection?.partId || (cpuSelection?.name && part.name.toLowerCase() === cpuSelection.name.toLowerCase())));
                const coolerName = cpu ? includedCpuCoolerName(cpu) : (selected.name || 'Included CPU cooler');
                if (coolerName) {
                    next.Cooler = {
                        id: 'included-stock-cooler', model: coolerName, price: 0, description: 'Bundled cooler.',
                        image: '/placeholders/components/cooler.jpg', imageHint: 'included cooler',
                        icon: Wind, wattage: 0, specifications: { Type: 'Air (Stock)' },
                    };
                    loadedCount++;
                } else unavailable.push('Cooler');
                continue;
            }

            const livePart = allParts.find(part =>
                part.category === selected.category &&
                (part.id === selected.partId || part.name.toLowerCase() === selected.name?.toLowerCase())
            );
            if (!livePart) {
                unavailable.push(selected.name || selected.category);
                continue;
            }

            const stockKey = `${livePart.category}/${livePart.id}`;
            const selectedCount = selectedCounts.get(stockKey) || 0;
            if (livePart.isArchived || livePart.stock <= selectedCount) {
                unavailable.push(livePart.name);
                continue;
            }
            selectedCounts.set(stockKey, selectedCount + 1);

            const category = selected.category as keyof typeof componentIcons;
            const componentData: ComponentData = {
                id: livePart.id,
                model: livePart.name,
                price: livePart.price,
                description: Object.entries(livePart.specifications || {}).slice(0, 2).map(([key, value]) => `${key}: ${value}`).join(" | "),
                image: livePart.imageUrl,
                imageHint: livePart.name.toLowerCase().split(" ").slice(0, 2).join(" "),
                icon: componentIcons[category],
                wattage: livePart.wattage,
                socket: livePart.specifications?.Socket?.toString() || livePart.specifications?.socket?.toString() || livePart.socket,
                ramType: livePart.specifications?.["Memory Type"]?.toString() || livePart.specifications?.["RAM Type"]?.toString() || livePart.ramType,
                performanceScore: livePart.performanceScore,
                performanceTier: livePart.performanceTier,
                specifications: livePart.specifications,
                dimensions: livePart.dimensions,
            };

            if (category === "RAM" || category === "Storage") {
                (next[category] as ComponentData[]).push(componentData);
            } else {
                next[category] = componentData;
            }
            loadedCount++;
        }

        const restoredBuild = syncIntegratedGraphics(next);
        if (restoredBuild.GPU && (restoredBuild.GPU as ComponentData).id === INCLUDED_INTEGRATED_GPU_ID) loadedCount++;
        setBuild(restoredBuild);
        setEditingPrebuilt(system);
        sessionStorage.setItem(PREBUILT_EDIT_SESSION_KEY, system.id);
        const missingParts = Array.from(new Set([
            ...(favorite.loadContext?.unavailableParts || []),
            ...unavailable,
        ].map(name => name === 'included-stock-cooler' ? 'Cooler' : name)));
        toast({
            title: missingParts.length > 0 ? "Pre-built loaded with missing parts" : "Pre-built loaded into Prebuilt Builder",
            description: missingParts.length > 0
                ? `${loadedCount} components loaded. Add or replace: ${missingParts.join(", ")}.`
                : `${loadedCount} components from ${favorite.loadContext?.systemName || favorite.name} are ready to customize.`,
            variant: missingParts.length > 0 ? "warning" : "default",
        });
        } catch (error) {
            toast({ title: 'Could not edit prebuilt', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' });
        }
        })();
    }, [allParts, firestore, isLoaded, setBuild, setEditingPrebuilt, toast]);
}
