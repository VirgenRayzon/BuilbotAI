"use server";

import { completeProviderRefund, reconcileProviderRefund } from '@/lib/server/order-refund-reconciliation';
import { writeRefundNotifications } from '@/lib/server/order-refund-notifications';
import { writeOrderChange } from '@/lib/server/order-activity';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { getOrderActor } from '@/lib/server/order-auth';
import {
  getRefundedAmount,
} from '@/lib/order-workflow';
import {
  createPaymongoRefund,
  isPaymongoTestApiConfigured,
} from '@/lib/server/paymongo';
import type { Order, OrderRefund, OrderRefundDestination } from '@/lib/types';

const refundDestinationSchema = z.enum([
  'original_payment_method',
  'gcash',
  'bank_transfer',
  'cash',
  'store_credit',
]);

const refundSchema = z.object({
  orderId: z.string().min(1).max(128).regex(/^[a-zA-Z0-9_-]+$/),
  amount: z.number().finite().positive().max(10_000_000),
  reason: z.string().trim().min(8).max(255),
  destination: refundDestinationSchema.default('original_payment_method'),
  reference: z.string().trim().max(128).optional(),
  proofUrl: z.string().trim().max(500).optional(),
  operationId: z.string().uuid(),
  idToken: z.string().min(1),
});

export type RefundOrderByStaffInput = z.input<typeof refundSchema>;

export async function refundOrderByStaff(input: RefundOrderByStaffInput): Promise<{
  success: boolean;
  pending?: boolean;
  reference?: string;
  error?: string;
  retryable?: boolean;
}> {
  const parsed = refundSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Enter a valid refund amount, destination, reason (at least 8 characters), and reference.',
    };
  }

  try {
    const data = parsed.data;
    const { decoded, firestore, actorProfile: actor, isSuperAdmin, isManager } = await getOrderActor(data.idToken);

    if (!isManager && !isSuperAdmin) {
      throw new Error('Only Managers and Super Admins can issue refunds.');
    }

    const actorRole: 'Manager' | 'Super Admin' = isSuperAdmin ? 'Super Admin' : 'Manager';
    const actorName = actor?.name || actor?.email || decoded.email || actorRole;
    const orderRef = firestore.collection('orders').doc(data.orderId);
    const operationRef = firestore
      .collection('orderRefundOperations')
      .doc(`${data.orderId}_${data.operationId}`);
    const amount = Math.round(data.amount * 100) / 100;
    if (amount <= 0) throw new Error('Refund amount must be at least one centavo.');
    const destination: OrderRefundDestination = data.destination;
    const manualReference = (data.reference || data.proofUrl || '').trim();
    const proofUrl = data.proofUrl?.trim() || undefined;

    const reservation = await firestore.runTransaction(async (transaction) => {
      const [orderSnap, operationSnap] = await Promise.all([
        transaction.get(orderRef),
        transaction.get(operationRef),
      ]);
      if (operationSnap.exists) {
        const existing = operationSnap.data();
        if (existing?.actorId !== decoded.uid || existing?.amount !== amount ||
            existing?.destination !== destination || existing?.reason !== data.reason ||
            (existing?.proofUrl || '') !== (proofUrl || '') ||
            (existing?.manualReference !== undefined && existing.manualReference !== manualReference)) {
          throw new Error('This refund operation ID was already used for a different request.');
        }
        return {
          duplicate: true,
          pending: existing?.status !== 'succeeded' && existing?.status !== 'failed',
          failed: existing?.status === 'failed',
          reference: String(existing?.reference || ''),
        };
      }
      if (!orderSnap.exists) throw new Error('Order not found.');
      const order = orderSnap.data() as Order;
      if (order.isArchived) {
        throw new Error('Restore archived orders before issuing a refund.');
      }
      if (order.paymentStatus !== 'paid') {
        throw new Error('Only paid orders can be refunded.');
      }
      if (order.pendingRefundOperationId) {
        throw new Error('Another refund is pending reconciliation for this order.');
      }

      const available = Math.round((order.totalPrice - getRefundedAmount(order)) * 100) / 100;
      if (amount > available) {
        throw new Error(`The remaining refundable amount is ₱${available.toFixed(2)}.`);
      }

      const usesProvider =
        destination === 'original_payment_method' &&
        order.paymentMethod === 'paymongo_simulated' &&
        order.paymongoMode === 'live_test_api';

      if (usesProvider && !isPaymongoTestApiConfigured()) throw new Error('Configure PayMongo before requesting a provider refund.');
      if (usesProvider && !order.paymongoPaymentId) {
        throw new Error(
          'PayMongo payment ID is missing. Verify payment status first, or choose a manual payout destination (e.g. GCash / Bank Transfer) with a payout reference.'
        );
      }
      if (!usesProvider && manualReference.length < 3) {
        throw new Error('Enter the payout reference or proof (at least 3 characters).');
      }

      const now = admin.firestore.Timestamp.now();
      if (usesProvider) {
        transaction.set(operationRef, {
          orderId: data.orderId,
          operationId: data.operationId,
          manualReference,
          amount,
          destination,
          reason: data.reason,
          proofUrl: proofUrl || null,
          actorId: decoded.uid,
          actorName,
          actorRole,
          status: 'pending',
          paymentId: order.paymongoPaymentId,
          providerRequestKey: data.operationId,
          createdAt: now,
        });
        writeOrderChange(transaction, orderRef, order, {
          pendingRefundOperationId: data.operationId,
          refundStatus: 'pending',
          updatedAt: now,
        }, { actorId: decoded.uid, actorName: actor?.name || decoded.email || "Staff", actorRole: isSuperAdmin ? "Super Admin" : "Manager" });
        return {
          duplicate: false,
          pending: true,
          providerPaymentId: order.paymongoPaymentId,
          reference: '',
        };
      }

      const refund: OrderRefund = {
        id: data.operationId,
        amount,
        method: 'manual',
        destination,
        reason: data.reason,
        reference: manualReference,
        ...(proofUrl ? { proofUrl } : {}),
        actorId: decoded.uid,
        actorName,
        actorRole,
        status: 'succeeded',
        createdAt: now,
      };
      const refundedAmount = Math.round((getRefundedAmount(order) + amount) * 100) / 100;
      writeOrderChange(transaction, orderRef, order, {
        refunds: [...(order.refunds || []), refund],
        refundedAmount,
        refundStatus: refundedAmount >= order.totalPrice ? 'refunded' : 'partial',
        updatedAt: now,
      }, { actorId: decoded.uid, actorName: actor?.name || decoded.email || "Staff", actorRole: isSuperAdmin ? "Super Admin" : "Manager" });
      transaction.set(operationRef, {
        orderId: data.orderId,
        operationId: data.operationId,
        manualReference,
        amount,
        destination,
        reason: data.reason,
        reference: refund.reference,
        proofUrl: proofUrl || null,
        actorId: decoded.uid,
        actorName,
        actorRole,
        status: 'succeeded',
        createdAt: now,
      });
      writeRefundNotifications(transaction, firestore, order, refund, now);
      return { duplicate: false, pending: false, reference: refund.reference };
    });

    if (reservation.duplicate) {
      if (reservation.failed) return { success: false, pending: false, retryable: true, error: 'PayMongo confirmed this refund failed. Review the order before starting a new refund request.' };
      return {
        success: true,
        pending: reservation.pending,
        reference: reservation.reference,
      };
    }
    if (!reservation.providerPaymentId) {
      return { success: true, reference: reservation.reference };
    }

    try {
      const providerRefund = await createPaymongoRefund({
        paymentId: reservation.providerPaymentId,
        amountPhp: amount,
        reason: data.reason,
        operationId: data.operationId,
      });
      const result = await completeProviderRefund(firestore, data.orderId, data.operationId, providerRefund,
        { actorId: decoded.uid, actorName, actorRole });
      if (result.status === 'failed') {
        return { success: false, pending: false, retryable: true, error: 'PayMongo confirmed this refund failed. Review the order before starting a new refund request.' };
      }
      return { success: true, pending: result.pending, reference: providerRefund.id };
    } catch (error) {
      return {
        success: false,
        pending: true,
        error:
          error instanceof Error
            ? error.message
            : 'Refund outcome is unconfirmed. Keep the refund on hold and verify it with PayMongo.',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unable to issue refund.',
    };
  }
}

