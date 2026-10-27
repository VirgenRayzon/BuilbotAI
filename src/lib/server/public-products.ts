import { getAdminFirestore } from '@/firebase/server-init';
import { inventoryItemPath, inventoryItemsPath, INVENTORY_CATEGORY_SLUGS } from '../inventory-paths';
import { PRODUCT_ID_PATTERN, type ProductKind } from '../product-identity';
import { getPrebuiltPartStatuses, type ResolvedPrebuiltPart } from '../prebuilt-utils';
import type { Part, PrebuiltSystem } from '../types';
import type { PublicProduct } from '../public-product-types';
import type { PublicCatalogPart } from '../public-product-types';
import type { Transaction } from 'firebase-admin/firestore';
import { INCLUDED_INTEGRATED_GPU_ID, createIntegratedGpuPart } from '../integrated-graphics';
import { revalidateTag, unstable_cache } from 'next/cache';

export const PUBLIC_PARTS_CACHE_TAG = 'public-parts-catalog';
const COMPATIBILITY_SPEC_KEYS = [
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
    if (entry.partId === 'included-stock-cooler') return { ...entry, part: { id: entry.partId, name: 'Included stock cooler', price: 0, category: 'Cooler', stock: Number.MAX_SAFE_INTEGER } as Part };
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
      let snap = ref ? (transaction ? await transaction.get(ref) : await ref.get()) : null;
      if (!snap?.exists) {
        const query = db.collection(inventoryItemsPath(entry.category)).where('name', '==', entry.partId).limit(2);
        const matches = transaction ? await transaction.get(query) : await query.get();
        snap = matches.size === 1 ? matches.docs[0] : null;
      }
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
  const statuses = kind === 'prebuilt' ? getPrebuiltPartStatuses(data, await resolveSystemParts(data)) : [];
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

export async function listPublicProducts(kind: ProductKind): Promise<PublicProduct[]> {
  const db = getAdminFirestore();
  const snapshots = kind === 'part' ? await Promise.all(INVENTORY_CATEGORY_SLUGS.map(c => db.collection(inventoryItemsPath(c)).get())) : [await db.collection('prebuiltSystems').get()];
  const records = snapshots.flatMap(s => s.docs).filter(d => !d.get('isArchived') && PRODUCT_ID_PATTERN.test(String(d.get('productId'))));
  return Promise.all(records.map(d => serializeProduct(d.data() as Part & PrebuiltSystem, kind)));
}

async function readPublicPartsCatalog(): Promise<PublicCatalogPart[]> {
  const db = getAdminFirestore();
  const snapshots = await Promise.all(INVENTORY_CATEGORY_SLUGS.map(category =>
    db.collection(inventoryItemsPath(category)).select(
      'isArchived', 'productId', 'sku', 'name', 'category', 'brand', 'price',
      'qrToken', 'stock', 'createdAt', 'imageUrl', 'images', 'specifications'
    ).get()
  ));

  return snapshots.flatMap(snapshot => snapshot.docs)
    .filter(document => !document.get('isArchived') && PRODUCT_ID_PATTERN.test(String(document.get('productId'))))
    .map(document => {
      const data = document.data() as Part;
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
    });
}

export const listPublicPartsCatalog = unstable_cache(
  readPublicPartsCatalog,
  ['public-parts-catalog-v1'],
  { tags: [PUBLIC_PARTS_CACHE_TAG], revalidate: 10 * 60 }
);

export function invalidatePublicPartsCatalog() {
  try {
    revalidateTag(PUBLIC_PARTS_CACHE_TAG);
  } catch (error) {
    // A completed inventory write must still be reported as successful.
    console.error('[public-parts-catalog] Cache invalidation failed:', error);
  }
}
