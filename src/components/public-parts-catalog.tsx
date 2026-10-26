'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ActionIcon, Badge, Box, Button, Card, Group, Paper, Stack, Text, Tooltip } from '@mantine/core';
import { ArrowLeft, ArrowRight, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';
import { PublicPartsToolbar } from '@/components/public-parts-toolbar';
import { PaginationControls } from '@/components/pagination-controls';
import { OptimizedImage } from '@/components/ui/optimized-image';
import type { PublicCatalogPart } from '@/lib/public-product-types';
import { cn, formatCurrency } from '@/lib/utils';
import { usePublicPartsCompatibility } from '@/hooks/use-public-parts-compatibility';
import { useSiteSettings } from '@/context/site-settings-context';
import { useEcommerce } from '@/context/ecommerce-context';
import { CatalogQRButton } from '@/components/catalog-qr-button';
import { PublicPartListItem } from '@/components/public-part-list-item';

const ITEMS_PER_PAGE = 8;
type CatalogView = 'grid' | 'list';
type SortDirection = 'asc' | 'desc';

export function PublicPartsCatalog({ products, isAdminPreview = false }: { products: PublicCatalogPart[]; isAdminPreview?: boolean }) {
  const { hideIncompatible, setHideIncompatible, isCompatible } = usePublicPartsCompatibility();
  const { isEcommerceMode } = useSiteSettings();
  const { addToCart } = useEcommerce();
  const categoryNames = useMemo(() => [...new Set(products.map((product) => product.category))].sort(), [products]);
  const availableBrands = useMemo(
    () => [...new Set(products.map((product) => product.brand).filter(Boolean))].sort(),
    [products]
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
    return products
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
  }, [products, searchQuery, selectedBrands, selectedCategories, sortBy, sortDirection, hideIncompatible, hideOutOfStock, isCompatible]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const visibleProducts = filteredProducts.slice((safeCurrentPage - 1) * ITEMS_PER_PAGE, safeCurrentPage * ITEMS_PER_PAGE);
  const resetToFirstPage = () => setCurrentPage(1);

  const handleCategoryChange = (categoryName: string, selected: boolean) => {
    if (categoryName === 'All') setSelectedCategories(categoryNames);
    else {
      setSelectedCategories((current) => selected
        ? (current.includes(categoryName) ? current : [...current, categoryName])
        : current.filter((category) => category !== categoryName));
    }
    resetToFirstPage();
  };

  const handleResetFilters = () => {
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
    addToCart(
      {
        id: `part-${product.productId}`,
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
              onClearCategories={() => { setSelectedCategories([]); resetToFirstPage(); }}
              brands={availableBrands}
              selectedBrands={selectedBrands}
              onBrandChange={(brands) => { setSelectedBrands(brands); resetToFirstPage(); }}
              hideIncompatible={hideIncompatible}
              onHideIncompatibleChange={(value) => { setHideIncompatible(value); resetToFirstPage(); }}
              hideOutOfStock={hideOutOfStock}
              onHideOutOfStockChange={(value) => { setHideOutOfStock(value); resetToFirstPage(); }}
              itemCount={filteredProducts.length}
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSortChange={(by, direction) => { setSortBy(by); setSortDirection(direction); resetToFirstPage(); }}
              view={view}
              onViewChange={setView}
              searchQuery={searchQuery}
              onSearchQueryChange={(value) => { setSearchQuery(value); resetToFirstPage(); }}
              onResetAll={handleResetFilters}
            />
          </div>

          {visibleProducts.length > 0 ? (
            view === 'grid' ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                {visibleProducts.map((product, index) => (
                  <ProductCard
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

          {filteredProducts.length > 0 && (
            <div className="mt-5">
              <PaginationControls currentPage={safeCurrentPage} totalPages={totalPages} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setCurrentPage} />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
function ProductCard({
  product,
  detailHref,
  priority,
  isEcommerceMode,
  onQuickAdd,
}: {
  product: PublicCatalogPart;
  detailHref: string;
  priority: boolean;
  isEcommerceMode: boolean;
  onQuickAdd: () => void;
}) {
  return (
    <Card
      withBorder
      radius="lg"
      padding={0}
      className={cn(
        'group flex h-full flex-col justify-between overflow-hidden border-slate-200/80 bg-white/85 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-lg dark:border-white/10 dark:bg-[#111722] dark:hover:border-cyan-500/40',
        !product.inStock && 'opacity-60 grayscale'
      )}
    >
      <Stack gap={6} className="px-3 pb-2 pt-3">
        <Group justify="space-between" align="center" wrap="nowrap">
          <Badge size="xs" variant="light" color="gray" radius="sm" className="uppercase tracking-wide">{product.brand || 'Component'}</Badge>
          <Badge size="xs" variant="light" color={product.inStock ? 'teal' : 'red'} radius="sm">{product.inStock ? 'Available' : 'Out of stock'}</Badge>
        </Group>
        <Text size="sm" fw={600} lineClamp={2} className="min-h-[2.5rem] leading-snug transition-colors group-hover:text-cyan-600 dark:group-hover:text-cyan-400">{product.name}</Text>
      </Stack>
      <Link href={detailHref} aria-label={`View ${product.name}`}>
        <Box className="relative aspect-[4/3] w-full overflow-hidden border-y border-slate-200/70 bg-pure-white dark:border-white/10">
          <OptimizedImage src={product.imageUrl || '/placeholder-part.png'} alt={product.name} fill priority={priority} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw" className="object-contain p-2" />
        </Box>
      </Link>
      <Stack gap="xs" className="px-3 pb-3 pt-3">
        <Group justify="space-between" align="end" wrap="nowrap">
          <Stack gap={0}>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600} className="text-[10px] tracking-wider">Price</Text>
            <Text size="lg" fw={700} className="font-mono leading-none text-slate-900 dark:text-slate-100">{formatCurrency(product.price)}</Text>
          </Stack>
          <CatalogQRButton token={product.qrToken} sku={product.sku} productName={product.name} />
        </Group>
        <Group gap="xs" wrap="nowrap">
          <Button
            component={Link}
            href={detailHref}
            fullWidth
            radius="md"
            size="sm"
            variant="light"
            color="cyan"
            rightSection={<ArrowRight size={15} />}
            className="flex-1"
          >
            View product
          </Button>
          {isEcommerceMode && product.inStock && (
            <Tooltip label="Add to Cart" withArrow>
              <ActionIcon
                size={36}
                radius="md"
                variant="filled"
                color="teal"
                onClick={onQuickAdd}
                aria-label={`Add ${product.name} to cart`}
                className="shrink-0"
              >
                <ShoppingCart size={16} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Stack>
    </Card>
  );
}
