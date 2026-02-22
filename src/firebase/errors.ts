
'use client';

export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
  public context: SecurityRuleContext;
  public source: 'server' | 'client';

  constructor(context: SecurityRuleContext, source: 'server' | 'client' = 'server') {
    const { path, operation } = context;
    const message = `FirestorePermissionError: Missing or insufficient permissions.
    The following request was denied by Firestore security rules:
    - Path: ${path}
    - Operation: ${operation}`;
    
    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;
    this.source = source;
  }
}
