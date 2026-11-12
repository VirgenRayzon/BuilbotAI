import { getAdminFirestore } from '@/firebase/server-init';
import { inventoryItemPath, inventoryItemsPath, INVENTORY_CATEGORY_SLUGS } from '../inventory-paths';
import { PRODUCT_ID_PATTERN, type ProductKind } from '../product-identity';
import { getPrebuiltPartStatuses, type ResolvedPrebuiltPart } from '../prebuilt-utils';
import type { Part, PrebuiltSystem } from '../types';
import type { PublicProduct } from '../public-product-types';
import type { PublicCatalogPart } from '../public-product-types';
import type { Transaction } from 'firebase-admin/firestore';
import { INCLUDED_INTEGRATED_GPU_ID, createIntegratedGpuPart } from '../integrated-graphics';
import { includedCpuCoolerName } from '../included-cpu-cooler';
import { revalidateTag } from 'next/cache';
import { VersionedServerCache } from './catalog-cache';
import { getCatalogMeta } from './catalog-meta-store';

export const PUBLIC_PARTS_CACHE_TAG = 'public-parts-catalog';
export const COMPATIBILITY_SPEC_KEYS = [
  'Socket', 'socket', 'Memory Type', 'RAM Type', 'Memory', 'Generation', 'Type',
  'NVMe Slots', 'SATA Slots', 'Form Factor', 'Memory Slots', 'Stick Count',
  'Radiator Size', 'Max Radiator Size (mm)', 'Mobo Support',
] as const;

export async function productReference(productId: string, expectedKind?: ProductKind) {
  if (!PRODUCT_ID_PATTERN.test(productId)) return null;
  const db = getAdminFirestore();
  const mapping = (await db.doc(`productIds/${productId}`).get()).data();
  if (!mapping || (expectedKind && mapping.kind !== expectedKind)) return null;
  const path = String(mapping.path);
  if (!(mapping.kind === 'part' ? /^inventory\/(cpu|gpu|motherboard|ram|storage|psu|case|cooler|monitor|keyboard|mouse|headset)\/items\/[\w-]+$/.test(path)
    : mapping.kind === 'prebuilt' && /^prebuiltSystems\/[\w-]+$/.test(path))) return null;
  return { ref: db.doc(path), kind: mapping.kind as ProductKind };
}

export async function resolveSystemParts(system: PrebuiltSystem, transaction?: Transaction): Promise<ResolvedPrebuiltPart[]> {
  const db = getAdminFirestore();
  const selections = Object.entries(system.components || {}).flatMap(([category, value]) =>
    (Array.isArray(value) ? value : [value]).filter(Boolean).map((partId, index) => ({ key: `${category}-${index}`, category, partId })));
  return Promise.all(selections.map(async entry => {
    if (entry.category === 'cooler' && entry.partId === 'included-stock-cooler') {
      const cpuId = system.components?.cpu;
      if (!cpuId || cpuId.includes('/')) return { ...entry, part: null };
      const cpuRef = db.doc(inventoryItemPath('CPU', cpuId));
      const cpuSnap = transaction ? await transaction.get(cpuRef) : await cpuRef.get();
      const cpu = cpuSnap.exists ? { ...cpuSnap.data(), id: cpuSnap.id, category: 'CPU' } as Part : null;
      const coolerName = cpu && !cpu.isArchived ? includedCpuCoolerName(cpu) : null;
      return { ...entry, part: coolerName ? { id: entry.partId, name: coolerName, price: 0, category: 'Cooler', stock: Number.MAX_SAFE_INTEGER } as Part : null };
    }
    if (entry.partId === INCLUDED_INTEGRATED_GPU_ID) {
      const cpuId = system.components?.cpu;
      if (entry.category !== 'gpu' || !cpuId || cpuId.includes('/')) return { ...entry, part: null };
      const cpuRef = db.doc(inventoryItemPath('cpu', cpuId));
      const cpuSnap = transaction ? await transaction.get(cpuRef) : await cpuRef.get();
      const cpu = cpuSnap.exists ? { ...cpuSnap.data(), id: cpuSnap.id } as Part : null;
      return { ...entry, part: cpu && !cpu.isArchived ? createIntegratedGpuPart(cpu) : null };
    }
    try {
      const ref = !entry.partId.includes('/') ? db.doc(inventoryItemPath(entry.category, entry.partId)) : null;
      const snap = ref ? (transaction ? await transaction.get(ref) : await ref.get()) : null;
      return { ...entry, partId: snap?.exists ? snap.id : entry.partId, part: snap?.exists ? { ...snap.data(), id: snap.id } as Part : null };
    } catch { return { ...entry, part: null }; }
  }));
}

