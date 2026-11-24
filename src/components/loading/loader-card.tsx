"use client";

import { Loader, Text } from "@mantine/core";

interface LoaderCardProps {
  message: string;
}

export function LoaderCard({ message }: LoaderCardProps) {
  return (
    <div className="flex flex-col items-center gap-3 p-6 bg-white dark:bg-[#111722] rounded-2xl shadow-xl border border-slate-200 dark:border-white/10">
      <Loader color="cyan" size="md" />
      <Text size="sm" fw={600} className="text-slate-700 dark:text-slate-300">
        {message}
      </Text>
    </div>
  );
}

