"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useDoc, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import { useUserProfile } from "./user-profile";

interface SiteSettings {
    isMaintenanceMode: boolean;
    isStorageKillSwitch?: boolean;
    lastUpdated?: string;
    updatedBy?: string;
}

interface SiteSettingsContextType {
    settings: SiteSettings | null;
    isMaintenanceMode: boolean;
    isStorageKillSwitch: boolean;
    shouldCorruptImages: boolean;
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
    
    // Corrupt images if Storage Kill Switch is ON and the user is NOT a Super Admin
    const shouldCorruptImages = isStorageKillSwitch && !profile?.isSuperAdmin;

    const value = {
        settings: settings as SiteSettings,
        isMaintenanceMode,
        isStorageKillSwitch,
        shouldCorruptImages
    };

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
