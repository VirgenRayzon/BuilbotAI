"use client";

import type { ReconcileRefund } from '@/lib/order-payment';
import React, { useEffect, useState } from 'react';
import {
  Archive,
  Calendar,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import {
  ActionIcon,
  Avatar,
  Group,
  Paper,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import type { Order, OrderFulfillmentStage, Part, PaymentStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import type { OrderAdminActionType } from './order-action-modals';
import { CopyableOrderId } from './copyable-order-id';
import { OrderCardControls } from './order-card-controls';
import { OrderCardCustomerFinance } from './order-card-customer-finance';
import { OrderCardFulfillmentStepper } from './order-card-fulfillment-stepper';
import { OrderCardHistoryLedgers } from './order-card-history-ledgers';
import { OrderCardItemsList } from './order-card-items-list';
import {
  formatFirestoreTimestamp,
  getOrderStageBadgeInfo,
} from './order-status-config';

export interface OrderCardProps {
  order: Order;
  catalogParts?: Part[] | null;
  archived: boolean;
  isSuperAdmin: boolean;
  reconcilingId: string | null;
  onRequestAdminAction: (order: Order, action: OrderAdminActionType) => void;
  onRequestCancel: (order: Order) => void;
  onRequestPaymentStatus: (order: Order, nextStatus: PaymentStatus) => void;
  onRequestRefund: (order: Order) => void;
  onReconcileRefund?: ReconcileRefund;
  onUpdateFulfillmentStage?: (orderId: string, stage: OrderFulfillmentStage) => void;
  onConfirmStockReturn?: (order: Order) => void;
}

export function OrderCard({
  order,
  catalogParts,
  archived,
  isSuperAdmin,
  reconcilingId,
  onRequestAdminAction,
  onRequestCancel,
  onRequestPaymentStatus,
  onRequestRefund,
  onReconcileRefund,
  onUpdateFulfillmentStage,
  onConfirmStockReturn,
}: OrderCardProps) {
  const isPrebuilt = order.type === 'prebuilt' || Boolean(order.prebuiltName);
  const isCancelled = order.status === 'cancelled';
  const stageInfo = getOrderStageBadgeInfo(order);
  const displayOrderId = order.orderNumber || `#${order.id.slice(0, 10).toUpperCase()}`;

  const [isAssemblyVerified, setIsAssemblyVerified] = useState<boolean | undefined>(
    order.assemblyVerificationPassed
  );

  useEffect(() => {
    if (order.assemblyVerificationPassed !== undefined) {
      setIsAssemblyVerified(order.assemblyVerificationPassed);
    }
  }, [order.assemblyVerificationPassed]);

  const customerName =
    order.shippingAddress?.fullName ||
    order.userEmail?.split('@')[0] ||
    'Customer';
  const customerInitials =
    customerName
      .split(' ')
      .map((p) => p[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'CU';

  return (
    <Paper
      withBorder
      radius="lg"
      p={{ base: 'md', sm: 'lg' }}
      className={cn(
        'w-full transition-all duration-200 shadow-sm space-y-4',
        'bg-white/85 dark:bg-[#111722] border-slate-200 dark:border-white/10 hover:border-cyan-500/40',
        isCancelled && 'opacity-85'
      )}
    >
      <Stack gap="md" className="w-full">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-3 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Avatar
              size={44}
              radius={44}
              color={isPrebuilt ? 'cyan' : stageInfo.color}
              variant="light"
              className="border border-slate-200 dark:border-white/10 shrink-0 font-bold text-sm"
            >
              {customerInitials}
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Text fw={700} size="md" className="font-headline text-slate-900 dark:text-slate-100 truncate">
                  {customerName}
                </Text>
                <CopyableOrderId orderId={order.orderNumber || order.id} displayId={displayOrderId} />
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                <Tooltip label={order.userEmail} withArrow position="top">
                  <span className="truncate max-w-[200px] sm:max-w-[260px]">{order.userEmail}</span>
                </Tooltip>
                <span>•</span>
                <span className="flex items-center gap-1 font-mono text-[11px]">
                  <Calendar className="h-3 w-3 shrink-0" />
                  {formatFirestoreTimestamp(order.createdAt, true)}
                </span>
                {order.shippingAddress?.phone && (
                  <>
                    <span>•</span>
                    <span className="font-mono text-[11px]">{order.shippingAddress.phone}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
            <OrderCardControls
              order={order}
              archived={archived}
              reconcilingId={reconcilingId}
              onRequestCancel={onRequestCancel}
              onRequestPaymentStatus={onRequestPaymentStatus}
              onRequestRefund={onRequestRefund}
              onReconcileRefund={onReconcileRefund}
              onConfirmStockReturn={onConfirmStockReturn}
            />
            <Group gap={4} wrap="nowrap">
              <Tooltip label={archived ? 'Restore order' : 'Archive order'} withArrow position="top">
                <ActionIcon
                  size="lg"
                  color="cyan"
                  variant="subtle"
                  radius="md"
                  onClick={() => onRequestAdminAction(order, archived ? 'restore' : 'archive')}
                  className="min-h-11 min-w-11"
                  aria-label={archived ? 'Restore order' : 'Archive order'}
                >
                  {archived ? <RotateCcw className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                </ActionIcon>
              </Tooltip>

              {isSuperAdmin && (
                <Tooltip label="Delete order" withArrow position="top">
                  <ActionIcon
                    size="lg"
                    color="red"
                    variant="subtle"
                    radius="md"
                    onClick={() => onRequestAdminAction(order, 'delete')}
                    className="min-h-11 min-w-11"
                    aria-label="Delete order"
                  >
                    <Trash2 className="h-4 w-4" />
                  </ActionIcon>
                </Tooltip>
              )}
            </Group>
          </div>
        </div>

        <OrderCardFulfillmentStepper
          order={order}
          onUpdateFulfillmentStage={onUpdateFulfillmentStage}
          archived={archived}
          isAssemblyVerified={isAssemblyVerified}
        />

        <OrderCardItemsList
          order={order}
          catalogParts={catalogParts}
          onAssemblyVerificationChange={setIsAssemblyVerified}
        />

        <OrderCardCustomerFinance order={order} />

        <OrderCardHistoryLedgers
          order={order}
          archived={archived}
          reconciling={reconcilingId === order.id}
          onOpenRefund={onRequestRefund}
          onReconcileRefund={onReconcileRefund}
        />

      </Stack>
    </Paper>
  );
}
