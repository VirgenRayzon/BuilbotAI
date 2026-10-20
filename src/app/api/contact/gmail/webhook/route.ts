import { createHash } from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import * as admin from 'firebase-admin';
import { getAdminFirestore } from '@/firebase/server-init';
import { CONTACT_EMAIL_ENABLED } from '@/lib/contact-config';
import {
  decodeGmailBody,
  getGmailMessage,
  listGmailHistory,
  type GmailMessagePayload,
  type GmailMessageDetail,
} from '@/lib/server/gmail';

export const runtime = 'nodejs';

function getHeader(message: GmailMessageDetail, headerName: string) {
  return message.payload?.headers?.find(header => header.name.toLowerCase() === headerName.toLowerCase())?.value ?? '';
}

function plainText(payload?: GmailMessagePayload): string {
  if (!payload) return '';
  if (payload.mimeType === 'text/plain' && payload.body?.data) return decodeGmailBody(payload.body.data);
  for (const part of payload.parts ?? []) {
    const text = plainText(part);
    if (text) return text;
  }
  return '';
}

function extractReplyToken(toHeader: string) {
  const match = toHeader.match(/\+reply-([a-f0-9]{64})@/i);
  return match?.[1]?.toLowerCase() ?? null;
}

function normalizeAddress(header: string) {
  const match = header.match(/<([^>]+)>/);
  return (match?.[1] ?? header).trim().toLowerCase();
}

function decodeNotification(encoded: string) {
  const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(Buffer.from(normalized, 'base64').toString('utf8')) as {
    emailAddress?: string;
    historyId?: string;
  };
}

async function verifyPubSubRequest(request: Request) {
  const expectedAudience = process.env.GMAIL_PUBSUB_AUDIENCE;
  const expectedEmail = process.env.GMAIL_PUBSUB_SERVICE_ACCOUNT;
  const authorization = request.headers.get('authorization');
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!expectedAudience || !expectedEmail || !token) return false;

  try {
    const ticket = await new OAuth2Client().verifyIdToken({ idToken: token, audience: expectedAudience });
    const payload = ticket.getPayload();
    return payload?.email_verified === true && payload.email?.toLowerCase() === expectedEmail.toLowerCase();
  } catch {
    return false;
  }
}

async function appendCustomerEmail(message: GmailMessageDetail) {
  if (!message.labelIds?.includes('INBOX') || message.labelIds.includes('SENT')) return;

  const token = extractReplyToken(getHeader(message, 'To'));
  const senderEmail = normalizeAddress(getHeader(message, 'From'));
  if (!token || !senderEmail) return;

  const firestore = getAdminFirestore();
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const aliasSnapshot = await firestore.collection('contactMailAliases').doc(tokenHash).get();
  const alias = aliasSnapshot.data();
  if (!alias || typeof alias.inquiryId !== 'string') return;
  const inquiryDocument = await firestore.collection('contactInquiries').doc(alias.inquiryId).get();
  if (!inquiryDocument.exists) return;
  const inquiry = inquiryDocument.data();
  if (!inquiry) return;
  if (String(inquiry.email).toLowerCase() !== senderEmail) return;

  const body = plainText(message.payload).trim().slice(0, 10000);
  if (!body) return;

  const inquiryRef = inquiryDocument.ref;
  const messageRef = inquiryRef.collection('messages').doc(`gmail_${message.id}`);
  const notificationRef = firestore.collection('system_notifications').doc();
  await firestore.runTransaction(async transaction => {
    const [inquiryFresh, messageFresh] = await Promise.all([
      transaction.get(inquiryRef),
      transaction.get(messageRef),
    ]);
    if (!inquiryFresh.exists || messageFresh.exists) return;

    const now = admin.firestore.FieldValue.serverTimestamp();
    transaction.create(messageRef, {
      id: messageRef.id,
      body,
      senderType: 'customer',
      senderId: inquiry.userId ?? null,
      senderName: inquiry.fullName,
      createdAt: now,
      emailStatus: 'not_applicable',
      gmailMessageId: message.id,
    });
    transaction.update(inquiryRef, {
      status: 'open',
      messageCount: admin.firestore.FieldValue.increment(1),
      lastMessagePreview: body.slice(0, 180),
      updatedAt: now,
      lastMessageAt: now,
      readBy: [],
    });
    transaction.create(notificationRef, {
      id: notificationRef.id,
      type: 'contact_reply_received',
      actorId: inquiry.userId ?? 'guest',
      actorName: inquiry.fullName,
      title: 'Customer Replied',
      message: `${inquiry.subject} from ${inquiry.fullName}`,
      targetId: inquiryDocument.id,
      readBy: [],
      createdAt: now,
    });
  });
}

export async function POST(request: Request) {
  if (!CONTACT_EMAIL_ENABLED) return new Response(null, { status: 204 });
  if (!(await verifyPubSubRequest(request))) {
    return Response.json({ error: 'Unauthorized push request.' }, { status: 401 });
  }

  try {
    const body = await request.json() as { message?: { data?: string } };
    if (!body.message?.data) return Response.json({ error: 'Missing Pub/Sub message data.' }, { status: 400 });
    const notification = decodeNotification(body.message.data);
    const mailboxEmail = (process.env.CONTACT_SUPPORT_EMAIL || 'buildbotaiproject@gmail.com').toLowerCase();
    if (notification.emailAddress?.toLowerCase() !== mailboxEmail || !notification.historyId) {
      return Response.json({ error: 'The notification does not match the configured support mailbox.' }, { status: 400 });
    }

    const firestore = getAdminFirestore();
    const mailboxRef = firestore.collection('contactMailboxes').doc('support');
    const mailboxSnapshot = await mailboxRef.get();
    const previousHistoryId = mailboxSnapshot.data()?.historyId;
    if (!previousHistoryId) return Response.json({ error: 'Gmail watch has not been initialized.' }, { status: 503 });

    let pageToken: string | undefined;
    const seenMessageIds = new Set<string>();
    do {
      const historyPage = await listGmailHistory(String(previousHistoryId), pageToken);
      for (const history of historyPage.history ?? []) {
        for (const added of history.messagesAdded ?? []) {
          if (seenMessageIds.has(added.message.id)) continue;
          seenMessageIds.add(added.message.id);
          const message = await getGmailMessage(added.message.id);
          await appendCustomerEmail(message);
        }
      }
      pageToken = historyPage.nextPageToken;
    } while (pageToken);

    await mailboxRef.set({
      historyId: notification.historyId,
      lastProcessedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('[Gmail webhook] Could not process mailbox update:', error);
    return Response.json({ error: 'Mailbox update could not be processed.' }, { status: 500 });
  }
}
