import test from 'node:test';
import assert from 'node:assert/strict';

interface MockDocument {
  id: string;
  path: string;
  name: string;
  brand: string;
  brandSort: string;
  category: string;
  price: number;
  searchKeywords: string[];
}

function simulateScanPage(
  allDocs: MockDocument[],
  options: {
    cursor?: string | null;
    pageSize: number;
    searchTokens: string[];
    allowedBrands?: string[];
    allowedCategories?: string[];
  }
): { items: MockDocument[]; nextCursor: string | null } {
  // Sort by documentId ASC (natural scan order)
  const sorted = [...allDocs].sort((a, b) => a.id.localeCompare(b.id));

  let startIndex = 0;
  if (options.cursor) {
    const cursorIdx = sorted.findIndex(d => d.path === options.cursor);
    assert.ok(cursorIdx !== -1, `Cursor doc ${options.cursor} not found`);
    startIndex = cursorIdx + 1;
  }

  const matching: MockDocument[] = [];
  let boundaryPath: string | null = null;
  let hasMore = false;

  for (let i = startIndex; i < sorted.length; i++) {
    const doc = sorted[i];

    // Filter by longest search token (simulating Firestore array-contains)
    if (options.searchTokens.length > 0) {
      const longest = options.searchTokens.reduce((a, b) => (b.length > a.length ? b : a), '');
      if (!doc.searchKeywords.includes(longest)) {
        continue;
      }
    }

    // Refine by all search tokens (in-memory refinement)
    if (options.searchTokens.length > 1) {
      const allMatch = options.searchTokens.every(token => doc.searchKeywords.includes(token));
      if (!allMatch) continue;
    }

    // Refine by brands if provided
    if (options.allowedBrands && options.allowedBrands.length > 0) {
      if (!options.allowedBrands.includes(doc.brandSort)) {
        continue;
      }
    }

    // Refine by categories if provided
    if (options.allowedCategories && options.allowedCategories.length > 0) {
      if (!options.allowedCategories.includes(doc.category)) {
        continue;
      }
    }

    if (matching.length < options.pageSize) {
      matching.push(doc);
      boundaryPath = doc.path;
    } else {
      hasMore = true;
      break;
    }
  }

  return {
    items: matching,
    nextCursor: hasMore && boundaryPath ? boundaryPath : null,
  };
}

test('paginated search query traversal across multiple pages produces non-overlapping, complete results with intermediate refinement', () => {
  // 12 mock GPU/CPU items in documentId order
  const mockDataset: MockDocument[] = [
    {
      id: 'doc-01',
      path: 'inventory/gpu/items/doc-01',
      name: 'ASUS Dual RTX 4070 OC',
      brand: 'ASUS',
      brandSort: 'asus',
      category: 'GPU',
      price: 36000,
      searchKeywords: ['rtx', '4070', 'asus', 'dual'],
    },
    {
      id: 'doc-02',
      path: 'inventory/gpu/items/doc-02',
      name: 'Sapphire Radeon RX 7800 XT',
      brand: 'Sapphire',
      brandSort: 'sapphire',
      category: 'GPU',
      price: 32000,
      searchKeywords: ['rx', '7800', 'sapphire'],
    },
    {
      id: 'doc-03',
      path: 'inventory/gpu/items/doc-03',
      name: 'Gigabyte RTX 4070 Windforce',
      brand: 'Gigabyte',
      brandSort: 'gigabyte',
      category: 'GPU',
      price: 35000,
      searchKeywords: ['rtx', '4070', 'gigabyte'], // Has 4070, but gigabyte (filtered out if brand=asus|msi)
    },
    {
      id: 'doc-04',
      path: 'inventory/gpu/items/doc-04',
      name: 'MSI Ventus RTX 4070 Super',
      brand: 'MSI',
      brandSort: 'msi',
      category: 'GPU',
      price: 38000,
      searchKeywords: ['rtx', '4070', 'super', 'msi'],
    },
    {
      id: 'doc-05',
      path: 'inventory/gpu/items/doc-05',
      name: 'ASUS TUF RTX 4070 Ti',
      brand: 'ASUS',
      brandSort: 'asus',
      category: 'GPU',
      price: 49000,
      searchKeywords: ['rtx', '4070', 'ti', 'asus'],
    },
    {
      id: 'doc-06',
      path: 'inventory/cpu/items/doc-06',
      name: 'Intel Core i7-14700K',
      brand: 'Intel',
      brandSort: 'intel',
      category: 'CPU',
      price: 24000,
      searchKeywords: ['intel', 'core', '14700k'],
    },
    {
      id: 'doc-07',
      path: 'inventory/gpu/items/doc-07',
      name: 'MSI Gaming X RTX 4070 Slim',
      brand: 'MSI',
      brandSort: 'msi',
      category: 'GPU',
      price: 41000,
      searchKeywords: ['rtx', '4070', 'msi', 'slim'],
    },
    {
      id: 'doc-08',
      path: 'inventory/gpu/items/doc-08',
      name: 'ASUS ROG Strix RTX 4070',
      brand: 'ASUS',
      brandSort: 'asus',
      category: 'GPU',
      price: 45000,
      searchKeywords: ['rtx', '4070', 'asus', 'strix'],
    },
  ];

  // We want to search for 'rtx 4070' restricted to brands ASUS and MSI with pageSize = 2
  const searchTokens = ['rtx', '4070'];
  const allowedBrands = ['asus', 'msi'];
  const allowedCategories = ['GPU'];

  // Page 1
  const page1 = simulateScanPage(mockDataset, {
    pageSize: 2,
    searchTokens,
    allowedBrands,
    allowedCategories,
  });

  assert.equal(page1.items.length, 2);
  assert.equal(page1.items[0].id, 'doc-01');
  assert.equal(page1.items[1].id, 'doc-04');
  assert.equal(page1.nextCursor, 'inventory/gpu/items/doc-04');

  // Page 2
  const page2 = simulateScanPage(mockDataset, {
    cursor: page1.nextCursor,
    pageSize: 2,
    searchTokens,
    allowedBrands,
    allowedCategories,
  });

  assert.equal(page2.items.length, 2);
  assert.equal(page2.items[0].id, 'doc-05');
  assert.equal(page2.items[1].id, 'doc-07');
  assert.equal(page2.nextCursor, 'inventory/gpu/items/doc-07');

  // Page 3
  const page3 = simulateScanPage(mockDataset, {
    cursor: page2.nextCursor,
    pageSize: 2,
    searchTokens,
    allowedBrands,
    allowedCategories,
  });

  assert.equal(page3.items.length, 1);
  assert.equal(page3.items[0].id, 'doc-08');
  assert.equal(page3.nextCursor, null, 'End of results reached');

  // Verify across all pages: zero duplicates and exact non-overlapping items
  const allCollectedIds = [...page1.items, ...page2.items, ...page3.items].map(i => i.id);
  assert.deepEqual(allCollectedIds, ['doc-01', 'doc-04', 'doc-05', 'doc-07', 'doc-08']);
  const uniqueIds = new Set(allCollectedIds);
  assert.equal(uniqueIds.size, 5);
});
