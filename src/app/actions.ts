"use server";

import {
  aiBuildAdvisorRecommendations,
  type AiBuildAdvisorRecommendationsInput,
} from "@/ai/flows/ai-build-advisor-recommendations";
import {
  extractPartDetails,
  type ExtractPartDetailsInput,
} from "@/ai/flows/extract-part-details";

export async function getAiRecommendations(
  input: AiBuildAdvisorRecommendationsInput
) {
  try {
    const result = await aiBuildAdvisorRecommendations(input);
    return result;
  } catch (error) {
    console.error("Error fetching AI recommendations:", error);
    return null;
  }
}

export async function getAiPartDetails(input: ExtractPartDetailsInput) {
  try {
    const result = await extractPartDetails(input);
    return result;
  } catch (error) {
    console.error("Error fetching AI part details:", error);
    return null;
  }
}
