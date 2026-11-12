import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createBuilderCatalogReader,
  type BuilderCatalogReader,
} from '../src/lib/server/builder-catalog-reader';
import {
  createPublicPartsCatalogReader,
  toPublicCatalogPart,
  type PublicPartsCatalogReader,
} from '../src/lib/server/public-products';
import {
  VersionedInventoryStore,
} from '../src/lib/inventory-fetcher';
import type { Part } from '../src/lib/types';
import type { PublicCatalogPart } from '../src/lib/public-product-types';

interface SharedDatabaseState {
  catalogVersion: number;
  parts: Part[];
  versionReads: number;
  builderCatalogLoads: number;
  publicCatalogLoads: number;
}

function createSharedStore(initialParts: Part[]) {
  const state: SharedDatabaseState = {
    catalogVersion: 1,
    parts: JSON.parse(JSON.stringify(initialParts)) as Part[],
    versionReads: 0,
    builderCatalogLoads: 0,
    publicCatalogLoads: 0,
  };

  return {
    getCatalogVersion: async (): Promise<number> => {
      state.versionReads++;
      return state.catalogVersion;
    },
    bumpCatalogVersion: async (): Promise<number> => {
      state.catalogVersion++;
      return state.catalogVersion;
    },
    updatePart: (partId: string, updates: Partial<Part>): void => {
      const index = state.parts.findIndex(p => p.id === partId);
      if (index !== -1) {
        state.parts[index] = { ...state.parts[index], ...updates };
      }
    },
    fetchBuilderParts: async (): Promise<Part[]> => {
      state.builderCatalogLoads++;
      return JSON.parse(JSON.stringify(state.parts)) as Part[];
    },
    fetchPublicParts: async (): Promise<PublicCatalogPart[]> => {
      state.publicCatalogLoads++;
      return state.parts
        .filter(p => !p.isArchived && p.productId)
        .map(p => toPublicCatalogPart(p));
    },
    getState: (): SharedDatabaseState => state,
  };
}

interface ServerInstanceContext {
  id: string;
  builderReader: BuilderCatalogReader;
  publicReader: PublicPartsCatalogReader;
  inventoryStore: VersionedInventoryStore;
  getBuilderCatalog: () => Promise<Part[]>;
  clearBuilderCatalogCache: () => void;
  listPublicPartsCatalog: () => Promise<PublicCatalogPart[]>;
  invalidatePublicPartsCatalog: () => void;
}

function createServerContext(
  id: string,
  store: ReturnType<typeof createSharedStore>,
  options?: { maxCheckStalenessMs?: number }
): ServerInstanceContext {
  // Use real production factories directly
  const builderReader = createBuilderCatalogReader({
    loader: store.fetchBuilderParts,
    readVersion: store.getCatalogVersion,
    maxCheckStalenessMs: options?.maxCheckStalenessMs,
  });

  const publicReader = createPublicPartsCatalogReader({
    loader: store.fetchPublicParts,
    readVersion: store.getCatalogVersion,
    maxCheckStalenessMs: options?.maxCheckStalenessMs,
  });

  const inventoryStore = new VersionedInventoryStore({
    versionReader: store.getCatalogVersion,
    versionCheckWindowMs: options?.maxCheckStalenessMs ?? 0,
  });

  return {
    id,
    builderReader,
    publicReader,
    inventoryStore,
    getBuilderCatalog: () => builderReader.getBuilderCatalog(),
    clearBuilderCatalogCache: () => builderReader.clearBuilderCatalogCache(),
    listPublicPartsCatalog: () => publicReader.listPublicPartsCatalog(),
    invalidatePublicPartsCatalog: () => publicReader.invalidatePublicPartsCatalog(),
  };
}

const sampleGpu: Part = {
  id: 'gpu-rtx4070-01',
  productId: 'PRD-GPU-4070',
  sku: 'ASUS-4070-O12G',
  name: 'ASUS Dual GeForce RTX 4070 OC Edition 12GB',
  category: 'GPU',
  brand: 'ASUS',
  price: 36000,
  stock: 5,
  imageUrl: 'https://example.com/gpu.png',
  specifications: {
    'Socket': 'PCIe 4.0',
    'Memory': '12GB GDDR6X',
  },
  isArchived: false,
};

