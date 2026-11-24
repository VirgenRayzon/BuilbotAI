'use client';
import { Button, Group, Modal, Stack, Text, TextInput, Textarea } from '@mantine/core';
import type { Order } from '@/lib/types';
import type { ReconcileRefund } from '@/lib/order-payment';
import { useRefundReconciliation } from '../../hooks/use-refund-reconciliation';

export function RefundReconcileControl({ order, reconciling = false, reconcile }: {
  order: Order; reconciling?: boolean; reconcile?: ReconcileRefund;
}) {
  const state = useRefundReconciliation(order, reconcile);
  if (!order.pendingRefundOperationId || !reconcile) return null;
  return <>
    <Button color="orange" variant="light" size="xs" className="min-h-11" loading={state.busy || reconciling} onClick={state.begin}>Verify Pending Refund</Button>
    <Modal opened={state.opened} onClose={state.close} title="Verify Pending Refund" centered radius="lg"
      closeOnClickOutside={!state.busy} closeOnEscape={!state.busy} withCloseButton={!state.busy}
      classNames={{ content: 'bg-white/95 dark:bg-[#141a23]/95 border border-slate-200 dark:border-white/10', header: 'bg-white/95 dark:bg-[#141a23]/95 p-3', body: '!p-3' }}>
      <Stack gap="md">
        <Text size="sm">Order {order.orderNumber || order.id}</Text>
        <Text size="xs" c="dimmed">The refund outcome is unconfirmed. Find its refund ID in PayMongo for this payment. We will verify the payment, amount and request before updating the order. Do not send another payout.</Text>
        <TextInput label="PayMongo refund ID" placeholder="ref_…" value={state.providerRefundId} onChange={event => state.setProviderRefundId(event.currentTarget.value)} disabled={state.busy} />
        <Textarea label="Verification reason" description="Explain how you matched this refund (minimum 8 characters)." value={state.reason} onChange={event => state.setReason(event.currentTarget.value)} disabled={state.busy} />
        {state.error && <Text size="xs" c="red">{state.error}</Text>}
        <Group justify="flex-end"><Button variant="default" className="min-h-11" onClick={state.close} disabled={state.busy}>Keep On Hold</Button>
          <Button color="cyan" className="min-h-11" loading={state.busy} onClick={() => void state.submit()}>Verify Refund</Button></Group>
      </Stack>
    </Modal>
  </>;
}
