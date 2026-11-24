'use client';
import { useEffect, useRef, useState } from 'react';
import type { Order, PaymentStatus } from '@/lib/types';
import { paymentDialogPolicy, type StaffPaymentRequest } from '@/lib/order-payment';

export function usePaymentStatusDialog(order: Order | null, nextStatus: PaymentStatus | null,
  onSubmit: (reason?: string, request?: StaffPaymentRequest) => Promise<boolean>, onClose: () => void) {
  const [reason, setReason] = useState('');
  const [received, setReceived] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const request = useRef<StaffPaymentRequest | null>(null);
  const policy = order && nextStatus ? paymentDialogPolicy(order, nextStatus) : null;
  useEffect(() => {
    setReason(''); setReceived(false); setError('');
    request.current = order ? { operation: { operationId: crypto.randomUUID(), expectedRevision: order.workflowRevision || 0 } } : null;
  }, [order, nextStatus]);
  return { reason, setReason, received, setReceived, busy, error, policy,
    close: () => { if (!lock.current) onClose(); },
    submit: async () => {
      if (lock.current || !order || !nextStatus || !policy || !request.current) return;
      if (policy.needsReason && reason.trim().length < 8) { setError('Enter an audit reason of at least 8 characters.'); return; }
      if (policy.collecting && !received) { setError('Confirm that the cash was received for this order.'); return; }
      lock.current = true; setBusy(true); setError('');
      try {
        const details: StaffPaymentRequest = { ...request.current,
          ...(policy.collecting ? { cashConfirmation: { received: true, amount: order.totalPrice } } : {}) };
        if (await onSubmit(reason.trim() || undefined, details)) onClose();
        else setError('Payment was not updated. Review the notification; retry safely or close to review the latest order.');
      } catch { setError('The result could not be confirmed. Retry safely to check this request.'); }
      finally { lock.current = false; setBusy(false); }
    } };
}