test('multi-instance cache contexts warm independently and hit local cache without redundant DB reads', async () => {
  const store = createSharedStore([sampleGpu]);
  const contextA = createServerContext('instance-a', store, { maxCheckStalenessMs: 0 });
  const contextB = createServerContext('instance-b', store, { maxCheckStalenessMs: 0 });

  // Initial warm on both contexts via real production reader factories
  const partsA = await contextA.getBuilderCatalog();
  const partsB = await contextB.getBuilderCatalog();
  const publicA = await contextA.listPublicPartsCatalog();
  const publicB = await contextB.listPublicPartsCatalog();

  assert.equal(partsA.length, 1);
  assert.equal(partsB.length, 1);
  assert.equal(partsA[0].price, 36000);
  assert.equal(partsB[0].price, 36000);
  assert.equal(publicA[0].price, 36000);
  assert.equal(publicB[0].price, 36000);
  assert.equal(publicA[0].inStock, true);
  assert.equal(publicB[0].inStock, true);

  // Each context loaded its own cache from DB once
  const state = store.getState();
  assert.equal(state.builderCatalogLoads, 2);
  assert.equal(state.publicCatalogLoads, 2);

  // Subsequent reads with unchanged version must not reload
  await contextA.getBuilderCatalog();
  await contextB.getBuilderCatalog();
  await contextA.listPublicPartsCatalog();
  await contextB.listPublicPartsCatalog();

  assert.equal(state.builderCatalogLoads, 2);
  assert.equal(state.publicCatalogLoads, 2);
});

test('multi-instance cache coherence: price update on Instance A propagates to Instance B without local invalidation on B', async () => {
  const store = createSharedStore([sampleGpu]);
  const contextA = createServerContext('instance-a', store, { maxCheckStalenessMs: 0 });
  const contextB = createServerContext('instance-b', store, { maxCheckStalenessMs: 0 });

  // Both instances warm their caches at v1
  await contextA.getBuilderCatalog();
  await contextB.getBuilderCatalog();
  await contextA.listPublicPartsCatalog();
  await contextB.listPublicPartsCatalog();

  // Instance A performs price update and bumps catalogVersion in remote store
  store.updatePart('gpu-rtx4070-01', { price: 33500 });
  await store.bumpCatalogVersion(); // catalogVersion becomes 2

  // Instance A invalidates locally (simulating actions.ts: clearCatalogCache)
  contextA.clearBuilderCatalogCache();
  contextA.invalidatePublicPartsCatalog();

  // Instance B receives NO local invalidation signal (completely separate process)
  // Because maxCheckStalenessMs is 0, on next read Instance B checks catalogVersion,
  // observes remote version 2 > cached version 1, and refetches fresh data.
  const builderB = await contextB.getBuilderCatalog();
  const publicB = await contextB.listPublicPartsCatalog();

  assert.equal(builderB[0].price, 33500, 'Instance B must serve updated builder price');
  assert.equal(publicB[0].price, 33500, 'Instance B must serve updated public price');

  // Instance A also loads fresh price
  const builderA = await contextA.getBuilderCatalog();
  const publicA = await contextA.listPublicPartsCatalog();

  assert.equal(builderA[0].price, 33500, 'Instance A must serve updated builder price');
  assert.equal(publicA[0].price, 33500, 'Instance A must serve updated public price');

  // Total DB loads increased by 1 for each context
  const state = store.getState();
  assert.equal(state.builderCatalogLoads, 4); // 2 initial + 1 for A + 1 for B
  assert.equal(state.publicCatalogLoads, 4);
});

test('multi-instance cache coherence: stock drop to 0 converts inStock flag across all instances', async () => {
  const store = createSharedStore([sampleGpu]);
  const contextA = createServerContext('instance-a', store, { maxCheckStalenessMs: 0 });
  const contextB = createServerContext('instance-b', store, { maxCheckStalenessMs: 0 });

  // Warm caches
  await contextA.getBuilderCatalog();
  await contextB.getBuilderCatalog();
  await contextA.listPublicPartsCatalog();
  await contextB.listPublicPartsCatalog();

  // Stock depletion: item sold out
  store.updatePart('gpu-rtx4070-01', { stock: 0, price: 32000 });
  await store.bumpCatalogVersion(); // catalogVersion becomes 2

  // Instance B reads without local invalidation
  const builderB = await contextB.getBuilderCatalog();
  const publicB = await contextB.listPublicPartsCatalog();

  assert.equal(builderB[0].stock, 0, 'Instance B builder catalog must reflect 0 stock');
  assert.equal(builderB[0].price, 32000);
  assert.equal(publicB[0].inStock, false, 'Instance B public catalog must mark part out of stock');
  assert.equal(publicB[0].price, 32000);

  // Instance A invalidates and reads
  contextA.clearBuilderCatalogCache();
  contextA.invalidatePublicPartsCatalog();
  const builderA = await contextA.getBuilderCatalog();
  const publicA = await contextA.listPublicPartsCatalog();

  assert.equal(builderA[0].stock, 0);
  assert.equal(publicA[0].inStock, false);
});

