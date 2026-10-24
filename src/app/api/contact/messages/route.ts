import * as admin from 'firebase-admin';
import type { NextRequest } from 'next/server';
import { getAdminFirestore } from '@/firebase/server-init';
import { contactReplySchema } from '@/lib/contact-schemas';
import { CONTACT_EMAIL_ENABLED } from '@/lib/contact-config';
import { contactErrorResponse, getBearerToken, getOptionalCustomerIdentity, requireContactStaff } from '@/lib/server/contact-auth';
import { sendInquiryReply } from '@/lib/server/gmail';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const parsed = contactReplySchema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: 'Enter a reply before sending.' }, { status: 400 });

    const token = getBearerToken(request);
    if (!token) return Response.json({ error: 'Sign in to reply to this conversation.' }, { status: 401 });
    const firestore = getAdminFirestore();
    const inquiryRef = firestore.collection('contactInquiries').doc(parsed.data.inquiryId);
    const inquirySnapshot = await inquiryRef.get();
    if (!inquirySnapshot.exists) return Response.json({ error: 'This inquiry could not be found.' }, { status: 404 });
    const inquiry = inquirySnapshot.data();
    if (!inquiry) return Response.json({ error: 'This inquiry could not be found.' }, { status: 404 });

    let staff: Awaited<ReturnType<typeof requireContactStaff>> | null = null;
    let customer: Awaited<ReturnType<typeof getOptionalCustomerIdentity>> = null;
    try {
      staff = await requireContactStaff(token);
    } catch {
      customer = await getOptionalCustomerIdentity(token);
      if (!customer || inquiry.userId !== customer.decoded.uid) {
        return Response.json({ error: 'You do not have access to this inquiry.' }, { status: 403 });
      }
    }

    const messageRef = inquiryRef.collection('messages').doc();
    const notificationRef = firestore.collection('system_notifications').doc();
    const customerNotificationRef = inquiry.userId
      ? firestore.collection('users').doc(inquiry.userId).collection('notifications').doc()
      : null;
    const now = admin.firestore.FieldValue.serverTimestamp();
    const senderType = staff ? 'staff' : 'customer';
    const profileName = customer?.profile.name;
    const senderName = staff?.name ?? (typeof profileName === 'string' ? profileName : customer?.decoded.email ?? 'Customer');
    await firestore.runTransaction(async transaction => {
      const freshInquiry = await transaction.get(inquiryRef);
      if (!freshInquiry.exists) throw new Error('This inquiry could not be found.');
      transaction.create(messageRef, {
        id: messageRef.id,
        body: parsed.data.body,
        senderType,
        senderId: staff?.decoded.uid ?? customer?.decoded.uid ?? null,
        senderName,
        createdAt: now,
        emailStatus: CONTACT_EMAIL_ENABLED && staff ? 'pending' : 'not_applicable',
      });
      transaction.update(inquiryRef, {
        status: 'open',
        messageCount: admin.firestore.FieldValue.increment(1),
        lastMessagePreview: parsed.data.body.slice(0, 180),
        updatedAt: now,
        lastMessageAt: now,
        readBy: senderType === 'customer' ? [] : admin.firestore.FieldValue.arrayUnion(staff!.decoded.uid),
      });
      if (customer) {
        transaction.create(notificationRef, {
          id: notificationRef.id,
          type: 'contact_reply_received',
          actorId: customer.decoded.uid,
          actorName: senderName,
          title: 'Customer Replied',
          message: `${inquiry.subject} from ${inquiry.fullName}`,
          targetId: inquiryRef.id,
          readBy: [],
          createdAt: now,
        });
      }
      if (staff && customerNotificationRef) {
        transaction.create(customerNotificationRef, {
          id: customerNotificationRef.id,
          userId: inquiry.userId,
          title: 'Support team replied',
          message: `There is a new reply to “${inquiry.subject}”.`,
          orderId: '',
          targetId: inquiryRef.id,
          type: 'support_reply',
          read: false,
          createdAt: now,
        });
      }
    });

    if (CONTACT_EMAIL_ENABLED && staff) {
      try {
        const aliasSnapshot = await firestore.collection('contactMailAliases').doc(inquiry.emailReplyAliasId).get();
        const replyToken = aliasSnapshot.data()?.token;
        if (typeof replyToken !== 'string') throw new Error('Email reply routing is not configured for this inquiry.');
        const sent = await sendInquiryReply({
          to: inquiry.email,
          customerName: inquiry.fullName,
          subject: inquiry.subject,
          body: parsed.data.body,
          replyToken,
          threadId: inquiry.gmailThreadId,
        });
        await messageRef.update({ emailStatus: 'sent', gmailMessageId: sent.messageId });
        await inquiryRef.update({ gmailThreadId: sent.threadId });
        return Response.json({ success: true, emailStatus: 'sent' });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Email could not be sent.';
        await messageRef.update({ emailStatus: 'failed', emailError: message });
        return Response.json({ success: true, emailStatus: 'failed', emailError: message });
      }
    }

    return Response.json({ success: true, emailStatus: 'not_applicable' });
  } catch (error) {
    return contactErrorResponse(error);
  }
}
