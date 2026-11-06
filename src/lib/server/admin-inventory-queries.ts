import { FieldPath, type Query } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/firebase/server-init';
import { getOrderActor } from './order-auth';
import { adminInventoryQuerySchema, usesLegacyInventorySearch, type AdminInventoryQuery } from '@/lib/admin-inventory-query';
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
}

export async function listAdminInventoryPage(idToken: string, rawOptions: unknown): Promise<AdminInventoryPage> {
  const { isStaff } = await getOrderActor(idToken);
  if (!isStaff) throw new Error('Staff access required.');
  const options = adminInventoryQuerySchema.parse(rawOptions);
  if (usesLegacyInventorySearch(options) || options.brands.length || options.availability !== 'all') {
    throw new Error('Use the complete inventory view for these filters.');
  }
  if (options.categories.length === 0) return { parts: [], count: 0, nextCursor: null };

  const db = getAdminFirestore();
  let query: Query = db.collectionGroup('items')
    .where('inventoryQueryVersion', '==', 1)
    .where('isArchived', '==', false)
    .where('category', 'in', options.categories);
  const field = SORT_FIELDS[options.sortBy];
  query = query.orderBy(field, options.sortDirection)
    .orderBy(FieldPath.documentId(), options.sortDirection);

  if (options.cursor) {
    const path = Buffer.from(options.cursor, 'base64url').toString('utf8');
    if (!/^inventory\/[a-z]+\/items\/[^/]+$/.test(path)) throw new Error('Invalid inventory cursor.');
    const cursorDoc = await db.doc(path).get();
    if (!cursorDoc.exists || cursorDoc.get('inventoryQueryVersion') !== 1 || cursorDoc.get('isArchived') !== false ||
      !options.categories.includes(String(cursorDoc.get('category')))) throw new Error('Inventory cursor is stale.');
    query = query.startAfter(cursorDoc);
  }

  const [countSnapshot, snapshot] = await Promise.all([
    db.collectionGroup('items').where('inventoryQueryVersion', '==', 1)
      .where('isArchived', '==', false).where('category', 'in', options.categories).count().get(),
    query.limit(options.pageSize + 1).get(),
  ]);
  const hasMore = snapshot.docs.length > options.pageSize;
  const page = snapshot.docs.slice(0, options.pageSize);
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
  };
}
