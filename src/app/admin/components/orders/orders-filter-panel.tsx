"use client";

import React from 'react';
import { Filter } from 'lucide-react';
import {
  Badge,
  Button,
  Divider,
  Drawer,
  Group,
  Popover,
  Radio,
  Stack,
  Text,
} from '@mantine/core';
import type {
  OrderRefundFilter,
  OrderSortOption,
  OrderUnifiedFilterStage,
} from './order-status-config';

interface OrdersFilterPanelProps {
  desktopOpened: boolean;
  onDesktopChange: (opened: boolean) => void;
  mobileOpened: boolean;
  onMobileChange: (opened: boolean) => void;
  stageFilter: OrderUnifiedFilterStage;
  onStageFilterChange: (value: OrderUnifiedFilterStage) => void;
  paymentStatusFilter: string;
  onPaymentStatusFilterChange: (value: string) => void;
  paymentMethodFilter: string;
  onPaymentMethodFilterChange: (value: string) => void;
  refundFilter: OrderRefundFilter;
  onRefundFilterChange: (value: OrderRefundFilter) => void;
  sortBy: OrderSortOption;
  onSortByChange: (value: OrderSortOption) => void;
  activeFilterCount: number;
  filteredCount: number;
  summary: {
    total: number;
    orderPlaced: number;
    assemblingTesting: number;
    outForDelivery: number;
    delivered: number;
    cancelled: number;
  };
  onReset: () => void;
}

const RADIO_ROOT_CLASS = 'flex min-h-11 items-center sm:min-h-8';

