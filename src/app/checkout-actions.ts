
"use server";

import { getAdminFirestore } from "@/firebase/server-init";
import { collection, doc, runTransaction, Timestamp, increment } from "firebase/firestore";
import { Order, OrderItem } from "@/lib/types";

export async function processCheckout(userId: string, userEmail: string, items: OrderItem[]) {
    const firestore = getAdminFirestore();
    const totalPrice = items.reduce((acc, item) => acc + item.price, 0);

    try {
        await runTransaction(firestore, async (transaction) => {
            // 1. Verify and decrement stock for each item
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

                // Decrement stock and increment popularity
                transaction.update(itemDoc, {
                    stock: increment(-1),
                    popularity: increment(1)
                });
            }

            // 2. Create the order
            const orderRef = doc(collection(firestore, "orders"));
            const orderData: Order = {
                id: orderRef.id,
                userId,
                userEmail,
                items,
                totalPrice,
                createdAt: Timestamp.now(),
            };
            transaction.set(orderRef, orderData);
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
