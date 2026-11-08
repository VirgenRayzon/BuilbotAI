import { z } from 'zod';
import { getAdminFirestore } from '@/firebase/server-init';
import type { PublicCatalogPart } from '@/lib/public-product-types';
import type { Part } from '@/lib/types';
import { toPublicCatalogPart } from './public-products';

export interface PublicCatalogPage {
  products: PublicCatalogPart[];
  count: number;
  nextCursor: string | null;
}

const cursorSchema = z.string().max(500).regex(/^[A-Za-z0-9_-]+$/).nullable();

export async function listPublicCatalogPage(rawCursor: unknown = null): Promise<PublicCatalogPage> {
  const cursor = cursorSchema.parse(rawCursor);
  const db = getAdminFirestore();
  const base = db.collectionGroup('items')
    .where('inventoryQueryVersion', '==', 1)
    .where('isArchived', '==', false)
    .where('publicCatalogEligible', '==', true);
  let query = base.orderBy('inStock', 'desc')
    .orderBy('createdAtSort', 'desc')
    .orderBy('productId', 'desc');
  if (cursor) {
    const path = Buffer.from(cursor, 'base64url').toString('utf8');
    if (!/^inventory\/(cpu|gpu|motherboard|ram|storage|psu|case|cooler|monitor|keyboard|mouse|headset)\/items\/[\w-]+$/.test(path)) {
      throw new Error('Invalid catalog cursor.');
    }
    const cursorDoc = await db.doc(path).get();
    if (!cursorDoc.exists || cursorDoc.get('inventoryQueryVersion') !== 1 || cursorDoc.get('isArchived') !== false || cursorDoc.get('publicCatalogEligible') !== true) {
      throw new Error('Catalog cursor is stale.');
    }
    query = query.startAfter(cursorDoc);
  }
  const [countSnapshot, snapshot] = await Promise.all([base.count().get(), query.limit(9).get()]);
  const page = snapshot.docs.slice(0, 8);
  return {
    products: page.map(document => toPublicCatalogPart(document.data() as Part)),
    count: countSnapshot.data().count,
    nextCursor: snapshot.size > 8 && page.length ? Buffer.from(page[page.length - 1].ref.path).toString('base64url') : null,
  };
}
