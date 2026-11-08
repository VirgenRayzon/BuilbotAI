"use client";

import React, { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUserProfile } from '@/context/user-profile';
import { getEffectiveRole, AuthPermissions } from '@/lib/auth-utils';
import { Skeleton } from '@mantine/core';

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
    const needsVerifiedStaffSession = requiredPermission === 'canAccessAdmin' || requiredPermission === 'isSuperAdmin';
    const hasVerifiedStaffSession = typeof window !== 'undefined' &&
        sessionStorage.getItem('buildbot_admin_session_active') === authUser?.uid;
    const isAuthorized = isResolved &&
        (!requiredPermission || AuthPermissions[requiredPermission](role)) &&
        (!needsVerifiedStaffSession || hasVerifiedStaffSession);
    const isDenied = isResolved && !isAuthorized;

    const isStaff = role === 'manager' || role === 'superadmin';
    const destination = isStaff && (requiredPermission === 'isClientOnly' || requiredPermission === 'canUseBuilder')
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
        if (loadingComponent) {
            return <>{loadingComponent}</>;
        }
        return (
            <div className="min-h-[calc(100svh-4rem)] w-full flex items-center justify-center bg-slate-50 dark:bg-[#0c0f14]">
                <div className="w-full max-w-md p-6 space-y-3">
                    <Skeleton h={20} w="60%" radius="sm" className="mx-auto" />
                    <Skeleton h={14} w="80%" radius="sm" className="mx-auto" />
                </div>
            </div>
        );
    }

    return isAuthorized ? <>{children}</> : null;
}
