'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import { useUserProfile } from '@/context/user-profile';
import { signOut } from 'firebase/auth';

const ADMIN_SESSION_KEY = 'buildbot_admin_session_active';

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
  useEffect(() => {
    if (loading || !auth) return;
    if (!user) {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      return;
    }
    if (!profile || pathname === '/system-access' || pathname === '/system-access/signup' || pathname === '/signin') return;

    // Only applies to privileged staff roles (Managers & Super Admins)
    const isStaff = Boolean(profile.isSuperAdmin || profile.isManager);
    if (!isStaff) return;

    // Only the access-key flow may create this marker. A password-only staff
    // session must be ended rather than promoted when another route mounts.
    if (sessionStorage.getItem(ADMIN_SESSION_KEY) !== user.uid) {
      void signOut(auth).catch((error: unknown) => {
        console.error('Failed to end an unverified staff session:', error);
      });
    }
  }, [loading, user, auth, profile, pathname]);
}
