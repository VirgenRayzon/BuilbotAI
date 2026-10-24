import type { NextRequest } from 'next/server';
import { getAdminFirestore } from '@/firebase/server-init';
import { CONTACT_EMAIL_ENABLED } from '@/lib/contact-config';
import { contactErrorResponse, getBearerToken, requireContactStaff } from '@/lib/server/contact-auth';
import { sendInquiryReply } from '@/lib/server/gmail';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    if (!CONTACT_EMAIL_ENABLED) {
      return Response.json({ error: 'Email delivery is disabled. Replies are handled in BuildbotAI.' }, { status: 410 });
    }
    await requireContactStaff(getBearerToken(request));
    const body = await request.json() as { inquiryId?: unknown; messageId?: unknown };
    if (typeof body.inquiryId !== 'string' || typeof body.messageId !== 'string') {
      return Response.json({ error: 'Invalid message.' }, { status: 400 });
    }

    const firestore = getAdminFirestore();
    const inquiryRef = firestore.collection('contactInquiries').doc(body.inquiryId);
    const messageRef = inquiryRef.collection('messages').doc(body.messageId);
    const [inquirySnapshot, messageSnapshot] = await Promise.all([inquiryRef.get(), messageRef.get()]);
    if (!inquirySnapshot.exists || !messageSnapshot.exists) return Response.json({ error: 'The reply could not be found.' }, { status: 404 });
    const inquiry = inquirySnapshot.data();
    const message = messageSnapshot.data();
    if (!inquiry || !message || message.senderType !== 'staff' || message.emailStatus !== 'failed') {
      return Response.json({ error: 'This reply is not eligible for email retry.' }, { status: 409 });
    }

    await messageRef.update({ emailStatus: 'pending', emailError: null });
    try {
      const aliasSnapshot = await firestore.collection('contactMailAliases').doc(inquiry.emailReplyAliasId).get();
      const replyToken = aliasSnapshot.data()?.token;
      if (typeof replyToken !== 'string') throw new Error('Email reply routing is not configured for this inquiry.');
      const sent = await sendInquiryReply({
        to: inquiry.email,
        customerName: inquiry.fullName,
        subject: inquiry.subject,
        body: message.body,
        replyToken,
        threadId: inquiry.gmailThreadId,
      });
      await messageRef.update({ emailStatus: 'sent', emailError: null, gmailMessageId: sent.messageId });
      await inquiryRef.update({ gmailThreadId: sent.threadId });
      return Response.json({ success: true });
    } catch (error) {
      const emailError = error instanceof Error ? error.message : 'Email could not be sent.';
      await messageRef.update({ emailStatus: 'failed', emailError });
      return Response.json({ error: emailError }, { status: 503 });
    }
  } catch (error) {
    return contactErrorResponse(error);
  }
}
