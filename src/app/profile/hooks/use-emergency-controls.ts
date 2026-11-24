"use client";

import { useMemo, useCallback } from 'react';
import { useFirestore, useDoc } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/context/user-profile";
import { useSiteSettings } from "@/context/site-settings-context";

export function useEmergencyControls() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { profile } = useUserProfile();
    const {
        isLiveBuilderRecommendationsEnabled,
    } = useSiteSettings();

    const settingsDocRef = useMemo(() => firestore ? doc(firestore, 'siteSettings', 'main') : null, [firestore]);
    const { data: settings } = useDoc<any>(settingsDocRef);
    
    const isMaintenanceMode = settings?.isMaintenanceMode || false;
    const isStorageKillSwitch = settings?.isStorageKillSwitch || false;
    const isAiKillSwitch = settings?.isAiKillSwitch || false;

    const updateSetting = useCallback(async (
        key: string,
        newState: boolean,
        title: string,
        descActive: string,
        descInactive: string,
        isNonDestructive = false
    ) => {
        if (!firestore || !profile?.isSuperAdmin) return;

        const confirmMsg = isNonDestructive
            ? (newState
                ? `Enable ${title}? Continue?`
                : `Disable ${title}? Continue?`)
            : (newState
                ? `WARNING: You are about to ACTIVATE ${title}. Continue?`
                : `Restore ${title} to normal state?`);
        if (!window.confirm(confirmMsg)) return;

        try {
            await setDoc(doc(firestore, 'siteSettings', 'main'), {
                [key]: newState,
                lastUpdated: new Date().toISOString(),
                updatedBy: profile.email
            }, { merge: true });

            toast({
                title: newState ? `${title} Active` : `${title} Restored`,
                description: newState ? descActive : descInactive,
                variant: newState && !isNonDestructive ? "destructive" : "default"
            });
        } catch (error) {
            console.error(`Error toggling ${key}:`, error);
            toast({ title: "Operation Failed", description: "Could not update settings.", variant: "destructive" });
        }
    }, [firestore, profile, toast]);

    const handleToggleMaintenance = () => updateSetting(
        'isMaintenanceMode', !isMaintenanceMode, 'System Kill Switch', 
        "Maintenance screen is now visible.", "Site is now public."
    );

    const handleToggleStorageKillSwitch = () => updateSetting(
        'isStorageKillSwitch', !isStorageKillSwitch, 'Storage Kill Switch', 
        "Images are now appearing as broken.", "Images are now visible again."
    );

    const handleToggleAiKillSwitch = () => updateSetting(
        'isAiKillSwitch', !isAiKillSwitch, 'AI Kill Switch', 
        "All neural features are now disabled.", "AI features are now online."
    );

    const handleToggleLiveBuilderRecommendations = () => updateSetting(
        'isLiveBuilderRecommendationsEnabled', !isLiveBuilderRecommendationsEnabled,
        'Live Builder Recommendations',
        "Compatible catalog recommendations are now highlighted in both builders.",
        "Live recommendation highlighting is disabled in both builders.",
        true
    );

    return {
        isMaintenanceMode, handleToggleMaintenance,
        isStorageKillSwitch, handleToggleStorageKillSwitch,
        isAiKillSwitch, handleToggleAiKillSwitch,
        isLiveBuilderRecommendationsEnabled, handleToggleLiveBuilderRecommendations
    };
}
