import type { DecodedIdToken } from 'firebase-admin/auth';
import type { NextRequest } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/firebase/server-init';

export class ContactAuthError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'ContactAuthError';
  }
}

export function getBearerToken(request: NextRequest): string | null {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return null;
  return authorization.slice('Bearer '.length).trim() || null;
}

export async function getOptionalCustomerIdentity(token: string | null) {
  if (!token) return null;

  try {
    const decoded = await getAdminAuth().verifyIdToken(token, true);
    const profile = await getAdminFirestore().collection('users').doc(decoded.uid).get();
    if (!profile.exists) throw new ContactAuthError('Your account profile could not be verified.', 401);
    return { decoded, profile: profile.data() ?? {} };
  } catch (error) {
    if (error instanceof ContactAuthError) throw error;
    throw new ContactAuthError('Your sign-in session is invalid. Please sign in again.', 401);
  }
}

export async function requireContactStaff(token: string | null): Promise<{
  decoded: DecodedIdToken;
  name: string;
  isSuperAdmin: boolean;
}> {
  if (!token) throw new ContactAuthError('Sign in with a manager or super admin account.', 401);

  try {
    const decoded = await getAdminAuth().verifyIdToken(token, true);
    const profileSnapshot = await getAdminFirestore().collection('users').doc(decoded.uid).get();
    const profile = profileSnapshot.data();
    const isSuperAdmin = decoded.isSuperAdmin === true && profile?.isSuperAdmin === true;
    const isManager = decoded.isManager === true && profile?.isManager === true;

    if (!profileSnapshot.exists || (!isManager && !isSuperAdmin)) {
      throw new ContactAuthError('Manager or super admin access is required.', 403);
    }

    return {
      decoded,
      name: typeof profile?.name === 'string' ? profile.name : decoded.email ?? 'Staff member',
      isSuperAdmin,
    };
  } catch (error) {
    if (error instanceof ContactAuthError) throw error;
    throw new ContactAuthError('Your staff session could not be verified.', 401);
  }
}

export function contactErrorResponse(error: unknown) {
  if (error instanceof ContactAuthError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error('[Contact] Request failed:', error);
  return Response.json({ error: 'The request could not be completed. Please try again.' }, { status: 500 });
}
