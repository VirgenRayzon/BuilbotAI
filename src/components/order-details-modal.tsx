"use client";

import { useState, useEffect } from "react";
import { useFirestore } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Order } from "@/lib/types";
import {
  Modal,
  Paper,
  Text,
  Badge,
  Button,
  Group,
  Stack,
  ThemeIcon,
  Loader,
  ScrollArea,
  Divider,
} from "@mantine/core";
import { Package, Calendar, CreditCard, ChevronRight, Hash, Clock } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import Link from "next/link";

interface OrderDetailsModalProps {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailsModal({ orderId, open, onOpenChange }: OrderDetailsModalProps) {
  const firestore = useFirestore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId || !firestore) return;
      setLoading(true);
      try {
        const docRef = doc(firestore, "orders", orderId);
        const docSnap = await getDoc(docRef);
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
      setTimeout(() => setOrder(null), 300);
    }
  }, [orderId, open, firestore]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return { label: "Pending Approval", color: "yellow" };
      case "building":
        return { label: "Building Phase", color: "blue" };
      case "finished building":
        return { label: "Ready for Pickup", color: "teal" };
      case "cancelled":
        return { label: "Cancelled", color: "red" };
      default:
        return { label: "Processing", color: "gray" };
    }
  };

  const statusInfo = order ? getStatusBadge(order.status) : null;

  return (
    <Modal
      opened={open}
      onClose={() => onOpenChange(false)}
      centered
      radius="lg"
      size="md"
      title={
        <div className="flex items-center justify-between w-full pr-3">
          <Group gap="xs">
            <ThemeIcon size="md" radius="md" color="cyan" variant="light">
              <Package size={18} />
            </ThemeIcon>
            <div>
              <Text fw={700} size="sm" className="font-headline text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                Order Details
              </Text>
              {order && (
                <Text size="11px" c="dimmed" className="font-mono flex items-center gap-1 mt-0.5">
                  <Hash size={11} className="opacity-60" />
                  <span>{order.id.toUpperCase()}</span>
                </Text>
              )}
            </div>
          </Group>
          {statusInfo && (
            <Badge size="xs" variant="light" color={statusInfo.color} className="font-bold uppercase tracking-wider">
              {statusInfo.label}
            </Badge>
          )}
        </div>
      }
      classNames={{
        content: "bg-white dark:bg-[#111722] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 shadow-2xl rounded-2xl overflow-hidden",
        header: "bg-white dark:bg-[#111722] border-b border-slate-200 dark:border-white/10 px-6 py-4",
        body: "!px-6 !pt-5 !pb-6",
        close: "text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors",
      }}
    >
      {loading ? (
        <div className="h-60 flex flex-col items-center justify-center space-y-3">
          <Loader size="sm" color="cyan" />
          <Text size="xs" c="dimmed">
            Retrieving hardware specs...
          </Text>
        </div>
      ) : order ? (
        <Stack gap="md">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <Paper
              withBorder
              p="sm"
              radius="md"
              className="bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10"
            >
              <Text size="10px" fw={700} c="dimmed" className="uppercase tracking-wider mb-1">
                Reserved On
              </Text>
              <Group gap={6}>
                <Calendar size={14} className="text-cyan-600 dark:text-cyan-400" />
                <Text size="xs" fw={600} className="text-slate-800 dark:text-slate-200">
                  {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString(undefined, { dateStyle: "medium" }) : "Recently"}
                </Text>
              </Group>
            </Paper>

            <Paper
              withBorder
              p="sm"
              radius="md"
              className="bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10"
            >
              <Text size="10px" fw={700} c="dimmed" className="uppercase tracking-wider mb-1">
                Total Investment
              </Text>
              <Group gap={6}>
                <CreditCard size={14} className="text-emerald-500" />
                <Text size="xs" fw={700} className="text-emerald-600 dark:text-emerald-400 font-headline">
                  {formatCurrency(order.totalPrice)}
                </Text>
              </Group>
            </Paper>
          </div>

          {/* Hardware Specifications List */}
          <div className="space-y-2">
            <Group justify="space-between" align="center">
              <Text size="xs" fw={700} c="dimmed" className="uppercase tracking-wider flex items-center gap-1.5">
                <Package size={13} />
                <span>Hardware Specifications</span>
              </Text>
              <Badge size="xs" variant="outline" color="gray" className="font-mono">
                {order.items?.length || 0} items
              </Badge>
            </Group>

            <Paper
              withBorder
              radius="md"
              className="overflow-hidden border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]"
            >
              <ScrollArea.Autosize mah={220} type="scroll" offsetScrollbars>
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {order.items.map((item, idx) => (
                    <div
                      key={`${item.id}-${idx}`}
                      className="p-2.5 px-3 flex justify-between items-center hover:bg-white dark:hover:bg-white/[0.03] transition-colors"
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                          {(item as any).category || "Part"}
                        </span>
                        <Text size="xs" fw={500} truncate className="text-slate-800 dark:text-slate-200">
                          {item.name}
                        </Text>
                      </div>
                      <Text size="xs" fw={600} className="font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {formatCurrency(item.price)}
                      </Text>
                    </div>
                  ))}
                </div>
              </ScrollArea.Autosize>
            </Paper>
          </div>

          <Divider className="border-slate-100 dark:border-white/10" />

          {/* Modal Footer Buttons */}
          <Group justify="flex-end" gap="xs">
            <Button
              variant="default"
              size="xs"
              radius="md"
              onClick={() => onOpenChange(false)}
              className="text-xs font-semibold"
            >
              Dismiss
            </Button>
            <Button
              component={Link}
              href="/profile?tab=reservations"
              color="blue"
              size="xs"
              radius="md"
              rightSection={<ChevronRight size={14} />}
              onClick={() => onOpenChange(false)}
              className="text-xs font-semibold shadow-sm shadow-blue-500/20"
            >
              Go to My Reservations
            </Button>
          </Group>
        </Stack>
      ) : (
        <div className="h-48 flex flex-col items-center justify-center text-center p-4 space-y-2">
          <ThemeIcon size="xl" radius="xl" color="gray" variant="light">
            <Package size={20} className="opacity-50" />
          </ThemeIcon>
          <Text size="xs" c="dimmed">
            Order data could not be retrieved. It may have been archived or removed.
          </Text>
        </div>
      )}
    </Modal>
  );
}
