import { classifyOrder } from '@/lib/order-classification';
import type {
  Order,
  OrderFulfillmentStage,
  OrderPaymentEvent,
  OrderRefundDestination,
  OrderStockState,
  PaymentMethod,
  PaymentStatus,
} from '@/lib/types';

export const ORDER_STAGE_LABELS: Record<OrderFulfillmentStage, string> = {
  order_placed: 'Order Placed',
  assembling_testing: 'Assembling & Testing',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
};

export const ORDER_REFUND_DESTINATION_LABELS: Record<OrderRefundDestination, string> = {
  original_payment_method: 'Original Payment Method',
  gcash: 'GCash E-Wallet',
  bank_transfer: 'Bank Transfer',
  cash: 'Cash Payout',
  store_credit: 'Store Credit',
};

export function requiresOrderAssembly(
  order: Pick<Order, 'items' | 'type' | 'prebuiltName'>
): boolean {
  return classifyOrder(order).requiresAssembly;
}

export function isOrderReadyForFulfillmentQueue(
  order: Pick<Order, 'paymentMethod' | 'paymentStatus'>
): boolean {
  return order.paymentMethod === 'cod' || order.paymentStatus === 'paid';
}

export function getOrderFulfillmentStage(
  order: Pick<Order, 'status' | 'fulfillmentStage'>
): OrderFulfillmentStage {
  if (order.fulfillmentStage) return order.fulfillmentStage;
  if (order.status === 'finished building') return 'out_for_delivery';
  if (order.status === 'building') return 'assembling_testing';
  return 'order_placed';
}

export function getOrderFulfillmentStageLabel(
  order: Pick<Order, 'status' | 'fulfillmentStage' | 'shippingMethod' | 'paymentMethod'>
): string {
  if (order.status === 'cancelled') return 'Cancelled';
  const stage = getOrderFulfillmentStage(order);
  if (
    stage === 'out_for_delivery' &&
    (order.shippingMethod === 'store_pickup' || (!order.shippingMethod && !order.paymentMethod))
  ) {
    return 'Ready for Pickup';
  }
  return ORDER_STAGE_LABELS[stage];
}

export function getLegacyStatusFromStage(stage: OrderFulfillmentStage): Order['status'] {
  switch (stage) {
    case 'order_placed':
      return 'pending';
    case 'assembling_testing':
      return 'building';
    case 'out_for_delivery':
    case 'delivered':
      return 'finished building';
  }
}

export function availableOrderStages(
  order: Pick<Order, 'items' | 'type' | 'prebuiltName'> & Partial<Pick<Order, 'status' | 'fulfillmentStage'>>
): OrderFulfillmentStage[] {
  return (requiresOrderAssembly(order) || order.status === 'building' || order.fulfillmentStage === 'assembling_testing')
    ? ['order_placed', 'assembling_testing', 'out_for_delivery', 'delivered']
    : ['order_placed', 'out_for_delivery', 'delivered'];
}

export function getNextOrderStage(
  order: Pick<Order, 'status' | 'fulfillmentStage' | 'items' | 'type' | 'prebuiltName' | 'isArchived'>
): OrderFulfillmentStage | null {
  if (order.status === 'cancelled' || order.isArchived) return null;
  const stages = availableOrderStages(order);
  const current = getOrderFulfillmentStage(order);
  const currentIndex = stages.indexOf(current);
  if (currentIndex < 0 || currentIndex >= stages.length - 1) return null;
  return stages[currentIndex + 1];
}

export function assertOrderStageTransition(order: Order, next: OrderFulfillmentStage): void {
  if (order.status === 'cancelled' || order.isArchived) {
    throw new Error('Cancelled or archived orders cannot progress.');
  }
  const current = getOrderFulfillmentStage(order);
  if (current === next) {
    throw new Error('Order is already at this fulfillment stage.');
  }

  const stages = availableOrderStages(order);
  const currentIndex = stages.indexOf(current);
  const nextIndex = stages.indexOf(next);

  const isDirectOutForDelivery =
    current === 'order_placed' &&
    next === 'out_for_delivery' &&
    !requiresOrderAssembly(order);

  const isSequential = nextIndex >= 0 && nextIndex === currentIndex + 1;

  if (!isSequential && !isDirectOutForDelivery) {
    throw new Error('Choose the next sequential fulfillment step.');
  }
  const effectiveMethod: PaymentMethod = order.paymentMethod ?? 'cod';
  if (effectiveMethod !== 'cod' && order.paymentStatus !== 'paid') {
    throw new Error('Confirm online payment before progressing fulfillment.');
  }
  if (next === 'delivered' && order.paymentStatus !== 'paid') {
    throw new Error('Confirm payment before marking the order delivered.');
  }
}

