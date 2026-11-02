import type { Order } from './types';
import { groupOrderItems } from './order-item-groups';
import { getCustomRigsFromOrder, type CustomRigInstance } from './order-assembly';
import { getOrderFulfillmentStage } from './order-workflow';

export function shouldSubscribeToAssemblyVerification(
  order: Pick<Order, 'status' | 'fulfillmentStage'>
): boolean {
  return getOrderFulfillmentStage(order) !== 'delivered';
}

/**
 * Extracts custom rigs or prebuilt assembly instances from an order.
 */
export function getAssemblyRigsFromOrder(order: Order): CustomRigInstance[] {
  const customRigs = getCustomRigsFromOrder(order);
  if (customRigs.length > 0) return customRigs;

  // Fallback for prebuilt systems
  const groups = groupOrderItems(order);
  const prebuiltGroups = groups.filter((g) => g.type === 'prebuilt');
  if (prebuiltGroups.length > 0) {
    return prebuiltGroups.map((grp, idx) => ({
      rigId: (grp as any).id || `prebuilt_${idx}`,
      rigName: grp.name || 'Prebuilt System',
      items: grp.items,
    }));
  }

  return [];
}

/**
 * Derives a customer-friendly description of what was ordered for Step 1.
 * Matches Image 1: "Customer submitted a custom rig and additional item."
 */
export function getOrderPlacedSummary(order: Order): string {
  const groups = groupOrderItems(order);
  const hasCustom = groups.some((g) => g.type === 'custom-build');
  const hasPrebuilt = groups.some((g) => g.type === 'prebuilt');
  const hasAdditional = groups.some((g) => g.type === 'additional');

  if (hasCustom && hasAdditional) {
    return 'Customer submitted a custom rig and additional item.';
  }
  if (hasCustom) {
    return 'Customer submitted a custom rig configuration.';
  }
  if (hasPrebuilt && hasAdditional) {
    return 'Customer ordered a prebuilt system and additional item.';
  }
  if (hasPrebuilt) {
    return 'Customer ordered a prebuilt system.';
  }
  return 'Customer submitted an order for components.';
}
