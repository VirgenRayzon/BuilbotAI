import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { deriveInventoryQueryFields, normalizeInventorySelection } from './inventory-query-fields';

test('normalizes legacy archive and search fields without changing product values', () => {
  assert.deepEqual(deriveInventoryQueryFields({ name: ' RTX 4070 Ti ', brand: 'NVIDIA', sku: 'G-4070', stock: 0 }), {
    isArchived: false,
    inStock: false,
    publicCatalogEligible: false,
    inventoryQueryVersion: 1,
    nameSort: 'rtx 4070 ti',
    brandSort: 'nvidia',
    createdAtSort: 0,
  });
});

test('keeps archived products archived and bounds selected categories', () => {
  assert.equal(deriveInventoryQueryFields({ isArchived: true, stock: 5 }).isArchived, true);
  assert.equal(deriveInventoryQueryFields({ productId: 'PRD-888801', stock: 5 }).publicCatalogEligible, true);
  assert.equal(deriveInventoryQueryFields({ createdAt: new Date('2026-01-01T00:00:00Z') }).createdAtSort, 1767225600000);
  assert.deepEqual(normalizeInventorySelection(['GPU', 'GPU', 'CPU']), ['CPU', 'GPU']);
  assert.throws(() => normalizeInventorySelection(['invalid']), /Unsupported inventory category/);
});
