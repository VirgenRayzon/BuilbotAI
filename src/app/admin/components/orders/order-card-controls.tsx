"use client";

import React from 'react';
import {
  Archive,
  History,
  MoreVertical,
  RotateCcw,
  Trash2,
  XCircle,
} from 'lucide-react';
import { ActionIcon, Button, Group, Menu, Tooltip } from '@mantine/core';
import { RefundReconcileControl } from './refund-reconcile-control';
import type { ReconcileRefund } from '@/lib/order-payment';
import { OrderPaymentControl } from './order-payment-control';
import {
  getAllowedStaffPaymentStatuses,
  getOrderFulfillmentStage,
  getRemainingRefundableAmount,
} from '@/lib/order-workflow';
import type { Order, PaymentStatus } from '@/lib/types';
import type { OrderAdminActionType } from './order-action-modals';

export interface OrderCardControlsProps {
  order: Order;
  archived: boolean;
  isSuperAdmin: boolean;
  reconcilingId: string | null;
  onOpenHistory?: (orderId: string) => void;
  onRequestAdminAction: (order: Order, action: OrderAdminActionType) => void;
  onRequestCancel: (order: Order) => void;
  onRequestPaymentStatus: (order: Order, nextStatus: PaymentStatus) => void;
  onRequestRefund: (order: Order) => void;
  onReconcileRefund?: ReconcileRefund;
  onConfirmStockReturn?: (order: Order) => void;
}

export function OrderCardControls({
  order,
  archived,
  isSuperAdmin,
  reconcilingId,
  onOpenHistory,
  onRequestAdminAction,
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
  const canCancel = !archived && !isCancelled && currentStage !== 'delivered';

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
      {!archived && !isCancelled && allowedPaymentStatuses.length > 0 && (
        <OrderPaymentControl
          order={order}
          archived={archived}
          onRequest={onRequestPaymentStatus}
        />
      )}

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
        <RefundReconcileControl
          order={order}
          reconciling={reconcilingId === order.id}
          reconcile={onReconcileRefund}
        />
      ) : !archived && refundableAmount > 0 && !order.pendingRefundOperationId ? (
        <Button
          size="xs"
          color="orange"
          variant="light"
          radius="md"
          onClick={() => onRequestRefund(order)}
          className="min-h-11 text-xs font-semibold"
        >
          Issue Refund
        </Button>
      ) : null}

      {onOpenHistory && (
        <Tooltip label="View order activity & audit logs" withArrow position="top">
          <ActionIcon
            size="lg"
            variant="subtle"
            color="gray"
            radius="md"
            onClick={() => onOpenHistory(order.id)}
            className="min-h-11 min-w-11"
            aria-label="View order history"
          >
            <History className="h-4 w-4 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200" />
          </ActionIcon>
        </Tooltip>
      )}

      <Menu position="bottom-end" shadow="md" width={180} withinPortal>
        <Menu.Target>
          <ActionIcon
            size="lg"
            variant="subtle"
            color="gray"
            radius="md"
            className="min-h-11 min-w-11"
            aria-label="More actions"
          >
            <MoreVertical className="h-4 w-4 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200" />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown className="border-slate-200 bg-white shadow-lg dark:border-white/10 dark:bg-[#111722]">
          {onOpenHistory && (
            <Menu.Item
              leftSection={<History className="h-4 w-4" />}
              onClick={() => onOpenHistory(order.id)}
            >
              Order Activity
            </Menu.Item>
          )}

          {canCancel && (
            <Menu.Item
              color="red"
              leftSection={<XCircle className="h-4 w-4" />}
              onClick={() => onRequestCancel(order)}
            >
              Cancel Order
            </Menu.Item>
          )}

          <Menu.Item
            leftSection={
              archived ? (
                <RotateCcw className="h-4 w-4" />
              ) : (
                <Archive className="h-4 w-4" />
              )
            }
            onClick={() =>
              onRequestAdminAction(order, archived ? 'restore' : 'archive')
            }
          >
            {archived ? 'Restore Order' : 'Archive Order'}
          </Menu.Item>

          {isSuperAdmin && (
            <Menu.Item
              color="red"
              leftSection={<Trash2 className="h-4 w-4" />}
              onClick={() => onRequestAdminAction(order, 'delete')}
            >
              Delete Order
            </Menu.Item>
          )}
        </Menu.Dropdown>
      </Menu>
    </div>
  );
}
