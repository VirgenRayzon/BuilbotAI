"use client";

import { Gauge } from "lucide-react";
import { calculateBottleneck } from "@/lib/bottleneck";
import { ComponentData, Resolution } from "@/lib/types";

interface BottleneckMeterProps {
  build: Record<string, ComponentData | ComponentData[] | null>;
  resolution: Resolution;
}

export function BottleneckMeter({ build, resolution }: BottleneckMeterProps) {
  const result = calculateBottleneck(build, resolution);

  if (result.status === 'Incomplete') return null;

  return (
    <div
      className="mt-4 p-4 border-l-4 rounded-r-md bg-muted/40 transition-colors duration-300"
      style={{ borderColor: result.color }}
    >
      <h4 className="font-headline font-bold mb-1 flex items-center gap-2" style={{ color: result.color }}>
        <Gauge className="w-4 h-4" /> System Balance: {result.status}
      </h4>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {result.message}
      </p>
    </div>
  );
}
