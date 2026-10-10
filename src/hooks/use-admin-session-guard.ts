'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import { useUserProfile } from '@/context/user-profile';
import { signOut } from 'firebase/auth';

const ADMIN_SESSION_KEY = 'buildbot_admin_session_active';
const ADMIN_SESSION_CHANNEL = 'buildbot_admin_session_channel';

/**
 * useAdminSessionGuard
 *
 * Enforces strict tab/window closure logouts for Super Admins and Managers.
 * Ensures that if a browser window was closed, any lingering credentials from older
 * local storage are immediately invalidated when visiting protected admin routes.
 */
export function useAdminSessionGuard() {
  const auth = useAuth();
  const user = useUser();
  const { profile, loading } = useUserProfile();
  const pathname = usePathname();
  const validatedUidRef = useRef<string | null>(null);

  useEffect(() => {
    // Skip if still loading, unauthenticated, or on authentication portals
    if (!user || loading || !auth || !profile) {
      validatedUidRef.current = null;
      return;
    }
    if (pathname === '/system-access' || pathname === '/signin') return;

    // Only applies to privileged staff roles (Managers & Super Admins)
    const isStaff = Boolean(profile.isSuperAdmin || profile.isManager);
    if (!isStaff) return;

    if (typeof window === 'undefined') return;

    // Register this tab as an active admin session tab
    sessionStorage.setItem(ADMIN_SESSION_KEY, user.uid);
    validatedUidRef.current = user.uid;
  }, [loading, user, auth, profile, pathname]);
}
