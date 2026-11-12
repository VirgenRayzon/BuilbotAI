import { z } from 'zod';
import { FieldPath, type Query, type QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/firebase/server-init';
import type { PublicCatalogPart } from '@/lib/public-product-types';
import type { Part } from '@/lib/types';
import { toPublicCatalogPart } from './public-products';
import { getCatalogMeta } from './catalog-meta-store';
import { parseSearchQueryTokens, findLongestSearchToken } from '@/lib/catalog-meta';

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

  const searchTokens = parseSearchQueryTokens(options.search);
  const longestToken = findLongestSearchToken(searchTokens);
  const isSearchMode = searchTokens.length > 0;

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

  let query = base;
  if (isSearchMode) {
    query = query.where('searchKeywords', 'array-contains', longestToken);
    query = query.orderBy(FieldPath.documentId(), 'asc');
  } else {
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

  let countQuery: Query = base;
  if (isSearchMode) {
    countQuery = countQuery.where('searchKeywords', 'array-contains', longestToken);
  }

  const batchCap = isSearchMode ? options.pageSize * 4 : options.pageSize;
  const [countSnapshot, snapshot] = await Promise.all([
    countQuery.count().get(),
    query.limit(batchCap + 1).get(),
  ]);

  const pageDocs: QueryDocumentSnapshot[] = [];
  let boundaryDoc: QueryDocumentSnapshot | null = null;
  let hasMore = false;

  for (let i = 0; i < snapshot.docs.length; i++) {
    const doc = snapshot.docs[i];
    const data = doc.data();

    if (isSearchMode && searchTokens.length > 1) {
      const keywords = Array.isArray(data.searchKeywords) ? (data.searchKeywords as string[]) : [];
      const text = `${data.name || ''} ${data.brand || ''} ${data.sku || ''} ${data.productId || ''}`.toLowerCase();
      const allMatch = searchTokens.every(t => keywords.includes(t) || text.includes(t));
      if (!allMatch) continue;
    }

    if (pageDocs.length < options.pageSize) {
      pageDocs.push(doc);
      boundaryDoc = doc;
    } else {
      hasMore = true;
      break;
    }
  }

  return {
    products: pageDocs.map(document => toPublicCatalogPart(document.data() as Part)),
    count: countSnapshot.data().count,
    nextCursor: hasMore && boundaryDoc ? Buffer.from(boundaryDoc.ref.path).toString('base64url') : null,
    brandFacets,
  };
}
