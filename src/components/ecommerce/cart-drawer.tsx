"use client";

import React, { useState } from "react";
import {
  Badge,
  Button,
  Checkbox,
  Collapse,
  Drawer,
  Paper,
  Progress,
  ScrollArea,
  Stack,
  Text,
} from "@mantine/core";
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Cpu,
  Loader2,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  Truck,
  Wrench,
  X,
} from "lucide-react";
import {
  useEcommerce,
  getEcommerceFallbackImage,
  isInvalidPlaceholderUrl,
} from "@/context/ecommerce-context";
import { useSiteSettings } from "@/context/site-settings-context";
import { formatCurrency, getOptimizedStorageUrl } from "@/lib/utils";
import { OptimizedImage } from "@/components/ui/optimized-image";
import Link from "next/link";
import { useRouter } from "next/navigation";

const FREE_SHIPPING_THRESHOLD = 50000;

export function CartDrawer() {
  const { isEcommerceMode, shouldCorruptImages } = useSiteSettings();
  const router = useRouter();
  const {
    cart,
    cartCount,
    subtotal,
    isCartOpen,
    setIsCartOpen,
    setActiveReceiptOrder,
    removeFromCart,
    updateQuantity,
    toggleAssemblyOption,
    clearCart,
  } = useEcommerce();

  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  if (!isEcommerceMode) return null;

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const progressPct = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const amountRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setActiveReceiptOrder(null);
    router.push("/checkout");
  };

  return (
    <Drawer
      opened={isCartOpen}
      onClose={() => setIsCartOpen(false)}
      position="right"
      size="md"
      padding={0}
      zIndex={100001}
      withCloseButton={false}
      overlayProps={{ backgroundOpacity: 0.55, blur: 4 }}
      classNames={{
        content:
          "bg-white dark:bg-[#0e131d] text-slate-900 dark:text-slate-100 border-l border-slate-200 dark:border-white/10 flex flex-col h-full",
        body: "p-0 flex flex-col flex-1 h-full overflow-hidden",
      }}
    >
      {/* Top Drawer Header — Strictly Non-Wrapping Single Row */}
      <div className="px-4 py-3.5 border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-[#131926] flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-400 border border-cyan-500/20">
            <ShoppingCart size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-headline text-base font-extrabold uppercase tracking-tight text-slate-900 dark:text-slate-100 truncate">
                Shopping Cart
              </h3>
              <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-cyan-600 text-white font-mono text-[11px] font-bold shrink-0">
                {cartCount}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              Netcodex Storefront • Instant Checkout
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {cart.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-500/5 hover:bg-rose-500/15 border border-rose-500/20 transition-colors cursor-pointer"
              title="Clear all items from cart"
            >
              <Trash2 size={13} className="shrink-0" />
              <span>Clear</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsCartOpen(false)}
            aria-label="Close shopping cart"
            className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0e131d] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="Close cart"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Free Express Shipping Meter */}
      <div className="px-4 py-2.5 bg-cyan-500/5 dark:bg-cyan-500/10 border-b border-cyan-500/20 shrink-0">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <Truck size={14} className="text-cyan-600 dark:text-cyan-400 shrink-0" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
              {amountRemaining === 0
                ? "Unlocked FREE Metro Manila Express Shipping!"
                : `Add ${formatCurrency(amountRemaining)} more for FREE Express Shipping`}
            </span>
          </div>
          <Badge size="xs" variant="light" color={amountRemaining === 0 ? "teal" : "cyan"} className="shrink-0">
            {Math.round(progressPct)}%
          </Badge>
        </div>
        <Progress
          value={progressPct}
          size="xs"
          radius="xl"
          color={amountRemaining === 0 ? "teal" : "cyan"}
          striped={amountRemaining === 0}
        />
      </div>

      {/* Cart Items Area */}
      {cart.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 mb-4">
            <ShoppingBag size={30} />
          </div>
          <h4 className="font-headline text-lg font-bold mb-1">
            Your Netcodex Cart is Empty
          </h4>
          <Text size="xs" c="dimmed" className="max-w-xs mb-6 leading-relaxed">
            Configure a custom PC rig in the Builder, select a ready-to-ship Prebuilt system, or browse individual PC components.
          </Text>
          <div className="flex items-center gap-2">
            <Button
              component={Link}
              href="/builder"
              onClick={() => setIsCartOpen(false)}
              color="cyan"
              size="xs"
              radius="md"
              leftSection={<Cpu size={14} />}
              className="uppercase tracking-wider font-bold"
            >
              Open Builder
            </Button>
            <Button
              component={Link}
              href="/parts"
              onClick={() => setIsCartOpen(false)}
              variant="default"
              size="xs"
              radius="md"
              leftSection={<Package size={14} />}
              className="uppercase tracking-wider font-bold"
            >
              Browse Parts
            </Button>
          </div>
        </div>
      ) : (
        <ScrollArea className="flex-1 px-4 py-3" scrollbarSize={6}>
          <Stack gap="sm">
            {cart.map((item) => {
              const isExpanded = Boolean(expandedItems[item.id]);
              const hasSubComponents = item.components && item.components.length > 0;
              const fallbackImage = getEcommerceFallbackImage(item.category, item.kind);
              const rawItemImg = isInvalidPlaceholderUrl(item.imageUrl)
                ? fallbackImage
                : item.imageUrl!;
              const resolvedImage =
                getOptimizedStorageUrl(rawItemImg, shouldCorruptImages) || fallbackImage;

              return (
                <Paper
                  key={item.id}
                  withBorder
                  radius="lg"
                  p="sm"
                  className="bg-slate-50/70 dark:bg-[#141b29] border-slate-200 dark:border-white/10 shadow-xs"
                >
                  <Stack gap="xs">
                    <div className="flex items-start gap-3">
                      {/* Item Thumbnail Image */}
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200/80 bg-white dark:border-white/10 dark:bg-[#0e131d]">
                        <OptimizedImage
                          src={resolvedImage}
                          alt={item.name}
                          fill
                          sizes="64px"
                          fallbackIcon={<Loader2 className="h-4 w-4 animate-spin" />}
                          className="object-contain p-1.5"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap mb-1">
                              <Badge
                                size="xs"
                                radius="sm"
                                variant="light"
                                color={
                                  item.kind === "custom-build"
                                    ? "cyan"
                                    : item.kind === "prebuilt"
                                      ? "teal"
                                      : "blue"
                                }
                                className="uppercase text-[9px] font-bold"
                              >
                                {item.kind === "custom-build"
                                  ? "Custom PC Build"
                                  : item.kind === "prebuilt"
                                    ? `Prebuilt • ${item.tier || "System"}`
                                    : item.category || "Component"}
                              </Badge>
                              {item.sku && (
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate">
                                  {item.sku}
                                </span>
                              )}
                            </div>
                            <Text size="sm" fw={700} className="leading-snug text-slate-900 dark:text-white">
                              {item.name}
                            </Text>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            aria-label={`Remove ${item.name}`}
                            title={`Remove ${item.name}`}
                            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Assembly & Burn-In Service Badge for Custom Builds */}
                    {item.kind === "custom-build" && (
                      <Paper
                        withBorder
                        radius="md"
                        p="xs"
                        className="bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20"
                      >
                        <Checkbox
                          size="xs"
                          color="teal"
                          checked={Boolean(item.includeAssembly)}
                          onChange={() => toggleAssemblyOption(item.id)}
                          label={
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                              <Wrench size={12} className="shrink-0" />
                              <span>Pro Rig Assembly, BIOS Update & 24h Burn-In Stress Test (FREE)</span>
                            </div>
                          }
                        />
                      </Paper>
                    )}

                    {/* Expandable Component Breakdown for Custom Builds & Prebuilts */}
                    {hasSubComponents && (
                      <div>
                        <button
                          type="button"
                          onClick={() => toggleExpand(item.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                        >
                          <span>
                            {isExpanded
                              ? "Hide Build Components"
                              : `View ${item.components!.length} Included Components`}
                          </span>
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                        <Collapse in={isExpanded}>
                          <div className="mt-2 space-y-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-black/25 p-2">
                            {item.components!.map((sub, idx) => {
                              const subFallback = getEcommerceFallbackImage(sub.category, "part");
                              const rawSubImg = isInvalidPlaceholderUrl(sub.imageUrl)
                                ? subFallback
                                : sub.imageUrl!;
                              const subImg =
                                getOptimizedStorageUrl(rawSubImg, shouldCorruptImages) ||
                                subFallback;

                              return (
                                <div
                                  key={`${sub.category}-${idx}`}
                                  className="flex items-center justify-between text-[11px] gap-2.5 py-1 border-b last:border-b-0 border-slate-100 dark:border-white/5"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-slate-200/80 bg-white dark:border-white/10 dark:bg-[#0e131d]">
                                      <OptimizedImage
                                        src={subImg}
                                        alt={sub.name}
                                        fill
                                        sizes="36px"
                                        fallbackIcon={<Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                        className="object-contain p-1"
                                      />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 leading-none mb-0.5">
                                        {sub.category}
                                      </div>
                                      <div className="truncate font-medium text-slate-700 dark:text-slate-200 leading-tight">
                                        {sub.name}
                                      </div>
                                    </div>
                                  </div>
                                  <span className="font-mono font-semibold text-slate-600 dark:text-slate-300 shrink-0">
                                    {formatCurrency(sub.price)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </Collapse>
                      </div>
                    )}

                    {/* Quantity Stepper & Line Total */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0e131d] px-1.5 py-0.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          aria-label="Decrease quantity"
                          className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-xs font-bold font-mono min-w-[22px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          aria-label="Increase quantity"
                          className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <div className="text-right">
                        {item.quantity > 1 && (
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono leading-tight">
                            {formatCurrency(item.price)} each
                          </div>
                        )}
                        <div className="text-sm font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(item.price * item.quantity)}
                        </div>
                      </div>
                    </div>
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        </ScrollArea>
      )}

      {/* Sticky Footer with Checkout CTA */}
      {cart.length > 0 && (
        <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50/90 dark:bg-[#131926] space-y-3 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                Cart Subtotal ({cartCount} {cartCount === 1 ? "item" : "items"})
              </span>
              <span className="text-lg font-black font-mono text-slate-900 dark:text-white">
                {formatCurrency(subtotal)}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              Shipping fees, fragile GPU/glass crate protection, and promo vouchers are calculated at checkout.
            </p>
          </div>

          <Button
            fullWidth
            size="md"
            radius="md"
            color="cyan"
            rightSection={<ArrowRight size={16} />}
            onClick={handleProceedToCheckout}
            className="font-headline font-bold text-xs uppercase tracking-wider shadow-md shadow-cyan-500/20"
          >
            Proceed to Checkout
          </Button>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
            <ShieldCheck size={13} className="text-emerald-500 shrink-0" />
            <span className="truncate">
              Supports GCash • Maya • QRPh • Visa/Mastercard • BPI/BDO • COD
            </span>
          </div>
        </div>
      )}
    </Drawer>
  );
}
