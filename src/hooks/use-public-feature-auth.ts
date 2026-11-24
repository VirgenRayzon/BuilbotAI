'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/context/user-profile';
import { PUBLIC_FEATURE_SIGN_IN_URL } from '@/lib/public-feature-auth';

export function usePublicFeatureAuth() {
  const router = useRouter();
  const { authUser, loading: authLoading } = useUserProfile();

  const requireAuth = useCallback(
    (action: () => void) => {
      if (authLoading) return;
      if (!authUser) {
        router.push(PUBLIC_FEATURE_SIGN_IN_URL);
        return;
      }
      action();
    },
    [authLoading, authUser, router]
  );

  return {
    isGuest: !authLoading && !authUser,
    authLoading,
    requireAuth,
  };
}
