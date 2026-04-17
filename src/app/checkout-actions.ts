
"use server";

import { getAdminFirestore } from "@/firebase/server-init";
import * as admin from 'firebase-admin';
import { Order, OrderItem } from "@/lib/types";

export async function processCheckout(userId: string, userEmail: string, items: OrderItem[]) {
    const firestore = getAdminFirestore();
    const totalPrice = items.reduce((acc, item) => acc + item.price, 0);

    try {
        await firestore.runTransaction(async (transaction) => {
            // 1. Read all item data first
            const itemDataList: { ref: admin.firestore.DocumentReference, snap: admin.firestore.DocumentSnapshot, item: OrderItem }[] = [];
            for (const item of items) {
                if (item.id === "included-stock-cooler") continue;
                
                const itemRef = firestore.collection(item.category).doc(item.id);
                const itemSnap = await transaction.get(itemRef);
                
                if (!itemSnap.exists) {
                    throw new Error(`Item ${item.name} not found.`);
                }
                
                const currentStock = itemSnap.data()?.stock || 0;
                if (currentStock <= 0) {
                    throw new Error(`Item ${item.name} is out of stock.`);
                }
                
                itemDataList.push({ ref: itemRef, snap: itemSnap, item });
            }

            // 2. Perform all writes after all reads are complete
            for (const { ref, snap, item } of itemDataList) {
                transaction.update(ref, {
                    stock: admin.firestore.FieldValue.increment(-1),
                    popularity: admin.firestore.FieldValue.increment(1)
                });
            }

            // 3. Create the order
            const orderRef = firestore.collection("orders").doc();
            const orderData = {
                id: orderRef.id,
                userId,
                userEmail,
                items,
                totalPrice,
                status: 'pending',
                createdAt: admin.firestore.Timestamp.now(),
            };
            transaction.set(orderRef, orderData);

            // 4. Create initial notification
            const notificationRef = firestore.collection("notifications").doc();
            transaction.set(notificationRef, {
                id: notificationRef.id,
                userId: userId,
                orderId: orderRef.id,
                title: "Reservation Received",
                message: "Your build reservation has been recorded and is currently pending approval.",
                status: "pending",
                read: false,
                createdAt: admin.firestore.Timestamp.now()
            });

            // 5. Create system notification for admins/managers
            const systemNotificationRef = firestore.collection("system_notifications").doc();
            transaction.set(systemNotificationRef, {
                id: systemNotificationRef.id,
                type: 'reservation_received',
                actorId: userId,
                actorName: userEmail.split('@')[0],
                title: "New Reservation",
                message: `New build reserved by ${userEmail}`,
                targetId: orderRef.id,
                readBy: [],
                createdAt: admin.firestore.Timestamp.now()
            });
        });

        return { success: true };
    } catch (error) {
        console.error("Checkout failed:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "An unexpected error occurred during checkout."
        };
    }
}

export async function updateReservationStatus(
    orderId: string, 
    newStatus: Order['status'], 
    actor?: { id: string, name: string, isManager: boolean, isSuperAdmin?: boolean }
) {
    const firestore = getAdminFirestore();

    try {
        await firestore.runTransaction(async (transaction) => {
            const orderRef = firestore.collection("orders").doc(orderId);
            const orderSnap = await transaction.get(orderRef);

            if (!orderSnap.exists) {
                throw new Error("Order not found.");
            }

            const orderData = orderSnap.data() as Order;
            const currentStatus = orderData.status;

            // Prevent redundant processing if status is already the same
            if (currentStatus === newStatus) {
                return;
            }

            // Logic for Stock Reversion: If moving to 'cancelled' status from any non-cancelled status
            if (newStatus === 'cancelled' && currentStatus !== 'cancelled') {
                for (const item of orderData.items) {
                    if (item.id === "included-stock-cooler") continue;
                    const itemRef = firestore.collection(item.category).doc(item.id);
                    transaction.update(itemRef, {
                        stock: admin.firestore.FieldValue.increment(1)
                    });
                }
            }

            // Update the order status
            transaction.update(orderRef, {
                status: newStatus,
                updatedAt: admin.firestore.Timestamp.now()
            });

            // Create notification for the user
            const notificationRef = firestore.collection("notifications").doc();
            let title = "Order Update";
            let message = `Your order status has been updated to ${newStatus}.`;

            if (newStatus === 'building') {
                title = "Build Started";
                message = "Great news! Your custom PC build is now being assembled.";
            } else if (newStatus === 'finished building') {
                title = "Build Finished";
                message = "Your PC has been successfully built and is ready for pickup/delivery!";
            } else if (newStatus === 'cancelled') {
                title = "Build Cancelled";
                message = "Your reservation has been cancelled. Any reserved stock has been returned to inventory.";
            }

            transaction.set(notificationRef, {
                id: notificationRef.id,
                userId: orderData.userId,
                orderId: orderId,
                title,
                message,
                status: newStatus,
                read: false,
                createdAt: admin.firestore.Timestamp.now()
            });

            // 5. Create system notification for Super Admin if triggered by a Manager
            if (actor && actor.isManager && !actor.isSuperAdmin) {
                const sysNotificationRef = firestore.collection("system_notifications").doc();
                transaction.set(sysNotificationRef, {
                    id: sysNotificationRef.id,
                    type: 'status_changed',
                    actorId: actor.id,
                    actorName: actor.name,
                    title: "Status Update (Manager)",
                    message: `Manager ${actor.name} changed reservation ${orderId.substring(0, 8)} to ${newStatus}.`,
                    targetId: orderId,
                    readBy: [],
                    createdAt: admin.firestore.Timestamp.now()
                });
            }

            // 6. Create system notification for Admins if User cancels their own reservation
            if (newStatus === 'cancelled' && (!actor || !actor.isManager)) {
                const sysNotificationRef = firestore.collection("system_notifications").doc();
                transaction.set(sysNotificationRef, {
                    id: sysNotificationRef.id,
                    type: 'user_cancelled',
                    actorId: orderData.userId,
                    actorName: orderData.userEmail.split('@')[0],
                    title: "User Cancellation",
                    message: `${orderData.userEmail} cancelled their build.`,
                    targetId: orderId,
                    readBy: [],
                    createdAt: admin.firestore.Timestamp.now()
                });
            }
        });

        return { success: true };
    } catch (error) {
        console.error("Failed to update reservation status:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "An unexpected error occurred."
        };
    }
}
