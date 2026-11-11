import { FieldPath, type Query } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/firebase/server-init';
import { getOrderActor } from './order-auth';
import { adminInventoryQuerySchema, type AdminInventoryQuery } from '@/lib/admin-inventory-query';
import { getCatalogMeta } from './catalog-meta-store';
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

  let query: Query = db.collectionGroup('items')
    .where('inventoryQueryVersion', '==', 1)
    .where('isArchived', '==', false);

  if (options.categories.length < 12) {
    query = query.where('category', 'in', options.categories);
  }

  if (options.availability === 'in-stock') {
    query = query.where('inStock', '==', true);
  } else if (options.availability === 'out-of-stock') {
    query = query.where('inStock', '==', false);
  }

  const normalizedBrands = options.brands.map(b => b.trim().toLowerCase()).filter(Boolean);
  if (normalizedBrands.length === 1) {
    query = query.where('brandSort', '==', normalizedBrands[0]);
  } else if (normalizedBrands.length > 1 && options.categories.length === 12) {
    query = query.where('brandSort', 'in', normalizedBrands);
  }

  const searchTrimmed = options.search.trim().toLowerCase();
  const searchTokens = searchTrimmed
    ? searchTrimmed.split(/[^a-z0-9]+/).filter(Boolean)
    : [];

  let longestToken = '';
  if (searchTokens.length > 0) {
    for (const token of searchTokens) {
      if (token.length > longestToken.length) {
        longestToken = token;
      }
    }
    query = query.where('searchKeywords', 'array-contains', longestToken);
  }

  const field = SORT_FIELDS[options.sortBy];
  if (searchTokens.length === 0) {
    query = query.orderBy(field, options.sortDirection)
      .orderBy(FieldPath.documentId(), options.sortDirection);
  } else {
    query = query.orderBy(FieldPath.documentId(), options.sortDirection);
  }

  if (options.cursor) {
    const path = Buffer.from(options.cursor, 'base64url').toString('utf8');
    if (!/^inventory\/[a-z]+\/items\/[^/]+$/.test(path)) throw new Error('Invalid inventory cursor.');
    const cursorDoc = await db.doc(path).get();
    if (!cursorDoc.exists || cursorDoc.get('inventoryQueryVersion') !== 1 || cursorDoc.get('isArchived') !== false ||
      !options.categories.includes(String(cursorDoc.get('category')))) throw new Error('Inventory cursor is stale.');
    query = query.startAfter(cursorDoc);
  }

  const batchCap = searchTokens.length > 1 || (normalizedBrands.length > 1 && options.categories.length < 12)
    ? options.pageSize * 3
    : options.pageSize;

  let countQuery: Query = db.collectionGroup('items')
    .where('inventoryQueryVersion', '==', 1)
    .where('isArchived', '==', false);
  if (options.categories.length < 12) {
    countQuery = countQuery.where('category', 'in', options.categories);
  }
  if (options.availability === 'in-stock') {
    countQuery = countQuery.where('inStock', '==', true);
  } else if (options.availability === 'out-of-stock') {
    countQuery = countQuery.where('inStock', '==', false);
  }
  if (normalizedBrands.length === 1) {
    countQuery = countQuery.where('brandSort', '==', normalizedBrands[0]);
  }
  if (longestToken) {
    countQuery = countQuery.where('searchKeywords', 'array-contains', longestToken);
  }

  const [countSnapshot, snapshot] = await Promise.all([
    countQuery.count().get(),
    query.limit(batchCap + 1).get(),
  ]);

  let matchingDocs = snapshot.docs;

  if (normalizedBrands.length > 1 && options.categories.length < 12) {
    matchingDocs = matchingDocs.filter(doc => {
      const b = String(doc.get('brandSort') || '').trim().toLowerCase();
      return normalizedBrands.includes(b);
    });
  }

  if (searchTokens.length > 1) {
    matchingDocs = matchingDocs.filter(doc => {
      const data = doc.data();
      const keywords = Array.isArray(data.searchKeywords) ? (data.searchKeywords as string[]) : [];
      const text = `${data.name || ''} ${data.brand || ''} ${data.sku || ''} ${data.productId || ''}`.toLowerCase();
      return searchTokens.every(token => keywords.includes(token) || text.includes(token));
    });
  }

  if (searchTokens.length > 0) {
    matchingDocs.sort((a, b) => {
      const dataA = a.data();
      const dataB = b.data();
      let comp = 0;
      if (options.sortBy === 'Name') {
        comp = String(dataA.nameSort || dataA.name || '').localeCompare(String(dataB.nameSort || dataB.name || ''));
      } else if (options.sortBy === 'Price') {
        comp = (Number(dataA.price) || 0) - (Number(dataB.price) || 0);
      } else if (options.sortBy === 'Brand') {
        comp = String(dataA.brandSort || dataA.brand || '').localeCompare(String(dataB.brandSort || dataB.brand || ''));
      } else if (options.sortBy === 'Stock') {
        comp = (Number(dataA.stock) || 0) - (Number(dataB.stock) || 0);
      } else {
        comp = (Number(dataA.createdAtSort) || 0) - (Number(dataB.createdAtSort) || 0);
      }
      return options.sortDirection === 'asc' ? comp : -comp;
    });
  }

  const hasMore = matchingDocs.length > options.pageSize || snapshot.docs.length > batchCap;
  const page = matchingDocs.slice(0, options.pageSize);

  return {
    parts: page.map(document => {
      const data = document.data();
      const createdAt = data.createdAt;
      return {
        ...data,
        id: document.id,
        createdAt: createdAt && typeof createdAt.toDate === 'function' ? createdAt.toDate().toISOString() : createdAt,
      } as Part;
    }),
    count: countSnapshot.data().count,
    nextCursor: hasMore && page.length ? Buffer.from(page[page.length - 1].ref.path).toString('base64url') : null,
    brandFacets,
  };
}
