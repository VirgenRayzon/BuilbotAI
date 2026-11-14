import type { ComponentData } from "./types";
import {
  caseFFMatch,
  checkFullBuildCompatibility,
  normalize,
  normalizeFF,
  resolveSocket,
  type CompatibilityIssue,
} from "./compatibility";

export type CoreLayoutCategory =
  | "Case"
  | "Motherboard"
  | "CPU"
  | "Cooler"
  | "RAM"
  | "GPU"
  | "Storage"
  | "PSU";

export type PeripheralLayoutCategory =
  | "Monitor"
  | "Keyboard"
  | "Mouse"
  | "Headset";

export type LayoutCategory = CoreLayoutCategory | PeripheralLayoutCategory;

export type CategoryHealthStatus = "ok" | "warning" | "critical";

export type CaseFormFactorTier =
  | "sff"
  | "mini-tower"
  | "mid-tower"
  | "full-tower";

export type PsuFormFactorTier = "sfx" | "sfx-l" | "atx";

export interface LayoutPartSummary {
  category: CoreLayoutCategory;
  selected: boolean;
  count: number;
  name: string;
  tierBadge: string;
  detailLine: string;
  status: CategoryHealthStatus;
  statusMessage?: string;
}

export interface PeripheralSummaryItem {
  category: PeripheralLayoutCategory;
  name: string;
  specBadge: string;
}

export interface M2DriveLayoutItem {
  id: string;
  name: string;
  formFactor: string;
  lengthMm: number;
  widthMm: number;
  capacity: string;
}

export interface SataDriveLayoutItem {
  id: string;
  name: string;
  sizeTier: "2.5" | "3.5";
  lengthMm: number;
  widthMm: number;
  capacity: string;
}

export interface BuildLayoutViewModel {
  caseSpec: {
    selected: boolean;
    name: string;
    layoutStyle: "standard" | "fish-tank";
    formFactorTier: CaseFormFactorTier;
    formFactorLabel: string;
    depthMm: number;
    heightMm: number;
    widthMm: number;
    pciSlots: number;
    moboSupportLabel: string;
    maxRadiatorMm: number;
    maxGpuMm: number;
    maxCoolerHeightMm: number;
    maxPsuDepthMm: number;
    psuSupportLabel: string;
    backConnect: boolean;
    dimensionsLabel: string;
  };
  moboSpec: {
    selected: boolean;
    name: string;
    formFactorTier: "itx" | "matx" | "atx" | "eatx";
    formFactorLabel: string;
    widthMm: number;
    heightMm: number;
    coveredPciSlots: number;
    socketLabel: string;
    socketShape: "square" | "rect";
    socketWidthMm: number;
    socketHeightMm: number;
    ramTypeLabel: string;
    dimmSlots: number;
    nvmeSlots: number;
    sataSlots: number;
  };
  cpuSpec: {
    selected: boolean;
    name: string;
    socketLabel: string;
    socketShape: "square" | "rect";
    widthMm: number;
    heightMm: number;
    coresLabel: string;
    tdpLabel: string;
  };
  coolerSpec: {
    selected: boolean;
    name: string;
    isStock: boolean;
    mode: "air" | "aio";
    airTier: "compact" | "single" | "dual";
    footprintWidthMm: number;
    footprintHeightMm: number;
    towerHeightMm: number;
    radiatorMm: number | null;
    radiatorWidthMm: number;
    radiatorThicknessMm: number;
    fanCount: 1 | 2 | 3;
    sizeLabel: string;
  };
  gpuSpec: {
    selected: boolean;
    name: string;
    isIntegrated: boolean;
    lengthMm: number;
    heightMm: number;
    slotThickness: number;
    occupiedSlots: number[];
    fanCount: 1 | 2 | 3 | 4;
    vramLabel: string;
    sizeLabel: string;
  };
  ramSpec: {
    selected: boolean;
    kitCount: number;
    totalSticks: number;
    stickLengthMm: number;
    populatedSlots: number[];
    generationLabel: string;
    capacityLabel: string;
    isOverflow: boolean;
  };
  storageSpec: {
    selected: boolean;
    totalDrives: number;
    m2Drives: M2DriveLayoutItem[];
    sataDrives: SataDriveLayoutItem[];
    nvmeOverflow: boolean;
    sataOverflow: boolean;
  };
  psuSpec: {
    selected: boolean;
    name: string;
    sizeTier: PsuFormFactorTier;
    depthMm: number;
    heightMm: number;
    widthMm: number;
    formFactorLabel: string;
    wattageLabel: string;
    modularityLabel: string;
  };
  peripherals: PeripheralSummaryItem[];
  partSummaries: Record<CoreLayoutCategory, LayoutPartSummary>;
  issues: CompatibilityIssue[];
  categoryStatus: Record<CoreLayoutCategory, { status: CategoryHealthStatus; message?: string }>;
}

/**
 * Fixed canonical visualizer dimensions for the 4 standard PC Case form factors:
 * 1. Full-Tower (E-ATX / ATX / mATX / Mini-ITX)
 * 2. Mid-Tower (ATX / mATX / Mini-ITX)
 * 3. Mini-Tower (mATX / Mini-ITX)
 * 4. SFF / Mini-ITX (Mini-ITX only)
 */
const FIXED_CASE_FORM_FACTORS: Record<
  CaseFormFactorTier,
  {
    label: string;
    depthMm: number;
    heightMm: number;
    widthMm: number;
    pciSlots: number;
    defaultMaxRadMm: number;
    defaultMaxGpuMm: number;
    defaultMaxCoolerMm: number;
    defaultMaxPsuMm: number;
  }
