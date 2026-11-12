import { randomUUID } from 'node:crypto';
import { FieldValue, Timestamp, type Firestore } from 'firebase-admin/firestore';
import type { Order, OrderRefund, OrderRefundDestination } from '@/lib/types';
import { getRefundedAmount } from '@/lib/order-workflow';
import { retrievePaymongoRefund, type PaymongoRefund } from './paymongo';
import { writeOrderChange, type ActivityActor } from './order-activity';
import { writeRefundNotifications } from './order-refund-notifications';
import { applyOrderAnalyticsDeltaInTx } from '@/lib/analytics-rollups';

export async function completeProviderRefund(db: Firestore, orderId: string, operationId: string,
  provider: PaymongoRefund, actor: ActivityActor, reason?: string) {
  const orderRef = db.collection('orders').doc(orderId);
  const opRef = db.collection('orderRefundOperations').doc(`${orderId}_${operationId}`);
  const receiptRef = db.collection('orderRefundReceipts').doc(provider.id);
  return db.runTransaction(async tx => {
    const [orderSnap, opSnap, receiptSnap] = await Promise.all([tx.get(orderRef), tx.get(opRef), tx.get(receiptRef)]);
    if (!orderSnap.exists || !opSnap.exists) throw new Error('Refund operation is missing. Keep the refund on hold and contact support.');
    const order = orderSnap.data() as Order;
    const op = opSnap.data()!;
    const amount = Number(op.amount);
    if (!Number.isFinite(amount) || amount <= 0 || provider.paymentId !== (op.paymentId || order.paymongoPaymentId) ||
        provider.amount !== Math.round(amount * 100) || provider.currency !== 'PHP' ||
        (op.providerRequestKey && !provider.notes?.startsWith(`${op.providerRequestKey}: `))) {
      throw new Error('This provider refund does not match the pending payment, amount, or request. The refund remains on hold.');
    }
    if (receiptSnap.exists && (receiptSnap.get('orderId') !== orderId || receiptSnap.get('operationId') !== operationId)) {
      throw new Error('This provider refund is already linked to another operation.');
    }
    if (op.status === 'succeeded' || op.status === 'failed') {
      if (op.reference !== provider.id || op.status !== provider.status) throw new Error('The refund result changed. Contact support before further action.');
      return { pending: false, status: op.status as 'succeeded' | 'failed' };
    }
    if (order.pendingRefundOperationId !== operationId ||
        (order.pendingPaymongoRefundId && order.pendingPaymongoRefundId !== provider.id)) throw new Error('The pending refund changed. Refresh the order.');
    if ((order.refunds || []).some(refund => refund.reference === provider.id && refund.id !== operationId)) throw new Error('This provider refund was already recorded.');
    const now = Timestamp.now();
    const pending = provider.status === 'pending' || provider.status === 'processing';
    if (pending && order.pendingPaymongoRefundId === provider.id && op.status === provider.status) return { pending: true, status: 'pending' as const };
    const patch: Record<string, unknown> = { updatedAt: now };
    if (pending) patch.pendingPaymongoRefundId = provider.id;
    else {
      patch.pendingRefundOperationId = FieldValue.delete(); patch.pendingPaymongoRefundId = FieldValue.delete();
      if (provider.status === 'succeeded') {
        if (getRefundedAmount(order) + amount > order.totalPrice) throw new Error('Refund total exceeds the order value. Keep the refund on hold.');
        const refund: OrderRefund = { id: operationId, amount, method: 'paymongo', destination: op.destination as OrderRefundDestination,
          reason: String(op.reason), reference: provider.id, ...(op.proofUrl ? { proofUrl: String(op.proofUrl) } : {}),
          actorId: String(op.actorId), actorName: String(op.actorName), actorRole: op.actorRole === 'Super Admin' ? 'Super Admin' : 'Manager', status: 'succeeded', createdAt: now };
        patch.refunds = [...(order.refunds || []), refund];
        patch.refundedAmount = Math.round((getRefundedAmount(order) + amount) * 100) / 100;
        patch.refundStatus = Number(patch.refundedAmount) >= order.totalPrice ? 'refunded' : 'partial';
        writeRefundNotifications(tx, db, order, refund, now);

        const afterOrder: Order = {
          ...order,
          refunds: patch.refunds as OrderRefund[],
          refundedAmount: Number(patch.refundedAmount),
          refundStatus: patch.refundStatus as Order['refundStatus'],
          updatedAt: now,
        };
        await applyOrderAnalyticsDeltaInTx(
          tx,
          db,
          `provider_refund_${orderId}_${operationId}`,
          order,
          afterOrder
        );
      } else patch.refundStatus = getRefundedAmount(order) > 0 ? 'partial' : order.status === 'cancelled' ? 'due' : 'none';
    }
    writeOrderChange(tx, orderRef, order, patch, actor, operationId);
    tx.set(receiptRef, { orderId, operationId, paymentId: provider.paymentId, amount: provider.amount, status: provider.status, updatedAt: now });
    tx.update(opRef, { status: provider.status, outcome: 'verified', reference: provider.id, updatedAt: now,
      reconciledBy: actor.actorId || null, ...(reason ? { reconciliationReason: reason } : {}) });
    const eventRef = orderRef.collection('activity').doc(randomUUID());
    tx.create(eventRef, { id: eventRef.id, type: 'refund_reconciled', details: `PayMongo refund ${provider.id}: ${provider.status} · PHP ${amount.toFixed(2)}${reason ? ` · ${reason}` : ''}`,
      ...actor, operationId, createdAt: now });
    return { pending, status: pending ? 'pending' as const : provider.status === 'succeeded' ? 'succeeded' as const : 'failed' as const };
  });
}

export async function reconcileProviderRefund(db: Firestore, orderId: string, actor: ActivityActor,
  reference?: { providerRefundId: string; reason: string }) {
  const order = (await db.collection('orders').doc(orderId).get()).data() as Order | undefined;
  if (!order) throw new Error('Order not found.');
  if (!order.pendingRefundOperationId) return { pending: false, status: 'cleared' as const };
  const id = order.pendingPaymongoRefundId || reference?.providerRefundId;
  if (!id) return { pending: true, status: 'pending' as const, requiresReference: true };
  if (reference && order.pendingPaymongoRefundId && reference.providerRefundId !== order.pendingPaymongoRefundId) throw new Error('The pending provider refund ID has changed.');
  const provider = await retrievePaymongoRefund(id);
  if (provider.id !== id) throw new Error('Provider refund identity mismatch.');
  return completeProviderRefund(db, orderId, order.pendingRefundOperationId, provider, actor, reference?.reason);
}
