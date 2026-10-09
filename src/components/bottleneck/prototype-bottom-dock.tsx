"use client";

import React, { useState } from "react";
import { Paper, Group, Text, Badge, Button, Select, SimpleGrid, ActionIcon } from "@mantine/core";
import { ChevronUp, ChevronDown, Gauge, Monitor, Zap, X, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ComponentData, Resolution, WorkloadType } from "@/lib/types";
import { calculateSynergyScore, calculateBottleneck } from "@/lib/bottleneck";
import { estimateFPS } from "@/lib/fps-estimator";
import { SynergyGaugeCard } from "./synergy-gauge-card";
import { BottleneckStatusCard } from "./bottleneck-status-card";
import { FpsPerformanceChart } from "./fps-performance-chart";
import { OptimizationSwapsCard } from "./optimization-swaps-card";

interface PrototypeBottomDockProps {
  build: Record<string, ComponentData | ComponentData[] | null>;
  resolution: Resolution;
  onResolutionChange: (res: Resolution) => void;
  workload: WorkloadType;
  onWorkloadChange: (workload: WorkloadType) => void;
  analysis?: any;
  onApplySuggestion?: (category: string, partId: string) => void;
}

export function PrototypeBottomDock({
  build,
  resolution,
  onResolutionChange,
  workload,
  onWorkloadChange,
  analysis,
  onApplySuggestion,
}: PrototypeBottomDockProps) {
  const [open, setOpen] = useState(false);
  const synergy = calculateSynergyScore(build, resolution);
  const bottleneck = calculateBottleneck(build, resolution);
  const fps = estimateFPS(build, resolution, workload);

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 pointer-events-auto">
      {/* Expanded Drawer Tray */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full bg-white/95 dark:bg-[#111722]/95 backdrop-blur-2xl border-t border-slate-200 dark:border-white/10 shadow-2xl p-5 max-h-[75vh] overflow-y-auto custom-scrollbar"
          >
            <div className="max-w-7xl mx-auto space-y-4">
              <Group justify="space-between" align="center" className="border-b border-slate-200 dark:border-white/10 pb-3">
                <Group gap="xs">
                  <Gauge size={18} className="text-cyan-500" />
                  <Text fw={800} size="sm" className="font-headline uppercase tracking-wider text-slate-900 dark:text-white">
                    Hardware Diagnostic Tray
                  </Text>
                </Group>

                <Group gap="xs">
                  <Select
                    value={resolution}
                    onChange={(val) => val && onResolutionChange(val as Resolution)}
                    data={["1080p", "1440p", "4K"]}
                    size="xs"
                    radius="md"
                    className="w-24"
                    allowDeselect={false}
                  />
                  <Select
                    value={workload}
                    onChange={(val) => val && onWorkloadChange(val as WorkloadType)}
                    data={["Balanced", "Esports", "AAA"]}
                    size="xs"
                    radius="md"
                    className="w-28"
                    allowDeselect={false}
                  />
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    radius="md"
                    onClick={() => setOpen(false)}
                    aria-label="Close tray"
                  >
                    <X size={16} />
                  </ActionIcon>
                </Group>
              </Group>

              <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
                <SynergyGaugeCard build={build} resolution={resolution} />
                <BottleneckStatusCard build={build} resolution={resolution} />
                <FpsPerformanceChart build={build} resolution={resolution} workload={workload} chartHeight={170} />
              </SimpleGrid>
              <OptimizationSwapsCard analysis={analysis} onApplySuggestion={onApplySuggestion} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Docked Status Bar */}
      <div className="h-12 bg-white/90 dark:bg-[#0c0f14]/90 backdrop-blur-xl border-t border-slate-200 dark:border-white/10 px-4 sm:px-6 flex items-center justify-between shadow-lg">
        <Group gap="sm" align="center">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <Text size="xs" fw={800} className="font-headline uppercase tracking-wider text-slate-800 dark:text-slate-200">
              System Telemetry
            </Text>
          </div>

          <Badge
            variant="light"
            color={synergy.status === "Incomplete" ? "red" : "teal"}
            size="sm"
            radius="sm"
            className="font-mono font-bold"
          >
            {synergy.score}% Synergy
          </Badge>

          <Badge
            variant="light"
            color={bottleneck.status === "Balanced" ? "teal" : "yellow"}
            size="sm"
            radius="sm"
            className="hidden sm:inline-flex font-semibold"
          >
            {bottleneck.status}
          </Badge>

          {fps && (
            <span className="text-[11px] font-mono font-bold text-cyan-600 dark:text-cyan-400 hidden md:inline">
              ~{fps.averageFps} FPS ({resolution})
            </span>
          )}
        </Group>

        <Group gap="xs" align="center">
          <Button
            size="compact-xs"
            variant="light"
            color="cyan"
            radius="md"
            rightSection={open ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            onClick={() => setOpen(!open)}
            className="text-[11px] font-bold uppercase tracking-wider"
          >
            {open ? "Hide Tray" : "Open Diagnostic Tray"}
          </Button>
        </Group>
      </div>
    </div>
  );
}
