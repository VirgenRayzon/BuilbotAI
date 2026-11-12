"use server";

import * as admin from "firebase-admin";
import { z } from "zod";
import { assertOrderTestEnvironment } from "@/lib/order-permissions";
import { getOrderActor } from "@/lib/server/order-auth";
import {
  INVENTORY_CATEGORY_SLUGS,
  inventoryItemPath,
  inventoryItemsPath,
} from "@/lib/inventory-paths";
import {
  generateOrderNumber,
  generateSimulatedPaymentReference,
} from "@/lib/payment-methods";
import type {
  Order,
  OrderFulfillmentStage,
  OrderItem,
  OrderPaymentEvent,
  OrderRefund,
  Part,
  PaymentMethod,
  PaymentStatus,
  PrebuiltSystem,
} from "@/lib/types";
import { getLegacyStatusFromStage } from "@/lib/order-workflow";
import {
  calculateOrderDelta,
  formatDayKey,
  formatMonthKey,
  type AnalyticsBucket,
} from "@/lib/analytics-rollups";

const adminTokenSchema = z.object({
  idToken: z.string().min(1),
});

async function verifySuperAdminActor(idToken: string) {
  const { decoded, firestore, actorProfile: actor, isSuperAdmin } = await getOrderActor(idToken);
  if (!isSuperAdmin) throw new Error('Only Super Admins can reset or seed sales metrics.');
  assertOrderTestEnvironment(process.env);
  return {
    firestore,
    uid: decoded.uid,
    name: String(actor?.name || actor?.email || decoded.email || "Super Admin"),
    email: String(actor?.email || decoded.email || ""),
  };
}

async function commitChunkedOperations(
  firestore: admin.firestore.Firestore,
  writers: Array<(batch: admin.firestore.WriteBatch) => void>,
  chunkSize = 400
) {
  for (let i = 0; i < writers.length; i += chunkSize) {
    const batch = firestore.batch();
    const slice = writers.slice(i, i + chunkSize);
    for (const write of slice) {
      write(batch);
    }
    await batch.commit();
  }
}

export async function resetSalesMetricsByAdmin(
  rawInput: z.infer<typeof adminTokenSchema>
): Promise<{ success: boolean; deletedOrders?: number; error?: string }> {
  const parsed = adminTokenSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: "Authentication token is required." };
  }

  try {
    const { firestore, uid, name, email } = await verifySuperAdminActor(
      parsed.data.idToken
    );

    const [ordersSnap, dailySnap, monthlySnap, eventsSnap, ...categorySnaps] = await Promise.all([
      firestore.collection("orders").get(),
      firestore.collection("analyticsDaily").get(),
      firestore.collection("analyticsMonthly").get(),
      firestore.collection("analyticsAppliedEvents").get(),
      ...INVENTORY_CATEGORY_SLUGS.map((slug) =>
        firestore.collection(inventoryItemsPath(slug)).get()
      ),
    ]);

    const writers: Array<(batch: admin.firestore.WriteBatch) => void> = [];
    for (const orderDoc of ordersSnap.docs) {
      writers.push((batch) => batch.delete(orderDoc.ref));
    }
    for (const doc of dailySnap.docs) {
      writers.push((batch) => batch.delete(doc.ref));
    }
    for (const doc of monthlySnap.docs) {
      writers.push((batch) => batch.delete(doc.ref));
    }
    for (const doc of eventsSnap.docs) {
      writers.push((batch) => batch.delete(doc.ref));
    }
    for (const catSnap of categorySnaps) {
      for (const partDoc of catSnap.docs) {
        writers.push((batch) => batch.update(partDoc.ref, { popularity: 0 }));
      }
    }

    const now = admin.firestore.Timestamp.now();
    const auditRef = firestore.collection("auditLogs").doc();
    writers.push((batch) =>
      batch.set(auditRef, {
        id: auditRef.id,
        actionName: "deleted",
        actorId: uid,
        actorName: name,
        actorEmail: email,
        scope: "System",
        resourceName: "Sales & Order Metrics",
        details: `Reset ${ordersSnap.size} order record(s), ${dailySnap.size} daily rollups, ${monthlySnap.size} monthly rollups, and cleared component popularity counters.`,
        createdAt: now,
      })
    );

    await commitChunkedOperations(firestore, writers);
    return { success: true, deletedOrders: ordersSnap.size };
  } catch (error) {
    console.error("resetSalesMetricsByAdmin failed:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to reset sales metrics.",
    };
  }
}

