import { createGoogleGenerativeAI, type GoogleGenerativeAIProviderMetadata } from '@ai-sdk/google';
import { generateText } from 'ai';
import type { AiBuildAdvisorRecommendationsInput } from '@/ai/schemas/build-advisor-schemas';
import { DEFAULT_MODEL } from '@/lib/ai-model-resolver';
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

export async function researchAdvisorHardware(input: AiBuildAdvisorRecommendationsInput): Promise<{
  brief: string;
  info: AdvisorWebResearchInfo;
  queryCount: number;
}> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new AdvisorWebSearchError();

  const google = createGoogleGenerativeAI({ apiKey });
  try {
    const result = await generateText({
      model: google(DEFAULT_MODEL),
      tools: { google_search: google.tools.googleSearch({}) },
      prompt: `Use Google Search to check current PC hardware information as of ${new Date().toISOString().slice(0, 10)} for a Philippine PC build.
Intended use: ${input.intendedUse.slice(0, 100)}
Budget: ${input.budget.slice(0, 80)} PHP
Priority: ${input.performanceLevel.slice(0, 500)}

Return a brief under 500 words covering the most relevant current CPU/GPU choices, platform compatibility, and Philippine retailer price context. Include prices only when a source supports them. Prefer manufacturer specifications and Philippine retailers. Mention dates when available. Do not invent availability, specifications, or prices.`,
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
    console.info('[Build Advisor Web Search]', JSON.stringify({ queryCount, sourceCount: sources.length, briefLength: brief.length }));
    if (!brief || !sources.length || !queryCount) throw new AdvisorWebSearchError();

    const suggestedHtml = metadata?.searchEntryPoint?.renderedContent;
    const searchSuggestionHtml = suggestedHtml && !/<script|on\w+\s*=|javascript:/i.test(suggestedHtml)
      ? suggestedHtml
      : undefined;

    return {
      brief,
      info: { searchedAt: new Date().toISOString(), sources, searchSuggestionHtml },
      queryCount,
    };
  } catch (error) {
    console.warn('[Build Advisor Web Search] Grounded research failed:', error instanceof Error ? error.name : 'unknown_error');
    throw new AdvisorWebSearchError();
  }
}
