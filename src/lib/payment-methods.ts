import type {
  PaymentMethod,
  PaymentStatus,
  ShippingMethod,
} from '@/lib/types';

export interface PaymentMethodDefinition {
  id: PaymentMethod;
  label: string;
  shortLabel: string;
  badgeText: string;
  description: string;
  instructions: string;
  requiresSimulationStep: boolean;
  isSimulated: boolean;
  enabled: boolean;
  initialPaymentStatus: PaymentStatus;
}

/**
 * Extensible Payment Method Registry
 * Supports Cash on Delivery (COD), GCash, and PayMongo.
 */
export const PAYMENT_METHOD_REGISTRY: Record<PaymentMethod, PaymentMethodDefinition> = {
  cod: {
    id: 'cod',
    label: 'Cash on Delivery',
    shortLabel: 'Cash on Delivery',
    badgeText: 'Pay upon delivery',
    description:
      'Place your order now and pay in cash when your hardware arrives or during in-store pickup.',
    instructions:
      'Please prepare the exact amount upon delivery or pickup. Our courier or store staff will verify your order reference before handover.',
    requiresSimulationStep: false,
    isSimulated: false,
    enabled: true,
    initialPaymentStatus: 'unpaid',
  },
  gcash_simulated: {
    id: 'gcash_simulated',
    label: 'GCash (E-Wallet)',
    shortLabel: 'GCash',
    badgeText: 'Instant Payment',
    description:
      'Fast and secure e-wallet checkout via GCash QR and mobile payment.',
    instructions:
      'After placing your order, complete payment via GCash.',
    requiresSimulationStep: true,
    isSimulated: true,
    enabled: true,
    initialPaymentStatus: 'pending',
  },
  paymongo_simulated: {
    id: 'paymongo_simulated',
    label: 'PayMongo (Card, Maya, QRPh)',
    shortLabel: 'PayMongo',
    badgeText: 'Online Payment',
    description:
      'PayMongo Checkout Session supporting credit/debit cards, Maya, QRPh, GrabPay, and e-wallets.',
    instructions:
      'After placing your order, proceed to PayMongo to complete payment.',
    requiresSimulationStep: true,
    isSimulated: true,
    enabled: true,
    initialPaymentStatus: 'pending',
  },
  card_simulated: {
    id: 'card_simulated',
    label: 'Credit / Debit Card (Direct Slot — Use PayMongo Above)',
    shortLabel: 'Card',
    badgeText: 'Coming Soon',
    description:
      'Direct card slot reserved. Use PayMongo above for Credit/Debit Card, Maya, and QRPh payments.',
    instructions: 'Direct card checkout is disabled; please select PayMongo.',
    requiresSimulationStep: true,
    isSimulated: true,
    enabled: false,
    initialPaymentStatus: 'pending',
  },
};

export const PAYMENT_METHODS_LIST: PaymentMethodDefinition[] = Object.values(
  PAYMENT_METHOD_REGISTRY
);

export function isSimulatedPaymentMethod(method?: PaymentMethod): boolean {
  return (
    method === 'gcash_simulated' ||
    method === 'paymongo_simulated' ||
    method === 'card_simulated'
  );
}

export interface ShippingMethodDefinition {
  id: ShippingMethod;
  label: string;
  description: string;
  eta: string;
  fee: number;
}

export const SHIPPING_METHODS_CONFIG: Record<ShippingMethod, ShippingMethodDefinition> = {
  standard_courier: {
    id: 'standard_courier',
    label: 'Standard Insured Courier (LBC / J&T)',
    description: 'Nationwide door-to-door delivery with shock-resistant packaging.',
    eta: '3–5 Business Days',
    fee: 250,
  },
  sameday_express: {
    id: 'sameday_express',
    label: 'Metro Manila Same-Day Express',
    description: 'Dedicated armored courier for Metro Manila & nearby provinces.',
    eta: 'Same Day (Before 8 PM)',
    fee: 550,
  },
  store_pickup: {
    id: 'store_pickup',
    label: 'BuildbotAI Flagship Hub Pickup',
    description: 'Direct customer collection at the Quezon City distribution hub.',
    eta: 'Ready in 2–4 Hours',
    fee: 0,
  },
};

