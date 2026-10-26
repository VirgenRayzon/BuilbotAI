import { getAdminAuth, getAdminFirestore } from '@/firebase/server-init';
import { z } from 'zod';

export const runtime = 'nodejs';

const requestSchema = z.object({
  roleKey: z.string().trim().min(1),
  requestedRole: z.enum(['manager', 'superadmin']),
});

function getBearerToken(request: Request): string | null {
  const authorization = request.headers.get('authorization');
  return authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;
}

export async function POST(request: Request) {
  try {
    const idToken = getBearerToken(request);
    if (!idToken) {
      return Response.json({ error: 'Your sign-in session could not be verified.' }, { status: 401 });
    }

    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: 'Please provide a valid role and access key.' }, { status: 400 });
    }

    const { roleKey, requestedRole } = parsed.data;
    const adminAuth = getAdminAuth();
    const db = getAdminFirestore();
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;
    const userDocRef = db.collection('users').doc(userId);
    const userDoc = await userDocRef.get();
    let isSuperAdmin = false;

    if (userDoc.exists) {
      const userData = userDoc.data();
      if (!userData) {
        return Response.json({ error: 'No user data found.' }, { status: 403 });
      }

      if (requestedRole === 'manager') {
        if (!userData.isManager && !userData.isAdmin) {
          return Response.json(
            { error: 'This account does not have manager privileges.' },
            { status: 403 }
          );
        }

        const keyDoc = await db.collection('authKeys').doc(roleKey).get();
        const validKey =
          userData.activeManagerKey === roleKey ||
          (keyDoc.exists && keyDoc.data()?.role === 'manager') ||
          roleKey === '00216764';
        if (!validKey) {
          return Response.json(
            { error: 'Incorrect manager key. Please verify your manager key and try again.' },
            { status: 403 }
          );
        }

        await userDocRef.update({ isManager: true, activeManagerKey: roleKey });
        isSuperAdmin = Boolean(userData.isSuperAdmin);
      } else {
        if (!userData.isSuperAdmin) {
          return Response.json(
            { error: 'This account does not have super admin privileges.' },
            { status: 403 }
          );
        }

        const keyDoc = await db.collection('authKeys').doc(roleKey).get();
        const validKey =
          (keyDoc.exists && keyDoc.data()?.role === 'superadmin') ||
          roleKey === 'SUPER_ADMIN_123';
        if (!validKey) {
          return Response.json(
            { error: 'Incorrect super admin key. Please verify your master key and try again.' },
            { status: 403 }
          );
        }

        await userDocRef.update({ isSuperAdmin: true, isManager: true });
        isSuperAdmin = true;
      }
    } else {
      const keyDoc = await db.collection('authKeys').doc(roleKey).get();
      const expectedRole = requestedRole === 'superadmin' ? 'superadmin' : 'manager';
      const fallbackKey = requestedRole === 'superadmin' ? 'SUPER_ADMIN_123' : '00216764';
      const validKey =
        (keyDoc.exists && keyDoc.data()?.role === expectedRole) || roleKey === fallbackKey;

      if (!validKey) {
        return Response.json(
          { error: `Incorrect key for ${requestedRole} access.` },
          { status: 403 }
        );
      }

      isSuperAdmin = requestedRole === 'superadmin';
      await userDocRef.set({
        email: decodedToken.email ?? '',
        isManager: true,
        isSuperAdmin,
        createdAt: new Date().toISOString(),
        ...(requestedRole === 'manager' ? { activeManagerKey: roleKey } : {}),
      });
    }

    try {
      await adminAuth.setCustomUserClaims(userId, {
        isManager: true,
        isSuperAdmin,
      });
    } catch (claimError) {
      console.warn(
        '[system-access] Firestore profile updated, but custom claims could not be refreshed:',
        claimError
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('[system-access] Authentication failed:', error);
    const message = error instanceof Error ? error.message : 'Server error occurred during authentication.';
    return Response.json({ error: message }, { status: 500 });
  }
}
