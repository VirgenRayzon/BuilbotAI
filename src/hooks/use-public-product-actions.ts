'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/context/user-profile';
import { submitProductReservation, customizePublicProduct } from '@/app/public-product-actions';
import { productUrl } from '@/lib/product-identity';
import type { PublicProduct } from '@/lib/public-product-types';

export function usePublicProductActions(product: PublicProduct) {
  const { authUser, profile, loading } = useUserProfile();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const operation = useRef<string | null>(null);
  const isStaff = Boolean(profile?.isManager || profile?.isSuperAdmin);
  const run = async (customize: boolean) => {
    if (busy || loading) return;
    if (!authUser) { router.push(`/signin?returnTo=${encodeURIComponent(productUrl(product.kind, product.productId))}`); return; }
    setBusy(true); setError('');
    try {
      const idToken = await authUser.getIdToken();
      if (customize) {
        const build = await customizePublicProduct(product.productId, idToken);
        localStorage.setItem('pc_builder_load_favorite', JSON.stringify(build));
        router.push('/builder');
      } else {
        operation.current ??= crypto.randomUUID();
        const result = await submitProductReservation({ productId: product.productId, expectedPrice: product.price, idToken, operationId: operation.current });
        if (!result.success) throw new Error(result.error);
        router.push('/profile');
      }
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to complete this action.'); }
    finally { setBusy(false); }
  };
  return { busy, error, isStaff, loading, signedIn: Boolean(authUser), reserve: () => run(false), customize: () => run(true) };
}
