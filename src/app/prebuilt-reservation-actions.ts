
"use server";

import { getAdminFirestore } from "@/firebase/server-init";
import * as admin from 'firebase-admin';
import { PrebuiltSystem, OrderItem } from "@/lib/types";

export async function reservePrebuiltSystem(
    userId: string, 
    userEmail: string, 
    userName: string, 
    system: { id: string, name: string, price: number }, 
    components: Record<string, { id: string, name: string, price: number, category: string }>
) {
    const firestore = getAdminFirestore();
    
    try {
        await firestore.runTransaction(async (transaction) => {
            // 1. Verify stock for all parts first
            const partsToUpdate: { ref: admin.firestore.DocumentReference, name: string }[] = [];
            const orderItems: OrderItem[] = [];

            for (const [category, part] of Object.entries(components)) {
                if (!part) continue;
                
                const collectionMap: Record<string, string> = {
                    cpu: 'CPU', gpu: 'GPU', motherboard: 'Motherboard',
                    ram: 'RAM', storage: 'Storage', psu: 'PSU',
                    case: 'Case', cooler: 'Cooler',
                };
                const collectionName = collectionMap[category] || category;
                
                const partRef = firestore.collection(collectionName).doc(part.id);
                const partSnap = await transaction.get(partRef);
                
                if (!partSnap.exists) {
                    throw new Error(`Component ${part.name} (${category}) no longer exists.`);
                }
                
                const currentStock = partSnap.data()?.stock || 0;
                if (currentStock <= 0) {
                    throw new Error(`Component ${part.name} is currently out of stock.`);
                }
                
                partsToUpdate.push({ ref: partRef, name: part.name });
                orderItems.push({
                    id: part.id,
                    name: part.name,
                    category: collectionName,
                    price: part.price
                });
            }

            // 2. Perform stock deductions
            for (const { ref } of partsToUpdate) {
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
                items: orderItems,
                totalPrice: system.price,
                status: 'pending',
                type: 'prebuilt',
                prebuiltName: system.name,
                prebuiltId: system.id,
                createdAt: admin.firestore.Timestamp.now(),
            };
            transaction.set(orderRef, orderData);

            // 4. Create user notification
            const notificationRef = firestore.collection("notifications").doc();
            transaction.set(notificationRef, {
                id: notificationRef.id,
                userId: userId,
                orderId: orderRef.id,
                title: "Prebuilt Reservation Received",
                message: `Your reservation for ${system.name} has been recorded and is currently pending approval.`,
                status: "pending",
                read: false,
                createdAt: admin.firestore.Timestamp.now()
            });

            // 5. Create system notification for admins
            const systemNotificationRef = firestore.collection("system_notifications").doc();
            transaction.set(systemNotificationRef, {
                id: systemNotificationRef.id,
                type: 'reservation_received',
                actorId: userId,
                actorName: userName || userEmail.split('@')[0],
                title: "New Prebuilt Reservation",
                message: `${userName || userEmail} has reserved Prebuilt ${system.name}`,
                targetId: orderRef.id,
                readBy: [],
                createdAt: admin.firestore.Timestamp.now()
            });
        });

        return { success: true };
    } catch (error) {
        console.error("Prebuilt reservation failed:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "An unexpected error occurred during reservation."
        };
    }
}
