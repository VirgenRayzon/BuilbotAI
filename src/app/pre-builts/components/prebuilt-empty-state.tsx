import React from 'react';
import { Paper, Text } from '@mantine/core';
import { SearchX, MonitorOff } from 'lucide-react';

interface PrebuiltEmptyStateProps {
  searchQuery: string;
}

export function PrebuiltEmptyState({ searchQuery }: PrebuiltEmptyStateProps) {
  return (
    <Paper
      withBorder
      radius="lg"
      p="xl"
      className="min-h-[360px] flex flex-col items-center justify-center text-center bg-white/40 dark:bg-[#141a23]/60 border-slate-200/70 dark:border-white/10"
    >
      <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-3 text-slate-400">
        {searchQuery ? (
          <SearchX className="h-6 w-6 opacity-60" />
        ) : (
          <MonitorOff className="h-6 w-6 opacity-60" />
        )}
      </div>
      <Text fw={600} size="md" mb={4}>
        No pre-built systems found
      </Text>
      <Text c="dimmed" size="xs" maw={320}>
        {searchQuery
          ? `No systems match "${searchQuery}". Try adjusting your search query or tier filters.`
          : 'No pre-built systems match the currently selected criteria.'}
      </Text>
    </Paper>
  );
}
