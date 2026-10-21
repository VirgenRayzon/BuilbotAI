'use client';

import { useCallback, useEffect, useState } from 'react';
import { checkCompatibility } from '@/lib/compatibility';
import type { ComponentData, Part } from '@/lib/types';
import type { PublicCatalogPart } from '@/lib/public-product-types';

type BuilderState = Record<string, ComponentData | ComponentData[] | null>;

const EMPTY_BUILD: BuilderState = {
  CPU: null,
  GPU: null,
  Motherboard: null,
  RAM: [],
  Storage: [],
  PSU: null,
  Case: null,
  Cooler: null,
  Monitor: null,
  Keyboard: null,
  Mouse: null,
  Headset: null,
};

export function usePublicPartsCompatibility() {
  const [build, setBuild] = useState<BuilderState>(EMPTY_BUILD);
  const [hideIncompatible, setHideIncompatible] = useState(false);

  useEffect(() => {
    const loadBuilderState = () => {
      const saved = window.localStorage.getItem('pc_builder_state');
      if (!saved) {
        setBuild(EMPTY_BUILD);
        return;
      }

      try {
        const parsed: unknown = JSON.parse(saved);
        setBuild(parsed && typeof parsed === 'object' ? { ...EMPTY_BUILD, ...parsed as BuilderState } : EMPTY_BUILD);
      } catch {
        setBuild(EMPTY_BUILD);
      }
    };

    loadBuilderState();
    window.addEventListener('storage', loadBuilderState);
    return () => window.removeEventListener('storage', loadBuilderState);
  }, []);

  const isCompatible = useCallback((product: PublicCatalogPart) => {
    const part: Part = {
      id: product.productId,
      productId: product.productId,
      sku: product.sku,
      name: product.name,
      category: product.category as Part['category'],
      brand: product.brand,
      price: product.price,
      stock: product.inStock ? 1 : 0,
      imageUrl: product.imageUrl,
      images: product.imageUrl ? [product.imageUrl] : [],
      specifications: product.specifications,
      description: '',
    };

    return checkCompatibility(part, build).compatible;
  }, [build]);

  return { hideIncompatible, setHideIncompatible, isCompatible };
}
