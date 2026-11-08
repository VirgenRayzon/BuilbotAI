import test from 'node:test';
import assert from 'node:assert/strict';
import { mock } from 'node:test';
import * as admin from 'firebase-admin';
import { getOrderActor } from '../src/lib/server/order-auth';
import { updateOrderPaymentStatusByStaff, updateOrderFulfillmentStageByStaff, updateReservationStatus } from '../src/app/checkout-actions';
import { manageReservation, clearAllOrders } from '../src/app/admin/reservation-actions';
import { refundOrderByStaff, reconcileOrderRefundByStaff } from '../src/app/admin/order-refund-actions';
import { resetSalesMetricsByAdmin, ingestDummySalesDataByAdmin } from '../src/app/admin/sales-admin-actions';

test('Phase 2 order action authorization and history guards', async t => {
  if (!admin.apps.length) admin.initializeApp({ projectId: 'demo-order-phase2' });
  const auth = admin.auth();
  const db = admin.firestore();
  let claims: Record<string, unknown> = {};
  let profile: Record<string, unknown> = {};
  let transactionCount = 0;
  let writeCount = 0;
  const order = { id: 'order-1', userId: 'customer', userEmail: 'c@test.com', items: [],
    status: 'pending', fulfillmentStage: 'order_placed', paymentStatus: 'unpaid',
    paymentMethod: 'cod', totalPrice: 100, createdAt: '2026-11-02' };
  mock.method(auth, 'verifyIdToken', async () => ({ uid: 'staff', email: 'staff@test.com', ...claims }));
  const collection = (name: string): object => ({
    doc: (id = 'generated') => ({ id, path: `${name}/${id}`,
      collection: (child: string) => collection(`${name}/${id}/${child}`),
      get: async () => ({ exists: true, data: () => name === 'users' ? profile : order }),
    }),
  });
  mock.method(db, 'collection', collection);
  mock.method(console, 'error', () => {}); // Expected authorization failures are asserted below.
  mock.method(db, 'runTransaction', async (callback: (tx: unknown) => Promise<unknown>) => {
    transactionCount++;
    return callback({
      get: async (ref: { path: string }) => ({ exists: !ref.path.startsWith('orderRefundOperations/') && !ref.path.startsWith('orderWorkflowOperations/'), data: () => order, get: (key: string) => key === 'workflowRevision' ? 0 : undefined }),
      create: () => { writeCount++; },
      update: () => { writeCount++; }, set: () => { writeCount++; }, delete: () => { writeCount++; },
    });
  });
  const actions = () => [
    () => updateOrderPaymentStatusByStaff('order-1', 'paid', 'token', undefined, { operationId: '22345678-1234-4123-8123-123456789abc', expectedRevision: 0 }, { received: true, amount: 100 }),
    () => updateOrderFulfillmentStageByStaff({ orderId: 'order-1', stage: 'out_for_delivery', idToken: 'token', operation: { operationId: '12345678-1234-4123-8123-123456789abc', expectedRevision: 0 } }),
    () => updateReservationStatus('order-1', 'cancelled', 'token'),
    () => manageReservation({ orderId: 'order-1', action: 'archive', idToken: 'token' }),
    () => refundOrderByStaff({ orderId: 'order-1', amount: 10, reason: 'Test refund reason', destination: 'cash', reference: 'cash-1', operationId: '12345678-1234-4123-8123-123456789abc', idToken: 'token' }),
    () => reconcileOrderRefundByStaff({ orderId: 'order-1', idToken: 'token' }),
  ];
  try {
    await t.test('customers and mismatched identities cannot mutate orders', async () => {
      for (const pair of [[{}, {}], [{ isManager: true }, {}], [{}, { isManager: true }],
        [{ isManager: true, isSuperAdmin: true }, { isManager: true }]]) {
        [claims, profile] = pair;
        for (const action of actions()) assert.equal((await action()).success, false);
      }
      assert.equal(transactionCount, 1); // customer cancellation reads ownership inside transaction
      assert.equal(writeCount, 0);
    });
    await t.test('expired or revoked tokens fail before profile lookup or writes', async () => {
      const verifier = mock.method(auth, 'verifyIdToken', async () => { throw new Error('Token revoked'); });
      for (const action of actions()) assert.equal((await action()).success, false);
      verifier.mock.restore();
      assert.equal(writeCount, 0);
    });
    await t.test('valid manager and super admin can confirm COD, advance parts and archive', async () => {
      for (const role of ['isManager', 'isSuperAdmin']) {
        claims = profile = { [role]: true };
        const actor = await getOrderActor('token');
        assert.equal(actor.isStaff, true);
        assert.equal((await updateOrderPaymentStatusByStaff('order-1', 'paid', 'token', undefined, { operationId: '22345678-1234-4123-8123-123456789abc', expectedRevision: 0 }, { received: true, amount: 100 })).success, true);
        assert.equal((await updateOrderFulfillmentStageByStaff({ orderId: 'order-1', stage: 'out_for_delivery', idToken: 'token', operation: { operationId: '12345678-1234-4123-8123-123456789abc', expectedRevision: 0 } })).success, true);
        order.paymentStatus = 'paid';
        assert.equal((await refundOrderByStaff({ orderId: 'order-1', amount: 10, reason: 'Test cash refund', destination: 'cash', reference: 'cash-1', operationId: '12345678-1234-4123-8123-123456789abc', idToken: 'token' })).success, true);
        order.paymentStatus = 'unpaid';
        assert.equal((await manageReservation({ orderId: 'order-1', action: 'archive', idToken: 'token' })).success, true);
      }
      assert.ok(writeCount > 0);
    });
    await t.test('real-project destructive operations fail before any transaction or writes', async () => {
      const previousProject = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'real-project';
      claims = profile = { isSuperAdmin: true };
      const writes = writeCount;
      const transactions = transactionCount;
      try {
        for (const action of [
          () => manageReservation({ orderId: 'order-1', action: 'delete', idToken: 'token' }),
          () => clearAllOrders({ idToken: 'token' }),
          () => resetSalesMetricsByAdmin({ idToken: 'token' }),
          () => ingestDummySalesDataByAdmin({ idToken: 'token' }),
        ]) {
          const result = await action();
          assert.equal(result.success, false);
          assert.match(result.error || '', /demo Firebase emulators/);
        }
        assert.equal(writeCount, writes);
        assert.equal(transactionCount, transactions);
      } finally {
        if (previousProject === undefined) delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        else process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = previousProject;
      }
    });
  } finally {
    mock.restoreAll();
    await admin.app().delete();
  }
});
