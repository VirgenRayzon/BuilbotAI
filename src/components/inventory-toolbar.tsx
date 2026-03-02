
"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import {
  List,
  LayoutGrid,
  Filter,
  ArrowUpDown,
  ArrowDownAZ,
  ArrowUpAZ,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import React from "react";
import { Layers, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

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
}: InventoryToolbarProps) {
  const hasIcons = React.useMemo(() => categories.some(c => c.icon), [categories]);

  const handleToggleChange = (value: string) => {
    if (!value) return; // Don't allow deselecting everything without clicking another button
    onCategoryChange(value, true);
  };

  const allSelected = categories.every(c => c.selected);
  const selectedValue = allSelected ? "All" : categories.find(c => c.selected)?.name || "All";

  return (
    <div className="space-y-4">
      {hasIcons && (
        <ToggleGroup
          type="single"
          variant="outline"
          value={selectedValue}
          onValueChange={handleToggleChange}
          className="flex flex-wrap gap-2 w-full"
        >
          <ToggleGroupItem
            value="All"
            aria-label="Show all categories"
            className="px-3 py-2 h-10 flex flex-row items-center gap-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground transition-all border border-transparent data-[state=off]:border-border data-[state=off]:hover:bg-accent rounded-md min-w-fit"
          >
            <Layers className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium">All</span>
          </ToggleGroupItem>
          {categories.map((cat) => {
            const Icon = cat.icon!;
            return (
              <ToggleGroupItem
                key={cat.name}
                value={cat.name}
                aria-label={`Toggle ${cat.name}`}
                className="px-3 py-2 h-10 flex flex-row items-center gap-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground transition-all border border-transparent data-[state=off]:border-border data-[state=off]:hover:bg-accent rounded-md min-w-fit"
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="text-sm font-medium">{cat.name}</span>
              </ToggleGroupItem>
            );
          })}
        </ToggleGroup>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-card border p-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {onSearchQueryChange && (
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="pl-8 h-9 bg-background focus-visible:ring-1"
                value={searchQuery || ''}
                onChange={(e) => onSearchQueryChange(e.target.value)}
              />
            </div>
          )}

          {!hasIcons && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9">
                  <Filter className="mr-2 h-4 w-4" />
                  Categories
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start">
                <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={categories.every(c => c.selected)}
                  onCheckedChange={() => onCategoryChange('All', true)}
                  className="font-bold"
                >
                  All Categories
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                {categories.map((cat) => (
                  <DropdownMenuCheckboxItem
                    key={cat.name}
                    checked={cat.selected}
                    onCheckedChange={(checked) => onCategoryChange(cat.name, !!checked)}
                  >
                    {cat.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9 font-normal">
                <ArrowUpDown className="mr-2 h-4 w-4 text-muted-foreground" />
                Sort by {sortBy}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {supportedSorts.map(sortOption => (
                <DropdownMenuCheckboxItem
                  key={sortOption}
                  checked={sortBy === sortOption}
                  onCheckedChange={() => onSortByChange(sortOption)}
                >
                  {sortOption}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="sm" onClick={() => onSortDirectionChange(sortDirection === 'asc' ? 'desc' : 'asc')} className="h-9 font-normal hidden sm:inline-flex">
            {sortDirection === 'asc' ? (
              <ArrowUpAZ className="mr-2 h-4 w-4 text-muted-foreground" />
            ) : (
              <ArrowDownAZ className="mr-2 h-4 w-4 text-muted-foreground" />
            )}
            {sortDirection.toUpperCase()}
          </Button>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="hidden sm:inline-flex font-medium bg-muted/50 px-3 py-1.5 rounded-md">
            Showing {itemCount} items
          </span>
          {showViewToggle && view && onViewChange && (
            <div className="flex items-center border rounded-md p-1 bg-background">
              <ToggleGroup type="single" value={view} onValueChange={(v) => v && onViewChange(v as 'grid' | 'list')} className="gap-1">
                <ToggleGroupItem value="list" aria-label="Toggle list view" className="h-7 w-7 px-0">
                  <List className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="grid" aria-label="Toggle grid view" className="h-7 w-7 px-0">
                  <LayoutGrid className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