const reconcileRefundSchema = z.object({
  reference: z.object({ providerRefundId: z.string().regex(/^ref_[a-zA-Z0-9_-]{1,120}$/), reason: z.string().trim().min(8).max(255) }).optional(),
  orderId: z.string().min(1).max(128).regex(/^[a-zA-Z0-9_-]+$/),
  idToken: z.string().min(1),
});

export async function reconcileOrderRefundByStaff(
  input: z.infer<typeof reconcileRefundSchema>
): Promise<{
  success: boolean;
  pending?: boolean;
  status?: 'succeeded' | 'pending' | 'failed' | 'cleared';
  requiresReference?: boolean;
  error?: string;
}> {
  const parsed = reconcileRefundSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: 'Invalid refund reconciliation request.' };

  try {
    const { orderId, idToken } = parsed.data;
    const { decoded, firestore, actorProfile: actor, isSuperAdmin, isManager } = await getOrderActor(idToken);
    if (!isManager && !isSuperAdmin) {
      throw new Error('Only Managers and Super Admins can reconcile refunds.');
    }

    const result = await reconcileProviderRefund(firestore, orderId,
      { actorId: decoded.uid, actorName: actor?.name || decoded.email || 'Staff', actorRole: isSuperAdmin ? 'Super Admin' : 'Manager' }, parsed.data.reference);
    return { success: true, ...result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unable to reconcile refund.',
    };
  }
}

