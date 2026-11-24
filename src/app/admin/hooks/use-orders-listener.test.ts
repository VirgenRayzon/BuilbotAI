import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HEAD_ORDERS_LIMIT,
  createOrdersHeadQueryConfig,
  mergePagedOrders,
  deriveOrdersStats,
  shouldTriggerHeadRefresh,
  shouldTriggerAuthFetch,
} from './use-orders-helpers';
import type { Order } from '@/lib/types';

function mockOrder(id: string, overrides: Partial<Order> = {}): Order {
  return {
    id,
    userId: 'user-1',
    userEmail: 'user@example.com',
    items: [],
    totalPrice: 10000,
    status: 'pending',
    fulfillmentStage: 'order_placed',
    shippingMethod: 'standard_courier',
    shippingAddress: {
      fullName: 'Juan Dela Cruz',
      phone: '09171234567',
      email: 'user@example.com',
      region: 'NCR',
      city: 'Manila',
      barangay: 'Barangay 1',
      streetAddress: '123 Rizal St',
      postalCode: '1000',
    },
    createdAt: '2026-11-12T00:00:00.000Z',
    workflowRevision: 1,
    ...overrides,
  };
}

test('createOrdersHeadQueryConfig configures bounds strictly under limit(25) with createdAt desc', () => {
  assert.equal(HEAD_ORDERS_LIMIT, 25);

  const config = createOrdersHeadQueryConfig();
  assert.equal(config.collection, 'orders');
  assert.equal(config.orderByField, 'createdAt');
  assert.equal(config.orderDirection, 'desc');
  assert.equal(config.limit, 25);

  const customConfig = createOrdersHeadQueryConfig(10);
  assert.equal(customConfig.limit, 10);
});

test('mergePagedOrders merges incoming pages with deduplication by order ID', () => {
  const existing = [mockOrder('order-01'), mockOrder('order-02')];
  const incoming = [mockOrder('order-02'), mockOrder('order-03')];

  const merged = mergePagedOrders(existing, incoming);
  assert.equal(merged.length, 3);
  assert.deepEqual(merged.map(o => o.id), ['order-01', 'order-02', 'order-03']);
});

test('deriveOrdersStats calculates stage counts and total orders accurately', () => {
  const stageCounts = {
    order_placed: 5,
    assembling_testing: 3,
    out_for_delivery: 2,
    delivered: 10,
    cancelled: 1,
  };

  const stats = deriveOrdersStats(stageCounts, 21);
  assert.equal(stats.pendingOrdersCount, 5);
  assert.equal(stats.completedOrdersCount, 10);
  assert.equal(stats.cancelledOrdersCount, 1);
  assert.equal(stats.totalOrdersCount, 21);
  assert.equal(stats.stageCounts.orderPlaced, 5);
  assert.equal(stats.stageCounts.assembling, 3);
  assert.equal(stats.stageCounts.outForDelivery, 2);
  assert.equal(stats.stageCounts.delivered, 10);
  assert.equal(stats.stageCounts.cancelled, 1);
});

test('shouldTriggerHeadRefresh triggers refresh only when head orders list changes from existing baseline', () => {
  // Baseline initial load: empty prevHeadIds does not trigger unnecessary refresh
  assert.equal(shouldTriggerHeadRefresh('', 'order-1,order-2'), false);

  // Subsequent snapshot: identical head does not trigger refresh
  assert.equal(shouldTriggerHeadRefresh('order-1,order-2', 'order-1,order-2'), false);

  // New order arrived at the head: triggers refresh
  assert.equal(shouldTriggerHeadRefresh('order-1,order-2', 'order-new,order-1'), true);
});

test('shouldTriggerAuthFetch detects authenticated user or profile fallback', () => {
  // Cold-start with null user and no profile
  assert.equal(shouldTriggerAuthFetch(null, null), false);
  assert.equal(shouldTriggerAuthFetch(undefined, undefined), false);

  // Auth resolved with Firebase User
  assert.equal(shouldTriggerAuthFetch({ uid: 'user-123' }, null), true);

  // Profile loaded with uid fallback
  assert.equal(shouldTriggerAuthFetch(null, { uid: 'staff-456' }), true);
});
