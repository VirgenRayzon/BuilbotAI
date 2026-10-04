/**
 * SiteSettingsContext — Firestore-backed global site configuration provider.
 * Manages maintenance mode, storage kill switch, and image corruption logic.
 * Super Admins bypass image corruption even when the kill switch is active.
 */
"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useDoc, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import { useUserProfile } from "./user-profile";

export interface FineTunedProject {
    id: string;
    name: string;
    endpoint: string;
    createdAt?: string;
}

interface SiteSettings {
    isMaintenanceMode: boolean;
    isStorageKillSwitch?: boolean;
    aiModelProvider?: 'default' | 'finetuned';
    fineTunedModelId?: string;
    defaultGeminiModel?: string;
    fineTunedProjects?: FineTunedProject[];
    activeFineTunedProjectId?: string;
    lastUpdated?: string;
    updatedBy?: string;
}

interface SiteSettingsContextType {
    settings: SiteSettings | null;
    isMaintenanceMode: boolean;
    isStorageKillSwitch: boolean;
    shouldCorruptImages: boolean;
    aiModelProvider: 'default' | 'finetuned';
    fineTunedModelId: string;
    defaultGeminiModel: string;
    fineTunedProjects: FineTunedProject[];
    activeFineTunedProjectId: string;
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
    const firestore = useFirestore();
    const { profile } = useUserProfile();

    const settingsDocRef = useMemo(() => {
        if (firestore) return doc(firestore, 'siteSettings', 'main');
        return null;
    }, [firestore]);

    const { data: settings } = useDoc<any>(settingsDocRef);
    
    const isMaintenanceMode = settings?.isMaintenanceMode || false;
    const isStorageKillSwitch = settings?.isStorageKillSwitch || false;
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
    
    // Corrupt images if Storage Kill Switch is ON and the user is NOT a Super Admin
    const shouldCorruptImages = isStorageKillSwitch && !profile?.isSuperAdmin;

    const value = useMemo(() => ({
        settings: settings as SiteSettings,
        isMaintenanceMode,
        isStorageKillSwitch,
        shouldCorruptImages,
        aiModelProvider,
        fineTunedModelId,
        defaultGeminiModel,
        fineTunedProjects,
        activeFineTunedProjectId
    }), [settings, isMaintenanceMode, isStorageKillSwitch, shouldCorruptImages, aiModelProvider, fineTunedModelId, defaultGeminiModel, fineTunedProjects, activeFineTunedProjectId]);

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
