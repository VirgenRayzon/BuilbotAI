export type FulfillmentStage =
  | "order_placed"
  | "payment_verified"
  | "assembling_testing"
  | "out_for_delivery"
  | "delivered";

export interface FulfillmentOrderShape {
  paymentMethod?: string;
  items?: Array<{
    kind?: "custom-build" | "prebuilt" | "part";
  }>;
}

const ONLINE_BUILD_STAGES: FulfillmentStage[] = [
  "order_placed",
  "payment_verified",
  "assembling_testing",
  "out_for_delivery",
  "delivered",
];

const ONLINE_PART_STAGES: FulfillmentStage[] = [
  "order_placed",
  "payment_verified",
  "out_for_delivery",
  "delivered",
];

const COD_BUILD_STAGES: FulfillmentStage[] = [
  "order_placed",
  "assembling_testing",
  "out_for_delivery",
  "payment_verified",
  "delivered",
];

const COD_PART_STAGES: FulfillmentStage[] = [
  "order_placed",
  "out_for_delivery",
  "payment_verified",
  "delivered",
];

export function orderRequiresAssembly(order: FulfillmentOrderShape): boolean {
  return Boolean(
    order.items?.some(
      (item) => item.kind === "custom-build" || item.kind === "prebuilt"
    )
  );
}

export function getFulfillmentStages(
  order: FulfillmentOrderShape
): FulfillmentStage[] {
  const isCod = order.paymentMethod === "cod";
  const requiresAssembly = orderRequiresAssembly(order);

  if (isCod) {
    return requiresAssembly ? COD_BUILD_STAGES : COD_PART_STAGES;
  }

  return requiresAssembly ? ONLINE_BUILD_STAGES : ONLINE_PART_STAGES;
}

export function getNextFulfillmentStage(
  order: FulfillmentOrderShape & { fulfillmentStage: FulfillmentStage }
): FulfillmentStage {
  const stages = getFulfillmentStages(order);
  const currentIndex = stages.indexOf(order.fulfillmentStage);

  if (currentIndex < 0) return stages[0];
  return stages[(currentIndex + 1) % stages.length];
}
