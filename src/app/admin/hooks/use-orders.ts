"use client";

import { operationStorageKey, storedOrderOperation, clearStoredOrderOperation, sessionOperationStorage } from '@/lib/order-operation-cache';
import type { StaffPaymentRequest, ReconcileRefund } from '@/lib/order-payment';
import type { OrderOperation } from '@/lib/server/order-operations';
import { useMemo, useRef, useState } from 'react';
import { useAuth, useFirestore } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import type {
    Order,
    OrderFulfillmentStage,
    OrderRefundDestination,
    PaymentStatus,
    UserProfile,
} from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import {
    updateReservationStatus,
    updateOrderPaymentStatusByStaff,
    updateOrderFulfillmentStageByStaff,
    confirmOrderPhysicalStockReturn,
    sweepExpiredPendingOrders,
} from '@/app/checkout-actions';
import { getOrderFulfillmentStage, getOrderFulfillmentStageLabel } from '@/lib/order-workflow';
import { manageReservation, clearAllOrders } from '../reservation-actions';
import { refundOrderByStaff, reconcileOrderRefundByStaff } from '../order-refund-actions';

export interface StaffRefundSubmission {
    amount: number;
    destination: OrderRefundDestination;
    reason: string;
    reference?: string;
    proofUrl?: string;
}

/**
 * Hook to manage unified customer orders (including legacy reservation records).
 */
