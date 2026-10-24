"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { inventoryItemPath, inventoryItemsPath } from "@/lib/inventory-paths";
import { useToast } from "@/hooks/use-toast";

export type EcommerceItemKind = "custom-build" | "prebuilt" | "part";

const CATEGORY_PLACEHOLDER_MAP: Record<string, string> = {
  cpu: "/placeholders/components/cpu.jpg",
  gpu: "/placeholders/components/gpu.jpg",
  motherboard: "/placeholders/components/motherboard.jpg",
  ram: "/placeholders/components/ram.jpg",
  storage: "/placeholders/components/storage.jpg",
  psu: "/placeholders/components/psu.jpg",
  case: "/placeholders/components/case.jpg",
  cooler: "/placeholders/components/cooler.jpg",
};

export function getEcommerceFallbackImage(
  category?: string,
  kind?: EcommerceItemKind
): string {
  if (category) {
    const cleanCat = category.replace(/\s*#\d+$/, "").trim().toLowerCase();
    if (CATEGORY_PLACEHOLDER_MAP[cleanCat]) {
      return CATEGORY_PLACEHOLDER_MAP[cleanCat];
    }
  }
  if (kind === "custom-build" || kind === "prebuilt") {
    return "/hero-pc.png";
  }
  return "/placeholders/components/cpu.jpg";
}

export function isInvalidPlaceholderUrl(url?: string): boolean {
  if (!url) return true;
  return (
    url === "/placeholder-part.png" ||
    url === "/placeholder-system.png" ||
    url.trim() === ""
  );
}

export interface EcommerceSubComponent {
  category: string;
  name: string;
  price: number;
  imageUrl?: string;
}

export interface EcommerceCartItem {
  id: string;
  kind: EcommerceItemKind;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  category?: string;
  brand?: string;
  sku?: string;
  tier?: string;
  components?: EcommerceSubComponent[];
  includeAssembly?: boolean;
}

export type ShippingMethodId = "standard_courier" | "sameday_express" | "store_pickup";
export type PaymentMethodId = "gcash" | "maya" | "qrph" | "card" | "bank_transfer" | "cod";
export type FulfillmentStage =
  | "order_placed"
  | "payment_verified"
  | "assembling_testing"
  | "out_for_delivery"
  | "delivered";

export interface ShippingAddress {
  fullName: string;
  phone: string;
  email: string;
  region: string;
  city: string;
  barangay: string;
  streetAddress: string;
  postalCode: string;
  notes?: string;
}

export interface MockEcommerceOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  items: EcommerceCartItem[];
  shippingMethod: ShippingMethodId;
  courierName: string;
  trackingNumber: string;
  estimatedDelivery: string;
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethodId;
  paymentLabel: string;
  paymentReference: string;
  paymentStatus: "Paid (Verified)" | "Pending COD" | "Awaiting Bank Transfer";
  installmentPlan?: string;
  fulfillmentStage: FulfillmentStage;
  includeCrateProtection: boolean;
  voucherCode?: string;
  subtotal: number;
  shippingFee: number;
  protectionFee: number;
  discountAmount: number;
  vatAmount: number;
  total: number;
}

interface EcommerceContextType {
  cart: EcommerceCartItem[];
  cartCount: number;
  subtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  activeReceiptOrder: MockEcommerceOrder | null;
  setActiveReceiptOrder: (order: MockEcommerceOrder | null) => void;
  orders: MockEcommerceOrder[];
  addToCart: (item: Omit<EcommerceCartItem, "quantity"> & { quantity?: number }, openDrawer?: boolean) => void;
  buyNow: (item: Omit<EcommerceCartItem, "quantity"> & { quantity?: number }) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  toggleAssemblyOption: (id: string) => void;
  clearCart: () => void;
  placeMockOrder: (payload: Omit<MockEcommerceOrder, "id" | "orderNumber" | "createdAt" | "trackingNumber" | "paymentReference">) => MockEcommerceOrder;
  advanceOrderStage: (orderId: string) => void;
  resetDemoOrders: () => void;
}

const CART_STORAGE_KEY = "buildbot_ecommerce_cart_v1";
const ORDERS_STORAGE_KEY = "buildbot_ecommerce_orders_v2";

