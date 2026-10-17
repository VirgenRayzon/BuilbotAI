"use client";

import { useMemo } from 'react';
import { useAuth, useFirestore } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { Order, UserProfile } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { updateReservationStatus } from '@/app/checkout-actions';
import { createAuditLog } from '@/firebase/audit';
import { manageReservation } from '../reservation-actions';

/**
 * Hook to manage customer reservations and orders.
 */
export function useOrders(profile: UserProfile | null) {
    const firestore = useFirestore();
    const auth = useAuth();
    const { toast } = useToast();

    const ordersQuery = useMemo(() => {
        if (!firestore) return null;
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
        return query(
            collection(firestore, 'orders'),
            where('createdAt', '>=', twelveMonthsAgo),
            orderBy('createdAt', 'desc')
        );
    }, [firestore]);
    const archivedOrdersQuery = useMemo(() => firestore
        ? query(collection(firestore, 'orders'), where('isArchived', '==', true))
        : null, [firestore]);
    const { data: recentOrders, loading: recentOrdersLoading } = useCollection<Order>(ordersQuery);
    const { data: archivedOrders, loading: archivedOrdersLoading } = useCollection<Order>(archivedOrdersQuery);
    const orders = useMemo(() => {
        const byId = new Map<string, Order>();
        for (const order of recentOrders || []) byId.set(order.id, order);
        for (const order of archivedOrders || []) byId.set(order.id, order);
        return Array.from(byId.values());
    }, [recentOrders, archivedOrders]);
    const ordersLoading = recentOrdersLoading || archivedOrdersLoading;

    const handleReservationAction = async (orderId: string, action: 'archive' | 'restore' | 'delete') => {
        try {
            const user = auth?.currentUser;
            if (!user) throw new Error('Please sign in again.');
            const idToken = await user.getIdToken();
            const result = await manageReservation({ orderId, action, idToken });
            if (!result.success) throw new Error(result.error);
            const label = action === 'archive' ? 'Archived' : action === 'restore' ? 'Restored' : 'Deleted';
            toast({
                title: `Reservation ${label}`,
                description: action === 'delete' ? 'The reservation has been permanently removed.' : `The reservation has been ${label.toLowerCase()}.`,
            });
            return true;
        } catch (error) {
            console.error(`Error performing reservation ${action}:`, error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : 'Reservation action failed.',
                variant: "destructive"
            });
            return false;
        }
    };

    const handleUpdateOrder = async (orderId: string, newStatus: Order['status']) => {
        if (!firestore) return;
        try {
            const user = auth?.currentUser;
            if (!user) throw new Error('Please sign in again.');
            const result = await updateReservationStatus(orderId, newStatus, await user.getIdToken());
            if (result.success) {
                await createAuditLog(firestore, {
                    actionName: 'status_changed',
                    actorId: profile?.id || 'unknown',
                    actorName: profile?.name || profile?.email || 'Unknown User',
                    actorEmail: profile?.email,
                    scope: 'Order',
                    resourceName: `Order ${orderId.substring(0, 8)}`,
                    resourceId: orderId,
                    details: `Status changed to ${newStatus}`
                });
                toast({
                    title: "Status Updated",
                    description: `Order ${orderId.substring(0, 8)} status changed to ${newStatus}.`,
                });
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error("Error updating order status:", error);
            toast({
                title: "Update Failed",
                description: error instanceof Error ? error.message : "Failed to update order status.",
                variant: "destructive"
            });
        }
    };

    const stats = useMemo(() => ({
        pendingOrdersCount: orders?.filter(o => !o.isArchived && o.status === 'pending').length || 0,
        completedOrdersCount: orders?.filter(o => o.status === 'finished building').length || 0,
        cancelledOrdersCount: orders?.filter(o => o.status === 'cancelled').length || 0,
    }), [orders]);

    return {
        orders,
        ordersLoading,
        handleReservationAction,
        handleUpdateOrder,
        stats
    };
}
