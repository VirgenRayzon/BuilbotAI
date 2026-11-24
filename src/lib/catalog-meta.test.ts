import test from 'node:test';
import assert from 'node:assert/strict';
import type { Firestore, Transaction } from 'firebase-admin/firestore';
import { CatalogMetaSchema, deriveSearchTokens, parseSearchQueryTokens, findLongestSearchToken } from './catalog-meta';
import { getCatalogMeta, bumpCatalogMetaVersion } from './server/catalog-meta-store';

test('deriveSearchTokens produces expected tokens and prefixes bounded under 40', () => {
  const tokens = deriveSearchTokens({
    name: 'NVIDIA RTX 4070 Super',
    brand: 'ASUS',
    sku: 'ASUS-4070S',
    productId: 'PRD-100042',
  });

  assert.ok(tokens.length <= 40, `Token count ${tokens.length} exceeds 40`);
  assert.ok(tokens.length > 0, 'Tokens should not be empty');

  const expectedTokens = [
    'rtx',
    '4070',
    '4070s',
    'super',
    'asus',
    'prd100042',
    'prd-100042',
  ];

  for (const expected of expectedTokens) {
    assert.ok(
      tokens.includes(expected),
      `Expected token "${expected}" was not found in: ${JSON.stringify(tokens)}`
    );
  }
});

test('deriveSearchTokens handles empty, null, and non-string inputs safely', () => {
  assert.deepEqual(deriveSearchTokens({}), []);
  assert.deepEqual(deriveSearchTokens({ name: null, brand: undefined, sku: 12345 }), []);
  assert.deepEqual(deriveSearchTokens({ name: '   ', brand: '' }), []);
});

test('deriveSearchTokens bounds token count to 40 even with verbose strings', () => {
  const longName = 'Gigabyte AORUS GeForce RTX 4090 Master 24G Extreme Gaming Graphics Card High Performance Triple Fan';
  const tokens = deriveSearchTokens({
    name: longName,
    brand: 'Gigabyte AORUS Technology',
    sku: 'GV-N4090AORUS-M-24GD-EXTREME-V2',
    productId: 'PRD-999999',
  });

  assert.ok(tokens.length <= 40, `Expected tokens <= 40, got ${tokens.length}`);
});

test('CatalogMetaSchema validates valid version and facet maps', () => {
  const valid = {
    catalogVersion: 1,
    updatedAt: 1731300000000,
    brandsByCategory: {
      CPU: ['Intel', 'AMD'],
      GPU: ['NVIDIA', 'AMD', 'ASUS'],
    },
    activeCountsByCategory: {
      CPU: 42,
      GPU: 28,
    },
  };

  const parsed = CatalogMetaSchema.parse(valid);
  assert.equal(parsed.catalogVersion, 1);
  assert.equal(parsed.updatedAt, 1731300000000);
  assert.deepEqual(parsed.brandsByCategory.CPU, ['Intel', 'AMD']);
  assert.equal(parsed.activeCountsByCategory.CPU, 42);
});

test('CatalogMetaSchema rejects negative versions', () => {
  assert.throws(() => {
    CatalogMetaSchema.parse({
      catalogVersion: -1,
      updatedAt: 1731300000000,
      brandsByCategory: {},
      activeCountsByCategory: {},
    });
  });
});

test('CatalogMetaSchema rejects non-integer versions or invalid facet values', () => {
  assert.throws(() => {
    CatalogMetaSchema.parse({
      catalogVersion: 1.5,
      updatedAt: 1731300000000,
      brandsByCategory: {},
      activeCountsByCategory: {},
    });
  });

  assert.throws(() => {
    CatalogMetaSchema.parse({
      catalogVersion: 1,
      updatedAt: 1731300000000,
      brandsByCategory: { GPU: 'invalid-string' },
      activeCountsByCategory: {},
    });
  });

  assert.throws(() => {
    CatalogMetaSchema.parse({
      catalogVersion: 1,
      updatedAt: 1731300000000,
      brandsByCategory: {},
      activeCountsByCategory: { GPU: -5 },
    });
  });
});

test('getCatalogMeta returns default structure when document does not exist', async () => {
  const fakeDoc = {
    get: async () => ({ exists: false, data: () => undefined }),
  };
  const fakeDb = {
    collection: (_col: string) => ({
      doc: (_id: string) => fakeDoc,
    }),
  } as unknown as Firestore;

  const meta = await getCatalogMeta(fakeDb);
  assert.equal(meta.catalogVersion, 0);
  assert.equal(meta.updatedAt, 0);
  assert.deepEqual(meta.brandsByCategory, {});
  assert.deepEqual(meta.activeCountsByCategory, {});
});