const DEFAULT_DEMO_ORDERS: MockEcommerceOrder[] = [
  {
    id: "demo-order-1",
    orderNumber: "NCX-EC-904821",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    items: [
      {
        id: "demo-rig-apex",
        kind: "custom-build",
        name: "Custom Netcodex Rig — RTX 4070 Super / Ryzen 7 7800X3D",
        price: 94500,
        quantity: 1,
        tier: "High-End",
        imageUrl: "/hero-pc.png",
        includeAssembly: true,
        components: [
          { category: "CPU", name: "AMD Ryzen 7 7800X3D", price: 24950, imageUrl: "/placeholders/components/cpu.jpg" },
          { category: "GPU", name: "NVIDIA GeForce RTX 4070 Super 12GB", price: 38500, imageUrl: "/placeholders/components/gpu.jpg" },
          { category: "Motherboard", name: "MSI MAG B650 Tomahawk WiFi", price: 11800, imageUrl: "/placeholders/components/motherboard.jpg" },
          { category: "RAM", name: "G.Skill Trident Z5 Neo 32GB DDR5-6000", price: 7450, imageUrl: "/placeholders/components/ram.jpg" },
          { category: "Storage", name: "Samsung 990 PRO 1TB NVMe Gen4", price: 5400, imageUrl: "/placeholders/components/storage.jpg" },
          { category: "PSU", name: "Corsair RM750e 750W 80+ Gold ATX 3.0", price: 6400, imageUrl: "/placeholders/components/psu.jpg" },
        ],
      },
    ],
    shippingMethod: "store_pickup",
    courierName: "Netcodex Computer Center — Cubao, Quezon City",
    trackingNumber: "PICKUP-NCX-8841209",
    estimatedDelivery: "Mon–Sun, 10:00 AM – 7:00 PM",
    shippingAddress: {
      fullName: "Alex Rivera",
      phone: "+63 917 555 0194",
      email: "alex.rivera@netcodex.ph",
      region: "Metro Manila (NCR)",
      city: "Quezon City",
      barangay: "Socorro, Cubao",
      streetAddress: "35G Liberty Avenue, corner 9th Ave",
      postalCode: "1109",
      notes: "In-Store Pickup at Netcodex Computer Center (Monday – Sunday, 10:00 AM – 7:00 PM)",
    },
    paymentMethod: "gcash",
    paymentLabel: "GCash via QRPh Instant Pay",
    paymentReference: "GCASH-7749201842",
    paymentStatus: "Paid (Verified)",
    fulfillmentStage: "assembling_testing",
    includeCrateProtection: false,
    voucherCode: "NETCODEX500",
    subtotal: 94500,
    shippingFee: 0,
    protectionFee: 0,
    discountAmount: 500,
    vatAmount: 10071.43,
    total: 94000,
  },
];

const STAGE_ORDER: FulfillmentStage[] = [
  "order_placed",
  "payment_verified",
  "assembling_testing",
  "out_for_delivery",
  "delivered",
];

const EcommerceContext = createContext<EcommerceContextType | undefined>(undefined);

