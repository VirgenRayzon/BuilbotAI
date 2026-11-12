import { z } from 'zod';
import { FieldPath, type Query } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminFirestore } from '@/firebase/server-init';
import { getOrderActor } from './order-auth';
import type { AuditLog, UserAuditLog } from '@/lib/types';

export const AuditLogQuerySchema = z.object({
  scope: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  pageSize: z.number().int().min(1).max(50).default(25),
  cursor: z.string().nullable().optional(),
  sortBy: z.enum(['newest', 'oldest']).default('newest'),
  search: z.string().optional(),
});

export const auditLogQuerySchema = AuditLogQuerySchema;
export type AuditLogQuery = z.infer<typeof AuditLogQuerySchema>;

export interface StaffAuditLogsPageResult {
  logs: AuditLog[];
  totalCount: number;
  nextCursor: string | null;
  hasMore: boolean;
}

export interface UserAuditLogsPageResult {
  logs: UserAuditLog[];
  totalCount: number;
  nextCursor: string | null;
  hasMore: boolean;
}

export interface AuditLogQueryDeps {
  verifyStaffToken?: (idToken: string) => Promise<{
    decoded: { uid: string; email?: string; [key: string]: unknown };
    isStaff: boolean;
    isManager: boolean;
    isSuperAdmin: boolean;
  }>;
  verifyUserToken?: (idToken: string) => Promise<{
    uid: string;
    email?: string;
    [key: string]: unknown;
  }>;
  firestore?: FirebaseFirestore.Firestore;
}

function serializeTimestamp(value: unknown): string | null {
  if (!value) return null;
  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof (value as { seconds?: number }).seconds === 'number') {
    return new Date((value as { seconds: number }).seconds * 1000).toISOString();
  }
  if (typeof value === 'string') {
    return value;
  }
  return null;
}

export async function listStaffAuditLogsPage(
  idToken: string,
  rawOptions?: unknown,
  deps?: AuditLogQueryDeps
): Promise<StaffAuditLogsPageResult> {
  const actor = deps?.verifyStaffToken
    ? await deps.verifyStaffToken(idToken)
    : await getOrderActor(idToken);

  if (!actor || !actor.isStaff) {
    throw new Error('Unauthorized: Staff access required');
  }

  const options = AuditLogQuerySchema.parse(rawOptions ?? {});
  const db = deps?.firestore || getAdminFirestore();

  let query: Query = db.collection('auditLogs');

  if (options.scope && options.scope !== 'all') {
    query = query.where('scope', '==', options.scope);
  }

  if (options.fromDate) {
    query = query.where('createdAt', '>=', new Date(options.fromDate));
  }

  if (options.toDate) {
    query = query.where('createdAt', '<=', new Date(options.toDate));
  }

  const countSnap = await query.count().get();
  const totalCount = countSnap.data().count;

  const sortDirection = options.sortBy === 'oldest' ? 'asc' : 'desc';
  const docIdPath = FieldPath ? FieldPath.documentId() : '__name__';
  query = query.orderBy('createdAt', sortDirection).orderBy(docIdPath, sortDirection);

  if (options.cursor) {
    const cursorRef = db.doc
      ? db.doc(`auditLogs/${options.cursor}`)
      : db.collection('auditLogs').doc(options.cursor);
    const cursorDoc = await cursorRef.get();
    if (cursorDoc && cursorDoc.exists) {
      query = query.startAfter(cursorDoc);
    }
  }

  const queryLimit = options.pageSize + 1;
  const snapshot = await query.limit(queryLimit).get();
  const docs = snapshot.docs || [];
  const hasMore = docs.length > options.pageSize;
  const slicedDocs = hasMore ? docs.slice(0, options.pageSize) : docs;
  const nextCursor = hasMore && slicedDocs.length > 0 ? slicedDocs[slicedDocs.length - 1].id : null;

  const logs: AuditLog[] = slicedDocs.map((doc) => {
    const data = (doc.data ? doc.data() : doc) as Record<string, unknown>;
    const rawScope = data.scope || (data as Record<string, unknown>).resourceType;
    return {
      id: doc.id,
      actionName: (data.actionName as AuditLog['actionName']) || 'other',
      actorId: String(data.actorId || ''),
      actorName: String(data.actorName || ''),
      actorEmail: typeof data.actorEmail === 'string' ? data.actorEmail : undefined,
      scope: (rawScope || 'System') as AuditLog['scope'],
      resourceName: String(data.resourceName || ''),
      resourceId: typeof data.resourceId === 'string' ? data.resourceId : undefined,
      details: typeof data.details === 'string' ? data.details : undefined,
      createdAt: serializeTimestamp(data.createdAt) || new Date().toISOString(),
      expiresAt: serializeTimestamp(data.expiresAt) || undefined,
    };
  });

  return {
    logs,
    totalCount,
    nextCursor,
    hasMore,
  };
}

