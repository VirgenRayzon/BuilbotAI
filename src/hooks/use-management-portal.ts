'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { useAuth, useFirestore } from '@/firebase';
import { createAuditLog } from '@/firebase/audit';
import { useUserProfile } from '@/context/user-profile';
import { useToast } from '@/hooks/use-toast';
import {
  inspectManagedAccountAction,
  listManagedAccountsAction,
  purgeManagedUserAccountAction,
  resetManagedManagerKeyAction,
  revokeAccountSessionsAction,
  setAccountSuspensionAction,
  updateManagedAccountRoleAction,
} from '@/app/management-actions';
import type {
  AccountInspectionDetails,
  ManagedAccountSummary,
} from '@/lib/management-portal-types';

export type PortalStatusFilter = 'all' | 'active' | 'suspended';
export type PortalSortBy = 'Date Added' | 'Orders' | 'Total Spend' | 'Email';
export type PortalViewMode = 'grid' | 'table';

export interface PendingKeyRequest {
  id: string;
  userId?: string;
  email: string;
  role?: string;
  status?: string;
  requestedAt?: { toDate?: () => Date };
}

const PAGE_SIZE = 12;

export interface UseManagementPortalOptions {
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
}

export function useManagementPortal(options: UseManagementPortalOptions = {}) {
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  const { profile } = useUserProfile();

  const [managerKey, setManagerKey] = useState('');
  const [originalManagerDocId, setOriginalManagerDocId] = useState<string | null>(null);
  const [keyLoading, setKeyLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(false);

  const [requests, setRequests] = useState<PendingKeyRequest[]>([]);
  const [accounts, setAccounts] = useState<ManagedAccountSummary[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [roleSelection, setRoleSelection] = useState<{ manager: boolean; customer: boolean }>({
    manager: true,
    customer: true,
  });
  const [statusFilter, setStatusFilter] = useState<PortalStatusFilter>('all');
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const searchQuery = options.searchQuery ?? localSearchQuery;
  const setSearchQuery = options.onSearchQueryChange ?? setLocalSearchQuery;
  const [sortBy, setSortBy] = useState<PortalSortBy>('Date Added');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<PortalViewMode>('grid');
  const [page, setPage] = useState(1);

  const [inspectTarget, setInspectTarget] = useState<ManagedAccountSummary | null>(null);
  const [inspectionDetails, setInspectionDetails] = useState<AccountInspectionDetails | null>(null);
  const [inspectLoading, setInspectLoading] = useState(false);

  const [purgeTarget, setPurgeTarget] = useState<ManagedAccountSummary | null>(null);
  const [purgePreview, setPurgePreview] = useState<AccountInspectionDetails | null>(null);
  const [purgePreviewLoading, setPurgePreviewLoading] = useState(false);
  const [purging, setPurging] = useState(false);

  const getFreshToken = useCallback(async () => {
    if (!auth?.currentUser) throw new Error('Authentication required.');
    return auth.currentUser.getIdToken();
  }, [auth]);

  const fetchDefaultManagerKey = useCallback(async () => {
    if (!firestore) return;
    try {
      const snapshot = await getDocs(query(collection(firestore, 'authKeys')));
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.role === 'manager') {
          setManagerKey(docSnap.id);
          setOriginalManagerDocId(docSnap.id);
        }
      });
    } catch (err) {
      console.error('Error fetching manager auth key:', err);
      toast({
        title: 'Error loading access key',
        description: 'Could not read default manager key.',
        variant: 'destructive',
      });
    } finally {
      setKeyLoading(false);
    }
  }, [firestore, toast]);

  const refreshAccounts = useCallback(async () => {
    if (!auth?.currentUser || !profile?.isSuperAdmin) return;
    setAccountsLoading(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const result = await listManagedAccountsAction(token);
      if (result.error) {
        toast({
          title: 'Failed to load accounts',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        setAccounts(result.accounts);
      }
    } catch (err) {
      console.error('Error loading accounts:', err);
      toast({
        title: 'Failed to load accounts',
        description: 'Could not retrieve directory data.',
        variant: 'destructive',
      });
    } finally {
      setAccountsLoading(false);
    }
  }, [auth, profile?.isSuperAdmin, toast]);

  useEffect(() => {
    fetchDefaultManagerKey();
  }, [fetchDefaultManagerKey]);

  useEffect(() => {
    refreshAccounts();
  }, [refreshAccounts]);

  useEffect(() => {
    if (!firestore) return;
    const q = query(
      collection(firestore, 'keyRequests'),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const reqs: PendingKeyRequest[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<PendingKeyRequest, 'id'>),
        }));
        reqs.sort((a, b) => {
          const msA = a.requestedAt?.toDate ? a.requestedAt.toDate().getTime() : 0;
          const msB = b.requestedAt?.toDate ? b.requestedAt.toDate().getTime() : 0;
          return msB - msA;
        });
        setRequests(reqs);
      },
      (err) => {
        console.error('Error listening to key requests:', err);
      }
    );

    return () => unsubscribe();
  }, [firestore]);

  useEffect(() => {
    setPage(1);
  }, [roleSelection, statusFilter, searchQuery, sortBy, sortDirection]);

  const roleCategories = useMemo(
    () => [
      { name: 'Store Managers', selected: roleSelection.manager },
      { name: 'Customers', selected: roleSelection.customer },
    ],
    [roleSelection]
  );

  const handleRoleCategoryChange = useCallback(
    (categoryName: string, selected: boolean) => {
      if (categoryName === 'All') {
        const anyUnselected = !roleSelection.manager || !roleSelection.customer;
        setRoleSelection({ manager: anyUnselected, customer: anyUnselected });
      } else if (categoryName === 'Store Managers') {
        setRoleSelection((prev) => ({ ...prev, manager: selected }));
      } else if (categoryName === 'Customers') {
        setRoleSelection((prev) => ({ ...prev, customer: selected }));
      }
    },
    [roleSelection]
  );

  const clearRoleCategories = useCallback(() => {
    setRoleSelection({ manager: false, customer: false });
  }, []);

  const resetAllFilters = useCallback(() => {
    setRoleSelection({ manager: true, customer: true });
    setStatusFilter('all');
    setSortBy('Date Added');
    setSortDirection('desc');
    setSearchQuery('');
  }, [setSearchQuery]);

  const counts = useMemo(() => {
    let managers = 0;
    let keyedManagers = 0;
    let customers = 0;
    let customersWithOrders = 0;
    let suspended = 0;
    let totalOrders = 0;
    let totalSpendPhp = 0;
    let totalInquiries = 0;

    for (const acc of accounts) {
      if (acc.role === 'manager') {
        managers += 1;
        if (acc.activeManagerKey) keyedManagers += 1;
      } else {
        customers += 1;
        if (acc.orderCount > 0) customersWithOrders += 1;
      }
      if (acc.disabled) suspended += 1;
      totalOrders += acc.orderCount;
      totalSpendPhp += acc.totalSpentPhp;
      totalInquiries += acc.inquiryCount;
    }

    return {
      total: accounts.length,
      active: accounts.length - suspended,
      managers,
      keyedManagers,
      customers,
      customersWithOrders,
      suspended,
      pendingRequests: requests.length,
      totalOrders,
      totalSpendPhp,
      totalInquiries,
    };
  }, [accounts, requests.length]);

  const filteredAccounts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = accounts.filter((acc) => {
      if (acc.role === 'manager' && !roleSelection.manager) return false;
      if (acc.role === 'customer' && !roleSelection.customer) return false;
      if (statusFilter === 'active' && acc.disabled) return false;
      if (statusFilter === 'suspended' && !acc.disabled) return false;
      if (q) {
        const haystack = [
          acc.name,
          acc.email,
          acc.id,
          acc.activeManagerKey,
          ...acc.deprecatedKeys,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    const dir = sortDirection === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      if (sortBy === 'Orders') return (a.orderCount - b.orderCount) * dir;
      if (sortBy === 'Total Spend') return (a.totalSpentPhp - b.totalSpentPhp) * dir;
      if (sortBy === 'Email') return a.email.localeCompare(b.email) * dir;
      const msA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const msB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return (msA - msB) * dir;
    });

    return list;
  }, [accounts, roleSelection, statusFilter, searchQuery, sortBy, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filteredAccounts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedAccounts = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredAccounts.slice(start, start + PAGE_SIZE);
  }, [filteredAccounts, safePage]);

  const handleSaveDefaultManagerKey = async () => {
    if (!firestore) return;
    if (!managerKey.trim()) {
      toast({
        title: 'Invalid Key',
        description: 'Default manager access key cannot be empty.',
        variant: 'destructive',
      });
      return;
    }
    setSavingKey(true);
    try {
      if (originalManagerDocId && originalManagerDocId !== managerKey) {
        await deleteDoc(doc(firestore, 'authKeys', originalManagerDocId));
      }
      await setDoc(doc(firestore, 'authKeys', managerKey), { role: 'manager' });
      setOriginalManagerDocId(managerKey);
      toast({
        title: 'Access Key Updated',
        description: 'Default manager signup key saved.',
      });
    } catch (err) {
      console.error(err);
      toast({
        title: 'Update Failed',
        description: 'Could not update default manager key.',
        variant: 'destructive',
      });
    } finally {
      setSavingKey(false);
    }
  };

  const handleApproveRequest = async (request: PendingKeyRequest) => {
    if (!firestore) return;
    const newKey = Math.floor(10000000 + Math.random() * 90000000).toString();
    setActionLoadingId(request.id);
    try {
      const managerSnap = await getDocs(
        query(collection(firestore, 'users'), where('email', '==', request.email), limit(1))
      );

      if (!managerSnap.empty) {
        const managerDoc = managerSnap.docs[0];
        const managerData = managerDoc.data();
        const updates: {
          activeManagerKey: string;
          deprecatedKeys?: ReturnType<typeof arrayUnion>;
        } = {
          activeManagerKey: newKey,
        };
        if (managerData.activeManagerKey) {
          updates.deprecatedKeys = arrayUnion(managerData.activeManagerKey);
        }
        await updateDoc(doc(firestore, 'users', managerDoc.id), updates);
      }

      await updateDoc(doc(firestore, 'keyRequests', request.id), {
        status: 'approved',
        newKey,
        processedAt: serverTimestamp(),
      });

      await createAuditLog(firestore, {
        actionName: 'auth_update',
        actorId: profile?.id || 'unknown',
        actorName: profile?.name || profile?.email || 'Super Admin',
        actorEmail: profile?.email,
        scope: 'User',
        resourceName: request.email,
        details: 'Approved key reset request for manager',
      });

      toast({
        title: 'Request Approved',
        description: `New key for ${request.email}: ${newKey}`,
        duration: 10000,
      });
      await refreshAccounts();
    } catch (err) {
      console.error(err);
      toast({
        title: 'Approval Failed',
        description: 'Failed to approve key reset request.',
        variant: 'destructive',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!firestore) return;
    setActionLoadingId(requestId);
    try {
      await updateDoc(doc(firestore, 'keyRequests', requestId), {
        status: 'rejected',
        processedAt: serverTimestamp(),
      });
      toast({
        title: 'Request Rejected',
        description: 'The key reset request has been declined.',
      });
    } catch (err) {
      console.error(err);
      toast({
        title: 'Rejection Failed',
        description: 'Failed to reject key reset request.',
        variant: 'destructive',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResetManagerKey = async (account: ManagedAccountSummary) => {
    setActionLoadingId(account.id);
    try {
      const token = await getFreshToken();
      const res = await resetManagedManagerKeyAction({
        idToken: token,
        targetUid: account.id,
      });
      if (!res.success || !res.newKey) {
        toast({
          title: 'Key Reset Failed',
          description: res.error || 'Unable to reset key.',
          variant: 'destructive',
        });
        return;
      }
      toast({
        title: 'Manager Key Reset',
        description: `New key for ${account.email}: ${res.newKey}`,
        duration: 10000,
      });
      await refreshAccounts();
    } catch (err) {
      toast({
        title: 'Key Reset Failed',
        description: err instanceof Error ? err.message : 'Unexpected error.',
        variant: 'destructive',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleRole = async (account: ManagedAccountSummary) => {
    const nextRole = account.role === 'manager' ? 'customer' : 'manager';
    setActionLoadingId(account.id);
    try {
      const token = await getFreshToken();
      const res = await updateManagedAccountRoleAction({
        idToken: token,
        targetUid: account.id,
        nextRole,
      });
      if (!res.success) {
        toast({
          title: 'Role Update Failed',
          description: res.error || 'Could not update role.',
          variant: 'destructive',
        });
        return;
      }
      toast({
        title: nextRole === 'manager' ? 'Promoted to Store Manager' : 'Demoted to Customer',
        description:
          nextRole === 'manager' && res.newKey
            ? `${account.email} is now a Manager. Access Key: ${res.newKey}`
            : `${account.email} role updated and sessions refreshed.`,
        duration: 8000,
      });
      await refreshAccounts();
    } catch (err) {
      toast({
        title: 'Role Update Failed',
        description: err instanceof Error ? err.message : 'Unexpected error.',
        variant: 'destructive',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleSuspension = async (account: ManagedAccountSummary) => {
    const nextDisabled = !account.disabled;
    setActionLoadingId(account.id);
    try {
      const token = await getFreshToken();
      const res = await setAccountSuspensionAction({
        idToken: token,
        targetUid: account.id,
        disabled: nextDisabled,
      });
      if (!res.success) {
        toast({
          title: 'Status Update Failed',
          description: res.error || 'Could not change account status.',
          variant: 'destructive',
        });
        return;
      }
      toast({
        title: nextDisabled ? 'Account Suspended' : 'Account Restored',
        description: nextDisabled
          ? `${account.email} can no longer sign in.`
          : `${account.email} login access restored.`,
      });
      await refreshAccounts();
    } catch (err) {
      toast({
        title: 'Status Update Failed',
        description: err instanceof Error ? err.message : 'Unexpected error.',
        variant: 'destructive',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRevokeSessions = async (account: ManagedAccountSummary) => {
    setActionLoadingId(account.id);
    try {
      const token = await getFreshToken();
      const res = await revokeAccountSessionsAction({
        idToken: token,
        targetUid: account.id,
      });
      if (!res.success) {
        toast({
          title: 'Revocation Failed',
          description: res.error || 'Could not revoke sessions.',
          variant: 'destructive',
        });
        return;
      }
      toast({
        title: 'Sessions Revoked',
        description: `All active tokens for ${account.email} have been invalidated.`,
      });
    } catch (err) {
      toast({
        title: 'Revocation Failed',
        description: err instanceof Error ? err.message : 'Unexpected error.',
        variant: 'destructive',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const openInspector = async (account: ManagedAccountSummary) => {
    setInspectTarget(account);
    setInspectionDetails(null);
    setInspectLoading(true);
    try {
      const token = await getFreshToken();
      const res = await inspectManagedAccountAction({
        idToken: token,
        targetUid: account.id,
      });
      if (res.error || !res.details) {
        toast({
          title: 'Inspection Failed',
          description: res.error || 'Could not load account details.',
          variant: 'destructive',
        });
        setInspectTarget(null);
      } else {
        setInspectionDetails(res.details);
      }
    } catch (err) {
      toast({
        title: 'Inspection Failed',
        description: err instanceof Error ? err.message : 'Unexpected error.',
        variant: 'destructive',
      });
      setInspectTarget(null);
    } finally {
      setInspectLoading(false);
    }
  };

  const closeInspector = () => {
    setInspectTarget(null);
    setInspectionDetails(null);
  };

  const openPurgeModal = async (account: ManagedAccountSummary) => {
    setPurgeTarget(account);
    setPurgePreview(null);
    setPurgePreviewLoading(true);
    try {
      const token = await getFreshToken();
      const res = await inspectManagedAccountAction({
        idToken: token,
        targetUid: account.id,
      });
      if (res.details) {
        setPurgePreview(res.details);
      }
    } catch {
      // Allow modal to remain open even if preview fails; purge still works safely server-side
    } finally {
      setPurgePreviewLoading(false);
    }
  };

  const closePurgeModal = () => {
    if (purging) return;
    setPurgeTarget(null);
    setPurgePreview(null);
  };

  const confirmPurge = async () => {
    if (!purgeTarget) return;
    setPurging(true);
    try {
      const token = await getFreshToken();
      const res = await purgeManagedUserAccountAction({
        idToken: token,
        targetUid: purgeTarget.id,
      });
      if (!res.success) {
        toast({
          title: 'Account Purge Failed',
          description: res.error || 'Unable to purge account.',
          variant: 'destructive',
        });
        return;
      }

      const s = res.summary;
      toast({
        title: 'Account Permanently Purged',
        description: s
          ? `Removed ${purgeTarget.email || purgeTarget.id}: ${s.deletedOrders} orders (${s.restoredStockUnits} stock restored), ${s.deletedInquiries} inquiries, ${s.deletedFavorites} builds.`
          : `Removed ${purgeTarget.email || purgeTarget.id} and all associated records.`,
        duration: 9000,
      });

      setPurgeTarget(null);
      setPurgePreview(null);
      if (inspectTarget?.id === purgeTarget.id) {
        closeInspector();
      }
      await refreshAccounts();
    } catch (err) {
      toast({
        title: 'Account Purge Failed',
        description: err instanceof Error ? err.message : 'Unexpected error.',
        variant: 'destructive',
      });
    } finally {
      setPurging(false);
    }
  };

  const handleExportAccounts = () => {
    const rows = filteredAccounts.map((acc) => ({
      UID: acc.id,
      Name: acc.name,
      Email: acc.email,
      Role: acc.role === 'manager' ? 'Store Manager' : 'Customer',
      Status: acc.disabled ? 'Suspended' : 'Active',
      Orders: acc.orderCount,
      ActiveOrders: acc.activeOrderCount,
      TotalSpentPHP: acc.totalSpentPhp,
      SupportInquiries: acc.inquiryCount,
      ActiveManagerKey: acc.activeManagerKey || '',
      CreatedAt: acc.createdAt || '',
      LastSignIn: acc.lastSignInTime || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Accounts');
    const dateStamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `buildbot-accounts-${dateStamp}.xlsx`);
    toast({
      title: 'Directory Exported',
      description: `Exported ${rows.length} account(s) to Excel.`,
    });
  };

  return {
    keyLoading,
    managerKey,
    setManagerKey,
    originalManagerDocId,
    savingKey,
    handleSaveDefaultManagerKey,
    requests,
    handleApproveRequest,
    handleRejectRequest,
    accountsLoading,
    accounts,
    counts,
    filteredAccounts,
    paginatedAccounts,
    roleCategories,
    handleRoleCategoryChange,
    clearRoleCategories,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    viewMode,
    setViewMode,
    resetAllFilters,
    page: safePage,
    totalPages,
    setPage,
    actionLoadingId,
    refreshAccounts,
    handleResetManagerKey,
    handleToggleRole,
    handleToggleSuspension,
    handleRevokeSessions,
    handleExportAccounts,
    inspectTarget,
    inspectionDetails,
    inspectLoading,
    openInspector,
    closeInspector,
    purgeTarget,
    purgePreview,
    purgePreviewLoading,
    purging,
    openPurgeModal,
    closePurgeModal,
    confirmPurge,
  };
}
