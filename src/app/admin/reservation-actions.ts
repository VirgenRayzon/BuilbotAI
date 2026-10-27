"use server";

import * as admin from 'firebase-admin';
import { z } from 'zod';
import { getAdminAuth, getAdminFirestore } from '@/firebase/server-init';
import { inventoryItemPath } from '@/lib/inventory-paths';
import type { Order } from '@/lib/types';
import { invalidatePublicPartsCatalog } from '@/lib/server/public-products';
import { INCLUDED_INTEGRATED_GPU_ID } from '@/lib/integrated-graphics';

const requestSchema = z.object({
    orderId: z.string().min(1).max(128).regex(/^[a-zA-Z0-9_-]+$/),
    action: z.enum(['archive', 'restore', 'delete']),
    idToken: z.string().min(1),
});

export async function manageReservation(input: z.infer<typeof requestSchema>) {
    const parsed = requestSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: 'Invalid reservation request.' };

    try {
        const { orderId, action, idToken } = parsed.data;
        const auth = getAdminAuth();
        const decoded = await auth.verifyIdToken(idToken, true);
        const firestore = getAdminFirestore();
        const actorSnap = await firestore.collection('users').doc(decoded.uid).get();
        const actor = actorSnap.data();
        const isAdmin = actor?.isSuperAdmin === true && decoded.isSuperAdmin === true;
        const isManager = isAdmin || (actor?.isManager === true && decoded.isManager === true);

        if (!isManager || (action === 'delete' && !isAdmin)) {
            return { success: false, error: 'You do not have permission to perform this action.' };
        }

        await firestore.runTransaction(async (transaction) => {
            const orderRef = firestore.collection('orders').doc(orderId);
            const orderSnap = await transaction.get(orderRef);
            if (!orderSnap.exists) throw new Error('Reservation not found.');

            const order = orderSnap.data() as Order;
            if (action === 'restore' && !order.isArchived) throw new Error('Reservation is not archived.');
            if (action === 'archive' && order.isArchived) throw new Error('Reservation is already archived.');

            const isFinished = order.status === 'finished building' || (order.status as string) === 'finished';
            const shouldCancel = action !== 'restore' && !isFinished && order.status !== 'cancelled';
            const finalStatus = shouldCancel ? 'cancelled' : isFinished ? 'finished building' : order.status;
            const now = admin.firestore.Timestamp.now();

            // Cancellation returns reserved components once. Finished builds keep their stock and status.
            if (shouldCancel) {
                for (const item of order.items || []) {
                    if (item.id === 'included-stock-cooler' || item.id === INCLUDED_INTEGRATED_GPU_ID) continue;
                    transaction.update(firestore.doc(inventoryItemPath(item.category, item.id)), {
                        stock: admin.firestore.FieldValue.increment(1),
                    });
                }
            }

            if (action === 'delete') {
                transaction.delete(orderRef);
            } else if (action === 'archive') {
                transaction.update(orderRef, {
                    status: finalStatus,
                    isArchived: true,
                    archivedAt: now,
                    archivedBy: decoded.uid,
                    updatedAt: now,
                });
            } else {
                transaction.update(orderRef, {
                    isArchived: false,
                    archivedAt: admin.firestore.FieldValue.delete(),
                    archivedBy: admin.firestore.FieldValue.delete(),
                    updatedAt: now,
                });
            }

            if (shouldCancel) {
                const notificationRef = firestore.collection('users').doc(order.userId).collection('notifications').doc();
                transaction.set(notificationRef, {
                    id: notificationRef.id,
                    userId: order.userId,
                    orderId,
                    title: 'Build Cancelled',
                    message: 'Your reservation has been cancelled. Any reserved stock has been returned to inventory.',
                    status: 'cancelled',
                    read: false,
                    createdAt: now,
                });
            }

            const auditRef = firestore.collection('auditLogs').doc();
            transaction.set(auditRef, {
                id: auditRef.id,
                actionName: action === 'delete' ? 'deleted' : action === 'archive' ? 'archived' : 'restored',
                actorId: decoded.uid,
                actorName: actor?.name || actor?.email || decoded.email || 'Staff',
                actorEmail: actor?.email || decoded.email || '',
                scope: 'Order',
                resourceName: `Reservation #${orderId.substring(0, 8)}`,
                resourceId: orderId,
                details: `${action} reservation; final status: ${finalStatus}`,
                createdAt: now,
            });
        });
        if (action !== 'restore') invalidatePublicPartsCatalog();

        return { success: true };
    } catch (error) {
        console.error('Reservation management failed:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Reservation action failed.' };
    }
}
