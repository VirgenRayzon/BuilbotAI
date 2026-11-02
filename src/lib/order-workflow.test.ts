import test from 'node:test';
import assert from 'node:assert/strict';
import type { Order } from './types';
import {
  assertOrderStageTransition,
  assertStaffPaymentStatusTransition,
  availableOrderStages,
  calculateOrderFinancialSummary,
  getAllowedStaffPaymentStatuses,
  getLegacyStatusFromStage,
  getNetCollectedAmount,
  getNextOrderStage,
  getOrderStageAction,
  getOrderFulfillmentStage,
  getOrderFulfillmentStageLabel,
  getOrderPaymentHistory,
  getOrderStockState,
  getRefundedAmount,
  getRemainingRefundableAmount,
  isOrderReadyForFulfillmentQueue,
  requiresOrderAssembly,
} from './order-workflow';

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'ord-test-1',
    orderNumber: 'BB-20261101-TEST',
    userId: 'user-1',
    userEmail: 'customer@example.com',
    items: [{ id: 'cpu-1', name: 'Ryzen 7 7800X3D', category: 'CPU', price: 24000, quantity: 1 }],
    totalPrice: 24000,
    status: 'pending',
    createdAt: '2026-11-01T10:00:00Z',
    ...overrides,
  };
}

test('legacy reservations map cleanly into unified fulfillment stages and progress sequentially', () => {
  const legacyPending = makeOrder({ type: 'custom', status: 'pending' });
  assert.equal(getOrderFulfillmentStage(legacyPending), 'order_placed');
  assert.equal(getOrderFulfillmentStageLabel(legacyPending), 'Order Placed');
  assert.deepEqual(availableOrderStages(legacyPending), [
    'order_placed',
    'assembling_testing',
    'out_for_delivery',
    'delivered',
  ]);
  assert.equal(getNextOrderStage(legacyPending), 'assembling_testing');

  // Legacy reservations without paymentMethod behave as COD/store pickup and can advance to assembling_testing
  assert.doesNotThrow(() => assertOrderStageTransition(legacyPending, 'assembling_testing'));
  assert.throws(
    () => assertOrderStageTransition(legacyPending, 'out_for_delivery'),
    /sequential fulfillment step/i
  );

  const legacyFinished = makeOrder({ type: 'prebuilt', status: 'finished building' });
  assert.equal(getOrderFulfillmentStage(legacyFinished), 'out_for_delivery');
  assert.equal(getOrderFulfillmentStageLabel(legacyFinished), 'Ready for Pickup');

  // Cannot mark delivered until payment is confirmed paid
  assert.throws(
    () => assertOrderStageTransition(legacyFinished, 'delivered'),
    /Confirm payment before marking the order delivered/i
  );
  assert.doesNotThrow(() =>
    assertOrderStageTransition({ ...legacyFinished, paymentStatus: 'paid' }, 'delivered')
  );

  assert.equal(getLegacyStatusFromStage('order_placed'), 'pending');
  assert.equal(getLegacyStatusFromStage('assembling_testing'), 'building');
  assert.equal(getLegacyStatusFromStage('out_for_delivery'), 'finished building');
  assert.equal(getLegacyStatusFromStage('delivered'), 'finished building');
});

test('online orders require confirmed payment before progressing fulfillment', () => {
  const unpaidGcash = makeOrder({
    items: [{ id: 'gpu-1', name: 'RTX 4070', category: 'GPU', price: 38000, buildType: 'part' }],
    paymentMethod: 'gcash_simulated',
    paymentStatus: 'pending',
  });
  assert.deepEqual(availableOrderStages(unpaidGcash), [
    'order_placed',
    'out_for_delivery',
    'delivered',
  ]);
  assert.throws(
    () => assertOrderStageTransition(unpaidGcash, 'out_for_delivery'),
    /Confirm online payment before progressing fulfillment/i
  );
  assert.doesNotThrow(() =>
    assertOrderStageTransition({ ...unpaidGcash, paymentStatus: 'paid' }, 'out_for_delivery')
  );
});

