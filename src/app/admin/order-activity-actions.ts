'use server';

import { FieldPath, Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';
import { getOrderActor } from '@/lib/server/order-auth';
import type { OrderActivity } from '@/lib/order-activity';

const cursorSchema = z.object({ value: z.union([z.number().finite().nonnegative(), z.string().max(100)]), id: z.string().min(1).max(128) });
const requestSchema = z.object({ orderId: z.string().regex(/^[\w-]{1,128}$/), idToken: z.string().min(1),
  cursor: cursorSchema.optional(), auditCursor: cursorSchema.optional(), activityDone: z.boolean().optional(), auditDone: z.boolean().optional() });

export async function getOrderActivity(input: z.infer<typeof requestSchema>) {
  try {
    const data = requestSchema.parse(input);
    const { firestore, isStaff, decoded } = await getOrderActor(data.idToken);
    const orderRef = firestore.collection('orders').doc(data.orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) throw new Error('Order not found.');
    const orderData = orderSnap.data();
    if (!isStaff && orderData?.userId !== decoded.uid) {
      throw new Error('Only staff or the order owner can read order activity.');
    }
    const page = async (audit: boolean) => {
      if (audit && !isStaff) return { events: [] as OrderActivity[], done: true };
      if (audit ? data.auditDone : data.activityDone) return { events: [] as OrderActivity[], done: true };
      const cursor = audit ? data.auditCursor : data.cursor;
      let query = audit ? firestore.collection('auditLogs').where('resourceId', '==', data.orderId)
        : orderRef.collection('activity').orderBy('createdAt', 'desc');
      if (audit) query = query.orderBy('createdAt', 'desc');
      query = query.orderBy(FieldPath.documentId(), 'desc');
      if (cursor) query = query.startAfter(typeof cursor.value === 'number' ? Timestamp.fromMillis(cursor.value) : cursor.value, cursor.id);
      const snap = await query.limit(30).get();
      const events: OrderActivity[] = [];
      for (const doc of snap.docs) {
        const raw = doc.data();
        if (audit && (raw.scope !== 'Order' || raw.activityRecorded)) continue;
        events.push({ id: audit ? `audit:${doc.id}` : doc.id, type: audit ? String(raw.actionName || 'legacy') : String(raw.type),
          details: String(raw.details || ''), actorName: String(raw.actorName || 'Unknown account'),
          actorId: typeof raw.actorId === 'string' ? raw.actorId : undefined,
          actorRole: String(raw.actorRole || (audit ? 'Historical record' : 'System')),
          createdAt: raw.createdAt instanceof Timestamp ? raw.createdAt.toDate().toISOString() : typeof raw.createdAt === 'string' ? raw.createdAt : null,
          ...(typeof raw.sourceId === 'string' ? { sourceId: raw.sourceId } : {}),
          ...(audit ? { inferred: true } : {}) });
      }
      const last = snap.docs.at(-1);
      return { events, done: snap.size < 30, cursor: last ? { value: last.get('createdAt') instanceof Timestamp ? (last.get('createdAt') as Timestamp).toMillis() : String(last.get('createdAt')), id: last.id } : undefined };
    };
    const [activity, audit] = await Promise.all([page(false), page(true)]);
    return { success: true as const, events: [...activity.events, ...audit.events], cursor: activity.cursor,
      auditCursor: audit.cursor, activityDone: activity.done, auditDone: audit.done };
  } catch (error) {
    const missingIndex = error instanceof Error && /requires an index|FAILED_PRECONDITION/.test(error.message);
    return { success: false as const, error: missingIndex ? 'Order history is awaiting administrator setup. Existing payment and refund details are available below.'
      : error instanceof Error ? error.message : 'Unable to load order activity.' };
  }
}
