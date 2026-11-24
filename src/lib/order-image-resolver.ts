import type { Part } from "@/lib/types";

export interface OrderItemLike {
  id?: string;
  partId?: string;
  productId?: string;
  name: string;
  category?: string;
  price?: number;
  imageUrl?: string;
}

const CATEGORY_PLACEHOLDER_MAP: Record<string, string> = {
  cpu: "/placeholders/components/cpu.jpg",
  gpu: "/placeholders/components/gpu.jpg",
  motherboard: "/placeholders/components/motherboard.jpg",
  ram: "/placeholders/components/ram.jpg",
  storage: "/placeholders/components/storage.jpg",
  psu: "/placeholders/components/psu.jpg",
  case: "/placeholders/components/case.jpg",
  cooler: "/placeholders/components/cooler.jpg",
};

export function getEcommerceFallbackImage(category?: string): string {
  if (category) {
    const cleanCat = category.replace(/\s*#\d+$/, "").trim().toLowerCase();
    if (CATEGORY_PLACEHOLDER_MAP[cleanCat]) {
      return CATEGORY_PLACEHOLDER_MAP[cleanCat];
    }
  }
  return "/placeholders/components/cpu.jpg";
}

export function isInvalidPlaceholderUrl(url?: string | null): boolean {
  if (!url) return true;
  return (
    url === "/placeholder-part.png" ||
    url === "/placeholder-system.png" ||
    url.trim() === ""
  );
}

export function isPlaceholderOrMissingImage(url?: string | null): boolean {
  if (!url || !url.trim()) return true;
  if (isInvalidPlaceholderUrl(url)) return true;
  if (url.startsWith("/placeholders/components/")) return true;
  return false;
}

function normalizeKey(str?: string): string {
  return (str || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function resolveOrderItemImageUrl(
  item: OrderItemLike,
  allItems?: OrderItemLike[],
  catalogParts?: Part[] | null
): string {
  if (!isPlaceholderOrMissingImage(item.imageUrl)) {
    return item.imageUrl!;
  }

  const itemNameNorm = normalizeKey(item.name);
  const itemCategory = (item.category || "").toLowerCase();

  if (catalogParts && catalogParts.length > 0) {
    let matched = catalogParts.find(
      (p) =>
        (item.id && p.id === item.id) ||
        (item.partId && p.id === item.partId) ||
        (item.productId && p.productId === item.productId)
    );

    if (!matched && itemNameNorm) {
      matched = catalogParts.find((p) => normalizeKey(p.name) === itemNameNorm);
    }

    if (!matched && itemNameNorm) {
      const sameCategoryParts = catalogParts.filter(
        (p) => !itemCategory || (p.category || "").toLowerCase() === itemCategory
      );
      matched = sameCategoryParts.find((p) => {
        const pNorm = normalizeKey(p.name);
        return itemNameNorm.includes(pNorm) || pNorm.includes(itemNameNorm);
      });
    }

    if (!matched && itemNameNorm) {
      matched = catalogParts.find((p) => {
        const pNorm = normalizeKey(p.name);
        return itemNameNorm.includes(pNorm) || pNorm.includes(itemNameNorm);
      });
    }

    const matchedImg =
      matched?.imageUrl ||
      (Array.isArray(matched?.images) ? matched.images[0] : (matched as any)?.image);

    if (matchedImg && !isPlaceholderOrMissingImage(matchedImg)) {
      return matchedImg;
    }
  }

  const isIntegratedGpu =
    item.id === "included-integrated-gpu" ||
    (itemCategory === "gpu" && (
      item.price === 0 ||
      item.name.toLowerCase().includes("integrated") ||
      item.name.toLowerCase().includes("uhd graphics") ||
      item.name.toLowerCase().includes("radeon graphics") ||
      item.name.toLowerCase().includes("vega")
    ));

  if (isIntegratedGpu && allItems && allItems.length > 0) {
    const cpuItem = allItems.find(
      (i) => (i.category || "").toLowerCase() === "cpu" && i !== item
    );
    if (cpuItem) {
      const cpuImg = resolveOrderItemImageUrl(cpuItem, allItems, catalogParts);
      if (!isPlaceholderOrMissingImage(cpuImg)) {
        return cpuImg;
      }
    }
  }

  return getEcommerceFallbackImage(item.category);
}
