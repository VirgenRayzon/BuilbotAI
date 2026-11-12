import { z } from 'zod';
import { getAdminFirestore } from '@/firebase/server-init';
import { FieldPath, type Query, type DocumentSnapshot } from 'firebase-admin/firestore';
import type { PrebuiltSystem } from '../types';

export const prebuiltPageQuerySchema = z.object({
  includeArchived: z.boolean().default(false),
  tiers: z.array(z.string()).optional(),
  sortBy: z.enum([
    'Date Added',
    'Price',
    'Name',
    'Tier',
    'createdAt',
    'price',
    'name',
    'tier',
  ]).default('Date Added'),
  sortDirection: z.enum(['asc', 'desc']).default('desc'),
  pageSize: z
    .number()
    .int()
    .positive()
    .default(24)
    .transform(val => Math.min(val, 24)),
  cursor: z.string().nullable().optional(),
});

export type PrebuiltPageQuery = z.infer<typeof prebuiltPageQuerySchema>;

export interface PrebuiltSystemsPageResult {
  items: PrebuiltSystem[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface PrebuiltQueryDeps {
  firestore?: any;
}

export async function listPrebuiltSystemsPage(
  rawOptions?: unknown,
  deps?: PrebuiltQueryDeps
): Promise<PrebuiltSystemsPageResult> {
  const options = prebuiltPageQuerySchema.parse(rawOptions ?? {});
  const db = deps?.firestore || getAdminFirestore();

  let query: Query = db.collection('prebuiltSystems');

  if (!options.includeArchived) {
    query = query.where('isArchived', '==', false);
  }

  if (options.tiers && options.tiers.length > 0 && options.tiers.length < 4) {
    if (options.tiers.length === 1) {
      query = query.where('tier', '==', options.tiers[0]);
    } else {
      query = query.where('tier', 'in', options.tiers);
    }
  }

  const sortDirection = options.sortDirection;
  const sortBy = options.sortBy.toLowerCase();

  const docIdPath = FieldPath ? FieldPath.documentId() : '__name__';

  if (sortBy === 'price') {
    query = query.orderBy('price', sortDirection).orderBy(docIdPath, sortDirection);
  } else if (sortBy === 'name') {
    query = query.orderBy('name', sortDirection).orderBy(docIdPath, sortDirection);
  } else if (sortBy === 'tier') {
    query = query.orderBy('tier', sortDirection).orderBy(docIdPath, sortDirection);
  } else {
    query = query.orderBy('createdAt', sortDirection).orderBy(docIdPath, sortDirection);
  }

  if (options.cursor) {
    const cursorRef = db.doc
      ? db.doc(`prebuiltSystems/${options.cursor}`)
      : db.collection('prebuiltSystems').doc(options.cursor);
    const cursorSnap = await cursorRef.get();
    if (cursorSnap && cursorSnap.exists) {
      query = query.startAfter(cursorSnap);
    }
  }

  // Request pageSize + 1 to detect hasMore deterministically
  const queryLimit = options.pageSize + 1;
  const snapshot = await query.limit(queryLimit).get();

  const docs: DocumentSnapshot[] = snapshot.docs || [];
  const hasMore = docs.length > options.pageSize;
  const slicedDocs = hasMore ? docs.slice(0, options.pageSize) : docs;

  const items: PrebuiltSystem[] = slicedDocs.map(doc => {
    const data = (doc.data ? doc.data() : doc) as PrebuiltSystem;
    return {
      ...data,
      id: doc.id,
    };
  });

  const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : null;

  return {
    items,
    nextCursor,
    hasMore,
  };
}

export async function fetchPrebuiltSystemsPageAction(rawOptions: unknown) {
  'use server';
  try {
    const result = await listPrebuiltSystemsPage(rawOptions);
    return { success: true as const, ...result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not fetch prebuilt systems.';
    return { success: false as const, error: message, items: [], nextCursor: null, hasMore: false };
  }
}
