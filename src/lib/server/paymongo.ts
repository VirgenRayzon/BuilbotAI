import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import type { OrderItem, OrderShippingAddress } from '@/lib/types';

export const PAYMONGO_API_BASE_URL = 'https://api.paymongo.com/v1';

export type PaymongoPaymentMethodType =
  | 'card'
  | 'gcash'
  | 'paymaya'
  | 'qrph'
  | 'grab_pay'
  | 'dob'
  | 'dob_ubp'
  | 'billease';

export const DEFAULT_PAYMONGO_PAYMENT_METHODS: PaymongoPaymentMethodType[] = [
  'card',
  'gcash',
  'paymaya',
  'qrph',
  'grab_pay',
];

export interface CreatePaymongoCheckoutSessionInput {
  orderId: string;
  orderNumber: string;
  paymentReference: string;
  totalPricePhp: number;
  subtotalPhp?: number;
  shippingFeePhp?: number;
  protectionFeePhp?: number;
  discountAmountPhp?: number;
  voucherCode?: string | null;
  items: OrderItem[];
  customerEmail: string;
  shippingAddress?: OrderShippingAddress;
  baseUrl?: string;
}

export interface PaymongoLineItemPayload {
  name: string;
  amount: number; // in centavos (1 PHP = 100 centavos)
  currency: 'PHP';
  quantity: number;
  description?: string;
}

export interface PaymongoCheckoutSessionRequestPayload {
  data: {
    attributes: {
      billing?: {
        name: string;
        email: string;
        phone?: string;
        address?: {
          line1: string;
          line2?: string;
          city: string;
          state: string;
          postal_code: string;
          country: 'PH';
        };
      };
      send_email_receipt: boolean;
      show_description: boolean;
      show_line_items: boolean;
      description: string;
      line_items: PaymongoLineItemPayload[];
      payment_method_types: PaymongoPaymentMethodType[];
      reference_number: string;
      success_url: string;
      cancel_url: string;
      metadata: Record<string, string>;
    };
  };
}

export interface PaymongoCheckoutSessionResult {
  mode: 'live_test_api' | 'local_sandbox_fallback';
  checkoutSessionId: string;
  checkoutUrl: string | null;
  referenceNumber: string;
}

export interface PaymongoSessionVerificationResult {
  sessionId: string;
  status: 'paid' | 'pending' | 'failed' | 'expired';
  paymentId: string | null;
  paymentChannel: string | null;
  lastPaymentError: string | null;
}

export function getPaymongoSecretKey(): string | null {
  const raw = process.env.PAYMONGO_SECRET_KEY?.trim();
  if (!raw) return null;
  return raw;
}

export function isPaymongoTestApiConfigured(): boolean {
  return Boolean(getPaymongoSecretKey());
}

const paymongoRefundResponse = z.object({
  data: z.object({
    id: z.string().min(1),
    attributes: z.object({
      status: z.enum(['pending', 'processing', 'succeeded', 'failed']),
      amount: z.number().int().positive(), payment_id: z.string().min(1), currency: z.literal('PHP'), notes: z.string().nullish(),
    }),
  }),
});

export interface PaymongoRefund {
  id: string; status: 'pending' | 'processing' | 'succeeded' | 'failed';
  amount: number; paymentId: string; currency: 'PHP'; notes?: string | null;
}

export async function createPaymongoRefund(input: {
  paymentId: string;
  amountPhp: number;
  reason: string;
  operationId?: string;
}): Promise<PaymongoRefund> {
  const secretKey = getPaymongoSecretKey();
  if (!secretKey) throw new Error('PayMongo is not configured for provider refunds.');
  const response = await fetch(`${PAYMONGO_API_BASE_URL}/refunds`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: buildBasicAuthHeader(secretKey),
    },
    body: JSON.stringify({
      data: { attributes: {
        amount: toPaymongoCentavos(input.amountPhp),
        payment_id: input.paymentId,
        reason: 'others',
        notes: `${input.operationId ? `${input.operationId}: ` : ''}${input.reason}`.slice(0, 255),
      } },
    }),
    cache: 'no-store',
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = z.object({ errors: z.array(z.object({ detail: z.string() })).optional() }).safeParse(body);
    throw new Error(detail.success ? detail.data.errors?.[0]?.detail || `PayMongo refund failed (${response.status}).` : `PayMongo refund failed (${response.status}).`);
  }
  const parsed = paymongoRefundResponse.safeParse(body);
  if (!parsed.success) throw new Error('PayMongo returned an unexpected refund response.');
  return { id: parsed.data.data.id, status: parsed.data.data.attributes.status,
    amount: parsed.data.data.attributes.amount, paymentId: parsed.data.data.attributes.payment_id, currency: parsed.data.data.attributes.currency, notes: parsed.data.data.attributes.notes };
}

