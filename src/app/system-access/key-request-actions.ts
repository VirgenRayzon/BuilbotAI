'use server';

import { createHash } from 'node:crypto';
import { z } from 'zod';
import admin from 'firebase-admin';
import { getAdminAuth, getAdminFirestore } from '@/firebase/server-init';
import { computeExpiresAt } from '@/lib/ttl-policies';

const requestKeyInputSchema = z.object({
  email: z.string().trim().email('Invalid email address format.').max(254),
  idToken: z.string().optional(),
});

export interface RequestManagerKeyResult {
  success: boolean;
  error?: string;
}

/**
 * Rate-limited server action for submitting manager key requests securely via Admin SDK.
 * Bypasses client-side Firestore rules while strictly rate-limiting and validating inputs.
 */
export async function requestManagerKeyAction(
  email: string,
  idToken?: string
): Promise<RequestManagerKeyResult> {
  const parsed = requestKeyInputSchema.safeParse({ email, idToken });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || 'Please provide a valid email address.',
    };
  }

  const cleanEmail = parsed.data.email.toLowerCase();
  const db = getAdminFirestore();
  const nowMs = Date.now();

  // Rate-limiting key derived from email hash
  const emailHash = createHash('sha256').update(cleanEmail).digest('hex').slice(0, 32);
  const rateLimitRef = db.collection('aiRateLimits').doc(`key_req_${emailHash}`);
  const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
  const MAX_REQUESTS_PER_WINDOW = 3;

  try {
    const isAllowed = await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(rateLimitRef);
      const data = snap.exists ? (snap.data() as Record<string, unknown> | undefined) : undefined;
      const windowStart = typeof data?.windowStart === 'number' ? data.windowStart : 0;
      const currentCount = typeof data?.count === 'number' ? data.count : 0;
      const inWindow = nowMs - windowStart < RATE_LIMIT_WINDOW_MS;

      if (inWindow) {
        if (currentCount >= MAX_REQUESTS_PER_WINDOW) {
          return false;
        }
        transaction.update(rateLimitRef, {
          count: currentCount + 1,
          updatedAt: nowMs,
          expiresAt: computeExpiresAt('aiRateLimits', nowMs),
        });
      } else {
        transaction.set(rateLimitRef, {
          key: `key_req_${emailHash}`,
          count: 1,
          windowStart: nowMs,
          updatedAt: nowMs,
          expiresAt: computeExpiresAt('aiRateLimits', nowMs),
        });
      }
      return true;
    });

    if (!isAllowed) {
      return {
        success: false,
        error: 'Too many key requests. Please wait a few minutes before submitting again.',
      };
    }

    // Resolve userId: from idToken if authenticated, or from Auth user record if found by email
    let userId = 'unauthenticated_applicant';
    if (parsed.data.idToken) {
      try {
        const decoded = await getAdminAuth().verifyIdToken(parsed.data.idToken, true);
        userId = decoded.uid;
      } catch {
        // Fall back to lookup by email
      }
    }

    if (userId === 'unauthenticated_applicant') {
      try {
        const userRecord = await getAdminAuth().getUserByEmail(cleanEmail);
        userId = userRecord.uid;
      } catch {
        // Unregistered applicant or email not found in Firebase Auth
      }
    }

    const requestRef = db.collection('keyRequests').doc();
    await requestRef.set({
      id: requestRef.id,
      userId,
      email: cleanEmail,
      role: 'manager',
      status: 'pending',
      requestedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('[requestManagerKeyAction] Error processing key request:', error);
    return {
      success: false,
      error: 'Failed to process request. Please try again later.',
    };
  }
}
