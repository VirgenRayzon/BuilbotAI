import { z } from 'zod';
import type { Order } from '@/lib/types';

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
