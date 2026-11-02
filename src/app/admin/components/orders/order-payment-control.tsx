'use client';
import { Button, Menu } from '@mantine/core';
import { getAllowedStaffPaymentStatuses } from '@/lib/order-workflow';
import { getPaymentStatusInfo } from '@/lib/payment-methods';
import type { Order, PaymentStatus } from '@/lib/types';

export function OrderPaymentControl({ order, archived, onRequest }: {
  order: Order; archived: boolean; onRequest: (order: Order, status: PaymentStatus) => void;
}) {
  const cod = (order.paymentMethod ?? 'cod') === 'cod';
  if (!cod) return null;

  const allowed = getAllowedStaffPaymentStatuses(order);
  const status = getPaymentStatusInfo(order.paymentStatus, order.paymentMethod);
  if (archived || order.status === 'cancelled' || allowed.length === 0) return null;
  return status.status === 'unpaid' ? <Button size="xs" color="teal" variant="light" className="min-h-11" onClick={() => onRequest(order, 'paid')}>Payment Confirmed</Button>
      : status.status === 'paid' && allowed.includes('unpaid') ? <Menu withinPortal position="bottom-start">
        <Menu.Target><Button size="xs" variant="subtle" color="gray" className="min-h-11" aria-label="Payment record actions">Payment actions</Button></Menu.Target>
        <Menu.Dropdown><Menu.Item onClick={() => onRequest(order, 'unpaid')}>Correct erroneous collection record</Menu.Item></Menu.Dropdown>
      </Menu> : null;
}
