import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
    CircuitBoard, Cpu, Database, MemoryStick, Power, RectangleVertical, Server, Wind,
} from "lucide-react";
import type { ComponentData, FavoriteBuild, Part } from "@/lib/types";
import { INCLUDED_INTEGRATED_GPU_ID, syncIntegratedGraphics } from '@/lib/integrated-graphics';
import { useToast } from "@/hooks/use-toast";

type BuilderState = Record<string, ComponentData | ComponentData[] | null>;

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
) {
    const { toast } = useToast();

    useEffect(() => {
        if (!isLoaded || allParts.length === 0) return;

        const pending = localStorage.getItem("admin_pc_builder_load_prebuilt");
        if (!pending) return;

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

        const next = emptyBuild();
        const unavailable: string[] = [];
        const selectedCounts = new Map<string, number>();
        let loadedCount = 0;

        for (const selected of favorite.parts) {
            if (selected?.category === 'GPU' && selected.partId === INCLUDED_INTEGRATED_GPU_ID) continue;
            if (!selected || typeof selected.partId !== "string" || typeof selected.category !== "string") continue;
            if (!(selected.category in componentIcons)) continue;

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

        localStorage.removeItem("admin_pc_builder_load_prebuilt");
        const restoredBuild = syncIntegratedGraphics(next);
        if (restoredBuild.GPU && (restoredBuild.GPU as ComponentData).id === INCLUDED_INTEGRATED_GPU_ID) loadedCount++;
        setBuild(restoredBuild);
        const missingParts = Array.from(new Set([
            ...(favorite.loadContext?.unavailableParts || []),
            ...unavailable,
        ]));
        toast({
            title: missingParts.length > 0 ? "Pre-built loaded with missing parts" : "Pre-built loaded into Prebuilt Builder",
            description: missingParts.length > 0
                ? `${loadedCount} components loaded. Add or replace: ${missingParts.join(", ")}.`
                : `${loadedCount} components from ${favorite.loadContext?.systemName || favorite.name} are ready to customize.`,
            variant: missingParts.length > 0 ? "warning" : "default",
        });
    }, [allParts, isLoaded, setBuild, toast]);
}
