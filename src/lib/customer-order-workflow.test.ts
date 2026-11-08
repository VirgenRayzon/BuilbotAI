import assert from "node:assert/strict";
import test from "node:test";
import type { MockEcommerceOrder } from "@/context/ecommerce-context";
import type { Order } from "@/lib/types";
import {
  getReservationQueue,
  getPendingReservationLabel,
  isReservationInPendingQueue,
  isReservationInReceiveQueue,
  isReservationCompleted,
  isOrderInBuildQueue,
  isOrderInReceiveQueue,
  requiresStaffCancellation,
  isShipmentCompleted,
  isShipmentInReceiveQueue,
  shouldShowCustomerOrderActivity,
  shouldShowCustomerPaymentRecovery,
} from "./customer-order-workflow";

const individualOrder = {
  items: [{ id: "cpu", name: "CPU", category: "CPU", price: 10000, buildType: "part" }],
  paymentMethod: "gcash_simulated",
  paymentStatus: "paid",
} satisfies Pick<Order, "items" | "paymentMethod" | "paymentStatus">;

const buildOrder = {
  items: [{ id: "rig", name: "Rig", category: "Build", price: 50000, buildType: "custom-build" }],
  paymentMethod: "gcash_simulated",
  paymentStatus: "paid",
} satisfies Pick<Order, "items" | "paymentMethod" | "paymentStatus">;

test("routes incomplete online payments to To Pay", () => {
  assert.equal(
    getReservationQueue({ ...buildOrder, paymentStatus: "failed" }),
    "to-pay"
  );
});

test("routes paid parts to To Ship and paid builds to To Build", () => {
  assert.equal(getReservationQueue(individualOrder), "to-ship");
  assert.equal(getReservationQueue(buildOrder), "to-build");
});

test("labels newly placed build orders To Build and parts orders To Ship", () => {
  assert.equal(getPendingReservationLabel(buildOrder), "To Build");
  assert.equal(getPendingReservationLabel({ ...buildOrder, items: [{ ...buildOrder.items[0], buildType: "prebuilt" }] }), "To Build");
  assert.equal(getPendingReservationLabel(individualOrder), "To Ship");
});

test("routes COD orders by item type instead of To Pay", () => {
  assert.equal(
    getReservationQueue({
      ...individualOrder,
      paymentMethod: "cod",
      paymentStatus: "unpaid",
    }),
    "to-ship"
  );
});

test("shows customer order activity only after payment or for COD", () => {
  assert.equal(
    shouldShowCustomerOrderActivity({
      paymentMethod: "gcash_simulated",
      paymentStatus: "paid",
    }),
    true
  );
  assert.equal(
    shouldShowCustomerOrderActivity({
      paymentMethod: "cod",
      paymentStatus: "unpaid",
    }),
    true
  );

  for (const paymentStatus of ["pending", "failed", "cancelled"] as const) {
    assert.equal(
      shouldShowCustomerOrderActivity({
        paymentMethod: "gcash_simulated",
        paymentStatus,
      }),
      false
    );
  }
  assert.equal(
    shouldShowCustomerOrderActivity({
      paymentMethod: "paymongo_simulated",
      paymentStatus: "pending",
    }),
    false
  );
});

test("shows payment recovery for incomplete GCash and PayMongo orders", () => {
  for (const paymentStatus of ["pending", "failed", "cancelled"] as const) {
    assert.equal(
      shouldShowCustomerPaymentRecovery({
        status: "pending",
        paymentMethod: "paymongo_simulated",
        paymentStatus,
      }),
      true
    );
    assert.equal(
      shouldShowCustomerPaymentRecovery({
        status: "pending",
        paymentMethod: "gcash_simulated",
        paymentStatus,
      }),
      true
    );
  }

  assert.equal(
    shouldShowCustomerPaymentRecovery({
      status: "cancelled",
      paymentMethod: "paymongo_simulated",
      paymentStatus: "failed",
    }),
    false
  );
});

test("moves parts to To Receive when shipped and builds when out for delivery", () => {
  const partItems = [{ kind: "part" as const }];
  const buildItems = [{ kind: "prebuilt" as const }];

  assert.equal(
    isShipmentInReceiveQueue({ fulfillmentStage: "payment_verified", items: partItems }),
    true
  );
  assert.equal(
    isShipmentInReceiveQueue({ fulfillmentStage: "payment_verified", items: buildItems }),
    false
  );
  assert.equal(
    isShipmentInReceiveQueue({ fulfillmentStage: "out_for_delivery", items: buildItems }),
    true
  );
});

test("moves delivered orders out of To Receive and into Completed", () => {
  const deliveredOrder = {
    fulfillmentStage: "delivered" as const,
    items: [{ kind: "part" as const }],
  };

  assert.equal(isShipmentInReceiveQueue(deliveredOrder), false);
  assert.equal(isShipmentCompleted(deliveredOrder), true);
});

test("removes dispatched and delivered reservations from pending customer queues", () => {
  assert.equal(
    isReservationInPendingQueue({ status: "building", fulfillmentStage: "assembling_testing" }),
    true
  );
  assert.equal(
    isReservationInPendingQueue({ status: "finished building", fulfillmentStage: "out_for_delivery" }),
    false
  );
  assert.equal(
    isReservationInPendingQueue({ status: "finished building", fulfillmentStage: "delivered" }),
    false
  );
});

test("routes dispatched Firestore reservations into To Receive", () => {
  assert.equal(
    isReservationInReceiveQueue({ status: "finished building", fulfillmentStage: "out_for_delivery" }),
    true
  );
  assert.equal(
    isReservationInReceiveQueue({ status: "finished building" }),
    true
  );
  assert.equal(
    isReservationInReceiveQueue({ status: "building", fulfillmentStage: "assembling_testing" }),
    false
  );
  assert.equal(
    isReservationInReceiveQueue({ status: "finished building", fulfillmentStage: "delivered" }),
    false
  );
  assert.equal(
    isReservationInReceiveQueue({ status: "cancelled", fulfillmentStage: "out_for_delivery" }),
    false
  );
});

test("routes delivered Firestore reservations into Completed", () => {
  assert.equal(
    isReservationCompleted({ status: "finished building", fulfillmentStage: "delivered" }),
    true
  );
  assert.equal(
    isReservationCompleted({ status: "finished building", fulfillmentStage: "out_for_delivery" }),
    false
  );
});

test("requires staff cancellation when order is in To Build or To Receive", () => {
  assert.equal(
    requiresStaffCancellation({
      ...buildOrder,
      status: "pending",
      fulfillmentStage: "order_placed",
    }),
    true
  );

  assert.equal(
    requiresStaffCancellation({
      ...buildOrder,
      status: "building",
      fulfillmentStage: "assembling_testing",
    }),
    true
  );

  assert.equal(
    requiresStaffCancellation({
      ...individualOrder,
      status: "finished building",
      fulfillmentStage: "out_for_delivery",
    }),
    true
  );

  assert.equal(
    requiresStaffCancellation({
      ...buildOrder,
      paymentStatus: "pending",
      status: "pending",
      fulfillmentStage: "order_placed",
    }),
    false
  );

  assert.equal(
    requiresStaffCancellation({
      ...buildOrder,
      status: "cancelled",
      fulfillmentStage: "assembling_testing",
    }),
    false
  );
  assert.equal(
    requiresStaffCancellation({
      ...buildOrder,
      status: "finished building",
      fulfillmentStage: "delivered",
    }),
    false
  );
});
