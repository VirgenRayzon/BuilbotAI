import { z } from 'zod';
import { FieldPath, type Query } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/firebase/server-init';
import type { PublicCatalogPart } from '@/lib/public-product-types';
import type { Part } from '@/lib/types';
import { toPublicCatalogPart } from './public-products';
import { getCatalogMeta } from './catalog-meta-store';

export interface PublicCatalogPage {
  products: PublicCatalogPart[];
  count: number;
  nextCursor: string | null;
  brandFacets?: string[];
}

export const publicCatalogQuerySchema = z.object({
  cursor: z.string().max(500).regex(/^[A-Za-z0-9_-]+$/).nullable().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  inStockOnly: z.boolean().optional(),
  search: z.string().max(120).optional(),
  sortBy: z.enum(['Date Added', 'Price', 'Name']).optional(),
  sortDirection: z.enum(['asc', 'desc']).optional(),
  pageSize: z.number().int().min(1).max(50).default(8),
});

export type PublicCatalogQuery = z.infer<typeof publicCatalogQuerySchema>;

export async function listPublicCatalogPage(rawInput: unknown = null): Promise<PublicCatalogPage> {
  const options: PublicCatalogQuery =
    typeof rawInput === 'string' || rawInput === null || rawInput === undefined
      ? { cursor: rawInput ?? null, pageSize: 8 }
      : publicCatalogQuerySchema.parse(rawInput);

  const db = getAdminFirestore();
  const meta = await getCatalogMeta(db);
  const brandFacets = options.category
    ? (meta.brandsByCategory[options.category] || [])
    : Array.from(new Set(Object.values(meta.brandsByCategory).flat())).sort();

  let base: Query = db.collectionGroup('items')
    .where('inventoryQueryVersion', '==', 1)
    .where('isArchived', '==', false)
    .where('publicCatalogEligible', '==', true);

  if (options.category) {
    base = base.where('category', '==', options.category);
  }
  if (options.brand) {
    base = base.where('brandSort', '==', options.brand.trim().toLowerCase());
  }
  if (options.inStockOnly) {
    base = base.where('inStock', '==', true);
  }

  const searchTrimmed = (options.search || '').trim().toLowerCase();
  const searchTokens = searchTrimmed
    ? searchTrimmed.split(/[^a-z0-9]+/).filter(Boolean)
    : [];

  let longestToken = '';
  if (searchTokens.length > 0) {
    for (const token of searchTokens) {
      if (token.length > longestToken.length) longestToken = token;
    }
    base = base.where('searchKeywords', 'array-contains', longestToken);
  }

  let query = base;
  if (searchTokens.length === 0) {
    if (options.sortBy === 'Price') {
      query = query.orderBy('inStock', 'desc')
        .orderBy('price', options.sortDirection || 'asc')
        .orderBy('productId', 'desc');
    } else if (options.sortBy === 'Name') {
      query = query.orderBy('inStock', 'desc')
        .orderBy('nameSort', options.sortDirection || 'asc')
        .orderBy('productId', 'desc');
    } else {
      query = query.orderBy('inStock', 'desc')
        .orderBy('createdAtSort', 'desc')
        .orderBy('productId', 'desc');
    }
  } else {
    query = query.orderBy(FieldPath.documentId(), 'desc');
  }

  if (options.cursor) {
    const path = Buffer.from(options.cursor, 'base64url').toString('utf8');
    if (!/^inventory\/(cpu|gpu|motherboard|ram|storage|psu|case|cooler|monitor|keyboard|mouse|headset)\/items\/[\w-]+$/.test(path)) {
      throw new Error('Invalid catalog cursor.');
    }
    const cursorDoc = await db.doc(path).get();
    if (!cursorDoc.exists || cursorDoc.get('inventoryQueryVersion') !== 1 || cursorDoc.get('isArchived') !== false || cursorDoc.get('publicCatalogEligible') !== true) {
      throw new Error('Catalog cursor is stale.');
    }
    query = query.startAfter(cursorDoc);
  }

  const batchCap = searchTokens.length > 1 ? options.pageSize * 3 : options.pageSize;
  const [countSnapshot, snapshot] = await Promise.all([
    base.count().get(),
    query.limit(batchCap + 1).get(),
  ]);

  let matchingDocs = snapshot.docs;
  if (searchTokens.length > 1) {
    matchingDocs = matchingDocs.filter(doc => {
      const data = doc.data();
      const keywords = Array.isArray(data.searchKeywords) ? (data.searchKeywords as string[]) : [];
      const text = `${data.name || ''} ${data.brand || ''} ${data.sku || ''} ${data.productId || ''}`.toLowerCase();
      return searchTokens.every(t => keywords.includes(t) || text.includes(t));
    });
  }

  if (searchTokens.length > 0 && options.sortBy) {
    matchingDocs.sort((a, b) => {
      const dataA = a.data();
      const dataB = b.data();
      let comp = 0;
      if (options.sortBy === 'Price') {
        comp = (Number(dataA.price) || 0) - (Number(dataB.price) || 0);
      } else if (options.sortBy === 'Name') {
        comp = String(dataA.nameSort || dataA.name || '').localeCompare(String(dataB.nameSort || dataB.name || ''));
      } else {
        comp = (Number(dataA.createdAtSort) || 0) - (Number(dataB.createdAtSort) || 0);
      }
      return options.sortDirection === 'asc' ? comp : -comp;
    });
  }

  const hasMore = matchingDocs.length > options.pageSize || snapshot.docs.length > batchCap;
  const page = matchingDocs.slice(0, options.pageSize);

  return {
    products: page.map(document => toPublicCatalogPart(document.data() as Part)),
    count: countSnapshot.data().count,
    nextCursor: hasMore && page.length ? Buffer.from(page[page.length - 1].ref.path).toString('base64url') : null,
    brandFacets,
  };
}
