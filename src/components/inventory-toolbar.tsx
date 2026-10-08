"use client";

import React, { useMemo } from "react";
import {
  TextInput,
  Button,
  ActionIcon,
  Menu,
  Checkbox,
  ScrollArea,
  Badge,
  SegmentedControl,
  Group,
  Paper,
  Text,
} from "@mantine/core";
import {
  List,
  LayoutGrid,
  Filter,
  ArrowUpDown,
  ArrowDownAZ,
  ArrowUpAZ,
  CheckCircle2,
  Search,
  Check,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Category = {
  name: string;
  selected: boolean;
  icon?: React.ComponentType<{ className?: string }>;
};

interface InventoryToolbarProps {
  categories: Category[];
  onCategoryChange: (categoryName: string, selected: boolean) => void;
  itemCount: number;

  sortBy: string;
  onSortByChange: (value: string) => void;
  sortDirection: 'asc' | 'desc';
  onSortDirectionChange: (value: 'asc' | 'desc') => void;
  supportedSorts: string[];

  view?: 'grid' | 'list';
  onViewChange?: (value: 'grid' | 'list') => void;
  showViewToggle?: boolean;

  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;

  showDetails?: boolean;
  onShowDetailsChange?: (value: boolean) => void;

  availableBrands?: string[];
  selectedBrands?: string[];
  onBrandChange?: (brands: string[]) => void;

  hideIncompatible?: boolean;
  onHideIncompatibleChange?: (value: boolean) => void;
}

export function InventoryToolbar({
  categories,
  onCategoryChange,
  itemCount,
  sortBy,
  onSortByChange,
  sortDirection,
  onSortDirectionChange,
  supportedSorts,
  view,
  onViewChange,
  showViewToggle = false,
  searchQuery,
  onSearchQueryChange,
  showDetails,
  onShowDetailsChange,
  availableBrands = [],
  selectedBrands = [],
  onBrandChange,
  hideIncompatible,
  onHideIncompatibleChange,
}: InventoryToolbarProps) {
  const hasIcons = useMemo(() => categories.some((c) => c.icon), [categories]);

  const allSelected = categories.every((c) => c.selected);
  const selectedCount = categories.filter((c) => c.selected).length;

  return (
    <div className="space-y-3">
      {/* Optional Top Category Bar when icons are supplied */}
      {hasIcons && (
        <div className="flex flex-wrap gap-2 w-full">
          <Button
            size="xs"
            radius="md"
            variant={allSelected ? "filled" : "default"}
            color={allSelected ? "cyan" : undefined}
            leftSection={<Layers size={14} />}
            onClick={() => onCategoryChange("All", true)}
          >
            All
          </Button>
          {categories.map((cat) => {
            const Icon = cat.icon!;
            return (
              <Button
                key={cat.name}
                size="xs"
                radius="md"
                variant={cat.selected && !allSelected ? "filled" : "default"}
                color={cat.selected && !allSelected ? "cyan" : undefined}
                leftSection={<Icon className="h-3.5 w-3.5" />}
                onClick={() => onCategoryChange(cat.name, true)}
              >
                {cat.name}
              </Button>
            );
          })}
        </div>
      )}

      {/* Main Toolbar Surface */}
      <Paper
        withBorder
        radius="lg"
        p="xs"
        className="bg-white/80 dark:bg-[#141a23]/90 border-slate-200/80 dark:border-white/10"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left Controls: Search & Filters */}
          <div className="flex flex-wrap items-center gap-2 flex-grow sm:flex-grow-0">
            {onSearchQueryChange && (
              <TextInput
                placeholder="Search..."
                value={searchQuery || ""}
                onChange={(e) => onSearchQueryChange(e.currentTarget.value)}
                leftSection={<Search size={15} className="text-slate-400" />}
                size="sm"
                radius="md"
                className="w-full sm:w-56"
              />
            )}

            {/* Categories Dropdown Filter */}
            {!hasIcons && (
              <Menu shadow="md" width={220} radius="md" closeOnItemClick={false}>
                <Menu.Target>
                  <Button
                    variant="default"
                    size="sm"
                    radius="md"
                    leftSection={<Filter size={14} className="text-slate-400" />}
                  >
                    Categories
                    {!allSelected && selectedCount > 0 && (
                      <Badge size="xs" variant="filled" color="cyan" circle ml={6}>
                        {selectedCount}
                      </Badge>
                    )}
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>Filter by Category</Menu.Label>
                  <div className="px-2 py-1.5">
                    <Checkbox
                      label="All Categories"
                      size="xs"
                      checked={allSelected}
                      onChange={() => onCategoryChange("All", true)}
                    />
                  </div>
                  <Menu.Divider />
                  <ScrollArea.Autosize mah={240}>
                    <div className="space-y-1 px-2 py-1">
                      {categories.map((cat) => (
                        <Checkbox
                          key={cat.name}
                          label={cat.name}
                          size="xs"
                          checked={cat.selected}
                          onChange={(e) =>
                            onCategoryChange(cat.name, e.currentTarget.checked)
                          }
                        />
                      ))}
                    </div>
                  </ScrollArea.Autosize>
                </Menu.Dropdown>
              </Menu>
            )}

            {/* Brands Dropdown Filter */}
            {availableBrands.length > 0 && onBrandChange && (
              <Menu shadow="md" width={220} radius="md" closeOnItemClick={false}>
                <Menu.Target>
                  <Button
                    variant="default"
                    size="sm"
                    radius="md"
                    leftSection={<Filter size={14} className="text-slate-400" />}
                  >
                    Brands
                    {selectedBrands.length > 0 && (
                      <Badge size="xs" variant="filled" color="cyan" circle ml={6}>
                        {selectedBrands.length}
                      </Badge>
                    )}
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>Filter by Brand</Menu.Label>
                  <div className="px-2 py-1.5">
                    <Checkbox
                      label="All Brands"
                      size="xs"
                      checked={selectedBrands.length === 0}
                      onChange={() => onBrandChange([])}
                    />
                  </div>
                  <Menu.Divider />
                  <ScrollArea.Autosize mah={240}>
                    <div className="space-y-1 px-2 py-1">
                      {availableBrands.map((brand) => (
                        <Checkbox
                          key={brand}
                          label={brand}
                          size="xs"
                          checked={selectedBrands.includes(brand)}
                          onChange={(e) => {
                            if (e.currentTarget.checked) {
                              onBrandChange([...selectedBrands, brand]);
                            } else {
                              onBrandChange(selectedBrands.filter((b) => b !== brand));
                            }
                          }}
                        />
                      ))}
                    </div>
                  </ScrollArea.Autosize>
                </Menu.Dropdown>
              </Menu>
            )}

            {/* Sort Dropdown */}
            <Menu shadow="md" width={180} radius="md">
              <Menu.Target>
                <Button
                  variant="default"
                  size="sm"
                  radius="md"
                  leftSection={<ArrowUpDown size={14} className="text-slate-400" />}
                >
                  Sort by {sortBy}
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Sort Options</Menu.Label>
                {supportedSorts.map((sortOption) => (
                  <Menu.Item
                    key={sortOption}
                    onClick={() => onSortByChange(sortOption)}
                    rightSection={
                      sortBy === sortOption ? (
                        <Check size={14} className="text-cyan-500" />
                      ) : null
                    }
                  >
                    {sortOption}
                  </Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>

            {/* Direction Toggle */}
            <ActionIcon
              variant="default"
              size="lg"
              radius="md"
              onClick={() =>
                onSortDirectionChange(sortDirection === "asc" ? "desc" : "asc")
              }
              title={`Sort: ${sortDirection.toUpperCase()}`}
            >
              {sortDirection === "asc" ? (
                <ArrowUpAZ size={16} className="text-slate-500" />
              ) : (
                <ArrowDownAZ size={16} className="text-slate-500" />
              )}
            </ActionIcon>

            {/* Hide Incompatible Toggle */}
            {onHideIncompatibleChange !== undefined && (
              <Button
                variant={hideIncompatible ? "light" : "default"}
                color={hideIncompatible ? "cyan" : "gray"}
                size="sm"
                radius="md"
                onClick={() => onHideIncompatibleChange(!hideIncompatible)}
                leftSection={
                  <CheckCircle2
                    size={14}
                    className={hideIncompatible ? "text-cyan-500" : "text-slate-400"}
                  />
                }
              >
                Hide Incompatible
              </Button>
            )}
          </div>

          {/* Right Controls: Specs Toggle, Counter & Grid/List Switcher */}
          <Group gap="xs" align="center">
            {onShowDetailsChange && (
              <Button
                variant={showDetails ? "light" : "default"}
                color={showDetails ? "cyan" : "gray"}
                size="sm"
                radius="md"
                onClick={() => onShowDetailsChange(!showDetails)}
                leftSection={<Layers size={14} />}
              >
                {showDetails ? "Hide Specs" : "Show Specs"}
              </Button>
            )}

            <Badge
              variant="light"
              color="gray"
              size="sm"
              radius="sm"
              className="hidden sm:inline-flex font-medium"
            >
              {itemCount} items
            </Badge>

            {showViewToggle && view && onViewChange && (
              <SegmentedControl
                value={view}
                onChange={(val) => onViewChange(val as "grid" | "list")}
                size="xs"
                radius="md"
                data={[
                  {
                    value: "grid",
                    label: (
                      <div className="flex items-center justify-center p-0.5" title="Grid View">
                        <LayoutGrid size={15} />
                      </div>
                    ),
                  },
                  {
                    value: "list",
                    label: (
                      <div className="flex items-center justify-center p-0.5" title="List View">
                        <List size={15} />
                      </div>
                    ),
                  },
                ]}
              />
            )}
          </Group>
        </div>
      </Paper>
    </div>
  );
}
