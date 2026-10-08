"use client";

import React, { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUserProfile } from '@/context/user-profile';
import { getEffectiveRole, AuthPermissions } from '@/lib/auth-utils';
import { NeutralPageLoader } from '@/components/neutral-page-loader';

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
    const { authUser, profile, status } = useUserProfile();
    const lastRedirect = useRef<string | null>(null);
    const isResolved = status === 'ready' || status === 'unauthenticated';
    const role = getEffectiveRole(profile);
    const isAuthorized = isResolved && (!requiredPermission || AuthPermissions[requiredPermission](role));
    const isDenied = isResolved && !isAuthorized;

    const isStaff = role === 'manager' || role === 'superadmin';
    const destination = isStaff && requiredPermission === 'isClientOnly'
        ? '/admin'
        : !authUser && fallbackPath === '/'
            ? '/signin'
            : fallbackPath;

    useEffect(() => {
        if (!isDenied || pathname === destination) {
            lastRedirect.current = null;
            return;
        }

        const redirectKey = `${pathname}:${destination}`;
        if (lastRedirect.current !== redirectKey) {
            lastRedirect.current = redirectKey;
            router.replace(destination);
        }
    }, [destination, isDenied, pathname, router]);

    if (status === 'loading') {
        return loadingComponent || <NeutralPageLoader />;
    }

    // Denied and unresolved-error states never render protected children.
    return isAuthorized ? <>{children}</> : null;
}
