import { useMemo } from 'react';
import { calculateBottleneck } from '@/lib/bottleneck';
import { checkFullBuildCompatibility } from '@/lib/compatibility';
import { estimateFPS } from '@/lib/fps-estimator';
import type { ComponentData, Resolution, WorkloadType } from '@/lib/types';

export function useQuickBuildChecks(
  build: Record<string, ComponentData | ComponentData[] | null>,
  performanceLevel?: string,
  intendedUse?: string,
) {
  return useMemo(() => {
    const resolution: Resolution = performanceLevel === '1080p' || performanceLevel === '4K' ? performanceLevel : '1440p';
    const workload: WorkloadType = intendedUse === 'Esports' || intendedUse === 'AAA' ? intendedUse : 'Balanced';
    return {
      compatibility: checkFullBuildCompatibility(build),
      balance: calculateBottleneck(build, resolution),
      fps: estimateFPS(build, resolution, workload),
      resolution,
    };
  }, [build, performanceLevel, intendedUse]);
}
