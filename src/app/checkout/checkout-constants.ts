import type {
  EcommerceCartItem,
  ShippingAddress,
  ShippingMethodId,
} from "@/context/ecommerce-context";
import type { PaymentMethod, PaymentStatus } from "@/lib/types";

export const NETCODEX_STORE_LOCATION = {
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

export interface CheckoutShippingMethodOption {
  id: ShippingMethodId;
  title: string;
  courier: string;
  eta: string;
  fee: number;
}

export const SHIPPING_METHODS: CheckoutShippingMethodOption[] = [
  {
    id: "standard_courier",
    title: "Standard Nationwide Insured Courier",
    courier: "LBC Express / J&T",
    eta: "3–5 Business Days",
    fee: 250,
  },
  {
    id: "sameday_express",
    title: "Same-Day Metro Manila Express",
    courier: "Grab / Lalamove / Transportify",
    eta: "Same Day (Before 8 PM)",
    fee: 550,
  },
  {
    id: "store_pickup",
    title: "In-Store Branch Pickup",
    courier: "Cubao, QC (35G Liberty Ave)",
    eta: "Ready in 2–4 Hours",
    fee: 0,
  },
];

export const PH_REGIONS = [
  "Metro Manila (NCR)",
  "CALABARZON (Region IV-A)",
  "Central Luzon (Region III)",
  "Ilocos Region (Region I)",
  "Central Visayas (Cebu / Region VII)",
  "Western Visayas (Region VI)",
  "Davao Region (Region XI)",
  "Northern Mindanao (Region X)",
];

export interface PendingReceiptSnapshot {
  items: EcommerceCartItem[];
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
}

export function mapPaymentStatusLabel(
  status: PaymentStatus,
  method: PaymentMethod
):
  | "Paid (GCash)"
  | "Paid (PayMongo)"
  | "Payment Pending"
  | "Payment Failed"
  | "Payment Cancelled"
  | "Unpaid (Pay on Delivery)" {
  if (status === "paid") {
    return method === "paymongo_simulated"
      ? "Paid (PayMongo)"
      : "Paid (GCash)";
  }
  if (status === "pending") return "Payment Pending";
  if (status === "failed") return "Payment Failed";
  if (status === "cancelled") return "Payment Cancelled";
  return method === "cod" ? "Unpaid (Pay on Delivery)" : "Payment Pending";
}
