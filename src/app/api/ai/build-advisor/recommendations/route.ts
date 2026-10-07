import { streamObject } from 'ai';
import { getLanguageModelForChat } from '@/lib/ai-model-resolver';
import { getActiveSystemPrompt } from '@/lib/system-prompts';
import { DEFAULT_BUILD_ADVISOR_PROMPT } from '@/lib/constants/default-system-prompts';
import { retrieveLocalKnowledge } from '@/lib/knowledge-retriever';
import { getInventoryFromFirestore } from '@/lib/inventory-fetcher';
import { getAdminFirestore } from '@/firebase/server-init';
import {
  AiBuildAdvisorRecommendationsInputSchema,
  AiBuildAdvisorRecommendationsOutputSchema,
  type AiBuildAdvisorRecommendationsInput,
} from '@/ai/schemas/build-advisor-schemas';

export const maxDuration = 120;

const CACHE_COLLECTION = 'ai_recommendation_cache_v3';

const generateCacheKey = (input: AiBuildAdvisorRecommendationsInput, promptSig: string = '') => {
  const parts = [
    input.intendedUse.toLowerCase().trim(),
    input.budget.toLowerCase().trim().replace(/[^\d]/g, ''),
    (input.performanceLevel || '').toLowerCase().trim(),
    (input.additionalNotes || '').toLowerCase().trim(),
    input.allowFlexibleBudget ? 'flexible' : 'strict',
    input.allowAiSearch ? 'aisearch' : 'local',
    promptSig ? promptSig.substring(0, 32) : 'default'
  ];
  return parts.join('|').replace(/[\/.]/g, '_').substring(0, 1000);
};

