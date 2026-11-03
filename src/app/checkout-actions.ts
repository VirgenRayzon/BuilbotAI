"use server";

import { assertCashConfirmation, getPaymentEventLink, type CashConfirmation } from '@/lib/order-payment';
import { randomUUID } from 'node:crypto';
import { saveOrderPaymentSession } from '@/lib/server/order-payment-session';
import { runOrderOperation } from '@/lib/server/order-operations';
import { writeOrderChange } from '@/lib/server/order-activity';
import { getAdminAuth, getAdminFirestore } from "@/firebase/server-init";
import { getOrderActor } from '@/lib/server/order-auth';
import * as admin from "firebase-admin";
import { z } from "zod";
import {
  Order,
  OrderFulfillmentStage,
  OrderItem,
  OrderPaymentEvent,
  OrderShippingAddress,
  PaymentMethod,
  PaymentStatus,
  ShippingMethod,
  SimulatedPaymentOutcome,
  OrderStockState,
} from "@/lib/types";
import {
  inventoryCategoryLabel,
  inventoryItemPath,
  inventoryItemsPath,
} from "@/lib/inventory-paths";
import {
  invalidatePublicPartsCatalog,
  productReference,
} from "@/lib/server/public-products";
import {
  INCLUDED_INTEGRATED_GPU_ID,
  integratedGraphicsName,
} from "@/lib/integrated-graphics";
import {
  PAYMENT_METHOD_REGISTRY,
  calculateAuthoritativeOrderTotals,
  generateOrderNumber,
  generateSimulatedPaymentReference,
  getPaymentMethodLabel,
} from "@/lib/payment-methods";
import {
  createPaymongoCheckoutSession,
  isPaymongoTestApiConfigured,
  retrievePaymongoCheckoutSession,
} from "@/lib/server/paymongo";
import { PRODUCT_ID_PATTERN } from "@/lib/product-identity";
import { toFirestoreDocument } from "@/lib/firestore-document";
import { requiresStaffCancellation } from "@/lib/customer-order-workflow";
import {
  assertOrderStageTransition,
  assertStaffPaymentStatusTransition,
  getLegacyStatusFromStage,
  getOrderFulfillmentStage,
  getOrderFulfillmentStageLabel,
  getRefundedAmount,
} from "@/lib/order-workflow";
import {
  assertCustomRigDispatchAllowed,
  getCustomRigsFromOrder,
  type RigVerificationRecord,
} from "@/lib/order-assembly";
import {
  applyOrderStockRestore,
  autoCancelExpiredOrderInternal,
  prepareOrderStockRestore,
  pruneUserNotificationsServer,
  runExpiredOrdersSweep,
} from "@/lib/server/order-expiration-sweep";

const orderIdSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[a-zA-Z0-9_-]+$/);

const shippingAddressSchema = z.object({
  fullName: z.string().trim().min(1).max(160),
  phone: z.string().trim().min(3).max(40),
  email: z.string().trim().email().max(180),
  region: z.string().trim().min(1).max(120),
  city: z.string().trim().min(1).max(120),
  barangay: z.string().trim().min(1).max(120),
  streetAddress: z.string().trim().min(1).max(240),
  postalCode: z.string().trim().min(1).max(20),
  notes: z.string().trim().max(400).optional(),
});

const cartComponentSchema = z.object({
  id: z.string().max(160).optional(),
  productId: z.string().max(64).optional(),
  category: z.string().trim().min(1).max(64),
  name: z.string().trim().min(1).max(240),
  price: z.number().finite().nonnegative().max(10_000_000),
  imageUrl: z.string().max(1000).optional(),
});

const cartItemSchema = z.object({
  id: z.string().trim().min(1).max(160),
  productId: z.string().max(64).optional(),
  kind: z.enum(["custom-build", "prebuilt", "part"]),
  name: z.string().trim().min(1).max(240),
  price: z.number().finite().nonnegative().max(10_000_000),
  quantity: z.number().int().min(1).max(50),
  category: z.string().max(64).optional(),
  imageUrl: z.string().max(1000).optional(),
  tier: z.string().max(64).optional(),
  components: z.array(cartComponentSchema).max(40).optional(),
});

const createCheckoutOrderSchema = z.object({
  idToken: z.string().min(1),
  operationId: z.string().min(8).max(128).regex(/^[a-zA-Z0-9_-]+$/),
  cartItems: z.array(cartItemSchema).min(1).max(50),
  paymentMethod: z.enum([
    "cod",
    "gcash_simulated",
    "paymongo_simulated",
    "card_simulated",
  ]),
  shippingMethod: z.enum([
    "standard_courier",
    "sameday_express",
    "store_pickup",
  ]),
  shippingAddress: shippingAddressSchema,
  includeCrateProtection: z.boolean().optional(),
  voucherCode: z.string().max(64).nullable().optional(),
});

const resolveSimulatedPaymentSchema = z.object({
  orderId: orderIdSchema,
  outcome: z.enum(["success", "failed", "cancelled"]),
  idToken: z.string().min(1),
  operationId: z.string().max(128).optional(),
  paymentChannel: z.string().max(64).optional(),
  paymentId: z.string().max(128).optional(),
});

const createPaymongoSessionSchema = z.object({
  orderId: orderIdSchema,
  idToken: z.string().min(1),
  baseUrl: z.string().url().max(240).optional(),
});

const verifyPaymongoOrderSchema = z.object({
  orderId: orderIdSchema,
  idToken: z.string().min(1),
  redirectHint: z.enum(["success", "cancelled"]).optional(),
});

const switchToCodSchema = z.object({
  orderId: orderIdSchema,
  idToken: z.string().min(1),
});

const operationSchema = z.object({ operationId: z.string().uuid(), expectedRevision: z.number().int().nonnegative() });

const staffPaymentStatusSchema = z.object({
  cashConfirmation: z.object({ received: z.literal(true), amount: z.number().finite().nonnegative().max(10000000) }).optional(),
  operation: operationSchema.optional(),
  orderId: orderIdSchema,
  newPaymentStatus: z.enum([
    "unpaid",
    "pending",
    "paid",
    "failed",
    "cancelled",
  ]),
  idToken: z.string().min(1),
  reason: z.string().trim().max(255).optional(),
});

const staffFulfillmentSchema = z.object({
  operation: operationSchema,
  orderId: orderIdSchema,
  stage: z.enum([
    "order_placed",
    "assembling_testing",
    "out_for_delivery",
    "delivered",
  ]),
  idToken: z.string().min(1),
});

const updateReservationStatusSchema = z.object({
  operation: operationSchema.optional(),
  orderId: orderIdSchema,
  newStatus: z.enum(["pending", "building", "finished building", "cancelled"]),
  idToken: z.string().min(1),
});

const autoCancelExpiredSchema = z.object({
  orderId: orderIdSchema,
  idToken: z.string().min(1).optional(),
});

export interface ProcessCheckoutOptions {
  paymentMethod?: PaymentMethod;
  shippingMethod?: ShippingMethod;
  shippingAddress?: OrderShippingAddress;
  includeCrateProtection?: boolean;
  voucherCode?: string | null;
  operationId?: string;
  orderType?: "prebuilt" | "custom";
  prebuiltId?: string;
  prebuiltName?: string;
  prebuiltTier?: Order["prebuiltTier"];
}

export interface CheckoutOrderResult {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paymentReference?: string;
  requiresSimulationStep?: boolean;
  paymongoCheckoutSessionId?: string | null;
  paymongoCheckoutUrl?: string | null;
  paymongoMode?: "live_test_api" | "local_sandbox_fallback";
  subtotal?: number;
  shippingFee?: number;
  protectionFee?: number;
  discountAmount?: number;
  vatIncludedAmount?: number;
  totalPrice?: number;
  error?: string;
}

/**
 * Resolves a component's Firestore DocumentSnapshot inside a transaction
 * using its canonical ID, PRD-XXXXXX productId, or exact category + name.
 */