export function OrdersFilterPanel({
  desktopOpened,
  onDesktopChange,
  mobileOpened,
  onMobileChange,
  stageFilter,
  onStageFilterChange,
  paymentStatusFilter,
  onPaymentStatusFilterChange,
  paymentMethodFilter,
  onPaymentMethodFilterChange,
  refundFilter,
  onRefundFilterChange,
  sortBy,
  onSortByChange,
  activeFilterCount,
  filteredCount,
  summary,
  onReset,
}: OrdersFilterPanelProps) {
  const renderTriggerButton = (mobile: boolean) => (
    <Button
      size="sm"
      variant={activeFilterCount ? 'light' : 'default'}
      color={activeFilterCount ? 'cyan' : undefined}
      radius="md"
      leftSection={<Filter size={15} />}
      rightSection={
        activeFilterCount ? (
          <Badge color="cyan" circle size="xs">
            {activeFilterCount}
          </Badge>
        ) : undefined
      }
      className="min-h-11 whitespace-nowrap"
      onClick={mobile ? () => onMobileChange(true) : undefined}
      aria-expanded={mobile ? mobileOpened : desktopOpened}
      aria-label={`Filters and sort${activeFilterCount ? `, ${activeFilterCount} active` : ''}`}
    >
      Filters & sort
    </Button>
  );

  const renderContent = (close: () => void, maxHeight: string) => (
    <div className="flex flex-col" style={{ maxHeight }}>
      <Stack gap="sm" className="min-h-0 overflow-y-auto p-3">
        <div>
          <Text fw={700} size="sm" mb="xs">
            Fulfillment Stage
          </Text>
          <Radio.Group
            value={stageFilter}
            onChange={(val) => onStageFilterChange(val as OrderUnifiedFilterStage)}
          >
            <Stack gap={0}>
              <Radio
                value="all"
                label={`All Orders (${summary.total})`}
                color="cyan"
                classNames={{ root: RADIO_ROOT_CLASS }}
              />
              <Radio
                value="order_placed"
                label={`Order Placed (${summary.orderPlaced})`}
                color="cyan"
                classNames={{ root: RADIO_ROOT_CLASS }}
              />
              <Radio
                value="assembling_testing"
                label={`Assembling & Testing (${summary.assemblingTesting})`}
                color="cyan"
                classNames={{ root: RADIO_ROOT_CLASS }}
              />
              <Radio
                value="out_for_delivery"
                label={`Out for Delivery / Pickup (${summary.outForDelivery})`}
                color="cyan"
                classNames={{ root: RADIO_ROOT_CLASS }}
              />
              <Radio
                value="delivered"
                label={`Delivered (${summary.delivered})`}
                color="cyan"
                classNames={{ root: RADIO_ROOT_CLASS }}
              />
              <Radio
                value="cancelled"
                label={`Cancelled (${summary.cancelled})`}
                color="cyan"
                classNames={{ root: RADIO_ROOT_CLASS }}
              />
            </Stack>
          </Radio.Group>
        </div>

        <Divider />

        <div>
          <Text fw={700} size="sm" mb="xs">
            Payment Status
          </Text>
          <Radio.Group value={paymentStatusFilter} onChange={onPaymentStatusFilterChange}>
            <Stack gap={0}>
              <Radio value="all" label="All Payment Statuses" color="cyan" classNames={{ root: RADIO_ROOT_CLASS }} />
              <Radio value="paid" label="Paid (Online / COD Collected)" color="cyan" classNames={{ root: RADIO_ROOT_CLASS }} />
              <Radio value="unpaid" label="Unpaid (COD / Legacy)" color="cyan" classNames={{ root: RADIO_ROOT_CLASS }} />
              <Radio value="pending" label="Payment Pending" color="cyan" classNames={{ root: RADIO_ROOT_CLASS }} />
              <Radio value="failed" label="Payment Failed" color="cyan" classNames={{ root: RADIO_ROOT_CLASS }} />
              <Radio value="cancelled" label="Payment Voided" color="cyan" classNames={{ root: RADIO_ROOT_CLASS }} />
            </Stack>
          </Radio.Group>
        </div>

        <Divider />

        <div>
          <Text fw={700} size="sm" mb="xs">
            Payment Method
          </Text>
          <Radio.Group value={paymentMethodFilter} onChange={onPaymentMethodFilterChange}>
            <Stack gap={0}>
              <Radio value="all" label="All Payment Methods" color="cyan" classNames={{ root: RADIO_ROOT_CLASS }} />
              <Radio value="cod" label="Cash on Delivery (COD / Legacy)" color="cyan" classNames={{ root: RADIO_ROOT_CLASS }} />
              <Radio value="gcash_simulated" label="GCash E-Wallet" color="cyan" classNames={{ root: RADIO_ROOT_CLASS }} />
              <Radio value="paymongo_simulated" label="PayMongo Gateway" color="cyan" classNames={{ root: RADIO_ROOT_CLASS }} />
              <Radio value="card_simulated" label="Credit / Debit Card" color="cyan" classNames={{ root: RADIO_ROOT_CLASS }} />
            </Stack>
          </Radio.Group>
        </div>

        <Divider />

        <div>
          <Text fw={700} size="sm" mb="xs">
            Refund Status
          </Text>
          <Radio.Group
            value={refundFilter}
            onChange={(val) => onRefundFilterChange(val as OrderRefundFilter)}
          >
            <Stack gap={0}>
              <Radio value="all" label="All Refund States" color="cyan" classNames={{ root: RADIO_ROOT_CLASS }} />
              <Radio value="due" label="Refund Due (Cancelled Paid Order)" color="cyan" classNames={{ root: RADIO_ROOT_CLASS }} />
              <Radio value="pending" label="Refund Pending Reconciliation" color="cyan" classNames={{ root: RADIO_ROOT_CLASS }} />
              <Radio value="partial" label="Partially Refunded" color="cyan" classNames={{ root: RADIO_ROOT_CLASS }} />
              <Radio value="refunded" label="Fully Refunded" color="cyan" classNames={{ root: RADIO_ROOT_CLASS }} />
            </Stack>
          </Radio.Group>
        </div>

        <Divider />

        <div>
          <Text fw={700} size="sm" mb="xs">
            Sort By
          </Text>
          <Radio.Group
            value={sortBy}
            onChange={(val) => onSortByChange(val as OrderSortOption)}
          >
            <Stack gap={0}>
              <Radio value="newest" label="Newest first" color="cyan" classNames={{ root: RADIO_ROOT_CLASS }} />
              <Radio value="oldest" label="Oldest first" color="cyan" classNames={{ root: RADIO_ROOT_CLASS }} />
              <Radio value="price-high" label="Total: high to low" color="cyan" classNames={{ root: RADIO_ROOT_CLASS }} />
              <Radio value="price-low" label="Total: low to high" color="cyan" classNames={{ root: RADIO_ROOT_CLASS }} />
            </Stack>
          </Radio.Group>
        </div>
      </Stack>

      <Group
        grow
        className="border-t border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-[#111722]"
      >
        <Button variant="default" radius="md" className="min-h-11" onClick={onReset}>
          Reset all
        </Button>
        <Button color="cyan" radius="md" className="min-h-11" onClick={close}>
          Show {filteredCount} orders
        </Button>
      </Group>
    </div>
  );

  return (
    <>
      <div className="hidden sm:block">
        <Popover
          opened={desktopOpened}
          onChange={onDesktopChange}
          width={360}
          position="bottom-end"
          shadow="lg"
          withinPortal
        >
          <Popover.Target>
            <div onClick={() => onDesktopChange(!desktopOpened)}>
              {renderTriggerButton(false)}
            </div>
          </Popover.Target>
          <Popover.Dropdown
            p={0}
            className="border-slate-200 bg-white shadow-lg dark:border-white/10 dark:bg-[#111722]"
          >
            {renderContent(() => onDesktopChange(false), 'min(78vh, 760px)')}
          </Popover.Dropdown>
        </Popover>
      </div>

      <div className="sm:hidden">{renderTriggerButton(true)}</div>

      <Drawer
        opened={mobileOpened}
        onClose={() => onMobileChange(false)}
        title="Filters & sort"
        position="bottom"
        size="85dvh"
        radius="lg"
        hiddenFrom="sm"
        classNames={{
          content: 'bg-white text-slate-900 dark:bg-[#111722] dark:text-slate-100',
          header: 'border-b border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-[#111722]',
          body: '!p-0',
        }}
      >
        {renderContent(() => onMobileChange(false), 'calc(85dvh - 64px)')}
      </Drawer>
    </>
  );
}

