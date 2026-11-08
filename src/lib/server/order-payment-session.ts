import type { DocumentReference } from 'firebase-admin/firestore';
import type { Order } from '@/lib/types';
import { writeOrderChange, type ActivityActor } from './order-activity';

export async function saveOrderPaymentSession(ref: DocumentReference, patch: Record<string, unknown>, actor: ActivityActor) {
  await ref.firestore.runTransaction(async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error('Order not found.');
    const order = snap.data() as Order;
    if (order.status === 'cancelled' || order.isArchived || order.paymentStatus === 'paid' || order.paymentMethod !== 'paymongo_simulated') {
      throw new Error('The order changed while payment was being prepared. Refresh the order.');
    }
    writeOrderChange(tx, ref, order, patch, actor);
  });
}
