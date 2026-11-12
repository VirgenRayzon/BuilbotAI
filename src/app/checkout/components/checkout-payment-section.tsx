"use client";

import React from "react";
import { Radio, Text } from "@mantine/core";
import { CreditCard, Smartphone, Truck } from "lucide-react";
import type { PaymentMethodDefinition } from "@/lib/payment-methods";
import type { PaymentMethod } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CheckoutPaymentSectionProps {
  paymentMethods: PaymentMethodDefinition[];
  selectedPaymentMethod: PaymentMethod;
  onSelectPaymentMethod: (method: PaymentMethod) => void;
}

export function CheckoutPaymentSection({
  paymentMethods,
  selectedPaymentMethod,
  onSelectPaymentMethod,
}: CheckoutPaymentSectionProps) {
  return (
    <div className="space-y-3">
      <Text size="xs" fw={700} tt="uppercase" c="dimmed">
        3. Payment Method
      </Text>

      <div className="divide-y divide-slate-200 dark:divide-white/10 rounded-md border border-slate-200 dark:border-white/10 overflow-hidden bg-slate-50/40 dark:bg-white/[0.02]">
        {paymentMethods.map((pm) => {
          const active = selectedPaymentMethod === pm.id;
          const Icon =
            pm.id === "cod"
              ? Truck
              : pm.id === "gcash_simulated"
                ? Smartphone
                : CreditCard;

          return (
            <div
              key={pm.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectPaymentMethod(pm.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectPaymentMethod(pm.id);
                }
              }}
              className={cn(
                "flex items-center gap-3 p-3.5 min-h-[44px] cursor-pointer transition-colors",
                active
                  ? "bg-cyan-50/70 dark:bg-cyan-950/30"
                  : "hover:bg-slate-100/60 dark:hover:bg-white/5"
              )}
            >
              <Radio
                checked={active}
                onChange={() => onSelectPaymentMethod(pm.id)}
                color="cyan"
                size="sm"
                className="pointer-events-none shrink-0"
              />
              <Icon
                size={16}
                className={cn(
                  "shrink-0",
                  active
                    ? "text-cyan-600 dark:text-cyan-400"
                    : "text-slate-400"
                )}
              />
              <Text size="sm" fw={700} className="text-slate-900 dark:text-slate-100">
                {pm.label}
              </Text>
            </div>
          );
        })}
      </div>
    </div>
  );
}