export async function POST(req: Request) {
  try {
    const rawBody = await req.json();
    const parseResult = AiBuildAdvisorRecommendationsInputSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input parameters", details: parseResult.error.format() }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const input = parseResult.data;
    const db = getAdminFirestore();

    // 0. Check Maintenance Mode (Kill Switch)
    try {
      const settingsSnap = await db.collection('siteSettings').doc('main').get();
      if (settingsSnap.exists && settingsSnap.data()?.isMaintenanceMode) {
        return new Response(
          JSON.stringify({ error: "MAINTENANCE_MODE_ACTIVE: AI services are temporarily restricted for system updates." }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } catch (e: any) {
      console.warn("[Build Advisor API] Maintenance check warning:", e);
    }

    // Resolve dynamic system prompt
    const customSystemPrompt = await getActiveSystemPrompt('buildAdvisor');
    const cacheKey = generateCacheKey(input, customSystemPrompt);

    // 1. Try to fetch from cache
    try {
      const cacheRef = db.collection(CACHE_COLLECTION).doc(cacheKey);
      const cacheSnap = await cacheRef.get();

      if (cacheSnap.exists) {
        const cacheData = cacheSnap.data();
        const ageInDays = (Date.now() - (cacheData?.timestamp || 0)) / (1000 * 60 * 60 * 24);
        if (ageInDays < 7 && cacheData?.output) {
          console.log(`[Build Advisor API] Cache Hit for key: ${cacheKey}`);
          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            start(controller) {
              controller.enqueue(encoder.encode(JSON.stringify(cacheData.output)));
              controller.close();
            }
          });
          return new Response(stream, {
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'x-cache': 'HIT'
            }
          });
        }
      }
    } catch (e) {
      console.warn("[Build Advisor API] Cache read error:", e);
    }

    console.log(`[Build Advisor API] Cache Miss for key: ${cacheKey}. Generating fresh stream (AI Search: ${!!input.allowAiSearch})...`);

    // 2. Fast Context Gathering using Internal/Local Knowledge and Store Inventory
    const query = `${input.intendedUse} ${input.performanceLevel} ${input.additionalNotes || ''}`;
    const categoriesToFetch = ['cpu', 'gpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cooler'];

    // Parallelize local tier lists + Firestore store inventory (top 5 representative parts per category for fast synthesis)
    const [knowledgeResults, inventoryResults] = await Promise.all([
      retrieveLocalKnowledge(query, 3),
      Promise.all(categoriesToFetch.map(cat => getInventoryFromFirestore(cat, undefined, 5)))
    ]);

    const knowledgeContext = knowledgeResults.join('\n\n');
    const storeInventory = inventoryResults.flat().join('\n');

    // 3. Resolve Language Model for Vercel AI SDK
    const resolved = await getLanguageModelForChat({ feature: 'buildAdvisor' });
    console.log(`[Build Advisor API] Using language model: ${resolved.modelId} (isFineTuned: ${resolved.isFineTuned}, isFallback: ${resolved.isFallback})`);

    // 4. Construct Prompt
    const promptText = `
You are an expert PC building advisor specializing in the Philippine market. Your goal is to recommend a set of compatible core components (CPU, GPU, Motherboard, RAM, Storage, PSU, Case, Cooler) for a user based on their specific needs.

Provide a brief summary of the overall build strategy in the context of the Philippine market, and provide recommendations for each component with its model name, estimated PHP price, and estimated total wattage for the build.

DESCRIPTION RULES (MAXIMUM STREAMING SPEED):
- CPU, GPU, and Motherboard: Provide a concise justification explaining their performance synergy and value in PHP.
- RAM, Storage, PSU, Case, and Cooler: Set description to an empty string "" (or a brief 2-word tag); our client system automatically populates dynamic specifications for these components. Do not spend tokens writing long descriptions for these supporting parts.

${knowledgeContext ? `EXPERT KNOWLEDGE BASE CONTEXT (Hardware Tier Lists & Compatibility Rules):\n${knowledgeContext}\n\nBase your recommendations strictly on the expert knowledge provided above if it relates to the user's request (e.g., use the provided tier lists, avoid known bottlenecks).\n` : ''}

${storeInventory ? `STORE_INVENTORY_MENU (IN-STOCK STORE PARTS):\n${storeInventory}\n` : ''}

CRITICAL RULES:
1. CURRENCY: All price discussions and budget considerations MUST be in Philippine Peso (PHP). Use the ₱ symbol.
2. LOCAL PRICING: Provide estimated prices that reflect the current PC component market in the Philippines (e.g., shops like Dynaquest, PCHub, Gilmore prices).
${input.allowAiSearch
  ? `3. HARDWARE MARKET SELECTION (AI SEARCH ENABLED - STORE-FIRST HYBRID):
   - You have access to both our STORE_INVENTORY_MENU and your comprehensive Philippine PC hardware knowledge and tier lists.
   - STORE-FIRST PRIORITY: Prioritize selecting components from our STORE_INVENTORY_MENU whenever an in-stock part offers competitive value, compatibility, and fits comfortably within the user's budget.
   - EXTERNAL MARKET SELECTION: If our store inventory lacks a suitable, compatible part for a given component, or if an external Philippine market part offers significantly superior value/performance for this budget, you are encouraged to recommend that external market component. Use realistic Philippine retail market prices (₱) (e.g., Dynaquest, PCHub, Gilmore).`
  : `3. INVENTORY AVAILABILITY (STRICT STORE INVENTORY ONLY - STRICT REJECTION RULE):
   - You MUST ONLY recommend components that are explicitly listed in the STORE_INVENTORY_MENU above.
   - DO NOT recommend any parts outside the menu. DO NOT hallucinate inventory items. Ensure model names match exactly.
   - STRICT REJECTION: If our available store inventory lacks the necessary components to build a complete, 100% compatible PC within the user's budget, DO NOT make up fake stock or recommend incompatible parts. Instead, in your summary, state clearly and transparently: "Our current in-stock store inventory cannot fulfill a complete, compatible build for this budget (₱${input.budget}). Please enable 'AI Search' to allow recommendations from the broader Philippine market, or consider adjusting your budget." Still provide whatever best partial/nearest configuration you can from the actual inventory, but clearly emphasize the notice in the summary.`
}
4. COMPATIBILITY: Ensure all recommended components are 100% compatible.
5. BUDGET ADHERENCE: 
${input.allowFlexibleBudget
  ? `- The user has enabled "Flexible Budget". You are ALLOWED to exceed the budget by up to 30% if it results in a massive performance jump (e.g., stepping up to a much better GPU).`
  : `- Strictly follow the PHP budget provided by the user. DO NOT exceed it.`
}

User's PC building goals:
Intended Use: ${input.intendedUse}
Budget: ${input.budget} (PHP)
Desired Performance Level: ${input.performanceLevel}
${input.allowFlexibleBudget ? 'BUDGET MODE: FLEXIBLE (Max 30% Overstep Allowed)' : 'BUDGET MODE: STRICT (DO NOT EXCEED)'}
${input.additionalNotes ? `Additional Notes: ${input.additionalNotes}` : ''}

Please generate the recommendations strictly matching the schema with realistic PHP price numbers.
`;

    const systemInstruction = customSystemPrompt || DEFAULT_BUILD_ADVISOR_PROMPT;

    // 5. Stream structured object
    const result = streamObject({
      model: resolved.model,
      schema: AiBuildAdvisorRecommendationsOutputSchema,
      system: systemInstruction,
      prompt: promptText,
      onFinish: async ({ object }) => {
        if (object) {
          try {
            await db.collection(CACHE_COLLECTION).doc(cacheKey).set({
              input,
              output: object,
              timestamp: Date.now(),
            });
            console.log(`[Build Advisor API] Stream finished. Cached new result for: ${cacheKey}`);
          } catch (err) {
            console.warn(`[Build Advisor API] Failed to cache finished object:`, err);
          }
        }
      },
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error("[Build Advisor API] Error generating recommendations stream:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to process AI recommendations stream." }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
