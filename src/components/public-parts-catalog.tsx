'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Button, Paper, Text } from '@mantine/core';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { PublicPartsToolbar } from '@/components/public-parts-toolbar';
import { CategorySelectionEmpty } from '@/components/category-selection-empty';
import { PaginationControls } from '@/components/pagination-controls';
import type { PublicCatalogPart } from '@/lib/public-product-types';
import { usePublicPartsCompatibility } from '@/hooks/use-public-parts-compatibility';
import { useSiteSettings } from '@/context/site-settings-context';
import { useEcommerce } from '@/context/ecommerce-context';
import { PublicPartListItem } from '@/components/public-part-list-item';
import { PublicPartCard } from '@/components/public-part-card';
import { INVENTORY_CATEGORY_LABELS } from '@/lib/inventory-paths';
import type { PublicCatalogPage } from '@/lib/server/public-catalog-queries';
import { fetchCompletePublicCatalog, fetchPublicCatalogPage } from '@/app/parts/catalog-actions';
import { usePublicFeatureAuth } from '@/hooks/use-public-feature-auth';

const ITEMS_PER_PAGE = 8;
type CatalogView = 'grid' | 'list';
type SortDirection = 'asc' | 'desc';

export function PublicPartsCatalog({ products, initialPage, isAdminPreview = false }: { products: PublicCatalogPart[]; initialPage?: PublicCatalogPage; isAdminPreview?: boolean }) {
  const { hideIncompatible, setHideIncompatible, isCompatible } = usePublicPartsCompatibility();
  const { isEcommerceMode } = useSiteSettings();
  const { addToCart } = useEcommerce();
  const { requireAuth } = usePublicFeatureAuth();
  const [pageProducts, setPageProducts] = useState(products);
  const [pageCount, setPageCount] = useState(initialPage?.count ?? products.length);
  const [completeProducts, setCompleteProducts] = useState<PublicCatalogPart[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const completeRequested = useRef(false);
  const cursors = useRef<Array<string | null>>([null, initialPage?.nextCursor ?? null]);
  const catalogProducts = completeProducts ?? pageProducts;
  const paged = Boolean(initialPage) && !completeRequested.current;
  const categoryNames = useMemo(() => initialPage && !completeProducts
    ? Object.values(INVENTORY_CATEGORY_LABELS).sort()
    : [...new Set(catalogProducts.map((product) => product.category))].sort(), [catalogProducts, completeProducts, initialPage]);
  const availableBrands = useMemo(
    () => [...new Set(catalogProducts.map((product) => product.brand).filter(Boolean))].sort(),
    [catalogProducts]
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState(categoryNames);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('Date Added');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [hideOutOfStock, setHideOutOfStock] = useState(false);
  const [view, setView] = useState<CatalogView>('grid');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const direction = sortDirection === 'asc' ? 1 : -1;
    return catalogProducts
      .filter((product) => {
        const searchableText = `${product.name} ${product.brand} ${product.sku} ${product.productId}`.toLowerCase();
        return selectedCategories.includes(product.category)
          && (selectedBrands.length === 0 || selectedBrands.includes(product.brand))
          && (!hideIncompatible || isCompatible(product))
          && (!hideOutOfStock || product.inStock)
          && searchableText.includes(normalizedQuery);
      })
      .sort((a, b) => {
        if (a.inStock !== b.inStock) {
          return a.inStock ? -1 : 1;
        }
        const comparison = sortBy === 'Price'
          ? a.price - b.price
          : sortBy === 'Date Added'
            ? a.createdAt - b.createdAt || a.productId.localeCompare(b.productId)
            : a.name.localeCompare(b.name);
        return comparison * direction;
      });
  }, [catalogProducts, searchQuery, selectedBrands, selectedCategories, sortBy, sortDirection, hideIncompatible, hideOutOfStock, isCompatible]);

  const resultCount = paged ? pageCount : filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(resultCount / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const visibleProducts = paged ? filteredProducts : filteredProducts.slice((safeCurrentPage - 1) * ITEMS_PER_PAGE, safeCurrentPage * ITEMS_PER_PAGE);
  const resetToFirstPage = () => setCurrentPage(1);

  const requestCompleteCatalog = () => {
    if (!initialPage || completeRequested.current) return;
    completeRequested.current = true;
    setLoading(true);
    setLoadError(null);
    fetchCompletePublicCatalog().then(all => {
      setCompleteProducts(all);
      setCurrentPage(1);
      setLoading(false);
    }).catch(() => {
      completeRequested.current = false;
      setLoadError('Could not load the complete catalog. Please retry.');
      setLoading(false);
    });
  };

  const handlePageChange = (target: number) => {
    if (!paged) { setCurrentPage(target); return; }
    const cursor = cursors.current[target - 1];
    if (target < 1 || target > totalPages || (target > 1 && !cursor)) return;
    setLoading(true);
    setLoadError(null);
    fetchPublicCatalogPage(cursor ?? null).then(result => {
      if (completeRequested.current) return;
      setPageProducts(result.products);
      setPageCount(result.count);
      cursors.current[target] = result.nextCursor;
      setCurrentPage(target);
      setLoading(false);
    }).catch((error: unknown) => {
      if (error instanceof Error && error.message.includes('cursor is stale')) {
        cursors.current = [null, initialPage?.nextCursor ?? null];
        setCurrentPage(1);
      }
      setLoadError('Could not load this page. Please retry.');
      setLoading(false);
    });
  };

  const handleCategoryChange = (categoryName: string, selected: boolean) => {
    requestCompleteCatalog();
    if (categoryName === 'All') setSelectedCategories(categoryNames);
    else {
      setSelectedCategories((current) => selected
        ? (current.includes(categoryName) ? current : [...current, categoryName])
        : current.filter((category) => category !== categoryName));
    }
    resetToFirstPage();
  };

  const handleResetFilters = () => {
    requestCompleteCatalog();
    setSelectedCategories(categoryNames);
    setSelectedBrands([]);
    setHideIncompatible(false);
    setHideOutOfStock(false);
    setSortBy('Date Added');
    setSortDirection('desc');
    resetToFirstPage();
  };

  const handleQuickAdd = (product: PublicCatalogPart) => {
    if (!product.inStock) return;
    requireAuth(() => {
      addToCart(
        {
          id: `part-${product.productId}`,
          productId: product.productId,
          kind: 'part',
          name: product.name,
          price: product.price,
          category: product.category,
          brand: product.brand,
          sku: product.sku,
          imageUrl: product.imageUrl,
        },
        true
      );
    });
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 transition-colors dark:bg-[#0c0f14] dark:text-slate-50">
      <main className="relative z-10 w-full max-w-[1600px] mx-auto px-4 py-4 pb-24 sm:px-6 md:px-8 lg:px-8 xl:px-10 lg:pb-12">
        {isAdminPreview && (
          <div className="mb-2">
            <Button component={Link} href="/admin" variant="subtle" color="gray" size="xs" leftSection={<ArrowLeft className="h-3.5 w-3.5" />} className="text-xs font-semibold uppercase tracking-wider text-slate-600 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400">
              Back to Dashboard
            </Button>
          </div>
        )}
        <motion.header initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="mb-4 flex flex-col gap-0.5">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="font-headline text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400">Parts Catalog</span>
            <h1 className="font-headline text-2xl font-bold uppercase tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
              Explore PC <span className="italic text-cyan-600 dark:text-cyan-400">Components</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">Browse specifications, compare current pricing, and check component availability.</p>
          </div>
        </motion.header>

        <section aria-label="Parts catalog">
          <div className="mb-4">
            <PublicPartsToolbar
              categories={categoryNames}
              selectedCategories={selectedCategories}
              onCategoryChange={handleCategoryChange}
              onClearCategories={() => { requestCompleteCatalog(); setSelectedCategories([]); resetToFirstPage(); }}
              brands={availableBrands}
              selectedBrands={selectedBrands}
              onBrandChange={(brands) => { requestCompleteCatalog(); setSelectedBrands(brands); resetToFirstPage(); }}
              hideIncompatible={hideIncompatible}
              onHideIncompatibleChange={(value) => { requestCompleteCatalog(); setHideIncompatible(value); resetToFirstPage(); }}
              hideOutOfStock={hideOutOfStock}
              onHideOutOfStockChange={(value) => { requestCompleteCatalog(); setHideOutOfStock(value); resetToFirstPage(); }}
              itemCount={resultCount}
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSortChange={(by, direction) => { requestCompleteCatalog(); setSortBy(by); setSortDirection(direction); resetToFirstPage(); }}
              view={view}
              onViewChange={setView}
              searchQuery={searchQuery}
              onSearchQueryChange={(value) => { requestCompleteCatalog(); setSearchQuery(value); resetToFirstPage(); }}
              onResetAll={handleResetFilters}
              onFiltersOpen={requestCompleteCatalog}
            />
          </div>

          {loadError && <Paper withBorder radius="lg" p={12} role="alert"><Text>{loadError}</Text><Button variant="subtle" onClick={paged ? () => handlePageChange(currentPage) : requestCompleteCatalog}>Retry</Button></Paper>}
          {selectedCategories.length === 0 ? (
            <CategorySelectionEmpty itemLabel="parts" onSelectAll={() => handleCategoryChange('All', true)} />
          ) : loading ? <Paper withBorder radius="lg" p={12}><Text>Loading parts…</Text></Paper> : visibleProducts.length > 0 ? (
            view === 'grid' ? (
              <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                {visibleProducts.map((product, index) => (
                  <PublicPartCard
                    key={product.productId}
                    product={product}
                    detailHref={`/parts/${product.productId}${isAdminPreview ? '?preview=admin' : ''}`}
                    priority={index < 4}
                    isEcommerceMode={isEcommerceMode}
                    onQuickAdd={() => handleQuickAdd(product)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {visibleProducts.map((product, index) => (
                  <PublicPartListItem
                    key={product.productId}
                    product={product}
                    detailHref={`/parts/${product.productId}${isAdminPreview ? '?preview=admin' : ''}`}
                    priority={index < 2}
                    isEcommerceMode={isEcommerceMode}
                    onQuickAdd={() => handleQuickAdd(product)}
                  />
                ))}
              </div>
            )
          ) : (
            <Paper withBorder radius="lg" p={12} className="border-slate-200/80 bg-white/85 dark:border-white/10 dark:bg-[#111722]">
              <Text fw={600}>No parts match your filters.</Text>
              <Text size="sm" c="dimmed">Try another search term or broaden the selected categories and brands.</Text>
            </Paper>
          )}

          {resultCount > 0 && !loading && (
            <div className="mt-5">
              <PaginationControls currentPage={safeCurrentPage} totalPages={totalPages} itemsPerPage={ITEMS_PER_PAGE} onPageChange={handlePageChange} cursorMode={paged} />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
