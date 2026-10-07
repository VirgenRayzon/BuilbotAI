"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUserProfile } from '@/context/user-profile';
import { useLoading } from "@/context/loading-context";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook to handle admin page authentication, routing, and loading states.
 */
export function useAdminCore() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { authUser, profile, loading: userLoading } = useUserProfile();
    const { setIsPageLoading } = useLoading();
    const { toast } = useToast();
    
    // Default to 'stock' or the tab in URL
    const urlTab = searchParams.get('tab');
    const initialTab = urlTab || 'stock';
    const [currentTab, setCurrentTab] = useState(initialTab);

    // Sync tab when searchParams change
    useEffect(() => {
        if (urlTab) {
            // Map legacy aliases
            const resolvedTab = urlTab === 'ai-models' || urlTab === 'prompts' ? 'ai' : urlTab;
            setCurrentTab(resolvedTab);
        }
    }, [urlTab]);

    // Sync global loading state
    useEffect(() => {
        setIsPageLoading(userLoading);
        return () => setIsPageLoading(false);
    }, [userLoading, setIsPageLoading]);

    const handleTabAccess = (val: string) => {
        const superAdminOnlyTabs = ['sales', 'management', 'ai', 'content'];

        // Restrict Super Admin only tabs
        if (superAdminOnlyTabs.includes(val) && !profile?.isSuperAdmin) {
            toast({
                title: "Access Restricted",
                description: "This control panel is reserved exclusively for Super Administrators.",
                variant: "destructive"
            });
            return;
        }
        
        setCurrentTab(val);
        // Sync with URL
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', val);
        router.push(`?${params.toString()}`, { scroll: false });
    };

    return {
        authUser,
        profile,
        userLoading,
        currentTab,
        setCurrentTab,
        handleTabAccess,
        searchParams,
        router
    };
}
