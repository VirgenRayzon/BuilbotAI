"use client";

import React from "react";
import {
  Badge,
  Button,
  Divider,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { ShieldCheck, Tag } from "lucide-react";
import {
  getEcommerceFallbackImage,
  isInvalidPlaceholderUrl,
  type EcommerceCartItem,
} from "@/context/ecommerce-context";
import { OptimizedImage } from "@/components/ui/optimized-image";
import type { AuthoritativeOrderTotals } from "@/lib/payment-methods";
import type { PaymentMethod } from "@/lib/types";
import { formatCurrency, getOptimizedStorageUrl } from "@/lib/utils";

interface CheckoutOrderSummaryProps {
  cart: EcommerceCartItem[];
  totalItemCount: number;
  shouldCorruptImages: boolean;
  voucherInput: string;
  onChangeVoucherInput: (val: string) => void;
  appliedVoucher: string | null;
  onApplyVoucher: () => void;
  onRemoveVoucher: () => void;
  pricing: AuthoritativeOrderTotals;
  paymentMethod: PaymentMethod;
  isSubmitting: boolean;
  onConfirmOrder: () => void;
}

export function CheckoutOrderSummary({
  cart,
  totalItemCount,
  shouldCorruptImages,
  voucherInput,
  onChangeVoucherInput,
  appliedVoucher,
  onApplyVoucher,
  onRemoveVoucher,
  pricing,
  paymentMethod,
  isSubmitting,
  onConfirmOrder,
}: CheckoutOrderSummaryProps) {
  const ctaLabel =
    paymentMethod === "gcash_simulated"
      ? `Proceed to GCash · ${formatCurrency(pricing.totalPrice)}`
      : paymentMethod === "paymongo_simulated"
        ? `Proceed to PayMongo Checkout · ${formatCurrency(pricing.totalPrice)}`
        : `Place COD Order · ${formatCurrency(pricing.totalPrice)}`;

  return (
    <Paper
      withBorder
      radius="lg"
      p={{ base: "md", sm: "lg" }}
      className="bg-white/85 dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm"
    >
      <Stack gap="md">
        <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-white/10">
          <Title
            order={4}
            className="font-headline text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200"
          >
            Order Summary
          </Title>
          <Badge size="sm" variant="light" color="cyan" className="font-mono">
            {totalItemCount} {totalItemCount === 1 ? "Item" : "Items"}
          </Badge>
        </div>

        <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
          {cart.map((item) => {
            const fallbackImg = getEcommerceFallbackImage(item.category, item.kind);
            const rawImg = isInvalidPlaceholderUrl(item.imageUrl)
              ? fallbackImg
              : item.imageUrl!;
            const resolvedImg =
              getOptimizedStorageUrl(rawImg, shouldCorruptImages) || fallbackImg;

            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 pb-2.5 border-b border-slate-100 dark:border-white/5 last:border-b-0 last:pb-0"
              >
                <div className="flex items-center gap-2.5 min-w-0">
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
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Qty: {item.quantity} · {formatCurrency(item.price)}
                    </p>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 shrink-0">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            );
          })}
        </div>

        <div className="pt-2 border-t border-slate-200 dark:border-white/10 space-y-2">
          <Group gap="xs" wrap="nowrap">
            <TextInput
              placeholder="Promo or voucher code"
              aria-label="Promo or voucher code"
              size="sm"
              radius="md"
              className="flex-1"
              leftSection={<Tag size={13} />}
              value={voucherInput}
              onChange={(e) => onChangeVoucherInput(e.currentTarget.value)}
            />
            <Button
              size="sm"
              variant="light"
              color="cyan"
              radius="md"
              onClick={onApplyVoucher}
              className="h-11 sm:h-9"
            >
              Apply
            </Button>
          </Group>
          {appliedVoucher && (
            <Group justify="space-between" align="center">
              <Badge size="xs" color="teal" variant="light">
                Active: {appliedVoucher}
              </Badge>
              <button
                type="button"
                onClick={onRemoveVoucher}
                className="text-xs text-rose-500 hover:underline whitespace-nowrap"
              >
                Remove
              </button>
            </Group>
          )}
        </div>

        <Divider className="border-slate-200 dark:border-white/10" />

        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-600 dark:text-slate-300">
            <span>Hardware Subtotal</span>
            <span className="font-mono font-medium">
              {formatCurrency(pricing.subtotal)}
            </span>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-slate-300">
            <span>Shipping</span>
            <span className="font-mono font-medium">
              {pricing.shippingFee === 0 ? "FREE" : formatCurrency(pricing.shippingFee)}
            </span>
          </div>
          {pricing.protectionFee > 0 && (
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Crate &amp; Foam Protection</span>
              <span className="font-mono font-medium">
                {formatCurrency(pricing.protectionFee)}
              </span>
            </div>
          )}
          {pricing.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
              <span>Voucher Discount</span>
              <span className="font-mono">
                -{formatCurrency(pricing.discountAmount)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Included 12% PH VAT</span>
            <span className="font-mono">
              {formatCurrency(pricing.vatIncludedAmount)}
            </span>
          </div>
        </div>

        <Divider className="border-slate-200 dark:border-white/10" />

        <Group justify="space-between" align="baseline">
          <Text size="xs" fw={700} tt="uppercase">
            Total Amount
          </Text>
          <Text
            size="xl"
            fw={900}
            ff="monospace"
            className="text-emerald-600 dark:text-emerald-400"
          >
            {formatCurrency(pricing.totalPrice)}
          </Text>
        </Group>

        <Button
          fullWidth
          color={paymentMethod === "gcash_simulated" ? "blue" : "teal"}
          size="md"
          radius="md"
          loading={isSubmitting}
          leftSection={<ShieldCheck size={17} />}
          onClick={onConfirmOrder}
          className="h-11"
        >
          {ctaLabel}
        </Button>
      </Stack>
    </Paper>
  );
}
