"use client";

import type { ReconcileRefund } from '@/lib/order-payment';
import React from 'react';
import { Badge, Paper, Stack, Text } from '@mantine/core';
import type { Order, OrderFulfillmentStage, Part, PaymentStatus } from '@/lib/types';
import { cn, formatCurrency } from '@/lib/utils';
import type { OrderAdminActionType } from './order-action-modals';
import { CopyableOrderId } from './copyable-order-id';
import { OrderCardControls } from './order-card-controls';
import { OrderCardFulfillmentStepper } from './order-card-fulfillment-stepper';
import { OrderCardItemsList } from './order-card-items-list';
import {
  getRefundBadgeInfo,
  getStockBadgeInfo,
} from './order-status-config';
import { getPaymentStatusInfo } from '@/lib/payment-methods';
import { getNetCollectedAmount, getRefundedAmount } from '@/lib/order-workflow';

export interface OrderCardProps {
  order: Order;
  catalogParts?: Part[] | null;
  archived: boolean;
  isSuperAdmin: boolean;
  reconcilingId: string | null;
  assemblyVerifiedOverride?: boolean;
  onOpenItems?: (orderId: string) => void;
  onOpenHistory?: (orderId: string) => void;
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
  archived,
  isSuperAdmin,
  reconcilingId,
  assemblyVerifiedOverride,
  onOpenItems,
  onOpenHistory,
  onRequestAdminAction,
  onRequestCancel,
  onRequestPaymentStatus,
  onRequestRefund,
  onReconcileRefund,
  onUpdateFulfillmentStage,
  onConfirmStockReturn,
}: OrderCardProps) {
  const isCancelled = order.status === 'cancelled';
  const stockBadge = getStockBadgeInfo(order);
  const showStockBadge =
    order.stockState === 'pending_return' ||
    order.stockState === 'restored_with_exceptions' ||
    (isCancelled && Boolean(order.stockState));
  const paymentStatusInfo = getPaymentStatusInfo(order.paymentStatus, order.paymentMethod);
  const refundBadge = getRefundBadgeInfo(order);
  const refundedTotal = getRefundedAmount(order);
  const netCollected = getNetCollectedAmount(order);

  const displayOrderId = order.orderNumber || `#${order.id.slice(0, 10).toUpperCase()}`;
  const effectiveAssemblyVerified =
    assemblyVerifiedOverride ?? order.assemblyVerificationPassed;

  const customerName =
    order.shippingAddress?.fullName ||
    order.userEmail?.split('@')[0] ||
    'Customer';

  const stopCardTrigger = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  return (
    <Paper
      withBorder
      radius="lg"
      p={{ base: 'sm', sm: 'md' }}
      role={onOpenItems ? 'button' : undefined}
      tabIndex={onOpenItems ? 0 : undefined}
      aria-label={onOpenItems ? `View items for order ${displayOrderId}` : undefined}
      onClick={onOpenItems ? () => onOpenItems(order.id) : undefined}
      onKeyDown={
        onOpenItems
          ? (e) => {
              if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onOpenItems(order.id);
              }
            }
          : undefined
      }
      className={cn(
        'group/card w-full h-full flex flex-col justify-between transition-all duration-200 shadow-xs',
        'bg-white/90 dark:bg-[#111722] border-slate-200 dark:border-white/10',
        onOpenItems &&
          'cursor-pointer hover:border-cyan-500/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50',
        isCancelled && 'opacity-85'
      )}
    >
      <Stack gap="xs" className="w-full h-full justify-between">
        <Stack gap="xs" className="w-full">
          {/* Compact Header: Name + Status Badges on left, Price/Actions + Order ID on lower right */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2 pb-2 border-b border-slate-200/80 dark:border-white/10">
            <div className="min-w-0 flex-1 flex items-center gap-1.5 flex-wrap pt-0.5">
              <Text fw={700} size="sm" className="font-headline text-slate-900 dark:text-slate-100 truncate">
                {customerName}
              </Text>
              <Badge size="xs" color={paymentStatusInfo.color} variant="light" className="shrink-0">
                {paymentStatusInfo.label}
              </Badge>
              {showStockBadge && (
                <Badge size="xs" color={stockBadge.color} variant="light" className="shrink-0">
                  {stockBadge.label}
                </Badge>
              )}
              {refundBadge && (
                <Badge size="xs" color={refundBadge.color} variant="light" className="shrink-0">
                  {refundBadge.label}
                </Badge>
              )}
            </div>

            <div
              onClick={stopCardTrigger}
              onKeyDown={stopCardTrigger}
              className="flex flex-col items-end gap-1 shrink-0 w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-white/5"
            >
              <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                <div className="text-left sm:text-right">
                  <div className="font-mono font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                    {formatCurrency(order.totalPrice)}
                  </div>
                  {refundedTotal > 0 && (
                    <div className="text-[10px] sm:text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                      Net: {formatCurrency(netCollected)}
                    </div>
                  )}
                </div>

                <OrderCardControls
                  order={order}
                  archived={archived}
                  isSuperAdmin={isSuperAdmin}
                  reconcilingId={reconcilingId}
                  onOpenHistory={onOpenHistory}
                  onRequestAdminAction={onRequestAdminAction}
                  onRequestCancel={onRequestCancel}
                  onRequestPaymentStatus={onRequestPaymentStatus}
                  onRequestRefund={onRequestRefund}
                  onReconcileRefund={onReconcileRefund}
                  onConfirmStockReturn={onConfirmStockReturn}
                />
              </div>

              <CopyableOrderId orderId={order.orderNumber || order.id} displayId={displayOrderId} />
            </div>
          </div>

          {/* Click-to-Advance Stepper */}
          <div onClick={stopCardTrigger} onKeyDown={stopCardTrigger}>
            <OrderCardFulfillmentStepper
              order={order}
              onUpdateFulfillmentStage={onUpdateFulfillmentStage}
              archived={archived}
              isAssemblyVerified={effectiveAssemblyVerified}
            />
          </div>
        </Stack>

        {/* Compact Items Summary Strip (opens modal on card click) */}
        <OrderCardItemsList
          order={order}
          isAssemblyVerified={effectiveAssemblyVerified}
        />
      </Stack>
    </Paper>
  );
}