export async function ingestDummySalesDataByAdmin(
  rawInput: z.infer<typeof adminTokenSchema>
): Promise<{ success: boolean; createdOrders?: number; error?: string }> {
  const parsed = adminTokenSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: "Authentication token is required." };
  }

  try {
    const { firestore, uid, name, email } = await verifySuperAdminActor(
      parsed.data.idToken
    );

    const [prebuiltsSnap, ...categorySnaps] = await Promise.all([
      firestore.collection("prebuiltSystems").get(),
      ...INVENTORY_CATEGORY_SLUGS.map((slug) =>
        firestore.collection(inventoryItemsPath(slug)).get()
      ),
    ]);

    const parts: Part[] = categorySnaps.flatMap((snap) =>
      snap.docs
        .map((d) => ({ ...(d.data() as Part), id: d.id }))
        .filter((p) => !p.isArchived && p.price > 0)
    );
    const prebuilts: PrebuiltSystem[] = prebuiltsSnap.docs
      .map((d) => ({ ...(d.data() as PrebuiltSystem), id: d.id }))
      .filter((s) => !s.isArchived);

    if (parts.length === 0) {
      return {
        success: false,
        error: "No active components found in inventory to generate sample orders.",
      };
    }

    const orderCount = 60;
    const nowMs = Date.now();
    const popularityMap = new Map<string, number>();
    const dailyBuckets = new Map<string, AnalyticsBucket>();
    const monthlyBuckets = new Map<string, AnalyticsBucket>();

    function mergeIntoSeededBucket(bucket: AnalyticsBucket, delta: ReturnType<typeof calculateOrderDelta>) {
      bucket.grossCollectedPhp = Math.round((bucket.grossCollectedPhp + delta.grossCollectedPhp) * 100) / 100;
      bucket.refundedPhp = Math.round((bucket.refundedPhp + delta.refundedPhp) * 100) / 100;
      bucket.netCollectedPhp = Math.round((bucket.netCollectedPhp + delta.netCollectedPhp) * 100) / 100;
      bucket.paidOrderCount = Math.max(0, bucket.paidOrderCount + delta.paidOrderCount);
      bucket.cancelledOrderCount = Math.max(0, bucket.cancelledOrderCount + delta.cancelledOrderCount);
      bucket.customOrderCount = Math.max(0, bucket.customOrderCount + delta.customOrderCount);
      bucket.prebuiltOrderCount = Math.max(0, bucket.prebuiltOrderCount + delta.prebuiltOrderCount);
      for (const [k, v] of Object.entries(delta.byPaymentMethod)) {
        bucket.byPaymentMethod[k] = (bucket.byPaymentMethod[k] || 0) + v;
      }
      for (const [k, v] of Object.entries(delta.partUnitsSold)) {
        bucket.partUnitsSold[k] = (bucket.partUnitsSold[k] || 0) + v;
      }
      bucket.updatedAt = Date.now();
    }
    const writers: Array<(batch: admin.firestore.WriteBatch) => void> = [];
    const methods: PaymentMethod[] = [
      "cod",
      "gcash_simulated",
      "paymongo_simulated",
    ];
    const stages: OrderFulfillmentStage[] = [
      "order_placed",
      "assembling_testing",
      "out_for_delivery",
      "delivered",
    ];

    for (let i = 0; i < orderCount; i++) {
      const createdDate = new Date(
        nowMs - Math.floor(Math.random() * 180 * 24 * 60 * 60 * 1000)
      );
      const createdTs = admin.firestore.Timestamp.fromDate(createdDate);
      const orderRef = firestore.collection("orders").doc();
      const usePrebuilt = prebuilts.length > 0 && i % 3 === 0;
      const items: OrderItem[] = [];
      let totalPrice = 0;
      let orderType: "prebuilt" | "custom" = "custom";
      let prebuiltId: string | undefined;
      let prebuiltName: string | undefined;
      let prebuiltTier: PrebuiltSystem["tier"] | undefined;

      if (usePrebuilt) {
        const sys = prebuilts[i % prebuilts.length];
        orderType = "prebuilt";
        prebuiltId = sys.id;
        prebuiltName = sys.name;
        prebuiltTier = sys.tier;
        const compIds = Object.values(sys.components || {})
          .flat()
          .filter(Boolean);
        for (const compId of compIds) {
          const part = parts.find((p) => p.id === compId);
          if (part) {
            items.push({
              id: part.id,
              name: part.name,
              category: part.category,
              price: part.price,
              quantity: 1,
              buildType: "prebuilt",
              groupName: sys.name,
              prebuiltName: sys.name,
            });
            const pPath = inventoryItemPath(part.category, part.id);
            popularityMap.set(pPath, (popularityMap.get(pPath) || 0) + 1);
          }
        }
        totalPrice =
          sys.price > 0
            ? sys.price
            : items.reduce((s, item) => s + item.price, 0);
      }

      if (items.length === 0) {
        orderType = "custom";
        const count = 3 + (i % 4);
        for (let j = 0; j < count; j++) {
          const part = parts[(i * 7 + j * 3) % parts.length];
          items.push({
            id: part.id,
            name: part.name,
            category: part.category,
            price: part.price,
            quantity: 1,
            buildType: "custom-build",
            groupName: "My Build",
          });
          totalPrice += part.price;
          const pPath = inventoryItemPath(part.category, part.id);
          popularityMap.set(pPath, (popularityMap.get(pPath) || 0) + 1);
        }
      }

      const paymentMethod = methods[i % methods.length];
      const isCancelled = i % 10 === 9;
      const stage: OrderFulfillmentStage = isCancelled
        ? "order_placed"
        : stages[i % stages.length];
      const status = isCancelled ? "cancelled" : getLegacyStatusFromStage(stage);
      const isPaid =
        !isCancelled &&
        (stage === "delivered" || paymentMethod !== "cod" || i % 2 === 0);
      const paymentStatus: PaymentStatus = isPaid
        ? "paid"
        : isCancelled
          ? "cancelled"
          : paymentMethod === "cod"
            ? "unpaid"
            : "pending";
      const orderNumber = generateOrderNumber(createdDate);
      const paymentReference = generateSimulatedPaymentReference(
        paymentMethod,
        createdDate
      );
      const customerEmail = `customer${100 + i}@example.com`;
      const hasPartialRefund = isPaid && i % 12 === 0;
      const refundAmount = hasPartialRefund
        ? Math.min(2500, Math.round(totalPrice * 0.1))
        : 0;
      const refunds: OrderRefund[] = hasPartialRefund
        ? [
            {
              id: `ref_seed_${i}`,
              amount: refundAmount,
              method: "manual",
              destination: "gcash",
              reason: "Sample partial price adjustment refund",
              reference: `GCASH-REF-${1000 + i}`,
              actorId: uid,
              actorName: name,
              actorRole: "Super Admin",
              status: "succeeded",
              createdAt: createdTs,
            },
          ]
        : [];
      const history: OrderPaymentEvent[] = [
        {
          id: `evt_seed_${i}`,
          status: paymentStatus,
          method: paymentMethod,
          reference: paymentReference,
          amount: totalPrice,
          actorName: isPaid ? "Payment Verified" : customerEmail,
          actorRole: isPaid ? "System" : "Customer",
          note: "Sample order seeded by Super Admin.",
          createdAt: createdTs,
        },
      ];

      writers.push((batch) =>
        batch.set(orderRef, {
          id: orderRef.id,
          orderNumber,
          userId: "sample-customer",
          userEmail: customerEmail,
          items,
          subtotal: totalPrice,
          shippingFee: 0,
          protectionFee: 0,
          discountAmount: 0,
          totalPrice,
          status,
          fulfillmentStage: stage,
          paymentMethod,
          paymentStatus,
          paymentReference,
          paymentHistory: history,
          ...(isPaid ? { paidAt: createdTs } : { paidAt: null }),
          refundStatus: hasPartialRefund ? "partial" : "none",
          refundedAmount: refundAmount,
          ...(refunds.length > 0 ? { refunds } : {}),
          stockState: isCancelled ? "restored" : "reserved",
          ...(isCancelled
            ? {
                stockRestoredAt: createdTs,
                cancelledAt: createdTs,
                cancellationReason: "Sample cancelled order",
              }
            : {}),
          shippingMethod: "store_pickup",
          type: orderType,
          ...(prebuiltId ? { prebuiltId } : {}),
          ...(prebuiltName ? { prebuiltName } : {}),
          ...(prebuiltTier ? { prebuiltTier } : {}),
          createdAt: createdTs,
          updatedAt: createdTs,
        })
      );

      const seededOrder: Order = {
        id: orderRef.id,
        orderNumber,
        userId: "sample-customer",
        userEmail: customerEmail,
        items,
        subtotal: totalPrice,
        shippingFee: 0,
        protectionFee: 0,
        discountAmount: 0,
        totalPrice,
        status,
        fulfillmentStage: stage,
        paymentMethod,
        paymentStatus,
        paymentReference,
        paymentHistory: history,
        paidAt: isPaid ? (createdDate as unknown as admin.firestore.Timestamp) : undefined,
        refundStatus: hasPartialRefund ? "partial" : "none",
        refundedAmount: refundAmount,
        refunds,
        stockState: isCancelled ? "restored" : "reserved",
        cancelledAt: isCancelled ? (createdDate as unknown as admin.firestore.Timestamp) : undefined,
        cancellationReason: isCancelled ? "Sample cancelled order" : undefined,
        shippingMethod: "store_pickup",
        type: orderType,
        ...(prebuiltId ? { prebuiltId } : {}),
        ...(prebuiltName ? { prebuiltName } : {}),
        ...(prebuiltTier ? { prebuiltTier } : {}),
        createdAt: createdDate as unknown as admin.firestore.Timestamp,
        updatedAt: createdDate as unknown as admin.firestore.Timestamp,
      };

      const delta = calculateOrderDelta(null, seededOrder);
      const dayKey = formatDayKey(createdDate);
      const monthKey = formatMonthKey(createdDate);

      if (!dailyBuckets.has(dayKey)) {
        dailyBuckets.set(dayKey, {
          bucketKey: dayKey,
          grossCollectedPhp: 0,
          refundedPhp: 0,
          netCollectedPhp: 0,
          paidOrderCount: 0,
          cancelledOrderCount: 0,
          customOrderCount: 0,
          prebuiltOrderCount: 0,
          byPaymentMethod: {},
          partUnitsSold: {},
          updatedAt: Date.now(),
        });
      }
      if (!monthlyBuckets.has(monthKey)) {
        monthlyBuckets.set(monthKey, {
          bucketKey: monthKey,
          grossCollectedPhp: 0,
          refundedPhp: 0,
          netCollectedPhp: 0,
          paidOrderCount: 0,
          cancelledOrderCount: 0,
          customOrderCount: 0,
          prebuiltOrderCount: 0,
          byPaymentMethod: {},
          partUnitsSold: {},
          updatedAt: Date.now(),
        });
      }

      mergeIntoSeededBucket(dailyBuckets.get(dayKey)!, delta);
      mergeIntoSeededBucket(monthlyBuckets.get(monthKey)!, delta);
    }

    for (const [dayKey, bucket] of dailyBuckets.entries()) {
      const dailyRef = firestore.collection("analyticsDaily").doc(dayKey);
      writers.push((batch) => batch.set(dailyRef, bucket, { merge: true }));
    }

    for (const [monthKey, bucket] of monthlyBuckets.entries()) {
      const monthlyRef = firestore.collection("analyticsMonthly").doc(monthKey);
      writers.push((batch) => batch.set(monthlyRef, bucket, { merge: true }));
    }

    for (const [partPath, popCount] of popularityMap.entries()) {
      const partRef = firestore.doc(partPath);
      writers.push((batch) =>
        batch.update(partRef, {
          popularity: admin.firestore.FieldValue.increment(popCount),
        })
      );
    }

    const auditRef = firestore.collection("auditLogs").doc();
    writers.push((batch) =>
      batch.set(auditRef, {
        id: auditRef.id,
        actionName: "created",
        actorId: uid,
        actorName: name,
        actorEmail: email,
        scope: "System",
        resourceName: "Sample Sales Dataset",
        details: `Generated ${orderCount} sample orders with payment, fulfillment, and refund states.`,
        createdAt: admin.firestore.Timestamp.now(),
      })
    );

    await commitChunkedOperations(firestore, writers);
    return { success: true, createdOrders: orderCount };
  } catch (error) {
    console.error("ingestDummySalesDataByAdmin failed:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate sample sales data.",
    };
  }
}
