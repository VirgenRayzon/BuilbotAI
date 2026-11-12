import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AuditLogQuerySchema,
  listStaffAuditLogsPage,
  listUserAuditLogsPage,
} from './audit-log-queries';
import type { AuditLog, UserAuditLog } from '@/lib/types';

function createMockAuditLog(overrides: Partial<AuditLog> = {}): AuditLog {
  return {
    id: overrides.id || `audit-${Math.random().toString(36).slice(2, 8)}`,
    actionName: overrides.actionName || 'updated',
    actorId: overrides.actorId || 'staff-1',
    actorName: overrides.actorName || 'Staff Member',
    actorEmail: overrides.actorEmail || 'staff@example.com',
    scope: overrides.scope || 'Part',
    resourceName: overrides.resourceName || 'AMD Ryzen 7 7800X3D',
    resourceId: overrides.resourceId || 'part-1',
    details: overrides.details || 'Updated stock',
    createdAt: overrides.createdAt || '2026-11-12T10:00:00.000Z',
  };
}

function createMockUserAuditLog(overrides: Partial<UserAuditLog> = {}): UserAuditLog {
  return {
    id: overrides.id || `user-audit-${Math.random().toString(36).slice(2, 8)}`,
    userId: overrides.userId || 'user-1',
    userEmail: overrides.userEmail || 'user@example.com',
    actionName: overrides.actionName || 'created',
    scope: overrides.scope || 'Order',
    resourceName: overrides.resourceName || 'Order #1001',
    resourceId: overrides.resourceId || 'order-1001',
    details: overrides.details || 'Placed reservation order',
    createdAt: overrides.createdAt || '2026-11-12T10:00:00.000Z',
  };
}

test('AuditLogQuerySchema enforces bounds and defaults', () => {
  // Valid defaults
  const parsedDefault = AuditLogQuerySchema.parse({});
  assert.equal(parsedDefault.pageSize, 25);
  assert.equal(parsedDefault.cursor, undefined);
  assert.equal(parsedDefault.sortBy, 'newest');

  // Valid max pageSize (50)
  const parsedMax = AuditLogQuerySchema.parse({ pageSize: 50 });
  assert.equal(parsedMax.pageSize, 50);

  // Bounds rejection: pageSize > 50
  assert.throws(
    () => AuditLogQuerySchema.parse({ pageSize: 51 }),
    /too_big|50/i
  );

  // Bounds rejection: pageSize < 1
  assert.throws(
    () => AuditLogQuerySchema.parse({ pageSize: 0 }),
    /too_small|1/i
  );

  // Bounds rejection: invalid pageSize type
  assert.throws(
    () => AuditLogQuerySchema.parse({ pageSize: 'twenty' }),
    /expected number/i
  );
});

test('listUserAuditLogsPage enforces userId == decoded.uid unconditionally and applies scope', async () => {
  const whereClauses: { field: string; op: string; val: unknown }[] = [];

  const mockDb = {
    collection: (name: string) => {
      assert.equal(name, 'user_auditLogs');
      const q = {
        where: (field: string, op: string, val: unknown) => {
          whereClauses.push({ field, op, val });
          return q;
        },
        orderBy: () => q,
        limit: () => q,
        count: () => ({
          get: async () => ({
            data: () => ({ count: 1 }),
          }),
        }),
        get: async () => ({
          docs: [
            {
              id: 'log-1',
              data: () =>
                createMockUserAuditLog({
                  id: 'log-1',
                  userId: 'auth-user-real-uid',
                  scope: 'Order',
                }),
            },
          ],
        }),
      };
      return q;
    },
    doc: () => ({
      get: async () => ({ exists: true }),
    }),
  };

  const mockDeps = {
    verifyUserToken: async () => ({
      uid: 'auth-user-real-uid',
      email: 'user@example.com',
    }),
    firestore: mockDb,
  };

  // Attempt to spoof another user's logs
  const result = await listUserAuditLogsPage(
    'valid-token',
    {
      userId: 'attacker-spoofed-victim-uid',
      scope: 'Order',
      pageSize: 25,
    } as any,
    mockDeps as any
  );

  assert.equal(result.logs.length, 1);
  assert.equal(result.totalCount, 1);

  // Verify userId was forced to auth-user-real-uid, NEVER attacker-spoofed-victim-uid
  const userWhere = whereClauses.find((w) => w.field === 'userId');
  assert.ok(userWhere, 'Must filter on userId');
  assert.equal(userWhere?.val, 'auth-user-real-uid');
  assert.notEqual(userWhere?.val, 'attacker-spoofed-victim-uid');

  // Verify scope filter was applied
  const scopeWhere = whereClauses.find((w) => w.field === 'scope');
  assert.ok(scopeWhere, 'Must filter on scope when provided');
  assert.equal(scopeWhere?.val, 'Order');
});

test('listUserAuditLogsPage rejects invalid or missing user token', async () => {
  const mockDeps = {
    verifyUserToken: async () => {
      throw new Error('Invalid token');
    },
    firestore: {} as any,
  };

  await assert.rejects(
    async () => {
      await listUserAuditLogsPage('bad-token', {}, mockDeps as any);
    },
    /invalid token|unauthorized/i
  );
});

