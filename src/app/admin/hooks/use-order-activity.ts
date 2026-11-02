'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/firebase';
import { getOrderActivity } from '../order-activity-actions';
import { mergeOrderActivity, type OrderActivity } from '@/lib/order-activity';
import type { Order } from '@/lib/types';

type Page = Extract<Awaited<ReturnType<typeof getOrderActivity>>, { success: true }>;
export function useOrderActivity(order: Order, enabled: boolean) {
  const auth = useAuth();
  const [events, setEvents] = useState<OrderActivity[]>([]);
  const [page, setPage] = useState<Page | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const generation = useRef(0);
  const lock = useRef<number | null>(null);
  const load = useCallback(async (previous: Page | null, generationId: number) => {
    if (lock.current === generationId) return;
    lock.current = generationId;
    setBusy(true); setError('');
    try {
      const user = auth?.currentUser;
      if (!user) throw new Error('Sign in again to view activity.');
      const result = await getOrderActivity({ orderId: order.id, idToken: await user.getIdToken(),
        cursor: previous?.cursor, auditCursor: previous?.auditCursor,
        activityDone: previous?.activityDone, auditDone: previous?.auditDone });
      if (generationId !== generation.current) return;
      if (!result.success) throw new Error(result.error);
      setEvents(old => previous ? [...old, ...result.events] : result.events);
      setPage(result);
    } catch (err) {
      if (generationId === generation.current) setError(err instanceof Error ? err.message : 'Unable to load activity.');
    } finally {
      if (lock.current === generationId) lock.current = null;
      if (generationId === generation.current) setBusy(false);
    }
  }, [auth, order.id]);
  useEffect(() => {
    const id = ++generation.current;
    setEvents([]); setPage(null);
    if (enabled) void load(null, id);
    return () => { generation.current++; };
  }, [enabled, order.id, order.workflowRevision, load]);
  return { events: mergeOrderActivity(order, events), busy, error,
    hasMore: Boolean(page && (!page.activityDone || !page.auditDone)),
    loadMore: () => load(page, generation.current) };
}
