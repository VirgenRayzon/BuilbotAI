import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPrebuiltComponentSummaries,
  extractPrebuiltComponentPartIds,
  syncPrebuiltSummariesForPart,
  type PrebuiltComponentSummary,
} from './prebuilt-summaries';
import {
  listPrebuiltSystemsPage,
  prebuiltPageQuerySchema,
} from './server/prebuilt-queries';
import type { Part, PrebuiltSystem } from './types';
import { INCLUDED_INTEGRATED_GPU_ID } from './integrated-graphics';
import { getPrebuiltPartStatuses, type ResolvedPrebuiltPart } from './prebuilt-utils';

function createMockPart(overrides: Partial<Part> = {}): Part {
  return {
    id: overrides.id || 'part-1',
    name: overrides.name || 'Mock Component',
    category: overrides.category || 'CPU',
    brand: overrides.brand || 'MockBrand',
    price: overrides.price ?? 5000,
    stock: overrides.stock ?? 10,
    imageUrl: overrides.imageUrl || 'https://example.com/part.png',
    productId: overrides.productId || 'PRD-PART-1',
    isArchived: overrides.isArchived ?? false,
    specifications: overrides.specifications || {},
    ...overrides,
  };
}

function createMockPrebuilt(overrides: Partial<PrebuiltSystem> = {}): PrebuiltSystem {
  return {
    id: overrides.id || 'prebuilt-1',
    name: overrides.name || 'Mock Gaming Rig',
    tier: overrides.tier || 'Mid-Range',
    price: overrides.price ?? 45000,
    imageUrl: overrides.imageUrl || 'https://example.com/prebuilt.png',
    isArchived: overrides.isArchived ?? false,
    components: {
      cpu: 'cpu-1',
      gpu: 'gpu-1',
      motherboard: 'mobo-1',
      ram: ['ram-1', 'ram-2'],
      storage: ['ssd-1'],
      psu: 'psu-1',
      case: 'case-1',
      cooler: 'cooler-1',
      ...(overrides.components || {}),
    },
    ...overrides,
  };
}

test('buildPrebuiltComponentSummaries handles single and array component slots', async () => {
  const partsStore = new Map<string, Part>([
    ['cpu-1', createMockPart({ id: 'cpu-1', name: 'Intel i5-13400', category: 'CPU', price: 12000, stock: 5 })],
    ['gpu-1', createMockPart({ id: 'gpu-1', name: 'RTX 4060', category: 'GPU', price: 18000, stock: 3 })],
    ['mobo-1', createMockPart({ id: 'mobo-1', name: 'B760M Motherboard', category: 'Motherboard', price: 7000, stock: 2 })],
    ['ram-1', createMockPart({ id: 'ram-1', name: '16GB DDR5 Stick A', category: 'RAM', price: 3000, stock: 8 })],
    ['ram-2', createMockPart({ id: 'ram-2', name: '16GB DDR5 Stick B', category: 'RAM', price: 3000, stock: 8 })],
    ['ssd-1', createMockPart({ id: 'ssd-1', name: '1TB NVMe SSD', category: 'Storage', price: 4000, stock: 12 })],
    ['psu-1', createMockPart({ id: 'psu-1', name: '650W Bronze PSU', category: 'PSU', price: 3500, stock: 4 })],
    ['case-1', createMockPart({ id: 'case-1', name: 'ATX Mid-Tower Case', category: 'Case', price: 2500, stock: 6 })],
    ['cooler-1', createMockPart({ id: 'cooler-1', name: '240mm AIO Cooler', category: 'Cooler', price: 4500, stock: 3 })],
  ]);

  const attemptedLegacyPaths: string[] = [];
  const system = createMockPrebuilt();

  const summaries = await buildPrebuiltComponentSummaries(system, async (category, partId) => {
    if (partId.includes('/') || category === 'CPU/' || category.includes('/')) {
      attemptedLegacyPaths.push(`${category}/${partId}`);
    }
    return partsStore.get(partId) || null;
  });

  assert.equal(attemptedLegacyPaths.length, 0, 'No legacy slash paths or fallback calls should be issued');
  assert.equal(summaries.length, 9, 'Should resolve all 9 component slots (including 2 ram slots)');

  const cpuSummary = summaries.find(s => s.key === 'cpu-0');
  assert.ok(cpuSummary);
  assert.equal(cpuSummary?.partId, 'cpu-1');
  assert.equal(cpuSummary?.price, 12000);
  assert.equal(cpuSummary?.inStock, true);
  assert.equal(cpuSummary?.isArchived, false);

  const ramSummaries = summaries.filter(s => s.category === 'RAM');
  assert.equal(ramSummaries.length, 2);
  assert.equal(ramSummaries[0].key, 'ram-0');
  assert.equal(ramSummaries[1].key, 'ram-1');
});

