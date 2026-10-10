import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    INVENTORY_CATEGORY_SLUGS,
    inventoryCategoryLabel,
    inventoryItemPath,
    inventoryItemsPath,
} from './inventory-paths';

test('all inventory categories use lowercase document IDs and retain display labels', () => {
    assert.equal(INVENTORY_CATEGORY_SLUGS.length, 12);
    for (const slug of INVENTORY_CATEGORY_SLUGS) {
        assert.equal(inventoryItemsPath(inventoryCategoryLabel(slug)), `inventory/${slug}/items`);
    }
    assert.equal(inventoryItemPath('CPU', 'part-1'), 'inventory/cpu/items/part-1');
    assert.equal(inventoryItemPath('gpu', 'part-2'), 'inventory/gpu/items/part-2');
});

test('unknown categories and invalid IDs cannot become Firestore paths', () => {
    assert.throws(() => inventoryItemsPath('orders'), /Unsupported inventory category/);
    assert.throws(() => inventoryItemPath('CPU', 'nested/item'), /Invalid inventory item ID/);
});
