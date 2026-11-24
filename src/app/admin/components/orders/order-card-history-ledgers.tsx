"use client";

import React, { useState } from 'react';
import { ChevronDown, History } from 'lucide-react';
import { Button } from '@mantine/core';
import type { ReconcileRefund } from '@/lib/order-payment';
import type { Order } from '@/lib/types';
import { cn } from '@/lib/utils';
import { OrderActivityTimeline } from './order-activity-timeline';
import { RefundReconcileControl } from './refund-reconcile-control';

interface OrderCardHistoryLedgersProps {
  order: Order;
  archived?: boolean;
  reconciling?: boolean;
  onOpenRefund?: (order: Order) => void;
  onReconcileRefund?: ReconcileRefund;
}

export function OrderCardHistoryLedgers({
  order,
  archived = false,
  reconciling = false,
  onReconcileRefund,
}: OrderCardHistoryLedgersProps) {
  const [opened, setOpened] = useState(false);

  return (
    <div className="space-y-2 w-full">
      <Button
        variant="subtle"
        color="gray"
        size="xs"
        radius="md"
        fullWidth
        onClick={() => setOpened((prev) => !prev)}
        leftSection={<History size={14} className="text-slate-400" />}
        rightSection={
          <ChevronDown
            size={14}
            className={cn('transition-transform duration-200', opened && 'rotate-180')}
          />
        }
        className="min-h-11 text-xs font-semibold text-slate-600 dark:text-slate-300"
      >
        {opened ? 'Hide Order Activity' : 'View Order Activity'}
      </Button>

      {opened && (
        <div className="space-y-3 pt-1">
          {!archived && order.pendingRefundOperationId && onReconcileRefund && (
            <div className="p-2.5 rounded-lg bg-orange-500/10 border border-orange-500/30">
              <RefundReconcileControl
                order={order}
                reconciling={reconciling}
                reconcile={onReconcileRefund}
              />
            </div>
          )}
          <OrderActivityTimeline order={order} embedded />
        </div>
      )}
    </div>
  );
}
