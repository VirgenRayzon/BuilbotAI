"use client";

import React from 'react';
import { Calendar, Hash, MapPin, Truck } from 'lucide-react';
import { Badge, Divider, Paper, Text } from '@mantine/core';
import {
  getNetCollectedAmount,
  getRefundedAmount,
} from '@/lib/order-workflow';
import { getPaymentStatusInfo } from '@/lib/payment-methods';
import type { Order } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import {
  formatFirestoreTimestamp,
  getRefundBadgeInfo,
  getShippingMethodLabel,
  getStockBadgeInfo,
  isLegacyReservationRecord,
} from './order-status-config';

interface OrderCardCustomerFinanceProps {
  order: Order;
}

export function OrderCardCustomerFinance({ order }: OrderCardCustomerFinanceProps) {
  const isLegacy = isLegacyReservationRecord(order);
  const paymentStatusInfo = getPaymentStatusInfo(order.paymentStatus, order.paymentMethod);
  const refundBadge = getRefundBadgeInfo(order);
  const stockBadge = getStockBadgeInfo(order);
  const refundedTotal = getRefundedAmount(order);
  const netCollected = getNetCollectedAmount(order);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
      {/* Customer & Delivery Address Panel */}
      <Paper
        withBorder
        radius="md"
        className="border-slate-200/80 bg-slate-50/70 p-3.5 space-y-2 dark:border-white/10 dark:bg-white/[0.02] text-xs"
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-white/10 pb-1.5">
          <Text fw={700} size="xs" className="uppercase tracking-wider text-slate-500 dark:text-slate-400 text-[10px]">
            Customer & Delivery Info
          </Text>
          <div className="flex items-center gap-1.5 flex-wrap">
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
        </div>

        <div className="space-y-1">
          <p className="font-semibold text-slate-900 dark:text-slate-100 break-all">
            {order.userEmail}
          </p>

          <p className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            <Calendar size={13} className="text-slate-400 shrink-0" />
            <span>Placed: <strong>{formatFirestoreTimestamp(order.createdAt, true)}</strong></span>
          </p>

          <p className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            <Truck size={13} className="text-slate-400 shrink-0" />
            <span>Method: <strong>{getShippingMethodLabel(order.shippingMethod, isLegacy)}</strong></span>
          </p>

          {order.paymentReference && (
            <p className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5 font-mono text-[11px]">
              <Hash size={13} className="text-slate-400 shrink-0" />
              <span>Payment Ref: <strong>{order.paymentReference}</strong></span>
            </p>
          )}

          {order.shippingAddress && (
            <div className="pt-1.5 border-t border-slate-200/80 dark:border-white/10 flex items-start gap-1.5 text-slate-600 dark:text-slate-300 leading-snug">
              <MapPin size={14} className="text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {order.shippingAddress.fullName} · {order.shippingAddress.phone}
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                  {[
                    order.shippingAddress.streetAddress,
                    order.shippingAddress.barangay,
                    order.shippingAddress.city,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </div>
            </div>
          )}
        </div>
      </Paper>

      {/* Financial Summary Panel */}
      <Paper
        withBorder
        radius="md"
        className="border-slate-200/80 bg-slate-50/70 p-3.5 space-y-1.5 dark:border-white/10 dark:bg-white/[0.02] text-xs"
      >
        <div className="border-b border-slate-200 dark:border-white/10 pb-1.5">
          <Text fw={700} size="xs" className="uppercase tracking-wider text-slate-500 dark:text-slate-400 text-[10px]">
            Financial Breakdown
          </Text>
        </div>

        {typeof order.subtotal === 'number' && (
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Subtotal</span>
            <span className="font-mono">{formatCurrency(order.subtotal)}</span>
          </div>
        )}

        {typeof order.shippingFee === 'number' && order.shippingFee > 0 && (
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Shipping Fee</span>
            <span className="font-mono">{formatCurrency(order.shippingFee)}</span>
          </div>
        )}

        {typeof order.protectionFee === 'number' && order.protectionFee > 0 && (
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Crate Protection Fee</span>
            <span className="font-mono">{formatCurrency(order.protectionFee)}</span>
          </div>
        )}

        {typeof order.discountAmount === 'number' && order.discountAmount > 0 && (
          <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
            <span>Discount {order.voucherCode ? `(${order.voucherCode})` : ''}</span>
            <span className="font-mono">-{formatCurrency(order.discountAmount)}</span>
          </div>
        )}

        <Divider my={4} className="border-slate-200 dark:border-white/10" />

        <div className="flex justify-between font-bold text-slate-900 dark:text-slate-100">
          <span>Placed Total</span>
          <span className="font-mono text-sm">{formatCurrency(order.totalPrice)}</span>
        </div>

        {refundedTotal > 0 && (
          <div className="flex justify-between text-rose-600 dark:text-rose-400 font-medium">
            <span>Refunded</span>
            <span className="font-mono">-{formatCurrency(refundedTotal)}</span>
          </div>
        )}

        <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400 pt-0.5">
          <span>Net Collected</span>
          <span className="font-mono text-sm">{formatCurrency(netCollected)}</span>
        </div>
      </Paper>
    </div>
  );
}
