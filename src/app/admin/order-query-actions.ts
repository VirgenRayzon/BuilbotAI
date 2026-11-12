'use server';

import { listAdminOrdersPage } from '@/lib/server/admin-order-queries';

export async function fetchAdminOrdersPageAction(input: {
  idToken: string;
  options: unknown;
}) {
  return listAdminOrdersPage(input.idToken, input.options);
}
