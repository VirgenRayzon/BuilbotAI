import test from 'node:test';
import assert from 'node:assert/strict';
import { storedOrderOperation, clearStoredOrderOperation, operationStorageKey } from './order-operation-cache';

test('pending refund/payment keys survive a reload and revision update, and isolate staff accounts', () => {
  const values = new Map<string, string>();
  const storage = { getItem: (key: string) => values.get(key) || null,
    setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
  const key = operationStorageKey('manager', 'order', { refund: 100 });
  const original = { operationId: '12345678-1234-4123-8123-123456789abc', expectedRevision: 1 };
  const replacement = { operationId: '22345678-1234-4123-8123-123456789abc', expectedRevision: 2 };
  assert.deepEqual(storedOrderOperation(storage, key, original), original);
  assert.deepEqual(storedOrderOperation(storage, key, replacement), original);
  assert.notEqual(key, operationStorageKey('superadmin', 'order', { refund: 100 }));
  clearStoredOrderOperation(storage, key);
  assert.deepEqual(storedOrderOperation(storage, key, replacement), replacement);
});
test('restricted storage cannot prevent server-guarded requests', () => {
  const fallback = { operationId: '12345678-1234-4123-8123-123456789abc', expectedRevision: 1 };
  assert.equal(storedOrderOperation({ getItem: () => { throw new Error('Denied'); }, setItem: () => {}, removeItem: () => {} }, 'key', fallback), fallback);
});
