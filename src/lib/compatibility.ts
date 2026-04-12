import type { Part, ComponentData } from "./types";

export interface CompatibilityResult {
  compatible: boolean;
  message: string;
}

export interface CompatibilityIssue {
    severity: 'critical' | 'warning';
    message: string;
}

export const normalize = (s?: string | number | null) => s?.toString().trim().toLowerCase() || '';

export const getComponentName = (comp?: any): string => {
    if (!comp) return '';
    return comp.name || comp.model || '';
};

export const checkCompatibility = (part: Part, currentBuild: Record<string, ComponentData | ComponentData[] | null>): CompatibilityResult => {
  const category = part.category;

  // Accessories are always compatible
  const accessoryCategories = ['Monitor', 'Keyboard', 'Mouse', 'Headset'];
  if (accessoryCategories.includes(category)) {
    return { compatible: true, message: '' };
  }

  const cpu = currentBuild['CPU'] as ComponentData | null;
  const mobo = currentBuild['Motherboard'] as ComponentData | null;
  const ramData = currentBuild['RAM'];
  const currentRams = Array.isArray(ramData) ? ramData : (ramData ? [ramData as ComponentData] : []);

  const partSocket = normalize(part.socket || part.specifications?.['Socket'] || part.specifications?.['socket']);
  const partRamType = normalize(part.ramType || part.specifications?.['Memory Type'] || part.specifications?.['RAM Type'] || part.specifications?.['Memory'] || part.specifications?.['Generation'] || part.specifications?.['Type']);

  // CPU Validation
  if (category === 'CPU') {
    if (mobo) {
      const moboSocket = normalize(mobo.socket || mobo.specifications?.['Socket']);
      if (partSocket && moboSocket && moboSocket !== partSocket) {
        return { compatible: false, message: `This CPU uses ${partSocket.toUpperCase()} socket, but your motherboard is ${moboSocket.toUpperCase()}.` };
      }
    }
  }

  // Motherboard Validation
  if (category === 'Motherboard') {
    if (cpu) {
      const cpuSocket = normalize(cpu.socket || cpu.specifications?.['Socket']);
      if (partSocket && cpuSocket && cpuSocket !== partSocket) {
        return { compatible: false, message: `This motherboard is ${partSocket.toUpperCase()}, but your CPU uses ${cpuSocket.toUpperCase()}.` };
      }
    }
    if (currentRams.length > 0) {
      for (const r of currentRams) {
        const stickRamType = normalize(r.ramType || r.specifications?.['Memory Type'] || r.specifications?.['RAM Type'] || r.specifications?.['Memory'] || r.specifications?.['Generation'] || r.specifications?.['Type']);
        if (partRamType && stickRamType) {
          if (!partRamType.includes(stickRamType) && !stickRamType.includes(partRamType)) {
            return { compatible: false, message: `This motherboard supports ${partRamType.toUpperCase()}, but your selected RAM (${getComponentName(r)}) is ${stickRamType.toUpperCase()}.` };
          }
        }
      }
    }
  }

  // RAM Validation
  if (category === 'RAM') {
    if (mobo) {
      const moboRamType = normalize(mobo.ramType || mobo.specifications?.['Memory Type'] || mobo.specifications?.['RAM Type'] || mobo.specifications?.['Memory'] || mobo.specifications?.['Generation'] || mobo.specifications?.['Type']);
      if (moboRamType && partRamType) {
        if (!moboRamType.includes(partRamType) && !partRamType.includes(moboRamType)) {
          return { compatible: false, message: `Your motherboard supports ${moboRamType.toUpperCase()}, but this RAM is ${partRamType.toUpperCase()}.` };
        }
      }

      // RAM Slot Check
      const totalSlots = parseInt(mobo.specifications?.['Memory Slots']?.toString() || "4");
      const usedSlots = currentRams.reduce((sum, r) => sum + parseInt(r.specifications?.['Stick Count']?.toString() || "1"), 0);
      const partStickCount = parseInt(part.specifications?.['Stick Count']?.toString() || "1");

      if (usedSlots + partStickCount > totalSlots) {
        return { compatible: false, message: `RAM slot is full (${usedSlots}/${totalSlots} slots used).` };
      }
    }
  }

  // Cooler Validation
  if (category === 'Cooler') {
    const case_ = (currentBuild['Case'] as ComponentData | null);
    if (case_) {
      const coolerModel = part.name.toLowerCase();
      const radiatorSizeRaw = part.specifications?.["Radiator Size"] || "";
      const radiatorSize = parseInt(String(radiatorSizeRaw).match(/(\d+)/)?.[0] || "0");
      const isAio = coolerModel.includes("aio") || coolerModel.includes("liquid") || radiatorSize > 0;

      if (isAio && radiatorSize > 0) {
        const caseMaxRadRaw = case_.specifications?.["Max Radiator Size (mm)"] || 0;
        const caseMaxRad = typeof caseMaxRadRaw === 'string' ? parseFloat(caseMaxRadRaw) : caseMaxRadRaw;

        if (caseMaxRad > 0 && radiatorSize > caseMaxRad) {
          return { compatible: false, message: `Radiator Mismatch: This ${radiatorSize}mm cooler exceeds the max radiator size (${caseMaxRad}mm) for your selected case.` };
        }
      }
    }
  }

  // Case Validation
  if (category === 'Case') {
    const cooler = (currentBuild['Cooler'] as ComponentData | null);
    if (cooler) {
      const caseMaxRadRaw = part.specifications?.["Max Radiator Size (mm)"] || 0;
      const caseMaxRad = typeof caseMaxRadRaw === 'string' ? parseFloat(caseMaxRadRaw) : caseMaxRadRaw;

      const coolerModel = getComponentName(cooler).toLowerCase();
      const radiatorSizeRaw = cooler.specifications?.["Radiator Size"] || "";
      const radiatorSize = parseInt(String(radiatorSizeRaw).match(/(\d+)/)?.[0] || "0");
      const isAio = (coolerModel.includes("aio") || coolerModel.includes("liquid") || radiatorSize > 0);

      if (isAio && radiatorSize > 0 && caseMaxRad > 0 && radiatorSize > caseMaxRad) {
        return { compatible: false, message: `Case Incompatible: This case supports up to ${caseMaxRad}mm radiators, but your selected cooler is ${radiatorSize}mm.` };
      }
    }
  }

  return { compatible: true, message: '' };
};