test('multi-instance cache coherence: maxCheckStalenessMs window delays check and then converges', async () => {
  const store = createSharedStore([sampleGpu]);
  // 50ms staleness window
  const contextB = createServerContext('instance-b', store, { maxCheckStalenessMs: 50 });

  // Initial warm at v1
  await contextB.getBuilderCatalog();
  const readsBefore = store.getState().versionReads;

  // Remote version bumped
  store.updatePart('gpu-rtx4070-01', { price: 31000 });
  await store.bumpCatalogVersion(); // v2

  // Immediate read (< 50ms): returns cached value, no remote version check
  const immediate = await contextB.getBuilderCatalog();
  assert.equal(immediate[0].price, 36000, 'Immediate call inside staleness window returns cached value');
  assert.equal(store.getState().versionReads, readsBefore, 'No version read inside staleness window');

  // Wait for staleness window to pass (> 50ms)
  await new Promise(resolve => setTimeout(resolve, 60));

  // Call after window: checks remote version, detects v2, refreshes
  const refreshed = await contextB.getBuilderCatalog();
  assert.equal(refreshed[0].price, 31000, 'Call after staleness window refreshes with updated price');
  assert.ok(store.getState().versionReads > readsBefore, 'Remote version checked after staleness window');
});

test('multi-instance cache coherence: concurrent requests during version bump coalesce to single fetch', async () => {
  const store = createSharedStore([sampleGpu]);
  const contextB = createServerContext('instance-b', store, { maxCheckStalenessMs: 0 });

  // Initial warm
  await contextB.getBuilderCatalog();
  assert.equal(store.getState().builderCatalogLoads, 1);

  // Bump version
  store.updatePart('gpu-rtx4070-01', { price: 29999 });
  await store.bumpCatalogVersion();

  // Fire 10 concurrent requests simultaneously to Instance B
  const results = await Promise.all(
    Array.from({ length: 10 }, () => contextB.getBuilderCatalog())
  );

  // All 10 requests returned updated data
  for (const result of results) {
    assert.equal(result[0].price, 29999);
  }

  // Coalesced into exactly 1 additional DB load (total 2)
  assert.equal(store.getState().builderCatalogLoads, 2);
});

test('multi-instance inventory fetcher synchronization purges local cache on remote version bump using production VersionedInventoryStore', async () => {
  const store = createSharedStore([sampleGpu]);
  // Use real VersionedInventoryStore instances initialized from production module
  const contextA = createServerContext('inv-instance-a', store, { maxCheckStalenessMs: 0 });
  const contextB = createServerContext('inv-instance-b', store, { maxCheckStalenessMs: 0 });

  let currentPrice = 36000;
  const loader = () => [`[ID: gpu-1] ASUS RTX 4070 - Price: ₱${currentPrice}`];

  // Helper using the real VersionedInventoryStore instance methods from production module
  async function fetchInventory(context: typeof contextA, key: string): Promise<string[]> {
    const version = await context.inventoryStore.syncCatalogVersion();
    const cached = context.inventoryStore.getCachedInventory(key, version);
    if (cached) return cached;
    const fresh = loader();
    context.inventoryStore.setCachedInventory(key, fresh, version);
    return fresh;
  }

  // Warm both instances
  const resA1 = await fetchInventory(contextA, 'gpu');
  const resB1 = await fetchInventory(contextB, 'gpu');
  assert.equal(resA1[0], '[ID: gpu-1] ASUS RTX 4070 - Price: ₱36000');
  assert.equal(resB1[0], '[ID: gpu-1] ASUS RTX 4070 - Price: ₱36000');
  assert.equal(contextA.inventoryStore.getInventoryCacheSize(), 1);
  assert.equal(contextB.inventoryStore.getInventoryCacheSize(), 1);

  // Price changed and remote catalogVersion bumped
  currentPrice = 33000;
  await store.bumpCatalogVersion(); // v2

  // Instance A invalidates or reads fresh
  const resA2 = await fetchInventory(contextA, 'gpu');
  assert.equal(resA2[0], '[ID: gpu-1] ASUS RTX 4070 - Price: ₱33000');

  // Instance B (separate instance) receives no message, but its production VersionedInventoryStore
  // detects remote version change and clears local cache upon syncCatalogVersion()
  const resB2 = await fetchInventory(contextB, 'gpu');
  assert.equal(resB2[0], '[ID: gpu-1] ASUS RTX 4070 - Price: ₱33000');
});