export function useOrders(_profile?: UserProfile | null) {
    const firestore = useFirestore();
    const auth = useAuth();
    const { toast } = useToast();
    const retries = useRef(new Map<string, OrderOperation>());
    const operationFor = (orderId: string, payload: unknown, snapshot?: OrderOperation) => {
        const revision = orders.find(order => order.id === orderId)?.workflowRevision || 0;
        const key = operationStorageKey(auth?.currentUser?.uid || 'signed-out', orderId, payload);
        let operation = retries.current.get(key);
        if (!operation) { operation = storedOrderOperation(sessionOperationStorage(), key, snapshot || { operationId: crypto.randomUUID(), expectedRevision: revision }); retries.current.set(key, operation); }
        return operation;
    };
    const clearOperation = (orderId: string, payload: unknown) => {
        const key = operationStorageKey(auth?.currentUser?.uid || 'signed-out', orderId, payload);
        retries.current.delete(key); clearStoredOrderOperation(sessionOperationStorage(), key);
    };
    const [orderLimit, setOrderLimit] = useState(100);
    const [isSweepingExpired, setIsSweepingExpired] = useState(false);

    const ordersQuery = useMemo(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'orders'),
            orderBy('createdAt', 'desc'),
            limit(orderLimit)
        );
    }, [firestore, orderLimit]);

    const { data: recentOrders, loading: recentOrdersLoading } = useCollection<Order>(ordersQuery);
    const orders = recentOrders || [];
    const ordersLoading = recentOrdersLoading;

    const handleReservationAction = async (
        orderId: string,
        action: 'archive' | 'restore' | 'delete'
    ) => {
        try {
            const user = auth?.currentUser;
            if (!user) throw new Error('Please sign in again.');
            const idToken = await user.getIdToken();
            const result = await manageReservation({ orderId, action, idToken, operation: operationFor(orderId, { action }) });
            if (!result.success) throw new Error(result.error);
            clearOperation(orderId, { action });
            const label =
                action === 'archive' ? 'Archived' : action === 'restore' ? 'Restored' : 'Deleted';
            toast({
                title: `Order ${label}`,
                description:
                    action === 'delete'
                        ? 'The order has been permanently removed.'
                        : `The order has been ${label.toLowerCase()}.`,
            });
            return true;
        } catch (error) {
            console.error(`Error performing order ${action}:`, error);
            toast({
                title: 'Action Failed',
                description: error instanceof Error ? error.message : 'Order action failed.',
                variant: 'destructive',
            });
            return false;
        }
    };

    const handleUpdateOrder = async (orderId: string, newStatus: Order['status']) => {
        if (!firestore) return false;
        try {
            const user = auth?.currentUser;
            if (!user) throw new Error('Please sign in again.');
            const result = await updateReservationStatus(orderId, newStatus, await user.getIdToken(), operationFor(orderId, { newStatus }));
            if (!result.success) {
                throw new Error(result.error);
            }
            toast({
                title: newStatus === 'cancelled' ? 'Order Cancelled' : 'Order Status Updated',
                description:
                    newStatus === 'cancelled'
                        ? `Order ${orderId.substring(0, 8)} cancelled and reserved stock returned.`
                        : `Order ${orderId.substring(0, 8)} status updated to ${newStatus}.`,
            });
            clearOperation(orderId, { newStatus });
            return true;
        } catch (error) {
            console.error('Error updating order status:', error);
            toast({
                title: 'Update Failed',
                description: error instanceof Error ? error.message : 'Failed to update order status.',
                variant: 'destructive',
            });
            return false;
        }
    };

    const handleUpdateOrderPaymentStatus = async (
        orderId: string,
        newPaymentStatus: PaymentStatus,
        reason?: string,
        request?: StaffPaymentRequest
    ) => {
        if (!firestore) return false;
        try {
            const user = auth?.currentUser;
            if (!user) throw new Error('Please sign in again.');
            const idToken = await user.getIdToken();
            const result = await updateOrderPaymentStatusByStaff(
                orderId,
                newPaymentStatus,
                idToken,
                reason,
                operationFor(orderId, { newPaymentStatus, reason: reason || "" }, request?.operation),
                request?.cashConfirmation
            );
            if (!result.success) {
                if (result.error?.includes('This order changed')) clearOperation(orderId, { newPaymentStatus, reason: reason || "" });
                throw new Error(result.error);
            }
            toast({
                title: 'Payment Request Confirmed',
                description: `Payment request recorded for order ${orderId.substring(0, 8)}. Its current payment status is shown on the order.`,
            });
            clearOperation(orderId, { newPaymentStatus, reason: reason || "" });
            return true;
        } catch (error) {
            console.error('Error updating order payment status:', error);
            toast({
                title: 'Payment Update Failed',
                description: error instanceof Error ? error.message : 'Failed to update payment status.',
                variant: 'destructive',
            });
            return false;
        }
    };

    const handleUpdateFulfillmentStage = async (
        orderId: string,
        stage: OrderFulfillmentStage,
        operation: OrderOperation
    ) => {
        try {
            const user = auth?.currentUser;
            if (!user) throw new Error('Please sign in again.');
            const token = await user.getIdToken(true);
            const result = await updateOrderFulfillmentStageByStaff({
                orderId,
                stage,
                idToken: token,
                operation,
            });
            if (!result.success) throw new Error(result.error);
            const targetOrder = orders.find((o) => o.id === orderId);
            const stageLabel = getOrderFulfillmentStageLabel({
                status: targetOrder?.status ?? 'pending',
                shippingMethod: targetOrder?.shippingMethod,
                paymentMethod: targetOrder?.paymentMethod,
                fulfillmentStage: stage,
            });
            toast({
                title: 'Fulfillment Updated',
                description: `Order moved to ${stageLabel}.`,
            });
            return true;
        } catch (error) {
            console.error('handleUpdateFulfillmentStage error:', error);
            toast({
                title: 'Fulfillment Update Failed',
                description: error instanceof Error ? error.message : 'Unable to update order.',
                variant: 'destructive',
            });
            return false;
        }
    };

    const handleRefundOrder = async (orderId: string, input: StaffRefundSubmission) => {
        try {
            const user = auth?.currentUser;
            if (!user) throw new Error('Please sign in again.');
            const result = await refundOrderByStaff({
                orderId,
                amount: input.amount,
                destination: input.destination,
                reason: input.reason,
                reference: input.reference,
                proofUrl: input.proofUrl,
                operationId: operationFor(orderId, { refund: input }).operationId,
                idToken: await user.getIdToken(),
            });
            if (!result.success) {
                if (result.retryable) clearOperation(orderId, { refund: input });
                if (result.pending) {
                    toast({ title: 'Refund Outcome Unconfirmed', description: 'Keep the refund on hold. Use Verify Pending Refund to check the provider result.' });
                    return false;
                }
                throw new Error(result.error);
            }
            toast({
                title: result.pending ? 'Refund Pending' : 'Refund Issued',
                description: result.pending
                    ? 'PayMongo is processing the refund. You can reconcile status from Order History.'
                    : `Refund recorded (${result.reference}).`,
            });
            clearOperation(orderId, { refund: input });
            return true;
        } catch (error) {
            toast({
                title: 'Refund Failed',
                description: error instanceof Error ? error.message : 'Unable to issue refund.',
                variant: 'destructive',
            });
            return false;
        }
    };

    const handleReconcileRefund: ReconcileRefund = async (orderId, reference) => {
        try {
            const user = auth?.currentUser;
            if (!user) throw new Error('Please sign in again.');
            const result = await reconcileOrderRefundByStaff({
                orderId,
                reference,
                idToken: await user.getIdToken(),
            });
            if (!result.success) throw new Error(result.error);
            toast({
                title:
                    result.status === 'succeeded'
                        ? 'Refund Confirmed'
                        : result.status === 'pending'
                          ? 'Refund Still Pending'
                          : result.status === 'failed' ? 'Refund Confirmed Failed' : 'Refund Already Reconciled',
                description:
                    result.status === 'succeeded'
                        ? 'PayMongo confirmed the refund and order totals were updated.'
                        : result.status === 'pending'
                          ? result.requiresReference ? 'The outcome is unconfirmed. Find the refund ID in PayMongo and use Verify Pending Refund. The hold remains in place.' : 'PayMongo is still processing this refund.'
                          : 'Pending refund status was reconciled.',
            });
            return true;
        } catch (error) {
            toast({
                title: 'Reconciliation Failed',
                description: error instanceof Error ? error.message : 'Unable to reconcile refund.',
                variant: 'destructive',
            });
            return false;
        }
    };

    const handleConfirmStockReturn = async (orderId: string, notes?: string) => {
        try {
            const user = auth?.currentUser;
            if (!user) throw new Error('Please sign in again.');
            const idToken = await user.getIdToken();
            const result = await confirmOrderPhysicalStockReturn({ orderId, idToken, notes });
            if (!result.success) throw new Error(result.error);
            toast({
                title: 'Physical Stock Restored',
                description: `Physical return confirmed for order ${orderId.slice(0, 8)}. Warehouse stock has been restored.`,
            });
            return true;
        } catch (error) {
            console.error('Confirm physical stock return error:', error);
            toast({
                title: 'Stock Return Failed',
                description: error instanceof Error ? error.message : 'Unable to confirm physical stock return.',
                variant: 'destructive',
            });
            return false;
        }
    };

    const handleSweepExpiredOrders = async () => {
        setIsSweepingExpired(true);
        try {
            const user = auth?.currentUser;
            if (!user) throw new Error('Please sign in again.');
            const result = await sweepExpiredPendingOrders(await user.getIdToken());
            if (!result.success) throw new Error(result.error);
            toast({
                title: 'Expiration Sweep Complete',
                description:
                    result.cancelledCount > 0
                        ? `Auto-cancelled ${result.cancelledCount} expired unpaid online order(s) and restored stock.`
                        : `Scanned ${result.scannedCount ?? 0} pending order(s); no expired online holds found.`,
            });
            return result.cancelledCount;
        } catch (error) {
            toast({
                title: 'Sweep Failed',
                description: error instanceof Error ? error.message : 'Unable to sweep expired orders.',
                variant: 'destructive',
            });
            return 0;
        } finally {
            setIsSweepingExpired(false);
        }
    };

    const handleClearAllOrders = async (): Promise<boolean> => {
        try {
            const user = auth?.currentUser;
            if (!user) throw new Error('Please sign in again.');
            const idToken = await user.getIdToken();
            const result = await clearAllOrders({ idToken });
            if (!result.success) throw new Error(result.error);
            toast({
                title: 'Orders Purged',
                description: `Successfully removed all ${result.count ?? 0} order(s) and reservation(s) from the system.`,
            });
            return true;
        } catch (error) {
            console.error('Clear all orders failed:', error);
            toast({
                title: 'Purge Failed',
                description: error instanceof Error ? error.message : 'Unable to clear orders.',
                variant: 'destructive',
            });
            return false;
        }
    };

    const stats = useMemo(() => {
        let orderPlaced = 0;
        let assembling = 0;
        let outForDelivery = 0;
        let delivered = 0;
        let cancelled = 0;

        for (const o of orders || []) {
            if (o.isArchived) continue;
            if (o.status === 'cancelled') {
                cancelled += 1;
                continue;
            }
            const stage = getOrderFulfillmentStage(o);
            if (stage === 'order_placed') orderPlaced += 1;
            else if (stage === 'assembling_testing') assembling += 1;
            else if (stage === 'out_for_delivery') outForDelivery += 1;
            else if (stage === 'delivered') delivered += 1;
        }

        return {
            pendingOrdersCount: orderPlaced,
            completedOrdersCount: delivered,
            cancelledOrdersCount: cancelled,
            stageCounts: {
                orderPlaced,
                assembling,
                outForDelivery,
                delivered,
                cancelled,
            },
        };
    }, [orders]);

    return {
        orders,
        ordersLoading,
        hasMoreOrders: (recentOrders?.length || 0) >= orderLimit,
        loadMoreOrders: () => setOrderLimit((current) => current + 100),
        isSweepingExpired,
        handleReservationAction,
        handleUpdateOrder,
        handleUpdateOrderPaymentStatus,
        handleUpdateFulfillmentStage,
        handleConfirmStockReturn,
        handleRefundOrder,
        handleReconcileRefund,
        handleSweepExpiredOrders,
        handleClearAllOrders,
        stats,
    };
}
