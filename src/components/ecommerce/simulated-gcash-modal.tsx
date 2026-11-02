"use client";

import React, { useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Divider,
  Group,
  Modal,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  AlertTriangle,
  CheckCircle2,
  FlaskConical,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { resolveSimulatedPayment } from "@/app/checkout-actions";
import type { PaymentStatus, SimulatedPaymentOutcome } from "@/lib/types";
import { useUserProfile } from "@/context/user-profile";
import { useToast } from "@/hooks/use-toast";

export interface SimulatedGcashModalOrderInfo {
  orderId: string;
  orderNumber: string;
  totalPrice: number;
  paymentReference?: string | null;
  itemCount?: number;
}

interface SimulatedGcashModalProps {
  opened: boolean;
  onClose: () => void;
  order: SimulatedGcashModalOrderInfo | null;
  onOutcomeResolved?: (result: {
    outcome: SimulatedPaymentOutcome;
    paymentStatus: PaymentStatus;
    paymentReference: string | null;
    paidAt: string | null;
  }) => void;
}

export function SimulatedGcashModal({
  opened,
  onClose,
  order,
  onOutcomeResolved,
}: SimulatedGcashModalProps) {
  const { authUser } = useUserProfile();
  const { toast } = useToast();
  const [submittingOutcome, setSubmittingOutcome] =
    useState<SimulatedPaymentOutcome | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!order) return null;

  const handleSimulateOutcome = async (outcome: SimulatedPaymentOutcome) => {
    if (submittingOutcome) return;
    setErrorMessage(null);

    if (!authUser) {
      setErrorMessage("Please sign in to complete payment.");
      onClose();
      return;
    }

    setSubmittingOutcome(outcome);
    try {
      const idToken = await authUser.getIdToken();
      const response = await resolveSimulatedPayment({
        orderId: order.orderId,
        outcome,
        idToken,
      });

      if (!response.success || !response.paymentStatus) {
        setErrorMessage(
          response.error || "Could not process payment."
        );
        return;
      }

      if (outcome === "success") {
        toast({
          title: "GCash Payment Successful",
          description: `Order ${order.orderNumber} is now marked as Paid (Ref: ${response.paymentReference}).`,
        });
      } else if (outcome === "failed") {
        toast({
          title: "GCash Payment Failed",
          description: `Order ${order.orderNumber} payment was marked as Failed. You can retry anytime from Order History.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "GCash Payment Cancelled",
          description: `Payment for Order ${order.orderNumber} was cancelled.`,
        });
      }

      onOutcomeResolved?.({
        outcome,
        paymentStatus: response.paymentStatus,
        paymentReference: response.paymentReference ?? order.paymentReference ?? null,
        paidAt: response.paidAt ?? null,
      });
      onClose();
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during payment."
      );
    } finally {
      setSubmittingOutcome(null);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={() => {
        if (!submittingOutcome) {
          void handleSimulateOutcome("failed");
        }
      }}
      size="md"
      radius="md"
      centered
      closeOnClickOutside={!submittingOutcome}
      closeOnEscape={!submittingOutcome}
      zIndex={100005}
      overlayProps={{ backgroundOpacity: 0.6, blur: 4 }}
      title={
        <Group gap="sm">
          <ThemeIcon size="lg" radius="md" color="blue" variant="filled">
            <Smartphone size={18} />
          </ThemeIcon>
          <div>
            <Group gap={6}>
              <Title
                order={4}
                className="font-headline text-base font-bold"
              >
                GCash Express Checkout
              </Title>
              <Badge
                size="xs"
                color="amber"
                variant="filled"
                className="uppercase text-[9px] font-bold"
              >
                Test Gateway
              </Badge>
            </Group>
            <Text size="xs" c="dimmed">
              Fast & Secure Mobile Wallet Checkout
            </Text>
          </div>
        </Group>
      }
      classNames={{
        content:
          "bg-white dark:bg-[#111722] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 shadow-xl rounded-xl overflow-hidden",
        header:
          "bg-blue-600/5 dark:bg-blue-950/20 border-b border-slate-200 dark:border-white/10 px-5 py-3.5",
        body: "p-5",
      }}
    >
      <Stack gap="md">
        <Alert
          color="blue"
          variant="light"
          radius="md"
          icon={<FlaskConical size={18} />}
          title="GCash Payment Gateway"
          className="border border-blue-500/20 text-xs"
        >
          <Text size="xs" className="leading-relaxed">
            Complete your GCash payment confirmation. Choose an outcome to proceed with your order.
          </Text>
        </Alert>

        <Paper
          withBorder
          radius="md"
          p="md"
          className="bg-slate-50/70 dark:bg-white/[0.02] border-slate-200 dark:border-white/10 space-y-2.5"
        >
          <Group justify="space-between" align="center">
            <Text size="xs" c="dimmed" fw={600} tt="uppercase">
              Merchant
            </Text>
            <Group gap={6}>
              <ShieldCheck size={14} className="text-blue-500" />
              <Text size="xs" fw={700}>
                BuildbotAI / Netcodex Center
              </Text>
            </Group>
          </Group>

          <Group justify="space-between" align="center">
            <Text size="xs" c="dimmed" fw={600} tt="uppercase">
              Order Number
            </Text>
            <Text size="xs" fw={700} ff="monospace">
              {order.orderNumber}
            </Text>
          </Group>

          {order.paymentReference && (
            <Group justify="space-between" align="center">
              <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                Reference ID
              </Text>
              <Text size="xs" fw={700} ff="monospace" className="text-blue-600 dark:text-blue-400">
                {order.paymentReference}
              </Text>
            </Group>
          )}

          <Divider className="border-slate-200 dark:border-white/10" />

          <Group justify="space-between" align="baseline">
            <div>
              <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                Total Amount Due
              </Text>
              {order.itemCount !== undefined && (
                <Text size="11px" c="dimmed">
                  {order.itemCount} items reserved
                </Text>
              )}
            </div>
            <Text
              size="xl"
              fw={800}
              ff="monospace"
              className="text-blue-600 dark:text-blue-400"
            >
              {formatCurrency(order.totalPrice)}
            </Text>
          </Group>
        </Paper>

        {errorMessage && (          <Alert
            color="red"
            variant="light"
            radius="md"
            icon={<AlertTriangle size={16} />}
            className="border border-red-500/20 text-xs"
          >
            <Text size="xs">{errorMessage}</Text>
          </Alert>
        )}

        <div className="space-y-2.5 pt-1">
          <Text size="xs" fw={700} tt="uppercase" c="dimmed">
            Complete Payment
          </Text>

          <Button
            fullWidth
            size="md"
            radius="md"
            color="blue"
            loading={submittingOutcome === "success"}
            disabled={Boolean(submittingOutcome && submittingOutcome !== "success")}
            leftSection={<CheckCircle2 size={16} />}
            onClick={() => handleSimulateOutcome("success")}
            className="font-semibold text-xs"
          >
            Confirm & Pay ({formatCurrency(order.totalPrice)})
          </Button>

          <Button
            fullWidth
            size="sm"
            radius="md"
            color="gray"
            variant="default"
            loading={submittingOutcome === "failed"}
            disabled={Boolean(submittingOutcome && submittingOutcome !== "failed")}
            onClick={() => handleSimulateOutcome("failed")}
          >
            Cancel
          </Button>
        </div>
      </Stack>
    </Modal>
  );
}
