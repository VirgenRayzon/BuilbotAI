"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  Divider,
  Group,
  Modal,
  Paper,
  ScrollArea,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookMarked,
  CheckCircle2,
  CreditCard,
  FlaskConical,
  Lock,
  MapPin,
  PackageCheck,
  Plus,
  Receipt,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Store,
  Tag,
  Truck,
} from "lucide-react";
import {
  useEcommerce,
  type ShippingAddress,
  type ShippingMethodId,
} from "@/context/ecommerce-context";
import { useSiteSettings } from "@/context/site-settings-context";
import { useUserProfile } from "@/context/user-profile";
import { useAddressBook } from "@/hooks/use-address-book";
import { formatCurrency, cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  CRATE_PROTECTION_FEE,
  PAYMENT_METHODS_LIST,
  SUPPORTED_VOUCHERS,
  calculateAuthoritativeOrderTotals,
  cartSupportsCrateProtection,
} from "@/lib/payment-methods";
import type { PaymentMethod, PaymentStatus, SavedAddress } from "@/lib/types";
import {
  createCheckoutOrder,
  switchOrderPaymentToCod,
} from "@/app/checkout-actions";
import {
  SimulatedGcashModal,
  type SimulatedGcashModalOrderInfo,
} from "@/components/ecommerce/simulated-gcash-modal";
import {
  SimulatedPaymongoModal,
  type SimulatedPaymongoModalOrderInfo,
} from "@/components/ecommerce/paymongo-checkout-modal";
import { useToast } from "@/hooks/use-toast";

const SHIPPING_METHODS: Array<{
  id: ShippingMethodId;
  title: string;
  courier: string;
  eta: string;
  fee: number;
  badge: string;
  desc: string;
}> = [
  {
    id: "standard_courier",
    title: "Standard Nationwide Insured Courier",
    courier: "LBC Express / J&T Express",
    eta: "3–5 Business Days",
    fee: 250,
    badge: "Nationwide PH",
    desc: "Door-to-door air/land cargo with shock-resistant outer box.",
  },
  {
    id: "sameday_express",
    title: "Same-Day Metro Manila 4-Wheel Express",
    courier: "Lalamove / GrabExpress MPV",
    eta: "Same Day (Before 8 PM)",
    fee: 550,
    badge: "Recommended for Full Rigs",
    desc: "Dedicated 4-wheel sedan/MPV transport for assembled tempered-glass PC rigs.",
  },
  {
    id: "store_pickup",
    title: "In-Store Branch Pickup",
    courier: "BuildbotAI Hub — Gilmore / Makati Showroom",
    eta: "Ready in 2–4 Hours",
    fee: 0,
    badge: "FREE",
    desc: "Inspect your components or test your assembled rig at our showroom bench.",
  },
];

const PH_REGIONS = [
  "Metro Manila (NCR)",
  "CALABARZON (Region IV-A)",
  "Central Luzon (Region III)",
  "Ilocos Region (Region I)",
  "Central Visayas (Cebu / Region VII)",
  "Western Visayas (Region VI)",
  "Davao Region (Region XI)",
  "Northern Mindanao (Region X)",
];

