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

const componentIcons: Record<string, any> = {
  cpu: Cpu, gpu: Server, motherboard: CircuitBoard, ram: MemoryStick, 
  storage: Database, psu: Power, case: RectangleVertical, cooler: Wind
};

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

    // Load initial build from localStorage
    useEffect(() => {
        try {
            const cached = localStorage.getItem('pc_ai_build_recommendation');
            if (cached) {
                setSavedBuild(JSON.parse(cached));
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
        let price = component.estimatedPrice || 0;
        let modelName = component.model || "";
        const collection = allParts.filter(p => p.category.toLowerCase() === type.toLowerCase());

        const match = collection.find((p: any) => {
            const pModel = (p.model || "").toLowerCase();
            const pName = (p.name || "").toLowerCase();
            const normalized = modelName.toLowerCase();
            return (pModel && (normalized.includes(pModel) || pModel.includes(normalized))) ||
                   (pName && (normalized.includes(pName) || pName.includes(normalized)));
        }) as any;

        const effectiveModel = match ? (match.model || match.name) : modelName;

        // Dynamic description resolution
        let description = (component.description && typeof component.description === 'string')
            ? component.description.trim()
            : "";

        if (!description) {
            if (match && match.description?.trim()) {
                description = match.description.trim();
            } else {
                description = getSmartDescription(type, effectiveModel);
            }
        }

        const fallbackImage = getComponentPlaceholderImage(type, effectiveModel);
        const resolvedImage = (match && match.imageUrl && !match.imageUrl.includes('picsum.photos'))
            ? match.imageUrl
            : fallbackImage;

        return {
            model: effectiveModel,
            description,
            id: match ? match.id : `ai-suggested-${type}`,
            price: (price === 0 && match?.price) ? match.price : price,
            icon: componentIcons[type],
            image: resolvedImage,
            imageHint: type,
        };
    }, [allParts]);

    const { object, submit, isLoading, stop, error: streamError } = useObject({
        api: '/api/ai/build-advisor/recommendations',
        schema: AiBuildAdvisorRecommendationsOutputSchema,
        onError: (err) => {
            console.error("[useRecommendationLogic] Stream error:", err);
            const msg = err.message || "Failed to get recommendations.";
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
                setSavedBuild(completedBuild);
                try {
                    localStorage.setItem('pc_ai_build_recommendation', JSON.stringify(completedBuild));
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
            const start = Date.now();
            generationStartTimeRef.current = start;
            setElapsedTime(0);
            interval = setInterval(() => {
                setElapsedTime(Math.round((Date.now() - start) / 1000));
            }, 100);
        } else if (generationStartTimeRef.current) {
            const finalSeconds = Math.round((Date.now() - generationStartTimeRef.current) / 100) / 10;
            setFinalResponseTime(finalSeconds);
            setElapsedTime(Math.round(finalSeconds));
            generationStartTimeRef.current = null;
        }
        return () => clearInterval(interval);
    }, [isLoading]);

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
        return savedBuild;
    }, [isLoading, object, savedBuild, processComponent]);

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
                localStorage.setItem('pc_ai_build_recommendation', JSON.stringify(newBuild));
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
