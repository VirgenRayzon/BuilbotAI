'use client';

import { Group, Slider, Text } from '@mantine/core';
import { cn } from '@/lib/utils';

export const MIN_BUDGET = 10_000;
export const MAX_BUDGET = 200_000;
export const BUDGET_STEP = 10_000;

const BUDGET_MARKS = Array.from(
  { length: (MAX_BUDGET - MIN_BUDGET) / BUDGET_STEP + 1 },
  (_, index) => ({ value: MIN_BUDGET + index * BUDGET_STEP })
);

function formatBudget(value: number) {
  return value.toLocaleString('en-PH');
}

export function BudgetSlider({
  value,
  onChange,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}) {
  return (
    <div className={cn('px-8 pt-3', className)}>
      <Slider
        aria-label="Budget in Philippine pesos"
        min={MIN_BUDGET}
        max={MAX_BUDGET}
        step={BUDGET_STEP}
        marks={BUDGET_MARKS}
        value={value}
        onChange={onChange}
        label={sliderValue => `₱${formatBudget(sliderValue)}`}
        color="cyan"
        size="sm"
        thumbSize={18}
      />
      <Group justify="space-between" mt={8} gap="xs">
        <Text size="10px" c="dimmed" fw={600}>₱10,000</Text>
        <Text size="10px" c="dimmed" fw={600}>₱200,000</Text>
      </Group>
    </div>
  );
}