async function resolveInventoryDocInTransaction(
  firestore: admin.firestore.Firestore,
  transaction: admin.firestore.Transaction,
  candidate: {
    id?: string;
    productId?: string;
    category: string;
    name: string;
  }
): Promise<{
  ref: admin.firestore.DocumentReference;
  snap: admin.firestore.DocumentSnapshot;
  canonicalCategory: string;
}> {
  const cleanCategory = candidate.category.replace(/\s*#\d+$/, "").trim();
  const canonicalCategory = inventoryCategoryLabel(cleanCategory);

  const rawPrd =
    candidate.productId && PRODUCT_ID_PATTERN.test(candidate.productId)
      ? candidate.productId
      : candidate.id?.startsWith("part-") &&
          PRODUCT_ID_PATTERN.test(candidate.id.slice(5))
        ? candidate.id.slice(5)
        : candidate.id && PRODUCT_ID_PATTERN.test(candidate.id)
          ? candidate.id
          : null;

  if (rawPrd) {
    const mappingSnap = await transaction.get(
      firestore.doc(`productIds/${rawPrd}`)
    );
    const mapping = mappingSnap.data();
    if (mapping && mapping.kind === "part" && typeof mapping.path === "string") {
      const mappedRef = firestore.doc(mapping.path);
      const mappedSnap = await transaction.get(mappedRef);
      if (mappedSnap.exists) {
        return { ref: mappedRef, snap: mappedSnap, canonicalCategory };
      }
    }
  }

  if (
    candidate.id &&
    !candidate.id.includes("/") &&
    !candidate.id.startsWith("part-") &&
    !candidate.id.startsWith("custom-rig-") &&
    !candidate.id.startsWith("prebuilt-")
  ) {
    const directRef = firestore.doc(
      inventoryItemPath(canonicalCategory, candidate.id)
    );
    const directSnap = await transaction.get(directRef);
    if (directSnap.exists) {
      return { ref: directRef, snap: directSnap, canonicalCategory };
    }
  }

  if (candidate.name) {
    const nameQuery = firestore
      .collection(inventoryItemsPath(canonicalCategory))
      .where("name", "==", candidate.name)
      .limit(2);
    const matches = await transaction.get(nameQuery);
    if (!matches.empty) {
      const matchedDoc = matches.docs[0];
      return {
        ref: matchedDoc.ref,
        snap: matchedDoc,
        canonicalCategory,
      };
    }
  }

  throw new Error(`Item "${candidate.name}" (${canonicalCategory}) not found.`);
}

/**
 * Private low-level checkout writer. Only invoked after `createCheckoutOrder`
 * verifies the caller's Firebase ID token and validates input payload via Zod.
 */
async function processCheckoutInternal(
  verifiedUser: { uid: string; email: string },
  items: OrderItem[],
  options?: ProcessCheckoutOptions
): Promise<CheckoutOrderResult> {
  const firestore = getAdminFirestore();
  const paymentMethod: PaymentMethod = options?.paymentMethod ?? "cod";
  const methodDef = PAYMENT_METHOD_REGISTRY[paymentMethod];

  if (!methodDef || !methodDef.enabled) {
    return {
      success: false,
      error: `Payment method "${paymentMethod}" is not currently available.`,
    };
  }

  try {
    const userId = verifiedUser.uid;
    const userEmail = verifiedUser.email || "customer@buildbot.ai";
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("Your order must contain at least one item.");
    }
    let authoritativeItemsSnapshot: OrderItem[] = [];

    const result = await firestore.runTransaction(async (transaction) => {
      const operationRef = options?.operationId
        ? firestore.doc(`reservationOperations/${userId}_${options.operationId}`)
        : null;

      if (operationRef) {
        const existingOp = await transaction.get(operationRef);
        if (existingOp.exists) {
          const opData = existingOp.data()!;
          return {
            isDuplicate: true,
            orderId: String(opData.orderId),
            orderNumber: String(opData.orderNumber || ""),
            paymentMethod:
              (opData.paymentMethod as PaymentMethod) || paymentMethod,
            paymentStatus:
              (opData.paymentStatus as PaymentStatus) ||
              methodDef.initialPaymentStatus,
            paymentReference: String(opData.paymentReference || ""),
            requiresSimulationStep: methodDef.requiresSimulationStep,
            subtotal: Number(opData.subtotal || 0),
            shippingFee: Number(opData.shippingFee || 0),
            protectionFee: Number(opData.protectionFee || 0),
            discountAmount: Number(opData.discountAmount || 0),
            vatIncludedAmount: Number(opData.vatIncludedAmount || 0),
            totalPrice: Number(opData.totalPrice || 0),
          };
        }
      }

      const includedGpu = items.find(
        (item) => item.id === INCLUDED_INTEGRATED_GPU_ID
      );
      if (includedGpu) {
        const cpuItems = items.filter(
          (item) => item.category.toUpperCase() === "CPU"
        );
        const gpuItems = items.filter(
          (item) => item.category.toUpperCase() === "GPU"
        );
        if (
          includedGpu.category.toUpperCase() !== "GPU" ||
          includedGpu.price !== 0 ||
          cpuItems.length !== 1 ||
          gpuItems.length !== 1
        ) {
          throw new Error(
            "Integrated graphics requires its CPU and a ₱0 GPU slot."
          );
        }
        const cpuResolved = await resolveInventoryDocInTransaction(
          firestore,
          transaction,
          cpuItems[0]
        );
        if (
          !cpuResolved.snap.exists ||
          !integratedGraphicsName({
            id: cpuResolved.snap.id,
            ...cpuResolved.snap.data(),
          })
        ) {
          throw new Error(
            "The selected CPU does not provide integrated graphics."
          );
        }
      }

      const groupedRequirements = new Map<
        string,
        {
          ref: admin.firestore.DocumentReference;
          snap: admin.firestore.DocumentSnapshot;
          quantity: number;
          canonicalCategory: string;
        }
      >();
      const authoritativeOrderItems: OrderItem[] = [];

      for (const item of items) {
        const qty = Math.max(1, Math.floor(Number(item.quantity ?? 1)));
        if (
          item.id === "included-stock-cooler" ||
          item.id === INCLUDED_INTEGRATED_GPU_ID
        ) {
          authoritativeOrderItems.push({
            id: item.id,
            name: item.name,
            category: item.category,
            price: 0,
            quantity: 1,
            imageUrl: item.imageUrl,
            groupName: item.groupName,
            buildType: item.buildType,
            prebuiltName: item.prebuiltName,
          });
          continue;
        }

        const resolved = await resolveInventoryDocInTransaction(
          firestore,
          transaction,
          item
        );
        const docPath = resolved.ref.path;
        const existingGroup = groupedRequirements.get(docPath);
        const nextQty = (existingGroup?.quantity ?? 0) + qty;

        groupedRequirements.set(docPath, {
          ref: resolved.ref,
          snap: resolved.snap,
          quantity: nextQty,
          canonicalCategory: resolved.canonicalCategory,
        });

        const partData = resolved.snap.data() || {};
        const authoritativePrice = Number(partData.price ?? item.price) || 0;
        const authoritativeName = String(partData.name || item.name);

        for (let i = 0; i < qty; i++) {
          authoritativeOrderItems.push({
            id: resolved.snap.id,
            productId: (partData.productId as string) || item.productId,
            name: authoritativeName,
            category: resolved.canonicalCategory,
            price: authoritativePrice,
            quantity: 1,
            imageUrl:
              (partData.imageUrl as string) ||
              (Array.isArray(partData.images) ? partData.images[0] : undefined) ||
              item.imageUrl,
            groupName: item.groupName,
            buildType: item.buildType,
            prebuiltName: item.prebuiltName,
          });
        }
      }

      const resolvedCpuItem = authoritativeOrderItems.find(
        (i) => i.category.toUpperCase() === "CPU"
      );
      if (resolvedCpuItem?.imageUrl) {
        for (const i of authoritativeOrderItems) {
          if (
            i.id === INCLUDED_INTEGRATED_GPU_ID &&
            (!i.imageUrl || i.imageUrl.startsWith("/placeholder"))
          ) {
            i.imageUrl = resolvedCpuItem.imageUrl;
          }
        }
      }

      for (const [, group] of groupedRequirements) {
        const data = group.snap.data();
        if (!group.snap.exists || data?.isArchived) {
          throw new Error(
            `Item ${data?.name || group.ref.id} is no longer available.`
          );
        }
        const currentStock = Number(data?.stock ?? 0);
        if (currentStock < group.quantity) {
          throw new Error(
            currentStock <= 0
              ? `Item ${data?.name || group.ref.id} is out of stock.`
              : `Item ${data?.name || group.ref.id} only has ${currentStock} left in stock (requested ${group.quantity}).`
          );
        }
      }

      for (const [, group] of groupedRequirements) {
        transaction.update(group.ref, {
          stock: admin.firestore.FieldValue.increment(-group.quantity),
          popularity: admin.firestore.FieldValue.increment(group.quantity),
        });
      }

      const pricing = calculateAuthoritativeOrderTotals({
        items: authoritativeOrderItems,
        shippingMethod: options?.shippingMethod ?? "store_pickup",
        includeCrateProtection: options?.includeCrateProtection ?? false,
        voucherCode: options?.voucherCode ?? null,
      });

      authoritativeItemsSnapshot = authoritativeOrderItems;

      const now = admin.firestore.Timestamp.now();
      const orderRef = firestore.collection("orders").doc();
      const orderNumber = generateOrderNumber();
      const paymentReference = generateSimulatedPaymentReference(paymentMethod);
      const paymentStatus = methodDef.initialPaymentStatus;
      const initialPaymentEvent: OrderPaymentEvent = {
        id: `evt_${Date.now().toString(36)}`,
        status: paymentStatus,
        method: paymentMethod,
        reference: paymentReference,
        amount: pricing.totalPrice,
        actorId: userId,
        actorName: userEmail,
        actorRole: "Customer",
        note: `Order placed via ${methodDef.shortLabel}.`,
        createdAt: now,
      };

      const orderData: Record<string, unknown> = {
        id: orderRef.id,
        orderNumber,
        userId,
        userEmail,
        items: authoritativeOrderItems,
        subtotal: pricing.subtotal,
        shippingFee: pricing.shippingFee,
        protectionFee: pricing.protectionFee,
        discountAmount: pricing.discountAmount,
        voucherCode: pricing.appliedVoucherCode,
        totalPrice: pricing.totalPrice,
        status: "pending",
        fulfillmentStage: "order_placed",
        refundStatus: "none",
        stockState: "reserved",
        paymentMethod,
        paymentStatus,
        paymentReference,
        paymentHistory: [initialPaymentEvent],
        paymentCreatedAt: now,
        paymentUpdatedAt: now,
        paidAt: null,
        paymentAttempts: 0,
        lastPaymentError: null,
        isSimulatedPayment: methodDef.isSimulated,
        shippingMethod: options?.shippingMethod ?? "store_pickup",
        ...(options?.shippingAddress
          ? { shippingAddress: options.shippingAddress }
          : {}),
        ...(options?.orderType ? { type: options.orderType } : {}),
        ...(options?.prebuiltId ? { prebuiltId: options.prebuiltId } : {}),
        ...(options?.prebuiltName ? { prebuiltName: options.prebuiltName } : {}),
        ...(options?.prebuiltTier ? { prebuiltTier: options.prebuiltTier } : {}),
        includeCrateProtection: Boolean(options?.includeCrateProtection),
        createdAt: now,
        updatedAt: now,
      };

      writeOrderChange(transaction, orderRef, null, toFirestoreDocument(orderData));

      if (operationRef) {
        transaction.set(operationRef, {
          orderId: orderRef.id,
          orderNumber,
          paymentMethod,
          paymentStatus,
          paymentReference,
          subtotal: pricing.subtotal,
          shippingFee: pricing.shippingFee,
          protectionFee: pricing.protectionFee,
          discountAmount: pricing.discountAmount,
          vatIncludedAmount: pricing.vatIncludedAmount,
          totalPrice: pricing.totalPrice,
          createdAt: now,
        });
      }

      const notificationRef = firestore
        .collection("users")
        .doc(userId)
        .collection("notifications")
        .doc();
      const initialNotifTitle =
        paymentMethod === "gcash_simulated"
          ? "Order Placed — Complete GCash Payment"
          : paymentMethod === "paymongo_simulated"
            ? "Order Placed — Complete PayMongo Checkout"
            : "Order Confirmed (Cash on Delivery)";
      const initialNotifMessage =
        paymentMethod === "gcash_simulated"
          ? `Order ${orderNumber} is placed and awaiting your GCash payment within 1 hour.`
          : paymentMethod === "paymongo_simulated"
            ? `Order ${orderNumber} is placed and awaiting your PayMongo payment within 1 hour.`
            : `Your order ${orderNumber} has been placed (${methodDef.shortLabel}) and is pending fulfillment.`;

      transaction.set(notificationRef, {
        id: notificationRef.id,
        userId,
        orderId: orderRef.id,
        title: initialNotifTitle,
        message: initialNotifMessage,
        status: "pending",
        read: false,
        createdAt: now,
      });

      const systemNotificationRef = firestore
        .collection("system_notifications")
        .doc();
      transaction.set(systemNotificationRef, {
        id: systemNotificationRef.id,
        type: "reservation_received",
        actorId: userId,
        actorName: userEmail.split("@")[0],
        title: "New Order Placed",
        message: `New order ${orderNumber} (${methodDef.shortLabel}) by ${userEmail}`,
        targetId: orderRef.id,
        readBy: [],
        createdAt: now,
      });

      const userAuditRef = firestore.collection("user_auditLogs").doc();
      transaction.set(userAuditRef, {
        id: userAuditRef.id,
        userId,
        userEmail,
        actionName: "created",
        scope: "Order",
        activityRecorded: true,
        resourceName: `Order ${orderNumber}`,
        resourceId: orderRef.id,
        details: `Placed order with ${authoritativeOrderItems.length} item(s) totaling ₱${pricing.totalPrice.toLocaleString()} via ${methodDef.shortLabel} (Ref: ${paymentReference})`,
        createdAt: now,
      });

      return {
        isDuplicate: false,
        orderId: orderRef.id,
        orderNumber,
        paymentMethod,
        paymentStatus,
        paymentReference,
        requiresSimulationStep: methodDef.requiresSimulationStep,
        subtotal: pricing.subtotal,
        shippingFee: pricing.shippingFee,
        protectionFee: pricing.protectionFee,
        discountAmount: pricing.discountAmount,
        vatIncludedAmount: pricing.vatIncludedAmount,
        totalPrice: pricing.totalPrice,
      };
    });

    let paymongoCheckoutSessionId: string | null = null;
    let paymongoCheckoutUrl: string | null = null;
    let paymongoMode: "live_test_api" | "local_sandbox_fallback" | undefined;

    if (paymentMethod === "paymongo_simulated" && result.orderId && !result.isDuplicate) {
      try {
        const pmSession = await createPaymongoCheckoutSession({
          orderId: result.orderId,
          orderNumber: result.orderNumber,
          paymentReference: result.paymentReference,
          totalPricePhp: result.totalPrice,
          subtotalPhp: result.subtotal,
          shippingFeePhp: result.shippingFee,
          protectionFeePhp: result.protectionFee,
          discountAmountPhp: result.discountAmount,
          voucherCode: options?.voucherCode ?? null,
          items:
            authoritativeItemsSnapshot.length > 0
              ? authoritativeItemsSnapshot
              : items,
          customerEmail: userEmail,
          shippingAddress: options?.shippingAddress,
        });

        paymongoCheckoutSessionId = pmSession.checkoutSessionId;
        paymongoCheckoutUrl = pmSession.checkoutUrl;
        paymongoMode = pmSession.mode;

        await saveOrderPaymentSession(firestore.collection("orders").doc(result.orderId), {
          paymongoCheckoutSessionId,
          paymongoCheckoutUrl,
          paymongoMode,
          updatedAt: admin.firestore.Timestamp.now(),
        }, { actorId: userId, actorName: userEmail, actorRole: "Customer" });
      } catch (pmErr) {
        console.warn(
          "[PayMongo] Initial session creation failed; customer can retry session creation:",
          pmErr
        );
        paymongoMode = isPaymongoTestApiConfigured()
          ? "live_test_api"
          : "local_sandbox_fallback";
        await saveOrderPaymentSession(firestore.collection("orders").doc(result.orderId), {
          paymongoMode,
          updatedAt: admin.firestore.Timestamp.now(),
        }, { actorId: userId, actorName: userEmail, actorRole: "Customer" });
      }
    }

    invalidatePublicPartsCatalog();
    pruneUserNotificationsServer(firestore, userId).catch(() => {});

    const { isDuplicate: _ignoredDuplicate, ...cleanResult } = result;
    return {
      success: true,
      ...cleanResult,
      paymongoCheckoutSessionId,
      paymongoCheckoutUrl,
      paymongoMode,
    };
  } catch (error) {
    console.error("Checkout failed:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred during checkout.",
    };
  }
}

