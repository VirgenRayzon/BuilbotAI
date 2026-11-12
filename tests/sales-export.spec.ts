import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateSalesExportParams,
  traverseOrdersInPages,
  aggregateExportRevenueData,
  type SalesExportQueryOptions,
} from '../src/lib/server/sales-export-helpers';
import type { Order } from '../src/lib/types';

test('sales-export: validates valid query parameters', () => {
  const result = validateSalesExportParams({
    timeRange: 'week',
    startDate: '2026-11-01',
    endDate: '2026-11-07',
    format: 'xlsx',
  });
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.timeRange, 'week');
    assert.equal(result.data.format, 'xlsx');
    assert.equal(result.data.startDate, '2026-11-01');
    assert.equal(result.data.endDate, '2026-11-07');
  }
});

test('sales-export: rejects invalid date ranges where startDate > endDate', () => {
  const result = validateSalesExportParams({
    startDate: '2026-11-10',
    endDate: '2026-11-01',
  });
  assert.equal(result.success, false);
  if (!result.success) {
    assert.match(result.error, /startDate cannot be after endDate/i);
  }
});

test('sales-export: rejects invalid formats or malicious parameters', () => {
  const result = validateSalesExportParams({
    format: 'exe' as unknown as 'xlsx',
  });
  assert.equal(result.success, false);
});

test('sales-export: traverses orders in 250-doc pages using startAfter cursor', async () => {
  // Mock 600 orders: page 1 = 250, page 2 = 250, page 3 = 100
  const mockOrders: Order[] = Array.from({ length: 600 }, (_, i) => ({
    id: `ord_${String(i).padStart(4, '0')}`,
    orderNumber: `ORD-${i}`,
    userId: `user_${i}`,
    userEmail: `user${i}@example.com`,
    items: [],
    subtotal: 1000,
    shippingFee: 0,
    protectionFee: 0,
    discountAmount: 0,
    totalPrice: 1000,
    status: 'pending',
    fulfillmentStage: 'order_placed',
    refundStatus: 'none',
    stockState: 'reserved',
    paymentMethod: 'cod',
    paymentStatus: 'paid',
    paymentReference: `REF-${i}`,
    createdAt: new Date(1731300000000 - i * 60000),
    updatedAt: new Date(1731300000000 - i * 60000),
  }));

  const queriedCursors: (string | null)[] = [];
  const pageSize = 250;

  const fetchPage = async (cursor: string | null): Promise<{ orders: Order[]; nextCursor: string | null }> => {
    queriedCursors.push(cursor);
    const startIndex = cursor ? mockOrders.findIndex((o) => o.id === cursor) + 1 : 0;
    const slice = mockOrders.slice(startIndex, startIndex + pageSize);
    const nextCursor = slice.length === pageSize ? slice[slice.length - 1].id : null;
    return { orders: slice, nextCursor };
  };

  const results = await traverseOrdersInPages({
    fetchPage,
    maxOrders: 5000,
  });

  assert.equal(results.length, 600, 'All 600 orders must be traversed');
  assert.equal(queriedCursors.length, 3, 'Must fetch exactly 3 pages (250 + 250 + 100)');
  assert.equal(queriedCursors[0], null, 'First page has null cursor');
  assert.equal(queriedCursors[1], mockOrders[249].id, 'Second page starts after doc 250');
  assert.equal(queriedCursors[2], mockOrders[499].id, 'Third page starts after doc 500');
});

test('sales-export: bounds total orders to maxOrders safety limit', async () => {
  const fetchPage = async (cursor: string | null): Promise<{ orders: Order[]; nextCursor: string | null }> => {
    const page: Order[] = Array.from({ length: 250 }, (_, i) => ({
      id: `ord_${(cursor ? 250 : 0) + i}`,
      orderNumber: 'ORD',
      userId: 'u',
      userEmail: 'u@example.com',
      items: [],
      subtotal: 100,
      shippingFee: 0,
      protectionFee: 0,
      discountAmount: 0,
      totalPrice: 100,
      status: 'pending',
      fulfillmentStage: 'order_placed',
      refundStatus: 'none',
      stockState: 'reserved',
      paymentMethod: 'cod',
      paymentStatus: 'paid',
      paymentReference: 'REF',
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    return { orders: page, nextCursor: 'more' };
  };

  const results = await traverseOrdersInPages({
    fetchPage,
    maxOrders: 300,
  });

  assert.ok(results.length <= 500, 'Stops when maxOrders is exceeded');
});

test('sales-export: aggregateExportRevenueData calculates revenue over periods', () => {
  const orders: Order[] = [
    {
      id: 'ord_1',
      orderNumber: 'ORD-1',
      userId: 'u1',
      userEmail: 'u1@example.com',
      items: [],
      subtotal: 10000,
      totalPrice: 10000,
      paymentStatus: 'paid',
      paymentMethod: 'gcash_simulated',
      refundStatus: 'none',
      status: 'pending',
      paidAt: new Date('2026-11-10T10:00:00Z'),
      createdAt: new Date('2026-11-10T09:00:00Z'),
    },
    {
      id: 'ord_2',
      orderNumber: 'ORD-2',
      userId: 'u2',
      userEmail: 'u2@example.com',
      items: [],
      subtotal: 15000,
      totalPrice: 15000,
      paymentStatus: 'paid',
      paymentMethod: 'cod',
      refundStatus: 'partial',
      refundedAmount: 2000,
      status: 'pending',
      paidAt: new Date('2026-11-10T12:00:00Z'),
      createdAt: new Date('2026-11-10T11:00:00Z'),
    },
    {
      id: 'ord_3',
      orderNumber: 'ORD-3',
      userId: 'u3',
      userEmail: 'u3@example.com',
      items: [],
      subtotal: 20000,
      totalPrice: 20000,
      paymentStatus: 'paid',
      paymentMethod: 'cod',
      refundStatus: 'none',
      status: 'pending',
      paidAt: new Date('2026-11-11T10:00:00Z'),
      createdAt: new Date('2026-11-11T09:00:00Z'),
    },
  ];

  const revenueData = aggregateExportRevenueData(orders, 'week');
  assert.ok(revenueData.length > 0, 'Revenue data must not be empty');
  const nov10 = revenueData.find((d) => d.name.includes('Nov 10') || d.name.includes('11/10'));
  assert.ok(nov10, 'Nov 10 data point must exist');
  assert.equal(nov10.revenue, 23000, 'Nov 10 net revenue is 10000 + (15000 - 2000) = 23000');

  const nov11 = revenueData.find((d) => d.name.includes('Nov 11') || d.name.includes('11/11'));
  assert.ok(nov11, 'Nov 11 data point must exist');
  assert.equal(nov11.revenue, 20000, 'Nov 11 net revenue is 20000');
});
