"use client";

import React from "react";
import { motion } from "framer-motion";
import { Database, Plus, Trash2 } from "lucide-react";
import {
  Paper,
  Table,
  Button,
  Badge,
  Text,
  Group,
  Stack,
  Box,
} from "@mantine/core";
import Image from "next/image";
import { formatCurrency, cn, getOptimizedStorageUrl } from "@/lib/utils";
import { InventoryToolbar } from "@/components/inventory-toolbar";
import { PartCard } from "@/components/part-card";
import { PaginationControls } from "@/components/pagination-controls";
import type { Part } from "@/lib/types";

interface InventoryViewProps {
  loading: boolean;
  paginatedParts: any[];
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
}

export function InventoryView({
  loading,
  paginatedParts,
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
}: InventoryViewProps) {
  const gridColsClass =
    gridCols === 5
      ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
      : "grid-cols-2 lg:grid-cols-4";

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
            itemCount={itemCount}
            sortBy={sortBy}
            onSortByChange={onSortByChange}
            sortDirection={sortDirection}
            onSortDirectionChange={onSortDirectionChange}
            supportedSorts={["Date Added", "Name", "Price"]}
            view={view}
            onViewChange={onViewChange}
            showViewToggle={true}
            searchQuery={searchQuery}
            onSearchQueryChange={onSearchQueryChange}
            availableBrands={availableBrands}
            selectedBrands={selectedBrands}
            onBrandChange={onBrandChange}
            hideIncompatible={hideIncompatible}
            onHideIncompatibleChange={onHideIncompatibleChange}
          />
        </div>

        {/* Content Body */}
        {loading ? null : paginatedParts.length > 0 ? (
          view === "grid" ? (
            <>
              <div className={cn("grid gap-3 md:gap-4", gridColsClass)}>
                {paginatedParts.map((part) => (
                  <PartCard
                    key={part.id}
                    part={part}
                    effectiveStock={part.effectiveStock}
                    onToggleBuild={onTogglePart}
                    isSelected={isSelected(part)}
                    compatibility={part.compatibility}
                  />
                ))}
              </div>
              <div className="mt-5">
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  itemsPerPage={itemsPerPage}
                  onPageChange={onPageChange}
                  onItemsPerPageChange={onItemsPerPageChange}
                />
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <Paper
                withBorder
                radius="lg"
                className="overflow-hidden bg-white/70 dark:bg-[#141a23]/90 border-slate-200/80 dark:border-white/10"
              >
                <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
                  <Table.Thead className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200/80 dark:border-white/10">
                    <Table.Tr>
                      <Table.Th className="text-[11px] font-semibold tracking-wider uppercase text-slate-500">
                        Part Name
                      </Table.Th>
                      <Table.Th className="text-[11px] font-semibold tracking-wider uppercase text-slate-500">
                        Availability
                      </Table.Th>
                      <Table.Th className="text-right text-[11px] font-semibold tracking-wider uppercase text-slate-500">
                        Price
                      </Table.Th>
                      <Table.Th className="w-[100px] text-right"></Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {paginatedParts.map((part) => {
                      const isPartSelected = isSelected(part);
                      const isOutOfStock = part.effectiveStock === 0 && !isPartSelected;
                      const isIncompatible = part.compatibility && !part.compatibility.compatible;

                      return (
                        <Table.Tr
                          key={part.id}
                          className={cn(
                            "transition-colors",
                            isOutOfStock && "opacity-50 grayscale",
                            isIncompatible && "bg-red-500/[0.03] dark:bg-red-500/[0.05]"
                          )}
                        >
                          {/* Part identity */}
                          <Table.Td>
                            <Group gap="sm" wrap="nowrap">
                              <Box className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-slate-200/70 dark:border-white/10 bg-slate-100/80 dark:bg-white/[0.03]">
                                <Image
                                  src={getOptimizedStorageUrl(part.imageUrl) || "/placeholder-part.png"}
                                  alt={part.name}
                                  fill
                                  className="object-contain p-1"
                                />
                              </Box>
                              <Stack gap={2} className="min-w-0">
                                <Text size="sm" fw={600} className="line-clamp-1 leading-snug">
                                  {part.name}
                                </Text>
                                <Group gap={6}>
                                  <Badge size="xs" variant="light" color="gray" radius="sm">
                                    {part.brand || "Component"}
                                  </Badge>
                                  <Text size="xs" c="dimmed">
                                    {part.category}
                                  </Text>
                                </Group>
                              </Stack>
                            </Group>
                          </Table.Td>

                          {/* Stock badge */}
                          <Table.Td>
                            <Badge
                              variant="dot"
                              size="sm"
                              color={
                                part.effectiveStock > 5
                                  ? "teal"
                                  : part.effectiveStock > 0
                                  ? "orange"
                                  : "red"
                              }
                            >
                              {part.effectiveStock > 0
                                ? `${part.effectiveStock} in stock`
                                : "Out of stock"}
                            </Badge>
                          </Table.Td>

                          {/* Price */}
                          <Table.Td className="text-right">
                            <Text size="sm" fw={700} className="font-mono">
                              {formatCurrency(part.price)}
                            </Text>
                          </Table.Td>

                          {/* Action button */}
                          <Table.Td>
                            <div className="flex justify-end">
                              {(!isIncompatible || isPartSelected) && (
                                <Button
                                  size="xs"
                                  radius="md"
                                  onClick={() => onTogglePart(part)}
                                  disabled={isOutOfStock}
                                  variant={isPartSelected ? "filled" : "light"}
                                  color={isPartSelected ? "teal" : "cyan"}
                                  leftSection={
                                    isPartSelected ? (
                                      <Trash2 className="h-3.5 w-3.5" />
                                    ) : (
                                      <Plus className="h-3.5 w-3.5" />
                                    )
                                  }
                                >
                                  {isPartSelected ? "Remove" : "Add"}
                                </Button>
                              )}
                            </div>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </Paper>
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                onPageChange={onPageChange}
                onItemsPerPageChange={onItemsPerPageChange}
              />
            </div>
          )
        ) : (
          <Paper
            withBorder
            radius="lg"
            p="xl"
            className="min-h-[360px] flex flex-col items-center justify-center text-center bg-white/40 dark:bg-[#141a23]/60 border-slate-200/70 dark:border-white/10"
          >
            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-3 text-slate-400">
              <Database className="w-6 h-6 opacity-60" />
            </div>
            <Text fw={600} size="md" mb={4}>
              No components found
            </Text>
            <Text c="dimmed" size="xs" maw={300}>
              Try adjusting your search terms or filters to explore alternative components.
            </Text>
          </Paper>
        )}
      </>
    </motion.div>
  );
}
