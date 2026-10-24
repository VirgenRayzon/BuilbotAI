/**
 * types — Central TypeScript type definitions for the Buildbot AI platform.
 * Defines: Part, PrebuiltSystem, ComponentData, Build, Order, UserProfile,
 * Notification, SystemNotification, and related domain types.
 */

import type { AiBuildAdvisorRecommendationsOutput } from "@/ai/schemas/build-advisor-schemas";

export type Resolution = '1080p' | '1440p' | '4K';
export type WorkloadType = 'Esports' | 'AAA' | 'Balanced';

export type ComponentData = {
  id: string;
  isExternal?: boolean;
  model: string;
  description: string;
  price: number;
  usdSrp?: number;
  image: string;
  images?: string[];
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
  cpu: ComponentData | null;
  gpu: ComponentData | null;
  motherboard: ComponentData | null;
  ram: ComponentData | null;
  storage: ComponentData | null;
  psu: ComponentData | null;
  case: ComponentData | null;
  cooler: ComponentData | null;
  estimatedWattage?: string;
};

export type AdvisorWebResearchInfo = {
  searchedAt: string;
  sources: { title: string; url: string }[];
  searchSuggestionHtml?: string;
};

export type AiRecommendation = AiBuildAdvisorRecommendationsOutput;

export type Part = {
  productId?: string;
  sku?: string;
  qrToken?: string;
  id: string;
  name: string;
  category: 'CPU' | 'GPU' | 'Motherboard' | 'RAM' | 'Storage' | 'PSU' | 'Case' | 'Cooler' | 'Monitor' | 'Keyboard' | 'Mouse' | 'Headset';
  brand: string;
  price: number;
  popularity?: number;
  usdSrp?: number;
  stock: number;
  imageUrl: string;
  images?: string[];
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
  description?: string;
  packageType?: 'TRAY' | 'BOX';
  createdAt?: any;
  isArchived?: boolean;
};

export type PrebuiltSystem = {
  productId?: string;
  sku?: string;
  qrToken?: string;
  id: string;
  name: string;
  tier: 'Entry' | 'Mid-Range' | 'High-End' | 'Workstation';
  description?: string;
  price: number;
  imageUrl: string;
  images?: string[];
  components: {
    cpu?: string;
    gpu?: string;
    motherboard?: string;
    ram?: string[];
    storage?: string[];
    psu?: string;
    case?: string;
    cooler?: string;
  };
  aiReport?: any;
  createdAt?: any;
  isArchived?: boolean;
};

export type UserProfile = {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  photoURL?: string;
  address?: string;
  apartment?: string;
  city?: string;
  state?: string;
  zip?: string;
  isManager: boolean;
  isSuperAdmin?: boolean;
  createdAt?: any;
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
  status: 'pending' | 'building' | 'finished building' | 'cancelled';
  isArchived?: boolean;
  archivedAt?: unknown;
  archivedBy?: string;
  type?: 'prebuilt' | 'custom';
  prebuiltId?: string;
  prebuiltName?: string;
  prebuiltTier?: PrebuiltSystem['tier'];
  createdAt: any; // Firestore Timestamp
};

export type PopularityMetrics = {
  partId: string;
  name: string;
  category: string;
  purchaseCount: number;
};

export type Notification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  orderId: string;
  targetId?: string;
  type?: 'support_reply' | 'support_status';
  read: boolean;
  createdAt: any; // Firestore Timestamp
};
export type SystemNotification = {
  id: string;
  type: 'reservation_received' | 'item_archived' | 'status_changed' | 'user_cancelled' | 'stock_added' | 'contact_inquiry' | 'contact_reply_received';
  actorId: string;
  actorName: string;
  title: string;
  message: string;
  targetId: string; // part ID or order ID
  readBy: string[]; // List of user IDs who have seen it
  createdAt: any; // Firestore Timestamp
};

export type AuditLog = {
  id: string;
  actionName: 'created' | 'updated' | 'deleted' | 'archived' | 'restored' | 'status_changed' | 'auth_update' | 'other';
  actorId: string;
  actorName: string;
  actorEmail?: string;
  scope: 'Part' | 'Prebuilt' | 'Order' | 'User' | 'System';
  resourceName: string;
  resourceId?: string;
  details?: string;
  createdAt: any; // Firestore Timestamp
};

export type UserAuditLog = {
  id: string;
  userId: string;
  userEmail?: string;
  actionName: 'created' | 'updated' | 'deleted' | 'restored' | 'status_changed' | 'auth_update' | 'other';
  scope: 'Order' | 'Favorite' | 'Profile' | 'System';
  resourceName: string;
  resourceId?: string;
  details?: string;
  createdAt: any; // Firestore Timestamp
};

export type FavoriteBuildPart = {
  category: string;
  partId: string;
  name: string;
  price: number;
};

export type FavoriteBuild = {
  id: string;
  name: string;
  parts: FavoriteBuildPart[];
  totalPrice: number;
  source: 'builder' | 'advisor';
  createdAt: any; // Firestore Timestamp
  loadContext?: {
    type: 'prebuilt';
    systemName: string;
    unavailableParts: string[];
  };
};
