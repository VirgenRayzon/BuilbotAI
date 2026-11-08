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
    
    const urlTab = searchParams.get('tab');
    const initialTab = urlTab === 'content' ? 'stock' : urlTab === 'reservations' ? 'orders' : (urlTab || 'stock');
    const [currentTab, setCurrentTab] = useState(initialTab);

    useEffect(() => {
        if (urlTab) {
            const resolvedTab = urlTab === 'ai-models' || urlTab === 'prompts' ? 'ai' : urlTab === 'content' ? 'stock' : urlTab === 'reservations' ? 'orders' : urlTab;
            setCurrentTab(resolvedTab);
            if (urlTab === 'content' || urlTab === 'reservations') {
                const params = new URLSearchParams(searchParams.toString());
                params.set('tab', resolvedTab);
                router.replace(`?${params.toString()}`, { scroll: false });
            }
        }
    }, [urlTab, router, searchParams]);

    useEffect(() => {
        setIsPageLoading(userLoading);
        return () => setIsPageLoading(false);
    }, [userLoading, setIsPageLoading]);

    const handleTabAccess = (val: string) => {
        if (val === 'content') {
            val = 'stock';
        }
        const superAdminOnlyTabs = ['sales', 'management', 'ai'];

        if (superAdminOnlyTabs.includes(val) && !profile?.isSuperAdmin) {
            toast({
                title: "Access Restricted",
                description: "This control panel is reserved exclusively for Super Administrators.",
                variant: "destructive"
            });
            return;
        }
        
        setCurrentTab(val);
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
