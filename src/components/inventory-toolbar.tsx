
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
import { ScrollArea, ScrollBar } from "./ui/scroll-area";

type Category = {
  name: string;
  selected: boolean;
  icon?: React.ElementType;
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
}: InventoryToolbarProps) {
  const hasIcons = React.useMemo(() => categories.some(c => c.icon), [categories]);

  const handleToggleChange = (value: string[]) => {
    const newSelection = value.length > 0 ? value : categories.map(c => c.name);
    categories.forEach(cat => {
      onCategoryChange(cat.name, newSelection.includes(cat.name));
    });
  };

  const selectedForToggle = categories.filter(c => c.selected).map(c => c.name);

  return (
    <div className="space-y-4">
      {hasIcons && (
        <ScrollArea className="w-full whitespace-nowrap">
          <ToggleGroup
            type="multiple"
            variant="outline"
            value={selectedForToggle}
            onValueChange={handleToggleChange}
            className="justify-start gap-2 pb-1"
          >
            {categories.map((cat) => {
              const Icon = cat.icon!;
              return (
                <ToggleGroupItem key={cat.name} value={cat.name} aria-label={`Toggle ${cat.name}`}>
                  <Icon className="mr-2 h-4 w-4" />
                  {cat.name}
                </ToggleGroupItem>
              );
            })}
          </ToggleGroup>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-card p-2">
        <div className="flex flex-wrap items-center gap-2">
          {!hasIcons && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Categories
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
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
              <Button variant="outline">
                <ArrowUpDown className="mr-2 h-4 w-4" />
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

          <Button variant="ghost" size="sm" onClick={() => onSortDirectionChange(sortDirection === 'asc' ? 'desc' : 'asc')}>
            {sortDirection === 'asc' ? (
              <ArrowUpAZ className="mr-2 h-4 w-4" />
            ) : (
              <ArrowDownAZ className="mr-2 h-4 w-4" />
            )}
            {sortDirection.toUpperCase()}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="hidden sm:inline-flex">
            Showing {itemCount} items
          </Badge>
          {showViewToggle && view && onViewChange && (
            <ToggleGroup type="single" value={view} onValueChange={(v) => v && onViewChange(v as 'grid' | 'list')} variant="outline" className="hidden sm:flex">
              <ToggleGroupItem value="list" aria-label="Toggle list view">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="grid" aria-label="Toggle grid view">
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          )}
        </div>
      </div>
    </div>
  );
}
