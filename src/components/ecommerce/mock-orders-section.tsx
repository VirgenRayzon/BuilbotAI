"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  Group,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  CheckCircle2,
  CreditCard,
  FastForward,
  Package,
  RotateCcw,
  Truck,
  Wrench,
} from "lucide-react";
import {
  useEcommerce,
  getEcommerceFallbackImage,
  isInvalidPlaceholderUrl,
  type FulfillmentStage,
  type MockEcommerceOrder,
} from "@/context/ecommerce-context";
import { useSiteSettings } from "@/context/site-settings-context";
import { formatCurrency, getOptimizedStorageUrl, cn } from "@/lib/utils";
import { OptimizedImage } from "@/components/ui/optimized-image";
import {
  getFulfillmentStages,
  orderRequiresAssembly,
} from "@/lib/order-fulfillment";
import {
  isShipmentCompleted,
  isShipmentInReceiveQueue,
} from "@/lib/customer-order-workflow";
import type { Order } from "@/lib/types";


function sanitizeText(val?: string) {
  if (!val) return "";
  return val
    .replace(/[\u7ab6\uff62\u30fb\u9244]+/g, "  E")
    .replace(/Center\s*\?\s*Cubao/g, "Center  ECubao")
    .replace(/Ready in 2\?4 Hours/g, "Ready in 2 E Hours")
    .replace(/3\?5 Business Days/g, "3 E Business Days")
    .replace(/\s*\(Simulated[^)]*\)/gi, "")
    .trim();
}

const STAGE_DEFINITIONS: Record<
  FulfillmentStage,
  { label: string; icon: typeof Package }
> = {
  order_placed: { label: "Order Placed", icon: Package },
  payment_verified: { label: "Payment Verified", icon: CreditCard },
  assembling_testing: { label: "Rig Assembly & QC", icon: Wrench },
  out_for_delivery: { label: "Out for Delivery", icon: Truck },
  delivered: { label: "Delivered", icon: CheckCircle2 },
};

interface MockOrdersSectionProps {
  reservations: Order[];
  onCancelReservation: (reservationId: string) => Promise<void>;
  receiveQueueOnly?: boolean;
  completedOnly?: boolean;
  hideEmptyState?: boolean;
}

