"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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
  Radio,
  Select,
  SimpleGrid,
  Stack,
  Stepper,
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
  ShoppingBag,
  Smartphone,
  Store,
  Tag,
  Truck,
} from "lucide-react";
import {
  useEcommerce,
  getEcommerceFallbackImage,
  isInvalidPlaceholderUrl,
  type ShippingAddress,
  type ShippingMethodId,
  type MockEcommerceOrder,
} from "@/context/ecommerce-context";
import { useSiteSettings } from "@/context/site-settings-context";
import { useUserProfile } from "@/context/user-profile";
import { useAddressBook } from "@/hooks/use-address-book";
import { formatCurrency, getOptimizedStorageUrl, cn } from "@/lib/utils";
import { OptimizedImage } from "@/components/ui/optimized-image";
import {
  CRATE_PROTECTION_FEE,
  PAYMENT_METHODS_LIST,
  SUPPORTED_VOUCHERS,
  calculateAuthoritativeOrderTotals,
  cartSupportsCrateProtection,
  getPaymentStatusInfo,
} from "@/lib/payment-methods";
import type { PaymentMethod, PaymentStatus, SavedAddress } from "@/lib/types";
import {
  createCheckoutOrder,
  switchOrderPaymentToCod,
  verifyAndSyncPaymongoOrder,
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
import { OrderExpirationNotice } from "@/components/order-expiration-timer";


const NETCODEX_STORE_LOCATION = {
  storeName: "Netcodex Computer Center",
  streetAddress: "35G Liberty Avenue, corner 9th Ave",
  barangay: "Socorro, Cubao",
  city: "Quezon City",
  region: "Metro Manila (NCR)",
  postalCode: "1109",
  fullAddress:
    "35G Liberty Avenue, corner 9th Ave, Socorro, Cubao, Quezon City, Metro Manila, Philippines 1109",
  hours: "Monday ? Sunday, 10:00 AM ? 7:00 PM",
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
      courier: "LBC Express / J&T Nationwide Cargo",
      eta: "3–5 Business Days",
      fee: 250,
      badge: "Nationwide PH",
      desc: "Door-to-door insured air/land cargo from our Quezon City warehouse with multi-layer anti-static protection.",
    },
    {
      id: "sameday_express",
      title: "Same-Day Metro Manila Express",
      courier: "Grab / Lalamove / Transportify 4-Wheel",
      eta: "Same Day (Before 8 PM)",
      fee: 550,
      badge: "Recommended for Full Rigs",
      desc: "Dedicated same-day dispatch from Cubao, QC for assembled tempered-glass PC rigs within Metro Manila.",
    },
    {
      id: "store_pickup",
      title: "In-Store Branch Pickup",
      courier: "Netcodex Computer Center — Cubao, Quezon City",
      eta: "Ready in 2–4 Hours",
      fee: 0,
      badge: "FREE",
      desc: "35G Liberty Avenue, corner 9th Ave, Socorro, Cubao, Quezon City, Metro Manila 1109.",
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
  const { shouldCorruptImages } = useSiteSettings();
  const { profile, authUser } = useUserProfile();
  const { addresses: savedAddresses, defaultAddress, addAddress } = useAddressBook();
  const { toast } = useToast();
  const router = useRouter();
  const {
    cart,
    activeReceiptOrder,
    setActiveReceiptOrder,
    placeMockOrder,
    setIsCartOpen,
  } = useEcommerce();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [retryOrder, setRetryOrder] = useState<MockEcommerceOrder | null>(null);
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
  const handledPaymongoReturnRef = useRef<string | null>(null);

  // Voucher state
  const [voucherInput, setVoucherInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<string | null>(null);

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

  // Saved Address Book selection state
  const [selectedAddressId, setSelectedAddressId] = useState<string | "custom">("auto");
  const [saveAddressToBook, setSaveAddressToBook] = useState(false);
  const [newAddressLabel, setNewAddressLabel] = useState<string>("Home");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") !== "retry-payment" || params.get("step") !== "3") {
      return;
    }

    const storedRetryOrder = sessionStorage.getItem("buildbot_checkout_retry_order");
    if (!storedRetryOrder) return;

    try {
      const parsed = JSON.parse(storedRetryOrder) as MockEcommerceOrder;
      if (
        !parsed.id ||
        !Array.isArray(parsed.items) ||
        !parsed.shippingAddress ||
        (parsed.paymentMethod !== "gcash_simulated" &&
          parsed.paymentMethod !== "paymongo_simulated")
      ) {
        throw new Error("Invalid retry order");
      }

      setRetryOrder(parsed);
      setShippingMethod(parsed.shippingMethod);
      setIncludeCrateProtection(parsed.includeCrateProtection);
      setPaymentMethod(parsed.paymentMethod);
      setAddress(parsed.shippingAddress);
      setSelectedAddressId("custom");
      setSaveAddressToBook(false);
      setVoucherInput(parsed.voucherCode || "");
      setAppliedVoucher(parsed.voucherCode || null);
      setStep(3);
    } catch {
      sessionStorage.removeItem("buildbot_checkout_retry_order");
      setCheckoutError("This payment retry could not be restored. Please return to To Pay and try again.");
    }
  }, []);

  // Automatically initialize address from default or first address in the book
  useEffect(() => {
    if (savedAddresses.length > 0 && selectedAddressId === "auto") {
      const target = defaultAddress || savedAddresses[0];
      if (target) {
        setSelectedAddressId(target.id);
        setAddress({
          fullName: target.fullName || profile?.name || authUser?.displayName || "Juan Dela Cruz",
          phone: target.phone || "+63 917 882 4910",
          email: target.email || profile?.email || authUser?.email || "customer@netcodex.ph",
          region: target.region || "Metro Manila (NCR)",
          city: target.city || "Quezon City",
          barangay: target.barangay || "Socorro, Cubao",
          streetAddress: target.streetAddress || "",
          postalCode: target.postalCode || "1109",
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
      email: saved.email || profile?.email || authUser?.email || "customer@netcodex.ph",
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
    setAddress({
      fullName: profile?.name || authUser?.displayName || "",
      phone: "",
      email: profile?.email || authUser?.email || "customer@netcodex.ph",
      region: PH_REGIONS[0],
      city: "",
      barangay: "",
      streetAddress: "",
      postalCode: "",
      notes: "",
    });
  };

  // Automatically verify PayMongo return redirects (?paymongoOrderId=...&paymongoResult=success|cancelled)
  useEffect(() => {
    if (typeof window === "undefined" || !authUser) return;
    const params = new URLSearchParams(window.location.search);
    const paymongoOrderId = params.get("paymongoOrderId");
    const paymongoResult = params.get("paymongoResult") as
      | "success"
      | "cancelled"
      | null;
    if (!paymongoOrderId) return;
    const returnKey = `${paymongoOrderId}_${paymongoResult || ""}`;
    if (handledPaymongoReturnRef.current === returnKey) return;
    handledPaymongoReturnRef.current = returnKey;

    (async () => {
      try {
        const idToken = await authUser.getIdToken();
        const res = await verifyAndSyncPaymongoOrder({
          orderId: paymongoOrderId,
          idToken,
          redirectHint: paymongoResult || undefined,
        });
        if (res.success && res.paymentStatus === "paid") {
          toast({
            title: "PayMongo Payment Verified!",
            description: `Order ${res.orderNumber} is now marked as Paid (Ref: ${res.paymentReference}).`,
          });
        } else if (res.paymentStatus === "cancelled") {
          toast({
            title: "PayMongo Checkout Cancelled",
            description: `Order ${res.orderNumber} remains reserved. You can retry PayMongo or switch to COD in Order History.`,
          });
        }
      } catch {
        // Ignore verification error on initial redirect mount
      }
    })();
  }, [authUser, toast]);

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

  const handleApplyVoucher = () => {
    const code = voucherInput.trim().toUpperCase();
    if (!code) return;
    const matched = SUPPORTED_VOUCHERS[code];
    if (!matched) {
      toast({
        title: "Invalid Voucher Code",
        description: "Try BUILDBOT1000 (min ?20,000) or STUDENT500 (min ?10,000).",
        variant: "destructive",
      });
      return;
    }
    if (pricing.subtotal < matched.minSubtotal) {
      toast({
        title: "Minimum Spend Not Met",
        description: `Voucher ${code} requires a minimum subtotal of ${formatCurrency(matched.minSubtotal)}.`,
        variant: "destructive",
      });
      return;
    }
    setAppliedVoucher(matched.code);
    setVoucherInput("");
    toast({
      title: "Voucher Applied",
      description: `${matched.code}: ${matched.label}`,
    });
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
      toast({
        title: "Sign In Required",
        description: "Please sign in with your customer account to place an order.",
        variant: "destructive",
      });
      router.push("/signin?returnTo=/checkout");
      return;
    }

    setIsSubmitting(true);
    try {
      if (retryOrder) {
        const retrySnapshot = {
          items: [...cart],
          shippingMethod: retryOrder.shippingMethod,
          courierName: retryOrder.courierName,
          estimatedDelivery: retryOrder.estimatedDelivery,
          shippingAddress: retryOrder.shippingAddress,
          includeCrateProtection: retryOrder.includeCrateProtection,
          voucherCode: retryOrder.voucherCode,
          subtotal: retryOrder.subtotal,
          shippingFee: retryOrder.shippingFee,
          protectionFee: retryOrder.protectionFee,
          discountAmount: retryOrder.discountAmount,
          vatAmount: retryOrder.vatAmount,
          total: retryOrder.total,
        };

        setPendingReceiptSnapshot(retrySnapshot);
        const paymentOrder = {
          orderId: retryOrder.firestoreOrderId || retryOrder.id,
          orderNumber: retryOrder.orderNumber,
          totalPrice: retryOrder.total,
          paymentReference: retryOrder.paymentReference,
          itemCount: retryOrder.items.reduce((sum, item) => sum + item.quantity, 0),
        };

        if (retryOrder.paymentMethod === "paymongo_simulated") {
          setPendingPaymongoOrder(paymentOrder);
        } else {
          setPendingGcashOrder(paymentOrder);
        }
        return;
      }

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
        shippingAddress: resolvedOrderAddress,
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
        toast({
          title: "Checkout Error",
          description: result.error || "Unable to place order.",
          variant: "destructive",
        });
        return;
      }

      // If requested, save new delivery address to Address Book
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
          console.warn("Could not save address to book during checkout:", err);
        });
      }

      const snapshotData = {
        items: cartSnapshot,
        shippingMethod,
        courierName: selectedShippingObj.courier,
        estimatedDelivery: selectedShippingObj.eta,
        shippingAddress: resolvedOrderAddress,
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

      // Cash on Delivery (COD)
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
        title: `Order ${result.orderNumber} Placed!`,
        description:
          "Your Cash on Delivery order has been recorded and stock has been reserved.",
      });
      setStep(1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      operationIdRef.current = null;
      const msg =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setCheckoutError(msg);
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
    sessionStorage.removeItem("buildbot_checkout_retry_order");
    setRetryOrder(null);
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    sessionStorage.removeItem("buildbot_checkout_retry_order");
    setRetryOrder(null);
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
            "Your reservation remains active. Pay upon nationwide courier arrival.",
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07090e] text-slate-900 dark:text-slate-100 transition-colors pb-16">
      {/* Top Header */}
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
                  if (activeReceiptOrder) {
                    setActiveReceiptOrder(null);
                  } else {
                    router.back();
                  }
                }}
                className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-cyan-500 px-0"
              >
                Back to Shopping
              </Button>
              <span className="text-slate-300 dark:text-white/20">·</span>
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
              >
                Cart Drawer ({cart.length})
              </button>
            </Group>

            <Group gap="sm" align="center">
              <ThemeIcon size="lg" radius="md" color="cyan" variant="light">
                {activeReceiptOrder ? (
                  <Receipt size={20} />
                ) : (
                  <ShieldCheck size={20} />
                )}
              </ThemeIcon>
              <div>
                <Group gap="xs" align="center">
                  <Title
                    order={1}
                    className="font-headline text-xl sm:text-2xl font-bold tracking-tight"
                  >
                    {activeReceiptOrder
                      ? "Order Confirmation"
                      : "Checkout"}
                  </Title>
                </Group>
                <Text size="xs" c="dimmed">
                  {activeReceiptOrder
                    ? `Order #${activeReceiptOrder.orderNumber} · Saved in Firestore`
                    : "Server-validated inventory deduction, Cash on Delivery, GCash & PayMongo"}
                </Text>
              </div>
            </Group>
          </div>
        </div>

        {/* STATE A: ORDER CONFIRMATION & RECEIPT */}
        {activeReceiptOrder ? (
          <div className="w-full space-y-6">
            {activeReceiptOrder.paymentStatus === "Payment Failed" ||
              activeReceiptOrder.paymentStatus === "Payment Cancelled" ? (
              <Alert
                color="red"
                variant="light"
                radius="md"
                icon={<AlertTriangle size={20} />}
                title={`Order ${activeReceiptOrder.orderNumber} ?${activeReceiptOrder.paymentStatus}`}
                className="border border-red-500/20"
              >
                <div className="space-y-3">
                  <Text size="xs" className="leading-relaxed">
                    Your order has been recorded in Firestore with stock reserved, but the{" "}
                    {activeReceiptOrder.paymentMethod === "paymongo_simulated"
                      ? "PayMongo Sandbox"
                      : "GCash"}{" "}
                    payment was{" "}
                    <strong>
                      {activeReceiptOrder.paymentStatus === "Payment Failed"
                        ? "declined"
                        : "cancelled"}
                    </strong>
                    . You can retry payment now or switch to Cash on Delivery.
                  </Text>
                  <Group gap="sm">
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
                          itemCount: activeReceiptOrder.items.reduce(
                            (s, i) => s + i.quantity,
                            0
                          ),
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
                      Switch to Cash on Delivery
                    </Button>
                  </Group>
                </div>
              </Alert>
            ) : (
              <Alert
                color="teal"
                variant="light"
                radius="md"
                icon={<CheckCircle2 size={20} />}
                title={`Order ${activeReceiptOrder.orderNumber} Placed Successfully!`}
                className="border border-teal-500/20"
              >
                Your order is confirmed and stock has been reserved. You can view your order anytime in{" "}
                <Link href="/profile?tab=orders" className="font-semibold underline underline-offset-2 hover:text-teal-600 dark:hover:text-teal-300 transition-colors">Profile &rarr; Orders</Link>.
              </Alert>
            )}

            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
              <Paper
                withBorder
                radius="md"
                p="md"
                className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10"
              >
                <Text size="11px" c="dimmed" fw={600} tt="uppercase">
                  Order Number
                </Text>
                <Text size="md" fw={700} className="mt-0.5 text-cyan-600 dark:text-cyan-400 font-mono">
                  {activeReceiptOrder.orderNumber}
                </Text>
                <Text size="xs" c="dimmed" mt={1}>
                  Reserved in Netcodex Catalog
                </Text>
              </Paper>

              <Paper
                withBorder
                radius="md"
                p="md"
                className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10"
              >
                <Text size="11px" c="dimmed" fw={600} tt="uppercase">
                  Payment Status
                </Text>
                <Badge
                  color={
                    activeReceiptOrder.paymentStatus.includes("Paid")
                      ? "teal"
                      : activeReceiptOrder.paymentStatus.includes("Failed") ||
                        activeReceiptOrder.paymentStatus.includes("Cancelled")
                        ? "red"
                        : "yellow"
                  }
                  variant="light"
                  size="sm"
                  className="mt-1"
                >
                  {activeReceiptOrder.paymentStatus}
                </Badge>
                <Text size="xs" c="dimmed" mt={1}>
                  Method: {activeReceiptOrder.paymentLabel}
                </Text>
                {activeReceiptOrder.paymentReference && (
                  <Text size="xs" c="dimmed" mt={1} className="font-mono">
                    Ref: <span className="font-semibold text-slate-800 dark:text-slate-200">{activeReceiptOrder.paymentReference}</span>
                  </Text>
                )}
              </Paper>

              <Paper
                withBorder
                radius="md"
                p="md"
                className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10"
              >
                <Text size="11px" c="dimmed" fw={600} tt="uppercase">
                  Fulfillment & Courier
                </Text>
                <Text size="xs" fw={700} className="mt-0.5 text-slate-800 dark:text-slate-200">
                  {activeReceiptOrder.courierName}
                </Text>
                <Text size="xs" c="dimmed">
                  ETA: {activeReceiptOrder.estimatedDelivery}
                </Text>
              </Paper>
            </SimpleGrid>

            {/* Delivery Details Summary Card */}
            <Paper
              withBorder
              radius="md"
              p="md"
              className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 space-y-3"
            >
              <Group justify="space-between" align="center">
                <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                  Delivery Destination
                </Text>
                <Badge size="xs" variant="outline" color="cyan">
                  {activeReceiptOrder.shippingMethod === "store_pickup"
                    ? "In-Store Pickup"
                    : "Courier Delivery"}
                </Badge>
              </Group>
              <div className="text-xs sm:text-sm space-y-0.5">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {activeReceiptOrder.shippingAddress.fullName} ({activeReceiptOrder.shippingAddress.phone})
                </p>
                {activeReceiptOrder.shippingMethod === "store_pickup" && (
                  <p className="text-cyan-600 dark:text-cyan-400 font-medium">
                    {NETCODEX_STORE_LOCATION.storeName} · {NETCODEX_STORE_LOCATION.hours}
                  </p>
                )}
                <p className="text-slate-600 dark:text-slate-300">
                  {activeReceiptOrder.shippingAddress.streetAddress},{" "}
                  {activeReceiptOrder.shippingAddress.barangay},{" "}
                  {activeReceiptOrder.shippingAddress.city},{" "}
                  {activeReceiptOrder.shippingAddress.region} {activeReceiptOrder.shippingAddress.postalCode}
                </p>
              </div>

              <Divider className="border-slate-200 dark:border-white/10" />

              <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                Ordered Items ({activeReceiptOrder.items.length})
              </Text>
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {activeReceiptOrder.items.map((item) => {
                  const fallbackImg = getEcommerceFallbackImage(
                    item.category,
                    item.kind
                  );
                  const rawImg = isInvalidPlaceholderUrl(item.imageUrl)
                    ? fallbackImg
                    : item.imageUrl!;
                  const resolvedImg =
                    getOptimizedStorageUrl(rawImg, shouldCorruptImages) ||
                    fallbackImg;
                  return (
                    <div
                      key={item.id}
                      className="flex justify-between items-center py-2.5 text-sm gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
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
                          <p className="font-semibold text-xs truncate">{item.name}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Qty: {item.quantity} · {formatCurrency(item.price)}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 shrink-0">
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
                size="sm"
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
                  size="sm"
                  radius="md"
                  rightSection={<ArrowRight size={14} />}
                  onClick={() => {
                    setActiveReceiptOrder(null);
                    router.push("/profile?tab=orders");
                  }}
                >
                  View Order History
                </Button>
              )}
            </Group>
          </div>
        ) : cart.length === 0 ? (
          /* STATE B: EMPTY CART */
          <Paper
            withBorder
            radius="md"
            p="xl"
            className="max-w-md mx-auto my-12 text-center bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 space-y-4"
          >
            <ThemeIcon
              size={52}
              radius="md"
              color="cyan"
              variant="light"
              className="mx-auto"
            >
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
          </Paper>
        ) : (
          /* STATE C: 2-COLUMN UNIFIED CHECKOUT INTERFACE */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Left Column (7 cols): Single Unified Card with Mantine Stepper */}
            <div className="lg:col-span-7">
              <Paper
                withBorder
                radius="md"
                p={{ base: "md", sm: "lg" }}
                className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm space-y-6"
              >
                {/* Visual Step Progress Header */}
                <Stepper
                  active={step - 1}
                  onStepClick={(s) => setStep((s + 1) as 1 | 2 | 3)}
                  color="cyan"
                  size="xs"
                  className="pb-2 border-b border-slate-100 dark:border-white/5"
                >
                  <Stepper.Step
                    label="Fulfillment"
                    description="Courier & Address"
                    icon={<Truck size={14} />}
                  />
                  <Stepper.Step
                    label="Payment"
                    description="COD, GCash, PayMongo"
                    icon={<CreditCard size={14} />}
                  />
                  <Stepper.Step
                    label="Review"
                    description="Confirm Order"
                    icon={<PackageCheck size={14} />}
                  />
                </Stepper>

                {/* Error Banner */}
                {checkoutError && (
                  <Alert
                    color="red"
                    variant="light"
                    radius="md"
                    icon={<AlertTriangle size={18} />}
                    title="Checkout Issue"
                  >
                    <Text size="xs">{checkoutError}</Text>
                  </Alert>
                )}

                {/* STEP 1: FULFILLMENT & SHIPPING ADDRESS */}
                {step === 1 && (
                  <Stack gap="lg">
                    {/* Courier Fulfillment Selector */}
                    <div className="space-y-3">
                      <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                        Select Fulfillment Method
                      </Text>

                      {/* Unified selectable group ?reduces nested box division */}
                      <div className="divide-y divide-slate-200 dark:divide-white/10 rounded-md border border-slate-200 dark:border-white/10 overflow-hidden bg-slate-50/40 dark:bg-white/[0.02]">
                        {SHIPPING_METHODS.map((method) => {
                          const selected = shippingMethod === method.id;
                          return (
                            <div
                              key={method.id}
                              onClick={() => setShippingMethod(method.id)}
                              className={cn(
                                "flex items-start justify-between p-3.5 cursor-pointer transition-colors",
                                selected
                                  ? "bg-cyan-50/70 dark:bg-cyan-950/30"
                                  : "hover:bg-slate-100/60 dark:hover:bg-white/5"
                              )}
                            >
                              <div className="flex items-start gap-3">
                                <Radio
                                  checked={selected}
                                  onChange={() => setShippingMethod(method.id)}
                                  color="cyan"
                                  size="sm"
                                  className="mt-0.5 pointer-events-none"
                                />
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <Text size="sm" fw={700}>
                                      {method.title}
                                    </Text>
                                    <Badge
                                      size="xs"
                                      variant="light"
                                      color={selected ? "cyan" : "gray"}
                                    >
                                      {method.badge}
                                    </Badge>
                                  </div>
                                  <Text size="xs" className="text-cyan-700 dark:text-cyan-300 font-medium">
                                    {method.courier} ? ETA: {method.eta}
                                  </Text>
                                  <Text size="xs" c="dimmed">
                                    {method.desc}
                                  </Text>
                                </div>
                              </div>
                              <Text
                                size="sm"
                                fw={700}
                                ff="monospace"
                                className="shrink-0 text-emerald-600 dark:text-emerald-400 ml-3"
                              >
                                {method.fee === 0
                                  ? "FREE"
                                  : formatCurrency(method.fee)}
                              </Text>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Fragile PC Crate Protection */}
                    {shippingMethod !== "store_pickup" &&
                      hasBuildForCrateProtection && (
                        <div className="flex items-start gap-3 p-3 rounded-md bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20">
                          <Checkbox
                            color="cyan"
                            checked={includeCrateProtection}
                            onChange={(e) =>
                              setIncludeCrateProtection(e.currentTarget.checked)
                            }
                            className="mt-0.5"
                          />
                          <div
                            className="space-y-0.5 cursor-pointer select-none"
                            onClick={() => setIncludeCrateProtection(!includeCrateProtection)}
                          >
                            <div className="flex items-center gap-2">
                              <Text size="xs" fw={700}>
                                Instapak Expanding GPU Foam + Tempered Glass Wooden Crate
                              </Text>
                              <Badge size="xs" color="amber" variant="light">
                                +{formatCurrency(CRATE_PROTECTION_FEE)}
                              </Badge>
                            </div>
                            <Text size="xs" c="dimmed">
                              Multi-layer anti-shock crate standard for nationwide couriers. Prevents PCIe sag and glass fracture.
                            </Text>
                          </div>
                        </div>
                      )}

                    {/* Philippine Delivery Address / Showroom Info */}
                    <div className="space-y-4 pt-1">
                      <div className="flex items-center justify-between">
                        <Group gap={6}>
                          <MapPin size={15} className="text-cyan-500" />
                          <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                            {shippingMethod === "store_pickup"
                              ? "Showroom Pickup Contact"
                              : "Delivery Address"}
                          </Text>
                        </Group>

                        {shippingMethod !== "store_pickup" && (
                          <Link
                            href="/profile?tab=address-book"
                            className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                          >
                            <BookMarked size={13} />
                            <span>Manage Address Book</span>
                            <ArrowRight size={11} />
                          </Link>
                        )}
                      </div>

                      {/* Saved Address Book Selector */}
                      {shippingMethod !== "store_pickup" && savedAddresses.length > 0 && (
                        <div className="space-y-2.5">
                          <Text size="xs" fw={600} c="dimmed">
                            Select from your Address Book:
                          </Text>
                          <div className="space-y-2.5">
                            {savedAddresses.map((item) => {
                              const isSelected = selectedAddressId === item.id;
                              return (
                                <div
                                  key={item.id}
                                  onClick={() => handleSelectSavedAddress(item)}
                                  className={cn(
                                    "w-full p-3.5 rounded-xl border text-left cursor-pointer transition-all relative",
                                    isSelected
                                      ? "bg-cyan-500/10 border-cyan-500 ring-1 ring-cyan-500 shadow-sm"
                                      : "bg-slate-50/60 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
                                  )}
                                >
                                  <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2">
                                      <Badge
                                        size="xs"
                                        variant={isSelected ? "filled" : "light"}
                                        color={isSelected ? "cyan" : "gray"}
                                        className="font-bold uppercase tracking-wider text-[10px]"
                                      >
                                        {item.label}
                                      </Badge>
                                      {item.isDefault && (
                                        <Badge size="xs" variant="outline" color="cyan" className="text-[9px]">
                                          Default
                                        </Badge>
                                      )}
                                    </div>
                                    {isSelected && (
                                      <CheckCircle2 size={16} className="text-cyan-500 shrink-0" />
                                    )}
                                  </div>
                                  <Text size="xs" fw={700} className="line-clamp-1">
                                    {item.fullName} ? {item.phone}
                                  </Text>
                                  <Text size="xs" c="dimmed" className="mt-0.5 leading-snug">
                                    {item.streetAddress}, {item.barangay}, {item.city}, {item.region} {item.postalCode}
                                  </Text>
                                </div>
                              );
                            })}

                            {/* + Use New Address at the bottom of the address list */}
                            <div
                              onClick={handleSelectCustomAddress}
                              className={cn(
                                "w-full p-3 rounded-xl border border-dashed text-left cursor-pointer transition-all flex items-center justify-between gap-3",
                                selectedAddressId === "custom"
                                  ? "bg-cyan-500/10 border-cyan-500 ring-1 ring-cyan-500 text-cyan-500"
                                  : "border-slate-300 dark:border-white/20 text-slate-500 hover:border-cyan-500/50 hover:text-cyan-500 hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"
                              )}
                            >
                              <div className="flex items-center gap-2.5">
                                <ThemeIcon
                                  size="md"
                                  radius="md"
                                  variant={selectedAddressId === "custom" ? "filled" : "light"}
                                  color="cyan"
                                  className="shrink-0"
                                >
                                  <Plus size={16} />
                                </ThemeIcon>
                                <div>
                                  <Text
                                    size="xs"
                                    fw={700}
                                    className={
                                      selectedAddressId === "custom"
                                        ? "text-cyan-600 dark:text-cyan-400"
                                        : "text-slate-800 dark:text-slate-200"
                                    }
                                  >
                                    Use New Address
                                  </Text>
                                  <Text size="11px" c="dimmed">
                                    Enter a custom or one-time delivery address for this order
                                  </Text>
                                </div>
                              </div>
                              {selectedAddressId === "custom" && (
                                <CheckCircle2 size={16} className="text-cyan-500 shrink-0" />
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Store Pickup Form */}
                      {shippingMethod === "store_pickup" ? (
                        <div className="space-y-4 pt-1">
                          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                            <TextInput
                              label="Recipient Full Name"
                              size="sm"
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
                              size="sm"
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

                          <div className="flex items-start gap-3 p-3.5 rounded-md bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10">
                            <ThemeIcon
                              size="md"
                              radius="md"
                              color="cyan"
                              variant="light"
                              className="shrink-0 mt-0.5"
                            >
                              <Store size={16} />
                            </ThemeIcon>
                            <div className="space-y-0.5">
                              <Text size="xs" fw={700} className="text-slate-900 dark:text-slate-100">
                                {NETCODEX_STORE_LOCATION.storeName} (Showroom & Pickup)
                              </Text>
                              <Text size="xs" className="text-cyan-700 dark:text-cyan-300 font-medium">
                                {NETCODEX_STORE_LOCATION.fullAddress}
                              </Text>
                              <Text size="11px" c="dimmed">
                                Hours: {NETCODEX_STORE_LOCATION.hours} ? Phone: {NETCODEX_STORE_LOCATION.phone}
                              </Text>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Delivery Mode: Manual Address Form only appears if "Use New Address" is selected, or if user has no saved addresses */
                        (savedAddresses.length === 0 || selectedAddressId === "custom") && (
                          <div className="space-y-4 pt-2 border-t border-slate-200/80 dark:border-white/10">
                            {savedAddresses.length > 0 && (
                              <div className="flex items-center justify-between">
                                <Text size="xs" fw={700} className="text-slate-800 dark:text-slate-200 uppercase tracking-wider font-headline">
                                  New Delivery Address
                                </Text>
                                <Button
                                  variant="subtle"
                                  color="gray"
                                  size="compact-xs"
                                  onClick={() => {
                                    const defaultOrFirst = defaultAddress || savedAddresses[0];
                                    if (defaultOrFirst) handleSelectSavedAddress(defaultOrFirst);
                                  }}
                                  className="text-xs"
                                >
                                  Cancel & Use Saved Address
                                </Button>
                              </div>
                            )}

                            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                              <TextInput
                                label="Recipient Full Name"
                                size="sm"
                                radius="md"
                                placeholder="Juan Dela Cruz"
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
                                size="sm"
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

                            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                              <Select
                                label="Region / Province"
                                size="sm"
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
                                size="sm"
                                radius="md"
                                placeholder="Quezon City"
                                value={address.city}
                                onChange={(e) =>
                                  setAddress({
                                    ...address,
                                    city: e.currentTarget.value,
                                  })
                                }
                              />
                            </SimpleGrid>

                            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
                              <TextInput
                                label="Barangay"
                                size="sm"
                                radius="md"
                                className="sm:col-span-2"
                                placeholder="Socorro, Cubao"
                                value={address.barangay}
                                onChange={(e) =>
                                  setAddress({
                                    ...address,
                                    barangay: e.currentTarget.value,
                                  })
                                }
                              />
                              <TextInput
                                label="Postal Code"
                                size="sm"
                                radius="md"
                                placeholder="1109"
                                value={address.postalCode}
                                onChange={(e) =>
                                  setAddress({
                                    ...address,
                                    postalCode: e.currentTarget.value,
                                  })
                                }
                              />
                            </SimpleGrid>

                            <TextInput
                              label="House/Unit No., Street Address"
                              size="sm"
                              radius="md"
                              placeholder="35G Liberty Avenue, corner 9th Ave"
                              value={address.streetAddress}
                              onChange={(e) =>
                                setAddress({
                                  ...address,
                                  streetAddress: e.currentTarget.value,
                                })
                              }
                            />

                            <Textarea
                              label="Delivery Rider Notes (Optional)"
                              size="sm"
                              radius="md"
                              rows={2}
                              placeholder="e.g. Near 9th Ave entrance, leave with lobby security. Keep box upright."
                              value={address.notes}
                              onChange={(e) =>
                                setAddress({
                                  ...address,
                                  notes: e.currentTarget.value,
                                })
                              }
                            />

                            {/* Save custom address to Address Book */}
                            <div className="p-3.5 rounded-xl bg-cyan-500/5 dark:bg-cyan-500/10 border border-cyan-500/20 space-y-2.5">
                              <Checkbox
                                checked={saveAddressToBook}
                                onChange={(e) => setSaveAddressToBook(e.currentTarget.checked)}
                                label={
                                  <Text size="xs" fw={700}>
                                    Save this address to your Address Book for future checkouts
                                  </Text>
                                }
                                color="cyan"
                                size="xs"
                              />
                              {saveAddressToBook && (
                                <Group gap="xs" align="center" className="pt-1">
                                  <Text size="xs" c="dimmed">
                                    Save label as:
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
                          </div>
                        )
                      )}
                    </div>
                  </Stack>
                )}

                {/* STEP 2: PAYMENT METHOD */}
                {step === 2 && (
                  <Stack gap="lg">
                    <div className="space-y-3">
                      <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                        Choose Payment Method
                      </Text>

                      {/* Unified selectable list */}
                      <div className="divide-y divide-slate-200 dark:divide-white/10 rounded-md border border-slate-200 dark:border-white/10 overflow-hidden bg-slate-50/40 dark:bg-white/[0.02]">
                        {PAYMENT_METHODS_LIST.map((pm) => {
                          const active = paymentMethod === pm.id;
                          const Icon =
                            pm.id === "cod"
                              ? Truck
                              : pm.id === "gcash_simulated"
                                ? Smartphone
                                : CreditCard;
                          return (
                            <div
                              key={pm.id}
                              onClick={() => {
                                if (pm.enabled) {
                                  setPaymentMethod(pm.id);
                                  operationIdRef.current = null;
                                }
                              }}
                              className={cn(
                                "flex items-start justify-between p-3.5 cursor-pointer transition-colors",
                                active
                                  ? "bg-cyan-50/70 dark:bg-cyan-950/30"
                                  : "hover:bg-slate-100/60 dark:hover:bg-white/5",
                                !pm.enabled && "opacity-50 cursor-not-allowed"
                              )}
                            >
                              <div className="flex items-start gap-3">
                                <Radio
                                  checked={active}
                                  onChange={() => {
                                    if (pm.enabled) {
                                      setPaymentMethod(pm.id);
                                      operationIdRef.current = null;
                                    }
                                  }}
                                  color="cyan"
                                  size="sm"
                                  className="mt-0.5 pointer-events-none"
                                />
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <Icon
                                      size={15}
                                      className={
                                        active
                                          ? "text-cyan-600 dark:text-cyan-400"
                                          : "text-slate-400"
                                      }
                                    />
                                    <Text size="sm" fw={700}>
                                      {pm.label}
                                    </Text>
                                    <Badge
                                      size="xs"
                                      variant="light"
                                      color={active ? "cyan" : "gray"}
                                    >
                                      {pm.badgeText}
                                    </Badge>
                                  </div>
                                  <Text size="xs" c="dimmed">
                                    {pm.description}
                                  </Text>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Notice */}
                    <div className="p-3 rounded-md bg-cyan-50/60 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800/30">
                      <div className="flex items-center gap-2 mb-1">
                        <Lock size={13} className="text-cyan-600 dark:text-cyan-400" />
                        <span className="text-xs font-bold text-cyan-800 dark:text-cyan-300">
                          {paymentMethod === "gcash_simulated"
                            ? "GCash Payment"
                            : paymentMethod === "paymongo_simulated"
                              ? "PayMongo Payment Gateway"
                              : "Cash on Delivery Guarantee"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {paymentMethod === "gcash_simulated"
                          ? "Enter test OTP and MPIN for e-wallet settlement. No actual Philippine pesos will be deducted."
                          : paymentMethod === "paymongo_simulated"
                            ? "PayMongo credit card, Maya, QRPh, and online banking checkout."
                            : "Inspect your items and sign upon courier turnover at your Philippine address before releasing cash."}
                      </p>
                    </div>
                  </Stack>
                )}

                {/* STEP 3: ORDER REVIEW */}
                {step === 3 && (
                  <Stack gap="lg">
                    <div className="space-y-3">
                      <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                        Final Order Summary Review
                      </Text>

                      {/* Fulfillment Method Review */}
                      <div className="p-3 rounded-md bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wide">
                            1. Fulfillment & Destination
                          </span>
                          <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-semibold"
                          >
                            Edit
                          </button>
                        </div>
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                          {selectedShippingObj.title} ({selectedShippingObj.courier})
                        </p>
                        <p className="text-xs text-slate-500">
                          {resolvedOrderAddress.fullName} ? {resolvedOrderAddress.phone}
                        </p>
                        <p className="text-xs text-slate-500">
                          {resolvedOrderAddress.streetAddress}, {resolvedOrderAddress.barangay}, {resolvedOrderAddress.city},{" "}
                          {resolvedOrderAddress.region} {resolvedOrderAddress.postalCode}
                        </p>
                      </div>

                      {/* Payment Method Review */}
                      <div className="p-3 rounded-md bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wide">
                            2. Payment Method
                          </span>
                          <button
                            type="button"
                            onClick={() => setStep(2)}
                            className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-semibold"
                          >
                            Edit
                          </button>
                        </div>
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                          {selectedPaymentDef.label} ({selectedPaymentDef.badgeText})
                        </p>
                        <p className="text-xs text-slate-500">
                          {selectedPaymentDef.description}
                        </p>
                      </div>

                      {/* Items Review */}
                      <div className="p-3 rounded-md bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 space-y-2">
                        <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wide">
                          3. Items in Order ({cart.length})
                        </span>
                        <div className="divide-y divide-slate-100 dark:divide-white/5">
                          {cart.map((item) => {
                            const fallbackImg = getEcommerceFallbackImage(
                              item.category,
                              item.kind
                            );
                            const rawImg = isInvalidPlaceholderUrl(item.imageUrl)
                              ? fallbackImg
                              : item.imageUrl!;
                            const resolvedImg =
                              getOptimizedStorageUrl(
                                rawImg,
                                shouldCorruptImages
                              ) || fallbackImg;
                            return (
                              <div
                                key={item.id}
                                className="flex items-center justify-between py-2 text-xs gap-3"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0e131d]">
                                    <OptimizedImage
                                      src={resolvedImg}
                                      alt={item.name}
                                      fill
                                      sizes="40px"
                                      className="object-contain p-1"
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-semibold truncate text-slate-900 dark:text-slate-100">
                                      {item.quantity}x {item.name}
                                    </p>
                                    {item.includeAssembly && (
                                      <Badge
                                        size="xs"
                                        color="teal"
                                        variant="light"
                                        className="text-[9px] mt-0.5"
                                      >
                                        Assembly Included
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                                  {formatCurrency(item.price * item.quantity)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </Stack>
                )}

                {/* Bottom Step Navigation Buttons */}
                <Group
                  justify="space-between"
                  pt="md"
                  className="border-t border-slate-200 dark:border-white/10"
                >
                  {step > 1 ? (
                    <Button
                      variant="default"
                      size="sm"
                      radius="md"
                      leftSection={<ArrowLeft size={14} />}
                      onClick={() => setStep((step - 1) as 1 | 2 | 3)}
                    >
                      Previous Step
                    </Button>
                  ) : (
                    <Button
                      variant="subtle"
                      color="gray"
                      size="sm"
                      radius="md"
                      onClick={() => router.back()}
                    >
                      Return to Store
                    </Button>
                  )}

                  {step < 3 ? (
                    <Button
                      color="cyan"
                      size="sm"
                      radius="md"
                      rightSection={<ArrowRight size={14} />}
                      onClick={() => setStep((step + 1) as 1 | 2 | 3)}
                    >
                      {step === 1
                        ? "Continue to Payment"
                        : "Review Final Order"}
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
                        ? `Proceed to GCash ? ${formatCurrency(pricing.totalPrice)}`
                        : paymentMethod === "paymongo_simulated"
                          ? `Proceed to PayMongo Checkout ? ${formatCurrency(pricing.totalPrice)}`
                          : `Place COD Order ? ${formatCurrency(pricing.totalPrice)}`}
                    </Button>
                  )}
                </Group>
              </Paper>
            </div>

            {/* Right Column (5 cols): Cohesive Order Summary Card */}
            <div className="lg:col-span-5 lg:sticky lg:top-24">
              <Paper
                withBorder
                radius="md"
                p={{ base: "md", sm: "lg" }}
                className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm space-y-4"
              >
                <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-white/10">
                  <Title
                    order={4}
                    className="font-headline text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200"
                  >
                    Order Summary
                  </Title>
                  <Badge
                    size="sm"
                    variant="light"
                    color="cyan"
                    className="font-mono"
                  >
                    {cart.reduce((s, i) => s + i.quantity, 0)} Items
                  </Badge>
                </div>

                {/* Items List ?Clean continuous flow without nested cards */}
                <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                  {cart.map((item) => {
                    const fallbackImg = getEcommerceFallbackImage(
                      item.category,
                      item.kind
                    );
                    const rawImg = isInvalidPlaceholderUrl(item.imageUrl)
                      ? fallbackImg
                      : item.imageUrl!;
                    const resolvedImg =
                      getOptimizedStorageUrl(rawImg, shouldCorruptImages) ||
                      fallbackImg;
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
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
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

                {/* Promo Code Input */}
                <div className="pt-2 border-t border-slate-200 dark:border-white/10 space-y-2">
                  <Text size="11px" fw={600} tt="uppercase" c="dimmed">
                    Promo / Voucher Code
                  </Text>
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
                  {appliedVoucher && (
                    <Group justify="space-between" align="center">
                      <Badge size="xs" color="teal" variant="light">
                        Active: {appliedVoucher}
                      </Badge>
                      <button
                        type="button"
                        onClick={() => setAppliedVoucher(null)}
                        className="text-xs text-rose-500 hover:underline"
                      >
                        Remove
                      </button>
                    </Group>
                  )}
                </div>

                <Divider className="border-slate-200 dark:border-white/10" />

                {/* Price Breakdown */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Hardware Subtotal</span>
                    <span className="font-mono font-medium">
                      {formatCurrency(pricing.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Shipping ({selectedShippingObj.title})</span>
                    <span className="font-mono font-medium">
                      {pricing.shippingFee === 0
                        ? "FREE"
                        : formatCurrency(pricing.shippingFee)}
                    </span>
                  </div>
                  {pricing.protectionFee > 0 && (
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>Crate & Foam Protection</span>
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
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Included 12% PH VAT</span>
                    <span className="font-mono">
                      {formatCurrency(pricing.vatIncludedAmount)}
                    </span>
                  </div>
                </div>

                <Divider className="border-slate-200 dark:border-white/10" />

                <Group justify="space-between" align="baseline">
                  <div>
                    <Text size="xs" fw={700} tt="uppercase">
                      Total Amount
                    </Text>
                    <Text size="10px" c="dimmed">
                      {getPaymentStatusInfo(
                        selectedPaymentDef.initialPaymentStatus,
                        paymentMethod
                      ).label}
                    </Text>
                  </div>
                  <Text
                    size="xl"
                    fw={900}
                    ff="monospace"
                    className="text-emerald-600 dark:text-emerald-400"
                  >
                    {formatCurrency(pricing.totalPrice)}
                  </Text>
                </Group>
              </Paper>
            </div>
          </div>
        )}
      </main>

      <SimulatedGcashModal
        opened={Boolean(pendingGcashOrder)}
        onClose={() => {
          setPendingGcashOrder(null);
        }}
        order={pendingGcashOrder}
        onOutcomeResolved={handleGcashOutcomeResolved}
      />

      <SimulatedPaymongoModal
        opened={Boolean(pendingPaymongoOrder)}
        onClose={() => {
          setPendingPaymongoOrder(null);
        }}
        order={pendingPaymongoOrder}
        onOutcomeResolved={handlePaymongoOutcomeResolved}
      />
    </div>
  );
}
