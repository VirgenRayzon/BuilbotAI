import * as dotenv from "dotenv";
dotenv.config();

import { ai } from "./src/ai/genkit";
import { z } from "genkit";

const testPrompt = ai.definePrompt({
    name: "testPrompt",
    model: 'googleai/gemini-2.5-flash',
    input: { schema: z.object({ query: z.string() }) },
    prompt: "Search the web and answer this: {{query}}",
});

async function run() {
    console.time('API Call');
    try {
        const res = await testPrompt(
            { query: "What is the price of an RTX 5070 Ti in PHP today?" },
            {
                config: {
                    temperature: 0.5,
                    googleSearchRetrieval: {}
                }
            }
        );
        console.timeEnd('API Call');
        console.log("Response:", res.text);
    } catch (err) {
        console.error("Error during test run:", err);
    }
}
run();
