import type { Part } from '@/lib/types';
import { VersionedServerCache, type VersionedServerCacheOptions } from './catalog-cache';

export interface BuilderCatalogReaderOptions extends VersionedServerCacheOptions {
  loader: () => Promise<Part[]>;
  readVersion: () => Promise<number>;
}

export interface BuilderCatalogReader {
  getBuilderCatalog: () => Promise<Part[]>;
  clearBuilderCatalogCache: () => void;
  getCache: () => VersionedServerCache<Part[]>;
}

export function createBuilderCatalogReader(options: BuilderCatalogReaderOptions): BuilderCatalogReader {
  const cache = new VersionedServerCache<Part[]>(options);

  return {
    getBuilderCatalog: async () => cache.getOrLoad(options.loader, options.readVersion),
    clearBuilderCatalogCache: () => {
      cache.invalidateLocal();
    },
    getCache: () => cache,
  };
}
