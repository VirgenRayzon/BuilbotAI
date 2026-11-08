import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyStepUpdateAndInvalidation,
  assertCustomRigDispatchAllowed,
  getCustomRigsFromOrder,
  initializeRigVerification,
  isOrderCustomRigAssemblyRequired,
  serializeRigVerificationRecord,
  serializeTimestamp,
  type RigVerificationRecord,
} from './order-assembly';
import type { Order, OrderItem } from './types';

const staffVerifier = {
  uid: 'staff_1',
  name: 'Alex Staff',
  role: 'Manager' as const,
};

test('order-assembly: correctly identifies custom rigs and ignores prebuilts and parts', () => {
  const customOrder: Order = {
    id: 'ord_1',
    userId: 'u_1',
    userEmail: 'user@example.com',
    totalPrice: 50000,
    status: 'pending',
    createdAt: new Date(),
    items: [
      {
        id: 'cpu_1',
        name: 'AMD Ryzen 7 7800X3D',
        category: 'CPU',
        price: 25000,
        groupName: 'My Build',
        buildType: 'custom-build',
        lineId: 'line_1',
        rigInstanceId: 'rig_custom_1',
      },
      {
        id: 'ram_1',
        name: 'Kingston Fury 32GB',
        category: 'RAM',
        price: 7000,
        groupName: 'My Build',
        buildType: 'custom-build',
        lineId: 'line_2',
        rigInstanceId: 'rig_custom_1',
      },
      {
        id: 'mouse_1',
        name: 'Logitech G Pro',
        category: 'Peripherals',
        price: 5000,
        buildType: 'part',
        lineId: 'line_3',
      },
    ],
  };

  assert.equal(isOrderCustomRigAssemblyRequired(customOrder), true);
  const rigs = getCustomRigsFromOrder(customOrder);
  assert.equal(rigs.length, 1);
  assert.equal(rigs[0].rigId, 'rig_custom_1');
  assert.equal(rigs[0].items.length, 2);

  const prebuiltOrder: Order = {
    id: 'ord_2',
    userId: 'u_1',
    userEmail: 'user@example.com',
    totalPrice: 40000,
    status: 'pending',
    type: 'prebuilt',
    prebuiltName: 'Titan Rig',
    createdAt: new Date(),
    items: [
      { id: 'pb_1', name: 'Titan Rig Package', category: 'Prebuilt', price: 40000, buildType: 'prebuilt' },
    ],
  };
  assert.equal(isOrderCustomRigAssemblyRequired(prebuiltOrder), false);

  assert.equal(
    isOrderCustomRigAssemblyRequired({ ...customOrder, status: 'cancelled' }),
    false
  );
});

test('order-assembly: multi-rig orders separate duplicate parts and track each rig independently', () => {
  const orderWithTwoRigs: Order = {
    id: 'ord_multi',
    userId: 'u_1',
    userEmail: 'user@example.com',
    totalPrice: 120000,
    status: 'building',
    createdAt: new Date(),
    items: [
      {
        id: 'cpu_1',
        name: 'Intel Core i5-13600K',
        category: 'CPU',
        price: 18000,
        groupName: 'Workstation Rig',
        buildType: 'custom-build',
        rigInstanceId: 'rig_ws_1',
      },
      {
        id: 'gpu_1',
        name: 'RTX 4070',
        category: 'GPU',
        price: 35000,
        groupName: 'Workstation Rig',
        buildType: 'custom-build',
        rigInstanceId: 'rig_ws_1',
      },
      {
        id: 'cpu_1',
        name: 'Intel Core i5-13600K',
        category: 'CPU',
        price: 18000,
        groupName: 'Streaming Rig',
        buildType: 'custom-build',
        rigInstanceId: 'rig_stream_2',
      },
      {
        id: 'gpu_2',
        name: 'RTX 4080 Super',
        category: 'GPU',
        price: 60000,
        groupName: 'Streaming Rig',
        buildType: 'custom-build',
        rigInstanceId: 'rig_stream_2',
      },
    ],
  };

  const rigs = getCustomRigsFromOrder(orderWithTwoRigs);
  assert.equal(rigs.length, 2);
  assert.equal(rigs[0].rigId, 'rig_ws_1');
  assert.equal(rigs[1].rigId, 'rig_stream_2');

  const v1 = initializeRigVerification('ord_multi', rigs[0].rigId, rigs[0].rigName, rigs[0].items);
  const v2 = initializeRigVerification('ord_multi', rigs[1].rigId, rigs[1].rigName, rigs[1].items);

  assert.equal(v1.picking.items.length, 2);
  assert.equal(v2.picking.items.length, 2);
  assert.notEqual(v1.picking.items[0].lineId, v2.picking.items[0].lineId);
});

