import { createHash } from 'node:crypto';
import type admin from 'firebase-admin';
import { getAdminAuth, getAdminFirestore } from '@/firebase/server-init';
import { computeExpiresAt } from '@/lib/ttl-policies';

export class AiRouteAuthError extends Error {
  readonly status: number;
  readonly retryAfterSeconds?: number;
  readonly response: Response;

  constructor(message: string, status: number, retryAfterSeconds?: number) {
    super(message);
    this.name = 'AiRouteAuthError';
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (typeof retryAfterSeconds === 'number' && retryAfterSeconds > 0) {
      headers['Retry-After'] = String(retryAfterSeconds);
    }

    this.response = new Response(
      JSON.stringify({
        error: message,
        ...(retryAfterSeconds ? { retryAfter: retryAfterSeconds } : {}),
      }),
      { status, headers }
    );
  }

  toResponse(): Response {
    return this.response;
  }
}

export function isAiRouteAuthError(error: unknown): error is AiRouteAuthError {
  return error instanceof AiRouteAuthError;
}

export interface AiRouteAuthOptions {
  allowGuestWithRateLimit: boolean;
  maxPerMinute: number;
  db?: admin.firestore.Firestore;
  auth?: admin.auth.Auth;
  now?: () => number;
}

export interface AuthorizedAiSession {
  uid: string | null;
  key: string;
}

/**
 * Extracts client IP and header fingerprint to identify guest clients for rate limiting.
 */
export function getAiClientFingerprint(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const clientIp = forwarded?.split(',')[0]?.trim() || realIp || 'unknown-ip';
  const userAgent = req.headers.get('user-agent') || 'unknown-ua';
  const host = req.headers.get('host') || 'unknown-host';

  const rawFingerprint = `${clientIp}|${host}|${userAgent}`;
  return createHash('sha256').update(rawFingerprint).digest('hex');
}

/**
 * Authenticates and rate-limits incoming AI requests.
 *
 * 1. If an `Authorization: Bearer <token>` header is present, verifies it via Firebase Admin.
 *    Throws 401 if token is invalid, expired, or malformed.
 * 2. If no token is provided:
 *    - Allows as guest (uid: null) if `allowGuestWithRateLimit` is true.
 *    - Throws 401 if `allowGuestWithRateLimit` is false.
 * 3. Enforces rate limits transactionally in Firestore `aiRateLimits/{key}`:
 *    - Active window: 60 seconds.
 *    - Throws 429 with `Retry-After` if `count > maxPerMinute`.
 *    - Stamps 1-day `expiresAt` TTL.
 */
export async function authorizeAiRequest(
  req: Request,
  options: AiRouteAuthOptions
): Promise<AuthorizedAiSession> {
  const authHeader = req.headers.get('authorization');
  let uid: string | null = null;
  let key: string;

  if (authHeader) {
    const match = authHeader.match(/^Bearer\s+(\S+)$/i);
    const token = match?.[1];

    if (!token) {
      throw new AiRouteAuthError('Invalid or expired authorization token.', 401);
    }

    try {
      const auth = options.auth || getAdminAuth();
      const decoded = await auth.verifyIdToken(token, true);
      uid = decoded.uid;
      key = `user_${uid}`;
    } catch {
      throw new AiRouteAuthError('Invalid or expired authorization token.', 401);
    }
  } else {
    if (!options.allowGuestWithRateLimit) {
      throw new AiRouteAuthError('Authentication required.', 401);
    }
    const fingerprint = getAiClientFingerprint(req);
    key = `guest_${fingerprint.slice(0, 32)}`;
  }

  const db = options.db || getAdminFirestore();
  const nowMs = options.now?.() ?? Date.now();
  const rateLimitRef = db.collection('aiRateLimits').doc(key);
  const WINDOW_MS = 60 * 1000;

  await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(rateLimitRef);
    const data = snap.exists ? (snap.data() as Record<string, unknown> | undefined) : undefined;
    const windowStart = typeof data?.windowStart === 'number' ? data.windowStart : 0;
    const currentCount = typeof data?.count === 'number' ? data.count : 0;
    const inActiveWindow = nowMs - windowStart < WINDOW_MS;

    if (inActiveWindow) {
      if (currentCount >= options.maxPerMinute) {
        const remainingMs = Math.max(0, windowStart + WINDOW_MS - nowMs);
        const retryAfterSeconds = Math.max(1, Math.ceil(remainingMs / 1000));
        throw new AiRouteAuthError(
          'Rate limit exceeded. Please wait before sending more AI requests.',
          429,
          retryAfterSeconds
        );
      }

      transaction.update(rateLimitRef, {
        count: currentCount + 1,
        updatedAt: nowMs,
        expiresAt: computeExpiresAt('aiRateLimits', nowMs),
      });
    } else {
      transaction.set(rateLimitRef, {
        key,
        uid: uid || null,
        count: 1,
        windowStart: nowMs,
        updatedAt: nowMs,
        expiresAt: computeExpiresAt('aiRateLimits', nowMs),
      });
    }
  });

  return { uid, key };
}
