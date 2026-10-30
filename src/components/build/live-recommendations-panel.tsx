'use client';

import { Group, Paper, Radio, SimpleGrid, Stack, Switch, Text, TextInput, ThemeIcon } from '@mantine/core';
import { WalletCards } from 'lucide-react';
import { AiDisclaimer } from '@/components/ai-disclaimer';
import { formatCurrency } from '@/lib/utils';
import type { useLiveBuildRecommendations } from '@/hooks/use-live-build-recommendations';
import type { WorkloadType } from '@/lib/types';
import { BudgetSlider, MAX_BUDGET, MIN_BUDGET } from '@/components/budget-slider';

type RecommendationState = ReturnType<typeof useLiveBuildRecommendations>;

/** The sidebar owns only the whole-build budget. */
export function LiveRecommendationsPanel({
  state,
  workload,
  onWorkloadChange,
  autoRecommendationsEnabled,
  onAutoRecommendationsChange,
}: {
  state: RecommendationState;
  workload: WorkloadType;
  onWorkloadChange: (workload: WorkloadType) => void;
  autoRecommendationsEnabled: boolean;
  onAutoRecommendationsChange: (enabled: boolean) => void;
}) {
  const minimum = state.projection?.minimumCompleteTotal;
  const shortfall = state.budget && minimum != null
    ? Math.max(0, minimum - state.budget) : null;
  const useCase = workload === 'Balanced' ? 'AAA' : workload;
  const sliderBudget = Math.min(MAX_BUDGET, Math.max(MIN_BUDGET, state.budget ?? MIN_BUDGET));
  const useCaseDetails: Record<Exclude<WorkloadType, 'Balanced'>, string> = {
    AAA: 'Prioritizes GPU performance and visual quality for demanding games.',
    Esports: 'Prioritizes responsive CPU performance for high-frame-rate play.',
    VideoEditing: 'Prioritizes CPU throughput, memory, and fast project storage.',
    Rendering: 'Prioritizes GPU compute, VRAM, and sustained multicore performance.',
    Office: 'Prioritizes value, efficiency, and responsive everyday performance.',
  };

  return (
    <Paper withBorder radius="lg" shadow="sm" p={12}
      className="border-slate-200 bg-white/85 dark:border-white/10 dark:bg-[#141a23]/90">
      <Stack gap="md">
        <Group gap="sm" wrap="nowrap">
          <ThemeIcon size="md" radius="md" variant="light" color="yellow">
            <WalletCards size={16} />
          </ThemeIcon>
          <div>
            <Text size="sm" fw={700} className="text-slate-900 dark:text-slate-100">
              Total PC budget (optional)
            </Text>
            <Text size="xs" className="text-slate-600 dark:text-slate-400">
              Covers all required parts in the finished build.
            </Text>
          </div>
        </Group>
        <Group justify="space-between" gap="sm" wrap="nowrap" className="min-h-11">
          <div>
            <Text size="xs" fw={700} className="text-slate-800 dark:text-slate-200">
              Auto Recommendation
            </Text>
            <Text size="10px" className="text-slate-500 dark:text-slate-400">
              Highlight the best match and best value automatically.
            </Text>
          </div>
          <Switch
            checked={autoRecommendationsEnabled}
            onChange={event => onAutoRecommendationsChange(event.currentTarget.checked)}
            aria-label="Enable Auto Recommendation"
            color="cyan"
            size="sm"
          />
        </Group>
        <div>
          <Text size="xs" fw={700} mb={6} className="text-slate-700 dark:text-slate-300">
            Use case
          </Text>
          <Radio.Group
            value={useCase}
            onChange={value => onWorkloadChange(value as WorkloadType)}
            aria-label="Recommendation use case"
          >
            <SimpleGrid cols={2} spacing={0}>
              {[
                ['AAA', 'AAA gaming'],
                ['Esports', 'Competitive'],
                ['VideoEditing', 'Video editing'],
                ['Rendering', '3D rendering'],
                ['Office', 'Office use'],
              ].map(([value, label], index) => (
                <Radio
                  key={value}
                  value={value}
                  label={label}
                  size="xs"
                  color="cyan"
                  className={index === 4 ? 'col-span-2' : undefined}
                  classNames={{
                    root: 'flex min-h-8 items-center px-1',
                    label: 'cursor-pointer text-[11px] font-semibold text-slate-700 dark:text-slate-200',
                    body: 'w-full items-center',
                  }}
                />
              ))}
            </SimpleGrid>
          </Radio.Group>
          <Text size="xs" mt={5} className="text-slate-500 dark:text-slate-400">
            {useCaseDetails[useCase]}
          </Text>
        </div>
        <div>
          <TextInput
            size="sm" type="number" min={MIN_BUDGET} max={10_000_000}
            label="Budget in PHP" placeholder="Enter total budget"
            leftSection={<Text size="xs" fw={700} c="dimmed">₱</Text>}
            value={state.budgetInput}
            onChange={event => state.setBudgetInput(event.currentTarget.value)}
            classNames={{ input: 'min-h-11 bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10' }}
          />
          <div>
            <BudgetSlider
              value={sliderBudget}
              onChange={value => state.setBudgetInput(String(value))}
            />
            <AiDisclaimer className="mt-2">
              Setting a budget does not guarantee every recommendation will fall within it. Compatibility and availability may require higher-priced parts.
            </AiDisclaimer>
          </div>
        </div>
        {state.budget && (
          <Paper withBorder radius="md" p="sm"
            className="space-y-1 border-slate-200 bg-slate-50/70 dark:border-white/10 dark:bg-white/[0.03]">
                <Group justify="space-between" gap="xs">
                  <Text size="xs" className="text-slate-600 dark:text-slate-400">Estimated minimum total</Text>
                  <Text size="xs" fw={700} className="text-slate-900 dark:text-slate-100">
                    {minimum == null ? 'Unavailable' : formatCurrency(minimum)}
                  </Text>
                </Group>
                <Group justify="space-between" gap="xs">
                  <Text size="xs" className="text-slate-600 dark:text-slate-400">Budget shortfall</Text>
                  <Text size="xs" fw={700} className={shortfall != null && shortfall > 0
                    ? 'text-rose-700 dark:text-rose-300'
                    : 'text-slate-900 dark:text-slate-100'}>
                    {shortfall == null ? 'Unavailable' : formatCurrency(shortfall)}
                  </Text>
                </Group>
          </Paper>
        )}
      </Stack>
    </Paper>
  );
}
