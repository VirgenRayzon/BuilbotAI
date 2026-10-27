import { Server } from 'lucide-react';
import type { ComponentData, Part } from './types';

export const INCLUDED_INTEGRATED_GPU_ID = 'included-integrated-gpu';

type CpuGraphicsSource = {
  id: string;
  name?: string;
  model?: string;
  brand?: string;
  specifications?: Record<string, unknown>;
};

const cpuName = (cpu: CpuGraphicsSource) => cpu.name || cpu.model || '';

/** An explicit catalog specification always takes precedence over a model-name fallback. */
export function integratedGraphicsName(cpu: CpuGraphicsSource | null | undefined): string | null {
  if (!cpu) return null;
  const name = cpuName(cpu);
  const entry = Object.entries(cpu.specifications || {}).find(([key]) =>
    /^(integrated graphics|processor graphics|graphics model|onboard graphics|igpu)$/i.test(key.trim()));
  if (entry) {
    const value = String(entry[1]).trim();
    if (/^(no|none|n\/a|false|disabled|not available|not supported|discrete required|0)\b/i.test(value)
      || /^(?:requires? dedicated|no igpu|no integrated|not included|without graphics)/i.test(value)) return null;
    if (/^(yes|true|included|integrated|1)$/i.test(value)) return `${name} integrated graphics`;
    return value || null;
  }

  // Catalogs with older, incomplete CPU specifications still need a safe fallback.
  // Intel F/KF and X/XE desktop parts require discrete graphics.
  if (/\bintel\b/i.test(`${cpu.brand || ''} ${name}`) && /\b(?:core|pentium|celeron)\b/i.test(name)) {
    if (/\b\d{3,5}(?:KF|F|XE|X)\b/i.test(name)) return null;
    return `${name} integrated graphics`;
  }
  if (/\b(?:amd\s+)?ryzen\b/i.test(`${cpu.brand || ''} ${name}`)) {
    if (/\b\d{4}(?:GE|G)\b/i.test(name)) return `${name} integrated graphics`;
    if (/\b\d{4}F\b/i.test(name)) return null;
    if (/\b[79]\d{3}(?:X3D|X)?\b/i.test(name)) return `${name} integrated graphics`;
  }
  return null;
}

export const isIncludedIntegratedGpu = (value: { id?: string } | null | undefined) =>
  value?.id === INCLUDED_INTEGRATED_GPU_ID;

export function createIntegratedGpuComponent(cpu: CpuGraphicsSource): ComponentData | null {
  const model = integratedGraphicsName(cpu);
  if (!model) return null;
  return {
    id: INCLUDED_INTEGRATED_GPU_ID,
    model,
    description: `Integrated graphics included with ${cpuName(cpu)}. Uses shared system memory.`,
    price: 0,
    image: '/placeholders/components/gpu-integrated.jpg',
    imageHint: 'integrated graphics apu',
    icon: Server,
    wattage: 0,
    performanceTier: 1,
    isIntegratedGraphics: true,
    sourceCpuId: cpu.id,
    specifications: { 'Graphics Type': 'Integrated', 'Source CPU': cpuName(cpu) },
  };
}

export function createIntegratedGpuPart(cpu: Part): Part | null {
  const gpu = createIntegratedGpuComponent(cpu);
  if (!gpu) return null;
  return {
    id: gpu.id,
    name: gpu.model,
    category: 'GPU',
    brand: cpu.brand,
    price: 0,
    stock: Number.MAX_SAFE_INTEGER,
    imageUrl: gpu.image,
    description: gpu.description,
    specifications: gpu.specifications || {},
    wattage: 0,
    performanceTier: 1,
  };
}

export function syncIntegratedGraphics<T extends Record<string, ComponentData | ComponentData[] | null>>(build: T): T {
  const cpu = build.CPU as ComponentData | null;
  const gpu = build.GPU as ComponentData | null;
  if (gpu && !isIncludedIntegratedGpu(gpu)) return build;
  const included = cpu ? createIntegratedGpuComponent(cpu) : null;
  if (gpu?.id === included?.id && gpu?.model === included?.model && gpu?.sourceCpuId === included?.sourceCpuId) return build;
  return { ...build, GPU: included };
}
