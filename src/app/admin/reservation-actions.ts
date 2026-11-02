"use server";

import { writeOrderChange } from '@/lib/server/order-activity';
import * as admin from 'firebase-admin';
import { runOrderOperation } from '@/lib/server/order-operations';
import { z } from 'zod';
import { getOrderActor } from '@/lib/server/order-auth';
import type { Order } from '@/lib/types';
import { assertOrderTestEnvironment } from '@/lib/order-permissions';
import { getRefundedAmount } from '@/lib/order-workflow';

const requestSchema = z.object({
    operation: z.object({ operationId: z.string().uuid(), expectedRevision: z.number().int().nonnegative() }).optional(),
    orderId: z.string().min(1).max(128).regex(/^[a-zA-Z0-9_-]+$/),
    action: z.enum(['archive', 'restore', 'delete']),
    idToken: z.string().min(1),
});

export async function manageReservation(input: z.infer<typeof requestSchema>) {
    const parsed = requestSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: 'Invalid reservation request.' };

    try {
        const { orderId, action, idToken } = parsed.data;
        const { decoded, firestore, actorProfile: actor, isSuperAdmin: isAdmin, isStaff: isManager } = await getOrderActor(idToken);

        if (!isManager || (action === 'delete' && !isAdmin)) {
            return { success: false, error: 'You do not have permission to perform this action.' };
        }

        if (action === 'delete') assertOrderTestEnvironment(process.env);

        await runOrderOperation(firestore, orderId, decoded.uid, parsed.data.operation, { action }, async (transaction) => {
            const orderRef = firestore.collection('orders').doc(orderId);
            const orderSnap = await transaction.get(orderRef);
            if (!orderSnap.exists) throw new Error('Order not found.');

            const order = orderSnap.data() as Order;
            if (order.pendingRefundOperationId) {
                throw new Error('Reconcile the pending refund before archiving or deleting this order.');
            }
            if (action === 'restore' && !order.isArchived) throw new Error('Order is not archived.');
            if (action === 'archive' && order.isArchived) throw new Error('Order is already archived.');

            if (action === 'delete' && (order.status !== 'cancelled' ||
                (order.paymentStatus === 'paid' && getRefundedAmount(order) < order.totalPrice))) {
                throw new Error('Only cancelled, fully refunded orders can be permanently deleted.');
            }
            const now = admin.firestore.Timestamp.now();

            if (action === 'delete') {
                transaction.delete(orderRef);
            } else if (action === 'archive') {
                writeOrderChange(transaction, orderRef, order, {
                    isArchived: true,
                    archivedAt: now,
                    archivedBy: decoded.uid,
                    updatedAt: now,
                }, { actorId: decoded.uid, actorName: actor?.name || decoded.email || "Staff", actorRole: isAdmin ? "Super Admin" : "Manager" });
            } else {
                writeOrderChange(transaction, orderRef, order, {
                    isArchived: false,
                    archivedAt: admin.firestore.FieldValue.delete(),
                    archivedBy: admin.firestore.FieldValue.delete(),
                    updatedAt: now,
                }, { actorId: decoded.uid, actorName: actor?.name || decoded.email || "Staff", actorRole: isAdmin ? "Super Admin" : "Manager" });
            }

            const auditRef = firestore.collection('auditLogs').doc();
            transaction.set(auditRef, {
                id: auditRef.id,
                actionName: action === 'delete' ? 'deleted' : action === 'archive' ? 'archived' : 'restored',
                actorId: decoded.uid,
                actorName: actor?.name || actor?.email || decoded.email || 'Staff',
                actorEmail: actor?.email || decoded.email || '',
                scope: 'Order',
                activityRecorded: true,
                resourceName: `Order ${order.orderNumber || orderId.substring(0, 8)}`,
                resourceId: orderId,
                details: `${action} order; fulfillment status unchanged: ${order.status}`,
                createdAt: now,
            });
        });
        return { success: true };
    } catch (error) {
        console.error('Reservation management failed:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Reservation action failed.' };
    }
}

const clearAllOrdersSchema = z.object({
    idToken: z.string().min(1),
});

export async function clearAllOrders(input: z.infer<typeof clearAllOrdersSchema>) {
    const parsed = clearAllOrdersSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: 'Invalid request.' };

    try {
        const { idToken } = parsed.data;
        const { decoded, firestore, actorProfile: actor, isSuperAdmin: isAdmin } = await getOrderActor(idToken);

        if (!isAdmin) {
            return { success: false, error: 'Only Super Administrators can purge all orders and reservations.' };
        }

        assertOrderTestEnvironment(process.env);

        const ordersSnap = await firestore.collection('orders').get();
        const totalCount = ordersSnap.size;

        if (totalCount === 0) {
            return { success: true, count: 0 };
        }

        // Chunk writes in batches of 400
        const chunkSize = 400;
        const docs = ordersSnap.docs;
        for (let i = 0; i < docs.length; i += chunkSize) {
            const batch = firestore.batch();
            const slice = docs.slice(i, i + chunkSize);
            for (const doc of slice) {
                batch.delete(doc.ref);
            }
            await batch.commit();
        }

        const now = admin.firestore.Timestamp.now();
        const auditRef = firestore.collection('auditLogs').doc();
        await auditRef.set({
            id: auditRef.id,
            actionName: 'deleted',
            actorId: decoded.uid,
            actorName: actor?.name || actor?.email || decoded.email || 'Super Admin',
            actorEmail: actor?.email || decoded.email || '',
            scope: 'System',
            resourceName: 'Orders & Reservations',
            details: `Purged all ${totalCount} order(s) and historical reservation(s) from the system.`,
            createdAt: now,
        });

        return { success: true, count: totalCount };
    } catch (error) {
        console.error('Clear all orders failed:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to clear all orders.' };
    }
}
