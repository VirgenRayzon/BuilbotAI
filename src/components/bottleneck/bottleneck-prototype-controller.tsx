"use client";

import React, { useState } from "react";
import { Paper, SegmentedControl, Group, Text, Badge, ThemeIcon } from "@mantine/core";
import { Sparkles, Layers } from "lucide-react";
import type { ComponentData, Resolution, WorkloadType } from "@/lib/types";
import { PrototypeSlideDrawer } from "./prototype-slide-drawer";
import { PrototypeTopHud } from "./prototype-top-hud";
import { PrototypeBottomDock } from "./prototype-bottom-dock";
import { BuilderFloatingAnalytics } from "@/components/builder-floating-analytics";

export type BottleneckMode = "dual-sidebar" | "slide-drawer" | "top-hud" | "bottom-dock" | "fab";

interface BottleneckPrototypeControllerProps {
  build: Record<string, ComponentData | ComponentData[] | null>;
  resolution: Resolution;
  onResolutionChange: (res: Resolution) => void;
  workload: WorkloadType;
  onWorkloadChange: (workload: WorkloadType) => void;
  analysis?: any;
  onApplySuggestion?: (category: string, partId: string) => void;
  activeMode: BottleneckMode;
  onModeChange: (mode: BottleneckMode) => void;
}

export function BottleneckPrototypeController({
  build,
  resolution,
  onResolutionChange,
  workload,
  onWorkloadChange,
  analysis,
  onApplySuggestion,
  activeMode,
  onModeChange,
}: BottleneckPrototypeControllerProps) {
  return (
    <div className="w-full mb-5">
      {/* Prototype Switcher Ribbon */}
      <Paper
        withBorder
        radius="lg"
        p="xs"
        className="bg-white/95 dark:bg-[#111722]/95 backdrop-blur-xl border-cyan-500/30 shadow-md shadow-cyan-500/5"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-2 py-1">
          <Group gap="xs" align="center">
            <ThemeIcon size="md" radius="md" color="cyan" variant="light">
              <Layers size={16} />
            </ThemeIcon>
            <div>
              <Group gap={6} align="center">
                <Text size="xs" fw={900} className="font-headline tracking-wider uppercase text-slate-900 dark:text-white">
                  Bottleneck Analyzer Prototype Switcher
                </Text>
                <Badge size="xs" radius="sm" color="cyan" variant="outline">
                  Interactive Preview
                </Badge>
              </Group>
              <Text size="11px" c="dimmed">
                Switch between the 4 proposed integration paradigms in real-time.
              </Text>
            </div>
          </Group>

          {/* Segmented control to pick paradigm */}
          <div className="overflow-x-auto max-w-full">
            <SegmentedControl
              value={activeMode}
              onChange={(val) => onModeChange(val as BottleneckMode)}
              size="xs"
              radius="md"
              data={[
                { value: "dual-sidebar", label: "1. Dual-Mode Sidebar" },
                { value: "slide-drawer", label: "2. Slide Drawer" },
                { value: "top-hud", label: "3. Top HUD Bar" },
                { value: "bottom-dock", label: "4. Bottom Dock" },
                { value: "fab", label: "Original FAB" },
              ]}
              classNames={{
                root: "bg-slate-100 dark:bg-white/5",
              }}
            />
          </div>
        </div>
      </Paper>

      {/* Conditionally Render HUD / Dock / FAB depending on active mode */}
      {activeMode === "top-hud" && (
        <div className="mt-4">
          <PrototypeTopHud
            build={build}
            resolution={resolution}
            onResolutionChange={onResolutionChange}
            workload={workload}
            onWorkloadChange={onWorkloadChange}
            analysis={analysis}
            onApplySuggestion={onApplySuggestion}
          />
        </div>
      )}

      {activeMode === "bottom-dock" && (
        <PrototypeBottomDock
          build={build}
          resolution={resolution}
          onResolutionChange={onResolutionChange}
          workload={workload}
          onWorkloadChange={onWorkloadChange}
          analysis={analysis}
          onApplySuggestion={onApplySuggestion}
        />
      )}

      {activeMode === "fab" && (
        <BuilderFloatingAnalytics
          build={build}
          resolution={resolution}
          onResolutionChange={onResolutionChange}
          workload={workload}
          onWorkloadChange={onWorkloadChange}
          analysis={analysis}
          onApplySuggestion={onApplySuggestion}
        />
      )}
    </div>
  );
}
