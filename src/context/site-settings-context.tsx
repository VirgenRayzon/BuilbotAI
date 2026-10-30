/**
 * SiteSettingsContext — Firestore-backed global site configuration provider.
 * Manages maintenance mode, storage kill switch, e-commerce UI mode, and image corruption logic.
 * Super Admins bypass image corruption even when the kill switch is active.
 */
"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useDoc, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import { useUserProfile } from "./user-profile";

export interface FineTunedProject {
    id: string;
    name: string;
    endpoint: string;
    createdAt?: string;
}

export type AiFeatureKey = 'chatbot' | 'buildAdvisor' | 'prebuiltAdvisor';

export interface FeatureModelRouting {
    chatbot: 'default' | 'finetuned';
    buildAdvisor: 'default' | 'finetuned';
    prebuiltAdvisor: 'default' | 'finetuned';
}

export const DEFAULT_FEATURE_ROUTING: FeatureModelRouting = {
    chatbot: 'finetuned',
    buildAdvisor: 'default',
    prebuiltAdvisor: 'default',
};

export interface SystemPromptsSetting {
    chatbot?: string;
    buildAdvisor?: string;
    prebuiltAdvisor?: string;
    partExtractor?: string;
    lastUpdated?: string;
    updatedBy?: string;
}

interface SiteSettings {
    isMaintenanceMode: boolean;
    isStorageKillSwitch?: boolean;
    isEcommerceMode?: boolean;
    isLiveBuilderRecommendationsEnabled?: boolean;
    aiModelProvider?: 'default' | 'finetuned';
    fineTunedModelId?: string;
    defaultGeminiModel?: string;
    fineTunedProjects?: FineTunedProject[];
    activeFineTunedProjectId?: string;
    featureModelRouting?: FeatureModelRouting;
    systemPrompts?: SystemPromptsSetting;
    lastUpdated?: string;
    updatedBy?: string;
}

interface SiteSettingsContextType {
    settings: SiteSettings | null;
    isMaintenanceMode: boolean;
    isStorageKillSwitch: boolean;
    isEcommerceMode: boolean;
    isLiveBuilderRecommendationsEnabled: boolean;
    shouldCorruptImages: boolean;
    aiModelProvider: 'default' | 'finetuned';
    fineTunedModelId: string;
    defaultGeminiModel: string;
    fineTunedProjects: FineTunedProject[];
    activeFineTunedProjectId: string;
    featureModelRouting: FeatureModelRouting;
    systemPrompts?: SystemPromptsSetting;
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

const ECOMMERCE_LOCAL_KEY = "buildbot_ecommerce_mode_override";

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
    const firestore = useFirestore();
    const { profile } = useUserProfile();
    const [localEcommerceOverride, setLocalEcommerceOverride] = useState<boolean | null>(null);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const stored = window.localStorage.getItem(ECOMMERCE_LOCAL_KEY);
        if (stored === "true") setLocalEcommerceOverride(true);
        else if (stored === "false") setLocalEcommerceOverride(false);

        const handleStorage = (event: StorageEvent) => {
            if (event.key === ECOMMERCE_LOCAL_KEY) {
                if (event.newValue === "true") setLocalEcommerceOverride(true);
                else if (event.newValue === "false") setLocalEcommerceOverride(false);
                else setLocalEcommerceOverride(null);
            }
        };
        const handleCustom = (event: Event) => {
            const customEvent = event as CustomEvent<boolean>;
            if (typeof customEvent.detail === "boolean") {
                setLocalEcommerceOverride(customEvent.detail);
            }
        };
        window.addEventListener("storage", handleStorage);
        window.addEventListener("buildbot:ecommerce-mode-change", handleCustom);
        return () => {
            window.removeEventListener("storage", handleStorage);
            window.removeEventListener("buildbot:ecommerce-mode-change", handleCustom);
        };
    }, []);

    const settingsDocRef = useMemo(() => {
        if (firestore) return doc(firestore, 'siteSettings', 'main');
        return null;
    }, [firestore]);

    const { data: settings } = useDoc<SiteSettings>(settingsDocRef);
    
    const isMaintenanceMode = settings?.isMaintenanceMode || false;
    const isStorageKillSwitch = settings?.isStorageKillSwitch || false;
    const isEcommerceMode = typeof settings?.isEcommerceMode === "boolean"
        ? settings.isEcommerceMode
        : (localEcommerceOverride ?? false);
    const isLiveBuilderRecommendationsEnabled = settings?.isLiveBuilderRecommendationsEnabled === true;
    const aiModelProvider = settings?.aiModelProvider || 'default';
    const fineTunedModelId = settings?.fineTunedModelId || 'projects/781722135778/locations/us-central1/endpoints/2302171190132736000';
    const defaultGeminiModel = settings?.defaultGeminiModel || 'gemini-2.5-flash';
    const fineTunedProjects: FineTunedProject[] = settings?.fineTunedProjects || [
        {
            id: 'default-proj-1',
            name: 'Buildbot Production Hardware Tuning',
            endpoint: 'projects/781722135778/locations/us-central1/endpoints/2302171190132736000',
            createdAt: '2026-04-01T00:00:00.000Z',
        }
    ];
    const activeFineTunedProjectId = settings?.activeFineTunedProjectId || (fineTunedProjects[0]?.id || 'default-proj-1');
    const systemPrompts = settings?.systemPrompts;
    const featureModelRouting: FeatureModelRouting = settings?.featureModelRouting || {
        chatbot: (aiModelProvider === 'finetuned' ? 'finetuned' : 'default'),
        buildAdvisor: (aiModelProvider === 'finetuned' ? 'finetuned' : 'default'),
        prebuiltAdvisor: (aiModelProvider === 'finetuned' ? 'finetuned' : 'default'),
    };
    
    // Corrupt images if Storage Kill Switch is ON and the user is NOT a Super Admin
    const shouldCorruptImages = isStorageKillSwitch && !profile?.isSuperAdmin;

    const value = useMemo(() => ({
        settings,
        isMaintenanceMode,
        isStorageKillSwitch,
        isEcommerceMode,
        isLiveBuilderRecommendationsEnabled,
        shouldCorruptImages,
        aiModelProvider,
        fineTunedModelId,
        defaultGeminiModel,
        fineTunedProjects,
        activeFineTunedProjectId,
        featureModelRouting,
        systemPrompts,
    }), [settings, isMaintenanceMode, isStorageKillSwitch, isEcommerceMode, isLiveBuilderRecommendationsEnabled, shouldCorruptImages, aiModelProvider, fineTunedModelId, defaultGeminiModel, fineTunedProjects, activeFineTunedProjectId, featureModelRouting, systemPrompts]);

    return (
        <SiteSettingsContext.Provider value={value}>
            {children}
        </SiteSettingsContext.Provider>
    );
}

export function useSiteSettings() {
    const context = useContext(SiteSettingsContext);
    if (context === undefined) {
        throw new Error("useSiteSettings must be used within a SiteSettingsProvider");
    }
    return context;
}
