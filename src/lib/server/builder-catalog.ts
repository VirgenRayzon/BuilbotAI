import 'server-only';
import { getAdminFirestore } from '@/firebase/server-init';
import type { Part } from '@/lib/types';
import { INVENTORY_CATEGORY_SLUGS, inventoryItemsPath } from '@/lib/inventory-paths';

let catalogCache: Part[] | null = null;
let catalogCacheTime = 0;
const CATALOG_CACHE_TTL = 10 * 60 * 1000;

function serializeDate(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    const date: unknown = value.toDate();
    return date instanceof Date ? date.toISOString() : undefined;
  }
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' || typeof value === 'number') return new Date(value).toISOString();
  return undefined;
}

/** Same public catalog, serialization and cache policy used by the server action.
 * Kept separate from AI actions so the page does not bootstrap Genkit to read it. */
export async function getBuilderCatalog(): Promise<Part[]> {
  const now = Date.now();
  const hasGalleryShape = catalogCache?.every(part => Array.isArray(part.images));
  const hasIdentityShape = catalogCache?.every(part =>
    Object.hasOwn(part, 'productId') && Object.hasOwn(part, 'sku') && Object.hasOwn(part, 'qrToken')
  );
  if (catalogCache && hasGalleryShape && hasIdentityShape && now - catalogCacheTime < CATALOG_CACHE_TTL) return catalogCache;

  const db = getAdminFirestore();
  const snapshots = await Promise.all(INVENTORY_CATEGORY_SLUGS.map(slug =>
    db.collection(inventoryItemsPath(slug)).where('isArchived', '==', false).get()
  ));
  const fetchedParts: Part[] = [];
  snapshots.flatMap(snapshot => snapshot.docs).forEach(document => {
    const data = document.data();
    fetchedParts.push({
      id: document.id,
      productId: typeof data.productId === 'string' ? data.productId : undefined,
      sku: typeof data.sku === 'string' ? data.sku : undefined,
      qrToken: typeof data.qrToken === 'string' ? data.qrToken : undefined,
      name: data.name || '',
      category: data.category as Part['category'],
      brand: data.brand || '',
      price: Number(data.price) || 0,
      usdSrp: data.usdSrp ? Number(data.usdSrp) : undefined,
      stock: Number(data.stock) || 0,
      imageUrl: data.imageUrl || '',
      images: Array.isArray(data.images) ? data.images.filter((image): image is string => typeof image === 'string' && image.length > 0) : [],
      specifications: data.specifications || {},
      wattage: data.wattage !== undefined ? Number(data.wattage) : undefined,
      performanceTier: data.performanceTier !== undefined ? Number(data.performanceTier) : undefined,
      performanceScore: data.performanceScore !== undefined ? Number(data.performanceScore) : undefined,
      socket: data.socket || undefined,
      ramType: data.ramType || undefined,
      dimensions: data.dimensions || undefined,
      description: data.description || undefined,
      packageType: data.packageType || undefined,
      createdAt: serializeDate(data.createdAt),
      isArchived: data.isArchived || false,
    });
  });
  catalogCache = fetchedParts;
  catalogCacheTime = now;
  return fetchedParts;
}

export function clearBuilderCatalogCache() {
  catalogCache = null;
  catalogCacheTime = 0;
}
