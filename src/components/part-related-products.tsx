'use client';

import Link from 'next/link';
import { Badge, Box, Button, Card, Group, Stack, Text } from '@mantine/core';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { SectionHeader } from '@/components/landing/section-header';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { useTheme } from '@/context/theme-provider';
import { cn, formatCurrency } from '@/lib/utils';
import type { PublicCatalogPart } from '@/lib/public-product-types';

interface RelatedPartCardProps {
  part: PublicCatalogPart;
  isAdminPreview?: boolean;
}

function RelatedPartCard({ part, isAdminPreview = false }: RelatedPartCardProps) {
  const detailHref = isAdminPreview ? `/parts/${part.productId}?preview=admin` : `/parts/${part.productId}`;

  return (
    <Card
      withBorder
      radius="lg"
      padding={0}
      className="group flex h-full w-full min-w-0 flex-col justify-between overflow-hidden border-slate-200/80 bg-white/85 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/40 dark:border-white/10 dark:bg-[#111722] dark:hover:border-cyan-500/40"
    >
      <Stack gap={6} className="px-3 pb-2 pt-3">
        <Group justify="space-between" align="center" wrap="nowrap">
          <Badge size="xs" variant="light" color="cyan" radius="sm">
            {part.category}
          </Badge>
          <Badge size="xs" variant="light" color={part.inStock ? 'teal' : 'red'} radius="sm">
            {part.inStock ? 'Available' : 'Out of stock'}
          </Badge>
        </Group>
        <Text
          component="h3"
          size="sm"
          fw={600}
          lineClamp={2}
          className="min-h-[2.5rem] leading-snug transition-colors group-hover:text-cyan-600 dark:group-hover:text-cyan-400"
        >
          {part.name}
        </Text>
      </Stack>

      <Link href={detailHref} aria-label={`View ${part.name}`}>
        <Box className="relative aspect-[4/3] w-full overflow-hidden border-y border-slate-200/70 bg-pure-white dark:border-white/10">
          <OptimizedImage
            src={part.imageUrl || '/placeholder-part.png'}
            alt={part.name}
            fill
            sizes="(max-width: 639px) 88vw, (max-width: 1023px) 44vw, 25vw"
            className="object-contain p-2"
          />
        </Box>
      </Link>

      <Stack gap="xs" className="px-3 pb-3 pt-3">
        <Group justify="space-between" align="end" wrap="nowrap">
          <Stack gap={0} className="min-w-0">
            <Text size="xs" c="dimmed" tt="uppercase" fw={600} className="text-[10px] tracking-wider">
              Price
            </Text>
            <Text size="lg" fw={700} className="truncate font-mono leading-none text-slate-900 dark:text-slate-100">
              {formatCurrency(part.price)}
            </Text>
          </Stack>
          <Text size="xs" c="dimmed" className="max-w-[42%] truncate text-right">
            {part.brand}
          </Text>
        </Group>
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
}

interface PartRelatedProductsProps {
  parts: PublicCatalogPart[];
  category?: string;
  isAdminPreview?: boolean;
  className?: string;
}

export function PartRelatedProducts({
  parts,
  category,
  isAdminPreview = false,
  className = '',
}: PartRelatedProductsProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!parts || parts.length === 0) {
    return null;
  }

  const categoryLabel = category ? category.toLowerCase() : 'hardware';

  return (
    <section
      aria-labelledby="related-parts-heading"
      className={cn(
        'relative border-y border-slate-200 px-4 py-16 dark:border-white/5 sm:px-6 lg:px-8 lg:py-24',
        className
      )}
    >
      <div className="mx-auto w-full max-w-[1500px]">
        <SectionHeader
          id="related-parts-heading"
          badge="Complete your setup"
          title="You might also like"
          subtitle={`Pair your build with other ${categoryLabel} options selected from our current catalog.`}
        />

        <Carousel opts={{ align: 'start', loop: parts.length > 4 }} className="w-full">
          <CarouselContent className="-ml-3 md:-ml-4">
            {parts.map((part, index) => (
              <CarouselItem
                key={part.productId}
                className="flex basis-[88%] pl-3 sm:basis-1/2 md:pl-4 lg:basis-1/3 xl:basis-1/4"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: (index % 4) * 0.1 }}
                  viewport={{ once: true }}
                  className="flex h-full w-full py-4"
                >
                  <RelatedPartCard part={part} isAdminPreview={isAdminPreview} />
                </motion.div>
              </CarouselItem>
            ))}
          </CarouselContent>

          <div className="mt-16 flex items-center justify-center gap-6">
            <CarouselPrevious
              className={cn(
                'static h-14 w-14 translate-y-0 rounded-2xl border-2 transition-all duration-300 hover:scale-110 active:scale-95',
                isDark
                  ? 'border-white/10 bg-white/5 text-white hover:border-primary hover:bg-primary hover:text-white'
                  : 'border-slate-200 bg-white text-slate-900 hover:border-primary hover:bg-primary hover:text-white'
              )}
            />
            <div className="h-1 w-24 overflow-hidden rounded-full bg-muted" aria-hidden="true">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: '30%' }}
                animate={{ width: '60%' }}
                transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
              />
            </div>
            <CarouselNext
              className={cn(
                'static h-14 w-14 translate-y-0 rounded-2xl border-2 transition-all duration-300 hover:scale-110 active:scale-95',
                isDark
                  ? 'border-white/10 bg-white/5 text-white hover:border-primary hover:bg-primary hover:text-white'
                  : 'border-slate-200 bg-white text-slate-900 hover:border-primary hover:bg-primary hover:text-white'
              )}
            />
          </div>
        </Carousel>

        <div className="mt-10 flex justify-center">
          <Button
            component={Link}
            href={isAdminPreview ? '/parts?preview=admin' : '/parts'}
            color="cyan"
            radius="md"
            size="lg"
            rightSection={<ArrowRight size={18} />}
            className="h-12 font-headline font-bold uppercase tracking-wide shadow-lg"
          >
            Shop all {category ? `${category.toLowerCase()} parts` : 'accessories'}
          </Button>
        </div>
      </div>
    </section>
  );
}
