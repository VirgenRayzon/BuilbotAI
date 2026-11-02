"use client";

import { usePaymentStatusDialog } from '../hooks/use-payment-status-dialog';
import type { StaffPaymentRequest } from '@/lib/order-payment';
import { formatCurrency } from '@/lib/utils';
import { Button, Checkbox, Group, Modal, Stack, Text, Textarea } from '@mantine/core';
import type { Order, PaymentStatus } from '@/lib/types';
import { getPaymentMethodLabel, getPaymentStatusInfo } from '@/lib/payment-methods';

interface OrderPaymentStatusDialogProps {
  order: Order | null;
  nextStatus: PaymentStatus | null;
  onClose: () => void;
  onSubmit: (reason?: string, request?: StaffPaymentRequest) => Promise<boolean>;
}

export function OrderPaymentStatusDialog({
  order,
  nextStatus,
  onClose,
  onSubmit,
}: OrderPaymentStatusDialogProps) {
  const state = usePaymentStatusDialog(order, nextStatus, onSubmit, onClose);
  const { reason, setReason, busy, error, policy } = state;
  const currentStatusInfo = getPaymentStatusInfo(order?.paymentStatus, order?.paymentMethod);
  const nextStatusInfo = nextStatus ? getPaymentStatusInfo(nextStatus, order?.paymentMethod) : null;

  return (
    <Modal
      opened={Boolean(order && nextStatus)}
      onClose={state.close}
      closeOnEscape={!busy}
      closeOnClickOutside={!busy}
      withCloseButton={!busy}
      title={policy?.title || "Update Payment Status"}
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
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs space-y-1 dark:border-white/10 dark:bg-[#111722]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-600 dark:text-slate-400">Order</span>
            <strong className="font-mono text-slate-900 dark:text-slate-100">
              {order?.orderNumber || order?.id.slice(0, 8)}
            </strong>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-600 dark:text-slate-400">Method</span>
            <strong className="text-slate-900 dark:text-slate-100">
              {getPaymentMethodLabel(order?.paymentMethod, false)}
            </strong>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-600 dark:text-slate-400">Transition</span>
            <strong className="text-slate-900 dark:text-slate-100">
              {currentStatusInfo?.shortLabel} → {nextStatusInfo?.shortLabel || nextStatus}
            </strong>
          </div>
        </div>

        {order && <div className="rounded-lg border border-slate-200 dark:border-white/10 p-3">
          <Text size="xs" c="dimmed">{policy?.collecting ? 'Cash received' : 'Order total'}</Text>
          <Text fw={700} className="font-mono text-slate-900 dark:text-slate-100">{formatCurrency(order.totalPrice)}</Text>
        </div>}
        {policy?.collecting && <Checkbox checked={state.received} onChange={event => state.setReceived(event.currentTarget.checked)} disabled={busy}
          label="I confirm this exact amount was received for this order." classNames={{ body: 'min-h-11 items-center' }} />}
        {policy?.correcting && (
          <Text size="xs" className="text-amber-700 dark:text-amber-300">
            Use this only to correct an erroneous record. The original collection stays in history and is linked to this correction. If cash is being returned to the customer, use Issue Refund.
          </Text>
        )}

        {policy?.needsReason ? (
          <Textarea
            label="Reason for payment record correction or verification"
            description="Required for auditing online payment confirmations or reverting a paid status (minimum 8 characters)."
            minRows={2}
            value={reason}
            onChange={(event) => setReason(event.currentTarget.value)}
            disabled={busy}
          />
        ) : (
          <Textarea
            label="Collection note (optional)"
            placeholder="e.g. Cash collected upon courier handover"
            minRows={2}
            value={reason}
            onChange={(event) => setReason(event.currentTarget.value)}
            disabled={busy}
          />
        )}

        {error && (
          <Text c="red" size="sm">
            {error}
          </Text>
        )}

        <Group justify="flex-end" gap="xs">
          <Button variant="default" onClick={state.close} disabled={busy} className="min-h-11">
            Cancel
          </Button>
          <Button color="cyan" onClick={() => void state.submit()} loading={busy} className="min-h-11">
            {policy?.action || "Confirm Payment Update"}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
