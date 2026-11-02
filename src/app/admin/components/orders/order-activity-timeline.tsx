'use client';

import { useState } from 'react';
import { Badge, Button, Collapse, Group, Paper, Stack, Text } from '@mantine/core';
import { ExternalLink, History } from 'lucide-react';
import type { Order } from '@/lib/types';
import { useOrderActivity } from '../../hooks/use-order-activity';
import { formatFirestoreTimestamp } from './order-status-config';
import { formatCurrency } from '@/lib/utils';
import { getNetCollectedAmount, getRefundedAmount } from '@/lib/order-workflow';

function getEventBadgeColor(type: string): string {
  switch (type) {
    case 'payment':
    case 'payment_status':
      return 'teal';
    case 'refund':
    case 'refund_status':
      return 'orange';
    case 'stage':
      return 'blue';
    case 'cancelled':
      return 'red';
    case 'inventory':
    case 'physical_stock_return':
      return 'indigo';
    case 'assembly_verification':
      return 'cyan';
    default:
      return 'gray';
  }
}

export function OrderActivityTimeline({
  order,
  embedded = false,
}: {
  order: Order;
  embedded?: boolean;
}) {
  const [opened, setOpened] = useState(embedded);
  const activity = useOrderActivity(order, opened);

  const placedValue = order.totalPrice || 0;
  const collectedTotal = order.paymentStatus === 'paid' ? placedValue : 0;
  const refundedTotal = getRefundedAmount(order);
  const netSales = getNetCollectedAmount(order);

  return (
    <div className="w-full">
      {!embedded && (
        <Button
          fullWidth
          variant="subtle"
          color="gray"
          className="min-h-11 text-xs font-semibold text-slate-600 dark:text-slate-300"
          leftSection={<History size={14} className="text-slate-400" />}
          aria-expanded={opened}
          onClick={() => setOpened((value) => !value)}
        >
          {opened ? 'Hide Order Activity' : 'View Order Activity'}
        </Button>
      )}

      <Collapse in={opened}>
        <Stack gap="xs" pt="xs">
          {/* Financial Breakdown Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded-lg bg-slate-100/90 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Placed Value
              </span>
              <p className="font-mono font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(placedValue)}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Collected
              </span>
              <p className="font-mono font-bold text-teal-600 dark:text-teal-400">
                {formatCurrency(collectedTotal)}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Refunds Issued
              </span>
              <p className="font-mono font-bold text-orange-600 dark:text-orange-400">
                {formatCurrency(refundedTotal)}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Net Sales
              </span>
              <p className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                {formatCurrency(netSales)}
              </p>
            </div>
          </div>

          {/* Activity Events */}
          {activity.events.map((event) => (
            <Paper
              key={event.id}
              withBorder
              radius="md"
              p="sm"
              className="bg-white/80 dark:bg-[#111722] border-slate-200 dark:border-white/10 space-y-1.5"
            >
              <Group justify="space-between" gap="xs">
                <Badge size="xs" variant="light" color={getEventBadgeColor(event.type)}>
                  {event.type.replaceAll('_', ' ')}
                </Badge>
                <Text size="xs" c="dimmed" className="font-mono text-[11px]">
                  {event.createdAt
                    ? formatFirestoreTimestamp(event.createdAt, true)
                    : 'Time not recorded'}
                </Text>
              </Group>

              <Text size="xs" className="break-words text-slate-800 dark:text-slate-200">
                {event.details}
              </Text>

              <Group justify="space-between" gap="xs" className="pt-0.5">
                <Text size="xs" c="dimmed">
                  {event.actorName} · {event.actorRole}
                  {event.inferred ? ' · Legacy record' : ''}
                </Text>

                {event.proofUrl && (
                  <a
                    href={event.proofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-600 hover:text-cyan-500 dark:text-cyan-400"
                  >
                    <span>View Proof</span>
                    <ExternalLink size={11} />
                  </a>
                )}
              </Group>
            </Paper>
          ))}

          {activity.events.length === 0 && !activity.busy && (
            <Text size="xs" c="dimmed" ta="center" py="sm">
              No activity records logged for this order.
            </Text>
          )}

          {activity.error && (
            <Text size="xs" c="red">
              {activity.error}
            </Text>
          )}

          {(activity.hasMore || activity.error) && (
            <Button
              variant="subtle"
              className="min-h-11"
              loading={activity.busy}
              onClick={() => void activity.loadMore()}
            >
              {activity.error ? 'Retry activity' : 'Load older activity'}
            </Button>
          )}

          {activity.busy && <Text size="xs" c="dimmed">Loading activity…</Text>}
        </Stack>
      </Collapse>
    </div>
  );
}
