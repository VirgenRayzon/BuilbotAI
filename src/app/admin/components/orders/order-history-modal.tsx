"use client";

import type { ReconcileRefund } from '@/lib/order-payment';
import React from 'react';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Badge, Button, Divider, Group, Modal, Paper, Stack, Text } from '@mantine/core';
import {
  availableOrderStages,
  getNetCollectedAmount,
  getOrderFulfillmentStage,
  getOrderFulfillmentStageLabel,
  getRefundedAmount,
} from '@/lib/order-workflow';
import { getPaymentStatusInfo } from '@/lib/payment-methods';
import type { Order } from '@/lib/types';
import { cn, formatCurrency } from '@/lib/utils';
import { OrderHistoryLedgers } from './order-history-ledgers';
import {
  formatFirestoreTimestamp,
  getOrderStageBadgeInfo,
  getRefundBadgeInfo,
  getShippingMethodLabel,
  getStockBadgeInfo,
  isLegacyReservationRecord,
} from './order-status-config';

interface OrderHistoryModalProps {
  order: Order | null;
  archived?: boolean;
  reconciling?: boolean;
  onClose: () => void;
  onOpenRefund?: (order: Order) => void;
  onReconcileRefund?: ReconcileRefund;
}

export function OrderHistoryModal({
  order,
  archived = false,
  reconciling = false,
  onClose,
  onOpenRefund,
  onReconcileRefund,
}: OrderHistoryModalProps) {
  if (!order) return null;

  const displayOrderId = order.orderNumber || `#${order.id.slice(0, 10).toUpperCase()}`;
  const isLegacy = isLegacyReservationRecord(order);
  const stageBadge = getOrderStageBadgeInfo(order);
  const paymentStatusInfo = getPaymentStatusInfo(order.paymentStatus, order.paymentMethod);
  const refundBadge = getRefundBadgeInfo(order);
  const stockBadge = getStockBadgeInfo(order);
  const stages = availableOrderStages(order);
  const currentStage = getOrderFulfillmentStage(order);
  const currentStageIdx = stages.indexOf(currentStage);
  const refundedTotal = getRefundedAmount(order);
  const netCollected = getNetCollectedAmount(order);

  return (
    <Modal
      opened={Boolean(order)}
      onClose={onClose}
      title={
        <div className="flex flex-wrap items-center gap-2">
          <Text fw={700} className="font-headline text-sm text-slate-900 dark:text-slate-100">
            Order {displayOrderId}
          </Text>
          <Badge size="xs" color={stageBadge.color} variant="light">
            {stageBadge.label}
          </Badge>
          {isLegacy && (
            <Badge size="xs" color="gray" variant="outline">
              Legacy Record
            </Badge>
          )}
        </div>
      }
      centered
      size="lg"
      radius="lg"
      classNames={{
        content:
          'bg-white/95 dark:bg-[#141a23]/95 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100',
        header:
          'bg-white/95 dark:bg-[#141a23]/95 border-b border-slate-200 dark:border-white/10 p-3',
        body: '!p-3 max-h-[82dvh] overflow-y-auto',
      }}
    >
      <Stack gap="sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Paper
            withBorder
            radius="md"
            className="border-slate-200 bg-slate-50 p-3 text-xs space-y-1.5 dark:border-white/10 dark:bg-[#111722]"
          >
            <Text fw={700} size="xs" className="uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Customer & Fulfillment
            </Text>
            <p className="font-semibold text-slate-900 dark:text-slate-100 break-all">{order.userEmail}</p>
            <p className="text-slate-600 dark:text-slate-300">
              Placed: <strong>{formatFirestoreTimestamp(order.createdAt, true)}</strong>
            </p>
            <p className="text-slate-600 dark:text-slate-300">
              Delivery: <strong>{getShippingMethodLabel(order.shippingMethod, isLegacy)}</strong>
            </p>
            {order.shippingAddress && (
              <p className="text-slate-600 dark:text-slate-400 leading-snug">
                {order.shippingAddress.fullName} · {order.shippingAddress.phone}
                <br />
                {order.shippingAddress.streetAddress}, {order.shippingAddress.barangay}, {order.shippingAddress.city}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
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
          </Paper>

          <Paper
            withBorder
            radius="md"
            className="border-slate-200 bg-slate-50 p-3 text-xs space-y-1 dark:border-white/10 dark:bg-[#111722]"
          >
            <Text fw={700} size="xs" className="uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Financial Summary
            </Text>
            {typeof order.subtotal === 'number' && (
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
                <span className="font-mono">{formatCurrency(order.subtotal)}</span>
              </div>
            )}
            {typeof order.shippingFee === 'number' && order.shippingFee > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Shipping</span>
                <span className="font-mono">{formatCurrency(order.shippingFee)}</span>
              </div>
            )}
            {typeof order.protectionFee === 'number' && order.protectionFee > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Crate Protection</span>
                <span className="font-mono">{formatCurrency(order.protectionFee)}</span>
              </div>
            )}
            {typeof order.discountAmount === 'number' && order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Discount {order.voucherCode ? `(${order.voucherCode})` : ''}</span>
                <span className="font-mono">-{formatCurrency(order.discountAmount)}</span>
              </div>
            )}
            <Divider my={4} />
            <div className="flex justify-between font-bold text-slate-900 dark:text-slate-100">
              <span>Placed Total</span>
              <span className="font-mono">{formatCurrency(order.totalPrice)}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Refunded</span>
              <span className="font-mono text-rose-600 dark:text-rose-400">
                {refundedTotal > 0 ? `-${formatCurrency(refundedTotal)}` : formatCurrency(0)}
              </span>
            </div>
            <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400">
              <span>Net Collected</span>
              <span className="font-mono">{formatCurrency(netCollected)}</span>
            </div>
          </Paper>
        </div>

        {/* Fulfillment Progress */}
        <Paper
          withBorder
          radius="md"
          className="border-slate-200 bg-slate-50 p-3 space-y-2 dark:border-white/10 dark:bg-[#111722]"
        >
          <Text fw={700} size="xs" className="uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Fulfillment Progress
          </Text>
          {order.status === 'cancelled' ? (
            <div className="flex items-start gap-2 rounded-md border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-800 dark:text-rose-300">
              <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">
                  Order Cancelled {order.autoCancelled ? '(Expired 1-Hour Online Hold)' : ''}
                </p>
                {order.cancellationReason && <p className="mt-0.5">{order.cancellationReason}</p>}
                {order.cancelledAt && (
                  <p className="mt-0.5 opacity-80">
                    Cancelled on {formatFirestoreTimestamp(order.cancelledAt, true)} · {stockBadge.label}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-4">
              {stages.map((stage, idx) => {
                const completed = idx <= currentStageIdx;
                const label = getOrderFulfillmentStageLabel({
                  ...order,
                  fulfillmentStage: stage,
                  status: 'pending',
                });
                return (
                  <div
                    key={stage}
                    className={cn(
                      'flex items-center gap-1.5 rounded-md border p-2 text-xs',
                      completed
                        ? 'border-cyan-500/40 bg-cyan-500/10 text-slate-900 dark:text-slate-100'
                        : 'border-slate-200 bg-white/70 text-slate-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-slate-400'
                    )}
                  >
                    {completed ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-cyan-600 dark:text-cyan-400" />
                    ) : (
                      <Clock className="h-3.5 w-3.5 shrink-0 opacity-60" />
                    )}
                    <span className="font-semibold leading-tight">{label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Paper>

        <OrderHistoryLedgers
          order={order}
          archived={archived}
          reconciling={reconciling}
          onOpenRefund={onOpenRefund}
          onReconcileRefund={onReconcileRefund}
        />

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose} className="min-h-11">
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