export function MockOrdersSection({
  reservations,
  onCancelReservation,
  receiveQueueOnly = false,
  completedOnly = false,
  hideEmptyState = false,
}: MockOrdersSectionProps) {
  const router = useRouter();
  const { shouldCorruptImages } = useSiteSettings();
  const { orders, advanceOrderStage, resetDemoOrders, setActiveReceiptOrder } =
    useEcommerce();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const cancelledOrderIds = new Set(
    reservations
      .filter((reservation) => reservation.status === "cancelled")
      .map((reservation) => reservation.id)
  );
  const activeReservationIds = new Set(
    reservations
      .filter((reservation) => reservation.status !== "cancelled")
      .map((reservation) => reservation.id)
  );
  const visibleOrders = orders.filter(
    (order) =>
      (!order.firestoreOrderId ||
        (!cancelledOrderIds.has(order.firestoreOrderId) &&
          !activeReservationIds.has(order.firestoreOrderId))) &&
      (!receiveQueueOnly || isShipmentInReceiveQueue(order)) &&
      (!completedOnly || isShipmentCompleted(order))
  );

  return (
    <Stack gap="md">
      <Paper
        withBorder
        radius="lg"
        p="md"
        className="bg-cyan-500/5 dark:bg-cyan-500/10 border-cyan-500/30"
      >
        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          <Group gap="sm">
            <ThemeIcon size="lg" radius="md" color="cyan" variant="light">
              <Truck size={18} />
            </ThemeIcon>
            <div>
              <Group gap={6}>
                <Title order={4} className="text-sm font-bold font-headline uppercase tracking-wider">
                  Netcodex Orders & Live Courier Tracker
                </Title>
                <Badge size="xs" color="cyan" variant="filled">
                  UI Mode Active
                </Badge>
              </Group>
              <Text size="xs" c="dimmed">
                Orders placed via the Netcodex Checkout Page appear here with live LBC / Grab / Lalamove / Cubao Showroom tracking and PH payment status.
              </Text>
            </div>
          </Group>

          <Button
            size="xs"
            variant="default"
            radius="md"
            leftSection={<RotateCcw size={13} />}
            onClick={resetDemoOrders}
            className="text-[11px] font-bold uppercase tracking-wider"
          >
            Reset Sample Order
          </Button>
        </Group>
      </Paper>

      {!hideEmptyState && visibleOrders.length === 0 && (
        <Paper
          withBorder
          radius="lg"
          p="lg"
          className="bg-white dark:bg-[#121824] border-slate-200 dark:border-white/10 text-center"
        >
          <Text fw={700}>
            {completedOnly ? "No completed orders yet" : "Nothing to receive yet"}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            {completedOnly
              ? "Delivered orders will appear here for your records."
              : "Shipped orders and items currently out for delivery will appear here."}
          </Text>
        </Paper>
      )}

      {visibleOrders.map((order: MockEcommerceOrder) => {
        const stages = getFulfillmentStages(order);
        const requiresAssembly = orderRequiresAssembly(order);
        const currentStageIdx = stages.indexOf(order.fulfillmentStage);
        const canCancel =
          order.fulfillmentStage === "order_placed" &&
          Boolean(order.firestoreOrderId);
        const firstItem = order.items[0];
        const moreCount = Math.max(0, order.items.length - 1);
        const itemsSubtotal = order.subtotal ?? order.items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
        const shippingFee = order.shippingFee ?? 0;
        const protectionFee = order.protectionFee ?? 0;
        const discountAmount = order.discountAmount ?? 0;
        const vatAmount = order.vatAmount ?? 0;
        const productImage = firstItem && getOptimizedStorageUrl(
          isInvalidPlaceholderUrl(firstItem.imageUrl)
            ? getEcommerceFallbackImage(firstItem.category, firstItem.kind)
            : firstItem.imageUrl!,
          shouldCorruptImages
        );

        return (
          <Paper
            key={order.id}
            withBorder
            radius="lg"
            p="md"
            className="bg-white dark:bg-[#121824] border-slate-200 dark:border-white/10 shadow-sm space-y-4"
          >
            {/* Order code and actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-white/10">
              <div>
                <Group gap="xs">
                  <Text className="text-base font-bold font-headline tracking-tight">
                    Order #{order.orderNumber}
                  </Text>
                  <Badge size="xs" color="teal" variant="light">
                    {order.paymentStatus}
                  </Badge>
                  <Badge size="xs" color="cyan" variant="outline" className="font-mono">
                    {order.trackingNumber}
                  </Badge>
                </Group>
              </div>

              <Group gap="xs">
                <Button
                  size="xs"
                  variant="light"
                  color="cyan"
                  radius="md"
                  leftSection={<FastForward size={13} />}
                  onClick={() => advanceOrderStage(order.id)}
                  className="text-[11px] font-bold uppercase tracking-wider"
                >
                  Advance Tracking Step
                </Button>
                <Button
                  size="xs"
                  variant="default"
                  radius="md"
                  onClick={() => {
                    setActiveReceiptOrder(order);
                    router.push("/checkout");
                  }}
                  className="text-[11px] font-bold uppercase tracking-wider"
                >
                  View Receipt
                </Button>
                <Button
                  size="xs"
                  color="red"
                  variant="subtle"
                  radius="md"
                  disabled={!canCancel}
                  loading={cancellingId === order.id}
                  onClick={async () => {
                    if (!order.firestoreOrderId) return;
                    setCancellingId(order.id);
                    await onCancelReservation(order.firestoreOrderId);
                    setCancellingId(null);
                  }}
                  className="text-[11px] font-bold uppercase tracking-wider"
                >
                  Cancel order
                </Button>
              </Group>
            </div>

            <div>
              <div className="flex items-center gap-3">
                {firstItem && productImage && (
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden">
                    <OptimizedImage src={productImage} alt={firstItem.name} fill sizes="80px" className="object-contain p-2" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <Text size="sm" fw={700} className="text-slate-900 dark:text-slate-100">{firstItem?.name || "Order items"}</Text>
                  <Text size="xs" c="dimmed">{firstItem?.quantity || 1} item{(firstItem?.quantity || 1) === 1 ? "" : "s"}{moreCount > 0 ? ` · +${moreCount} more` : ""}</Text>
                </div>
                {firstItem && (
                  <Text size="sm" fw={700} className="shrink-0 text-right text-slate-900 dark:text-slate-100">
                    {formatCurrency(firstItem.price * firstItem.quantity)}
                  </Text>
                )}
              </div>
              <div className="mt-3 space-y-1.5 border-t border-slate-200 pt-2 dark:border-white/10">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <Text size="xs">Items subtotal</Text>
                  <Text size="xs" className="font-mono font-medium">{formatCurrency(itemsSubtotal)}</Text>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <Text size="xs">Shipping</Text>
                  <Text size="xs" className="font-mono font-medium">{formatCurrency(shippingFee)}</Text>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <Text size="xs">Crate &amp; foam protection</Text>
                  <Text size="xs" className="font-mono font-medium">{formatCurrency(protectionFee)}</Text>
                </div>
                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                  <Text size="xs">Discount{order.voucherCode ? ` (${order.voucherCode})` : ""}</Text>
                  <Text size="xs" className="font-mono font-medium">-{formatCurrency(discountAmount)}</Text>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <Text size="xs">Included 12% PH VAT</Text>
                  <Text size="xs" className="font-mono">{formatCurrency(vatAmount)}</Text>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-2 dark:border-white/10">
                  <Text size="xs" fw={700}>Total amount</Text>
                  <Text size="sm" fw={800} className="text-emerald-600 dark:text-emerald-400">{formatCurrency(order.total)}</Text>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 p-3 dark:border-white/10">
              <Text size="xs" fw={700}>Shipping method & ETA</Text>
              <Text size="xs" c="dimmed">{sanitizeText(order.courierName)} · {sanitizeText(order.estimatedDelivery)} · {order.trackingNumber}</Text>
            </div>

            {/* Order-aware shipment stepper */}
            <div
              className={cn(
                "grid grid-cols-2 gap-2",
                stages.length === 5 ? "sm:grid-cols-5" : "sm:grid-cols-4"
              )}
            >
              {stages.map((stageId, idx) => {
                const stage = STAGE_DEFINITIONS[stageId];
                const stageLabel =
                  !requiresAssembly && stageId === "payment_verified"
                    ? "Shipped"
                    : stage.label;
                const Icon = stage.icon;
                const isCompleted = idx <= currentStageIdx;
                const isCurrent = idx === currentStageIdx;
                return (
                  <div
                    key={stageId}
                    className={cn(
                      "p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1",
                      isCurrent
                        ? "bg-cyan-500/15 border-cyan-500 text-cyan-600 dark:text-cyan-300 shadow-xs"
                        : isCompleted
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                          : "bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/5 text-slate-400 opacity-60"
                    )}
                  >
                    <Icon size={16} />
                    <span className="text-[10px] font-headline font-bold uppercase tracking-wider leading-tight">
                      {stageLabel}
                    </span>
                  </div>
                );
              })}
            </div>

            {order.fulfillmentStage === "delivered" && (
              <Group justify="flex-end">
                <Button size="xs" variant="light" onClick={() => router.push(`/contact?order=${encodeURIComponent(order.orderNumber)}`)}>Request refund</Button>
              </Group>
            )}
          </Paper>
        );
      })}
    </Stack>
  );
}
