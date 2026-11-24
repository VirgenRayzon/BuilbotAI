"use client";

import { Button, Paper, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { SearchX, X } from "lucide-react";

interface SearchNoResultsProps {
  query: string;
  itemLabel: string;
  onClear: () => void;
  className?: string;
}

export function SearchNoResults({ query, itemLabel, onClear, className }: SearchNoResultsProps) {
  return (
    <Paper
      withBorder
      radius="lg"
      p={{ base: "md", sm: "lg" }}
      role="status"
      className={`flex min-h-[280px] items-center justify-center border-dashed border-slate-300 bg-white/85 text-center dark:border-white/10 dark:bg-[#111722] ${className || ""}`}
    >
      <Stack align="center" gap="md" className="mx-auto max-w-md">
        <ThemeIcon size={52} radius="xl" color="cyan" variant="light">
          <SearchX className="h-6 w-6 text-cyan-600 dark:text-cyan-400" aria-hidden="true" />
        </ThemeIcon>
        <div className="space-y-1">
          <Title order={3} className="font-headline text-lg font-bold text-slate-900 dark:text-slate-100">
            No {itemLabel} found
          </Title>
          <Text size="xs" className="text-slate-600 dark:text-slate-400">
            No results match <span className="font-semibold text-slate-800 dark:text-slate-200">“{query.trim()}”</span>. Check the spelling or try a broader term.
          </Text>
        </div>
        <Button
          size="sm"
          color="cyan"
          variant="light"
          radius="md"
          leftSection={<X className="h-3.5 w-3.5" />}
          onClick={onClear}
          className="min-h-11"
        >
          Clear search
        </Button>
      </Stack>
    </Paper>
  );
}
