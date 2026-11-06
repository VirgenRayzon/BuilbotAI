import { writeOrderChange } from '@/lib/server/order-activity';
import * as admin from "firebase-admin";
import { getAdminFirestore } from "@/firebase/server-init";
import { inventoryItemPath } from "@/lib/inventory-paths";
import { INCLUDED_INTEGRATED_GPU_ID } from "@/lib/integrated-graphics";
import {
  isOrderExpired,
  isOrderPendingWithNoProgression,
} from "@/lib/order-expiration";
import { invalidatePublicPartsCatalog } from "@/lib/server/public-products";
import type { Order, OrderPaymentEvent } from "@/lib/types";

export interface PreparedStockRestoreEntry {
  ref: admin.firestore.DocumentReference;
  snap: admin.firestore.DocumentSnapshot;
  quantity: number;
}

export interface PreparedStockRestore {
  alreadyRestored: boolean;
  entries: PreparedStockRestoreEntry[];
}

/**
 * Reads all unique physical inventory item documents inside a Firestore transaction
 * before any writes occur, enforcing once-only stock restoration.
 */
export async function prepareOrderStockRestore(
  firestore: admin.firestore.Firestore,
  transaction: admin.firestore.Transaction,
  orderData: Pick<Order, "items" | "stockState" | "stockRestoredAt">
): Promise<PreparedStockRestore> {
  if (
    orderData.stockState === "restored" ||
    Boolean(orderData.stockRestoredAt)
  ) {
    return { alreadyRestored: true, entries: [] };
  }

  const groupedByPath = new Map<
    string,
    { ref: admin.firestore.DocumentReference; quantity: number }
  >();

  for (const item of orderData.items || []) {
    if (
      !item?.id ||
      !item?.category ||
      item.id === "included-stock-cooler" ||
      item.id === INCLUDED_INTEGRATED_GPU_ID
    ) {
      continue;
    }
    const qty = Math.max(1, Math.floor(Number(item.quantity ?? 1)));
    let docPath: string;
    try {
      docPath = inventoryItemPath(item.category, item.id);
    } catch {
      continue;
    }
    const existing = groupedByPath.get(docPath);
    groupedByPath.set(docPath, {
      ref: existing?.ref ?? firestore.doc(docPath),
      quantity: (existing?.quantity ?? 0) + qty,
    });
  }

  const entries: PreparedStockRestoreEntry[] = [];
  for (const [, group] of groupedByPath) {
    const snap = await transaction.get(group.ref);
    entries.push({ ref: group.ref, snap, quantity: group.quantity });
  }

  return { alreadyRestored: false, entries };
}

/**
 * Applies prepared inventory stock increments inside an active Firestore transaction.
 */
export interface StockRestoreResult {
  restored: boolean;
  missingItems: Array<{ path: string; quantity: number }>;
}

export function applyOrderStockRestore(
  transaction: admin.firestore.Transaction,
  prepared: PreparedStockRestore
): StockRestoreResult {
  if (prepared.alreadyRestored) return { restored: false, missingItems: [] };
  const missingItems: Array<{ path: string; quantity: number }> = [];
  for (const entry of prepared.entries) {
    if (entry.snap.exists) {
      transaction.update(entry.ref, {
        stock: admin.firestore.FieldValue.increment(entry.quantity),
        inStock: Number(entry.snap.get('stock')) + entry.quantity > 0,
      });
    } else {
      missingItems.push({
        path: entry.ref.path,
        quantity: entry.quantity,
      });
    }
  }
  return {
    restored: true,
    missingItems,
  };
}

export async function pruneUserNotificationsServer(
  firestore: admin.firestore.Firestore,
  userId: string,
  maxKeep: number = 30
): Promise<void> {
  if (!userId) return;
  try {
    const notifsRef = firestore
      .collection("users")
      .doc(userId)
      .collection("notifications");
    const snapshot = await notifsRef.orderBy("createdAt", "desc").get();
    if (snapshot.size > maxKeep) {
      const batch = firestore.batch();
      const docsToDelete = snapshot.docs.slice(maxKeep);
      docsToDelete.forEach((docSnap) => batch.delete(docSnap.ref));
      await batch.commit();
    }
  } catch (err) {
    console.warn(
      `[Notifications] Failed to prune notifications for user ${userId}:`,
      err
    );
  }
}

