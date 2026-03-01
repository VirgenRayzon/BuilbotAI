
import type { AiBuildAdvisorRecommendationsOutput } from "@/ai/flows/ai-build-advisor-recommendations";

export type Resolution = '1080p' | '1440p' | '4K';
export type WorkloadType = 'Esports' | 'AAA' | 'Balanced';

export type ComponentData = {
  id: string;
  model: string;
  description: string;
  price: number;
  usdSrp?: number;
  image: string;
  imageHint: string;
  icon: React.ComponentType<{ className?: string }>;
  wattage?: number;
  socket?: string;
  ramType?: string;
  performanceTier?: number; // 1-4 (Entry=1, Mid=2, High=3, Enthusiast=4)
  performanceScore?: number; // 0-100 (preferred — used for tier fallback)
  dimensions?: {
    width: number;
    height: number;
    depth: number;
  };
  specifications?: Record<string, string | number>;
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

export type Part = {
  id: string;
  name: string;
  category: 'CPU' | 'GPU' | 'Motherboard' | 'RAM' | 'Storage' | 'PSU' | 'Case' | 'Cooler';
  brand: string;
  price: number;
  usdSrp?: number;
  stock: number;
  imageUrl: string;
  specifications: Record<string, string | number>;
  wattage?: number;
  performanceTier?: number; // 1-4 (Entry=1, Mid=2, High=3, Enthusiast=4)
  performanceScore?: number; // 0-100 (preferred — used for tier fallback)
  socket?: string;
  ramType?: string;
  dimensions?: {
    width: number;
    height: number;
    depth: number;
  };
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

export type UserProfile = {
  id: string;
  email: string;
  isAdmin: boolean;
};

export type OrderItem = {
  id: string;
  name: string;
  category: string;
  price: number;
};

export type Order = {
  id: string;
  userId: string;
  userEmail: string;
  items: OrderItem[];
  totalPrice: number;
  createdAt: any; // Firestore Timestamp
};

export type PopularityMetrics = {
  partId: string;
  name: string;
  category: string;
  purchaseCount: number;
};
