"use server";

import {
  aiBuildAdvisorRecommendations,
  type AiBuildAdvisorRecommendationsInput,
} from "@/ai/flows/ai-build-advisor-recommendations";
import {
  extractPartDetails,
  type ExtractPartDetailsInput,
} from "@/ai/flows/extract-part-details";
import {
  aiPrebuiltAdvisor,
  type AiPrebuiltAdvisorInput,
} from "@/ai/flows/ai-prebuilt-advisor";
import {
  aiBuildCritiqueAction,
  type AiBuildCritiqueInput,
} from "@/ai/flows/ai-build-critique";
import {
  aiPrebuiltPerformanceAction,
  type AiPrebuiltPerformanceInput,
} from "@/ai/flows/ai-prebuilt-performance";
import {
  aiSmartBudgetAction,
  type AiSmartBudgetInput,
} from "@/ai/flows/ai-smart-budget";


async function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 90000): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("AI_TIMEOUT")), timeoutMs)
  );
  return Promise.race([promise, timeoutPromise]);
}

const TIMEOUT_MESSAGE = "The AI service is taking too long to respond. Please try again in a few moments.";

export async function getAiPrebuiltPerformance(input: AiPrebuiltPerformanceInput) {
  try {
    const result = await withTimeout(aiPrebuiltPerformanceAction(input));
    return result;
  } catch (error) {
    console.error("Error fetching AI prebuilt performance:", error);
    if (error instanceof Error) {
      if (error.message === "AI_TIMEOUT") {
        return { error: TIMEOUT_MESSAGE };
      }
      if (error.message.includes("fetch failed")) {
        return {
          error:
            "Could not connect to the AI service. Is 'npm run genkit:dev' running in another terminal?",
        };
      }
      if (error.message.includes("GOOGLE_API_KEY") || error.message.includes("GEMINI_API_KEY") || error.message.includes("FAILED_PRECONDITION")) {
        return {
          error: "Missing API Key. Please set GOOGLE_API_KEY in your .env file to enable AI features.",
        };
      }
      return { error: error.message };
    }
    return { error: "An unknown error occurred." };
  }
}

export async function getAiRecommendations(
  input: AiBuildAdvisorRecommendationsInput
) {
  try {
    const result = await withTimeout(aiBuildAdvisorRecommendations(input));
    return result;
  } catch (error) {
    console.error("Error fetching AI recommendations:", error);
    if (error instanceof Error) {
      if (error.message === "AI_TIMEOUT") {
        return { error: TIMEOUT_MESSAGE };
      }
      if (error.message.includes("fetch failed")) {
        return {
          error:
            "Could not connect to the AI service. Is 'npm run genkit:dev' running in another terminal?",
        };
      }
      if (error.message.includes("GOOGLE_API_KEY") || error.message.includes("GEMINI_API_KEY") || error.message.includes("FAILED_PRECONDITION")) {
        return {
          error: "Missing API Key. Please set GOOGLE_API_KEY in your .env file to enable AI features.",
        };
      }
      return { error: error.message };
    }
    return { error: "An unknown error occurred." };
  }
}

export async function getAiPartDetails(input: ExtractPartDetailsInput) {
  try {
    const result = await withTimeout(extractPartDetails(input));
    return result;
  } catch (error) {
    console.error("Error fetching AI part details:", error);
    if (error instanceof Error) {
      if (error.message === "AI_TIMEOUT") {
        return { error: TIMEOUT_MESSAGE };
      }
      if (error.message.includes("fetch failed")) {
        return {
          error:
            "Could not connect to the AI service. Is 'npm run genkit:dev' running in another terminal?",
        };
      }
      return { error: error.message };
    }
    return { error: "An unknown error occurred." };
  }
}

export async function getAiPrebuiltSuggestions(input: AiPrebuiltAdvisorInput) {
  try {
    const result = await withTimeout(aiPrebuiltAdvisor(input));
    return result;
  } catch (error) {
    console.error("Error fetching AI prebuilt suggestions:", error);
    if (error instanceof Error) {
      if (error.message === "AI_TIMEOUT") {
        return { error: TIMEOUT_MESSAGE };
      }
      if (error.message.includes("fetch failed")) {
        return {
          error:
            "Could not connect to the AI service. Is 'npm run genkit:dev' running in another terminal?",
        };
      }
      return { error: error.message };
    }
    return { error: "An unknown error occurred." };
  }
}

export async function getAiBuildCritique(input: AiBuildCritiqueInput) {
  try {
    const result = await withTimeout(aiBuildCritiqueAction(input));
    return result;
  } catch (error) {
    console.error("Error fetching AI build critique:", error);
    if (error instanceof Error) {
      if (error.message === "AI_TIMEOUT") {
        return { error: TIMEOUT_MESSAGE };
      }
      if (error.message.includes("fetch failed")) {
        return {
          error:
            "Could not connect to the AI service. Is 'npm run genkit:dev' running in another terminal?",
        };
      }
      if (error.message.includes("GOOGLE_API_KEY") || error.message.includes("GEMINI_API_KEY") || error.message.includes("FAILED_PRECONDITION")) {
        return {
          error: "Missing API Key. Please set GOOGLE_API_KEY in your .env file to enable AI features.",
        };
      }
      return { error: error.message };
    }
    return { error: "An unknown error occurred." };
  }
}

export async function getAiSmartBudget(input: AiSmartBudgetInput) {
  try {
    const result = await withTimeout(aiSmartBudgetAction(input));
    return result;
  } catch (error) {
    console.error("Error fetching AI smart budget:", error);
    if (error instanceof Error) {
      if (error.message === "AI_TIMEOUT") {
        return { error: TIMEOUT_MESSAGE };
      }
      if (error.message.includes("fetch failed")) {
        return {
          error:
            "Could not connect to the AI service. Is 'npm run genkit:dev' running in another terminal?",
        };
      }
      if (error.message.includes("GOOGLE_API_KEY") || error.message.includes("GEMINI_API_KEY") || error.message.includes("FAILED_PRECONDITION")) {
        return {
          error: "Missing API Key. Please set GOOGLE_API_KEY in your .env file to enable AI features.",
        };
      }
      return { error: error.message };
    }
    return { error: "An unknown error occurred." };
  }
}

