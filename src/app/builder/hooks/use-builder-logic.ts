"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Part, ComponentData, Build, FavoriteBuild } from '@/lib/types';
import { checkCompatibility } from "@/lib/compatibility";
import { INCLUDED_INTEGRATED_GPU_ID, isIncludedIntegratedGpu, syncIntegratedGraphics } from '@/lib/integrated-graphics';
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

const isIncludedStockCooler = (component: ComponentData | null | undefined) =>
    component?.id === 'included-stock-cooler'
    || component?.id === 'uGiAh2JerLwnDe5VW431'
    || (component?.price === 0 && (
        component.imageHint === 'included cooler'
        || component.description?.includes('Bundled cooler')
        || component.model?.toLowerCase().includes('stock cooler')
        || component.model?.toLowerCase().includes('laminar')
        || component.model?.toLowerCase().includes('wraith')
    ));

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
    const hasRestoredBuildRef = useRef(false);
    const hasProcessedPendingBuildRef = useRef(false);

    // Persistence
    useEffect(() => {
        // React Strict Mode replays mount effects in development. Restoring only
        // once prevents that replay from replacing a freshly imported pre-built
        // with the older persisted draft after the transfer payload is consumed.
        if (hasRestoredBuildRef.current) return;
        hasRestoredBuildRef.current = true;

        const saved = localStorage.getItem('pc_builder_state');
        if (saved) {
            try {
                const parsedState = JSON.parse(saved);
                if (!parsedState.CPU && isIncludedStockCooler(parsedState.Cooler)) {
                    parsedState.Cooler = null;
                }
                setBuild(prev => syncIntegratedGraphics({ ...prev, ...parsedState }));
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
        toast({ title: 'Your build cleared.' });
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

            if (category === 'Motherboard') {
                const dependentParts = ['CPU', 'GPU', 'RAM', 'Storage', 'PSU', 'Cooler'];
                dependentParts.forEach(key => {
                    if (key === 'RAM' || key === 'Storage') next[key] = [];
                    else next[key] = null;
                });
                toastMsg = { title: 'Components Removed', description: 'Removing the motherboard removes all dependent internal parts.' };
            }

            const currentCooler = next['Cooler'] as ComponentData | null;
            if (category === 'CPU' && isIncludedStockCooler(currentCooler)) {
                next['Cooler'] = null;
                toastMsg = { title: 'Cooler Removed', description: 'Stock cooler removed with its CPU.' };
            }
        }

        if (category === 'GPU' && isIncludedIntegratedGpu(build.GPU as ComponentData | null)) {
            next.CPU = null;
            if (isIncludedStockCooler(next.Cooler as ComponentData | null)) next.Cooler = null;
        }
        setBuild(syncIntegratedGraphics(next));
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

        // Sequence Validation (Removed)

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
                socket: part.specifications?.['Socket']?.toString() || part.specifications?.['socket']?.toString() || part.socket,
                ramType: part.specifications?.['Memory Type']?.toString() || part.specifications?.['RAM Type']?.toString() || part.ramType,
                performanceScore: part.performanceScore,
                performanceTier: part.performanceTier,
                specifications: part.specifications,
                dimensions: part.dimensions,
            };

            const currentItems = Array.isArray(nextBuild[category]) ? (nextBuild[category] as ComponentData[]) : [];
            nextBuild[category] = [...currentItems, componentData];
            setBuild(syncIntegratedGraphics(nextBuild));
            toast({ title: 'Part Added', description: `${part.name} added.` });
            return;
        }

        if (isCurrentlySelected) {
            nextBuild[category] = null;
            if (category === 'Motherboard') {
                const dependentParts = ['CPU', 'GPU', 'RAM', 'Storage', 'PSU', 'Cooler'];
                dependentParts.forEach(key => {
                    if (key === 'RAM' || key === 'Storage') nextBuild[key] = [];
                    else nextBuild[key] = null;
                });
                toastsToShow.push({ title: 'Components Removed', description: 'Motherboard removed.' });
            }

            const currentCooler = nextBuild['Cooler'] as ComponentData | null;
            if (category === 'CPU' && isIncludedStockCooler(currentCooler)) {
                nextBuild['Cooler'] = null;
                toastsToShow.push({ title: 'Cooler Removed', description: 'Stock cooler removed.' });
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
                const dependentParts = ['Motherboard', 'CPU', 'GPU', 'RAM', 'Storage', 'PSU', 'Cooler'];
                dependentParts.forEach(key => {
                    if (key === 'RAM' || key === 'Storage') nextBuild[key] = [];
                    else nextBuild[key] = null;
                });
                toastsToShow.push({ title: 'Build Updated', description: 'Case changed.' });
            } else if (category === 'Motherboard' && prevBuildCopy[category] && (prevBuildCopy[category] as ComponentData).id !== componentData.id) {
                const dependentParts = ['CPU', 'GPU', 'RAM', 'Storage', 'PSU', 'Cooler'];
                dependentParts.forEach(key => {
                    if (key === 'RAM' || key === 'Storage') nextBuild[key] = [];
                    else nextBuild[key] = null;
                });
                toastsToShow.push({ title: 'Build Updated', description: 'Motherboard changed.' });
            }

            if (category === 'CPU') {
                const isBoxed = part.packageType === 'BOX' ||
                    (part as any).specifications?.['Package Type']?.toString().toUpperCase() === 'BOX';
                if (isBoxed) {
                    const isIntel = part.brand.toLowerCase().includes('intel');
                    const isAmd = part.brand.toLowerCase().includes('amd');
                    const coolerModel = isIntel ? "Intel Laminar RM1 CPU Cooler" : isAmd ? "AMD Wraith MAX CPU Cooler with RGB LED" : "Stock Cooler";
                    nextBuild['Cooler'] = {
                        // Bundled coolers use a reserved identity so CPU removal and
                        // boxed-to-tray CPU replacement can clean them up reliably.
                        id: 'included-stock-cooler',
                        model: coolerModel,
                        price: 0,
                        description: `Bundled cooler.`,
                        image: "/placeholders/components/cooler.jpg",
                        imageHint: "included cooler",
                        icon: Wind,
                        wattage: 0,
                        specifications: { "Type": "Air (Stock)" }
                    };
                } else if (isIncludedStockCooler(nextBuild['Cooler'] as ComponentData | null)) {
                    nextBuild['Cooler'] = null;
                }
            }
            toastsToShow.push({ title: 'Part Added', description: `${part.name} added.` });
        }

        setBuild(syncIntegratedGraphics(nextBuild));
        toastsToShow.forEach(t => toast(t));
    }, [build, toast, getCountInBuild]);

    // AI suggestion matching
    useEffect(() => {
        const findPartRobustly = (suggestion?: string, partId?: string) => {
            if (partId) {
                const part = allParts.find(p => p.id === partId);
                if (part) return part;
            }
            if (!suggestion) return null;
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

    // Favorite loading handler
    const loadFavoriteBuild = useCallback((favorite: FavoriteBuild) => {
        if (!allParts.length) return;

        const newBuild: Record<string, ComponentData | ComponentData[] | null> = {
            CPU: null, GPU: null, Motherboard: null, RAM: [], Storage: [], PSU: null, Case: null, Cooler: null,
            Monitor: null, Keyboard: null, Mouse: null, Headset: null,
        };
        const skipped: string[] = [];
        const outOfStock: string[] = [];

        for (const favPart of favorite.parts) {
            if (favPart.category === 'GPU' && favPart.partId === INCLUDED_INTEGRATED_GPU_ID) continue;
            const livePart = allParts.find(p => p.id === favPart.partId || (favPart.name && p.name.toLowerCase() === favPart.name.toLowerCase()));
            if (!livePart) {
                skipped.push(favPart.name);
                continue;
            }
            if (livePart.stock <= 0 || livePart.isArchived) {
                outOfStock.push(favPart.name);
                continue;
            }

            const componentData: ComponentData = {
                id: livePart.id,
                model: livePart.name,
                price: livePart.price,
                description: Object.entries(livePart.specifications || {}).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(' | '),
                image: livePart.imageUrl,
                imageHint: livePart.name.toLowerCase().split(' ').slice(0, 2).join(' '),
                icon: componentIcons[favPart.category],
                wattage: livePart.wattage,
                socket: livePart.specifications?.['Socket']?.toString() || livePart.specifications?.['socket']?.toString() || livePart.socket,
                ramType: livePart.specifications?.['Memory Type']?.toString() || livePart.specifications?.['RAM Type']?.toString() || livePart.ramType,
                performanceScore: livePart.performanceScore,
                performanceTier: livePart.performanceTier,
                specifications: livePart.specifications,
                dimensions: livePart.dimensions,
            };

            if (favPart.category === 'RAM' || favPart.category === 'Storage') {
                const arr = newBuild[favPart.category] as ComponentData[];
                arr.push(componentData);
                newBuild[favPart.category] = arr;
            } else {
                newBuild[favPart.category] = componentData;
            }
        }

        setBuild(syncIntegratedGraphics(newBuild));

        if (favorite.loadContext) {
            const unavailableParts = Array.from(new Set([
                ...favorite.loadContext.unavailableParts,
                ...skipped,
                ...outOfStock,
            ]));
            const loadedCount = favorite.parts.length - skipped.length - outOfStock.length;
            const isAdvisorBuild = favorite.loadContext.type === 'advisor';

            if (unavailableParts.length > 0) {
                toast({
                    variant: 'warning',
                    title: `${isAdvisorBuild ? 'Build Advisor recommendation' : 'Pre-built'} loaded with ${unavailableParts.length} missing part${unavailableParts.length === 1 ? '' : 's'}`,
                    description: `${loadedCount} available component${loadedCount === 1 ? '' : 's'} loaded. Add ${unavailableParts.join(', ')} to complete ${isAdvisorBuild ? 'your recommended build' : favorite.loadContext.systemName}.`,
                });
            } else {
                toast({
                    title: isAdvisorBuild ? 'Build Advisor recommendation loaded' : 'Pre-built loaded into PC Builder',
                    description: isAdvisorBuild
                        ? `${loadedCount} recommended components are ready to customize.`
                        : `${loadedCount} components from ${favorite.loadContext.systemName} are ready to customize.`,
                });
            }
            return;
        }

        if (skipped.length > 0) {
            toast({
                variant: 'destructive',
                title: `${skipped.length} part(s) no longer available`,
                description: skipped.join(', '),
            });
        }
        if (outOfStock.length > 0) {
            toast({
                title: `${outOfStock.length} part(s) out of stock`,
                description: outOfStock.join(', '),
            });
        }
    }, [allParts, setBuild, toast]);

    // Listen for load-favorite-build event
    useEffect(() => {
        const handleLoadFavorite = (e: any) => {
            loadFavoriteBuild(e.detail as FavoriteBuild);
        };

        window.addEventListener('load-favorite-build', handleLoadFavorite);

        // Also check if there's a pending favorite in localStorage (from profile page redirect)
        if (allParts.length > 0 && !hasProcessedPendingBuildRef.current) {
            const pending = localStorage.getItem('pc_builder_load_favorite');
            if (pending) {
                try {
                    const pendingBuild = JSON.parse(pending) as FavoriteBuild;
                    hasProcessedPendingBuildRef.current = true;
                    loadFavoriteBuild(pendingBuild);
                    localStorage.removeItem('pc_builder_load_favorite');
                } catch (e) { /* ignore parse errors */ }
            }
        }

        return () => {
            window.removeEventListener('load-favorite-build', handleLoadFavorite);
        };
    }, [allParts, loadFavoriteBuild]);

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
