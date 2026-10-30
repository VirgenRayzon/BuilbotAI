import { streamText, Output } from 'ai';
import { createHash } from 'node:crypto';
import { after } from 'next/server';
import { z } from 'zod';
import { getLanguageModelForChat } from '@/lib/ai-model-resolver';
import { AdvisorTiming } from '@/lib/advisor-timing';
import { calculateBottleneck } from '@/lib/bottleneck';
import { checkFullBuildCompatibility } from '@/lib/compatibility';
import { estimateFPS } from '@/lib/fps-estimator';
import { retrieveLocalKnowledge } from '@/lib/knowledge-retriever';
import { getInventoryFromFirestore } from '@/lib/inventory-fetcher';
import { getAdminFirestore } from '@/firebase/server-init';
import { INCLUDED_INTEGRATED_GPU_ID } from '@/lib/integrated-graphics';
import type { Resolution, WorkloadType } from '@/lib/types';
import { aiBuildCritiqueOutputSchema, type AiBuildCritiqueOutput } from '@/ai/schemas/critique-schemas';

export const maxDuration = 180;

const ComponentDataSchema = z.object({
    id: z.string().optional(),
    model: z.string(),
    price: z.number(),
    brand: z.string().optional(),
    description: z.string().optional(),
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
    isIntegratedGraphics: z.boolean().optional(),
});

const AiBuildCritiqueInputSchema = z.object({
    build: z.record(z.string(), z.union([ComponentDataSchema, z.array(ComponentDataSchema), z.null()])),
    intendedUse: z.string().optional(),
    performanceLevel: z.string().optional(),
    additionalNotes: z.string().optional(),
});

export type AiBuildCritiqueInput = z.infer<typeof AiBuildCritiqueInputSchema>;

const CRITIQUE_CACHE_COLLECTION = 'ai_critique_cache_v1';

function generateCritiqueCacheKey(input: AiBuildCritiqueInput, modelSettings: unknown): string {
    const parts = Object.entries(input.build || {}).sort(([a], [b]) => a.localeCompare(b));
    return createHash('sha256').update(JSON.stringify({
        version: 4,
        parts,
        intendedUse: (input.intendedUse || '').trim().toLowerCase(),
        performanceLevel: (input.performanceLevel || '').trim().toLowerCase(),
        additionalNotes: (input.additionalNotes || '').trim().toLowerCase(),
        modelSettings,
    })).digest('hex');
}

