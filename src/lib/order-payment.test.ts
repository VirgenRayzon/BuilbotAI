import test from 'node:test';
import assert from 'node:assert/strict';
import { assertCashConfirmation, getPaymentEventLink, paymentDialogPolicy } from './order-payment';
import { getAllowedStaffPaymentStatuses, assertStaffPaymentStatusTransition } from './order-workflow';
import type { Order } from './types';

const order: Order = { id: 'order', userId: 'customer', userEmail: 'c@test.com', items: [], totalPrice: 100,
  status: 'building', paymentMethod: 'cod', paymentStatus: 'unpaid', createdAt: '2026-11-02' };
const operation = { operationId: '12345678-1234-4123-8123-123456789abc', expectedRevision: 0 };
test('cash collection requires exact amount, affirmative receipt and a reviewed operation', () => {
  assert.throws(() => assertCashConfirmation(order, 'paid'), /confirm/);
  assert.throws(() => assertCashConfirmation(order, 'paid', operation), /exact/);
  assert.throws(() => assertCashConfirmation(order, 'paid', operation, { received: true, amount: 99 }), /exact/);
  assert.doesNotThrow(() => assertCashConfirmation(order, 'paid', operation, { received: true, amount: 100 }));
  assert.equal(paymentDialogPolicy(order, 'paid').action, 'Confirm Cash Collected');
});
test('correction and recollection link original events and do not relax refund or delivery locks', () => {
  const paid: Order = { ...order, paymentStatus: 'paid', paymentHistory: [{ id: 'collection-1', kind: 'collection', status: 'paid', method: 'cod', actorName: 'Manager', actorRole: 'Manager', createdAt: '2026-11-02' }] };
  assert.deepEqual(getPaymentEventLink(paid, 'unpaid'), { kind: 'correction', relatedEventId: 'collection-1' });
  assert.equal(getPaymentEventLink({ ...paid, paymentHistory: [] }, 'unpaid').relatedEventId, 'legacy:order:paid');
  assert.equal(paymentDialogPolicy(paid, 'unpaid').needsReason, true);
  assert.throws(() => assertStaffPaymentStatusTransition({ ...paid, pendingRefundOperationId: 'pending' }, 'unpaid', 'Record was erroneous'), /refunds/);
  assert.deepEqual(getAllowedStaffPaymentStatuses({ ...paid, pendingRefundOperationId: 'pending' }), ['paid']);
  assert.throws(() => assertStaffPaymentStatusTransition({ ...paid, fulfillmentStage: 'delivered' }, 'unpaid', 'Record was erroneous'), /Delivered/);
});
