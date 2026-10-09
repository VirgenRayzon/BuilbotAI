import { Paper, Text } from '@mantine/core';
import type { useQuickBuildChecks } from '@/hooks/use-quick-build-checks';

export function QuickReviewChecks({ checks }: { checks: ReturnType<typeof useQuickBuildChecks> }) {
  return (
    <div className="w-full max-w-2xl grid gap-3 sm:grid-cols-2 text-left">
      <Paper withBorder radius="md" p="md" className="bg-slate-50 dark:bg-[#111722] border-slate-200 dark:border-white/10">
        <Text fw={700} size="sm" className="text-slate-900 dark:text-slate-100">Compatibility check</Text>
        {checks.compatibility.length > 0 ? (
          <ul className="mt-2 space-y-1 text-xs text-red-700 dark:text-red-300">
            {checks.compatibility.map((issue, index) => <li key={index}>{issue.message}</li>)}
          </ul>
        ) : (
          <Text size="xs" className="mt-2 text-slate-600 dark:text-slate-400">No issues found in the selected specifications.</Text>
        )}
      </Paper>
      <Paper withBorder radius="md" p="md" className="bg-slate-50 dark:bg-[#111722] border-slate-200 dark:border-white/10">
        <Text fw={700} size="sm" className="text-slate-900 dark:text-slate-100">System balance</Text>
        <Text size="xs" className="mt-2 text-slate-600 dark:text-slate-400">{checks.balance.message}</Text>
        {checks.fps && (
          <Text size="xs" className="mt-2 text-slate-600 dark:text-slate-400">
            Approximate {checks.resolution} baseline: {checks.fps.averageFps} FPS. Game results vary.
          </Text>
        )}
      </Paper>
    </div>
  );
}