export interface CreateCheckoutOrderCartItemInput {
  id: string;
  productId?: string;
  kind: "custom-build" | "prebuilt" | "part";
  name: string;
  price: number;
  quantity: number;
  category?: string;
  imageUrl?: string;
  tier?: string;
  components?: Array<{
    id?: string;
    productId?: string;
    category: string;
    name: string;
    price: number;
    imageUrl?: string;
  }>;
}

export interface CreateCheckoutOrderInput {
  idToken: string;
  operationId: string;
  cartItems: CreateCheckoutOrderCartItemInput[];
  paymentMethod: PaymentMethod;
  shippingMethod: ShippingMethod;
  shippingAddress: OrderShippingAddress;
  includeCrateProtection?: boolean;
  voucherCode?: string | null;
}

/**
 * Verifies user authentication and payload schema, flattens cart items
 * into authoritative component line items, validates and deducts stock in Firestore,
 * and creates a persistent `orders/{orderId}` document.
 */
export async function createCheckoutOrder(
  rawInput: CreateCheckoutOrderInput
): Promise<CheckoutOrderResult> {
  const parsed = createCheckoutOrderSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error:
        parsed.error.issues[0]?.message ||
        "Invalid checkout order details. Please review your shipping and payment fields.",
    };
  }

  const input = parsed.data;

  try {
    const decoded = await getAdminAuth().verifyIdToken(input.idToken, true);
    const db = getAdminFirestore();
    const userSnap = await db.collection("users").doc(decoded.uid).get();
    const userProfile = userSnap.data();
    if (
      decoded.isManager === true ||
      decoded.isSuperAdmin === true ||
      userProfile?.isManager === true ||
      userProfile?.isSuperAdmin === true
    ) {
      return {
        success: false,
        error: "Staff accounts cannot place customer orders.",
      };
    }

    const flattenedItems: OrderItem[] = [];
    let detectedOrderType: "prebuilt" | "custom" | undefined;
    let detectedPrebuiltName: string | undefined;

    for (let cartItemIndex = 0; cartItemIndex < input.cartItems.length; cartItemIndex++) {
      const cartItem = input.cartItems[cartItemIndex];
      const cartQty = Math.max(1, Math.floor(Number(cartItem.quantity ?? 1)));

      if (cartItem.kind === "custom-build" && !detectedOrderType) {
        detectedOrderType = "custom";
      } else if (cartItem.kind === "prebuilt") {
        detectedOrderType = "prebuilt";
        detectedPrebuiltName = detectedPrebuiltName || cartItem.name;
      }

      if (
        (cartItem.kind === "custom-build" || cartItem.kind === "prebuilt") &&
        Array.isArray(cartItem.components) &&
        cartItem.components.length > 0
      ) {
        const groupName =
          cartItem.kind === "custom-build" ? "My Build" : cartItem.name;
        const buildType = cartItem.kind;
        const prebuiltName =
          cartItem.kind === "prebuilt" ? cartItem.name : undefined;

        for (let q = 0; q < cartQty; q++) {
          for (const sub of cartItem.components) {
            const isStockCooler =
              sub.id === "included-stock-cooler" ||
              sub.name.toLowerCase().includes("included stock cooler") ||
              (sub.category.toUpperCase() === "COOLER" && sub.price === 0);
            const isIntegratedGpu =
              sub.id === INCLUDED_INTEGRATED_GPU_ID ||
              (sub.category.toUpperCase() === "GPU" && sub.price === 0);

            flattenedItems.push({
              id: isStockCooler
                ? "included-stock-cooler"
                : isIntegratedGpu
                  ? INCLUDED_INTEGRATED_GPU_ID
                  : sub.id || sub.name,
              productId: sub.productId,
              category: sub.category,
              name: sub.name,
              price: sub.price,
              quantity: 1,
              imageUrl: sub.imageUrl,
              groupName,
              buildType,
              prebuiltName,
            });
          }
        }
      } else if (cartItem.kind === "prebuilt") {
        const rawSystemId = cartItem.id.replace(/^prebuilt-/, "");
        let prebuiltDoc = await db
          .collection("prebuiltSystems")
          .doc(rawSystemId)
          .get();
        if (!prebuiltDoc.exists && cartItem.productId) {
          const target = await productReference(cartItem.productId, "prebuilt");
          if (target) prebuiltDoc = await target.ref.get();
        }
        const prebuiltData = prebuiltDoc.data();
        if (!prebuiltDoc.exists || !prebuiltData?.components) {
          return {
            success: false,
            error: `Prebuilt system "${cartItem.name}" could not be resolved.`,
          };
        }
        for (let q = 0; q < cartQty; q++) {
          for (const [cat, val] of Object.entries(
            prebuiltData.components as Record<string, string | string[]>
          )) {
            const ids = Array.isArray(val) ? val : [val];
            for (const partId of ids.filter(Boolean)) {
              flattenedItems.push({
                id: String(partId),
                category: inventoryCategoryLabel(cat),
                name: String(partId),
                price: 0,
                quantity: 1,
                groupName: cartItem.name,
                buildType: "prebuilt",
                prebuiltName: cartItem.name,
              });
            }
          }
        }
      } else {
        flattenedItems.push({
          id: cartItem.id,
          productId: cartItem.productId,
          category: cartItem.category || "CPU",
          name: cartItem.name,
          price: cartItem.price,
          quantity: cartQty,
          imageUrl: cartItem.imageUrl,
          groupName: "Additional",
          buildType: "part",
        });
      }
    }

    return await processCheckoutInternal(
      {
        uid: decoded.uid,
        email: decoded.email || userProfile?.email || input.shippingAddress.email,
      },
      flattenedItems,
      {
        paymentMethod: input.paymentMethod,
        shippingMethod: input.shippingMethod,
        shippingAddress: input.shippingAddress,
        includeCrateProtection: input.includeCrateProtection,
        voucherCode: input.voucherCode,
        operationId: input.operationId,
        orderType: detectedOrderType,
        prebuiltName: detectedPrebuiltName,
      }
    );
  } catch (error) {
    console.error("createCheckoutOrder failed:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to complete checkout.",
    };
  }
}