test('admits only paid or COD orders into the fulfillment queue', () => {
  assert.equal(
    isOrderReadyForFulfillmentQueue(
      makeOrder({ paymentMethod: 'gcash_simulated', paymentStatus: 'paid' })
    ),
    true
  );
  assert.equal(
    isOrderReadyForFulfillmentQueue(
      makeOrder({ paymentMethod: 'cod', paymentStatus: 'unpaid' })
    ),
    true
  );

  for (const paymentStatus of ['pending', 'failed', 'cancelled'] as const) {
    assert.equal(
      isOrderReadyForFulfillmentQueue(
        makeOrder({ paymentMethod: 'gcash_simulated', paymentStatus })
      ),
      false
    );
  }
  assert.equal(
    isOrderReadyForFulfillmentQueue(
      makeOrder({ paymentMethod: undefined, paymentStatus: 'unpaid' })
    ),
    false
  );
});

test('multi-part hardware orders require assembling and testing before delivery', () => {
  const multiPartOrder = makeOrder({
    items: [
      { id: 'cpu-1', name: 'Ryzen 7 8700F', category: 'CPU', price: 15000 },
      { id: 'mb-1', name: 'B650 Eagle AX', category: 'Motherboard', price: 10000 },
      { id: 'ram-1', name: 'Corsair Vengeance DDR5', category: 'RAM', price: 7000 },
      { id: 'gpu-1', name: 'RTX 4060', category: 'GPU', price: 20000 },
    ],
    paymentMethod: 'cod',
    paymentStatus: 'unpaid',
  });
  assert.equal(requiresOrderAssembly(multiPartOrder), true);
  assert.deepEqual(availableOrderStages(multiPartOrder), [
    'order_placed',
    'assembling_testing',
    'out_for_delivery',
    'delivered',
  ]);
  assert.equal(getNextOrderStage(multiPartOrder), 'assembling_testing');
  assert.doesNotThrow(() => assertOrderStageTransition(multiPartOrder, 'assembling_testing'));
});

test('staff payment status transition policy enforces cancellation, delivery, refund, and override reason rules', () => {
  const codOrder = makeOrder({ paymentMethod: 'cod', paymentStatus: 'unpaid' });
  assert.deepEqual(getAllowedStaffPaymentStatuses(codOrder), ['unpaid', 'paid']);
  assert.doesNotThrow(() => assertStaffPaymentStatusTransition(codOrder, 'paid'));
  assert.throws(
    () => assertStaffPaymentStatusTransition(codOrder, 'pending'),
    /Cash on Delivery orders only support/i
  );

  // Online order manual confirmation requires reason >= 8 chars
  const paymongoOrder = makeOrder({
    paymentMethod: 'paymongo_simulated',
    paymentStatus: 'pending',
  });
  assert.throws(
    () => assertStaffPaymentStatusTransition(paymongoOrder, 'paid', 'short'),
    /verification reason/i
  );
  assert.doesNotThrow(() =>
    assertStaffPaymentStatusTransition(paymongoOrder, 'paid', 'Verified PayMongo dashboard receipt #123')
  );

  // Reverting paid order before delivery requires reason >= 8 chars
  const paidCod = makeOrder({ paymentMethod: 'cod', paymentStatus: 'paid' });
  assert.throws(
    () => assertStaffPaymentStatusTransition(paidCod, 'unpaid'),
    /Enter a reason/i
  );
  assert.doesNotThrow(() =>
    assertStaffPaymentStatusTransition(paidCod, 'unpaid', 'Marked paid on wrong order by mistake')
  );

  // Cancelled, archived, delivered, and refunded orders lock payment reversal
  assert.throws(
    () => assertStaffPaymentStatusTransition({ ...codOrder, status: 'cancelled' }, 'paid'),
    /Cancelled orders cannot change payment status/i
  );
  assert.throws(
    () => assertStaffPaymentStatusTransition({ ...codOrder, isArchived: true }, 'paid'),
    /Restore archived orders/i
  );
  assert.throws(
    () =>
      assertStaffPaymentStatusTransition(
        { ...paidCod, status: 'finished building', fulfillmentStage: 'delivered' },
        'unpaid',
        'Attempted revert after delivery'
      ),
    /Delivered orders cannot revert/i
  );
  assert.throws(
    () =>
      assertStaffPaymentStatusTransition(
        { ...paidCod, refundStatus: 'partial', refundedAmount: 2000 },
        'unpaid',
        'Attempted revert after partial refund'
      ),
    /Orders with recorded refunds cannot revert/i
  );
});

