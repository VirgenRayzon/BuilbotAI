"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  Divider,
  Group,
  Paper,
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
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  CreditCard,
  MapPin,
  PackageCheck,
  QrCode,
  Receipt,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Store,
  Tag,
  Truck,
  Wallet,
} from "lucide-react";
import {
  useEcommerce,
  getEcommerceFallbackImage,
  isInvalidPlaceholderUrl,
  type PaymentMethodId,
  type ShippingAddress,
  type ShippingMethodId,
} from "@/context/ecommerce-context";
import { useSiteSettings } from "@/context/site-settings-context";
import { useUserProfile } from "@/context/user-profile";
import { formatCurrency, getOptimizedStorageUrl, cn } from "@/lib/utils";
import { OptimizedImage } from "@/components/ui/optimized-image";

const NETCODEX_STORE_LOCATION = {
  storeName: "Netcodex Computer Center",
  streetAddress: "35G Liberty Avenue, corner 9th Ave",
  barangay: "Socorro, Cubao",
  city: "Quezon City",
  region: "Metro Manila (NCR)",
  postalCode: "1109",
  fullAddress:
    "35G Liberty Avenue, corner 9th Ave, Socorro, Cubao, Quezon City, Metro Manila, Philippines 1109",
  hours: "Monday – Sunday, 10:00 AM – 7:00 PM",
  phone: "0927-014-1681",
  email: "techbrain@netcodex.ph",
};

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
    courier: "LBC Express Nationwide Cargo",
    eta: "3–5 Business Days (Luzon) / 5–7 Days (VisMin)",
    fee: 250,
    badge: "Nationwide PH",
    desc: "Door-to-door insured air/land cargo from our Quezon City warehouse with multi-layer anti-static protection.",
  },
  {
    id: "sameday_express",
    title: "Same-Day Metro Manila Express",
    courier: "Grab / Lalamove / Transportify 4-Wheel",
    eta: "Same Day (3–5 Hours)",
    fee: 450,
    badge: "Recommended for Full Rigs",
    desc: "Dedicated same-day dispatch from Cubao, QC for assembled tempered-glass PC rigs within Metro Manila.",
  },
  {
    id: "store_pickup",
    title: "In-Store Branch Pickup",
    courier: "Netcodex Computer Center — Cubao, Quezon City",
    eta: "Mon–Sun, 10:00 AM – 7:00 PM",
    fee: 0,
    badge: "FREE",
    desc: "35G Liberty Avenue, corner 9th Ave, Socorro, Cubao, Quezon City, Metro Manila 1109.",
  },
];

