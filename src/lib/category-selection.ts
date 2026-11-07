export interface SelectableCategory {
  name?: string;
  selected: boolean;
}

export function hasNoSelectedCategories(categories: readonly SelectableCategory[]): boolean {
  return categories.length > 0 && categories.every((category) => !category.selected);
}
