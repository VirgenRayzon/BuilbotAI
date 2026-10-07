'use server';
/**
 * @fileOverview This file defines a Genkit flow for the AI Build Advisor chatbot,
 * providing initial recommendations for core PC components based on user goals.
 *
 * - aiBuildAdvisorRecommendations - A function that handles the AI-powered component recommendation process.
 * - AiBuildAdvisorRecommendationsInput - The input type for the aiBuildAdvisorRecommendations function.
 * - AiBuildAdvisorRecommendationsOutput - The return type for the aiBuildAdvisorRecommendations function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getGenkitModelName, safeGenkitGenerate } from '@/lib/ai-model-resolver';

import {
  AiBuildAdvisorRecommendationsInputSchema,
  AiBuildAdvisorRecommendationsOutputSchema,
  type AiBuildAdvisorRecommendationsInput,
  type AiBuildAdvisorRecommendationsOutput,
} from '@/ai/schemas/build-advisor-schemas';


// Wrapper function to call the Genkit flow
export async function aiBuildAdvisorRecommendations(
  input: AiBuildAdvisorRecommendationsInput
): Promise<AiBuildAdvisorRecommendationsOutput> {
  return aiBuildAdvisorRecommendationsFlow(input);
}

// Prompt Definition
const aiBuildAdvisorRecommendationsPrompt = ai.definePrompt({
  name: 'aiBuildAdvisorRecommendationsPrompt',
  input: {
    schema: AiBuildAdvisorRecommendationsInputSchema.extend({
      knowledgeContext: z.string().optional(),
      storeInventory: z.string().optional(),
      customSystemPrompt: z.string().optional(),
    }),
  },
  output: { schema: AiBuildAdvisorRecommendationsOutputSchema },
  model: 'googleai/gemini-2.5-flash',
  config: { temperature: 0.1 },
  prompt: `{{#if customSystemPrompt}}
{{{customSystemPrompt}}}
{{else}}
You are an expert PC building advisor specializing in the Philippine market. Your goal is to recommend a set of compatible core components (CPU, GPU, Motherboard, RAM, Storage, PSU, Case, Cooler) for a user based on their specific needs.

Provide a brief summary of the overall build strategy in the context of the Philippine market, and provide recommendations for each component with its model name, estimated PHP price, and estimated total wattage for the build.

DESCRIPTION RULES (MAXIMUM SPEED):
- CPU, GPU, and Motherboard: Provide a concise justification explaining their performance synergy and value in PHP.
- RAM, Storage, PSU, Case, and Cooler: Set description to an empty string "" (or a brief 2-word tag); our client system automatically populates dynamic specifications for these components. Do not spend tokens writing long descriptions for these supporting parts.
{{/if}}

{{#if knowledgeContext}}
EXPERT KNOWLEDGE BASE CONTEXT:
{{{knowledgeContext}}}

Base your recommendations strictly on the expert knowledge provided above if it relates to the user's request (e.g., use the provided tier lists, avoid known bottlenecks).
{{/if}}

{{#if storeInventory}}
STORE_INVENTORY_MENU (IN-STOCK STORE PARTS):
{{{storeInventory}}}
{{/if}}

CRITICAL RULES:
1. CURRENCY: All price discussions and budget considerations MUST be in Philippine Peso (PHP). Use the ₱ symbol.
2. LOCAL PRICING: Provide estimated prices that reflect the current PC component market in the Philippines (e.g., shops like Dynaquest, PCHub, Gilmore prices).
{{#if allowAiSearch}}
3. HARDWARE MARKET SELECTION (AI SEARCH ENABLED - STORE-FIRST HYBRID):
   - You have access to both our STORE_INVENTORY_MENU and your comprehensive Philippine PC hardware knowledge and tier lists.
   - STORE-FIRST PRIORITY: Prioritize selecting components from our STORE_INVENTORY_MENU whenever an in-stock part offers competitive value, compatibility, and fits comfortably within the user's budget.
   - EXTERNAL MARKET SELECTION: If our store inventory lacks a suitable, compatible part for a given component, or if an external Philippine market part offers significantly superior value/performance for this budget, you are encouraged to recommend that external market component. Use realistic Philippine retail market prices (₱) (e.g., Dynaquest, PCHub, Gilmore).
{{else}}
3. INVENTORY AVAILABILITY (STRICT STORE INVENTORY ONLY - STRICT REJECTION RULE):
   - You MUST ONLY recommend components that are explicitly listed in the STORE_INVENTORY_MENU above.
   - DO NOT recommend any parts outside the menu. DO NOT hallucinate inventory items. Ensure model names match exactly.
   - STRICT REJECTION: If our available store inventory lacks the necessary components to build a complete, 100% compatible PC within the user's budget, DO NOT make up fake stock or recommend incompatible parts. Instead, in your summary, state clearly and transparently: "Our current in-stock store inventory cannot fulfill a complete, compatible build for this budget (₱{{budget}}). Please enable 'AI Search' to allow recommendations from the broader Philippine market, or consider adjusting your budget." Still provide whatever best partial/nearest configuration you can from the actual inventory, but clearly emphasize the notice in the summary.
{{/if}}
4. COMPATIBILITY: Ensure all recommended components are 100% compatible.
5. BUDGET ADHERENCE: 
   {{#if allowFlexibleBudget}}
   - The user has enabled "Flexible Budget". You are ALLOWED to exceed the budget by up to 30% if it results in a massive performance jump (e.g., stepping up to a much better GPU).
   {{else}}
   - Strictly follow the PHP budget provided by the user. DO NOT exceed it.
   {{/if}}

User's PC building goals:
Intended Use: {{{intendedUse}}}
Budget: {{{budget}}} (PHP)
Desired Performance Level: {{{performanceLevel}}}
{{#if allowFlexibleBudget}}
BUDGET MODE: FLEXIBLE (Max 30% Overstep Allowed)
{{else}}
BUDGET MODE: STRICT (DO NOT EXCEED)
{{/if}}
{{#if additionalNotes}}
Additional Notes: {{{additionalNotes}}}
{{/if}}

Please format your response as a JSON object strictly following the output schema provided. The estimatedPrice for each component must be a realistic PHP price number (not a string).`,
});


// Genkit Flow Definition
import { retrieveLocalKnowledge } from '@/lib/knowledge-retriever';
import { getAdminFirestore } from '@/firebase/server-init';
import { getInventoryFromFirestore } from '@/lib/inventory-fetcher';

const CACHE_COLLECTION = 'ai_recommendation_cache_v3';

const generateCacheKey = (input: AiBuildAdvisorRecommendationsInput, promptSig: string = '') => {
  const parts = [
    input.intendedUse.toLowerCase().trim(),
    input.budget.toLowerCase().trim().replace(/[^\d]/g, ''), // Extract numbers for more consistent caching (e.g. 20000)
    input.performanceLevel.toLowerCase().trim(),
    (input.additionalNotes || '').toLowerCase().trim(),
    input.allowFlexibleBudget ? 'flexible' : 'strict',
    input.allowAiSearch ? 'aisearch' : 'local',
    promptSig ? promptSig.substring(0, 32) : 'default'
  ];
  return parts.join('|').replace(/[\/.]/g, '_').substring(0, 1000);
};

const aiBuildAdvisorRecommendationsFlow = ai.defineFlow(
  {
    name: 'aiBuildAdvisorRecommendationsFlow',
    inputSchema: AiBuildAdvisorRecommendationsInputSchema,
    outputSchema: AiBuildAdvisorRecommendationsOutputSchema,
  },
  async (input) => {
    // Resolve dynamic system prompt from Firestore (or baseline default)
    const { getActiveSystemPrompt } = await import('@/lib/system-prompts');
    const customSystemPrompt = await getActiveSystemPrompt('buildAdvisor');

    const cacheKey = generateCacheKey(input, customSystemPrompt);
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

    // 1. Try to fetch from cache
    try {
      const cacheRef = db.collection(CACHE_COLLECTION).doc(cacheKey);
      const cacheSnap = await cacheRef.get();
      
      if (cacheSnap.exists) {
        const cacheData = cacheSnap.data();
        // Cache expiry check (e.g., 7 days)
        const ageInDays = (Date.now() - cacheData?.timestamp) / (1000 * 60 * 60 * 24);
        if (ageInDays < 7) {
          console.log(`[AI Cache] Hit for key: ${cacheKey}`);
          return cacheData?.output as AiBuildAdvisorRecommendationsOutput;
        }
      }
    } catch (e) {
      console.warn(`[AI Cache] Read error:`, e);
    }

    // 2. Cache miss: Run AI
    console.log(`[AI Cache] Miss for key: ${cacheKey}. Generating fresh (AI Search: ${!!input.allowAiSearch})...`);
    
    // Fetch relevant local knowledge based on the user's intent and performance level
    const query = `${input.intendedUse} ${input.performanceLevel} ${input.additionalNotes || ''}`;
    const dynamicModel = await getGenkitModelName('buildAdvisor');
    
    const categoriesToFetch = ['cpu', 'gpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cooler'];
    const [knowledgeResults, inventoryResults] = await Promise.all([
      retrieveLocalKnowledge(query),
      Promise.all(categoriesToFetch.map(cat => getInventoryFromFirestore(cat, undefined, 10)))
    ]);

    const knowledgeContext = knowledgeResults.join('\n\n');
    const storeInventory = inventoryResults.flat().join('\n');

    // Step 2: Structured output prompt WITHOUT googleSearchRetrieval
    const { output } = await aiBuildAdvisorRecommendationsPrompt(
      {
        ...input,
        knowledgeContext,
        storeInventory: storeInventory || undefined,
        customSystemPrompt,
      },
      { model: dynamicModel }
    );

    if (!output) {
      throw new Error('Failed to get recommendations from the AI.');
    }

    // 3. Save to cache
    try {
      await db.collection(CACHE_COLLECTION).doc(cacheKey).set({
        input,
        output,
        timestamp: Date.now()
      });
      console.log(`[AI Cache] Saved new entry for key: ${cacheKey}`);
    } catch (e) {
      console.warn(`[AI Cache] Write error:`, e);
    }

    return output;
  }
);
