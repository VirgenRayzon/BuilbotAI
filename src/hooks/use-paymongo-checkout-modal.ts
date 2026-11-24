"use client";

import { useEffect, useState } from "react";
import {
  createOrderPaymongoCheckoutSession,
  switchOrderPaymentToCod,
  verifyAndSyncPaymongoOrder,
} from "@/app/checkout-actions";
import type { PaymentStatus, SimulatedPaymentOutcome } from "@/lib/types";
import { useUserProfile } from "@/context/user-profile";
import { useToast } from "@/hooks/use-toast";

export interface PaymongoModalOrderInput {
  orderId: string;
  orderNumber: string;
  totalPrice: number;
  paymentReference?: string | null;
  itemCount?: number;
  paymongoCheckoutSessionId?: string | null;
  paymongoCheckoutUrl?: string | null;
  paymongoMode?: "live_test_api" | "local_sandbox_fallback";
}

export interface PaymongoOutcomeResolution {
  outcome: SimulatedPaymentOutcome;
  paymentStatus: PaymentStatus;
  paymentReference: string | null;
  paidAt: string | null;
  paymentChannel?: string;
}

interface UsePaymongoCheckoutModalOptions {
  order: PaymongoModalOrderInput | null;
  onClose: () => void;
  onOutcomeResolved?: (result: PaymongoOutcomeResolution) => void;
}

export function usePaymongoCheckoutModal({
  order,
  onClose,
  onOutcomeResolved,
}: UsePaymongoCheckoutModalOptions) {
  const { authUser } = useUserProfile();
  const { toast } = useToast();
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isVerifyingSession, setIsVerifyingSession] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isSwitchingCod, setIsSwitchingCod] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(
    order?.paymongoCheckoutUrl ?? null
  );
  const [sessionId, setSessionId] = useState<string | null>(
    order?.paymongoCheckoutSessionId ?? null
  );
  const [sessionMode, setSessionMode] = useState<
    "live_test_api" | "local_sandbox_fallback" | undefined
  >(order?.paymongoMode);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setCheckoutUrl(order?.paymongoCheckoutUrl ?? null);
    setSessionId(order?.paymongoCheckoutSessionId ?? null);
    setSessionMode(order?.paymongoMode);
    setErrorMessage(null);
  }, [
    order?.orderId,
    order?.paymongoCheckoutUrl,
    order?.paymongoCheckoutSessionId,
    order?.paymongoMode,
  ]);

  const isBusy =
    isCreatingSession || isVerifyingSession || isCancelling || isSwitchingCod;

  const handleOpenPaymongoHostedCheckout = async () => {
    if (!order || isBusy) return;
    setErrorMessage(null);

    if (checkoutUrl) {
      window.open(checkoutUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if (!authUser) {
      setErrorMessage("Please sign in to launch PayMongo Checkout.");
      return;
    }

    setIsCreatingSession(true);
    try {
      const idToken = await authUser.getIdToken();
      const origin =
        typeof window !== "undefined" ? window.location.origin : undefined;
      const res = await createOrderPaymongoCheckoutSession(
        order.orderId,
        idToken,
        origin
      );

      if (!res.success) {
        setErrorMessage(
          res.error || "Unable to create PayMongo Checkout Session."
        );
        return;
      }

      setSessionId(res.paymongoCheckoutSessionId ?? null);
      setCheckoutUrl(res.paymongoCheckoutUrl ?? null);
      setSessionMode(res.paymongoMode);

      if (res.paymongoCheckoutUrl) {
        window.open(res.paymongoCheckoutUrl, "_blank", "noopener,noreferrer");
        toast({
          title: "PayMongo Checkout Opened",
          description:
            "Complete payment in the PayMongo tab, then click Verify Payment Status below.",
        });
      } else {
        setErrorMessage(
          "PayMongo gateway credentials are not configured on this server. You can switch this order to Cash on Delivery below."
        );
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Failed to initialize PayMongo Checkout Session."
      );
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleVerifyLivePaymongoStatus = async () => {
    if (!order || isBusy || !authUser) return;
    setErrorMessage(null);
    setIsVerifyingSession(true);
    try {
      const idToken = await authUser.getIdToken();
      const res = await verifyAndSyncPaymongoOrder({
        orderId: order.orderId,
        idToken,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Could not verify PayMongo status.");
        return;
      }

      if (res.paymentStatus === "paid") {
        toast({
          title: "PayMongo Payment Verified",
          description: `Order ${order.orderNumber} is confirmed Paid (Ref: ${res.paymentReference}).`,
        });
        onOutcomeResolved?.({
          outcome: "success",
          paymentStatus: "paid",
          paymentReference:
            res.paymentReference ?? order.paymentReference ?? null,
          paidAt: res.paidAt ?? new Date().toISOString(),
          paymentChannel: "paymongo",
        });
        onClose();
      } else if (res.paymentStatus === "failed") {
        toast({
          title: "PayMongo Payment Failed",
          description: "PayMongo reported a declined or failed payment.",
          variant: "destructive",
        });
        onOutcomeResolved?.({
          outcome: "failed",
          paymentStatus: "failed",
          paymentReference:
            res.paymentReference ?? order.paymentReference ?? null,
          paidAt: null,
          paymentChannel: "paymongo",
        });
        onClose();
      } else {
        toast({
          title: "Payment Still Pending",
          description:
            "PayMongo has not recorded a completed payment yet. Complete checkout in the PayMongo tab first.",
        });
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Unexpected error verifying PayMongo session."
      );
    } finally {
      setIsVerifyingSession(false);
    }
  };

  const handleCancelCheckout = async () => {
    if (!order || isBusy) return;
    if (!authUser) {
      onClose();
      return;
    }
    setIsCancelling(true);
    try {
      const idToken = await authUser.getIdToken();
      const res = await verifyAndSyncPaymongoOrder({
        orderId: order.orderId,
        idToken,
        redirectHint: "cancelled",
      });
      if (res.success && res.paymentStatus) {
        onOutcomeResolved?.({
          outcome: res.paymentStatus === "paid" ? "success" : "cancelled",
          paymentStatus: res.paymentStatus,
          paymentReference:
            res.paymentReference ?? order.paymentReference ?? null,
          paidAt: res.paidAt ?? null,
        });
      }
      onClose();
    } finally {
      setIsCancelling(false);
    }
  };

  const handleSwitchToCod = async () => {
    if (!order || isBusy || !authUser) return;
    setErrorMessage(null);
    setIsSwitchingCod(true);
    try {
      const idToken = await authUser.getIdToken();
      const res = await switchOrderPaymentToCod(order.orderId, idToken);
      if (!res.success) {
        setErrorMessage(
          res.error || "Could not switch order to Cash on Delivery."
        );
        return;
      }
      toast({
        title: "Switched to Cash on Delivery",
        description: `Order ${order.orderNumber} will be collected upon delivery or pickup.`,
      });
      onOutcomeResolved?.({
        outcome: "cancelled",
        paymentStatus: "unpaid",
        paymentReference: res.paymentReference ?? null,
        paidAt: null,
      });
      onClose();
    } finally {
      setIsSwitchingCod(false);
    }
  };

  return {
    isCreatingSession,
    isVerifyingSession,
    isCancelling,
    isSwitchingCod,
    isBusy,
    checkoutUrl,
    sessionId,
    sessionMode,
    errorMessage,
    handleOpenPaymongoHostedCheckout,
    handleVerifyLivePaymongoStatus,
    handleCancelCheckout,
    handleSwitchToCod,
  };
}

