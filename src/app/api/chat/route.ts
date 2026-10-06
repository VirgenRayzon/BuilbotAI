import { streamText, tool, convertToModelMessages, stepCountIs } from 'ai';
import { retrieveLocalKnowledge } from "@/lib/knowledge-retriever";
import { retrieveHardwareVectorSpecs } from "@/lib/vector-retriever";
import { getStructuredInventory } from "@/lib/inventory-fetcher";
import { checkFullBuildCompatibility } from "@/lib/compatibility";
import { calculateBottleneck } from "@/lib/bottleneck";
import { getLanguageModelForChat, markTunedModelDegraded } from "@/lib/ai-model-resolver";
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
        const systemInstruction = await getActiveSystemPrompt('chatbot');


        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

        if (!apiKey) {
            console.error("AI API Key is missing. Checked: GOOGLE_GENERATIVE_AI_API_KEY, GEMINI_API_KEY, GOOGLE_API_KEY. None found.");
            return new Response(JSON.stringify({ error: "AI service is currently unavailable" }), { status: 500 });
        }

        // Resolve active AI model (Default vs Fine-Tuned with automated fallback for Chatbot)
        const resolved = await getLanguageModelForChat({ feature: 'chatbot' });
        console.log(`[Chat API] Using model: ${resolved.modelId} (feature: chatbot, isFineTuned: ${resolved.isFineTuned}, isFallback: ${resolved.isFallback})`);

        // Slice to get last 10 messages for context
        const recentMessages = messages.slice(-10);

        // Build context prompt if user has an active rig
        let buildContextPrompt = "";
        if (currentBuild && typeof currentBuild === 'object' && Object.keys(currentBuild).length > 0) {
            const lines: string[] = [];
            let totalWattage = 0;
            let psuWattage = 0;

            for (const [category, item] of Object.entries(currentBuild)) {
                if (!item) continue;
                if (Array.isArray(item)) {
                    const names = item.map((i: any) => `${i.name || i.model || 'Part'} (₱${i.price || 0})`).join(', ');
                    lines.push(`- ${category}: [${names}]`);
                    item.forEach((i: any) => {
                        if (typeof i.wattage === 'number') totalWattage += i.wattage;
                    });
                } else {
                    const single = item as any;
                    lines.push(`- ${category}: ${single.name || single.model || 'Part'} (₱${single.price || 0})`);
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
                buildContextPrompt = `\n[CURRENT USER RIG / PC BUILD CONTEXT]\nThe user is actively configuring a PC in the builder. Selected hardware:\n${lines.join('\n')}\n- Estimated Power Draw: ~${totalWattage}W\n- Selected PSU Capacity: ${psuWattage > 0 ? `${psuWattage}W` : 'Not selected'}\nUse this live context to verify compatibility, upgrades, and bottleneck balance when asked.`;
            }
        }

        // Inject userProfile and currentBuild context immediately prior to final user prompt
        if (userProfile || buildContextPrompt) {
            const displayName = userProfile?.displayName || "Architect";
            const experienceLevel = userProfile?.experienceLevel || "Intermediate";
            const preferences = userProfile?.preferences || "None provided";

            const profilePrompt = `[SYSTEM CONTEXT — DO NOT REPLY DIRECTLY]
USER PROFILE:
- User Name: ${displayName}
- Hardware Experience Level: ${experienceLevel}
- Specific Preferences/Wishes: ${preferences}${buildContextPrompt}`;

            recentMessages.splice(recentMessages.length - 1, 0, {
                id: `context-${Date.now()}`,
                role: 'user',
                parts: [{ type: 'text', text: profilePrompt }]
            } as any);
        }

        const executeStream = async (modelToUse: any, isCurrentlyFineTuned: boolean) => {
            return streamText({
                model: modelToUse,
                maxOutputTokens: 1200,
                messages: await convertToModelMessages(recentMessages),
                system: systemInstruction,
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
                                compatibility: {
                                    hasIssues: compatibilityIssues.length > 0,
                                    issues: compatibilityIssues.map(i => `[${i.severity.toUpperCase()}] ${i.message}`)
                                },
                                bottleneck: {
                                    status: bottleneckAnalysis.status,
                                    message: bottleneckAnalysis.message
                                },
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
                            const cleanTerm = (searchTerm === "undefined" || searchTerm === "") ? undefined : searchTerm;
                            console.log(`[Tool: searchInventory] Searching for ${category} with term: ${cleanTerm ? `"${cleanTerm}"` : "none"}${maxPrice ? `, maxPrice: ₱${maxPrice}` : ""}`);
                            let inventory = await getStructuredInventory(category, cleanTerm);

                            if (!inventory || inventory.length === 0) {
                                return { error: `No parts found in category ${category} matching term '${cleanTerm}'. Try searching again with an EMPTY searchTerm to see all available parts.` };
                            }

                            if (typeof maxPrice === 'number' && maxPrice > 0) {
                                const filtered = inventory.filter(p => p.price <= maxPrice);
                                if (filtered.length > 0) {
                                    inventory = filtered;
                                }
                            }

                            return inventory;
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
                        description: "Search the hardware vector database (Firestore buildbot_hardware_vector) for detailed hardware specifications (frequencies, ports, sockets, dimensions, power limits).",
                        inputSchema: z.object({
                            query: z.string().describe("Part name or brand keywords to lookup (e.g., 'Ryzen 5 7600X', 'RTX 4070', 'Corsair RM850x').")
                        }),
                        execute: async ({ query }) => {
                            console.log(`[Tool: queryPartSpecifications] Query: "${query}"`);
                            const specs = await retrieveHardwareVectorSpecs(query);
                            return { specs };
                        }
                    })
                },
                stopWhen: stepCountIs(5), // Allow for tool calling loops automatically
                abortSignal: AbortSignal.timeout(120000), // 120 second timeout
            });
        };

        let activeStreamResult;
        let isFallbackActive = resolved.isFallback;

        try {
            activeStreamResult = await executeStream(resolved.model, resolved.isFineTuned);
        } catch (streamInitError: any) {
            if (resolved.isFineTuned) {
                console.warn("[Chat API] Fine-tuned model stream creation failed. Falling back to default Gemini:", streamInitError);
                markTunedModelDegraded(streamInitError.message || "Stream init error");
                const fallbackResolved = await getLanguageModelForChat({ forceDefault: true });
                isFallbackActive = true;
                activeStreamResult = await executeStream(fallbackResolved.model, false);
            } else {
                throw streamInitError;
            }
        }

        return activeStreamResult.toUIMessageStreamResponse({
            headers: {
                'x-server-start': startTime.toString(),
                'x-model-id': resolved.modelId,
                'x-model-finetuned': resolved.isFineTuned ? 'true' : 'false',
                'x-model-fallback': isFallbackActive ? 'true' : 'false',
            },
            onError: (error: unknown) => {
                const msg = error instanceof Error ? error.message : String(error);
                if (resolved.isFineTuned) {
                    markTunedModelDegraded(msg);
                }
                return msg;
            }
        });

    } catch (error) {
        console.error("Error in chat route:", error);
        return new Response(JSON.stringify({ error: "Failed to process chat request" }), { status: 500 });
    }
}
