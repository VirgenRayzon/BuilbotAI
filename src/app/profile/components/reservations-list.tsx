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
  ActionIcon,
  ThemeIcon,
  Tooltip,
} from "@mantine/core";
import {
  Package,
  Calendar,
  Clock,
  Truck,
  CheckCircle2,
  ServerCrash,
  Trash2,
  ChevronRight,
  CreditCard,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Order } from "@/lib/types";
import Link from "next/link";

interface ReservationsListProps {
  reservations: Order[];
  loading: boolean;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
  onConfirm: (action: { id: string; type: "cancel" | "delete"; order?: Order }) => void;
}

export function ReservationsList({
  reservations,
  loading,
  onConfirm,
}: ReservationsListProps) {
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
          <ThemeIcon size={64} radius="xl" color="cyan" variant="light">
            <Package size={32} />
          </ThemeIcon>
          <div className="space-y-1">
            <Title order={3} className="text-xl font-bold font-headline text-slate-900 dark:text-white">
              No Active Build Reservations
            </Title>
            <Text size="sm" className="text-slate-600 dark:text-slate-400">
              Your reservation list is currently empty. Design and reserve your dream custom rig or configure a pre-built PC today.
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
        const status = getStatusInfo(reservation.status || "pending");
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
                      Order #{reservation.id.substring(0, 8).toUpperCase()}
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

                  {/* Action Buttons */}
                  <Group gap="xs">
                    {(reservation.status === "pending" || reservation.status === "building") && (
                      <Button
                        size="xs"
                        color="red"
                        variant="light"
                        radius="md"
                        leftSection={<XCircle size={14} />}
                        onClick={() => onConfirm({ id: reservation.id, type: "cancel", order: reservation })}
                        className="font-bold uppercase tracking-wider text-[11px]"
                      >
                        Cancel Build
                      </Button>
                    )}

                    {reservation.status === "cancelled" && (
                      <Tooltip label="Delete cancelled reservation record" withArrow>
                        <ActionIcon
                          size="md"
                          color="red"
                          variant="subtle"
                          radius="md"
                          onClick={() => onConfirm({ id: reservation.id, type: "delete", order: reservation })}
                          aria-label="Delete reservation record"
                        >
                          <Trash2 size={16} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </Group>
                </div>
              </div>

              {/* Items List */}
              <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-black/20 overflow-hidden">
                <div className="max-h-[180px] overflow-y-auto divide-y divide-slate-200 dark:divide-white/5">
                  {reservation.items.map((item, idx) => (
                    <div
                      key={`${reservation.id}-item-${idx}`}
                      className="p-3 px-4 flex justify-between items-center text-sm hover:bg-slate-100/60 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <ThemeIcon size="sm" radius="md" color="gray" variant="light">
                          <CreditCard size={14} />
                        </ThemeIcon>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider">
                            {(item as any).category || "Component"}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[200px] sm:max-w-md">
                            {item.name}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                        {formatCurrency(item.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Stack>
          </Paper>
        );
      })}
    </div>
  );
}

function getStatusInfo(status: string) {
  switch (status) {
    case "pending":
      return {
        icon: <Clock size={12} />,
        color: "orange",
        label: "Pending Review",
      };
    case "building":
      return {
        icon: <Truck size={12} />,
        color: "blue",
        label: "Assembly Phase",
      };
    case "finished building":
      return {
        icon: <CheckCircle2 size={12} />,
        color: "teal",
        label: "Ready for Pickup",
      };
    case "cancelled":
      return {
        icon: <ServerCrash size={12} />,
        color: "red",
        label: "Cancelled",
      };
    default:
      return {
        icon: <Package size={12} />,
        color: "gray",
        label: "Processing",
      };
  }
}
