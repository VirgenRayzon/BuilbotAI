export type ManagedAccountRole = 'manager' | 'customer';

export interface ManagedAccountSummary {
  id: string;
  email: string;
  name: string;
  photoURL?: string;
  role: ManagedAccountRole;
  disabled: boolean;
  activeManagerKey: string;
  deprecatedKeys: string[];
  createdAt: string | null;
  lastSignInTime: string | null;
  orderCount: number;
  activeOrderCount: number;
  totalSpentPhp: number;
  inquiryCount: number;
  hasAuthAccount: boolean;
}

export interface AccountInspectionOrderItem {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalPrice: number;
  createdAt: string | null;
  itemCount: number;
}

export interface AccountInspectionDetails {
  account: ManagedAccountSummary;
  phoneOrAddress: string | null;
  savedAddressCount: number;
  favoritesCount: number;
  notificationsCount: number;
  userAuditLogCount: number;
  completedOrderCount: number;
  cancelledOrderCount: number;
  messageCount: number;
  keyRequestCount: number;
  recentOrders: AccountInspectionOrderItem[];
}

export interface AccountPurgeSummary {
  deletedOrders: number;
  restoredStockUnits: number;
  deletedInquiries: number;
  deletedMessages: number;
  deletedFavorites: number;
  deletedNotifications: number;
  deletedAuditLogs: number;
  deletedKeyRequests: number;
  authDeleted: boolean;
}

export interface AccountPurgeResult {
  success: boolean;
  error?: string;
  summary?: AccountPurgeSummary;
}

