"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { useToast } from "@/hooks/use-toast";
import { showAdvisorProgressToast, showAdvisorReadyToast } from '@/components/advisor-job-toast';
import { aiBuildCritiqueOutputSchema, type AiBuildCritiqueOutput } from '@/ai/schemas/critique-schemas';

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
        .filter(([, value]) => Array.isArray(value) ? value.length > 0 : value !== null && value !== undefined)
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
 * Hook to handle streaming AI build critique logic with live progressive updates.
 */
export function useCritiqueLogic(isAiKillSwitch: boolean) {
    const { toast } = useToast();
    const router = useRouter();
    const [cachedAnalysis, setCachedAnalysis] = useState<any>(null);
    const [critiqueDuration, setCritiqueDuration] = useState<number | null>(null);
    const [critiqueError, setCritiqueError] = useState<string | null>(null);
    const [activeCritiqueKey, setActiveCritiqueKey] = useState<string | null>(null);
    const progressToastRef = useRef<ReturnType<typeof showAdvisorProgressToast> | null>(null);
    const generationStartTimeRef = useRef<number | null>(null);
    const currentBuildKeyRef = useRef<string | null>(null);

    const { object: streamedObject, submit, isLoading: isStreaming, stop, error: streamError } = useObject({
        api: '/api/ai/build-advisor/critique',
        schema: aiBuildCritiqueOutputSchema,
        onError: (err) => {
            progressToastRef.current?.dismiss();
            progressToastRef.current = null;
            console.error("[useCritiqueLogic] Streaming error:", err);
            let msg = err.message || "Failed to analyze build.";
            try { msg = JSON.parse(msg).error || msg; } catch {}
            setCritiqueError(msg);
            toast({ variant: "destructive", title: "Review Failed", description: msg });
        },
        onFinish: (result) => {
            progressToastRef.current?.dismiss();
            progressToastRef.current = null;
            if (result.object) {
                const startTime = generationStartTimeRef.current || Date.now();
                const duration = (Date.now() - startTime) / 1000;
                setCritiqueDuration(duration);
                setCachedAnalysis(result.object);

                const buildKey = currentBuildKeyRef.current;
                if (buildKey) {
                    try {
                        const cache = localStorage.getItem('pc_critique_cache') || '{}';
                        const parsedCache = JSON.parse(cache);
                        parsedCache[buildKey] = {
                            analysis: result.object,
                            duration,
                            timestamp: Date.now(),
                        };
                        const keys = Object.keys(parsedCache);
                        if (keys.length > 10) delete parsedCache[keys[0]];
                        localStorage.setItem('pc_critique_cache', JSON.stringify(parsedCache));
                    } catch (e) {}
                }
                showAdvisorReadyToast('Build review ready', startTime, () => router.push('/ai-build-advisor#critique'));
            }
        }
    });

    // Cleanup toast on unmount
    useEffect(() => {
        return () => {
            progressToastRef.current?.dismiss();
        };
    }, []);

    const handleCancelCritique = useCallback(() => {
        stop();
        progressToastRef.current?.dismiss();
        progressToastRef.current = null;
        toast({
            title: "Analysis Cancelled",
            description: "Stopped showing this analysis.",
        });
    }, [stop, toast]);

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
        currentBuildKeyRef.current = buildKey;

        if (!forceRefresh) {
            const cache = localStorage.getItem('pc_critique_cache');
            if (cache) {
                try {
                    const parsedCache = JSON.parse(cache);
                    const cachedEntry = parsedCache[buildKey];
                    if (cachedEntry?.timestamp && Date.now() - cachedEntry.timestamp < 60 * 60 * 1000) {
                        setActiveCritiqueKey(buildKey);
                        if (cachedEntry && typeof cachedEntry === 'object' && 'analysis' in cachedEntry) {
                            setCachedAnalysis(cachedEntry.analysis);
                            setCritiqueDuration(cachedEntry.duration ?? null);
                        } else {
                            setCachedAnalysis(cachedEntry);
                            setCritiqueDuration(null);
                        }
                        return;
                    }
                } catch (e) {}
            }
        }

        setCritiqueError(null);
        setCachedAnalysis(null);
        setActiveCritiqueKey(buildKey);

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
        generationStartTimeRef.current = startTime;
        progressToastRef.current = showAdvisorProgressToast('Reviewing your build', startTime);

        submit({
            build: buildData,
            intendedUse: preferences?.intendedUse,
            performanceLevel: preferences?.performanceLevel,
            additionalNotes: preferences?.additionalNotes,
        });
    }, [isAiKillSwitch, submit, toast]);

    // Progressive representation: use streamed partial object during generation, fallback to cached
    const critiqueAnalysis = useMemo(() => {
        if (isStreaming && streamedObject) {
            return streamedObject;
        }
        return cachedAnalysis;
    }, [isStreaming, streamedObject, cachedAnalysis]);

    return {
        critiqueAnalysis,
        setCritiqueAnalysis: setCachedAnalysis,
        critiqueDuration,
        setCritiqueDuration,
        critiqueLoading: isStreaming,
        critiqueError: critiqueError || (streamError ? streamError.message : null),
        activeCritiqueKey,
        handleCritique,
        handleCancelCritique,
        getBuildKey
    };
}
