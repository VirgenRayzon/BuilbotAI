/**
 * Firestore TTL policies and retention helpers.
 *
 * NOTE: This module must remain 100% browser-safe (pure JS returning standard
 * Date objects and boolean checks, with ZERO imports from firebase-admin).
 * Client-facing code (e.g. database.ts, audit.ts) imports this module directly.
 */

export const TTL_DAYS = {
  aiCritiqueCache: 1,
  aiRecommendationCache: 7,
  orderWorkflowOperations: 30,
  reservationOperations: 30,
  notifications: 90,
  analyticsAppliedEvents: 90,
  auditLogs: 365,
} as const;

export type TtlPolicyName = keyof typeof TTL_DAYS;

export const FORBIDDEN_TTL_TARGETS = [
  'orders',
  'orders/activity',
  'refunds',
  'financial_refunds',
  'orderRefunds',
] as const;

export type ForbiddenTtlTarget = (typeof FORBIDDEN_TTL_TARGETS)[number];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Compute the expiration Date for a given ephemeral or bounded collection policy.
 * Throws defensively if a forbidden collection (such as orders or refunds) is requested.
 */
export function computeExpiresAt(
  policy: TtlPolicyName,
  fromMs: number = Date.now()
): Date {
  const policyStr = String(policy);
  if (
    FORBIDDEN_TTL_TARGETS.includes(policyStr as ForbiddenTtlTarget) ||
    policyStr.startsWith('orders')
  ) {
    throw new Error(
      `TTL policy '${policyStr}' is strictly forbidden: permanent financial/audit records must never have TTL expiry.`
    );
  }

  const days = TTL_DAYS[policy];
  if (typeof days !== 'number' || days <= 0) {
    throw new Error(`Invalid TTL policy: '${policyStr}'`);
  }

  return new Date(fromMs + days * MS_PER_DAY);
}

/**
 * Structural type for Firestore Timestamp-like values across both client Web SDK
 * and server Admin SDK, as well as native Date, ISO string, and epoch millisecond representations.
 */
export type FirestoreDateLike =
  | Date
  | { toMillis?: () => number; toDate?: () => Date; seconds?: number; nanoseconds?: number }
  | string
  | number
  | null
  | undefined;

/**
 * Determine whether a timestamp has expired relative to `nowMs`.
 * Returns false if `expiresAt` is null, undefined, or unparseable.
 * Returns true if `expiresAt <= nowMs`.
 */
export function isExpiredAt(
  expiresAt: FirestoreDateLike,
  nowMs: number = Date.now()
): boolean {
  if (expiresAt === null || expiresAt === undefined) {
    return false;
  }

  let targetMs: number;

  if (expiresAt instanceof Date) {
    targetMs = expiresAt.getTime();
  } else if (typeof expiresAt === 'number') {
    // If epoch seconds (e.g. < 100 billion), convert to milliseconds
    targetMs = expiresAt < 1e11 ? expiresAt * 1000 : expiresAt;
  } else if (typeof expiresAt === 'string') {
    targetMs = new Date(expiresAt).getTime();
  } else if (typeof expiresAt === 'object') {
    if (typeof expiresAt.toMillis === 'function') {
      targetMs = expiresAt.toMillis();
    } else if (typeof expiresAt.toDate === 'function') {
      targetMs = expiresAt.toDate().getTime();
    } else if (typeof expiresAt.seconds === 'number') {
      targetMs = expiresAt.seconds * 1000 + (expiresAt.nanoseconds || 0) / 1e6;
    } else {
      return false;
    }
  } else {
    return false;
  }

  if (Number.isNaN(targetMs)) {
    return false;
  }

  return targetMs <= nowMs;
}
