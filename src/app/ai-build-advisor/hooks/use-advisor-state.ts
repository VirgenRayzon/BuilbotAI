"use client";

import { useState, useEffect, useCallback } from 'react';
import type { ComponentData, FavoriteBuild, Resolution, WorkloadType, Part } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { checkCompatibility } from "@/lib/compatibility";
import { INCLUDED_INTEGRATED_GPU_ID, syncIntegratedGraphics } from '@/lib/integrated-graphics';
import {
    Cpu, Server, CircuitBoard, MemoryStick, Database, Power,
    RectangleVertical, Wind, Monitor, Keyboard, Mouse, Headphones,
} from 'lucide-react';

const emptyBuild = (): Record<string, ComponentData | ComponentData[] | null> => ({
    CPU: null, GPU: null, Motherboard: null, RAM: [], Storage: [], PSU: null, Case: null, Cooler: null,
    Monitor: null, Keyboard: null, Mouse: null, Headset: null,
});

const componentIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    CPU: Cpu, GPU: Server, Motherboard: CircuitBoard, RAM: MemoryStick,
    Storage: Database, PSU: Power, Case: RectangleVertical, Cooler: Wind,
    Monitor, Keyboard, Mouse, Headset: Headphones,
};

/**
 * Hook to manage local builder state, resolution, and workload in the Advisor.
 */
export function useAdvisorState(allParts: Part[]) {
    const { toast } = useToast();
    const [builderState, setBuilderState] = useState<Record<string, ComponentData | ComponentData[] | null> | null>(null);
    const [hydrated, setHydrated] = useState(false);
    const [resolution, setResolution] = useState<Resolution>('1440p');
    const [workload, setWorkload] = useState<WorkloadType>('Balanced');

    // Persistence
    useEffect(() => {
        const saved = localStorage.getItem('pc_builder_state');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const hasParts = Object.values(parsed).some(val => Array.isArray(val) ? val.length > 0 : val !== null);
                if (hasParts) setBuilderState(parsed);
            } catch (e) {
                console.error("Failed to parse saved build", e);
            }
        }
        setHydrated(true);
    }, []);

    const loadFavoriteBuild = useCallback((favorite: FavoriteBuild) => {
        const next = emptyBuild();
        const unavailableParts: string[] = [];

        for (const savedPart of favorite.parts ?? []) {
            if (savedPart.category === 'GPU' && savedPart.partId === INCLUDED_INTEGRATED_GPU_ID) continue;

            const livePart = allParts.find((part) =>
                part.id === savedPart.partId
                || (savedPart.name && part.name.toLowerCase() === savedPart.name.toLowerCase())
            );
            const icon = componentIcons[savedPart.category];
            if (!livePart || livePart.stock <= 0 || livePart.isArchived || !icon) {
                unavailableParts.push(savedPart.name);
                continue;
            }

            const component: ComponentData = {
                id: livePart.id,
                model: livePart.name,
                price: livePart.price,
                description: livePart.description
                    || Object.entries(livePart.specifications || {}).slice(0, 2).map(([key, value]) => `${key}: ${value}`).join(' | '),
                image: livePart.imageUrl,
                images: livePart.images,
                imageHint: livePart.name.toLowerCase().split(' ').slice(0, 2).join(' '),
                icon,
                wattage: livePart.wattage,
                socket: livePart.specifications?.Socket?.toString()
                    || livePart.specifications?.socket?.toString()
                    || livePart.socket,
                ramType: livePart.specifications?.['Memory Type']?.toString()
                    || livePart.specifications?.['RAM Type']?.toString()
                    || livePart.ramType,
                performanceScore: livePart.performanceScore,
                performanceTier: livePart.performanceTier,
                specifications: livePart.specifications,
                dimensions: livePart.dimensions,
            };

            if (savedPart.category === 'RAM' || savedPart.category === 'Storage') {
                (next[savedPart.category] as ComponentData[]).push(component);
            } else {
                next[savedPart.category] = component;
            }
        }

        const resolvedBuild = syncIntegratedGraphics(next);
        setBuilderState(resolvedBuild);
        localStorage.setItem('pc_builder_state', JSON.stringify(resolvedBuild));

        if (unavailableParts.length > 0) {
            toast({
                variant: 'warning',
                title: `${unavailableParts.length} saved part${unavailableParts.length === 1 ? '' : 's'} unavailable`,
                description: `${Array.from(new Set(unavailableParts)).join(', ')} could not be loaded from the current catalog.`,
            });
        }
    }, [allParts, toast]);

    useEffect(() => {
        const handleLoadFavorite = (event: Event) => {
            loadFavoriteBuild((event as CustomEvent<FavoriteBuild>).detail);
        };

        window.addEventListener('load-favorite-build', handleLoadFavorite);
        return () => window.removeEventListener('load-favorite-build', handleLoadFavorite);
    }, [loadFavoriteBuild]);

    const handlePartToggle = useCallback((part: Part) => {
        if (!builderState) {
            const initial = emptyBuild();
            const next = { ...initial } as any;
            if (part.category === 'RAM' || part.category === 'Storage') next[part.category] = [part];
            else next[part.category] = part;
            setBuilderState(next);
            localStorage.setItem('pc_builder_state', JSON.stringify(next));
            return;
        }

        const next = { ...builderState } as any;
        const category = part.category;
        const { compatible, message } = checkCompatibility(part, next);

        if (category === 'RAM' || category === 'Storage') {
            const current = Array.isArray(next[category]) ? next[category] : [];
            const index = current.findIndex((p: any) => p.id === part.id);
            if (index > -1) current.splice(index, 1);
            else {
                if (!compatible) {
                    toast({ variant: 'destructive', title: 'Compatibility Error', description: message });
                    return;
                }
                current.push(part);
            }
            next[category] = [...current];
        } else {
            const isAlreadySelected = next[category]?.id === part.id;
            if (!isAlreadySelected && !compatible) {
                toast({ variant: 'destructive', title: 'Compatibility Error', description: message });
                return;
            }
            next[category] = isAlreadySelected ? null : part;
        }

        setBuilderState(next);
        localStorage.setItem('pc_builder_state', JSON.stringify(next));
    }, [builderState, toast]);

    const handleRemovePart = useCallback((category: string, index?: number) => {
        if (!builderState) return;
        const next = { ...builderState } as any;
        if (category === 'Storage' && typeof index === 'number') {
            const currentStorage = [...(next['Storage'] as ComponentData[])];
            currentStorage.splice(index, 1);
            next['Storage'] = currentStorage;
        } else {
            next[category] = null;
        }
        setBuilderState(next);
        localStorage.setItem('pc_builder_state', JSON.stringify(next));
    }, [builderState]);

    const handleClearBuild = useCallback(() => {
        localStorage.removeItem('pc_builder_state');
        setBuilderState(null);
    }, []);

    return {
        builderState,
        hydrated,
        setBuilderState,
        handlePartToggle,
        handleRemovePart,
        handleClearBuild,
        resolution,
        setResolution,
        workload,
        setWorkload
    };
}
