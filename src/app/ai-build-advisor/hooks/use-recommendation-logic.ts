"use client";

import { useState, useTransition, useEffect } from 'react';
import { getAiRecommendations } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import type { Build, AiRecommendation } from "@/lib/types";
import type { AiBuildAdvisorRecommendationsInput } from "@/ai/flows/ai-build-advisor-recommendations";
import { Cpu, Server, CircuitBoard, MemoryStick, Database, Power, RectangleVertical, Wind } from "lucide-react";

const componentIcons: Record<string, any> = {
  cpu: Cpu, gpu: Server, motherboard: CircuitBoard, ram: MemoryStick, 
  storage: Database, psu: Power, case: RectangleVertical, cooler: Wind
};

/**
 * Hook to handle AI build recommendations and processing.
 */
export function useRecommendationLogic(isAiKillSwitch: boolean, collections: any) {
    const { toast } = useToast();
    const [build, setBuild] = useState<Build | null>(null);
    const [totalPrice, setTotalPrice] = useState(0);
    const [isPending, startTransition] = useTransition();
    const [elapsedTime, setElapsedTime] = useState(0);
    const [finalResponseTime, setFinalResponseTime] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPending) {
            setFinalResponseTime(null);
            const start = Date.now();
            interval = setInterval(() => {
                setElapsedTime(Math.round((Date.now() - start) / 1000));
            }, 100);
        } else if (elapsedTime > 0) {
            setFinalResponseTime(elapsedTime);
        }
        return () => clearInterval(interval);
    }, [isPending]);

    const handleGetRecommendations = (data: AiBuildAdvisorRecommendationsInput) => {
        if (isAiKillSwitch) {
            toast({ title: "AI Disabled", description: "AI is disabled by Administrator.", variant: "destructive" });
            return;
        }
        setError(null);
        startTransition(async () => {
            const result = await getAiRecommendations(data);
            if (!result || "error" in result) {
                const errorMsg = (result as any)?.error || "Failed to get recommendations.";
                setError(errorMsg);
                toast({ variant: "destructive", title: "Error", description: errorMsg });
                return;
            }

            const processComponent = (component: any, type: string) => {
                let price = component.estimatedPrice || 0;
                let modelName = component.model || "";
                let description = component.description || "";
                let collection = (collections as any)[`${type}s`] || [];

                const match = collection.find((p: any) => {
                    const pModel = (p.model || "").toLowerCase();
                    const pName = (p.name || "").toLowerCase();
                    const normalized = modelName.toLowerCase();
                    return (pModel && (normalized.includes(pModel) || pModel.includes(normalized))) ||
                           (pName && (normalized.includes(pName) || pName.includes(normalized)));
                });

                return {
                    model: match ? (match.model || match.name) : modelName,
                    description,
                    id: match ? match.id : `ai-suggested-${type}`,
                    price: (price === 0 && match?.price) ? match.price : price,
                    icon: componentIcons[type],
                    image: match ? match.imageUrl : `https://picsum.photos/seed/${type}/800/600`,
                    imageHint: type,
                };
            };

            const newBuild: Build = {
                summary: result.summary,
                cpu: processComponent(result.cpu, "cpu"),
                gpu: processComponent(result.gpu, "gpu"),
                motherboard: processComponent(result.motherboard, "motherboard"),
                ram: processComponent(result.ram, "ram"),
                storage: processComponent(result.storage, "storage"),
                psu: processComponent(result.psu, "psu"),
                case: processComponent(result.case, "case"),
                cooler: processComponent(result.cooler, "cooler"),
                estimatedWattage: result.estimatedWattage
            };

            setBuild(newBuild);
            localStorage.setItem('pc_ai_build_recommendation', JSON.stringify(newBuild));
            
            const total = Object.values(newBuild).filter(v => typeof v === 'object' && v !== null && 'price' in v)
                .reduce((acc, curr: any) => acc + (curr.price || 0), 0);
            setTotalPrice(total);
        });
    };

    return {
        build, setBuild, totalPrice, setTotalPrice,
        isPending, handleGetRecommendations,
        elapsedTime, finalResponseTime, error
    };
}
