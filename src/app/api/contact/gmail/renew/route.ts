import * as admin from 'firebase-admin';
import type { NextRequest } from 'next/server';
import { getAdminFirestore } from '@/firebase/server-init';
import { CONTACT_EMAIL_ENABLED } from '@/lib/contact-config';
import { contactErrorResponse, getBearerToken, requireContactStaff } from '@/lib/server/contact-auth';
import { startGmailWatch } from '@/lib/server/gmail';
import { timingSafeEqual } from 'node:crypto';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    if (!CONTACT_EMAIL_ENABLED) return Response.json({ success: true, disabled: true });
    const configuredCronSecret = process.env.GMAIL_WATCH_CRON_SECRET;
    const providedCronSecret = request.headers.get('x-gmail-cron-secret');
    const cronAuthorized = Boolean(configuredCronSecret && providedCronSecret &&
      configuredCronSecret.length === providedCronSecret.length &&
      timingSafeEqual(Buffer.from(configuredCronSecret), Buffer.from(providedCronSecret)));
    if (!cronAuthorized) {
      const staff = await requireContactStaff(getBearerToken(request));
      if (!staff.isSuperAdmin) return Response.json({ error: 'Super admin access is required to connect Gmail.' }, { status: 403 });
    }

    const result = await startGmailWatch();
    await getAdminFirestore().collection('contactMailboxes').doc('support').set({
      email: process.env.CONTACT_SUPPORT_EMAIL || 'buildbotaiproject@gmail.com',
      historyId: result.historyId,
      expiration: result.expiration,
      renewedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    return Response.json({ success: true, expiration: result.expiration });
  } catch (error) {
    return contactErrorResponse(error);
  }
}
