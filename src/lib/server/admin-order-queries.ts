import { z } from 'zod';
import { FieldPath, type Query, type QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/firebase/server-init';
import { getOrderActor } from './order-auth';
import { getOrderFulfillmentStage, getRefundedAmount } from '@/lib/order-workflow';
import { isSimulatedPaymentMethod } from '@/lib/payment-methods';
import type { Order } from '@/lib/types';
import type { OrderUnifiedFilterStage } from '@/app/admin/components/orders/order-status-config';

export const adminOrderQuerySchema = z.object({
  archived: z.boolean().default(false),
  stage: z.enum([
    'all',
    'order_placed',
    'assembling_testing',
    'out_for_delivery',
    'delivered',
    'cancelled',
  ]).default('all'),
  paymentStatus: z.string().optional(),
  paymentMethod: z.string().optional(),
  refundStatus: z.string().optional(),
  search: z.string().max(120).optional(),
  sortBy: z.enum(['newest', 'oldest', 'price-high', 'price-low']).default('newest'),
  pageSize: z.number().int().min(1).max(50).default(25),
  cursor: z.string().nullable().optional(),
});

export type AdminOrderQuery = z.infer<typeof adminOrderQuerySchema>;
export { adminOrderQuerySchema as AdminOrderQuerySchema };

export function serializeFirestoreData<T>(val: T): T {
  if (val === null || val === undefined) {
    return val;
  }
  if (typeof (val as unknown as { toDate?: () => Date }).toDate === 'function') {
    return (val as unknown as { toDate: () => Date }).toDate().toISOString() as unknown as T;
  }
  if (val instanceof Date) {
    return val.toISOString() as unknown as T;
  }
  if (Array.isArray(val)) {
    return val.map(item => serializeFirestoreData(item)) as unknown as T;
  }
  if (typeof val === 'object') {
    const obj = val as Record<string, unknown>;
    if (typeof obj._seconds === 'number' && typeof obj._nanoseconds === 'number') {
      return new Date(obj._seconds * 1000 + obj._nanoseconds / 1000000).toISOString() as unknown as T;
    }
    const res: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      res[key] = serializeFirestoreData(value);
    }
    return res as T;
  }
  return val;
}

export interface AdminOrdersPageResult {
  orders: Order[];
  totalCount: number;
  stageCounts: Record<string, number>;
  nextCursor: string | null;
}

export interface AdminOrderQueryDeps {
  getOrderActor?: (idToken: string) => Promise<{
    decoded: unknown;
    isStaff: boolean;
    isManager: boolean;
    isSuperAdmin: boolean;
  }>;
  firestore?: FirebaseFirestore.Firestore;
  isIndexedEnabled?: boolean;
}

const STAGES = [
  'order_placed',
  'assembling_testing',
  'out_for_delivery',
  'delivered',
  'cancelled',
] as const;

function matchesOrderSearch(order: Order, queryText?: string): boolean {
  if (!queryText) return true;
  const q = queryText.toLowerCase().trim();
  if (!q) return true;
  const emailMatch = order.userEmail?.toLowerCase().includes(q);
  const idMatch = order.id?.toLowerCase().includes(q);
  const orderNumMatch = order.orderNumber?.toLowerCase().includes(q);
  const paymentRefMatch = order.paymentReference?.toLowerCase().includes(q);
  const prebuiltMatch = order.prebuiltName?.toLowerCase().includes(q);
  const recipientMatch = order.shippingAddress?.fullName?.toLowerCase().includes(q);
  const partsMatch = order.items?.some((it) => it.name?.toLowerCase().includes(q));
  const refundRefMatch = order.refunds?.some((r) => r.reference?.toLowerCase().includes(q));
  return Boolean(
    emailMatch ||
    idMatch ||
    orderNumMatch ||
    paymentRefMatch ||
    prebuiltMatch ||
    recipientMatch ||
    partsMatch ||
    refundRefMatch
  );
}

