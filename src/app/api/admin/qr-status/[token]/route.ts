import { NextRequest } from 'next/server';
import { getAdminFirestore } from '@/firebase/server-init';
import { qrIdentity } from '@/lib/server/qr-auth';
import { qrFailure, QRRequestError, QR_RESPONSE_HEADERS } from '@/lib/qr-response';
import { QR_TOKEN_PATTERN } from '@/lib/product-identity';
import { qrStatusUpdateSchema, type QRAuditRecord, type QRStatusResponse } from '@/lib/qr-lifecycle';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    if (!QR_TOKEN_PATTERN.test(token)) throw new QRRequestError('INVALID_QR', 'Invalid QR token format.', 400);

    const authorization = request.headers.get('authorization');
    if (!authorization) throw new QRRequestError('AUTH_EXPIRED', 'Please sign in again.', 401);
    const identity = await qrIdentity(authorization);
    if (!identity.staff) throw new QRRequestError('FORBIDDEN', 'Staff access is required.', 403);

    const db = getAdminFirestore();
    const qrDoc = await db.doc(`qrLinks/${token}`).get();
    if (!qrDoc.exists) throw new QRRequestError('UNAVAILABLE', 'QR mapping not found.', 404);

    const data = qrDoc.data() || {};
    const productId = String(data.productId || '');
    const enabled = data.enabled !== false;

    // Fetch recent audits for this token
    const auditsSnap = await db.collection('qrAudits')
      .where('token', '==', token)
      .limit(5)
      .get();

    const recentAudits: QRAuditRecord[] = auditsSnap.docs
      .map(doc => ({ id: doc.id, ...(doc.data() as Omit<QRAuditRecord, 'id'>) }))
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    const response: QRStatusResponse = {
      token,
      productId,
      enabled,
      updatedAt: data.updatedAt as string | undefined,
      updatedBy: data.updatedBy as string | undefined,
      recentAudits,
    };

    return Response.json(response, { headers: QR_RESPONSE_HEADERS });
  } catch (error) {
    return qrFailure(error);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    if (!QR_TOKEN_PATTERN.test(token)) throw new QRRequestError('INVALID_QR', 'Invalid QR token format.', 400);

    const authorization = request.headers.get('authorization');
    if (!authorization) throw new QRRequestError('AUTH_EXPIRED', 'Please sign in again.', 401);
    const identity = await qrIdentity(authorization);
    if (!identity.staff) throw new QRRequestError('FORBIDDEN', 'Staff access is required.', 403);
    if (!identity.isSuperAdmin) throw new QRRequestError('FORBIDDEN', 'Only Super Admins can change QR status.', 403);

    const rawBody = await request.json().catch(() => null);
    const parsed = qrStatusUpdateSchema.safeParse(rawBody);
    if (!parsed.success) {
      throw new QRRequestError('INVALID_QR', parsed.error.issues[0]?.message || 'Invalid payload.', 400);
    }
    const { action, reason } = parsed.data;

    const db = getAdminFirestore();
    const qrRef = db.doc(`qrLinks/${token}`);

    const result = await db.runTransaction(async (transaction) => {
      const qrDoc = await transaction.get(qrRef);
      if (!qrDoc.exists) throw new QRRequestError('UNAVAILABLE', 'QR mapping not found.', 404);

      const currentData = qrDoc.data() || {};
      const currentEnabled = currentData.enabled !== false;
      const targetEnabled = action === 'ENABLE';

      const timestamp = new Date().toISOString();
      const auditRef = db.collection('qrAudits').doc();

      const auditData: QRAuditRecord = {
        token,
        productId: String(currentData.productId || ''),
        actorId: identity.uid || 'unknown',
        actorEmail: identity.email || 'unknown',
        action,
        reason: reason.trim(),
        timestamp,
        previousState: { enabled: currentEnabled },
        newState: { enabled: targetEnabled },
      };

      transaction.update(qrRef, {
        enabled: targetEnabled,
        updatedAt: timestamp,
        updatedBy: identity.email || identity.uid,
      });

      transaction.set(auditRef, auditData);

      return { enabled: targetEnabled, timestamp };
    });

    return Response.json({ ok: true, enabled: result.enabled, timestamp: result.timestamp }, { headers: QR_RESPONSE_HEADERS });
  } catch (error) {
    return qrFailure(error);
  }
}
