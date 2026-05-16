"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
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
            description: "The diagnostics sequence has been terminated.",
        });
    }, [toast]);

    const getBuildKey = (state: any) => {
        if (!state) return "";
        const partIds: string[] = [];
        Object.values(state).forEach(val => {
            if (Array.isArray(val)) val.forEach((v: any) => partIds.push(v.id));
            else if (val) partIds.push((val as any).id);
        });
        return partIds.sort().join('|');
    };

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

        const buildKey = getBuildKey(builderState) + (preferences?.intendedUse || "") + (preferences?.performanceLevel || "");
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
            const result = await getAiBuildCritique({
                build: buildData,
                intendedUse: preferences?.intendedUse,
                performanceLevel: preferences?.performanceLevel,
                additionalNotes: preferences?.additionalNotes
            });
            
            if (controller.signal.aborted) return;
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
        critiqueLoading,
        critiqueError,
        handleCritique,
        handleCancelCritique,
        getBuildKey
    };
}
