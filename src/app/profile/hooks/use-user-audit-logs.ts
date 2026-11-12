"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { onIdTokenChanged } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { useUserProfile } from '@/context/user-profile';
import { fetchUserAuditLogsPageAction } from '@/app/profile/audit-log-actions';
import type { UserAuditLog } from '@/lib/types';

export interface UserAuditLogFilters {
  scope?: string;
  fromDate?: string;
  toDate?: string;
  pageSize?: number;
  sortBy?: 'newest' | 'oldest';
}

export interface UseUserAuditLogsOptions extends UserAuditLogFilters {}

export function useUserAuditLogs(options?: UseUserAuditLogsOptions) {
  const [filters, setFilters] = useState<UserAuditLogFilters>({
    scope: options?.scope,
    fromDate: options?.fromDate,
    toDate: options?.toDate,
    pageSize: options?.pageSize ?? 25,
    sortBy: options?.sortBy ?? 'newest',
  });

  const auth = useAuth();
  const { authUser, profile } = useUserProfile();

  const [logs, setLogs] = useState<UserAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const requestIdRef = useRef(0);

  // Cold-start auth listener
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onIdTokenChanged(auth, (user) => {
      if (user) {
        setRefreshTrigger((v) => v + 1);
      } else if (!user && !authUser && !profile) {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [auth, authUser, profile]);

  useEffect(() => {
    if (authUser?.uid || profile?.id) {
      setRefreshTrigger((v) => v + 1);
    }
  }, [authUser?.uid, profile?.id]);

  const fetchInitial = useCallback(async () => {
    const user = auth?.currentUser;
    if (!user) {
      if (!authUser && !profile) {
        setLoading(false);
      }
      return;
    }

    const currentId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const idToken = await user.getIdToken();
      const res = await fetchUserAuditLogsPageAction(idToken, {
        scope: filters.scope,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        pageSize: filters.pageSize ?? 25,
        sortBy: filters.sortBy ?? 'newest',
        cursor: null,
      });

      if (currentId !== requestIdRef.current) return;

      if (res.success) {
        setLogs(res.logs);
        setTotalCount(res.totalCount);
        setNextCursor(res.nextCursor);
        setHasMore(res.hasMore);
      } else {
        setError(res.error);
      }
    } catch (err) {
      if (currentId !== requestIdRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to fetch user audit logs.');
    } finally {
      if (currentId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [auth, authUser, profile, filters]);

  useEffect(() => {
    void fetchInitial();
  }, [fetchInitial, refreshTrigger]);

  const loadMore = useCallback(async () => {
    if (!hasMore || !nextCursor || loadingMore) return;
    const user = auth?.currentUser;
    if (!user) return;

    setLoadingMore(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetchUserAuditLogsPageAction(idToken, {
        scope: filters.scope,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        pageSize: filters.pageSize ?? 25,
        sortBy: filters.sortBy ?? 'newest',
        cursor: nextCursor,
      });

      if (res.success) {
        setLogs((prev) => {
          const seen = new Set(prev.map((l) => l.id));
          const unique = res.logs.filter((l) => !seen.has(l.id));
          return [...prev, ...unique];
        });
        setNextCursor(res.nextCursor);
        setHasMore(res.hasMore);
      }
    } catch (err) {
      console.warn('Failed to load more user audit logs:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, nextCursor, loadingMore, auth, filters]);

  const refresh = useCallback(async () => {
    await fetchInitial();
  }, [fetchInitial]);

  return {
    logs,
    loading,
    totalCount,
    hasMore,
    loadMore,
    refresh,
    isLoadingMore: loadingMore,
    error,
    filters,
    setFilters,
  };
}
