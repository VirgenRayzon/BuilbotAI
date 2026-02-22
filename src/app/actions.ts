"use server";

import {
  aiBuildAdvisorRecommendations,
  type AiBuildAdvisorRecommendationsInput,
} from "@/ai/flows/ai-build-advisor-recommendations";

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
