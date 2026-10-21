import { z } from 'zod';

export const qrHealthSchema = z.object({
  completedAt: z.string().datetime(),
  products: z.number().int().nonnegative(),
  archived: z.number().int().nonnegative(),
  disabled: z.number().int().nonnegative(),
  issues: z.array(z.object({ code: z.string(), message: z.string(), name: z.string(), path: z.string(), href: z.string().nullable() })),
});
export type QRHealthReport = z.infer<typeof qrHealthSchema>;
export type QRHealthRecord = { path: string; id: string; data: Record<string, unknown> };
