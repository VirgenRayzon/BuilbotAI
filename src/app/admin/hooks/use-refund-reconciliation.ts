'use client';
import { useRef, useState } from 'react';
import type { Order } from '@/lib/types';
import type { ReconcileRefund } from '@/lib/order-payment';

export function useRefundReconciliation(order: Order, reconcile?: ReconcileRefund) {
  const [opened, setOpened] = useState(false);
  const [providerRefundId, setProviderRefundId] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const perform = async (attach: boolean) => {
    if (lock.current || !reconcile) return;
    if (attach && (!/^ref_[a-zA-Z0-9_-]{1,120}$/.test(providerRefundId.trim()) || reason.trim().length < 8)) {
      setError('Enter the PayMongo refund ID and a verification reason of at least 8 characters.'); return;
    }
    lock.current = true; setBusy(true); setError('');
    try {
      const ok = await reconcile(order.id, attach ? { providerRefundId: providerRefundId.trim(), reason: reason.trim() } : undefined);
      if (ok) setOpened(false); else setError('The refund could not be verified. Its hold remains in place.');
    } catch { setError('Unable to verify the refund. Its hold remains in place.'); }
    finally { lock.current = false; setBusy(false); }
  };
  return { opened, providerRefundId, setProviderRefundId, reason, setReason, busy, error,
    close: () => { if (!lock.current) setOpened(false); },
    begin: () => { if (order.pendingPaymongoRefundId) void perform(false); else { setError(''); setOpened(true); } },
    submit: () => perform(true) };
}