export const CRATE_PROTECTION_FEE = 350;
export const VAT_RATE = 0.12;

export interface VoucherDefinition {
  code: string;
  discountAmount: number;
  minSubtotal: number;
  label: string;
  description?: string;
}

export const SUPPORTED_VOUCHERS: Record<string, VoucherDefinition> = {
  BUILDBOT1000: {
    code: 'BUILDBOT1000',
    discountAmount: 1000,
    minSubtotal: 20000,
    label: '₱1,000 off orders over ₱20,000',
    description: '₱1,000 off orders over ₱20,000',
  },
  STUDENT500: {
    code: 'STUDENT500',
    discountAmount: 500,
    minSubtotal: 10000,
    label: '₱500 off orders over ₱10,000',
    description: '₱500 off orders over ₱10,000',
  },
  FREESHIP: {
    code: 'FREESHIP',
    discountAmount: 250,
    minSubtotal: 15000,
    label: '₱250 off shipping on orders over ₱15,000',
    description: '₱250 off shipping on orders over ₱15,000',
  },
};

export interface AuthoritativeOrderTotalsInput {
  items: Array<{
    price: number;
    quantity?: number;
    kind?: 'custom-build' | 'prebuilt' | 'part';
    buildType?: 'custom-build' | 'prebuilt' | 'part' | 'additional';
  }>;
  shippingMethod?: ShippingMethod;
  includeCrateProtection?: boolean;
  voucherCode?: string | null;
}

export function cartSupportsCrateProtection(
  items: AuthoritativeOrderTotalsInput['items']
): boolean {
  return items.some(
    (item) =>
      item.kind === 'custom-build' ||
      item.kind === 'prebuilt' ||
      item.buildType === 'custom-build' ||
      item.buildType === 'prebuilt'
  );
}

export interface AuthoritativeOrderTotals {
  subtotal: number;
  shippingFee: number;
  protectionFee: number;
  discountAmount: number;
  appliedVoucherCode: string | null;
  vatIncludedAmount: number;
  totalPrice: number;
}

/**
 * Pure, single-source-of-truth calculation of order pricing.
 */
export function calculateAuthoritativeOrderTotals(
  input: AuthoritativeOrderTotalsInput
): AuthoritativeOrderTotals {
  const subtotal = input.items.reduce((sum, item) => {
    const qty = Math.max(1, Math.floor(Number(item.quantity ?? 1)));
    const price = Math.max(0, Number(item.price ?? 0));
    return sum + price * qty;
  }, 0);

  const selectedShipping =
    input.shippingMethod && input.shippingMethod in SHIPPING_METHODS_CONFIG
      ? SHIPPING_METHODS_CONFIG[input.shippingMethod]
      : SHIPPING_METHODS_CONFIG.store_pickup;

  const shippingFee = selectedShipping.fee;
  const protectionFee =
    input.includeCrateProtection && cartSupportsCrateProtection(input.items)
      ? CRATE_PROTECTION_FEE
      : 0;

  let discountAmount = 0;
  let appliedVoucherCode: string | null = null;

  if (input.voucherCode) {
    const normalized = input.voucherCode.trim().toUpperCase();
    const voucher = SUPPORTED_VOUCHERS[normalized];
    if (voucher && subtotal >= voucher.minSubtotal) {
      discountAmount = Math.min(subtotal, voucher.discountAmount);
      appliedVoucherCode = voucher.code;
    }
  }

  const totalPrice = Math.max(0, subtotal + shippingFee + protectionFee - discountAmount);
  const vatIncludedAmount = Math.round((subtotal - discountAmount) * (VAT_RATE / (1 + VAT_RATE)));

  return {
    subtotal,
    shippingFee,
    protectionFee,
    discountAmount,
    appliedVoucherCode,
    vatIncludedAmount: Math.max(0, vatIncludedAmount),
    totalPrice,
  };
}

/**
 * Generates a unique, human-readable order number (e.g. "BB-20261101-7F3A").
 */
