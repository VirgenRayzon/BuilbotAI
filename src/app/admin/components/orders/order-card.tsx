"use client";

import type { ReconcileRefund } from '@/lib/order-payment';
import React, { useEffect, useState } from 'react';
import {
  Calendar,
} from 'lucide-react';
import {
  Avatar,
  Badge,
  Paper,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import type { Order, OrderFulfillmentStage, Part, PaymentStatus } from '@/lib/types';
import { cn, formatCurrency } from '@/lib/utils';
import type { OrderAdminActionType } from './order-action-modals';
import { CopyableOrderId } from './copyable-order-id';
import { OrderCardControls } from './order-card-controls';
import { OrderCardCustomerFinance } from './order-card-customer-finance';
import { OrderCardFulfillmentStepper } from './order-card-fulfillment-stepper';
import { OrderCardItemsList } from './order-card-items-list';
import {
  formatFirestoreTimestamp,
  getOrderStageBadgeInfo,
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
  catalogParts,
  archived,
  isSuperAdmin,
  reconcilingId,
  onOpenHistory,
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
  const stockBadge = getStockBadgeInfo(order);
  const paymentStatusInfo = getPaymentStatusInfo(order.paymentStatus, order.paymentMethod);
  const refundBadge = getRefundBadgeInfo(order);
  const refundedTotal = getRefundedAmount(order);
  const netCollected = getNetCollectedAmount(order);

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
      p={{ base: 'sm', sm: 'md' }}
      className={cn(
        'w-full transition-all duration-200 shadow-xs space-y-3',
        'bg-white/90 dark:bg-[#111722] border-slate-200 dark:border-white/10 hover:border-cyan-500/40',
        isCancelled && 'opacity-85'
      )}
    >
      <Stack gap="sm" className="w-full">
        {/* Header: Customer info + Badges + Total + Actions */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-2.5 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Avatar
              size={40}
              radius={40}
              color={isPrebuilt ? 'cyan' : stageInfo.color}
              variant="light"
              className="border border-slate-200 dark:border-white/10 shrink-0 font-bold text-xs"
            >
              {customerInitials}
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Text fw={700} size="sm" className="font-headline text-slate-900 dark:text-slate-100 truncate">
                  {customerName}
                </Text>
                <CopyableOrderId orderId={order.orderNumber || order.id} displayId={displayOrderId} />

                {/* Primary status badges in header */}
                <Badge size="xs" color={stockBadge.color} variant="light">
                  {stockBadge.label}
                </Badge>
                <Badge size="xs" color={paymentStatusInfo.color} variant="light">
                  {paymentStatusInfo.label}
                </Badge>
                {refundBadge && (
                  <Badge size="xs" color={refundBadge.color} variant="light">
                    {refundBadge.label}
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <Tooltip label={order.userEmail} withArrow position="top">
                  <span className="truncate max-w-[180px] sm:max-w-[240px]">{order.userEmail}</span>
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

          <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-white/5">
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
        </div>

        {/* Stepper */}
        <OrderCardFulfillmentStepper
          order={order}
          onUpdateFulfillmentStage={onUpdateFulfillmentStage}
          archived={archived}
          isAssemblyVerified={isAssemblyVerified}
        />

        {/* Hardware Items List (Component picking retained open in assembling stage) */}
        <OrderCardItemsList
          order={order}
          catalogParts={catalogParts}
          onAssemblyVerificationChange={setIsAssemblyVerified}
        />

        {/* Compact Delivery & Finance Strip */}
        <OrderCardCustomerFinance order={order} />
      </Stack>
    </Paper>
  );
}
