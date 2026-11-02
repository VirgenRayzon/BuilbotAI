import { createHash } from 'node:crypto';
import type { Firestore, Transaction } from 'firebase-admin/firestore';
import { Timestamp } from 'firebase-admin/firestore';

export interface OrderOperation { operationId: string; expectedRevision: number }

export async function runOrderOperation<T>(db: Firestore, orderId: string, actorId: string,
  operation: { operationId: string; expectedRevision?: number } | undefined, payload: unknown, work: (tx: Transaction) => Promise<T>): Promise<T> {
  const fingerprint = createHash('sha256').update(JSON.stringify({ actorId, payload, expectedRevision: operation?.expectedRevision })).digest('hex');
  const ref = operation ? db.collection('orderWorkflowOperations').doc(`${orderId}_${operation.operationId}`) : null;
  return db.runTransaction(async tx => {
    if (ref) {
      const previous = await tx.get(ref);
      if (previous.exists) {
        if (previous.get('fingerprint') !== fingerprint) throw new Error('This operation ID was already used for a different request.');
        return previous.get('result') as T;
      }
      const order = await tx.get(db.collection('orders').doc(orderId));
      if (!order.exists) throw new Error('Order not found.');
      if (operation?.expectedRevision !== undefined && (order.get('workflowRevision') || 0) !== operation.expectedRevision) throw new Error('This order changed. Refresh and review it before confirming again.');
    }
    const result = await work(tx);
    if (ref) tx.create(ref, { fingerprint, result: result ?? null, createdAt: Timestamp.now(), actorId, orderId });
    return result;
  });
}
