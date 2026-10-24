"use client";

import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Text, Group, Select, Badge, Skeleton, Box, Button } from "@mantine/core";
import { Gauge, Monitor, Zap, AlertTriangle, Wrench } from "lucide-react";
import type { Part, Resolution, WorkloadType, ComponentData } from "@/lib/types";
import type { PrebuiltPartStatus } from "@/lib/prebuilt-utils";

const FpsPerformanceChart = dynamic(
  () => import("@/components/bottleneck/fps-performance-chart").then((m) => m.FpsPerformanceChart),
  {
    loading: () => <Skeleton height={240} radius="md" />,
    ssr: false,
  }
);

interface PrebuiltPerformanceAnalyzerProps {
  components: Record<string, Part | null>;
  componentStatuses?: PrebuiltPartStatus[];
  loadingParts: boolean;
  onCustomize?: () => void;
}

export function PrebuiltPerformanceAnalyzer({
  components,
  componentStatuses = [],
  loadingParts,
  onCustomize,
}: PrebuiltPerformanceAnalyzerProps) {
  const [resolution, setResolution] = useState<Resolution>("1080p");
  const [workload, setWorkload] = useState<WorkloadType>("Balanced");

  // Determine CPU availability (must exist and not be marked missing or out-of-stock)
  const cpuStatus = componentStatuses.find((s) => s.category?.toLowerCase() === "cpu");
  const rawCpu = components.cpu || components.CPU || cpuStatus?.part || null;
  const isCpuMissing = !rawCpu || cpuStatus?.issue === "missing";
  const isCpuOutOfStock = Boolean(
    cpuStatus?.issue === "out-of-stock" ||
      (rawCpu && typeof rawCpu.stock === "number" && rawCpu.stock <= 0)
  );
  const isCpuAvailable = !isCpuMissing && !isCpuOutOfStock;

  // Determine GPU availability (must exist and not be marked missing or out-of-stock)
  const gpuStatus = componentStatuses.find((s) => s.category?.toLowerCase() === "gpu");
  const rawGpu = components.gpu || components.GPU || gpuStatus?.part || null;
  const isGpuMissing = !rawGpu || gpuStatus?.issue === "missing";
  const isGpuOutOfStock = Boolean(
    gpuStatus?.issue === "out-of-stock" ||
      (rawGpu && typeof rawGpu.stock === "number" && rawGpu.stock <= 0)
  );
  const isGpuAvailable = !isGpuMissing && !isGpuOutOfStock;

  const isHardwareAvailable = isCpuAvailable && isGpuAvailable;

  // Construct descriptive reason when unavailable
  const unavailableReason = useMemo(() => {
    if (!isCpuAvailable && !isGpuAvailable) {
      return "Both CPU and GPU are missing or out of stock. Both components are required to calculate frame rate benchmarks.";
    }
    if (!isCpuAvailable) {
      if (isCpuOutOfStock) {
        return `The processor (${rawCpu?.name || cpuStatus?.name || "CPU"}) is currently out of stock. Customize this build to select an in-stock CPU for performance analysis.`;
      }
      return "This prebuilt configuration is missing a processor (CPU). Add a CPU to calculate frame rate benchmarks.";
    }
    if (!isGpuAvailable) {
      if (isGpuOutOfStock) {
        return `The graphics card (${rawGpu?.name || gpuStatus?.name || "GPU"}) is currently out of stock. Customize this build to select an in-stock GPU for performance analysis.`;
      }
      return "This prebuilt configuration is missing a graphics card (GPU). Add a GPU to calculate frame rate benchmarks.";
    }
    return null;
  }, [isCpuAvailable, isGpuAvailable, isCpuOutOfStock, isGpuOutOfStock, rawCpu, rawGpu, cpuStatus, gpuStatus]);

  // Normalize lowercase category keys from prebuilt components into uppercase standard keys for estimateFPS
  const buildData = useMemo(() => {
    const map: Record<string, ComponentData | null> = {
      CPU: isCpuAvailable ? ((rawCpu as unknown) as ComponentData) : null,
      GPU: isGpuAvailable ? ((rawGpu as unknown) as ComponentData) : null,
      Motherboard: (components.motherboard || components.Motherboard || null) as unknown as ComponentData | null,
      RAM: (components.ram || components.RAM || null) as unknown as ComponentData | null,
      Storage: (components.storage || components.Storage || null) as unknown as ComponentData | null,
      PSU: (components.psu || components.PSU || null) as unknown as ComponentData | null,
      Case: (components.case || components.Case || null) as unknown as ComponentData | null,
      Cooler: (components.cooler || components.Cooler || null) as unknown as ComponentData | null,
    };
    return map;
  }, [components, rawCpu, rawGpu, isCpuAvailable, isGpuAvailable]);

  return (
    <div className="w-full">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3.5 border-b border-slate-200/70 dark:border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
            <Gauge className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Text fw={800} size="md" className="text-slate-900 dark:text-slate-100 text-base sm:text-lg">
                Performance Analyzer
              </Text>
              <Badge
                size="xs"
                radius="sm"
                color={!loadingParts && !isHardwareAvailable ? "amber" : "cyan"}
                variant="light"
                className="font-bold"
              >
                {!loadingParts && !isHardwareAvailable ? "Unavailable" : "Estimated FPS"}
              </Badge>
            </div>
            <Text size="xs" c="dimmed">
              Calculated real-time frame rate benchmarks
            </Text>
          </div>
        </div>

        {/* Resolution & Workload Dropdown Controls */}
        <Group gap="xs" wrap="nowrap" className="w-full sm:w-auto">
          <Select
            value={resolution}
            onChange={(val) => val && setResolution(val as Resolution)}
            disabled={!isHardwareAvailable}
            data={[
              { value: "1080p", label: "1080p FHD" },
              { value: "1440p", label: "1440p QHD" },
              { value: "4K", label: "4K UHD" },
            ]}
            leftSection={<Monitor size={14} className="text-cyan-600 dark:text-cyan-400" />}
            allowDeselect={false}
            size="xs"
            radius="md"
            className="flex-1 sm:w-36"
            comboboxProps={{ withinPortal: false }}
          />

          <Select
            value={workload}
            onChange={(val) => val && setWorkload(val as WorkloadType)}
            disabled={!isHardwareAvailable}
            data={[
              { value: "Balanced", label: "Balanced" },
              { value: "Esports", label: "Esports High" },
              { value: "AAA", label: "AAA Ultra" },
            ]}
            leftSection={<Zap size={14} className="text-amber-500" />}
            allowDeselect={false}
            size="xs"
            radius="md"
            className="flex-1 sm:w-36"
            comboboxProps={{ withinPortal: false }}
          />
        </Group>
      </div>

      {/* Main Performance Content */}
      {loadingParts ? (
        <Skeleton height={240} radius="md" />
      ) : !isHardwareAvailable ? (
        <div className="py-8 px-4 flex flex-col items-center justify-center text-center rounded-lg border border-dashed border-amber-300/60 dark:border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/10">
          <div className="w-10 h-10 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <Text fw={700} size="sm" className="text-slate-900 dark:text-slate-100 mb-1">
            Performance Estimates Unavailable
          </Text>
          <Text size="xs" c="dimmed" className="max-w-md leading-relaxed mb-1">
            {unavailableReason}
          </Text>
          {onCustomize && (
            <Button
              size="xs"
              variant="light"
              color="cyan"
              radius="md"
              leftSection={<Wrench size={13} />}
              onClick={onCustomize}
              className="mt-3 font-semibold"
            >
              Customize in Builder
            </Button>
          )}
        </div>
      ) : (
        <Box>
          <FpsPerformanceChart
            build={buildData}
            resolution={resolution}
            workload={workload}
            chartHeight={200}
            withBorder={false}
            hideHeader={true}
            className="bg-transparent border-0 shadow-none p-0"
          />
        </Box>
      )}
    </div>
  );
}
