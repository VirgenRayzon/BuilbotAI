"use client";

import React, { useMemo, useState } from "react";
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
  Smartphone,
  Sparkles,
  Store,
  Tag,
  Truck,
  Wallet,
} from "lucide-react";
import {
  useEcommerce,
  type PaymentMethodId,
  type ShippingAddress,
  type ShippingMethodId,
} from "@/context/ecommerce-context";
import { useSiteSettings } from "@/context/site-settings-context";
import { useUserProfile } from "@/context/user-profile";
import { formatCurrency, cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

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
    eta: "Same Day (3–5 Hours)",
    fee: 450,
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
    subtitle: "Visa, Mastercard, JCB • 0% Installment Available",
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
    label: "Cash on Delivery (COD)",
    subtitle: "Pay cash upon courier arrival or showroom pickup",
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

export function CheckoutModal() {
  const { isEcommerceMode } = useSiteSettings();
  const { profile, authUser } = useUserProfile();
  const router = useRouter();
  const {
    cart,
    subtotal,
    isCheckoutOpen,
    setIsCheckoutOpen,
    activeReceiptOrder,
    setActiveReceiptOrder,
    placeMockOrder,
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
  const [appliedVoucher, setAppliedVoucher] = useState<string | null>("BUILDBOT500");

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
    if (appliedVoucher === "BUILDBOT500") return 500;
    if (appliedVoucher === "PCMASTER1000" && subtotal >= 30000) return 1000;
    return 0;
  }, [appliedVoucher, subtotal]);

  const total = Math.max(0, subtotal + shippingFee + protectionFee - discountAmount);
  const vatAmount = total - total / 1.12;

  if (!isEcommerceMode) return null;

  const handleApplyVoucher = () => {
    const code = voucherInput.trim().toUpperCase();
    if (!code) return;
    if (["BUILDBOT500", "FREESHIP", "PCMASTER1000"].includes(code)) {
      setAppliedVoucher(code);
      setVoucherInput("");
    } else {
      setAppliedVoucher("BUILDBOT500");
      setVoucherInput("");
    }
  };

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
        shippingAddress: address,
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
    }, 900);
  };

  const handleClose = () => {
    setIsCheckoutOpen(false);
    setActiveReceiptOrder(null);
    setStep(1);
  };

  return (
    <Modal
      opened={isCheckoutOpen}
      onClose={handleClose}
      size="xl"
      radius="lg"
      centered
      zIndex={100002}
      overlayProps={{ backgroundOpacity: 0.65, blur: 5 }}
      title={
        <Group gap="sm">
          <ThemeIcon size="lg" radius="md" color="cyan" variant="light">
            {activeReceiptOrder ? <Receipt size={18} /> : <ShieldCheck size={18} />}
          </ThemeIcon>
          <div>
            <Group gap={6}>
              <Title order={4} className="font-headline text-base font-bold uppercase tracking-tight">
                {activeReceiptOrder ? "Official Order Confirmation" : "BuildbotAI Secure Checkout"}
              </Title>
              <Badge size="xs" color="cyan" variant="light" className="uppercase text-[9px] font-bold">
                UI Simulation Mode
              </Badge>
            </Group>
            <Text size="xs" c="dimmed">
              {activeReceiptOrder
                ? `Simulated Order #${activeReceiptOrder.orderNumber} • Recorded in Client Storage`
                : "Step-by-step Philippine PC hardware fulfillment & payment flow"}
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
        /* STEP 4: SIMULATED RECEIPT & TRACKING CONFIRMATION */
        <div className="p-5 sm:p-6 space-y-5">
          <Alert
            color="teal"
            variant="light"
            radius="lg"
            icon={<CheckCircle2 size={20} />}
            title={`Order ${activeReceiptOrder.orderNumber} Successfully Placed!`}
            className="border border-emerald-500/30"
          >
            This is a simulated e-commerce transaction in UI Mode. Your mock order and live shipment tracker are now available in your Profile under <strong>Orders & Shipments</strong>.
          </Alert>

          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
            <Paper withBorder radius="md" p="sm" className="bg-slate-50 dark:bg-[#141b29] border-slate-200 dark:border-white/10">
              <Text size="10px" c="dimmed" fw={700} tt="uppercase">
                Courier & Tracking ID
              </Text>
              <Text size="sm" fw={800} className="mt-0.5 text-cyan-600 dark:text-cyan-400 font-mono">
                {activeReceiptOrder.trackingNumber}
              </Text>
              <Text size="xs" c="dimmed">
                {activeReceiptOrder.courierName} • {activeReceiptOrder.estimatedDelivery}
              </Text>
            </Paper>

            <Paper withBorder radius="md" p="sm" className="bg-slate-50 dark:bg-[#141b29] border-slate-200 dark:border-white/10">
              <Text size="10px" c="dimmed" fw={700} tt="uppercase">
                Payment Method & Status
              </Text>
              <Group gap={6} mt={2}>
                <Text size="sm" fw={800}>
                  {activeReceiptOrder.paymentLabel}
                </Text>
                <Badge size="xs" color="teal" variant="light">
                  {activeReceiptOrder.paymentStatus}
                </Badge>
              </Group>
              <Text size="xs" c="dimmed" ff="monospace">
                Ref: {activeReceiptOrder.paymentReference}
              </Text>
            </Paper>

            <Paper withBorder radius="md" p="sm" className="bg-slate-50 dark:bg-[#141b29] border-slate-200 dark:border-white/10">
              <Text size="10px" c="dimmed" fw={700} tt="uppercase">
                Grand Total (VAT Incl.)
              </Text>
              <Text size="lg" fw={900} ff="monospace" className="text-emerald-600 dark:text-emerald-400">
                {formatCurrency(activeReceiptOrder.total)}
              </Text>
              {activeReceiptOrder.installmentPlan && (
                <Text size="10px" c="cyan" fw={700}>
                  {activeReceiptOrder.installmentPlan}
                </Text>
              )}
            </Paper>
          </SimpleGrid>

          <Paper withBorder radius="lg" p="md" className="bg-slate-50/60 dark:bg-[#141b29]/60 border-slate-200 dark:border-white/10 space-y-3">
            <Group justify="space-between">
              <Text size="xs" fw={800} tt="uppercase" className="tracking-wider text-slate-500">
                Delivery Destination
              </Text>
              <Badge size="xs" variant="outline" color="cyan">
                {activeReceiptOrder.shippingMethod === "store_pickup" ? "Branch Pickup" : "Door-to-Door"}
              </Badge>
            </Group>
            <div className="text-xs space-y-0.5">
              <p className="font-bold text-slate-900 dark:text-white">
                {activeReceiptOrder.shippingAddress.fullName} ({activeReceiptOrder.shippingAddress.phone})
              </p>
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
            <div className="space-y-1.5">
              {activeReceiptOrder.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-xs">
                  <span className="font-semibold">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="font-mono font-bold">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </Paper>

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
                  router.push("/profile?tab=reservations");
                }}
                className="font-headline font-bold text-xs uppercase tracking-wider"
              >
                Track Shipment in Profile
              </Button>
            )}
          </Group>
        </div>
      ) : (
        /* STEPS 1 TO 3: INTERACTIVE CHECKOUT WIZARD */
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left Column: Step Navigation & Active Step Form */}
          <div className="lg:col-span-7 p-4 sm:p-5 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-white/10">
            {/* Stepper Header */}
            <div className="grid grid-cols-3 gap-2 mb-5">
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
                        ? "bg-cyan-500/15 border-cyan-500 text-cyan-600 dark:text-cyan-300 shadow-xs"
                        : done
                          ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                          : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500"
                    )}
                  >
                    <Icon size={14} />
                    <span className="truncate">{s.label}</span>
                  </button>
                );
              })}
            </div>

            <ScrollArea.Autosize mah={440} scrollbarSize={6} offsetScrollbars>
              {/* STEP 1: SHIPPING & FULFILLMENT */}
              {step === 1 && (
                <Stack gap="md">
                  <div>
                    <Text size="xs" fw={800} tt="uppercase" className="tracking-wider text-cyan-600 dark:text-cyan-400 mb-2">
                      Select Fulfillment Method
                    </Text>
                    <Stack gap="xs">
                      {SHIPPING_METHODS.map((method) => {
                        const selected = shippingMethod === method.id;
                        const isFreeExpress =
                          method.id === "sameday_express" && subtotal >= 50000;
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
                            <Group justify="space-between" align="flex-start" wrap="nowrap">
                              <div className="space-y-0.5">
                                <Group gap={6}>
                                  <Text size="sm" fw={700}>
                                    {method.title}
                                  </Text>
                                  <Badge size="xs" color={selected ? "cyan" : "gray"} variant="light">
                                    {method.badge}
                                  </Badge>
                                </Group>
                                <Text size="xs" fw={600} className="text-cyan-700 dark:text-cyan-300">
                                  {method.courier} • ETA: {method.eta}
                                </Text>
                                <Text size="11px" c="dimmed">
                                  {method.desc}
                                </Text>
                              </div>
                              <Text size="sm" fw={800} ff="monospace" className="shrink-0 text-emerald-600 dark:text-emerald-400">
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
                      p="sm"
                      className="bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/30"
                    >
                      <Checkbox
                        color="cyan"
                        checked={includeCrateProtection}
                        onChange={(e) => setIncludeCrateProtection(e.currentTarget.checked)}
                        label={
                          <div className="space-y-0.5">
                            <Group gap={6}>
                              <Text size="xs" fw={800}>
                                Instapak Expanding GPU Foam + Tempered Glass Wooden Crate
                              </Text>
                              <Badge size="xs" color="amber" variant="light">
                                +₱299
                              </Badge>
                            </Group>
                            <Text size="11px" c="dimmed">
                              Prevents PCIe slot sag and tempered glass shattering during courier transit. Includes 100% transit damage replacement guarantee.
                            </Text>
                          </div>
                        }
                      />
                    </Paper>
                  )}

                  {/* Philippine Address Form */}
                  <div className="space-y-3 pt-1">
                    <Group gap={6}>
                      <MapPin size={15} className="text-cyan-500" />
                      <Text size="xs" fw={800} tt="uppercase" className="tracking-wider">
                        {shippingMethod === "store_pickup"
                          ? "Pickup Contact Person"
                          : "Philippine Delivery Address"}
                      </Text>
                    </Group>

                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
                      <TextInput
                        label="Recipient Full Name"
                        size="xs"
                        radius="md"
                        value={address.fullName}
                        onChange={(e) => setAddress({ ...address, fullName: e.currentTarget.value })}
                        required
                      />
                      <TextInput
                        label="Mobile Number (PH)"
                        size="xs"
                        radius="md"
                        placeholder="+63 9XX XXX XXXX"
                        value={address.phone}
                        onChange={(e) => setAddress({ ...address, phone: e.currentTarget.value })}
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
                            onChange={(val) => setAddress({ ...address, region: val || PH_REGIONS[0] })}
                          />
                          <TextInput
                            label="City / Municipality"
                            size="xs"
                            radius="md"
                            value={address.city}
                            onChange={(e) => setAddress({ ...address, city: e.currentTarget.value })}
                          />
                        </SimpleGrid>

                        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xs">
                          <TextInput
                            label="Barangay"
                            size="xs"
                            radius="md"
                            className="sm:col-span-2"
                            value={address.barangay}
                            onChange={(e) => setAddress({ ...address, barangay: e.currentTarget.value })}
                          />
                          <TextInput
                            label="Postal Code"
                            size="xs"
                            radius="md"
                            value={address.postalCode}
                            onChange={(e) => setAddress({ ...address, postalCode: e.currentTarget.value })}
                          />
                        </SimpleGrid>

                        <TextInput
                          label="House/Unit No., Building, Street Name"
                          size="xs"
                          radius="md"
                          value={address.streetAddress}
                          onChange={(e) => setAddress({ ...address, streetAddress: e.currentTarget.value })}
                        />

                        <Textarea
                          label="Delivery Rider / Courier Notes"
                          size="xs"
                          radius="md"
                          rows={2}
                          value={address.notes}
                          onChange={(e) => setAddress({ ...address, notes: e.currentTarget.value })}
                        />
                      </>
                    ) : (
                      <Paper withBorder radius="md" p="sm" className="bg-slate-50 dark:bg-[#141b29] border-slate-200 dark:border-white/10">
                        <Group gap="xs">
                          <Store size={16} className="text-cyan-500" />
                          <div>
                            <Text size="xs" fw={700}>
                              BuildbotAI Flagship Hub — Gilmore IT Center, Quezon City
                            </Text>
                            <Text size="11px" c="dimmed">
                              Open Mon–Sun, 10:00 AM – 8:00 PM. Bring a valid government ID upon pickup.
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
                <Stack gap="md">
                  <div>
                    <Text size="xs" fw={800} tt="uppercase" className="tracking-wider text-cyan-600 dark:text-cyan-400 mb-2">
                      Choose Payment Method
                    </Text>
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
                      {PAYMENT_METHODS.map((pm) => {
                        const Icon = pm.icon;
                        const active = paymentMethod === pm.id;
                        return (
                          <Paper
                            key={pm.id}
                            withBorder
                            radius="lg"
                            p="sm"
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
                                <ThemeIcon size="sm" radius="md" color={active ? "cyan" : pm.color} variant={active ? "filled" : "light"}>
                                  <Icon size={14} />
                                </ThemeIcon>
                                <Text size="xs" fw={800}>
                                  {pm.label}
                                </Text>
                              </Group>
                              <Badge size="xs" variant="light" color={active ? "cyan" : "gray"} className="text-[9px]">
                                {pm.badge}
                              </Badge>
                            </Group>
                            <Text size="11px" c="dimmed" className="leading-snug">
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
                              {selectedPaymentObj.label} — QRPh Instant Checkout
                            </Text>
                            <Text size="xs" c="dimmed">
                              Scan the dynamic QRPh code below or link your registered mobile wallet number.
                            </Text>
                          </div>
                          <Badge color={qrScannedSimulated ? "teal" : "cyan"} variant="filled">
                            {qrScannedSimulated ? "QR Scanned & Authorized" : "Awaiting Scan"}
                          </Badge>
                        </Group>

                        <div className="flex flex-col sm:flex-row items-center gap-4 p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0e131d]">
                          <div className="w-28 h-28 rounded-xl border-2 border-dashed border-cyan-500/50 flex flex-col items-center justify-center bg-cyan-500/5 shrink-0">
                            <QrCode size={56} className="text-cyan-600 dark:text-cyan-400" />
                            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-cyan-600 mt-1">
                              QRPh • {formatCurrency(total)}
                            </span>
                          </div>
                          <div className="flex-1 space-y-2 w-full">
                            <TextInput
                              label="Linked E-Wallet Mobile Number"
                              size="xs"
                              radius="md"
                              value={walletMobile}
                              onChange={(e) => setWalletMobile(e.currentTarget.value)}
                            />
                            <Button
                              size="xs"
                              radius="md"
                              color={qrScannedSimulated ? "teal" : "cyan"}
                              variant={qrScannedSimulated ? "light" : "filled"}
                              leftSection={<Sparkles size={13} />}
                              onClick={() => setQrScannedSimulated(!qrScannedSimulated)}
                              className="uppercase tracking-wider font-bold text-[11px]"
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
                            Credit / Debit Card Details (3D Secure 2.0)
                          </Text>
                          <Badge size="xs" color="indigo" variant="light">
                            256-Bit Encrypted UI
                          </Badge>
                        </Group>

                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
                          <TextInput
                            label="Card Number"
                            size="xs"
                            radius="md"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.currentTarget.value)}
                          />
                          <TextInput
                            label="Cardholder Name"
                            size="xs"
                            radius="md"
                            value={cardHolder}
                            onChange={(e) => setCardHolder(e.currentTarget.value)}
                          />
                        </SimpleGrid>

                        <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="xs">
                          <TextInput
                            label="Expiry (MM/YY)"
                            size="xs"
                            radius="md"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.currentTarget.value)}
                          />
                          <TextInput
                            label="CVV"
                            size="xs"
                            radius="md"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.currentTarget.value)}
                          />
                          <Select
                            label="0% Installment Plan"
                            size="xs"
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
                          size="xs"
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
                        <div className="p-2.5 rounded-lg bg-white dark:bg-[#0e131d] border border-slate-200 dark:border-white/10 text-xs font-mono space-y-1">
                          <div>Account Name: <strong>BUILDBOT AI HARDWARE INC.</strong></div>
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
                          Cash on Delivery (COD) / Showroom Counter Payment
                        </Text>
                        <Text size="xs" c="dimmed" className="leading-relaxed">
                          Prepare the exact amount of <strong>{formatCurrency(total)}</strong> upon courier arrival. For custom rigs exceeding ₱50,000, our dispatch team will send a quick SMS verification before dispatching the 4-wheel courier.
                        </Text>
                      </div>
                    )}
                  </Paper>
                </Stack>
              )}

              {/* STEP 3: FINAL REVIEW */}
              {step === 3 && (
                <Stack gap="md">
                  <Paper withBorder radius="lg" p="sm" className="bg-slate-50 dark:bg-[#141b29] border-slate-200 dark:border-white/10 space-y-2">
                    <Group justify="space-between">
                      <Text size="xs" fw={800} tt="uppercase" className="text-cyan-600 dark:text-cyan-400">
                        1. Fulfillment & Destination
                      </Text>
                      <Button variant="subtle" size="compact-xs" onClick={() => setStep(1)}>
                        Edit
                      </Button>
                    </Group>
                    <div className="text-xs space-y-0.5">
                      <p className="font-bold">
                        {selectedShippingObj.title} ({selectedShippingObj.courier})
                      </p>
                      <p className="text-slate-600 dark:text-slate-300">
                        {address.fullName} • {address.phone}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400">
                        {address.streetAddress}, {address.barangay}, {address.city}, {address.region}
                      </p>
                    </div>
                  </Paper>

                  <Paper withBorder radius="lg" p="sm" className="bg-slate-50 dark:bg-[#141b29] border-slate-200 dark:border-white/10 space-y-2">
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
                        <Text size="xs" fw={700}>
                          {selectedPaymentObj.label}
                        </Text>
                        <Text size="11px" c="dimmed">
                          {selectedPaymentObj.subtitle}
                        </Text>
                      </div>
                      <Badge color="teal" variant="light">
                        Ready to Process
                      </Badge>
                    </Group>
                  </Paper>

                  <Paper withBorder radius="lg" p="sm" className="bg-slate-50 dark:bg-[#141b29] border-slate-200 dark:border-white/10 space-y-2">
                    <Text size="xs" fw={800} tt="uppercase" className="text-cyan-600 dark:text-cyan-400">
                      3. Items in Order ({cart.length})
                    </Text>
                    <div className="divide-y divide-slate-200/70 dark:divide-white/10">
                      {cart.map((item) => (
                        <div key={item.id} className="py-1.5 flex justify-between items-center text-xs gap-2">
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {item.quantity}x {item.name}
                            </span>
                            {item.includeAssembly && (
                              <Badge size="xs" color="teal" variant="light" ml={6}>
                                Pro Assembly Included
                              </Badge>
                            )}
                          </div>
                          <span className="font-mono font-bold shrink-0">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Paper>
                </Stack>
              )}
            </ScrollArea.Autosize>

            {/* Step Navigation Buttons */}
            <Group justify="space-between" mt="md" pt="sm" className="border-t border-slate-200 dark:border-white/10">
              {step > 1 ? (
                <Button
                  variant="default"
                  size="sm"
                  radius="md"
                  leftSection={<ArrowLeft size={14} />}
                  onClick={() => setStep((step - 1) as 1 | 2 | 3)}
                >
                  Back
                </Button>
              ) : (
                <Button variant="subtle" color="gray" size="sm" onClick={handleClose}>
                  Cancel
                </Button>
              )}

              {step < 3 ? (
                <Button
                  color="cyan"
                  size="sm"
                  radius="md"
                  rightSection={<ArrowRight size={15} />}
                  onClick={() => setStep((step + 1) as 1 | 2 | 3)}
                  className="font-headline font-bold text-xs uppercase tracking-wider"
                >
                  {step === 1 ? "Continue to Payment" : "Review Order"}
                </Button>
              ) : (
                <Button
                  color="teal"
                  size="md"
                  radius="md"
                  loading={isSubmitting}
                  leftSection={<ShieldCheck size={17} />}
                  onClick={handleConfirmOrder}
                  className="font-headline font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-500/20"
                >
                  Place Order • {formatCurrency(total)}
                </Button>
              )}
            </Group>
          </div>

          {/* Right Column: Sticky Order Summary & Promo Voucher */}
          <div className="lg:col-span-5 p-4 sm:p-5 bg-slate-50/70 dark:bg-[#131926] flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <Title order={5} className="font-headline text-sm font-bold uppercase tracking-wider">
                Order Summary
              </Title>

              {/* Promo Voucher Input */}
              <Paper withBorder radius="md" p="xs" className="bg-white dark:bg-[#0e131d] border-slate-200 dark:border-white/10">
                <Group gap="xs" wrap="nowrap">
                  <TextInput
                    placeholder="Promo code (e.g. BUILDBOT500, FREESHIP)"
                    size="xs"
                    radius="sm"
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
              <Paper withBorder radius="lg" p="md" className="bg-white dark:bg-[#0e131d] border-slate-200 dark:border-white/10 space-y-2.5">
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
            </div>

            <Paper withBorder radius="md" p="xs" className="bg-cyan-500/5 border-cyan-500/20">
              <Group gap="xs" wrap="nowrap">
                <ShieldCheck size={18} className="text-cyan-500 shrink-0" />
                <Text size="11px" c="dimmed" className="leading-snug">
                  <strong>BuildbotAI Buyer Protection:</strong> 1-Year Local Store Warranty + 7-Day Instant Replacement on all verified components.
                </Text>
              </Group>
            </Paper>
          </div>
        </div>
      )}
    </Modal>
  );
}
