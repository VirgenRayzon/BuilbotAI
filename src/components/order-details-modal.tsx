"use client";

import Link from "next/link";
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
import {
  Package,
  Calendar,
  CreditCard,
  ChevronRight,
  Hash,
  Smartphone,
  Banknote,
  Cpu,
  Monitor,
} from "lucide-react";
import { useOrderDetailsModal } from "@/hooks/use-order-details-modal";
import { groupOrderItems } from "@/lib/order-item-groups";
import { getPaymentMethodLabel } from "@/lib/payment-methods";
import { formatCurrency } from "@/lib/utils";
import { CustomerOrderActivity } from "@/components/orders/customer-order-activity";

interface OrderDetailsModalProps {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailsModal({ orderId, open, onOpenChange }: OrderDetailsModalProps) {
  const { order, loading, statusInfo, paymentStatusInfo, refundedTotal } =
    useOrderDetailsModal(orderId, open);

  return (
    <Modal
      opened={open}
      onClose={() => onOpenChange(false)}
      centered
      radius="lg"
      size="lg"
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
                  <span>{order.orderNumber || order.id.toUpperCase()}</span>
                </Text>
              )}
            </div>
          </Group>
          <Group gap={6}>
            {statusInfo && (
              <Badge size="xs" variant="light" color={statusInfo.color} className="font-bold uppercase tracking-wider">
                {statusInfo.label}
              </Badge>
            )}
            {paymentStatusInfo && (
              <Badge size="xs" variant="outline" color={paymentStatusInfo.color} className="font-bold uppercase tracking-wider">
                {paymentStatusInfo.shortLabel}
              </Badge>
            )}
          </Group>
        </div>
      }
      classNames={{
        content:
          "bg-white/95 dark:bg-[#141a23]/95 backdrop-blur-md border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-slate-100 shadow-xl rounded-xl overflow-hidden",
        header:
          "bg-white/95 dark:bg-[#141a23]/95 border-b border-slate-200/80 dark:border-white/10 p-3",
        body: "!p-3",
        close:
          "text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors",
      }}
    >
      {loading ? (
        <div className="h-60 flex flex-col items-center justify-center space-y-3">
          <Loader size="sm" color="cyan" />
          <Text size="xs" c="dimmed">
            Retrieving order details...
          </Text>
        </div>
      ) : order ? (
        <Stack gap="md">
          <div className="grid grid-cols-2 gap-3">
            <Paper withBorder radius="md" className="bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 p-3">
              <Text size="10px" fw={700} c="dimmed" className="uppercase tracking-wider mb-1">
                Placed On
              </Text>
              <Group gap={6}>
                <Calendar size={14} className="text-cyan-600 dark:text-cyan-400" />
                <Text size="xs" fw={600} className="text-slate-800 dark:text-slate-200">
                  {order.createdAt?.toDate
                    ? order.createdAt.toDate().toLocaleDateString(undefined, { dateStyle: "medium" })
                    : "Recently"}
                </Text>
              </Group>
            </Paper>

            <Paper withBorder radius="md" className="bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 p-3">
              <Text size="10px" fw={700} c="dimmed" className="uppercase tracking-wider mb-1">
                Order Total
              </Text>
              <Group gap={6}>
                <CreditCard size={14} className="text-emerald-500" />
                <Text size="xs" fw={700} className="text-emerald-600 dark:text-emerald-400 font-headline">
                  {formatCurrency(order.totalPrice)}
                </Text>
              </Group>
            </Paper>
          </div>

          <Paper
            withBorder
            radius="md"
            className="bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 p-3 space-y-1.5"
          >
            <Group justify="space-between" align="center">
              <Group gap={6}>
                {order.paymentMethod === "gcash_simulated" ? (
                  <Smartphone size={14} className="text-blue-500" />
                ) : order.paymentMethod === "paymongo_simulated" ? (
                  <CreditCard size={14} className="text-teal-500" />
                ) : (
                  <Banknote size={14} className="text-emerald-500" />
                )}
                <Text size="xs" fw={700}>
                  {getPaymentMethodLabel(order.paymentMethod, false)}
                </Text>
              </Group>
              {paymentStatusInfo && (
                <Badge size="xs" color={paymentStatusInfo.color} variant="light">
                  {paymentStatusInfo.label}
                </Badge>
              )}
            </Group>
            {order.paymentReference && (
              <Text size="11px" c="dimmed" className="font-mono">
                Ref: {order.paymentReference}
              </Text>
            )}
            {(refundedTotal > 0 || (order.refundStatus && order.refundStatus !== "none")) && (
              <Text size="11px" className="font-semibold text-rose-600 dark:text-rose-400">
                Refund Status: {(order.refundStatus || "partial").toUpperCase()}
                {refundedTotal > 0 ? ` · ${formatCurrency(refundedTotal)} refunded` : ""}
              </Text>
            )}
          </Paper>

          <CustomerOrderActivity order={order} />

          <div className="space-y-2">
            <Group justify="space-between" align="center">
              <Text size="xs" fw={700} c="dimmed" className="uppercase tracking-wider flex items-center gap-1.5">
                <Package size={13} />
                <span>Hardware Items</span>
              </Text>
              <Badge size="xs" variant="outline" color="gray" className="font-mono">
                {order.items?.length || 0} items
              </Badge>
            </Group>

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50/50 dark:border-white/10 dark:bg-white/[0.02]">
              {groupOrderItems(order).map((group, gIdx) => {
                const isCustom = group.name === "My Build" || group.type === "custom-build";
                const isAdd = group.name === "Additional" || group.type === "additional";
                const isPre = !isCustom && !isAdd;
                const badgeColor = isCustom ? "cyan" : isPre ? "grape" : "amber";
                const badgeText = isCustom ? "Custom Rig" : isPre ? "Prebuilt" : "Additional";

                return (
                  <div
                    key={`modal-group-${group.name}-${gIdx}`}
                    className={`${gIdx > 0 ? "border-t border-slate-200 dark:border-white/10" : ""} bg-slate-50/50 dark:bg-white/[0.02]`}
                  >
                    <div className="px-3 py-1.5 bg-slate-100/90 dark:bg-white/[0.04] border-b border-slate-200 dark:border-white/10 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {isCustom ? (
                          <Cpu size={13} className="text-cyan-500 shrink-0" />
                        ) : isPre ? (
                          <Monitor size={13} className="text-purple-500 shrink-0" />
                        ) : (
                          <Package size={13} className="text-amber-500 shrink-0" />
                        )}
                        <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200 uppercase truncate">
                          {group.name}
                        </span>
                        <Badge size="xs" variant="light" color={badgeColor}>
                          {badgeText}
                        </Badge>
                      </div>
                      <span className="font-mono font-bold text-[11px] text-slate-700 dark:text-slate-300">
                        {formatCurrency(group.totalPrice)}
                      </span>
                    </div>

                    <ScrollArea.Autosize mah={160} type="scroll" offsetScrollbars>
                      <div className="divide-y divide-slate-100 dark:divide-white/5">
                        {group.items.map((item, idx) => {
                          const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
                          return (
                            <div
                              key={`modal-item-${item.id}-${idx}`}
                              className="p-2.5 px-3 flex justify-between items-center"
                            >
                              <div className="flex flex-col min-w-0 pr-2">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                                  {item.category || "Part"}
                                </span>
                                <Text size="xs" fw={500} truncate className="text-slate-800 dark:text-slate-200">
                                  {item.name} {qty > 1 ? `×${qty}` : ""}
                                </Text>
                              </div>
                              <Text size="xs" fw={600} className="font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                {formatCurrency(item.price * qty)}
                              </Text>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea.Autosize>
                  </div>
                );
              })}
            </div>
          </div>

          <Divider className="border-slate-100 dark:border-white/10" />

          <Group justify="flex-end" gap="xs">
            <Button
              variant="default"
              size="xs"
              radius="md"
              onClick={() => onOpenChange(false)}
              className="min-h-11 text-xs font-semibold"
            >
              Dismiss
            </Button>
            <Button
              component={Link}
              href="/profile?tab=orders"
              color="cyan"
              size="xs"
              radius="md"
              rightSection={<ChevronRight size={14} />}
              onClick={() => onOpenChange(false)}
              className="min-h-11 text-xs font-semibold"
            >
              Go to My Orders
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