test('listUserAuditLogsPage applies fromDate, toDate, scope, and matches tie-breaker direction for sortBy', async () => {
  const whereClauses: { field: string; op: string; val: unknown }[] = [];
  const orderClauses: { field: string; dir: string }[] = [];

  const mockDb = {
    collection: (name: string) => {
      assert.equal(name, 'user_auditLogs');
      const q = {
        where: (field: string, op: string, val: unknown) => {
          whereClauses.push({ field, op, val });
          return q;
        },
        orderBy: (field: any, dir: string) => {
          const fieldName = typeof field === 'object' && field._toFieldPath ? field._toFieldPath() : String(field);
          orderClauses.push({ field: fieldName, dir });
          return q;
        },
        limit: () => q,
        count: () => ({
          get: async () => ({
            data: () => ({ count: 5 }),
          }),
        }),
        get: async () => ({
          docs: [
            {
              id: 'user-log-01',
              data: () =>
                createMockUserAuditLog({
                  id: 'user-log-01',
                  userId: 'user-abc',
                  scope: 'Favorite',
                  createdAt: '2026-11-05T00:00:00.000Z',
                }),
            },
          ],
        }),
      };
      return q;
    },
    doc: () => ({
      get: async () => ({ exists: true }),
    }),
  };

  const mockDeps = {
    verifyUserToken: async () => ({
      uid: 'user-abc',
      email: 'user-abc@example.com',
    }),
    firestore: mockDb,
  };

  // Test oldest sort: createdAt asc + __name__ asc
  const resultOldest = await listUserAuditLogsPage(
    'token-user',
    {
      scope: 'Favorite',
      fromDate: '2026-11-01T00:00:00.000Z',
      toDate: '2026-11-10T23:59:59.999Z',
      sortBy: 'oldest',
      pageSize: 25,
    },
    mockDeps as any
  );

  assert.equal(resultOldest.logs.length, 1);
  assert.equal(resultOldest.totalCount, 5);

  const userWhere = whereClauses.find((w) => w.field === 'userId');
  assert.equal(userWhere?.val, 'user-abc');

  const scopeWhere = whereClauses.find((w) => w.field === 'scope');
  assert.equal(scopeWhere?.val, 'Favorite');

  const fromWhere = whereClauses.find((w) => w.field === 'createdAt' && w.op === '>=');
  assert.ok(fromWhere?.val instanceof Date);

  const toWhere = whereClauses.find((w) => w.field === 'createdAt' && w.op === '<=');
  assert.ok(toWhere?.val instanceof Date);

  // Assert order clauses match tie-breaker direction
  assert.equal(orderClauses.length, 2);
  assert.equal(orderClauses[0].field, 'createdAt');
  assert.equal(orderClauses[0].dir, 'asc');
  assert.equal(orderClauses[1].dir, 'asc'); // Tie-breaker __name__ matches createdAt asc

  // Now test newest sort: createdAt desc + __name__ desc
  orderClauses.length = 0;
  await listUserAuditLogsPage(
    'token-user',
    {
      scope: 'Favorite',
      sortBy: 'newest',
    },
    mockDeps as any
  );

  assert.equal(orderClauses.length, 2);
  assert.equal(orderClauses[0].field, 'createdAt');
  assert.equal(orderClauses[0].dir, 'desc');
  assert.equal(orderClauses[1].dir, 'desc'); // Tie-breaker __name__ matches createdAt desc
});

test('listStaffAuditLogsPage rejects non-staff tokens', async () => {
  const mockDeps = {
    verifyStaffToken: async () => ({
      decoded: { uid: 'regular-user' },
      isStaff: false,
      isManager: false,
      isSuperAdmin: false,
    }),
    firestore: {} as any,
  };

  await assert.rejects(
    async () => {
      await listStaffAuditLogsPage('token-user', {}, mockDeps as any);
    },
    /unauthorized|staff access required/i
  );
});