export interface ResolveSimulatedPaymentInput {
  orderId: string;
  outcome: SimulatedPaymentOutcome;
  idToken: string;
  operationId?: string;
  paymentChannel?: string;
  paymentId?: string;
}

export interface SimulatedPaymentResult {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paymentReference?: string | null;
  paidAt?: string | null;
  paymongoCheckoutUrl?: string | null;
  paymongoCheckoutSessionId?: string | null;
  paymongoMode?: "live_test_api" | "local_sandbox_fallback";
  error?: string;
}

/**
 * Processes an in-app simulated payment outcome ('success' | 'failed' | 'cancelled')
 * for simulated methods (such as Simulated GCash). Never allows simulated outcomes
 * to confirm a PayMongo gateway payment.
 */
export async function resolveSimulatedPayment(
  rawInput: ResolveSimulatedPaymentInput
): Promise<SimulatedPaymentResult> {
  const parsed = resolveSimulatedPaymentSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid simulated payment request.",
    };
  }
  return resolvePaymentOutcome(parsed.data, false);
}

async function resolvePaymentOutcome(
  input: ResolveSimulatedPaymentInput,
  verifiedPaymongoSession: boolean
): Promise<SimulatedPaymentResult> {
  const firestore = getAdminFirestore();

  try {
    const { decoded, actorProfile, isSuperAdmin, isManager, isStaff } = await getOrderActor(input.idToken);

    const txResult = await firestore.runTransaction(async (transaction) => {
      const orderRef = firestore.collection("orders").doc(input.orderId);
      const orderSnap = await transaction.get(orderRef);

      if (!orderSnap.exists) {
        throw new Error("Order not found.");
      }

      const orderData = orderSnap.data() as Order;
      if (orderData.isArchived) {
        throw new Error("Cannot process payment for an archived order.");
      }
      if (!isStaff && orderData.userId !== decoded.uid) {
        throw new Error("You do not have permission to modify this order.");
      }
      if (orderData.status === "cancelled") {
        throw new Error(
          "This order has been cancelled and cannot accept payment."
        );
      }

      const paymentMethod: PaymentMethod =
        orderData.paymentMethod ?? "gcash_simulated";
      if (paymentMethod === "cod") {
        throw new Error(
          "Cash on Delivery orders do not use online payment checkout."
        );
      }

      const usesLivePaymongoSession =
        paymentMethod === "paymongo_simulated" &&
        (isPaymongoTestApiConfigured() ||
          orderData.paymongoMode === "live_test_api" ||
          Boolean(orderData.paymongoCheckoutUrl) ||
          Boolean(
            orderData.paymongoCheckoutSessionId &&
              !orderData.paymongoCheckoutSessionId.startsWith("cs_sim_")
          ));

      // Gateway protection: never let an unverified simulated outcome confirm a PayMongo order.
      if (paymentMethod === "paymongo_simulated" && !verifiedPaymongoSession) {
        if (input.outcome === "success" || usesLivePaymongoSession) {
          throw new Error(
            "PayMongo payments cannot be confirmed via simulated outcomes. Complete checkout on PayMongo and verify session status."
          );
        }
      }

      if (orderData.paymentStatus === "paid") {
        if (input.outcome === "success") {
          return {
            orderId: input.orderId,
            orderNumber: orderData.orderNumber || input.orderId.slice(0, 8),
            paymentMethod,
            paymentStatus: "paid" as PaymentStatus,
            paymentReference: orderData.paymentReference || null,
            paidAt: orderData.paidAt?.toDate
              ? orderData.paidAt.toDate().toISOString()
              : new Date().toISOString(),
          };
        }
        throw new Error(
          "This order is already marked as Paid and cannot be changed to failed or cancelled."
        );
      }

      const now = admin.firestore.Timestamp.now();
      const nextAttempts = (Number(orderData.paymentAttempts) || 0) + 1;
      const paymentReference =
        orderData.paymentReference ||
        generateSimulatedPaymentReference(paymentMethod);

      const gatewayName =
        paymentMethod === "paymongo_simulated" ? "PayMongo" : "GCash";
      const channelSuffix = input.paymentChannel
        ? ` (${input.paymentChannel.toUpperCase()})`
        : "";

      let nextPaymentStatus: PaymentStatus;
      let lastPaymentError: string | null = null;
      let paidAt: admin.firestore.Timestamp | null = null;
      let notifTitle = "";
      let notifMessage = "";
      let auditDetails = "";

      const displayOrderNum =
        orderData.orderNumber || `#${input.orderId.substring(0, 8)}`;

      if (input.outcome === "success") {
        nextPaymentStatus = "paid";
        paidAt = now;
        lastPaymentError = null;
        notifTitle = `${gatewayName} Payment Confirmed`;
        notifMessage = `${gatewayName}${channelSuffix} payment of ₱${orderData.totalPrice.toLocaleString()} for order ${displayOrderNum} was confirmed (Ref: ${paymentReference}).`;
        auditDetails = `${gatewayName}${channelSuffix} payment succeeded (Ref: ${paymentReference}, Attempt #${nextAttempts})`;
      } else if (input.outcome === "failed") {
        nextPaymentStatus = "failed";
        lastPaymentError = `${gatewayName}${channelSuffix} payment was declined.`;
        notifTitle = `${gatewayName} Payment Failed`;
        notifMessage = `${gatewayName} payment for order ${displayOrderNum} was marked as failed. You can retry payment from your Order History.`;
        auditDetails = `${gatewayName}${channelSuffix} payment failed (Ref: ${paymentReference}, Attempt #${nextAttempts})`;
      } else {
        nextPaymentStatus = "cancelled";
        lastPaymentError = `${gatewayName} checkout was cancelled before completion.`;
        notifTitle = `${gatewayName} Payment Cancelled`;
        notifMessage = `${gatewayName} checkout for order ${displayOrderNum} was cancelled. You can retry payment or switch to Cash on Delivery.`;
        auditDetails = `${gatewayName}${channelSuffix} payment cancelled by user (Ref: ${paymentReference}, Attempt #${nextAttempts})`;
      }

      const historyEvent: OrderPaymentEvent = {
        id: `evt_${Date.now().toString(36)}_${nextAttempts}`,
        status: nextPaymentStatus,
        method: paymentMethod,
        reference: paymentReference,
        amount: orderData.totalPrice,
        actorId: decoded.uid,
        actorName: verifiedPaymongoSession
          ? "PayMongo Session Verification"
          : actorProfile?.name || decoded.email || "Customer",
        actorRole: verifiedPaymongoSession
          ? "System"
          : isSuperAdmin
            ? "Super Admin"
            : isManager
              ? "Manager"
              : "Customer",
        note: auditDetails,
        createdAt: now,
      };

      writeOrderChange(transaction, orderRef, orderData, {
        paymentMethod,
        paymentStatus: nextPaymentStatus,
        paymentReference,
        paymentHistory: [...(orderData.paymentHistory || []), historyEvent],
        paymentUpdatedAt: now,
        ...(paidAt ? { paidAt } : {}),
        ...(input.paymentChannel
          ? { paymongoPaymentChannel: input.paymentChannel }
          : {}),
        ...(verifiedPaymongoSession && input.paymentId
          ? { paymongoPaymentId: input.paymentId }
          : {}),
        paymentAttempts: nextAttempts,
        lastPaymentError,
        isSimulatedPayment: !verifiedPaymongoSession,
        updatedAt: now,
      });

      const notificationRef = firestore
        .collection("users")
        .doc(orderData.userId)
        .collection("notifications")
        .doc();
      transaction.set(notificationRef, {
        id: notificationRef.id,
        userId: orderData.userId,
        orderId: input.orderId,
        title: notifTitle,
        message: notifMessage,
        status: orderData.status,
        read: false,
        createdAt: now,
      });

      const userAuditRef = firestore.collection("user_auditLogs").doc();
      transaction.set(userAuditRef, {
        id: userAuditRef.id,
        userId: orderData.userId,
        userEmail: orderData.userEmail,
        actionName: "updated",
        scope: "Order",
        activityRecorded: true,
        resourceName: `Order ${displayOrderNum}`,
        resourceId: input.orderId,
        details: auditDetails,
        createdAt: now,
      });

      return {
        orderId: input.orderId,
        orderNumber: displayOrderNum,
        paymentMethod,
        paymentStatus: nextPaymentStatus,
        paymentReference,
        paidAt: paidAt ? paidAt.toDate().toISOString() : null,
      };
    });

    pruneUserNotificationsServer(firestore, decoded.uid).catch(() => {});

    return {
      success: true,
      ...txResult,
    };
  } catch (error) {
    console.error("Failed to resolve payment outcome:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to process payment outcome.",
    };
  }
}