test('buildPrebuiltComponentSummaries handles included stock cooler and integrated GPU without legacy fallbacks', async () => {
  const cpuWithCoolerAndGpu = createMockPart({
    id: 'cpu-with-igpu',
    name: 'AMD Ryzen 5 5600G',
    category: 'CPU',
    packageType: 'BOX',
    price: 8000,
    stock: 5,
    specifications: {
      'Include Cooler': 'Yes',
      'Included Cooler': 'AMD Wraith Stealth',
      'Integrated Graphics': 'Radeon Graphics (Vega 7)',
    },
  });

  const system = createMockPrebuilt({
    components: {
      cpu: 'cpu-with-igpu',
      gpu: INCLUDED_INTEGRATED_GPU_ID,
      cooler: 'included-stock-cooler',
    },
  });

  const summaries = await buildPrebuiltComponentSummaries(system, async (_category, partId) => {
    if (partId === 'cpu-with-igpu') return cpuWithCoolerAndGpu;
    return null;
  });

  const coolerSummary = summaries.find(s => s.category === 'Cooler');
  assert.ok(coolerSummary, 'Cooler summary must be present');
  assert.equal(coolerSummary?.partId, 'included-stock-cooler');
  assert.equal(coolerSummary?.price, 0);
  assert.equal(coolerSummary?.inStock, true);
  assert.equal(coolerSummary?.name, 'AMD Wraith Stealth');

  const gpuSummary = summaries.find(s => s.category === 'GPU');
  assert.ok(gpuSummary, 'GPU summary must be present');
  assert.equal(gpuSummary?.partId, INCLUDED_INTEGRATED_GPU_ID);
  assert.equal(gpuSummary?.price, 0);
  assert.equal(gpuSummary?.inStock, true);
  assert.ok(gpuSummary?.name.includes('Vega 7') || gpuSummary?.name.includes('Integrated Graphics'));
});

test('extractPrebuiltComponentPartIds collects deduplicated part IDs', () => {
  const system = createMockPrebuilt({
    components: {
      cpu: 'cpu-1',
      gpu: 'gpu-1',
      ram: ['ram-1', 'ram-1'],
      storage: ['ssd-1', 'ssd-2'],
      cooler: 'included-stock-cooler',
    },
  });

  const partIds = extractPrebuiltComponentPartIds(system);
  assert.ok(partIds.includes('cpu-1'));
  assert.ok(partIds.includes('gpu-1'));
  assert.ok(partIds.includes('ram-1'));
  assert.ok(partIds.includes('ssd-1'));
  assert.ok(partIds.includes('ssd-2'));
  assert.ok(partIds.includes('included-stock-cooler'));
  assert.equal(partIds.filter(id => id === 'ram-1').length, 1, 'Duplicate part IDs must be deduplicated');
});

test('syncPrebuiltSummariesForPart updates price, inStock, isArchived, and derived total price on referencing prebuilt docs', async () => {
  const initialSummaries: PrebuiltComponentSummary[] = [
    {
      key: 'cpu-0',
      category: 'CPU',
      partId: 'cpu-1',
      productId: 'PRD-CPU-1',
      name: 'Intel i5-13400',
      price: 12000,
      imageUrl: 'https://example.com/cpu.png',
      inStock: true,
      isArchived: false,
    },
    {
      key: 'gpu-0',
      category: 'GPU',
      partId: 'gpu-target',
      productId: 'PRD-GPU-TARGET',
      name: 'RTX 4060 8GB',
      price: 18000,
      imageUrl: 'https://example.com/gpu.png',
      inStock: true,
      isArchived: false,
    },
  ];

  let updatedDocData: Record<string, unknown> | null = null;
  const mockPrebuiltDoc = {
    id: 'prebuilt-sys-1',
    ref: {
      update: async (data: Record<string, unknown>) => {
        updatedDocData = data;
      },
    },
    data: () => ({
      id: 'prebuilt-sys-1',
      price: 30000,
      componentSummaries: initialSummaries,
      componentPartIds: ['cpu-1', 'gpu-target'],
    }),
  };

  const mockDb = {
    collection: (collName: string) => {
      assert.equal(collName, 'prebuiltSystems');
      return {
        where: (field: string, op: string, value: unknown) => {
          assert.equal(field, 'componentPartIds');
          assert.equal(op, 'array-contains');
          assert.equal(value, 'gpu-target');
          return {
            get: async () => ({
              docs: [mockPrebuiltDoc],
              empty: false,
              size: 1,
            }),
          };
        },
      };
    },
  };

  const updatedPart = createMockPart({
    id: 'gpu-target',
    productId: 'PRD-GPU-TARGET',
    name: 'RTX 4060 8GB (Updated Revision)',
    price: 21000,
    stock: 0,
    isArchived: true,
  });

  await syncPrebuiltSummariesForPart(
    mockDb as any,
    'inventory/gpu/items/gpu-target',
    updatedPart
  );

  assert.ok(updatedDocData, 'Prebuilt document must be updated');
  const writtenSummaries = (updatedDocData as any).componentSummaries as PrebuiltComponentSummary[];
  assert.ok(Array.isArray(writtenSummaries));

  const updatedGpuSummary = writtenSummaries.find(s => s.partId === 'gpu-target');
  assert.ok(updatedGpuSummary);
  assert.equal(updatedGpuSummary?.price, 21000, 'Price must update');
  assert.equal(updatedGpuSummary?.inStock, false, 'inStock must be false when stock is 0');
  assert.equal(updatedGpuSummary?.isArchived, true, 'isArchived must be true');
  assert.equal(updatedGpuSummary?.name, 'RTX 4060 8GB (Updated Revision)');

  // Derived total price: cpu 12000 + gpu 21000 = 33000
  assert.equal((updatedDocData as any).price, 33000, 'Derived total price must be sum of updated component summaries');
});

