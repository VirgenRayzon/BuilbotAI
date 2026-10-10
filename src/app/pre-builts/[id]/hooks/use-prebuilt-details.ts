"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { useUserProfile } from "@/context/user-profile";
import { useToast } from "@/hooks/use-toast";
import { reservePrebuiltSystem } from "@/app/prebuilt-reservation-actions";
import { getAiPrebuiltPerformance } from "@/app/actions";
import { getMissingParts, checkSystemStock } from "@/lib/prebuilt-utils";
import type { PrebuiltSystem, Part, FavoriteBuild, FavoriteBuildPart } from "@/lib/types";

export function usePrebuiltDetails(systemId: string) {
    const [system, setSystem] = useState<PrebuiltSystem | null>(null);
    const [loadingSystem, setLoadingSystem] = useState(true);

    const [components, setComponents] = useState<Record<string, Part | null>>({});
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
    const isInStock = checkSystemStock(components);

    const backLink = isStaff ? "/admin?tab=prebuilts" : "/pre-builts";
    const backText = isStaff ? "Back to Prebuilts Management" : "Back to Pre-built Rigs";

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
                        router.push("/pre-builts");
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
        if (!system || !firestore || Object.keys(components).length > 0) return;

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

                const promises = Object.entries(system.components || {}).map(async ([category, id]) => {
                    const collectionName = collectionMap[category] || category;
                    const partId = Array.isArray(id) ? id[0] : id;

                    if (!partId) {
                        partsRecord[category] = null;
                        return;
                    }

                    // First try document ID
                    const partRef = doc(firestore, collectionName, partId as string);
                    const snap = await getDoc(partRef);

                    if (snap.exists()) {
                        partsRecord[category] = { id: snap.id, ...snap.data() } as Part;
                    } else {
                        // Fallback query by name for legacy data
                        const q = query(collection(firestore, collectionName), where("name", "==", partId));
                        const querySnap = await getDocs(q);
                        if (!querySnap.empty) {
                            const docSnap = querySnap.docs[0];
                            partsRecord[category] = { id: docSnap.id, ...docSnap.data() } as Part;
                        } else {
                            partsRecord[category] = null;
                        }
                    }
                });

                await Promise.all(promises);
                setComponents(partsRecord);
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
    }, [firestore, system, components, toast]);

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
                componentsMap
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

        Object.entries(components).forEach(([key, part]) => {
            if (part) {
                const category = categoryMap[key.toLowerCase()] || part.category || key.toUpperCase();
                parts.push({
                    category,
                    partId: part.id,
                    name: part.name,
                    price: part.price,
                });
            }
        });

        const prebuiltBuildPayload: FavoriteBuild = {
            id: system.id,
            name: `${system.name} (Customized)`,
            parts,
            totalPrice: system.price,
            source: "builder",
            createdAt: new Date().toISOString(),
        };

        localStorage.setItem("pc_builder_load_favorite", JSON.stringify(prebuiltBuildPayload));

        toast({
            title: "Loaded into PC Builder",
            description: `Transferred ${system.name} components into your custom build session.`,
        });

        router.push("/builder");
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
