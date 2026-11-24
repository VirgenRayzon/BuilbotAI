"use client";

import React from 'react';
import type { ReconcileRefund } from '@/lib/order-payment';
import type { Order } from '@/lib/types';
import { OrderActivityTimeline } from './order-activity-timeline';
import { RefundReconcileControl } from './refund-reconcile-control';

interface OrderHistoryLedgersProps {
  order: Order;
  archived: boolean;
  reconciling: boolean;
  onOpenRefund?: (order: Order) => void;
  onReconcileRefund?: ReconcileRefund;
}

export function OrderHistoryLedgers({
  order,
  archived,
  reconciling,
  onReconcileRefund,
}: OrderHistoryLedgersProps) {
  return (
    <div className="space-y-3">
      {!archived && order.pendingRefundOperationId && onReconcileRefund && (
        <div className="p-2.5 rounded-lg bg-orange-500/10 border border-orange-500/30">
          <RefundReconcileControl
            order={order}
            reconciling={reconciling}
            reconcile={onReconcileRefund}
          />
        </div>
      )}
      <OrderActivityTimeline order={order} embedded />
    </div>
  );
}
