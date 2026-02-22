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
  storage: ComponentData;
  psu: ComponentData;
  case: ComponentData;
  cooler: ComponentData;
  estimatedWattage: string;
};

export type AiRecommendation = AiBuildAdvisorRecommendationsOutput;
