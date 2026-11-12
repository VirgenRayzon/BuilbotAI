import { createHash } from 'node:crypto';
import { runOrderOperation } from '@/lib/server/order-operations';
import { writeOrderChange } from '@/lib/server/order-activity';
import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";
import { z } from "zod";
import { getAdminFirestore } from "@/firebase/server-init";
import {
  isPaymongoTestApiConfigured,
  retrievePaymongoCheckoutSession,
  toPaymongoCentavos,
  verifyPaymongoWebhookSignature,
} from "@/lib/server/paymongo";
import type { Order, OrderPaymentEvent, PaymentStatus } from "@/lib/types";
import { computeExpiresAt } from "@/lib/ttl-policies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const webhookEnvelopeSchema = z.object({
  data: z.object({
    id: z.string().optional(),
    attributes: z.object({
      type: z.string().min(1),
      data: z
        .object({
          id: z.string().optional(),
          attributes: z.record(z.unknown()).optional(),
        })
        .optional(),
    }),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signatureHeader = req.headers.get("paymongo-signature");
    const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET?.trim();

    if (!webhookSecret) {
      return NextResponse.json(
        { error: "PayMongo webhook is not configured." },
        { status: 503 }
      );
    }

    const valid = verifyPaymongoWebhookSignature(
      rawBody,
      signatureHeader,
      webhookSecret
    );
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid PayMongo webhook signature." },
        { status: 401 }
      );
    }

    let rawJson: unknown;
    try {
      rawJson = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: "Malformed JSON webhook body." },
        { status: 400 }
      );
    }

    const parsedEnvelope = webhookEnvelopeSchema.safeParse(rawJson);
    if (!parsedEnvelope.success) {
      return NextResponse.json(
        { error: "Invalid PayMongo webhook payload structure." },
        { status: 400 }
      );
    }

    const eventType = parsedEnvelope.data.data.attributes.type;
    const resourceData = parsedEnvelope.data.data.attributes.data;
    const resourceId = resourceData?.id;
    const resourceAttrs = (resourceData?.attributes || {}) as Record<
      string,
      any
    >;
    const metadata: Record<string, any> =
      resourceAttrs?.metadata ||
      resourceAttrs?.payment_intent?.attributes?.metadata ||
      {};
    const metadataOrderId =
      typeof metadata.orderId === "string" &&
      /^[a-zA-Z0-9_-]{1,128}$/.test(metadata.orderId)
        ? metadata.orderId
        : undefined;
    const metadataPaymentReference =
      typeof metadata.paymentReference === "string"
        ? metadata.paymentReference
        : typeof resourceAttrs?.reference_number === "string"
          ? resourceAttrs.reference_number
          : undefined;

    if (!metadataOrderId && !resourceId) {
      return NextResponse.json({ received: true, ignored: true });
    }

    const firestore = getAdminFirestore();
    let orderDocRef: admin.firestore.DocumentReference | null = null;

    if (metadataOrderId) {
      orderDocRef = firestore.collection("orders").doc(metadataOrderId);
    } else if (resourceId) {
      const snap = await firestore
        .collection("orders")
        .where("paymongoCheckoutSessionId", "==", resourceId)
        .limit(1)
        .get();
      if (!snap.empty) {
        orderDocRef = snap.docs[0].ref;
      }
    }

    if (!orderDocRef) {
      return NextResponse.json({ received: true, matched: false });
    }

    const isPaidEvent =
      eventType === "checkout_session.payment.paid" ||
      eventType === "payment.paid";
    const isFailedEvent = eventType === "payment.failed";

    if (!isPaidEvent && !isFailedEvent) {
      return NextResponse.json({ received: true, eventType });
    }

    const preSnap = await orderDocRef.get();
    if (!preSnap.exists) {
      return NextResponse.json({ received: true, matched: false });
    }
    const preOrder = preSnap.data() as Order;
    let verifiedSessionPaymentId: string | null = null;

    if (
      (eventType === "payment.paid" || eventType === "payment.failed") &&
      preOrder.paymongoCheckoutSessionId &&
      !preOrder.paymongoCheckoutSessionId.startsWith("cs_sim_") &&
      isPaymongoTestApiConfigured()
    ) {
      try {
        const liveSession = await retrievePaymongoCheckoutSession(
          preOrder.paymongoCheckoutSessionId
        );
        verifiedSessionPaymentId = liveSession.paymentId;
        if (
          isPaidEvent &&
          liveSession.status !== "paid" &&
          liveSession.paymentId !== resourceId
        ) {
          return NextResponse.json(
            { error: "Webhook payment event does not match active Checkout Session." },
            { status: 409 }
          );
        }
      } catch (verifyErr) {
        console.warn("[PayMongo Webhook] Session cross-check error:", verifyErr);
        return NextResponse.json(
          { error: "Unable to cross-verify PayMongo Checkout Session." },
          { status: 502 }
        );
      }
    }

    let didUpdate = false;

    await runOrderOperation(firestore, orderDocRef.id, 'paymongo_webhook', { operationId: createHash('sha256').update(parsedEnvelope.data.data.id || rawBody).digest('hex') }, { eventType, resourceId, amount: resourceAttrs.amount ?? null }, async (tx) => {
      const snap = await tx.get(orderDocRef!);
      if (!snap.exists) return;

      const orderData = snap.data() as Order;
      if (orderData.status === "cancelled" || orderData.isArchived) return;
      if (
        orderData.paymentMethod !== "paymongo_simulated" ||
        orderData.paymongoMode !== "live_test_api"
      ) {
        return;
      }

      if (
        !orderData.paymongoCheckoutSessionId ||
        orderData.paymongoCheckoutSessionId.startsWith("cs_sim_")
      ) {
        return;
      }

      if (
        eventType === "checkout_session.payment.paid" &&
        orderData.paymongoCheckoutSessionId !== resourceId
      ) {
        return;
      }

      if (eventType === "payment.paid" || eventType === "payment.failed") {
        const eventSessionId =
          typeof resourceAttrs?.checkout_session_id === "string"
            ? resourceAttrs.checkout_session_id
            : undefined;
        if (
          eventSessionId &&
          eventSessionId !== orderData.paymongoCheckoutSessionId
        ) {
          return;
        }
        if (
          verifiedSessionPaymentId &&
          resourceId &&
          verifiedSessionPaymentId !== resourceId
        ) {
          return;
        }
        if (
          orderData.paymentReference &&
          metadataPaymentReference &&
          metadataPaymentReference !== orderData.paymentReference
        ) {
          return;
        }
      }

      const expectedCentavos = toPaymongoCentavos(orderData.totalPrice, true);
      const sessionPayments = Array.isArray(resourceAttrs?.payments)
        ? resourceAttrs.payments
        : [];
      const paidPaymentEntry = sessionPayments.find(
        (p: any) => p?.attributes?.status === "paid" || p?.status === "paid"
      );
      const eventAmountCentavos =
        typeof resourceAttrs?.amount === "number"
          ? resourceAttrs.amount
          : typeof paidPaymentEntry?.attributes?.amount === "number"
            ? paidPaymentEntry.attributes.amount
            : null;
      if (
        isPaidEvent &&
        eventAmountCentavos !== null &&
        eventAmountCentavos !== expectedCentavos
      ) {
        return;
      }

      if (orderData.paymentStatus === "paid") return;

      const now = admin.firestore.Timestamp.now();
      const nextStatus: PaymentStatus = isPaidEvent ? "paid" : "failed";
      const displayOrderNum =
        orderData.orderNumber || `#${orderData.id.substring(0, 8)}`;
      const paymentReference =
        orderData.paymentReference || metadataPaymentReference || "PM-WEBHOOK";
      const resolvedPaymongoPaymentId =
        resourceId?.startsWith("pay_")
          ? resourceId
          : typeof paidPaymentEntry?.id === "string"
            ? paidPaymentEntry.id
            : verifiedSessionPaymentId || undefined;

      const webhookEvent: OrderPaymentEvent = {
        id: `evt_wh_${Date.now().toString(36)}`,
        status: nextStatus,
        method: "paymongo_simulated",
        reference: paymentReference,
        amount: orderData.totalPrice,
        actorName: "PayMongo Webhook",
        actorRole: "Webhook",
        note: isPaidEvent
          ? `Confirmed via PayMongo (${eventType}${resolvedPaymongoPaymentId ? `, Payment ${resolvedPaymongoPaymentId}` : ""}).`
          : `PayMongo reported ${eventType}.`,
        createdAt: now,
      };

      writeOrderChange(tx, orderDocRef!, orderData, {
        paymentMethod: "paymongo_simulated",
        paymentStatus: nextStatus,
        paymentHistory: [...(orderData.paymentHistory || []), webhookEvent],
        ...(isPaidEvent && resolvedPaymongoPaymentId
          ? { paymongoPaymentId: resolvedPaymongoPaymentId }
          : {}),
        ...(isPaidEvent ? { paidAt: now, lastPaymentError: null } : {}),
        ...(isFailedEvent
          ? {
              lastPaymentError: "PayMongo webhook reported payment.failed.",
            }
          : {}),
        paymentUpdatedAt: now,
        updatedAt: now,
      });

      const notifRef = firestore
        .collection("users")
        .doc(orderData.userId)
        .collection("notifications")
        .doc();
      tx.set(notifRef, {
        id: notifRef.id,
        userId: orderData.userId,
        orderId: orderData.id,
        title: isPaidEvent
          ? "PayMongo Payment Confirmed"
          : "PayMongo Payment Failed",
        message: isPaidEvent
          ? `PayMongo payment of ₱${orderData.totalPrice.toLocaleString()} for order ${displayOrderNum} was confirmed (Ref: ${paymentReference}).`
          : `PayMongo payment attempt for order ${displayOrderNum} failed.`,
        status: orderData.status,
        read: false,
        createdAt: now,
        expiresAt: admin.firestore.Timestamp.fromDate(computeExpiresAt('notifications')),
      });

      didUpdate = true;
    });

    return NextResponse.json({ received: true, updated: didUpdate });
  } catch (error) {
    console.error("[PayMongo Webhook] Error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 }
    );
  }
}
