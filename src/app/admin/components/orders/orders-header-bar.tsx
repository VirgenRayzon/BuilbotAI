"use client";

import React from 'react';
import { Clock, Layers } from 'lucide-react';
import { Badge, Button, Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { AdminHeaderSlot } from '../admin-tab-header';
import type { useOrdersView } from '../../hooks/use-orders-view';
import { OrdersFilterPanel } from './orders-filter-panel';

interface OrdersHeaderBarProps {
  archived: boolean;
  view: ReturnType<typeof useOrdersView>;
  desktopFiltersOpened: boolean;
  onDesktopFiltersChange: (opened: boolean) => void;
  mobileFiltersOpened: boolean;
  onMobileFiltersChange: (opened: boolean) => void;
  isSweepingExpired: boolean;
  onSweepExpiredOrders?: () => Promise<number>;
}

export function OrdersHeaderBar({
  archived,
  view,
  desktopFiltersOpened,
  onDesktopFiltersChange,
  mobileFiltersOpened,
  onMobileFiltersChange,
  isSweepingExpired,
  onSweepExpiredOrders,
}: OrdersHeaderBarProps) {
  return (
    <>
      <AdminHeaderSlot
        countBadge={
          <Badge
            size="md"
            variant="light"
            color="cyan"
            radius="md"
            className="font-mono font-bold lowercase tracking-normal"
          >
            {view.filteredOrders.length} loaded orders
          </Badge>
        }
        actions={
          <div className="flex w-full flex-wrap min-w-0 items-center gap-1.5 sm:w-auto sm:gap-2">
            {!archived && onSweepExpiredOrders && (
              <Button
                variant={view.summary.expiredOnlineHolds > 0 ? 'light' : 'default'}
                color={view.summary.expiredOnlineHolds > 0 ? 'orange' : 'gray'}
                size="xs"
                radius="md"
                loading={isSweepingExpired}
                onClick={() => onSweepExpiredOrders()}
                leftSection={<Clock size={14} />}
                className="min-h-11 shrink-0 whitespace-nowrap"
              >
                <span className="hidden sm:inline">
                  Sweep Expired
                  {view.summary.expiredOnlineHolds > 0
                    ? ` (${view.summary.expiredOnlineHolds})`
                    : ''}
                </span>
                <span className="sm:hidden">Sweep</span>
              </Button>
            )}

            {view.summary.refundAttention > 0 && (
              <Button
                size="xs"
                radius="md"
                color="orange"
                variant={view.refundFilter === 'due' ? 'filled' : 'light'}
                onClick={() =>
                  view.setRefundFilter(view.refundFilter === 'due' ? 'all' : 'due')
                }
                className="min-h-11 shrink-0 whitespace-nowrap text-xs"
              >
                Refund Attention ({view.summary.refundAttention})
              </Button>
            )}

            <OrdersFilterPanel
              desktopOpened={desktopFiltersOpened}
              onDesktopChange={onDesktopFiltersChange}
              mobileOpened={mobileFiltersOpened}
              onMobileChange={onMobileFiltersChange}
              stageFilter={view.stageFilter}
              onStageFilterChange={view.setStageFilter}
              paymentStatusFilter={view.paymentStatusFilter}
              onPaymentStatusFilterChange={view.setPaymentStatusFilter}
              paymentMethodFilter={view.paymentMethodFilter}
              onPaymentMethodFilterChange={view.setPaymentMethodFilter}
              refundFilter={view.refundFilter}
              onRefundFilterChange={view.setRefundFilter}
              sortBy={view.sortBy}
              onSortByChange={view.setSortBy}
              activeFilterCount={view.activeFilterCount}
              filteredCount={view.filteredOrders.length}
              summary={view.summary}
              onReset={view.resetFilters}
            />

          </div>
        }
      />
    </>
  );
}

export function OrdersEmptyState({
  archived,
  hasFilters,
  onReset,
}: {
  archived: boolean;
  hasFilters: boolean;
  onReset: () => void;
}) {
  return (
    <Paper
      withBorder
      radius="lg"
      p={{ base: 'md', sm: 'lg' }}
      className="border-dashed border-slate-300 bg-white/85 py-14 text-center dark:border-white/10 dark:bg-[#111722]"
    >
      <Stack align="center" gap="md" className="mx-auto max-w-md">
        <ThemeIcon size={52} radius="xl" color="gray" variant="light">
          <Layers className="h-6 w-6 text-slate-400" />
        </ThemeIcon>
        <div className="space-y-1">
          <Title order={3} className="text-lg font-headline font-bold text-slate-900 dark:text-slate-100">
            {archived ? 'No Archived Orders' : 'No Orders Found'}
          </Title>
          <Text size="xs" className="text-slate-600 dark:text-slate-400">
            {hasFilters
              ? 'No orders match your current filters. Reset filters or try another search term.'
              : archived
                ? 'Archived orders will appear here.'
                : 'No customer orders have been placed yet.'}
          </Text>
        </div>
        {hasFilters && (
          <Button
            size="sm"
            color="cyan"
            variant="light"
            radius="md"
            onClick={onReset}
            className="min-h-11"
          >
            Reset Filters
          </Button>
        )}
      </Stack>
    </Paper>
  );
}