/**
 * Creates or refreshes a PayMongo Test Checkout Session (`POST /v1/checkout_sessions`)
 * for an existing order so the customer can launch or retry PayMongo Checkout.
 */
export async function createOrderPaymongoCheckoutSession(
  rawOrderId: string,
  rawIdToken: string,
  rawBaseUrl?: string
): Promise<SimulatedPaymentResult> {
  const parsed = createPaymongoSessionSchema.safeParse({
    orderId: rawOrderId,
    idToken: rawIdToken,
    baseUrl: rawBaseUrl,
  });
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid PayMongo checkout session request.",
    };
  }

  const { orderId, idToken, baseUrl } = parsed.data;
  const firestore = getAdminFirestore();

  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken, true);
    const orderRef = firestore.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      throw new Error("Order not found.");
    }

    const orderData = orderSnap.data() as Order;
    if (orderData.userId !== decoded.uid) {
      throw new Error("You do not have permission to access this order.");
    }
    if (orderData.status === "cancelled" || orderData.isArchived) {
      throw new Error("Cancelled or archived orders cannot initiate payment.");
    }
    if (orderData.paymentStatus === "paid") {
      return {
        success: true,
        orderId,
        orderNumber: orderData.orderNumber || orderId.slice(0, 8),
        paymentMethod: "paymongo_simulated",
        paymentStatus: "paid",
        paymentReference: orderData.paymentReference || null,
      };
    }

    const paymentReference =
      orderData.paymentReference &&
      (orderData.paymentReference.startsWith("PM-") ||
        orderData.paymentReference.startsWith("SIM-PM-"))
        ? orderData.paymentReference
        : generateSimulatedPaymentReference("paymongo_simulated");

    const displayOrderNum =
      orderData.orderNumber || `BB-${orderId.substring(0, 8).toUpperCase()}`;

    const session = await createPaymongoCheckoutSession({
      orderId,
      orderNumber: displayOrderNum,
      paymentReference,
      totalPricePhp: orderData.totalPrice,
      subtotalPhp: orderData.subtotal,
      shippingFeePhp: orderData.shippingFee,
      protectionFeePhp: orderData.protectionFee,
      discountAmountPhp: orderData.discountAmount,
      voucherCode: orderData.voucherCode,
      items: orderData.items || [],
      customerEmail: orderData.userEmail,
      shippingAddress: orderData.shippingAddress,
      baseUrl,
    });

    const now = admin.firestore.Timestamp.now();
    await saveOrderPaymentSession(orderRef, {
      paymentMethod: "paymongo_simulated",
      paymentStatus: "pending",
      paymentReference,
      paymongoCheckoutSessionId: session.checkoutSessionId,
      paymongoCheckoutUrl: session.checkoutUrl,
      paymongoMode: session.mode,
      paymentUpdatedAt: now,
      updatedAt: now,
    }, { actorId: decoded.uid, actorName: decoded.email || "Customer", actorRole: "Customer" });

    return {
      success: true,
      orderId,
      orderNumber: displayOrderNum,
      paymentMethod: "paymongo_simulated",
      paymentStatus: "pending",
      paymentReference,
      paymongoCheckoutSessionId: session.checkoutSessionId,
      paymongoCheckoutUrl: session.checkoutUrl,
      paymongoMode: session.mode,
    };
  } catch (error) {
    console.error("createOrderPaymongoCheckoutSession failed:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to create PayMongo Checkout Session.",
    };
  }
}

/**
 * Queries PayMongo's v1 API (`GET /v1/checkout_sessions/:id`) to verify the live
 * status of an order's Checkout Session and synchronizes Firestore `paymentStatus`.
 */
export async function verifyAndSyncPaymongoOrder(rawInput: {
  orderId: string;
  idToken: string;
  redirectHint?: "success" | "cancelled";
}): Promise<SimulatedPaymentResult> {
  const parsed = verifyPaymongoOrderSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid PayMongo verification request.",
    };
  }

  const input = parsed.data;
  const firestore = getAdminFirestore();

  try {
    const { decoded, isStaff } = await getOrderActor(input.idToken);

    const orderRef = firestore.collection("orders").doc(input.orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      throw new Error("Order not found.");
    }

    const orderData = orderSnap.data() as Order;
    if (!isStaff && orderData.userId !== decoded.uid) {
      throw new Error("You do not have permission to verify this order.");
    }

    const displayOrderNum =
      orderData.orderNumber || `#${input.orderId.substring(0, 8)}`;

    if (orderData.paymentStatus === "paid") {
      return {
        success: true,
        orderId: input.orderId,
        orderNumber: displayOrderNum,
        paymentMethod: orderData.paymentMethod || "paymongo_simulated",
        paymentStatus: "paid",
        paymentReference: orderData.paymentReference || null,
        paidAt: orderData.paidAt?.toDate
          ? orderData.paidAt.toDate().toISOString()
          : new Date().toISOString(),
      };
    }

    if (
      input.redirectHint === "cancelled" &&
      (!isPaymongoTestApiConfigured() ||
        !orderData.paymongoCheckoutSessionId ||
        orderData.paymongoCheckoutSessionId.startsWith("cs_sim_"))
    ) {
      return await resolvePaymentOutcome(
        {
          orderId: input.orderId,
          outcome: "cancelled",
          idToken: input.idToken,
        },
        true
      );
    }

    if (
      !isPaymongoTestApiConfigured() ||
      !orderData.paymongoCheckoutSessionId ||
      orderData.paymongoCheckoutSessionId.startsWith("cs_sim_")
    ) {
      return {
        success: true,
        orderId: input.orderId,
        orderNumber: displayOrderNum,
        paymentMethod: orderData.paymentMethod || "paymongo_simulated",
        paymentStatus: orderData.paymentStatus || "pending",
        paymentReference: orderData.paymentReference || null,
        paymongoMode: "local_sandbox_fallback",
      };
    }

    const verification = await retrievePaymongoCheckoutSession(
      orderData.paymongoCheckoutSessionId
    );

    if (verification.status === "paid") {
      return await resolvePaymentOutcome(
        {
          orderId: input.orderId,
          outcome: "success",
          idToken: input.idToken,
          paymentChannel: verification.paymentChannel || "paymongo",
          paymentId: verification.paymentId || undefined,
        },
        true
      );
    }

    if (verification.status === "failed") {
      return await resolvePaymentOutcome(
        {
          orderId: input.orderId,
          outcome: "failed",
          idToken: input.idToken,
          paymentChannel: verification.paymentChannel || "paymongo",
        },
        true
      );
    }

    if (
      input.redirectHint === "cancelled" ||
      verification.status === "expired"
    ) {
      return await resolvePaymentOutcome(
        {
          orderId: input.orderId,
          outcome: "cancelled",
          idToken: input.idToken,
        },
        true
      );
    }

    return {
      success: true,
      orderId: input.orderId,
      orderNumber: displayOrderNum,
      paymentMethod: "paymongo_simulated",
      paymentStatus: "pending",
      paymentReference: orderData.paymentReference || null,
      paymongoCheckoutSessionId: orderData.paymongoCheckoutSessionId,
      paymongoCheckoutUrl: orderData.paymongoCheckoutUrl || null,
      paymongoMode: "live_test_api",
    };
  } catch (error) {
    console.error("verifyAndSyncPaymongoOrder failed:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not verify PayMongo Checkout Session.",
    };
  }
}

