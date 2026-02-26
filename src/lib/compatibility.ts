
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

    // 2. RAM Type Compatibility
    if (mobo && ram) {
        const ramList = Array.isArray(ram) ? ram : [ram];
        const moboRamTypeRaw = mobo.ramType || mobo.specifications?.["Memory Type"] || mobo.specifications?.["RAM Type"] || mobo.specifications?.["Memory"];
        const moboRamType = moboRamTypeRaw ? String(moboRamTypeRaw).toUpperCase() : null;

        ramList.forEach(r => {
            const ramTypeRaw = r.ramType || r.specifications?.["Type"] || r.specifications?.["Memory Type"] || (r.model.includes("DDR5") ? "DDR5" : r.model.includes("DDR4") ? "DDR4" : null);
            const ramType = ramTypeRaw ? String(ramTypeRaw).toUpperCase() : null;

            if (moboRamType && ramType) {
                // If neither contains the other, it's a mismatch (e.g., DDR4 vs DDR5)
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

    // 3. PSU Wattage Check
    if (psu) {
        let totalWattage = 0;
        Object.values(build).forEach(val => {
            if (!val) return;
            const items = Array.isArray(val) ? val : [val];
            items.forEach(item => {
                totalWattage += item.wattage || 0;
            });
        });

        const psuWattageMatch = psu.model.match(/(\d+)W/i);
        const psuCapacity = psu.wattage || (psuWattageMatch ? parseInt(psuWattageMatch[1]) : 0);

        if (psuCapacity > 0 && totalWattage > psuCapacity * 0.9) {
            issues.push({
                severity: "error",
                message: `Insufficient Power: Total estimated wattage (${totalWattage}W) is too close to or exceeds PSU capacity (${psuCapacity}W).`,
                componentA: "PSU"
            });
        } else if (psuCapacity > 0 && totalWattage > psuCapacity * 0.7) {
            issues.push({
                severity: "warning",
                message: `Power Headroom: Total estimated wattage (${totalWattage}W) is over 70% of PSU capacity (${psuCapacity}W). Consider a higher wattage PSU for efficiency and future upgrades.`,
                componentA: "PSU"
            });
        }
    }

    // 4. Case Clearance (Simplified)
    if (case_ && gpu) {
        const gpuLength = gpu.dimensions?.width || 0; // Assuming width is the longest dimension for GPU
        const caseGpuMaxVal = case_.specifications?.["Max GPU Length"] || case_.dimensions?.width || 0;
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

    return issues;
}
