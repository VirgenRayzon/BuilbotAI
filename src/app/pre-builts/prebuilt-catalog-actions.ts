'use server';

import { listPrebuiltSystemsPage } from '@/lib/server/prebuilt-queries';

export async function fetchPrebuiltSystemsPageAction(rawOptions: unknown) {
  try {
    const result = await listPrebuiltSystemsPage(rawOptions);
    return { success: true as const, ...result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not fetch prebuilt systems.';
    return { success: false as const, error: message, items: [], nextCursor: null, hasMore: false };
  }
}
