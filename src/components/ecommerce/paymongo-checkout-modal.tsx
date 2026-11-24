"use client";

import React from "react";
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
  Banknote,
  CreditCard,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  usePaymongoCheckoutModal,
  type PaymongoModalOrderInput,
  type PaymongoOutcomeResolution,
} from "@/hooks/use-paymongo-checkout-modal";

export type SimulatedPaymongoModalOrderInfo = PaymongoModalOrderInput;

interface SimulatedPaymongoModalProps {
  opened: boolean;
  onClose: () => void;
  order: SimulatedPaymongoModalOrderInfo | null;
  onOutcomeResolved?: (result: PaymongoOutcomeResolution) => void;
}

export function SimulatedPaymongoModal({
  opened,
  onClose,
  order,
  onOutcomeResolved,
}: SimulatedPaymongoModalProps) {
  const {
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
  } = usePaymongoCheckoutModal({
    order,
    onClose,
    onOutcomeResolved,
  });

  if (!order) return null;

  return (
    <Modal
      opened={opened}
      onClose={() => {
        if (!isBusy) onClose();
      }}
      size="md"
      radius="lg"
      centered
      closeOnClickOutside={!isBusy}
      closeOnEscape={!isBusy}
      zIndex={100005}
      overlayProps={{ backgroundOpacity: 0.6, blur: 4 }}
      title={
        <Group gap="sm">
          <ThemeIcon size="lg" radius="md" color="teal" variant="filled">
            <CreditCard size={18} />
          </ThemeIcon>
          <div>
            <Group gap={6}>
              <Title order={4} className="font-headline text-base font-bold">
                PayMongo Checkout
              </Title>
              <Badge
                size="xs"
                color="teal"
                variant="filled"
                className="uppercase text-[9px] font-bold"
              >
                {sessionMode === "live_test_api" || checkoutUrl
                  ? "Gateway Active"
                  : "Online Gateway"}
              </Badge>
            </Group>
            <Text size="xs" c="dimmed">
              Card, Maya, QRPh & E-Wallets
            </Text>
          </div>
        </Group>
      }
      classNames={{
        content:
          "bg-white dark:bg-[#111722] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 shadow-xl rounded-xl overflow-hidden",
        header:
          "bg-white dark:bg-[#111722] border-b border-slate-200 dark:border-white/10 p-3",
        body: "!p-3",
      }}
    >
      <Stack gap="md">
        <Paper
          withBorder
          radius="md"
          p="sm"
          className="bg-slate-50/70 dark:bg-white/[0.02] border-slate-200 dark:border-white/10 space-y-2"
        >
          <Group justify="space-between" align="center">
            <Text size="xs" c="dimmed" fw={600} tt="uppercase">
              Merchant
            </Text>
            <Group gap={6}>
              <ShieldCheck size={14} className="text-emerald-500" />
              <Text size="xs" fw={700}>
                BuildbotAI / Netcodex
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
                Reference
              </Text>
              <Text
                size="xs"
                fw={700}
                ff="monospace"
                className="text-emerald-600 dark:text-emerald-400"
              >
                {order.paymentReference}
              </Text>
            </Group>
          )}

          {sessionId && (
            <Group justify="space-between" align="center">
              <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                Session ID
              </Text>
              <Text
                size="11px"
                fw={600}
                ff="monospace"
                c="dimmed"
                className="truncate max-w-[200px]"
              >
                {sessionId}
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
                  {order.itemCount} item(s) reserved for 1 hour
                </Text>
              )}
            </div>
            <Text
              size="xl"
              fw={800}
              ff="monospace"
              className="text-emerald-600 dark:text-emerald-400"
            >
              {formatCurrency(order.totalPrice)}
            </Text>
          </Group>
        </Paper>

        <Paper
          withBorder
          radius="md"
          p="sm"
          className="bg-emerald-500/5 dark:bg-emerald-950/15 border-emerald-500/25 space-y-2"
        >
          <Group justify="space-between" align="center">
            <Text size="xs" fw={700}>
              Hosted PayMongo Checkout
            </Text>
            <Badge size="xs" color="teal" variant="light">
              Test Card: 4343 4343 4343 4343
            </Badge>
          </Group>
          <Text size="11px" c="dimmed">
            Payments are verified directly with PayMongo Checkout Sessions and
            signed webhooks.
          </Text>
        </Paper>

        {errorMessage && (
          <Alert
            color="red"
            variant="light"
            radius="md"
            icon={<AlertTriangle size={16} />}
            className="border border-red-500/20 text-xs"
          >
            <Text size="xs">{errorMessage}</Text>
          </Alert>
        )}

        <Stack gap="xs">
          <Button
            fullWidth
            radius="md"
            color="teal"
            loading={isCreatingSession}
            disabled={isBusy && !isCreatingSession}
            leftSection={<ExternalLink size={16} />}
            onClick={handleOpenPaymongoHostedCheckout}
            className="min-h-11 font-semibold text-xs"
          >
            {checkoutUrl
              ? `Open PayMongo Checkout (${formatCurrency(order.totalPrice)})`
              : "Launch PayMongo Checkout Session"}
          </Button>

          <Button
            fullWidth
            radius="md"
            color="cyan"
            variant="light"
            loading={isVerifyingSession}
            disabled={isBusy && !isVerifyingSession}
            leftSection={<RefreshCw size={16} />}
            onClick={handleVerifyLivePaymongoStatus}
            className="min-h-11 font-semibold text-xs"
          >
            Verify Payment Status
          </Button>

          <Group grow gap="xs">
            <Button
              radius="md"
              color="gray"
              variant="light"
              loading={isSwitchingCod}
              disabled={isBusy && !isSwitchingCod}
              leftSection={<Banknote size={14} />}
              onClick={handleSwitchToCod}
              className="min-h-11 text-xs"
            >
              Switch to COD
            </Button>
            <Button
              radius="md"
              color="gray"
              variant="default"
              loading={isCancelling}
              disabled={isBusy && !isCancelling}
              onClick={handleCancelCheckout}
              className="min-h-11 text-xs"
            >
              Cancel Checkout
            </Button>
          </Group>
        </Stack>
      </Stack>
    </Modal>
  );
}
