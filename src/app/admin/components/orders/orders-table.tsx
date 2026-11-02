"use client";

import type { ReconcileRefund } from '@/lib/order-payment';
import { OrderPaymentControl } from './order-payment-control';
import { OrderStageControl } from './order-stage-control';
import React from 'react';
import {
  Archive,
  Calendar,
  FileText,
  Hash,
  Info,
  Layers,
  Monitor,
  Package,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import {
  ActionIcon,
  Avatar,
  Badge,
  Group,
  Paper,
  Table,
  Text,
  ThemeIcon,
  Tooltip,
  VisuallyHidden,
} from '@mantine/core';
import { CompactInfo } from '@/components/ui/compact-info';
import { OrderExpirationBadge } from '@/components/order-expiration-timer';
import { isOrderPendingWithNoProgression } from '@/lib/order-expiration';
import {
  getRefundedAmount,
} from '@/lib/order-workflow';
import { getPaymentMethodLabel, getPaymentStatusInfo } from '@/lib/payment-methods';
import type { Order, OrderFulfillmentStage, PaymentStatus } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import type { OrderAdminActionType } from './order-action-modals';
import { CopyableOrderId } from './copyable-order-id';
import {
  formatFirestoreTimestamp,
  getOrderStageBadgeInfo,
  getPaymentMethodIcon,
  getRefundBadgeInfo,
  getStockBadgeInfo,
  isLegacyReservationRecord,
} from './order-status-config';

interface OrdersTableProps {
  orders: Order[];
  archived: boolean;
  isSuperAdmin: boolean;
  globalShowSpecs?: boolean;
  reconcilingId: string | null;
  onOpenDetails: (order: Order) => void;
  onRequestAdminAction: (order: Order, action: OrderAdminActionType) => void;
  onRequestCancel: (order: Order) => void;
  onRequestPaymentStatus: (order: Order, nextStatus: PaymentStatus) => void;
  onRequestRefund: (order: Order) => void;
  onReconcileRefund?: ReconcileRefund;
  onUpdateFulfillmentStage?: (orderId: string, stage: OrderFulfillmentStage) => void;
  onConfirmStockReturn?: (order: Order) => void;
}

export function OrdersTable({
  orders,
  archived,
  isSuperAdmin,
  reconcilingId,
  onOpenDetails,
  onRequestAdminAction,
  onRequestCancel,
  onRequestPaymentStatus,
  onRequestRefund,
  onReconcileRefund,
  onUpdateFulfillmentStage,
  onConfirmStockReturn,
}: OrdersTableProps) {
  return (
    <Paper
      withBorder
      radius="md"
      className="overflow-hidden bg-white/80 shadow-sm dark:bg-[#141a23]/80 border-slate-200 dark:border-white/10"
    >
      {/* Table Header Bar matching Activity log style */}
      <Group justify="space-between" className="border-b border-slate-200 px-4 py-3 dark:border-white/10">
        <Group gap={6} align="center" wrap="nowrap">
          <Text fw={700} size="sm" className="text-slate-900 dark:text-slate-100">
            {archived ? 'Archived Orders' : 'Customer Orders'}
          </Text>
          <CompactInfo
            label="About customer orders"
            message="Manage fulfillment status, customer order items, payment records, and refunds."
          />
        </Group>
        <Badge variant="light" color="cyan" size="sm" radius="sm">
          {orders.length} {orders.length === 1 ? 'order' : 'orders'}
        </Badge>
      </Group>

      <Table.ScrollContainer minWidth={920}>
        <Table verticalSpacing="sm" highlightOnHover className="bg-transparent">
          <Table.Thead className="bg-slate-50/80 dark:bg-white/[0.025] border-b border-slate-200 dark:border-white/10">
            <Table.Tr>
              <Table.Th className="text-slate-900 dark:text-slate-100 font-bold text-xs uppercase tracking-wider py-3">
                Customer / Order
              </Table.Th>
              <Table.Th className="text-slate-900 dark:text-slate-100 font-bold text-xs uppercase tracking-wider py-3">
                Stage & Status
              </Table.Th>
              <Table.Th className="text-slate-900 dark:text-slate-100 font-bold text-xs uppercase tracking-wider py-3">
                Items & Specs
              </Table.Th>
              <Table.Th className="text-slate-900 dark:text-slate-100 font-bold text-xs uppercase tracking-wider py-3">
                Payment & Total
              </Table.Th>
              <Table.Th className="text-slate-900 dark:text-slate-100 font-bold text-xs uppercase tracking-wider py-3">
                Placed Date
              </Table.Th>
              <Table.Th className="py-3 text-right">
                <VisuallyHidden>Actions</VisuallyHidden>
              </Table.Th>
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {orders.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={6} className="h-32 text-center text-slate-600 dark:text-slate-400 font-medium">
                  No orders found.
                </Table.Td>
              </Table.Tr>
            ) : (
              orders.map((order) => {
                const isPrebuilt = order.type === 'prebuilt' || Boolean(order.prebuiltName);
                const isCancelled = order.status === 'cancelled';
                const isLegacy = isLegacyReservationRecord(order);
                const stageInfo = getOrderStageBadgeInfo(order);

                const effectiveMethod = order.paymentMethod ?? 'cod';
                const paymentStatusInfo = getPaymentStatusInfo(order.paymentStatus, order.paymentMethod);
                const paymentMethodLabel = getPaymentMethodLabel(order.paymentMethod, true);
                const PaymentIcon = getPaymentMethodIcon(effectiveMethod);
                const refundBadge = getRefundBadgeInfo(order);
                const stockBadge = getStockBadgeInfo(order);
                const displayOrderId = order.orderNumber || `#${order.id.slice(0, 10).toUpperCase()}`;

                const customerName =
                  order.shippingAddress?.fullName ||
                  order.userEmail?.split('@')[0] ||
                  'Customer';
                const customerInitials =
                  customerName
                    .split(' ')
                    .map((p) => p[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2) || 'CU';

                const refundedAmount = getRefundedAmount(order);

                return (
                  <Table.Tr
                    key={order.id}
                    className="transition-colors hover:bg-cyan-50/60 dark:hover:bg-cyan-500/[0.035] [&>td]:border-slate-100 dark:[&>td]:border-white/[0.06]"
                  >
                    {/* Customer / Order Identifiers with Avatar */}
                    <Table.Td>
                      <Group gap="sm" wrap="nowrap">
                        <Avatar
                          size={34}
                          radius={34}
                          color={isPrebuilt ? 'cyan' : stageInfo.color}
                          variant="light"
                          className="border border-slate-200 dark:border-white/10 shrink-0 font-bold text-xs"
                        >
                          {customerInitials}
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <Tooltip label={order.userEmail} withArrow position="top">
                            <Text
                              fz="sm"
                              fw={600}
                              className="text-slate-900 dark:text-slate-100 truncate max-w-[160px] sm:max-w-[200px]"
                            >
                              {customerName}
                            </Text>
                          </Tooltip>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <CopyableOrderId orderId={order.orderNumber || order.id} displayId={displayOrderId} />
                            {isLegacy && (
                              <Badge variant="outline" color="gray" size="xs" radius="sm">
                                Legacy
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Group>
                    </Table.Td>

                    {/* Stage & Status (Interactive Fulfillment Stage Select or Cancelled Badge) */}
                    <Table.Td>
                      <div className="flex flex-col gap-1 min-w-[140px] max-w-[170px]">
                        {isCancelled ? (
                          <Badge
                            color="red"
                            variant="light"
                            size="sm"
                            className="font-bold uppercase tracking-wider text-[10px]"
                          >
                            Cancelled
                          </Badge>
                        ) : (
                          <OrderStageControl order={order} archived={archived} onRequest={onUpdateFulfillmentStage} />
                        )}
                        <div className="flex flex-wrap items-center gap-1 mt-0.5">
                          {isOrderPendingWithNoProgression(order) && (
                            <OrderExpirationBadge
                              orderId={order.id}
                              createdAt={order.createdAt}
                              isPendingNoProgression={true}
                              size="xs"
                            />
                          )}
                          <Badge
                            variant="light"
                            color={isPrebuilt ? 'cyan' : 'blue'}
                            size="xs"
                            radius="sm"
                            className="font-semibold text-[10px]"
                          >
                            {isPrebuilt ? 'Prebuilt' : 'Custom Build'}
                          </Badge>
                          {stockBadge.restored && (
                            <Badge variant="light" color="gray" size="xs" radius="sm">
                              {stockBadge.label}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Table.Td>

                    {/* Items & Specs */}
                    <Table.Td>
                      <div className="flex flex-col gap-0.5 max-w-[260px]">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {isPrebuilt ? (
                            <ThemeIcon size={18} radius="sm" color="cyan" variant="light">
                              <Monitor size={11} />
                            </ThemeIcon>
                          ) : (
                            <ThemeIcon size={18} radius="sm" color="blue" variant="light">
                              <Layers size={11} />
                            </ThemeIcon>
                          )}
                          <span className="truncate">
                            {order.prebuiltName || (order.type === 'prebuilt' ? 'Prebuilt PC' : 'Custom PC Build')}
                          </span>
                        </div>
                        <Text fz="xs" className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                          {order.items?.length || 0} {order.items?.length === 1 ? 'component' : 'components'}
                        </Text>
                      </div>
                    </Table.Td>

                    {/* Payment & Total */}
                    <Table.Td>
                      <div className="flex flex-col gap-1 min-w-[150px]">
                        <Text fw={700} fz="sm" className="font-mono text-slate-900 dark:text-slate-100">
                          {formatCurrency(order.totalPrice)}
                        </Text>
                        <div className="flex flex-wrap items-center gap-1">
                          <Badge
                            variant="outline"
                            color={effectiveMethod === 'gcash_simulated' ? 'blue' : 'teal'}
                            size="xs"
                            radius="sm"
                            leftSection={<PaymentIcon size={9} />}
                          >
                            {paymentMethodLabel}
                          </Badge>
                          {refundBadge && (
                            <Badge variant="light" color={refundBadge.color} size="xs" radius="sm">
                              {refundBadge.label}
                            </Badge>
                          )}
                        </div>
                        <OrderPaymentControl order={order} archived={archived} onRequest={onRequestPaymentStatus} />
                        {refundedAmount > 0 && (
                          <Text fz="xs" className="font-mono text-[10px] text-rose-600 dark:text-rose-400">
                            Ref: {formatCurrency(refundedAmount)}
                          </Text>
                        )}
                      </div>
                    </Table.Td>

                    {/* Placed Date */}
                    <Table.Td>
                      <Text fz="xs" className="text-slate-600 dark:text-slate-400 font-mono whitespace-nowrap">
                        {formatFirestoreTimestamp(order.createdAt, true)}
                      </Text>
                    </Table.Td>

                    {/* Row Actions */}
                    <Table.Td>
                      <Group gap={4} justify="flex-end" wrap="nowrap">
                        {isCancelled && order.stockState === 'pending_return' && onConfirmStockReturn && (
                          <Tooltip label="Confirm Physical Stock Return" withArrow position="top">
                            <ActionIcon
                              size={32}
                              variant="light"
                              color="teal"
                              radius="md"
                              onClick={() => onConfirmStockReturn(order)}
                              aria-label="Confirm Physical Stock Return"
                            >
                              <RotateCcw size={16} />
                            </ActionIcon>
                          </Tooltip>
                        )}

                        <Tooltip label="View Details & History" withArrow position="top">
                          <ActionIcon
                            size={32}
                            variant="subtle"
                            color="cyan"
                            radius="md"
                            onClick={() => onOpenDetails(order)}
                            aria-label="View order details"
                          >
                            <FileText size={16} />
                          </ActionIcon>
                        </Tooltip>

                        <Tooltip label={archived ? 'Restore order' : 'Archive order'} withArrow position="top">
                          <ActionIcon
                            size={32}
                            variant="subtle"
                            color="cyan"
                            radius="md"
                            onClick={() => onRequestAdminAction(order, archived ? 'restore' : 'archive')}
                            aria-label={archived ? 'Restore order' : 'Archive order'}
                          >
                            {archived ? <RotateCcw size={16} /> : <Archive size={16} />}
                          </ActionIcon>
                        </Tooltip>

                        {isSuperAdmin && (
                          <Tooltip label="Delete order" withArrow position="top">
                            <ActionIcon
                              size={32}
                              variant="subtle"
                              color="red"
                              radius="md"
                              onClick={() => onRequestAdminAction(order, 'delete')}
                              aria-label="Delete order"
                            >
                              <Trash2 size={16} />
                            </ActionIcon>
                          </Tooltip>
                        )}
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })
            )}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Paper>
  );
}
