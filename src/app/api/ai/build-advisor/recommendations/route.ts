import { streamObject } from 'ai';
import { createHash } from 'node:crypto';
import { after } from 'next/server';
import { getLanguageModelForChat } from '@/lib/ai-model-resolver';
import { DEFAULT_BUILD_ADVISOR_PROMPT } from '@/lib/constants/default-system-prompts';
import { AdvisorTiming } from '@/lib/advisor-timing';
import { retrieveLocalKnowledge } from '@/lib/knowledge-retriever';
import { getAdvisorInventoryMenu } from '@/lib/advisor-inventory';
import { parsePesoBudget } from '@/lib/parse-peso-budget';
import { checkFullBuildCompatibility } from '@/lib/compatibility';
import { getAdminFirestore } from '@/firebase/server-init';
import {
  AiBuildAdvisorRecommendationsInputSchema,
  AiBuildAdvisorRecommendationsOutputSchema,
  type AiBuildAdvisorRecommendationsInput,
} from '@/ai/schemas/build-advisor-schemas';

export const maxDuration = 120;

const CACHE_COLLECTION = 'ai_recommendation_cache_v3';

const generateCacheKey = (input: AiBuildAdvisorRecommendationsInput, prompt: string, modelSettings: unknown) =>
  createHash('sha256').update(JSON.stringify({
    version: 9,
    intendedUse: input.intendedUse.trim().toLowerCase(),
    budget: input.budget.trim().toLowerCase(),
    performanceLevel: input.performanceLevel.trim().toLowerCase(),
    additionalNotes: (input.additionalNotes || '').trim().toLowerCase(),
    allowFlexibleBudget: !!input.allowFlexibleBudget,
    allowAiSearch: !!input.allowAiSearch,
    prompt,
    modelSettings,
  })).digest('hex');

