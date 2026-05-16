"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Part, ComponentData, Build } from '@/lib/types';
import { checkCompatibility } from "@/lib/compatibility";
import { useToast } from "@/hooks/use-toast";
import { 
    Cpu, Server, CircuitBoard, MemoryStick, Database, Power, 
    RectangleVertical, Wind, Monitor, Keyboard, Mouse, Headphones 
} from "lucide-react";

const componentIcons: Record<string, any> = {
  CPU: Cpu, GPU: Server, Motherboard: CircuitBoard, RAM: MemoryStick, 
  Storage: Database, PSU: Power, Case: RectangleVertical, Cooler: Wind, 
  Monitor: Monitor, Keyboard: Keyboard, Mouse: Mouse, Headset: Headphones
};

/**
 * Hook to manage the PC build logic, including part toggling, removal, and compatibility.
 */
export function useBuilderLogic(allParts: Part[]) {
    const { toast } = useToast();
    const [build, setBuild] = useState<Record<string, ComponentData | ComponentData[] | null>>({
        CPU: null, GPU: null, Motherboard: null, RAM: [], Storage: [], PSU: null, Case: null, Cooler: null,
        Monitor: null, Keyboard: null, Mouse: null, Headset: null,
    });
    const [isLoaded, setIsLoaded] = useState(false);

    // Persistence
    useEffect(() => {
        const saved = localStorage.getItem('pc_builder_state');
        if (saved) {
            try {
                const parsedState = JSON.parse(saved);
                setBuild(prev => ({ ...prev, ...parsedState }));
            } catch (e) {
                console.error("Failed to parse saved build", e);
            }
        }
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('pc_builder_state', JSON.stringify(build));
        }
    }, [build, isLoaded]);

    const getCountInBuild = useCallback((partName: string) => {
        let count = 0;
        Object.entries(build).forEach(([category, data]) => {
            if (Array.isArray(data)) {
                count += data.filter(d => d.model === partName).length;
            } else if (data && data.model === partName) {
                count++;
            }
        });
        return count;
    }, [build]);

    const handleClearBuild = () => {
        setBuild({
            CPU: null, GPU: null, Motherboard: null, RAM: [], Storage: [], PSU: null, Case: null, Cooler: null,
            Monitor: null, Keyboard: null, Mouse: null, Headset: null,
        });
        toast({ title: 'Build Cleared', description: 'Your build has been reset.' });
    };

    const handleRemovePart = (category: string, index?: number) => {
        let next = { ...build };
        let toastMsg: { title: string; description: string } | null = null;

        if ((category === 'Storage' || category === 'RAM') && typeof index === 'number') {
            const currentItems = [...(next[category] as ComponentData[])];
            currentItems.splice(index, 1);
            next[category] = currentItems;
        } else {
            next[category] = null;

            if (category === 'Case') {
                Object.keys(next).forEach(key => {
                    if (key === 'RAM' || key === 'Storage') next[key] = [];
                    else next[key] = null;
                });
                toastMsg = { title: 'Build Reset', description: 'Removing the case removes all other components.' };
            } else if (category === 'Motherboard') {
                Object.keys(next).forEach(key => {
                    if (key !== 'Case') {
                        if (key === 'RAM' || key === 'Storage') next[key] = [];
                        else next[key] = null;
                    }
                });
                toastMsg = { title: 'Components Removed', description: 'Changing or removing the motherboard removes all dependent parts.' };
            }

            const currentCooler = next['Cooler'] as ComponentData | null;
            if (category === 'CPU' && currentCooler?.id === 'included-stock-cooler') {
                next['Cooler'] = null;
                toastMsg = { title: 'Cooler Removed', description: 'Stock cooler removed with its CPU.' };
            }
        }

        setBuild(next);
        if (toastMsg) toast(toastMsg);
    };

    const handlePartToggle = useCallback((part: Part) => {
        const category = part.category;
        let nextBuild = { ...build };
        const toastsToShow: { title: string; description: string; variant?: "default" | "destructive" }[] = [];

        // Determine if we are removing an existing part
        const isCurrentlySelected = (category === 'Storage' || category === 'RAM') 
            ? false 
            : (build[category] as ComponentData)?.model === part.name;

        // Sequence Validation (Only enforce when adding new parts)
        if (!isCurrentlySelected) {
            if (category !== 'Case' && !build['Case']) {
                toast({ variant: 'destructive', title: 'Sequence Required', description: 'Please select a Case first to establish physical dimensions.' });
                return;
            }
            if (category !== 'Case' && category !== 'Motherboard' && !build['Motherboard']) {
                toast({ variant: 'destructive', title: 'Sequence Required', description: 'Please select a Motherboard next to establish socket compatibility.' });
                return;
            }
            // Enforce CPU next for all internal performance components
            const internalComponents = ['GPU', 'RAM', 'Storage', 'PSU', 'Cooler'];
            if (internalComponents.includes(category) && !build['CPU']) {
                toast({ variant: 'destructive', title: 'Sequence Required', description: 'Please select a CPU next to establish core performance baseline.' });
                return;
            }
        }

        const { compatible, message } = checkCompatibility(part, build);

        if (category === 'Storage' || category === 'RAM') {
            if (!compatible) {
                toast({ variant: 'destructive', title: 'Compatibility Error', description: message });
                return;
            }

            const currentCount = getCountInBuild(part.name);
            if (currentCount >= part.stock) {
                toast({ variant: 'destructive', title: 'Out of Stock', description: `No more units of ${part.name} available.` });
                return;
            }

            const componentData: ComponentData = {
                id: part.id,
                model: part.name,
                price: part.price,
                description: Object.entries(part.specifications || {}).slice(0, 2).map(([key, value]) => `${key}: ${value}`).join(' | '),
                image: part.imageUrl,
                imageHint: part.name.toLowerCase().split(' ').slice(0, 2).join(' '),
                icon: componentIcons[category],
                wattage: part.wattage,
                socket: part.socket || part.specifications?.['Socket']?.toString(),
                ramType: part.ramType || part.specifications?.['Memory Type']?.toString(),
                performanceScore: part.performanceScore,
                performanceTier: part.performanceTier,
                specifications: part.specifications,
                dimensions: part.dimensions,
            };

            const currentItems = Array.isArray(nextBuild[category]) ? (nextBuild[category] as ComponentData[]) : [];
            nextBuild[category] = [...currentItems, componentData];
            setBuild(nextBuild);
            toast({ title: 'Part Added', description: `${part.name} added.` });
            return;
        }

        if (isCurrentlySelected) {
            nextBuild[category] = null;
            if (category === 'Case') {
                Object.keys(nextBuild).forEach(key => {
                    if (key === 'RAM' || key === 'Storage') nextBuild[key] = [];
                    else nextBuild[key] = null;
                });
                toastsToShow.push({ title: 'Build Reset', description: 'Case removed.' });
            } else if (category === 'Motherboard') {
                Object.keys(nextBuild).forEach(key => {
                    if (key !== 'Case') {
                        if (key === 'RAM' || key === 'Storage') nextBuild[key] = [];
                        else nextBuild[key] = null;
                    }
                });
                toastsToShow.push({ title: 'Components Removed', description: 'Motherboard removed.' });
            }
            toastsToShow.push({ title: 'Part Removed', description: `${part.name} removed.` });
        } else {
            if (!compatible) {
                toast({ variant: 'destructive', title: 'Compatibility Error', description: message });
                return;
            }

            if (getCountInBuild(part.name) >= part.stock) {
                toast({ variant: 'destructive', title: 'Out of Stock', description: 'Unavailable.' });
                return;
            }

            const componentData: ComponentData = {
                id: part.id,
                model: part.name,
                price: part.price,
                description: Object.entries(part.specifications || {}).slice(0, 2).map(([key, value]) => `${key}: ${value}`).join(' | '),
                image: part.imageUrl,
                imageHint: part.name.toLowerCase().split(' ').slice(0, 2).join(' '),
                icon: componentIcons[category],
                wattage: part.wattage,
                socket: part.specifications?.['Socket']?.toString(),
                ramType: part.specifications?.['Memory Type']?.toString(),
                performanceScore: part.performanceScore,
                performanceTier: part.performanceTier,
                specifications: part.specifications,
                dimensions: part.dimensions,
            };

            const prevBuildCopy = { ...nextBuild };
            nextBuild[category] = componentData;

            if (category === 'Case' && prevBuildCopy[category] && (prevBuildCopy[category] as ComponentData).id !== componentData.id) {
                Object.keys(nextBuild).forEach(key => {
                    if (key !== 'Case') {
                        if (key === 'RAM' || key === 'Storage') nextBuild[key] = [];
                        else nextBuild[key] = null;
                    }
                });
                toastsToShow.push({ title: 'Build Updated', description: 'Case changed.' });
            } else if (category === 'Motherboard' && prevBuildCopy[category] && (prevBuildCopy[category] as ComponentData).id !== componentData.id) {
                Object.keys(nextBuild).forEach(key => {
                    if (key !== 'Case' && key !== 'Motherboard') {
                        if (key === 'RAM' || key === 'Storage') nextBuild[key] = [];
                        else nextBuild[key] = null;
                    }
                });
                toastsToShow.push({ title: 'Build Updated', description: 'Motherboard changed.' });
            }

            if (category === 'CPU') {
                if (part.packageType === 'BOX') {
                    const isIntel = part.brand.toLowerCase().includes('intel');
                    const isAmd = part.brand.toLowerCase().includes('amd');
                    const coolerModel = isIntel ? "Intel Laminar RM1 CPU Cooler" : isAmd ? "AMD Wraith MAX CPU Cooler with RGB LED" : "Stock Cooler";
                    nextBuild['Cooler'] = {
                        id: isAmd ? 'uGiAh2JerLwnDe5VW431' : 'included-stock-cooler',
                        model: coolerModel,
                        price: 0,
                        description: `Bundled cooler.`,
                        image: "https://picsum.photos/seed/stockcooler/800/600",
                        imageHint: "included cooler",
                        icon: Wind,
                        wattage: 0,
                        specifications: { "Type": "Air (Stock)" }
                    };
                } else if (part.packageType === 'TRAY' && (nextBuild['Cooler'] as ComponentData)?.id === 'included-stock-cooler') {
                    nextBuild['Cooler'] = null;
                }
            }
            toastsToShow.push({ title: 'Part Added', description: `${part.name} added.` });
        }

        setBuild(nextBuild);
        toastsToShow.forEach(t => toast(t));
    }, [build, toast, getCountInBuild]);

    // AI suggestion matching
    useEffect(() => {
        const findPartRobustly = (suggestion: string, partId?: string) => {
            if (partId) {
                const part = allParts.find(p => p.id === partId);
                if (part) return part;
            }
            let part = allParts.find(p => p.name.toLowerCase() === suggestion.toLowerCase());
            if (part) return part;
            const cleanSuggestion = suggestion.replace(/\s*\(.*?\)\s*/g, '').trim().toLowerCase();
            part = allParts.find(p => p.name.toLowerCase() === cleanSuggestion);
            if (part) return part;
            part = allParts.find(p => p.name.toLowerCase().includes(cleanSuggestion) || cleanSuggestion.includes(p.name.toLowerCase()));
            if (part) return part;
            return null;
        };

        const handleAddSuggestion = (e: any) => {
            const part = findPartRobustly(e.detail.model, e.detail.id);
            if (part) handlePartToggle(part);
            else toast({ variant: "destructive", title: "Part Not Found", description: `Could not find "${e.detail.model}".` });
        };

        (window as any).__BOT_ADD_PART__ = (modelName: string, partId?: string) => {
            const part = findPartRobustly(modelName, partId);
            if (part) handlePartToggle(part);
        };

        window.addEventListener('add-suggestion', handleAddSuggestion);
        return () => {
            window.removeEventListener('add-suggestion', handleAddSuggestion);
            delete (window as any).__BOT_ADD_PART__;
        };
    }, [allParts, handlePartToggle, toast]);

    return {
        build,
        setBuild,
        handlePartToggle,
        handleRemovePart,
        handleClearBuild,
        getCountInBuild,
        isLoaded
    };
}