export async function retrievePaymongoRefund(
  refundId: string
): Promise<PaymongoRefund> {
  const secretKey = getPaymongoSecretKey();
  if (!secretKey) throw new Error('PayMongo is not configured for provider refund reconciliation.');
  const response = await fetch(
    `${PAYMONGO_API_BASE_URL}/refunds/${encodeURIComponent(refundId)}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: buildBasicAuthHeader(secretKey),
      },
      cache: 'no-store',
    }
  );
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = z
      .object({ errors: z.array(z.object({ detail: z.string() })).optional() })
      .safeParse(body);
    throw new Error(
      detail.success
        ? detail.data.errors?.[0]?.detail || `PayMongo refund lookup failed (${response.status}).`
        : `PayMongo refund lookup failed (${response.status}).`
    );
  }
  const parsed = paymongoRefundResponse.safeParse(body);
  if (!parsed.success) throw new Error('PayMongo returned an unexpected refund lookup response.');
  return { id: parsed.data.data.id, status: parsed.data.data.attributes.status,
    amount: parsed.data.data.attributes.amount, paymentId: parsed.data.data.attributes.payment_id, currency: parsed.data.data.attributes.currency, notes: parsed.data.data.attributes.notes };
}

export function toPaymongoCentavos(phpAmount: number, enforceMinimum = false): number {
  const centavos = Math.max(0, Math.round((Number(phpAmount) || 0) * 100));
  return enforceMinimum ? Math.max(2000, centavos) : centavos;
}

export function buildPaymongoCheckoutPayload(
  input: CreatePaymongoCheckoutSessionInput
): PaymongoCheckoutSessionRequestPayload {
  const baseUrl = (
    input.baseUrl ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:9002'
  ).replace(/\/$/, '');

  const targetTotalCentavos = toPaymongoCentavos(input.totalPricePhp, true);
  const hasDiscount = (input.discountAmountPhp ?? 0) > 0;

  const candidateLineItems: PaymongoLineItemPayload[] = [];
  if (!hasDiscount) {
    for (const item of input.items) {
      const qty = Math.max(1, Math.floor(Number(item.quantity ?? 1)));
      const unitCentavos = toPaymongoCentavos(item.price, false);
      if (unitCentavos > 0) {
        candidateLineItems.push({
          name: item.name.slice(0, 120),
          amount: unitCentavos,
          currency: 'PHP',
          quantity: qty,
          description: item.category ? `Category: ${item.category}` : undefined,
        });
      }
    }

    if ((input.shippingFeePhp ?? 0) > 0) {
      candidateLineItems.push({
        name: 'Courier Shipping & Insurance',
        amount: toPaymongoCentavos(input.shippingFeePhp!, false),
        currency: 'PHP',
        quantity: 1,
      });
    }

    if ((input.protectionFeePhp ?? 0) > 0) {
      candidateLineItems.push({
        name: 'Instapak GPU Foam & Wooden Crate Protection',
        amount: toPaymongoCentavos(input.protectionFeePhp!, false),
        currency: 'PHP',
        quantity: 1,
      });
    }
  }

  const candidateSum = candidateLineItems.reduce(
    (sum, li) => sum + li.amount * li.quantity,
    0
  );

  const lineItems: PaymongoLineItemPayload[] =
    candidateLineItems.length > 0 && candidateSum === targetTotalCentavos
      ? candidateLineItems
      : [
          {
            name: `BuildbotAI Order ${input.orderNumber}`,
            amount: targetTotalCentavos,
            currency: 'PHP',
            quantity: 1,
            description: `${input.items.length} hardware item(s)${
              input.voucherCode ? ` • Voucher ${input.voucherCode} applied` : ''
            }`,
          },
        ];

  const encodedOrderId = encodeURIComponent(input.orderId);
  const successUrl = `${baseUrl}/checkout?paymongoOrderId=${encodedOrderId}&paymongoResult=success`;
  const cancelUrl = `${baseUrl}/checkout?paymongoOrderId=${encodedOrderId}&paymongoResult=cancelled`;

  return {
    data: {
      attributes: {
        billing: {
          name: input.shippingAddress?.fullName || 'BuildbotAI Customer',
          email: input.shippingAddress?.email || input.customerEmail,
          phone: input.shippingAddress?.phone,
          ...(input.shippingAddress
            ? {
                address: {
                  line1: input.shippingAddress.streetAddress,
                  line2: input.shippingAddress.barangay,
                  city: input.shippingAddress.city,
                  state: input.shippingAddress.region,
                  postal_code: input.shippingAddress.postalCode,
                  country: 'PH',
                },
              }
            : {}),
        },
        send_email_receipt: false,
        show_description: true,
        show_line_items: true,
        description: `BuildbotAI / Netcodex Hardware Order ${input.orderNumber} (Ref: ${input.paymentReference})`,
        line_items: lineItems,
        payment_method_types: DEFAULT_PAYMONGO_PAYMENT_METHODS,
        reference_number: input.paymentReference,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          orderId: input.orderId,
          orderNumber: input.orderNumber,
          paymentReference: input.paymentReference,
        },
      },
    },
  };
}

function buildBasicAuthHeader(secretKey: string): string {
  return `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`;
}

export async function createPaymongoCheckoutSession(
  input: CreatePaymongoCheckoutSessionInput
): Promise<PaymongoCheckoutSessionResult> {
  const secretKey = getPaymongoSecretKey();

  if (!secretKey) {
    const fallbackSessionId = `cs_sim_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .substring(2, 8)}`;
    return {
      mode: 'local_sandbox_fallback',
      checkoutSessionId: fallbackSessionId,
      checkoutUrl: null,
      referenceNumber: input.paymentReference,
    };
  }

  const payload = buildPaymongoCheckoutPayload(input);
  const response = await fetch(`${PAYMONGO_API_BASE_URL}/checkout_sessions`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: buildBasicAuthHeader(secretKey),
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  const json = (await response.json().catch(() => null)) as any;

  if (!response.ok || !json?.data?.id) {
    const apiErrorDetail =
      json?.errors?.[0]?.detail ||
      json?.errors?.[0]?.code ||
      `PayMongo API returned HTTP ${response.status}`;
    throw new Error(`PayMongo Checkout Session error: ${apiErrorDetail}`);
  }

  return {
    mode: 'live_test_api',
    checkoutSessionId: String(json.data.id),
    checkoutUrl: String(json.data.attributes?.checkout_url || ''),
    referenceNumber: input.paymentReference,
  };
}

export async function retrievePaymongoCheckoutSession(
  checkoutSessionId: string
): Promise<PaymongoSessionVerificationResult> {
  const secretKey = getPaymongoSecretKey();
  if (!secretKey) {
    throw new Error(
      'PAYMONGO_SECRET_KEY is not configured on the server to verify live checkout sessions.'
    );
  }

  const response = await fetch(
    `${PAYMONGO_API_BASE_URL}/checkout_sessions/${encodeURIComponent(checkoutSessionId)}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: buildBasicAuthHeader(secretKey),
      },
      cache: 'no-store',
    }
  );

  const json = (await response.json().catch(() => null)) as any;
  if (!response.ok || !json?.data) {
    const apiErrorDetail =
      json?.errors?.[0]?.detail ||
      `Unable to retrieve PayMongo session (${response.status})`;
    throw new Error(apiErrorDetail);
  }

  const attrs = json.data.attributes || {};
  const payments = Array.isArray(attrs.payments) ? attrs.payments : [];
  const paidPayment = payments.find(
    (p: any) => p?.attributes?.status === 'paid' || p?.status === 'paid'
  );
  const failedPayment = payments.find(
    (p: any) => p?.attributes?.status === 'failed' || p?.status === 'failed'
  );

  const paymentIntentStatus = attrs.payment_intent?.attributes?.status;
  const sessionStatus = attrs.status;

  if (paidPayment || paymentIntentStatus === 'succeeded') {
    const paymentId =
      paidPayment?.id ||
      attrs.payment_intent?.id ||
      null;
    const channel =
      paidPayment?.attributes?.source?.type ||
      attrs.payment_method_used ||
      null;

    return {
      sessionId: checkoutSessionId,
      status: 'paid',
      paymentId: paymentId ? String(paymentId) : null,
      paymentChannel: channel ? String(channel) : null,
      lastPaymentError: null,
    };
  }

  if (failedPayment) {
    const paymentId = failedPayment?.id ? String(failedPayment.id) : null;
    const errDetail =
      failedPayment?.attributes?.last_payment_error?.failed_message ||
      attrs.payment_intent?.attributes?.last_payment_error?.failed_message ||
      'PayMongo test payment was declined.';
    return {
      sessionId: checkoutSessionId,
      status: 'failed',
      paymentId,
      paymentChannel: failedPayment?.attributes?.source?.type || null,
      lastPaymentError: String(errDetail),
    };
  }

  if (sessionStatus === 'expired') {
    return {
      sessionId: checkoutSessionId,
      status: 'expired',
      paymentId: null,
      paymentChannel: null,
      lastPaymentError: 'PayMongo Checkout Session expired.',
    };
  }

  return {
    sessionId: checkoutSessionId,
    status: 'pending',
    paymentId: null,
    paymentChannel: null,
    lastPaymentError: null,
  };
}

export function verifyPaymongoWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  webhookSecret?: string | null
): boolean {
  const secret = (webhookSecret ?? process.env.PAYMONGO_WEBHOOK_SECRET ?? '').trim();
  if (!secret || !signatureHeader) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(',').map((segment) => {
      const [k, v] = segment.trim().split('=');
      return [k, v || ''];
    })
  );

  const timestamp = parts.t;
  const candidateSig = parts.te || parts.li;
  if (!timestamp || !candidateSig) return false;

  const signedPayload = `${timestamp}.${rawBody}`;
  const expectedHex = createHmac('sha256', secret).update(signedPayload).digest('hex');

  const expectedBuf = Buffer.from(expectedHex, 'utf8');
  const candidateBuf = Buffer.from(candidateSig, 'utf8');
  if (expectedBuf.length !== candidateBuf.length) return false;

  return timingSafeEqual(expectedBuf, candidateBuf);
}
