"use client";

import React from 'react';
import { AlertCircle, Archive, RotateCcw, Trash2, XCircle } from 'lucide-react';
import { Button, Group, Modal, Stack, Text, Textarea, ThemeIcon } from '@mantine/core';
import { getOrderFulfillmentStageLabel } from '@/lib/order-workflow';
import { getPaymentMethodLabel, getPaymentStatusInfo } from '@/lib/payment-methods';
import type { Order } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

export type OrderAdminActionType = 'archive' | 'restore' | 'delete';

interface OrderArchiveDeleteModalProps {
  pendingAction: { order: Order; action: OrderAdminActionType } | null;
  saving: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function OrderArchiveDeleteModal({
  pendingAction,
  saving,
  onClose,
  onConfirm,
}: OrderArchiveDeleteModalProps) {
  const action = pendingAction?.action;
  const order = pendingAction?.order;

  const titleLabel =
    action === 'delete'
      ? 'Delete Order Permanently'
      : action === 'restore'
        ? 'Restore Order'
        : 'Archive Order';

  return (
    <Modal
      opened={Boolean(pendingAction)}
      onClose={onClose}
      title={
        <Group gap="xs">
          <ThemeIcon
            size="md"
            color={action === 'delete' ? 'red' : 'cyan'}
            variant="light"
            radius="md"
          >
            {action === 'delete' ? (
              <Trash2 size={16} />
            ) : action === 'restore' ? (
              <RotateCcw size={16} />
            ) : (
              <Archive size={16} />
            )}
          </ThemeIcon>
          <Text fw={700} className="font-headline text-sm text-slate-900 dark:text-slate-100">
            {titleLabel}
          </Text>
        </Group>
      }
      centered
      radius="lg"
      classNames={{
        content:
          'bg-white/95 dark:bg-[#141a23]/95 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100',
        header:
          'bg-white/95 dark:bg-[#141a23]/95 border-b border-slate-200 dark:border-white/10 p-3',
        body: '!p-3',
      }}
    >
      <Stack gap="md">
        <Text size="sm" className="text-slate-600 dark:text-slate-300">
          {action === 'delete'
            ? 'Permanently delete'
            : action === 'restore'
              ? 'Restore'
              : 'Archive'}{' '}
          the order for{' '}
          <strong className="text-slate-900 dark:text-slate-100">{order?.userEmail}</strong>?
        </Text>

        {order && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs space-y-1 dark:border-white/10 dark:bg-[#111722]">
            <p>
              <span className="text-slate-500">Order ID:</span>{' '}
              <strong className="font-mono text-slate-900 dark:text-slate-100">
                {order.orderNumber || `#${order.id.slice(0, 10).toUpperCase()}`}
              </strong>
            </p>
            <p>
              <span className="text-slate-500">Placed Value:</span>{' '}
              <strong className="font-mono text-emerald-600 dark:text-emerald-400">
                {formatCurrency(order.totalPrice || 0)}
              </strong>
            </p>
            <p>
              <span className="text-slate-500">Fulfillment:</span>{' '}
              <strong className="text-slate-900 dark:text-slate-100">
                {getOrderFulfillmentStageLabel(order)}
              </strong>
            </p>
            <p>
              <span className="text-slate-500">Payment:</span>{' '}
              <strong className="text-slate-900 dark:text-slate-100">
                {getPaymentMethodLabel(order.paymentMethod, true)} ·{' '}
                {getPaymentStatusInfo(order.paymentStatus, order.paymentMethod).shortLabel}
              </strong>
            </p>
          </div>
        )}

        {action === 'delete' && (
          <Text size="xs" c="red" className="font-semibold flex items-center gap-1.5">
            <AlertCircle size={14} />
            This action cannot be undone. Only cancelled orders without unrefunded payments can be deleted.
          </Text>
        )}

        {action === 'archive' && (
          <Text size="xs" className="text-slate-600 dark:text-slate-400">
            Archiving moves this order out of the active queue for record keeping. It does not cancel the order or alter inventory stock.
          </Text>
        )}

        {action === 'restore' && (
          <Text size="xs" className="text-slate-600 dark:text-slate-400">
            Restoring returns this order to the active Orders view with its current fulfillment, payment, and stock states preserved.
          </Text>
        )}

        <Group justify="flex-end" gap="xs">
          <Button variant="default" onClick={onClose} disabled={saving} className="min-h-11">
            Cancel
          </Button>
          <Button
            color={action === 'delete' ? 'red' : 'cyan'}
            onClick={onConfirm}
            loading={saving}
            className="min-h-11"
          >
            {action === 'delete'
              ? 'Delete Permanently'
              : action === 'restore'
                ? 'Restore Order'
                : 'Archive Order'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

interface OrderCancelModalProps {
  order: Order | null;
  cancelling: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function OrderCancelModal({
  order,
  cancelling,
  onClose,
  onConfirm,
}: OrderCancelModalProps) {
  const isDispatched = order?.fulfillmentStage === 'out_for_delivery' || order?.fulfillmentStage === 'delivered';

  return (
    <Modal
      opened={Boolean(order)}
      onClose={onClose}
      title={
        <Group gap="xs">
          <ThemeIcon size="md" color="red" variant="light" radius="md">
            <XCircle size={16} />
          </ThemeIcon>
          <Text fw={700} className="font-headline text-sm text-slate-900 dark:text-slate-100">
            Cancel Order
          </Text>
        </Group>
      }
      centered
      radius="lg"
      classNames={{
        content:
          'bg-white/95 dark:bg-[#141a23]/95 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100',
        header:
          'bg-white/95 dark:bg-[#141a23]/95 border-b border-slate-200 dark:border-white/10 p-3',
        body: '!p-3',
      }}
    >
      <Stack gap="md">
        <Text size="sm" className="text-slate-600 dark:text-slate-300">
          Cancel order{' '}
          <strong className="font-mono text-slate-900 dark:text-slate-100">
            {order?.orderNumber || order?.id.slice(0, 8)}
          </strong>
          {isDispatched ? '?' : ' and return its reserved inventory stock?'}
        </Text>

        {isDispatched && (
          <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-3 text-xs text-orange-800 dark:text-orange-300">
            <strong>Dispatched Order Notice:</strong> Because this order was dispatched, stock will remain flagged as <strong>Return Pending</strong> until the physical goods are received and confirmed back in the store.
          </div>
        )}

        {order?.paymentStatus === 'paid' && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
            Payment has already been collected for this order. Cancelling it marks the refund status as <strong>Refund Due</strong> so a Manager or Super Admin can issue the refund immediately.
          </div>
        )}

        <Group justify="flex-end" gap="xs">
          <Button variant="default" onClick={onClose} disabled={cancelling} className="min-h-11">
            Keep Order
          </Button>
          <Button color="red" onClick={onConfirm} loading={cancelling} className="min-h-11">
            Cancel Order
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

export interface OrderPhysicalReturnModalProps {
  order: Order | null;
  confirming: boolean;
  onClose: () => void;
  onConfirm: (notes?: string) => Promise<void>;
}

export function OrderPhysicalReturnModal({
  order,
  confirming,
  onClose,
  onConfirm,
}: OrderPhysicalReturnModalProps) {
  const [notes, setNotes] = React.useState('');

  return (
    <Modal
      opened={Boolean(order)}
      onClose={onClose}
      title={
        <Group gap="xs">
          <ThemeIcon size="md" color="teal" variant="light" radius="md">
            <RotateCcw size={16} />
          </ThemeIcon>
          <Text fw={700} className="font-headline text-sm text-slate-900 dark:text-slate-100">
            Confirm Physical Stock Return
          </Text>
        </Group>
      }
      centered
      radius="lg"
      classNames={{
        content:
          'bg-white/95 dark:bg-[#141a23]/95 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100',
        header:
          'bg-white/95 dark:bg-[#141a23]/95 border-b border-slate-200 dark:border-white/10 p-3',
        body: '!p-3',
      }}
    >
      <Stack gap="md">
        <Text size="sm" className="text-slate-600 dark:text-slate-300">
          Confirm that the hardware items for cancelled order{' '}
          <strong className="font-mono text-slate-900 dark:text-slate-100">
            {order?.orderNumber || order?.id.slice(0, 8)}
          </strong>{' '}
          have been physically returned, inspected, and restocked into warehouse inventory.
        </Text>

        <div className="rounded-lg border border-teal-500/30 bg-teal-500/10 p-3 text-xs text-teal-800 dark:text-teal-300">
          Restoring stock will return quantities for all valid catalog items on this order. If any catalog item is missing from Firestore, it will be safely logged as an exception without aborting the return.
        </div>

        <Textarea
          label="Staff Return Notes (Optional)"
          placeholder="e.g. Inspected by staff, all parts intact and returned to shelf"
          value={notes}
          onChange={(e) => setNotes(e.currentTarget.value)}
          minRows={2}
          maxRows={4}
        />

        <Group justify="flex-end" gap="xs">
          <Button variant="default" onClick={onClose} disabled={confirming} className="min-h-11">
            Cancel
          </Button>
          <Button
            color="teal"
            onClick={() => onConfirm(notes)}
            loading={confirming}
            className="min-h-11"
          >
            Confirm & Restock
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

interface ClearAllOrdersModalProps {
  opened: boolean;
  purging: boolean;
  orderCount: number;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function ClearAllOrdersModal({
  opened,
  purging,
  orderCount,
  onClose,
  onConfirm,
}: ClearAllOrdersModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <ThemeIcon size="md" color="red" variant="light" radius="md">
            <Trash2 size={16} />
          </ThemeIcon>
          <Text fw={700} className="font-headline text-sm text-slate-900 dark:text-slate-100">
            Purge All Orders & Reservations
          </Text>
        </Group>
      }
      centered
      radius="lg"
      classNames={{
        content:
          'bg-white/95 dark:bg-[#141a23]/95 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100',
        header:
          'bg-white/95 dark:bg-[#141a23]/95 border-b border-slate-200 dark:border-white/10 p-3',
        body: '!p-3',
      }}
    >
      <Stack gap="md">
        <Text size="sm" className="text-slate-600 dark:text-slate-300">
          Are you sure you want to permanently delete{' '}
          <strong className="text-slate-900 dark:text-slate-100">
            all {orderCount} orders and historical reservations
          </strong>{' '}
          from the entire system?
        </Text>

        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-800 dark:text-rose-300 space-y-1">
          <p className="font-bold">⚠️ Warning: Irreversible Action</p>
          <p>
            This will permanently erase all customer orders, legacy reservation records, status histories, and refund traces across both active and archived collections. This cannot be undone.
          </p>
        </div>

        <Group justify="flex-end" gap="xs">
          <Button variant="default" onClick={onClose} disabled={purging} className="min-h-11">
            Cancel
          </Button>
          <Button color="red" onClick={onConfirm} loading={purging} className="min-h-11 font-semibold">
            Purge All Orders
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
