import * as admin from 'firebase-admin';
import type { NextRequest } from 'next/server';
import { getAdminFirestore } from '@/firebase/server-init';
import { contactStatusSchema } from '@/lib/contact-schemas';
import { contactErrorResponse, getBearerToken, requireContactStaff } from '@/lib/server/contact-auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const staff = await requireContactStaff(getBearerToken(request));
    const parsed = contactStatusSchema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: 'Invalid inquiry status.' }, { status: 400 });

    const firestore = getAdminFirestore();
    const inquiryRef = firestore.collection('contactInquiries').doc(parsed.data.inquiryId);
    const snapshot = await inquiryRef.get();
    if (!snapshot.exists) return Response.json({ error: 'This inquiry could not be found.' }, { status: 404 });
    const inquiry = snapshot.data();
    const batch = firestore.batch();
    batch.update(inquiryRef, {
      status: parsed.data.status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      readBy: admin.firestore.FieldValue.arrayUnion(staff.decoded.uid),
    });
    if (typeof inquiry?.userId === 'string') {
      const notificationRef = firestore.collection('users').doc(inquiry.userId).collection('notifications').doc();
      const resolved = parsed.data.status === 'resolved';
      batch.create(notificationRef, {
        id: notificationRef.id,
        userId: inquiry.userId,
        title: resolved ? 'Support request resolved' : 'Support request reopened',
        message: `“${inquiry.subject}” was ${resolved ? 'marked resolved' : 'reopened'} by the support team.`,
        orderId: '',
        targetId: inquiryRef.id,
        type: 'support_status',
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();
    return Response.json({ success: true });
  } catch (error) {
    return contactErrorResponse(error);
  }
}
