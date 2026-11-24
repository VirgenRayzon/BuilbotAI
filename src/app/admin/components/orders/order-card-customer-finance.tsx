"use client";

import React, { useState } from 'react';
import { ChevronDown, Copy, Check, Hash, Info, MapPin, Store, Truck } from 'lucide-react';
import { ActionIcon, Divider, Paper, Popover, Text, Tooltip } from '@mantine/core';
import {
  getNetCollectedAmount,
  getRefundedAmount,
} from '@/lib/order-workflow';
import type { Order } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import {
  getShippingMethodLabel,
  isLegacyReservationRecord,
} from './order-status-config';

interface OrderCardCustomerFinanceProps {
  order: Order;
}

export function OrderCardCustomerFinance({ order }: OrderCardCustomerFinanceProps) {
  const isLegacy = isLegacyReservationRecord(order);
  const refundedTotal = getRefundedAmount(order);
  const netCollected = getNetCollectedAmount(order);
  const [copiedRef, setCopiedRef] = useState(false);
  const [popoverOpened, setPopoverOpened] = useState(false);

  const isPickup =
    order.shippingMethod === 'store_pickup' ||
    order.shippingAddress?.streetAddress?.toLowerCase().includes('pickup');

  const fullAddress = [
    order.shippingAddress?.streetAddress,
    order.shippingAddress?.barangay,
    order.shippingAddress?.city,
  ]
    .filter(Boolean)
    .join(', ');

  const handleCopyRef = async () => {
    if (!order.paymentReference) return;
    try {
      await navigator.clipboard.writeText(order.paymentReference);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    } catch {
      // ignore
    }
  };

  const hasSpecialFees =
    (order.shippingFee && order.shippingFee > 0) ||
    (order.protectionFee && order.protectionFee > 0) ||
    (order.discountAmount && order.discountAmount > 0) ||
    refundedTotal > 0;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-slate-200/80 bg-slate-50/70 px-3 py-2 text-xs dark:border-white/10 dark:bg-white/[0.02] text-slate-600 dark:text-slate-300">
      {/* Left: Shipping Method & Destination */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {isPickup ? (
          <Store className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
        ) : (
          <Truck className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
        )}

        <span className="font-semibold text-slate-900 dark:text-slate-100 shrink-0">
          {getShippingMethodLabel(order.shippingMethod, isLegacy)}
        </span>

        {fullAddress ? (
          <>
            <span className="text-slate-300 dark:text-slate-600 shrink-0">•</span>
            <Tooltip label={fullAddress} withArrow position="top" multiline w={320}>
              <span className="truncate max-w-[260px] sm:max-w-md text-slate-600 dark:text-slate-400">
                {fullAddress}
              </span>
            </Tooltip>
          </>
        ) : null}
      </div>

      {/* Right: Payment Ref + Finance Popover */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 justify-between sm:justify-end">
        {order.paymentReference && (
          <div className="flex items-center gap-1 rounded bg-slate-200/60 dark:bg-white/5 px-2 py-0.5 font-mono text-[11px] text-slate-600 dark:text-slate-300">
            <Hash className="h-3 w-3 text-slate-400 shrink-0" />
            <span className="font-medium truncate max-w-[150px] sm:max-w-[200px]">
              {order.paymentReference}
            </span>
            <Tooltip label={copiedRef ? 'Copied!' : 'Copy Payment Reference'} withArrow position="top">
              <ActionIcon
                size="xs"
                variant="subtle"
                color={copiedRef ? 'teal' : 'gray'}
                onClick={handleCopyRef}
                className="ml-0.5"
                aria-label="Copy payment reference"
              >
                {copiedRef ? <Check size={12} /> : <Copy size={12} />}
              </ActionIcon>
            </Tooltip>
          </div>
        )}

        {/* Financial Breakdown Popover */}
        <Popover
          opened={popoverOpened}
          onChange={setPopoverOpened}
          position="bottom-end"
          withArrow
          shadow="md"
          withinPortal
        >
          <Popover.Target>
            <button
              type="button"
              onClick={() => setPopoverOpened((o) => !o)}
              className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400 transition-colors select-none"
            >
              <Info className="h-3.5 w-3.5" />
              <span>Breakdown</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${popoverOpened ? 'rotate-180' : ''}`} />
            </button>
          </Popover.Target>
          <Popover.Dropdown className="w-64 p-3 border-slate-200 bg-white dark:border-white/10 dark:bg-[#111722] text-xs">
            <div className="space-y-1.5">
              <Text fw={700} size="xs" className="uppercase tracking-wider text-slate-500 dark:text-slate-400 text-[10px] pb-1 border-b border-slate-200 dark:border-white/10">
                Financial Breakdown
              </Text>

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
                  <span>Crate Protection</span>
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
                <span className="font-mono">{formatCurrency(order.totalPrice)}</span>
              </div>

              {refundedTotal > 0 && (
                <div className="flex justify-between text-rose-600 dark:text-rose-400 font-medium">
                  <span>Refunded</span>
                  <span className="font-mono">-{formatCurrency(refundedTotal)}</span>
                </div>
              )}

              <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400 pt-0.5">
                <span>Net Collected</span>
                <span className="font-mono">{formatCurrency(netCollected)}</span>
              </div>
            </div>
          </Popover.Dropdown>
        </Popover>
      </div>
    </div>
  );
}
