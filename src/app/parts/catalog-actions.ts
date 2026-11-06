'use server';

import { listPublicPartsCatalog } from '@/lib/server/public-products';
import { listPublicCatalogPage } from '@/lib/server/public-catalog-queries';

export async function fetchPublicCatalogPage(cursor: string | null) {
  return listPublicCatalogPage(cursor);
}

export async function fetchCompletePublicCatalog() {
  return listPublicPartsCatalog();
}
