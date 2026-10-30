'use server';

import { generateText, Output } from 'ai';
import { z } from 'zod';
import { getLanguageModelForChat } from '@/lib/ai-model-resolver';
import { integratedGraphicsName, INCLUDED_INTEGRATED_GPU_ID } from '@/lib/integrated-graphics';
import { checkFullBuildCompatibility } from '@/lib/compatibility';
import type { ComponentData } from '@/lib/types';
import { Cpu } from 'lucide-react';

const ComponentSchema = z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    price: z.number(),
    brand: z.string().optional(),
    stock: z.number().optional(),
    wattage: z.number().optional(),
    socket: z.string().optional(),
    ramType: z.string().optional(),
    performanceScore: z.number().optional(),
    specifications: z.record(z.string(), z.any()).optional(),
    integratedGraphics: z.string().optional(),
});

export type SmartBudgetPart = z.infer<typeof ComponentSchema>;

const AiSmartBudgetInputSchema = z.object({
    budget: z.number().positive(),
    inventory: z.array(ComponentSchema),
    preferences: z.string().optional(),
});

export type AiSmartBudgetInput = z.infer<typeof AiSmartBudgetInputSchema>;

export interface AiSmartBudgetOutput {
    build: Record<string, string | null>;
    totalCost: number;
    reasoning: string;
}

const ORDERED_CATEGORIES = ['CPU', 'Motherboard', 'RAM', 'Storage', 'GPU', 'PSU', 'Case', 'Cooler'] as const;

function buildPartToComponent(part: SmartBudgetPart): ComponentData {
    return {
        id: part.id,
        model: part.name,
        price: part.price,
        description: '',
        image: '',
        imageHint: '',
        icon: Cpu,
        wattage: part.wattage,
        socket: part.socket || (part.specifications?.['Socket']?.toString() || part.specifications?.['socket']?.toString()),
        ramType: part.ramType || (part.specifications?.['Memory Type']?.toString() || part.specifications?.['RAM Type']?.toString()),
        specifications: part.specifications,
        performanceScore: part.performanceScore,
    };
}

/**
 * Validates whether the selected components form a valid and compatible build.
 */
function validateBuildSelection(
    selectedIds: Record<string, string | null>,
    inventoryById: Map<string, SmartBudgetPart>,
    budget: number
): { valid: boolean; totalCost: number; issues: string[] } {
    const issues: string[] = [];
    let totalCost = 0;
    const testBuild: Record<string, ComponentData | ComponentData[] | null> = {};

    for (const category of ORDERED_CATEGORIES) {
        const partId = selectedIds[category];
        if (!partId) {
            issues.push(`Missing component for ${category}`);
            continue;
        }

        if (category === 'GPU' && partId === INCLUDED_INTEGRATED_GPU_ID) {
            const cpuPartId = selectedIds.CPU;
            const cpuPart = cpuPartId ? inventoryById.get(cpuPartId) : null;
            const igpu = cpuPart ? integratedGraphicsName(cpuPart) : null;
            if (!igpu) {
                issues.push('Integrated graphics selected, but chosen CPU does not include integrated graphics.');
            }
            continue;
        }

        const part = inventoryById.get(partId);
        if (!part) {
            issues.push(`Selected part ${partId} for ${category} does not exist in inventory.`);
            continue;
        }

        if (typeof part.stock === 'number' && part.stock <= 0) {
            issues.push(`Part ${part.name} is out of stock.`);
        }

        totalCost += part.price;
        const comp = buildPartToComponent(part);
        if (category === 'Storage' || category === 'RAM') {
            testBuild[category] = [comp];
        } else {
            testBuild[category] = comp;
        }
    }

    if (totalCost > budget) {
        issues.push(`Total cost (₱${totalCost.toLocaleString('en-PH')}) exceeds target budget (₱${budget.toLocaleString('en-PH')}).`);
    }

    const compatIssues = checkFullBuildCompatibility(testBuild);
    const criticalCompat = compatIssues.filter(i => i.severity === 'critical');
    if (criticalCompat.length > 0) {
        issues.push(...criticalCompat.map(c => `Compatibility conflict: ${c.message}`));
    }

    return {
        valid: issues.length === 0,
        totalCost,
        issues,
    };
}

