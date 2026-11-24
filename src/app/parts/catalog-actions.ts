'use server';

import { listPublicPartsCatalog } from '@/lib/server/public-products';
import { listPublicCatalogPage, type PublicCatalogQuery } from '@/lib/server/public-catalog-queries';

export async function fetchPublicCatalogPage(input: string | null | PublicCatalogQuery = null) {
  return listPublicCatalogPage(input);
}

export async function fetchCompletePublicCatalog() {
  return listPublicPartsCatalog();
}
