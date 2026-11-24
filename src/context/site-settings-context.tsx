"use client";

import React, { createContext, useContext, useEffect, useMemo } from "react";
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

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
    const firestore = useFirestore();
    const { profile } = useUserProfile();

    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            window.localStorage.removeItem("buildbot_ecommerce_mode_override");
        } catch {
        }
    }, []);

    const settingsDocRef = useMemo(() => {
        if (firestore) return doc(firestore, 'siteSettings', 'main');
        return null;
    }, [firestore]);

    const { data: settings } = useDoc<SiteSettings>(settingsDocRef);
    
    const isMaintenanceMode = settings?.isMaintenanceMode || false;
    const isStorageKillSwitch = settings?.isStorageKillSwitch || false;
    const isEcommerceMode = true;
    const isLiveBuilderRecommendationsEnabled = settings?.isLiveBuilderRecommendationsEnabled === true;
    const aiModelProvider = settings?.aiModelProvider || 'default';
    const fineTunedModelId = settings?.fineTunedModelId || 'projects/781722135778/locations/us-central1/endpoints/2302171190132736000';
    const rawDefaultGeminiModel = settings?.defaultGeminiModel || 'gemini-3.8-flash';
    const defaultGeminiModel = (rawDefaultGeminiModel === 'gemini-2.5-pro' || rawDefaultGeminiModel === 'gemini-2.5-flash') ? 'gemini-3.8-flash' : rawDefaultGeminiModel;
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
