"use client";

import React from "react";
import { motion } from "framer-motion";
import { Database, Plus, Trash2, Sparkles } from "lucide-react";
import {
  Card,
  Paper,
  Table,
  Button,
  Badge,
  Text,
  Group,
  Stack,
  Box,
} from "@mantine/core";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { formatCurrency, cn, getOptimizedStorageUrl } from "@/lib/utils";
import { InventoryToolbar } from "@/components/inventory-toolbar";
import { PartCard } from "@/components/part-card";
import { PaginationControls } from "@/components/pagination-controls";
import type { Part } from "@/lib/types";
import { useInventoryImageCount } from '@/hooks/use-inventory-image-count';
import { useSiteSettings } from '@/context/site-settings-context';
import type { useLiveBuildRecommendations } from '@/hooks/use-live-build-recommendations';

type RecommendationState = ReturnType<typeof useLiveBuildRecommendations>;

interface InventoryViewProps {
  loading: boolean;
  paginatedParts: any[];
  recommendations?: RecommendationState;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (count: number) => void;
  view: "grid" | "list";
  onViewChange: (view: "grid" | "list") => void;
  categories: any[];
  onCategoryChange: (name: string, selected: boolean) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  sortBy: string;
  onSortByChange: (sort: string) => void;
  sortDirection: "asc" | "desc";
  onSortDirectionChange: (dir: "asc" | "desc") => void;
  onTogglePart: (part: Part) => void;
  isSelected: (part: Part) => boolean;
  itemCount: number;
  availableBrands?: string[];
  selectedBrands?: string[];
  onBrandChange?: (brands: string[]) => void;
  hideIncompatible?: boolean;
  onHideIncompatibleChange?: (val: boolean) => void;
  className?: string;
  gridCols?: number;
  imageSizes?: string;
}

