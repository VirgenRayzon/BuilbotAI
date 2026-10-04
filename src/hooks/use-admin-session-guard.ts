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
  const hasValidatedRef = useRef(false);

  useEffect(() => {
    // 1. Skip if still loading, unauthenticated, or on authentication portals
    if (loading || !user || !auth || !profile) return;
    if (pathname === '/system-access' || pathname === '/signin') return;

    // 2. Only applies to privileged staff roles (Managers & Super Admins)
    const isStaff = Boolean(profile.isSuperAdmin || profile.isManager);
    if (!isStaff) return;

    // 3. Only enforce when accessing admin or profile areas
    const isProtectedPath = pathname?.startsWith('/admin') || pathname?.startsWith('/profile');
    if (!isProtectedPath) return;

    if (hasValidatedRef.current) return;

    if (typeof window === 'undefined') return;

    // 4. Check if this tab has the active admin session marker
    const activeMarker = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (activeMarker === user.uid) {
      hasValidatedRef.current = true;

      // Responder for newly opened admin tabs in the same browser session
      if ('BroadcastChannel' in window) {
        const responderChannel = new BroadcastChannel(ADMIN_SESSION_CHANNEL);
        responderChannel.onmessage = (event) => {
          if (event.data?.type === 'PROBE_SESSION' && event.data?.uid === user.uid) {
            responderChannel.postMessage({ type: 'CONFIRM_SESSION', uid: user.uid });
          }
        };
        return () => {
          responderChannel.close();
        };
      }
      return;
    }

    // 5. Marker missing in this tab: check if another active admin tab is open
    let channel: BroadcastChannel | null = null;
    let isHandled = false;

    const handleSessionTermination = async () => {
      if (isHandled) return;
      isHandled = true;

      try {
        localStorage.removeItem('admin_pc_builder_state');
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
      } catch {
        // Ignore
      }

      try {
        await signOut(auth);
      } catch (err) {
        console.error('[useAdminSessionGuard] Sign out error:', err);
      } finally {
        window.location.replace('/system-access?reason=window_closed');
      }
    };

    if ('BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel(ADMIN_SESSION_CHANNEL);

        channel.onmessage = (event) => {
          if (event.data?.type === 'CONFIRM_SESSION' && event.data?.uid === user.uid) {
            // Sibling admin tab confirmed the session!
            isHandled = true;
            sessionStorage.setItem(ADMIN_SESSION_KEY, user.uid);
            hasValidatedRef.current = true;
          }
        };

        // Probe sibling tabs
        channel.postMessage({ type: 'PROBE_SESSION', uid: user.uid });

        // Wait 400ms for sibling response before concluding all tabs were closed
        const timer = setTimeout(() => {
          if (!isHandled && !sessionStorage.getItem(ADMIN_SESSION_KEY)) {
            handleSessionTermination();
          }
        }, 400);

        return () => {
          clearTimeout(timer);
          if (channel) channel.close();
        };
      } catch (e) {
        console.warn('[useAdminSessionGuard] BroadcastChannel failed, terminating:', e);
        handleSessionTermination();
      }
    } else {
      // Fallback for environments without BroadcastChannel
      handleSessionTermination();
    }
  }, [loading, user, auth, profile, pathname]);
}