> = {
  "full-tower": {
    label: "Full-Tower",
    depthMm: 520,
    heightMm: 520,
    widthMm: 245,
    pciSlots: 8,
    defaultMaxRadMm: 420,
    defaultMaxGpuMm: 420,
    defaultMaxCoolerMm: 185,
    defaultMaxPsuMm: 210,
  },
  "mid-tower": {
    label: "Mid-Tower",
    depthMm: 450,
    heightMm: 460,
    widthMm: 215,
    pciSlots: 7,
    defaultMaxRadMm: 360,
    defaultMaxGpuMm: 360,
    defaultMaxCoolerMm: 170,
    defaultMaxPsuMm: 180,
  },
  "mini-tower": {
    label: "Mini-Tower",
    depthMm: 390,
    heightMm: 385,
    widthMm: 200,
    pciSlots: 4,
    defaultMaxRadMm: 240,
    defaultMaxGpuMm: 315,
    defaultMaxCoolerMm: 160,
    defaultMaxPsuMm: 160,
  },
  sff: {
    label: "SFF / Mini-ITX",
    depthMm: 330,
    heightMm: 285,
    widthMm: 170,
    pciSlots: 2,
    defaultMaxRadMm: 240,
    defaultMaxGpuMm: 280,
    defaultMaxCoolerMm: 135,
    defaultMaxPsuMm: 130,
  },
};

/**
 * Fixed canonical visualizer dimensions for the 3 standard PSU form factors:
 * 1. ATX: 150mm (W) × 86mm (H) × 160mm (D)
 * 2. SFX-L: 125mm (W) × 63.5mm (H) × 130mm (D)
 * 3. SFX: 125mm (W) × 63.5mm (H) × 100mm (D)
 */
const FIXED_PSU_FORM_FACTORS: Record<
  PsuFormFactorTier,
  {
    label: string;
    depthMm: number;
    heightMm: number;
    widthMm: number;
  }
> = {
  atx: {
    label: "ATX",
    depthMm: 160,
    heightMm: 86,
    widthMm: 150,
  },
  "sfx-l": {
    label: "SFX-L",
    depthMm: 130,
    heightMm: 64,
    widthMm: 125,
  },
  sfx: {
    label: "SFX",
    depthMm: 100,
    heightMm: 64,
    widthMm: 125,
  },
};

function getSpecString(
  part: ComponentData | null | undefined,
  keys: string[]
): string {
  if (!part?.specifications) return "";
  for (const key of keys) {
    const direct = part.specifications[key];
    if (direct !== undefined && direct !== null && String(direct).trim() !== "") {
      return String(direct).trim();
    }
    const lowerKey = key.toLowerCase();
    const matchedEntry = Object.entries(part.specifications).find(
      ([k]) => k.trim().toLowerCase() === lowerKey
    );
    if (
      matchedEntry &&
      matchedEntry[1] !== undefined &&
      matchedEntry[1] !== null &&
      String(matchedEntry[1]).trim() !== ""
    ) {
      return String(matchedEntry[1]).trim();
    }
  }
  return "";
}

function positiveNum(value: number | undefined | null): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }
  return null;
}

function parseFirstNumber(raw: string | number | undefined | null): number | null {
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) return raw;
  if (!raw) return null;
  const match = String(raw).match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const value = parseFloat(match[1]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function parseMaxNumber(raw: string | number | undefined | null): number | null {
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) return raw;
  if (!raw) return null;
  const matches = String(raw).match(/\d+(?:\.\d+)?/g);
  if (!matches || matches.length === 0) return null;
  const nums = matches.map((m) => parseFloat(m)).filter((n) => Number.isFinite(n) && n > 0);
  return nums.length > 0 ? Math.max(...nums) : null;
}

