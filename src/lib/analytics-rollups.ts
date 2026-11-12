import type { Order, OrderItem, PaymentMethod } from './types';
import { getRefundedAmount } from './order-workflow';

export interface AnalyticsBucket {
  bucketKey: string;
  grossCollectedPhp: number;
  refundedPhp: number;
  netCollectedPhp: number;
  paidOrderCount: number;
  cancelledOrderCount: number;
  customOrderCount: number;
  prebuiltOrderCount: number;
  byPaymentMethod: Record<string, number>;
  partUnitsSold: Record<string, number>;
  updatedAt: number;
}

export interface PreparedAnalyticsRollup {
  eventRef: FirebaseFirestore.DocumentReference;
  dailyRef: FirebaseFirestore.DocumentReference;
  monthlyRef: FirebaseFirestore.DocumentReference;
  eventExists: boolean;
  dailyData: AnalyticsBucket | null;
  monthlyData: AnalyticsBucket | null;
  dayKey: string;
  monthKey: string;
}

interface BucketDelta {
  grossCollectedPhp: number;
  refundedPhp: number;
  netCollectedPhp: number;
  paidOrderCount: number;
  cancelledOrderCount: number;
  customOrderCount: number;
  prebuiltOrderCount: number;
  byPaymentMethod: Record<string, number>;
  partUnitsSold: Record<string, number>;
}

