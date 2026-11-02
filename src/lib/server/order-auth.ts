import { getAdminAuth, getAdminFirestore } from '@/firebase/server-init';
import { resolveOrderRoles } from '@/lib/order-permissions';

/** Shared identity for staff actions and customer-owned order actions. */
export async function getOrderActor(idToken: string) {
  const decoded = await getAdminAuth().verifyIdToken(idToken, true);
  const firestore = getAdminFirestore();
  const actorProfile = (await firestore.collection('users').doc(decoded.uid).get()).data();
  return { decoded, firestore, actorProfile, ...resolveOrderRoles(decoded, actorProfile) };
}