export async function autoCancelExpiredOrderInternal(options: {
  orderId: string;
  callerUid?: string | null;
  isTrustedSystemOrStaff: boolean;
}): Promise<{ success: boolean; cancelled: boolean; error?: string }> {
  const firestore = getAdminFirestore();
  const { orderId, callerUid = null, isTrustedSystemOrStaff } = options;

  try {
    let targetUserId: string | null = null;
    let didCancel = false;

    await firestore.runTransaction(async (transaction) => {
      const orderRef = firestore.collection("orders").doc(orderId);
      const orderSnap = await transaction.get(orderRef);

      if (!orderSnap.exists) {
        throw new Error("Order not found.");
      }

      const orderData = orderSnap.data() as Order;
      targetUserId = orderData.userId;

      if (!isTrustedSystemOrStaff && callerUid !== orderData.userId) {
        throw new Error("You do not have permission to cancel this order.");
      }

      if (!isOrderPendingWithNoProgression(orderData)) {
        return;
      }

      if (!isOrderExpired(orderData.createdAt)) {
        return;
      }

      const preparedStock = await prepareOrderStockRestore(
        firestore,
        transaction,
        orderData
      );
      applyOrderStockRestore(transaction, preparedStock);

      const now = admin.firestore.Timestamp.now();
      const method = orderData.paymentMethod ?? "gcash_simulated";
      const expireEvent: OrderPaymentEvent = {
        id: `evt_exp_${Date.now().toString(36)}`,
        status: "cancelled",
        method,
        reference: orderData.paymentReference,
        amount: orderData.totalPrice,
        actorName: "Auto Expiration Job",
        actorRole: "System",
        note: "1-hour online payment hold expired; reserved stock returned.",
        createdAt: now,
      };

      writeOrderChange(transaction, orderRef, orderData, {
        status: "cancelled",
        paymentStatus: "cancelled",
        paymentUpdatedAt: now,
        stockState: "restored",
        ...(orderData.stockRestoredAt ? {} : { stockRestoredAt: now }),
        paymentHistory: [...(orderData.paymentHistory || []), expireEvent],
        cancellationReason:
          "Automatically cancelled: 1-hour online payment window expired with no confirmed payment.",
        cancelledAt: now,
        autoCancelled: true,
        updatedAt: now,
      });

      const shortId =
        orderData.orderNumber || orderId.substring(0, 8).toUpperCase();

      const notificationRef = firestore
        .collection("users")
        .doc(orderData.userId)
        .collection("notifications")
        .doc();
      transaction.set(notificationRef, {
        id: notificationRef.id,
        userId: orderData.userId,
        orderId,
        title: "Order Auto-Cancelled (Payment Window Expired)",
        message: `Order ${shortId} was automatically cancelled because online payment was not completed within 1 hour. Reserved components have been returned to stock.`,
        status: "cancelled",
        read: false,
        createdAt: now,
      });

      const sysNotificationRef = firestore
        .collection("system_notifications")
        .doc();
      transaction.set(sysNotificationRef, {
        id: sysNotificationRef.id,
        type: "order_auto_cancelled",
        actorId: callerUid || "system_cron",
        actorName: "Order Expiration Job",
        title: "Order Auto-Cancelled (1-Hour Hold Expired)",
        message: `Order ${shortId} for ${orderData.userEmail || orderData.userId} expired after 1 hour without confirmed online payment.`,
        targetId: orderId,
        readBy: [],
        createdAt: now,
      });

      const userAuditRef = firestore.collection("user_auditLogs").doc();
      transaction.set(userAuditRef, {
        id: userAuditRef.id,
        userId: orderData.userId,
        userEmail: orderData.userEmail || "customer@buildbot.ai",
        actionName: "auto_cancelled",
        scope: "Order",
        activityRecorded: true,
        resourceName: orderData.prebuiltName
          ? `Prebuilt: ${orderData.prebuiltName}`
          : `Order ${shortId}`,
        resourceId: orderId,
        details:
          "Automatically cancelled after 1-hour online payment hold expired.",
        createdAt: now,
      });

      const adminAuditRef = firestore.collection("auditLogs").doc();
      transaction.set(adminAuditRef, {
        id: adminAuditRef.id,
        actionName: "auto_cancelled",
        actorId: callerUid || "system_cron",
        actorName: "Order Expiration Job",
        scope: "Order",
        activityRecorded: true,
        resourceName: `Order ${shortId}`,
        resourceId: orderId,
        details:
          "Automatically cancelled expired unpaid online order and restored reserved inventory stock.",
        createdAt: now,
      });

      didCancel = true;
    });

    if (didCancel) {
      invalidatePublicPartsCatalog();
      if (targetUserId) {
        pruneUserNotificationsServer(firestore, targetUserId).catch(() => {});
      }
    }

    return { success: true, cancelled: didCancel };
  } catch (error) {
    console.error("Auto-cancel failed for order", orderId, error);
    return {
      success: false,
      cancelled: false,
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred during auto-cancellation.",
    };
  }
}

/**
 * Paginates through all pending orders in cursor batches of 100 (no 50-order ceiling)
 * and cancels every unpaid online order past the 1-hour hold window.
 */
export async function runExpiredOrdersSweep(
  actorUid: string = "system_cron",
  batchSize: number = 100,
  maxBatches: number = 50
): Promise<{
  success: boolean;
  scannedCount: number;
  cancelledCount: number;
  error?: string;
}> {
  const firestore = getAdminFirestore();
  let scannedCount = 0;
  let cancelledCount = 0;
  let lastDocId: string | null = null;

  try {
    for (let page = 0; page < maxBatches; page++) {
      let queryRef = firestore
        .collection("orders")
        .where("status", "==", "pending")
        .orderBy(admin.firestore.FieldPath.documentId())
        .limit(batchSize);

      if (lastDocId) {
        queryRef = queryRef.startAfter(lastDocId);
      }

      const snap = await queryRef.get();
      if (snap.empty) break;

      scannedCount += snap.size;
      lastDocId = snap.docs[snap.docs.length - 1].id;

      for (const docSnap of snap.docs) {
        const data = docSnap.data() as Order;
        if (
          isOrderPendingWithNoProgression(data) &&
          isOrderExpired(data.createdAt)
        ) {
          const res = await autoCancelExpiredOrderInternal({
            orderId: docSnap.id,
            callerUid: actorUid,
            isTrustedSystemOrStaff: true,
          });
          if (res.success && res.cancelled) {
            cancelledCount += 1;
          }
        }
      }

      if (snap.size < batchSize) break;
    }

    return { success: true, scannedCount, cancelledCount };
  } catch (error) {
    console.error("Failed to sweep expired pending orders:", error);
    return {
      success: false,
      scannedCount,
      cancelledCount,
      error:
        error instanceof Error
          ? error.message
          : "Failed to sweep expired orders.",
    };
  }
}

