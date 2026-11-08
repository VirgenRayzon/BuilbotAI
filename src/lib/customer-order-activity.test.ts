import test from 'node:test';
import assert from 'node:assert/strict';
import type { Order, OrderItem } from '@/lib/types';
import {
  getAssemblyRigsFromOrder,
  getOrderPlacedSummary,
  getVisibleQcNotes,
  orderHasBuildOrPrebuilt,
  shouldSubscribeToAssemblyVerification,
} from '@/lib/customer-order-activity';
import {
  initializeRigVerification,
  applyStepUpdateAndInvalidation,
} from '@/lib/order-assembly';

const mockCpu: OrderItem = {
  id: 'part_cpu',
  productId: 'part_cpu',
  lineId: 'line_1_cpu',
  rigInstanceId: 'rig_custom_1',
  name: 'AMD Ryzen 7 7800X3D',
  category: 'CPU',
  price: 24000,
  quantity: 1,
  buildType: 'custom-build',
};

const mockGpu: OrderItem = {
  id: 'part_gpu',
  productId: 'part_gpu',
  lineId: 'line_2_gpu',
  rigInstanceId: 'rig_custom_1',
  name: 'NVIDIA GeForce RTX 4070 Super',
  category: 'GPU',
  price: 38000,
  quantity: 1,
  buildType: 'custom-build',
};

const mockExtraItem: OrderItem = {
  id: 'part_mouse',
  productId: 'part_mouse',
  lineId: 'line_3_mouse',
  name: 'Logitech G Pro X Superlight',
  category: 'Mouse',
  price: 7500,
  quantity: 1,
  buildType: 'additional',
};

test('customer-order-activity: getOrderPlacedSummary accurately formats order contents matching Image 1', () => {
  const customWithExtra: Order = {
    id: 'ord_1',
    userId: 'user_1',
    userEmail: 'user@example.com',
    items: [mockCpu, mockGpu, mockExtraItem],
    totalPrice: 69500,
    status: 'building',
    fulfillmentStage: 'assembling_testing',
    createdAt: new Date(),
  };

  assert.equal(
    getOrderPlacedSummary(customWithExtra),
    'Customer submitted a custom rig and additional item.'
  );

  const customOnly: Order = {
    ...customWithExtra,
    items: [mockCpu, mockGpu],
  };
  assert.equal(
    getOrderPlacedSummary(customOnly),
    'Customer submitted a custom rig configuration.'
  );

  const partsOnly: Order = {
    ...customWithExtra,
    items: [mockExtraItem],
  };
  assert.equal(
    getOrderPlacedSummary(partsOnly),
    'Customer submitted an order for components.'
  );
});

test('customer-order-activity: getAssemblyRigsFromOrder identifies rigs correctly', () => {
  const order: Order = {
    id: 'ord_1',
    userId: 'user_1',
    userEmail: 'user@example.com',
    items: [mockCpu, mockGpu, mockExtraItem],
    totalPrice: 69500,
    status: 'building',
    fulfillmentStage: 'assembling_testing',
    createdAt: new Date(),
  };

  const rigs = getAssemblyRigsFromOrder(order);
  assert.equal(rigs.length, 1);
  assert.equal(rigs[0].rigId, 'rig_custom_1');
  assert.equal(rigs[0].items.length, 2);
});

test('customer-order-activity: terminal delivered orders do not open realtime assembly listeners', () => {
  assert.equal(
    shouldSubscribeToAssemblyVerification({
      status: 'finished building',
      fulfillmentStage: 'delivered',
    }),
    false
  );
  assert.equal(
    shouldSubscribeToAssemblyVerification({
      status: 'building',
      fulfillmentStage: 'assembling_testing',
    }),
    true
  );
});

test('customer-order-activity: QC notes are visible only when staff saved meaningful text', () => {
  assert.equal(getVisibleQcNotes(undefined), null);
  assert.equal(getVisibleQcNotes(''), null);
  assert.equal(getVisibleQcNotes('   '), null);
  assert.equal(
    getVisibleQcNotes('  Peel removed, accessories boxed  '),
    'Peel removed, accessories boxed'
  );
});

