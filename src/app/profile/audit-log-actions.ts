'use server';

import {
  listStaffAuditLogsPage,
  listUserAuditLogsPage,
  type StaffAuditLogsPageResult,
  type UserAuditLogsPageResult,
} from '@/lib/server/audit-log-queries';

export type FetchStaffAuditLogsResponse =
  | ({ success: true } & StaffAuditLogsPageResult)
  | { success: false; error: string; logs: []; totalCount: number; nextCursor: null; hasMore: false };

export type FetchUserAuditLogsResponse =
  | ({ success: true } & UserAuditLogsPageResult)
  | { success: false; error: string; logs: []; totalCount: number; nextCursor: null; hasMore: false };

export async function fetchStaffAuditLogsPageAction(
  idToken: string,
  rawOptions?: unknown
): Promise<FetchStaffAuditLogsResponse> {
  try {
    const result = await listStaffAuditLogsPage(idToken, rawOptions);
    return { success: true, ...result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not fetch staff audit logs.';
    return {
      success: false,
      error: message,
      logs: [],
      totalCount: 0,
      nextCursor: null,
      hasMore: false,
    };
  }
}

export async function fetchUserAuditLogsPageAction(
  idToken: string,
  rawOptions?: unknown
): Promise<FetchUserAuditLogsResponse> {
  try {
    const result = await listUserAuditLogsPage(idToken, rawOptions);
    return { success: true, ...result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not fetch user audit logs.';
    return {
      success: false,
      error: message,
      logs: [],
      totalCount: 0,
      nextCursor: null,
      hasMore: false,
    };
  }
}
