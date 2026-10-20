import * as admin from 'firebase-admin';
import type { NextRequest } from 'next/server';
import { getAdminFirestore } from '@/firebase/server-init';
import { contactErrorResponse, getBearerToken, requireContactStaff } from '@/lib/server/contact-auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const staff = await requireContactStaff(getBearerToken(request));
    const body = await request.json() as { inquiryId?: unknown };
    if (typeof body.inquiryId !== 'string' || !/^[a-zA-Z0-9_-]{10,128}$/.test(body.inquiryId)) {
      return Response.json({ error: 'Invalid inquiry.' }, { status: 400 });
    }
    await getAdminFirestore().collection('contactInquiries').doc(body.inquiryId).update({
      readBy: admin.firestore.FieldValue.arrayUnion(staff.decoded.uid),
    });
    return Response.json({ success: true });
  } catch (error) {
    return contactErrorResponse(error);
  }
}
