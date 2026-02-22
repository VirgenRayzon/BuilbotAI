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

type Category = {
  name: string;
  selected: boolean;
};

interface InventoryToolbarProps {
  categories: Category[];
  onCategoryChange: (categoryName: string, selected: boolean) => void;
  itemCount: number;
}

export function InventoryToolbar({
  categories,
  onCategoryChange,
  itemCount,
}: InventoryToolbarProps) {
  const [sortAsc, setSortAsc] = React.useState(true);
  const [view, setView] = React.useState("grid");

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-card p-2">
      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              All Categories
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Sort by Name
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuCheckboxItem checked>Name</DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem>Price</DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem>Date Added</DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="sm" onClick={() => setSortAsc(!sortAsc)}>
          {sortAsc ? (
            <ArrowUpAZ className="mr-2 h-4 w-4" />
          ) : (
            <ArrowDownAZ className="mr-2 h-4 w-4" />
          )}
          {sortAsc ? "ASC" : "DESC"}
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="hidden sm:inline-flex">
          Showing {itemCount} items
        </Badge>
        <ToggleGroup type="single" value={view} onValueChange={setView} variant="outline" className="hidden sm:flex">
          <ToggleGroupItem value="list" aria-label="Toggle list view">
            <List className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="grid" aria-label="Toggle grid view">
            <LayoutGrid className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
}
