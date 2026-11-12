import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AdminOrderQuerySchema,
  listAdminOrdersPage,
  type AdminOrderQuery,
} from './admin-order-queries';
import type { Order } from '@/lib/types';

// Mock Order factory
function createMockOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: overrides.id || `order-${Math.random().toString(36).slice(2, 8)}`,
    userId: 'user-1',
    userEmail: 'user@example.com',
    items: [
      {
        id: 'item-1',
        name: 'Ryzen 7 7800X3D',
        price: 25000,
        category: 'CPU',
        quantity: 1,
      },
    ],
    totalPrice: overrides.totalPrice ?? 25000,
    status: overrides.status || 'pending',
    fulfillmentStage: overrides.fulfillmentStage || 'order_placed',
    queueStage: overrides.queueStage || 'order_placed',
    paymentMethod: overrides.paymentMethod || 'cod',
    paymentStatus: overrides.paymentStatus || 'unpaid',
    refundStatus: overrides.refundStatus || 'none',
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
    createdAt: overrides.createdAt || '2026-11-12T00:00:00.000Z',
    isArchived: overrides.isArchived,
    workflowRevision: overrides.workflowRevision || 1,
  };
}

test('AdminOrderQuerySchema enforces bounds and defaults', () => {
  // Valid defaults
  const parsedDefault = AdminOrderQuerySchema.parse({});
  assert.equal(parsedDefault.archived, false);
  assert.equal(parsedDefault.stage, 'all');
  assert.equal(parsedDefault.sortBy, 'newest');
  assert.equal(parsedDefault.pageSize, 25);
  assert.equal(parsedDefault.cursor, undefined);

  // Valid max pageSize (50)
  const parsedMax = AdminOrderQuerySchema.parse({ pageSize: 50 });
  assert.equal(parsedMax.pageSize, 50);

  // Bounds rejection: pageSize > 50
  assert.throws(
    () => AdminOrderQuerySchema.parse({ pageSize: 51 }),
    /too_big|50/i
  );

  // Bounds rejection: pageSize < 1
  assert.throws(
    () => AdminOrderQuerySchema.parse({ pageSize: 0 }),
    /too_small|1/i
  );

  // Invalid stage
  assert.throws(
    () => AdminOrderQuerySchema.parse({ stage: 'invalid_stage' }),
    /invalid_enum_value/i
  );

  // Invalid sortBy
  assert.throws(
    () => AdminOrderQuerySchema.parse({ sortBy: 'random' }),
    /invalid_enum_value/i
  );
});

test('listAdminOrdersPage rejects non-staff tokens', async () => {
  const mockDeps = {
    getOrderActor: async () => ({
      decoded: { uid: 'customer-1' },
      isStaff: false,
      isManager: false,
      isSuperAdmin: false,
    }),
  };

  await assert.rejects(
    async () => {
      await listAdminOrdersPage('token-customer', {}, mockDeps as any);
    },
    /unauthorized|staff access required/i
  );
});

test('listAdminOrdersPage allows staff tokens and constructs indexed query when archived=true or env flag is set', async () => {
  const queriesExecuted: string[] = [];
  const countsExecuted: string[] = [];

  const mockDb = {
    collection: (name: string) => {
      queriesExecuted.push(`collection:${name}`);
      const queryState = {
        name,
        wheres: [] as string[],
        orders: [] as string[],
        limitVal: 0,
        startAfterDoc: null as any,
      };

      const q = {
        where: (field: string, op: string, val: unknown) => {
          queryState.wheres.push(`${field} ${op} ${val}`);
          return q;
        },
        orderBy: (field: any, dir: string) => {
          const fieldName = typeof field === 'object' && field._toFieldPath ? field._toFieldPath() : String(field);
          queryState.orders.push(`${fieldName} ${dir}`);
          return q;
        },
        startAfter: (doc: any) => {
          queryState.startAfterDoc = doc;
          return q;
        },
        limit: (n: number) => {
          queryState.limitVal = n;
          return q;
        },
        count: () => ({
          get: async () => {
            countsExecuted.push(queryState.wheres.join(' AND '));
            return {
              data: () => ({ count: 42 }),
            };
          },
        }),
        get: async () => {
          return {
            docs: [
              {
                id: 'order-1',
                data: () => createMockOrder({ id: 'order-1', isArchived: true }),
              },
            ],
          };
        },
      };
      return q;
    },
    doc: (_path: string) => ({
      get: async () => ({ exists: true }),
    }),
  };

  const mockDeps = {
    getOrderActor: async () => ({
      decoded: { uid: 'staff-1' },
      isStaff: true,
      isManager: true,
      isSuperAdmin: false,
    }),
    firestore: mockDb as any,
    isIndexedEnabled: true,
  };

  const result = await listAdminOrdersPage('token-staff', { archived: true, stage: 'order_placed' }, mockDeps);
  assert.equal(result.orders.length, 1);
  assert.equal(result.orders[0].id, 'order-1');
  assert.equal(result.totalCount, 42);
  assert.ok(countsExecuted.length > 0, 'Stage count queries were executed');
});

