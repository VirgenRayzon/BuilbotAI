"use client";

import { useState, useCallback } from 'react';
import { getAiBuildCritique } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook to handle AI build critique logic, including caching and error management.
 */
export function useCritiqueLogic(isAiKillSwitch: boolean) {
    const { toast } = useToast();
    const [critiqueAnalysis, setCritiqueAnalysis] = useState<any>(null);
    const [critiqueLoading, setCritiqueLoading] = useState(false);
    const [critiqueError, setCritiqueError] = useState<string | null>(null);

    const getBuildKey = (state: any) => {
        if (!state) return "";
        const partIds: string[] = [];
        Object.values(state).forEach(val => {
            if (Array.isArray(val)) val.forEach((v: any) => partIds.push(v.id));
            else if (val) partIds.push((val as any).id);
        });
        return partIds.sort().join('|');
    };

    const handleCritique = useCallback(async (builderState: any, forceRefresh: boolean = false) => {
        if (isAiKillSwitch) {
            toast({ title: "AI Disabled", description: "AI is disabled by Administrator.", variant: "destructive" });
            return;
        }
        if (!builderState) return;

        const buildKey = getBuildKey(builderState);
        if (!forceRefresh) {
            const cache = localStorage.getItem('pc_critique_cache');
            if (cache) {
                try {
                    const parsedCache = JSON.parse(cache);
                    if (parsedCache[buildKey]) {
                        setCritiqueAnalysis(parsedCache[buildKey]);
                        return;
                    }
                } catch (e) {}
            }
        }

        setCritiqueLoading(true);
        setCritiqueError(null);

        const inputData: any = {};
        Object.entries(builderState).forEach(([key, val]) => {
            if (val) {
                if (Array.isArray(val)) {
                    inputData[key] = val.map((v: any) => ({
                        model: v.name || v.model,
                        price: v.price,
                        brand: v.brand,
                        wattage: v.wattage,
                        socket: v.socket,
                        ramType: v.ramType,
                        performanceScore: v.performanceScore,
                        dimensions: v.dimensions,
                        specifications: v.specifications,
                    }));
                } else {
                    const singleVal = val as any;
                    inputData[key] = {
                        model: singleVal.name || singleVal.model,
                        price: singleVal.price,
                        brand: singleVal.brand,
                        wattage: singleVal.wattage,
                        socket: singleVal.socket,
                        ramType: singleVal.ramType,
                        performanceScore: singleVal.performanceScore,
                        dimensions: singleVal.dimensions,
                        specifications: singleVal.specifications,
                    };
                }
            }
        });

        try {
            const result = await getAiBuildCritique(inputData);
            if ('error' in result) {
                setCritiqueError(result.error as string);
            } else {
                setCritiqueAnalysis(result);
                const cache = localStorage.getItem('pc_critique_cache') || '{}';
                try {
                    const parsedCache = JSON.parse(cache);
                    parsedCache[buildKey] = result;
                    const keys = Object.keys(parsedCache);
                    if (keys.length > 10) delete parsedCache[keys[0]];
                    localStorage.setItem('pc_critique_cache', JSON.stringify(parsedCache));
                } catch (e) {}
            }
        } catch (err) {
            setCritiqueError("An unexpected error occurred during analysis.");
        } finally {
            setCritiqueLoading(false);
        }
    }, [isAiKillSwitch, toast]);

    return {
        critiqueAnalysis,
        setCritiqueAnalysis,
        critiqueLoading,
        critiqueError,
        handleCritique,
        getBuildKey
    };
}
