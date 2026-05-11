"use client";

import { useState, useEffect, useMemo } from 'react';
import { useUserProfile } from "@/context/user-profile";
import { useFirestore } from "@/firebase";
import { collection, query, where, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { Order } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { updateReservationStatus } from "@/app/checkout-actions";

/**
 * Hook to manage user reservations (fetching, cancelling, deleting).
 */
export function useReservations() {
    const { authUser, loading: userLoading } = useUserProfile();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [reservations, setReservations] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authUser || !firestore) {
            if (!userLoading) setLoading(false);
            return;
        }

        setLoading(true);
        const q = query(
            collection(firestore, "orders"),
            where("userId", "==", authUser.uid)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedOrders: Order[] = [];
            querySnapshot.forEach((doc) => {
                fetchedOrders.push({ id: doc.id, ...doc.data() } as Order);
            });

            fetchedOrders.sort((a, b) => {
                const dateA = a.createdAt?.toDate?.() || 0;
                const dateB = b.createdAt?.toDate?.() || 0;
                return new Date(dateB).getTime() - new Date(dateA).getTime();
            });

            setReservations(fetchedOrders);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching reservations:", error);
            toast({ title: "Error", description: "Failed to load reservations.", variant: "destructive" });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [authUser, firestore, userLoading, toast]);

    const handleCancelReservation = async (reservationId: string) => {
        if (!firestore) return;
        try {
            const result = await updateReservationStatus(reservationId, 'cancelled');
            if (result.success) {
                toast({ title: "Reservation Cancelled", description: "Order has been cancelled." });
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error("Error cancelling reservation:", error);
            toast({ title: "Error", description: "Failed to cancel reservation.", variant: "destructive" });
        }
    };

    const handleDeleteReservation = async (reservationId: string) => {
        if (!firestore) return;
        try {
            await deleteDoc(doc(firestore, "orders", reservationId));
            toast({ title: "Reservation Removed", description: "Order record deleted." });
        } catch (error) {
            console.error("Error deleting reservation:", error);
            toast({ title: "Error", description: "Failed to delete record.", variant: "destructive" });
        }
    };

    const stats = useMemo(() => {
        const totalValue = reservations.reduce((sum, r) => sum + (r.totalPrice || 0), 0);
        return {
            totalBuilds: reservations.length,
            totalValue: totalValue,
            activeBuilds: reservations.filter(r => r.status === 'pending' || r.status === 'building').length
        };
    }, [reservations]);

    return {
        reservations,
        loading,
        handleCancelReservation,
        handleDeleteReservation,
        stats
    };
}
