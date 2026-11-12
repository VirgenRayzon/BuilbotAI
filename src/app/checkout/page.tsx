"use client";

import React from "react";
import Link from "next/link";
import {
  Alert,
  Button,
  Divider,
  Group,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  AlertTriangle,
  ArrowLeft,
  Receipt,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { SimulatedGcashModal } from "@/components/ecommerce/simulated-gcash-modal";
import { SimulatedPaymongoModal } from "@/components/ecommerce/paymongo-checkout-modal";
import { useCheckoutController } from "./hooks/use-checkout-controller";
import { CheckoutFulfillmentSection } from "./components/checkout-fulfillment-section";
import { CheckoutAddressSection } from "./components/checkout-address-section";
import { CheckoutPaymentSection } from "./components/checkout-payment-section";
import { CheckoutOrderSummary } from "./components/checkout-order-summary";
import { CheckoutOrderConfirmation } from "./components/checkout-order-confirmation";

export default function CheckoutPage() {
  const c = useCheckoutController();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07090e] text-slate-900 dark:text-slate-100 transition-colors pb-16 overflow-x-hidden">
      <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-8 xl:px-10 pt-6">
        <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-white/10 mb-6">
          <div className="space-y-1">
            <Group gap="xs" align="center" className="mb-1">
              <Button
                variant="subtle"
                color="gray"
                size="compact-xs"
                leftSection={<ArrowLeft size={12} />}
                onClick={() => {
                  if (c.activeReceiptOrder) {
                    c.setActiveReceiptOrder(null);
                  } else {
                    c.router.back();
                  }
                }}
                className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-cyan-500 px-0"
              >
                Back to Shopping
              </Button>
              <span className="text-slate-300 dark:text-white/20">·</span>
              <button
                type="button"
                onClick={() => c.setIsCartOpen(true)}
                className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline whitespace-nowrap"
              >
                Cart Drawer ({c.cart.length})
              </button>
            </Group>

            <Group gap="sm" align="center">
              <ThemeIcon size="lg" radius="md" color="cyan" variant="light">
                {c.activeReceiptOrder ? (
                  <Receipt size={20} />
                ) : (
                  <ShieldCheck size={20} />
                )}
              </ThemeIcon>
              <div>
                <Title
                  order={1}
                  className="font-headline text-xl sm:text-2xl font-bold tracking-tight"
                >
                  {c.activeReceiptOrder ? "Order Confirmation" : "Checkout"}
                </Title>
                {c.activeReceiptOrder && (
                  <Text size="xs" c="dimmed">
                    Order #{c.activeReceiptOrder.orderNumber}
                  </Text>
                )}
              </div>
            </Group>
          </div>
        </div>

        {c.activeReceiptOrder ? (
          <CheckoutOrderConfirmation
            order={c.activeReceiptOrder}
            isAuthenticated={Boolean(c.authUser)}
            shouldCorruptImages={c.shouldCorruptImages}
            isSubmitting={c.isSubmitting}
            onRetryPayment={c.handleRetryActiveReceiptPayment}
            onSwitchToCod={c.handleSwitchActiveReceiptToCod}
            onContinueShopping={() => {
              c.setActiveReceiptOrder(null);
              c.router.push("/pre-builts");
            }}
            onViewOrderHistory={() => {
              c.setActiveReceiptOrder(null);
              c.router.push("/profile?tab=orders");
            }}
          />
        ) : c.cart.length === 0 ? (
          <Paper
            withBorder
            radius="lg"
            p={{ base: "md", sm: "lg" }}
            className="max-w-md mx-auto my-12 text-center bg-white/85 dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm"
          >
            <Stack gap="md" align="center">
              <ThemeIcon size={52} radius="md" color="cyan" variant="light">
                <ShoppingBag size={26} />
              </ThemeIcon>
              <Title order={3} className="font-headline text-lg font-bold">
                Your Cart is Empty
              </Title>
              <Text size="xs" c="dimmed">
                Add custom PC parts or prebuilt systems before checking out.
              </Text>
              <Group justify="center" gap="sm" pt="xs">
                <Button component={Link} href="/builder" color="cyan" size="xs" radius="md">
                  Open PC Builder
                </Button>
                <Button
                  component={Link}
                  href="/pre-builts"
                  variant="default"
                  size="xs"
                  radius="md"
                >
                  Browse Prebuilts
                </Button>
                <Button
                  component={Link}
                  href="/parts"
                  variant="default"
                  size="xs"
                  radius="md"
                >
                  Browse Parts
                </Button>
              </Group>
            </Stack>
          </Paper>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            <div className="lg:col-span-7">
              <Paper
                withBorder
                radius="lg"
                p={{ base: "md", sm: "lg" }}
                className="bg-white/85 dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm"
              >
                <Stack gap="lg">
                  {c.checkoutError && (
                    <Alert
                      color="red"
                      variant="light"
                      radius="md"
                      icon={<AlertTriangle size={18} />}
                      title="Checkout Issue"
                    >
                      <Text size="xs">{c.checkoutError}</Text>
                    </Alert>
                  )}

                  <CheckoutFulfillmentSection
                    shippingMethod={c.shippingMethod}
                    onSelectShippingMethod={c.setShippingMethod}
                    hasBuildForCrateProtection={c.hasBuildForCrateProtection}
                    includeCrateProtection={c.includeCrateProtection}
                    onToggleCrateProtection={c.setIncludeCrateProtection}
                  />

                  <Divider className="border-slate-200 dark:border-white/10" />

                  <CheckoutAddressSection
                    isStorePickup={c.shippingMethod === "store_pickup"}
                    address={c.address}
                    onChangeAddress={c.setAddress}
                    savedAddresses={c.savedAddresses}
                    selectedAddressId={c.selectedAddressId}
                    onSelectSavedAddress={c.handleSelectSavedAddress}
                    onSelectCustomAddress={c.handleSelectCustomAddress}
                    onCancelCustomAddress={c.handleCancelCustomAddress}
                    saveAddressToBook={c.saveAddressToBook}
                    onToggleSaveAddressToBook={c.setSaveAddressToBook}
                  />

                  <Divider className="border-slate-200 dark:border-white/10" />

                  <CheckoutPaymentSection
                    paymentMethods={c.enabledPaymentMethods}
                    selectedPaymentMethod={c.paymentMethod}
                    onSelectPaymentMethod={c.handleSelectPaymentMethod}
                  />
                </Stack>
              </Paper>
            </div>

            <div className="lg:col-span-5 lg:sticky lg:top-24">
              <CheckoutOrderSummary
                cart={c.cart}
                totalItemCount={c.totalItemCount}
                shouldCorruptImages={c.shouldCorruptImages}
                voucherInput={c.voucherInput}
                onChangeVoucherInput={c.setVoucherInput}
                appliedVoucher={c.appliedVoucher}
                onApplyVoucher={c.handleApplyVoucher}
                onRemoveVoucher={() => c.setAppliedVoucher(null)}
                pricing={c.pricing}
                paymentMethod={c.paymentMethod}
                isSubmitting={c.isSubmitting}
                onConfirmOrder={c.handleConfirmOrder}
              />
            </div>
          </div>
        )}
      </main>

      <SimulatedGcashModal
        opened={Boolean(c.pendingGcashOrder)}
        onClose={() => c.setPendingGcashOrder(null)}
        order={c.pendingGcashOrder}
        onOutcomeResolved={(res) =>
          c.resolveModalOrderOutcome("gcash_simulated", res)
        }
      />

      <SimulatedPaymongoModal
        opened={Boolean(c.pendingPaymongoOrder)}
        onClose={() => c.setPendingPaymongoOrder(null)}
        order={c.pendingPaymongoOrder}
        onOutcomeResolved={(res) =>
          c.resolveModalOrderOutcome("paymongo_simulated", res)
        }
      />
    </div>
  );
}
