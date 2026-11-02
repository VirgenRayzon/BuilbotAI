"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { Badge, Tooltip, Text, Group } from "@mantine/core";
import { Clock, ClockAlert } from "lucide-react";
import {
  getOrderRemainingTimeMs,
  formatRemainingTime,
  isOrderExpired,
} from "@/lib/order-expiration";
import { autoCancelExpiredOrder } from "@/app/checkout-actions";
import { useUserProfile } from "@/context/user-profile";

interface OrderExpirationBadgeProps {
  orderId: string;
  createdAt: unknown;
  isPendingNoProgression?: boolean;
  onExpired?: () => void;
  size?: "xs" | "sm" | "md";
  className?: string;
}

export function OrderExpirationBadge({
  orderId,
  createdAt,
  isPendingNoProgression = true,
  onExpired,
  size = "sm",
  className = "",
}: OrderExpirationBadgeProps) {
  const { authUser } = useUserProfile();
  const [remainingMs, setRemainingMs] = useState<number>(() =>
    getOrderRemainingTimeMs(createdAt)
  );
  const [isCancelling, setIsCancelling] = useState(false);
  const hasTriggeredRef = useRef(false);

  const triggerAutoCancel = useCallback(async () => {
    if (hasTriggeredRef.current || isCancelling) return;
    hasTriggeredRef.current = true;
    setIsCancelling(true);

    try {
      const idToken = authUser ? await authUser.getIdToken() : undefined;
      await autoCancelExpiredOrder(orderId, idToken);
      onExpired?.();
    } catch (err) {
      console.warn("Auto-cancel failed on expiration badge:", err);
    } finally {
      setIsCancelling(false);
    }
  }, [authUser, orderId, isCancelling, onExpired]);

  useEffect(() => {
    if (!isPendingNoProgression) return;

    // Check immediately on mount
    const initialRemaining = getOrderRemainingTimeMs(createdAt);
    setRemainingMs(initialRemaining);

    if (initialRemaining <= 0) {
      triggerAutoCancel();
      return;
    }

    const timer = setInterval(() => {
      const currentRemaining = getOrderRemainingTimeMs(createdAt);
      setRemainingMs(currentRemaining);

      if (currentRemaining <= 0) {
        clearInterval(timer);
        triggerAutoCancel();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [createdAt, isPendingNoProgression, triggerAutoCancel]);

  if (!isPendingNoProgression) return null;

  const isUrgent = remainingMs <= 10 * 60 * 1000; // < 10 mins
  const isExpired = remainingMs <= 0;

  const badgeColor = isExpired ? "gray" : isUrgent ? "red" : "amber";
  const labelText = isCancelling
    ? "Auto-cancelling..."
    : isExpired
    ? "Expired (Auto-cancelled)"
    : `Auto-cancels in ${formatRemainingTime(remainingMs)}`;

  return (
    <Tooltip
      label="Orders awaiting review and payment with no progression automatically cancel after 1 hour."
      withArrow
      position="top"
    >
      <Badge
        color={badgeColor}
        variant={isUrgent ? "filled" : "light"}
        size={size}
        leftSection={
          isUrgent ? (
            <ClockAlert size={12} className={!isExpired ? "animate-pulse" : ""} />
          ) : (
            <Clock size={12} />
          )
        }
        className={`font-mono font-bold tracking-tight ${className}`}
      >
        {labelText}
      </Badge>
    </Tooltip>
  );
}

interface OrderExpirationNoticeProps {
  orderId: string;
  createdAt: unknown;
  isPendingNoProgression?: boolean;
  onExpired?: () => void;
  className?: string;
}

export function OrderExpirationNotice({
  orderId,
  createdAt,
  isPendingNoProgression = true,
  onExpired,
  className = "",
}: OrderExpirationNoticeProps) {
  const [remainingMs, setRemainingMs] = useState<number>(() =>
    getOrderRemainingTimeMs(createdAt)
  );

  useEffect(() => {
    if (!isPendingNoProgression) return;
    const initial = getOrderRemainingTimeMs(createdAt);
    setRemainingMs(initial);

    const timer = setInterval(() => {
      const rem = getOrderRemainingTimeMs(createdAt);
      setRemainingMs(rem);
    }, 1000);

    return () => clearInterval(timer);
  }, [createdAt, isPendingNoProgression]);

  if (!isPendingNoProgression || remainingMs <= 0) return null;

  const isUrgent = remainingMs <= 10 * 60 * 1000;

  return (
    <div
      className={`rounded-lg border px-3 py-2 text-xs flex items-center justify-between gap-3 ${
        isUrgent
          ? "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300"
          : "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200"
      } ${className}`}
    >
      <Group gap="xs" wrap="nowrap" align="center">
        {isUrgent ? (
          <ClockAlert size={15} className="shrink-0 text-red-500 animate-pulse" />
        ) : (
          <Clock size={15} className="shrink-0 text-amber-500" />
        )}
        <Text size="xs" fw={500}>
          {isUrgent ? (
            <span>
              <strong>Expiring soon!</strong> This reservation will automatically cancel in{" "}
              <span className="font-mono font-bold">{formatRemainingTime(remainingMs)}</span> unless
              payment is completed.
            </span>
          ) : (
            <span>
              <strong>1-Hour Reservation Window:</strong> Unpaid orders with no progression automatically
              cancel in <span className="font-mono font-bold">{formatRemainingTime(remainingMs)}</span>.
            </span>
          )}
        </Text>
      </Group>

      <OrderExpirationBadge
        orderId={orderId}
        createdAt={createdAt}
        isPendingNoProgression={isPendingNoProgression}
        onExpired={onExpired}
        size="xs"
      />
    </div>
  );
}
