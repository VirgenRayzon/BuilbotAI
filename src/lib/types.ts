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

export type PartSpecification = {
  key: string;
  value: string;
};

export type Part = {
  id: string;
  name: string;
  category: 'CPU' | 'GPU' | 'Motherboard' | 'RAM' | 'Storage' | 'PSU' | 'Case' | 'Cooler';
  brand: string;
  price: number;
  stock: number;
  imageUrl: string;
  specifications: PartSpecification[];
};

export type PrebuiltSystem = {
  id: string;
  name: string;
  tier: 'Entry' | 'Mid-Range' | 'High-End' | 'Workstation';
  description?: string;
  price: number;
  imageUrl: string;
  components: {
    cpu?: string;
    gpu?: string;
    motherboard?: string;
    ram?: string;
    storage?: string;
    psu?: string;
    case?: string;
    cooler?: string;
  };
};
