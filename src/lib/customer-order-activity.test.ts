import test from 'node:test';
import assert from 'node:assert/strict';
import type { Order, OrderItem } from '@/lib/types';
import {
  getAssemblyRigsFromOrder,
  getOrderPlacedSummary,
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

test('customer-order-activity: verifies 4-stage assembly workflow structure matching Image 2', () => {
  const orderId = 'ord_1';
  const rigId = 'rig_custom_1';
  const rigItems = [mockCpu, mockGpu];

  // 1. Initialize blank verification record
  let record = initializeRigVerification(orderId, rigId, 'My Custom Rig', rigItems);
  assert.equal(record.picking.completed, false);
  assert.equal(record.picking.items.length, 2);
  assert.equal(record.assembly.completed, false);
  assert.equal(record.testing.completed, false);
  assert.equal(record.qc.completed, false);

  const staff = { uid: 'staff_1', name: 'Technician Ray', role: 'Manager' as const };
  const now = new Date();

  // 2. Stage 1: Component Picking (8 / 8 or 2 / 2)
  record = applyStepUpdateAndInvalidation(
    record,
    'picking',
    { pickedLineIds: ['line_1_cpu', 'line_2_gpu'] },
    staff,
    now
  );
  assert.equal(record.picking.completed, true);
  assert.equal(record.picking.items.filter((i) => i.picked).length, 2);

  // 3. Stage 2: Physical Assembly (COMPLETED)
  record = applyStepUpdateAndInvalidation(
    record,
    'assembly',
    { completed: true, notes: 'Cable routing clean, AIO mounted' },
    staff,
    now
  );
  assert.equal(record.assembly.completed, true);
  assert.equal(record.assembly.notes, 'Cable routing clean, AIO mounted');

  // 4. Stage 3: Hardware Bench Testing (POST, BIOS, MemTest, Stress) (PASSED)
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

  // 5. Stage 4: Final Quality Control (QC) (PENDING with QC notes)
  assert.equal(record.qc.completed, false);
  assert.equal(record.status, 'in_progress');

  // Technician passes QC with notes
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