function matchesOrderFilters(
  order: Order,
  options: AdminOrderQuery
): boolean {
  if (options.stage !== 'all') {
    const stage = order.status === 'cancelled' ? 'cancelled' : (order.queueStage || getOrderFulfillmentStage(order));
    if (stage !== options.stage) return false;
  }

  if (options.paymentStatus && options.paymentStatus !== 'all') {
    const effectivePayment = order.paymentStatus || (isSimulatedPaymentMethod(order.paymentMethod) ? 'pending' : 'unpaid');
    if (effectivePayment !== options.paymentStatus) return false;
  }

  if (options.paymentMethod && options.paymentMethod !== 'all') {
    const effectiveMethod = order.paymentMethod || 'cod';
    if (effectiveMethod !== options.paymentMethod) return false;
  }

  if (options.refundStatus && options.refundStatus !== 'all') {
    const effectiveRefund = order.pendingRefundOperationId
      ? 'pending'
      : order.refundStatus && order.refundStatus !== 'none'
        ? order.refundStatus
        : getRefundedAmount(order) > 0
          ? 'partial'
          : 'none';
    if (effectiveRefund !== options.refundStatus) return false;
  }

  return matchesOrderSearch(order, options.search);
}

export async function listAdminOrdersPage(
  idToken: string,
  rawOptions: unknown,
  deps?: AdminOrderQueryDeps
): Promise<AdminOrdersPageResult> {
  const actorResolver = deps?.getOrderActor || getOrderActor;
  const actor = await actorResolver(idToken);
  if (!actor || !actor.isStaff) {
    throw new Error('Unauthorized: Staff access required.');
  }

  const options = adminOrderQuerySchema.parse(rawOptions ?? {});
  const db = deps?.firestore || getAdminFirestore();

  const isIndexedMode =
    options.archived === true ||
    (deps?.isIndexedEnabled ?? (process.env.NEXT_PUBLIC_ORDERS_INDEXED_ENABLED === 'true'));

  if (isIndexedMode) {
    let base: Query = db.collection('orders').where('isArchived', '==', options.archived);

    if (options.stage !== 'all') {
      base = base.where('queueStage', '==', options.stage);
    }
    if (options.paymentStatus && options.paymentStatus !== 'all') {
      base = base.where('paymentStatus', '==', options.paymentStatus);
    }

    let query = base;
    if (options.sortBy === 'oldest') {
      query = query.orderBy('createdAt', 'asc').orderBy(FieldPath.documentId(), 'asc');
    } else if (options.sortBy === 'price-high') {
      query = query.orderBy('totalPrice', 'desc').orderBy(FieldPath.documentId(), 'desc');
    } else if (options.sortBy === 'price-low') {
      query = query.orderBy('totalPrice', 'asc').orderBy(FieldPath.documentId(), 'asc');
    } else {
      query = query.orderBy('createdAt', 'desc').orderBy(FieldPath.documentId(), 'desc');
    }

    if (options.cursor) {
      const cursorDoc = await (db.doc ? db.doc(`orders/${options.cursor}`).get() : db.collection('orders').doc(options.cursor).get());
      if (cursorDoc && cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    // Parallel count queries for stage badges and total
    const countsBase = db.collection('orders').where('isArchived', '==', options.archived);
    const stageCountPromises = STAGES.map(async stage => {
      try {
        const snap = await countsBase.where('queueStage', '==', stage).count().get();
        return [stage, snap.data().count] as const;
      } catch {
        return [stage, 0] as const;
      }
    });

    const totalCountPromise = base.count().get().then(s => s.data().count).catch(() => 0);

    query = query.limit(options.pageSize + 1);

    const [stageCountEntries, totalCount, snapshot] = await Promise.all([
      Promise.all(stageCountPromises),
      totalCountPromise,
      query.get(),
    ]);

    const stageCounts: Record<string, number> = Object.fromEntries(stageCountEntries);
    stageCounts.orderPlaced = stageCounts.order_placed || 0;
    stageCounts.assembling = stageCounts.assembling_testing || 0;
    stageCounts.assemblingTesting = stageCounts.assembling_testing || 0;
    stageCounts.outForDelivery = stageCounts.out_for_delivery || 0;
    stageCounts.total = totalCount;

    const hasPostFilter = Boolean(
      (options.paymentMethod && options.paymentMethod !== 'all') ||
      (options.refundStatus && options.refundStatus !== 'all') ||
      options.search
    );

    let docs = snapshot.docs;
    let orders = docs.map(d => ({ id: d.id, ...d.data() }) as Order);

    if (hasPostFilter) {
      orders = orders.filter(o => matchesOrderFilters(o, options));
    }

    const effectiveTotalCount = hasPostFilter ? orders.length : totalCount;

    const hasMore = orders.length > options.pageSize;
    const pagedOrders = hasMore ? orders.slice(0, options.pageSize) : orders;
    const nextCursor = hasMore && pagedOrders.length > 0 ? pagedOrders[pagedOrders.length - 1].id : null;

    const serializedOrders = pagedOrders.map(o => serializeFirestoreData(o));

    return {
      orders: serializedOrders,
      totalCount: effectiveTotalCount,
      stageCounts,
      nextCursor,
    };
  }

  // Pre-backfill safe mode (archived === false and NEXT_PUBLIC_ORDERS_INDEXED_ENABLED !== 'true')
  let query: Query = db.collection('orders');
  if (options.sortBy === 'oldest') {
    query = query.orderBy('createdAt', 'asc').orderBy(FieldPath.documentId(), 'asc');
  } else if (options.sortBy === 'price-high') {
    query = query.orderBy('totalPrice', 'desc').orderBy(FieldPath.documentId(), 'desc');
  } else if (options.sortBy === 'price-low') {
    query = query.orderBy('totalPrice', 'asc').orderBy(FieldPath.documentId(), 'asc');
  } else {
    query = query.orderBy('createdAt', 'desc').orderBy(FieldPath.documentId(), 'desc');
  }

  if (options.cursor) {
    const cursorDoc = await (db.doc ? db.doc(`orders/${options.cursor}`).get() : db.collection('orders').doc(options.cursor).get());
    if (cursorDoc && cursorDoc.exists) {
      query = query.startAfter(cursorDoc);
    }
  }

  const batchSize = Math.max(options.pageSize * 2, 50);
  query = query.limit(batchSize);

  const snapshot = await query.get();
  const allScannedOrders = snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as Order);

  // Compute stageCounts dynamically across scanned docs
  const counts: Record<string, number> = {
    order_placed: 0,
    assembling_testing: 0,
    out_for_delivery: 0,
    delivered: 0,
    cancelled: 0,
  };

  const matchingOrders: Order[] = [];
  for (const order of allScannedOrders) {
    const isArchived = Boolean(order.isArchived);
    if (isArchived !== options.archived) continue;

    const stage = order.status === 'cancelled' ? 'cancelled' : (order.queueStage || getOrderFulfillmentStage(order));
    if (stage in counts) counts[stage]++;

    if (matchesOrderFilters(order, options)) {
      matchingOrders.push(order);
    }
  }

  const hasMore = matchingOrders.length > options.pageSize;
  const pagedOrders = hasMore ? matchingOrders.slice(0, options.pageSize) : matchingOrders;
  const nextCursor = hasMore && pagedOrders.length > 0 ? pagedOrders[pagedOrders.length - 1].id : null;

  counts.orderPlaced = counts.order_placed;
  counts.assembling = counts.assembling_testing;
  counts.assemblingTesting = counts.assembling_testing;
  counts.outForDelivery = counts.out_for_delivery;
  counts.total = matchingOrders.length;

  const serializedOrders = pagedOrders.map(o => serializeFirestoreData(o));

  return {
    orders: serializedOrders,
    totalCount: matchingOrders.length,
    stageCounts: counts,
    nextCursor,
  };
}
