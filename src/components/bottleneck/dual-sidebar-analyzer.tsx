"use client";

import React from "react";
import { SegmentedControl, Group, Select, Box } from "@mantine/core";
import { Monitor, Zap, Gauge, Cpu } from "lucide-react";
import type { ComponentData, Resolution, WorkloadType } from "@/lib/types";
import { SynergyGaugeCard } from "./synergy-gauge-card";
import { BottleneckStatusCard } from "./bottleneck-status-card";
import { FpsPerformanceChart } from "./fps-performance-chart";
import { OptimizationSwapsCard } from "./optimization-swaps-card";

interface DualSidebarAnalyzerProps {
  build: Record<string, ComponentData | ComponentData[] | null>;
  resolution: Resolution;
  onResolutionChange: (res: Resolution) => void;
  workload: WorkloadType;
  onWorkloadChange: (workload: WorkloadType) => void;
  analysis?: any;
  onApplySuggestion?: (category: string, partId: string) => void;
  selectedPartsCount: number;
  totalCategoriesCount: number;
  activeTab: "parts" | "analytics";
  onTabChange: (tab: "parts" | "analytics") => void;
  children: React.ReactNode;
}

export function DualSidebarAnalyzer({
  build,
  resolution,
  onResolutionChange,
  workload,
  onWorkloadChange,
  analysis,
  onApplySuggestion,
  selectedPartsCount,
  totalCategoriesCount,
  activeTab,
  onTabChange,
  children,
}: DualSidebarAnalyzerProps) {
  return (
    <div className="flex flex-col">
      {/* Dual Tab Segmented Control */}
      <Box className="p-3 bg-slate-100/70 dark:bg-white/[0.04] border-b border-slate-200 dark:border-white/10">
        <SegmentedControl
          value={activeTab}
          onChange={(val) => onTabChange(val as "parts" | "analytics")}
          fullWidth
          size="xs"
          radius="md"
          data={[
            {
              value: "parts",
              label: (
                <div className="flex items-center justify-center gap-1.5 py-0.5">
                  <Cpu size={13} className="text-cyan-500" />
                  <span className="font-bold">Parts ({selectedPartsCount}/{totalCategoriesCount})</span>
                </div>
              ),
            },
            {
              value: "analytics",
              label: (
                <div className="flex items-center justify-center gap-1.5 py-0.5">
                  <Gauge size={13} className="text-emerald-500" />
                  <span className="font-bold">Analyzer</span>
                </div>
              ),
            },
          ]}
          classNames={{
            root: "bg-white/80 dark:bg-[#151922] border border-slate-200/80 dark:border-white/10 p-1 shadow-inner",
            indicator: "bg-cyan-500 text-white dark:bg-cyan-600 shadow-sm",
          }}
        />
      </Box>

      {/* Content based on Tab */}
      {activeTab === "parts" ? (
        children
      ) : (
        <div className="p-4 space-y-3">
          {/* Resolution & Workload Controls */}
          <Group grow gap="xs">
            <Select
              value={resolution}
              onChange={(val) => val && onResolutionChange(val as Resolution)}
              data={[
                { value: "1080p", label: "1080p FHD" },
                { value: "1440p", label: "1440p QHD" },
                { value: "4K", label: "4K UHD" },
              ]}
              leftSection={<Monitor size={14} className="text-cyan-600 dark:text-cyan-400" />}
              allowDeselect={false}
              size="xs"
              radius="md"
            />
            <Select
              value={workload}
              onChange={(val) => val && onWorkloadChange(val as WorkloadType)}
              data={[
                { value: "Balanced", label: "Balanced" },
                { value: "Esports", label: "Esports High" },
                { value: "AAA", label: "AAA Ultra" },
              ]}
              leftSection={<Zap size={14} className="text-amber-500" />}
              allowDeselect={false}
              size="xs"
              radius="md"
            />
          </Group>

          <SynergyGaugeCard build={build} resolution={resolution} />
          <BottleneckStatusCard build={build} resolution={resolution} />
          <FpsPerformanceChart build={build} resolution={resolution} workload={workload} chartHeight={170} />
          <OptimizationSwapsCard analysis={analysis} onApplySuggestion={onApplySuggestion} />
        </div>
      )}
    </div>
  );
}
