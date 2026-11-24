'use client';
import { useRef, useState } from 'react';
import type { Order, OrderFulfillmentStage } from '@/lib/types';
import type { OrderOperation } from '@/lib/server/order-operations';

export function useOrderActions(orders: Order[], submit?: (id: string, stage: OrderFulfillmentStage, operation: OrderOperation) => Promise<boolean>) {
  const [request, setRequest] = useState<{ order: Order; stage: OrderFulfillmentStage; operation: OrderOperation } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  return { request, busy, error,
    close: () => { if (!lock.current) setRequest(null); },
    begin: (id: string, stage: OrderFulfillmentStage) => {
      const order = orders.find(value => value.id === id);
      if (order && !lock.current) { setError(''); setRequest({ order, stage, operation: { operationId: crypto.randomUUID(), expectedRevision: order.workflowRevision || 0 } }); }
    },
    confirm: async () => {
      if (lock.current || !request || !submit) return;
      lock.current = true; setBusy(true); setError('');
      try {
        if (await submit(request.order.id, request.stage, request.operation)) setRequest(null);
        else setError('The order could not be updated. Review the notification, then retry or close to review the latest order.');
      } catch { setError('The request failed. Retry to check the result safely.'); }
      finally { lock.current = false; setBusy(false); }
    } };
}
