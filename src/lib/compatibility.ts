
import { Part, ComponentData } from "./types";

export type CompatibilityIssue = {
    severity: "error" | "warning";
    message: string;
    componentA: string;
    componentB?: string;
};

export function checkCompatibility(build: Record<string, ComponentData | ComponentData[] | null>): CompatibilityIssue[] {
    const issues: CompatibilityIssue[] = [];

    const cpu = build["CPU"] as ComponentData | null;
    const mobo = build["Motherboard"] as ComponentData | null;
    const ram = build["RAM"] ?? null;
    const psu = build["PSU"] as ComponentData | null;
    const gpu = build["GPU"] as ComponentData | null;
    const case_ = build["Case"] as ComponentData | null;
    const cooler = build["Cooler"] as ComponentData | null;
    const storage = build["Storage"];
    const storageList = Array.isArray(storage) ? storage : storage ? [storage] : [];

    // 1. Socket Compatibility
    if (cpu && mobo) {
        const getSocket = (p: ComponentData) => {
            const raw = p.socket || p.specifications?.["Socket"] || p.specifications?.["socket"] || p.specifications?.["CPU Socket"] || p.specifications?.["Socket Support"];
            return raw ? String(raw).replace(/[\s-]/g, '').toUpperCase() : null;
        };

        const cpuSocket = getSocket(cpu);
        const moboSocket = getSocket(mobo);

        if (cpuSocket && moboSocket && cpuSocket !== moboSocket) {
            issues.push({
                severity: "error",
                message: `Socket mismatch: CPU uses ${cpu.socket || cpuSocket} but Motherboard has ${mobo.socket || moboSocket} socket.`,
                componentA: "CPU",
                componentB: "Motherboard"
            });
        }
    }

    // 2. RAM Type Compatibility (Mobo ↔ RAM AND CPU ↔ RAM — spec: match strictly to both)
    if (ram) {
        const ramList = Array.isArray(ram) ? ram : [ram];

        // 2a. Mobo ↔ RAM
        if (mobo) {
            const moboRamTypeRaw = mobo.ramType || mobo.specifications?.["RAM Type"] || mobo.specifications?.["Memory Type"] || mobo.specifications?.["Memory"];
            const moboRamType = moboRamTypeRaw ? String(moboRamTypeRaw).toUpperCase() : null;

            ramList.forEach(r => {
                const ramTypeRaw = r.ramType || r.specifications?.["Type"] || r.specifications?.["Memory Type"] || (r.model.includes("DDR5") ? "DDR5" : r.model.includes("DDR4") ? "DDR4" : null);
                const ramType = ramTypeRaw ? String(ramTypeRaw).toUpperCase() : null;

                if (moboRamType && ramType) {
                    if (!moboRamType.includes(ramType) && !ramType.includes(moboRamType)) {
                        issues.push({
                            severity: "error",
                            message: `RAM type mismatch: Motherboard supports ${moboRamType} but ${r.model} is ${ramType}.`,
                            componentA: "Motherboard",
                            componentB: "RAM"
                        });
                    }
                }
            });
        }

        // 2b. CPU ↔ RAM (spec: DDR gen must match both CPU and Motherboard)
        if (cpu) {
            const cpuMemTypeRaw = cpu.specifications?.["Memory Type"] || cpu.specifications?.["Supported Memory"];
            const cpuMemType = cpuMemTypeRaw ? String(cpuMemTypeRaw).toUpperCase() : null;

            if (cpuMemType) {
                ramList.forEach(r => {
                    const ramTypeRaw = r.ramType || r.specifications?.["Type"] || r.specifications?.["Memory Type"] || (r.model.includes("DDR5") ? "DDR5" : r.model.includes("DDR4") ? "DDR4" : null);
                    const ramType = ramTypeRaw ? String(ramTypeRaw).toUpperCase() : null;

                    if (ramType && !cpuMemType.includes(ramType) && !ramType.includes(cpuMemType)) {
                        issues.push({
                            severity: "error",
                            message: `RAM type mismatch: CPU supports ${cpuMemType} but ${r.model} is ${ramType}.`,
                            componentA: "CPU",
                            componentB: "RAM"
                        });
                    }
                });
            }
        }
    }

    // 3. PSU Wattage Check (spec: 20-30% overhead — error at >80% load, warning at >65%)
    if (psu) {
        let totalWattage = 0;
        Object.entries(build).forEach(([key, val]) => {
            if (key === 'PSU' || !val) return; // Exclude PSU itself
            const items = Array.isArray(val) ? val : [val];
            items.forEach(item => {
                totalWattage += item.wattage || 0;
            });
        });

        const psuWattageMatch = psu.model.match(/(\d+)W/i);
        const psuCapacity = psu.wattage || (psuWattageMatch ? parseInt(psuWattageMatch[1]) : 0);

        if (psuCapacity > 0 && totalWattage > psuCapacity * 0.8) {
            // Less than 20% headroom — spec violation (error)
            issues.push({
                severity: "error",
                message: `Insufficient Power Headroom: Total estimated draw (${totalWattage}W) leaves less than 20% headroom on the PSU (${psuCapacity}W). Upgrade to at least ${Math.ceil(totalWattage * 1.25)}W.`,
                componentA: "PSU"
            });
        } else if (psuCapacity > 0 && totalWattage > psuCapacity * 0.65) {
            // Less than 35% headroom — early warning
            issues.push({
                severity: "warning",
                message: `Power Headroom Warning: Total estimated draw (${totalWattage}W) is over 65% of PSU capacity (${psuCapacity}W). Consider a higher wattage PSU for efficiency and future upgrades.`,
                componentA: "PSU"
            });
        }
    }

    // 4. Case GPU Clearance (spec: GPU length in mm vs case max GPU length)
    if (case_ && gpu) {
        // GPU's physical length — check the dedicated spec key first, then dimensions
        const gpuLengthRaw = gpu.specifications?.["Length (Depth) (mm)"] || gpu.dimensions?.depth || gpu.dimensions?.width || 0;
        const gpuLength = typeof gpuLengthRaw === 'string' ? parseFloat(gpuLengthRaw) : gpuLengthRaw;
        const caseGpuMaxVal = case_.specifications?.["Max GPU Length"] || case_.dimensions?.depth || 0;
        const caseGpuMax = typeof caseGpuMaxVal === 'string' ? parseFloat(caseGpuMaxVal) : caseGpuMaxVal;

        if (gpuLength > 0 && typeof caseGpuMax === 'number' && caseGpuMax > 0 && gpuLength > caseGpuMax) {
            issues.push({
                severity: "error",
                message: `GPU Length: ${gpu.model} (${gpuLength}mm) may not fit in the selected case (Max ${caseGpuMax}mm).`,
                componentA: "Case",
                componentB: "GPU"
            });
        }
    }

    // 5. Cooler TDP check (spec: cooler wattage must meet or exceed CPU TDP)
    if (cpu && cooler) {
        const cpuTdp = cpu.wattage || 0;
        const coolerRating = cooler.wattage || 0;

        if (cpuTdp > 0 && coolerRating > 0 && coolerRating < cpuTdp) {
            issues.push({
                severity: "error",
                message: `Cooler Insufficient: ${cooler.model} is rated for ${coolerRating}W but your CPU (${cpu.model}) has a ${cpuTdp}W TDP. Upgrade to a cooler rated for at least ${cpuTdp}W.`,
                componentA: "Cooler",
                componentB: "CPU"
            });
        }
    }

    // 6. Back-Connect (BTF/Project Stealth) motherboard compatibility check
    if (mobo && case_) {
        const moboModelUpper = mobo.model.toUpperCase();
        const moboSpecs = JSON.stringify(mobo.specifications || {}).toUpperCase();
        const isBtfMobo = moboModelUpper.includes("BTF") || moboModelUpper.includes("PROJECT STEALTH") || moboSpecs.includes("BACK-CONNECT") || moboSpecs.includes("BTF");

        if (isBtfMobo) {
            const caseModelUpper = case_.model.toUpperCase();
            const caseSpecs = JSON.stringify(case_.specifications || {}).toUpperCase();
            // Check both 'Back-Connect Cutout' (new key) and legacy lookups
            const caseHasBtfCutout = caseModelUpper.includes("BTF") || caseModelUpper.includes("PROJECT STEALTH") || caseSpecs.includes("BTF") || caseSpecs.includes("BACK-CONNECT") || caseSpecs.includes("HIDDEN CONNECTOR") || (case_.specifications?.["Back-Connect Cutout"] || '').toString().toUpperCase().includes('YES');

            if (!caseHasBtfCutout) {
                issues.push({
                    severity: "warning",
                    message: `Back-Connect Compatibility: ${mobo.model} is a BTF/Back-Connect motherboard. Ensure your case (${case_.model}) has the required rear cutout for hidden cables. Verify in the case specifications before purchasing.`,
                    componentA: "Motherboard",
                    componentB: "Case"
                });
            }
        }
    }

    // 7. M.2 / PCIe Lane Warning for multiple storage drives
    if (mobo && storageList.length > 1) {
        // Support "3x Gen4" format — extract just the leading number
        const moboM2SlotsRaw = mobo.specifications?.["M.2 Slots"] || mobo.specifications?.["M2 Slots"] || null;
        const moboM2Slots = moboM2SlotsRaw ? String(moboM2SlotsRaw).match(/(\d+)/)?.[1] ?? moboM2SlotsRaw : null;
        const slotCount = moboM2Slots ? parseInt(String(moboM2Slots)) : null;

        if (slotCount !== null && storageList.length > slotCount) {
            issues.push({
                severity: "error",
                message: `M.2 Slot Limit: You have ${storageList.length} storage drives but the motherboard (${mobo.model}) only has ${slotCount} M.2 slot(s). Remove a drive or use a SATA SSD instead.`,
                componentA: "Motherboard",
                componentB: "Storage"
            });
        } else if (storageList.length > 1) {
            issues.push({
                severity: "warning",
                message: `PCIe Lane Sharing: With ${storageList.length} NVMe drives installed, some M.2 slots may share PCIe bandwidth with other slots (e.g., SATA ports). Verify your motherboard's lane bifurcation specs to avoid bottlenecks.`,
                componentA: "Storage"
            });
        }
    }

    // 8. Radiator Size Check (spec: AIO radiator must be <= Case max radiator support)
    if (case_ && cooler) {
        const coolerModel = cooler.model.toLowerCase();
        const radiatorSizeRaw = cooler.specifications?.["Radiator Size"] || "";
        const radiatorSize = parseInt(String(radiatorSizeRaw).match(/(\d+)/)?.[0] || "0");

        const isAio = coolerModel.includes("aio") || coolerModel.includes("liquid") || radiatorSize > 0;

        if (isAio && radiatorSize > 0) {
            const caseMaxRadRaw = case_.specifications?.["Max Radiator Size (mm)"] || 0;
            const caseMaxRad = typeof caseMaxRadRaw === 'string' ? parseFloat(caseMaxRadRaw) : caseMaxRadRaw;

            if (caseMaxRad > 0 && radiatorSize > caseMaxRad) {
                issues.push({
                    severity: "error",
                    message: `Radiator Size Mismatch: ${cooler.model} uses a ${radiatorSize}mm radiator, but ${case_.model} only supports up to ${caseMaxRad}mm.`,
                    componentA: "Case",
                    componentB: "Cooler"
                });
            }
        }
    }

    // 9. Motherboard Form Factor compatibility check (Hierarchy: E-ATX > ATX > M-ATX > ITX)
    if (case_ && mobo) {
        const moboFormFactorRaw = mobo.specifications?.["Form Factor"] || "";
        const moboFF = String(moboFormFactorRaw).trim().toUpperCase();

        const caseMoboSupportRaw = case_.specifications?.["Mobo Support"] || "";
        const caseSupport = String(caseMoboSupportRaw).toUpperCase();

        const caseTypeRaw = case_.specifications?.["Type"] || "";
        const caseType = String(caseTypeRaw).toUpperCase();

        if (moboFF && (caseSupport || caseType)) {
            const ffOrder: Record<string, number> = {
                'E-ATX': 4, 'EATX': 4,
                'ATX': 3,
                'M-ATX': 2, 'MATX': 2, 'MICRO-ATX': 2,
                'ITX': 1, 'MINI-ITX': 1
            };

            const moboSize = ffOrder[moboFF] || 0;

            // 1. Check explicit support list first
            const supportedFormFactors = caseSupport.split(/[\s,]+/).filter(Boolean);
            let isSupported = supportedFormFactors.some(ff => {
                const ffSize = ffOrder[ff] || 0;
                return ffSize >= moboSize;
            });

            // 2. If not in explicit list, check the Case Type (e.g., "ATX Mid Tower" implies ATX support)
            if (!isSupported && caseType) {
                Object.keys(ffOrder).forEach(ff => {
                    if (caseType.includes(ff)) {
                        const caseMaxSize = ffOrder[ff];
                        if (caseMaxSize >= moboSize) isSupported = true;
                    }
                });
            }

            if (!isSupported && moboSize > 0) {
                issues.push({
                    severity: "error",
                    message: `Motherboard Form Factor: ${mobo.model} (${moboFF}) is too large for ${case_.model}. This case supports up to ${caseSupport || caseType}.`,
                    componentA: "Case",
                    componentB: "Motherboard"
                });
            }
        }
    }

    return issues;
}
