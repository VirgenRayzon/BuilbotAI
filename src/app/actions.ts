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
  aiSmartBudgetAction,
  type AiSmartBudgetInput,
} from "@/ai/flows/ai-smart-budget";

export async function getAiRecommendations(
  input: AiBuildAdvisorRecommendationsInput
) {
  try {
    const result = await aiBuildAdvisorRecommendations(input);
    return result;
  } catch (error) {
    console.error("Error fetching AI recommendations:", error);
    if (error instanceof Error) {
      if (error.message.includes("fetch failed")) {
        return {
          error:
            "Could not connect to the AI service. Is 'npm run genkit:dev' running in another terminal?",
        };
      }
      if (error.message.includes("GEMINI_API_KEY") || error.message.includes("FAILED_PRECONDITION")) {
        return {
          error: "Missing GEMINI_API_KEY. Please set it in your .env file to enable AI features.",
        };
      }
      return { error: error.message };
    }
    return { error: "An unknown error occurred." };
  }
}

export async function getAiPartDetails(input: ExtractPartDetailsInput) {
  try {
    const result = await extractPartDetails(input);
    return result;
  } catch (error) {
    console.error("Error fetching AI part details:", error);
    if (error instanceof Error) {
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
    const result = await aiPrebuiltAdvisor(input);
    return result;
  } catch (error) {
    console.error("Error fetching AI prebuilt suggestions:", error);
    if (error instanceof Error) {
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
    const result = await aiBuildCritiqueAction(input);
    return result;
  } catch (error) {
    console.error("Error fetching AI build critique:", error);
    if (error instanceof Error) {
      if (error.message.includes("fetch failed")) {
        return {
          error:
            "Could not connect to the AI service. Is 'npm run genkit:dev' running in another terminal?",
        };
      }
      if (error.message.includes("GEMINI_API_KEY") || error.message.includes("FAILED_PRECONDITION")) {
        return {
          error: "Missing GEMINI_API_KEY. Please set it in your .env file to enable AI features.",
        };
      }
      return { error: error.message };
    }
    return { error: "An unknown error occurred." };
  }
}

export async function getAiSmartBudget(input: AiSmartBudgetInput) {
  try {
    const result = await aiSmartBudgetAction(input);
    return result;
  } catch (error) {
    console.error("Error fetching AI smart budget:", error);
    if (error instanceof Error) {
      if (error.message.includes("fetch failed")) {
        return {
          error:
            "Could not connect to the AI service. Is 'npm run genkit:dev' running in another terminal?",
        };
      }
      if (error.message.includes("GEMINI_API_KEY") || error.message.includes("FAILED_PRECONDITION")) {
        return {
          error: "Missing GEMINI_API_KEY. Please set it in your .env file to enable AI features.",
        };
      }
      return { error: error.message };
    }
    return { error: "An unknown error occurred." };
  }
}
