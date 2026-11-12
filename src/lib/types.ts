
import type { AiBuildAdvisorRecommendationsOutput } from "@/ai/schemas/build-advisor-schemas";

export type Resolution = '1080p' | '1440p' | '4K';
export type WorkloadType = 'Esports' | 'AAA' | 'VideoEditing' | 'Rendering' | 'Office' | 'Balanced';

export type ComponentData = {
  id: string;
  isExternal?: boolean;
  isIntegratedGraphics?: boolean;
  sourceCpuId?: string;
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
  performanceTier?: number;
  performanceScore?: number;
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
  performanceTier?: number;
  performanceScore?: number;
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

export interface PrebuiltComponentSummary {
  key: string;
  category: Part['category'];
  partId: string;
  productId: string | null;
  name: string;
  price: number;
  imageUrl: string;
  inStock: boolean;
  isArchived: boolean;
}

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
  componentSummaries?: PrebuiltComponentSummary[];
  componentPartIds?: string[];
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
  addressBook?: SavedAddress[];
  isManager: boolean;
  isSuperAdmin?: boolean;
  createdAt?: any;
};

export type OrderItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  productId?: string;
  quantity?: number;
  imageUrl?: string;
  lineTotal?: number;
  groupName?: string;
  buildType?: "custom-build" | "prebuilt" | "part" | "additional";
  prebuiltName?: string;
  lineId?: string;
  rigInstanceId?: string;
};

export type Order = {
  id: string;
  orderNumber?: string;
  userId: string;
  userEmail: string;
  items: OrderItem[];
  subtotal?: number;
  shippingFee?: number;
  protectionFee?: number;
  discountAmount?: number;
  voucherCode?: string;
  totalPrice: number;
  status: 'pending' | 'building' | 'finished building' | 'cancelled';
  workflowRevision?: number;
  fulfillmentStage?: OrderFulfillmentStage;
  queueStage?: OrderFulfillmentStage | 'cancelled';
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paymentReference?: string;
  paidAt?: any;
  paymentAttempts?: number;
  holdExpiresAt?:
    | { toDate?: () => Date; seconds?: number; nanoseconds?: number }
    | Date
    | string
    | null;
  paymongoCheckoutSessionId?: string;
  paymongoCheckoutUrl?: string;
  paymongoMode?: "live_test_api" | "local_sandbox_fallback";
  paymongoPaymentId?: string;
  refundStatus?: 'none' | 'due' | 'pending' | 'partial' | 'refunded';
  refundedAmount?: number;
  refunds?: OrderRefund[];
  pendingRefundOperationId?: string;
  pendingPaymongoRefundId?: string;
  stockState?: OrderStockState;
  stockRestoredAt?: unknown;
  paymentHistory?: OrderPaymentEvent[];
  shippingMethod?: ShippingMethod;
  shippingAddress?: OrderShippingAddress;
  includeCrateProtection?: boolean;
  isArchived?: boolean;
  archivedAt?: unknown;
  archivedBy?: string;
  type?: 'prebuilt' | 'custom';
  prebuiltId?: string;
  prebuiltName?: string;
  prebuiltTier?: PrebuiltSystem['tier'];
  cancellationReason?: string;
  cancelledAt?: any;
  autoCancelled?: boolean;
  assemblyVerificationPassed?: boolean;
  legacyAssemblyReviewed?: boolean;
  physicalReturnRequired?: boolean;
  physicalReturnConfirmedAt?: unknown;
  physicalReturnConfirmedBy?: string;
  stockExceptions?: Array<{ path: string; quantity: number }>;
  createdAt: any;
  updatedAt?: any;
};

export type OrderFulfillmentStage =
  | 'order_placed'
  | 'assembling_testing'
  | 'out_for_delivery'
  | 'delivered';

export type OrderStockState = 'reserved' | 'restored' | 'pending_return' | 'restored_with_exceptions';

export type OrderRefundDestination =
  | 'original_payment_method'
  | 'gcash'
  | 'bank_transfer'
  | 'cash'
  | 'store_credit';

export type OrderRefundResultStatus = 'succeeded' | 'pending' | 'failed';

export type OrderRefund = {
  id: string;
  amount: number;
  method: 'manual' | 'paymongo';
  destination?: OrderRefundDestination;
  reason: string;
  reference: string;
  proofUrl?: string;
  actorId: string;
  actorName: string;
  actorRole?: 'Manager' | 'Super Admin';
  status?: OrderRefundResultStatus;
  createdAt: unknown;
};

export type OrderPaymentEvent = {
  kind?: 'collection' | 'correction' | 'verification';
  relatedEventId?: string;
  id: string;
  status: PaymentStatus;
  method: PaymentMethod;
  reference?: string;
  amount?: number;
  actorId?: string;
  actorName: string;
  actorRole: 'Customer' | 'Manager' | 'Super Admin' | 'Webhook' | 'System';
  note?: string;
  createdAt: unknown;
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
  createdAt: any;
};

export type SystemNotification = {
  id: string;
  type: 'reservation_received' | 'item_archived' | 'status_changed' | 'user_cancelled' | 'order_auto_cancelled' | 'stock_added' | 'contact_inquiry' | 'contact_reply_received';
  actorId: string;
  actorName: string;
  title: string;
  message: string;
  targetId: string;
  readBy: string[];
  createdAt: any;
};

export type AuditLog = {
  id: string;
  actionName:
    | 'created'
    | 'updated'
    | 'deleted'
    | 'archived'
    | 'restored'
    | 'status_changed'
    | 'payment_updated'
    | 'refunded'
    | 'auth_update'
    | 'auto_cancelled'
    | 'other';
  actorId: string;
  actorName: string;
  actorEmail?: string;
  scope: import('./audit-scopes').StaffAuditScope;
  resourceName: string;
  resourceId?: string;
  details?: string;
  createdAt: any;
};

export type UserAuditLog = {
  id: string;
  userId: string;
  userEmail?: string;
  actionName: 'created' | 'updated' | 'deleted' | 'restored' | 'status_changed' | 'auth_update' | 'auto_cancelled' | 'other';
  scope: import('./audit-scopes').CustomerAuditScope;
  resourceName: string;
  resourceId?: string;
  details?: string;
  createdAt: any;
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
  createdAt: any;
  loadContext?: {
    type: 'prebuilt' | 'advisor';
    systemName: string;
    unavailableParts: string[];
  };
};

export type SavedAddress = {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  email: string;
  region: string;
  city: string;
  barangay: string;
  streetAddress: string;
  postalCode: string;
  notes?: string;
  isDefault?: boolean;
  createdAt?: string;
};

export type PaymentMethod =
  | 'cod'
  | 'gcash_simulated'
  | 'paymongo_simulated'
  | 'card_simulated';

export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'failed' | 'cancelled';

export type SimulatedPaymentOutcome = 'success' | 'failed' | 'cancelled';

export type ShippingMethod = 'standard_courier' | 'sameday_express' | 'store_pickup';

export type OrderShippingAddress = {
  fullName: string;
  phone: string;
  email: string;
  region: string;
  city: string;
  barangay: string;
  streetAddress: string;
  postalCode: string;
  notes?: string;
};
