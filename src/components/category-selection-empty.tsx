"use client";

import { Button, Paper, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { ListFilter, RotateCcw } from "lucide-react";

interface CategorySelectionEmptyProps {
  itemLabel: string;
  categoryLabel?: string;
  onSelectAll: () => void;
  className?: string;
}

export function CategorySelectionEmpty({ itemLabel, categoryLabel = "Categories", onSelectAll, className }: CategorySelectionEmptyProps) {
  const label = categoryLabel.toLowerCase();
  const singularLabel = label === "categories" ? "category" : label.replace(/s$/, "");

  return (
    <Paper withBorder radius="lg" p={{ base: "md", sm: "lg" }} role="status" className={`flex min-h-[280px] items-center justify-center border-dashed border-slate-300 bg-white/85 text-center dark:border-white/10 dark:bg-[#111722] ${className || ""}`}>
      <Stack align="center" gap="md" className="mx-auto max-w-md">
        <ThemeIcon size={52} radius="xl" color="cyan" variant="light">
          <ListFilter className="h-6 w-6 text-cyan-600 dark:text-cyan-400" aria-hidden="true" />
        </ThemeIcon>
        <div className="space-y-1">
          <Title order={3} className="font-headline text-lg font-bold text-slate-900 dark:text-slate-100">No {label} selected</Title>
          <Text size="sm" className="text-slate-600 dark:text-slate-400">Select at least one {singularLabel} to show {itemLabel}.</Text>
        </div>
        <Button size="sm" color="cyan" variant="light" radius="md" leftSection={<RotateCcw className="h-3.5 w-3.5" />} onClick={onSelectAll} className="min-h-11">
          Select all {label}
        </Button>
      </Stack>
    </Paper>
  );
}
