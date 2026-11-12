"use client";

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { useTheme } from '@/context/theme-provider';
import { Skeleton, Stack } from '@mantine/core';
import type { Order, Part, PrebuiltSystem } from '@/lib/types';
import { useUserProfile } from '@/context/user-profile';
import {
  getSalesDashboardSummaryAction,
  type SalesDashboardSummary,
} from '@/lib/server/sales-analytics-queries';
import { SalesFinancialKpis } from './sales-financial-kpis';
import { SalesOverviewCharts } from './sales-overview-charts';
import { SalesPopularityView } from './sales-popularity-view';

interface SalesAnalyticsProps {
  orders?: Order[];
  parts: Part[];
  prebuilts: PrebuiltSystem[];
  activeSubTab?: 'overview' | 'popularity';
}

const subscribeToHydration = () => () => {};

export function SalesAnalytics({
  orders: _orders,
  parts,
  prebuilts: _prebuilts,
  activeSubTab = 'overview',
}: SalesAnalyticsProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const mounted = useSyncExternalStore(subscribeToHydration, () => true, () => false);

  const { authUser, profile } = useUserProfile();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  const [summary, setSummary] = useState<SalesDashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;

    async function loadSummary() {
      // Cold-start handling: wait for auth resolution, don't hang if unauthenticated
      if (!authUser) {
        if (!profile) {
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const idToken = await authUser.getIdToken();
        const data = await getSalesDashboardSummaryAction({ idToken, range: timeRange });
        if (!cancelled) {
          setSummary(data);
        }
      } catch (err) {
        console.error('Failed to load pre-aggregated sales dashboard summary:', err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSummary();
    return () => {
      cancelled = true;
    };
  }, [authUser, profile, timeRange]);

  const defaultFinancials = {
    placedOrderValue: 0,
    collectedPayments: 0,
    refundsIssued: 0,
    netSales: 0,
    totalOrderCount: 0,
    activeOrderCount: 0,
    paidOrderCount: 0,
    cancelledOrderCount: 0,
  };

  const financials = summary?.financials || defaultFinancials;
  const aov = summary?.aov || 0;
  const cancellationRate = summary?.cancellationRate || 0;
  const revenueData = summary?.revenueData || [];
  const statusData = summary?.statusData || [];
  const prebuiltTierData = summary?.prebuiltTierData || [];
  const categoryData = summary?.categoryData || [];

  return (
    <div className="space-y-6">
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          <SalesFinancialKpis
            financials={financials}
            aov={aov}
            cancellationRate={cancellationRate}
          />

          {loading && !summary ? (
            <Stack gap="md">
              <Skeleton height={280} radius="lg" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Skeleton height={260} radius="lg" />
                <Skeleton height={260} radius="lg" className="lg:col-span-2" />
              </div>
            </Stack>
          ) : (
            <SalesOverviewCharts
              revenueData={revenueData}
              statusData={statusData}
              prebuiltTierData={prebuiltTierData}
              categoryData={categoryData}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              mounted={mounted}
              isDark={isDark}
            />
          )}
        </div>
      )}

      {activeSubTab === 'popularity' && (
        <SalesPopularityView parts={parts || []} />
      )}
    </div>
  );
}
