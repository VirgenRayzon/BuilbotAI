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
  isIndexedEnabled?: boolean;
}

function getDocTimestamp(val: unknown): number {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  if (typeof (val as { toDate?: () => Date }).toDate === 'function') {
    return (val as { toDate: () => Date }).toDate().getTime();
  }
  if (val instanceof Date) {
    return val.getTime();
  }
  if (typeof val === 'string') {
    const parsed = Date.parse(val);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function serializePrebuilt(raw: unknown, id: string): PrebuiltSystem {
  const data = { ...(raw as Record<string, unknown>), id } as unknown as PrebuiltSystem;
  const rawObj = raw as Record<string, unknown> | null;

  if (rawObj?.createdAt) {
    const ts = rawObj.createdAt as { toDate?: () => Date } | Date | string | number;
    if (typeof (ts as { toDate?: () => Date }).toDate === 'function') {
      data.createdAt = (ts as { toDate: () => Date }).toDate().toISOString();
    } else if (ts instanceof Date) {
      data.createdAt = ts.toISOString();
    }
  }

  return data;
}

async function listPrebuiltSystemsSafeMode(
  db: any,
  options: PrebuiltPageQuery
): Promise<PrebuiltSystemsPageResult> {
  let query: Query = db.collection('prebuiltSystems');

  if (options.tiers && options.tiers.length === 1) {
    query = query.where('tier', '==', options.tiers[0]);
  } else if (options.tiers && options.tiers.length > 1 && options.tiers.length < 4) {
    query = query.where('tier', 'in', options.tiers);
  }

  const snapshot = await query.get();
  const allDocs: DocumentSnapshot[] = snapshot.docs || [];

  const filtered = allDocs.filter(doc => {
    const data = (doc.data ? doc.data() : doc) as Record<string, unknown>;
    if (!options.includeArchived) {
      return data.isArchived !== true;
    }
    return true;
  });

  const sortBy = options.sortBy.toLowerCase();
  const dir = options.sortDirection === 'asc' ? 1 : -1;

  filtered.sort((docA, docB) => {
    const a = (docA.data ? docA.data() : docA) as PrebuiltSystem;
    const b = (docB.data ? docB.data() : docB) as PrebuiltSystem;
    const idA = docA.id || '';
    const idB = docB.id || '';

    let comp = 0;
    if (sortBy === 'price') {
      comp = (a.price ?? 0) - (b.price ?? 0);
    } else if (sortBy === 'name') {
      comp = String(a.name || '').localeCompare(String(b.name || ''));
    } else if (sortBy === 'tier') {
      comp = String(a.tier || '').localeCompare(String(b.tier || ''));
    } else {
      const timeA = getDocTimestamp(a.createdAt);
      const timeB = getDocTimestamp(b.createdAt);
      comp = timeA - timeB;
    }

    if (comp === 0) {
      return idA.localeCompare(idB) * dir;
    }
    return comp * dir;
  });

  let startIndex = 0;
  if (options.cursor) {
    const cursorIdx = filtered.findIndex(d => d.id === options.cursor);
    if (cursorIdx !== -1) {
      startIndex = cursorIdx + 1;
    }
  }

  const pagedDocs = filtered.slice(startIndex, startIndex + options.pageSize);
  const hasMore = startIndex + options.pageSize < filtered.length;
  const items: PrebuiltSystem[] = pagedDocs.map(doc => {
    const data = (doc.data ? doc.data() : doc) as PrebuiltSystem;
    return serializePrebuilt(data, doc.id);
  });
  const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : null;

  return {
    items,
    nextCursor,
    hasMore,
  };
}

export async function listPrebuiltSystemsPage(
  rawOptions?: unknown,
  deps?: PrebuiltQueryDeps
): Promise<PrebuiltSystemsPageResult> {
  const options = prebuiltPageQuerySchema.parse(rawOptions ?? {});
  const db = deps?.firestore || getAdminFirestore();

  const isIndexedMode =
    deps?.isIndexedEnabled ??
    (deps?.firestore ? true : process.env.NEXT_PUBLIC_PREBUILTS_INDEXED_ENABLED === 'true');

  if (isIndexedMode) {
    try {
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

      // If indexed query returns 0 items on the initial page, fall back to safe mode
      // to handle cases where legacy documents do not yet have isArchived: false backfilled
      if (docs.length === 0 && !options.cursor) {
        return listPrebuiltSystemsSafeMode(db, options);
      }

      const hasMore = docs.length > options.pageSize;
      const slicedDocs = hasMore ? docs.slice(0, options.pageSize) : docs;

      const items: PrebuiltSystem[] = slicedDocs.map(doc => {
        const data = (doc.data ? doc.data() : doc) as PrebuiltSystem;
        return serializePrebuilt(data, doc.id);
      });

      const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : null;

      return {
        items,
        nextCursor,
        hasMore,
      };
    } catch (error) {
      console.warn('[prebuilt-queries] Indexed query failed, falling back to safe mode:', error);
      return listPrebuiltSystemsSafeMode(db, options);
    }
  }

  return listPrebuiltSystemsSafeMode(db, options);
}
