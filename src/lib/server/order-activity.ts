import { randomUUID } from 'node:crypto';
import type { DocumentReference, Transaction } from 'firebase-admin/firestore';
import { Timestamp } from 'firebase-admin/firestore';
import type { Order } from '@/lib/types';
import type { OrderActivity } from '@/lib/order-activity';
import { getOrderFulfillmentStage } from '@/lib/order-workflow';
import { toFirestoreDocument } from '@/lib/firestore-document';

export interface ActivityActor { actorId?: string; actorName: string; actorRole: string }

/** Called only after all reads. The state, revision and immutable events commit together. */
export function writeOrderChange(tx: Transaction, ref: DocumentReference, before: Order | null,
  patch: Record<string, unknown>, actor?: ActivityActor, operationId?: string) {
  const next = { ...before, ...patch } as Order;
  const payment = patch.paymentHistory ? next.paymentHistory?.at(-1) : undefined;
  const refund = patch.refunds ? next.refunds?.at(-1) : undefined;
  const source = payment || refund;
  const identity: ActivityActor = actor || (source ? {
    actorId: source.actorId, actorName: source.actorName, actorRole: source.actorRole || 'Staff',
  } : { actorName: 'Order System', actorRole: 'System' });
  const createdAt = Timestamp.now();
  const add = (type: string, details: string, extra: Partial<OrderActivity> = {}) => {
    const id = extra.id || randomUUID();
    tx.create(ref.collection('activity').doc(id), toFirestoreDocument({ ...identity, ...extra, id, type, details, createdAt, operationId }));
  };
  if (!before) add('created', 'Order placed.');
  if (before && patch.paymongoCheckoutSessionId && before.paymongoCheckoutSessionId !== patch.paymongoCheckoutSessionId) {
    add('payment_session', `PayMongo checkout session created: ${patch.paymongoCheckoutSessionId}.`);
  }
  if (before && patch.paymentStatus && !patch.paymentHistory && before.paymentStatus !== patch.paymentStatus) {
    add('payment_status', `Payment: ${before.paymentStatus || 'unpaid'} → ${patch.paymentStatus}`, { before: before.paymentStatus || 'unpaid', after: patch.paymentStatus });
  }
  if (before && patch.fulfillmentStage && getOrderFulfillmentStage(before) !== next.fulfillmentStage) {
    add('stage', `Fulfillment: ${getOrderFulfillmentStage(before)} → ${next.fulfillmentStage}`, { before: getOrderFulfillmentStage(before), after: next.fulfillmentStage });
  }
  for (const event of next.paymentHistory || []) {
    if (!patch.paymentHistory || before?.paymentHistory?.some(old => old.id === event.id)) continue;
    add('payment', `${event.status.toUpperCase()} · ${event.method} · PHP ${(event.amount || 0).toFixed(2)} · Ref: ${event.reference || '—'} · ${event.note || 'Payment updated.'}${event.relatedEventId ? ` · ${event.kind === 'correction' ? 'Corrects' : 'Follows correction'}: ${event.relatedEventId}` : ''}`,
      { ...event, id: randomUUID(), type: 'payment', sourceId: event.id });
  }
  for (const event of next.refunds || []) {
    if (!patch.refunds || before?.refunds?.some(old => old.id === event.id)) continue;
    add('refund', `${event.status || 'succeeded'} · PHP ${event.amount.toFixed(2)} · ${event.destination || event.method} · Ref: ${event.reference} · ${event.reason}${event.proofUrl ? ` · Proof: ${event.proofUrl}` : ''}`,
      { sourceId: event.id, ...identity });
  }
  if (patch.refundStatus && before?.refundStatus !== patch.refundStatus) add('refund_status', `Refund: ${before?.refundStatus || 'none'} → ${patch.refundStatus}`);
  if (patch.status === 'cancelled' && before?.status !== 'cancelled') add('cancelled', String(patch.cancellationReason || 'Order cancelled.'));
  if (typeof patch.isArchived === 'boolean' && Boolean(before?.isArchived) !== patch.isArchived) add(patch.isArchived ? 'archived' : 'restored', patch.isArchived ? 'Order archived; stock unchanged.' : 'Order restored to its existing queue.');
  if (patch.stockState && before?.stockState !== patch.stockState) {
    const items = next.items || [];
    add('inventory', `${patch.stockState === 'reserved' ? 'Inventory reserved' : 'Stock release processed'}: ${items.filter(item => !['included-stock-cooler', 'included-integrated-gpu'].includes(item.id)).map(item => `${item.name} ×${item.quantity || 1}`).join(', ')}.`,
      { before: before?.stockState || 'unknown', after: patch.stockState });
  }
  const data = toFirestoreDocument({ ...patch, workflowRevision: (before?.workflowRevision || 0) + 1 });
  if (before) tx.update(ref, data); else tx.create(ref, data);
}
