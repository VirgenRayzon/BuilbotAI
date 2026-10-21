import { z } from 'zod';
import { QR_TOKEN_PATTERN } from './product-identity';

export interface QRAuditRecord {
  id?: string;
  token: string;
  productId: string;
  actorId: string;
  actorEmail: string;
  action: 'ENABLE' | 'DISABLE';
  reason: string;
  timestamp: string;
  previousState: { enabled: boolean };
  newState: { enabled: boolean };
}

export interface QRStatusResponse {
  token: string;
  productId: string;
  enabled: boolean;
  updatedAt?: string;
  updatedBy?: string;
  recentAudits: QRAuditRecord[];
}

export const qrStatusUpdateSchema = z.object({
  action: z.enum(['ENABLE', 'DISABLE']),
  reason: z.string().trim().max(500),
}).refine(data => {
  if (data.action === 'DISABLE') {
    return data.reason.length >= 3;
  }
  return true;
}, {
  message: 'A reason of at least 3 characters is required to disable a QR code.',
  path: ['reason'],
});

export type QRStatusUpdatePayload = z.infer<typeof qrStatusUpdateSchema>;