test('listStaffAuditLogsPage applies scope, fromDate, toDate filters and returns count', async () => {
  const whereClauses: { field: string; op: string; val: unknown }[] = [];
  let countCalled = false;

  const mockDb = {
    collection: (name: string) => {
      assert.equal(name, 'auditLogs');
      const q = {
        where: (field: string, op: string, val: unknown) => {
          whereClauses.push({ field, op, val });
          return q;
        },
        orderBy: () => q,
        limit: () => q,
        count: () => ({
          get: async () => {
            countCalled = true;
            return {
              data: () => ({ count: 15 }),
            };
          },
        }),
        get: async () => ({
          docs: [
            {
              id: 'audit-01',
              data: () =>
                createMockAuditLog({
                  id: 'audit-01',
                  scope: 'Part',
                  createdAt: '2026-11-05T12:00:00.000Z',
                }),
            },
          ],
        }),
      };
      return q;
    },
    doc: () => ({
      get: async () => ({ exists: true }),
    }),
  };

  const mockDeps = {
    verifyStaffToken: async () => ({
      decoded: { uid: 'staff-1', email: 'staff@example.com' },
      isStaff: true,
      isManager: true,
      isSuperAdmin: false,
    }),
    firestore: mockDb,
  };

  const result = await listStaffAuditLogsPage(
    'token-staff',
    {
      scope: 'Part',
      fromDate: '2026-11-01T00:00:00.000Z',
      toDate: '2026-11-10T23:59:59.999Z',
      pageSize: 25,
    },
    mockDeps as any
  );

  assert.equal(result.logs.length, 1);
  assert.equal(result.totalCount, 15);
  assert.ok(countCalled, 'Must call .count() to obtain accurate totalCount');

  const scopeClause = whereClauses.find((w) => w.field === 'scope');
  assert.ok(scopeClause, 'Must filter on scope');
  assert.equal(scopeClause?.val, 'Part');

  const fromClause = whereClauses.find((w) => w.field === 'createdAt' && w.op === '>=');
  assert.ok(fromClause, 'Must filter on fromDate with >=');
  assert.ok(fromClause?.val instanceof Date);

  const toClause = whereClauses.find((w) => w.field === 'createdAt' && w.op === '<=');
  assert.ok(toClause, 'Must filter on toDate with <=');
  assert.ok(toClause?.val instanceof Date);
});

test('listStaffAuditLogsPage produces stable non-overlapping nextCursor across pages', async () => {
  const dataset: AuditLog[] = [
    createMockAuditLog({ id: 'audit-1', createdAt: '2026-11-12T12:00:00.000Z' }),
    createMockAuditLog({ id: 'audit-2', createdAt: '2026-11-12T11:00:00.000Z' }),
    createMockAuditLog({ id: 'audit-3', createdAt: '2026-11-12T10:00:00.000Z' }),
    createMockAuditLog({ id: 'audit-4', createdAt: '2026-11-12T09:00:00.000Z' }),
    createMockAuditLog({ id: 'audit-5', createdAt: '2026-11-12T08:00:00.000Z' }),
  ];

  const createMockDb = () => {
    let startAfterDocId: string | null = null;
    let limitVal = 10;

    return {
      collection: () => {
        const q = {
          where: () => q,
          orderBy: () => q,
          startAfter: (docSnap: any) => {
            startAfterDocId = docSnap.id;
            return q;
          },
          limit: (n: number) => {
            limitVal = n;
            return q;
          },
          count: () => ({
            get: async () => ({ data: () => ({ count: dataset.length }) }),
          }),
          get: async () => {
            let startIndex = 0;
            if (startAfterDocId) {
              const idx = dataset.findIndex((d) => d.id === startAfterDocId);
              startIndex = idx >= 0 ? idx + 1 : 0;
            }
            const sliced = dataset.slice(startIndex, startIndex + limitVal);
            return {
              docs: sliced.map((item) => ({
                id: item.id,
                data: () => item,
              })),
            };
          },
        };
        return q;
      },
      doc: (path: string) => ({
        id: path.split('/').pop(),
        get: async () => ({
          exists: true,
          id: path.split('/').pop(),
        }),
      }),
    };
  };

  const mockDeps = {
    verifyStaffToken: async () => ({
      decoded: { uid: 'staff-1' },
      isStaff: true,
      isManager: true,
      isSuperAdmin: false,
    }),
    firestore: createMockDb(),
  };

  // Fetch Page 1 (pageSize = 2)
  const page1 = await listStaffAuditLogsPage(
    'token-staff',
    { pageSize: 2 },
    mockDeps as any
  );

  assert.equal(page1.logs.length, 2);
  assert.equal(page1.logs[0].id, 'audit-1');
  assert.equal(page1.logs[1].id, 'audit-2');
  assert.equal(page1.hasMore, true);
  assert.equal(page1.nextCursor, 'audit-2');

  // Fetch Page 2 with nextCursor from Page 1
  const page2 = await listStaffAuditLogsPage(
    'token-staff',
    { pageSize: 2, cursor: page1.nextCursor },
    mockDeps as any
  );

  assert.equal(page2.logs.length, 2);
  assert.equal(page2.logs[0].id, 'audit-3');
  assert.equal(page2.logs[1].id, 'audit-4');
  assert.equal(page2.hasMore, true);
  assert.equal(page2.nextCursor, 'audit-4');

  // Fetch Page 3 (final page)
  const page3 = await listStaffAuditLogsPage(
    'token-staff',
    { pageSize: 2, cursor: page2.nextCursor },
    mockDeps as any
  );

  assert.equal(page3.logs.length, 1);
  assert.equal(page3.logs[0].id, 'audit-5');
  assert.equal(page3.hasMore, false);
  assert.equal(page3.nextCursor, null);

  // Check that no documents were duplicated across pages
  const allIds = [
    ...page1.logs.map((l) => l.id),
    ...page2.logs.map((l) => l.id),
    ...page3.logs.map((l) => l.id),
  ];
  assert.equal(new Set(allIds).size, 5);
  assert.deepEqual(allIds, ['audit-1', 'audit-2', 'audit-3', 'audit-4', 'audit-5']);
});