/**
 * Allows a customer to switch an unpaid/failed/cancelled online order
 * to Cash on Delivery (COD) so their order proceeds with paymentStatus: 'unpaid'.
 */
export async function switchOrderPaymentToCod(
  rawOrderId: string,
  rawIdToken: string
): Promise<SimulatedPaymentResult> {
  const parsed = switchToCodSchema.safeParse({
    orderId: rawOrderId,
    idToken: rawIdToken,
  });
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid payment switch request.",
    };
  }

  const { orderId, idToken } = parsed.data;
  const firestore = getAdminFirestore();

  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken, true);
    const result = await firestore.runTransaction(async (transaction) => {
      const orderRef = firestore.collection("orders").doc(orderId);
      const orderSnap = await transaction.get(orderRef);

      if (!orderSnap.exists) {
        throw new Error("Order not found.");
      }

      const orderData = orderSnap.data() as Order;
      if (orderData.userId !== decoded.uid) {
        throw new Error("You do not have permission to update this order.");
      }
      if (orderData.status === "cancelled" || orderData.isArchived) {
        throw new Error("Cancelled or archived orders cannot be modified.");
      }
      if (orderData.paymentStatus === "paid") {
        throw new Error("This order is already paid.");
      }

      const now = admin.firestore.Timestamp.now();
      const newRef = generateSimulatedPaymentReference("cod");
      const displayOrderNum =
        orderData.orderNumber || `#${orderId.substring(0, 8)}`;

      const switchEvent: OrderPaymentEvent = {
        id: `evt_cod_${Date.now().toString(36)}`,
        status: "unpaid",
        method: "cod",
        reference: newRef,
        amount: orderData.totalPrice,
        actorId: decoded.uid,
        actorName: decoded.email || orderData.userEmail || "Customer",
        actorRole: "Customer",
        note: "Switched payment method to Cash on Delivery.",
        createdAt: now,
      };

      writeOrderChange(transaction, orderRef, orderData, {
        paymentMethod: "cod",
        paymentStatus: "unpaid",
        paymentReference: newRef,
        paymentHistory: [...(orderData.paymentHistory || []), switchEvent],
        paymentUpdatedAt: now,
        lastPaymentError: null,
        isSimulatedPayment: false,
        updatedAt: now,
      });

      const userAuditRef = firestore.collection("user_auditLogs").doc();
      transaction.set(userAuditRef, {
        id: userAuditRef.id,
        userId: orderData.userId,
        userEmail: orderData.userEmail,
        actionName: "updated",
        scope: "Order",
        activityRecorded: true,
        resourceName: `Order ${displayOrderNum}`,
        resourceId: orderId,
        details: `Switched payment method to Cash on Delivery (Ref: ${newRef})`,
        createdAt: now,
      });

      return {
        orderId,
        orderNumber: displayOrderNum,
        paymentMethod: "cod" as PaymentMethod,
        paymentStatus: "unpaid" as PaymentStatus,
        paymentReference: newRef,
        paidAt: null,
      };
    });

    return { success: true, ...result };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not switch payment method to Cash on Delivery.",
    };
  }
}

/**
 * Allows Managers and Super Admins to update an order's paymentStatus across all methods
 * under the unified order transition policy.
 */
export async function updateOrderPaymentStatusByStaff(
  rawOrderId: string,
  rawNewPaymentStatus: PaymentStatus,
  rawIdToken: string,
  rawReason?: string,
  operation?: z.infer<typeof operationSchema>,
  cashConfirmation?: CashConfirmation
): Promise<{ success: boolean; error?: string }> {
  const parsed = staffPaymentStatusSchema.safeParse({
    orderId: rawOrderId,
    newPaymentStatus: rawNewPaymentStatus,
    idToken: rawIdToken,
    reason: rawReason,
    operation,
    cashConfirmation,
  });
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid payment status update request.",
    };
  }

  const { orderId, newPaymentStatus, idToken, reason } = parsed.data;
  const firestore = getAdminFirestore();

  try {
    const { decoded, actorProfile, isSuperAdmin, isManager, isStaff } = await getOrderActor(idToken);

    if (!isStaff) {
      throw new Error(
        "Only Managers or Super Admins can update order payment status."
      );
    }

    const actorRole: "Manager" | "Super Admin" = isSuperAdmin
      ? "Super Admin"
      : "Manager";
    const actorName =
      actorProfile?.name || actorProfile?.email || decoded.email || actorRole;

    await runOrderOperation(firestore, orderId, decoded.uid, parsed.data.operation, { action: "payment", newPaymentStatus, reason: reason || "", cashConfirmation: parsed.data.cashConfirmation || null }, async (transaction) => {
      const orderRef = firestore.collection("orders").doc(orderId);
      const orderSnap = await transaction.get(orderRef);

      if (!orderSnap.exists) {
        throw new Error("Order not found.");
      }

      const orderData = orderSnap.data() as Order;
      if (orderData.paymentStatus === newPaymentStatus) {
        return;
      }

      assertStaffPaymentStatusTransition(orderData, newPaymentStatus, reason);
      assertCashConfirmation(orderData, newPaymentStatus, parsed.data.operation, parsed.data.cashConfirmation);

      const now = admin.firestore.Timestamp.now();
      const paymentMethod: PaymentMethod = orderData.paymentMethod ?? "cod";
      const paymentReference =
        orderData.paymentReference ||
        generateSimulatedPaymentReference(paymentMethod);
      const displayOrderNum =
        orderData.orderNumber || `#${orderId.substring(0, 8)}`;
      const cleanReason =
        reason?.trim() ||
        (paymentMethod === "cod" && newPaymentStatus === "paid"
          ? "Cash on Delivery / Store Pickup payment collected"
          : `Payment status updated to ${newPaymentStatus}`);

      const priorHistory = [...(orderData.paymentHistory || [])];
      if (orderData.paymentStatus === 'paid' && newPaymentStatus !== 'paid' && !priorHistory.some(event => event.status === 'paid')) {
        priorHistory.push({ id: `legacy:${orderId}:paid`, status: 'paid', method: paymentMethod, amount: orderData.totalPrice,
          reference: paymentReference, actorName: 'Legacy payment record', actorRole: 'System', createdAt: orderData.paidAt || null,
          note: 'Historical paid status captured before correction. Original collector not recorded.' });
      }
      const staffPaymentEvent: OrderPaymentEvent = {
        id: `evt_staff_${parsed.data.operation?.operationId || randomUUID()}`,
        ...getPaymentEventLink({ ...orderData, id: orderId }, newPaymentStatus),
        status: newPaymentStatus,
        method: paymentMethod,
        reference: paymentReference,
        amount: orderData.totalPrice,
        actorId: decoded.uid,
        actorName,
        actorRole,
        note: cleanReason,
        createdAt: now,
      };

      writeOrderChange(transaction, orderRef, orderData, {
        paymentMethod,
        paymentStatus: newPaymentStatus,
        paymentReference,
        paymentHistory: [...priorHistory, staffPaymentEvent],
        paymentUpdatedAt: now,
        paidAt: newPaymentStatus === "paid" ? now : null,
        ...(newPaymentStatus === "paid" ? { lastPaymentError: null } : {}),
        updatedAt: now,
      });

      if (orderData.userId) {
        const notificationRef = firestore
          .collection("users")
          .doc(orderData.userId)
          .collection("notifications")
          .doc();
        transaction.set(notificationRef, {
          id: notificationRef.id,
          userId: orderData.userId,
          orderId,
          title: "Payment Status Updated",
          message: `Your payment status for order ${displayOrderNum} (${getPaymentMethodLabel(paymentMethod)}) has been updated to ${newPaymentStatus.toUpperCase()}.`,
          status: orderData.status,
          read: false,
          createdAt: now,
        });
      }

      const auditRef = firestore.collection("auditLogs").doc();
      transaction.set(auditRef, {
        id: auditRef.id,
        actionName: "payment_updated",
        actorId: decoded.uid,
        actorName,
        actorEmail: decoded.email || "",
        scope: "Order",
        activityRecorded: true,
        resourceName: `Order ${displayOrderNum}`,
        resourceId: orderId,
        details: `${actorRole} ${actorName} updated payment status to "${newPaymentStatus}" (${getPaymentMethodLabel(paymentMethod)}, Ref: ${paymentReference}). Reason: ${cleanReason}`,
        createdAt: now,
      });

      if (isManager && !isSuperAdmin) {
        const sysNotifRef = firestore.collection("system_notifications").doc();
        transaction.set(sysNotifRef, {
          id: sysNotifRef.id,
          type: "status_changed",
          actorId: decoded.uid,
          actorName,
          title: "Payment Updated (Manager)",
          message: `Manager ${actorName} set payment for order ${displayOrderNum} to ${newPaymentStatus.toUpperCase()}.`,
          targetId: orderId,
          readBy: [],
          createdAt: now,
        });
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to update payment status by staff:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update payment status.",
    };
  }
}

export async function updateOrderFulfillmentStageByStaff(
  input: z.infer<typeof staffFulfillmentSchema>
) {
  const parsed = staffFulfillmentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid fulfillment stage request." };
  }

  try {
    const { decoded, firestore, actorProfile: actor, isSuperAdmin, isManager } = await getOrderActor(parsed.data.idToken);

    if (!isManager && !isSuperAdmin) {
      throw new Error("Only Managers and Super Admins can update fulfillment.");
    }

    const actorName =
      actor?.name || actor?.email || decoded.email || "Staff";

    await runOrderOperation(firestore, parsed.data.orderId, decoded.uid, parsed.data.operation, { action: "stage", stage: parsed.data.stage }, async (transaction) => {
      const ref = firestore.collection("orders").doc(parsed.data.orderId);
      const snap = await transaction.get(ref);
      if (!snap.exists) throw new Error("Order not found.");

      const order = snap.data() as Order;
      const nextStage = parsed.data.stage as OrderFulfillmentStage;
      assertOrderStageTransition(order, nextStage);

      if (nextStage === 'out_for_delivery' || nextStage === 'delivered') {
        const customRigs = getCustomRigsFromOrder(order);
        if (
          customRigs.length > 0 &&
          order.fulfillmentStage !== 'out_for_delivery' &&
          order.fulfillmentStage !== 'delivered'
        ) {
          const verifications: Record<string, RigVerificationRecord | null> = {};
          for (const rig of customRigs) {
            const rigDoc = await transaction.get(ref.collection('assembly').doc(rig.rigId));
            if (rigDoc.exists) {
              verifications[rig.rigId] = rigDoc.data() as RigVerificationRecord;
            } else {
              verifications[rig.rigId] = null;
            }
          }
          assertCustomRigDispatchAllowed(order, verifications);
        }
      }

      const now = admin.firestore.Timestamp.now();
      const legacyStatus = getLegacyStatusFromStage(nextStage);
      const stageLabel = getOrderFulfillmentStageLabel({
        ...order,
        status: legacyStatus,
        fulfillmentStage: nextStage,
      });
      const displayOrderNum =
        order.orderNumber || parsed.data.orderId.slice(0, 8);

      writeOrderChange(transaction, ref, order, {
        fulfillmentStage: nextStage,
        status: legacyStatus,
        updatedAt: now,
      }, { actorId: decoded.uid, actorName, actorRole: isSuperAdmin ? "Super Admin" : "Manager" }, parsed.data.operation?.operationId);

      const auditRef = firestore.collection("auditLogs").doc();
      transaction.set(auditRef, {
        id: auditRef.id,
        actionName: "status_changed",
        actorId: decoded.uid,
        actorName,
        actorEmail: decoded.email || "",
        scope: "Order",
        activityRecorded: true,
        resourceName: `Order ${displayOrderNum}`,
        resourceId: parsed.data.orderId,
        details: `Fulfillment advanced to ${stageLabel} (${nextStage})`,
        createdAt: now,
      });

      if (isManager && !isSuperAdmin) {
        const sysNotifRef = firestore.collection("system_notifications").doc();
        transaction.set(sysNotifRef, {
          id: sysNotifRef.id,
          type: "status_changed",
          actorId: decoded.uid,
          actorName,
          title: "Fulfillment Updated (Manager)",
          message: `Manager ${actorName} advanced order ${displayOrderNum} to ${stageLabel}.`,
          targetId: parsed.data.orderId,
          readBy: [],
          createdAt: now,
        });
      }

      if (order.userId) {
        const notificationRef = firestore
          .collection("users")
          .doc(order.userId)
          .collection("notifications")
          .doc();
        transaction.set(notificationRef, {
          id: notificationRef.id,
          userId: order.userId,
          orderId: parsed.data.orderId,
          title: "Order Fulfillment Updated",
          message: `Order ${displayOrderNum} is now: ${stageLabel}.`,
          status: legacyStatus,
          read: false,
          createdAt: now,
        });
      }
    });

    return { success: true };
  } catch (error) {
    console.error("updateOrderFulfillmentStageByStaff failed:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to update fulfillment.",
    };
  }
}

