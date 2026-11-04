import { createGoogleGenerativeAI, type GoogleGenerativeAIProviderMetadata } from '@ai-sdk/google';
import { generateText } from 'ai';
import type { AiBuildAdvisorRecommendationsInput } from '@/ai/schemas/build-advisor-schemas';
import type { AdvisorWebResearchInfo } from '@/lib/types';

const MAX_SOURCES = 4;
const MAX_RESEARCH_CHARS = 4800;

export class AdvisorWebSearchError extends Error {
  constructor() {
    super('Web Search could not retrieve current hardware information. Please retry or turn off Web Search.');
    this.name = 'AdvisorWebSearchError';
  }
}

function safeSource(url: string, title?: string | null) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return null;
    parsed.username = '';
    parsed.password = '';
    return {
      title: (title?.trim() || parsed.hostname).slice(0, 100),
      url: parsed.toString(),
    };
  } catch {
    return null;
  }
}

export const ADVISOR_RESEARCH_MODEL = 'gemini-3.8-flash';

export async function researchAdvisorHardware(input: AiBuildAdvisorRecommendationsInput): Promise<{
  brief: string;
  info: AdvisorWebResearchInfo;
  queryCount: number;
}> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new AdvisorWebSearchError();

  const google = createGoogleGenerativeAI({ apiKey });

  const executeResearchPass = async (searchPrompt: string) => {
    const result = await generateText({
      model: google(ADVISOR_RESEARCH_MODEL),
      tools: { google_search: google.tools.googleSearch({}) },
      prompt: searchPrompt,
    });

    const metadata = (result.providerMetadata?.google as GoogleGenerativeAIProviderMetadata | undefined)?.groundingMetadata;
    const queryCount = metadata?.webSearchQueries?.length || 0;
    const candidates = [
      ...result.sources.flatMap(source => source.sourceType === 'url'
        ? [{ url: source.url, title: source.title }]
        : []),
      ...(metadata?.groundingChunks || []).flatMap(chunk => chunk.web?.uri
        ? [{ url: chunk.web.uri, title: chunk.web.title }]
        : []),
    ];
    const seen = new Set<string>();
    const sources = candidates
      .map(candidate => safeSource(candidate.url, candidate.title))
      .filter((source): source is NonNullable<typeof source> => !!source)
      .filter(source => {
        if (seen.has(source.url)) return false;
        seen.add(source.url);
        return true;
      })
      .slice(0, MAX_SOURCES);
    const brief = result.text.trim().slice(0, MAX_RESEARCH_CHARS);

    return { result, metadata, queryCount, sources, brief };
  };

  try {
    const primaryPrompt = `Use Google Search to check current PC hardware information as of ${new Date().toISOString().slice(0, 10)} for a Philippine PC build.
Intended use: ${input.intendedUse.slice(0, 100)}
Budget: ${input.budget.slice(0, 80)} PHP
Priority: ${input.performanceLevel.slice(0, 500)}

Return a brief under 500 words covering the most relevant current CPU/GPU choices, platform compatibility, and Philippine retailer price context. Include prices only when a source supports them. Prefer manufacturer specifications and Philippine retailers. Mention dates when available. Do not invent availability, specifications, or prices.`;

    let research = await executeResearchPass(primaryPrompt);

    // If model answered from parametric memory without searching, retry once with an explicit search instruction
    if ((!research.queryCount || !research.sources.length) && research.brief) {
      console.warn('[Build Advisor Web Search] Model skipped search tool on primary pass. Retrying with explicit query prompt...');
      const fallbackPrompt = `Search Google for current Philippine retailer prices (e.g., Dynaquest, Bermor Techzone, PC Express, Gilmore) for PC hardware:
Target build: ${input.intendedUse.slice(0, 100)}
Budget: ${input.budget.slice(0, 80)} PHP
Requirements: ${input.performanceLevel.slice(0, 300)}

You MUST execute Google Search queries to look up current pricing and stock. Provide a concise summary of current Philippine prices, best-value parts, and retailers.`;
      const retryResearch = await executeResearchPass(fallbackPrompt);
      if (retryResearch.queryCount && retryResearch.sources.length) {
        research = retryResearch;
      }
    }

    console.info('[Build Advisor Web Search]', JSON.stringify({
      queryCount: research.queryCount,
      sourceCount: research.sources.length,
      briefLength: research.brief.length,
    }));

    if (!research.brief || !research.sources.length || !research.queryCount) {
      throw new Error(`Insufficient grounding (queries: ${research.queryCount}, sources: ${research.sources.length})`);
    }

    const suggestedHtml = research.metadata?.searchEntryPoint?.renderedContent;
    const searchSuggestionHtml = suggestedHtml && !/<script|on\w+\s*=|javascript:/i.test(suggestedHtml)
      ? suggestedHtml
      : undefined;

    return {
      brief: research.brief,
      info: { searchedAt: new Date().toISOString(), sources: research.sources, searchSuggestionHtml },
      queryCount: research.queryCount,
    };
  } catch (error) {
    console.warn('[Build Advisor Web Search] Grounded research failed:', error instanceof Error ? error.message : 'unknown_error');
    throw new AdvisorWebSearchError();
  }
}