export function getOrderDate(order: Order): Date {
  const rawDate = order.paidAt || order.createdAt;
  if (!rawDate) return new Date();
  if (typeof (rawDate as { toDate?: () => Date }).toDate === 'function') {
    return (rawDate as { toDate: () => Date }).toDate();
  }
  if (typeof (rawDate as { seconds?: number }).seconds === 'number') {
    return new Date((rawDate as { seconds: number }).seconds * 1000);
  }
  if (rawDate instanceof Date) {
    return rawDate;
  }
  const parsed = new Date(rawDate as string | number);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function formatDayKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatMonthKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function isPrebuiltOrder(order: Order): boolean {
  return order.type === 'prebuilt' || Boolean(order.prebuiltName) || Boolean(order.prebuiltId);
}

function roundCurrency(val: number): number {
  return Math.round(val * 100) / 100;
}

function mergeCounters(base: Record<string, number>, delta: Record<string, number>): Record<string, number> {
  const result: Record<string, number> = { ...base };
  for (const [key, value] of Object.entries(delta)) {
    const nextVal = (result[key] || 0) + value;
    if (nextVal !== 0) {
      result[key] = nextVal;
    } else {
      delete result[key];
    }
  }
  return result;
}

export function calculateOrderDelta(beforeOrder: Order | null, afterOrder: Order): BucketDelta {
  const beforePaid = beforeOrder?.paymentStatus === 'paid';
  const afterPaid = afterOrder.paymentStatus === 'paid';

  const beforeRefunded = beforeOrder ? getRefundedAmount(beforeOrder) : 0;
  const afterRefunded = getRefundedAmount(afterOrder);
  const refundDelta = roundCurrency(afterRefunded - beforeRefunded);

  const beforeCancelled = beforeOrder?.status === 'cancelled';
  const afterCancelled = afterOrder.status === 'cancelled';
  const cancelledOrderCount = (!beforeCancelled && afterCancelled) ? 1 : (beforeCancelled && !afterCancelled) ? -1 : 0;

  let grossCollectedPhp = 0;
  let refundedPhp = 0;
  let netCollectedPhp = 0;
  let paidOrderCount = 0;
  let customOrderCount = 0;
  let prebuiltOrderCount = 0;
  const byPaymentMethod: Record<string, number> = {};
  const partUnitsSold: Record<string, number> = {};

  const orderMethod = afterOrder.paymentMethod || 'cod';

  if (!beforePaid && afterPaid) {
    // Transitioning from unpaid to paid
    paidOrderCount = 1;
    grossCollectedPhp = afterOrder.totalPrice || 0;
    refundedPhp = Math.max(0, refundDelta);
    netCollectedPhp = roundCurrency(grossCollectedPhp - refundedPhp);
    byPaymentMethod[orderMethod] = grossCollectedPhp;

    if (isPrebuiltOrder(afterOrder)) {
      prebuiltOrderCount = 1;
    } else {
      customOrderCount = 1;
    }

    for (const item of afterOrder.items || []) {
      const key = item.category || item.name || 'Other';
      const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
      partUnitsSold[key] = (partUnitsSold[key] || 0) + qty;
    }
  } else if (beforePaid && !afterPaid) {
    // Reversal from paid to unpaid
    const prevMethod = beforeOrder?.paymentMethod || orderMethod;
    const beforeGross = beforeOrder?.totalPrice || afterOrder.totalPrice || 0;
    const beforeNet = beforeGross - beforeRefunded;
    paidOrderCount = -1;
    grossCollectedPhp = -beforeGross;
    refundedPhp = -beforeRefunded;
    netCollectedPhp = -beforeNet;
    byPaymentMethod[prevMethod] = grossCollectedPhp;

    if (beforeOrder && isPrebuiltOrder(beforeOrder)) {
      prebuiltOrderCount = -1;
    } else {
      customOrderCount = -1;
    }

    for (const item of beforeOrder?.items || afterOrder.items || []) {
      const key = item.category || item.name || 'Other';
      const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
      partUnitsSold[key] = (partUnitsSold[key] || 0) - qty;
    }
  } else if (beforePaid && afterPaid) {
    // Stays paid, check refund changes
    refundedPhp = refundDelta;
    netCollectedPhp = -refundDelta;
  }

  return {
    grossCollectedPhp: roundCurrency(grossCollectedPhp),
    refundedPhp: roundCurrency(refundedPhp),
    netCollectedPhp: roundCurrency(netCollectedPhp),
    paidOrderCount,
    cancelledOrderCount,
    customOrderCount,
    prebuiltOrderCount,
    byPaymentMethod,
    partUnitsSold,
  };
}

function applyDeltaToBucket(
  existing: AnalyticsBucket | null | undefined,
  bucketKey: string,
  delta: BucketDelta
): AnalyticsBucket {
  return {
    bucketKey,
    grossCollectedPhp: roundCurrency((existing?.grossCollectedPhp || 0) + delta.grossCollectedPhp),
    refundedPhp: roundCurrency((existing?.refundedPhp || 0) + delta.refundedPhp),
    netCollectedPhp: roundCurrency((existing?.netCollectedPhp || 0) + delta.netCollectedPhp),
    paidOrderCount: Math.max(0, (existing?.paidOrderCount || 0) + delta.paidOrderCount),
    cancelledOrderCount: Math.max(0, (existing?.cancelledOrderCount || 0) + delta.cancelledOrderCount),
    customOrderCount: Math.max(0, (existing?.customOrderCount || 0) + delta.customOrderCount),
    prebuiltOrderCount: Math.max(0, (existing?.prebuiltOrderCount || 0) + delta.prebuiltOrderCount),
    byPaymentMethod: mergeCounters(existing?.byPaymentMethod || {}, delta.byPaymentMethod),
    partUnitsSold: mergeCounters(existing?.partUnitsSold || {}, delta.partUnitsSold),
    updatedAt: Date.now(),
  };
}

export async function prepareOrderAnalyticsDeltaInTx(
  tx: FirebaseFirestore.Transaction,
  db: FirebaseFirestore.Firestore,
  eventKey: string,
  targetDate: Date
): Promise<PreparedAnalyticsRollup> {
  const dayKey = formatDayKey(targetDate);
  const monthKey = formatMonthKey(targetDate);

  const eventRef = db.collection('analyticsAppliedEvents').doc(eventKey);
  const dailyRef = db.collection('analyticsDaily').doc(dayKey);
  const monthlyRef = db.collection('analyticsMonthly').doc(monthKey);

  const [eventSnap, dailySnap, monthlySnap] = await Promise.all([
    tx.get(eventRef),
    tx.get(dailyRef),
    tx.get(monthlyRef),
  ]);

  return {
    eventRef,
    dailyRef,
    monthlyRef,
    eventExists: eventSnap.exists,
    dailyData: dailySnap.exists ? (dailySnap.data() as AnalyticsBucket) : null,
    monthlyData: monthlySnap.exists ? (monthlySnap.data() as AnalyticsBucket) : null,
    dayKey,
    monthKey,
  };
}

export async function applyOrderAnalyticsDeltaInTx(
  tx: FirebaseFirestore.Transaction,
  db: FirebaseFirestore.Firestore,
  eventKey: string,
  beforeOrder: Order | null,
  afterOrder: Order,
  prepared?: PreparedAnalyticsRollup
): Promise<void> {
  const targetDate = getOrderDate(afterOrder);
  const dayKey = formatDayKey(targetDate);
  const monthKey = formatMonthKey(targetDate);

  let eventRef: FirebaseFirestore.DocumentReference;
  let dailyRef: FirebaseFirestore.DocumentReference;
  let monthlyRef: FirebaseFirestore.DocumentReference;
  let eventExists = false;
  let dailyExisting: AnalyticsBucket | null = null;
  let monthlyExisting: AnalyticsBucket | null = null;

  if (prepared) {
    eventRef = prepared.eventRef;
    dailyRef = prepared.dailyRef;
    monthlyRef = prepared.monthlyRef;
    eventExists = prepared.eventExists;
    dailyExisting = prepared.dailyData;
    monthlyExisting = prepared.monthlyData;
  } else {
    eventRef = db.collection('analyticsAppliedEvents').doc(eventKey);
    dailyRef = db.collection('analyticsDaily').doc(dayKey);
    monthlyRef = db.collection('analyticsMonthly').doc(monthKey);

    const [eventSnap, dailySnap, monthlySnap] = await Promise.all([
      tx.get(eventRef),
      tx.get(dailyRef),
      tx.get(monthlyRef),
    ]);

    eventExists = eventSnap.exists;
    dailyExisting = dailySnap.exists ? (dailySnap.data() as AnalyticsBucket) : null;
    monthlyExisting = monthlySnap.exists ? (monthlySnap.data() as AnalyticsBucket) : null;
  }

  // Idempotency check: if event already applied, exit as no-op
  if (eventExists) {
    return;
  }

  const delta = calculateOrderDelta(beforeOrder, afterOrder);

  const updatedDaily = applyDeltaToBucket(dailyExisting, dayKey, delta);
  const updatedMonthly = applyDeltaToBucket(monthlyExisting, monthKey, delta);

  tx.set(dailyRef, updatedDaily, { merge: true });
  tx.set(monthlyRef, updatedMonthly, { merge: true });

  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90-day TTL marker
  tx.set(eventRef, {
    eventKey,
    orderId: afterOrder.id,
    appliedAt: new Date(),
    expiresAt,
  });
}
