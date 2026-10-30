"use client";

import React, { useId } from "react";
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from "framer-motion";
import { Group, Select, Box, Tooltip } from "@mantine/core";
import { Monitor, Zap, Gauge, Cpu, WalletCards } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ComponentData, Resolution, WorkloadType } from "@/lib/types";
import { SynergyGaugeCard } from "./synergy-gauge-card";
import { BottleneckStatusCard } from "./bottleneck-status-card";
import { OptimizationSwapsCard } from "./optimization-swaps-card";

const FpsPerformanceChart = dynamic(() => import('./fps-performance-chart').then(module => module.FpsPerformanceChart), {
  loading: () => <div className="min-h-[220px]" role="status" aria-label="Loading performance chart" />,
});

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
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  budgetContent?: React.ReactNode;
  children: React.ReactNode;
}

export type SidebarTab = "parts" | "analytics" | "budget";

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
  budgetContent,
  children,
}: DualSidebarAnalyzerProps) {
  const tabGroupId = useId();
  const tabs = [
    { value: "parts" as const, label: `Parts (${selectedPartsCount}/${totalCategoriesCount})`, icon: Cpu, color: "text-cyan-500" },
    { value: "analytics" as const, label: "Analyzer", icon: Gauge, color: "text-emerald-500" },
    ...(budgetContent ? [{ value: "budget" as const, label: "Recommendation", icon: WalletCards, color: "text-amber-500" }] : []),
  ];

  return (
    <div className="flex flex-col">
      {/* Active tab expands; inactive tabs remain compact icon controls. */}
      <Box className="p-2 bg-slate-100/70 dark:bg-white/[0.04] border-b border-slate-200 dark:border-white/10">
        <div role="tablist" aria-label="Your Build views"
          className="flex w-full gap-0.5 rounded-md border border-slate-200/80 bg-white/80 p-0.5 shadow-inner dark:border-white/10 dark:bg-[#151922]">
          {tabs.map(({ value, label, icon: Icon, color }) => {
            const active = activeTab === value;
            const button = (
              <motion.button
                key={value}
                layout
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={label}
                onClick={() => onTabChange(value)}
                transition={{ layout: { type: "spring", stiffness: 420, damping: 34 } }}
                className={cn(
                  "relative flex h-11 min-w-11 items-center justify-center overflow-hidden rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/70",
                  active
                    ? "flex-1 gap-1 px-1.5 text-slate-900 dark:text-slate-100"
                    : "w-11 flex-none px-0 text-slate-500 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:bg-white/[0.06]",
                )}
              >
                {active && (
                  <motion.span
                    layoutId={`${tabGroupId}-active-tab`}
                    className="absolute inset-0 rounded-md border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#202631]"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <Icon size={15} className={cn("relative z-10 shrink-0", color)} aria-hidden="true" />
                <AnimatePresence initial={false} mode="popLayout">
                  {active && (
                    <motion.span
                      key={`${value}-label`}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 4 }}
                      transition={{ duration: 0.16 }}
                      className="relative z-10 truncate text-xs font-bold"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            );
            return active ? button : <Tooltip key={value} label={label} position="bottom" withArrow>{button}</Tooltip>;
          })}
        </div>
      </Box>

      {/* Content based on Tab */}
      {activeTab === "parts" ? (
        children
      ) : activeTab === "budget" && budgetContent ? (
        <div className="p-3">{budgetContent}</div>
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
                { value: "VideoEditing", label: "Video Editing" },
                { value: "Rendering", label: "3D Rendering" },
                { value: "Office", label: "Office Use" },
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