export async function updateReservationStatus(
  rawOrderId: string,
  rawNewStatus: Order["status"],
  rawIdToken: string,
  operation?: z.infer<typeof operationSchema>
) {
  const parsed = updateReservationStatusSchema.safeParse({
    orderId: rawOrderId,
    newStatus: rawNewStatus,
    operation,
    idToken: rawIdToken,
  });
  if (!parsed.success) {
    return { success: false, error: "Invalid order status update request." };
  }

  const { orderId, newStatus, idToken } = parsed.data;
  const firestore = getAdminFirestore();
  let targetUserId: string | null = null;

  try {
    const { decoded, actorProfile, isSuperAdmin, isManager, isStaff } = await getOrderActor(idToken);
    const actor = isStaff
      ? {
          id: decoded.uid,
          name:
            actorProfile?.name ||
            actorProfile?.email ||
            decoded.email ||
            "Staff",
          email: actorProfile?.email || decoded.email || "",
          role: isSuperAdmin ? ("Super Admin" as const) : ("Manager" as const),
          isManager: true,
          isSuperAdmin,
        }
      : undefined;

    await runOrderOperation(firestore, orderId, decoded.uid, parsed.data.operation, { action: "cancel", newStatus }, async (transaction) => {
      const orderRef = firestore.collection("orders").doc(orderId);
      const orderSnap = await transaction.get(orderRef);

      if (!orderSnap.exists) {
        throw new Error("Order not found.");
      }

      const orderData = orderSnap.data() as Order;
      const currentStatus = orderData.status;
      const currentStage = getOrderFulfillmentStage(orderData);

      if (orderData.isArchived) {
        throw new Error("Restore the order before changing its status.");
      }
      if (currentStatus === "cancelled" && newStatus !== "cancelled") {
        throw new Error("Cancelled orders cannot be reopened.");
      }
      if (newStatus !== "cancelled" && isStaff) {
        throw new Error("Use the fulfillment workflow to advance an order.");
      }
      if (newStatus === "cancelled" && currentStage === "delivered") {
        throw new Error("Delivered orders require a refund workflow instead of cancellation.");
      }
      if (!isStaff) {
        if (decoded.uid !== orderData.userId || newStatus !== "cancelled") {
          throw new Error("You do not have permission to cancel this order.");
        }
        if (requiresStaffCancellation(orderData)) {
          throw new Error("Orders currently in 'To Build' or 'To Receive' cannot be cancelled directly. Please contact staff or management to cancel this order.");
        }
        if (currentStage !== "order_placed") {
          throw new Error("You do not have permission to cancel this order.");
        }
      }

      targetUserId = orderData.userId;

      if (currentStatus === newStatus) {
        return;
      }

            const isDispatched = currentStage === "out_for_delivery" || currentStage === "delivered";
      // If unshipped (order_placed or assembling_testing): auto-restore stock once-only
      // If already dispatched (out_for_delivery or delivered): physical return confirmation required before restoring stock!
      const shouldAutoRestoreStock = newStatus === "cancelled" && !isDispatched;

      const preparedStock = shouldAutoRestoreStock
        ? await prepareOrderStockRestore(firestore, transaction, orderData)
        : { alreadyRestored: true, entries: [] };

      let restoreResult = { restored: false, missingItems: [] as Array<{ path: string; quantity: number }> };
      if (shouldAutoRestoreStock) {
        restoreResult = applyOrderStockRestore(transaction, preparedStock);
      }

      const now = admin.firestore.Timestamp.now();
      const shouldCancelUnpaidPayment =
        newStatus === "cancelled" &&
        orderData.paymentStatus !== "paid" &&
        orderData.paymentStatus !== "cancelled";
      const displayOrderNum =
        orderData.orderNumber || `#${orderId.substring(0, 8)}`;

      const nextHistory: OrderPaymentEvent[] = [...(orderData.paymentHistory || [])];
      if (shouldCancelUnpaidPayment) {
        nextHistory.push({
          id: `evt_cancel_${Date.now().toString(36)}`,
          status: "cancelled",
          method: orderData.paymentMethod ?? "cod",
          reference: orderData.paymentReference,
          amount: orderData.totalPrice,
          actorId: decoded.uid,
          actorName: actor ? actor.name : orderData.userEmail || "Customer",
          actorRole: actor ? actor.role : "Customer",
          note: "Unpaid payment voided upon order cancellation.",
          createdAt: now,
        });
      }

      writeOrderChange(transaction, orderRef, orderData, {
        status: newStatus,
        ...(newStatus === "cancelled"
          ? {
              stockState: isDispatched
                ? "pending_return"
                : restoreResult.missingItems.length > 0
                  ? "restored_with_exceptions"
                  : "restored",
              physicalReturnRequired: isDispatched,
              ...(shouldAutoRestoreStock && !orderData.stockRestoredAt ? { stockRestoredAt: now } : {}),
              ...(restoreResult.missingItems.length > 0 ? { stockExceptions: restoreResult.missingItems } : {}),
              cancelledAt: now,
              cancellationReason: actor
                ? `Cancelled by ${actor.role} ${actor.name}`
                : "Cancelled by customer",
              ...(orderData.paymentStatus === "paid" &&
              getRefundedAmount(orderData) < orderData.totalPrice &&
              orderData.refundStatus !== "pending"
                ? {
                    refundStatus:
                      getRefundedAmount(orderData) > 0 ? "partial" : "due",
                  }
                : {}),
            }
          : {}),
        ...(shouldCancelUnpaidPayment
          ? {
              paymentStatus: "cancelled",
              paymentHistory: nextHistory,
              paymentUpdatedAt: now,
            }
          : {}),
        updatedAt: now,
      }, { actorId: decoded.uid, actorName: actor?.name || orderData.userEmail, actorRole: actor?.role || "Customer" });

      if (orderData.userId) {
        const notificationRef = firestore
          .collection("users")
          .doc(orderData.userId)
          .collection("notifications")
          .doc();
        const title = "Order Cancelled";
        const message =
          orderData.paymentStatus === "paid"
            ? `Order ${displayOrderNum} has been cancelled. Reserved stock was returned and a refund will be processed.`
            : `Order ${displayOrderNum} has been cancelled. Any reserved stock has been returned to inventory.`;

        transaction.set(notificationRef, {
          id: notificationRef.id,
          userId: orderData.userId,
          orderId,
          title,
          message,
          status: newStatus,
          read: false,
          createdAt: now,
        });
      }

      if (actor) {
        const auditRef = firestore.collection("auditLogs").doc();
        transaction.set(auditRef, {
          id: auditRef.id,
          actionName: "status_changed",
          actorId: actor.id,
          actorName: actor.name,
          actorEmail: actor.email,
          scope: "Order",
        activityRecorded: true,
          resourceName: `Order ${displayOrderNum}`,
          resourceId: orderId,
          details: `${actor.role} ${actor.name} cancelled order ${displayOrderNum}${
            preparedStock.alreadyRestored
              ? " (stock already restored)"
              : " and restored reserved stock"
          }.`,
          createdAt: now,
        });

        if (actor.isManager && !actor.isSuperAdmin) {
          const sysNotificationRef = firestore
            .collection("system_notifications")
            .doc();
          transaction.set(sysNotificationRef, {
            id: sysNotificationRef.id,
            type: "status_changed",
            actorId: actor.id,
            actorName: actor.name,
            title: "Order Cancelled (Manager)",
            message: `Manager ${actor.name} cancelled order ${displayOrderNum}.`,
            targetId: orderId,
            readBy: [],
            createdAt: now,
          });
        }
      } else {
        const sysNotificationRef = firestore
          .collection("system_notifications")
          .doc();
        transaction.set(sysNotificationRef, {
          id: sysNotificationRef.id,
          type: "user_cancelled",
          actorId: orderData.userId,
          actorName: orderData.userEmail.split("@")[0],
          title: "Customer Order Cancellation",
          message: `${orderData.userEmail} cancelled order ${displayOrderNum}.`,
          targetId: orderId,
          readBy: [],
          createdAt: now,
        });
      }

      const userAuditRef = firestore.collection("user_auditLogs").doc();
      transaction.set(userAuditRef, {
        id: userAuditRef.id,
        userId: orderData.userId,
        userEmail: orderData.userEmail,
        actionName: "deleted",
        scope: "Order",
        activityRecorded: true,
        resourceName: orderData.prebuiltName
          ? `Prebuilt: ${orderData.prebuiltName}`
          : `Order ${displayOrderNum}`,
        resourceId: orderId,
        details: actor
          ? `Order cancelled by ${actor.role} ${actor.name}`
          : "Order cancelled by customer",
        createdAt: now,
      });
    });

    if (newStatus === "cancelled") invalidatePublicPartsCatalog();
    if (targetUserId) {
      pruneUserNotificationsServer(firestore, targetUserId).catch(() => {});
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to update order status:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.",
    };
  }
}

