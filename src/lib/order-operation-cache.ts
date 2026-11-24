import { z } from 'zod';
import type { OrderOperation } from './server/order-operations';

const schema = z.object({ operationId: z.string().uuid(), expectedRevision: z.number().int().nonnegative() });
export interface OperationStorage { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void }
export function sessionOperationStorage(): OperationStorage | undefined {
  try { return typeof window === 'undefined' ? undefined : window.sessionStorage; } catch { return undefined; }
}
export function operationStorageKey(actorId: string, orderId: string, payload: unknown) {
  return `buildbot.staff-order-operation:${JSON.stringify({ actorId, orderId, payload })}`;
}
export function storedOrderOperation(storage: OperationStorage | undefined, key: string, fallback: OrderOperation): OrderOperation {
  try {
    const raw = storage?.getItem(key);
    if (raw) { const parsed = schema.safeParse(JSON.parse(raw)); if (parsed.success) return parsed.data; }
    storage?.setItem(key, JSON.stringify(fallback));
  } catch {}
  return fallback;
}
export function clearStoredOrderOperation(storage: OperationStorage | undefined, key: string) {
  try { storage?.removeItem(key); } catch {}
}
