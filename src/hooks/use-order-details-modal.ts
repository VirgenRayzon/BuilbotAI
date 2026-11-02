"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import {
  getOrderFulfillmentStage,
  getOrderFulfillmentStageLabel,
  getRefundedAmount,
} from "@/lib/order-workflow";
import { getPaymentStatusInfo } from "@/lib/payment-methods";
import type { Order } from "@/lib/types";

function getUnifiedStatusBadge(order: Order): { label: string; color: string } {
  if (order.status === "cancelled") {
    return { label: "Cancelled", color: "red" };
  }
  const stage = getOrderFulfillmentStage(order);
  const label = getOrderFulfillmentStageLabel(order);
  if (stage === "delivered") return { label, color: "teal" };
  if (stage === "out_for_delivery") return { label, color: "cyan" };
  if (stage === "assembling_testing") return { label, color: "blue" };
  return { label, color: "yellow" };
}

export function useOrderDetailsModal(orderId: string | null, open: boolean) {
  const firestore = useFirestore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId || !firestore) return;
      setLoading(true);
      try {
        const docSnap = await getDoc(doc(firestore, "orders", orderId));
        if (docSnap.exists()) {
          setOrder({ id: docSnap.id, ...docSnap.data() } as Order);
        }
      } catch (error) {
        console.error("Error fetching order details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (open && orderId) {
      fetchOrder();
    } else if (!open) {
      const timer = setTimeout(() => setOrder(null), 300);
      return () => clearTimeout(timer);
    }
  }, [orderId, open, firestore]);

  const statusInfo = order ? getUnifiedStatusBadge(order) : null;
  const paymentStatusInfo = order
    ? getPaymentStatusInfo(order.paymentStatus, order.paymentMethod)
    : null;
  const refundedTotal = order ? getRefundedAmount(order) : 0;

  return {
    order,
    loading,
    statusInfo,
    paymentStatusInfo,
    refundedTotal,
  };
}

