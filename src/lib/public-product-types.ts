export type PublicProduct = {
  kind: 'part' | 'prebuilt'; productId: string; sku: string; qrToken: string;
  name: string; category: string; brand: string; price: number; inStock: boolean;
  createdAt: number;
  images: string[]; description: string; specifications: Record<string, string | number>;
  highlights: string[];
  components: { key: string; name: string; category: string; productId: string | null; issue: 'missing' | 'out-of-stock' | null }[];
};

export type PublicCatalogPart = Pick<PublicProduct,
  'productId' | 'sku' | 'qrToken' | 'name' | 'category' | 'brand' | 'price' | 'inStock' | 'createdAt' | 'specifications'
> & { imageUrl: string };
