"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { useToast } from "@/hooks/use-toast";
import type { Build, Part, ComponentData } from "@/lib/types";
import {
  AiBuildAdvisorRecommendationsOutputSchema,
  type AiBuildAdvisorRecommendationsInput,
} from "@/ai/schemas/build-advisor-schemas";
import { Cpu, Server, CircuitBoard, MemoryStick, Database, Power, RectangleVertical, Wind } from "lucide-react";
import { getComponentPlaceholderImage } from "@/lib/placeholder-images";
import { parsePesoBudget } from '@/lib/parse-peso-budget';
import { checkFullBuildCompatibility } from '@/lib/compatibility';

const componentIcons: Record<string, any> = {
  cpu: Cpu, gpu: Server, motherboard: CircuitBoard, ram: MemoryStick, 
  storage: Database, psu: Power, case: RectangleVertical, cooler: Wind
};

const supportingParts = new Set(['ram', 'storage', 'psu', 'case', 'cooler']);

function summarizeCatalogDescription(value: string): string {
    const plainText = value
        .replace(/<[^>]*>/g, ' ')
        .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/[*_#`>|]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    if (!plainText) return '';
    if (plainText.length <= 180) return plainText;
    const excerpt = plainText.slice(0, 181);
    const sentenceEnd = excerpt.search(/[.!?](?:\s|$)/);
    if (sentenceEnd >= 70) return excerpt.slice(0, sentenceEnd + 1);
    return `${excerpt.slice(0, excerpt.lastIndexOf(' ') || 180).trimEnd()}…`;
}

/**
 * Hook to handle streaming AI build recommendations and live matching.
 */
export function useRecommendationLogic(isAiKillSwitch: boolean, allParts: Part[]) {
    const { toast } = useToast();
    const [savedBuild, setSavedBuild] = useState<Build | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [finalResponseTime, setFinalResponseTime] = useState<number | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const generationStartTimeRef = useRef<number | null>(null);
    const firstPartialReportedRef = useRef(false);
    const firstCardReportedRef = useRef(false);
    const lastRequestRef = useRef<AiBuildAdvisorRecommendationsInput | null>(null);

    // Restore only recent recommendations; stock and prices can change.
    useEffect(() => {
        try {
            const cached = localStorage.getItem('pc_ai_build_recommendation');
            if (cached) {
                const entry = JSON.parse(cached);
                const maxAgeMs = entry.input?.allowAiSearch ? 60 * 60 * 1000 : 5 * 60 * 1000;
                if (entry.build && entry.timestamp && Date.now() - entry.timestamp < maxAgeMs) {
                    setSavedBuild(entry.build);
                } else {
                    localStorage.removeItem('pc_ai_build_recommendation');
                }
            }
        } catch (e) {
            console.warn("Failed to parse cached recommendation from localStorage:", e);
        }
    }, []);

function getSmartDescription(type: string, modelName: string): string {
    const model = modelName || '';

    switch (type.toLowerCase()) {
        case 'ram': {
            const isDDR5 = /ddr5/i.test(model);
            const is64GB = /64\s*gb/i.test(model);
            const is32GB = /32\s*gb/i.test(model);
            const cap = is64GB ? '64GB pro workstation' : is32GB ? '32GB high-capacity' : '16GB dual-channel';
            const tech = isDDR5 ? 'DDR5 memory' : 'DDR4 memory';
            return `Reliable ${cap} ${tech} kit configured for smooth multitasking and stutter-free gaming performance.`;
        }

        case 'storage': {
            const is4TB = /4\s*tb/i.test(model);
            const is2TB = /2\s*tb/i.test(model);
            const is1TB = /1\s*tb/i.test(model);
            const is500GB = /500\s*gb|512\s*gb/i.test(model);
            const cap = is4TB ? '4TB' : is2TB ? '2TB' : is1TB ? '1TB' : is500GB ? '500GB' : 'High-speed';
            const isNVMe = /nvme|m\.2|pcie/i.test(model) || !/sata|hdd/i.test(model);
            const driveType = isNVMe ? 'NVMe PCIe SSD' : 'Solid-state drive';
            return `${cap} ${driveType} delivering ultra-fast boot times, swift level loading, and responsive system performance.`;
        }

        case 'psu': {
            const wattageMatch = model.match(/\b(\d{3,4})\s*w\b/i) || model.match(/(\d{3,4})w/i);
            const wattage = wattageMatch ? `${wattageMatch[1]}W ` : '';
            const isPlatinum = /platinum/i.test(model);
            const isGold = /gold/i.test(model);
            const isBronze = /bronze/i.test(model);
            const rating = isPlatinum ? '80+ Platinum certified' : isGold ? '80+ Gold certified' : isBronze ? '80+ Bronze certified' : '80+ certified';
            return `${wattage}reliable power supply unit with ${rating} efficiency and built-in circuit protection for stable operation.`;
        }

        case 'case': {
            return `High-airflow chassis designed with mesh intake panels, clean cable routing, and optimal component clearance.`;
        }

        case 'cooler': {
            const isAIO = /(aio|liquid|240|280|360|420|water|kraken|galahad|freeze)/i.test(model);
            if (isAIO) {
                return `All-in-one liquid cooling solution engineered for high thermal dissipation and whisper-quiet pump operation under load.`;
            }
            return `Efficient tower air cooler engineered with direct-contact copper heatpipes for dependable CPU temperature management.`;
        }

        default:
            return '';
    }
}

    const processComponent = useCallback((component: any, type: string): ComponentData | null => {
        if (!component || !component.model) return null;
        const price = component.estimatedPrice || 0;
        let modelName = component.model || "";
        const collection = allParts.filter(p => p.category.toLowerCase() === type.toLowerCase());

        const match = collection.find(p => component.partId && p.id === component.partId) || collection.find((p: any) => {
            const pModel = (p.model || "").toLowerCase();
            const pName = (p.name || "").toLowerCase();
            const normalized = modelName.toLowerCase();
            return (pModel && (normalized.includes(pModel) || pModel.includes(normalized))) ||
                   (pName && (normalized.includes(pName) || pName.includes(normalized)));
        }) as any;

        const effectiveModel = match ? (match.model || match.name) : modelName;

        const aiDescription = (component.description && typeof component.description === 'string')
            ? component.description.trim()
            : "";
        const catalogDescription = match?.description?.trim()
            ? summarizeCatalogDescription(match.description)
            : '';
        const isShortTag = aiDescription.split(/\s+/).length < 9;
        const description = supportingParts.has(type) && (!aiDescription || isShortTag)
            ? catalogDescription || getSmartDescription(type, effectiveModel) || aiDescription
            : aiDescription || catalogDescription || getSmartDescription(type, effectiveModel);

        const fallbackImage = getComponentPlaceholderImage(type, effectiveModel);
        const resolvedImage = (match && match.imageUrl && !match.imageUrl.includes('picsum.photos'))
            ? match.imageUrl
            : fallbackImage;

        return {
            model: effectiveModel,
            description,
            id: match?.id || component.partId || `ai-suggested-${type}`,
            price: match?.price || price,
            icon: componentIcons[type],
            image: resolvedImage,
            imageHint: type,
            wattage: match?.wattage,
            socket: match?.socket,
            ramType: match?.ramType,
            performanceTier: match?.performanceTier,
            performanceScore: match?.performanceScore,
            dimensions: match?.dimensions,
            specifications: match?.specifications,
        };
    }, [allParts]);

    const { object, submit, isLoading, stop, error: streamError } = useObject({
        api: '/api/ai/build-advisor/recommendations',
        schema: AiBuildAdvisorRecommendationsOutputSchema,
        onError: (err) => {
            console.error("[useRecommendationLogic] Stream error:", err);
            let msg = err.message || "Failed to get recommendations.";
            try { msg = JSON.parse(msg).error || msg; } catch { /* Non-JSON provider error. */ }
            setErrorMessage(msg);
            toast({ variant: "destructive", title: "Error", description: msg });
        },
        onFinish: (result) => {
            if (result.object) {
                const finalObj = result.object;
                const completedBuild: Build = {
                    summary: finalObj.summary || "",
                    cpu: processComponent(finalObj.cpu, "cpu"),
                    gpu: processComponent(finalObj.gpu, "gpu"),
                    motherboard: processComponent(finalObj.motherboard, "motherboard"),
                    ram: processComponent(finalObj.ram, "ram"),
                    storage: processComponent(finalObj.storage, "storage"),
                    psu: processComponent(finalObj.psu, "psu"),
                    case: processComponent(finalObj.case, "case"),
                    cooler: processComponent(finalObj.cooler, "cooler"),
                    estimatedWattage: finalObj.estimatedWattage
                };
                const request = lastRequestRef.current;
                const budget = request ? parsePesoBudget(request.budget) : null;
                const limit = budget ? budget * (request?.allowFlexibleBudget ? 1.3 : 1) : null;
                const components = ['cpu', 'gpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cooler'] as const;
                const missingStoreIds = !request?.allowAiSearch && components.some(category => !finalObj[category]?.partId);
                const unknownStoreIds = !request?.allowAiSearch && allParts.length > 0 && components.some(category =>
                    !allParts.some(part => part.id === finalObj[category]?.partId && !part.isArchived &&
                        (typeof part.stock !== 'number' || part.stock > 0)));
                const actualTotal = components.reduce((sum, category) => sum + (completedBuild[category]?.price || 0), 0);
                const compatibility = !request?.allowAiSearch && !unknownStoreIds && allParts.length > 0
                    ? checkFullBuildCompatibility({
                        CPU: completedBuild.cpu,
                        GPU: completedBuild.gpu,
                        Motherboard: completedBuild.motherboard,
                        RAM: completedBuild.ram ? [completedBuild.ram] : [],
                        Storage: completedBuild.storage ? [completedBuild.storage] : [],
                        PSU: completedBuild.psu,
                        Case: completedBuild.case,
                        Cooler: completedBuild.cooler,
                    }).filter(issue => issue.severity === 'critical')
                    : [];
                if (missingStoreIds || unknownStoreIds || compatibility.length > 0 || (limit && actualTotal > limit + 1)) {
                    const message = missingStoreIds || unknownStoreIds
                        ? 'The AI could not verify every suggested part against store inventory. Please try again.'
                        : compatibility.length > 0
                            ? `The suggested parts have a compatibility issue: ${compatibility[0].message}`
                        : `This build exceeds your budget of ₱${budget?.toLocaleString()}. Please try again or enable Flexible Budget.`;
                    setErrorMessage(message);
                    toast({ variant: 'destructive', title: 'Build needs another try', description: message });
                    return;
                }
                setSavedBuild(completedBuild);
                try {
                    localStorage.setItem('pc_ai_build_recommendation', JSON.stringify({
                        build: completedBuild,
                        input: request,
                        timestamp: Date.now(),
                    }));
                } catch (e) {
                    console.warn("Failed to persist recommendation to localStorage:", e);
                }
            }
        }
    });

    // Elapsed timer logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isLoading) {
            setFinalResponseTime(null);
            setErrorMessage(null);
            const start = generationStartTimeRef.current ?? Date.now();
            generationStartTimeRef.current = start;
            setElapsedTime(0);
            interval = setInterval(() => {
                setElapsedTime(Math.round((Date.now() - start) / 1000));
            }, 1000);
        } else if (generationStartTimeRef.current) {
            const finalSeconds = Math.round((Date.now() - generationStartTimeRef.current) / 100) / 10;
            setFinalResponseTime(finalSeconds);
            setElapsedTime(Math.round(finalSeconds));
            generationStartTimeRef.current = null;
        }
        return () => clearInterval(interval);
    }, [isLoading]);

    useEffect(() => {
        if (!isLoading || !object || !generationStartTimeRef.current) return;
        const elapsedMs = Date.now() - generationStartTimeRef.current;
        if (!firstPartialReportedRef.current && Object.keys(object).length > 0) {
            firstPartialReportedRef.current = true;
            console.info('[Build Advisor Timing]', JSON.stringify({ path: 'recommendation_client', event: 'first_partial', elapsedMs }));
        }
        if (!firstCardReportedRef.current && ['cpu', 'gpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cooler']
            .some(category => (object as any)[category]?.model)) {
            firstCardReportedRef.current = true;
            console.info('[Build Advisor Timing]', JSON.stringify({ path: 'recommendation_client', event: 'first_card', elapsedMs }));
        }
    }, [isLoading, object]);

    const handleCancelRecommendations = useCallback(() => {
        stop();
        toast({
            title: "Recommendation Cancelled",
            description: "Generation stopped.",
        });
    }, [stop, toast]);

    const handleGetRecommendations = useCallback((data: AiBuildAdvisorRecommendationsInput) => {
        if (isAiKillSwitch) {
            toast({ title: "AI Disabled", description: "AI is disabled by Administrator.", variant: "destructive" });
            return;
        }
        setErrorMessage(null);
        setSavedBuild(null);
        lastRequestRef.current = data;
        generationStartTimeRef.current = Date.now();
        firstPartialReportedRef.current = false;
        firstCardReportedRef.current = false;
        submit(data);
    }, [isAiKillSwitch, submit, toast]);

    // Live reactive build
    const build = useMemo<Build | null>(() => {
        if (isLoading && object) {
            return {
                summary: object.summary || "Synthesizing build recommendations...",
                cpu: processComponent(object.cpu, "cpu"),
                gpu: processComponent(object.gpu, "gpu"),
                motherboard: processComponent(object.motherboard, "motherboard"),
                ram: processComponent(object.ram, "ram"),
                storage: processComponent(object.storage, "storage"),
                psu: processComponent(object.psu, "psu"),
                case: processComponent(object.case, "case"),
                cooler: processComponent(object.cooler, "cooler"),
                estimatedWattage: object.estimatedWattage || undefined
            };
        }
        if (!savedBuild || allParts.length === 0) return savedBuild;
        const categories = ['cpu', 'gpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cooler'] as const;
        const refreshed = { ...savedBuild };
        for (const category of categories) {
            const part = savedBuild[category];
            if (part) refreshed[category] = processComponent({ ...part, partId: part.id, estimatedPrice: part.price }, category);
        }
        return refreshed;
    }, [isLoading, object, savedBuild, processComponent, allParts.length]);

    const totalPrice = useMemo(() => {
        if (!build) return 0;
        return Object.values(build)
            .filter(v => typeof v === 'object' && v !== null && 'price' in v)
            .reduce((acc, curr: any) => acc + (curr?.price || 0), 0);
    }, [build]);

    const setBuild = useCallback((newBuild: Build | null) => {
        setSavedBuild(newBuild);
        if (newBuild) {
            try {
                localStorage.setItem('pc_ai_build_recommendation', JSON.stringify({
                    build: newBuild,
                    input: lastRequestRef.current,
                    timestamp: Date.now(),
                }));
            } catch (e) { }
        } else {
            localStorage.removeItem('pc_ai_build_recommendation');
        }
    }, []);

    const setTotalPrice = useCallback((_price: number) => {
        // Managed reactively via useMemo
    }, []);

    const effectiveError = errorMessage || (streamError ? streamError.message : null);

    return {
        build,
        setBuild,
        totalPrice,
        setTotalPrice,
        isPending: isLoading,
        handleGetRecommendations,
        handleCancelRecommendations,
        elapsedTime,
        finalResponseTime,
        error: effectiveError
    };
}
