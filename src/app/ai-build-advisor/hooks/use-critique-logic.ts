"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { getAiBuildCritique } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";

/**
 * Helper to generate a unique key for a given build state.
 */
export function getBuildKey(state: any) {
    if (!state) return "";
    const partKey = (part: any) => part ? {
        id: part.id,
        brand: part.brand,
        model: part.model || part.name,
        price: part.price,
        description: part.description,
        socket: part.socket,
        ramType: part.ramType,
        wattage: part.wattage,
        performanceScore: part.performanceScore,
        performanceTier: part.performanceTier,
        dimensions: part.dimensions,
        specifications: part.specifications,
    } : null;
    return JSON.stringify(Object.entries(state)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([category, value]) => [category, Array.isArray(value) ? value.map(partKey) : partKey(value)]));
}

export function getCritiqueCacheKey(state: any, preferences?: { intendedUse?: string; performanceLevel?: string; additionalNotes?: string }) {
    return JSON.stringify({
        build: getBuildKey(state),
        intendedUse: preferences?.intendedUse || '',
        performanceLevel: preferences?.performanceLevel || '',
        additionalNotes: preferences?.additionalNotes || '',
    });
}

/**
 * Hook to handle AI build critique logic, including caching and error management.
 */
export function useCritiqueLogic(isAiKillSwitch: boolean) {
    const { toast } = useToast();
    const [critiqueAnalysis, setCritiqueAnalysis] = useState<any>(null);
    const [critiqueDuration, setCritiqueDuration] = useState<number | null>(null);
    const [critiqueLoading, setCritiqueLoading] = useState(false);
    const [critiqueError, setCritiqueError] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Cleanup abort controller on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const handleCancelCritique = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setCritiqueLoading(false);
        toast({
            title: "Analysis Cancelled",
            description: "Stopped showing this analysis.",
        });
    }, [toast]);

    const handleCritique = useCallback(async (
        builderState: any, 
        forceRefresh: boolean = false,
        preferences?: { intendedUse?: string; performanceLevel?: string; additionalNotes?: string }
    ) => {
        if (isAiKillSwitch) {
            toast({ title: "AI Disabled", description: "AI is disabled by Administrator.", variant: "destructive" });
            return;
        }
        if (!builderState) return;

        const buildKey = getCritiqueCacheKey(builderState, preferences);
        if (!forceRefresh) {
            const cache = localStorage.getItem('pc_critique_cache');
            if (cache) {
                try {
                    const parsedCache = JSON.parse(cache);
                    const cachedEntry = parsedCache[buildKey];
                    if (cachedEntry?.timestamp && Date.now() - cachedEntry.timestamp < 60 * 60 * 1000) {
                        if (cachedEntry && typeof cachedEntry === 'object' && 'analysis' in cachedEntry) {
                            setCritiqueAnalysis(cachedEntry.analysis);
                            setCritiqueDuration(cachedEntry.duration ?? null);
                        } else {
                            // Backward compatibility fallback for flat cache
                            setCritiqueAnalysis(cachedEntry);
                            setCritiqueDuration(null);
                        }
                        return;
                    }
                } catch (e) {}
            }
        }

        setCritiqueLoading(true);
        setCritiqueError(null);

        // Initialize new abort controller
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const buildData: any = {};
        Object.entries(builderState).forEach(([key, val]) => {
            if (val) {
                if (Array.isArray(val)) {
                    buildData[key] = val.map((v: any) => ({
                        model: v.name || v.model,
                        price: v.price,
                        brand: v.brand,
                        description: v.description || "",
                        wattage: v.wattage,
                        socket: v.socket,
                        ramType: v.ramType,
                        performanceScore: v.performanceScore,
                        dimensions: v.dimensions,
                        specifications: v.specifications,
                    }));
                } else {
                    const singleVal = val as any;
                    buildData[key] = {
                        model: singleVal.name || singleVal.model,
                        price: singleVal.price,
                        brand: singleVal.brand,
                        description: singleVal.description || "",
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

        const startTime = Date.now();
        try {
            const result = await getAiBuildCritique({
                build: buildData,
                intendedUse: preferences?.intendedUse,
                performanceLevel: preferences?.performanceLevel,
                additionalNotes: preferences?.additionalNotes,
            });
            
            if (controller.signal.aborted) return;
            if ('error' in result) {
                setCritiqueError(result.error as string);
            } else {
                const duration = (Date.now() - startTime) / 1000;
                setCritiqueAnalysis(result);
                setCritiqueDuration(duration);
                const cache = localStorage.getItem('pc_critique_cache') || '{}';
                try {
                    const parsedCache = JSON.parse(cache);
                    parsedCache[buildKey] = {
                        analysis: result,
                        duration: duration,
                        timestamp: Date.now(),
                    };
                    const keys = Object.keys(parsedCache);
                    if (keys.length > 10) delete parsedCache[keys[0]];
                    localStorage.setItem('pc_critique_cache', JSON.stringify(parsedCache));
                } catch (e) {}
            }
        } catch (err: any) {
            if (err.name === 'AbortError' || err.message === 'ABORTED') {
                console.log("Critique aborted by user.");
                return;
            }
            setCritiqueError("An unexpected error occurred during analysis.");
        } finally {
            if (abortControllerRef.current === controller) {
                abortControllerRef.current = null;
                setCritiqueLoading(false);
            }
        }
    }, [isAiKillSwitch, toast]);

    return {
        critiqueAnalysis,
        setCritiqueAnalysis,
        critiqueDuration,
        setCritiqueDuration,
        critiqueLoading,
        critiqueError,
        handleCritique,
        handleCancelCritique,
        getBuildKey
    };
}
