"use client";

import React, { useCallback } from 'react';
import { Cpu, Monitor, Package } from 'lucide-react';
import { Badge, Button, Group, Modal, Stack, Text } from '@mantine/core';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { groupOrderItems, type OrderItemGroup } from '@/lib/order-item-groups';
import { type RigVerificationStatus } from '@/lib/order-assembly';
import { resolveOrderItemImageUrl } from '@/lib/order-image-resolver';
import { getAllowedStaffPaymentStatuses } from '@/lib/order-workflow';
import type { Order, OrderItem, Part, PaymentStatus } from '@/lib/types';
import { cn, formatCurrency, getOptimizedStorageUrl } from '@/lib/utils';
import { OrderAssemblyVerification } from './order-assembly-verification';
import { OrderPaymentControl } from './order-payment-control';

export interface OrderItemsModalProps {
  order: Order | null;
  catalogParts?: Part[] | null;
  archived?: boolean;
  onClose: () => void;
  onRequestPaymentStatus?: (order: Order, nextStatus: PaymentStatus) => void;
  onAssemblyVerificationChange?: (orderId: string, passed: boolean) => void;
}

function getItemCategory(item: OrderItem): string {
  if ('category' in item && typeof item.category === 'string' && item.category.trim()) {
    return item.category;
  }
  return 'Item';
}

function OrderItemsGroupSection({
  order,
  group,
  groupIdx,
  catalogParts,
  onAssemblyVerificationChange,
}: {
  order: Order;
  group: OrderItemGroup;
  groupIdx: number;
  catalogParts?: Part[] | null;
  onAssemblyVerificationChange?: (orderId: string, passed: boolean) => void;
}) {
  const isCustomBuild =
    group.name === 'My Build' ||
    group.type === 'custom-build' ||
    group.name.startsWith('My Build');
  const isAdditional = group.name === 'Additional' || group.type === 'additional';
  const isPrebuilt = !isCustomBuild && !isAdditional;

  const badgeColor = isCustomBuild ? 'cyan' : isPrebuilt ? 'grape' : 'amber';
  const badgeLabel = isCustomBuild
    ? 'Custom Build'
    : isPrebuilt
      ? 'Prebuilt System'
      : 'Additional Items';

  const handleStatusChange = useCallback(
    (status: RigVerificationStatus) => {
      onAssemblyVerificationChange?.(order.id, status === 'passed');
    },
    [onAssemblyVerificationChange, order.id]
  );

  return (
    <div
      data-testid="order-modal-item-group"
      className="w-full overflow-hidden border-b border-slate-200/80 dark:border-white/10 last:border-b-0"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50/80 dark:bg-white/[0.02] border-b border-slate-200/80 dark:border-white/10">
        <div className="flex items-center gap-2 min-w-0">
          {isCustomBuild ? (
            <Cpu className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
          ) : isPrebuilt ? (
            <Monitor className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
          ) : (
            <Package className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          )}

          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
            {group.name}
          </span>

          <Badge size="xs" variant="light" color={badgeColor} radius="sm">
            {badgeLabel}
          </Badge>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
            {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
          </span>
          <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
            {formatCurrency(group.totalPrice)}
          </span>
        </div>
      </div>

      {isCustomBuild ? (
        <OrderAssemblyVerification
          order={order}
          rigId={group.id || `rig_${groupIdx}`}
          rigName={group.name}
          items={group.items}
          isArchived={order.isArchived}
          catalogParts={catalogParts}
          onStatusChange={handleStatusChange}
        />
      ) : (
        <div className="divide-y divide-slate-200/70 dark:divide-white/5">
          {group.items.map((item, idx) => {
            const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
            const lineTotal = item.lineTotal ?? item.price * qty;
            const rawImg = resolveOrderItemImageUrl(item, order.items || [], catalogParts);
            const resolvedImg = getOptimizedStorageUrl(rawImg) || rawImg;

            return (
              <div
                key={`${order.id}-${group.name}-modal-item-${idx}`}
                className={cn(
                  'p-3 flex justify-between items-center text-sm gap-3',
                  'hover:bg-slate-100/60 dark:hover:bg-white/[0.02] transition-colors'
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative h-11 w-11 sm:h-12 sm:w-12 shrink-0 overflow-hidden bg-white dark:bg-[#0e131d]">
                    <OptimizedImage
                      src={resolvedImg}
                      alt={item.name}
                      fill
                      sizes="48px"
                      className="object-contain p-1"
                    />
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider">
                      {getItemCategory(item)}
                    </span>
                    <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 break-words">
                      {item.name}
                      {qty > 1 && (
                        <span className="ml-1.5 text-xs font-mono text-cyan-600 dark:text-cyan-400">
                          ×{qty}
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                <span className="font-mono font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 shrink-0">
                  {formatCurrency(lineTotal)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function OrderItemsModal({
  order,
  catalogParts,
  archived = false,
  onClose,
  onRequestPaymentStatus,
  onAssemblyVerificationChange,
}: OrderItemsModalProps) {
  if (!order) return null;

  const groups = groupOrderItems(order);
  const displayOrderId = order.orderNumber || `#${order.id.slice(0, 10).toUpperCase()}`;
  const customerName =
    order.shippingAddress?.fullName ||
    order.userEmail?.split('@')[0] ||
    'Customer';
  const totalItems = groups.reduce((acc, grp) => acc + grp.items.length, 0);
  const isCancelled = order.status === 'cancelled';
  const allowedPaymentStatuses = getAllowedStaffPaymentStatuses(order);
  const showPaymentControl =
    !archived &&
    !isCancelled &&
    allowedPaymentStatuses.length > 0 &&
    Boolean(onRequestPaymentStatus);

  return (
    <Modal
      opened={Boolean(order)}
      onClose={onClose}
      title={
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <Text fw={700} className="font-headline text-sm text-slate-900 dark:text-slate-100">
            {displayOrderId}
          </Text>
          <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {customerName}
          </span>
          <Badge size="xs" color="cyan" variant="light">
            {totalItems} {totalItems === 1 ? 'item' : 'items'}
          </Badge>
          <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
            {formatCurrency(order.totalPrice)}
          </span>
        </div>
      }
      centered
      size="lg"
      radius="lg"
      overlayProps={{ backgroundOpacity: 0.65, blur: 4 }}
      classNames={{
        content:
          'bg-white/95 dark:bg-[#141a23]/95 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100',
        header:
          'bg-white/95 dark:bg-[#141a23]/95 border-b border-slate-200 dark:border-white/10 p-3',
        body: '!p-3 max-h-[82dvh] overflow-y-auto',
      }}
    >
      <Stack gap="sm">
        {groups.length > 0 ? (
          groups.map((group, groupIdx) => (
            <OrderItemsGroupSection
              key={`${order.id}-modal-grp-${group.name}-${groupIdx}`}
              order={order}
              group={group}
              groupIdx={groupIdx}
              catalogParts={catalogParts}
              onAssemblyVerificationChange={onAssemblyVerificationChange}
            />
          ))
        ) : (
          <div className="rounded-lg border border-slate-200 dark:border-white/10 p-3 text-xs text-slate-500 dark:text-slate-400">
            No items recorded for this order.
          </div>
        )}

        <Group justify="space-between" align="center" wrap="wrap" pt={4}>
          <div>
            {showPaymentControl && onRequestPaymentStatus && (
              <OrderPaymentControl
                order={order}
                archived={archived}
                onRequest={onRequestPaymentStatus}
              />
            )}
          </div>
          <Button variant="default" onClick={onClose} className="min-h-11">
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
