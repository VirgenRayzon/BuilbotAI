"use client";

import { useEffect, useState } from 'react';
import {
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core';
import type { Order, OrderRefundDestination } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import {
  getRemainingRefundableAmount,
  ORDER_REFUND_DESTINATION_LABELS,
} from '@/lib/order-workflow';
import type { StaffRefundSubmission } from '../hooks/use-orders';

interface OrderRefundDialogProps {
  order: Order | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (values: StaffRefundSubmission) => Promise<boolean>;
}

const DESTINATION_OPTIONS: { value: OrderRefundDestination; label: string }[] = (
  Object.entries(ORDER_REFUND_DESTINATION_LABELS) as [OrderRefundDestination, string][]
).map(([value, label]) => ({ value, label }));

function getDefaultDestination(order: Order | null): OrderRefundDestination {
  if (!order) return 'original_payment_method';
  if (
    order.paymentMethod === 'paymongo_simulated' &&
    order.paymongoMode === 'live_test_api' &&
    order.paymongoPaymentId
  ) {
    return 'original_payment_method';
  }
  if (order.paymentMethod === 'gcash_simulated') return 'gcash';
  if (!order.paymentMethod || order.paymentMethod === 'cod') return 'cash';
  return 'original_payment_method';
}

export function OrderRefundDialog({
  order,
  submitting,
  onClose,
  onSubmit,
}: OrderRefundDialogProps) {
  const [amount, setAmount] = useState<number | string>('');
  const [destination, setDestination] = useState<OrderRefundDestination>('original_payment_method');
  const [reason, setReason] = useState('');
  const [reference, setReference] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [error, setError] = useState('');

  const available = order ? getRemainingRefundableAmount(order) : 0;
  const isLivePaymongoOrder =
    order?.paymentMethod === 'paymongo_simulated' &&
    order.paymongoMode === 'live_test_api';
  const usesProviderRefund =
    destination === 'original_payment_method' &&
    isLivePaymongoOrder &&
    Boolean(order?.paymongoPaymentId);
  const missingProviderPaymentId =
    destination === 'original_payment_method' &&
    isLivePaymongoOrder &&
    !order?.paymongoPaymentId;

  useEffect(() => {
    setAmount(order ? getRemainingRefundableAmount(order) : '');
    setDestination(getDefaultDestination(order));
    setReason('');
    setReference('');
    setProofUrl('');
    setError('');
  }, [order]);

  const submit = async () => {
    const value = typeof amount === 'number' ? amount : Number(amount);
    if (!Number.isFinite(value) || value <= 0 || value > available) {
      setError(`Enter a refund amount up to ${formatCurrency(available)}.`);
      return;
    }
    if (reason.trim().length < 8) {
      setError('Enter a refund reason of at least 8 characters.');
      return;
    }
    if (missingProviderPaymentId) {
      setError(
        'PayMongo payment ID is not synced yet. Choose a manual destination (such as GCash or Bank Transfer) and enter a payout reference.'
      );
      return;
    }
    if (!usesProviderRefund && reference.trim().length < 3) {
      setError('Enter the payout reference or receipt number (at least 3 characters).');
      return;
    }

    setError('');
    const completed = await onSubmit({
      amount: value,
      destination,
      reason: reason.trim(),
      reference: usesProviderRefund ? undefined : reference.trim(),
      proofUrl: proofUrl.trim() || undefined,
    });
    if (completed) onClose();
  };

  return (
    <Modal
      opened={Boolean(order)}
      onClose={onClose}
      title="Issue Refund"
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
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs dark:border-white/10 dark:bg-[#111722]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-600 dark:text-slate-400">Order</span>
            <strong className="font-mono text-slate-900 dark:text-slate-100">
              {order?.orderNumber || order?.id.slice(0, 8)}
            </strong>
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="text-slate-600 dark:text-slate-400">Available to refund</span>
            <strong className="font-mono text-emerald-600 dark:text-emerald-400">
              {formatCurrency(available)}
            </strong>
          </div>
        </div>

        <NumberInput
          label="Refund amount (PHP)"
          min={0.01}
          max={available}
          decimalScale={2}
          value={amount}
          onChange={setAmount}
          disabled={submitting}
          classNames={{ input: 'min-h-11' }}
        />

        <Select
          label="Refund destination"
          data={DESTINATION_OPTIONS}
          value={destination}
          onChange={(val) => val && setDestination(val as OrderRefundDestination)}
          disabled={submitting}
          allowDeselect={false}
          classNames={{ input: 'min-h-11' }}
        />

        <Textarea
          label="Reason"
          description="Recorded immediately in the order refund and audit history. No separate Super Admin approval is required."
          minRows={2}
          value={reason}
          onChange={(event) => setReason(event.currentTarget.value)}
          disabled={submitting}
        />

        {usesProviderRefund ? (
          <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-3 text-xs text-slate-700 dark:text-slate-300">
            This refund will be submitted directly to PayMongo for the original payment method and logged with the provider reference ID.
          </div>
        ) : (
          <Stack gap="sm">
            {missingProviderPaymentId && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
                No synced PayMongo payment ID was found on this order. Select a manual payout destination (GCash, Bank Transfer, Cash, or Store Credit) to record a manual refund.
              </div>
            )}
            <TextInput
              label="Payout reference or receipt number"
              placeholder="e.g. GCASH-94827103 or OR-2026-104"
              value={reference}
              onChange={(event) => setReference(event.currentTarget.value)}
              disabled={submitting}
              description="Complete the payout first, then enter its transaction or receipt reference."
              classNames={{ input: 'min-h-11' }}
            />
            <TextInput
              label="Proof link or receipt note (optional)"
              placeholder="https://... or voucher/slip note"
              value={proofUrl}
              onChange={(event) => setProofUrl(event.currentTarget.value)}
              disabled={submitting}
              classNames={{ input: 'min-h-11' }}
            />
          </Stack>
        )}

        {error && (
          <Text size="sm" c="red">
            {error}
          </Text>
        )}

        <Group justify="flex-end" gap="xs">
          <Button
            variant="default"
            onClick={onClose}
            disabled={submitting}
            className="min-h-11"
          >
            Cancel
          </Button>
          <Button
            color="red"
            onClick={submit}
            loading={submitting}
            className="min-h-11"
          >
            Issue Refund
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
