"use client";

import React from "react";
import {
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Badge,
  Button,
  ThemeIcon,
} from "@mantine/core";
import {
  Package,
  Calendar,
  Clock,
  Truck,
  CheckCircle2,
  ServerCrash,
  ChevronRight,
  CreditCard,
  XCircle,
} from "lucide-react";
import { formatCurrency, getOptimizedStorageUrl } from "@/lib/utils";
import type { Order, Part } from "@/lib/types";
import { getOrderFulfillmentStage } from "@/lib/order-workflow";
import {
  getPendingReservationLabel,
  reservationRequiresAssembly,
  shouldShowCustomerOrderActivity,
} from "@/lib/customer-order-workflow";
import { CustomerOrderActivity } from "@/components/orders/customer-order-activity";
import { DownloadReceiptButton } from "@/components/orders/download-receipt-button";
import { resolveOrderItemImageUrl } from "@/lib/order-image-resolver";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { useFirestore } from "@/firebase";
import { useInventoryParts } from "@/firebase/firestore/use-inventory-parts";
import Link from "next/link";

interface ReservationsListProps {
  reservations: Order[];
  loading: boolean;
  onConfirm: (action: { id: string; order?: Order }) => void;
  catalogParts?: Part[] | null;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ReactNode;
  emptyThemeColor?: string;
}