test('order-assembly: enforces strict step order: picking -> assembly -> testing -> QC', () => {
  const items: OrderItem[] = [
    { id: 'cpu', name: 'CPU', category: 'CPU', price: 1000, lineId: 'l1' },
    { id: 'ram', name: 'RAM', category: 'RAM', price: 500, lineId: 'l2' },
  ];
  let v = initializeRigVerification('ord_x', 'rig_1', 'My Build', items);

  assert.equal(v.status, 'unverified');

  assert.throws(
    () => applyStepUpdateAndInvalidation(v, 'assembly', { completed: true }, staffVerifier, new Date()),
    /Component picking must be completed/
  );

  v = applyStepUpdateAndInvalidation(v, 'picking', { pickedLineIds: ['l1'] }, staffVerifier, new Date());
  assert.equal(v.picking.completed, false);
  assert.equal(v.status, 'in_progress');

  assert.throws(
    () => applyStepUpdateAndInvalidation(v, 'assembly', { completed: true }, staffVerifier, new Date()),
    /Component picking must be completed/
  );

  v = applyStepUpdateAndInvalidation(v, 'picking', { pickedLineIds: ['l1', 'l2'] }, staffVerifier, new Date());
  assert.equal(v.picking.completed, true);

  assert.throws(
    () => applyStepUpdateAndInvalidation(v, 'testing', { passed: true }, staffVerifier, new Date()),
    /Assembly must be completed/
  );

  v = applyStepUpdateAndInvalidation(v, 'assembly', { completed: true, notes: 'Built cleanly' }, staffVerifier, new Date());
  assert.equal(v.assembly.completed, true);

  assert.throws(
    () => applyStepUpdateAndInvalidation(v, 'qc', { passed: true }, staffVerifier, new Date()),
    /Hardware testing must be completed/
  );

  v = applyStepUpdateAndInvalidation(v, 'testing', { passed: false, notes: 'Memory errors in MemTest' }, staffVerifier, new Date());
  assert.equal(v.testing.passed, false);
  assert.equal(v.status, 'failed');

  assert.throws(
    () => applyStepUpdateAndInvalidation(v, 'qc', { passed: true }, staffVerifier, new Date()),
    /Hardware testing must be completed and passed/
  );

  v = applyStepUpdateAndInvalidation(v, 'testing', { passed: true, notes: 'Re-seated RAM, passed 24h bench' }, staffVerifier, new Date());
  assert.equal(v.testing.passed, true);
  assert.equal(v.status, 'in_progress');

  v = applyStepUpdateAndInvalidation(v, 'qc', { passed: true, notes: 'All stickers, clean cables, passed inspection' }, staffVerifier, new Date());
  assert.equal(v.qc.passed, true);
  assert.equal(v.status, 'passed');
});

test('order-assembly: invalidates downstream steps when earlier verification is corrected', () => {
  const items: OrderItem[] = [
    { id: 'cpu', name: 'CPU', category: 'CPU', price: 1000, lineId: 'l1' },
  ];
  let v = initializeRigVerification('ord_y', 'rig_1', 'My Build', items);

  v = applyStepUpdateAndInvalidation(v, 'picking', { completed: true }, staffVerifier, new Date());
  v = applyStepUpdateAndInvalidation(v, 'assembly', { completed: true }, staffVerifier, new Date());
  v = applyStepUpdateAndInvalidation(v, 'testing', { passed: true }, staffVerifier, new Date());
  v = applyStepUpdateAndInvalidation(v, 'qc', { passed: true }, staffVerifier, new Date());
  assert.equal(v.status, 'passed');

  v = applyStepUpdateAndInvalidation(v, 'picking', { pickedLineIds: [] }, staffVerifier, new Date());
  assert.equal(v.picking.completed, false);
  assert.equal(v.assembly.completed, false);
  assert.equal(v.testing.completed, false);
  assert.equal(v.testing.passed, false);
  assert.equal(v.qc.completed, false);
  assert.equal(v.qc.passed, false);
  assert.equal(v.status, 'unverified');

  v = applyStepUpdateAndInvalidation(v, 'picking', { completed: true }, staffVerifier, new Date());
  v = applyStepUpdateAndInvalidation(v, 'assembly', { completed: true }, staffVerifier, new Date());
  v = applyStepUpdateAndInvalidation(v, 'testing', { passed: false }, staffVerifier, new Date());
  assert.equal(v.status, 'failed');
  assert.equal(v.qc.completed, false);
});