const PAYMENT_METHODS: Array<{
  id: PaymentMethodId;
  label: string;
  subtitle: string;
  badge: string;
  color: string;
  icon: any;
}> = [
  {
    id: "gcash",
    label: "GCash e-Wallet",
    subtitle: "Instant GCash Express / QRPh Scan",
    badge: "Most Popular",
    color: "blue",
    icon: Smartphone,
  },
  {
    id: "maya",
    label: "Maya Wallet",
    subtitle: "Pay via Maya App or QRPh",
    badge: "Instant",
    color: "teal",
    icon: Wallet,
  },
  {
    id: "qrph",
    label: "QRPh National QR",
    subtitle: "Scan with any PH Banking or e-Wallet App",
    badge: "Zero Fee",
    color: "cyan",
    icon: QrCode,
  },
  {
    id: "card",
    label: "Credit / Debit Card",
    subtitle: "Visa, Mastercard, JCB • Flexible Installments Available",
    badge: "Up to 12 Mos 0%",
    color: "indigo",
    icon: CreditCard,
  },
  {
    id: "bank_transfer",
    label: "Online Bank Transfer",
    subtitle: "BPI, BDO, UnionBank via InstaPay / PESONet",
    badge: "Direct Bank",
    color: "violet",
    icon: Building2,
  },
  {
    id: "cod",
    label: "Cash on Delivery / Showroom Pay",
    subtitle: "Pay cash upon courier arrival or at the Netcodex Cubao counter",
    badge: "Pay on Arrival",
    color: "orange",
    icon: Truck,
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

export default function CheckoutPage() {
  const { isEcommerceMode, shouldCorruptImages } = useSiteSettings();
  const { profile, authUser } = useUserProfile();
  const router = useRouter();
  const {
    cart,
    subtotal,
    activeReceiptOrder,
    setActiveReceiptOrder,
    placeMockOrder,
    setIsCartOpen,
  } = useEcommerce();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethodId>("sameday_express");
  const [includeCrateProtection, setIncludeCrateProtection] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>("gcash");
  const [installmentPlan, setInstallmentPlan] = useState<string>("straight");
  const [qrScannedSimulated, setQrScannedSimulated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Voucher state
  const [voucherInput, setVoucherInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<string | null>("NETCODEX500");

  // Customer Delivery Address Form
  const [address, setAddress] = useState<ShippingAddress>({
    fullName: profile?.name || authUser?.displayName || "Juan Dela Cruz",
    phone: "+63 917 882 4910",
    email: profile?.email || authUser?.email || "customer@netcodex.ph",
    region: "Metro Manila (NCR)",
    city: "Quezon City",
    barangay: "Socorro, Cubao",
    streetAddress: "35G Liberty Avenue, corner 9th Ave",
    postalCode: "1109",
    notes: "Please call mobile number upon arrival. Keep PC box upright.",
  });

  // Card / Wallet mock inputs
  const [walletMobile, setWalletMobile] = useState("+63 917 882 4910");
  const [cardNumber, setCardNumber] = useState("4532 •••• •••• 8841");
  const [cardHolder, setCardHolder] = useState("JUAN DELA CRUZ");
  const [cardExpiry, setCardExpiry] = useState("08/29");
  const [cardCvv, setCardCvv] = useState("884");
  const [selectedBank, setSelectedBank] = useState("BPI (Bank of the Philippine Islands)");

  const selectedShippingObj = useMemo(
    () => SHIPPING_METHODS.find((m) => m.id === shippingMethod) || SHIPPING_METHODS[0],
    [shippingMethod]
  );

  const selectedPaymentObj = useMemo(
    () => PAYMENT_METHODS.find((p) => p.id === paymentMethod) || PAYMENT_METHODS[0],
    [paymentMethod]
  );

  const shippingFee = useMemo(() => {
    if (shippingMethod === "store_pickup") return 0;
    if (appliedVoucher === "FREESHIP") return 0;
    if (subtotal >= 50000 && shippingMethod === "sameday_express") return 0;
    return selectedShippingObj.fee;
  }, [shippingMethod, appliedVoucher, subtotal, selectedShippingObj]);

  const protectionFee = includeCrateProtection && shippingMethod !== "store_pickup" ? 299 : 0;

  const discountAmount = useMemo(() => {
    if (appliedVoucher === "NETCODEX500" || appliedVoucher === "BUILDBOT500") return 500;
    if (appliedVoucher === "PCMASTER1000" && subtotal >= 30000) return 1000;
    return 0;
  }, [appliedVoucher, subtotal]);

  const total = Math.max(0, subtotal + shippingFee + protectionFee - discountAmount);
  const vatAmount = total - total / 1.12;

  const handleApplyVoucher = () => {
    const code = voucherInput.trim().toUpperCase();
    if (!code) return;
    if (["NETCODEX500", "BUILDBOT500", "FREESHIP", "PCMASTER1000"].includes(code)) {
      setAppliedVoucher(code);
      setVoucherInput("");
    } else {
      setAppliedVoucher("NETCODEX500");
      setVoucherInput("");
    }
  };

  const resolvedOrderAddress: ShippingAddress = useMemo(() => {
    if (shippingMethod === "store_pickup") {
      return {
        fullName: address.fullName,
        phone: address.phone,
        email: address.email,
        streetAddress: NETCODEX_STORE_LOCATION.streetAddress,
        barangay: NETCODEX_STORE_LOCATION.barangay,
        city: NETCODEX_STORE_LOCATION.city,
        region: NETCODEX_STORE_LOCATION.region,
        postalCode: NETCODEX_STORE_LOCATION.postalCode,
        notes: `In-Store Pickup at ${NETCODEX_STORE_LOCATION.storeName} (${NETCODEX_STORE_LOCATION.hours})`,
      };
    }
    return address;
  }, [shippingMethod, address]);

  const handleConfirmOrder = () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    window.setTimeout(() => {
      const paymentStatus =
        paymentMethod === "cod"
          ? "Pending COD"
          : paymentMethod === "bank_transfer"
            ? "Awaiting Bank Transfer"
            : "Paid (Verified)";

      const installmentText =
        paymentMethod === "card" && installmentPlan !== "straight"
          ? `${installmentPlan} Months 0% (${formatCurrency(total / Number(installmentPlan))}/mo)`
          : undefined;

      placeMockOrder({
        items: [...cart],
        shippingMethod,
        courierName: selectedShippingObj.courier,
        estimatedDelivery: selectedShippingObj.eta,
        shippingAddress: resolvedOrderAddress,
        paymentMethod,
        paymentLabel:
          paymentMethod === "bank_transfer"
            ? `Bank Transfer (${selectedBank.split(" ")[0]})`
            : selectedPaymentObj.label,
        paymentStatus,
        installmentPlan: installmentText,
        fulfillmentStage: paymentStatus === "Paid (Verified)" ? "payment_verified" : "order_placed",
        includeCrateProtection: protectionFee > 0,
        voucherCode: appliedVoucher || undefined,
        subtotal,
        shippingFee,
        protectionFee,
        discountAmount,
        vatAmount,
        total,
      });
      setIsSubmitting(false);
      setStep(1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 900);
  };

  if (!isEcommerceMode) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 bg-slate-50 dark:bg-[#0c0f14]">
        <Paper
          withBorder
          radius="xl"
          p="xl"
          className="max-w-md w-full text-center bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 space-y-4"
        >
          <ThemeIcon size={56} radius="xl" color="cyan" variant="light" className="mx-auto">
            <ShoppingBag size={28} />
          </ThemeIcon>
          <Title order={3} className="font-headline text-xl font-bold">
            E-Commerce Storefront Mode is Disabled
          </Title>
          <Text size="sm" c="dimmed">
            Enable E-Commerce Storefront Mode under <strong>Profile → System Safeguards & Emergency Overrides</strong> to access the dedicated checkout page.
          </Text>
          <Group justify="center" gap="sm">
            <Button component={Link} href="/pre-builts" variant="default" radius="md">
              Back to Storefront
            </Button>
            <Button component={Link} href="/profile?tab=safeguards" color="cyan" radius="md">
              Open System Safeguards
            </Button>
          </Group>
        </Paper>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 transition-colors dark:bg-[#0c0f14] dark:text-slate-50">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03] dark:invert"
        style={{
          backgroundImage: "radial-gradient(#000 0.5px, transparent 0.5px)",
          backgroundSize: "24px 24px",
        }}
      />

      <main className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-8 xl:px-10 py-4 md:py-6 pt-4 md:pt-6 pb-20">
        {/* Top Page Header & Breadcrumb Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-white/10">
          <div className="space-y-1">
            <Group gap="xs">
              <Button
                variant="subtle"
                color="gray"
                size="compact-xs"
                leftSection={<ArrowLeft size={14} />}
                onClick={() => {
                  if (activeReceiptOrder) {
                    setActiveReceiptOrder(null);
                  } else {
                    router.back();
                  }
                }}
                className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:text-cyan-500 px-0"
              >
                Back to Shopping
              </Button>
              <span className="text-slate-300 dark:text-white/20">•</span>
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 hover:underline"
              >
                Open Cart Drawer ({cart.length})
              </button>
            </Group>

            <Group gap="sm" align="center">
              <ThemeIcon size="lg" radius="md" color="cyan" variant="light">
                {activeReceiptOrder ? <Receipt size={20} /> : <ShieldCheck size={20} />}
              </ThemeIcon>
              <div>
                <Group gap="xs" align="center">
                  <Title order={1} className="font-headline text-2xl sm:text-3xl font-extrabold uppercase tracking-tight">
                    {activeReceiptOrder ? "Netcodex Order Confirmation" : "Netcodex Secure Checkout"}
                  </Title>
                  <Badge size="sm" color="cyan" variant="light" className="uppercase text-[10px] font-bold border border-cyan-500/30">
                    UI Simulation Mode
                  </Badge>
                </Group>
                <Text size="xs" c="dimmed">
                  {activeReceiptOrder
                    ? `Simulated Order #${activeReceiptOrder.orderNumber} • Netcodex Computer Center (${NETCODEX_STORE_LOCATION.city})`
                    : "Netcodex Computer Center • Nationwide Philippine PC hardware fulfillment, courier protection & checkout"}
                </Text>
              </div>
            </Group>
          </div>
        </div>

        {/* STATE A: OFFICIAL SIMULATED ORDER RECEIPT */}
        {activeReceiptOrder ? (
          <div className="w-full space-y-6">
            <Alert
              color="teal"
              variant="light"
              radius="lg"
              icon={<CheckCircle2 size={22} />}
              title={`Order ${activeReceiptOrder.orderNumber} Successfully Placed with Netcodex Computer Center!`}
              className="border border-emerald-500/30"
            >
              This is a simulated e-commerce transaction in UI Mode. Your mock order and live shipment tracker are now available in your Profile under <strong>Orders & Shipments</strong>.
            </Alert>

            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
              <Paper withBorder radius="lg" p="md" className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10">
                <Text size="10px" c="dimmed" fw={700} tt="uppercase">
                  Courier & Tracking ID
                </Text>
                <Text size="md" fw={800} className="mt-1 text-cyan-600 dark:text-cyan-400 font-mono">
                  {activeReceiptOrder.trackingNumber}
                </Text>
                <Text size="xs" c="dimmed" mt={2}>
                  {activeReceiptOrder.courierName} • {activeReceiptOrder.estimatedDelivery}
                </Text>
              </Paper>

              <Paper withBorder radius="lg" p="md" className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10">
                <Text size="10px" c="dimmed" fw={700} tt="uppercase">
                  Payment Method & Status
                </Text>
                <Group gap={6} mt={4}>
                  <Text size="sm" fw={800}>
                    {activeReceiptOrder.paymentLabel}
                  </Text>
                  <Badge size="xs" color="teal" variant="light">
                    {activeReceiptOrder.paymentStatus}
                  </Badge>
                </Group>
                <Text size="xs" c="dimmed" ff="monospace" mt={2}>
                  Ref: {activeReceiptOrder.paymentReference}
                </Text>
              </Paper>

              <Paper withBorder radius="lg" p="md" className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10">
                <Text size="10px" c="dimmed" fw={700} tt="uppercase">
                  Grand Total (VAT Incl.)
                </Text>
                <Text size="xl" fw={900} ff="monospace" className="mt-1 text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(activeReceiptOrder.total)}
                </Text>
                {activeReceiptOrder.installmentPlan && (
                  <Text size="10px" c="cyan" fw={700}>
                    {activeReceiptOrder.installmentPlan}
                  </Text>
                )}
              </Paper>
            </SimpleGrid>

            <Paper withBorder radius="xl" p="lg" className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 space-y-4">
              <Group justify="space-between">
                <Text size="xs" fw={800} tt="uppercase" className="tracking-wider text-slate-500">
                  {activeReceiptOrder.shippingMethod === "store_pickup"
                    ? "Showroom Pickup Location & Contact"
                    : "Delivery Destination"}
                </Text>
                <Badge size="xs" variant="outline" color="cyan">
                  {activeReceiptOrder.shippingMethod === "store_pickup" ? "Netcodex Showroom Pickup" : "Door-to-Door"}
                </Badge>
              </Group>
              <div className="text-xs sm:text-sm space-y-0.5">
                <p className="font-bold text-slate-900 dark:text-white">
                  {activeReceiptOrder.shippingAddress.fullName} ({activeReceiptOrder.shippingAddress.phone})
                </p>
                {activeReceiptOrder.shippingMethod === "store_pickup" && (
                  <p className="font-semibold text-cyan-600 dark:text-cyan-400">
                    {NETCODEX_STORE_LOCATION.storeName} — {NETCODEX_STORE_LOCATION.hours}
                  </p>
                )}
                <p className="text-slate-600 dark:text-slate-300">
                  {activeReceiptOrder.shippingAddress.streetAddress}, {activeReceiptOrder.shippingAddress.barangay},{" "}
                  {activeReceiptOrder.shippingAddress.city}, {activeReceiptOrder.shippingAddress.region}{" "}
                  {activeReceiptOrder.shippingAddress.postalCode}
                </p>
              </div>

              <Divider className="border-slate-200 dark:border-white/10" />

              <Text size="xs" fw={800} tt="uppercase" className="tracking-wider text-slate-500">
                Ordered Items ({activeReceiptOrder.items.length})
              </Text>
              <div className="space-y-3">
                {activeReceiptOrder.items.map((item) => {
                  const fallbackImg = getEcommerceFallbackImage(item.category, item.kind);
                  const rawImg = isInvalidPlaceholderUrl(item.imageUrl) ? fallbackImg : item.imageUrl!;
                  const resolvedImg =
                    getOptimizedStorageUrl(rawImg, shouldCorruptImages) || fallbackImg;
                  return (
                    <div key={item.id} className="flex justify-between items-center text-sm gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-[#161e2e] border border-slate-200/70 dark:border-white/5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-[#0e131d]">
                          <OptimizedImage src={resolvedImg} alt={item.name} fill sizes="48px" className="object-contain p-1" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold truncate">{item.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Qty: {item.quantity} × {formatCurrency(item.price)}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Paper>

            <Group justify="space-between" pt="xs">
              <Button
                variant="default"
                size="md"
                radius="md"
                onClick={() => {
                  setActiveReceiptOrder(null);
                  router.push("/pre-builts");
                }}
              >
                Continue Shopping
              </Button>
              {authUser && (
                <Button
                  color="cyan"
                  size="md"
                  radius="md"
                  rightSection={<ArrowRight size={16} />}
                  onClick={() => {
                    setActiveReceiptOrder(null);
                    router.push("/profile?tab=reservations");
                  }}
                  className="font-headline font-bold text-xs uppercase tracking-wider"
                >
                  Track Shipment in Profile
                </Button>
              )}
            </Group>
          </div>
        ) : cart.length === 0 ? (
          /* STATE B: EMPTY CART */
          <Paper
            withBorder
            radius="xl"
            p="xl"
            className="max-w-lg mx-auto my-12 text-center bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 space-y-4"
          >
            <ThemeIcon size={64} radius="xl" color="cyan" variant="light" className="mx-auto">
              <ShoppingBag size={30} />
            </ThemeIcon>
            <Title order={3} className="font-headline text-xl font-bold">
              Your Netcodex Cart is Empty
            </Title>
            <Text size="sm" c="dimmed">
              Add a custom PC build, a ready-to-ship prebuilt system, or individual PC parts before proceeding to checkout.
            </Text>
            <Group justify="center" gap="sm" pt="xs">
              <Button component={Link} href="/builder" color="cyan" radius="md">
                Open PC Builder
              </Button>
              <Button component={Link} href="/pre-builts" variant="default" radius="md">
                Browse Prebuilts
              </Button>
              <Button component={Link} href="/parts" variant="default" radius="md">
                Browse Parts
              </Button>
            </Group>
          </Paper>
        ) : (
          /* STATE C: DEDICATED 2-COLUMN CHECKOUT PAGE */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column (7 cols): Stepper & Active Checkout Form */}
            <div className="lg:col-span-7 space-y-5">
              {/* Stepper Header */}
              <Paper
                withBorder
                radius="xl"
                p="sm"
                className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-xs"
              >
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { num: 1, label: "1. Shipping & Courier", icon: Truck },
                    { num: 2, label: "2. Payment Method", icon: CreditCard },
                    { num: 3, label: "3. Final Review", icon: PackageCheck },
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
                          "flex items-center justify-center gap-2 py-3 px-3 rounded-xl border text-xs font-headline font-bold uppercase tracking-wider transition-all",
                          active
                            ? "bg-cyan-500/15 border-cyan-500 text-cyan-700 dark:text-cyan-300 shadow-xs"
                            : done
                              ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                              : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500"
                        )}
                      >
                        <Icon size={15} className="shrink-0" />
                        <span className="truncate">{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </Paper>

              {/* Active Step Card */}
              <Paper
                withBorder
                radius="xl"
                p={{ base: "md", sm: "lg" }}
                className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm space-y-6"
              >
                {/* STEP 1: SHIPPING & FULFILLMENT */}
                {step === 1 && (
                  <Stack gap="lg">
                    <div>
                      <Text size="xs" fw={800} tt="uppercase" className="tracking-wider text-cyan-600 dark:text-cyan-400 mb-3">
                        Select Fulfillment Method
                      </Text>
                      <Stack gap="sm">
                        {SHIPPING_METHODS.map((method) => {
                          const selected = shippingMethod === method.id;
                          const isFreeExpress =
                            method.id === "sameday_express" && subtotal >= 50000;
                          return (
                            <Paper
                              key={method.id}
                              withBorder
                              radius="lg"
                              p="md"
                              onClick={() => setShippingMethod(method.id)}
                              className={cn(
                                "cursor-pointer transition-all",
                                selected
                                  ? "bg-cyan-50/70 dark:bg-cyan-950/25 border-cyan-500 shadow-xs"
                                  : "bg-slate-50/60 dark:bg-[#141b29] border-slate-200 dark:border-white/10 hover:border-cyan-500/40"
                              )}
                            >
                              <Group justify="space-between" align="flex-start" wrap="nowrap">
                                <div className="space-y-1">
                                  <Group gap={8}>
                                    <Text size="sm" fw={800}>
                                      {method.title}
                                    </Text>
                                    <Badge size="xs" color={selected ? "cyan" : "gray"} variant="light">
                                      {method.badge}
                                    </Badge>
                                  </Group>
                                  <Text size="xs" fw={700} className="text-cyan-700 dark:text-cyan-300">
                                    {method.courier} • ETA: {method.eta}
                                  </Text>
                                  <Text size="xs" c="dimmed">
                                    {method.desc}
                                  </Text>
                                </div>
                                <Text size="md" fw={900} ff="monospace" className="shrink-0 text-emerald-600 dark:text-emerald-400">
                                  {method.fee === 0 || isFreeExpress ? "FREE" : formatCurrency(method.fee)}
                                </Text>
                              </Group>
                            </Paper>
                          );
                        })}
                      </Stack>
                    </div>

                    {/* Fragile PC Protection Toggle */}
                    {shippingMethod !== "store_pickup" && (
                      <Paper
                        withBorder
                        radius="lg"
                        p="md"
                        className="bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/30"
                      >
                        <Checkbox
                          color="cyan"
                          checked={includeCrateProtection}
                          onChange={(e) => setIncludeCrateProtection(e.currentTarget.checked)}
                          label={
                            <div className="space-y-0.5">
                              <Group gap={6}>
                                <Text size="sm" fw={800}>
                                  Instapak Expanding GPU Foam + Tempered Glass Wooden Crate
                                </Text>
                                <Badge size="xs" color="amber" variant="light">
                                  +₱299
                                </Badge>
                              </Group>
                              <Text size="xs" c="dimmed">
                                Multi-layer protection standard used by Netcodex for nationwide shipments. Prevents PCIe slot sag and tempered glass shattering.
                              </Text>
                            </div>
                          }
                        />
                      </Paper>
                    )}

                    {/* Philippine Address Form / Showroom Pickup Details */}
                    <div className="space-y-3.5 pt-2">
                      <Group gap={6}>
                        <MapPin size={16} className="text-cyan-500" />
                        <Text size="xs" fw={800} tt="uppercase" className="tracking-wider">
                          {shippingMethod === "store_pickup"
                            ? "Showroom Pickup Contact & Location"
                            : "Philippine Delivery Address"}
                        </Text>
                      </Group>

                      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                        <TextInput
                          label="Recipient Full Name"
                          size="sm"
                          radius="md"
                          value={address.fullName}
                          onChange={(e) => setAddress({ ...address, fullName: e.currentTarget.value })}
                          required
                        />
                        <TextInput
                          label="Mobile Number (PH)"
                          size="sm"
                          radius="md"
                          placeholder="+63 9XX XXX XXXX"
                          value={address.phone}
                          onChange={(e) => setAddress({ ...address, phone: e.currentTarget.value })}
                          required
                        />
                      </SimpleGrid>

                      {shippingMethod !== "store_pickup" ? (
                        <>
                          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                            <Select
                              label="Region / Province"
                              size="sm"
                              radius="md"
                              data={PH_REGIONS}
                              value={address.region}
                              onChange={(val) => setAddress({ ...address, region: val || PH_REGIONS[0] })}
                            />
                            <TextInput
                              label="City / Municipality"
                              size="sm"
                              radius="md"
                              value={address.city}
                              onChange={(e) => setAddress({ ...address, city: e.currentTarget.value })}
                            />
                          </SimpleGrid>

                          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
                            <TextInput
                              label="Barangay"
                              size="sm"
                              radius="md"
                              className="sm:col-span-2"
                              value={address.barangay}
                              onChange={(e) => setAddress({ ...address, barangay: e.currentTarget.value })}
                            />
                            <TextInput
                              label="Postal Code"
                              size="sm"
                              radius="md"
                              value={address.postalCode}
                              onChange={(e) => setAddress({ ...address, postalCode: e.currentTarget.value })}
                            />
                          </SimpleGrid>

                          <TextInput
                            label="House/Unit No., Building, Street Name"
                            size="sm"
                            radius="md"
                            value={address.streetAddress}
                            onChange={(e) => setAddress({ ...address, streetAddress: e.currentTarget.value })}
                          />

                          <Textarea
                            label="Delivery Rider / Courier Notes"
                            size="sm"
                            radius="md"
                            rows={2}
                            value={address.notes}
                            onChange={(e) => setAddress({ ...address, notes: e.currentTarget.value })}
                          />
                        </>
                      ) : (
                        <Paper withBorder radius="lg" p="md" className="bg-slate-50 dark:bg-[#141b29] border-slate-200 dark:border-white/10">
                          <Group gap="sm" align="flex-start" wrap="nowrap">
                            <ThemeIcon size="lg" radius="md" color="cyan" variant="light" className="shrink-0 mt-0.5">
                              <Store size={18} />
                            </ThemeIcon>
                            <div className="space-y-1">
                              <Text size="sm" fw={800} className="text-slate-900 dark:text-white">
                                {NETCODEX_STORE_LOCATION.storeName} (Headquarters & Retail Showroom)
                              </Text>
                              <Text size="xs" fw={600} className="text-cyan-700 dark:text-cyan-300">
                                {NETCODEX_STORE_LOCATION.fullAddress}
                              </Text>
                              <Text size="xs" c="dimmed">
                                Operating Hours: {NETCODEX_STORE_LOCATION.hours} • Phone: {NETCODEX_STORE_LOCATION.phone} • Email: {NETCODEX_STORE_LOCATION.email}
                              </Text>
                            </div>
                          </Group>
                        </Paper>
                      )}
                    </div>
                  </Stack>
                )}

                {/* STEP 2: PAYMENT METHOD */}
                {step === 2 && (
                  <Stack gap="lg">
                    <div>
                      <Text size="xs" fw={800} tt="uppercase" className="tracking-wider text-cyan-600 dark:text-cyan-400 mb-3">
                        Choose Payment Method
                      </Text>
                      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                        {PAYMENT_METHODS.map((pm) => {
                          const Icon = pm.icon;
                          const active = paymentMethod === pm.id;
                          return (
                            <Paper
                              key={pm.id}
                              withBorder
                              radius="lg"
                              p="md"
                              onClick={() => setPaymentMethod(pm.id)}
                              className={cn(
                                "cursor-pointer transition-all",
                                active
                                  ? "bg-cyan-50/80 dark:bg-cyan-950/30 border-cyan-500 shadow-xs"
                                  : "bg-slate-50/60 dark:bg-[#141b29] border-slate-200 dark:border-white/10 hover:border-cyan-500/40"
                              )}
                            >
                              <Group justify="space-between" wrap="nowrap" mb={4}>
                                <Group gap="xs" wrap="nowrap">
                                  <ThemeIcon size="md" radius="md" color={active ? "cyan" : pm.color} variant={active ? "filled" : "light"}>
                                    <Icon size={15} />
                                  </ThemeIcon>
                                  <Text size="sm" fw={800}>
                                    {pm.label}
                                  </Text>
                                </Group>
                                <Badge size="xs" variant="light" color={active ? "cyan" : "gray"} className="text-[9px]">
                                  {pm.badge}
                                </Badge>
                              </Group>
                              <Text size="xs" c="dimmed" className="leading-snug">
                                {pm.subtitle}
                              </Text>
                            </Paper>
                          );
                        })}
                      </SimpleGrid>
                    </div>

                    {/* Interactive Payment Details Box */}
                    <Paper
                      withBorder
                      radius="lg"
                      p="md"
                      className="bg-slate-50/80 dark:bg-[#141b29] border-slate-200 dark:border-white/10"
                    >
                      {(paymentMethod === "gcash" || paymentMethod === "maya" || paymentMethod === "qrph") && (
                        <div className="space-y-3">
                          <Group justify="space-between">
                            <div>
                              <Text size="sm" fw={800}>
                                {selectedPaymentObj.label} — Netcodex QRPh Instant Checkout
                              </Text>
                              <Text size="xs" c="dimmed">
                                Scan the dynamic QRPh code below or link your registered mobile wallet number.
                              </Text>
                            </div>
                            <Badge color={qrScannedSimulated ? "teal" : "cyan"} variant="filled">
                              {qrScannedSimulated ? "QR Scanned & Authorized" : "Awaiting Scan"}
                            </Badge>
                          </Group>

                          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0e131d]">
                            <div className="w-32 h-32 rounded-xl border-2 border-dashed border-cyan-500/50 flex flex-col items-center justify-center bg-cyan-500/5 shrink-0">
                              <QrCode size={64} className="text-cyan-600 dark:text-cyan-400" />
                              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-cyan-600 mt-1">
                                QRPh • {formatCurrency(total)}
                              </span>
                            </div>
                            <div className="flex-1 space-y-3 w-full">
                              <TextInput
                                label="Linked E-Wallet Mobile Number"
                                size="sm"
                                radius="md"
                                value={walletMobile}
                                onChange={(e) => setWalletMobile(e.currentTarget.value)}
                              />
                              <Button
                                size="sm"
                                radius="md"
                                color={qrScannedSimulated ? "teal" : "cyan"}
                                variant={qrScannedSimulated ? "light" : "filled"}
                                leftSection={<Sparkles size={14} />}
                                onClick={() => setQrScannedSimulated(!qrScannedSimulated)}
                                className="uppercase tracking-wider font-bold text-xs"
                              >
                                {qrScannedSimulated
                                  ? "QR Payment Verified (Click to Reset)"
                                  : "Simulate Instant QR App Scan"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {paymentMethod === "card" && (
                        <div className="space-y-3">
                          <Group justify="space-between">
                            <Text size="sm" fw={800}>
                              Credit / Debit Card Details (SSL Encrypted • 3D Secure 2.0)
                            </Text>
                            <Badge size="xs" color="indigo" variant="light">
                              Zero Data Retention
                            </Badge>
                          </Group>

                          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                            <TextInput
                              label="Card Number"
                              size="sm"
                              radius="md"
                              value={cardNumber}
                              onChange={(e) => setCardNumber(e.currentTarget.value)}
                            />
                            <TextInput
                              label="Cardholder Name"
                              size="sm"
                              radius="md"
                              value={cardHolder}
                              onChange={(e) => setCardHolder(e.currentTarget.value)}
                            />
                          </SimpleGrid>

                          <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
                            <TextInput
                              label="Expiry (MM/YY)"
                              size="sm"
                              radius="md"
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(e.currentTarget.value)}
                            />
                            <TextInput
                              label="CVV"
                              size="sm"
                              radius="md"
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.currentTarget.value)}
                            />
                            <Select
                              label="0% Installment Plan"
                              size="sm"
                              radius="md"
                              className="col-span-2 sm:col-span-1"
                              value={installmentPlan}
                              onChange={(v) => setInstallmentPlan(v || "straight")}
                              data={[
                                { value: "straight", label: `Straight (${formatCurrency(total)})` },
                                { value: "3", label: `3 Mos @ 0% (${formatCurrency(total / 3)}/mo)` },
                                { value: "6", label: `6 Mos @ 0% (${formatCurrency(total / 6)}/mo)` },
                                { value: "12", label: `12 Mos @ 0% (${formatCurrency(total / 12)}/mo)` },
                              ]}
                            />
                          </SimpleGrid>
                        </div>
                      )}

                      {paymentMethod === "bank_transfer" && (
                        <div className="space-y-3">
                          <Text size="sm" fw={800}>
                            Online Bank Transfer (InstaPay / PESONet)
                          </Text>
                          <Select
                            label="Select Partner Bank"
                            size="sm"
                            radius="md"
                            value={selectedBank}
                            onChange={(val) => setSelectedBank(val || "BPI")}
                            data={[
                              "BPI (Bank of the Philippine Islands)",
                              "BDO Unibank",
                              "UnionBank of the Philippines",
                              "Metrobank",
                            ]}
                          />
                          <div className="p-3 rounded-lg bg-white dark:bg-[#0e131d] border border-slate-200 dark:border-white/10 text-xs font-mono space-y-1">
                            <div>Account Name: <strong>NETCODEX INC. / NETCODEX COMPUTER CENTER</strong></div>
                            <div>Account Number: <strong>0049-8821-9940</strong></div>
                            <div className="text-slate-500 text-[11px] font-sans">
                              Order number will serve as your InstaPay reference code upon confirmation.
                            </div>
                          </div>
                        </div>
                      )}

                      {paymentMethod === "cod" && (
                        <div className="space-y-1.5">
                          <Text size="sm" fw={800}>
                            Cash on Delivery (COD) / Netcodex Showroom Counter Payment
                          </Text>
                          <Text size="xs" c="dimmed" className="leading-relaxed">
                            Prepare the exact amount of <strong>{formatCurrency(total)}</strong> upon courier arrival or when visiting our Cubao showroom ({NETCODEX_STORE_LOCATION.fullAddress}).
                          </Text>
                        </div>
                      )}
                    </Paper>
                  </Stack>
                )}

                {/* STEP 3: FINAL REVIEW */}
                {step === 3 && (
                  <Stack gap="md">
                    <Paper withBorder radius="lg" p="md" className="bg-slate-50 dark:bg-[#141b29] border-slate-200 dark:border-white/10 space-y-2">
                      <Group justify="space-between">
                        <Text size="xs" fw={800} tt="uppercase" className="text-cyan-600 dark:text-cyan-400">
                          1. Fulfillment & Destination
                        </Text>
                        <Button variant="subtle" size="compact-xs" onClick={() => setStep(1)}>
                          Edit
                        </Button>
                      </Group>
                      <div className="text-xs sm:text-sm space-y-0.5">
                        <p className="font-bold">
                          {selectedShippingObj.title} ({selectedShippingObj.courier})
                        </p>
                        <p className="text-slate-600 dark:text-slate-300">
                          {resolvedOrderAddress.fullName} • {resolvedOrderAddress.phone}
                        </p>
                        <p className="text-slate-500 dark:text-slate-400">
                          {resolvedOrderAddress.streetAddress}, {resolvedOrderAddress.barangay}, {resolvedOrderAddress.city}, {resolvedOrderAddress.region} {resolvedOrderAddress.postalCode}
                        </p>
                      </div>
                    </Paper>

                    <Paper withBorder radius="lg" p="md" className="bg-slate-50 dark:bg-[#141b29] border-slate-200 dark:border-white/10 space-y-2">
                      <Group justify="space-between">
                        <Text size="xs" fw={800} tt="uppercase" className="text-cyan-600 dark:text-cyan-400">
                          2. Selected Payment Channel
                        </Text>
                        <Button variant="subtle" size="compact-xs" onClick={() => setStep(2)}>
                          Edit
                        </Button>
                      </Group>
                      <Group justify="space-between">
                        <div>
                          <Text size="sm" fw={700}>
                            {selectedPaymentObj.label}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {selectedPaymentObj.subtitle}
                          </Text>
                        </div>
                        <Badge color="teal" variant="light">
                          Ready to Process
                        </Badge>
                      </Group>
                    </Paper>

                    <Paper withBorder radius="lg" p="md" className="bg-slate-50 dark:bg-[#141b29] border-slate-200 dark:border-white/10 space-y-3">
                      <Text size="xs" fw={800} tt="uppercase" className="text-cyan-600 dark:text-cyan-400">
                        3. Items in Order ({cart.length})
                      </Text>
                      <div className="space-y-2.5">
                        {cart.map((item) => {
                          const fallbackImg = getEcommerceFallbackImage(item.category, item.kind);
                          const rawImg = isInvalidPlaceholderUrl(item.imageUrl) ? fallbackImg : item.imageUrl!;
                          const resolvedImg =
                            getOptimizedStorageUrl(rawImg, shouldCorruptImages) || fallbackImg;
                          return (
                            <div key={item.id} className="p-2.5 rounded-xl bg-white dark:bg-[#0e131d] border border-slate-200/80 dark:border-white/10 flex justify-between items-center text-xs sm:text-sm gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-[#141b29]">
                                  <OptimizedImage src={resolvedImg} alt={item.name} fill sizes="48px" className="object-contain p-1" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-900 dark:text-white truncate">
                                    {item.quantity}x {item.name}
                                  </p>
                                  {item.includeAssembly && (
                                    <Badge size="xs" color="teal" variant="light" mt={2}>
                                      Pro Assembly Included
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <span className="font-mono font-bold shrink-0 text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(item.price * item.quantity)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </Paper>
                  </Stack>
                )}

                {/* Bottom Step Navigation Buttons */}
                <Group justify="space-between" pt="md" className="border-t border-slate-200 dark:border-white/10">
                  {step > 1 ? (
                    <Button
                      variant="default"
                      size="md"
                      radius="md"
                      leftSection={<ArrowLeft size={15} />}
                      onClick={() => setStep((step - 1) as 1 | 2 | 3)}
                    >
                      Previous Step
                    </Button>
                  ) : (
                    <Button
                      variant="subtle"
                      color="gray"
                      size="md"
                      onClick={() => router.back()}
                    >
                      Return to Store
                    </Button>
                  )}

                  {step < 3 ? (
                    <Button
                      color="cyan"
                      size="md"
                      radius="md"
                      rightSection={<ArrowRight size={16} />}
                      onClick={() => setStep((step + 1) as 1 | 2 | 3)}
                      className="font-headline font-bold text-xs uppercase tracking-wider shadow-md shadow-cyan-500/20"
                    >
                      {step === 1 ? "Continue to Payment" : "Review Final Order"}
                    </Button>
                  ) : (
                    <Button
                      color="teal"
                      size="md"
                      radius="md"
                      loading={isSubmitting}
                      leftSection={<ShieldCheck size={18} />}
                      onClick={handleConfirmOrder}
                      className="font-headline font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-500/20"
                    >
                      Place Order • {formatCurrency(total)}
                    </Button>
                  )}
                </Group>
              </Paper>
            </div>

            {/* Right Column (5 cols): Sticky Order Summary & Cart Preview with Images */}
            <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
              <Paper
                withBorder
                radius="xl"
                p={{ base: "md", sm: "lg" }}
                className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm space-y-5"
              >
                <Group justify="space-between" align="center">
                  <Title order={4} className="font-headline text-base font-bold uppercase tracking-wider">
                    Order Summary
                  </Title>
                  <Badge size="sm" variant="light" color="cyan" className="font-mono">
                    {cart.reduce((s, i) => s + i.quantity, 0)} Items
                  </Badge>
                </Group>

                {/* Cart Items Preview with Thumbnails */}
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {cart.map((item) => {
                    const fallbackImg = getEcommerceFallbackImage(item.category, item.kind);
                    const rawImg = isInvalidPlaceholderUrl(item.imageUrl) ? fallbackImg : item.imageUrl!;
                    const resolvedImg =
                      getOptimizedStorageUrl(rawImg, shouldCorruptImages) || fallbackImg;
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-[#141b29] border border-slate-200/70 dark:border-white/10"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-[#0e131d]">
                            <OptimizedImage
                              src={resolvedImg}
                              alt={item.name}
                              fill
                              sizes="48px"
                              className="object-contain p-1"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <Text size="xs" fw={700} lineClamp={1}>
                              {item.name}
                            </Text>
                            <Text size="11px" c="dimmed" ff="monospace">
                              Qty: {item.quantity} × {formatCurrency(item.price)}
                            </Text>
                          </div>
                        </div>
                        <Text size="xs" fw={800} ff="monospace" className="shrink-0">
                          {formatCurrency(item.price * item.quantity)}
                        </Text>
                      </div>
                    );
                  })}
                </div>

                {/* Promo Voucher Input */}
                <Paper withBorder radius="lg" p="xs" className="bg-slate-50 dark:bg-[#141b29] border-slate-200 dark:border-white/10">
                  <Group gap="xs" wrap="nowrap">
                    <TextInput
                      placeholder="Promo code (e.g. NETCODEX500, FREESHIP)"
                      size="xs"
                      radius="md"
                      leftSection={<Tag size={13} />}
                      value={voucherInput}
                      onChange={(e) => setVoucherInput(e.currentTarget.value)}
                      className="flex-1"
                    />
                    <Button size="xs" variant="light" color="cyan" onClick={handleApplyVoucher}>
                      Apply
                    </Button>
                  </Group>
                  {appliedVoucher && (
                    <Group justify="space-between" mt={6} px={4}>
                      <Badge size="xs" color="teal" variant="light">
                        Code Applied: {appliedVoucher}
                      </Badge>
                      <button
                        type="button"
                        onClick={() => setAppliedVoucher(null)}
                        className="text-[10px] text-rose-500 hover:underline font-semibold"
                      >
                        Remove
                      </button>
                    </Group>
                  )}
                </Paper>

                {/* Breakdown Lines */}
                <Paper withBorder radius="lg" p="md" className="bg-slate-50/80 dark:bg-[#141b29] border-slate-200 dark:border-white/10 space-y-2.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Hardware Subtotal</span>
                    <span className="font-mono font-semibold">{formatCurrency(subtotal)}</span>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">
                      Shipping ({selectedShippingObj.courier.split("/")[0].trim()})
                    </span>
                    <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {shippingFee === 0 ? "FREE" : formatCurrency(shippingFee)}
                    </span>
                  </div>

                  {protectionFee > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">
                        GPU Foam & Crate Insurance
                      </span>
                      <span className="font-mono font-semibold">{formatCurrency(protectionFee)}</span>
                    </div>
                  )}

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400">
                      <span>Promo Discount ({appliedVoucher})</span>
                      <span className="font-mono font-bold">-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}

                  <Divider className="border-slate-200 dark:border-white/10" />

                  <div className="flex justify-between items-baseline">
                    <div>
                      <Text size="xs" fw={800} tt="uppercase">
                        Total Payable
                      </Text>
                      <Text size="10px" c="dimmed">
                        Includes 12% PH VAT ({formatCurrency(vatAmount)})
                      </Text>
                    </div>
                    <Text size="xl" fw={900} ff="monospace" className="text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(total)}
                    </Text>
                  </div>
                </Paper>

                <Paper withBorder radius="lg" p="sm" className="bg-cyan-500/5 border-cyan-500/20">
                  <Group gap="xs" wrap="nowrap">
                    <ShieldCheck size={18} className="text-cyan-500 shrink-0" />
                    <Text size="11px" c="dimmed" className="leading-snug">
                      <strong>Netcodex Buyer Protection:</strong> Official Manufacturer Warranty + 7-Day Defective-on-Arrival (DOA) 1-to-1 Replacement Guarantee.
                    </Text>
                  </Group>
                </Paper>
              </Paper>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