test('listAdminOrdersPage cursor stability across page 1 and page 2 without duplicate or skipped docs', async () => {
  // 5 mock orders in chronological order
  const mockDataset: Order[] = [
    createMockOrder({ id: 'order-01', createdAt: '2026-11-12T10:00:00.000Z', isArchived: false, queueStage: 'order_placed' }),
    createMockOrder({ id: 'order-02', createdAt: '2026-11-12T09:00:00.000Z', isArchived: false, queueStage: 'order_placed' }),
    createMockOrder({ id: 'order-03', createdAt: '2026-11-12T08:00:00.000Z', isArchived: false, queueStage: 'order_placed' }),
    createMockOrder({ id: 'order-04', createdAt: '2026-11-12T07:00:00.000Z', isArchived: false, queueStage: 'order_placed' }),
    createMockOrder({ id: 'order-05', createdAt: '2026-11-12T06:00:00.000Z', isArchived: false, queueStage: 'order_placed' }),
  ];

  const mockDb = {
    collection: (_name: string) => {
      let cursorDocId: string | null = null;
      let limitCount = 100;

      const q = {
        where: () => q,
        orderBy: () => q,
        startAfter: (doc: any) => {
          cursorDocId = doc?.id || null;
          return q;
        },
        limit: (n: number) => {
          limitCount = n;
          return q;
        },
        count: () => ({
          get: async () => ({ data: () => ({ count: mockDataset.length }) }),
        }),
        get: async () => {
          let startIndex = 0;
          if (cursorDocId) {
            const idx = mockDataset.findIndex(d => d.id === cursorDocId);
            startIndex = idx + 1;
          }
          const sliced = mockDataset.slice(startIndex, startIndex + limitCount);
          return {
            docs: sliced.map(order => ({
              id: order.id,
              data: () => order,
            })),
          };
        },
      };
      return q;
    },
    doc: (path: string) => {
      const id = path.split('/').pop();
      const found = mockDataset.find(d => d.id === id);
      return {
        get: async () => ({
          exists: Boolean(found),
          id,
          data: () => found,
        }),
      };
    },
  };

  const mockDeps = {
    getOrderActor: async () => ({
      decoded: { uid: 'staff-1' },
      isStaff: true,
      isManager: true,
      isSuperAdmin: false,
    }),
    firestore: mockDb as any,
    isIndexedEnabled: true,
  };

  // Fetch Page 1: pageSize = 2
  const page1 = await listAdminOrdersPage('token-staff', { pageSize: 2 }, mockDeps);
  assert.equal(page1.orders.length, 2);
  assert.deepEqual(page1.orders.map(o => o.id), ['order-01', 'order-02']);
  assert.equal(page1.nextCursor, 'order-02');

  // Fetch Page 2: pageSize = 2, cursor = page1.nextCursor
  const page2 = await listAdminOrdersPage('token-staff', { pageSize: 2, cursor: page1.nextCursor }, mockDeps);
  assert.equal(page2.orders.length, 2);
  assert.deepEqual(page2.orders.map(o => o.id), ['order-03', 'order-04']);
  assert.equal(page2.nextCursor, 'order-04');

  // Verify: No duplicate IDs across pages
  const page1Ids = new Set(page1.orders.map(o => o.id));
  for (const o of page2.orders) {
    assert.ok(!page1Ids.has(o.id), `Duplicate ID found across page boundary: ${o.id}`);
  }

  // Fetch Page 3 (final item): cursor = page2.nextCursor
  const page3 = await listAdminOrdersPage('token-staff', { pageSize: 2, cursor: page2.nextCursor }, mockDeps);
  assert.equal(page3.orders.length, 1);
  assert.deepEqual(page3.orders.map(o => o.id), ['order-05']);
  assert.equal(page3.nextCursor, null);
});

