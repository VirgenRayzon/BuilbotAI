"use client";

import React from "react";
import { Paper, Text, Group, Stack, Divider } from "@mantine/core";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { estimateFPS } from "@/lib/fps-estimator";
import { useTheme } from "@/context/theme-provider";
import type { ComponentData, Resolution, WorkloadType } from "@/lib/types";

interface FpsPerformanceChartProps {
  build: Record<string, ComponentData | ComponentData[] | null>;
  resolution: Resolution;
  workload: WorkloadType;
  chartHeight?: number;
}

export function FpsPerformanceChart({
  build,
  resolution,
  workload,
  chartHeight = 180,
}: FpsPerformanceChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const fpsData = estimateFPS(build, resolution, workload);

  if (!fpsData) {
    return (
      <Paper
        radius="md"
        p="sm"
        withBorder
        className="bg-slate-50/80 dark:bg-slate-900/50 border-slate-200 dark:border-white/10 text-center shadow-xs"
      >
        <Text size="xs" c="dimmed">
          Select a CPU and GPU to calculate real-time FPS estimates.
        </Text>
      </Paper>
    );
  }

  const gridStroke = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const tickColor = isDark ? "#94a3b8" : "#475569";

  return (
    <Paper
      radius="md"
      p="sm"
      withBorder
      className="bg-slate-50/80 dark:bg-slate-900/50 border-slate-200 dark:border-white/10 shadow-xs"
    >
      {/* Header */}
      <Group justify="space-between" align="center" className="mb-2">
        <Text size="xs" fw={800} className="tracking-wider uppercase text-slate-800 dark:text-slate-200">
          Estimated Performance
        </Text>
        <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-bold">
          {resolution} • {workload}
        </span>
      </Group>

      {/* Metrics Row */}
      <Paper
        radius="sm"
        p="xs"
        withBorder
        className="bg-white/80 dark:bg-slate-950/40 border-slate-200/80 dark:border-white/5 mb-2.5 shadow-none"
      >
        <Group justify="space-around" align="center" gap="xs">
          <Stack gap={0} align="center">
            <Text size="9px" fw={800} className="tracking-wider uppercase text-cyan-700 dark:text-cyan-400">
              Average
            </Text>
            <Text fw={900} className="text-xl font-mono text-cyan-600 dark:text-cyan-400">
              {fpsData.averageFps}+ <span className="text-[10px] font-sans text-slate-500 uppercase">fps</span>
            </Text>
          </Stack>

          <Divider orientation="vertical" className="border-slate-200 dark:border-white/10 h-6" />

          <Stack gap={0} align="center">
            <Text size="9px" fw={800} className="tracking-wider uppercase text-fuchsia-700 dark:text-fuchsia-400">
              1% Lows
            </Text>
            <Text fw={900} className="text-base font-mono text-fuchsia-600 dark:text-fuchsia-400">
              {fpsData.lowsFps} <span className="text-[9px] font-sans text-slate-500 uppercase">fps</span>
            </Text>
          </Stack>

          <Divider orientation="vertical" className="border-slate-200 dark:border-white/10 h-6" />

          <Stack gap={0} align="center">
            <Text size="9px" fw={800} className="tracking-wider uppercase text-amber-700 dark:text-amber-400">
              Peak
            </Text>
            <Text fw={900} className="text-base font-mono text-amber-600 dark:text-amber-400">
              {fpsData.peakFps} <span className="text-[9px] font-sans text-slate-500 uppercase">fps</span>
            </Text>
          </Stack>
        </Group>
      </Paper>

      {/* Chart Area */}
      <div style={{ height: chartHeight }} className="w-full -ml-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={fpsData.chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAvgBneck" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorLowsBneck" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#d946ef" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#d946ef" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorPeakBneck" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="0" vertical={false} stroke={gridStroke} />
            <XAxis
              dataKey="resolution"
              axisLine={false}
              tickLine={false}
              tick={{ fill: tickColor, fontSize: 10, fontWeight: 600 }}
              dy={6}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: tickColor, fontSize: 10, fontWeight: 600 }}
              domain={[0, 360]}
              ticks={[0, 120, 240, 360]}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white/95 dark:bg-[#151922]/95 backdrop-blur-md border border-slate-300 dark:border-white/15 p-2.5 rounded-lg shadow-xl text-[11px]">
                      <div className="font-bold text-slate-700 dark:text-slate-300 mb-1 border-b border-slate-200 dark:border-white/10 pb-1">
                        {payload[0]?.payload?.resolution} FPS Details
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between gap-3 text-amber-600 dark:text-amber-400 font-bold">
                          <span>Peak:</span>
                          <span>{payload[2]?.value ?? payload.find(p => p.dataKey === 'peak')?.value} FPS</span>
                        </div>
                        <div className="flex justify-between gap-3 text-cyan-600 dark:text-cyan-400 font-bold">
                          <span>Average:</span>
                          <span>{payload[1]?.value ?? payload.find(p => p.dataKey === 'average')?.value} FPS</span>
                        </div>
                        <div className="flex justify-between gap-3 text-fuchsia-600 dark:text-fuchsia-400 font-semibold">
                          <span>1% Lows:</span>
                          <span>{payload[0]?.value ?? payload.find(p => p.dataKey === 'lows')?.value} FPS</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="lows"
              stroke="#e879f9"
              strokeWidth={1.5}
              fill="url(#colorLowsBneck)"
            />
            <Area
              type="monotone"
              dataKey="average"
              stroke="#22d3ee"
              strokeWidth={2.5}
              fill="url(#colorAvgBneck)"
            />
            <Area
              type="monotone"
              dataKey="peak"
              stroke="#fbbf24"
              strokeWidth={1.5}
              fill="url(#colorPeakBneck)"
            />
          </AreaChart>
        </ResponsiveContainer>
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