export function EcommerceProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();
  const [cart, setCart] = useState<EcommerceCartItem[]>([]);
  const [orders, setOrders] = useState<MockEcommerceOrder[]>(DEFAULT_DEMO_ORDERS);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpenState] = useState(false);
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<MockEcommerceOrder | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const backfillingRef = useRef(false);

  const setIsCheckoutOpen = useCallback(
    (open: boolean) => {
      setIsCheckoutOpenState(open);
      if (open) {
        setIsCartOpen(false);
        router.push("/checkout");
      }
    },
    [router]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedCart = window.localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) setCart(parsed);
      }
      const savedOrders = window.localStorage.getItem(ORDERS_STORAGE_KEY);
      if (savedOrders) {
        const parsedOrders = JSON.parse(savedOrders);
        if (Array.isArray(parsedOrders) && parsedOrders.length > 0) {
          setOrders(parsedOrders);
        }
      }
    } catch (error) {
      console.warn("Could not load e-commerce state from localStorage:", error);
    } finally {
      setHydrated(true);
    }
  }, []);

  // Automatically backfill missing or broken placeholder imageUrls for cart items & their sub-components from Firestore
  useEffect(() => {
    if (!hydrated || !firestore || cart.length === 0 || backfillingRef.current) return;

    const needsBackfill = cart.some(
      (item) =>
        isInvalidPlaceholderUrl(item.imageUrl) ||
        item.components?.some(
          (sub) =>
            isInvalidPlaceholderUrl(sub.imageUrl) ||
            sub.imageUrl?.startsWith("/placeholders/components/")
        )
    );

    if (!needsBackfill) return;

    let cancelled = false;
    backfillingRef.current = true;

    const resolvePartImageFromFirestore = async (
      categoryLabel: string,
      partName: string
    ): Promise<string | undefined> => {
      const cleanCat = categoryLabel.replace(/\s*#\d+$/, "").trim();
      const collectionMap: Record<string, string> = {
        cpu: "CPU",
        gpu: "GPU",
        motherboard: "Motherboard",
        ram: "RAM",
        storage: "Storage",
        psu: "PSU",
        case: "Case",
        cooler: "Cooler",
      };
      const collectionName = collectionMap[cleanCat.toLowerCase()] || cleanCat;

      try {
        // 1. Canonical query by name in inventory/{category}/items
        const canonicalQ = query(
          collection(firestore, inventoryItemsPath(collectionName)),
          where("name", "==", partName)
        );
        const canonicalSnap = await getDocs(canonicalQ);
        if (!canonicalSnap.empty) {
          const data = canonicalSnap.docs[0].data();
          const img = data.imageUrl || data.images?.[0];
          if (img) return img;
        }

        // 2. Canonical direct doc lookup if partName happens to be a doc ID
        if (!partName.includes("/")) {
          const canonicalDoc = await getDoc(
            doc(firestore, inventoryItemPath(collectionName, partName))
          );
          if (canonicalDoc.exists()) {
            const data = canonicalDoc.data();
            const img = data.imageUrl || data.images?.[0];
            if (img) return img;
          }
        }

        // 3. Legacy root collection query by name
        const legacyQ = query(
          collection(firestore, collectionName),
          where("name", "==", partName)
        );
        const legacySnap = await getDocs(legacyQ);
        if (!legacySnap.empty) {
          const data = legacySnap.docs[0].data();
          const img = data.imageUrl || data.images?.[0];
          if (img) return img;
        }
      } catch {
        // Ignore lookup error and use fallback
      }
      return undefined;
    };

    const runBackfill = async () => {
      try {
        let changed = false;
        const updatedCart = await Promise.all(
          cart.map(async (item) => {
            let nextItemImage = item.imageUrl;
            if (isInvalidPlaceholderUrl(nextItemImage)) {
              if (item.kind === "part" && item.category) {
                const found = await resolvePartImageFromFirestore(item.category, item.name);
                nextItemImage = found || getEcommerceFallbackImage(item.category, item.kind);
              } else {
                nextItemImage = getEcommerceFallbackImage(item.category, item.kind);
              }
              changed = true;
            }

            if (!item.components || item.components.length === 0) {
              return nextItemImage !== item.imageUrl
                ? { ...item, imageUrl: nextItemImage }
                : item;
            }

            const updatedComponents = await Promise.all(
              item.components.map(async (sub) => {
                if (
                  !isInvalidPlaceholderUrl(sub.imageUrl) &&
                  !sub.imageUrl?.startsWith("/placeholders/components/")
                ) {
                  return sub;
                }
                const foundImg = await resolvePartImageFromFirestore(sub.category, sub.name);
                const resolvedSubImg =
                  foundImg || getEcommerceFallbackImage(sub.category, "part");
                if (resolvedSubImg !== sub.imageUrl) {
                  changed = true;
                  return { ...sub, imageUrl: resolvedSubImg };
                }
                return sub;
              })
            );

            return {
              ...item,
              imageUrl: nextItemImage,
              components: updatedComponents,
            };
          })
        );

        if (!cancelled && changed) {
          setCart(updatedCart);
        }
      } finally {
        backfillingRef.current = false;
      }
    };

    runBackfill();

    return () => {
      cancelled = true;
    };
  }, [cart, firestore, hydrated]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      console.warn("Failed to persist cart:", error);
    }
  }, [cart, hydrated]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    } catch (error) {
      console.warn("Failed to persist orders:", error);
    }
  }, [orders, hydrated]);

  const addToCart = useCallback(
    (item: Omit<EcommerceCartItem, "quantity"> & { quantity?: number }, openDrawer = true) => {
      const qtyToAdd = Math.max(1, item.quantity || 1);
      const normalizedItemImage = isInvalidPlaceholderUrl(item.imageUrl)
        ? getEcommerceFallbackImage(item.category, item.kind)
        : item.imageUrl;
      const normalizedComponents = item.components?.map((sub) => ({
        ...sub,
        imageUrl: isInvalidPlaceholderUrl(sub.imageUrl)
          ? getEcommerceFallbackImage(sub.category, "part")
          : sub.imageUrl,
      }));

      setCart((prev) => {
        const existingIndex = prev.findIndex((i) => i.id === item.id && i.kind === item.kind);
        if (existingIndex > -1 && item.kind !== "custom-build") {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + qtyToAdd,
            imageUrl: normalizedItemImage || updated[existingIndex].imageUrl,
            components: normalizedComponents?.length
              ? normalizedComponents
              : updated[existingIndex].components,
          };
          return updated;
        }
        return [
          {
            ...item,
            imageUrl: normalizedItemImage,
            components: normalizedComponents,
            quantity: qtyToAdd,
            includeAssembly: item.kind === "custom-build" ? true : item.includeAssembly,
          },
          ...prev,
        ];
      });

      toast({
        title: "Added to Cart",
        description: `${item.name} (${qtyToAdd}x) has been added to your Netcodex cart.`,
      });

      if (openDrawer) {
        setIsCartOpen(true);
      }
    },
    [toast]
  );

  const buyNow = useCallback(
    (item: Omit<EcommerceCartItem, "quantity"> & { quantity?: number }) => {
      addToCart(item, false);
      setIsCartOpen(false);
      setActiveReceiptOrder(null);
      router.push("/checkout");
    },
    [addToCart, router]
  );

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.id !== id));
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: Math.min(99, quantity) } : item))
    );
  }, []);

  const toggleAssemblyOption = useCallback((id: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, includeAssembly: !item.includeAssembly } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const placeMockOrder = useCallback(
    (
      payload: Omit<
        MockEcommerceOrder,
        "id" | "orderNumber" | "createdAt" | "trackingNumber" | "paymentReference"
      >
    ): MockEcommerceOrder => {
      const randomSix = Math.floor(100000 + Math.random() * 900000);
      const courierPrefix =
        payload.shippingMethod === "sameday_express"
          ? "LLM-PH"
          : payload.shippingMethod === "store_pickup"
            ? "PICKUP-NCX"
            : "LBC-PH";
      const payPrefix = payload.paymentMethod.toUpperCase().replace("_", "");

      const newOrder: MockEcommerceOrder = {
        ...payload,
        id: `ec-order-${Date.now()}`,
        orderNumber: `NCX-EC-${randomSix}`,
        createdAt: new Date().toISOString(),
        trackingNumber: `${courierPrefix}-${Math.floor(1000000 + Math.random() * 9000000)}`,
        paymentReference: `${payPrefix}-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      };

      setOrders((prev) => [newOrder, ...prev]);
      setCart([]);
      setActiveReceiptOrder(newOrder);

      toast({
        title: `Order ${newOrder.orderNumber} Confirmed!`,
        description: `Simulated Netcodex checkout complete via ${newOrder.paymentLabel}.`,
      });

      return newOrder;
    },
    [toast]
  );

  const advanceOrderStage = useCallback(
    (orderId: string) => {
      setOrders((prev) =>
        prev.map((order) => {
          if (order.id !== orderId) return order;
          const idx = STAGE_ORDER.indexOf(order.fulfillmentStage);
          const nextStage = STAGE_ORDER[(idx + 1) % STAGE_ORDER.length];
          return {
            ...order,
            fulfillmentStage: nextStage,
            paymentStatus:
              nextStage === "delivered" ? "Paid (Verified)" : order.paymentStatus,
          };
        })
      );
    },
    []
  );

  const resetDemoOrders = useCallback(() => {
    setOrders(DEFAULT_DEMO_ORDERS);
    toast({
      title: "Demo Orders Reset",
      description: "Restored sample Netcodex E-Commerce shipment order.",
    });
  }, [toast]);

  const cartCount = useMemo(
    () => cart.reduce((acc, item) => acc + item.quantity, 0),
    [cart]
  );

  const subtotal = useMemo(
    () => cart.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [cart]
  );

  const value = useMemo(
    () => ({
      cart,
      cartCount,
      subtotal,
      isCartOpen,
      setIsCartOpen,
      isCheckoutOpen,
      setIsCheckoutOpen,
      activeReceiptOrder,
      setActiveReceiptOrder,
      orders,
      addToCart,
      buyNow,
      removeFromCart,
      updateQuantity,
      toggleAssemblyOption,
      clearCart,
      placeMockOrder,
      advanceOrderStage,
      resetDemoOrders,
    }),
    [
      cart,
      cartCount,
      subtotal,
      isCartOpen,
      isCheckoutOpen,
      setIsCheckoutOpen,
      activeReceiptOrder,
      orders,
      addToCart,
      buyNow,
      removeFromCart,
      updateQuantity,
      toggleAssemblyOption,
      clearCart,
      placeMockOrder,
      advanceOrderStage,
      resetDemoOrders,
    ]
  );

  return <EcommerceContext.Provider value={value}>{children}</EcommerceContext.Provider>;
}

export function useEcommerce() {
  const ctx = useContext(EcommerceContext);
  if (!ctx) {
    throw new Error("useEcommerce must be used within an EcommerceProvider");
  }
  return ctx;
}
