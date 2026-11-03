import type { MockEcommerceOrder } from "@/context/ecommerce-context";
import type { Order } from "@/lib/types";
import { orderRequiresAssembly } from "@/lib/order-fulfillment";
import { getOrderFulfillmentStage } from "@/lib/order-workflow";

export type CustomerOrderQueue = "to-pay" | "to-ship" | "to-build";

type ShipmentQueueOrder = {
  fulfillmentStage: MockEcommerceOrder["fulfillmentStage"];
  items: Array<Pick<MockEcommerceOrder["items"][number], "kind">>;
};

export function reservationRequiresAssembly(
  order: Pick<Order, "items">
): boolean {
  return order.items.some(
    (item) =>
      item.buildType === "custom-build" || item.buildType === "prebuilt"
  );
}

export function getPendingReservationLabel(order: Pick<Order, "items">): "To Build" | "To Ship" {
  return reservationRequiresAssembly(order) ? "To Build" : "To Ship";
}

export function reservationNeedsPayment(
  order: Pick<Order, "paymentMethod" | "paymentStatus">
): boolean {
  if (order.paymentMethod === "cod") return false;
  return (
    order.paymentStatus === "pending" ||
    order.paymentStatus === "failed" ||
    order.paymentStatus === "cancelled"
  );
}

export function shouldShowCustomerOrderActivity(
  order: Pick<Order, "paymentMethod" | "paymentStatus">
): boolean {
  return order.paymentMethod === "cod" || order.paymentStatus === "paid";
}

export function shouldShowCustomerPaymentRecovery(
  order: Pick<Order, "status" | "paymentMethod" | "paymentStatus">
): boolean {
  return (
    order.status !== "cancelled" &&
    (order.paymentMethod === "gcash_simulated" ||
      order.paymentMethod === "paymongo_simulated") &&
    (order.paymentStatus === "pending" ||
      order.paymentStatus === "failed" ||
      order.paymentStatus === "cancelled")
  );
}

export function getReservationQueue(
  order: Pick<Order, "items" | "paymentMethod" | "paymentStatus">
): CustomerOrderQueue {
  if (reservationNeedsPayment(order)) return "to-pay";
  return reservationRequiresAssembly(order) ? "to-build" : "to-ship";
}

export function isReservationInPendingQueue(
  order: Pick<Order, "status" | "fulfillmentStage">
): boolean {
  if (order.status === "cancelled") return false;
  const stage = getOrderFulfillmentStage(order);
  return stage !== "out_for_delivery" && stage !== "delivered";
}

export function isReservationInReceiveQueue(
  order: Pick<Order, "status" | "fulfillmentStage">
): boolean {
  if (order.status === "cancelled") return false;
  const stage = getOrderFulfillmentStage(order);
  return stage === "out_for_delivery";
}

export function isReservationCompleted(
  order: Pick<Order, "status" | "fulfillmentStage">
): boolean {
  return order.status !== "cancelled" && getOrderFulfillmentStage(order) === "delivered";
}

export function isOrderInBuildQueue(
  order: Pick<Order, "items" | "paymentMethod" | "paymentStatus" | "status" | "fulfillmentStage">
): boolean {
  if (order.status === "cancelled") return false;
  const stage = getOrderFulfillmentStage(order);
  if (stage === "assembling_testing") return true;
  if (stage === "out_for_delivery" || stage === "delivered") return false;
  return getReservationQueue(order) === "to-build";
}

export function isOrderInReceiveQueue(
  order: Pick<Order, "status" | "fulfillmentStage">
): boolean {
  return isReservationInReceiveQueue(order);
}

export function requiresStaffCancellation(
  order: Pick<Order, "items" | "paymentMethod" | "paymentStatus" | "status" | "fulfillmentStage">
): boolean {
  return isOrderInBuildQueue(order) || isOrderInReceiveQueue(order);
}

export function isShipmentInReceiveQueue(
  order: ShipmentQueueOrder
): boolean {
  if (order.fulfillmentStage === "out_for_delivery") {
    return true;
  }

  return (
    !orderRequiresAssembly(order) &&
    order.fulfillmentStage === "payment_verified"
  );
}

export function isShipmentCompleted(order: ShipmentQueueOrder): boolean {
  return order.fulfillmentStage === "delivered";
}
