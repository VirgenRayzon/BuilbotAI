"use server";

import { randomUUID } from 'node:crypto';
import { getAdminAuth, getAdminFirestore } from '@/firebase/server-init';
import { reservePublicProduct } from './public-product-actions';

/** Compatibility adapter: legacy pages reserve using authoritative server product data. */
export async function reservePrebuiltSystem(
  userId: string,
  _userEmail: string,
  _userName: string,
  system: { id: string; name: string; price: number },
  _components: Record<string, { id: string; name: string; price: number; category: string }>,
  idToken?: string,
  operationId: string = randomUUID(),
) {
  try {
    if (!idToken) throw new Error('Sign in to reserve this system.');
    const user = await getAdminAuth().verifyIdToken(idToken, true);
    if (user.uid !== userId || !/^[\w-]{1,128}$/.test(system.id)) throw new Error('Invalid reservation request.');
    const record = await getAdminFirestore().doc(`prebuiltSystems/${system.id}`).get();
    const productId = record.get('productId');
    if (!record.exists || !productId) throw new Error('This product is unavailable or awaiting catalog migration.');
    const result = await reservePublicProduct({ productId, idToken, operationId });
    return { success: true as const, orderId: result.orderId };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : 'Could not reserve this system.' };
  }
}
