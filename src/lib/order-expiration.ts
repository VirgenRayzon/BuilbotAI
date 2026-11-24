
import type { PaymentMethod } from "./types";

export const ORDER_EXPIRATION_DURATION_MS = 60 * 60 * 1000;

export function computeOrderHoldExpiresAt(
  paymentMethod: PaymentMethod | string | null | undefined,
  createdAt: unknown
): Date | null {
  if (!paymentMethod) return null;
  const normalized = String(paymentMethod).toLowerCase();
  if (normalized === "cod") return null;

  if (
    normalized !== "gcash_simulated" &&
    normalized !== "paymongo_simulated" &&
    normalized !== "card_simulated"
  ) {
    return null;
  }

  const createdDate = getOrderCreatedDate(createdAt);
  if (!createdDate) return null;

  return new Date(createdDate.getTime() + ORDER_EXPIRATION_DURATION_MS);
}

export function getOrderCreatedDate(createdAt: unknown): Date | null {
  if (!createdAt) return null;
  if (createdAt instanceof Date) return createdAt;
  if (typeof (createdAt as any).toDate === "function") {
    return (createdAt as any).toDate();
  }
  if (typeof (createdAt as any).seconds === "number") {
    return new Date((createdAt as any).seconds * 1000);
  }
  if (typeof createdAt === "string" || typeof createdAt === "number") {
    const d = new Date(createdAt);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

export function isOrderPendingWithNoProgression(order: {
  status?: string;
  fulfillmentStage?: string;
  paymentStatus?: string;
  paymentMethod?: string;
}): boolean {
  const status = (order.status || "pending").toLowerCase();
  const paymentStatus = (order.paymentStatus || "pending").toLowerCase();
  const paymentMethod = (order.paymentMethod || "").toLowerCase();

  if (!paymentMethod || paymentMethod === "cod") return false;

  if (status !== "pending") return false;
  if (order.fulfillmentStage && order.fulfillmentStage !== "order_placed") return false;

  if (paymentStatus === "paid") return false;

  return (
    paymentStatus === "pending" ||
    paymentStatus === "unpaid" ||
    paymentStatus === "failed" ||
    paymentStatus === "cancelled"
  );
}

export function getOrderRemainingTimeMs(
  createdAt: unknown,
  nowMs: number = Date.now(),
  durationMs: number = ORDER_EXPIRATION_DURATION_MS
): number {
  const createdDate = getOrderCreatedDate(createdAt);
  if (!createdDate) return durationMs;
  const elapsed = nowMs - createdDate.getTime();
  return Math.max(0, durationMs - elapsed);
}

export function isOrderExpired(
  createdAt: unknown,
  nowMs: number = Date.now(),
  durationMs: number = ORDER_EXPIRATION_DURATION_MS
): boolean {
  return getOrderRemainingTimeMs(createdAt, nowMs, durationMs) <= 0;
}

export function formatRemainingTime(remainingMs: number): string {
  if (remainingMs <= 0) return "Expired";
  const totalSeconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remMinutes = minutes % 60;
    return `${hours}h ${remMinutes.toString().padStart(2, "0")}m`;
  }
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}
