import { FieldPath, type Query, type QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/firebase/server-init';
import { getOrderActor } from './order-auth';
import { adminInventoryQuerySchema, type AdminInventoryQuery } from '@/lib/admin-inventory-query';
import { getCatalogMeta } from './catalog-meta-store';
import { parseSearchQueryTokens, findLongestSearchToken } from '@/lib/catalog-meta';
import type { Part } from '@/lib/types';

const SORT_FIELDS: Record<AdminInventoryQuery['sortBy'], string> = {
  'Date Added': 'createdAtSort',
  Name: 'nameSort',
  Price: 'price',
  Brand: 'brandSort',
  Stock: 'stock',
};

export interface AdminInventoryPage {
  parts: Part[];
  count: number;
  nextCursor: string | null;
  brandFacets?: string[];
}

export async function listAdminInventoryPage(idToken: string, rawOptions: unknown): Promise<AdminInventoryPage> {
  const { isStaff } = await getOrderActor(idToken);
  if (!isStaff) throw new Error('Staff access required.');
  const options = adminInventoryQuerySchema.parse(rawOptions);
  if (options.categories.length === 0) return { parts: [], count: 0, nextCursor: null, brandFacets: [] };

  const db = getAdminFirestore();
  const meta = await getCatalogMeta(db);
  const brandFacets = Array.from(
    new Set(
      options.categories.flatMap(cat => meta.brandsByCategory[cat] || [])
    )
  ).sort();

  const searchTokens = parseSearchQueryTokens(options.search);
  const longestToken = findLongestSearchToken(searchTokens);
  const isSearchMode = searchTokens.length > 0;
  const normalizedBrands = options.brands.map(b => b.trim().toLowerCase()).filter(Boolean);

  let query: Query = db.collectionGroup('items')
    .where('inventoryQueryVersion', '==', 1)
    .where('isArchived', '==', false);

  if (isSearchMode) {
    if (options.categories.length === 1) {
      query = query.where('category', '==', options.categories[0]);
    }
  } else {
    if (options.categories.length === 1) {
      query = query.where('category', '==', options.categories[0]);
    } else {
      query = query.where('category', 'in', options.categories);
    }
  }

  if (options.availability === 'in-stock') {
    query = query.where('inStock', '==', true);
  } else if (options.availability === 'out-of-stock') {
    query = query.where('inStock', '==', false);
  }

  if (normalizedBrands.length === 1) {
    query = query.where('brandSort', '==', normalizedBrands[0]);
  }

  if (isSearchMode) {
    query = query.where('searchKeywords', 'array-contains', longestToken);
    query = query.orderBy(FieldPath.documentId(), 'asc');
  } else {
    const field = SORT_FIELDS[options.sortBy];
    query = query.orderBy(field, options.sortDirection)
      .orderBy(FieldPath.documentId(), options.sortDirection);
  }

  if (options.cursor) {
    const path = Buffer.from(options.cursor, 'base64url').toString('utf8');
    if (!/^inventory\/[a-z]+\/items\/[^/]+$/.test(path)) throw new Error('Invalid inventory cursor.');
    const cursorDoc = await db.doc(path).get();
    if (!cursorDoc.exists || cursorDoc.get('inventoryQueryVersion') !== 1 || cursorDoc.get('isArchived') !== false ||
      !options.categories.includes(String(cursorDoc.get('category')))) throw new Error('Inventory cursor is stale.');
    query = query.startAfter(cursorDoc);
  }

  let countQuery: Query = db.collectionGroup('items')
    .where('inventoryQueryVersion', '==', 1)
    .where('isArchived', '==', false);

  if (isSearchMode) {
    if (options.categories.length === 1) {
      countQuery = countQuery.where('category', '==', options.categories[0]);
    }
  } else {
    if (options.categories.length === 1) {
      countQuery = countQuery.where('category', '==', options.categories[0]);
    } else {
      countQuery = countQuery.where('category', 'in', options.categories);
    }
  }

  if (options.availability === 'in-stock') {
    countQuery = countQuery.where('inStock', '==', true);
  } else if (options.availability === 'out-of-stock') {
    countQuery = countQuery.where('inStock', '==', false);
  }
  if (normalizedBrands.length === 1) {
    countQuery = countQuery.where('brandSort', '==', normalizedBrands[0]);
  }
  if (isSearchMode) {
    countQuery = countQuery.where('searchKeywords', 'array-contains', longestToken);
  }

  const batchCap = isSearchMode || normalizedBrands.length > 1 || (options.categories.length > 1 && isSearchMode)
    ? options.pageSize * 4
    : options.pageSize;

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

    if (isSearchMode && options.categories.length > 1 && options.categories.length < 12) {
      if (!options.categories.includes(String(data.category))) continue;
    }

    if (normalizedBrands.length > 1) {
      const b = String(data.brandSort || '').trim().toLowerCase();
      if (!normalizedBrands.includes(b)) continue;
    }

    if (isSearchMode && searchTokens.length > 1) {
      const keywords = Array.isArray(data.searchKeywords) ? (data.searchKeywords as string[]) : [];
      const text = `${data.name || ''} ${data.brand || ''} ${data.sku || ''} ${data.productId || ''}`.toLowerCase();
      const allMatch = searchTokens.every(token => keywords.includes(token) || text.includes(token));
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
    parts: pageDocs.map(document => {
      const data = document.data();
      const createdAt = data.createdAt;
      return {
        ...data,
        id: document.id,
        createdAt: createdAt && typeof createdAt.toDate === 'function' ? createdAt.toDate().toISOString() : createdAt,
      } as Part;
    }),
    count: countSnapshot.data().count,
    nextCursor: hasMore && boundaryDoc ? Buffer.from(boundaryDoc.ref.path).toString('base64url') : null,
    brandFacets,
  };
}
