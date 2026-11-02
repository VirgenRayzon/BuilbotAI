'use client';
import { Button, Group, Modal, Stack, Text } from '@mantine/core';
import type { useOrderActions } from '../../hooks/use-order-actions';
import { getOrderFulfillmentStageLabel } from '@/lib/order-workflow';

export function OrderStageDialog({ actions }: { actions: ReturnType<typeof useOrderActions> }) {
  const request = actions.request;
  return <Modal opened={Boolean(request)} onClose={actions.close} title="Confirm Fulfillment Change" centered radius="lg"
    closeOnClickOutside={!actions.busy} closeOnEscape={!actions.busy} withCloseButton={!actions.busy}
    classNames={{ content: 'bg-white/95 dark:bg-[#141a23]/95 border border-slate-200 dark:border-white/10',
      header: 'bg-white/95 dark:bg-[#141a23]/95 p-3', body: '!p-3' }}>
    {request && <Stack gap="md">
      <Text size="sm">Order {request.order.orderNumber || request.order.id}</Text>
      <Text size="sm">{getOrderFulfillmentStageLabel(request.order)} → {getOrderFulfillmentStageLabel({ ...request.order, status: 'pending', fulfillmentStage: request.stage })}</Text>
      <Text size="xs" c="dimmed">Confirm that the order is ready for this step. Payment and inventory records will be preserved.</Text>
      {actions.error && <Text size="xs" c="red">{actions.error}</Text>}
      <Group justify="flex-end"><Button variant="default" className="min-h-11" disabled={actions.busy} onClick={actions.close}>Keep Current Stage</Button>
        <Button color="cyan" className="min-h-11" loading={actions.busy} onClick={() => void actions.confirm()}>Confirm Change</Button></Group>
    </Stack>}
  </Modal>;
}
