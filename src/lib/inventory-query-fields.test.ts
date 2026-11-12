import test from 'node:test';
import assert from 'node:assert/strict';
import {
  deriveInventoryQueryFields,
  normalizeInventorySelection,
} from './inventory-query-fields';

test('deriveInventoryQueryFields retains inventoryQueryVersion: 1 and adds searchKeywordsVersion: 2 and searchKeywords', () => {
  const source = {
    name: 'NVIDIA RTX 4070 Super',
    brand: 'ASUS',
    sku: 'ASUS-4070S',
    productId: 'PRD-100042',
    stock: 10,
    isArchived: false,
    createdAt: 1731300000000,
  };

  const fields = deriveInventoryQueryFields(source);

  assert.equal(fields.inventoryQueryVersion, 1, 'inventoryQueryVersion must remain 1 for backward compatibility');
  assert.equal(fields.searchKeywordsVersion, 2, 'searchKeywordsVersion must be 2');
  assert.ok(Array.isArray(fields.searchKeywords), 'searchKeywords must be an array');
  assert.ok(fields.searchKeywords.includes('rtx'));
  assert.ok(fields.searchKeywords.includes('4070'));
  assert.ok(fields.searchKeywords.includes('asus'));
  assert.ok(fields.searchKeywords.includes('prd-100042'));
  assert.ok(fields.searchKeywords.includes('prd100042'));
  assert.equal(fields.isArchived, false);
  assert.equal(fields.inStock, true);
  assert.equal(fields.publicCatalogEligible, true);
  assert.equal(fields.nameSort, 'nvidia rtx 4070 super');
  assert.equal(fields.brandSort, 'asus');
  assert.equal(fields.createdAtSort, 1731300000000);
});

test('deriveInventoryQueryFields handles zero stock and archived state', () => {
  const fields = deriveInventoryQueryFields({
    name: 'Core i9-14900K',
    brand: 'Intel',
    stock: 0,
    isArchived: true,
  });

  assert.equal(fields.inStock, false);
  assert.equal(fields.isArchived, true);
  assert.equal(fields.publicCatalogEligible, false);
  assert.equal(fields.inventoryQueryVersion, 1);
  assert.equal(fields.searchKeywordsVersion, 2);
  assert.ok(Array.isArray(fields.searchKeywords));
});

test('normalizeInventorySelection sorts and validates categories', () => {
  const result = normalizeInventorySelection(['GPU', 'CPU', 'RAM']);
  assert.deepEqual(result, ['CPU', 'GPU', 'RAM']);

  assert.throws(() => {
    normalizeInventorySelection(['NonExistentCategory']);
  });
});