export async function getPublicProduct(productId: string, expectedKind?: ProductKind): Promise<PublicProduct | null> {
  const target = await productReference(productId, expectedKind);
  if (!target) return null;
  const snap = await target.ref.get();
  if (!snap.exists) return null;
  const data = snap.data() as Part & PrebuiltSystem;
  if (data.isArchived || data.productId !== productId) return null;
  return serializeProduct(data, target.kind);
}

async function serializeProduct(data: Part & PrebuiltSystem, kind: ProductKind): Promise<PublicProduct> {
  const specs: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(data.specifications || {})) {
    if (typeof value === 'string' || typeof value === 'number') specs[key] = value;
  }
  const resolvedParts: ResolvedPrebuiltPart[] =
    kind === 'prebuilt'
      ? data.componentSummaries && data.componentSummaries.length > 0
        ? data.componentSummaries.map(s => ({
            key: s.key,
            category: s.category.toLowerCase(),
            partId: s.partId,
            part: s.isArchived
              ? null
              : ({
                  id: s.partId,
                  productId: s.productId || undefined,
                  name: s.name,
                  category: s.category,
                  brand: 'BuildbotAI',
                  price: s.price,
                  stock: s.inStock ? 999 : 0,
                  imageUrl: s.imageUrl,
                  specifications: {},
                  isArchived: false,
                } as Part),
          }))
        : await resolveSystemParts(data)
      : [];
  const statuses = kind === 'prebuilt' ? getPrebuiltPartStatuses(data, resolvedParts) : [];
  const report: unknown = data.aiReport;
  const highlights = report && typeof report === 'object' && 'pros' in report && Array.isArray(report.pros)
    ? report.pros.filter((value): value is string => typeof value === 'string') : [];
  return {
    kind, productId: data.productId!, sku: data.sku || '', qrToken: data.qrToken || '',
    name: data.name, category: kind === 'part' ? data.category : data.tier,
    brand: kind === 'part' ? data.brand : 'BuildbotAI', price: kind === 'prebuilt' && statuses.length > 0 && statuses.every(p => p.part)
      ? Math.round(statuses.reduce((total, p) => total + (p.part?.price || 0), 0) * 100) / 100 : data.price,
    inStock: kind === 'part' ? data.stock > 0 : statuses.length > 0 && statuses.every(p => !p.issue),
    createdAt: timestampMillis(data.createdAt),
    images: Array.from(new Set([data.imageUrl, ...(data.images || [])].filter(Boolean))),
    description: data.description || '', specifications: specs,
    highlights,
    components: statuses.map(({ key, name, categoryLabel, part, issue }) => ({ key, name: part ? name : `${categoryLabel} unavailable`, category: categoryLabel, productId: part?.productId || null, issue })),
  };
}

function timestampMillis(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Date.parse(value) || 0;
  if (value instanceof Date) return value.getTime();
  if (value && typeof value === 'object' && 'toMillis' in value && typeof value.toMillis === 'function') {
    return value.toMillis();
  }
  return 0;
}

export function toPublicCatalogPart(data: Part): PublicCatalogPart {
  const specifications: PublicCatalogPart['specifications'] = {};
  for (const key of COMPATIBILITY_SPEC_KEYS) {
    const value = data.specifications?.[key];
    if (typeof value === 'string' || typeof value === 'number') specifications[key] = value;
  }
  return {
    productId: data.productId!, sku: data.sku || '', qrToken: data.qrToken || '', name: data.name,
    category: data.category, brand: data.brand || '', price: data.price,
    inStock: data.stock > 0, createdAt: timestampMillis(data.createdAt),
    imageUrl: data.imageUrl || data.images?.[0] || '', specifications,
  };
}

export async function listPublicProducts(kind: ProductKind): Promise<PublicProduct[]> {
  const db = getAdminFirestore();
  const snapshots = kind === 'part' ? await Promise.all(INVENTORY_CATEGORY_SLUGS.map(c => db.collection(inventoryItemsPath(c)).get())) : [await db.collection('prebuiltSystems').where('isArchived', '==', false).get()];
  const records = snapshots.flatMap(s => s.docs).filter(d => !d.get('isArchived') && PRODUCT_ID_PATTERN.test(String(d.get('productId'))));
  return Promise.all(records.map(d => serializeProduct(d.data() as Part & PrebuiltSystem, kind)));
}

