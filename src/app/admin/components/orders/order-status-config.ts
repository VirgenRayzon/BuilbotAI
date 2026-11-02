import {
  Banknote,
  CheckCircle2,
  Clock,
  CreditCard,
  Smartphone,
  Truck,
  Wrench,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import {
  getOrderFulfillmentStage,
  getOrderFulfillmentStageLabel,
  getOrderStockState,
  getRefundedAmount,
} from '@/lib/order-workflow';
import type { Order, OrderFulfillmentStage, PaymentMethod, ShippingMethod } from '@/lib/types';

export type OrderUnifiedFilterStage = 'all' | OrderFulfillmentStage | 'cancelled';
export type OrderRefundFilter = 'all' | 'due' | 'pending' | 'partial' | 'refunded';
export type OrderSortOption = 'newest' | 'oldest' | 'price-high' | 'price-low';

export interface StageVisualConfig {
  label: string;
  color: string;
  selectInputClass: string;
  icon: LucideIcon;
}

export const ORDER_STAGE_VISUALS: Record<OrderFulfillmentStage | 'cancelled', StageVisualConfig> = {
  order_placed: {
    label: 'Order Placed',
    color: 'yellow',
    selectInputClass:
      'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30 hover:border-amber-500',
    icon: Clock,
  },
  assembling_testing: {
    label: 'Assembling & Testing',
    color: 'blue',
    selectInputClass:
      'bg-blue-500/10 text-blue-800 dark:text-blue-300 border-blue-500/30 hover:border-blue-500',
    icon: Wrench,
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    color: 'cyan',
    selectInputClass:
      'bg-cyan-500/10 text-cyan-800 dark:text-cyan-300 border-cyan-500/30 hover:border-cyan-500',
    icon: Truck,
  },
  delivered: {
    label: 'Delivered',
    color: 'teal',
    selectInputClass:
      'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 hover:border-emerald-500',
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'red',
    selectInputClass:
      'bg-rose-500/10 text-rose-800 dark:text-rose-300 border-rose-500/30 hover:border-rose-500',
    icon: XCircle,
  },
};

export function getEffectiveOrderDisplayStage(
  order: Pick<Order, 'status' | 'fulfillmentStage'>
): OrderFulfillmentStage | 'cancelled' {
  if (order.status === 'cancelled') return 'cancelled';
  return getOrderFulfillmentStage(order);
}

export function getOrderStageBadgeInfo(
  order: Pick<Order, 'status' | 'fulfillmentStage' | 'shippingMethod' | 'paymentMethod'>
) {
  const key = getEffectiveOrderDisplayStage(order);
  const visual = ORDER_STAGE_VISUALS[key];
  return {
    key,
    label: getOrderFulfillmentStageLabel(order),
    color: visual.color,
    selectInputClass: visual.selectInputClass,
    Icon: visual.icon,
  };
}

export function getRefundBadgeInfo(
  order: Pick<Order, 'refundStatus' | 'refundedAmount' | 'refunds' | 'pendingRefundOperationId'>
): { label: string; color: string } | null {
  if (order.pendingRefundOperationId || order.refundStatus === 'pending') {
    return { label: 'Refund Pending', color: 'orange' };
  }
  if (order.refundStatus === 'due') {
    return { label: 'Refund Due', color: 'red' };
  }
  if (order.refundStatus === 'refunded') {
    return { label: 'Refunded', color: 'grape' };
  }
  if (order.refundStatus === 'partial' || getRefundedAmount(order) > 0) {
    return { label: 'Partial Refund', color: 'yellow' };
  }
  return null;
}

export function getStockBadgeInfo(
  order: Pick<Order, 'stockState' | 'stockRestoredAt' | 'status'>
): { label: string; color: string; restored: boolean } {
  const state = getOrderStockState(order);
  if (state === 'pending_return') {
    return { label: 'Return Pending', color: 'orange', restored: false };
  }
  if (state === 'restored_with_exceptions') {
    return { label: 'Returned (Exceptions)', color: 'yellow', restored: true };
  }
  return state === 'restored'
    ? { label: 'Stock Returned', color: 'gray', restored: true }
    : { label: 'Stock Reserved', color: 'cyan', restored: false };
}

export function getPaymentMethodIcon(method?: PaymentMethod): LucideIcon {
  if (method === 'gcash_simulated') return Smartphone;
  if (method === 'paymongo_simulated' || method === 'card_simulated') return CreditCard;
  return Banknote;
}

export function getShippingMethodLabel(method?: ShippingMethod, isLegacy?: boolean): string {
  if (method === 'store_pickup') return 'Store Pickup';
  if (method === 'sameday_express') return 'Same-Day Express';
  if (method === 'standard_courier') return 'Standard Courier';
  return isLegacy ? 'Store Pickup (Legacy)' : 'Standard Delivery';
}

export function isLegacyReservationRecord(
  order: Pick<Order, 'fulfillmentStage' | 'paymentMethod' | 'orderNumber'>
): boolean {
  return !order.fulfillmentStage && !order.paymentMethod && !order.orderNumber;
}

export function formatFirestoreTimestamp(value: unknown, includeTime = false): string {
  if (!value) return 'Recent';

  let date: Date | null = null;
  if (value instanceof Date) {
    date = value;
  } else if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) date = parsed;
  } else if (typeof value === 'object') {
    const candidate = value as { toDate?: () => Date; seconds?: number; _seconds?: number };
    if (typeof candidate.toDate === 'function') {
      date = candidate.toDate();
    } else if (typeof candidate.seconds === 'number') {
      date = new Date(candidate.seconds * 1000);
    } else if (typeof candidate._seconds === 'number') {
      date = new Date(candidate._seconds * 1000);
    }
  }

  if (!date || Number.isNaN(date.getTime())) return 'Recent';
  return includeTime
    ? date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : date.toLocaleDateString(undefined, { dateStyle: 'medium' });
}

export function getTimestampSeconds(value: unknown): number {
  if (!value) return 0;
  if (value instanceof Date) return Math.floor(value.getTime() / 1000);
  if (typeof value === 'string' || typeof value === 'number') {
    const ms = new Date(value).getTime();
    return Number.isNaN(ms) ? 0 : Math.floor(ms / 1000);
  }
  if (typeof value === 'object') {
    const candidate = value as { toDate?: () => Date; seconds?: number; _seconds?: number };
    if (typeof candidate.seconds === 'number') return candidate.seconds;
    if (typeof candidate._seconds === 'number') return candidate._seconds;
    if (typeof candidate.toDate === 'function') {
      return Math.floor(candidate.toDate().getTime() / 1000);
    }
  }
  return 0;
}