test('listAdminOrdersPage pre-backfill safe mode handles legacy orders without dropping docs missing isArchived or queueStage', async () => {
  // Legacy orders without explicit isArchived or queueStage
  const mockDataset: any[] = [
    {
      id: 'legacy-01',
      totalPrice: 15000,
      status: 'pending',
      fulfillmentStage: 'order_placed',
      createdAt: '2026-11-12T10:00:00.000Z',
      // isArchived is undefined
      // queueStage is undefined
    },
    {
      id: 'legacy-02',
      totalPrice: 35000,
      status: 'building',
      createdAt: '2026-11-12T09:00:00.000Z',
      isArchived: false,
      // queueStage missing, status = 'building' -> assembling_testing
    },
    {
      id: 'legacy-03',
      totalPrice: 20000,
      status: 'cancelled',
      createdAt: '2026-11-12T08:00:00.000Z',
      // status = 'cancelled' -> cancelled
    },
    {
      id: 'legacy-04-archived',
      totalPrice: 40000,
      status: 'delivered',
      createdAt: '2026-11-12T07:00:00.000Z',
      isArchived: true, // Should be filtered out in active view
    },
  ];

  const mockDb = {
    collection: (_name: string) => {
      const q = {
        orderBy: () => q,
        limit: () => q,
        startAfter: () => q,
        get: async () => ({
          docs: mockDataset.map(order => ({
            id: order.id,
            data: () => order,
          })),
        }),
      };
      return q;
    },
  };

  const mockDeps = {
    getOrderActor: async () => ({
      decoded: { uid: 'staff-1' },
      isStaff: true,
      isManager: true,
      isSuperAdmin: false,
    }),
    firestore: mockDb as any,
    isIndexedEnabled: false, // Pre-backfill safe mode
  };

  // Active query should include legacy-01, legacy-02, legacy-03, but exclude legacy-04-archived
  const result = await listAdminOrdersPage('token-staff', { archived: false, stage: 'all' }, mockDeps);
  assert.equal(result.orders.length, 3);
  assert.deepEqual(result.orders.map(o => o.id), ['legacy-01', 'legacy-02', 'legacy-03']);

  // Verify stageCounts computed dynamically from legacy orders
  assert.equal(result.stageCounts.order_placed, 1);
  assert.equal(result.stageCounts.assembling_testing, 1);
  assert.equal(result.stageCounts.cancelled, 1);
});

test('listAdminOrdersPage applies paymentMethod and refundStatus in indexed mode', async () => {
  const mockDataset: Order[] = [
    createMockOrder({
      id: 'order-gcash-due',
      paymentMethod: 'gcash_simulated',
      refundStatus: 'due',
      isArchived: true,
      queueStage: 'order_placed',
    }),
    createMockOrder({
      id: 'order-cod-none',
      paymentMethod: 'cod',
      refundStatus: 'none',
      isArchived: true,
      queueStage: 'order_placed',
    }),
  ];

  const mockDb = {
    collection: (_name: string) => {
      const q = {
        where: () => q,
        orderBy: () => q,
        limit: () => q,
        count: () => ({
          get: async () => ({ data: () => ({ count: mockDataset.length }) }),
        }),
        get: async () => ({
          docs: mockDataset.map(order => ({
            id: order.id,
            data: () => order,
          })),
        }),
      };
      return q;
    },
  };

  const mockDeps = {
    getOrderActor: async () => ({
      decoded: { uid: 'staff-1' },
      isStaff: true,
      isManager: true,
      isSuperAdmin: false,
    }),
    firestore: mockDb as any,
    isIndexedEnabled: true,
  };

  const result = await listAdminOrdersPage(
    'token-staff',
    {
      archived: true,
      paymentMethod: 'gcash_simulated',
      refundStatus: 'due',
    },
    mockDeps
  );

  assert.equal(result.orders.length, 1);
  assert.equal(result.orders[0].id, 'order-gcash-due');
});
