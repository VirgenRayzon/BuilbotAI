'use server';

import { ai } from "@/ai/genkit";
import { z } from "genkit";

import { calculateBottleneck } from "@/lib/bottleneck";
import { checkFullBuildCompatibility } from "@/lib/compatibility";
import { retrieveLocalKnowledge } from "@/lib/knowledge-retriever";
import { getInventoryFromFirestore } from "@/lib/inventory-fetcher";
import { getAdminFirestore } from "@/firebase/server-init";

const ComponentDataSchema = z.object({
    model: z.string(),
    price: z.number(),
    brand: z.string().optional(),
    category: z.string().optional(),
    wattage: z.number().optional(),
    performanceScore: z.number().optional(),
    performanceTier: z.number().optional(),
    socket: z.string().optional(),
    ramType: z.string().optional(),
    dimensions: z.object({
        width: z.number(),
        height: z.number(),
        depth: z.number(),
    }).optional(),
    specifications: z.record(z.string(), z.any()).optional(),
});

const AiBuildCritiqueInputSchema = z.object({
    build: z.record(
        z.string(),
        z.union([ComponentDataSchema, z.array(ComponentDataSchema), z.null()])
    ),
    intendedUse: z.string().optional(),
    performanceLevel: z.string().optional(),
    additionalNotes: z.string().optional(),
});

export type AiBuildCritiqueInput = z.infer<typeof AiBuildCritiqueInputSchema>;

const SuggestionSchema = z.object({
    originalComponent: z.string(),
    suggestedComponent: z.string(),
    suggestedPartId: z.string().optional().describe("The exact ID from the [ID: ...] section in the menu"),
    reason: z.string(),
});

/**
 * Unified Output Schema for the AI Critique.
 */
const aiBuildCritiqueOutputSchema = z.object({
    pros: z.array(z.string()),
    cons: z.array(z.string()),
    bottleneck: z.object({
        analysis: z.string(),
    }),
    fpsEstimates: z.array(z.object({
        game: z.string(),
        fps: z.string(),
        settings: z.string()
    })),
    suggestions: z.array(SuggestionSchema)
});

import { estimateFPS } from "@/lib/fps-estimator";
import { Resolution, WorkloadType } from "@/lib/types";

const CRITIQUE_CACHE_COLLECTION = 'ai_critique_cache_v1';
const BENCHMARK_RESEARCH_CACHE_COLLECTION = 'ai_benchmark_research_cache_v1';

/**
 * Generate a cache key for the entire critique output.
 */
function generateCritiqueCacheKey(input: AiBuildCritiqueInput): string {
    const partModels: string[] = [];
    Object.values(input.build || {}).forEach(val => {
        if (Array.isArray(val)) {
            val.forEach(p => p && partModels.push((p.model || '').trim().toLowerCase()));
        } else if (val) {
            partModels.push(((val as any).model || '').trim().toLowerCase());
        }
    });
    const sortedParts = Array.from(new Set(partModels)).sort().join('|');
    const intent = (input.intendedUse || 'default').toLowerCase().trim();
    const perf = (input.performanceLevel || 'default').toLowerCase().trim();
    const notes = (input.additionalNotes || '').toLowerCase().trim();
    return `${sortedParts}__${intent}__${perf}__${notes}`.replace(/[\/.]/g, '_').substring(0, 800);
}

/**
 * Generate a cache key for the CPU+GPU benchmark web research context.
 */
function generateBenchmarkCacheKey(build: any, intendedUse?: string): string {
    const cpu = (build['CPU'] as any)?.model || '';
    const gpu = (build['GPU'] as any)?.model || '';
    const intent = (intendedUse || 'balanced').toLowerCase().trim();
    return `${cpu}_${gpu}_${intent}`.toLowerCase().replace(/[^a-z0-9_]/gi, '_').substring(0, 300);
}

/**
 * Clean redundant marketing boilerplate for focused knowledge retrieval.
 */
