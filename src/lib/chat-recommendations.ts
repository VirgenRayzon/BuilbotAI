import { checkCompatibility } from './compatibility';
import type { StructuredPart } from './inventory-fetcher';
import type { ComponentData, Part } from './types';

const categoryNames: Record<string, Part['category']> = {
  cpu: 'CPU', gpu: 'GPU', motherboard: 'Motherboard', ram: 'RAM',
  storage: 'Storage', psu: 'PSU', case: 'Case', cooler: 'Cooler',
  monitor: 'Monitor', keyboard: 'Keyboard', mouse: 'Mouse', headset: 'Headset',
};

export function filterChatRecommendations(
  inventory: StructuredPart[],
  category: string,
  currentBuild: Record<string, ComponentData | ComponentData[] | null> | null,
  maxPrice?: number,
): StructuredPart[] {
  const categoryName = categoryNames[category.toLowerCase()];
  if (!categoryName) return [];

  const selected = currentBuild?.[categoryName];
  const selectedParts = Array.isArray(selected) ? selected : selected ? [selected] : [];
  const selectedCountById = new Map<string, number>();
  selectedParts.forEach(part => selectedCountById.set(part.id, (selectedCountById.get(part.id) || 0) + 1));
  const drawingCategories = ['CPU', 'GPU', 'Motherboard', 'RAM', 'Storage', 'Cooler'];
  const currentDraw = drawingCategories.reduce((sum, key) => {
    const value = currentBuild?.[key];
    const parts = Array.isArray(value) ? value : value ? [value] : [];
    return sum + parts.reduce((partSum, item) => partSum + (item.wattage || 0), 0);
  }, 0);
  const selectedPsu = currentBuild?.PSU as ComponentData | null | undefined;

  const matching = inventory.filter(part => {
    if (part.isArchived || typeof part.stock !== 'number' || part.stock <= 0) return false;
    if (typeof maxPrice === 'number' && maxPrice > 0 && part.price > maxPrice) return false;
    if ((selectedCountById.get(part.id) || 0) >= part.stock) return false;
    if (!Array.isArray(selected) && selectedParts.some(chosen => chosen.id === part.id)) return false;
    if (!currentBuild) return true;
    if (categoryName === 'PSU' && currentDraw > 0 &&
        (typeof part.wattage !== 'number' || part.wattage < currentDraw + 150)) return false;
    if (selectedPsu?.wattage && drawingCategories.includes(categoryName) && typeof part.wattage === 'number') {
      const replacedDraw = Array.isArray(selected) ? 0 : selectedParts[0]?.wattage || 0;
      if (currentDraw - replacedDraw + part.wattage > selectedPsu.wattage - 50) return false;
    }

    const specifications = Object.fromEntries(
      Object.entries(part.specifications || {}).filter((entry): entry is [string, string | number] =>
        typeof entry[1] === 'string' || typeof entry[1] === 'number'
      )
    );
    const candidate: Part = {
      id: part.id,
      name: part.name,
      category: categoryName,
      brand: part.brand,
      price: part.price,
      stock: part.stock,
      imageUrl: part.imageUrl,
      specifications,
      wattage: part.wattage,
      socket: part.socket,
      ramType: part.ramType,
      performanceScore: part.performanceScore,
      dimensions: part.dimensions,
    };
    return checkCompatibility(candidate, currentBuild).compatible;
  });

  if (categoryName === 'GPU') {
    matching.sort((a, b) => {
      const aScore = typeof a.performanceScore === 'number' ? a.performanceScore : -1;
      const bScore = typeof b.performanceScore === 'number' ? b.performanceScore : -1;
      return bScore - aScore || b.price - a.price;
    });
  }

  return matching;
}
