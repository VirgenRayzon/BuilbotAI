import assert from "node:assert/strict";
import test from "node:test";
import {
  getFulfillmentStages,
  getNextFulfillmentStage,
} from "./order-fulfillment";

test("COD individual parts skip assembly and verify payment after dispatch", () => {
  const order = {
    paymentMethod: "cod",
    items: [{ kind: "part" as const }],
  };

  assert.deepEqual(getFulfillmentStages(order), [
    "order_placed",
    "out_for_delivery",
    "payment_verified",
    "delivered",
  ]);
  assert.equal(
    getNextFulfillmentStage({ ...order, fulfillmentStage: "out_for_delivery" }),
    "payment_verified"
  );
});

test("COD rigs keep assembly before dispatch and payment verification", () => {
  assert.deepEqual(
    getFulfillmentStages({
      paymentMethod: "cod",
      items: [{ kind: "custom-build" }],
    }),
    [
      "order_placed",
      "assembling_testing",
      "out_for_delivery",
      "payment_verified",
      "delivered",
    ]
  );
});

test("online individual parts verify payment before dispatch and skip assembly", () => {
  assert.deepEqual(
    getFulfillmentStages({
      paymentMethod: "gcash_simulated",
      items: [{ kind: "part" }],
    }),
    ["order_placed", "payment_verified", "out_for_delivery", "delivered"]
  );
});