function asSingle(
  value: ComponentData | ComponentData[] | null | undefined
): ComponentData | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function asList(
  value: ComponentData | ComponentData[] | null | undefined
): ComponentData[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function resolveSocketShape(socketRaw: string): "square" | "rect" {
  const normalized = normalize(socketRaw);
  if (normalized.includes("lga1700") || normalized.includes("lga1851") || normalized.includes("lga")) {
    return "rect";
  }
  return "square";
}

function resolveCaseFormFactorTier(casePart: ComponentData | null): CaseFormFactorTier {
  if (!casePart) return "mid-tower";
  const typeSpec = getSpecString(casePart, ["Type", "Case Type", "Form Factor"]);
  const moboSupport = getSpecString(casePart, ["Mobo Support"]);
  const typeAndModel = `${typeSpec} ${casePart.model}`.toUpperCase();
  const normTypeAndModel = normalizeFF(typeAndModel);

  // 1. Check explicit Tower tiers first so E-ATX/Full/Mid/Mini towers are never misclassified
  if (
    normTypeAndModel.includes("FULLTOWER") ||
    normTypeAndModel.includes("SUPERTOWER") ||
    normTypeAndModel.includes("EATX") ||
    /\b(?:FULL[\s-]?TOWER|E-?ATX)\b/i.test(typeAndModel)
  ) {
    return "full-tower";
  }
  if (
    normTypeAndModel.includes("MIDTOWER") ||
    /\bMID[\s-]?TOWER\b/i.test(typeAndModel)
  ) {
    return "mid-tower";
  }
  if (
    normTypeAndModel.includes("MINITOWER") ||
    normTypeAndModel.includes("MICROATX") ||
    normTypeAndModel.includes("MATX") ||
    /\b(?:MINI[\s-]?TOWER|M-?ATX|MICRO[\s-]?ATX)\b/i.test(typeAndModel)
  ) {
    return "mini-tower";
  }
  if (
    normTypeAndModel.includes("SFF") ||
    normTypeAndModel.includes("SMALLFORMFACTOR") ||
    normTypeAndModel.includes("MINIITX") ||
    /\b(?:ITX|SFF|NR200|TERRA|A4-H2O|MESHLICIOUS|T1)\b/i.test(typeAndModel)
  ) {
    return "sff";
  }

  // 2. Fallback to Motherboard Support hierarchy
  const normMobo = normalizeFF(moboSupport);
  if (normMobo.includes("EATX") || normMobo.includes("EXTENDEDATX")) {
    return "full-tower";
  }
  if (normMobo.includes("ATX") && !normMobo.startsWith("MATX") && !normMobo.startsWith("MICROATX")) {
    return "mid-tower";
  }
  if (normMobo.includes("MATX") || normMobo.includes("MICROATX")) {
    return "mini-tower";
  }
  if (normMobo.includes("ITX")) {
    return "sff";
  }

  return "mid-tower";
}

function resolvePsuFormFactorTier(psuPart: ComponentData | null): PsuFormFactorTier {
  if (!psuPart) return "atx";
  const ffSpec = getSpecString(psuPart, ["Form Factor"]);
  const combined = `${ffSpec} ${psuPart.model}`.toUpperCase();
  if (combined.includes("SFX-L") || combined.includes("SFXL")) {
    return "sfx-l";
  }
  if (combined.includes("SFX")) {
    return "sfx";
  }
  return "atx";
}

function resolveMoboDimensions(rawFF: string, name: string): {
  tier: "itx" | "matx" | "atx" | "eatx";
  label: string;
  widthMm: number;
  heightMm: number;
  coveredPciSlots: number;
} {
  const combined = `${rawFF} ${name}`;
  const ff = normalizeFF(combined);
  if (ff.includes("EATX") || ff.includes("EXTENDEDATX")) {
    return { tier: "eatx", label: "E-ATX", widthMm: 277, heightMm: 305, coveredPciSlots: 7 };
  }
  if (ff.includes("MINIITX") || ff.includes("THINMINIITX") || /\bITX\b/i.test(combined)) {
    return { tier: "itx", label: "Mini-ITX", widthMm: 170, heightMm: 170, coveredPciSlots: 2 };
  }
  if (ff.includes("MICROATX") || ff.includes("MATX") || /\bM-?ATX\b/i.test(combined)) {
    return { tier: "matx", label: "mATX", widthMm: 244, heightMm: 244, coveredPciSlots: 4 };
  }
  return { tier: "atx", label: "ATX", widthMm: 244, heightMm: 305, coveredPciSlots: 7 };
}

function resolvePopulatedDimmSlots(totalSticks: number, dimmSlots: number): number[] {
  const clampedSticks = Math.min(totalSticks, dimmSlots);
  if (clampedSticks <= 0) return [];
  if (dimmSlots === 4) {
    if (clampedSticks === 1) return [1];
    if (clampedSticks === 2) return [1, 3];
    if (clampedSticks === 3) return [0, 1, 3];
    return [0, 1, 2, 3];
  }
  return Array.from({ length: clampedSticks }, (_, idx) => idx);
}

export function buildLayoutViewModel(
  build: Record<string, ComponentData | ComponentData[] | null>
): BuildLayoutViewModel {
  const casePart = asSingle(build.Case);
  const moboPart = asSingle(build.Motherboard);
  const cpuPart = asSingle(build.CPU);
  const coolerPart = asSingle(build.Cooler);
  const gpuPart = asSingle(build.GPU);
  const psuPart = asSingle(build.PSU);
  const ramList = asList(build.RAM);
  const storageList = asList(build.Storage);

  // 1. Case Fixed Form Factor Resolution (Full-Tower, Mid-Tower, Mini-Tower, SFF / Mini-ITX)
  const caseTypeRaw = getSpecString(casePart, ["Case Type", "Type"]);
  const caseNameAndType = `${casePart?.model ?? ""} ${caseTypeRaw}`.toLowerCase();
  const isFishTank =
    caseNameAndType.includes("fish") ||
    caseNameAndType.includes("dual chamber") ||
    caseNameAndType.includes("dual-chamber") ||
    caseNameAndType.includes("panoramic") ||
    caseNameAndType.includes("o11") ||
    caseNameAndType.includes("h6") ||
    caseNameAndType.includes("h9") ||
    caseNameAndType.includes("nv5") ||
    caseNameAndType.includes("nv7") ||
    caseNameAndType.includes("y60") ||
    caseNameAndType.includes("y70") ||
    caseNameAndType.includes("c8") ||
    caseNameAndType.includes("king 95") ||
    caseNameAndType.includes("sky two");

  const caseFFTier = resolveCaseFormFactorTier(casePart);
  const fixedCase = FIXED_CASE_FORM_FACTORS[caseFFTier];

  const caseDepthMm = fixedCase.depthMm;
  const caseHeightMm = fixedCase.heightMm;
  const caseWidthMm = fixedCase.widthMm;
  const pciSlots = fixedCase.pciSlots;

  const moboSupportRaw = getSpecString(casePart, ["Mobo Support", "Form Factor", "Type"]);
  const explicitMaxRad = parseMaxNumber(
    getSpecString(casePart, ["Max Radiator Size (mm)", "Radiator Support (mm)", "Radiator Support"])
  );
  const maxRadiatorMm = explicitMaxRad ?? fixedCase.defaultMaxRadMm;

  const explicitMaxGpu = parseFirstNumber(
    getSpecString(casePart, ["Max GPU Length", "Max GPU Length (mm)"])
  );
  const maxGpuMm = Math.round(explicitMaxGpu ?? fixedCase.defaultMaxGpuMm);

  const explicitMaxCooler = parseFirstNumber(
    getSpecString(casePart, ["Max CPU Cooler Height", "Max Cooler Height (mm)"])
  );
  const maxCoolerHeightMm = Math.round(explicitMaxCooler ?? fixedCase.defaultMaxCoolerMm);

  const psuSupportLabel =
    getSpecString(casePart, ["PSU Form Factor"]) ||
    (caseFFTier === "sff" ? "SFX / SFX-L" : "ATX");
  const maxPsuDepthMm = fixedCase.defaultMaxPsuMm;

  const backConnectRaw = normalize(getSpecString(casePart, ["Back-Connect Cutout"]));
  const backConnect = backConnectRaw === "yes" || backConnectRaw === "true";
  const dimensionsLabel = `${fixedCase.label} (${caseDepthMm}×${caseWidthMm}×${caseHeightMm}mm)`;

  // 2. Motherboard Fixed Form Factor Resolution (E-ATX, ATX, mATX, Mini-ITX)
  const moboFFRaw = getSpecString(moboPart, ["Form Factor"]);
  const resolvedMobo = moboPart
    ? resolveMoboDimensions(moboFFRaw, moboPart.model)
    : caseFFTier === "sff"
      ? resolveMoboDimensions("ITX", "")
      : caseFFTier === "mini-tower"
        ? resolveMoboDimensions("mATX", "")
        : resolveMoboDimensions("ATX", "");

  const moboSocketRaw =
    resolveSocket(moboPart) || getSpecString(moboPart, ["Socket"]) || moboPart?.socket || "";
  const moboSocketLabel = moboSocketRaw ? moboSocketRaw.toUpperCase() : "AM5 / LGA";
  const moboSocketShape = resolveSocketShape(moboSocketRaw);
  const dimmSlotsRaw = parseFirstNumber(getSpecString(moboPart, ["Memory Slots"]));
  const dimmSlots = dimmSlotsRaw
    ? Math.max(2, Math.min(8, Math.round(dimmSlotsRaw)))
    : resolvedMobo.tier === "itx"
      ? 2
      : 4;
  const nvmeSlotsRaw = parseFirstNumber(getSpecString(moboPart, ["NVMe Slots"]));
  const nvmeSlots =
    nvmeSlotsRaw !== null
      ? Math.max(1, Math.min(5, Math.round(nvmeSlotsRaw)))
      : resolvedMobo.tier === "itx"
        ? 2
        : resolvedMobo.tier === "eatx"
          ? 4
          : 3;
  const sataSlotsRaw = parseFirstNumber(getSpecString(moboPart, ["SATA Slots"]));
  const sataSlots = sataSlotsRaw !== null ? Math.max(0, Math.min(8, Math.round(sataSlotsRaw))) : 4;
  const moboRamType =
    getSpecString(moboPart, ["RAM Type", "Memory Type", "Memory", "Generation"]) ||
    moboPart?.ramType ||
    "DDR5";

  // 3. CPU Fixed Form Factor Resolution
  const cpuSocketRaw =
    resolveSocket(cpuPart) || getSpecString(cpuPart, ["Socket"]) || cpuPart?.socket || "";
  const cpuSocketLabel = cpuSocketRaw ? cpuSocketRaw.toUpperCase() : moboSocketLabel;
  const cpuSocketShape = resolveSocketShape(cpuSocketRaw || moboSocketRaw);
  const cpuWidthMm = cpuSocketShape === "rect" ? 37.5 : 40;
  const cpuHeightMm = cpuSocketShape === "rect" ? 45 : 40;
  const coresRaw = getSpecString(cpuPart, ["Cores"]);
  const coresLabel = coresRaw ? `${coresRaw} Cores` : "Processor";
  const tdpRaw =
    getSpecString(cpuPart, ["TDP / Peak Power", "TDP"]) ||
    (cpuPart?.wattage ? `${cpuPart.wattage}W` : "");

  // 4. Cooler Form Factor Resolution
  const coolerTypeRaw = getSpecString(coolerPart, ["Type"]);
  const coolerNameLower = (coolerPart?.model ?? "").toLowerCase();
  const explicitRadMm = parseMaxNumber(getSpecString(coolerPart, ["Radiator Size"]));
  const isAio =
    Boolean(coolerPart) &&
    (coolerNameLower.includes("aio") ||
      coolerNameLower.includes("liquid") ||
      coolerNameLower.includes("kraken") ||
      coolerNameLower.includes("ryujin") ||
      coolerNameLower.includes("ls720") ||
      coolerNameLower.includes("lt720") ||
      coolerNameLower.includes("ls520") ||
      coolerNameLower.includes("arctic liquid") ||
      coolerNameLower.includes("galahad") ||
      coolerNameLower.includes("nautilus") ||
      coolerTypeRaw.toLowerCase().includes("aio") ||
      coolerTypeRaw.toLowerCase().includes("liquid") ||
      (explicitRadMm !== null && explicitRadMm >= 120));
  const isStock = Boolean(
    coolerPart &&
      (coolerPart.id.includes("stock") ||
        coolerNameLower.includes("wraith") ||
        coolerNameLower.includes("laminar") ||
        coolerNameLower.includes("stock"))
  );

  const explicitCoolerHeight = parseFirstNumber(
    getSpecString(coolerPart, ["Height", "Height (mm)"])
  );

  let airTier: "compact" | "single" | "dual" = "single";
  if (isStock || (explicitCoolerHeight !== null && explicitCoolerHeight < 135)) {
    airTier = "compact";
  } else if (
    coolerNameLower.includes("dual") ||
    coolerNameLower.includes("peerless") ||
    coolerNameLower.includes("phantom spirit") ||
    coolerNameLower.includes("nh-d15") ||
    coolerNameLower.includes("ak620") ||
    coolerNameLower.includes("assassin") ||
    coolerNameLower.includes("fuma") ||
    coolerNameLower.includes("dark rock pro") ||
    (explicitCoolerHeight !== null && explicitCoolerHeight >= 160)
  ) {
    airTier = "dual";
  }

  const towerHeightMm = Math.round(
    explicitCoolerHeight ??
      (isAio ? 55 : isStock ? 65 : airTier === "dual" ? 165 : 154)
  );

  const footprintWidthMm = isAio
    ? 68
    : isStock
      ? 95
      : airTier === "dual"
        ? 138
        : 120;
  const footprintHeightMm = isAio
    ? 68
    : isStock
      ? 95
      : airTier === "dual"
        ? 125
        : 82;

  let radiatorMm: number | null = null;
  let radiatorWidthMm = 120;
  let coolerFanCount: 1 | 2 | 3 = 1;
  if (isAio) {
    const inferredRad =
      explicitRadMm ??
      (coolerNameLower.includes("420")
        ? 420
        : coolerNameLower.includes("360")
          ? 360
          : coolerNameLower.includes("280")
            ? 280
            : coolerNameLower.includes("120")
              ? 120
              : 240);
    radiatorMm = inferredRad;
    radiatorWidthMm = inferredRad === 420 || inferredRad === 280 ? 140 : 120;
    coolerFanCount = inferredRad >= 360 ? 3 : inferredRad >= 240 ? 2 : 1;
  } else if (airTier === "dual") {
    coolerFanCount = 2;
  }

  const coolerSizeLabel = isAio
    ? `${radiatorMm}mm AIO`
    : `${towerHeightMm}mm (${airTier === "dual" ? "Dual-Tower" : airTier === "compact" ? "Low-Profile" : "Single-Tower"})`;

  // 5. GPU Form Factor & Length Resolution
  const isIntegrated = Boolean(gpuPart?.isIntegratedGraphics);
  const explicitGpuLength =
    parseFirstNumber(getSpecString(gpuPart, ["Length (Depth) (mm)", "Length (mm)", "Length"])) ??
    positiveNum(gpuPart?.dimensions?.depth) ??
    null;
  const explicitGpuSlots = parseFirstNumber(getSpecString(gpuPart, ["Slot Thickness", "Slots"]));
  const gpuNameLower = (gpuPart?.model ?? "").toLowerCase();

  let estimatedGpuLength = 260;
  let estimatedGpuSlots = 2.2;
  if (
    gpuNameLower.includes("4090") ||
    gpuNameLower.includes("5090") ||
    gpuNameLower.includes("strix") ||
    gpuNameLower.includes("suprim") ||
    gpuNameLower.includes("aorus master")
  ) {
    estimatedGpuLength = 340;
    estimatedGpuSlots = 3.5;
  } else if (
    gpuNameLower.includes("4080") ||
    gpuNameLower.includes("5080") ||
    gpuNameLower.includes("7900 xtx") ||
    gpuNameLower.includes("7900 xt") ||
    gpuNameLower.includes("tuf") ||
    gpuNameLower.includes("gaming trio")
  ) {
    estimatedGpuLength = 320;
    estimatedGpuSlots = 3.0;
  } else if (
    gpuNameLower.includes("4070 ti") ||
    gpuNameLower.includes("5070 ti") ||
    gpuNameLower.includes("7800 xt") ||
    gpuNameLower.includes("3x") ||
    gpuNameLower.includes("triple") ||
    gpuNameLower.includes("eagle") ||
    gpuNameLower.includes("windforce")
  ) {
    estimatedGpuLength = 300;
    estimatedGpuSlots = 2.5;
  } else if (
    gpuNameLower.includes("itx") ||
    gpuNameLower.includes("aero") ||
    gpuNameLower.includes("single") ||
    gpuNameLower.includes("low profile") ||
    gpuNameLower.includes("rx 6500") ||
    gpuNameLower.includes("1650") ||
    gpuNameLower.includes("3050")
  ) {
    estimatedGpuLength = 200;
    estimatedGpuSlots = 2.0;
  } else if (
    gpuNameLower.includes("4060") ||
    gpuNameLower.includes("3060") ||
    gpuNameLower.includes("6600") ||
    gpuNameLower.includes("7600") ||
    gpuNameLower.includes("dual") ||
    gpuNameLower.includes("2x")
  ) {
    estimatedGpuLength = 245;
    estimatedGpuSlots = 2.0;
  }

  const gpuLengthMm = isIntegrated
    ? 0
    : Math.round(explicitGpuLength ?? estimatedGpuLength);
  const slotThickness = isIntegrated
    ? 0
    : Number((explicitGpuSlots ?? estimatedGpuSlots).toFixed(1));
  const gpuHeightMm = isIntegrated ? 0 : Math.round(slotThickness * 20.5);
  const slotSpanCount = isIntegrated ? 0 : Math.max(1, Math.ceil(slotThickness));
  const startSlot = resolvedMobo.tier === "itx" ? 1 : 2;
  const occupiedSlots = Array.from({ length: slotSpanCount }, (_, i) => startSlot + i);

  const gpuFanCount: 1 | 2 | 3 | 4 =
    gpuLengthMm >= 285 ? 3 : gpuLengthMm >= 215 ? 2 : 1;
  const vramLabel = getSpecString(gpuPart, ["VRAM Capacity"]);
  const gpuSizeLabel = isIntegrated
    ? "On-Die iGPU"
    : `${gpuLengthMm}mm • ${slotThickness} Slots`;

  // 6. RAM Resolution
  const totalSticks = ramList.reduce((sum, item) => {
    const count = parseFirstNumber(getSpecString(item, ["Stick Count"])) ?? 1;
    return sum + Math.max(1, Math.round(count));
  }, 0);
  const populatedSlots = resolvePopulatedDimmSlots(totalSticks, dimmSlots);
  const firstRam = ramList[0] ?? null;
  const ramGenerationLabel =
    getSpecString(firstRam, ["Generation", "Memory Type", "RAM Type", "Type"]) ||
    firstRam?.ramType ||
    moboRamType;
  const ramCapacityLabel = getSpecString(firstRam, ["Capacity"]) || `${totalSticks}× DIMM`;
  const ramOverflow = moboPart ? totalSticks > dimmSlots : false;

  // 7. Storage Fixed Form Factor Resolution
  const m2Drives: M2DriveLayoutItem[] = [];
  const sataDrives: SataDriveLayoutItem[] = [];
  storageList.forEach((drive, idx) => {
    const typeRaw = normalize(getSpecString(drive, ["Type", "Interface"]));
    const ffRaw = getSpecString(drive, ["Form Factor"]) || "";
    const capRaw = getSpecString(drive, ["Capacity"]) || "";
    const nameLower = drive.model.toLowerCase();
    const isNvme =
      typeRaw.includes("nvme") ||
      typeRaw.includes("m.2") ||
      ffRaw.toLowerCase().includes("m.2") ||
      ffRaw.includes("2280") ||
      ffRaw.includes("2230") ||
      ffRaw.includes("2242") ||
      nameLower.includes("nvme") ||
      nameLower.includes("m.2");

    if (isNvme) {
      const m2Length =
        ffRaw.includes("2230") || nameLower.includes("2230")
          ? 30
          : ffRaw.includes("2242") || nameLower.includes("2242")
            ? 42
            : ffRaw.includes("22110") || nameLower.includes("22110")
              ? 110
              : 80;
      m2Drives.push({
        id: `${drive.id}-${idx}`,
        name: drive.model,
        formFactor: ffRaw || `M.2 22${m2Length}`,
        lengthMm: m2Length,
        widthMm: 22,
        capacity: capRaw,
      });
    } else {
      const is35 =
        ffRaw.includes("3.5") ||
        nameLower.includes("hdd") ||
        nameLower.includes("barracuda") ||
        nameLower.includes("ironwolf") ||
        nameLower.includes("skyhawk") ||
        nameLower.includes("wd blue 3.5");
      sataDrives.push({
        id: `${drive.id}-${idx}`,
        name: drive.model,
        sizeTier: is35 ? "3.5" : "2.5",
        lengthMm: is35 ? 147 : 100,
        widthMm: is35 ? 102 : 70,
        capacity: capRaw,
      });
    }
  });
  const nvmeOverflow = moboPart ? m2Drives.length > nvmeSlots : false;
  const sataOverflow = moboPart ? sataDrives.length > sataSlots : false;

  // 8. PSU Fixed Form Factor Resolution (ATX = 160x86x150, SFX-L = 130x64x125, SFX = 100x64x125)
  const psuTier = resolvePsuFormFactorTier(psuPart);
  const fixedPsu = FIXED_PSU_FORM_FACTORS[psuTier];
  const psuDepthMm = fixedPsu.depthMm;
  const psuHeightMm = fixedPsu.heightMm;
  const psuWidthMm = fixedPsu.widthMm;
  const psuWattageLabel =
    getSpecString(psuPart, ["Wattage (W)", "Wattage"]) ||
    (psuPart?.wattage ? `${psuPart.wattage}W` : "PSU");
  const modularityLabel = getSpecString(psuPart, ["Modularity"]) || "";

  // 9. Peripherals
  const peripheralCategories: PeripheralLayoutCategory[] = [
    "Monitor",
    "Keyboard",
    "Mouse",
    "Headset",
  ];
  const peripherals: PeripheralSummaryItem[] = [];
  peripheralCategories.forEach((category) => {
    const item = asSingle(build[category]);
    if (!item) return;
    let specBadge: string = category;
    if (category === "Monitor") {
      specBadge =
        [getSpecString(item, ["Screen Size", "Size"]), getSpecString(item, ["Resolution"])]
          .filter(Boolean)
          .join(" • ") || "Display";
    } else if (category === "Keyboard") {
      specBadge = getSpecString(item, ["Layout", "Type"]) || "Keyboard";
    } else if (category === "Mouse") {
      specBadge = getSpecString(item, ["Connectivity", "Weight"]) || "Mouse";
    } else if (category === "Headset") {
      specBadge = getSpecString(item, ["Type", "Connectivity"]) || "Audio";
    }
    peripherals.push({ category, name: item.model, specBadge });
  });

  // 10. Compatibility & Per-Category Health
  const issues = [...checkFullBuildCompatibility(build)];
  if (gpuPart && !isIntegrated && gpuLengthMm > maxGpuMm) {
    issues.push({
      severity: "warning",
      message: `GPU Length Clearance: ${gpuLengthMm}mm GPU exceeds case max GPU length (${maxGpuMm}mm).`,
    });
  }
  if (coolerPart && !isAio && towerHeightMm > maxCoolerHeightMm) {
    issues.push({
      severity: "warning",
      message: `Cooler Height Clearance: ${towerHeightMm}mm cooler exceeds case max height (${maxCoolerHeightMm}mm).`,
    });
  }
  if (psuPart && psuDepthMm > maxPsuDepthMm) {
    issues.push({
      severity: "warning",
      message: `PSU Bay Clearance: ${fixedPsu.label} (${psuDepthMm}mm) exceeds ${maxPsuDepthMm}mm case PSU bay.`,
    });
  }

  const categoryStatus: Record<CoreLayoutCategory, { status: CategoryHealthStatus; message?: string }> = {
    Case: { status: "ok" },
    Motherboard: { status: "ok" },
    CPU: { status: "ok" },
    Cooler: { status: "ok" },
    RAM: { status: "ok" },
    GPU: { status: "ok" },
    Storage: { status: "ok" },
    PSU: { status: "ok" },
  };

  const setIssue = (cat: CoreLayoutCategory, severity: CategoryHealthStatus, msg: string) => {
    const current = categoryStatus[cat];
    if (current.status === "critical") return;
    categoryStatus[cat] = { status: severity, message: msg };
  };

  if (cpuPart && moboPart && cpuSocketRaw && moboSocketRaw && cpuSocketRaw !== moboSocketRaw) {
    const msg = `Socket mismatch (${cpuSocketLabel} vs ${moboSocketLabel})`;
    setIssue("CPU", "critical", msg);
    setIssue("Motherboard", "critical", msg);
  }
  if (ramOverflow) {
    const msg = `${totalSticks}/${dimmSlots} DIMM slots used`;
    setIssue("RAM", "critical", msg);
    setIssue("Motherboard", "warning", msg);
  }
  if (nvmeOverflow || sataOverflow) {
    const msg = nvmeOverflow
      ? `${m2Drives.length}/${nvmeSlots} M.2 slots used`
      : `${sataDrives.length}/${sataSlots} SATA slots used`;
    setIssue("Storage", "critical", msg);
    setIssue("Motherboard", "warning", msg);
  }
  if (isAio && radiatorMm !== null && radiatorMm > maxRadiatorMm) {
    const msg = `${radiatorMm}mm radiator exceeds ${maxRadiatorMm}mm case limit`;
    setIssue("Cooler", "critical", msg);
    setIssue("Case", "critical", msg);
  }
  if (coolerPart && !isAio && towerHeightMm > maxCoolerHeightMm) {
    const msg = `${towerHeightMm}mm cooler exceeds ${maxCoolerHeightMm}mm case clearance`;
    setIssue("Cooler", "warning", msg);
    setIssue("Case", "warning", msg);
  }
  if (
    moboPart &&
    casePart &&
    moboFFRaw &&
    !caseFFMatch(moboSupportRaw, moboFFRaw, caseTypeRaw)
  ) {
    const msg = `${resolvedMobo.label} (${resolvedMobo.heightMm}×${resolvedMobo.widthMm}mm) exceeds ${fixedCase.label} support`;
    setIssue("Motherboard", "critical", msg);
    setIssue("Case", "critical", msg);
  }
  if (gpuPart && !isIntegrated && gpuLengthMm > maxGpuMm) {
    const msg = `${gpuLengthMm}mm GPU exceeds ${maxGpuMm}mm case limit`;
    setIssue("GPU", "warning", msg);
    setIssue("Case", "warning", msg);
  }
  if (psuPart && psuDepthMm > maxPsuDepthMm) {
    const msg = `${fixedPsu.label} (${psuDepthMm}mm) exceeds ${maxPsuDepthMm}mm bay limit`;
    setIssue("PSU", "warning", msg);
    setIssue("Case", "warning", msg);
  }

  const partSummaries: Record<CoreLayoutCategory, LayoutPartSummary> = {
    Case: {
      category: "Case",
      selected: Boolean(casePart),
      count: casePart ? 1 : 0,
      name: casePart?.model || "Unselected Chassis",
      tierBadge: `${fixedCase.label} (${caseDepthMm}×${caseHeightMm}mm)`,
      detailLine: `Max GPU: ${maxGpuMm}mm • Max Rad: ${maxRadiatorMm}mm • Max PSU: ${maxPsuDepthMm}mm`,
      status: categoryStatus.Case.status,
      statusMessage: categoryStatus.Case.message,
    },
    Motherboard: {
      category: "Motherboard",
      selected: Boolean(moboPart),
      count: moboPart ? 1 : 0,
      name: moboPart?.model || "Unselected Motherboard",
      tierBadge: `${resolvedMobo.label} (${resolvedMobo.heightMm}×${resolvedMobo.widthMm}mm)`,
      detailLine: `${moboSocketLabel} • ${dimmSlots} DIMM (${moboRamType.toUpperCase()}) • ${nvmeSlots} M.2 • ${sataSlots} SATA`,
      status: categoryStatus.Motherboard.status,
      statusMessage: categoryStatus.Motherboard.message,
    },
    CPU: {
      category: "CPU",
      selected: Boolean(cpuPart),
      count: cpuPart ? 1 : 0,
      name: cpuPart?.model || "Unselected CPU",
      tierBadge: `${cpuSocketLabel} (${cpuWidthMm}×${cpuHeightMm}mm)`,
      detailLine: [coresLabel, tdpRaw ? `TDP ${tdpRaw}` : null].filter(Boolean).join(" • "),
      status: categoryStatus.CPU.status,
      statusMessage: categoryStatus.CPU.message,
    },
    Cooler: {
      category: "Cooler",
      selected: Boolean(coolerPart),
      count: coolerPart ? 1 : 0,
      name: coolerPart?.model || "Unselected Cooler",
      tierBadge: coolerPart ? coolerSizeLabel : `Max ${maxCoolerHeightMm}mm`,
      detailLine: isAio
        ? `AIO Radiator: ${radiatorMm}mm / Max ${maxRadiatorMm}mm`
        : `Tower Height: ${towerHeightMm}mm / Max ${maxCoolerHeightMm}mm`,
      status: categoryStatus.Cooler.status,
      statusMessage: categoryStatus.Cooler.message,
    },
    RAM: {
      category: "RAM",
      selected: ramList.length > 0,
      count: totalSticks,
      name:
        ramList.length > 0
          ? ramList.length === 1
            ? ramList[0].model
            : `${ramList[0].model} (+${ramList.length - 1})`
          : "Unselected Memory",
      tierBadge: `${totalSticks}/${dimmSlots} Sticks (${ramGenerationLabel.toUpperCase()})`,
      detailLine: `${ramCapacityLabel} • 133mm DIMM Modules`,
      status: categoryStatus.RAM.status,
      statusMessage: categoryStatus.RAM.message,
    },
    GPU: {
      category: "GPU",
      selected: Boolean(gpuPart),
      count: gpuPart ? 1 : 0,
      name: gpuPart?.model || "Unselected Graphics",
      tierBadge: gpuPart ? gpuSizeLabel : `Max ${maxGpuMm}mm`,
      detailLine: isIntegrated
        ? "Integrated CPU Graphics"
        : `Length: ${gpuLengthMm}mm / Max ${maxGpuMm}mm • Slots ${occupiedSlots.join("–")}`,
      status: categoryStatus.GPU.status,
      statusMessage: categoryStatus.GPU.message,
    },
    Storage: {
      category: "Storage",
      selected: storageList.length > 0,
      count: storageList.length,
      name:
        storageList.length > 0
          ? storageList.length === 1
            ? storageList[0].model
            : `${storageList.length} Drives Selected`
          : "Unselected Storage",
      tierBadge: `${m2Drives.length}/${nvmeSlots} M.2 • ${sataDrives.length}/${sataSlots} SATA`,
      detailLine: "M.2 NVMe & SATA Storage Bays",
      status: categoryStatus.Storage.status,
      statusMessage: categoryStatus.Storage.message,
    },
    PSU: {
      category: "PSU",
      selected: Boolean(psuPart),
      count: psuPart ? 1 : 0,
      name: psuPart?.model || "Unselected Power Supply",
      tierBadge: `${fixedPsu.label} (${psuDepthMm}×${psuWidthMm}×${psuHeightMm}mm)`,
      detailLine: `${psuWattageLabel} • ${psuDepthMm}mm / Max ${maxPsuDepthMm}mm`,
      status: categoryStatus.PSU.status,
      statusMessage: categoryStatus.PSU.message,
    },
  };

  return {
    caseSpec: {
      selected: Boolean(casePart),
      name: casePart?.model || "Mid-Tower Reference",
      layoutStyle: isFishTank ? "fish-tank" : "standard",
      formFactorTier: caseFFTier,
      formFactorLabel: fixedCase.label,
      depthMm: caseDepthMm,
      heightMm: caseHeightMm,
      widthMm: caseWidthMm,
      pciSlots,
      moboSupportLabel: moboSupportRaw || "ATX / mATX / ITX",
      maxRadiatorMm,
      maxGpuMm,
      maxCoolerHeightMm,
      maxPsuDepthMm,
      psuSupportLabel,
      backConnect,
      dimensionsLabel,
    },
    moboSpec: {
      selected: Boolean(moboPart),
      name: moboPart?.model || "Motherboard Tray",
      formFactorTier: resolvedMobo.tier,
      formFactorLabel: resolvedMobo.label,
      widthMm: resolvedMobo.widthMm,
      heightMm: resolvedMobo.heightMm,
      coveredPciSlots: resolvedMobo.coveredPciSlots,
      socketLabel: moboSocketLabel,
      socketShape: moboSocketShape,
      socketWidthMm: moboSocketShape === "rect" ? 37.5 : 40,
      socketHeightMm: moboSocketShape === "rect" ? 45 : 40,
      ramTypeLabel: moboRamType.toUpperCase(),
      dimmSlots,
      nvmeSlots,
      sataSlots,
    },
    cpuSpec: {
      selected: Boolean(cpuPart),
      name: cpuPart?.model || "CPU Socket",
      socketLabel: cpuSocketLabel,
      socketShape: cpuSocketShape,
      widthMm: cpuWidthMm,
      heightMm: cpuHeightMm,
      coresLabel,
      tdpLabel: tdpRaw,
    },
    coolerSpec: {
      selected: Boolean(coolerPart),
      name: coolerPart?.model || "CPU Cooler",
      isStock,
      mode: isAio ? "aio" : "air",
      airTier,
      footprintWidthMm,
      footprintHeightMm,
      towerHeightMm,
      radiatorMm,
      radiatorWidthMm,
      radiatorThicknessMm: 52,
      fanCount: coolerFanCount,
      sizeLabel: coolerSizeLabel,
    },
    gpuSpec: {
      selected: Boolean(gpuPart),
      name: gpuPart?.model || "PCIe x16 Slot",
      isIntegrated,
      lengthMm: gpuLengthMm,
      heightMm: gpuHeightMm,
      slotThickness,
      occupiedSlots,
      fanCount: gpuFanCount,
      vramLabel,
      sizeLabel: gpuSizeLabel,
    },
    ramSpec: {
      selected: ramList.length > 0,
      kitCount: ramList.length,
      totalSticks,
      stickLengthMm: 133,
      populatedSlots,
      generationLabel: ramGenerationLabel.toUpperCase(),
      capacityLabel: ramCapacityLabel,
      isOverflow: ramOverflow,
    },
    storageSpec: {
      selected: storageList.length > 0,
      totalDrives: storageList.length,
      m2Drives,
      sataDrives,
      nvmeOverflow,
      sataOverflow,
    },
    psuSpec: {
      selected: Boolean(psuPart),
      name: psuPart?.model || "PSU Shroud",
      sizeTier: psuTier,
      depthMm: psuDepthMm,
      heightMm: psuHeightMm,
      widthMm: psuWidthMm,
      formFactorLabel: fixedPsu.label,
      wattageLabel: psuWattageLabel,
      modularityLabel,
    },
    peripherals,
    partSummaries,
    issues,
    categoryStatus,
  };
}
