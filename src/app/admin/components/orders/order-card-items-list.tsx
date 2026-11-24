"use client";

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { groupOrderItems } from '@/lib/order-item-groups';
import { getOrderFulfillmentStage } from '@/lib/order-workflow';
import type { Order } from '@/lib/types';
import { cn } from '@/lib/utils';

interface OrderCardItemsListProps {
  order: Order;
  isAssemblyVerified?: boolean;
}

export function OrderCardItemsList({
  order,
  isAssemblyVerified,
}: OrderCardItemsListProps) {
  const groups = groupOrderItems(order);

  if (groups.length === 0) {
    return null;
  }

  const totalItems = groups.reduce((acc, group) => acc + group.items.length, 0);
  const hasCustomBuild = groups.some(
    (group) =>
      group.name === 'My Build' ||
      group.type === 'custom-build' ||
      group.name.startsWith('My Build')
  );
  const currentStage = getOrderFulfillmentStage(order);
  const isAssemblingCustomBuild = hasCustomBuild && currentStage === 'assembling_testing';
  const assemblyPassed = Boolean(isAssemblyVerified ?? order.assemblyVerificationPassed);

  const label = isAssemblingCustomBuild
    ? assemblyPassed
      ? 'View items · Assembly verified'
      : 'View items · Verify assembly'
    : 'View items';

  return (
    <div
      data-testid="order-hardware-groups"
      className="w-full flex items-center justify-between gap-2 pt-2 border-t border-slate-200/80 dark:border-white/10 text-xs"
    >
      <span
        data-testid="order-item-group"
        className={cn(
          'truncate font-medium transition-colors',
          isAssemblingCustomBuild && !assemblyPassed
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-slate-600 dark:text-slate-300 group-hover/card:text-cyan-600 dark:group-hover/card:text-cyan-400'
        )}
      >
        {label}
      </span>

      <span className="flex items-center gap-1 shrink-0 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
        {totalItems} {totalItems === 1 ? 'item' : 'items'}
        <ChevronRight
          size={14}
          className="text-slate-400 dark:text-slate-500 group-hover/card:text-cyan-600 dark:group-hover/card:text-cyan-400 group-hover/card:translate-x-0.5 transition-all shrink-0"
        />
      </span>
    </div>
  );
}
