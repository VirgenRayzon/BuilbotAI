import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeOrderActivity, activityTime } from './order-activity';
import type { Order } from './types';

const order: Order = { id: 'old-order', userId: 'customer', userEmail: 'c@test.com', items: [],
  totalPrice: 100, status: 'pending', createdAt: '2026-11-02', paymentMethod: 'cod',
  paymentHistory: [{ id: 'paid-1', status: 'paid', method: 'cod', amount: 100, actorName: 'Manager', actorRole: 'Manager', createdAt: '2026-11-02' }],
  refunds: [{ id: 'refund-1', amount: 10, method: 'manual', reason: 'Partial return', reference: 'cash-1', actorId: 'manager', actorName: 'Manager', createdAt: '2026-11-03' }] };

test('timeline merges original payment/refund records with new events without double counting', () => {
  const original = JSON.stringify(order);
  const result = mergeOrderActivity(order, [{ id: 'activity-1', sourceId: 'paid-1', type: 'payment',
    actorName: 'Manager', actorRole: 'Manager', details: 'Payment collected', createdAt: '2026-11-02' }]);
  assert.equal(result.length, 2);
  assert.equal(result[0].type, 'refund');
  assert.equal(result[1].id, 'activity-1');
  assert.equal(JSON.stringify(order), original);
});

test('legacy inferred records remain labeled and unknown timestamps never become current time', () => {
  const result = mergeOrderActivity({ ...order, paymentHistory: [], refunds: [] }, []);
  assert.equal(result[0].inferred, true);
  assert.equal(activityTime(null), 0);
  assert.equal(activityTime({ seconds: 100 }), 100000);
});
