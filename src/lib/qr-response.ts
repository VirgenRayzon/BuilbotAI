import { z } from 'zod';

export const qrErrorCode = z.enum(['INVALID_QR', 'UNAVAILABLE', 'AUTH_EXPIRED', 'SERVICE_UNAVAILABLE', 'RATE_LIMITED', 'FORBIDDEN']);
export type QRErrorCode = z.infer<typeof qrErrorCode>;
export const qrErrorSchema = z.object({ code: qrErrorCode, error: z.string() });
export const qrDestinationSchema = z.object({ destination: z.string().regex(/^\/(?:admin\?tab=(?:stock&product=PRD-\d{6,}(?:&action=stock)?|prebuilts&product=PRD-\d{6,}|archive&product=PRD-\d{6,})|(?:parts|pre-builts)\/PRD-\d{6,})$/) });
export const QR_RESPONSE_HEADERS = { 'Cache-Control': 'private, no-store', Vary: 'Authorization' };

export class QRRequestError extends Error {
  constructor(public code: QRErrorCode, message: string, public status: number) { super(message); }
}

export function qrFailure(error: unknown) {
  if (error instanceof QRRequestError) return Response.json({ code: error.code, error: error.message }, { status: error.status, headers: QR_RESPONSE_HEADERS });
  // Never log bearer tokens, profiles or database document contents.
  console.error('[QR] Request failed', error instanceof Error ? error.name : 'UnknownError');
  return Response.json({ code: 'SERVICE_UNAVAILABLE', error: 'Could not reach the QR service. Please retry.' }, { status: 503, headers: QR_RESPONSE_HEADERS });
}
