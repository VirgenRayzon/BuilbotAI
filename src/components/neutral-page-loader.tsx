'use client';

import { Loader, Text } from '@mantine/core';

export function NeutralPageLoader({ message = 'Verifying your account...' }: { message?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900 dark:bg-[#0c0f14] dark:text-slate-100">
      <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
        <Loader color="cyan" size="md" />
        <Text size="sm" c="dimmed">{message}</Text>
      </div>
    </div>
  );
}