test('stock state and payment history synthesize cleanly for legacy and modern orders', () => {
  const activeLegacy = makeOrder();
  assert.equal(getOrderStockState(activeLegacy), 'reserved');
  assert.equal(getOrderStockState({ ...activeLegacy, status: 'cancelled' }), 'restored');
  assert.equal(getOrderStockState({ ...activeLegacy, stockRestoredAt: '2026-11-01T11:00:00Z' }), 'restored');

  const history = getOrderPaymentHistory(
    makeOrder({ paymentMethod: 'gcash_simulated', paymentStatus: 'paid', paymentReference: 'GCASH-1' })
  );
  assert.equal(history.length, 2);
  assert.equal(history[0].status, 'pending');
  assert.equal(history[1].status, 'paid');
});

test('calculateOrderFinancialSummary distinguishes placed value, collected payments, refunds, and net sales', () => {
  const orders: Order[] = [
    // Unpaid active COD order: counts toward placedOrderValue ONLY, not collectedPayments or netSales
    makeOrder({ id: 'o1', totalPrice: 30000, paymentMethod: 'cod', paymentStatus: 'unpaid' }),
    // Paid active order with partial refund of 4000
    makeOrder({
      id: 'o2',
      totalPrice: 50000,
      paymentMethod: 'paymongo_simulated',
      paymentStatus: 'paid',
      refundStatus: 'partial',
      refundedAmount: 4000,
    }),
    // Paid order that was later cancelled and fully refunded (20000)
    makeOrder({
      id: 'o3',
      totalPrice: 20000,
      status: 'cancelled',
      paymentMethod: 'gcash_simulated',
      paymentStatus: 'paid',
      refundStatus: 'refunded',
      refundedAmount: 20000,
    }),
    // Unpaid cancelled order: contributes 0 everywhere
    makeOrder({
      id: 'o4',
      totalPrice: 15000,
      status: 'cancelled',
      paymentMethod: 'gcash_simulated',
      paymentStatus: 'cancelled',
    }),
  ];

  assert.equal(getRefundedAmount(orders[1]), 4000);
  assert.equal(getRemainingRefundableAmount(orders[1]), 46000);
  assert.equal(getNetCollectedAmount(orders[1]), 46000);

  const summary = calculateOrderFinancialSummary(orders);
  // Placed value = non-cancelled orders (o1: 30,000 + o2: 50,000 = 80,000)
  assert.equal(summary.placedOrderValue, 80000);
  // Collected payments = all paid orders gross (o2: 50,000 + o3: 20,000 = 70,000)
  assert.equal(summary.collectedPayments, 70000);
  // Refunds issued = o2: 4,000 + o3: 20,000 = 24,000
  assert.equal(summary.refundsIssued, 24000);
  // Net sales = (50,000 - 4,000) + (20,000 - 20,000) = 46,000
  assert.equal(summary.netSales, 46000);
  assert.equal(summary.totalOrderCount, 4);
  assert.equal(summary.activeOrderCount, 2);
  assert.equal(summary.paidOrderCount, 2);
  assert.equal(summary.cancelledOrderCount, 2);
});



test('stage actions describe payment prerequisites and pickup while respecting terminal states', () => {
  assert.equal(getOrderStageAction(makeOrder({ type: 'custom' })).label, 'Start Assembly');
  assert.equal(getOrderStageAction(makeOrder({ shippingMethod: 'store_pickup' })).label, 'Mark Ready for Pickup');
  assert.match(getOrderStageAction(makeOrder({ paymentMethod: 'gcash_simulated', paymentStatus: 'unpaid' })).reason, /Confirm online payment/);
  assert.match(getOrderStageAction(makeOrder({ fulfillmentStage: 'out_for_delivery', paymentMethod: 'cod', paymentStatus: 'unpaid' })).reason, /Confirm payment/);
  assert.equal(getOrderStageAction(makeOrder({ fulfillmentStage: 'delivered', paymentStatus: 'paid' })).next, null);
  assert.equal(getOrderStageAction(makeOrder({ status: 'cancelled' })).next, null);
});
