import { ai } from "./src/ai/genkit";
import { z } from "genkit";
const testPrompt = ai.definePrompt({
    name: "testPrompt",
    model: 'googleai/gemini-3-flash-preview',
    input: { schema: z.object({ query: z.string() }) },
    prompt: "Answer this: {{query}}",
});
async function run() {
    const res = await testPrompt({ query: "hello" }, { config: { temperature: 0.5 } });
    console.log(res.text);
}
run();
