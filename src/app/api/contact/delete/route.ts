import * as admin from 'firebase-admin';
import type { NextRequest } from 'next/server';
import { getAdminFirestore } from '@/firebase/server-init';
import { z } from 'zod';
import {
  contactErrorResponse,
  getBearerToken,
  getOptionalCustomerIdentity,
  requireContactStaff,
} from '@/lib/server/contact-auth';

export const runtime = 'nodejs';

const deleteInquirySchema = z.object({
  inquiryId: z.string().min(1).max(128),
});

async function handleDelete(request: NextRequest) {
  try {
    const token = getBearerToken(request);
    if (!token) {
      return Response.json({ error: 'Sign in to delete conversations.' }, { status: 401 });
    }

    let inquiryId: string | null = null;
    if (request.method === 'DELETE') {
      const url = new URL(request.url);
      inquiryId = url.searchParams.get('inquiryId');
    }

    if (!inquiryId) {
      const body = await request.json().catch(() => ({}));
      const parsed = deleteInquirySchema.safeParse(body);
      if (parsed.success) {
        inquiryId = parsed.data.inquiryId;
      }
    }

    if (!inquiryId) {
      return Response.json({ error: 'Invalid or missing conversation ID.' }, { status: 400 });
    }

    const firestore = getAdminFirestore();
    const inquiryRef = firestore.collection('contactInquiries').doc(inquiryId);
    const snapshot = await inquiryRef.get();
    if (!snapshot.exists) {
      return Response.json({ error: 'This conversation could not be found.' }, { status: 404 });
    }

    const inquiry = snapshot.data();

    // Verify permission: Must be either staff or the customer who owns the inquiry
    try {
      await requireContactStaff(token);
    } catch {
      const customer = await getOptionalCustomerIdentity(token);
      if (!customer || inquiry?.userId !== customer.decoded.uid) {
        return Response.json(
          { error: 'You do not have permission to delete this conversation.' },
          { status: 403 }
        );
      }
    }

    // Delete subcollection messages in batch
    const messagesSnapshot = await inquiryRef.collection('messages').get();
    const batch = firestore.batch();
    for (const messageDoc of messagesSnapshot.docs) {
      batch.delete(messageDoc.ref);
    }

    // Delete the inquiry document
    batch.delete(inquiryRef);
    await batch.commit();

    return Response.json({ success: true });
  } catch (error) {
    return contactErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  return handleDelete(request);
}

export async function DELETE(request: NextRequest) {
  return handleDelete(request);
}
