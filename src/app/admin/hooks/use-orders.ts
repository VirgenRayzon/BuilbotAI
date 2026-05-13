"use client";

import { useMemo } from 'react';
import { useFirestore } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, doc, deleteDoc } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { updateReservationStatus } from '@/app/checkout-actions';
import { createAuditLog } from '@/firebase/audit';

/**
 * Hook to manage customer reservations and orders.
 */
export function useOrders(profile: any) {
    const firestore = useFirestore();
    const { toast } = useToast();

    const ordersQuery = useMemo(() => firestore ? collection(firestore, 'orders') : null, [firestore]);
    const { data: orders, loading: ordersLoading } = useCollection<Order>(ordersQuery);

    const handleDeleteOrder = async (orderId: string) => {
        if (!firestore) return;
        if (!window.confirm("Are you sure you want to delete this reservation? This cannot be undone.")) return;

        try {
            await deleteDoc(doc(firestore, "orders", orderId));
            await createAuditLog(firestore, {
                actionName: 'deleted',
                actorId: profile?.id || 'unknown',
                actorName: profile?.name || profile?.email || 'Unknown User',
                actorEmail: profile?.email,
                resourceType: 'Order',
                resourceName: `Order ${orderId.substring(0, 8)}`,
                resourceId: orderId,
                details: 'Deleted reservation'
            });
            toast({
                title: "Reservation Deleted",
                description: "The reservation has been permanently removed.",
            });
        } catch (error) {
            console.error("Error deleting order:", error);
            toast({
                title: "Error",
                description: "Failed to delete the reservation.",
                variant: "destructive"
            });
        }
    };

    const handleUpdateOrder = async (orderId: string, newStatus: Order['status']) => {
        if (!firestore) return;
        try {
            const actorInfo = profile ? {
                id: profile.id,
                name: profile.name || profile.email,
                isManager: profile.isManager,
                isSuperAdmin: profile.isSuperAdmin
            } : undefined;

            const result = await updateReservationStatus(orderId, newStatus, actorInfo);
            if (result.success) {
                await createAuditLog(firestore, {
                    actionName: 'status_changed',
                    actorId: profile?.id || 'unknown',
                    actorName: profile?.name || profile?.email || 'Unknown User',
                    actorEmail: profile?.email,
                    resourceType: 'Order',
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
        pendingOrdersCount: orders?.filter(o => o.status === 'pending').length || 0,
        completedOrdersCount: orders?.filter(o => o.status === 'finished building').length || 0,
        cancelledOrdersCount: orders?.filter(o => o.status === 'cancelled').length || 0,
    }), [orders]);

    return {
        orders,
        ordersLoading,
        handleDeleteOrder,
        handleUpdateOrder,
        stats
    };
}
