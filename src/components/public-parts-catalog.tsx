'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ActionIcon, Badge, Box, Button, Card, Group, Paper, Stack, Text, Tooltip } from '@mantine/core';
import { ArrowRight, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';
import { InventoryToolbar } from '@/components/inventory-toolbar';
import { PaginationControls } from '@/components/pagination-controls';
import { OptimizedImage } from '@/components/ui/optimized-image';
import type { PublicCatalogPart } from '@/lib/public-product-types';
import { cn, formatCurrency } from '@/lib/utils';
import { usePublicPartsCompatibility } from '@/hooks/use-public-parts-compatibility';
import { useSiteSettings } from '@/context/site-settings-context';
import { useEcommerce } from '@/context/ecommerce-context';
import { CatalogQRButton } from '@/components/catalog-qr-button';

const ITEMS_PER_PAGE = 8;
type CatalogView = 'grid' | 'list';
type SortDirection = 'asc' | 'desc';

export function PublicPartsCatalog({ products }: { products: PublicCatalogPart[] }) {
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
  const [view, setView] = useState<CatalogView>('grid');
  const [currentPage, setCurrentPage] = useState(1);

  const categories = categoryNames.map((name) => ({ name, selected: selectedCategories.includes(name) }));
  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const direction = sortDirection === 'asc' ? 1 : -1;
    return products
      .filter((product) => {
        const searchableText = `${product.name} ${product.brand} ${product.sku} ${product.productId}`.toLowerCase();
        return selectedCategories.includes(product.category)
          && (selectedBrands.length === 0 || selectedBrands.includes(product.brand))
          && (!hideIncompatible || isCompatible(product))
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
  }, [products, searchQuery, selectedBrands, selectedCategories, sortBy, sortDirection, hideIncompatible, isCompatible]);

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
        <motion.header initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="mb-4 flex flex-col gap-0.5">
          <span className="font-headline text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400">Parts Catalog</span>
          <h1 className="font-headline text-2xl font-bold uppercase tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
            Explore PC <span className="italic text-cyan-600 dark:text-cyan-400">Components</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">Browse specifications, compare current pricing, and check component availability.</p>
        </motion.header>

        <section aria-label="Parts catalog">
          <div className="mb-4">
            <InventoryToolbar
              categories={categories}
              onCategoryChange={handleCategoryChange}
              itemCount={filteredProducts.length}
              sortBy={sortBy}
              onSortByChange={(value) => { setSortBy(value); resetToFirstPage(); }}
              sortDirection={sortDirection}
              onSortDirectionChange={(value) => { setSortDirection(value); resetToFirstPage(); }}
              supportedSorts={['Date Added', 'Name', 'Price']}
              view={view}
              onViewChange={setView}
              showViewToggle
              searchQuery={searchQuery}
              onSearchQueryChange={(value) => { setSearchQuery(value); resetToFirstPage(); }}
              availableBrands={availableBrands}
              selectedBrands={selectedBrands}
              onBrandChange={(brands) => { setSelectedBrands(brands); resetToFirstPage(); }}
              hideIncompatible={hideIncompatible}
              onHideIncompatibleChange={(value) => { setHideIncompatible(value); resetToFirstPage(); }}
            />
          </div>

          {visibleProducts.length > 0 ? (
            view === 'grid' ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                {visibleProducts.map((product, index) => (
                  <ProductCard
                    key={product.productId}
                    product={product}
                    priority={index < 4}
                    isEcommerceMode={isEcommerceMode}
                    onQuickAdd={() => handleQuickAdd(product)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {visibleProducts.map((product, index) => (
                  <ProductListItem
                    key={product.productId}
                    product={product}
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
  priority,
  isEcommerceMode,
  onQuickAdd,
}: {
  product: PublicCatalogPart;
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
      <Link href={`/parts/${product.productId}`} aria-label={`View ${product.name}`}>
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
            href={`/parts/${product.productId}`}
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

function ProductListItem({
  product,
  priority,
  isEcommerceMode,
  onQuickAdd,
}: {
  product: PublicCatalogPart;
  priority: boolean;
  isEcommerceMode: boolean;
  onQuickAdd: () => void;
}) {
  return (
    <Paper withBorder radius="lg" p={12} className={cn('border-slate-200/80 bg-white/85 dark:border-white/10 dark:bg-[#111722]', !product.inStock && 'opacity-60 grayscale')}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link href={`/parts/${product.productId}`} className="relative h-36 w-full shrink-0 overflow-hidden rounded-lg border border-slate-200/70 bg-pure-white sm:h-24 sm:w-32 dark:border-white/10">
          <OptimizedImage src={product.imageUrl || '/placeholder-part.png'} alt={product.name} fill priority={priority} sizes="(max-width: 640px) 100vw, 128px" className="object-contain p-2" />
        </Link>
        <div className="min-w-0 flex-1">
          <Group gap="xs" mb={4}>
            <Badge size="xs" variant="light" color="gray">{product.brand || product.category}</Badge>
            <Badge size="xs" variant="light" color={product.inStock ? 'teal' : 'red'}>{product.inStock ? 'Available' : 'Out of stock'}</Badge>
          </Group>
          <Text fw={650} lineClamp={2}>{product.name}</Text>
          <Text size="xs" c="dimmed" ff="monospace">{product.sku}</Text>
        </div>
        <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
          <Group gap="xs" wrap="nowrap">
            <Text fw={700} className="font-mono text-slate-900 dark:text-slate-100">{formatCurrency(product.price)}</Text>
            <CatalogQRButton token={product.qrToken} sku={product.sku} productName={product.name} />
          </Group>
          <Group gap="xs">
            <Button component={Link} href={`/parts/${product.productId}`} radius="md" size="sm" variant="light" color="cyan" rightSection={<ArrowRight size={15} />}>View product</Button>
            {isEcommerceMode && product.inStock && (
              <Button
                radius="md"
                size="sm"
                variant="filled"
                color="teal"
                leftSection={<ShoppingCart size={15} />}
                onClick={onQuickAdd}
              >
                Add to Cart
              </Button>
            )}
          </Group>
        </div>
      </div>
    </Paper>
  );
}
