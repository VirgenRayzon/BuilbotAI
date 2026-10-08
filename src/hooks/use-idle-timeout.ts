'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { useUserProfile } from '@/context/user-profile';
import { signOut } from 'firebase/auth';
import { createAuditLog } from '@/firebase/audit';

const ACTIVITY_STORAGE_KEY = 'buildbot_last_activity_timestamp';
const AUTH_SYNC_CHANNEL = 'buildbot_auth_sync';

// Role-based timeout configurations (in milliseconds)
const STAFF_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const STAFF_WARNING_MS = 2 * 60 * 1000;  // 2 minutes warning countdown
const USER_TIMEOUT_MS = 30 * 60 * 1000;  // 30 minutes
const USER_WARNING_MS = 5 * 60 * 1000;   // 5 minutes warning countdown

// Activity throttle limit
const ACTIVITY_THROTTLE_MS = 2500; // Record at most once every 2.5s

export interface UseIdleTimeoutReturn {
  showWarning: boolean;
  secondsRemaining: number;
  totalWarningSeconds: number;
  isStaff: boolean;
  stayLoggedIn: () => void;
  logout: () => void;
}

export function useIdleTimeout(): UseIdleTimeoutReturn {
  const auth = useAuth();
  const user = useUser();
  const firestore = useFirestore();
  const { profile, status } = useUserProfile();

  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  const sessionReady = status === 'ready' && !!user && profile?.id === user.uid;
  const isStaff = sessionReady && Boolean(profile?.isSuperAdmin || profile?.isManager);
  const totalTimeoutMs = isStaff ? STAFF_TIMEOUT_MS : USER_TIMEOUT_MS;
  const warningDurationMs = isStaff ? STAFF_WARNING_MS : USER_WARNING_MS;
  const totalWarningSeconds = Math.round(warningDurationMs / 1000);

  const lastActivityRef = useRef<number>(Date.now());
  const lastThrottleRef = useRef<number>(0);
  const isLoggingOutRef = useRef<boolean>(false);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Helper to read latest activity timestamp from localStorage
  const getStoredActivity = useCallback((): number => {
    if (typeof window === 'undefined') return Date.now();
    try {
      const stored = localStorage.getItem(ACTIVITY_STORAGE_KEY);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback to in-memory ref
    }
    return lastActivityRef.current;
  }, []);

  // Record user activity
  const recordActivity = useCallback((broadcast = true) => {
    const now = Date.now();
    if (now - lastThrottleRef.current < ACTIVITY_THROTTLE_MS) {
      return;
    }
    lastThrottleRef.current = now;
    lastActivityRef.current = now;

    try {
      localStorage.setItem(ACTIVITY_STORAGE_KEY, now.toString());
    } catch {
      // Ignore localStorage write failure
    }

    if (broadcast && channelRef.current) {
      try {
        channelRef.current.postMessage({ type: 'ACTIVITY', timestamp: now });
      } catch {
        // Channel might be closed
      }
    }
  }, []);

  // Perform clean logout
  const performLogout = useCallback(
    async (reason: 'idle_timeout' | 'user_initiated') => {
      if (isLoggingOutRef.current) return;
      isLoggingOutRef.current = true;

      // Broadcast logout to all tabs so other tabs also gracefully log out
      if (channelRef.current) {
        try {
          channelRef.current.postMessage({ type: 'LOGOUT', reason });
        } catch {
          // Ignore
        }
      }

      // Purge local states and draft builder caches
      try {
        localStorage.removeItem(ACTIVITY_STORAGE_KEY);
        localStorage.removeItem('pc_chat_history_v2');
        localStorage.removeItem('pc_builder_state');
        localStorage.removeItem('admin_pc_builder_state');
        sessionStorage.removeItem('buildbot_admin_session_active');
      } catch {
        // Ignore
      }

      // Security audit logging for administrative timeouts
      if (firestore && user && isStaff && reason === 'idle_timeout') {
        try {
          await createAuditLog(firestore, {
            actionName: 'auth_update',
            actorId: user.uid,
            actorName: profile?.name || profile?.email || user.email || 'Admin User',
            actorEmail: user.email || undefined,
            scope: 'User',
            resourceName: user.email || user.uid,
            resourceId: user.uid,
            details: 'Session expired due to inactivity (idle timeout)',
          });
        } catch (auditErr) {
          console.warn('[useIdleTimeout] Failed to write timeout audit log:', auditErr);
        }
      }

      const destination = isStaff
        ? `/system-access?reason=${reason}`
        : `/signin?reason=${reason}`;

      try {
        if (auth) {
          await signOut(auth);
        }
      } catch (signOutErr) {
        console.error('[useIdleTimeout] Sign out error:', signOutErr);
      } finally {
        if (typeof window !== 'undefined') {
          window.location.replace(destination);
        }
      }
    },
    [auth, user, firestore, isStaff, profile]
  );

  // User explicitly clicks "Stay Signed In"
  const stayLoggedIn = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    lastThrottleRef.current = now;
    setShowWarning(false);
    setSecondsRemaining(0);

    try {
      localStorage.setItem(ACTIVITY_STORAGE_KEY, now.toString());
    } catch {
      // Ignore
    }

    if (channelRef.current) {
      try {
        channelRef.current.postMessage({ type: 'EXTEND', timestamp: now });
      } catch {
        // Ignore
      }
    }

    // Refresh token in background to keep auth credential fresh
    if (user && typeof user.getIdToken === 'function') {
      user.getIdToken(true).catch((tokenErr) => {
        console.warn('[useIdleTimeout] Token refresh failed on extend:', tokenErr);
      });
    }
  }, [user]);

  // User clicks "Sign Out Now"
  const logout = useCallback(() => {
    performLogout('user_initiated');
  }, [performLogout]);

  // Main evaluation logic
  const evaluateInactivity = useCallback(() => {
    if (!sessionReady || isLoggingOutRef.current) return;

    const storedLast = getStoredActivity();
    const effectiveLast = Math.max(lastActivityRef.current, storedLast);
    const now = Date.now();
    const elapsed = now - effectiveLast;
    const remainingMs = totalTimeoutMs - elapsed;

    if (remainingMs <= 0) {
      performLogout('idle_timeout');
    } else if (remainingMs <= warningDurationMs) {
      setShowWarning(true);
      setSecondsRemaining(Math.max(1, Math.ceil(remainingMs / 1000)));
    } else {
      setShowWarning(false);
      setSecondsRemaining(0);
    }
  }, [sessionReady, totalTimeoutMs, warningDurationMs, getStoredActivity, performLogout]);

  // Set up BroadcastChannel & storage synchronization across tabs
  useEffect(() => {
    if (typeof window === 'undefined' || !sessionReady) return;

    let bc: BroadcastChannel | null = null;
    if ('BroadcastChannel' in window) {
      try {
        bc = new BroadcastChannel(AUTH_SYNC_CHANNEL);
        channelRef.current = bc;

        bc.onmessage = (event) => {
          const data = event.data;
          if (!data) return;

          if (data.type === 'ACTIVITY' || data.type === 'EXTEND') {
            const ts = typeof data.timestamp === 'number' ? data.timestamp : Date.now();
            lastActivityRef.current = ts;
            setShowWarning(false);
            setSecondsRemaining(0);
          } else if (data.type === 'LOGOUT') {
            performLogout(data.reason || 'user_initiated');
          }
        };
      } catch (e) {
        console.warn('[useIdleTimeout] BroadcastChannel initialization failed:', e);
      }
    }

    // Fallback storage event listener for cross-tab activity
    const handleStorage = (e: StorageEvent) => {
      if (e.key === ACTIVITY_STORAGE_KEY && e.newValue) {
        const parsed = parseInt(e.newValue, 10);
        if (!isNaN(parsed)) {
          lastActivityRef.current = parsed;
          setShowWarning(false);
          setSecondsRemaining(0);
        }
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      if (bc) {
        bc.close();
        channelRef.current = null;
      }
      window.removeEventListener('storage', handleStorage);
    };
  }, [sessionReady, performLogout]);

  // Set up periodic heartbeat and window event listeners
  useEffect(() => {
    if (!sessionReady) {
      setShowWarning(false);
      setSecondsRemaining(0);
      return;
    }

    // Initialize activity timestamp if unset
    const existing = getStoredActivity();
    if (!existing || Date.now() - existing > totalTimeoutMs) {
      recordActivity(false);
    } else {
      lastActivityRef.current = existing;
    }

    const events = ['mousedown', 'mousemove', 'keydown', 'keypress', 'scroll', 'touchstart', 'click'];
    const handleUserActivity = () => {
      // Don't auto-reset if warning modal is active — user must explicitly click "Stay Signed In"
      if (!showWarning) {
        recordActivity(true);
      }
    };

    events.forEach((evt) => window.addEventListener(evt, handleUserActivity, { passive: true }));

    // Instant check when waking up or switching tabs
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        evaluateInactivity();
      }
    };
    const handleFocus = () => {
      evaluateInactivity();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);

    // Heartbeat ticker running every 1000ms
    const intervalId = setInterval(evaluateInactivity, 1000);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleUserActivity));
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
      clearInterval(intervalId);
    };
  }, [sessionReady, showWarning, recordActivity, evaluateInactivity, getStoredActivity, totalTimeoutMs]);

  return {
    showWarning,
    secondsRemaining,
    totalWarningSeconds,
    isStaff,
    stayLoggedIn,
    logout,
  };
}