export function CheckoutModal() {
  const { isEcommerceMode } = useSiteSettings();
  const { profile, authUser } = useUserProfile();
  const { addresses: savedAddresses, defaultAddress, addAddress } = useAddressBook();
  const { toast } = useToast();
  const router = useRouter();
  const {
    cart,
    isCheckoutOpen,
    setIsCheckoutOpen,
    activeReceiptOrder,
    setActiveReceiptOrder,
    placeMockOrder,
  } = useEcommerce();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [shippingMethod, setShippingMethod] =
    useState<ShippingMethodId>("store_pickup");
  const [includeCrateProtection, setIncludeCrateProtection] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [pendingGcashOrder, setPendingGcashOrder] =
    useState<SimulatedGcashModalOrderInfo | null>(null);
  const [pendingPaymongoOrder, setPendingPaymongoOrder] =
    useState<SimulatedPaymongoModalOrderInfo | null>(null);
  const [pendingReceiptSnapshot, setPendingReceiptSnapshot] = useState<{
    items: typeof cart;
    shippingMethod: ShippingMethodId;
    courierName: string;
    estimatedDelivery: string;
    shippingAddress: ShippingAddress;
    includeCrateProtection: boolean;
    voucherCode?: string;
    subtotal: number;
    shippingFee: number;
    protectionFee: number;
    discountAmount: number;
    vatAmount: number;
    total: number;
  } | null>(null);
  const operationIdRef = useRef<string | null>(null);

  // Voucher state
  const [voucherInput, setVoucherInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<string | null>(null);

  // Address Form
  const [address, setAddress] = useState<ShippingAddress>({
    fullName: profile?.name || authUser?.displayName || "Juan Dela Cruz",
    phone: "+63 917 882 4910",
    email: profile?.email || authUser?.email || "customer@buildbot.ph",
    region: "Metro Manila (NCR)",
    city: "Quezon City",
    barangay: "Valencia (Gilmore IT Hub)",
    streetAddress: "Unit 804, Cyberzone Tower, Granada St. cor. Aurora Blvd.",
    postalCode: "1112",
    notes: "Please call mobile number upon arrival. Keep PC box upright.",
  });

  // Saved Address Book selection state
  const [selectedAddressId, setSelectedAddressId] = useState<string | "custom">("auto");
  const [saveAddressToBook, setSaveAddressToBook] = useState(false);
  const [newAddressLabel, setNewAddressLabel] = useState<string>("Home");

  // Automatically initialize address from default address in book
  useEffect(() => {
    if (savedAddresses.length > 0 && selectedAddressId === "auto") {
      const target = defaultAddress || savedAddresses[0];
      if (target) {
        setSelectedAddressId(target.id);
        setAddress({
          fullName: target.fullName || profile?.name || authUser?.displayName || "Juan Dela Cruz",
          phone: target.phone || "+63 917 882 4910",
          email: target.email || profile?.email || authUser?.email || "customer@buildbot.ph",
          region: target.region || "Metro Manila (NCR)",
          city: target.city || "Quezon City",
          barangay: target.barangay || "Valencia (Gilmore IT Hub)",
          streetAddress: target.streetAddress || "",
          postalCode: target.postalCode || "1112",
          notes: target.notes || "",
        });
      }
    }
  }, [savedAddresses, defaultAddress, selectedAddressId, profile, authUser]);

  const handleSelectSavedAddress = (saved: SavedAddress) => {
    setSelectedAddressId(saved.id);
    setAddress({
      fullName: saved.fullName,
      phone: saved.phone,
      email: saved.email || profile?.email || authUser?.email || "customer@buildbot.ph",
      region: saved.region,
      city: saved.city,
      barangay: saved.barangay,
      streetAddress: saved.streetAddress,
      postalCode: saved.postalCode,
      notes: saved.notes || "",
    });
    setSaveAddressToBook(false);
  };

  const handleSelectCustomAddress = () => {
    setSelectedAddressId("custom");
    setSaveAddressToBook(true);
  };

  const selectedShippingObj = useMemo(
    () =>
      SHIPPING_METHODS.find((m) => m.id === shippingMethod) ||
      SHIPPING_METHODS[0],
    [shippingMethod]
  );

  const selectedPaymentDef = useMemo(
    () =>
      PAYMENT_METHODS_LIST.find((p) => p.id === paymentMethod) ||
      PAYMENT_METHODS_LIST[0],
    [paymentMethod]
  );

  const hasBuildForCrateProtection = useMemo(
    () =>
      cartSupportsCrateProtection(
        cart.map((item) => ({
          price: item.price,
          quantity: item.quantity,
          kind: item.kind,
        }))
      ),
    [cart]
  );

  useEffect(() => {
    if (!hasBuildForCrateProtection) {
      setIncludeCrateProtection(false);
    }
  }, [hasBuildForCrateProtection]);

  const pricing = useMemo(
    () =>
      calculateAuthoritativeOrderTotals({
        items: cart.map((i) => ({
          price: i.price,
          quantity: i.quantity,
          kind: i.kind,
        })),
        shippingMethod,
        includeCrateProtection:
          shippingMethod !== "store_pickup" &&
          hasBuildForCrateProtection &&
          includeCrateProtection,
        voucherCode: appliedVoucher,
      }),
    [
      cart,
      shippingMethod,
      hasBuildForCrateProtection,
      includeCrateProtection,
      appliedVoucher,
    ]
  );

  if (!isEcommerceMode) return null;

  const handleApplyVoucher = () => {
    const code = voucherInput.trim().toUpperCase();
    if (!code) return;
    const matched = SUPPORTED_VOUCHERS[code];
    if (matched && pricing.subtotal >= matched.minSubtotal) {
      setAppliedVoucher(matched.code);
      setVoucherInput("");
    } else {
      toast({
        title: "Invalid or Ineligible Voucher",
        description: "Try BUILDBOT1000 (min ₱5,000) or STUDENT500 (min ₱2,500).",
        variant: "destructive",
      });
    }
  };

  const mapPaymentStatusLabel = (
    status: PaymentStatus,
    method: PaymentMethod
  ):
    | "Paid (GCash)"
    | "Paid (PayMongo)"
    | "Payment Pending"
    | "Payment Failed"
    | "Payment Cancelled"
    | "Unpaid (Pay on Delivery)" => {
    if (status === "paid") {
      return method === "paymongo_simulated"
        ? "Paid (PayMongo)"
        : "Paid (GCash)";
    }
    if (status === "pending") return "Payment Pending";
    if (status === "failed") return "Payment Failed";
    if (status === "cancelled") return "Payment Cancelled";
    return method === "cod" ? "Unpaid (Pay on Delivery)" : "Payment Pending";
  };

  const handleConfirmOrder = async () => {
    if (cart.length === 0 || isSubmitting) return;
    setCheckoutError(null);

    if (!authUser) {
      handleClose();
      router.push("/signin?returnTo=/checkout");
      return;
    }

    setIsSubmitting(true);
    try {
      const idToken = await authUser.getIdToken();
      operationIdRef.current ??= crypto.randomUUID();
      const cartSnapshot = [...cart];

      const result = await createCheckoutOrder({
        idToken,
        operationId: operationIdRef.current,
        cartItems: cartSnapshot.map((item) => ({
          id: item.id,
          productId: item.productId,
          kind: item.kind,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          category: item.category,
          imageUrl: item.imageUrl,
          tier: item.tier,
          components: item.components,
        })),
        paymentMethod,
        shippingMethod,
        shippingAddress: address,
        includeCrateProtection:
          shippingMethod !== "store_pickup" &&
          hasBuildForCrateProtection &&
          includeCrateProtection,
        voucherCode: appliedVoucher,
      });

      if (!result.success || !result.orderId) {
        operationIdRef.current = null;
        setCheckoutError(
          result.error || "Could not complete checkout. Please check item stock."
        );
        return;
      }

      // If requested, save new address to Address Book
      if (saveAddressToBook && shippingMethod !== "store_pickup") {
        addAddress({
          label: newAddressLabel || "Home",
          fullName: address.fullName,
          phone: address.phone,
          email: address.email,
          region: address.region,
          city: address.city,
          barangay: address.barangay,
          streetAddress: address.streetAddress,
          postalCode: address.postalCode,
          notes: address.notes,
          isDefault: savedAddresses.length === 0,
        }).catch((err) => {
          console.warn("Could not save address in modal checkout:", err);
        });
      }

      const snapshotData = {
        items: cartSnapshot,
        shippingMethod,
        courierName: selectedShippingObj.courier,
        estimatedDelivery: selectedShippingObj.eta,
        shippingAddress: address,
        includeCrateProtection: (result.protectionFee ?? 0) > 0,
        voucherCode: appliedVoucher || undefined,
        subtotal: result.subtotal ?? pricing.subtotal,
        shippingFee: result.shippingFee ?? pricing.shippingFee,
        protectionFee: result.protectionFee ?? pricing.protectionFee,
        discountAmount: result.discountAmount ?? pricing.discountAmount,
        vatAmount: result.vatIncludedAmount ?? pricing.vatIncludedAmount,
        total: result.totalPrice ?? pricing.totalPrice,
      };

      operationIdRef.current = null;

      if (paymentMethod === "gcash_simulated") {
        setPendingReceiptSnapshot(snapshotData);
        setPendingGcashOrder({
          orderId: result.orderId,
          orderNumber: result.orderNumber || result.orderId.slice(0, 8),
          totalPrice: snapshotData.total,
          paymentReference: result.paymentReference,
          itemCount: cartSnapshot.reduce((s, i) => s + i.quantity, 0),
        });
        return;
      }

      if (paymentMethod === "paymongo_simulated") {
        setPendingReceiptSnapshot(snapshotData);
        setPendingPaymongoOrder({
          orderId: result.orderId,
          orderNumber: result.orderNumber || result.orderId.slice(0, 8),
          totalPrice: snapshotData.total,
          paymentReference: result.paymentReference,
          itemCount: cartSnapshot.reduce((s, i) => s + i.quantity, 0),
          paymongoCheckoutSessionId: result.paymongoCheckoutSessionId,
          paymongoCheckoutUrl: result.paymongoCheckoutUrl,
          paymongoMode: result.paymongoMode,
        });
        return;
      }

      placeMockOrder({
        id: result.orderId,
        firestoreOrderId: result.orderId,
        orderNumber: result.orderNumber,
        paymentReference: result.paymentReference,
        ...snapshotData,
        paymentMethod: "cod",
        paymentLabel: selectedPaymentDef.label,
        paymentStatus: "Unpaid (Pay on Delivery)",
        fulfillmentStage: "order_placed",
      });

      toast({
        title: `Order ${result.orderNumber} Reserved!`,
        description:
          "Stock deducted and Cash on Delivery order recorded in Firestore.",
      });
      setStep(1);
    } catch (err) {
      operationIdRef.current = null;
      setCheckoutError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGcashOutcomeResolved = (outcomeResult: {
    outcome: "success" | "failed" | "cancelled";
    paymentStatus: PaymentStatus;
    paymentReference: string | null;
    paidAt: string | null;
  }) => {
    if (!pendingGcashOrder) return;
    const snapshot = pendingReceiptSnapshot;
    const statusLabel = mapPaymentStatusLabel(
      outcomeResult.paymentStatus,
      "gcash_simulated"
    );

    if (snapshot) {
      placeMockOrder({
        id: pendingGcashOrder.orderId,
        firestoreOrderId: pendingGcashOrder.orderId,
        orderNumber: pendingGcashOrder.orderNumber,
        paymentReference:
          outcomeResult.paymentReference ||
          pendingGcashOrder.paymentReference ||
          undefined,
        ...snapshot,
        paymentMethod: "gcash_simulated",
        paymentLabel: "GCash",
        paymentStatus: statusLabel,
        fulfillmentStage: "order_placed",
      });
      setPendingReceiptSnapshot(null);
    } else if (activeReceiptOrder) {
      setActiveReceiptOrder({
        ...activeReceiptOrder,
        paymentMethod: "gcash_simulated",
        paymentLabel: "GCash",
        paymentStatus: statusLabel,
        paymentReference:
          outcomeResult.paymentReference || activeReceiptOrder.paymentReference,
        fulfillmentStage: "order_placed",
      });
    }

    setPendingGcashOrder(null);
  };

  const handlePaymongoOutcomeResolved = (outcomeResult: {
    outcome: "success" | "failed" | "cancelled";
    paymentStatus: PaymentStatus;
    paymentReference: string | null;
    paidAt: string | null;
  }) => {
    if (!pendingPaymongoOrder) return;
    const snapshot = pendingReceiptSnapshot;
    const statusLabel = mapPaymentStatusLabel(
      outcomeResult.paymentStatus,
      "paymongo_simulated"
    );

    if (snapshot) {
      placeMockOrder({
        id: pendingPaymongoOrder.orderId,
        firestoreOrderId: pendingPaymongoOrder.orderId,
        orderNumber: pendingPaymongoOrder.orderNumber,
        paymentReference:
          outcomeResult.paymentReference ||
          pendingPaymongoOrder.paymentReference ||
          undefined,
        ...snapshot,
        paymentMethod: "paymongo_simulated",
        paymentLabel: "PayMongo",
        paymentStatus: statusLabel,
        fulfillmentStage: "order_placed",
      });
      setPendingReceiptSnapshot(null);
    } else if (activeReceiptOrder) {
      setActiveReceiptOrder({
        ...activeReceiptOrder,
        paymentMethod: "paymongo_simulated",
        paymentLabel: "PayMongo",
        paymentStatus: statusLabel,
        paymentReference:
          outcomeResult.paymentReference || activeReceiptOrder.paymentReference,
        fulfillmentStage: "order_placed",
      });
    }

    setPendingPaymongoOrder(null);
  };

  const handleSwitchActiveReceiptToCod = async () => {
    if (!activeReceiptOrder || !authUser) return;
    setIsSubmitting(true);
    try {
      const idToken = await authUser.getIdToken();
      const res = await switchOrderPaymentToCod(activeReceiptOrder.firestoreOrderId || activeReceiptOrder.id, idToken);
      if (res.success) {
        setActiveReceiptOrder({
          ...activeReceiptOrder,
          paymentMethod: "cod",
          paymentLabel: "Cash on Delivery (COD)",
          paymentStatus: "Unpaid (Pay on Delivery)",
          fulfillmentStage: "order_placed",
        });
        toast({
          title: "Switched to Cash on Delivery",
          description:
            "Your order is recorded and stock remains reserved. Pay upon delivery.",
        });
      } else {
        toast({
          title: "Could Not Switch Payment",
          description: res.error || "Unable to update payment method.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to switch payment method.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsCheckoutOpen(false);
    setCheckoutError(null);
    setStep(1);
  };

  return (
    <>
      <Modal
        opened={isCheckoutOpen}
        onClose={handleClose}
        size="xl"
        radius="xl"
        padding={0}
        centered
        title={
          <Group gap="sm">
            <ThemeIcon size="lg" radius="md" color="cyan" variant="light">
              {activeReceiptOrder ? (
                <Receipt size={18} />
              ) : (
                <ShieldCheck size={18} />
              )}
            </ThemeIcon>
            <div>
              <Group gap={6}>
                <Title
                  order={4}
                  className="font-headline text-base font-bold uppercase tracking-tight"
                >
                  {activeReceiptOrder
                    ? "Official Order Confirmation"
                    : "BuildbotAI Secure Checkout"}
                </Title>
                <Badge
                  size="xs"
                  color="cyan"
                  variant="light"
                  className="uppercase text-[9px] font-bold"
                >
                  Academic / Demo Checkout
                </Badge>
              </Group>
              <Text size="xs" c="dimmed">
                {activeReceiptOrder
                  ? `Order #${activeReceiptOrder.orderNumber} • Recorded in Firestore`
                  : "Server-validated Philippine PC hardware fulfillment & payment flow"}
              </Text>
            </div>
          </Group>
        }
        classNames={{
          content:
            "bg-white dark:bg-[#0e131d] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 shadow-2xl rounded-2xl overflow-hidden",
          header:
            "bg-slate-50/90 dark:bg-[#131926] border-b border-slate-200 dark:border-white/10 px-5 py-3.5",
          body: "!p-0",
        }}
      >
        {activeReceiptOrder ? (
          <div className="p-5 sm:p-6 space-y-5">
            {activeReceiptOrder.paymentStatus === "Payment Failed" ||
            activeReceiptOrder.paymentStatus === "Payment Cancelled" ? (
              <Alert
                color="red"
                variant="light"
                radius="lg"
                icon={<AlertTriangle size={20} />}
                title={`Order ${activeReceiptOrder.orderNumber} — ${activeReceiptOrder.paymentStatus}`}
                className="border border-red-500/30"
              >
                <div className="space-y-2">
                  <Text size="xs">
                    Your order is reserved in Firestore, but the{" "}
                    {activeReceiptOrder.paymentMethod === "paymongo_simulated"
                      ? "PayMongo Sandbox"
                      : "GCash"}{" "}
                    payment was not completed. Retry below or switch to COD.
                  </Text>
                  <Group gap="xs">
                    <Button
                      size="xs"
                      color={
                        activeReceiptOrder.paymentMethod === "paymongo_simulated"
                          ? "teal"
                          : "blue"
                      }
                      radius="md"
                      leftSection={<RefreshCw size={13} />}
                      onClick={() => {
                        const orderInfo = {
                          orderId:
                            activeReceiptOrder.firestoreOrderId ||
                            activeReceiptOrder.id,
                          orderNumber: activeReceiptOrder.orderNumber,
                          totalPrice: activeReceiptOrder.total,
                          paymentReference: activeReceiptOrder.paymentReference,
                        };
                        if (
                          activeReceiptOrder.paymentMethod ===
                          "paymongo_simulated"
                        ) {
                          setPendingPaymongoOrder(orderInfo);
                        } else {
                          setPendingGcashOrder(orderInfo);
                        }
                      }}
                    >
                      {activeReceiptOrder.paymentMethod === "paymongo_simulated"
                        ? "Retry PayMongo Sandbox"
                        : "Retry GCash"}
                    </Button>
                    <Button
                      size="xs"
                      variant="default"
                      radius="md"
                      loading={isSubmitting}
                      onClick={handleSwitchActiveReceiptToCod}
                    >
                      Switch to COD
                    </Button>
                  </Group>
                </div>
              </Alert>
            ) : (
              <Alert
                color="teal"
                variant="light"
                radius="lg"
                icon={<CheckCircle2 size={20} />}
                title={`Order ${activeReceiptOrder.orderNumber} Successfully Placed!`}
                className="border border-emerald-500/30"
              >
                Your order has been persisted to Firestore and stock has been
                updated. Track your order anytime in{" "}
                <strong>Profile → Orders</strong>.
              </Alert>
            )}

            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
              <Paper
                withBorder
                radius="md"
                p="sm"
                className="bg-slate-50 dark:bg-[#141b29] border-slate-200 dark:border-white/10"
              >
                <Text size="10px" c="dimmed" fw={700} tt="uppercase">
                  Order Number & Courier
                </Text>
                <Text
                  size="sm"
                  fw={800}
                  className="mt-0.5 text-cyan-600 dark:text-cyan-400 font-mono"
                >
                  {activeReceiptOrder.orderNumber}
                </Text>
                <Text size="xs" c="dimmed">
                  {activeReceiptOrder.courierName} •{" "}
                  {activeReceiptOrder.estimatedDelivery}
                </Text>
              </Paper>

              <Paper
                withBorder
                radius="md"
                p="sm"
                className="bg-slate-50 dark:bg-[#141b29] border-slate-200 dark:border-white/10"
              >
                <Text size="10px" c="dimmed" fw={700} tt="uppercase">
                  Payment Status
                </Text>
                <Group gap={4} className="mt-0.5">
                  <Badge
                    size="xs"
                    color={
                      activeReceiptOrder.paymentStatus.startsWith("Paid")
                        ? "teal"
                        : activeReceiptOrder.paymentStatus.includes("Failed") ||
                            activeReceiptOrder.paymentStatus.includes(
                              "Cancelled"
                            )
                          ? "red"
                          : "blue"
                    }
                    variant="light"
                  >
                    {activeReceiptOrder.paymentStatus}
                  </Badge>
                </Group>
                <Text size="xs" c="dimmed" ff="monospace">
                  Ref: {activeReceiptOrder.paymentReference}
                </Text>
              </Paper>

              <Paper
                withBorder
                radius="md"
                p="sm"
                className="bg-slate-50 dark:bg-[#141b29] border-slate-200 dark:border-white/10"
              >
                <Text size="10px" c="dimmed" fw={700} tt="uppercase">
                  Grand Total (VAT Incl.)
                </Text>
                <Text
                  size="lg"
                  fw={900}
                  ff="monospace"
                  className="text-emerald-600 dark:text-emerald-400"
                >
                  {formatCurrency(activeReceiptOrder.total)}
                </Text>
              </Paper>
            </SimpleGrid>

            <Group justify="space-between" pt="xs">
              <Button variant="default" radius="md" onClick={handleClose}>
                Continue Shopping
              </Button>
              {authUser && (
                <Button
                  color="cyan"
                  radius="md"
                  rightSection={<ArrowRight size={15} />}
                  onClick={() => {
                    handleClose();
                    router.push("/profile?tab=orders");
                  }}
                  className="font-headline font-bold text-xs uppercase tracking-wider"
                >
                  View in Order History
                </Button>
              )}
            </Group>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Left Column: Step Navigation & Active Step Form */}
            <div className="lg:col-span-7 p-4 sm:p-5 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-white/10">
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { num: 1, label: "1. Shipping", icon: Truck },
                  { num: 2, label: "2. Payment", icon: CreditCard },
                  { num: 3, label: "3. Review", icon: PackageCheck },
                ].map((s) => {
                  const Icon = s.icon;
                  const active = step === s.num;
                  const done = step > s.num;
                  return (
                    <button
                      key={s.num}
                      type="button"
                      onClick={() => setStep(s.num as 1 | 2 | 3)}
                      className={cn(
                        "flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-xs font-headline font-bold uppercase tracking-wider transition-all",
                        active
                          ? "bg-cyan-500 text-white border-cyan-500 shadow-sm"
                          : done
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : "bg-slate-50 dark:bg-white/[0.03] text-slate-500 border-slate-200 dark:border-white/10 hover:border-slate-300"
                      )}
                    >
                      <Icon size={14} />
                      <span>{s.label}</span>
                    </button>
                  );
                })}
              </div>

              {checkoutError && (
                <Alert
                  color="red"
                  variant="light"
                  radius="md"
                  mb="sm"
                  icon={<AlertTriangle size={16} />}
                >
                  <Text size="xs" fw={600}>
                    {checkoutError}
                  </Text>
                </Alert>
              )}

              <ScrollArea.Autosize
                mah={440}
                scrollbarSize={6}
                offsetScrollbars
              >
                {step === 1 && (
                  <Stack gap="md">
                    <div>
                      <Text
                        size="xs"
                        fw={800}
                        tt="uppercase"
                        className="tracking-wider text-cyan-600 dark:text-cyan-400 mb-2"
                      >
                        Select Fulfillment Method
                      </Text>
                      <Stack gap="xs">
                        {SHIPPING_METHODS.map((method) => {
                          const selected = shippingMethod === method.id;
                          return (
                            <Paper
                              key={method.id}
                              withBorder
                              radius="lg"
                              p="sm"
                              onClick={() => setShippingMethod(method.id)}
                              className={cn(
                                "cursor-pointer transition-all",
                                selected
                                  ? "bg-cyan-50/70 dark:bg-cyan-950/25 border-cyan-500 shadow-xs"
                                  : "bg-slate-50/60 dark:bg-[#141b29] border-slate-200 dark:border-white/10 hover:border-cyan-500/40"
                              )}
                            >
                              <Group
                                justify="space-between"
                                align="flex-start"
                                wrap="nowrap"
                              >
                                <div className="space-y-0.5">
                                  <Group gap={6}>
                                    <Text size="sm" fw={700}>
                                      {method.title}
                                    </Text>
                                    <Badge
                                      size="xs"
                                      color={selected ? "cyan" : "gray"}
                                      variant="light"
                                    >
                                      {method.badge}
                                    </Badge>
                                  </Group>
                                  <Text
                                    size="xs"
                                    fw={600}
                                    className="text-cyan-700 dark:text-cyan-300"
                                  >
                                    {method.courier} • ETA: {method.eta}
                                  </Text>
                                  <Text size="11px" c="dimmed">
                                    {method.desc}
                                  </Text>
                                </div>
                                <Text
                                  size="sm"
                                  fw={800}
                                  ff="monospace"
                                  className="shrink-0 text-emerald-600 dark:text-emerald-400"
                                >
                                  {method.fee === 0
                                    ? "FREE"
                                    : formatCurrency(method.fee)}
                                </Text>
                              </Group>
                            </Paper>
                          );
                        })}
                      </Stack>
                    </div>

                    {shippingMethod !== "store_pickup" &&
                      hasBuildForCrateProtection && (
                      <Paper
                        withBorder
                        radius="lg"
                        p="sm"
                        className="bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/30"
                      >
                        <Checkbox
                          color="cyan"
                          checked={includeCrateProtection}
                          onChange={(e) =>
                            setIncludeCrateProtection(e.currentTarget.checked)
                          }
                          label={
                            <div className="space-y-0.5">
                              <Group gap={6}>
                                <Text size="xs" fw={800}>
                                  Instapak Expanding GPU Foam + Wooden Crate
                                </Text>
                                <Badge size="xs" color="amber" variant="light">
                                  +{formatCurrency(CRATE_PROTECTION_FEE)}
                                </Badge>
                              </Group>
                              <Text size="11px" c="dimmed">
                                Prevents PCIe slot sag and tempered glass
                                shattering during transit.
                              </Text>
                            </div>
                          }
                        />
                      </Paper>
                      )}

                    <div className="space-y-3 pt-1">
                      <div className="flex items-center justify-between">
                        <Group gap={6}>
                          <MapPin size={15} className="text-cyan-500" />
                          <Text
                            size="xs"
                            fw={800}
                            tt="uppercase"
                            className="tracking-wider"
                          >
                            {shippingMethod === "store_pickup"
                              ? "Pickup Contact Person"
                              : "Philippine Delivery Address"}
                          </Text>
                        </Group>

                        {shippingMethod !== "store_pickup" && (
                          <Link
                            href="/profile?tab=address-book"
                            onClick={handleClose}
                            className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                          >
                            <BookMarked size={12} />
                            <span>Address Book</span>
                            <ArrowRight size={10} />
                          </Link>
                        )}
                      </div>

                      {/* Saved Address Book Selector */}
                      {shippingMethod !== "store_pickup" && savedAddresses.length > 0 && (
                        <div className="space-y-2">
                          <Text size="xs" fw={600} c="dimmed">
                            Choose from saved addresses:
                          </Text>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {savedAddresses.map((item) => {
                              const isSelected = selectedAddressId === item.id;
                              return (
                                <div
                                  key={item.id}
                                  onClick={() => handleSelectSavedAddress(item)}
                                  className={cn(
                                    "p-2.5 rounded-xl border text-left cursor-pointer transition-all relative",
                                    isSelected
                                      ? "bg-cyan-500/10 border-cyan-500 ring-1 ring-cyan-500 shadow-xs"
                                      : "bg-slate-50/60 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
                                  )}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-1.5">
                                      <Badge
                                        size="xs"
                                        variant={isSelected ? "filled" : "light"}
                                        color={isSelected ? "cyan" : "gray"}
                                        className="font-bold uppercase tracking-wider text-[9px]"
                                      >
                                        {item.label}
                                      </Badge>
                                      {item.isDefault && (
                                        <Badge size="xs" variant="outline" color="cyan" className="text-[8px]">
                                          Default
                                        </Badge>
                                      )}
                                    </div>
                                    {isSelected && (
                                      <CheckCircle2 size={14} className="text-cyan-500 shrink-0" />
                                    )}
                                  </div>
                                  <Text size="xs" fw={700} className="line-clamp-1">
                                    {item.fullName} • {item.phone}
                                  </Text>
                                  <Text size="11px" c="dimmed" className="line-clamp-2 mt-0.5 leading-snug">
                                    {item.streetAddress}, {item.city}
                                  </Text>
                                </div>
                              );
                            })}

                            <div
                              onClick={handleSelectCustomAddress}
                              className={cn(
                                "p-2.5 rounded-xl border border-dashed text-left cursor-pointer transition-all flex flex-col justify-center items-center text-center gap-0.5 min-h-[70px]",
                                selectedAddressId === "custom"
                                  ? "bg-cyan-500/10 border-cyan-500 ring-1 ring-cyan-500 text-cyan-500"
                                  : "border-slate-300 dark:border-white/20 text-slate-500 hover:border-cyan-500/50 hover:text-cyan-500"
                              )}
                            >
                              <Group gap={3}>
                                <Plus size={13} />
                                <Text size="xs" fw={700}>
                                  Custom Address
                                </Text>
                              </Group>
                              <Text size="10px" c="dimmed">
                                Enter a different address
                              </Text>
                            </div>
                          </div>
                        </div>
                      )}

                      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
                        <TextInput
                          label="Recipient Full Name"
                          size="xs"
                          radius="md"
                          value={address.fullName}
                          onChange={(e) =>
                            setAddress({
                              ...address,
                              fullName: e.currentTarget.value,
                            })
                          }
                          required
                        />
                        <TextInput
                          label="Mobile Number (PH)"
                          size="xs"
                          radius="md"
                          placeholder="+63 9XX XXX XXXX"
                          value={address.phone}
                          onChange={(e) =>
                            setAddress({
                              ...address,
                              phone: e.currentTarget.value,
                            })
                          }
                          required
                        />
                      </SimpleGrid>

                      {shippingMethod !== "store_pickup" ? (
                        <>
                          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
                            <Select
                              label="Region / Province"
                              size="xs"
                              radius="md"
                              data={PH_REGIONS}
                              value={address.region}
                              onChange={(val) =>
                                setAddress({
                                  ...address,
                                  region: val || PH_REGIONS[0],
                                })
                              }
                            />
                            <TextInput
                              label="City / Municipality"
                              size="xs"
                              radius="md"
                              value={address.city}
                              onChange={(e) =>
                                setAddress({
                                  ...address,
                                  city: e.currentTarget.value,
                                })
                              }
                            />
                          </SimpleGrid>
                          <TextInput
                            label="House/Unit No., Building, Street, Barangay"
                            size="xs"
                            radius="md"
                            value={address.streetAddress}
                            onChange={(e) =>
                              setAddress({
                                ...address,
                                streetAddress: e.currentTarget.value,
                              })
                            }
                          />
                          <Textarea
                            label="Delivery Rider / Courier Notes"
                            size="xs"
                            radius="md"
                            rows={2}
                            value={address.notes}
                            onChange={(e) =>
                              setAddress({
                                ...address,
                                notes: e.currentTarget.value,
                              })
                            }
                          />

                          {/* Save custom address to Address Book */}
                          {selectedAddressId === "custom" && (
                            <div className="p-2.5 rounded-xl bg-cyan-500/5 dark:bg-cyan-500/10 border border-cyan-500/20 space-y-2">
                              <Checkbox
                                checked={saveAddressToBook}
                                onChange={(e) => setSaveAddressToBook(e.currentTarget.checked)}
                                label={
                                  <Text size="xs" fw={700}>
                                    Save address to Address Book for future checkouts
                                  </Text>
                                }
                                color="cyan"
                                size="xs"
                              />
                              {saveAddressToBook && (
                                <Group gap="xs" align="center" className="pt-0.5">
                                  <Text size="11px" c="dimmed">
                                    Label:
                                  </Text>
                                  {["Home", "Office", "Condo", "Warehouse"].map((lbl) => (
                                    <Button
                                      key={lbl}
                                      size="compact-xs"
                                      variant={newAddressLabel === lbl ? "filled" : "light"}
                                      color={newAddressLabel === lbl ? "cyan" : "gray"}
                                      onClick={() => setNewAddressLabel(lbl)}
                                    >
                                      {lbl}
                                    </Button>
                                  ))}
                                </Group>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <Paper
                          withBorder
                          radius="md"
                          p="sm"
                          className="bg-slate-50 dark:bg-[#141b29] border-slate-200 dark:border-white/10"
                        >
                          <Group gap="xs">
                            <Store size={16} className="text-cyan-500" />
                            <div>
                              <Text size="xs" fw={700}>
                                BuildbotAI Flagship Hub — Quezon City
                              </Text>
                              <Text size="11px" c="dimmed">
                                Open Mon–Sun, 10:00 AM – 7:00 PM.
                              </Text>
                            </div>
                          </Group>
                        </Paper>
                      )}
                    </div>
                  </Stack>
                )}

                {step === 2 && (
                  <Stack gap="md">
                    <div>
                      <Text
                        size="xs"
                        fw={800}
                        tt="uppercase"
                        className="tracking-wider text-cyan-600 dark:text-cyan-400 mb-2"
                      >
                        Choose Payment Method
                      </Text>
                      <Stack gap="xs">
                        {PAYMENT_METHODS_LIST.map((pm) => {
                          const active = paymentMethod === pm.id;
                          const Icon =
                            pm.id === "cod"
                              ? Truck
                              : pm.id === "gcash_simulated"
                                ? Smartphone
                                : CreditCard;
                          return (
                            <Paper
                              key={pm.id}
                              withBorder
                              radius="lg"
                              p="sm"
                              onClick={() => {
                                if (pm.enabled) {
                                  setPaymentMethod(pm.id);
                                  operationIdRef.current = null;
                                }
                              }}
                              className={cn(
                                "transition-all",
                                !pm.enabled
                                  ? "opacity-60 cursor-not-allowed bg-slate-100/60 dark:bg-white/[0.02]"
                                  : active
                                    ? "cursor-pointer bg-cyan-50/80 dark:bg-cyan-950/30 border-cyan-500 shadow-xs"
                                    : "cursor-pointer bg-slate-50/60 dark:bg-[#141b29] border-slate-200 dark:border-white/10 hover:border-cyan-500/40"
                              )}
                            >
                              <Group
                                justify="space-between"
                                wrap="nowrap"
                                mb={4}
                              >
                                <Group gap="xs" wrap="nowrap">
                                  <ThemeIcon
                                    size="sm"
                                    radius="md"
                                    color={
                                      !pm.enabled
                                        ? "gray"
                                        : active
                                          ? "cyan"
                                          : pm.id === "gcash_simulated"
                                            ? "blue"
                                            : "teal"
                                    }
                                    variant={active ? "filled" : "light"}
                                  >
                                    {pm.enabled ? (
                                      <Icon size={14} />
                                    ) : (
                                      <Lock size={13} />
                                    )}
                                  </ThemeIcon>
                                  <Text size="xs" fw={800}>
                                    {pm.label}
                                  </Text>
                                </Group>
                                <Badge
                                  size="xs"
                                  variant="light"
                                  color={
                                    !pm.enabled
                                      ? "gray"
                                      : pm.id === "paymongo_simulated"
                                        ? "teal"
                                        : pm.isSimulated
                                          ? "amber"
                                          : "teal"
                                  }
                                  className="text-[9px]"
                                >
                                  {pm.badgeText}
                                </Badge>
                              </Group>
                              <Text
                                size="11px"
                                c="dimmed"
                                className="leading-snug"
                              >
                                {pm.description}
                              </Text>
                            </Paper>
                          );
                        })}
                      </Stack>
                    </div>

                    <Paper
                      withBorder
                      radius="lg"
                      p="md"
                      className="bg-slate-50/80 dark:bg-[#141b29] border-slate-200 dark:border-white/10"
                    >
                      {paymentMethod === "cod" ? (
                        <div className="space-y-1.5">
                          <Text size="xs" fw={800}>
                            Cash on Delivery (COD) / Pickup Payment
                          </Text>
                          <Text size="11px" c="dimmed">
                            {selectedPaymentDef.instructions}
                          </Text>
                        </div>
                      ) : paymentMethod === "paymongo_simulated" ? (
                        <div className="space-y-1.5">
                          <Group gap={6}>
                            <FlaskConical size={14} className="text-emerald-500" />
                            <Text size="xs" fw={800}>
                              PayMongo Online Checkout
                            </Text>
                          </Group>
                          <Text size="11px" c="dimmed">
                            {selectedPaymentDef.instructions}
                          </Text>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <Group gap={6}>
                            <FlaskConical size={14} className="text-blue-500" />
                            <Text size="xs" fw={800}>
                              GCash Checkout
                            </Text>
                          </Group>
                          <Text size="11px" c="dimmed">
                            {selectedPaymentDef.instructions}
                          </Text>
                        </div>
                      )}
                    </Paper>
                  </Stack>
                )}

                {step === 3 && (
                  <Stack gap="md">
                    <Paper
                      withBorder
                      radius="lg"
                      p="sm"
                      className="bg-slate-50 dark:bg-[#141b29] border-slate-200 dark:border-white/10 space-y-1"
                    >
                      <Text
                        size="xs"
                        fw={800}
                        tt="uppercase"
                        className="text-cyan-600 dark:text-cyan-400"
                      >
                        1. Fulfillment & Destination
                      </Text>
                      <Text size="xs" fw={700}>
                        {selectedShippingObj.title} (
                        {selectedShippingObj.courier})
                      </Text>
                      <Text size="11px" c="dimmed">
                        {address.fullName} • {address.phone}
                      </Text>
                    </Paper>

                    <Paper
                      withBorder
                      radius="lg"
                      p="sm"
                      className="bg-slate-50 dark:bg-[#141b29] border-slate-200 dark:border-white/10 space-y-1"
                    >
                      <Text
                        size="xs"
                        fw={800}
                        tt="uppercase"
                        className="text-cyan-600 dark:text-cyan-400"
                      >
                        2. Selected Payment Method
                      </Text>
                      <Text size="xs" fw={700}>
                        {selectedPaymentDef.label}
                      </Text>
                      <Text size="11px" c="dimmed">
                        {selectedPaymentDef.description}
                      </Text>
                    </Paper>
                  </Stack>
                )}
              </ScrollArea.Autosize>

              <Group
                justify="space-between"
                mt="md"
                pt="sm"
                className="border-t border-slate-200 dark:border-white/10"
              >
                {step > 1 ? (
                  <Button
                    variant="default"
                    size="xs"
                    radius="md"
                    leftSection={<ArrowLeft size={14} />}
                    onClick={() => setStep((step - 1) as 1 | 2 | 3)}
                  >
                    Back
                  </Button>
                ) : (
                  <div />
                )}

                {step < 3 ? (
                  <Button
                    color="cyan"
                    size="xs"
                    radius="md"
                    rightSection={<ArrowRight size={14} />}
                    onClick={() => setStep((step + 1) as 1 | 2 | 3)}
                  >
                    Next Step
                  </Button>
                ) : (
                  <Button
                    color={
                      paymentMethod === "gcash_simulated" ? "blue" : "teal"
                    }
                    size="sm"
                    radius="md"
                    loading={isSubmitting}
                    leftSection={<ShieldCheck size={16} />}
                    onClick={handleConfirmOrder}
                  >
                    {paymentMethod === "gcash_simulated"
                      ? `Proceed to GCash (${formatCurrency(pricing.totalPrice)})`
                      : paymentMethod === "paymongo_simulated"
                        ? `Proceed to PayMongo (${formatCurrency(pricing.totalPrice)})`
                        : `Place COD Order (${formatCurrency(pricing.totalPrice)})`}
                  </Button>
                )}
              </Group>
            </div>

            {/* Right Column: Order Summary */}
            <div className="lg:col-span-5 p-4 sm:p-5 bg-slate-50/50 dark:bg-[#111722] space-y-4">
              <Text
                size="xs"
                fw={800}
                tt="uppercase"
                className="tracking-wider"
              >
                Order Summary ({cart.reduce((s, i) => s + i.quantity, 0)} Items)
              </Text>

              <div className="space-y-2">
                <Group gap="xs" wrap="nowrap">
                  <TextInput
                    placeholder="BUILDBOT1000 or STUDENT500"
                    size="xs"
                    radius="md"
                    className="flex-1"
                    leftSection={<Tag size={12} />}
                    value={voucherInput}
                    onChange={(e) => setVoucherInput(e.currentTarget.value)}
                  />
                  <Button
                    size="xs"
                    variant="light"
                    color="cyan"
                    radius="md"
                    onClick={handleApplyVoucher}
                  >
                    Apply
                  </Button>
                </Group>
              </div>

              <Divider className="border-slate-200 dark:border-white/10" />

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono font-semibold">
                    {formatCurrency(pricing.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-mono font-semibold">
                    {pricing.shippingFee === 0
                      ? "FREE"
                      : formatCurrency(pricing.shippingFee)}
                  </span>
                </div>
                {pricing.protectionFee > 0 && (
                  <div className="flex justify-between">
                    <span>Crate Protection</span>
                    <span className="font-mono font-semibold">
                      {formatCurrency(pricing.protectionFee)}
                    </span>
                  </div>
                )}
                {pricing.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount ({appliedVoucher})</span>
                    <span className="font-mono">
                      -{formatCurrency(pricing.discountAmount)}
                    </span>
                  </div>
                )}
              </div>

              <Divider className="border-slate-200 dark:border-white/10" />

              <Group justify="space-between" align="baseline">
                <Text size="xs" fw={800} tt="uppercase">
                  Total Amount
                </Text>
                <Text
                  size="lg"
                  fw={900}
                  ff="monospace"
                  className="text-emerald-600 dark:text-emerald-400"
                >
                  {formatCurrency(pricing.totalPrice)}
                </Text>
              </Group>
            </div>
          </div>
        )}
      </Modal>

      <SimulatedGcashModal
        opened={Boolean(pendingGcashOrder)}
        onClose={() => setPendingGcashOrder(null)}
        order={pendingGcashOrder}
        onOutcomeResolved={handleGcashOutcomeResolved}
      />

      <SimulatedPaymongoModal
        opened={Boolean(pendingPaymongoOrder)}
        onClose={() => setPendingPaymongoOrder(null)}
        order={pendingPaymongoOrder}
        onOutcomeResolved={handlePaymongoOutcomeResolved}
      />
    </>
  );
}
