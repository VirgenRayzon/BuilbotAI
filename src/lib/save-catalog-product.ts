'use client';
import { getAuth } from 'firebase/auth';
import { submitCatalogProduct } from '@/app/product-actions';
import type { ProductKind } from './product-identity';

export async function saveCatalogProduct(kind: ProductKind, payload: unknown, source: unknown, operationId: string) {
  const user = getAuth().currentUser;
  if (!user) throw new Error('Sign in to manage inventory.');
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(source)));
  const fingerprint = Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
  const result = await submitCatalogProduct({ kind, payload, fingerprint, operationId, idToken: await user.getIdToken() });
  if (!result.success) throw new Error(result.error);
  return result.product;
}
