import { getAdminAuth, getAdminFirestore } from '@/firebase/server-init';
import { QRRequestError } from '../qr-response';

export async function qrIdentity(authorization: string | null) {
  if (!authorization) return { staff: false };
  const bearer = authorization.match(/^Bearer (\S+)$/)?.[1];
  if (!bearer) throw new QRRequestError('AUTH_EXPIRED', 'Please sign in again.', 401);
  let user;
  try { user = await getAdminAuth().verifyIdToken(bearer, true); }
  catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
    if (['auth/argument-error', 'auth/invalid-id-token', 'auth/id-token-expired', 'auth/id-token-revoked', 'auth/user-disabled', 'auth/user-not-found'].includes(code)) {
      throw new QRRequestError('AUTH_EXPIRED', 'Please sign in again.', 401);
    }
    throw error;
  }
  const profile = (await getAdminFirestore().doc(`users/${user.uid}`).get()).data();
  const isManager = Boolean(user.isManager === true && profile?.isManager === true);
  const isSuperAdmin = Boolean(user.isSuperAdmin === true && profile?.isSuperAdmin === true);
  const staff = isManager || isSuperAdmin;
  if (!staff && (user.isManager === true || user.isSuperAdmin === true || profile?.isManager === true || profile?.isSuperAdmin === true)) {
    throw new QRRequestError('AUTH_EXPIRED', 'Your staff access has changed. Please sign in again.', 401);
  }
  return { staff, isManager, isSuperAdmin, uid: user.uid, email: user.email || (profile?.email as string) || '' };

}