export const checkFullBuildCompatibility = (build: Record<string, ComponentData | ComponentData[] | null>): CompatibilityIssue[] => {
    const issues: CompatibilityIssue[] = [];
    const cpu = build['CPU'] as ComponentData | null;
    const mobo = build['Motherboard'] as ComponentData | null;
    const ramData = build['RAM'];
    const rams = Array.isArray(ramData) ? ramData : (ramData ? [ramData as ComponentData] : []);
    const case_ = build['Case'] as ComponentData | null;
    const cooler = build['Cooler'] as ComponentData | null;

    if (cpu && mobo) {
        const cpuSocket = normalize(cpu.socket || cpu.specifications?.['Socket']);
        const moboSocket = normalize(mobo.socket || mobo.specifications?.['Socket']);
        if (cpuSocket && moboSocket && cpuSocket !== moboSocket) {
            issues.push({ severity: 'critical', message: `Socket Mismatch: CPU is ${cpuSocket.toUpperCase()}, but Motherboard is ${moboSocket.toUpperCase()}.` });
        }

        const moboRamType = normalize(mobo.ramType || mobo.specifications?.['Memory Type'] || mobo.specifications?.['RAM Type'] || mobo.specifications?.['Memory'] || mobo.specifications?.['Generation'] || mobo.specifications?.['Type']);
        if (rams.length > 0) {
            for (const r of rams) {
                const ramType = normalize(r.ramType || r.specifications?.['Memory Type'] || r.specifications?.['RAM Type'] || r.specifications?.['Memory'] || r.specifications?.['Generation'] || r.specifications?.['Type']);
                if (moboRamType && ramType && !moboRamType.includes(ramType) && !ramType.includes(moboRamType)) {
                    issues.push({ severity: 'critical', message: `RAM Incompatible: Motherboard supports ${moboRamType.toUpperCase()}, but ${getComponentName(r)} is ${ramType.toUpperCase()}.` });
                }
            }
        }
    }

    if (mobo) {
        // RAM Slot Check
        const totalSlots = parseInt(mobo.specifications?.['Memory Slots']?.toString() || "4");
        const usedSlots = rams.reduce((sum, r) => sum + parseInt(r.specifications?.['Stick Count']?.toString() || "1"), 0);
        if (usedSlots > totalSlots) {
            issues.push({ severity: 'critical', message: `Too much RAM: This motherboard only has ${totalSlots} slots, but you're using ${usedSlots}.` });
        }
    }

    if (cooler && case_) {
        const coolerModel = getComponentName(cooler).toLowerCase();
        const radiatorSizeRaw = cooler.specifications?.["Radiator Size"] || "";
        const radiatorSize = parseInt(String(radiatorSizeRaw).match(/(\d+)/)?.[0] || "0");
        const isAio = (coolerModel.includes("aio") || coolerModel.includes("liquid") || radiatorSize > 0);

        if (isAio && radiatorSize > 0) {
            const caseMaxRadRaw = case_.specifications?.["Max Radiator Size (mm)"] || 0;
            const caseMaxRad = typeof caseMaxRadRaw === 'string' ? parseFloat(caseMaxRadRaw) : caseMaxRadRaw;
            if (caseMaxRad > 0 && radiatorSize > caseMaxRad) {
                issues.push({ severity: 'critical', message: `${radiatorSize}mm cooler exceeds the max radiator size (${caseMaxRad}mm) for your selected case.` });
            }
        }
    }

    return issues;
};
