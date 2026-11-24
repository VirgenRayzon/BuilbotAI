import { z } from 'zod';
import type { Order } from '@/lib/types';
import { getNetCollectedAmount } from '@/lib/order-workflow';

export const salesExportQuerySchema = z.object({
  timeRange: z.enum(['week', 'month', 'year', 'all']).default('all'),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
  format: z.enum(['xlsx', 'csv']).default('xlsx'),
  maxOrders: z.coerce.number().int().positive().max(10000).default(5000),
});

export type SalesExportQueryOptions = z.infer<typeof salesExportQuerySchema>;

export function validateSalesExportParams(rawInput: unknown): {
  success: true;
  data: SalesExportQueryOptions;
} | {
  success: false;
  error: string;
} {
  const parsed = salesExportQuerySchema.safeParse(rawInput || {});
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
    return { success: false, error: `Invalid export parameters: ${errorMsg}` };
  }

  const data = parsed.data;

  if (data.startDate && Number.isNaN(Date.parse(data.startDate))) {
    return { success: false, error: 'startDate must be a valid date string.' };
  }
  if (data.endDate && Number.isNaN(Date.parse(data.endDate))) {
    return { success: false, error: 'endDate must be a valid date string.' };
  }

  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate).getTime();
    const end = new Date(data.endDate).getTime();
    if (start > end) {
      return { success: false, error: 'startDate cannot be after endDate.' };
    }
  }

  return { success: true, data };
}

export interface TraverseOrdersPageResult {
  orders: Order[];
  nextCursor: string | null;
}

export interface TraverseOrdersOptions {
  fetchPage: (cursor: string | null) => Promise<TraverseOrdersPageResult>;
  maxOrders?: number;
}

export async function traverseOrdersInPages({
  fetchPage,
  maxOrders = 5000,
}: TraverseOrdersOptions): Promise<Order[]> {
  const allOrders: Order[] = [];
  let cursor: string | null = null;
  let hasMore = true;

  while (hasMore && allOrders.length < maxOrders) {
    const page = await fetchPage(cursor);
    if (!page.orders || page.orders.length === 0) {
      break;
    }

    allOrders.push(...page.orders);

    if (!page.nextCursor || page.orders.length < 250) {
      hasMore = false;
    } else {
      cursor = page.nextCursor;
    }
  }

  return allOrders;
}

export function aggregateExportRevenueData(
  orders: Order[],
  timeRange: 'week' | 'month' | 'year' | 'all' = 'all',
  _startDate?: Date,
  endDate?: Date
): Array<{ name: string; revenue: number }> {
  const safeOrders = orders || [];
  const dateMap = new Map<string, number>();

  for (const order of safeOrders) {
    if (order.status === 'cancelled' && order.paymentStatus !== 'paid') {
      continue;
    }
    const net = getNetCollectedAmount(order);
    if (net <= 0) continue;

    const rawDate = order.paidAt || order.createdAt;
    let d: Date;
    if (rawDate && typeof (rawDate as { toDate?: () => Date }).toDate === 'function') {
      d = (rawDate as { toDate: () => Date }).toDate();
    } else if (rawDate && typeof (rawDate as { seconds?: number }).seconds === 'number') {
      d = new Date((rawDate as { seconds: number }).seconds * 1000);
    } else if (rawDate instanceof Date) {
      d = rawDate;
    } else {
      d = new Date(rawDate as string | number);
    }

    if (Number.isNaN(d.getTime())) continue;

    const key =
      timeRange === 'year'
        ? d.toLocaleDateString('en-US', { month: 'short' }) + " '" + d.getFullYear().toString().slice(-2)
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    dateMap.set(key, (dateMap.get(key) || 0) + net);
  }

  if (timeRange === 'week' || timeRange === 'month' || timeRange === 'year') {
    const end = endDate || new Date();
    const pointsCount = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 12;
    const points: Array<{ name: string; revenue: number }> = [];

    for (let i = pointsCount - 1; i >= 0; i--) {
      let key = '';
      if (timeRange === 'year') {
        const d = new Date(end.getFullYear(), end.getMonth() - i, 1);
        key = d.toLocaleDateString('en-US', { month: 'short' }) + " '" + d.getFullYear().toString().slice(-2);
      } else {
        const d = new Date(end);
        d.setDate(d.getDate() - i);
        key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      points.push({
        name: key,
        revenue: Math.round((dateMap.get(key) || 0) * 100) / 100,
      });
    }

    for (const [key, rev] of dateMap.entries()) {
      if (!points.some((p) => p.name === key)) {
        points.unshift({ name: key, revenue: Math.round(rev * 100) / 100 });
      }
    }

    return points;
  }

  return Array.from(dateMap.entries()).map(([name, revenue]) => ({
    name,
    revenue: Math.round(revenue * 100) / 100,
  }));
}

