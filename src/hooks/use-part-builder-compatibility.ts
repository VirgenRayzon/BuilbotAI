'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PublicProduct } from '@/lib/public-product-types';
import type { Part, ComponentData } from '@/lib/types';
import { checkCompatibility, type CompatibilityResult } from '@/lib/compatibility';

export function usePartBuilderCompatibility(product: PublicProduct) {
  const router = useRouter();
  const [currentBuild, setCurrentBuild] = useState<Record<string, ComponentData | ComponentData[] | null> | null>(null);
  const [compatibility, setCompatibility] = useState<CompatibilityResult>({ compatible: true, message: '' });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load active build from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pc_builder_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        setCurrentBuild(parsed);
      } else {
        setCurrentBuild({
          CPU: null, GPU: null, Motherboard: null, RAM: [], Storage: [], PSU: null, Case: null, Cooler: null,
          Monitor: null, Keyboard: null, Mouse: null, Headset: null,
        });
      }
    } catch {
      setCurrentBuild(null);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Adapt PublicProduct to Part
  const part: Part = {
    id: product.productId,
    productId: product.productId,
    sku: product.sku,
    qrToken: product.qrToken,
    name: product.name,
    category: product.category as any,
    brand: product.brand,
    price: product.price,
    stock: product.inStock ? 1 : 0,
    imageUrl: product.images[0] || '',
    specifications: product.specifications || {},
    socket: String(product.specifications?.['Socket'] || product.specifications?.['socket'] || ''),
    ramType: String(product.specifications?.['Memory Type'] || product.specifications?.['RAM Type'] || ''),
    wattage: typeof product.specifications?.['Wattage'] === 'number' ? Number(product.specifications?.['Wattage']) : undefined,
  };

  // Re-run compatibility check when build is loaded
  useEffect(() => {
    if (!currentBuild) return;
    const result = checkCompatibility(part, currentBuild);
    setCompatibility(result);
  }, [currentBuild, product]);

  const activeBuildCount = currentBuild
    ? Object.values(currentBuild).reduce<number>((acc, val) => {
        if (Array.isArray(val)) return acc + val.length;
        return acc + (val ? 1 : 0);
      }, 0)
    : 0;

  const addToBuildAndOpen = useCallback(() => {
    const component: ComponentData = {
      id: product.productId,
      model: product.name,
      description: product.description || '',
      price: product.price,
      image: product.images[0] || '',
      imageHint: product.name,
      icon: (() => null) as any,
      socket: part.socket,
      ramType: part.ramType,
      wattage: part.wattage,
      specifications: product.specifications || {},
    };

    const targetCategory = product.category;
    const baseBuild = currentBuild || {
      CPU: null, GPU: null, Motherboard: null, RAM: [], Storage: [], PSU: null, Case: null, Cooler: null,
      Monitor: null, Keyboard: null, Mouse: null, Headset: null,
    };

    const updated = { ...baseBuild };
    if (targetCategory === 'RAM' || targetCategory === 'Storage') {
      const existing = (updated[targetCategory] as ComponentData[]) || [];
      updated[targetCategory] = [...existing, component];
    } else {
      updated[targetCategory] = component;
    }

    try {
      localStorage.setItem('pc_builder_state', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to update pc_builder_state', e);
    }

    router.push('/builder');
  }, [product, part, currentBuild, router]);

  return {
    isLoaded,
    hasActiveBuild: activeBuildCount > 0,
    activeBuildCount,
    currentBuild,
    compatibility,
    addToBuildAndOpen,
  };
}