/**
 * Deterministic fallback solver: Finds the highest-performance compatible parts
 * within budget if the AI model output misses or violates constraints.
 */
function deterministicFallbackSolver(
    inventory: SmartBudgetPart[],
    budget: number
): { build: Record<string, string | null>; totalCost: number; reasoning: string } | null {
    const inStock = inventory.filter(p => !p.stock || p.stock > 0);
    const byCategory: Record<string, SmartBudgetPart[]> = {};
    for (const cat of ORDERED_CATEGORIES) {
        byCategory[cat] = inStock
            .filter(p => p.category.toUpperCase() === cat.toUpperCase())
            .sort((a, b) => a.price - b.price);
    }

    // Require essential core parts
    const requiredCats = ['CPU', 'Motherboard', 'RAM', 'Storage', 'PSU', 'Case', 'Cooler'];
    if (requiredCats.some(cat => !byCategory[cat] || byCategory[cat].length === 0)) {
        return null;
    }

    // Greedy search: try best CPUs and GPUs first
    const cpus = [...byCategory.CPU].sort((a, b) => (b.performanceScore || 0) - (a.performanceScore || 0));
    const gpus = [...(byCategory.GPU || [])].sort((a, b) => (b.performanceScore || 0) - (a.performanceScore || 0));

    for (const cpu of cpus) {
        const cpuComp = buildPartToComponent(cpu);
        const hasIgpu = !!integratedGraphicsName(cpu);

        // Find compatible motherboard
        const mobos = (byCategory.Motherboard || []).filter(mobo => {
            const moboComp = buildPartToComponent(mobo);
            return !checkFullBuildCompatibility({ CPU: cpuComp, Motherboard: moboComp }).some(i => i.severity === 'critical');
        });
        if (mobos.length === 0) continue;
        const mobo = mobos[0];
        const moboComp = buildPartToComponent(mobo);

        // Find compatible RAM
        const rams = (byCategory.RAM || []).filter(ram => {
            const ramComp = buildPartToComponent(ram);
            return !checkFullBuildCompatibility({ CPU: cpuComp, Motherboard: moboComp, RAM: [ramComp] }).some(i => i.severity === 'critical');
        });
        if (rams.length === 0) continue;
        const ram = rams[0];

        const storage = byCategory.Storage[0];
        const psu = byCategory.PSU[0];
        const pcCase = byCategory.Case[0];
        const cooler = byCategory.Cooler[0];

        // Evaluate with GPU or iGPU
        const gpuOptions: { id: string; price: number; isIgpu: boolean }[] = [];
        for (const gpu of gpus) {
            gpuOptions.push({ id: gpu.id, price: gpu.price, isIgpu: false });
        }
        if (hasIgpu) {
            gpuOptions.push({ id: INCLUDED_INTEGRATED_GPU_ID, price: 0, isIgpu: true });
        }

        for (const gpuOpt of gpuOptions) {
            const baseCost = cpu.price + mobo.price + ram.price + storage.price + psu.price + pcCase.price + cooler.price + gpuOpt.price;
            if (baseCost <= budget) {
                const buildMap: Record<string, string | null> = {
                    CPU: cpu.id,
                    GPU: gpuOpt.id,
                    Motherboard: mobo.id,
                    RAM: ram.id,
                    Storage: storage.id,
                    PSU: psu.id,
                    Case: pcCase.id,
                    Cooler: cooler.id,
                };

                return {
                    build: buildMap,
                    totalCost: baseCost,
                    reasoning: `Deterministic optimization selected 100% compatible in-stock parts within ₱${budget.toLocaleString('en-PH')} (${gpuOpt.isIgpu ? 'using integrated CPU graphics' : 'with dedicated GPU'}).`,
                };
            }
        }
    }

    return null;
}