export async function listUserAuditLogsPage(
  idToken: string,
  rawOptions?: unknown,
  deps?: AuditLogQueryDeps
): Promise<UserAuditLogsPageResult> {
  const user = deps?.verifyUserToken
    ? await deps.verifyUserToken(idToken)
    : await getAdminAuth().verifyIdToken(idToken, true);

  if (!user || !user.uid) {
    throw new Error('Unauthorized: Valid user token required');
  }

  const uid = user.uid;
  const options = AuditLogQuerySchema.parse(rawOptions ?? {});
  const db = deps?.firestore || getAdminFirestore();

  let query: Query = db.collection('user_auditLogs').where('userId', '==', uid);

  if (options.scope && options.scope !== 'all') {
    query = query.where('scope', '==', options.scope);
  }

  if (options.fromDate) {
    query = query.where('createdAt', '>=', new Date(options.fromDate));
  }

  if (options.toDate) {
    query = query.where('createdAt', '<=', new Date(options.toDate));
  }

  const countSnap = await query.count().get();
  const totalCount = countSnap.data().count;

  const sortDirection = options.sortBy === 'oldest' ? 'asc' : 'desc';
  const docIdPath = FieldPath ? FieldPath.documentId() : '__name__';
  query = query.orderBy('createdAt', sortDirection).orderBy(docIdPath, sortDirection);

  if (options.cursor) {
    const cursorRef = db.doc
      ? db.doc(`user_auditLogs/${options.cursor}`)
      : db.collection('user_auditLogs').doc(options.cursor);
    const cursorDoc = await cursorRef.get();
    if (cursorDoc && cursorDoc.exists) {
      query = query.startAfter(cursorDoc);
    }
  }

  const queryLimit = options.pageSize + 1;
  const snapshot = await query.limit(queryLimit).get();
  const docs = snapshot.docs || [];
  const hasMore = docs.length > options.pageSize;
  const slicedDocs = hasMore ? docs.slice(0, options.pageSize) : docs;
  const nextCursor = hasMore && slicedDocs.length > 0 ? slicedDocs[slicedDocs.length - 1].id : null;

  const logs: UserAuditLog[] = slicedDocs.map((doc) => {
    const data = (doc.data ? doc.data() : doc) as Record<string, unknown>;
    return {
      id: doc.id,
      userId: uid,
      userEmail: typeof data.userEmail === 'string' ? data.userEmail : (user.email as string | undefined),
      actionName: (data.actionName as UserAuditLog['actionName']) || 'other',
      scope: (data.scope || 'System') as UserAuditLog['scope'],
      resourceName: String(data.resourceName || ''),
      resourceId: typeof data.resourceId === 'string' ? data.resourceId : undefined,
      details: typeof data.details === 'string' ? data.details : undefined,
      createdAt: serializeTimestamp(data.createdAt) || new Date().toISOString(),
      expiresAt: serializeTimestamp(data.expiresAt) || undefined,
    };
  });

  return {
    logs,
    totalCount,
    nextCursor,
    hasMore,
  };
}
