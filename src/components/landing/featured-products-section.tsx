'use client';
import { CatalogCardSkeleton, catalogCardLayout } from '@/components/loading/catalog-card-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge, Box, Button, Card, Group, Paper, Stack, Text } from '@mantine/core';
import { ArrowRight } from 'lucide-react';
import { z } from 'zod';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { SectionHeader } from '@/components/landing/section-header';
import { useNearViewport } from '@/hooks/use-near-viewport';
import { formatCurrency } from '@/lib/utils';

const featuredProductSchema = z.object({
  productId: z.string(),
  name: z.string(),
  category: z.string(),
  brand: z.string(),
  price: z.number().finite(),
  imageUrl: z.string(),
  inStock: z.boolean(),
});

type FeaturedProduct = z.infer<typeof featuredProductSchema>;

export function FeaturedProductsSection() {
  const { ref, isNear } = useNearViewport<HTMLElement>();
  const [products, setProducts] = useState<FeaturedProduct[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    if (!isNear) return;
    const controller = new AbortController();

    async function loadProducts() {
      try {
        const response = await fetch('/api/featured-parts', { signal: controller.signal });
        if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);
        const data = z.array(featuredProductSchema).parse(await response.json());
        setProducts(data);
        setStatus('ready');
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('[featured-products] Could not load products:', error);
        setStatus('error');
      }
    }

    void loadProducts();
    return () => controller.abort();
  }, [isNear]);

  return (
    <section ref={ref} aria-labelledby="featured-products-heading" className="relative px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto w-full max-w-[1500px]">
        <SectionHeader
          id="featured-products-heading"
          badge="Explore the catalog"
          title="Featured Products"
          subtitle="Top priced components from our current parts catalog."
        />

        {status === 'ready' && products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-3 md:gap-4 min-[440px]:grid-cols-2 lg:grid-cols-4">
              {products.map(product => {
                const detailHref = `/parts/${product.productId}`;

                return (
                  <Card
                    key={product.productId}
                    withBorder
                    radius="lg"
                    padding={0}
                    className="group flex h-full flex-col justify-between overflow-hidden border-slate-200/80 bg-white/85 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/40 dark:border-white/10 dark:bg-[#111722] dark:hover:border-cyan-500/40"
                  >
                    <Stack gap={6} className={catalogCardLayout.header}>
                      <Group justify="space-between" align="center" wrap="nowrap">
                        <Badge size="xs" variant="light" color="gray" radius="sm" className="max-w-[55%] uppercase tracking-wide">
                          <span className="block truncate">{product.brand || product.category}</span>
                        </Badge>
                        <Badge size="xs" variant="light" color={product.inStock ? 'teal' : 'red'} radius="sm">
                          {product.inStock ? 'Available' : 'Out of stock'}
                        </Badge>
                      </Group>
                      <Text component="h3" size="sm" fw={600} lineClamp={2} className="min-h-[2.5rem] leading-snug transition-colors group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
                        {product.name}
                      </Text>
                    </Stack>

                    <Link href={detailHref} aria-label={`View ${product.name}`}>
                      <Box className={catalogCardLayout.image}>
                        <OptimizedImage src={product.imageUrl || '/placeholder-part.png'} alt={product.name} fill sizes="(max-width: 439px) 100vw, (max-width: 1023px) 50vw, 25vw" className="object-contain p-2" />
                      </Box>
                    </Link>

                    <Stack gap="xs" className={catalogCardLayout.footer}>
                      <Stack gap={0}>
                        <Text size="xs" c="dimmed" tt="uppercase" fw={600} className="text-[10px] tracking-wider">Price</Text>
                        <Text size="lg" fw={700} className="font-mono leading-none text-slate-900 dark:text-slate-100">{formatCurrency(product.price)}</Text>
                      </Stack>
                      <Button
                        component={Link}
                        href={detailHref}
                        fullWidth
                        radius="md"
                        size="sm"
                        variant="light"
                        color="cyan"
                        rightSection={<ArrowRight size={15} />}
                      >
                        View product
                      </Button>
                    </Stack>
                  </Card>
                );
              })}
            </div>
            <div className="mt-12 flex justify-center">
              <Button
                component={Link}
                href="/parts"
                color="cyan"
                radius="md"
                size="lg"
                rightSection={<ArrowRight size={18} />}
                className="h-12 font-headline font-bold uppercase tracking-wide shadow-lg hover:scale-105 transition-transform"
              >
                View All
              </Button>
            </div>
          </>
        ) : status === 'error' || (status === 'ready' && products.length === 0) ? (
          <Paper withBorder radius="lg" p="lg" className="border-slate-200 bg-white/85 text-center dark:border-white/10 dark:bg-[#111722]/90">
            <p className="text-slate-600 dark:text-slate-300">Featured products are unavailable right now.</p>
            <Link href="/parts" className="mt-2 inline-flex min-h-11 items-center font-semibold text-cyan-700 dark:text-cyan-300">Browse the catalog <ArrowRight size={16} className="ml-2" /></Link>
          </Paper>
        ) : (
          <div aria-label="Loading featured products" aria-busy="true"><div className="grid grid-cols-1 gap-3 md:gap-4 min-[440px]:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 12 }, (_, index) => <CatalogCardSkeleton key={index} />)}
          </div><div className="mt-12 flex justify-center"><Skeleton className="flex"><Button size="lg" className="h-12" disabled>View All</Button></Skeleton></div></div>
        )}
      </div>
    </section>
  );
}
