'use server';

import { z } from 'zod';
import {
  getAccountInspectionDetails,
  listManagedAccounts,
  purgeUserAccount,
  resetManagerKeyServer,
  revokeAccountSessions,
  setAccountSuspension,
  updateAccountRole,
} from '@/lib/server/account-management';
import type {
  AccountInspectionDetails,
  AccountPurgeResult,
  ManagedAccountSummary,
} from '@/lib/management-portal-types';

const tokenSchema = z.string().min(10).max(8192);
const uidSchema = z.string().min(1).max(128);

export async function listManagedAccountsAction(
  idToken: string
): Promise<{ accounts: ManagedAccountSummary[]; error?: string }> {
  const parsed = tokenSchema.safeParse(idToken);
  if (!parsed.success) {
    return { accounts: [], error: 'Authentication token is required.' };
  }
  return listManagedAccounts(parsed.data);
}

export async function inspectManagedAccountAction(input: {
  idToken: string;
  targetUid: string;
}): Promise<{ details?: AccountInspectionDetails; error?: string }> {
  const parsed = z
    .object({ idToken: tokenSchema, targetUid: uidSchema })
    .safeParse(input);
  if (!parsed.success) {
    return { error: 'Invalid inspection request.' };
  }
  return getAccountInspectionDetails(parsed.data.idToken, parsed.data.targetUid);
}

export async function updateManagedAccountRoleAction(input: {
  idToken: string;
  targetUid: string;
  nextRole: 'manager' | 'customer';
}): Promise<{ success: boolean; newKey?: string; error?: string }> {
  const parsed = z
    .object({
      idToken: tokenSchema,
      targetUid: uidSchema,
      nextRole: z.enum(['manager', 'customer']),
    })
    .safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Invalid role update request.' };
  }
  return updateAccountRole(
    parsed.data.idToken,
    parsed.data.targetUid,
    parsed.data.nextRole
  );
}

export async function resetManagedManagerKeyAction(input: {
  idToken: string;
  targetUid: string;
}): Promise<{ success: boolean; newKey?: string; error?: string }> {
  const parsed = z
    .object({ idToken: tokenSchema, targetUid: uidSchema })
    .safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Invalid key reset request.' };
  }
  return resetManagerKeyServer(parsed.data.idToken, parsed.data.targetUid);
}

export async function setAccountSuspensionAction(input: {
  idToken: string;
  targetUid: string;
  disabled: boolean;
}): Promise<{ success: boolean; error?: string }> {
  const parsed = z
    .object({
      idToken: tokenSchema,
      targetUid: uidSchema,
      disabled: z.boolean(),
    })
    .safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Invalid suspension request.' };
  }
  return setAccountSuspension(
    parsed.data.idToken,
    parsed.data.targetUid,
    parsed.data.disabled
  );
}

export async function revokeAccountSessionsAction(input: {
  idToken: string;
  targetUid: string;
}): Promise<{ success: boolean; error?: string }> {
  const parsed = z
    .object({ idToken: tokenSchema, targetUid: uidSchema })
    .safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Invalid session revocation request.' };
  }
  return revokeAccountSessions(parsed.data.idToken, parsed.data.targetUid);
}

export async function purgeManagedUserAccountAction(input: {
  idToken: string;
  targetUid: string;
}): Promise<AccountPurgeResult> {
  const parsed = z
    .object({ idToken: tokenSchema, targetUid: uidSchema })
    .safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Invalid purge request.' };
  }
  return purgeUserAccount(parsed.data.idToken, parsed.data.targetUid);
}

