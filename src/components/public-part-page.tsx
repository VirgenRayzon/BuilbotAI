'use client';

import { useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { ActionIcon, Badge, Button, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { ArrowLeft, ExternalLink, Minus, Plus, ShieldCheck, ShoppingCart, Wrench, Zap } from 'lucide-react';
import type { PublicProduct } from '@/lib/public-product-types';
import { productAdminUrl } from '@/lib/product-identity';
import { usePublicProductActions } from '@/hooks/use-public-product-actions';
import { formatCurrency } from '@/lib/utils';
import { PrebuiltImageView } from '@/app/pre-builts/[id]/components/prebuilt-image-view';
import { PartBuilderCompatibilityModal } from './part-builder-compatibility-modal';
import { useSiteSettings } from '@/context/site-settings-context';
import { useEcommerce } from '@/context/ecommerce-context';

export function PublicPartPage({ product }: { product: PublicProduct }) {
  const actions = usePublicProductActions(product);
  const { isEcommerceMode } = useSiteSettings();
  const { addToCart, buyNow } = useEcommerce();
  const [compatOpened, setCompatOpened] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [primaryImage = '', ...galleryImages] = product.images;

  const handleAddPartToCart = () => {
    if (!product.inStock) return;
    addToCart(
      {
        id: `part-${product.productId}`,
        kind: 'part',
        name: product.name,
        price: product.price,
        quantity,
        category: product.category,
        brand: product.brand,
        sku: product.sku,
        imageUrl: primaryImage,
      },
      true
    );
  };

  const handleBuyPartNow = () => {
    if (!product.inStock) return;
    buyNow({
      id: `part-${product.productId}`,
      kind: 'part',
      name: product.name,
      price: product.price,
      quantity,
      category: product.category,
      brand: product.brand,
      sku: product.sku,
      imageUrl: primaryImage,
    });
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-slate-900 transition-colors dark:bg-[#0c0f14] dark:text-slate-50">
      <div className="pointer-events-none fixed inset-0 opacity-[0.03] dark:invert" style={{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 py-8 sm:px-6 md:px-8 lg:px-8 xl:px-10">
        <Button component={Link} href="/parts" variant="subtle" color="gray" size="xs" leftSection={<ArrowLeft className="h-3.5 w-3.5" />} className="mb-8 text-xs font-semibold uppercase tracking-wider text-slate-600 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400">
          Back to parts
        </Button>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:grid-rows-[auto_1fr_auto] md:gap-x-10 md:gap-y-4">
          <div className="order-1 md:col-start-1 md:row-start-1 md:row-span-3">
            <PrebuiltImageView
              imageUrl={primaryImage}
              images={galleryImages}
              systemName={product.name}
              tier={product.category}
              itemLabel="product"
              placeholderSrc="/placeholder-part.png"
            />
          </div>

          <div className="order-2 md:col-start-2 md:row-start-1">
            <Group gap="xs" mb="xs">
              <Badge color="cyan" variant="filled" radius="sm" className="font-bold uppercase tracking-wider">{product.category}</Badge>
              <Badge color={product.inStock ? 'teal' : 'gray'} variant="light" radius="sm" leftSection={product.inStock ? <ShieldCheck className="h-3.5 w-3.5" /> : undefined}>{product.inStock ? 'Available' : 'Out of stock'}</Badge>
            </Group>
            <Text size="sm" c="dimmed" fw={600}>{product.brand}</Text>
            <Title order={1} className="mb-3 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">{product.name}</Title>
            <Group gap="md"><Text size="xs" ff="monospace">Product ID: {product.productId}</Text><Text size="xs" ff="monospace">SKU: {product.sku}</Text></Group>
          </div>

          <Paper withBorder radius="md" p={{ base: 'sm', sm: 'md' }} className="order-3 border-slate-200 bg-white/90 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-[#141a23]/90 md:col-start-2 md:row-start-3 md:order-4">
            <Stack gap="md">
              <Group justify="space-between" align="flex-end">
                <div>
                  <Text size="sm" fw={800} c="dimmed" className="uppercase tracking-[0.16em]">Price</Text>
                  <Title order={2} className="font-mono font-black tracking-tight text-cyan-600 dark:text-cyan-400" style={{ fontSize: 'clamp(2rem, 3vw, 3.25rem)', lineHeight: 1 }}>
                    {formatCurrency(product.price)}
                  </Title>
                </div>

                {isEcommerceMode && !actions.isStaff && product.inStock && (
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0e131d] px-2 py-1">
                    <Text size="xs" c="dimmed" fw={700} className="uppercase text-[10px]">
                      Qty
                    </Text>
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color="gray"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      aria-label="Decrease quantity"
                    >
                      <Minus size={14} />
                    </ActionIcon>
                    <Text size="sm" fw={800} ff="monospace" className="min-w-[22px] text-center">
                      {quantity}
                    </Text>
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color="gray"
                      onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                      aria-label="Increase quantity"
                    >
                      <Plus size={14} />
                    </ActionIcon>
                  </div>
                )}
              </Group>

              {actions.isStaff ? (
                <Button component={Link} href={productAdminUrl(product.kind, product.productId)} variant="default" mih={44} rightSection={<ExternalLink className="h-4 w-4" />}>Manage in inventory</Button>
              ) : isEcommerceMode ? (
                <Group gap="xs" grow>
                  <Button
                    onClick={handleAddPartToCart}
                    disabled={!product.inStock}
                    color="cyan"
                    mih={44}
                    leftSection={<ShoppingCart className="h-4 w-4" />}
                    className="font-headline font-bold uppercase tracking-wider text-xs"
                  >
                    {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                  </Button>
                  <Button
                    onClick={handleBuyPartNow}
                    disabled={!product.inStock}
                    color="teal"
                    mih={44}
                    leftSection={<Zap className="h-4 w-4" />}
                    className="font-headline font-bold uppercase tracking-wider text-xs"
                  >
                    Buy Now
                  </Button>
                </Group>
              ) : (
                <Button onClick={actions.reserve} loading={actions.busy} disabled={!product.inStock || actions.loading} color="teal" mih={44}>{actions.signedIn ? 'Reserve this item' : 'Sign in to reserve'}</Button>
              )}

              <Button variant="light" color="cyan" mih={44} leftSection={<Wrench className="h-4 w-4" />} onClick={() => setCompatOpened(true)}>
                Check with my build
              </Button>
              {actions.error && <Text role="alert" c="red" size="sm">{actions.error}</Text>}
              <Text size="xs" c="dimmed">
                {isEcommerceMode
                  ? 'Supports LBC / J&T Nationwide Courier, Same-Day Express, GCash, Maya, QRPh, Card & COD.'
                  : 'Availability is checked again when you reserve.'}
              </Text>
            </Stack>
          </Paper>

          <div className="order-4 prose prose-sm max-w-none text-slate-600 dark:prose-invert dark:text-slate-400 md:col-start-2 md:row-start-2 md:order-3">
            <ReactMarkdown>{product.description || 'Product description coming soon.'}</ReactMarkdown>
          </div>
        </div>

        <PartBuilderCompatibilityModal
          product={product}
          opened={compatOpened}
          onClose={() => setCompatOpened(false)}
        />

        {Object.keys(product.specifications).length > 0 && (
          <Paper withBorder radius="md" p={{ base: 'sm', sm: 'md' }} mt="xl" className="border-slate-200 bg-white/90 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-[#141a23]/90">
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
