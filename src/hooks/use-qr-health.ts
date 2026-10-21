'use client';
import { useEffect, useRef, useState } from 'react';
import { useUserProfile } from '@/context/user-profile';
import { qrHealthSchema, type QRHealthReport } from '@/lib/qr-health';

export function useQRHealth() {
  const { authUser } = useUserProfile();
  const [report, setReport] = useState<QRHealthReport | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { controller.current?.abort(); if (timeout.current) clearTimeout(timeout.current); }, []);
  const run = async () => {
    if (controller.current) return;
    const request = new AbortController();
    controller.current = request;
    setBusy(true); setError('');
    const timer = setTimeout(() => { request.abort(); setError('The audit took too long. Please retry.'); setBusy(false); controller.current = null; }, 30000);
    timeout.current = timer;
    try {
      if (!authUser) throw new Error('Sign in with your staff account to run this report.');
      const token = await authUser.getIdToken();
      if (request.signal.aborted) return;
      const response = await fetch('/api/admin/qr-health', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', signal: request.signal });
      if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? 'Your staff access could not be verified. Sign in again.' : 'The audit could not be completed. Please retry.');
      const data = qrHealthSchema.parse(await response.json());
      if (!request.signal.aborted) setReport(data);
    } catch (err) {
      if (!request.signal.aborted) setError(err instanceof Error ? err.message : 'The audit could not be completed.');
    } finally {
      clearTimeout(timer);
      if (controller.current === request) { controller.current = null; setBusy(false); }
    }
  };
  return { report, error, busy, run };
}
