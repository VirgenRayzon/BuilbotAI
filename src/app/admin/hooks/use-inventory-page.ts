'use client';

import { useAuth, useFirestore } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { inventoryItemPath } from '@/lib/inventory-paths';
import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchAdminInventoryPageAction } from '../inventory-query-actions';
import type { AdminInventoryQuery } from '@/lib/admin-inventory-query';
import type { Part } from '@/lib/types';

export function useInventoryPage(options: AdminInventoryQuery, enabled: boolean) {
  const auth = useAuth();
  const firestore = useFirestore();
  const [parts, setParts] = useState<Part[]>([]);
  const [count, setCount] = useState(0);
  const [brandFacets, setBrandFacets] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const cursors = useRef<Array<string | null>>([null]);
  const requestId = useRef(0);
  const filterKey = JSON.stringify({ ...options, cursor: undefined });
  const currentUid = auth?.currentUser?.uid;

  useEffect(() => {
    setParts([]);
    setCount(0);
    cursors.current = [null];
    setPage(1);
  }, [currentUid]);

  useEffect(() => {
    if (!enabled) return;
    const trigger = () => setRefresh(value => value + 1);
    window.addEventListener('inventory-page-refresh', trigger);
    window.addEventListener('focus', trigger);
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') trigger();
    }, 30_000);
    return () => {
      window.removeEventListener('inventory-page-refresh', trigger);
      window.removeEventListener('focus', trigger);
      window.clearInterval(interval);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !firestore) return;
    const unsubscribers = parts.map(part => {
      let initialized = false;
      return onSnapshot(doc(firestore, inventoryItemPath(part.category, part.id)), () => {
        if (initialized) setRefresh(value => value + 1);
        initialized = true;
      });
    });
    return () => unsubscribers.forEach(unsubscribe => unsubscribe());
  }, [enabled, firestore, parts]);

  useEffect(() => {
    cursors.current = [null];
    setPage(1);
  }, [filterKey]);

  useEffect(() => {
    if (!enabled) return;
    const user = auth?.currentUser;
    if (!user) return;
    const id = ++requestId.current;
    let cancelled = false;
    setLoading(true);
    setError(null);
    user.getIdToken().then(idToken => fetchAdminInventoryPageAction({
      idToken,
      options: { ...options, cursor: cursors.current[page - 1] || null },
    })).then(result => {
      if (cancelled || id !== requestId.current) return;
      setParts(result.parts);
      setCount(result.count);
      if (result.brandFacets) setBrandFacets(result.brandFacets);
      cursors.current[page] = result.nextCursor;
      setLoading(false);
    }).catch(failure => {
      if (cancelled || id !== requestId.current) return;
      if (page > 1 && failure instanceof Error && failure.message.includes('cursor is stale')) {
        cursors.current = [null];
        setPage(1);
        return;
      }
      setError(failure instanceof Error ? failure.message : 'Inventory could not be loaded.');
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [auth, enabled, filterKey, options, page, refresh]);

  const navigate = useCallback((target: number) => {
    if (target < 1 || target > page + 1 || (target > page && !cursors.current[page])) return;
    setPage(target);
  }, [page]);

  return { parts, count, brandFacets, loading, error, page, navigate, refresh: () => setRefresh(value => value + 1) };
}