function cleanPartName(name: string): string {
    return name
        .replace(/\b(80\s*Plus\s*(Bronze|Gold|Platinum|Silver|Titanium))\b/gi, '')
        .replace(/\b(Gaming Desktop Memory|Desktop Memory|GDDR[567X]*|Twin Edge|OC Edition|M\.2 NVMe|NVMe PCIe|PCIe M\.2)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}

export async function POST(req: Request) {
    const timing = new AdvisorTiming('critique');
    try {
        const rawBody = await req.json();
        const parseResult = AiBuildCritiqueInputSchema.safeParse(rawBody);

        if (!parseResult.success) {
            return new Response(
                JSON.stringify({ error: "Invalid critique input parameters", details: parseResult.error.format() }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const input = parseResult.data;
        const { build, intendedUse, performanceLevel, additionalNotes } = input;
        const db = getAdminFirestore();

        let settingsData: FirebaseFirestore.DocumentData | undefined;
        try {
            const settingsSnap = await db.collection('siteSettings').doc('main').get();
            settingsData = settingsSnap.data();
            if (settingsSnap.exists && (settingsData?.isMaintenanceMode || settingsData?.isAiKillSwitch)) {
                return new Response(
                    JSON.stringify({ error: "MAINTENANCE_MODE_ACTIVE: AI services are temporarily restricted for system updates." }),
                    { status: 503, headers: { 'Content-Type': 'application/json' } }
                );
            }
        } catch (e: any) {
            console.warn("[Critique API] Settings check warning:", e);
        }
        timing.mark('settings');

        // 1. Tier 1 Cache Check
        const critiqueCacheKey = generateCritiqueCacheKey(input, {
            routing: settingsData?.featureModelRouting?.buildAdvisor || settingsData?.aiModelProvider,
            defaultModel: settingsData?.defaultGeminiModel,
            tunedModel: settingsData?.fineTunedModelId,
            inventoryRevision: settingsData?.advisorInventoryRevision,
        });

        if (critiqueCacheKey.length > 5) {
            try {
                const critiqueSnap = await db.collection(CRITIQUE_CACHE_COLLECTION).doc(critiqueCacheKey).get();
                if (critiqueSnap.exists) {
                    const cacheData = critiqueSnap.data();
                    const ageInHours = (Date.now() - (cacheData?.timestamp || 0)) / (1000 * 60 * 60);
                    if (ageInHours < 24 && cacheData?.output) {
                        console.log(`[Critique API] Cache Hit for key: ${critiqueCacheKey}`);
                        timing.mark('cache');
                        timing.finish('cache_hit');
                        const encoder = new TextEncoder();
                        const stream = new ReadableStream({
                            start(controller) {
                                controller.enqueue(encoder.encode(JSON.stringify(cacheData.output)));
                                controller.close();
                            }
                        });
                        return new Response(stream, {
                            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
                        });
                    }
                }
            } catch (e) {
                console.warn("[Critique API] Cache read warning:", e);
            }
        }
        timing.mark('cache');

        // 2. Perform deterministic local analysis
        const bottleneck = calculateBottleneck(build as any);
        const compatibilityIssues = checkFullBuildCompatibility(build as any);

        const normRes: Resolution = (performanceLevel === '4K' || performanceLevel === '1080p' || performanceLevel === '1440p')
            ? performanceLevel
            : '1440p';
        const normWorkload: WorkloadType = (intendedUse === 'Esports' || intendedUse === 'AAA')
            ? intendedUse
            : 'Balanced';

        const fps1080 = estimateFPS(build as any, '1080p', normWorkload);
        const fps1440 = estimateFPS(build as any, '1440p', normWorkload);
        const fps4K = estimateFPS(build as any, '4K', normWorkload);
        timing.mark('deterministic_checks');

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
                const formatPart = (p: any) => {
                    const brandModel = `${p.brand || ''} ${p.model}`.trim();
                    const priceStr = typeof p.price === 'number' ? `₱${p.price.toLocaleString()}` : (p.price ? `₱${p.price}` : '');
                    let text = `${brandModel} (${priceStr})`;
                    if (category === 'GPU' && (p.id === INCLUDED_INTEGRATED_GPU_ID || p.isIntegratedGraphics)) {
                        text += ' — included CPU graphics, shared system memory, no dedicated graphics card';
                    }
                    if (p.description && p.description.trim()) {
                        const maxChars = ['CPU', 'GPU', 'Motherboard'].includes(category) ? 900 : 280;
                        const highlights = p.description.trim().slice(0, maxChars);
                        text += `\n  Product Highlights:\n  ${highlights.split('\n').join('\n  ')}`;
                    }
                    return text;
                };
                if (Array.isArray(partData)) {
                    return `${category}:\n${partData.map(p => ` - ${formatPart(p)}`).join('\n')}`;
                }
                return `${category}: ${formatPart(partData)}`;
            })
            .join('\n\n');

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

        const buildCategories = Object.keys(build);
        const [knowledgeResults, inventoryResults, resolvedModel] = await Promise.all([
            retrieveLocalKnowledge(cleanKnowledgeQuery, 4),
            Promise.all(buildCategories.map(cat => getInventoryFromFirestore(cat, undefined, 5, false))),
            getLanguageModelForChat({ feature: 'buildAdvisor' }),
        ]);
        timing.mark('context_and_model');

        const knowledgeContext = knowledgeResults.join('\n\n');
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

        const prompt = `You are an encouraging and expert PC building mentor. Analyze the PC build provided and give a detailed, balanced critique. 
Since some users are beginners, your tone should be supportive and optimistic. Keep all explanations concise and to the point to prevent verbose output.

PROS (EXPRESSED WITH EXPERTISE):
- Provide 3-4 concise bullet points. Highlight the synergy, longevity, power delivery, VRM quality, and connectivity features of the build using the provided Product Highlights. Keep each pro to 1-2 sentences.

CONS & CONSIDERATIONS (CONSTRUCTIVE & SOFTENED):
- Provide 2-3 concise bullet points. Frame issues as "Optimization Opportunities" (e.g. overspending on certain parts, thermal/clearance considerations, or bandwidth balance). Keep each con to 1-2 sentences.

Current Build (With Official Hardware Product Highlights):
${buildContext}

User Preferences:
- Intended Use: ${intendedUse || "Not specified"}
- Target Performance: ${performanceLevel || "Not specified"}
- Additional Notes: ${additionalNotes || "None"}

${analysisContext}

INSTRUCTIONS:
1. Pros and Cons: Provide 3-4 pros and 2-3 cons. Be concise and direct.
2. Bottleneck Analysis: In 1-2 focused paragraphs, explain the bottleneck balance between CPU and GPU.
   If the GPU is integrated with the CPU, identify it as included graphics with shared system memory. Do not describe it as a dedicated card.
3. FPS Estimates: Provide realistic estimates for 6 different games using the deterministic baseline FPS anchors above.
4. Suggestions: Recommend alternatives from STORE_INVENTORY_MENU that provide better value or perfect the build (up to 3 items).
   If the build is already well-optimized or enthusiast-grade, return an empty suggestions array [].

REQUIRED OUTPUT: A valid JSON object matching the requested schema.`;

        const streamResult = streamText({
            model: resolvedModel.model,
            temperature: 0.2,
            maxOutputTokens: 3000,
            prompt,
            output: Output.object({ schema: aiBuildCritiqueOutputSchema }),
            ...(resolvedModel.modelId.startsWith('gemini-2.5-flash') && !resolvedModel.isFineTuned
                ? { providerOptions: { google: { thinkingConfig: { thinkingBudget: 0 } } } }
                : {}),
        });

        after(async () => {
            try {
                const finalOutput = await streamResult.output;
                if (finalOutput && critiqueCacheKey.length > 5) {
                    await db.collection(CRITIQUE_CACHE_COLLECTION).doc(critiqueCacheKey).set({
                        input,
                        output: finalOutput,
                        timestamp: Date.now(),
                    });
                    console.log(`[Critique API] Saved new streaming entry for: ${critiqueCacheKey}`);
                }
            } catch (err) {
                console.warn("[Critique API] Async cache write error:", err);
            }
        });

        timing.mark('streaming_started');
        return streamResult.toTextStreamResponse({
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });

    } catch (error: any) {
        timing.finish('error');
        console.error("[Critique API] Error generating streaming critique:", error);
        return new Response(
            JSON.stringify({ error: error.message || "Failed to process AI build critique stream." }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
