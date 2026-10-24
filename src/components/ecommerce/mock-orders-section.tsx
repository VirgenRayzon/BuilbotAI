"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  CheckCircle2,
  CreditCard,
  FastForward,
  MapPin,
  Package,
  RotateCcw,
  ShieldCheck,
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

const STAGES: Array<{ id: FulfillmentStage; label: string; icon: any }> = [
  { id: "order_placed", label: "Order Placed", icon: Package },
  { id: "payment_verified", label: "Payment Verified", icon: CreditCard },
  { id: "assembling_testing", label: "Rig Assembly & QC", icon: Wrench },
  { id: "out_for_delivery", label: "Out for Delivery", icon: Truck },
  { id: "delivered", label: "Delivered", icon: CheckCircle2 },
];

export function MockOrdersSection() {
  const router = useRouter();
  const { shouldCorruptImages } = useSiteSettings();
  const { orders, advanceOrderStage, resetDemoOrders, setActiveReceiptOrder } =
    useEcommerce();

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
                Orders placed via the Netcodex Checkout Page appear here with simulated LBC / Grab / Lalamove / Cubao Showroom tracking and PH payment status.
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

      {orders.map((order: MockEcommerceOrder) => {
        const currentStageIdx = STAGES.findIndex((s) => s.id === order.fulfillmentStage);

        return (
          <Paper
            key={order.id}
            withBorder
            radius="lg"
            p="md"
            className="bg-white dark:bg-[#121824] border-slate-200 dark:border-white/10 shadow-sm space-y-4"
          >
            {/* Top Order Header */}
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
                <Text size="xs" c="dimmed" mt={2}>
                  {order.courierName} • ETA: <strong>{order.estimatedDelivery}</strong> • Paid via{" "}
                  <strong>{order.paymentLabel}</strong>
                </Text>
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
                  Simulate Next Tracking Step
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
              </Group>
            </div>

            {/* 5-Stage Visual Shipment Stepper */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {STAGES.map((stage, idx) => {
                const Icon = stage.icon;
                const isCompleted = idx <= currentStageIdx;
                const isCurrent = idx === currentStageIdx;
                return (
                  <div
                    key={stage.id}
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
                      {stage.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Address & Items Summary */}
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
              <Paper withBorder radius="md" p="sm" className="bg-slate-50/70 dark:bg-white/[0.02] border-slate-200 dark:border-white/10">
                <Group gap={6} mb={4}>
                  <MapPin size={13} className="text-cyan-500" />
                  <Text size="10px" fw={800} tt="uppercase" c="dimmed">
                    {order.shippingMethod === "store_pickup"
                      ? "Netcodex Showroom Pickup Location"
                      : "Shipping Destination"}
                  </Text>
                </Group>
                <Text size="xs" fw={700}>
                  {order.shippingAddress.fullName} ({order.shippingAddress.phone})
                </Text>
                <Text size="xs" c="dimmed">
                  {order.shippingAddress.streetAddress}, {order.shippingAddress.barangay},{" "}
                  {order.shippingAddress.city}, {order.shippingAddress.region}{" "}
                  {order.shippingAddress.postalCode}
                </Text>
              </Paper>

              <Paper withBorder radius="md" p="sm" className="bg-slate-50/70 dark:bg-white/[0.02] border-slate-200 dark:border-white/10">
                <Group justify="space-between" mb={4}>
                  <Group gap={6}>
                    <ShieldCheck size={13} className="text-emerald-500" />
                    <Text size="10px" fw={800} tt="uppercase" c="dimmed">
                      Order Items & Total
                    </Text>
                  </Group>
                  <Text size="sm" fw={900} ff="monospace" className="text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(order.total)}
                  </Text>
                </Group>
                <div className="space-y-1.5">
                  {order.items.map((item) => {
                    const fallbackImg = getEcommerceFallbackImage(item.category, item.kind);
                    const rawImg = isInvalidPlaceholderUrl(item.imageUrl) ? fallbackImg : item.imageUrl!;
                    const resolvedImg =
                      getOptimizedStorageUrl(rawImg, shouldCorruptImages) || fallbackImg;
                    return (
                      <div key={item.id} className="flex items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded border border-slate-200 bg-white dark:border-white/10 dark:bg-[#0e131d]">
                            <OptimizedImage src={resolvedImg} alt={item.name} fill sizes="28px" className="object-contain p-0.5" />
                          </div>
                          <span className="truncate font-medium">
                            {item.quantity}x {item.name}
                          </span>
                        </div>
                        <span className="font-mono text-slate-500 shrink-0 ml-2">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Paper>
            </SimpleGrid>
          </Paper>
        );
      })}
    </Stack>
  );
}