export function getRefundedAmount(
  order: Pick<Order, 'refundedAmount' | 'refunds'>
): number {
  const raw =
    order.refundedAmount ??
    order.refunds?.reduce((sum, refund) => sum + (Number(refund.amount) || 0), 0) ??
    0;
  return Math.max(0, Math.round(raw * 100) / 100);
}

export function getRemainingRefundableAmount(
  order: Pick<Order, 'paymentStatus' | 'totalPrice' | 'refundedAmount' | 'refunds'>
): number {
  if (order.paymentStatus !== 'paid') return 0;
  return Math.max(0, Math.round(((order.totalPrice || 0) - getRefundedAmount(order)) * 100) / 100);
}

export function getNetCollectedAmount(
  order: Pick<Order, 'paymentStatus' | 'totalPrice' | 'refundedAmount' | 'refunds'>
): number {
  if (order.paymentStatus !== 'paid') return 0;
  return Math.max(0, Math.round(((order.totalPrice || 0) - getRefundedAmount(order)) * 100) / 100);
}

export function getOrderStockState(
  order: Pick<Order, 'stockState' | 'stockRestoredAt' | 'status'>
): OrderStockState {
  if (order.stockState === 'pending_return') return 'pending_return';
  if (order.stockState === 'restored_with_exceptions') return 'restored_with_exceptions';
  if (
    order.stockState === 'restored' ||
    Boolean(order.stockRestoredAt) ||
    order.status === 'cancelled'
  ) {
    return 'restored';
  }
  return 'reserved';
}

export function getAllowedStaffPaymentStatuses(
  order: Pick<
    Order,
    | 'status'
    | 'isArchived'
    | 'fulfillmentStage'
    | 'paymentMethod'
    | 'paymentStatus'
    | 'refundStatus'
    | 'refundedAmount'
    | 'pendingRefundOperationId'
    | 'refunds'
  >
): PaymentStatus[] {
  if (order.isArchived || order.status === 'cancelled') return [];
  const hasRefundActivity =
    getRefundedAmount(order) > 0 ||
    order.refundStatus === 'pending' ||
    order.refundStatus === 'partial' ||
    order.refundStatus === 'refunded' || Boolean(order.pendingRefundOperationId);
  if (getOrderFulfillmentStage(order) === 'delivered' || hasRefundActivity) {
    return order.paymentStatus === 'paid' ? ['paid'] : [];
  }
  const effectiveMethod: PaymentMethod = order.paymentMethod ?? 'cod';
  if (effectiveMethod === 'cod') {
    return ['unpaid', 'paid'];
  }
  return ['pending', 'paid', 'failed', 'unpaid'];
}

export function assertStaffPaymentStatusTransition(
  order: Pick<
    Order,
    | 'status'
    | 'isArchived'
    | 'fulfillmentStage'
    | 'paymentMethod'
    | 'paymentStatus'
    | 'refundStatus'
    | 'refundedAmount'
    | 'pendingRefundOperationId'
    | 'refunds'
  >,
  nextStatus: PaymentStatus,
  reason?: string
): void {
  if (order.isArchived) {
    throw new Error('Restore archived orders before updating payment status.');
  }
  if (order.status === 'cancelled') {
    throw new Error(
      'Cancelled orders cannot change payment status. Issue a refund if payment was already collected.'
    );
  }
  const stage = getOrderFulfillmentStage(order);
  if (stage === 'delivered' && nextStatus !== 'paid') {
    throw new Error(
      'Delivered orders cannot revert confirmed payment status. Use the refund workflow instead.'
    );
  }
  const hasRefundActivity =
    getRefundedAmount(order) > 0 ||
    order.refundStatus === 'pending' ||
    order.refundStatus === 'partial' ||
    order.refundStatus === 'refunded' || Boolean(order.pendingRefundOperationId);
  if (hasRefundActivity && nextStatus !== 'paid') {
    throw new Error('Orders with recorded refunds cannot revert payment status.');
  }
  const effectiveMethod: PaymentMethod = order.paymentMethod ?? 'cod';
  if (effectiveMethod === 'cod' && (nextStatus === 'pending' || nextStatus === 'failed')) {
    throw new Error('Cash on Delivery orders only support Unpaid or Paid payment status.');
  }
  if (nextStatus === 'cancelled') {
    throw new Error('Cancel the order directly instead of setting payment status to cancelled.');
  }

  const trimmedReason = reason?.trim() || '';
  if (nextStatus === 'paid' && effectiveMethod !== 'cod' && trimmedReason.length < 8) {
    throw new Error(
      'Enter a verification reason (at least 8 characters) when manually confirming an online payment.'
    );
  }
  if (order.paymentStatus === 'paid' && nextStatus !== 'paid' && trimmedReason.length < 8) {
    throw new Error('Enter a reason (at least 8 characters) when reverting a paid order.');
  }
}