test('getCatalogMeta correctly validates existing Firestore document', async () => {
  const fakeDoc = {
    get: async () => ({
      exists: true,
      data: () => ({
        catalogVersion: 5,
        updatedAt: 1731300000000,
        brandsByCategory: {
          CPU: ['AMD', 'Intel'],
        },
        activeCountsByCategory: {
          CPU: 18,
        },
      }),
    }),
  };
  const fakeDb = {
    collection: (_col: string) => ({
      doc: (_id: string) => fakeDoc,
    }),
  } as unknown as Firestore;

  const meta = await getCatalogMeta(fakeDb);
  assert.equal(meta.catalogVersion, 5);
  assert.equal(meta.updatedAt, 1731300000000);
  assert.deepEqual(meta.brandsByCategory.CPU, ['AMD', 'Intel']);
  assert.equal(meta.activeCountsByCategory.CPU, 18);
});

test('bumpCatalogMetaVersion atomically initializes or increments version', async () => {
  const state: { docData: Record<string, unknown> | null } = { docData: null };
  const docRef = { path: 'siteSettings/catalogMeta' };

  const fakeDb = {
    collection: (_col: string) => ({
      doc: (_id: string) => docRef,
    }),
    runTransaction: async <T>(updateFn: (tx: Transaction) => Promise<T>): Promise<T> => {
      const tx = {
        get: async (_ref: unknown) => ({
          exists: state.docData !== null,
          get: (field: string) => (state.docData ? state.docData[field] : undefined),
          data: () => (state.docData ? { ...state.docData } : undefined),
        }),
        set: (_ref: unknown, data: Record<string, unknown>, _options?: unknown) => {
          state.docData = { ...(state.docData || {}), ...data };
        },
      } as unknown as Transaction;
      return updateFn(tx);
    },
  } as unknown as Firestore;

  const firstVersion = await bumpCatalogMetaVersion(fakeDb);
  assert.equal(firstVersion, 1);
  assert.equal(state.docData?.catalogVersion, 1);

  const secondVersion = await bumpCatalogMetaVersion(fakeDb);
  assert.equal(secondVersion, 2);
});

test('bumpCatalogMetaVersion with refreshFacets collects categories and brands', async () => {
  const state: { savedMeta: Record<string, unknown> | null } = { savedMeta: null };
  const docRef = { path: 'siteSettings/catalogMeta' };

  const fakeDb = {
    collection: (col: string) => {
      if (col === 'siteSettings') {
        return { doc: (_id: string) => docRef };
      }
      return {
        where: () => ({
          select: () => ({
            get: async () => ({
              docs: col.includes('cpu')
                ? [{ get: (f: string) => (f === 'brand' ? 'AMD' : 'CPU') }]
                : [],
            }),
          }),
        }),
      };
    },
    runTransaction: async <T>(updateFn: (tx: Transaction) => Promise<T>): Promise<T> => {
      const tx = {
        get: async () => ({
          exists: true,
          get: (field: string) => (state.savedMeta ? state.savedMeta[field] : 3),
          data: () => state.savedMeta || { catalogVersion: 3 },
        }),
        set: (_ref: unknown, data: Record<string, unknown>) => {
          state.savedMeta = { ...(state.savedMeta || {}), ...data };
        },
      } as unknown as Transaction;
      return updateFn(tx);
    },
  } as unknown as Firestore;

  const version = await bumpCatalogMetaVersion(fakeDb, { refreshFacets: true });
  assert.equal(version, 4);
  assert.ok(state.savedMeta);
  const brands = state.savedMeta.brandsByCategory as Record<string, string[]>;
  assert.ok(brands.CPU.includes('AMD'));
});

test('parseSearchQueryTokens normalizes and splits words', () => {
  assert.deepEqual(parseSearchQueryTokens('  NVIDIA RTX 4070  Super! '), ['nvidia', 'rtx', '4070', 'super']);
  assert.deepEqual(parseSearchQueryTokens(''), []);
  assert.deepEqual(parseSearchQueryTokens(null), []);
  assert.deepEqual(parseSearchQueryTokens(undefined), []);
});

test('findLongestSearchToken returns the longest token', () => {
  assert.equal(findLongestSearchToken(['rtx', '4070', 'super']), 'super');
  assert.equal(findLongestSearchToken(['a', 'bbb', 'cc']), 'bbb');
  assert.equal(findLongestSearchToken([]), '');
});