test('customer-order-activity: verifies 4-stage assembly workflow structure matching Image 2', () => {
  const orderId = 'ord_1';
  const rigId = 'rig_custom_1';
  const rigItems = [mockCpu, mockGpu];

  let record = initializeRigVerification(orderId, rigId, 'My Custom Rig', rigItems);
  assert.equal(record.picking.completed, false);
  assert.equal(record.picking.items.length, 2);
  assert.equal(record.assembly.completed, false);
  assert.equal(record.testing.completed, false);
  assert.equal(record.qc.completed, false);

  const staff = { uid: 'staff_1', name: 'Technician Ray', role: 'Manager' as const };
  const now = new Date();

  record = applyStepUpdateAndInvalidation(
    record,
    'picking',
    { pickedLineIds: ['line_1_cpu', 'line_2_gpu'] },
    staff,
    now
  );
  assert.equal(record.picking.completed, true);
  assert.equal(record.picking.items.filter((i) => i.picked).length, 2);

  record = applyStepUpdateAndInvalidation(
    record,
    'assembly',
    { completed: true, notes: 'Cable routing clean, AIO mounted' },
    staff,
    now
  );
  assert.equal(record.assembly.completed, true);
  assert.equal(record.assembly.notes, 'Cable routing clean, AIO mounted');

  record = applyStepUpdateAndInvalidation(
    record,
    'testing',
    { completed: true, passed: true, notes: '24h MemTest86 0 errors, BIOS updated to v1.40' },
    staff,
    now
  );
  assert.equal(record.testing.completed, true);
  assert.equal(record.testing.passed, true);
  assert.equal(record.testing.notes, '24h MemTest86 0 errors, BIOS updated to v1.40');

  assert.equal(record.qc.completed, false);
  assert.equal(record.status, 'in_progress');

  record = applyStepUpdateAndInvalidation(
    record,
    'qc',
    { completed: true, passed: true, notes: 'Peel removed, accessories boxed, ready for dispatch' },
    staff,
    now
  );
  assert.equal(record.qc.completed, true);
  assert.equal(record.qc.passed, true);
  assert.equal(record.qc.notes, 'Peel removed, accessories boxed, ready for dispatch');
  assert.equal(record.status, 'passed');
});

test('customer-order-activity: orderHasBuildOrPrebuilt correctly identifies individual item orders vs custom/prebuilt builds', () => {
  const singleComponentOrder: Order = {
    id: 'ord_cpu_only',
    userId: 'user_1',
    userEmail: 'user@example.com',
    items: [
      {
        id: 'part_cpu_1',
        productId: 'part_cpu_1',
        name: 'Intel Core i3-10100',
        category: 'CPU',
        price: 6832,
        quantity: 1,
        buildType: 'part',
      },
    ],
    totalPrice: 6832,
    status: 'pending',
    fulfillmentStage: 'order_placed',
    createdAt: new Date(),
  };

  assert.equal(orderHasBuildOrPrebuilt(singleComponentOrder), false);

  const multiplePartsOrder: Order = {
    id: 'ord_parts_multi',
    userId: 'user_1',
    userEmail: 'user@example.com',
    items: [
      {
        id: 'part_cpu_1',
        name: 'Intel Core i3-10100',
        category: 'CPU',
        price: 6832,
        quantity: 1,
        buildType: 'part',
      },
      {
        id: 'part_mouse_1',
        name: 'Logitech G Pro Mouse',
        category: 'Peripherals',
        price: 4500,
        quantity: 1,
        buildType: 'additional',
      },
    ],
    totalPrice: 11332,
    status: 'pending',
    fulfillmentStage: 'order_placed',
    createdAt: new Date(),
  };

  assert.equal(orderHasBuildOrPrebuilt(multiplePartsOrder), false);

  const customRigOrder: Order = {
    id: 'ord_custom',
    userId: 'user_1',
    userEmail: 'user@example.com',
    items: [mockCpu, mockGpu],
    totalPrice: 62000,
    status: 'building',
    fulfillmentStage: 'assembling_testing',
    createdAt: new Date(),
  };

  assert.equal(orderHasBuildOrPrebuilt(customRigOrder), true);

  const prebuiltOrder: Order = {
    id: 'ord_prebuilt',
    userId: 'user_1',
    userEmail: 'user@example.com',
    type: 'prebuilt',
    prebuiltName: 'Valkyrie V2',
    items: [
      {
        id: 'part_pb_1',
        name: 'Valkyrie V2 Rig',
        category: 'Prebuilt',
        price: 75000,
        quantity: 1,
        buildType: 'prebuilt',
      },
    ],
    totalPrice: 75000,
    status: 'pending',
    fulfillmentStage: 'order_placed',
    createdAt: new Date(),
  };

  assert.equal(orderHasBuildOrPrebuilt(prebuiltOrder), true);
});
