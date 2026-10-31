'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Paper } from '@mantine/core';
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
            <div className="grid grid-cols-1 gap-4 md:gap-8 min-[440px]:grid-cols-2 lg:grid-cols-4">
              {products.map(product => (
                <Paper key={product.productId} withBorder radius="lg" shadow="sm" p={0} className="group h-full overflow-hidden border-slate-200 bg-white/85 transition-colors hover:border-cyan-500/50 dark:border-white/10 dark:bg-[#111722]/90">
                  <Link href={`/parts/${product.productId}`} aria-label={`View ${product.name}`} className="flex h-full flex-col">
                    <div className="relative aspect-[4/3] overflow-hidden border-b border-slate-200 bg-white dark:border-white/10">
                      <OptimizedImage src={product.imageUrl || '/placeholder-part.png'} alt={product.name} fill sizes="(max-width: 439px) 100vw, (max-width: 1023px) 50vw, 25vw" className="object-contain p-3 transition-transform duration-300 group-hover:scale-105" />
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        <span className="truncate">{product.brand || product.category}</span>
                        <span className={product.inStock ? 'shrink-0 text-emerald-600 dark:text-emerald-400' : 'shrink-0 text-slate-500 dark:text-slate-400'}>{product.inStock ? 'In stock' : 'Out of stock'}</span>
                      </div>
                      <h3 className="mt-3 line-clamp-2 min-h-10 text-sm font-semibold leading-snug text-slate-900 group-hover:text-cyan-700 dark:text-slate-100 dark:group-hover:text-cyan-300">{product.name}</h3>
                      <p className="mt-auto pt-4 font-mono text-lg font-bold text-slate-900 dark:text-slate-100">{formatCurrency(product.price)}</p>
                    </div>
                  </Link>
                </Paper>
              ))}
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
          <div className="grid grid-cols-1 gap-4 md:gap-8 min-[440px]:grid-cols-2 lg:grid-cols-4" aria-label="Loading featured products" aria-busy="true">
            {Array.from({ length: 12 }, (_, index) => <div key={index} className="aspect-[3/4] animate-pulse rounded-lg border border-slate-200 bg-slate-100/80 dark:border-white/10 dark:bg-[#141a23]/90" />)}
          </div>
        )}
      </div>
    </section>
  );
}
