"use client";

import React from "react";
import { Paper, Text, Group, Stack, Divider } from "@mantine/core";
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
const FpsChartPlot = dynamic(() => import('./fps-chart-plot').then(module => module.FpsChartPlot), {
  loading: () => <Skeleton className="h-full w-full" />,
  ssr: false,
});
import { estimateFPS } from "@/lib/fps-estimator";
import { useTheme } from "@/context/theme-provider";
import type { ComponentData, Resolution, WorkloadType } from "@/lib/types";

export interface FpsPerformanceChartProps {
  loading?: boolean;
  build: Record<string, ComponentData | ComponentData[] | null>;
  resolution: Resolution;
  workload: WorkloadType;
  chartHeight?: number;
  className?: string;
  withBorder?: boolean;
  hideHeader?: boolean;
}

export function FpsPerformanceChart({
  loading = false,
  build,
  resolution,
  workload,
  chartHeight = 180,
  className,
  withBorder = true,
  hideHeader = false,
}: FpsPerformanceChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const fpsData = estimateFPS(build, resolution, workload);

  if (!fpsData && !loading) {
    return (
      <Paper
        radius="md"
        p="sm"
        withBorder={withBorder}
        bg={withBorder ? undefined : "transparent"}
        style={{ backgroundColor: withBorder ? undefined : "transparent" }}
        className={className || "bg-slate-50/80 dark:bg-slate-900/50 border-slate-200 dark:border-white/10 text-center shadow-xs"}
      >
        <Text size="xs" c="dimmed">
          Select a CPU and GPU to calculate real-time FPS estimates.
        </Text>
      </Paper>
    );
  }


  return (
    <Paper
      radius="md"
      p={className ? undefined : "sm"}
      withBorder={withBorder}
      bg={withBorder ? undefined : "transparent"}
      style={{ backgroundColor: withBorder ? undefined : "transparent" }}
      className={className || "bg-slate-50/80 dark:bg-slate-900/50 border-slate-200 dark:border-white/10 shadow-xs"}
    >
      {/* Header */}
      {!hideHeader && (
        <Group justify="space-between" align="center" className="mb-2">
          <Text size="xs" fw={800} className="tracking-wider uppercase text-slate-800 dark:text-slate-200">
            Estimated Performance
          </Text>
          <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-bold">
            {resolution} • {workload}
          </span>
        </Group>
      )}
      {fpsData?.isIntegratedGraphics && (
        <Text size="xs" className="mb-2 text-amber-700 dark:text-amber-300">
          Integrated graphics estimate · shared system memory · actual FPS varies by game, RAM, and settings.
        </Text>
      )}

      {/* Metrics Row */}
      <Paper
        radius="sm"
        p="xs"
        withBorder
        bg={withBorder ? undefined : "transparent"}
        style={{ backgroundColor: withBorder ? undefined : "transparent" }}
        className={withBorder ? "bg-white/80 dark:bg-slate-950/40 border-slate-200/80 dark:border-white/5 mb-2.5 shadow-none" : "bg-transparent border-slate-200/60 dark:border-white/10 mb-2.5 shadow-none"}
      >
        <Group justify="space-around" align="center" gap="xs">
          <Stack gap={0} align="center">
            <Text size="9px" fw={800} className="tracking-wider uppercase text-cyan-700 dark:text-cyan-400">
              Average
            </Text>
            <Text fw={900} className="text-xl font-mono text-cyan-600 dark:text-cyan-400">
              {fpsData?.averageFps ?? "—"}+ <span className="text-[10px] font-sans text-slate-500 uppercase">fps</span>
            </Text>
          </Stack>

          <Divider orientation="vertical" className="border-slate-200 dark:border-white/10 h-6" />

          <Stack gap={0} align="center">
            <Text size="9px" fw={800} className="tracking-wider uppercase text-fuchsia-700 dark:text-fuchsia-400">
              1% Lows
            </Text>
            <Text fw={900} className="text-base font-mono text-fuchsia-600 dark:text-fuchsia-400">
              {fpsData?.lowsFps ?? "—"} <span className="text-[9px] font-sans text-slate-500 uppercase">fps</span>
            </Text>
          </Stack>

          <Divider orientation="vertical" className="border-slate-200 dark:border-white/10 h-6" />

          <Stack gap={0} align="center">
            <Text size="9px" fw={800} className="tracking-wider uppercase text-amber-700 dark:text-amber-400">
              Peak
            </Text>
            <Text fw={900} className="text-base font-mono text-amber-600 dark:text-amber-400">
              {fpsData?.peakFps ?? "—"} <span className="text-[9px] font-sans text-slate-500 uppercase">fps</span>
            </Text>
          </Stack>
        </Group>
      </Paper>

      {/* Chart Area */}
      <div style={{ height: chartHeight }} className="w-full -ml-3">
        {fpsData ? <FpsChartPlot fpsData={fpsData} isDark={isDark} /> : <Skeleton className="h-full w-full" />}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2.5 pt-2 border-t border-slate-200/80 dark:border-white/5">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-1.5 bg-fuchsia-500 rounded-full" />
          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">1% Lows</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-1.5 bg-cyan-400 rounded-full" />
          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Average</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-1.5 bg-amber-400 rounded-full" />
          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Peak</span>
        </div>
      </div>
    </Paper>
  );
}