export function ReservationsList({
  reservations,
  loading,
  onConfirm,
  catalogParts: propCatalogParts,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  emptyThemeColor,
}: ReservationsListProps) {
  const firestore = useFirestore();
  const { data: liveCatalogParts } = useInventoryParts(firestore);
  const catalogParts = propCatalogParts || liveCatalogParts;
  if (loading) {
    return null;
  }

  if (reservations.length === 0) {
    return (
      <Paper
        withBorder
        radius="lg"
        p="xl"
        className="bg-white dark:bg-[#111722] border-dashed border-slate-300 dark:border-white/10 text-center py-16"
      >
        <Stack align="center" gap="md" className="max-w-md mx-auto">
          <ThemeIcon size={64} radius="xl" color={emptyThemeColor || "cyan"} variant="light">
            {emptyIcon || <Package size={32} />}
          </ThemeIcon>
          <div className="space-y-1">
            <Title order={3} className="text-xl font-bold font-headline text-slate-900 dark:text-white">
              {emptyTitle || "No Active Build Reservations"}
            </Title>
            <Text size="sm" className="text-slate-600 dark:text-slate-400">
              {emptyDescription || "Your reservation list is currently empty. Design and reserve your dream custom rig or configure a pre-built PC today."}
            </Text>
          </div>
          <Button
            component={Link}
            href="/builder"
            color="cyan"
            size="md"
            radius="md"
            rightSection={<ChevronRight size={16} />}
            className="font-bold uppercase tracking-wider text-xs shadow-lg shadow-cyan-500/20"
          >
            Start a New Build
          </Button>
        </Stack>
      </Paper>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5">
      {reservations.map((reservation) => {
        const status = getStatusInfo(reservation);
        const showActivity = shouldShowCustomerOrderActivity(reservation);
        return (
          <Paper
            key={reservation.id}
            withBorder
            radius="lg"
            p={12}
            className="bg-white dark:bg-[#121824] border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <Stack gap="md">
              {/* Header: Order info & Actions */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Text className="text-lg font-bold font-headline text-slate-900 dark:text-white tracking-tight">
                      {reservation.orderNumber ? `Order ${reservation.orderNumber}` : `Order #${reservation.id.substring(0, 8).toUpperCase()}`}
                    </Text>
                    <Badge
                      color={status.color}
                      variant="filled"
                      size="sm"
                      leftSection={status.icon}
                      className="font-bold uppercase tracking-wider"
                    >
                      {status.label}
                    </Badge>
                  </div>

                  <Text size="xs" className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                    <Calendar size={13} className="text-slate-500 dark:text-slate-400" />
                    <span>
                      Reserved on{" "}
                      {reservation.createdAt?.toDate
                        ? reservation.createdAt.toDate().toLocaleDateString(undefined, { dateStyle: "long" })
                        : "Recently"}
                    </span>
                  </Text>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  {/* Price display */}
                  <div className="text-left sm:text-right pr-4 sm:border-r border-slate-200 dark:border-white/10">
                    <Text size="xs" fw={700} className="uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Total Amount
                    </Text>
                    <Text className="text-xl font-headline font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(reservation.totalPrice)}
                    </Text>
                  </div>

                  {reservation.paymentStatus === "paid" && (
                    <DownloadReceiptButton order={reservation} />
                  )}

                  {/* Action Buttons */}
                  <Group gap="xs">
                    {reservation.status !== "cancelled" &&
                      getOrderFulfillmentStage(reservation) !== "delivered" && (
                      <Button
                        size="xs"
                        color="red"
                        variant="light"
                        radius="md"
                        leftSection={<XCircle size={14} />}
                        onClick={() => onConfirm({ id: reservation.id, order: reservation })}
                        className="font-bold uppercase tracking-wider text-[11px]"
                      >
                        {reservationRequiresAssembly(reservation) ? "Cancel Build" : "Cancel Order"}
                      </Button>
                    )}
                  </Group>
                </div>
              </div>

              {/* Order Activity Stepper & Courier details */}
              {showActivity && (
                <CustomerOrderActivity order={reservation} catalogParts={catalogParts} />
              )}

              {/* Items List */}
              <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-black/20 overflow-hidden">
                <div className="max-h-[220px] overflow-y-auto divide-y divide-slate-200 dark:divide-white/5">
                  {reservation.items.map((item, idx) => {
                    const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
                    const rawImg = resolveOrderItemImageUrl(
                      item,
                      reservation.items,
                      catalogParts
                    );
                    const resolvedImg = getOptimizedStorageUrl(rawImg) || rawImg;

                    return (
                      <div
                        key={`${reservation.id}-item-${idx}`}
                        className="p-2.5 sm:p-3 px-3.5 sm:px-4 flex justify-between items-center text-sm hover:bg-slate-100/60 dark:hover:bg-white/[0.02] transition-colors gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Part Image Thumbnail */}
                          <div className="relative h-10 w-10 sm:h-11 sm:w-11 shrink-0 overflow-hidden rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0e131d]">
                            <OptimizedImage
                              src={resolvedImg}
                              alt={item.name}
                              fill
                              sizes="44px"
                              className="object-contain p-1"
                            />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[10px] font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider">
                              {(item as any).category || "Component"}
                            </span>
                            <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate max-w-[200px] sm:max-w-md">
                              {item.name}
                              {qty > 1 && (
                                <span className="ml-1.5 text-xs font-mono text-cyan-600 dark:text-cyan-400">
                                  ×{qty}
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200 shrink-0">
                          {formatCurrency(item.price * qty)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Stack>
          </Paper>
        );
      })}
    </div>
  );
}

function getStatusInfo(order: Order) {
  if (order.status === "cancelled") {
    return {
      icon: <ServerCrash size={12} />,
      color: "red",
      label: "Cancelled",
    };
  }

  const stage = getOrderFulfillmentStage(order);

  switch (stage) {
    case "delivered":
      return {
        icon: <CheckCircle2 size={12} />,
        color: "teal",
        label: "Delivered",
      };
    case "out_for_delivery": {
      const isPickup =
        order.shippingMethod === "store_pickup" ||
        (!order.shippingMethod && !order.paymentMethod);
      return {
        icon: isPickup ? <CheckCircle2 size={12} /> : <Truck size={12} />,
        color: isPickup ? "teal" : "blue",
        label: isPickup ? "Ready for Pickup" : "Out for Delivery",
      };
    }
    case "assembling_testing":
      return {
        icon: <Truck size={12} />,
        color: "blue",
        label: "Assembly Phase",
      };
    case "order_placed":
    default:
      return {
        icon: <Clock size={12} />,
        color: "orange",
        label: getPendingReservationLabel(order),
      };
  }
}
