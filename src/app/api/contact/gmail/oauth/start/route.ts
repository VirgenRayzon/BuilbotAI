import { randomBytes } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { getAdminFirestore } from '@/firebase/server-init';
import { CONTACT_EMAIL_ENABLED } from '@/lib/contact-config';
import { contactErrorResponse, getBearerToken, requireContactStaff } from '@/lib/server/contact-auth';
import { createGmailAuthorizationUrl } from '@/lib/server/gmail';
import * as admin from 'firebase-admin';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    if (!CONTACT_EMAIL_ENABLED) {
      return Response.json({ error: 'The email integration is disabled.' }, { status: 410 });
    }
    const staff = await requireContactStaff(getBearerToken(request));
    if (!staff.isSuperAdmin) return Response.json({ error: 'Super admin access is required to authorize Gmail.' }, { status: 403 });

    const state = randomBytes(32).toString('base64url');
    await getAdminFirestore().collection('contactOAuthStates').doc(state).create({
      uid: staff.decoded.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)),
    });
    return Response.json({ authorizationUrl: createGmailAuthorizationUrl(state) });
  } catch (error) {
    return contactErrorResponse(error);
  }
}
