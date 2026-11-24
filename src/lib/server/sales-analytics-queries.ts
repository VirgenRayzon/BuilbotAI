"use server";

import { getOrderActor } from '@/lib/server/order-auth';
import type { AnalyticsBucket } from '@/lib/analytics-rollups';
import { formatDayKey, formatMonthKey } from '@/lib/analytics-rollups';

export interface SalesDashboardFinancials {
  placedOrderValue: number;
  collectedPayments: number;
  refundsIssued: number;
  netSales: number;
  totalOrderCount: number;
  activeOrderCount: number;
  paidOrderCount: number;
  cancelledOrderCount: number;
}

export interface SalesDashboardSummary {
  range: 'week' | 'month' | 'year';
  financials: SalesDashboardFinancials;
  aov: number;
  cancellationRate: number;
  revenueData: Array<{ name: string; revenue: number; bucketKey: string }>;
  categoryData: Array<{ name: string; value: number }>;
  statusData: Array<{ name: string; value: number; color: string }>;
  prebuiltTierData: Array<{ name: string; value: number; color: string }>;
  buckets: AnalyticsBucket[];
}

export async function fetchSalesDashboardSummary(
  idToken: string,
  range: 'week' | 'month' | 'year' = 'week'
): Promise<SalesDashboardSummary> {
  if (!idToken || typeof idToken !== 'string') {
    throw new Error('Authentication token is required.');
  }

  const { firestore, isStaff } = await getOrderActor(idToken);
  if (!isStaff) {
    throw new Error('Only Managers and Super Admins can access sales analytics.');
  }

  const now = new Date();
  const buckets: AnalyticsBucket[] = [];
  const revenueData: Array<{ name: string; revenue: number; bucketKey: string }> = [];

  if (range === 'year') {
    // 12 monthly buckets
    const monthKeys: string[] = [];
    const datePoints: Date[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      datePoints.push(d);
      monthKeys.push(formatMonthKey(d));
    }

    const refs = monthKeys.map((key) => firestore.collection('analyticsMonthly').doc(key));
    const snaps = await firestore.getAll(...refs);

    snaps.forEach((snap, idx) => {
      const d = datePoints[idx];
      const name = d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }) + " '" + d.getUTCFullYear().toString().slice(-2);
      const data = snap.exists ? (snap.data() as AnalyticsBucket) : null;
      const bucket: AnalyticsBucket = {
        bucketKey: monthKeys[idx],
        grossCollectedPhp: Number(data?.grossCollectedPhp || 0),
        refundedPhp: Number(data?.refundedPhp || 0),
        netCollectedPhp: Number(data?.netCollectedPhp || 0),
        paidOrderCount: Number(data?.paidOrderCount || 0),
        cancelledOrderCount: Number(data?.cancelledOrderCount || 0),
        customOrderCount: Number(data?.customOrderCount || 0),
        prebuiltOrderCount: Number(data?.prebuiltOrderCount || 0),
        byPaymentMethod: data?.byPaymentMethod || {},
        partUnitsSold: data?.partUnitsSold || {},
        updatedAt: Number(data?.updatedAt || 0),
      };
      buckets.push(bucket);
      revenueData.push({
        name,
        revenue: bucket.netCollectedPhp,
        bucketKey: bucket.bucketKey,
      });
    });
  } else {
    // Daily buckets: 7 days for 'week', 30 days for 'month'
    const daysCount = range === 'month' ? 30 : 7;
    const dayKeys: string[] = [];
    const datePoints: Date[] = [];

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
      datePoints.push(d);
      dayKeys.push(formatDayKey(d));
    }

    const refs = dayKeys.map((key) => firestore.collection('analyticsDaily').doc(key));
    const snaps = await firestore.getAll(...refs);

    snaps.forEach((snap, idx) => {
      const d = datePoints[idx];
      const name = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
      const data = snap.exists ? (snap.data() as AnalyticsBucket) : null;
      const bucket: AnalyticsBucket = {
        bucketKey: dayKeys[idx],
        grossCollectedPhp: Number(data?.grossCollectedPhp || 0),
        refundedPhp: Number(data?.refundedPhp || 0),
        netCollectedPhp: Number(data?.netCollectedPhp || 0),
        paidOrderCount: Number(data?.paidOrderCount || 0),
        cancelledOrderCount: Number(data?.cancelledOrderCount || 0),
        customOrderCount: Number(data?.customOrderCount || 0),
        prebuiltOrderCount: Number(data?.prebuiltOrderCount || 0),
        byPaymentMethod: data?.byPaymentMethod || {},
        partUnitsSold: data?.partUnitsSold || {},
        updatedAt: Number(data?.updatedAt || 0),
      };
      buckets.push(bucket);
      revenueData.push({
        name,
        revenue: bucket.netCollectedPhp,
        bucketKey: bucket.bucketKey,
      });
    });
  }

  // Aggregate summary KPIs
  let grossCollectedPhp = 0;
  let refundedPhp = 0;
  let netCollectedPhp = 0;
  let paidOrderCount = 0;
  let cancelledOrderCount = 0;
  let customOrderCount = 0;
  let prebuiltOrderCount = 0;
  const mergedPartsMap: Record<string, number> = {};

  for (const b of buckets) {
    grossCollectedPhp += b.grossCollectedPhp;
    refundedPhp += b.refundedPhp;
    netCollectedPhp += b.netCollectedPhp;
    paidOrderCount += b.paidOrderCount;
    cancelledOrderCount += b.cancelledOrderCount;
    customOrderCount += b.customOrderCount;
    prebuiltOrderCount += b.prebuiltOrderCount;

    for (const [partKey, count] of Object.entries(b.partUnitsSold || {})) {
      mergedPartsMap[partKey] = (mergedPartsMap[partKey] || 0) + count;
    }
  }

  const categoryData = Object.entries(mergedPartsMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const totalOrderCount = paidOrderCount + cancelledOrderCount;
  const activeOrderCount = paidOrderCount;
  const aov = paidOrderCount > 0 ? Math.round((netCollectedPhp / paidOrderCount) * 100) / 100 : 0;
  const cancellationRate = totalOrderCount > 0
    ? Math.round(((cancelledOrderCount / totalOrderCount) * 100) * 100) / 100
    : 0;

  const financials: SalesDashboardFinancials = {
    placedOrderValue: Math.round(grossCollectedPhp * 100) / 100,
    collectedPayments: Math.round(grossCollectedPhp * 100) / 100,
    refundsIssued: Math.round(refundedPhp * 100) / 100,
    netSales: Math.round(netCollectedPhp * 100) / 100,
    totalOrderCount,
    activeOrderCount,
    paidOrderCount,
    cancelledOrderCount,
  };

  const statusData = [
    { name: 'Paid / Completed', value: paidOrderCount, color: '#10b981' },
    { name: 'Cancelled / Void', value: cancelledOrderCount, color: '#ef4444' },
  ].filter((d) => d.value > 0);

  const prebuiltTierData = [
    { name: 'Custom Builds', value: customOrderCount, color: '#22d3ee' },
    { name: 'Prebuilt Systems', value: prebuiltOrderCount, color: '#818cf8' },
  ].filter((d) => d.value > 0);

  return {
    range,
    financials,
    aov,
    cancellationRate,
    revenueData,
    categoryData,
    statusData: statusData.length > 0 ? statusData : [{ name: 'No Orders', value: 0, color: '#94a3b8' }],
    prebuiltTierData: prebuiltTierData.length > 0 ? prebuiltTierData : [{ name: 'No Orders', value: 0, color: '#94a3b8' }],
    buckets,
  };
}

export async function getSalesDashboardSummaryAction(input: {
  idToken: string;
  range: 'week' | 'month' | 'year';
}): Promise<SalesDashboardSummary> {
  return fetchSalesDashboardSummary(input.idToken, input.range);
}
