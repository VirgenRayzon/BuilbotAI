
"use server";

import { getAdminFirestore } from "@/firebase/server-init";
import { collection, doc, runTransaction, Timestamp, increment } from "firebase/firestore";
import { Order, OrderItem } from "@/lib/types";

export async function processCheckout(userId: string, userEmail: string, items: OrderItem[]) {
    const firestore = getAdminFirestore();
    const totalPrice = items.reduce((acc, item) => acc + item.price, 0);

    try {
        await runTransaction(firestore, async (transaction) => {
            // 1. Read all item data first
            const itemDataList: { doc: any, snap: any, item: OrderItem }[] = [];
            for (const item of items) {
                const itemDoc = doc(firestore, item.category, item.id);
                const itemSnap = await transaction.get(itemDoc);
                
                if (!itemSnap.exists()) {
                    throw new Error(`Item ${item.name} not found.`);
                }
                
                const currentStock = itemSnap.data().stock;
                if (currentStock <= 0) {
                    throw new Error(`Item ${item.name} is out of stock.`);
                }
                
                itemDataList.push({ doc: itemDoc, snap: itemSnap, item });
            }

            // 2. Perform all writes after all reads are complete
            for (const { doc, snap, item } of itemDataList) {
                transaction.update(doc, {
                    stock: increment(-1),
                    popularity: increment(1)
                });
            }

            // 3. Create the order
            const orderRef = doc(collection(firestore, "orders"));
            const orderData: Order = {
                id: orderRef.id,
                userId,
                userEmail,
                items,
                totalPrice,
                status: 'pending',
                createdAt: Timestamp.now(),
            };
            transaction.set(orderRef, orderData);

            // 4. Create initial notification
            const notificationRef = doc(collection(firestore, "notifications"));
            transaction.set(notificationRef, {
                id: notificationRef.id,
                userId: userId,
                orderId: orderRef.id,
                title: "Reservation Received",
                message: "Your build reservation has been recorded and is currently pending approval.",
                status: "pending",
                read: false,
                createdAt: Timestamp.now()
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

export async function updateReservationStatus(orderId: string, newStatus: Order['status']) {
    const firestore = getAdminFirestore();

    try {
        await runTransaction(firestore, async (transaction) => {
            const orderRef = doc(firestore, "orders", orderId);
            const orderSnap = await transaction.get(orderRef);

            if (!orderSnap.exists()) {
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
                    const itemDoc = doc(firestore, item.category, item.id);
                    // Use increment(1) to return the stock
                    transaction.update(itemDoc, {
                        stock: increment(1)
                    });
                }
            }

            // Update the order status
            transaction.update(orderRef, {
                status: newStatus,
                updatedAt: Timestamp.now()
            });

            // Create notification for the user
            const notificationRef = doc(collection(firestore, "notifications"));
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
                createdAt: Timestamp.now()
            });
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
