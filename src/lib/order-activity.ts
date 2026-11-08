import type { Order } from './types';
import { getOrderPaymentHistory } from './order-workflow';

export interface OrderActivity {
  id: string;
  type: string;
  details: string;
  actorId?: string;
  actorName: string;
  actorRole: string;
  createdAt: unknown;
  sourceId?: string;
  operationId?: string;
  inferred?: boolean;
  before?: unknown;
  after?: unknown;
  proofUrl?: string;
  reference?: string;
}

export function activityTime(value: unknown): number {
  if (value && typeof value === 'object') {
    if ('toMillis' in value && typeof value.toMillis === 'function') return value.toMillis();
    if ('seconds' in value && typeof value.seconds === 'number') return value.seconds * 1000;
  }
  const time = typeof value === 'string' ? Date.parse(value) : NaN;
  return Number.isFinite(time) ? time : 0;
}

export function mergeOrderActivity(order: Order, events: OrderActivity[], audits: OrderActivity[] = []) {
  const result = new Map<string, OrderActivity>();
  for (const event of getOrderPaymentHistory(order)) {
    const id = `payment:${event.id}`;
    result.set(id, { ...event, id, type: 'payment', sourceId: event.id,
      details: `${event.status.toUpperCase()} · ${event.method}${event.reference ? ` · Ref: ${event.reference}` : ''}${event.amount !== undefined ? ` · PHP ${event.amount.toFixed(2)}` : ''}${event.note ? ` · ${event.note}` : ''}${event.relatedEventId ? ` · ${event.kind === 'correction' ? 'Corrects' : 'Follows correction'}: ${event.relatedEventId}` : ''}`,
      inferred: !order.paymentHistory?.length });
  }
  for (const refund of order.refunds || []) {
    const id = `refund:${refund.id}`;
    result.set(id, { ...refund, id, type: 'refund', sourceId: refund.id,
      actorRole: refund.actorRole || 'Staff', details: `${refund.status || 'succeeded'} · PHP ${refund.amount.toFixed(2)} · ${refund.destination || refund.method} · Ref: ${refund.reference} · ${refund.reason}${refund.proofUrl ? ` · Proof: ${refund.proofUrl}` : ''}` });
  }
  for (const event of [...audits, ...events]) {
    const key = event.sourceId && ['payment', 'refund'].includes(event.type) ? `${event.type}:${event.sourceId}` : event.id;
    result.set(key, event);
  }
  return [...result.values()].sort((a, b) => activityTime(b.createdAt) - activityTime(a.createdAt) || a.id.localeCompare(b.id));
}
