'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { useUserProfile } from '@/context/user-profile';
import { qrDestinationSchema, qrErrorSchema, type QRErrorCode } from '@/lib/qr-response';

type Failure = { code: QRErrorCode; message: string };
export function useQRResolver(token: string) {
  const { authUser, profile, loading } = useUserProfile();
  const auth = useAuth();
  const router = useRouter();
  const [failure, setFailure] = useState<Failure | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [recovering, setRecovering] = useState(false);
  const staffHint = useRef(false);
  const staff = Boolean(profile?.isManager || profile?.isSuperAdmin);

  useEffect(() => {
    if (loading || recovering) return;
    const markedStaff = Boolean(authUser && sessionStorage.getItem('buildbot_admin_session_active') === authUser.uid);
    staffHint.current = staff || markedStaff;
    setFailure(null);
    if (authUser && staff && !markedStaff) {
      router.replace(`/system-access?returnTo=${encodeURIComponent(`/q/${token}`)}`);
      return;
    }
    const controller = new AbortController();
    let active = true;
    const timer = setTimeout(() => {
      controller.abort();
      if (active) setFailure({ code: 'SERVICE_UNAVAILABLE', message: 'Opening this product took too long. Please retry.' });
    }, 15000);
    void (async () => {
      try {
        const headers: Record<string, string> = {};
        if (authUser) headers.Authorization = `Bearer ${await authUser.getIdToken()}`;
        if (controller.signal.aborted) return;
        const response = await fetch(`/api/qr/${encodeURIComponent(token)}`, { headers, cache: 'no-store', signal: controller.signal });
        const data: unknown = await response.json();
        if (!active || controller.signal.aborted) return;
        if (!response.ok) {
          const parsed = qrErrorSchema.safeParse(data);
          const code = response.status === 401 ? 'AUTH_EXPIRED' : response.status === 429 ? 'RATE_LIMITED' : parsed.success ? parsed.data.code : 'SERVICE_UNAVAILABLE';
          setFailure({ code, message: parsed.success ? parsed.data.error : 'Could not open this QR code. Please retry.' });
          return;
        }
        router.replace(qrDestinationSchema.parse(data).destination);
      } catch (error) {
        if (!active || controller.signal.aborted) return;
        const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
        setFailure(code.startsWith('auth/') && code !== 'auth/network-request-failed'
          ? { code: 'AUTH_EXPIRED', message: 'Please sign in again to open this product.' }
          : { code: 'SERVICE_UNAVAILABLE', message: 'Could not reach the QR service. Check your connection and retry.' });
      } finally { clearTimeout(timer); }
    })();
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [loading, recovering, authUser, staff, token, router, attempt]);

  const signInAgain = async () => {
    setRecovering(true);
    try {
      const page = staffHint.current ? 'system-access' : 'signin';
      sessionStorage.removeItem('buildbot_admin_session_active');
      if (auth) await signOut(auth);
      router.replace(`/${page}?returnTo=${encodeURIComponent(`/q/${token}`)}`);
    } catch {
      setFailure({ code: 'AUTH_EXPIRED', message: 'Could not end the expired session. Please try again.' });
      setRecovering(false);
    }
  };
  return { failure, recovering, retry: () => setAttempt(value => value + 1), signInAgain };
}
