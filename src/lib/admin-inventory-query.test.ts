import test from 'node:test';
import assert from 'node:assert/strict';
import { adminInventoryQuerySchema, usesLegacyInventorySearch } from './admin-inventory-query';

test('adminInventoryQuerySchema parses valid query and sets defaults', () => {
  const parsed = adminInventoryQuerySchema.parse({
    categories: ['CPU', 'GPU'],
    brands: ['ASUS', 'MSI'],
    availability: 'in-stock',
    search: 'rtx 4070 super',
    sortBy: 'Price',
    sortDirection: 'asc',
    pageSize: 20,
  });

  assert.deepEqual(parsed.categories, ['CPU', 'GPU']);
  assert.deepEqual(parsed.brands, ['ASUS', 'MSI']);
  assert.equal(parsed.availability, 'in-stock');
  assert.equal(parsed.search, 'rtx 4070 super');
  assert.equal(parsed.sortBy, 'Price');
  assert.equal(parsed.sortDirection, 'asc');
  assert.equal(parsed.pageSize, 20);
  assert.equal(parsed.cursor, undefined);
});

test('usesLegacyInventorySearch returns false for multi-word search and brand/availability filters', () => {
  const queryWithSearch = adminInventoryQuerySchema.parse({
    categories: ['GPU'],
    search: 'rtx 4070 super',
    brands: ['ASUS'],
    availability: 'in-stock',
  });

  assert.equal(
    usesLegacyInventorySearch(queryWithSearch),
    false,
    'Multi-word search and filters should use bounded Firestore queries, not legacy search'
  );
});

test('usesLegacyInventorySearch returns false for empty search and default query', () => {
  const emptyQuery = adminInventoryQuerySchema.parse({
    categories: ['CPU'],
  });

  assert.equal(usesLegacyInventorySearch(emptyQuery), false);
});