export function generateOrderNumber(now: Date = new Date()): string {
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BB-${yyyy}${mm}${dd}-${randomSuffix}`;
}

/**
 * Generates a clearly-labeled payment reference ID.
 */
export function generateSimulatedPaymentReference(
  method: PaymentMethod,
  now: Date = new Date()
): string {
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate()
  ).padStart(2, '0')}`;
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();

  switch (method) {
    case 'gcash_simulated':
      return `GCASH-${datePart}-${randomPart}`;
    case 'paymongo_simulated':
      return `PM-${datePart}-${randomPart}`;
    case 'card_simulated':
      return `CARD-${datePart}-${randomPart}`;
    case 'cod':
    default:
      return `COD-REF-${datePart}-${randomPart}`;
  }
}

export interface PaymentStatusBadgeInfo {
  status: PaymentStatus;
  label: string;
  shortLabel: string;
  color: string;
  description: string;
  badgeClassName: string;
  canRetrySimulatedPayment: boolean;
}

/**
 * Resolves display metadata and badge styles for an order's paymentStatus,
 * gracefully handling legacy orders that predate the payment system.
 */
export function getPaymentStatusInfo(
  paymentStatus?: PaymentStatus,
  paymentMethod?: PaymentMethod
): PaymentStatusBadgeInfo {
  const resolvedMethod: PaymentMethod = paymentMethod ?? 'cod';
  const resolvedStatus: PaymentStatus = paymentStatus ?? 'unpaid';
  const canRetry =
    resolvedMethod === 'gcash_simulated' || resolvedMethod === 'paymongo_simulated';

  switch (resolvedStatus) {
    case 'paid':
      return {
        status: 'paid',
        label: resolvedMethod === 'cod' ? 'Cash Collected (COD)' : resolvedMethod === 'gcash_simulated' ? 'Paid (GCash)'
          : resolvedMethod === 'paymongo_simulated' ? 'Paid (PayMongo)' : 'Paid',
        shortLabel: resolvedMethod === 'cod' ? 'Collected (COD)' : 'Paid',
        color: 'teal',
        description:
          resolvedMethod === 'gcash_simulated'
            ? 'GCash payment verified.'
            : resolvedMethod === 'paymongo_simulated'
              ? 'PayMongo payment verified.'
              : 'Payment has been received and confirmed.',
        badgeClassName: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
        canRetrySimulatedPayment: false,
      };
    case 'pending':
      return {
        status: 'pending',
        label: 'Payment Pending',
        shortLabel: 'Pay Pending',
        color: 'yellow',
        description:
          resolvedMethod === 'gcash_simulated'
            ? 'Awaiting completion in the GCash checkout.'
            : resolvedMethod === 'paymongo_simulated'
              ? 'Awaiting completion in the PayMongo checkout.'
              : 'Awaiting payment confirmation.',
        badgeClassName: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
        canRetrySimulatedPayment: canRetry,
      };
    case 'failed':
      return {
        status: 'failed',
        label: 'Payment Failed',
        shortLabel: 'Pay Failed',
        color: 'red',
        description:
          'Payment attempt failed. You can retry payment or switch to Cash on Delivery.',
        badgeClassName: 'bg-red-500/15 text-red-500 border-red-500/30',
        canRetrySimulatedPayment: canRetry,
      };
    case 'cancelled':
      return {
        status: 'cancelled',
        label: 'Payment Cancelled',
        shortLabel: 'Pay Cancelled',
        color: 'gray',
        description: 'Payment was cancelled.',
        badgeClassName: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
        canRetrySimulatedPayment: canRetry,
      };
    case 'unpaid':
    default:
      return {
        status: 'unpaid',
        label: resolvedMethod === 'cod' ? 'Cash Not Collected (COD)' : 'Unpaid',
        shortLabel: resolvedMethod === 'cod' ? 'Uncollected (COD)' : 'Unpaid',
        color: 'cyan',
        description:
          resolvedMethod === 'cod'
            ? 'Cash payment will be collected upon delivery or store pickup.'
            : 'Payment has not yet been completed.',
        badgeClassName: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
        canRetrySimulatedPayment: canRetry,
      };
  }
}

export function getPaymentMethodLabel(
  paymentMethod?: PaymentMethod,
  short: boolean = true
): string {
  if (!paymentMethod) {
    return short ? 'Cash on Delivery' : 'Cash on Delivery / Store Reservation';
  }
  const entry = PAYMENT_METHOD_REGISTRY[paymentMethod];
  if (!entry) return paymentMethod;
  return short ? entry.shortLabel : entry.label;
}
