import { safeProductReturn } from '@/lib/product-identity';

export const PUBLIC_FEATURE_SIGN_IN_REASON = 'feature_required' as const;
export const PUBLIC_FEATURE_SIGN_IN_URL = `/signin?reason=${PUBLIC_FEATURE_SIGN_IN_REASON}`;

export function getCustomerSignInDestination(
  reason: string | null,
  returnTo: string | null
): string {
  if (reason === PUBLIC_FEATURE_SIGN_IN_REASON) return '/builder';
  return safeProductReturn(returnTo);
}
