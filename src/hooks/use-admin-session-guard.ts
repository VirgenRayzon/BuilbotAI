'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import { useUserProfile } from '@/context/user-profile';
import { signOut } from 'firebase/auth';

const ADMIN_SESSION_KEY = 'buildbot_admin_session_active';

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

    const isStaff = Boolean(profile.isSuperAdmin || profile.isManager);
    if (!isStaff) return;

    if (sessionStorage.getItem(ADMIN_SESSION_KEY) !== user.uid) {
      void signOut(auth).catch((error: unknown) => {
        console.error('Failed to end an unverified staff session:', error);
      });
    }
  }, [loading, user, auth, profile, pathname]);
}
