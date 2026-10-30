import { streamText, tool, convertToModelMessages, stepCountIs, createUIMessageStream, createUIMessageStreamResponse, type UIMessage } from 'ai';
import { retrieveLocalKnowledge } from "@/lib/knowledge-retriever";
import { getChatPartSpecifications } from "@/lib/chat-part-specifications";
import { getStructuredInventory } from "@/lib/inventory-fetcher";
import { filterChatRecommendations } from "@/lib/chat-recommendations";
import { ChatStreamFailure, forwardTunedChatStream } from "@/lib/chat-stream-fallback";
import { checkFullBuildCompatibility } from "@/lib/compatibility";
import { calculateBottleneck } from "@/lib/bottleneck";
import { INCLUDED_INTEGRATED_GPU_ID } from '@/lib/integrated-graphics';
import { getLanguageModelForChat, markTunedModelDegraded } from "@/lib/ai-model-resolver";
import { getChatModelHistory, getChatRecommendationContext } from '@/lib/chat-conversation';
import { z } from 'zod';

export const maxDuration = 120;

export async function POST(req: Request) {
    const startTime = Date.now();
    try {
        const { messages, userProfile, currentBuild } = await req.json();

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return new Response(JSON.stringify({ error: "No messages provided" }), { status: 400 });
        }

        // Dynamically resolve active system instruction from Firestore with baseline fallback
        const { getActiveSystemPrompt } = await import("@/lib/system-prompts");
        let systemInstruction = `${await getActiveSystemPrompt('chatbot')}\n\nFor part recommendations, ask only for the intended use and budget in one short question if they are missing. A stated target resolution also counts as intended use. Once the category, budget, and intended use or target resolution are known across the conversation, call searchInventory and show the available compatible options now. Never ask for refresh rate, game titles, or whether an already clarified budget is for the part before searching. For one user question, use tools before writing an explanation, search each category at most once, and give one concise final answer after the tool results. Do not repeat an introductory explanation or narrate the same recommendation in multiple steps; the UI renders the product cards. For a named component review or detailed specifications, call queryPartSpecifications with the full product name and category when known. That tool checks the local vector store and uses Google Search when there is no exact product match. Use only facts about the requested model. Never introduce or change a numeric specification that is absent from the tool result. If the result source is web, cite its supplied links in your answer. If the result source is none, say that the exact specifications could not be verified; never replace them with a similar model's specifications.`;


        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

        if (!apiKey) {
            console.error("AI API Key is missing. Checked: GOOGLE_GENERATIVE_AI_API_KEY, GEMINI_API_KEY, GOOGLE_API_KEY. None found.");
            return new Response(JSON.stringify({ error: "AI service is currently unavailable" }), { status: 500 });
        }

        // Resolve active AI model (Default vs Fine-Tuned with automated fallback for Chatbot)
        const resolved = await getLanguageModelForChat({ feature: 'chatbot' });
        console.log(`[Chat API] Using model: ${resolved.modelId} (feature: chatbot, isFineTuned: ${resolved.isFineTuned}, isFallback: ${resolved.isFallback})`);

        const chatMessages = messages as UIMessage[];
        const recommendationContext = getChatRecommendationContext(chatMessages);
        if (recommendationContext) {
            systemInstruction += `\n\n[ALREADY ANSWERED — SEARCH NOW]\nThe user requested ${recommendationContext.category.toUpperCase()} options, has a ₱${recommendationContext.budget.toLocaleString('en-PH')} budget for this part, and stated ${recommendationContext.intendedUse} as the intended use or target resolution. Call searchInventory for ${recommendationContext.category} with maxPrice ${recommendationContext.budget} before answering. Do not ask any more discovery questions.`;
        }

        // Build context prompt if user has an active rig
        let buildContextPrompt = "";
        if (currentBuild && typeof currentBuild === 'object' && Object.keys(currentBuild).length > 0) {
            const lines: string[] = [];
            let totalWattage = 0;
            let psuWattage = 0;
            let totalPrice = 0;
            const selectedCategories = new Set<string>();
            const contextSpecKeys = [
                'Socket', 'Memory Type', 'RAM Type', 'Form Factor', 'Type',
                'Memory Slots', 'Stick Count', 'NVMe Slots', 'SATA Slots',
                'Radiator Size', 'Max Radiator Size (mm)', 'Mobo Support',
            ];
            const describePart = (part: any) => {
                const specs = part.specifications && typeof part.specifications === 'object'
                    ? contextSpecKeys
                        .filter(key => part.specifications[key] !== undefined && part.specifications[key] !== '')
                        .map(key => `${key}: ${part.specifications[key]}`)
                    : [];
                if (part.socket && !specs.some(spec => spec.startsWith('Socket:'))) specs.unshift(`Socket: ${part.socket}`);
                if (part.ramType && !specs.some(spec => spec.startsWith('Memory Type:'))) specs.push(`Memory Type: ${part.ramType}`);
                if (part.performanceTier) specs.push(`Performance tier: ${part.performanceTier}/4`);
                if (part.id === INCLUDED_INTEGRATED_GPU_ID) specs.push('Integrated graphics included with CPU; shared system memory; no dedicated card');
                const price = typeof part.price === 'number' ? part.price : 0;
                totalPrice += price;
                return `${part.name || part.model || 'Part'} (₱${price.toLocaleString('en-PH')}${specs.length ? `; ${specs.join('; ')}` : ''})`;
            };

            for (const [category, item] of Object.entries(currentBuild)) {
                if (!item) continue;
                if (Array.isArray(item)) {
                    if (item.length === 0) continue;
                    const names = item.map(describePart).join(', ');
                    lines.push(`- ${category}: [${names}]`);
                    selectedCategories.add(category);
                    item.forEach((i: any) => {
                        if (typeof i.wattage === 'number') totalWattage += i.wattage;
                    });
                } else {
                    const single = item as any;
                    lines.push(`- ${category}: ${describePart(single)}`);
                    selectedCategories.add(category);
                    if (category.toLowerCase() === 'psu') {
                        if (typeof single.wattage === 'number') {
                            psuWattage = single.wattage;
                        }
                    } else if (typeof single.wattage === 'number') {
                        totalWattage += single.wattage;
                    }
                }
            }

            if (lines.length > 0) {
                const missingCore = ['CPU', 'GPU', 'Motherboard', 'RAM', 'Storage', 'PSU', 'Case', 'Cooler']
                    .filter(category => !selectedCategories.has(category));
                buildContextPrompt = `\n[CURRENT YOUR BUILD — LIVE BUILDER STATE]\nThese are the parts selected at the time of this message. Use this state over any older build details in the conversation.\n${lines.join('\n')}\n- Selected parts total: ₱${totalPrice.toLocaleString('en-PH')}\n- Estimated listed component draw: ~${totalWattage}W\n- Selected PSU capacity: ${psuWattage > 0 ? `${psuWattage}W` : 'Not selected'}\n- Unfilled core categories: ${missingCore.length ? missingCore.join(', ') : 'None'}\nFor a build check, use analyzeCurrentBuild. For store recommendations, use searchInventory and account for these selected parts.`;
            }
        }

        // Keep profile and build facts in the system instruction. Inserting a
        // synthetic user turn can break Gemini's required tool-turn ordering.
        if (userProfile || buildContextPrompt) {
            const displayName = userProfile?.displayName || "Customer";
            const experienceLevel = userProfile?.experienceLevel || "Intermediate";
            const preferences = userProfile?.preferences || "None provided";

            const profilePrompt = `[SYSTEM CONTEXT — DO NOT REPLY DIRECTLY]
USER PROFILE:
- User Name: ${displayName}
- Hardware Experience Level: ${experienceLevel}
- Specific Preferences/Wishes: ${preferences}${buildContextPrompt}`;

            systemInstruction += `\n\n${profilePrompt}`;
        }

        const modelMessages = await convertToModelMessages(getChatModelHistory(chatMessages));
        const inventorySearchCache = new Map<string, Promise<ReturnType<typeof filterChatRecommendations> | { error: string }>>();
        const executeStream = (
            modelToUse: any,
            controller: AbortController,
            isFineTuned: boolean,
            messagesToUse = modelMessages,
            systemToUse = systemInstruction,
        ) => {
            return streamText({
                model: modelToUse,
                maxOutputTokens: 1200,
                messages: messagesToUse,
                system: systemToUse,
                tools: {
                    analyzeCurrentBuild: tool({
                        description: "Analyze the user's currently selected PC build for hardware compatibility issues, socket mismatches, cooler/case clearances, RAM generation match, power supply headroom, and CPU/GPU bottleneck balance. Call this whenever the user asks 'check my build', 'is my build compatible?', 'any bottleneck in my rig?', or asks if their parts work together.",
                        inputSchema: z.object({
                            resolutionTarget: z.enum(['1080p', '1440p', '4K']).optional().describe("Target gaming resolution (defaults to 1440p)."),
                        }),
                        execute: async ({ resolutionTarget = '1440p' }) => {
                            console.log(`[Tool: analyzeCurrentBuild] Analyzing build at ${resolutionTarget}`);
                            if (!currentBuild || Object.keys(currentBuild).length === 0) {
                                return {
                                    status: "empty",
                                    message: "No components are currently selected in the builder. Recommend selecting a CPU, Motherboard, or GPU first."
                                };
                            }

                            // Run deterministic compatibility analysis
                            const compatibilityIssues = checkFullBuildCompatibility(currentBuild);
                            const missingCoreCategories = ['CPU', 'GPU', 'Motherboard', 'RAM', 'Storage', 'PSU', 'Case', 'Cooler']
                                .filter(category => {
                                    const selected = currentBuild[category];
                                    return !selected || (Array.isArray(selected) && selected.length === 0);
                                });

                            // Run deterministic bottleneck analysis
                            const bottleneckAnalysis = calculateBottleneck(currentBuild, resolutionTarget);

                            // Power calculation
                            let estimatedWattage = 0;
                            let psuCapacity = 0;
                            for (const [cat, comp] of Object.entries(currentBuild)) {
                                if (!comp) continue;
                                if (Array.isArray(comp)) {
                                    comp.forEach((c: any) => { if (c.wattage) estimatedWattage += c.wattage; });
                                } else {
                                    const single = comp as any;
                                    if (cat.toLowerCase() === 'psu') {
                                        if (typeof single.wattage === 'number') {
                                            psuCapacity = single.wattage;
                                        }
                                    } else if (typeof single.wattage === 'number') {
                                        estimatedWattage += single.wattage;
                                    }
                                }
                            }

                            const powerHeadroom = psuCapacity > 0 ? psuCapacity - estimatedWattage : null;
                            const powerStatus = psuCapacity === 0
                                ? "No PSU selected yet"
                                : powerHeadroom! < 50
                                    ? "Insufficient (PSU wattage is too close or below total draw)"
                                    : powerHeadroom! < 150
                                        ? "Adequate but tight"
                                        : "Optimal (healthy headroom)";

                            return {
                                completeness: {
                                    isComplete: missingCoreCategories.length === 0,
                                    missingCategories: missingCoreCategories,
                                    note: missingCoreCategories.length > 0
                                        ? 'This is a partial build. No detected issue does not confirm full-build compatibility; explain what can and cannot be checked yet.'
                                        : 'All core categories are selected.',
                                },
                                compatibility: {
                                    hasIssues: compatibilityIssues.length > 0,
                                    issues: compatibilityIssues.map(i => `[${i.severity.toUpperCase()}] ${i.message}`)
                                },
                                bottleneck: {
                                    status: bottleneckAnalysis.status,
                                    message: bottleneckAnalysis.message
                                },
                                graphics: currentBuild.GPU?.id === INCLUDED_INTEGRATED_GPU_ID
                                    ? 'Integrated graphics included with the CPU; no discrete GPU is installed.'
                                    : 'Dedicated graphics card or no GPU selected.',
                                power: {
                                    estimatedWattage: `${estimatedWattage}W`,
                                    psuCapacity: psuCapacity > 0 ? `${psuCapacity}W` : 'Not selected',
                                    status: powerStatus
                                }
                            };
                        }
                    }),
                    searchInventory: tool({
                        description: "Search the live store database for PC parts by category. IMPORTANT: To ensure you find results, leave 'searchTerm' empty to fetch all available parts in a category, then pick the best ones yourself. Do NOT pass overly specific terms (like '650W Bronze' or 'ATX Case') as the search is strict. NEVER pass the string 'undefined'.",
                        inputSchema: z.object({
                            category: z.enum(['cpu', 'gpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cooler', 'monitor', 'keyboard', 'mouse', 'headset']),
                            searchTerm: z.string().optional().describe("Keep this EMPTY to get all items in the category."),
                            maxPrice: z.number().optional().describe("Optional maximum budget limit in Philippine Pesos (₱) to filter items within budget.")
                        }),
                        execute: async ({ category, searchTerm, maxPrice }) => {
                            const requestedCategory = recommendationContext?.category ?? category;
                            const requestedBudget = recommendationContext?.budget ?? maxPrice;
                            const cleanTerm = recommendationContext || searchTerm === "undefined" || searchTerm === "" ? undefined : searchTerm;
                            const cacheKey = JSON.stringify([requestedCategory, cleanTerm, requestedBudget]);
                            let result = inventorySearchCache.get(cacheKey);
                            if (!result) {
                                console.log(`[Tool: searchInventory] Searching for ${requestedCategory} with term: ${cleanTerm ? `"${cleanTerm}"` : "none"}${requestedBudget ? `, maxPrice: ₱${requestedBudget}` : ""}`);
                                result = (async () => {
                                    const inventory = await getStructuredInventory(requestedCategory, cleanTerm);
                                    if (!inventory || inventory.length === 0) {
                                        return { error: `No parts found in category ${requestedCategory} matching term '${cleanTerm}'. Try searching again with an EMPTY searchTerm to see all available parts.` };
                                    }

                                    const matchingParts = filterChatRecommendations(inventory, requestedCategory, currentBuild, requestedBudget);
                                    if (matchingParts.length === 0) {
                                        return { error: `No in-stock parts in this search pass the current build's compatibility checks${requestedBudget ? ` within ₱${requestedBudget}` : ''}. Try another category or ask which selected part limits the options.` };
                                    }
                                    return matchingParts;
                                })();
                                inventorySearchCache.set(cacheKey, result);
                            }
                            return result;
                        },
                    }),
                    queryCompatibilityGuides: tool({
                        description: "Search the local markdown guides for PC component compatibility rules, tier lists, bottlenecks, and recommendations.",
                        inputSchema: z.object({
                            query: z.string().describe("Specific search keywords or terms (e.g. 'ram speed', 'psu tier', 'bottleneck cpu', 'motherboard size').")
                        }),
                        execute: async ({ query }) => {
                            console.log(`[Tool: queryCompatibilityGuides] Query: "${query}"`);
                            const guides = await retrieveLocalKnowledge(query);
                            return { guides };
                        }
                    }),
                    queryPartSpecifications: tool({
                        description: "Get specifications for a named PC component in any hardware category. Pass its full product name and category when known. Checks the local hardware vector database first and uses grounded Google Search when no exact product match is found. Results identify whether they came from the vector store or the web and include web source links.",
                        inputSchema: z.object({
                            query: z.string().describe("Full product name to lookup (e.g., 'Ryzen 5 7600X', 'RTX 4070', 'Corsair RM850x')."),
                            category: z.enum(['cpu', 'gpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cooler', 'monitor', 'keyboard', 'mouse', 'headset']).optional(),
                        }),
                        execute: async ({ query, category }) => {
                            console.log(`[Tool: queryPartSpecifications] Query: "${query}"`);
                            return getChatPartSpecifications(query, category);
                        }
                    })
                },
                stopWhen: stepCountIs(5), // Allow for tool calling loops automatically
                prepareStep: recommendationContext
                    ? ({ stepNumber }) => ({ toolChoice: stepNumber === 0
                        ? { type: 'tool' as const, toolName: 'searchInventory' as const }
                        : 'none' as const })
                    : undefined,
                abortSignal: controller.signal,
                timeout: isFineTuned
                    ? { totalMs: 30000, chunkMs: 15000 }
                    : { totalMs: 80000, chunkMs: 25000 },
            });
        };

        const stream = createUIMessageStream({
            async execute({ writer }) {
                let partialReply = '';
                let hasPartialOutput = false;
                if (resolved.isFineTuned) {
                    const tunedController = new AbortController();
                    try {
                        const tunedResult = executeStream(resolved.model, tunedController, true);
                        await forwardTunedChatStream(
                            tunedResult.toUIMessageStream(), tunedController, 32000,
                            chunk => writer.write(chunk),
                        );
                        console.log(`[Chat API] Fine-tuned reply completed in ${Date.now() - startTime}ms`);
                        return;
                    } catch (error) {
                        const reason = error instanceof Error ? error.message : String(error);
                        markTunedModelDegraded(reason);
                        if (error instanceof ChatStreamFailure && error.hasShownContent) {
                            hasPartialOutput = true;
                            partialReply = error.partialText;
                            console.warn(`[Chat API] Fine-tuned reply stopped after partial output at ${Date.now() - startTime}ms; continuing with default Gemini: ${reason}`);
                        } else {
                            console.warn(`[Chat API] Fine-tuned reply failed before output after ${Date.now() - startTime}ms; retrying with default Gemini: ${reason}`);
                        }
                    }
                }

                const fallback = resolved.isFineTuned
                    ? await getLanguageModelForChat({ forceDefault: true })
                    : resolved;
                console.log(`[Chat API] Streaming ${fallback.modelId}${resolved.isFineTuned ? ' (fallback)' : ''}`);
                const defaultController = new AbortController();
                const fallbackMessages = partialReply
                    ? [
                        ...modelMessages,
                        { role: 'assistant' as const, content: partialReply },
                        { role: 'user' as const, content: 'Finish your interrupted answer. Continue from the last word without repeating any text already shown.' },
                    ]
                    : modelMessages;
                const fallbackSystem = partialReply
                    ? `${systemInstruction}\n\nYour prior assistant text has already been displayed to the customer and was interrupted. Continue from its final word only. Do not restart the answer or repeat any of the displayed wording. Finish the thought with concrete advice. Do not apologize or discuss the interruption.`
                    : systemInstruction;
                writer.merge(executeStream(fallback.model, defaultController, false, fallbackMessages, fallbackSystem).toUIMessageStream({
                    sendStart: !hasPartialOutput,
                    onError: error => error instanceof Error ? error.message : String(error),
                }));
            },
            onError: error => error instanceof Error ? error.message : String(error),
        });

        return createUIMessageStreamResponse({
            stream,
            headers: {
                'x-server-start': startTime.toString(),
            },
        });

    } catch (error) {
        console.error("Error in chat route:", error);
        return new Response(JSON.stringify({ error: "Failed to process chat request" }), { status: 500 });
    }
}
