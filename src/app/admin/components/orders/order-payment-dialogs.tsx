"use client";
import type { StaffPaymentRequest } from '@/lib/order-payment';
import React from 'react';
import type { Order, PaymentStatus } from '@/lib/types';
import type { StaffRefundSubmission } from '../../hooks/use-orders';
import { OrderRefundDialog } from '../order-refund-dialog';
import { OrderPaymentStatusDialog } from '../order-payment-status-dialog';
interface Props {
  refundOrder: Order | null;
  refundSubmitting: boolean;
  setRefundOrder: (order: Order | null) => void;
  setRefundSubmitting: (busy: boolean) => void;
  onRefundOrder?: (id: string, input: StaffRefundSubmission) => Promise<boolean>;
  paymentChange: { order: Order; status: PaymentStatus } | null;
  setPaymentChange: (value: { order: Order; status: PaymentStatus } | null) => void;
  onUpdateOrderPaymentStatus?: (id: string, status: PaymentStatus, reason?: string, request?: StaffPaymentRequest) => Promise<boolean>;
}
export function OrderPaymentDialogs({ refundOrder, refundSubmitting, setRefundOrder, setRefundSubmitting,
  onRefundOrder, paymentChange, setPaymentChange, onUpdateOrderPaymentStatus }: Props) {
  return <>
      <OrderRefundDialog
        order={refundOrder}
        submitting={refundSubmitting}
        onClose={() => setRefundOrder(null)}
        onSubmit={async (values) => {
          if (!refundOrder || !onRefundOrder) return false;
          setRefundSubmitting(true);
          try {
            return await onRefundOrder(refundOrder.id, values);
          } finally {
            setRefundSubmitting(false);
          }
        }}
      />

      <OrderPaymentStatusDialog
        order={paymentChange?.order || null}
        nextStatus={paymentChange?.status || null}
        onClose={() => setPaymentChange(null)}
        onSubmit={async (reason, request) => {
          if (!paymentChange || !onUpdateOrderPaymentStatus) return false;
          return onUpdateOrderPaymentStatus(
            paymentChange.order.id,
            paymentChange.status,
            reason,
            request
          );
        }}
      />

  </>;
}
