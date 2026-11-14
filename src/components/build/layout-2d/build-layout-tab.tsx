"use client";

import React, { useState } from "react";
import {
  ActionIcon,
  Group,
  Modal,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
} from "@mantine/core";
import {
  AlertTriangle,
  Layers,
  Maximize2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ComponentData } from "@/lib/types";
import { type CoreLayoutCategory } from "@/lib/build-layout-specs";
import { useBuildLayout } from "@/hooks/use-build-layout";
import { PcLayoutCanvas } from "./pc-layout-canvas";

const LAYOUT_MODAL_CLASSNAMES = {
  content:
    "bg-white/95 dark:bg-[#141a23]/95 backdrop-blur-md border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-slate-100 shadow-xl rounded-xl overflow-hidden",
  header:
    "bg-white/95 dark:bg-[#141a23]/95 border-b border-slate-200/80 dark:border-white/10 p-3",
  body: "!p-3",
  close:
    "text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors",
};

const CORE_CATEGORIES: CoreLayoutCategory[] = [
  "Case",
  "Motherboard",
  "CPU",
  "Cooler",
  "RAM",
  "GPU",
  "Storage",
  "PSU",
];

interface BuildLayoutFabProps {
  build: Record<string, ComponentData | ComponentData[] | null>;
  onCategorySelect?: (category: string) => void;
  activeFilter?: string | null;
}

