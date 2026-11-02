'use client';
import { Button, Select, Stack, Text } from '@mantine/core';
import { availableOrderStages, getOrderFulfillmentStage, getOrderFulfillmentStageLabel, getOrderStageAction } from '@/lib/order-workflow';
import type { Order, OrderFulfillmentStage } from '@/lib/types';

export function OrderStageControl({ order, archived, onRequest }: {
  order: Order; archived: boolean; onRequest?: (id: string, stage: OrderFulfillmentStage) => void;
}) {
  const { next, reason, label } = getOrderStageAction(order);
  const current = getOrderFulfillmentStage(order);
  return <Stack gap={4} className="w-full min-w-0 sm:max-w-[220px]">
    <Select value={current} disabled={archived || !next || !onRequest || Boolean(reason)} allowDeselect={false} size="xs"
      aria-label="Order fulfillment stage" classNames={{ input: 'min-h-11' }}
      data={availableOrderStages(order).filter(value => value === current || value === next).map(value => ({ value, label: getOrderFulfillmentStageLabel({ ...order, status: 'pending', fulfillmentStage: value }) }))}
      onChange={value => { if (value && value !== current) onRequest?.(order.id, value as OrderFulfillmentStage); }} />
    {next && !archived && <Button size="xs" color="cyan" className="min-h-11" disabled={Boolean(reason) || !onRequest} onClick={() => onRequest?.(order.id, next)}>{label}</Button>}
    {reason && !archived && <Text size="xs" c="dimmed">{reason}</Text>}
  </Stack>;
}
