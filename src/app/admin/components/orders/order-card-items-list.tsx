"use client";

import React, { useMemo, useState } from 'react';
import { ChevronDown, Cpu, Monitor, Package } from 'lucide-react';
import { Badge, Collapse, Text } from '@mantine/core';
import { OptimizedImage } from '@/components/ui/optimized-image';
import {
  getCustomRigSummary,
  groupOrderItems,
  type OrderItemGroup,
} from '@/lib/order-item-groups';
import { getOrderFulfillmentStage } from '@/lib/order-workflow';
import { resolveOrderItemImageUrl } from '@/lib/order-image-resolver';
import type { Order, OrderItem, Part } from '@/lib/types';
import { cn, formatCurrency, getOptimizedStorageUrl } from '@/lib/utils';
import { OrderAssemblyVerification } from './order-assembly-verification';

interface OrderCardItemsListProps {
  order: Order;
  catalogParts?: Part[] | null;
  onAssemblyVerificationChange?: (passed: boolean) => void;
}

interface OrderItemGroupAccordionProps {
  order: Order;
  orderId: string;
  orderItems: OrderItem[];
  group: OrderItemGroup;
  groupIdx: number;
  catalogParts?: Part[] | null;
  onAssemblyVerificationChange?: (passed: boolean) => void;
}

function OrderItemGroupAccordion({
  order,
  orderId,
  orderItems,
  group,
  groupIdx,
  catalogParts,
  onAssemblyVerificationChange,
}: OrderItemGroupAccordionProps) {
  const isCustomBuild = group.name === 'My Build' || group.type === 'custom-build' || group.name.startsWith('My Build');
  const isAdditional = group.name === 'Additional' || group.type === 'additional';
  const isPrebuilt = !isCustomBuild && !isAdditional;

  const currentStage = getOrderFulfillmentStage(order);
  const isAssemblingStage = currentStage === 'assembling_testing';

  // In the assembling phase, retain the custom rig component picking accordion open.
  // In other phases (delivered, out_for_delivery, order_placed), start collapsed to keep the card compact.
  const [isOpen, setIsOpen] = useState(isAssemblingStage && isCustomBuild);

  const badgeColor = isCustomBuild ? 'cyan' : isPrebuilt ? 'grape' : 'amber';
  const badgeLabel = isCustomBuild
    ? 'Custom Build'
    : isPrebuilt
      ? 'Prebuilt System'
      : 'Additional Items';

  const itemsPreview = useMemo(() => {
    if (isCustomBuild) {
      return getCustomRigSummary(group.items);
    }
    const names = group.items.map((it) => it.name).filter(Boolean);
    if (names.length === 0) return group.name;
    if (names.length <= 2) return `${group.name}: ${names.join(', ')}`;
    return `${group.name}: ${names.slice(0, 2).join(', ')} +${names.length - 2} more`;
  }, [group.items, group.name, isCustomBuild]);

  const groupTitle = isOpen ? group.name : itemsPreview;

  return (
    <div
      data-testid="order-item-group"
      className={cn(
        'bg-slate-50/50 dark:bg-white/[0.01] transition-colors duration-200',
        groupIdx > 0 && 'border-t border-slate-200 dark:border-white/10'
      )}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "w-full flex items-center justify-between p-3 text-left transition-colors",
          isOpen
            ? "bg-slate-100/70 dark:bg-white/[0.03] border-b border-slate-200/80 dark:border-white/10"
            : "hover:bg-slate-100/50 dark:hover:bg-white/[0.02]"
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {isCustomBuild ? (
            <Cpu className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
          ) : isPrebuilt ? (
            <Monitor className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
          ) : (
            <Package className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          )}

          <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 truncate">
            {groupTitle}
          </span>

          <Badge size="xs" variant="light" color={badgeColor} radius="sm">
            {badgeLabel}
          </Badge>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
            {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
          </span>
          <span className="font-mono font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
            {formatCurrency(group.totalPrice)}
          </span>
          <ChevronDown
            size={16}
            className={cn(
              "text-slate-400 dark:text-slate-500 transition-transform duration-200 shrink-0",
              isOpen && "rotate-180 text-cyan-600 dark:text-cyan-400"
            )}
          />
        </div>
      </button>

      <Collapse in={isOpen}>
        <div className="border-t border-slate-200/80 dark:border-white/10">
          {isCustomBuild ? (
            <OrderAssemblyVerification
              order={order}
              rigId={group.id || `rig_${groupIdx}`}
              rigName={group.name}
              items={group.items}
              isArchived={order.isArchived}
              catalogParts={catalogParts}
              onStatusChange={(status) => {
                onAssemblyVerificationChange?.(status === 'passed');
              }}
            />
          ) : (
            <div className="divide-y divide-slate-200/70 dark:divide-white/5 bg-white/40 dark:bg-black/10">
              {group.items.map((item, idx) => {
                const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
                const lineTotal = item.lineTotal ?? item.price * qty;
                const rawImg = resolveOrderItemImageUrl(
                  item,
                  orderItems,
                  catalogParts
                );
                const resolvedImg = getOptimizedStorageUrl(rawImg) || rawImg;

                return (
                  <div
                    key={`${orderId}-${group.name}-item-${idx}`}
                    className="p-2.5 sm:p-3 px-3.5 sm:px-4 flex justify-between items-center text-sm hover:bg-slate-100/60 dark:hover:bg-white/[0.02] transition-colors gap-3"
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
                          {(item as any).category || 'Item'}
                        </span>
                        <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate max-w-[200px] sm:max-w-md lg:max-w-lg">
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
      </Collapse>
    </div>
  );
}

export function OrderCardItemsList({
  order,
  catalogParts,
  onAssemblyVerificationChange,
}: OrderCardItemsListProps) {
  const groups = groupOrderItems(order);

  if (groups.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 w-full">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-1.5">
        <Text fw={700} size="xs" className="uppercase tracking-wider text-slate-500 dark:text-slate-400 text-[10px]">
          Ordered Hardware & Components ({order.items?.length || 0})
        </Text>
      </div>

      <div
        data-testid="order-hardware-groups"
        className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50/50 dark:border-white/10 dark:bg-white/[0.01]"
      >
        {groups.map((group, groupIdx) => (
          <OrderItemGroupAccordion
            key={`${order.id}-grp-${group.name}-${groupIdx}`}
            order={order}
            orderId={order.id}
            orderItems={order.items || []}
            group={group}
            groupIdx={groupIdx}
            catalogParts={catalogParts}
            onAssemblyVerificationChange={onAssemblyVerificationChange}
          />
        ))}
      </div>
    </div>
  );
}
