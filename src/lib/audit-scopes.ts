export const STAFF_AUDIT_SCOPES = [
  { value: 'Part', label: 'Inventory Parts' },
  { value: 'Prebuilt', label: 'Prebuilts' },
  { value: 'Order', label: 'Orders' },
  { value: 'User', label: 'Users' },
  { value: 'System', label: 'System' },
] as const;

export const CUSTOMER_AUDIT_SCOPES = [
  { value: 'Order', label: 'Orders' },
  { value: 'Favorite', label: 'Favorites' },
  { value: 'Profile', label: 'Profile' },
  { value: 'System', label: 'System' },
] as const;

export type StaffAuditScope = (typeof STAFF_AUDIT_SCOPES)[number]['value'];
export type CustomerAuditScope = (typeof CUSTOMER_AUDIT_SCOPES)[number]['value'];