export async function autoCancelExpiredOrder(
  rawOrderId: string,
  rawIdToken?: string
): Promise<{ success: boolean; cancelled?: boolean; error?: string }> {
  const parsed = autoCancelExpiredSchema.safeParse({
    orderId: rawOrderId,
    idToken: rawIdToken,
  });
  if (!parsed.success) {
    return { success: false, error: "Invalid expiration request." };
  }

  let callerUid: string | null = null;
  let isStaff = false;
  if (parsed.data.idToken) {
    try {
      const identity = await getOrderActor(parsed.data.idToken);
      callerUid = identity.decoded.uid;
      isStaff = identity.isStaff;
    } catch {
      return { success: false, error: "Authentication is required." };
    }
  } else {
    return { success: false, error: "Authentication is required." };
  }

  return autoCancelExpiredOrderInternal({
    orderId: parsed.data.orderId,
    callerUid,
    isTrustedSystemOrStaff: isStaff,
  });
}

/**
 * Staff-authenticated Server Action wrapper around the paginated expiration sweep.
 * Scheduled background sweeps invoke `/api/cron/expire-orders` with `CRON_SECRET`.
 */
export async function sweepExpiredPendingOrders(
  rawIdToken?: string
): Promise<{
  success: boolean;
  scannedCount?: number;
  cancelledCount: number;
  error?: string;
}> {
  if (!rawIdToken || typeof rawIdToken !== "string") {
    return {
      success: false,
      cancelledCount: 0,
      error: "Staff authentication is required to run an expiration sweep.",
    };
  }

  try {
    const { decoded, isStaff } = await getOrderActor(rawIdToken);

    if (!isStaff) {
      return {
        success: false,
        cancelledCount: 0,
        error: "Only Managers and Super Admins can sweep expired orders.",
      };
    }

    return await runExpiredOrdersSweep(decoded.uid);
  } catch (error) {
    return {
      success: false,
      cancelledCount: 0,
      error:
        error instanceof Error
          ? error.message
          : "Failed to sweep expired orders.",
    };
  }
}


const confirmStockReturnSchema = z.object({
  orderId: z.string().min(1).max(128).regex(/^[a-zA-Z0-9_-]+$/),
  idToken: z.string().min(1),
  notes: z.string().max(500).optional(),
});

export async function confirmOrderPhysicalStockReturn(
  rawInput: z.infer<typeof confirmStockReturnSchema>
): Promise<{ success: boolean; error?: string; stockState?: OrderStockState }> {
  const parsed = confirmStockReturnSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: "Invalid stock return request." };
  }

  const { orderId, idToken, notes } = parsed.data;
  const firestore = getAdminFirestore();

  try {
    const { decoded, actorProfile, isManager, isSuperAdmin } = await getOrderActor(idToken);
    if (!isManager && !isSuperAdmin) {
      return { success: false, error: "Only Managers and Super Admins can confirm physical stock return." };
    }

    const actorRole = isSuperAdmin ? "Super Admin" : "Manager";
    const actorName = actorProfile?.name || actorProfile?.email || decoded.email || "Staff";

    const res = await firestore.runTransaction(async (transaction) => {
      const orderRef = firestore.collection("orders").doc(orderId);
      const snap = await transaction.get(orderRef);
      if (!snap.exists) throw new Error("Order not found.");

      const orderData = snap.data() as Order;
      if (orderData.status !== "cancelled") {
        throw new Error("Physical stock return can only be processed on cancelled orders.");
      }
      if (orderData.stockState === "restored" || Boolean(orderData.stockRestoredAt)) {
        throw new Error("Physical stock for this order has already been restored.");
      }

      const preparedStock = await prepareOrderStockRestore(firestore, transaction, orderData);
      const restoreResult = applyOrderStockRestore(transaction, preparedStock);

      const now = admin.firestore.Timestamp.now();
      const finalStockState: OrderStockState =
        restoreResult.missingItems.length > 0 ? "restored_with_exceptions" : "restored";

      writeOrderChange(transaction, orderRef, orderData, {
        stockState: finalStockState,
        stockRestoredAt: now,
        physicalReturnRequired: false,
        physicalReturnConfirmedAt: now,
        physicalReturnConfirmedBy: decoded.uid,
        ...(restoreResult.missingItems.length > 0 ? { stockExceptions: restoreResult.missingItems } : {}),
        updatedAt: now,
      }, { actorId: decoded.uid, actorName, actorRole });

      const activityRef = orderRef.collection("activity").doc(randomUUID());
      transaction.create(
        activityRef,
        toFirestoreDocument({
          id: activityRef.id,
          actorId: decoded.uid,
          actorName,
          actorRole,
          type: "physical_stock_return",
          details: `Physical stock return confirmed by ${actorRole} ${actorName}.${notes ? ` Note: ${notes}` : ""}${restoreResult.missingItems.length > 0 ? ` (With ${restoreResult.missingItems.length} missing catalog exception(s))` : ""}`,
          createdAt: now,
        })
      );

      return { stockState: finalStockState };
    });

    invalidatePublicPartsCatalog();
    return { success: true, stockState: res.stockState };
  } catch (error) {
    console.error("confirmOrderPhysicalStockReturn failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to confirm physical stock return.",
    };
  }
}