test('prebuiltPageQuerySchema enforces bounds and defaults', () => {
  const defaults = prebuiltPageQuerySchema.parse({});
  assert.equal(defaults.includeArchived, false);
  assert.equal(defaults.pageSize, 24);
  assert.equal(defaults.sortDirection, 'desc');

  const bounded = prebuiltPageQuerySchema.parse({ pageSize: 100 });
  assert.equal(bounded.pageSize, 24, 'pageSize must be capped at 24');
});

test('listPrebuiltSystemsPage applies public filter (isArchived == false), tier filter, and cursor', async () => {
  const prebuiltList = [
    createMockPrebuilt({ id: 'p1', tier: 'Entry', price: 25000, isArchived: false, createdAt: 100 }),
    createMockPrebuilt({ id: 'p2', tier: 'Mid-Range', price: 45000, isArchived: false, createdAt: 200 }),
    createMockPrebuilt({ id: 'p3', tier: 'High-End', price: 85000, isArchived: false, createdAt: 300 }),
    createMockPrebuilt({ id: 'p4', tier: 'Mid-Range', price: 50000, isArchived: true, createdAt: 400 }), // archived
    createMockPrebuilt({ id: 'p5', tier: 'Workstation', price: 120000, isArchived: false, createdAt: 500 }),
    createMockPrebuilt({ id: 'p6', tier: 'Entry', price: 30000, isArchived: false, createdAt: 600 }),
  ];

  interface QueryCall {
    filters: Array<{ field: string; op: string; value: unknown }>;
    orderByField?: string;
    orderDir?: string;
    limit?: number;
    startAfterDocId?: string;
  }
  const calls: QueryCall[] = [];

  const mockDb = {
    collection: (coll: string) => {
      assert.equal(coll, 'prebuiltSystems');
      const currentCall: QueryCall = { filters: [] };

      const queryObj = {
        where: (field: string, op: string, value: unknown) => {
          currentCall.filters.push({ field, op, value });
          return queryObj;
        },
        orderBy: (field: string, dir: string) => {
          if (!currentCall.orderByField) {
            currentCall.orderByField = field;
            currentCall.orderDir = dir;
          }
          return queryObj;
        },
        limit: (n: number) => {
          currentCall.limit = n;
          return queryObj;
        },
        startAfter: (docSnap: any) => {
          currentCall.startAfterDocId = docSnap.id;
          return queryObj;
        },
        get: async () => {
          calls.push(currentCall);
          let filtered = [...prebuiltList];
          for (const f of currentCall.filters) {
            if (f.field === 'isArchived') {
              filtered = filtered.filter(p => p.isArchived === f.value);
            }
            if (f.field === 'tier' && f.op === 'in') {
              const allowed = f.value as string[];
              filtered = filtered.filter(p => allowed.includes(p.tier));
            }
          }
          if (currentCall.startAfterDocId) {
            const idx = filtered.findIndex(p => p.id === currentCall.startAfterDocId);
            if (idx !== -1) filtered = filtered.slice(idx + 1);
          }
          if (currentCall.limit) {
            filtered = filtered.slice(0, currentCall.limit);
          }
          return {
            docs: filtered.map(d => ({
              id: d.id,
              data: () => d,
            })),
            empty: filtered.length === 0,
            size: filtered.length,
          };
        },
      };

      return queryObj;
    },
    doc: (path: string) => {
      const id = path.replace('prebuiltSystems/', '');
      const doc = prebuiltList.find(p => p.id === id);
      return {
        get: async () => ({
          exists: Boolean(doc),
          id: doc?.id || id,
          data: () => doc,
        }),
      };
    },
  };

  const result = await listPrebuiltSystemsPage(
    {
      includeArchived: false,
      tiers: ['Entry', 'Mid-Range'],
      pageSize: 2,
    },
    { firestore: mockDb as any }
  );

  assert.equal(result.items.length, 2);
  assert.equal(result.items.some(p => p.isArchived), false, 'Archived items must be excluded');
  assert.ok(result.items.every(p => ['Entry', 'Mid-Range'].includes(p.tier)));
  assert.ok(result.hasMore);
  assert.equal(result.nextCursor, result.items[1].id);

  // Check cursor progression
  const page2 = await listPrebuiltSystemsPage(
    {
      includeArchived: false,
      tiers: ['Entry', 'Mid-Range'],
      pageSize: 2,
      cursor: result.nextCursor,
    },
    { firestore: mockDb as any }
  );

  assert.equal(page2.items.length, 1, 'Page 2 should return the remaining 1 unarchived entry/mid-range prebuilt');
  assert.equal(page2.hasMore, false);
});

