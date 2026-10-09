"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Paper, Group, Text, Select, ActionIcon, ThemeIcon } from "@mantine/core";
import { Gauge, Monitor, Zap, X } from "lucide-react";
import { AnimatedIconButton, AnimatedActivityIcon, AnimatedXIcon } from "./ui/animated-icons";
import { ComponentData, Resolution, WorkloadType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SynergyGaugeCard } from "./bottleneck/synergy-gauge-card";
import { BottleneckStatusCard } from "./bottleneck/bottleneck-status-card";
import { FpsPerformanceChart } from "./bottleneck/fps-performance-chart";
import { OptimizationSwapsCard } from "./bottleneck/optimization-swaps-card";

interface BuilderFloatingAnalyticsProps {
  build: Record<string, ComponentData | ComponentData[] | null>;
  resolution: Resolution;
  onResolutionChange: (res: Resolution) => void;
  workload: WorkloadType;
  onWorkloadChange: (type: WorkloadType) => void;
  analysis?: any;
  onApplySuggestion?: (category: string, partId: string) => void;
}

export function BuilderFloatingAnalytics({
  build,
  resolution,
  onResolutionChange,
  workload,
  onWorkloadChange,
  analysis,
  onApplySuggestion,
}: BuilderFloatingAnalyticsProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Close when other floating actions open
  React.useEffect(() => {
    const handleOpen = (e: any) => {
      if (e.detail?.type !== "analytics") {
        setIsOpen(false);
      }
    };
    window.addEventListener("floating-action-open", handleOpen);
    return () => window.removeEventListener("floating-action-open", handleOpen);
  }, []);

  const toggleOpen = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (newState) {
      window.dispatchEvent(new CustomEvent("floating-action-open", { detail: { type: "analytics" } }));
    }
  };

  return (
    <div
      className={cn(
        "fixed left-6 flex flex-col items-start gap-4 transition-all duration-300",
        "bottom-[176px] lg:bottom-[104px]",
        isOpen ? "z-[60]" : "z-50"
      )}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: 20 }}
            className="w-[calc(100vw-2rem)] sm:w-[440px] mb-4"
          >
            <Paper
              radius="lg"
              withBorder
              shadow="xl"
              className="overflow-hidden bg-white/95 dark:bg-[#0d1117]/95 border-slate-200 dark:border-cyan-500/20 backdrop-blur-xl shadow-xl max-h-[85vh] overflow-y-auto custom-scrollbar"
            >
              {/* Header */}
              <div className="p-4 bg-slate-50/90 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10 space-y-3">
                <Group justify="space-between" align="center">
                  <Group gap="xs" align="center">
                    <ThemeIcon size={28} radius="md" variant="light" color="cyan">
                      <Gauge size={16} />
                    </ThemeIcon>
                    <Text fw={900} size="sm" className="font-headline tracking-wider uppercase text-cyan-700 dark:text-cyan-400">
                      Bottleneck Analyzer
                    </Text>
                  </Group>

                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    size="sm"
                    radius="md"
                    onClick={() => setIsOpen(false)}
                    aria-label="Close analyzer"
                  >
                    <X size={16} />
                  </ActionIcon>
                </Group>

                {/* Preset Selectors */}
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
              </div>

              {/* Body */}
              <div className="p-4 space-y-3.5">
                <SynergyGaugeCard build={build} resolution={resolution} />
                <BottleneckStatusCard build={build} resolution={resolution} />
                <FpsPerformanceChart build={build} resolution={resolution} workload={workload} chartHeight={180} />
                <OptimizationSwapsCard analysis={analysis} onApplySuggestion={onApplySuggestion} />
              </div>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <div className="relative group">
        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 blur opacity-40 group-hover:opacity-100 transition duration-1000 animate-pulse"></div>
        <AnimatedIconButton
          onClick={toggleOpen}
          variant={isOpen ? "destructive" : "primary"}
          className="h-14 w-14 sm:h-16 sm:w-16 p-0 shadow-[0_0_40px_rgba(6,182,212,0.5)] border-white/20 bg-gradient-to-tr from-cyan-600/90 to-blue-600/90 backdrop-blur-xl"
          icon={isOpen ? <AnimatedXIcon size={24} className="text-white" /> : <AnimatedActivityIcon size={24} className="text-white" />}
        />

        <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-3 py-1 bg-black/80 backdrop-blur-md rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap hidden sm:block">
          <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em]">Bottleneck Analyzer</span>
        </div>
      </div>
    </div>
  );
}
