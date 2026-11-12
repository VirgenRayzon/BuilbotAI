"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useEcommerce,
  type ShippingAddress,
  type ShippingMethodId,
  type MockEcommerceOrder,
} from "@/context/ecommerce-context";
import { useSiteSettings } from "@/context/site-settings-context";
import { useUserProfile } from "@/context/user-profile";
import { useAddressBook } from "@/hooks/use-address-book";
import { formatCurrency } from "@/lib/utils";
import {
  PAYMENT_METHODS_LIST,
  SUPPORTED_VOUCHERS,
  calculateAuthoritativeOrderTotals,
  cartSupportsCrateProtection,
} from "@/lib/payment-methods";
import type { PaymentMethod, PaymentStatus, SavedAddress } from "@/lib/types";
import {
  createCheckoutOrder,
  switchOrderPaymentToCod,
  verifyAndSyncPaymongoOrder,
} from "@/app/checkout-actions";
import type { SimulatedGcashModalOrderInfo } from "@/components/ecommerce/simulated-gcash-modal";
import type { SimulatedPaymongoModalOrderInfo } from "@/components/ecommerce/paymongo-checkout-modal";
import { useToast } from "@/hooks/use-toast";
import {
  NETCODEX_STORE_LOCATION,
  PH_REGIONS,
  SHIPPING_METHODS,
  mapPaymentStatusLabel,
  type PendingReceiptSnapshot,
} from "../checkout-constants";

export function useCheckoutController() {
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
  const [pendingReceiptSnapshot, setPendingReceiptSnapshot] =
    useState<PendingReceiptSnapshot | null>(null);
  const operationIdRef = useRef<string | null>(null);
  const handledPaymongoReturnRef = useRef<string | null>(null);

  const [voucherInput, setVoucherInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<string | null>(null);

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

  const [selectedAddressId, setSelectedAddressId] = useState<string | "custom">("auto");
  const [saveAddressToBook, setSaveAddressToBook] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") !== "retry-payment") {
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
    } catch {
      sessionStorage.removeItem("buildbot_checkout_retry_order");
      setCheckoutError("This payment retry could not be restored. Please return to To Pay and try again.");
    }
  }, []);

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

  const handleCancelCustomAddress = () => {
    const defaultOrFirst = defaultAddress || savedAddresses[0];
    if (defaultOrFirst) handleSelectSavedAddress(defaultOrFirst);
  };

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

  const enabledPaymentMethods = useMemo(
    () => PAYMENT_METHODS_LIST.filter((pm) => pm.enabled),
    []
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

  const totalItemCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const handleApplyVoucher = () => {
    const code = voucherInput.trim().toUpperCase();
    if (!code) return;
    const matched = SUPPORTED_VOUCHERS[code];
    if (!matched) {
      toast({
        title: "Invalid Voucher Code",
        description: "Try BUILDBOT1000 (min ₱20,000) or STUDENT500 (min ₱10,000).",
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

  const handleSelectPaymentMethod = (methodId: PaymentMethod) => {
    setPaymentMethod(methodId);
    operationIdRef.current = null;
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
        const retrySnapshot: PendingReceiptSnapshot = {
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

      if (saveAddressToBook && shippingMethod !== "store_pickup") {
        addAddress({
          label: "Home",
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

      const snapshotData: PendingReceiptSnapshot = {
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
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      operationIdRef.current = null;
      const msg =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setCheckoutError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resolveModalOrderOutcome = (
    method: "gcash_simulated" | "paymongo_simulated",
    outcomeResult: {
      outcome: "success" | "failed" | "cancelled";
      paymentStatus: PaymentStatus;
      paymentReference: string | null;
    }
  ) => {
    const activePending =
      method === "gcash_simulated" ? pendingGcashOrder : pendingPaymongoOrder;
    if (!activePending) return;

    const paymentLabel = method === "gcash_simulated" ? "GCash" : "PayMongo";
    const statusLabel = mapPaymentStatusLabel(outcomeResult.paymentStatus, method);

    if (pendingReceiptSnapshot) {
      placeMockOrder({
        id: activePending.orderId,
        firestoreOrderId: activePending.orderId,
        orderNumber: activePending.orderNumber,
        paymentReference:
          outcomeResult.paymentReference ||
          activePending.paymentReference ||
          undefined,
        ...pendingReceiptSnapshot,
        paymentMethod: method,
        paymentLabel,
        paymentStatus: statusLabel,
        fulfillmentStage: "order_placed",
      });
      setPendingReceiptSnapshot(null);
    } else if (activeReceiptOrder) {
      setActiveReceiptOrder({
        ...activeReceiptOrder,
        paymentMethod: method,
        paymentLabel,
        paymentStatus: statusLabel,
        paymentReference:
          outcomeResult.paymentReference || activeReceiptOrder.paymentReference,
        fulfillmentStage: "order_placed",
      });
    }

    if (method === "gcash_simulated") {
      setPendingGcashOrder(null);
    } else {
      setPendingPaymongoOrder(null);
    }
    sessionStorage.removeItem("buildbot_checkout_retry_order");
    setRetryOrder(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRetryActiveReceiptPayment = () => {
    if (!activeReceiptOrder) return;
    const orderInfo = {
      orderId: activeReceiptOrder.firestoreOrderId || activeReceiptOrder.id,
      orderNumber: activeReceiptOrder.orderNumber,
      totalPrice: activeReceiptOrder.total,
      paymentReference: activeReceiptOrder.paymentReference,
      itemCount: activeReceiptOrder.items.reduce((s, i) => s + i.quantity, 0),
    };
    if (activeReceiptOrder.paymentMethod === "paymongo_simulated") {
      setPendingPaymongoOrder(orderInfo);
    } else {
      setPendingGcashOrder(orderInfo);
    }
  };

  const handleSwitchActiveReceiptToCod = async () => {
    if (!activeReceiptOrder || !authUser) return;
    setIsSubmitting(true);
    try {
      const idToken = await authUser.getIdToken();
      const res = await switchOrderPaymentToCod(
        activeReceiptOrder.firestoreOrderId || activeReceiptOrder.id,
        idToken
      );
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
    } catch (err: unknown) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to switch payment method.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    router,
    authUser,
    shouldCorruptImages,
    cart,
    totalItemCount,
    activeReceiptOrder,
    setActiveReceiptOrder,
    setIsCartOpen,
    shippingMethod,
    setShippingMethod,
    includeCrateProtection,
    setIncludeCrateProtection,
    hasBuildForCrateProtection,
    paymentMethod,
    handleSelectPaymentMethod,
    enabledPaymentMethods,
    isSubmitting,
    checkoutError,
    pendingGcashOrder,
    setPendingGcashOrder,
    pendingPaymongoOrder,
    setPendingPaymongoOrder,
    voucherInput,
    setVoucherInput,
    appliedVoucher,
    setAppliedVoucher,
    handleApplyVoucher,
    address,
    setAddress,
    savedAddresses,
    selectedAddressId,
    saveAddressToBook,
    setSaveAddressToBook,
    handleSelectSavedAddress,
    handleSelectCustomAddress,
    handleCancelCustomAddress,
    pricing,
    handleConfirmOrder,
    resolveModalOrderOutcome,
    handleRetryActiveReceiptPayment,
    handleSwitchActiveReceiptToCod,
  };
}