export async function aiSmartBudgetAction(input: AiSmartBudgetInput): Promise<AiSmartBudgetOutput> {
    const budgetPhp = input.budget;
    const inventory = input.inventory.filter(item => typeof item.stock !== 'number' || item.stock > 0);
    const inventoryById = new Map(inventory.map(item => [item.id, item]));

    // Compact inventory summary for each category to minimize token consumption
    // Group into 3 tiers per category: Entry, Mid, and High within budget
    const compactMenu: Record<string, any[]> = {};
    for (const cat of ORDERED_CATEGORIES) {
        const parts = inventory
            .filter(item => item.category.toUpperCase() === cat.toUpperCase() && item.price <= budgetPhp)
            .sort((a, b) => a.price - b.price);

        // Keep up to 6 representative choices per category (min, median, max/best)
        const shortlisted: typeof parts = [];
        if (parts.length <= 6) {
            shortlisted.push(...parts);
        } else {
            shortlisted.push(...parts.slice(0, 3)); // lowest budget options
            shortlisted.push(...parts.slice(-3)); // best performance within budget
        }

        compactMenu[cat] = shortlisted.map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            tier: p.performanceScore ? `${p.performanceScore}/100` : undefined,
            ...(cat === 'CPU' ? { igpu: integratedGraphicsName(p) ? 'Yes' : 'No' } : {}),
            ...(p.socket ? { socket: p.socket } : {}),
            ...(p.ramType ? { ramType: p.ramType } : {}),
        }));
    }

    const prompt = `You are the BuildbotAI Smart Budget Optimizer for the Philippine PC market.
Your task is to select an optimal, 100% compatible combination of PC parts strictly within the budget.

USER TARGET BUDGET: ₱${budgetPhp.toLocaleString('en-PH')} PHP
USER PREFERENCES: ${input.preferences?.trim() || "Balanced price-to-performance for general gaming/work."}

AVAILABLE IN-STOCK INVENTORY CANDIDATES (PRICES IN PHP ₱):
${JSON.stringify(compactMenu, null, 1)}

CRITICAL RULES:
1. CURRENCY: All prices are strictly in Philippine Peso (PHP ₱). Total cost MUST be <= ₱${budgetPhp}.
2. SELECTION: Select exactly one part ID for each category: CPU, Motherboard, RAM, Storage, GPU, PSU, Case, Cooler.
3. INTEGRATED GRAPHICS: If budget is tight and the chosen CPU has igpu "Yes", GPU ID can be "${INCLUDED_INTEGRATED_GPU_ID}" (₱0).
4. COMPATIBILITY: CPU socket must match Motherboard. RAM type (DDR4/DDR5) must match Motherboard.
5. REAL IDS ONLY: Only return part IDs explicitly present in the inventory list. Do not invent IDs.
`;

    const BudgetOutputSchema = z.object({
        build: z.object({
            CPU: z.string().nullable().describe("Part ID from inventory for CPU"),
            GPU: z.string().nullable().describe(`Part ID from inventory for GPU, or "${INCLUDED_INTEGRATED_GPU_ID}"`),
            Motherboard: z.string().nullable().describe("Part ID from inventory for Motherboard"),
            RAM: z.string().nullable().describe("Part ID from inventory for RAM"),
            Storage: z.string().nullable().describe("Part ID from inventory for Storage"),
            PSU: z.string().nullable().describe("Part ID from inventory for PSU"),
            Case: z.string().nullable().describe("Part ID from inventory for Case"),
            Cooler: z.string().nullable().describe("Part ID from inventory for Cooler"),
        }),
        reasoning: z.string().describe("Clear explanation in Philippine context justifying the component synergy and budget distribution."),
    });

    try {
        const resolvedModel = await getLanguageModelForChat({ feature: 'buildAdvisor' });
        const result = await generateText({
            model: resolvedModel.model,
            temperature: 0.1,
            maxOutputTokens: 800,
            prompt,
            output: Output.object({ schema: BudgetOutputSchema }),
        });

        const output = result.output;
        if (output && output.build) {
            const validation = validateBuildSelection(output.build, inventoryById, budgetPhp);
            if (validation.valid) {
                return {
                    build: output.build,
                    totalCost: validation.totalCost,
                    reasoning: output.reasoning,
                };
            }
            console.warn("[Smart Budget] AI output had validation issues, applying deterministic solver:", validation.issues);
        }
    } catch (err) {
        console.warn("[Smart Budget] AI generation failed or timed out, invoking deterministic engine fallback:", err);
    }

    // Deterministic fallback ensures user never experiences a broken or failed response
    const fallback = deterministicFallbackSolver(inventory, budgetPhp);
    if (fallback) {
        return fallback;
    }

    throw new Error(`Unable to find a complete compatible build under ₱${budgetPhp.toLocaleString('en-PH')} with current stock. Try increasing your budget.`);
}
