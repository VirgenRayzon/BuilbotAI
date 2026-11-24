"use client";

import React from "react";
import { Checkbox, Radio, Text } from "@mantine/core";
import type { ShippingMethodId } from "@/context/ecommerce-context";
import { CRATE_PROTECTION_FEE } from "@/lib/payment-methods";
import { cn, formatCurrency } from "@/lib/utils";
import { SHIPPING_METHODS } from "../checkout-constants";

interface CheckoutFulfillmentSectionProps {
  shippingMethod: ShippingMethodId;
  onSelectShippingMethod: (method: ShippingMethodId) => void;
  hasBuildForCrateProtection: boolean;
  includeCrateProtection: boolean;
  onToggleCrateProtection: (checked: boolean) => void;
}

export function CheckoutFulfillmentSection({
  shippingMethod,
  onSelectShippingMethod,
  hasBuildForCrateProtection,
  includeCrateProtection,
  onToggleCrateProtection,
}: CheckoutFulfillmentSectionProps) {
  const isStorePickup = shippingMethod === "store_pickup";

  return (
    <div className="space-y-3">
      <Text size="xs" fw={700} tt="uppercase" c="dimmed">
        1. Fulfillment Method
      </Text>

      <div className="divide-y divide-slate-200 dark:divide-white/10 rounded-md border border-slate-200 dark:border-white/10 overflow-hidden bg-slate-50/40 dark:bg-white/[0.02]">
        {SHIPPING_METHODS.map((method) => {
          const selected = shippingMethod === method.id;
          return (
            <div
              key={method.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectShippingMethod(method.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectShippingMethod(method.id);
                }
              }}
              className={cn(
                "flex items-center justify-between gap-3 p-3.5 min-h-[44px] cursor-pointer transition-colors",
                selected
                  ? "bg-cyan-50/70 dark:bg-cyan-950/30"
                  : "hover:bg-slate-100/60 dark:hover:bg-white/5"
              )}
            >
              <div className="flex items-start gap-3 min-w-0">
                <Radio
                  checked={selected}
                  onChange={() => onSelectShippingMethod(method.id)}
                  color="cyan"
                  size="sm"
                  className="mt-0.5 pointer-events-none shrink-0"
                />
                <div className="space-y-0.5 min-w-0">
                  <Text size="sm" fw={700} className="text-slate-900 dark:text-slate-100">
                    {method.title}
                  </Text>
                  <Text size="xs" className="text-slate-600 dark:text-slate-400">
                    {method.courier} ·{" "}
                    {method.id === "store_pickup" ? method.eta : `ETA: ${method.eta}`}
                  </Text>
                </div>
              </div>
              <Text
                size="sm"
                fw={700}
                ff="monospace"
                className="shrink-0 text-emerald-600 dark:text-emerald-400"
              >
                {method.fee === 0 ? "FREE" : formatCurrency(method.fee)}
              </Text>
            </div>
          );
        })}
      </div>

      {!isStorePickup && hasBuildForCrateProtection && (
        <Checkbox
          color="cyan"
          size="sm"
          checked={includeCrateProtection}
          onChange={(e) => onToggleCrateProtection(e.currentTarget.checked)}
          className="pt-1"
          label={
            <Text size="xs" fw={600} className="text-slate-800 dark:text-slate-200">
              Crate &amp; GPU Foam Protection (+{formatCurrency(CRATE_PROTECTION_FEE)})
            </Text>
          }
        />
      )}
    </div>
  );
}