test('order-assembly: assertCustomRigDispatchAllowed requires every custom rig in order to pass', () => {
  const multiRigOrder: Order = {
    id: 'ord_multi',
    userId: 'u_1',
    userEmail: 'user@example.com',
    totalPrice: 100000,
    status: 'building',
    fulfillmentStage: 'assembling_testing',
    createdAt: new Date(),
    items: [
      { id: 'c1', name: 'CPU', category: 'CPU', price: 20000, groupName: 'Rig 1', buildType: 'custom-build', lineId: 'l1', rigInstanceId: 'rig_1' },
      { id: 'c2', name: 'CPU', category: 'CPU', price: 20000, groupName: 'Rig 2', buildType: 'custom-build', lineId: 'l2', rigInstanceId: 'rig_2' },
    ],
  };

  const passedRecord: RigVerificationRecord = {
    rigId: 'rig_1',
    rigName: 'Rig 1',
    orderId: 'ord_multi',
    status: 'passed',
    picking: { completed: true, items: [] },
    assembly: { completed: true },
    testing: { completed: true, passed: true },
    qc: { completed: true, passed: true },
  };

  const inProgressRecord: RigVerificationRecord = {
    rigId: 'rig_2',
    rigName: 'Rig 2',
    orderId: 'ord_multi',
    status: 'in_progress',
    picking: { completed: true, items: [] },
    assembly: { completed: true },
    testing: { completed: false },
    qc: { completed: false },
  };

  assert.throws(
    () => assertCustomRigDispatchAllowed(multiRigOrder, { rig_1: passedRecord }),
    /has not been verified/
  );

  assert.throws(
    () => assertCustomRigDispatchAllowed(multiRigOrder, { rig_1: passedRecord, rig_2: inProgressRecord }),
    /verification is not passed/
  );

  assertCustomRigDispatchAllowed(multiRigOrder, {
    rig_1: passedRecord,
    rig_2: { ...passedRecord, rigId: 'rig_2', rigName: 'Rig 2' },
  });

  const historicalOrder: Order = {
    ...multiRigOrder,
    status: 'finished building',
    fulfillmentStage: 'delivered',
  };
  assertCustomRigDispatchAllowed(historicalOrder, {});
});

test('order-assembly: serializeRigVerificationRecord safely converts Firestore Timestamps and {_seconds, _nanoseconds} to ISO strings and plain objects', () => {
  const timestampObj = {
    _seconds: 1729000000,
    _nanoseconds: 729000000,
  };

  const recordWithFirestoreTimestamps: RigVerificationRecord = {
    rigId: 'rig_0',
    rigName: 'Gaming Beast',
    orderId: 'ord_test_123',
    status: 'in_progress',
    picking: {
      completed: true,
      items: [
        {
          lineId: 'l1',
          partId: 'p1',
          name: 'Ryzen 7 7800X3D',
          category: 'CPU',
          picked: true,
        },
      ],
      verifiedAt: timestampObj,
      verifiedBy: staffVerifier,
    },
    assembly: {
      completed: false,
      verifiedAt: null,
    },
    testing: {
      completed: false,
    },
    qc: {
      completed: false,
    },
    createdAt: timestampObj,
    updatedAt: timestampObj,
  };

  const serialized = serializeRigVerificationRecord(recordWithFirestoreTimestamps);

  const expectedIso = new Date(1729000000 * 1000).toISOString();
  assert.equal(serialized.createdAt, expectedIso);
  assert.equal(serialized.updatedAt, expectedIso);
  assert.equal(serialized.picking.verifiedAt, expectedIso);
  assert.equal(serialized.assembly.verifiedAt, null);

  assert.equal(Object.getPrototypeOf(serialized), Object.prototype);
  assert.equal(typeof serialized.updatedAt, 'string');
  assert.notEqual(typeof serialized.updatedAt, 'object');

  assert.equal(serializeTimestamp(null), null);
  assert.equal(serializeTimestamp(undefined), null);
  assert.equal(serializeTimestamp('2026-11-02T05:00:00.000Z'), '2026-11-02T05:00:00.000Z');
  const d = new Date('2026-11-02T05:00:00.000Z');
  assert.equal(serializeTimestamp(d), '2026-11-02T05:00:00.000Z');
  const mockTimestamp = { toDate: () => d };
  assert.equal(serializeTimestamp(mockTimestamp), '2026-11-02T05:00:00.000Z');
});
