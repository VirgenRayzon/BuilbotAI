"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { useUserProfile } from "@/context/user-profile";
import { useToast } from "@/hooks/use-toast";
import { reservePrebuiltSystem } from "@/app/prebuilt-reservation-actions";
import { getAiPrebuiltPerformance } from "@/app/actions";
import { getMissingParts, getPrebuiltPartStatuses, type ResolvedPrebuiltPart } from "@/lib/prebuilt-utils";
import { inventoryItemPath, inventoryItemsPath } from "@/lib/inventory-paths";
import type { PrebuiltSystem, Part, FavoriteBuild, FavoriteBuildPart } from "@/lib/types";
import { useProductSaveOperation } from '@/hooks/use-product-save-operation';

export function usePrebuiltDetails(systemId: string) {
    const { getOperation } = useProductSaveOperation();
    const [system, setSystem] = useState<PrebuiltSystem | null>(null);
    const [loadingSystem, setLoadingSystem] = useState(true);

    const [components, setComponents] = useState<Record<string, Part | null>>({});
    const [resolvedParts, setResolvedParts] = useState<ResolvedPrebuiltPart[]>([]);
    const [resolvedSystemId, setResolvedSystemId] = useState<string | null>(null);
    const [loadingParts, setLoadingParts] = useState(false);

    const [localAnalysis, setLocalAnalysis] = useState<any>(null);
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);

    const [isReserving, setIsReserving] = useState(false);

    const { profile, authUser } = useUserProfile();
    const { toast } = useToast();
    const firestore = useFirestore();
    const router = useRouter();
    const searchParams = useSearchParams();

    const fromAdmin = searchParams.get("from") === "admin";
    const isStaff = Boolean(profile?.isManager || profile?.isSuperAdmin || fromAdmin);
    const isManagerOrAdmin = Boolean(profile?.isManager || profile?.isSuperAdmin);
    const canGenerateReport = isManagerOrAdmin;

    const analysis = system?.aiReport || localAnalysis;
    const missingParts = system ? getMissingParts(system) : [];
    const isComplete = system ? missingParts.length === 0 : false;
    const componentStatuses = system ? getPrebuiltPartStatuses(system, resolvedParts) : [];
    const unavailableParts = componentStatuses.filter(part => part.issue !== null);
    const isInStock = resolvedSystemId === system?.id && unavailableParts.length === 0;

    const backLink = isStaff ? "/admin?tab=prebuilts" : "/";
    const backText = isStaff ? "Back to Prebuilts Management" : "Back to Landing Page";

    // 1. Fetch System
    useEffect(() => {
        if (!firestore || !systemId) return;

        const fetchSystem = async () => {
            try {
                const docRef = doc(firestore, "prebuiltSystems", systemId);
                const snap = await getDoc(docRef);

                if (snap.exists()) {
                    const data = snap.data() as PrebuiltSystem;
                    if (data.isArchived && !isManagerOrAdmin) {
                        toast({
                            title: "Access Denied",
                            description: "This system is no longer available.",
                            variant: "destructive",
                        });
                        router.push("/");
                        return;
                    }
                    setSystem({ ...data, id: snap.id });
                } else {
                    toast({
                        title: "System Not Found",
                        description: "The prebuilt system you are looking for does not exist.",
                        variant: "destructive",
                    });
                }
            } catch (error) {
                console.error("Error fetching system:", error);
            } finally {
                setLoadingSystem(false);
            }
        };

        fetchSystem();
    }, [firestore, systemId, isManagerOrAdmin, router, toast]);

    // 2. Fetch Components
    useEffect(() => {
        if (!system || !firestore || resolvedSystemId === system.id) return;

        const fetchComponents = async () => {
            setLoadingParts(true);
            const partsRecord: Record<string, Part | null> = {};

            try {
                const collectionMap: Record<string, string> = {
                    cpu: "CPU",
                    gpu: "GPU",
                    motherboard: "Motherboard",
                    ram: "RAM",
                    storage: "Storage",
                    psu: "PSU",
                    case: "Case",
                    cooler: "Cooler",
                };

                const selections = Object.entries(system.components || {}).flatMap(([category, value]) => {
                    const ids = Array.isArray(value) ? value : [value];
                    return ids.filter((id): id is string => Boolean(id)).map((partId, index) => ({
                        key: `${category}-${index}`,
                        category,
                        partId,
                    }));
                });

                const resolved = await Promise.all(selections.map(async ({ key, category, partId }): Promise<ResolvedPrebuiltPart> => {
                    const collectionName = collectionMap[category] || category;
                    const entry = (part: Part | null): ResolvedPrebuiltPart => ({ key, category, partId, part });

                    try {
                        // 1. Try canonical path: inventory/{category}/items/{partId}
                        const canonicalRef = doc(firestore, inventoryItemPath(collectionName, partId as string));
                        const canonicalSnap = await getDoc(canonicalRef);
                        if (canonicalSnap.exists()) {
                            return entry({ id: canonicalSnap.id, ...canonicalSnap.data() } as Part);
                        }

                        // 2. Try canonical query by name in inventory/{category}/items
                        const canonicalQuery = query(
                            collection(firestore, inventoryItemsPath(collectionName)),
                            where("name", "==", partId)
                        );
                        const canonicalQuerySnap = await getDocs(canonicalQuery);
                        if (!canonicalQuerySnap.empty) {
                            const docSnap = canonicalQuerySnap.docs[0];
                            return entry({ id: docSnap.id, ...docSnap.data() } as Part);
                        }

                        // 3. Fallback to legacy root collection: {collectionName}/{partId}
                        const partRef = doc(firestore, collectionName, partId as string);
                        const snap = await getDoc(partRef);
                        if (snap.exists()) {
                            return entry({ id: snap.id, ...snap.data() } as Part);
                        }

                        // 4. Fallback query by name in legacy collection
                        const q = query(collection(firestore, collectionName), where("name", "==", partId));
                        const querySnap = await getDocs(q);
                        if (!querySnap.empty) {
                            const docSnap = querySnap.docs[0];
                            return entry({ id: docSnap.id, ...docSnap.data() } as Part);
                        }

                        return entry(null);
                    } catch (err) {
                        console.warn(`Could not resolve part for category ${category}:`, err);
                        return entry(null);
                    }
                }));

                for (const { category, part } of resolved) {
                    if (!(category in partsRecord)) partsRecord[category] = part;
                }
                setComponents(partsRecord);
                setResolvedParts(resolved);
                setResolvedSystemId(system.id);
            } catch (error) {
                console.error("Error fetching parts:", error);
                toast({
                    title: "Component Details Notice",
                    description: "Could not fetch some component details. Please refresh if needed.",
                    variant: "destructive",
                });
            } finally {
                setLoadingParts(false);
            }
        };

        fetchComponents();
    }, [firestore, system, resolvedSystemId, toast]);

    // 3. Reserve Prebuilt Action
    const handleReserve = async () => {
        if (!isComplete || !system || !profile || !authUser || !isInStock || isReserving) return;

        setIsReserving(true);
        try {
            const componentsMap: Record<string, { id: string; name: string; price: number; category: string }> = {};
            Object.entries(components).forEach(([category, part]) => {
                if (part) {
                    componentsMap[category] = {
                        id: part.id,
                        name: part.name,
                        price: part.price,
                        category: category,
                    };
                }
            });

            const sanitizedSystem = JSON.parse(JSON.stringify(system));

            const result = await reservePrebuiltSystem(
                authUser.uid,
                profile.email,
                profile.name || profile.email.split("@")[0],
                sanitizedSystem,
                componentsMap,
                await authUser.getIdToken(),
                getOperation({ systemId })
            );

            if (result.success) {
                toast({
                    title: "Reservation Successful",
                    description: `Your reservation for ${system.name} has been confirmed.`,
                });
                router.push("/profile");
            } else {
                toast({
                    title: "Reservation Failed",
                    description: result.error || "An error occurred during reservation.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Reservation error:", error);
            toast({
                title: "Error",
                description: "An unexpected error occurred while placing your reservation.",
                variant: "destructive",
            });
        } finally {
            setIsReserving(false);
        }
    };

    // 4. Customize Prebuilt into PC Builder
    const handleCustomizePrebuilt = () => {
        if (!system) return;

        const parts: FavoriteBuildPart[] = [];
        const categoryMap: Record<string, string> = {
            cpu: "CPU",
            gpu: "GPU",
            motherboard: "Motherboard",
            ram: "RAM",
            storage: "Storage",
            psu: "PSU",
            case: "Case",
            cooler: "Cooler",
        };

        resolvedParts.forEach(({ category: key, partId, part }) => {
            parts.push({
                category: categoryMap[key.toLowerCase()] || key,
                partId: part?.id || partId,
                name: part?.name || partId,
                price: part?.price || 0,
            });
        });

        const prebuiltBuildPayload: FavoriteBuild = {
            id: system.id,
            name: `${system.name} (Customized)`,
            parts,
            totalPrice: system.price,
            source: "builder",
            createdAt: new Date().toISOString(),
            loadContext: {
                type: "prebuilt",
                systemName: system.name,
                unavailableParts: Array.from(new Set(unavailableParts.map(part => part.name))),
            },
        };

        if (isManagerOrAdmin) {
            localStorage.setItem("admin_pc_builder_load_prebuilt", JSON.stringify(prebuiltBuildPayload));
            router.push("/admin/prebuilt-builder");
        } else {
            localStorage.setItem("pc_builder_load_favorite", JSON.stringify(prebuiltBuildPayload));
            router.push("/builder");
        }
    };

    // 5. Run AI Analysis
    const handleAnalyze = async () => {
        if (!system || !firestore || !systemId) return;
        setLoadingAnalysis(true);
        setAnalysisError(null);

        const inputData: any = {};
        Object.entries(components).forEach(([key, val]) => {
            if (val) {
                inputData[key.charAt(0).toUpperCase() + key.slice(1)] = {
                    model: val.name,
                    price: val.price,
                    brand: val.brand,
                };
            }
        });

        try {
            const result = await getAiPrebuiltPerformance(inputData);
            if ("error" in result) {
                setAnalysisError(result.error as string);
            } else {
                const docRef = doc(firestore, "prebuiltSystems", systemId);
                await updateDoc(docRef, { aiReport: result });
                setLocalAnalysis(result);
                toast({
                    title: "Analysis Saved",
                    description: "AI Performance Review has been updated and published.",
                });
            }
        } catch (err) {
            setAnalysisError("An unexpected error occurred during analysis.");
        } finally {
            setLoadingAnalysis(false);
        }
    };

    return {
        system,
        loadingSystem,
        components,
        componentStatuses,
        unavailableParts,
        loadingParts,
        analysis,
        loadingAnalysis,
        analysisError,
        isReserving,
        isStaff,
        isManagerOrAdmin,
        canGenerateReport,
        isComplete,
        missingParts,
        isInStock,
        backLink,
        backText,
        handleReserve,
        handleCustomizePrebuilt,
        handleAnalyze,
    };
}
