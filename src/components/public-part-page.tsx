'use client';

import { useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { Badge, Button, Grid, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { ArrowLeft, ExternalLink, ShieldCheck } from 'lucide-react';
import type { PublicProduct } from '@/lib/public-product-types';
import { productAdminUrl } from '@/lib/product-identity';
import { usePublicProductActions } from '@/hooks/use-public-product-actions';
import { formatCurrency } from '@/lib/utils';

export function PublicPartPage({ product }: { product: PublicProduct }) {
  const [selectedImage, setSelectedImage] = useState(0);
  const actions = usePublicProductActions(product);
  const image = product.images[selectedImage];

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-slate-900 transition-colors dark:bg-[#0c0f14] dark:text-slate-50">
      <div className="pointer-events-none fixed inset-0 opacity-[0.03] dark:invert" style={{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
      <div className="relative z-10 w-full px-4 py-8 sm:px-6 md:px-8 lg:px-10">
        <Button component={Link} href="/parts" variant="subtle" color="gray" size="xs" leftSection={<ArrowLeft className="h-3.5 w-3.5" />} className="mb-8 text-xs font-semibold uppercase tracking-wider text-slate-600 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400">
          Back to parts
        </Button>

        <Grid gutter={{ base: 'xl', lg: 40 }} align="stretch">
          <Grid.Col span={{ base: 12, md: 6 }} order={{ base: 2, md: 1 }} className="flex">
            <Paper withBorder radius="md" p={0} className="flex min-h-[520px] w-full flex-col overflow-hidden border-slate-200 bg-white/90 shadow-sm dark:border-white/10 dark:bg-[#141a23]/90">
              <div className="relative flex min-h-[420px] flex-1 items-center justify-center overflow-hidden bg-slate-50 dark:bg-[#111722]">
                {image ? <img src={image} alt={product.name} className="h-full w-full object-contain p-6" /> : <Text c="dimmed">Image unavailable</Text>}
                <Badge color="cyan" variant="filled" size="sm" radius="sm" className="absolute left-3 top-3 font-bold uppercase tracking-wider">{product.category}</Badge>
              </div>
              {product.images.length > 1 && (
                <Group gap="xs" p="sm" className="border-t border-slate-200 dark:border-white/10">
                  {product.images.map((src, index) => (
                    <button key={`${src}-${index}`} type="button" aria-label={`View image ${index + 1}`} aria-pressed={selectedImage === index} onClick={() => setSelectedImage(index)} className={`relative h-16 w-16 overflow-hidden rounded-md border-2 bg-white p-1 transition-colors dark:bg-slate-900 ${selectedImage === index ? 'border-cyan-500' : 'border-slate-200 hover:border-cyan-400 dark:border-white/10'}`}>
                      <img src={src} alt="" className="h-full w-full object-contain" />
                    </button>
                  ))}
                </Group>
              )}
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }} order={{ base: 1, md: 2 }} className="flex">
            <div className="flex h-full w-full flex-col">
              <Group gap="xs" mb="xs">
                <Badge color="cyan" variant="filled" radius="sm" className="font-bold uppercase tracking-wider">{product.category}</Badge>
                <Badge color={product.inStock ? 'teal' : 'gray'} variant="light" radius="sm" leftSection={product.inStock ? <ShieldCheck className="h-3.5 w-3.5" /> : undefined}>{product.inStock ? 'Available' : 'Out of stock'}</Badge>
              </Group>
              <Text size="sm" c="dimmed" fw={600}>{product.brand}</Text>
              <Title order={1} className="mb-3 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">{product.name}</Title>
              <Group gap="md" mb="md"><Text size="xs" ff="monospace">Product ID: {product.productId}</Text><Text size="xs" ff="monospace">SKU: {product.sku}</Text></Group>
              <div className="prose prose-sm max-w-none text-slate-600 dark:prose-invert dark:text-slate-400"><ReactMarkdown>{product.description || 'Product description coming soon.'}</ReactMarkdown></div>

              <Paper withBorder radius="md" p={{ base: 'sm', sm: 'md' }} mt="auto" className="border-slate-200 bg-white/90 shadow-sm dark:border-white/10 dark:bg-[#141a23]/90">
                <Stack gap="md">
                  <div><Text size="sm" fw={800} c="dimmed" className="uppercase tracking-[0.16em]">Price</Text><Title order={2} className="font-mono font-black tracking-tight text-cyan-600 dark:text-cyan-400" style={{ fontSize: 'clamp(2rem, 3vw, 3.25rem)', lineHeight: 1 }}>{formatCurrency(product.price)}</Title></div>
                  {actions.isStaff ? (
                    <Button component={Link} href={productAdminUrl(product.kind, product.productId)} variant="default" mih={44} rightSection={<ExternalLink className="h-4 w-4" />}>Manage in inventory</Button>
                  ) : (
                    <Button onClick={actions.reserve} loading={actions.busy} disabled={!product.inStock || actions.loading} color="teal" mih={44}>{actions.signedIn ? 'Reserve this item' : 'Sign in to reserve'}</Button>
                  )}
                  {actions.error && <Text role="alert" c="red" size="sm">{actions.error}</Text>}
                  <Text size="xs" c="dimmed">Availability is checked again when you reserve.</Text>
                </Stack>
              </Paper>
            </div>
          </Grid.Col>
        </Grid>

        {Object.keys(product.specifications).length > 0 && (
          <Paper withBorder radius="md" p={{ base: 'md', sm: 'lg' }} mt="xl" className="border-slate-200 bg-white/90 shadow-sm dark:border-white/10 dark:bg-[#141a23]/90">
            <Title order={2} size="h3" mb="md">Technical specifications</Title>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="sm">
              {Object.entries(product.specifications).map(([key, value]) => <Paper key={key} withBorder radius="md" p="sm" className="border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-[#111722]"><Text size="xs" c="dimmed" fw={700} className="uppercase tracking-wider">{key}</Text><Text mt={4} fw={700}>{String(value)}</Text></Paper>)}
            </SimpleGrid>
          </Paper>
        )}
      </div>
    </div>
  );
}
