import * as admin from 'firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/firebase/server-init';
import { CONTACT_EMAIL_ENABLED } from '@/lib/contact-config';
import { encryptGmailRefreshToken, exchangeGmailAuthorizationCode, startGmailWatch } from '@/lib/server/gmail';

export const runtime = 'nodejs';

function returnToInbox(request: NextRequest, status: 'connected' | 'error') {
  const configuredRedirectUri = process.env.GMAIL_REDIRECT_URI;
  const origin = configuredRedirectUri ? new URL(configuredRedirectUri).origin : request.nextUrl.origin;
  return NextResponse.redirect(new URL(`/profile?tab=contact-inbox&gmail=${status}`, origin));
}

export async function GET(request: NextRequest) {
  if (!CONTACT_EMAIL_ENABLED) {
    return NextResponse.redirect(new URL('/profile?tab=contact-inbox&email=disabled', request.nextUrl.origin));
  }
  try {
    const state = request.nextUrl.searchParams.get('state');
    const code = request.nextUrl.searchParams.get('code');
    if (!state || !/^[A-Za-z0-9_-]{40,60}$/.test(state) || !code) return returnToInbox(request, 'error');

    const firestore = getAdminFirestore();
    const stateRef = firestore.collection('contactOAuthStates').doc(state);
    const stateSnapshot = await stateRef.get();
    const stateData = stateSnapshot.data();
    const expiresAt = stateData?.expiresAt as admin.firestore.Timestamp | undefined;
    if (!stateSnapshot.exists || typeof stateData?.uid !== 'string' || !expiresAt || expiresAt.toMillis() < Date.now()) {
      return returnToInbox(request, 'error');
    }
    await stateRef.delete();

    const account = await getAdminAuth().getUser(stateData.uid);
    const profile = await firestore.collection('users').doc(stateData.uid).get();
    if (account.customClaims?.isSuperAdmin !== true || profile.data()?.isSuperAdmin !== true) {
      return returnToInbox(request, 'error');
    }

    const refreshToken = await exchangeGmailAuthorizationCode(code);
    const encryptedToken = encryptGmailRefreshToken(refreshToken);
    await firestore.collection('contactSecrets').doc('gmail').set({
      ...encryptedToken,
      accountEmail: process.env.CONTACT_SUPPORT_EMAIL || 'buildbotaiproject@gmail.com',
      authorizedBy: stateData.uid,
      connectedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const watch = await startGmailWatch();
    await firestore.collection('contactMailboxes').doc('support').set({
      email: process.env.CONTACT_SUPPORT_EMAIL || 'buildbotaiproject@gmail.com',
      historyId: watch.historyId,
      expiration: watch.expiration,
      renewedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    return returnToInbox(request, 'connected');
  } catch (error) {
    console.error('[Gmail OAuth] Authorization failed:', error);
    return returnToInbox(request, 'error');
  }
}
