"use client";

import type { ReconcileRefund } from '@/lib/order-payment';
import React, { useEffect, useState } from 'react';
import { Calendar, Store, Truck } from 'lucide-react';
import { Badge, Paper, Stack, Text } from '@mantine/core';
import type { Order, OrderFulfillmentStage, Part, PaymentStatus } from '@/lib/types';
import { cn, formatCurrency } from '@/lib/utils';
import type { OrderAdminActionType } from './order-action-modals';
import { CopyableOrderId } from './copyable-order-id';
import { OrderCardControls } from './order-card-controls';
import { OrderCardFulfillmentStepper } from './order-card-fulfillment-stepper';
import { OrderCardItemsList } from './order-card-items-list';
import {
  formatFirestoreTimestamp,
  getRefundBadgeInfo,
  getShippingMethodLabel,
  getStockBadgeInfo,
  isLegacyReservationRecord,
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
  const isCancelled = order.status === 'cancelled';
  const isLegacy = isLegacyReservationRecord(order);
  const stockBadge = getStockBadgeInfo(order);
  const showStockBadge =
    order.stockState === 'pending_return' ||
    order.stockState === 'restored_with_exceptions' ||
    (isCancelled && Boolean(order.stockState));
  const paymentStatusInfo = getPaymentStatusInfo(order.paymentStatus, order.paymentMethod);
  const refundBadge = getRefundBadgeInfo(order);
  const refundedTotal = getRefundedAmount(order);
  const netCollected = getNetCollectedAmount(order);

  const isPickup =
    order.shippingMethod === 'store_pickup' ||
    order.shippingAddress?.streetAddress?.toLowerCase().includes('pickup');
  const shippingLabel = getShippingMethodLabel(order.shippingMethod, isLegacy);

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

  return (
    <Paper
      withBorder
      radius="lg"
      p={{ base: 'sm', sm: 'md' }}
      className={cn(
        'w-full transition-all duration-200 shadow-xs',
        'bg-white/90 dark:bg-[#111722] border-slate-200 dark:border-white/10 hover:border-cyan-500/40',
        isCancelled && 'opacity-85'
      )}
    >
      <Stack gap="xs" className="w-full">
        {/* Compact Header: Identity + Metadata + Total + Actions */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-2 border-b border-slate-200/80 dark:border-white/10">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <CopyableOrderId orderId={order.orderNumber || order.id} displayId={displayOrderId} />
              <Text fw={700} size="sm" className="font-headline text-slate-900 dark:text-slate-100 truncate">
                {customerName}
              </Text>
              <Badge size="xs" color={paymentStatusInfo.color} variant="light">
                {paymentStatusInfo.label}
              </Badge>
              {showStockBadge && (
                <Badge size="xs" color={stockBadge.color} variant="light">
                  {stockBadge.label}
                </Badge>
              )}
              {refundBadge && (
                <Badge size="xs" color={refundBadge.color} variant="light">
                  {refundBadge.label}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1 font-mono">
                <Calendar className="h-3 w-3 shrink-0" />
                {formatFirestoreTimestamp(order.createdAt, true)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
                {isPickup ? (
                  <Store className="h-3 w-3 shrink-0 text-cyan-600 dark:text-cyan-400" />
                ) : (
                  <Truck className="h-3 w-3 shrink-0 text-cyan-600 dark:text-cyan-400" />
                )}
                {shippingLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-white/5">
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

        {/* Click-to-Advance Stepper */}
        <OrderCardFulfillmentStepper
          order={order}
          onUpdateFulfillmentStage={onUpdateFulfillmentStage}
          archived={archived}
          isAssemblyVerified={isAssemblyVerified}
        />

        {/* Prebuilt Accordion & Parts Picking */}
        <OrderCardItemsList
          order={order}
          catalogParts={catalogParts}
          onAssemblyVerificationChange={setIsAssemblyVerified}
        />
      </Stack>
    </Paper>
  );
}
