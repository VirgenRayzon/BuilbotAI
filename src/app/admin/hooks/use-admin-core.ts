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
    const initialTab = searchParams.get('tab') || 'stock';
    const [currentTab, setCurrentTab] = useState(initialTab);

    // Sync global loading state
    useEffect(() => {
        setIsPageLoading(userLoading);
        return () => setIsPageLoading(false);
    }, [userLoading, setIsPageLoading]);

    const handleTabAccess = (val: string) => {
        // Restrict Sales tab to Super Admin only
        if (val === 'sales' && !profile?.isSuperAdmin) {
            toast({
                title: "Access Restricted",
                description: "The Sales performance page is reserved for Super Admins.",
                variant: "destructive"
            });
            return;
        }
        
        setCurrentTab(val);
        // Optional: sync with URL
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
