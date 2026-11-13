'use server';

import { listAdminOrdersPage, serializeFirestoreData } from '@/lib/server/admin-order-queries';

export async function fetchAdminOrdersPageAction(input: {
  idToken: string;
  options: unknown;
}) {
  const result = await listAdminOrdersPage(input.idToken, input.options);
  return serializeFirestoreData(result);
}