function cleanPartName(name: string): string {
    return name
        .replace(/\b(80\s*Plus\s*(Bronze|Gold|Platinum|Silver|Titanium))\b/gi, '')
        .replace(/\b(Gaming Desktop Memory|Desktop Memory|GDDR[567X]*|Twin Edge|OC Edition|M\.2 NVMe|NVMe PCIe|PCIe M\.2)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}

export const aiBuildCritique = ai.defineFlow(
    {
        name: "aiBuildCritique",
        inputSchema: AiBuildCritiqueInputSchema,
        outputSchema: aiBuildCritiqueOutputSchema,
    },
    async (input) => {
        const result = await aiBuildCritiqueAction(input);
        return result;
    }
);

export async function aiBuildCritiqueAction(input: AiBuildCritiqueInput) {
    if (!process.env.GOOGLE_API_KEY) {
        throw new Error("Missing GOOGLE_API_KEY for Build Critique.");
    }

    const { build, intendedUse, performanceLevel, additionalNotes } = input;
    const db = getAdminFirestore();

    // 0. Check Maintenance Mode (Kill Switch)
    try {
        const settingsSnap = await db.collection('siteSettings').doc('main').get();
        if (settingsSnap.exists && settingsSnap.data()?.isMaintenanceMode) {
            throw new Error("MAINTENANCE_MODE_ACTIVE: AI services are temporarily restricted for system updates.");
        }
    } catch (e: any) {
        if (e.message.includes("MAINTENANCE_MODE_ACTIVE")) throw e;
        console.warn("Failed to check maintenance mode:", e);
    }

    // 1. Tier 1 Cache Check: Full Critique Cache
    const critiqueCacheKey = generateCritiqueCacheKey(input);
    if (critiqueCacheKey.length > 5) {
        try {
            const critiqueSnap = await db.collection(CRITIQUE_CACHE_COLLECTION).doc(critiqueCacheKey).get();
            if (critiqueSnap.exists) {
                const cacheData = critiqueSnap.data();
                const ageInDays = (Date.now() - (cacheData?.timestamp || 0)) / (1000 * 60 * 60 * 24);
                if (ageInDays < 7 && cacheData?.output) {
                    console.log(`[AI Critique Cache] Hit for key: ${critiqueCacheKey}`);
                    return cacheData.output;
                }
            }
        } catch (e) {
            console.warn("[AI Critique Cache] Read error:", e);
        }
    }

    // 2. Perform deterministic local analysis
    const bottleneck = calculateBottleneck(build as any);
    const compatibilityIssues = checkFullBuildCompatibility(build as any);

    // Deterministic FPS Baseline Calculation (Anchors for AI)
    const normRes: Resolution = (performanceLevel === '4K' || performanceLevel === '1080p' || performanceLevel === '1440p')
        ? performanceLevel
        : '1440p';
    const normWorkload: WorkloadType = (intendedUse === 'Esports' || intendedUse === 'AAA')
        ? intendedUse
        : 'Balanced';

    const fps1080 = estimateFPS(build as any, '1080p', normWorkload);
    const fps1440 = estimateFPS(build as any, '1440p', normWorkload);
    const fps4K = estimateFPS(build as any, '4K', normWorkload);

    const deterministicFpsContext = fps1440 ? `
DETERMINISTIC FPS BASELINES (Computed from hardware specifications & bottleneck multipliers):
- 1080p: ~${fps1080?.averageFps ?? 'N/A'} FPS avg (1% Low: ~${fps1080?.lowsFps ?? 'N/A'}, Peak: ~${fps1080?.peakFps ?? 'N/A'})
- 1440p: ~${fps1440?.averageFps ?? 'N/A'} FPS avg (1% Low: ~${fps1440?.lowsFps ?? 'N/A'}, Peak: ~${fps1440?.peakFps ?? 'N/A'})
- 4K: ~${fps4K?.averageFps ?? 'N/A'} FPS avg (1% Low: ~${fps4K?.lowsFps ?? 'N/A'}, Peak: ~${fps4K?.peakFps ?? 'N/A'})
CRITICAL: Use these deterministic baseline numbers as reference anchors for your 6 game FPS estimates.
` : '';

    const buildContext = Object.entries(build)
        .map(([category, partData]) => {
            if (!partData) return `${category}: None selected`;
            if (Array.isArray(partData)) {
                return `${category}: ${partData.map((p: any) => `${p.brand || ''} ${p.model} ($${p.price})`).join(', ')}`;
            }
            const singlePart = partData as any;
            return `${category}: ${singlePart.brand || ''} ${singlePart.model} ($${singlePart.price})`;
        })
        .join('\n');

    // 3. Deduplicated & Cleaned Local Knowledge Retrieval (Top 4 ranked sections)
    const uniqueCleanModels = Array.from(
        new Set(
            Object.values(build)
                .flat()
                .filter(Boolean)
                .map((p: any) => cleanPartName(p.model || ''))
                .filter((m: string) => m.length > 2)
        )
    );
    const cleanKnowledgeQuery = `bottleneck compatibility ${uniqueCleanModels.join(' ')}`;
    const knowledgeResults = await retrieveLocalKnowledge(cleanKnowledgeQuery, 4);
    const knowledgeContext = knowledgeResults.join('\n\n');

    // 4. Fetch store inventory exclusively from Live Firestore
    const buildCategories = Object.keys(build);
    const inventoryResults = await Promise.all(
        buildCategories.map(cat => getInventoryFromFirestore(cat, undefined, 5))
    );
    const storeInventory = inventoryResults.flat().join('\n');

    const analysisContext = `
DETERMINISTIC ANALYSIS RESULTS:
- Bottleneck Status: ${bottleneck.status}
- Bottleneck Message: ${bottleneck.message}
- Compatibility Issues: ${compatibilityIssues.length > 0 ? compatibilityIssues.map(i => `[${i.severity.toUpperCase()}] ${i.message}`).join('; ') : 'None detected'}

${deterministicFpsContext}

${knowledgeContext ? `EXPERT LOCAL KNOWLEDGE BASE (TOP RELEVANT SECTIONS):\n${knowledgeContext}` : ''}

STORE_INVENTORY_MENU (MANDATORY SOURCE FOR SUGGESTIONS):
The following parts are EXACTLY what is available in our store. 
Use the text inside the quotes for 'Name' as your suggestedComponent and the text after 'ID:' as your suggestedPartId.
${storeInventory || "No local inventory data found."}
`;

    const prompt = `
You are an encouraging and expert PC building mentor. Analyze the PC build provided and give a detailed, balanced critique. 
Since some users are beginners, your tone should be supportive and optimistic.

PROS (EXPRESSED WITH EXPERTISE):
- Highlight the synergy and longevity of the build.

CONS & CONSIDERATIONS (CONSTRUCTIVE & SOFTENED):
- Frame issues as "Optimization Opportunities."

Current Build:
${buildContext}

User Preferences:
- Intended Use: ${intendedUse || "Not specified"}
- Target Performance: ${performanceLevel || "Not specified"}
- Additional Notes: ${additionalNotes || "None"}

${analysisContext}

1. Pros and Cons: Provide a detailed list.
2. Bottleneck Analysis: Explain the bottleneck balance.
3. FPS Estimates: Provide estimates for 6 different games. 
   DIVERSITY RULE: DO NOT always pick the same games (e.g., avoid always using Cyberpunk 2077, COD, or Forza). 
   Select games that are RELEVANT to the user's Intended Use (e.g., if 'E-sports', pick Valorant or CS2; if 'Content Creation', pick relevant benchmarks; if 'General', pick a varied mix). 
   Try to include at least one recent blockbuster and one popular multiplayer title.
4. Suggestions: Recommend alternatives that provide better value or perfect the build.
   MANDATORY RULE FOR SUGGESTIONS: 
   - You MUST ONLY suggest parts that are listed in the STORE_INVENTORY_MENU provided above. 
   - OPTIMIZATION RULE: If a component is already top-of-the-line (e.g., flagship CPUs/GPUs) or perfectly balanced for the build's budget/purpose, DO NOT provide a suggestion for that category. 
   - EMPTY SUGGESTIONS: If the entire build is already well-optimized or enthusiasts-grade with no meaningful upgrades available in the menu, return an EMPTY suggestions array []. Do not suggest lateral moves (e.g., suggesting a different brand of the same spec) unless there is a clear price or compatibility advantage.
   
   For the 'suggestedComponent' field, you MUST use the EXACT string provided in the 'Name' field. 
   For the 'suggestedPartId' field, you MUST provide the exact string found after 'ID: '.

If the build is completely empty, kindly invite the user to start picking out parts.`;

    try {
        // Step 1: Benchmark Web Research with Tier 2 Cache Check
        let webResearchContext = '';
        const benchmarkCacheKey = generateBenchmarkCacheKey(build, intendedUse);
        let isBenchmarkCached = false;

        if (benchmarkCacheKey && benchmarkCacheKey.length > 5) {
            try {
                const benchSnap = await db.collection(BENCHMARK_RESEARCH_CACHE_COLLECTION).doc(benchmarkCacheKey).get();
                if (benchSnap.exists) {
                    const benchData = benchSnap.data();
                    const ageInDays = (Date.now() - (benchData?.timestamp || 0)) / (1000 * 60 * 60 * 24);
                    if (ageInDays < 14 && benchData?.webResearchContext) {
                        console.log(`[AI Benchmark Cache] Hit for: ${benchmarkCacheKey}. Skipping Step 1 web search!`);
                        webResearchContext = benchData.webResearchContext;
                        isBenchmarkCached = true;
                    }
                }
            } catch (e) {
                console.warn("[AI Benchmark Cache] Read error:", e);
            }
        }

        if (!isBenchmarkCached) {
            console.log("[AI Build Critique] Step 1: Running web search pre-research for benchmarks...");
            const researchResponse = await ai.generate({
                model: 'googleai/gemini-2.5-flash',
                prompt: `You are a PC hardware benchmark researcher. Research the following PC build and provide benchmark data, FPS estimates, and component analysis:

Current Build:
${buildContext}

User Preferences:
- Intended Use: ${intendedUse || "Not specified"}
- Target Performance: ${performanceLevel || "Not specified"}
- Additional Notes: ${additionalNotes || "None"}

Search for:
1. Real-world benchmark FPS data for this GPU+CPU combo in 6 popular games (choose games relevant to the user's intended use).
2. Known bottleneck issues between these components.
3. Current market alternatives that offer better value.
4. Any compatibility concerns.

Provide detailed findings with specific numbers.`,
                config: {
                    temperature: 0.3,
                    googleSearchRetrieval: {},
                },
            });
            webResearchContext = researchResponse.text;
            console.log("[AI Build Critique] Step 1 complete. Research context obtained.");

            // Save to benchmark cache
            if (benchmarkCacheKey && benchmarkCacheKey.length > 5) {
                try {
                    await db.collection(BENCHMARK_RESEARCH_CACHE_COLLECTION).doc(benchmarkCacheKey).set({
                        benchmarkCacheKey,
                        webResearchContext,
                        timestamp: Date.now(),
                    });
                    console.log(`[AI Benchmark Cache] Saved benchmark context for: ${benchmarkCacheKey}`);
                } catch (e) {
                    console.warn("[AI Benchmark Cache] Write error:", e);
                }
            }
        }

        // Step 2: Structured output prompt WITHOUT googleSearchRetrieval
        console.log("[AI Build Critique] Step 2: Generating structured critique...");
        const consolidatedPrompt = `${prompt}
        
WEB SEARCH RESEARCH CONTEXT (Use this data for accurate FPS estimates and component analysis):
${webResearchContext}

RESEARCH & ANALYSIS INSTRUCTIONS:
- Use the web research context above for accurate benchmarks and FPS data.
- Analyze the build for pros, cons, bottleneck balance, and FPS estimates as described above.
- Format your final findings strictly into the requested JSON schema.

REQUIRED OUTPUT SCHEMA:
- pros: string[]
- cons: string[]
- bottleneck: { analysis: string } (IMPORTANT: Preserve and format using full Markdown. Use **bolding**, \`code\`, and - bullet points for readability.)
- fpsEstimates: { game: string, fps: string (numeric only, e.g. "95-110"), settings: string (e.g. "1440p Ultra") }[]
- suggestions: { originalComponent: string, suggestedComponent: string, suggestedPartId: string, reason: string }[]

Output strictly the JSON object.`;

        const response = await ai.generate({
            model: 'googleai/gemini-2.5-flash',
            prompt: consolidatedPrompt,
            output: {
                schema: aiBuildCritiqueOutputSchema,
            },
            config: {
                temperature: 0.2,
            },
        });

        if (!response.output) {
            throw new Error("AI returned empty output during build critique.");
        }

        // Save to full critique cache (Tier 1)
        if (critiqueCacheKey.length > 5) {
            try {
                await db.collection(CRITIQUE_CACHE_COLLECTION).doc(critiqueCacheKey).set({
                    input,
                    output: response.output,
                    timestamp: Date.now(),
                });
                console.log(`[AI Critique Cache] Saved new entry for: ${critiqueCacheKey}`);
            } catch (e) {
                console.warn("[AI Critique Cache] Write error:", e);
            }
        }

        return response.output;

    } catch (error: any) {
        console.error("AI Build Critique failed:", error);
        throw error;
    }
}

