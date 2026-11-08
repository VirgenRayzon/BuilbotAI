"use client";

import { RefundReconcileControl } from './refund-reconcile-control';
import type { ReconcileRefund } from '@/lib/order-payment';
import { OrderPaymentControl } from './order-payment-control';
import React from 'react';
import { Button, Group } from '@mantine/core';
import {
  getAllowedStaffPaymentStatuses,
  getRemainingRefundableAmount,
  getOrderFulfillmentStage,
} from '@/lib/order-workflow';
import type { Order, PaymentStatus } from '@/lib/types';

export interface OrderCardControlsProps {
  order: Order;
  archived: boolean;
  reconcilingId: string | null;
  onRequestCancel: (order: Order) => void;
  onRequestPaymentStatus: (order: Order, nextStatus: PaymentStatus) => void;
  onRequestRefund: (order: Order) => void;
  onReconcileRefund?: ReconcileRefund;
  onConfirmStockReturn?: (order: Order) => void;
}

export function OrderCardControls({
  order,
  archived,
  reconcilingId,
  onRequestCancel,
  onRequestPaymentStatus,
  onRequestRefund,
  onReconcileRefund,
  onConfirmStockReturn,
}: OrderCardControlsProps) {
  const isCancelled = order.status === 'cancelled';
  const currentStage = getOrderFulfillmentStage(order);

  const allowedPaymentStatuses = getAllowedStaffPaymentStatuses(order);
  const refundableAmount = getRemainingRefundableAmount(order);

  return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        {!archived && !isCancelled && allowedPaymentStatuses.length > 0 && (
          <OrderPaymentControl order={order} archived={archived} onRequest={onRequestPaymentStatus} />
        )}

        <Group gap="xs" wrap="wrap" className="justify-end">
          {isCancelled && order.stockState === 'pending_return' && onConfirmStockReturn && (
            <Button
              size="xs"
              color="teal"
              variant="filled"
              radius="md"
              onClick={() => onConfirmStockReturn(order)}
              className="min-h-11 text-xs"
            >
              Confirm Physical Return
            </Button>
          )}

          {!archived && order.pendingRefundOperationId && onReconcileRefund ? (
            <RefundReconcileControl order={order} reconciling={reconcilingId === order.id} reconcile={onReconcileRefund} />
          ) : !archived && refundableAmount > 0 && !order.pendingRefundOperationId ? (
            <Button
              size="xs"
              color="orange"
              variant="light"
              radius="md"
              onClick={() => onRequestRefund(order)}
              className="min-h-11 text-xs"
            >
              Issue Refund
            </Button>
          ) : null}

          {!archived && !isCancelled && currentStage !== 'delivered' && (
            <Button
              size="xs"
              color="red"
              variant="subtle"
              radius="md"
              onClick={() => onRequestCancel(order)}
              className="min-h-11 text-xs"
            >
              Cancel Order
            </Button>
          )}
        </Group>
      </div>
  );
}
