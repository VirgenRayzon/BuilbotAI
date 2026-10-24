'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useUserProfile } from '@/context/user-profile';
import type { QRStatusResponse } from '@/lib/qr-lifecycle';

export function useQRStatus(token?: string) {
  const { authUser, profile } = useUserProfile();
  const isSuperAdmin = profile?.isSuperAdmin === true;
  const [status, setStatus] = useState<QRStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState('');
  const activeToken = useRef<string | undefined>(token);

  activeToken.current = token;

  const fetchStatus = useCallback(async () => {
    if (!token || !authUser) return;
    setLoading(true);
    setError('');
    try {
      const idToken = await authUser.getIdToken();
      const res = await fetch(`/api/admin/qr-status/${token}`, {
        headers: { Authorization: `Bearer ${idToken}` },
        cache: 'no-store',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Failed to fetch QR status.');
      }
      const data: QRStatusResponse = await res.json();
      if (activeToken.current === token) {
        setStatus(data);
      }
    } catch (err) {
      if (activeToken.current === token) {
        setError(err instanceof Error ? err.message : 'Error fetching QR status.');
      }
    } finally {
      if (activeToken.current === token) {
        setLoading(false);
      }
    }
  }, [token, authUser]);

  useEffect(() => {
    setStatus(null);
    setError('');
    if (token && authUser) {
      void fetchStatus();
    }
  }, [token, authUser, fetchStatus]);

  const mutateStatus = async (action: 'ENABLE' | 'DISABLE', reason: string): Promise<boolean> => {
    if (!token || !authUser) return false;
    setMutating(true);
    setError('');
    try {
      const idToken = await authUser.getIdToken();
      const res = await fetch(`/api/admin/qr-status/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ action, reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update QR status.');
      }
      await fetchStatus();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update QR status.');
      return false;
    } finally {
      setMutating(false);
    }
  };

  return {
    status,
    loading,
    mutating,
    error,
    isSuperAdmin,
    fetchStatus,
    mutateStatus,
  };
}
