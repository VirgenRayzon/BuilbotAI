"use client";

import React from "react";
import Link from "next/link";
import {
  Alert,
  Badge,
  Button,
  Divider,
  Group,
  Paper,
  SimpleGrid,
  Text,
} from "@mantine/core";
import { AlertTriangle, ArrowRight, CheckCircle2, RefreshCw } from "lucide-react";
import {
  getEcommerceFallbackImage,
  isInvalidPlaceholderUrl,
  type MockEcommerceOrder,
} from "@/context/ecommerce-context";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { formatCurrency, getOptimizedStorageUrl } from "@/lib/utils";
import { NETCODEX_STORE_LOCATION } from "../checkout-constants";

interface CheckoutOrderConfirmationProps {
  order: MockEcommerceOrder;
  isAuthenticated: boolean;
  shouldCorruptImages: boolean;
  isSubmitting: boolean;
  onRetryPayment: () => void;
  onSwitchToCod: () => void;
  onContinueShopping: () => void;
  onViewOrderHistory: () => void;
}

export function CheckoutOrderConfirmation({
  order,
  isAuthenticated,
  shouldCorruptImages,
  isSubmitting,
  onRetryPayment,
  onSwitchToCod,
  onContinueShopping,
  onViewOrderHistory,
}: CheckoutOrderConfirmationProps) {
  const isPaymentIssue =
    order.paymentStatus === "Payment Failed" ||
    order.paymentStatus === "Payment Cancelled";

  return (
    <div className="w-full space-y-6">
      {isPaymentIssue ? (
        <Alert
          color="red"
          variant="light"
          radius="md"
          icon={<AlertTriangle size={20} />}
          title={`Order ${order.orderNumber} — ${order.paymentStatus}`}
          className="border border-red-500/20"
        >
          <div className="space-y-3">
            <Text size="xs" className="leading-relaxed">
              Your order is reserved, but the{" "}
              {order.paymentMethod === "paymongo_simulated"
                ? "PayMongo"
                : "GCash"}{" "}
              payment was{" "}
              <strong>
                {order.paymentStatus === "Payment Failed" ? "declined" : "cancelled"}
              </strong>
              . You can retry payment now or switch to Cash on Delivery.
            </Text>
            <Group gap="sm">
              <Button
                size="xs"
                color={order.paymentMethod === "paymongo_simulated" ? "teal" : "blue"}
                radius="md"
                leftSection={<RefreshCw size={13} />}
                onClick={onRetryPayment}
              >
                {order.paymentMethod === "paymongo_simulated"
                  ? "Retry PayMongo"
                  : "Retry GCash"}
              </Button>
              <Button
                size="xs"
                variant="default"
                radius="md"
                loading={isSubmitting}
                onClick={onSwitchToCod}
              >
                Switch to Cash on Delivery
              </Button>
            </Group>
          </div>
        </Alert>
      ) : (
        <Alert
          color="teal"
          variant="light"
          radius="md"
          icon={<CheckCircle2 size={20} />}
          title={`Order ${order.orderNumber} Placed Successfully!`}
          className="border border-teal-500/20"
        >
          Your order is confirmed and stock has been reserved. View your order anytime in{" "}
          <Link
            href="/profile?tab=orders"
            className="font-semibold underline underline-offset-2 hover:text-teal-600 dark:hover:text-teal-300 transition-colors"
          >
            Profile &rarr; Orders
          </Link>
          .
        </Alert>
      )}

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        <Paper
          withBorder
          radius="lg"
          p={{ base: "md", sm: "lg" }}
          className="bg-white/85 dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm"
        >
          <Text size="11px" c="dimmed" fw={600} tt="uppercase">
            Order Number
          </Text>
          <Text
            size="md"
            fw={700}
            className="mt-0.5 text-cyan-600 dark:text-cyan-400 font-mono"
          >
            {order.orderNumber}
          </Text>
        </Paper>

        <Paper
          withBorder
          radius="lg"
          p={{ base: "md", sm: "lg" }}
          className="bg-white/85 dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm"
        >
          <Text size="11px" c="dimmed" fw={600} tt="uppercase">
            Payment Status
          </Text>
          <Badge
            color={
              order.paymentStatus.includes("Paid")
                ? "teal"
                : order.paymentStatus.includes("Failed") ||
                    order.paymentStatus.includes("Cancelled")
                  ? "red"
                  : "yellow"
            }
            variant="light"
            size="sm"
            className="mt-1"
          >
            {order.paymentStatus}
          </Badge>
          <Text size="xs" c="dimmed" mt={4}>
            {order.paymentLabel}
          </Text>
          {order.paymentReference && (
            <Text size="xs" c="dimmed" mt={2} className="font-mono">
              Ref:{" "}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {order.paymentReference}
              </span>
            </Text>
          )}
        </Paper>

        <Paper
          withBorder
          radius="lg"
          p={{ base: "md", sm: "lg" }}
          className="bg-white/85 dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm"
        >
          <Text size="11px" c="dimmed" fw={600} tt="uppercase">
            Fulfillment &amp; Courier
          </Text>
          <Text
            size="xs"
            fw={700}
            className="mt-0.5 text-slate-800 dark:text-slate-200"
          >
            {order.courierName}
          </Text>
          <Text size="xs" c="dimmed">
            ETA: {order.estimatedDelivery}
          </Text>
        </Paper>
      </SimpleGrid>

      <Paper
        withBorder
        radius="lg"
        p={{ base: "md", sm: "lg" }}
        className="bg-white/85 dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm space-y-3"
      >
        <Group justify="space-between" align="center">
          <Text size="xs" fw={700} tt="uppercase" c="dimmed">
            Delivery Destination
          </Text>
          <Badge size="xs" variant="outline" color="cyan">
            {order.shippingMethod === "store_pickup"
              ? "In-Store Pickup"
              : "Courier Delivery"}
          </Badge>
        </Group>
        <div className="text-xs sm:text-sm space-y-0.5">
          <p className="font-semibold text-slate-900 dark:text-slate-100">
            {order.shippingAddress.fullName} ({order.shippingAddress.phone})
          </p>
          {order.shippingMethod === "store_pickup" && (
            <p className="text-cyan-600 dark:text-cyan-400 font-medium">
              {NETCODEX_STORE_LOCATION.storeName} · {NETCODEX_STORE_LOCATION.hours}
            </p>
          )}
          <p className="text-slate-600 dark:text-slate-300">
            {order.shippingAddress.streetAddress}, {order.shippingAddress.barangay},{" "}
            {order.shippingAddress.city}, {order.shippingAddress.region}{" "}
            {order.shippingAddress.postalCode}
          </p>
        </div>

        <Divider className="border-slate-200 dark:border-white/10" />

        <Text size="xs" fw={700} tt="uppercase" c="dimmed">
          Ordered Items ({order.items.length})
        </Text>
        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {order.items.map((item) => {
            const fallbackImg = getEcommerceFallbackImage(item.category, item.kind);
            const rawImg = isInvalidPlaceholderUrl(item.imageUrl)
              ? fallbackImg
              : item.imageUrl!;
            const resolvedImg =
              getOptimizedStorageUrl(rawImg, shouldCorruptImages) || fallbackImg;
            return (
              <div
                key={item.id}
                className="flex justify-between items-center py-2.5 text-sm gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0e131d]">
                    <OptimizedImage
                      src={resolvedImg}
                      alt={item.name}
                      fill
                      sizes="44px"
                      className="object-contain p-1"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-xs truncate">{item.name}</p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Qty: {item.quantity} · {formatCurrency(item.price)}
                    </p>
                  </div>
                </div>
                <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 shrink-0">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            );
          })}
        </div>
      </Paper>

      <Group justify="space-between" pt="xs">
        <Button
          variant="default"
          size="sm"
          radius="md"
          onClick={onContinueShopping}
          className="h-11"
        >
          Continue Shopping
        </Button>
        {isAuthenticated && (
          <Button
            color="cyan"
            size="sm"
            radius="md"
            rightSection={<ArrowRight size={14} />}
            onClick={onViewOrderHistory}
            className="h-11"
          >
            View Order History
          </Button>
        )}
      </Group>
    </div>
  );
}

