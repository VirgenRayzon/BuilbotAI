"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { onIdTokenChanged } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { useUserProfile } from '@/context/user-profile';
import { fetchStaffAuditLogsPageAction } from '@/app/profile/audit-log-actions';
import type { AuditLog } from '@/lib/types';

export interface AuditLogFilters {
  scope?: string;
  fromDate?: string;
  toDate?: string;
  pageSize?: number;
  sortBy?: 'newest' | 'oldest';
}

export interface UseAuditLogsOptions extends AuditLogFilters {
  enabled?: boolean;
}

export function useAuditLogs(enabledOrOptions: boolean | UseAuditLogsOptions = true) {
  const options = typeof enabledOrOptions === 'boolean'
    ? { enabled: enabledOrOptions }
    : enabledOrOptions;

  const enabled = options.enabled ?? true;

  const [filters, setFilters] = useState<AuditLogFilters>({
    scope: options.scope,
    fromDate: options.fromDate,
    toDate: options.toDate,
    pageSize: options.pageSize ?? 25,
    sortBy: options.sortBy ?? 'newest',
  });

  const auth = useAuth();
  const { profile } = useUserProfile();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [auditLogsCount, setAuditLogsCount] = useState(0);
  const [loading, setLoading] = useState(enabled);
  const [loadingMore, setLoadingMore] = useState(false);
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
      } else if (!user && !profile) {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [auth, profile]);

  useEffect(() => {
    if (profile?.id) {
      setRefreshTrigger((v) => v + 1);
    }
  }, [profile?.id]);

  const fetchInitial = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const user = auth?.currentUser;
    if (!user) {
      if (!profile) {
        setLoading(false);
      }
      return;
    }

    const currentId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const idToken = await user.getIdToken();
      const res = await fetchStaffAuditLogsPageAction(idToken, {
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
        setAuditLogsCount(res.totalCount);
        setNextCursor(res.nextCursor);
        setHasMore(res.hasMore);
      } else {
        setError(res.error);
      }
    } catch (err) {
      if (currentId !== requestIdRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to fetch audit logs.');
    } finally {
      if (currentId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [enabled, auth, profile, filters]);

  useEffect(() => {
    void fetchInitial();
  }, [fetchInitial, refreshTrigger]);

  const loadMore = useCallback(async () => {
    if (!hasMore || !nextCursor || loadingMore || !enabled) return;
    const user = auth?.currentUser;
    if (!user) return;

    setLoadingMore(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetchStaffAuditLogsPageAction(idToken, {
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
      console.warn('Failed to load more audit logs:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, nextCursor, loadingMore, enabled, auth, filters]);

  const refresh = useCallback(async () => {
    await fetchInitial();
  }, [fetchInitial]);

  return {
    auditLogs: logs,
    auditLogsLoading: loading,
    auditLogsCount,
    totalCount: auditLogsCount,
    hasMore,
    loadMore,
    refresh,
    isLoadingMore: loadingMore,
    error,
    filters,
    setFilters,
  };
}
