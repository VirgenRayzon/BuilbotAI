"use client";

import React, { useState } from "react";
import { Drawer, Paper, Text, Group, Badge, Button, Select, Stack, ActionIcon } from "@mantine/core";
import { Gauge, Monitor, Zap, ChevronRight, Activity, X } from "lucide-react";
import type { ComponentData, Resolution, WorkloadType } from "@/lib/types";
import { calculateSynergyScore, calculateBottleneck } from "@/lib/bottleneck";
import { SynergyGaugeCard } from "./synergy-gauge-card";
import { BottleneckStatusCard } from "./bottleneck-status-card";
import { FpsPerformanceChart } from "./fps-performance-chart";
import { OptimizationSwapsCard } from "./optimization-swaps-card";

interface PrototypeSlideDrawerProps {
  build: Record<string, ComponentData | ComponentData[] | null>;
  resolution: Resolution;
  onResolutionChange: (res: Resolution) => void;
  workload: WorkloadType;
  onWorkloadChange: (workload: WorkloadType) => void;
  analysis?: any;
  onApplySuggestion?: (category: string, partId: string) => void;
}

export function PrototypeSlideDrawer({
  build,
  resolution,
  onResolutionChange,
  workload,
  onWorkloadChange,
  analysis,
  onApplySuggestion,
}: PrototypeSlideDrawerProps) {
  const [opened, setOpened] = useState(false);
  const synergy = calculateSynergyScore(build, resolution);
  const bottleneck = calculateBottleneck(build, resolution);

  return (
    <>
      {/* Compact Trigger Card inside YourBuild */}
      <Paper
        withBorder
        radius="md"
        p="xs"
        className="mx-4 my-2.5 bg-gradient-to-r from-slate-50 to-cyan-50/30 dark:from-slate-900/60 dark:to-cyan-950/20 border-cyan-500/30 cursor-pointer hover:border-cyan-500/60 transition-all shadow-xs"
        onClick={() => setOpened(true)}
      >
        <Group justify="space-between" align="center">
          <Group gap="xs" align="center">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 dark:bg-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <Gauge size={16} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <Text size="xs" fw={800} className="text-slate-900 dark:text-white uppercase tracking-wider">
                  System Health
                </Text>
                <Badge size="xs" radius="sm" color={synergy.status === "Incomplete" ? "red" : "teal"} variant="light">
                  {synergy.score}/100
                </Badge>
              </div>
              <Text size="10px" c="dimmed" className="truncate max-w-[150px]">
                {bottleneck.status === "Incomplete" ? "Add CPU & GPU" : bottleneck.status}
              </Text>
            </div>
          </Group>

          <Button
            size="compact-xs"
            variant="light"
            color="cyan"
            radius="md"
            rightSection={<ChevronRight size={12} />}
            className="text-[10px] font-bold"
          >
            Inspect
          </Button>
        </Group>
      </Paper>

      {/* Slide-Over Drawer */}
      <Drawer
        opened={opened}
        onClose={() => setOpened(false)}
        position="right"
        size="md"
        title={
          <Group gap="xs">
            <Activity size={18} className="text-cyan-500" />
            <Text fw={800} size="sm" className="font-headline tracking-wider uppercase text-slate-900 dark:text-white">
              Telemetry & Bottleneck Analyzer
            </Text>
          </Group>
        }
        overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
        classNames={{
          content: "bg-white dark:bg-[#111722] border-l border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100",
          header: "bg-slate-50/70 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10 px-6 py-4",
          body: "!px-6 !py-5 space-y-4 overflow-y-auto custom-scrollbar",
        }}
      >
        {/* Preset Selectors */}
        <Group grow gap="xs">
          <Select
            label="Target Resolution"
            value={resolution}
            onChange={(val) => val && onResolutionChange(val as Resolution)}
            data={[
              { value: "1080p", label: "1080p Full HD" },
              { value: "1440p", label: "1440p Quad HD" },
              { value: "4K", label: "4K Ultra HD" },
            ]}
            leftSection={<Monitor size={14} className="text-cyan-600 dark:text-cyan-400" />}
            size="xs"
            radius="md"
          />
          <Select
            label="Workload Type"
            value={workload}
            onChange={(val) => val && onWorkloadChange(val as WorkloadType)}
            data={[
              { value: "Balanced", label: "Balanced Daily" },
              { value: "Esports", label: "Competitive Esports" },
              { value: "AAA", label: "AAA Ultra Gaming" },
            ]}
            leftSection={<Zap size={14} className="text-amber-500" />}
            size="xs"
            radius="md"
          />
        </Group>

        <SynergyGaugeCard build={build} resolution={resolution} />
        <BottleneckStatusCard build={build} resolution={resolution} />
        <FpsPerformanceChart build={build} resolution={resolution} workload={workload} chartHeight={200} />
        <OptimizationSwapsCard analysis={analysis} onApplySuggestion={onApplySuggestion} />
      </Drawer>
    </>
  );
}
