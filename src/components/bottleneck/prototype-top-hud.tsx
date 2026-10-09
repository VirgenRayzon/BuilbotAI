"use client";

import React, { useState } from "react";
import { Paper, Group, Text, Badge, ActionIcon, Button, Select, Collapse, SimpleGrid } from "@mantine/core";
import { ChevronDown, ChevronUp, Gauge, Monitor, Zap, Activity } from "lucide-react";
import type { ComponentData, Resolution, WorkloadType } from "@/lib/types";
import { calculateSynergyScore, calculateBottleneck } from "@/lib/bottleneck";
import { estimateFPS } from "@/lib/fps-estimator";
import { SynergyGaugeCard } from "./synergy-gauge-card";
import { BottleneckStatusCard } from "./bottleneck-status-card";
import { FpsPerformanceChart } from "./fps-performance-chart";
import { OptimizationSwapsCard } from "./optimization-swaps-card";

interface PrototypeTopHudProps {
  build: Record<string, ComponentData | ComponentData[] | null>;
  resolution: Resolution;
  onResolutionChange: (res: Resolution) => void;
  workload: WorkloadType;
  onWorkloadChange: (workload: WorkloadType) => void;
  analysis?: any;
  onApplySuggestion?: (category: string, partId: string) => void;
}

export function PrototypeTopHud({
  build,
  resolution,
  onResolutionChange,
  workload,
  onWorkloadChange,
  analysis,
  onApplySuggestion,
}: PrototypeTopHudProps) {
  const [expanded, setExpanded] = useState(false);
  const synergy = calculateSynergyScore(build, resolution);
  const bottleneck = calculateBottleneck(build, resolution);
  const fps = estimateFPS(build, resolution, workload);

  return (
    <Paper
      withBorder
      radius="lg"
      className="mb-6 bg-white/80 dark:bg-[#111722]/80 backdrop-blur-xl border-slate-200 dark:border-white/10 shadow-xs overflow-hidden"
    >
      {/* Slim Top Ribbon */}
      <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60 dark:bg-white/[0.02]">
        <Group gap="sm" align="center" className="flex-wrap">
          <Group gap={6} align="center">
            <Activity size={16} className="text-cyan-500" />
            <Text size="xs" fw={800} className="font-headline uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Live Performance Ribbon
            </Text>
          </Group>

          {/* Quick Metrics Chips */}
          <Badge
            variant="light"
            color={synergy.status === "Incomplete" ? "red" : "teal"}
            size="sm"
            radius="sm"
            className="font-mono font-bold"
          >
            Synergy: {synergy.score}/100
          </Badge>

          <Badge
            variant="light"
            color={bottleneck.status === "Balanced" ? "teal" : bottleneck.status === "Incomplete" ? "gray" : "yellow"}
            size="sm"
            radius="sm"
            className="font-semibold"
          >
            {bottleneck.status}
          </Badge>

          {fps && (
            <Badge variant="dot" color="cyan" size="sm" radius="sm" className="font-mono">
              ~{fps.averageFps} FPS ({resolution})
            </Badge>
          )}
        </Group>

        <Group gap="xs" align="center">
          <Select
            value={resolution}
            onChange={(val) => val && onResolutionChange(val as Resolution)}
            data={["1080p", "1440p", "4K"]}
            size="xs"
            radius="md"
            className="w-24"
            allowDeselect={false}
          />
          <Button
            size="compact-xs"
            variant={expanded ? "filled" : "light"}
            color="cyan"
            radius="md"
            rightSection={expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            onClick={() => setExpanded(!expanded)}
            className="text-[11px] font-bold"
          >
            {expanded ? "Collapse HUD" : "Expand Telemetry"}
          </Button>
        </Group>
      </div>

      {/* Expandable Accordion Body */}
      <Collapse in={expanded}>
        <div className="p-4 border-t border-slate-200 dark:border-white/10 space-y-4 bg-slate-50/30 dark:bg-black/20">
          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
            <SynergyGaugeCard build={build} resolution={resolution} />
            <BottleneckStatusCard build={build} resolution={resolution} />
            <FpsPerformanceChart build={build} resolution={resolution} workload={workload} chartHeight={170} />
          </SimpleGrid>
          <OptimizationSwapsCard analysis={analysis} onApplySuggestion={onApplySuggestion} />
        </div>
      </Collapse>
    </Paper>
  );
}