test('getPrebuiltPartStatuses does not mark dual-channel RAM out of stock when synthesized from inStock: true summaries', () => {
  const system = createMockPrebuilt({
    components: {
      cpu: 'cpu-1',
      gpu: 'gpu-1',
      motherboard: 'mobo-1',
      ram: ['ram-1', 'ram-1'],
      storage: ['ssd-1'],
      psu: 'psu-1',
      case: 'case-1',
      cooler: 'cooler-1',
    },
  });

  const summaries: PrebuiltComponentSummary[] = [
    { key: 'ram-0', category: 'RAM', partId: 'ram-1', productId: null, name: 'DDR5 16GB', price: 3000, imageUrl: '', inStock: true, isArchived: false },
    { key: 'ram-1', category: 'RAM', partId: 'ram-1', productId: null, name: 'DDR5 16GB', price: 3000, imageUrl: '', inStock: true, isArchived: false },
  ];

  const resolvedParts: ResolvedPrebuiltPart[] = summaries.map(s => ({
    key: s.key,
    category: s.category.toLowerCase(),
    partId: s.partId,
    part: s.isArchived ? null : {
      id: s.partId,
      name: s.name,
      category: s.category,
      brand: 'BuildbotAI',
      price: s.price,
      stock: s.inStock ? 999 : 0,
      imageUrl: s.imageUrl,
      specifications: {},
      isArchived: false,
    },
  }));

  const statuses = getPrebuiltPartStatuses(system, resolvedParts);
  const ramStatuses = statuses.filter(s => s.category === 'ram');
  assert.equal(ramStatuses.length, 2);
  assert.equal(ramStatuses[0].issue, null, 'Slot 0 RAM should not have issue');
  assert.equal(ramStatuses[1].issue, null, 'Slot 1 RAM should not have out-of-stock issue');
});

test('syncPrebuiltSummariesForPart performs zero Firestore writes when stock change leaves inStock unchanged', async () => {
  const initialSummaries: PrebuiltComponentSummary[] = [
    {
      key: 'gpu-0',
      category: 'GPU',
      partId: 'gpu-target',
      productId: 'PRD-GPU-TARGET',
      name: 'RTX 4060 8GB',
      price: 18000,
      imageUrl: 'https://example.com/gpu.png',
      inStock: true,
      isArchived: false,
    },
  ];

  let updateCalled = false;
  const mockPrebuiltDoc = {
    id: 'prebuilt-sys-1',
    ref: {
      update: async () => {
        updateCalled = true;
      },
    },
    data: () => ({
      id: 'prebuilt-sys-1',
      price: 18000,
      componentSummaries: initialSummaries,
      componentPartIds: ['gpu-target'],
    }),
  };

  const mockDb = {
    collection: () => ({
      where: () => ({
        get: async () => ({
          docs: [mockPrebuiltDoc],
          empty: false,
          size: 1,
        }),
      }),
    }),
  };

  // Part stock drops from 10 to 9, but inStock remains true, price and other fields identical
  const updatedPart = createMockPart({
    id: 'gpu-target',
    productId: 'PRD-GPU-TARGET',
    name: 'RTX 4060 8GB',
    price: 18000,
    stock: 9,
    imageUrl: 'https://example.com/gpu.png',
    isArchived: false,
  });

  await syncPrebuiltSummariesForPart(
    mockDb as any,
    'inventory/gpu/items/gpu-target',
    updatedPart
  );

  assert.equal(updateCalled, false, 'No update should be performed when inStock, price, name, etc. did not change');
});
