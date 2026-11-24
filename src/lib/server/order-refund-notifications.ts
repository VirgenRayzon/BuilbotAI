import * as admin from 'firebase-admin';
import type { Order, OrderRefund } from '@/lib/types';
import { ORDER_REFUND_DESTINATION_LABELS } from '@/lib/order-workflow';
import { computeExpiresAt } from '@/lib/ttl-policies';
export function writeRefundNotifications(
  transaction: admin.firestore.Transaction,
  firestore: admin.firestore.Firestore,
  order: Order,
  refund: OrderRefund,
  now: admin.firestore.Timestamp
) {
  const destinationLabel = refund.destination
    ? ORDER_REFUND_DESTINATION_LABELS[refund.destination]
    : refund.method === 'paymongo'
      ? 'Original Payment Method'
      : 'Manual Payout';
  const roleLabel = refund.actorRole || 'Manager';
  const orderLabel = order.orderNumber || order.id.slice(0, 8);

  const auditRef = firestore.collection('auditLogs').doc();
  transaction.set(auditRef, {
    id: auditRef.id,
    actionName: 'refunded',
    actorId: refund.actorId,
    actorName: refund.actorName,
    scope: 'Order',
        activityRecorded: true,
    resourceName: `Order ${orderLabel}`,
    resourceId: order.id,
    details: `${roleLabel} ${refund.actorName} refunded ₱${refund.amount.toFixed(2)} to ${destinationLabel} (${refund.method}); ref: ${refund.reference}; reason: ${refund.reason}`,
    createdAt: now,
    expiresAt: admin.firestore.Timestamp.fromDate(computeExpiresAt('auditLogs')),
  });

  if (refund.actorRole === 'Manager') {
    const sysNotifRef = firestore.collection('system_notifications').doc();
    transaction.set(sysNotifRef, {
      id: sysNotifRef.id,
      type: 'status_changed',
      actorId: refund.actorId,
      actorName: refund.actorName,
      title: 'Order Refund Issued',
      message: `Manager ${refund.actorName} issued a ₱${refund.amount.toFixed(2)} refund for order ${orderLabel} (${destinationLabel}).`,
      targetId: order.id,
      readBy: [],
      createdAt: now,
      expiresAt: admin.firestore.Timestamp.fromDate(computeExpiresAt('notifications')),
    });
  }

  const notificationRef = firestore
    .collection('users')
    .doc(order.userId)
    .collection('notifications')
    .doc();
  transaction.set(notificationRef, {
    id: notificationRef.id,
    userId: order.userId,
    orderId: order.id,
    title: 'Order Refund Issued',
    message: `A refund of ₱${refund.amount.toFixed(2)} for order ${orderLabel} was issued to ${destinationLabel}. Reference: ${refund.reference}.`,
    status: order.status,
    read: false,
    createdAt: now,
    expiresAt: admin.firestore.Timestamp.fromDate(computeExpiresAt('notifications')),
  });
}
