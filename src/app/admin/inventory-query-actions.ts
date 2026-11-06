'use server';

import { z } from 'zod';
import { adminInventoryQuerySchema } from '@/lib/admin-inventory-query';
import { listAdminInventoryPage } from '@/lib/server/admin-inventory-queries';

const requestSchema = z.object({ idToken: z.string().min(1), options: adminInventoryQuerySchema });

export async function fetchAdminInventoryPageAction(input: unknown) {
  const parsed = requestSchema.parse(input);
  return listAdminInventoryPage(parsed.idToken, parsed.options);
}
