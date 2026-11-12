import type { Order } from '@/lib/types';

export const HEAD_ORDERS_LIMIT = 25;

export interface HeadOrdersQueryConfig {
  collection: 'orders';
  orderByField: 'createdAt';
  orderDirection: 'desc';
  limit: number;
}

export function createOrdersHeadQueryConfig(limitCount = HEAD_ORDERS_LIMIT): HeadOrdersQueryConfig {
  return {
    collection: 'orders',
    orderByField: 'createdAt',
    orderDirection: 'desc',
    limit: limitCount,
  };
}

export function mergePagedOrders(existing: Order[], incoming: Order[]): Order[] {
  const existingIds = new Set(existing.map(o => o.id));
  const newOrders = incoming.filter(o => !existingIds.has(o.id));
  return [...existing, ...newOrders];
}

export function deriveOrdersStats(stageCounts: Record<string, number>, totalCount: number) {
  const orderPlaced = stageCounts['order_placed'] ?? stageCounts['orderPlaced'] ?? 0;
  const assembling = stageCounts['assembling_testing'] ?? stageCounts['assembling'] ?? stageCounts['assemblingTesting'] ?? 0;
  const outForDelivery = stageCounts['out_for_delivery'] ?? stageCounts['outForDelivery'] ?? 0;
  const delivered = stageCounts['delivered'] ?? 0;
  const cancelled = stageCounts['cancelled'] ?? 0;

  return {
    pendingOrdersCount: orderPlaced,
    completedOrdersCount: delivered,
    cancelledOrdersCount: cancelled,
    totalOrdersCount: totalCount,
    stageCounts: {
      orderPlaced,
      assembling,
      outForDelivery,
      delivered,
      cancelled,
      ...stageCounts,
    },
  };
}

export function shouldTriggerHeadRefresh(prevHeadIds: string, nextHeadIds: string): boolean {
  return Boolean(prevHeadIds && prevHeadIds !== nextHeadIds);
}

export function shouldTriggerAuthFetch(
  currentUser: { uid?: string } | null | undefined,
  profile?: { id?: string; uid?: string } | null
): boolean {
  return Boolean(currentUser?.uid || profile?.id || profile?.uid);
}