export async function POST(req: Request) {
  const timing = new AdvisorTiming('recommendation');
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
    const budget = parsePesoBudget(input.budget);
    if (!budget) {
      return Response.json({ error: 'Enter a valid budget in PHP.' }, { status: 400 });
    }
    const budgetLimit = budget * (input.allowFlexibleBudget ? 1.3 : 1);
    const db = getAdminFirestore();
    let settingsData: FirebaseFirestore.DocumentData | undefined;

    // 0. Check Maintenance Mode (Kill Switch)
    try {
      const settingsSnap = await db.collection('siteSettings').doc('main').get();
      settingsData = settingsSnap.data();
      if (settingsSnap.exists && settingsData?.isMaintenanceMode) {
        return new Response(
          JSON.stringify({ error: "MAINTENANCE_MODE_ACTIVE: AI services are temporarily restricted for system updates." }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } catch (e: any) {
      console.warn("[Build Advisor API] Maintenance check warning:", e);
    }
    timing.mark('settings');

    // The same settings snapshot supplies the maintenance flag and active prompt.
    const storedPrompt = settingsData?.systemPrompts?.buildAdvisor;
    const customSystemPrompt = typeof storedPrompt === 'string' && storedPrompt.trim()
      ? storedPrompt.trim()
      : DEFAULT_BUILD_ADVISOR_PROMPT;
    const cacheKey = generateCacheKey(input, customSystemPrompt, {
      routing: settingsData?.featureModelRouting?.buildAdvisor || settingsData?.aiModelProvider,
      defaultModel: settingsData?.defaultGeminiModel,
      tunedModel: settingsData?.fineTunedModelId,
      inventoryRevision: settingsData?.advisorInventoryRevision,
    });

    // 1. Try to fetch from cache
    try {
      const cacheRef = db.collection(CACHE_COLLECTION).doc(cacheKey);
      const cacheSnap = await cacheRef.get();

      if (cacheSnap.exists) {
        const cacheData = cacheSnap.data();
        const ageMs = Date.now() - (cacheData?.timestamp || 0);
        const maxAgeMs = input.allowAiSearch ? 60 * 60 * 1000 : 5 * 60 * 1000;
        if (ageMs < maxAgeMs && cacheData?.output) {
          console.log(`[Build Advisor API] Cache Hit for key: ${cacheKey}`);
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
    timing.mark('cache');

    console.log(`[Build Advisor API] Cache Miss for key: ${cacheKey}. Generating fresh stream (AI Search: ${!!input.allowAiSearch})...`);

    // 2. Fast Context Gathering using Internal/Local Knowledge and Store Inventory
    const query = `${input.intendedUse} ${input.performanceLevel} ${input.additionalNotes || ''}`;
    // Candidate selection, local knowledge, and model routing run together.
    const [knowledgeResults, inventory, resolved] = await Promise.all([
      retrieveLocalKnowledge(query, 3),
      getAdvisorInventoryMenu(budgetLimit),
      getLanguageModelForChat({ feature: 'buildAdvisor' }),
    ]);
    timing.mark('context_and_model');
    if (!input.allowAiSearch && (inventory.missingCategories.length > 0 || inventory.minimumTotal > budgetLimit)) {
      timing.finish('error', { reason: 'inventory_below_budget' });
      return Response.json({
        error: `Current in-stock inventory cannot complete a build within ₱${budget.toLocaleString()}. Enable AI Search or increase the budget.`,
      }, { status: 422 });
    }

    const knowledgeContext = knowledgeResults.join('\n\n');
    const storeInventory = inventory.menu;
    const selectedById = new Map(inventory.selected.map(part => [part.id, part]));
    const categories = ['cpu', 'gpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cooler'] as const;
    const isValidOutput = (output: any) => {
      if (!output) return false;
      let total = 0;
      const chosenBuild: Record<string, any> = {};
      for (const category of categories) {
        const component = output[category];
        if (!component?.model || !Number.isFinite(component.estimatedPrice)) return false;
        const storePart = component.partId ? selectedById.get(component.partId) : undefined;
        if (!input.allowAiSearch && (!storePart || storePart.category !== category)) return false;
        if (storePart && storePart.category === category) {
          const buildKey = category === 'cpu' ? 'CPU' : category === 'gpu' ? 'GPU' : category === 'psu'
            ? 'PSU' : category[0].toUpperCase() + category.slice(1);
          chosenBuild[buildKey] = category === 'ram' || category === 'storage' ? [storePart] : storePart;
        }
        total += storePart && storePart.category === category ? storePart.price : component.estimatedPrice;
      }
      return total <= budgetLimit + 1 &&
        (input.allowAiSearch || checkFullBuildCompatibility(chosenBuild).every(issue => issue.severity !== 'critical'));
    };

    // 3. Model resolution ran alongside knowledge and inventory retrieval.
    console.log(`[Build Advisor API] Using language model: ${resolved.modelId} (isFineTuned: ${resolved.isFineTuned}, isFallback: ${resolved.isFallback})`);

    // 4. Construct Prompt
    const promptText = `
You are an expert PC building advisor specializing in the Philippine market. Your goal is to recommend a set of compatible core components (CPU, GPU, Motherboard, RAM, Storage, PSU, Case, Cooler) for a user based on their specific needs.

Provide a brief summary of the overall build strategy in the context of the Philippine market, and provide recommendations for each component with its model name, estimated PHP price, and estimated total wattage for the build.

DESCRIPTION RULES (MAXIMUM STREAMING SPEED):
- CPU, GPU, and Motherboard: Provide a concise justification explaining their performance synergy and value in PHP.
- RAM, Storage, PSU, Case, and Cooler: Set description to an empty string "". The client fills these descriptions from catalog details or local text. Do not spend tokens writing descriptions for these supporting parts.

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
   - Every component MUST have a non-empty partId copied from its [ID: ...] entry. Copy its exact listed price.
   - STRICT REJECTION: If our available store inventory lacks the necessary components to build a complete, 100% compatible PC within the user's budget, DO NOT make up fake stock or recommend incompatible parts. Instead, in your summary, state clearly and transparently: "Our current in-stock store inventory cannot fulfill a complete, compatible build for this budget (₱${input.budget}). Please enable 'AI Search' to allow recommendations from the broader Philippine market, or consider adjusting your budget." Still provide whatever best partial/nearest configuration you can from the actual inventory, but clearly emphasize the notice in the summary.`
}
4. COMPATIBILITY: Ensure all recommended components are 100% compatible.
   For each part chosen from STORE_INVENTORY_MENU, copy its exact ID to partId and its exact listed price to estimatedPrice.
   Before finalizing, add all eight estimatedPrice values and stay within the selected budget limit.
5. BUDGET ADHERENCE: 
${input.allowFlexibleBudget
  ? `- The user has enabled "Flexible Budget". You are ALLOWED to exceed the budget by up to 30% if it results in a massive performance jump (e.g., stepping up to a much better GPU).`
  : `- Strictly follow the PHP budget provided by the user. DO NOT exceed it.`
}

User's PC building goals:
Intended Use: ${input.intendedUse}
Budget: ${input.budget} (PHP)
Desired Performance Level: ${input.performanceLevel}
Use this specific goal to decide how much of the budget goes to CPU, GPU, RAM, and storage. Explain the main tradeoff in the build summary; do not give the same generic parts recommendation for different goals when a better fit is available.
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
      ...(resolved.modelId.startsWith('gemini-2.5-flash') && !resolved.isFineTuned
        ? { providerOptions: { google: { thinkingConfig: { thinkingBudget: 0 } } } }
        : {}),
      onFinish: ({ object, usage, error }) => {
        const valid = isValidOutput(object);
        if (object && !valid) console.warn('[Build Advisor API] Generated build failed inventory or budget validation; result will not be cached.');
        timing.mark('stream_complete');
        timing.finish(valid ? 'generated' : 'error', {
          model: resolved.modelId,
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          streamError: !!error,
        });
      },
    });

    after(async () => {
      try {
        const output = await result.object;
        if (!isValidOutput(output)) return;
        await db.collection(CACHE_COLLECTION).doc(cacheKey).set({
          input,
          output,
          timestamp: Date.now(),
        });
        console.log(`[Build Advisor API] Cached finished result for: ${cacheKey}`);
      } catch (err) {
        console.warn('[Build Advisor API] Failed to cache finished object:', err);
      }
    });

    timing.mark('stream_started');
    return result.toTextStreamResponse();
  } catch (error: any) {
    timing.finish('error');
    console.error("[Build Advisor API] Error generating recommendations stream:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to process AI recommendations stream." }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
