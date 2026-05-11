"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUserProfile } from '@/context/user-profile';
import { getEffectiveRole, AuthPermissions, UserRole } from '@/lib/auth-utils';
import { FullPageLoader } from '@/components/full-page-loader';

interface RouteGuardProps {
    children: React.ReactNode;
    requiredPermission?: keyof typeof AuthPermissions;
    fallbackPath?: string;
    loadingComponent?: React.ReactNode;
}

/**
 * RouteGuard — Centralized component for enforcing access control.
 * Prevents "flashes" of unauthorized content by ensuring auth state is resolved
 * before rendering protected children.
 */
export function RouteGuard({
    children,
    requiredPermission,
    fallbackPath = '/',
    loadingComponent
}: RouteGuardProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { authUser, profile, loading: authLoading } = useUserProfile();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        if (!authLoading) {
            const role = getEffectiveRole(profile);
            
            // If no specific permission is required, anyone (authorized or not) can pass
            if (!requiredPermission) {
                setIsAuthorized(true);
                setIsChecking(false);
                return;
            }

            const hasPermission = AuthPermissions[requiredPermission](role);

            if (hasPermission) {
                setIsAuthorized(true);
                setIsChecking(false);
            } else {
                setIsAuthorized(false);
                setIsChecking(false);

                // If they are logged in as a manager but hit a client-only page, send them to admin
                const isStaff = (role as any) === 'manager' || (role as any) === 'superadmin';
                if (isStaff && requiredPermission === 'isClientOnly') {
                    router.replace('/admin');
                } else {
                    router.replace(fallbackPath);
                }
            }
        }
    }, [authLoading, authUser, profile, requiredPermission, router, fallbackPath]);

    // Render loading state while checking
    if (authLoading || isChecking) {
        return loadingComponent || <FullPageLoader label="BuilbotAI" subtitle="Secure Channel Initializing" />;
    }

    // Only render children if authorized
    return isAuthorized ? <>{children}</> : null;
}
