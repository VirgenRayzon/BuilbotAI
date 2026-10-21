import { NextRequest } from 'next/server';
import { getAdminFirestore } from '@/firebase/server-init';
import { qrIdentity } from '@/lib/server/qr-auth';
import { auditQRHealth } from '@/lib/server/qr-health';
import { qrFailure, QRRequestError, QR_RESPONSE_HEADERS } from '@/lib/qr-response';
import type { QRHealthReport } from '@/lib/qr-health';

export const dynamic = 'force-dynamic';
let cached: QRHealthReport | null = null;
let pending: Promise<QRHealthReport> | null = null;

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization');
    if (!authorization) throw new QRRequestError('AUTH_EXPIRED', 'Please sign in again.', 401);
    if (!(await qrIdentity(authorization)).staff) throw new QRRequestError('FORBIDDEN', 'Staff access is required.', 403);
    // Authorize every request before reusing a short-lived diagnostic snapshot.
    if (!cached || Date.now() - Date.parse(cached.completedAt) >= 60000) {
      pending ??= auditQRHealth(getAdminFirestore()).then(report => { cached = report; return report; }).finally(() => { pending = null; });
      await pending;
    }
    return Response.json(cached, { headers: QR_RESPONSE_HEADERS });
  } catch (error) { return qrFailure(error); }
}
