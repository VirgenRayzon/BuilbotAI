'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PrebuiltSystem } from '@/lib/types';
import { fetchPrebuiltSystemsPageAction } from '@/app/pre-builts/prebuilt-catalog-actions';

interface UsePrebuiltCatalogOptions {
  tiers: string[];
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  pageSize?: number;
}

export function usePrebuiltCatalog({
  tiers,
  sortBy,
  sortDirection,
  pageSize = 24,
}: UsePrebuiltCatalogOptions) {
  const [systems, setSystems] = useState<PrebuiltSystem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);

  const fetchInitial = useCallback(async () => {
    const currentId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const response = await fetchPrebuiltSystemsPageAction({
        includeArchived: false,
        tiers,
        sortBy,
        sortDirection,
        pageSize,
        cursor: null,
      });

      if (currentId !== requestIdRef.current) return;

      if (response.success) {
        setSystems(response.items);
        setNextCursor(response.nextCursor);
        setHasMore(response.hasMore);
      } else {
        setError(response.error || 'Failed to load pre-built systems.');
      }
    } catch (err) {
      if (currentId !== requestIdRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load pre-built systems.');
    } finally {
      if (currentId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [tiers, sortBy, sortDirection, pageSize]);

  useEffect(() => {
    void fetchInitial();
  }, [fetchInitial]);

  const loadMore = useCallback(async () => {
    if (!hasMore || !nextCursor || loadingMore) return;
    setLoadingMore(true);

    try {
      const response = await fetchPrebuiltSystemsPageAction({
        includeArchived: false,
        tiers,
        sortBy,
        sortDirection,
        pageSize,
        cursor: nextCursor,
      });

      if (response.success) {
        setSystems(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNew = response.items.filter(p => !existingIds.has(p.id));
          return [...prev, ...uniqueNew];
        });
        setNextCursor(response.nextCursor);
        setHasMore(response.hasMore);
      }
    } catch (err) {
      console.warn('Failed to load more pre-built systems:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, nextCursor, loadingMore, tiers, sortBy, sortDirection, pageSize]);

  return {
    systems,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    refresh: fetchInitial,
  };
}