export function BuildLayoutFab({
  build,
  onCategorySelect,
}: BuildLayoutFabProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const {
    viewModel,
    hoveredCategory,
    setHoveredCategory,
    activeSummary,
    isModalOpen,
    openModal,
    closeModal,
    handleSelectCategory,
  } = useBuildLayout(build, onCategorySelect);

  const hasCritical = viewModel.issues.some((i) => i.severity === "critical");
  const hasWarning = viewModel.issues.some((i) => i.severity === "warning");
  const selectedCoreCount = CORE_CATEGORIES.filter(
    (cat) => viewModel.partSummaries[cat].selected
  ).length;

  return (
    <>
      {/* Floating Action Button Positioned Directly Above the Chatbot FAB */}
      <div className="fixed right-4 sm:right-6 bottom-36 sm:bottom-40 lg:bottom-[88px] z-40">
        <Tooltip
          label={isPanelOpen ? "Hide 2D Hardware Layout" : "2D Hardware Layout & Clearances"}
          position="left"
          withArrow
        >
          <div className="relative">
            <ActionIcon
              onClick={() => setIsPanelOpen((prev) => !prev)}
              aria-label="Toggle 2D hardware layout visualizer"
              aria-expanded={isPanelOpen}
              size={52}
              radius="xl"
              color={hasCritical ? "red" : hasWarning ? "yellow" : "cyan"}
              variant="filled"
              className={cn(
                "shadow-lg transition-transform active:scale-95 border",
                hasCritical
                  ? "bg-rose-600 hover:bg-rose-700 border-rose-400/40"
                  : hasWarning
                    ? "bg-amber-600 hover:bg-amber-700 border-amber-400/40"
                    : "bg-slate-900 hover:bg-slate-800 dark:bg-[#141a23] dark:hover:bg-[#1e2633] border-cyan-500/40 text-cyan-400"
              )}
            >
              <Layers size={22} />
            </ActionIcon>
            <span
              className={cn(
                "pointer-events-none absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 font-mono text-[10px] font-bold text-white shadow",
                hasCritical
                  ? "bg-rose-500"
                  : hasWarning
                    ? "bg-amber-500"
                    : "bg-cyan-600"
              )}
            >
              {selectedCoreCount}/8
            </span>
          </div>
        </Tooltip>
      </div>

      {/* Live Expanded Floating 2D Visualizer Window */}
      {isPanelOpen && (
        <div className="fixed right-4 sm:right-20 bottom-20 sm:bottom-6 z-40 w-[calc(100vw-2rem)] max-w-[540px]">
          <Paper
            withBorder
            radius="lg"
            shadow="xl"
            className="overflow-hidden border-slate-200 bg-white/95 text-slate-900 backdrop-blur-md dark:border-white/10 dark:bg-[#111722]/95 dark:text-slate-100"
          >
            {/* Header Toolbar (12px p-3 padding) */}
            <div className="border-b border-slate-200 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-[#141a23]/90">
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <div className="min-w-0 space-y-1">
                  <Group gap={6} align="center" wrap="nowrap">
                    <Layers size={15} className="text-cyan-500 shrink-0" />
                    <Text
                      size="xs"
                      fw={700}
                      className="font-headline text-sm font-bold text-slate-900 dark:text-slate-100 truncate"
                    >
                      2D Hardware Fitment View
                    </Text>
                  </Group>
                  <p className="flex items-start gap-1.5 text-[11px] font-medium leading-snug text-amber-600 dark:text-yellow-400">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      Visual layout is an approximation. Verify physical dimensions, clearances, and compatibility before purchasing.
                    </span>
                  </p>
                </div>

                <Group gap={4} wrap="nowrap">
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    size="lg"
                    radius="md"
                    aria-label="Expand 2D layout modal"
                    onClick={openModal}
                    className="h-11 w-11 text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-white/10"
                  >
                    <Maximize2 size={16} />
                  </ActionIcon>
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    size="lg"
                    radius="md"
                    aria-label="Close 2D layout window"
                    onClick={() => setIsPanelOpen(false)}
                    className="h-11 w-11 text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-white/10"
                  >
                    <X size={17} />
                  </ActionIcon>
                </Group>
              </Group>
            </div>

            {/* Body: Full Space Dedicated to the 2D Visualizer */}
            <div className="p-3 space-y-2">
              <PcLayoutCanvas
                viewModel={viewModel}
                hoveredCategory={hoveredCategory}
                onHoverCategory={setHoveredCategory}
                onSelectCategory={handleSelectCategory}
                activeSummary={activeSummary}
              />

              {viewModel.issues.length > 0 && (
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 dark:border-rose-500/30 dark:bg-rose-950/25">
                  <Stack gap={4}>
                    {viewModel.issues.map((issue, idx) => (
                      <Group key={idx} gap={6} align="flex-start" wrap="nowrap">
                        <AlertTriangle
                          size={13}
                          className={cn(
                            "mt-0.5 shrink-0",
                            issue.severity === "critical"
                              ? "text-rose-500"
                              : "text-amber-500"
                          )}
                        />
                        <Text
                          size="xs"
                          className="text-[11px] leading-snug text-slate-900 dark:text-slate-100"
                        >
                          {issue.message}
                        </Text>
                      </Group>
                    ))}
                  </Stack>
                </div>
              )}
            </div>
          </Paper>
        </div>
      )}

      {/* Full-Size Expanded Inspection Modal */}
      <Modal
        opened={isModalOpen}
        onClose={closeModal}
        size="xl"
        radius="lg"
        centered
        overlayProps={{ backgroundOpacity: 0.65, blur: 5 }}
        classNames={LAYOUT_MODAL_CLASSNAMES}
        title={
          <Group gap="sm">
            <ThemeIcon size="lg" color="cyan" variant="light" radius="md">
              <Layers size={18} />
            </ThemeIcon>
            <div className="space-y-0.5">
              <Title
                order={4}
                className="font-headline text-base font-bold text-slate-900 dark:text-slate-100"
              >
                2D Hardware Fitment View
              </Title>
              <p className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-yellow-400">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>
                  Visual layout is an approximation. Verify physical dimensions, clearances, and compatibility before purchasing.
                </span>
              </p>
            </div>
          </Group>
        }
      >
        <PcLayoutCanvas
          viewModel={viewModel}
          hoveredCategory={hoveredCategory}
          onHoverCategory={setHoveredCategory}
          onSelectCategory={(cat) => {
            handleSelectCategory(cat);
            closeModal();
          }}
          activeSummary={activeSummary}
          expanded
        />
      </Modal>
    </>
  );
}