export function getOrderPaymentHistory(order: Order): OrderPaymentEvent[] {
  if (Array.isArray(order.paymentHistory) && order.paymentHistory.length > 0) {
    return order.paymentHistory;
  }

  const method: PaymentMethod = order.paymentMethod ?? 'cod';
  const currentStatus: PaymentStatus = order.paymentStatus ?? 'unpaid';
  const events: OrderPaymentEvent[] = [
    {
      id: `${order.id}-created`,
      status: method === 'cod' ? 'unpaid' : 'pending',
      method,
      reference: order.paymentReference,
      amount: order.totalPrice,
      actorName: order.userEmail || 'Customer',
      actorRole: 'Customer',
      note: order.paymentMethod
        ? 'Order placed.'
        : 'Legacy reservation mapped into unified Orders view.',
      createdAt: order.createdAt,
    },
  ];

  if (currentStatus === 'paid') {
    events.push({
      id: `${order.id}-paid`,
      status: 'paid',
      method,
      reference: order.paymentReference,
      amount: order.totalPrice,
      actorName: 'Payment Confirmed',
      actorRole: 'System',
      note: 'Payment recorded as paid.',
      createdAt: order.paidAt || order.updatedAt || order.createdAt,
    });
  } else if (
    currentStatus !== (method === 'cod' ? 'unpaid' : 'pending')
  ) {
    events.push({
      id: `${order.id}-${currentStatus}`,
      status: currentStatus,
      method,
      reference: order.paymentReference,
      amount: order.totalPrice,
      actorName: 'Order System',
      actorRole: 'System',
      note: `Payment status updated to ${currentStatus}.`,
      createdAt: order.cancelledAt || order.updatedAt || order.createdAt,
    });
  }

  return events;
}

export interface OrderFinancialSummary {
  placedOrderValue: number;
  collectedPayments: number;
  refundsIssued: number;
  netSales: number;
  totalOrderCount: number;
  activeOrderCount: number;
  paidOrderCount: number;
  cancelledOrderCount: number;
}

export function calculateOrderFinancialSummary(orders: Order[]): OrderFinancialSummary {
  const safeOrders = orders || [];
  let placedOrderValue = 0;
  let collectedPayments = 0;
  let refundsIssued = 0;
  let netSales = 0;
  let activeOrderCount = 0;
  let paidOrderCount = 0;
  let cancelledOrderCount = 0;

  for (const order of safeOrders) {
    const total = Math.max(0, Number(order.totalPrice) || 0);
    if (order.status === 'cancelled') {
      cancelledOrderCount += 1;
    } else {
      activeOrderCount += 1;
      placedOrderValue += total;
    }

    if (order.paymentStatus === 'paid') {
      paidOrderCount += 1;
      collectedPayments += total;
      netSales += getNetCollectedAmount(order);
    }

    refundsIssued += getRefundedAmount(order);
  }

  return {
    placedOrderValue: Math.round(placedOrderValue * 100) / 100,
    collectedPayments: Math.round(collectedPayments * 100) / 100,
    refundsIssued: Math.round(refundsIssued * 100) / 100,
    netSales: Math.round(netSales * 100) / 100,
    totalOrderCount: safeOrders.length,
    activeOrderCount,
    paidOrderCount,
    cancelledOrderCount,
  };
}

export function getOrderStageAction(order: Order) {
  const next = getNextOrderStage(order);
  let reason = '';
  if (next) {
    try {
      assertOrderStageTransition(order, next);
      const isCustomRig =
        requiresOrderAssembly(order) &&
        order.type !== 'prebuilt' &&
        !order.prebuiltName;

      if (
        (next === 'out_for_delivery' || next === 'delivered') &&
        isCustomRig &&
        order.assemblyVerificationPassed !== true &&
        order.fulfillmentStage !== 'out_for_delivery' &&
        order.fulfillmentStage !== 'delivered'
      ) {
        reason = 'Custom rig assembly verification must be completed and passed before dispatch.';
      }
    } catch (error) {
      reason = error instanceof Error ? error.message : 'Review this order.';
    }
  }
  const label =
    next === 'assembling_testing'
      ? 'Start Assembly'
      : next === 'out_for_delivery'
        ? getOrderFulfillmentStageLabel({
            ...order,
            status: 'pending',
            fulfillmentStage: next,
          }) === 'Ready for Pickup'
          ? 'Mark Ready for Pickup'
          : 'Mark Ready for Delivery'
        : 'Mark Delivered';
  return { next, reason, label };
}
