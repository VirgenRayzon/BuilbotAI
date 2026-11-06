import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { adminInventoryQuerySchema, usesLegacyInventorySearch } from './admin-inventory-query';

test('defaults to a bounded first page and rejects oversized requests', () => {
  const parsed = adminInventoryQuerySchema.parse({ categories: ['CPU', 'GPU'] });
  assert.equal(parsed.pageSize, 24);
  assert.equal(parsed.sortBy, 'Date Added');
  assert.throws(() => adminInventoryQuerySchema.parse({ categories: ['CPU'], pageSize: 101 }));
});

test('retains full substring search on the legacy path', () => {
  const parsed = adminInventoryQuerySchema.parse({ categories: ['GPU'], search: '4070 ti' });
  assert.equal(usesLegacyInventorySearch(parsed), true);
  assert.equal(usesLegacyInventorySearch(adminInventoryQuerySchema.parse({ categories: ['GPU'] })), false);
});