async function readPublicPartsCatalog(): Promise<PublicCatalogPart[]> {
  const db = getAdminFirestore();
  const indexed = process.env.NEXT_PUBLIC_PUBLIC_CATALOG_INDEXED_ENABLED === 'true';
  const snapshots = await Promise.all(INVENTORY_CATEGORY_SLUGS.map(category =>
    (indexed
      ? db.collection(inventoryItemsPath(category)).where('inventoryQueryVersion', '==', 1).where('isArchived', '==', false).where('publicCatalogEligible', '==', true)
      : db.collection(inventoryItemsPath(category))).select(
      'isArchived', 'productId', 'sku', 'name', 'category', 'brand', 'price',
      'qrToken', 'stock', 'createdAt', 'imageUrl', 'images', 'specifications'
    ).get()
  ));

  return snapshots.flatMap(snapshot => snapshot.docs)
    .filter(document => !document.get('isArchived') && PRODUCT_ID_PATTERN.test(String(document.get('productId'))))
    .map(document => toPublicCatalogPart(document.data() as Part));
}

export async function listRelatedPublicParts(category: string, excludeProductId: string): Promise<PublicCatalogPart[]> {
  if (!INVENTORY_CATEGORY_SLUGS.includes(category.trim().toLowerCase() as typeof INVENTORY_CATEGORY_SLUGS[number])) return [];
  const db = getAdminFirestore();
  const indexed = process.env.NEXT_PUBLIC_PUBLIC_CATALOG_INDEXED_ENABLED === 'true';
  const collection = db.collection(inventoryItemsPath(category));
  const query = indexed
    ? collection.where('inventoryQueryVersion', '==', 1).where('isArchived', '==', false).where('publicCatalogEligible', '==', true).where('stock', '>', 0).limit(9)
    : collection;
  const snapshot = await query.select('isArchived', 'productId', 'sku', 'qrToken', 'name', 'category', 'brand', 'price', 'stock', 'createdAt', 'imageUrl', 'images', 'specifications').get();
  return snapshot.docs
    .filter(document => !document.get('isArchived') && Number(document.get('stock')) > 0 && document.get('productId') !== excludeProductId && PRODUCT_ID_PATTERN.test(String(document.get('productId'))))
    .slice(0, 8)
    .map(document => toPublicCatalogPart(document.data() as Part));
}

export interface PublicPartsCatalogReaderOptions {
  loader?: () => Promise<PublicCatalogPart[]>;
  readVersion?: () => Promise<number>;
  maxCheckStalenessMs?: number;
  onInvalidate?: () => void;
}

export interface PublicPartsCatalogReader {
  listPublicPartsCatalog: () => Promise<PublicCatalogPart[]>;
  invalidatePublicPartsCatalog: () => void;
  getCache: () => VersionedServerCache<PublicCatalogPart[]>;
}

export function createPublicPartsCatalogReader(
  options?: PublicPartsCatalogReaderOptions
): PublicPartsCatalogReader {
  const cache = new VersionedServerCache<PublicCatalogPart[]>({
    maxCheckStalenessMs: options?.maxCheckStalenessMs,
  });
  const loader = options?.loader ?? readPublicPartsCatalog;
  const readVersion = options?.readVersion ?? (async () => (await getCatalogMeta()).catalogVersion);

  return {
    listPublicPartsCatalog: async () => cache.getOrLoad(loader, readVersion),
    invalidatePublicPartsCatalog: () => {
      cache.invalidateLocal();
      if (options?.onInvalidate) {
        options.onInvalidate();
      } else {
        try {
          revalidateTag(PUBLIC_PARTS_CACHE_TAG);
        } catch {
          // Safely ignore missing Next.js request context outside server requests
        }
      }
    },
    getCache: () => cache,
  };
}

const defaultPublicPartsCatalogReader = createPublicPartsCatalogReader();

export async function listPublicPartsCatalog(): Promise<PublicCatalogPart[]> {
  return defaultPublicPartsCatalogReader.listPublicPartsCatalog();
}

export function invalidatePublicPartsCatalog() {
  defaultPublicPartsCatalogReader.invalidatePublicPartsCatalog();
}
