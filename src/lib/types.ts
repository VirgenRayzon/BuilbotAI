import type { AiBuildAdvisorRecommendationsOutput } from "@/ai/flows/ai-build-advisor-recommendations";

export type ComponentData = {
  model: string;
  description: string;
  price: number;
  image: string;
  imageHint: string;
  icon: React.ComponentType<{ className?: string }>;
};

export type Build = {
  summary: string;
  cpu: ComponentData;
  gpu: ComponentData;
  motherboard: ComponentData;
  ram: ComponentData;
};

export type AiRecommendation = AiBuildAdvisorRecommendationsOutput;
