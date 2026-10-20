import { createHash, randomBytes } from 'node:crypto';
import { getAdminFirestore } from '@/firebase/server-init';
import { contactSubmissionSchema } from '@/lib/contact-schemas';
import { CONTACT_EMAIL_ENABLED } from '@/lib/contact-config';
import { contactErrorResponse, getBearerToken, getOptionalCustomerIdentity } from '@/lib/server/contact-auth';
import type { NextRequest } from 'next/server';
import * as admin from 'firebase-admin';

export const runtime = 'nodejs';

async function enforceEmailRateLimit(email: string) {
  const firestore = getAdminFirestore();
  const hour = new Date().toISOString().slice(0, 13);
  const key = createHash('sha256').update(`${email.toLowerCase()}:${hour}`).digest('hex');
  const rateRef = firestore.collection('contactRateLimits').doc(key);
  await firestore.runTransaction(async transaction => {
    const snapshot = await transaction.get(rateRef);
    const count = Number(snapshot.data()?.count ?? 0);
    if (count >= 5) throw new Error('RATE_LIMITED');
    transaction.set(rateRef, {
      count: count + 1,
      expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 2 * 60 * 60 * 1000)),
    });
  });
}

export async function POST(request: NextRequest) {
  try {
    const parsed = contactSubmissionSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: 'Please check your details and message, then try again.' }, { status: 400 });
    }

    const submission = parsed.data;
    // Quietly accept honeypot submissions without writing or notifying staff.
    if (submission.companyWebsite.trim()) return Response.json({ success: true });

    const identity = await getOptionalCustomerIdentity(getBearerToken(request));
    try {
      await enforceEmailRateLimit(submission.email);
    } catch (error) {
      if (error instanceof Error && error.message === 'RATE_LIMITED') {
        return Response.json({ error: 'Too many messages were sent from this email. Please try again later.' }, { status: 429 });
      }
      throw error;
    }

    const firestore = getAdminFirestore();
    const inquiryRef = firestore.collection('contactInquiries').doc();
    const firstMessageRef = inquiryRef.collection('messages').doc();
    const notificationRef = firestore.collection('system_notifications').doc();
    const emailReplyToken = CONTACT_EMAIL_ENABLED ? randomBytes(32).toString('hex') : null;
    const emailReplyAliasId = emailReplyToken ? createHash('sha256').update(emailReplyToken).digest('hex') : null;
    const emailReplyAliasRef = emailReplyAliasId
      ? firestore.collection('contactMailAliases').doc(emailReplyAliasId)
      : null;
    const now = admin.firestore.FieldValue.serverTimestamp();
    const profile = identity?.profile;
    const accountEmail = identity?.decoded.email ?? null;
    const displayName = typeof profile?.name === 'string' ? profile.name : submission.fullName;

    const batch = firestore.batch();
    batch.create(inquiryRef, {
      id: inquiryRef.id,
      fullName: submission.fullName,
      email: submission.email.toLowerCase(),
      accountEmail: accountEmail?.toLowerCase() ?? null,
      userId: identity?.decoded.uid ?? null,
      subject: submission.subject,
      status: 'open',
      messageCount: 1,
      lastMessagePreview: submission.message.slice(0, 180),
      ...(emailReplyAliasId ? { emailReplyAliasId } : {}),
      readBy: [],
      createdAt: now,
      updatedAt: now,
      lastMessageAt: now,
    });
    batch.create(firstMessageRef, {
      id: firstMessageRef.id,
      body: submission.message,
      senderType: 'customer',
      senderId: identity?.decoded.uid ?? null,
      senderName: displayName,
      createdAt: now,
      emailStatus: 'not_applicable',
    });
    if (emailReplyAliasRef && emailReplyToken) {
      batch.create(emailReplyAliasRef, {
        inquiryId: inquiryRef.id,
        token: emailReplyToken,
        email: submission.email.toLowerCase(),
        createdAt: now,
      });
    }
    batch.create(notificationRef, {
      id: notificationRef.id,
      type: 'contact_inquiry',
      actorId: identity?.decoded.uid ?? 'guest',
      actorName: displayName,
      title: 'New Contact Inquiry',
      message: `${submission.subject} from ${submission.fullName}`,
      targetId: inquiryRef.id,
      readBy: [],
      createdAt: now,
    });
    await batch.commit();

    return Response.json({ success: true, inquiryId: inquiryRef.id });
  } catch (error) {
    return contactErrorResponse(error);
  }
}