export function InventoryView({
  loading,
  paginatedParts,
  recommendations,
  totalPages,
  currentPage,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  view,
  onViewChange,
  categories,
  onCategoryChange,
  searchQuery,
  onSearchQueryChange,
  sortBy,
  onSortByChange,
  sortDirection,
  onSortDirectionChange,
  onTogglePart,
  isSelected,
  itemCount,
  availableBrands,
  selectedBrands,
  onBrandChange,
  hideIncompatible,
  onHideIncompatibleChange,
  className,
  gridCols,
  imageSizes,
}: InventoryViewProps) {
  const priorityImageCount = useInventoryImageCount('builder', gridCols === 5);
  const { shouldCorruptImages } = useSiteSettings();
  const gridColsClass =
    gridCols === 5
      ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      : "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className ? className : "lg:col-span-9"}
    >
      <>
        {/* Top Filter and Search Toolbar */}
        <div className="mb-4">
          <InventoryToolbar
            categories={categories}
            onCategoryChange={onCategoryChange}
            categoryLabel="Categories"
            itemLabel="parts"
            itemCount={itemCount}
            sortBy={sortBy}
            onSortByChange={onSortByChange}
            sortDirection={sortDirection}
            onSortDirectionChange={onSortDirectionChange}
            supportedSorts={["Date Added", "Name", "Price"]}
            defaultSort="Date Added:desc"
            view={view}
            onViewChange={onViewChange}
            showViewToggle={true}
            searchQuery={searchQuery}
            onSearchQueryChange={onSearchQueryChange}
            searchPlaceholder="Search parts by name, brand, or SKU..."
            availableBrands={availableBrands}
            selectedBrands={selectedBrands}
            onBrandChange={onBrandChange}
            hideIncompatible={hideIncompatible}
            onHideIncompatibleChange={onHideIncompatibleChange}
          />
        </div>


        {/* Content Body */}
        {loading ? (
          <div className={cn("grid gap-3 md:gap-4", gridColsClass)}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Card
                key={`builder-skeleton-${i}`}
                withBorder
                radius="lg"
                padding={0}
                className="flex flex-col justify-between h-full relative overflow-hidden bg-white/85 dark:bg-[#111722] border-slate-200/80 dark:border-white/10 animate-pulse select-none"
              >
                {/* --- Top Metadata & Title --- */}
                <Stack gap={6} className="px-3 pt-3 pb-2">
                  <Group justify="space-between" align="center" wrap="nowrap">
                    <div className="h-5 w-16 bg-slate-200 dark:bg-white/10 rounded-sm" />
                    <div className="h-5 w-20 bg-slate-200/60 dark:bg-white/5 rounded-sm" />
                  </Group>
                  <div className="min-h-[2.5rem] flex flex-col justify-center gap-1.5">
                    <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-4/5" />
                    <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-1/2" />
                  </div>
                </Stack>

                {/* --- Clean Image Showcase Surface --- */}
                <Box className="aspect-[4/3] relative w-full overflow-hidden bg-pure-white dark:bg-[#111722] border-y border-slate-200/70 dark:border-white/10 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-lg bg-slate-200/60 dark:bg-white/5" />
                </Box>

                {/* --- Bottom Controls Surface --- */}
                <Stack gap="xs" className="px-3 pt-3 pb-3">
                  <Group justify="space-between" align="center">
                    <Stack gap={4}>
                      <div className="h-2.5 w-14 bg-slate-200/80 dark:bg-white/10 rounded" />
                      <div className="h-5 w-24 bg-slate-200 dark:bg-white/10 rounded" />
                    </Stack>
                    <div className="h-7 w-7 rounded-md bg-slate-200/60 dark:bg-white/5" />
                  </Group>
                  <div className="h-9 w-full rounded-md bg-slate-200 dark:bg-white/10" />
                </Stack>
              </Card>
            ))}
          </div>
        ) : paginatedParts.length > 0 ? (
          view === "grid" ? (
            <div className={cn("grid gap-x-3 md:gap-x-4", recommendations?.suggestions.length ? "gap-y-8 pt-10" : "gap-y-3 md:gap-y-4", gridColsClass)}>
              {paginatedParts.map((part, index) => (
                <PartCard
                  key={part.id}
                  part={part}
                  onToggleBuild={onTogglePart}
                  isSelected={isSelected(part)}
                  compatibility={part.compatibility}
                  effectiveStock={part.effectiveStock}
                  priority={index < priorityImageCount}
                  imageSizes={imageSizes}
                  recommendation={recommendations?.suggestions.find(item => item.id === part.id && item.category === part.category)
                    ? (() => {
                      const item = recommendations.suggestions.find(suggestion => suggestion.id === part.id && suggestion.category === part.category)!;
                      return { action: item.action, role: item.role, reason: item.reason,
                        applying: recommendations.applyingId === item.id, onApply: () => void recommendations.apply(item) };
                    })() : undefined}
                />
              ))}
            </div>
          ) : (
            <Paper
              withBorder
              radius="lg"
              className="overflow-hidden bg-white/70 dark:bg-[#141a23]/90 border-slate-200/80 dark:border-white/10"
            >
              <Table verticalSpacing="sm" horizontalSpacing="md" highlightOnHover>
                <Table.Thead className="bg-slate-50/50 dark:bg-white/[0.02]">
                  <Table.Tr>
                    <Table.Th className="w-16">Item</Table.Th>
                    <Table.Th>Component</Table.Th>
                    <Table.Th>Category</Table.Th>
                    <Table.Th>Brand</Table.Th>
                    <Table.Th className="text-right">Price</Table.Th>
                    <Table.Th className="w-24 text-center">Status</Table.Th>
                    <Table.Th className="w-32 text-right">Action</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedParts.map((part) => {
                    const selected = isSelected(part);
                    const isOutOfStock = part.stock === 0;
                    const recommendation = recommendations?.suggestions.find(item => item.id === part.id && item.category === part.category);

                    return (
                      <Table.Tr
                        key={part.id}
                        className={cn(
                          "transition-colors",
                          selected && "bg-cyan-50/40 dark:bg-cyan-950/20",
                          recommendation?.role === 'bestMatch' && "bg-blue-50/70 dark:bg-blue-950/20 border-l-2 border-l-blue-500",
                          recommendation?.role === 'bestValue' && "bg-amber-50/70 dark:bg-amber-950/20 border-l-2 border-l-yellow-500"
                        )}
                      >
                        <Table.Td>
                          <div className="w-10 h-10 rounded-md border border-slate-200 dark:border-white/10 overflow-hidden relative bg-pure-white shrink-0">
                            <OptimizedImage
                              src={getOptimizedStorageUrl(part.imageUrl, shouldCorruptImages) || "/placeholder-part.png"}
                              alt={part.name}
                              fill
                              sizes="40px"
                              className="object-contain p-0.5"
                            />
                          </div>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" fw={600} className="line-clamp-1">
                            {part.name}
                          </Text>
                          {recommendation && <Text size="xs" fw={700} className={cn("mt-1", recommendation.role === 'bestMatch'
                            ? "text-blue-800 dark:text-blue-200" : "text-amber-800 dark:text-yellow-200")}>
                            <Sparkles size={12} className="mr-1 inline" aria-hidden="true" />
                            {recommendation.role === 'bestMatch' ? 'Best match' : 'Best value'}
                          </Text>}
                          {part.sku && (
                            <Text size="xs" c="dimmed">
                              SKU: {part.sku}
                            </Text>
                          )}
                        </Table.Td>
                        <Table.Td>
                          <Badge size="xs" variant="light" color="cyan">
                            {part.category}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" c="dimmed">
                            {part.brand || "—"}
                          </Text>
                        </Table.Td>
                        <Table.Td className="text-right">
                          <Text size="sm" fw={700} className="font-mono">
                            {formatCurrency(part.price)}
                          </Text>
                        </Table.Td>
                        <Table.Td className="text-center">
                          {isOutOfStock ? (
                            <Badge size="xs" color="red" variant="light">
                              Out of Stock
                            </Badge>
                          ) : (
                            <Badge size="xs" color="teal" variant="light">
                              In Stock
                            </Badge>
                          )}
                        </Table.Td>
                        <Table.Td className="text-right">
                          <Button
                            size="xs"
                            variant={selected ? "light" : "default"}
                            color={selected ? "red" : "cyan"}
                            leftSection={selected ? <Trash2 size={12} /> : <Plus size={12} />}
                            onClick={() => recommendation && !selected ? void recommendations?.apply(recommendation) : onTogglePart(part)}
                            disabled={isOutOfStock && !selected}
                            loading={recommendations?.applyingId === part.id}
                          >
                            {selected ? "Remove" : recommendation?.action === 'replace' ? 'Replace' : "Add"}
                          </Button>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </Paper>
          )
        ) : (
          <Paper
            withBorder
            radius="lg"
            p="xl"
            className="min-h-[300px] flex flex-col items-center justify-center text-center bg-white/40 dark:bg-[#141a23]/60 border-slate-200/70 dark:border-white/10"
          >
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-3 text-slate-400">
              <Database size={24} className="opacity-60" />
            </div>
            <Text fw={600} size="sm" mb={4}>
              No parts found
            </Text>
            <Text c="dimmed" size="xs" maw={300}>
              {searchQuery
                ? `No components match "${searchQuery}". Try a different keyword or category.`
                : "No components match the selected category filters."}
            </Text>
          </Paper>
        )}

        {/* Bottom Pagination Control */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              onPageChange={onPageChange}
              onItemsPerPageChange={onItemsPerPageChange}
              />
          </div>
        )}
      </>
    </motion.div>
  );
}
