'use server';

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const ComponentSchema = z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    price: z.number(),
    brand: z.string(),
    stock: z.number(),
});

const AiSmartBudgetInputSchema = z.object({
    budget: z.number(),
    inventory: z.array(ComponentSchema),
    preferences: z.string().optional(),
});

export type AiSmartBudgetInput = z.infer<typeof AiSmartBudgetInputSchema>;

const aiSmartBudget = ai.defineFlow(
    {
        name: "aiSmartBudget",
        inputSchema: AiSmartBudgetInputSchema,
        outputSchema: z.object({
            build: z.record(z.string(), z.string().nullable()),
            totalCost: z.number(),
            reasoning: z.string(),
        }),
    },
    async (input) => {

        // Create a compact representation of the inventory to save tokens
        const compactInventory = input.inventory
            .filter(item => item.stock > 0) // Only include items in stock
            .reduce((acc: any, item) => {
                if (!acc[item.category]) acc[item.category] = [];
                acc[item.category].push({ id: item.id, name: item.name, price: item.price });
                return acc;
            }, {});

        const prompt = `
You are an expert PC Builder algorithm. Your goal is to select the absolute best combination of parts from the provided inventory that fits within the user's budget.
    
Budget: $${input.budget}
User Preferences: ${input.preferences || "None specified, focus on balanced price-to-performance for a general use/gaming PC."}

Available Inventory:
${JSON.stringify(compactInventory, null, 2)}

Rules:
1. You MUST select exactly one item for these categories: CPU, GPU, Motherboard, RAM, PSU, Case, Cooler. 
2. You MUST select at least one item for the Storage category.
3. The total price of all selected items MUST be less than or equal to the Budget ($${input.budget}). 
4. Ensure the parts are somewhat balanced (e.g., don't pair a $1000 GPU with a $50 CPU).
5. If it is impossible to build a complete PC under the budget, return the closest possible build and explain why in the reasoning.
6. The "build" object should map the Category Name to the specific part's "id" (not the name). Return null if you couldn't find a part for that category.

Return your response strictly adhering to the JSON schema.
`;

        const response = await ai.generate({
            prompt: prompt,
            output: {
                schema: z.object({
                    build: z.record(z.string(), z.string().nullable()).describe("Map of Category Name to Part ID"),
                    totalCost: z.number(),
                    reasoning: z.string().describe("Explanation of why these parts were chosen within the budget."),
                })
            }
        });

        if (!response.output) {
            throw new Error("AI returned a null output.");
        }
        return response.output;
    }
);

export async function aiSmartBudgetAction(input: AiSmartBudgetInput) {
    return aiSmartBudget(input);
}
