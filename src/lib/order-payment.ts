import type { Order, OrderPaymentEvent, PaymentStatus } from './types';
import type { OrderOperation } from './server/order-operations';

export interface CashConfirmation { received: true; amount: number }
export interface StaffPaymentRequest { operation: OrderOperation; cashConfirmation?: CashConfirmation }
export interface RefundReconciliationReference { providerRefundId: string; reason: string }
export type ReconcileRefund = (orderId: string, reference?: RefundReconciliationReference) => Promise<boolean>;

export function paymentDialogPolicy(order: Order, nextStatus: PaymentStatus) {
  const collecting = (order.paymentMethod ?? 'cod') === 'cod' && nextStatus === 'paid' && order.paymentStatus !== 'paid';
  const correcting = order.paymentStatus === 'paid' && nextStatus !== 'paid';
  return { collecting, correcting,
    needsReason: correcting || (nextStatus === 'paid' && (order.paymentMethod ?? 'cod') !== 'cod'),
    title: collecting ? 'Confirm Cash Collection' : correcting ? 'Correct Payment Record' : 'Update Payment Status',
    action: collecting ? 'Confirm Cash Collected' : correcting ? 'Confirm Correction' : 'Confirm Payment Update' };
}

export function assertCashConfirmation(order: Order, status: PaymentStatus, operation?: OrderOperation, cash?: CashConfirmation) {
  const policy = paymentDialogPolicy(order, status);
  if ((policy.collecting || policy.correcting) && !operation) throw new Error('Review the order and confirm this payment change again.');
  if (policy.collecting && (!cash?.received || !Number.isFinite(cash.amount) || cash.amount !== order.totalPrice)) {
    throw new Error('Confirm receipt of the exact order total before recording cash collection.');
  }
}

export function getPaymentEventLink(order: Order, nextStatus: PaymentStatus): Pick<OrderPaymentEvent, 'kind' | 'relatedEventId'> {
  const correcting = order.paymentStatus === 'paid' && nextStatus !== 'paid';
  const history = order.paymentHistory || [];
  const related = [...history].reverse().find(event => correcting ? event.status === 'paid' : event.kind === 'correction');
  return { kind: correcting ? 'correction' : (order.paymentMethod ?? 'cod') === 'cod' && nextStatus === 'paid' ? 'collection' : 'verification',
    ...(related ? { relatedEventId: related.id } : correcting ? { relatedEventId: `legacy:${order.id}:paid` } : {}) };
}
