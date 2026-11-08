import test from 'node:test';
import assert from 'node:assert/strict';
import { mock } from 'node:test';
import * as admin from 'firebase-admin';
import type { Order, OrderItem } from '../src/lib/types';
import {
  updateReservationStatus,
  confirmOrderPhysicalStockReturn,
} from '../src/app/checkout-actions';
import {
  assertCustomRigDispatchAllowed,
  initializeRigVerification,
  applyStepUpdateAndInvalidation,
} from '../src/lib/order-assembly';
import { mergeOrderActivity } from '../src/lib/order-activity';

test('Phase 6 & 7 Order Management & Assembly Verification', async (t) => {
  if (!admin.apps.length) admin.initializeApp({ projectId: 'demo-order-mgmt' });
  const auth = admin.auth();
  const db = admin.firestore();

  const managerClaims = { isManager: true };
  const managerProfile = { isManager: true, name: 'Test Manager', email: 'manager@buildbot.test' };

  mock.method(auth, 'verifyIdToken', async () => ({
    uid: 'staff-manager',
    email: 'manager@buildbot.test',
    ...managerClaims,
  }));

  const customRigItems: OrderItem[] = [
    { id: 'cpu-1', name: 'Ryzen 7 7800X3D', category: 'CPU', price: 24000, quantity: 1, buildType: 'custom-build', groupName: 'My Build', rigInstanceId: 'rig-alpha' },
    { id: 'mb-1', name: 'B650 Motherboard', category: 'Motherboard', price: 12000, quantity: 1, buildType: 'custom-build', groupName: 'My Build', rigInstanceId: 'rig-alpha' },
    { id: 'gpu-1', name: 'RTX 4070 Super', category: 'GPU', price: 38000, quantity: 1, buildType: 'custom-build', groupName: 'My Build', rigInstanceId: 'rig-alpha' },
    { id: 'ram-1', name: '32GB DDR5 RAM', category: 'RAM', price: 7000, quantity: 2, buildType: 'custom-build', groupName: 'My Build', rigInstanceId: 'rig-alpha' },
    { id: 'ssd-1', name: '2TB NVMe SSD', category: 'Storage', price: 8000, quantity: 1, buildType: 'custom-build', groupName: 'My Build', rigInstanceId: 'rig-alpha' },
    { id: 'psu-1', name: '750W Gold PSU', category: 'PSU', price: 6000, quantity: 1, buildType: 'custom-build', groupName: 'My Build', rigInstanceId: 'rig-alpha' },
    { id: 'case-1', name: 'Mid Tower Case', category: 'Case', price: 4000, quantity: 1, buildType: 'custom-build', groupName: 'My Build', rigInstanceId: 'rig-alpha' },
  ];

  const testOrder: Order = {
    id: 'order-101',
    userId: 'customer-1',
    userEmail: 'customer@test.com',
    status: 'pending',
    fulfillmentStage: 'assembling_testing',
    paymentStatus: 'paid',
    totalPrice: 91000,
    createdAt: '2026-11-01',
    items: customRigItems,
  };

  const staffVerifier = { uid: 'staff-1', name: 'Staff Technician', role: 'Staff' as const };
  const managerVerifier = { uid: 'staff-manager', name: 'Test Manager', role: 'Manager' as const };

  await t.test('Custom rig dispatch gating: blocks dispatch when verification is incomplete', async () => {
    const unverifiedRecord = initializeRigVerification('order-101', 'rig-alpha', 'Custom Gaming Rig', customRigItems);
    assert.equal(unverifiedRecord.status, 'unverified');

    assert.throws(
      () => assertCustomRigDispatchAllowed(testOrder, { 'rig-alpha': unverifiedRecord }),
      /verification is not passed/
    );
  });

  await t.test('Custom rig dispatch gating: allows dispatch once picking, assembly, testing, and QC pass', async () => {
    let record = initializeRigVerification('order-101', 'rig-alpha', 'Custom Gaming Rig', customRigItems);

    record = applyStepUpdateAndInvalidation(
      record,
      'picking',
      { completed: true },
      staffVerifier,
      '2026-11-01T10:00:00Z'
    );
    assert.equal(record.picking.completed, true);

    record = applyStepUpdateAndInvalidation(
      record,
      'assembly',
      { completed: true, notes: 'Built cleanly into Lian Li case' },
      staffVerifier,
      '2026-11-01T11:00:00Z'
    );
    assert.equal(record.assembly.completed, true);

    record = applyStepUpdateAndInvalidation(
      record,
      'testing',
      { completed: true, passed: true, notes: 'MemTest86 and Cinebench passed 30m run' },
      staffVerifier,
      '2026-11-01T12:00:00Z'
    );
    assert.equal(record.testing.completed, true);
    assert.equal(record.testing.passed, true);

    record = applyStepUpdateAndInvalidation(
      record,
      'qc',
      { completed: true, passed: true, notes: 'Final cabling and packaging approved' },
      managerVerifier,
      '2026-11-01T13:00:00Z'
    );
    assert.equal(record.qc.completed, true);
    assert.equal(record.qc.passed, true);
    assert.equal(record.status, 'passed');

    assert.doesNotThrow(() => assertCustomRigDispatchAllowed(testOrder, { 'rig-alpha': record }));
  });

  await t.test('Downstream invalidation: changing picking resets assembly, testing, and QC', async () => {
    let record = initializeRigVerification('order-101', 'rig-alpha', 'Custom Gaming Rig', customRigItems);
    record = applyStepUpdateAndInvalidation(record, 'picking', { completed: true }, staffVerifier, '2026-11-01T10:00:00Z');
    record = applyStepUpdateAndInvalidation(record, 'assembly', { completed: true }, staffVerifier, '2026-11-01T11:00:00Z');
    record = applyStepUpdateAndInvalidation(record, 'testing', { completed: true, passed: true }, staffVerifier, '2026-11-01T12:00:00Z');
    record = applyStepUpdateAndInvalidation(record, 'qc', { completed: true, passed: true }, managerVerifier, '2026-11-01T13:00:00Z');
    assert.equal(record.status, 'passed');

    record = applyStepUpdateAndInvalidation(
      record,
      'picking',
      { pickedLineIds: [] }, // unpick all
      staffVerifier,
      '2026-11-01T14:00:00Z'
    );

    assert.equal(record.picking.completed, false);
    assert.equal(record.assembly.completed, false);
    assert.equal(record.testing.completed, false);
    assert.equal(record.qc.completed, false);
    assert.notEqual(record.status, 'passed');
  });

  await t.test('Multi-rig order: all rigs must pass before dispatch is allowed', async () => {
    const multiRigOrder: Order = {
      ...testOrder,
      items: [
        ...customRigItems,
        { id: 'cpu-2', name: 'Ryzen 5 7600', category: 'CPU', price: 12000, quantity: 1, buildType: 'custom-build', groupName: 'My Build', rigInstanceId: 'rig-beta' },
        { id: 'mb-2', name: 'A620 Motherboard', category: 'Motherboard', price: 6000, quantity: 1, buildType: 'custom-build', groupName: 'My Build', rigInstanceId: 'rig-beta' },
      ],
    };

    let rig1 = initializeRigVerification('order-101', 'rig-alpha', 'Custom Rig Alpha', customRigItems);
    rig1 = applyStepUpdateAndInvalidation(rig1, 'picking', { completed: true }, staffVerifier, 'now');
    rig1 = applyStepUpdateAndInvalidation(rig1, 'assembly', { completed: true }, staffVerifier, 'now');
    rig1 = applyStepUpdateAndInvalidation(rig1, 'testing', { completed: true, passed: true }, staffVerifier, 'now');
    rig1 = applyStepUpdateAndInvalidation(rig1, 'qc', { completed: true, passed: true }, managerVerifier, 'now');

    const rig2 = initializeRigVerification('order-101', 'rig-beta', 'My Build #2', multiRigOrder.items.slice(7));

    assert.throws(
      () => assertCustomRigDispatchAllowed(multiRigOrder, { 'rig-alpha': rig1, 'rig-beta': rig2 }),
      /Custom rig "My Build #2" verification is not passed/
    );
  });

  await t.test('Exemptions: prebuilts, parts-only orders, and historical delivered builds bypass custom rig gate', async () => {
    const prebuiltOrder: Order = {
      id: 'prebuilt-1',
      userId: 'user-1',
      userEmail: 'user@test.com',
      status: 'pending',
      fulfillmentStage: 'assembling_testing',
      paymentStatus: 'paid',
      totalPrice: 50000,
      createdAt: '2026-11-01',
      type: 'prebuilt',
      prebuiltName: 'Titan Rig',
      items: [{ id: 'part-1', name: 'Prebuilt Package', category: 'Prebuilt', price: 50000, quantity: 1, buildType: 'prebuilt' }],
    };
    assert.doesNotThrow(() => assertCustomRigDispatchAllowed(prebuiltOrder, {}));

    const historicalOrder: Order = {
      id: 'legacy-delivered',
      userId: 'user-1',
      userEmail: 'user@test.com',
      status: 'pending',
      fulfillmentStage: 'delivered',
      paymentStatus: 'paid',
      totalPrice: 50000,
      createdAt: '2026-01-01',
      items: customRigItems,
    };
    assert.doesNotThrow(() => assertCustomRigDispatchAllowed(historicalOrder, {}));
  });

  await t.test('Dispatched cancellation transitions to pending_return and requires physical return', async () => {
    let writtenOrder: Record<string, unknown> = {};

    const mockOrder: Order = {
      id: 'dispatched-order-1',
      userId: 'customer-1',
      userEmail: 'customer@test.com',
      status: 'pending',
      fulfillmentStage: 'out_for_delivery',
      paymentStatus: 'paid',
      paymentMethod: 'cod',
      totalPrice: 60000,
      createdAt: '2026-11-01',
      items: customRigItems,
      stockState: 'reserved',
    };

    const collection = (name: string): object => ({
      doc: (id: string = 'generated') => ({
        id,
        path: `${name}/${id}`,
        collection: (child: string) => collection(`${name}/${id}/${child}`),
        get: async () => ({
          exists: true,
          data: () => (name === 'users' ? managerProfile : writtenOrder.id ? writtenOrder : mockOrder),
        }),
      }),
      orderBy: () => ({
        get: async () => ({ docs: [] }),
      }),
    });

    mock.method(db, 'collection', collection);

    mock.method(db, 'runTransaction', async (callback: (tx: unknown) => Promise<unknown>) => {
      return callback({
        get: async (ref: { path: string }) => {
          if (ref.path.includes('inventory/')) {
            return { exists: true, data: () => ({ stock: 10 }) };
          }
          return {
            exists: true,
            data: () => (ref.path.startsWith('users/') ? managerProfile : writtenOrder.id ? writtenOrder : mockOrder),
            get: (key: string) => (key === 'workflowRevision' ? 0 : undefined),
          };
        },
        create: () => {},
        set: (_ref: unknown, data: Record<string, unknown>) => {
          writtenOrder = { ...writtenOrder, ...data };
        },
        update: (_ref: unknown, data: Record<string, unknown>) => {
          writtenOrder = { ...writtenOrder, ...data };
        },
        delete: () => {},
      });
    });

    const cancelRes = await updateReservationStatus('dispatched-order-1', 'cancelled', 'mock-token');
    assert.equal(cancelRes.success, true);
    assert.equal(writtenOrder.status, 'cancelled');
    assert.equal(writtenOrder.stockState, 'pending_return');
    assert.equal(writtenOrder.physicalReturnRequired, true);

    const returnRes = await confirmOrderPhysicalStockReturn({
      orderId: 'dispatched-order-1',
      idToken: 'mock-token',
      notes: 'Customer returned item in original box; verified all components intact.',
    });
    assert.equal(returnRes.success, true);
    assert.equal(returnRes.stockState, 'restored');
    assert.equal(writtenOrder.stockState, 'restored');
    assert.equal(writtenOrder.physicalReturnRequired, false);
    assert.ok(writtenOrder.stockRestoredAt);
  });

  await t.test('Timeline: mergeOrderActivity unifies payments, refunds, and audits chronologically', async () => {
    const activityOrder: Order = {
      id: 'order-timeline-1',
      userId: 'user-1',
      userEmail: 'user@test.com',
      status: 'pending',
      fulfillmentStage: 'order_placed',
      paymentStatus: 'paid',
      totalPrice: 15000,
      createdAt: '2026-11-01T10:00:00Z',
      items: [],
      paymentHistory: [
        {
          id: 'pay-1',
          status: 'paid',
          method: 'cod',
          amount: 15000,
          actorName: 'Courier Staff',
          actorRole: 'Manager',
          createdAt: '2026-11-01T11:00:00Z',
        },
      ],
      refunds: [
        {
          id: 'ref-1',
          status: 'succeeded',
          amount: 2000,
          method: 'manual',
          destination: 'cash',
          reason: 'Damaged packaging goodwill',
          reference: 'REF-001',
          actorId: 'manager-1',
          actorName: 'Test Manager',
          actorRole: 'Manager',
          createdAt: '2026-11-01T12:00:00Z',
        },
      ],
    };

    const newActivity = [
      {
        id: 'act-1',
        type: 'stage_change',
        details: 'Order advanced to Assembling & Testing',
        actorName: 'Technician',
        actorRole: 'Staff',
        createdAt: '2026-11-01T11:30:00Z',
      },
    ];

    const timeline = mergeOrderActivity(activityOrder, newActivity);

    assert.equal(timeline.length, 3);
    assert.equal(timeline[0].type, 'refund'); // 12:00
    assert.equal(timeline[1].type, 'stage_change'); // 11:30
    assert.equal(timeline[2].type, 'payment'); // 11:00
  });
});
