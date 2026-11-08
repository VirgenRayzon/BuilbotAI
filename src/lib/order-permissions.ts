export interface OrderRoleFlags {
  [key: string]: unknown;
  isManager?: unknown;
  isSuperAdmin?: unknown;
}

export function resolveOrderRoles(claims: OrderRoleFlags, profile?: OrderRoleFlags | null) {
  const isManager = claims.isManager === true && profile?.isManager === true;
  const isSuperAdmin = claims.isSuperAdmin === true && profile?.isSuperAdmin === true;
  if ((claims.isManager === true) !== (profile?.isManager === true) ||
      (claims.isSuperAdmin === true) !== (profile?.isSuperAdmin === true)) {
    throw new Error('Your staff access has changed. Sign in again through System Access.');
  }
  return { isManager, isSuperAdmin, isStaff: isManager || isSuperAdmin };
}

export function assertOrderTestEnvironment(env: Readonly<Record<string, string | undefined>>) {
  if (!env.FIRESTORE_EMULATOR_HOST || !env.FIREBASE_AUTH_EMULATOR_HOST ||
      !env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.startsWith('demo-')) {
    throw new Error('Permanent order deletion, reset, and seeding are limited to demo Firebase emulators. Archive real orders to preserve their history.');
  }
}
