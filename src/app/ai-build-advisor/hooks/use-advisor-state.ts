"use client";

import { useState, useEffect, useCallback } from 'react';
import type { ComponentData, Resolution, WorkloadType, Part } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { checkCompatibility } from "@/lib/compatibility";

/**
 * Hook to manage local builder state, resolution, and workload in the Advisor.
 */
export function useAdvisorState(allParts: Part[]) {
    const { toast } = useToast();
    const [builderState, setBuilderState] = useState<Record<string, ComponentData | ComponentData[] | null> | null>(null);
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
    }, []);

    const handlePartToggle = useCallback((part: Part) => {
        if (!builderState) {
            const initial = {
                CPU: null, GPU: null, Motherboard: null, RAM: [], Storage: [], PSU: null, Case: null, Cooler: null,
                Monitor: null, Keyboard: null, Mouse: null, Headset: null,
            };
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
