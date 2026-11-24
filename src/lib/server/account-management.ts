import * as admin from 'firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';
import type { UserRecord } from 'firebase-admin/auth';
import type { DocumentReference, Firestore } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminFirestore } from '@/firebase/server-init';
import { clearInventoryCache } from '@/lib/inventory-fetcher';
import { clearBuilderCatalogCache } from '@/lib/server/builder-catalog';
import { bumpCatalogMetaVersion } from '@/lib/server/catalog-meta-store';
import {
  applyOrderStockRestore,
  prepareOrderStockRestore,
} from '@/lib/server/order-expiration-sweep';
import { invalidatePublicPartsCatalog } from '@/lib/server/public-products';
import { computeExpiresAt } from '@/lib/ttl-policies';
import type { Order } from '@/lib/types';
import type {
  AccountInspectionDetails,
  AccountInspectionOrderItem,
  AccountPurgeResult,
  AccountPurgeSummary,
  ManagedAccountRole,
  ManagedAccountSummary,
} from '@/lib/management-portal-types';

interface SuperAdminActor {
  decoded: DecodedIdToken;
  firestore: Firestore;
  adminAuth: admin.auth.Auth;
  actorName: string;
  actorEmail: string;
}

function toIsoStringSafe(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  if (typeof value === 'object') {
    const maybeTimestamp = value as { toDate?: () => Date; seconds?: number };
    if (typeof maybeTimestamp.toDate === 'function') {
      const d = maybeTimestamp.toDate();
      return Number.isNaN(d.getTime()) ? null : d.toISOString();
    }
    if (typeof maybeTimestamp.seconds === 'number') {
      return new Date(maybeTimestamp.seconds * 1000).toISOString();
    }
  }
  return null;
}

function isSuperAdminAccount(
  userRecord: UserRecord | null,
  profileData: Record<string, unknown> | undefined
): boolean {
  const normalizedRole = String(
    profileData?.role ?? profileData?.accountType ?? ''
  ).toLowerCase();

  return Boolean(
    userRecord?.customClaims?.isSuperAdmin === true ||
      profileData?.isSuperAdmin === true ||
      normalizedRole === 'superadmin' ||
      normalizedRole === 'super_admin'
  );
}

function isManagerAccount(
  userRecord: UserRecord | null,
  profileData: Record<string, unknown> | undefined,
  knownManagerIds: Set<string>,
  knownManagerEmails: Set<string>,
  uid: string
): boolean {
  const normalizedRole = String(
    profileData?.role ?? profileData?.accountType ?? ''
  ).toLowerCase();
  const hasManagerKeyHistory =
    (typeof profileData?.activeManagerKey === 'string' &&
      profileData.activeManagerKey.trim().length > 0) ||
    (Array.isArray(profileData?.deprecatedKeys) &&
      profileData.deprecatedKeys.length > 0);
  const email = String(profileData?.email ?? userRecord?.email ?? '').toLowerCase();

  return Boolean(
    userRecord?.customClaims?.isManager === true ||
      profileData?.isManager === true ||
      profileData?.isAdmin === true ||
      normalizedRole === 'manager' ||
      hasManagerKeyHistory ||
      knownManagerIds.has(uid) ||
      (email && knownManagerEmails.has(email))
  );
}

async function requireSuperAdminActor(idToken: string): Promise<SuperAdminActor> {
  const adminAuth = getAdminAuth();
  const firestore = getAdminFirestore();
  const decoded = await adminAuth.verifyIdToken(idToken, true);
  const profileSnap = await firestore.collection('users').doc(decoded.uid).get();
  const profileData = profileSnap.data() as Record<string, unknown> | undefined;

  const isSuper =
    decoded.isSuperAdmin === true || profileData?.isSuperAdmin === true;

  if (!isSuper) {
    throw new Error('Super administrator access is required.');
  }

  return {
    decoded,
    firestore,
    adminAuth,
    actorName:
      String(profileData?.name || decoded.name || profileData?.email || decoded.email || 'Super Admin'),
    actorEmail: String(profileData?.email || decoded.email || ''),
  };
}

async function writeSuperAdminAuditLog(
  firestore: Firestore,
  actor: SuperAdminActor,
  params: {
    actionName: 'auth_update' | 'deleted' | 'updated';
    resourceName: string;
    resourceId?: string;
    details: string;
  }
): Promise<void> {
  const auditRef = firestore.collection('auditLogs').doc();
  const now = admin.firestore.Timestamp.now();
  await auditRef.set({
    id: auditRef.id,
    actionName: params.actionName,
    actorId: actor.decoded.uid,
    actorName: actor.actorName,
    actorEmail: actor.actorEmail,
    scope: 'User',
    resourceName: params.resourceName,
    resourceId: params.resourceId || '',
    details: params.details,
    createdAt: now,
    expiresAt: admin.firestore.Timestamp.fromDate(computeExpiresAt('auditLogs')),
  });
}

async function getKnownManagerSignals(firestore: Firestore): Promise<{
  knownManagerIds: Set<string>;
  knownManagerEmails: Set<string>;
}> {
  const staffNotificationSnapshot = await firestore
    .collection('system_notifications')
    .where('type', 'in', ['stock_added', 'status_changed', 'item_archived'])
    .get();

  const knownManagerIds = new Set<string>();
  const knownManagerEmails = new Set<string>();

  for (const notification of staffNotificationSnapshot.docs) {
    const data = notification.data();
    if (typeof data.actorId === 'string' && data.actorId.length > 0) {
      knownManagerIds.add(data.actorId);
    }
    const candidates = [data.actorName, data.message];
    for (const value of candidates) {
      if (typeof value !== 'string') continue;
      const email = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
      if (email) knownManagerEmails.add(email.toLowerCase());
    }
  }

  return { knownManagerIds, knownManagerEmails };
}

async function assertTargetMutable(
  actor: SuperAdminActor,
  targetUid: string,
  disallowSelf: boolean = true
): Promise<{
  userRecord: UserRecord | null;
  profileSnap: admin.firestore.DocumentSnapshot;
  profileData: Record<string, unknown> | undefined;
}> {
  if (!targetUid || targetUid.includes('/')) {
    throw new Error('Invalid target account ID.');
  }
  if (disallowSelf && targetUid === actor.decoded.uid) {
    throw new Error('You cannot perform this action on your own Super Admin account.');
  }

  let userRecord: UserRecord | null = null;
  try {
    userRecord = await actor.adminAuth.getUser(targetUid);
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code !== 'auth/user-not-found') throw err;
  }

  const profileSnap = await actor.firestore.collection('users').doc(targetUid).get();
  const profileData = profileSnap.data() as Record<string, unknown> | undefined;

  if (!userRecord && !profileSnap.exists) {
    throw new Error('Account not found.');
  }

  if (isSuperAdminAccount(userRecord, profileData)) {
    throw new Error('Super Admin accounts cannot be modified or purged from this portal.');
  }

  return { userRecord, profileSnap, profileData };
}

async function deleteDocRefsInChunks(
  firestore: Firestore,
  refs: DocumentReference[]
): Promise<number> {
  if (refs.length === 0) return 0;
  const uniqueRefs = new Map<string, DocumentReference>();
  for (const ref of refs) {
    uniqueRefs.set(ref.path, ref);
  }
  const deduped = Array.from(uniqueRefs.values());
  const chunkSize = 400;
  for (let i = 0; i < deduped.length; i += chunkSize) {
    const batch = firestore.batch();
    const slice = deduped.slice(i, i + chunkSize);
    for (const ref of slice) {
      batch.delete(ref);
    }
    await batch.commit();
  }
  return deduped.length;
}

export async function listManagedAccounts(
  idToken: string
): Promise<{ accounts: ManagedAccountSummary[]; error?: string }> {
  try {
    const actor = await requireSuperAdminActor(idToken);
    const { firestore, adminAuth } = actor;

    const [
      { knownManagerIds, knownManagerEmails },
      usersCollectionSnap,
      ordersSnap,
      inquiriesSnap,
    ] = await Promise.all([
      getKnownManagerSignals(firestore),
      firestore.collection('users').get(),
      firestore
        .collection('orders')
        .select('userId', 'userEmail', 'status', 'totalPrice')
        .get(),
      firestore
        .collection('contactInquiries')
        .select('userId', 'email', 'accountEmail')
        .get(),
    ]);

    const profileMap = new Map<string, Record<string, unknown>>();
    for (const docSnap of usersCollectionSnap.docs) {
      profileMap.set(docSnap.id, docSnap.data() as Record<string, unknown>);
    }

    const authUserMap = new Map<string, UserRecord>();
    let pageToken: string | undefined;
    do {
      const page = await adminAuth.listUsers(1000, pageToken);
      for (const user of page.users) {
        authUserMap.set(user.uid, user);
      }
      pageToken = page.pageToken;
    } while (pageToken);

    // Aggregate order metrics by userId and fallback email
    const orderStatsByUid = new Map<
      string,
      { orderCount: number; activeOrderCount: number; totalSpentPhp: number }
    >();
    const orderStatsByEmail = new Map<
      string,
      { orderCount: number; activeOrderCount: number; totalSpentPhp: number }
    >();

    for (const orderDoc of ordersSnap.docs) {
      const data = orderDoc.data();
      const uid = typeof data.userId === 'string' ? data.userId : '';
      const email = typeof data.userEmail === 'string' ? data.userEmail.toLowerCase() : '';
      const status = String(data.status || '');
      const totalPrice = Number(data.totalPrice || 0);
      const isActive = status === 'pending' || status === 'building';
      const spendIncrement = status !== 'cancelled' && Number.isFinite(totalPrice) ? totalPrice : 0;

      if (uid) {
        const curr = orderStatsByUid.get(uid) ?? {
          orderCount: 0,
          activeOrderCount: 0,
          totalSpentPhp: 0,
        };
        curr.orderCount += 1;
        if (isActive) curr.activeOrderCount += 1;
        curr.totalSpentPhp += spendIncrement;
        orderStatsByUid.set(uid, curr);
      } else if (email) {
        const curr = orderStatsByEmail.get(email) ?? {
          orderCount: 0,
          activeOrderCount: 0,
          totalSpentPhp: 0,
        };
        curr.orderCount += 1;
        if (isActive) curr.activeOrderCount += 1;
        curr.totalSpentPhp += spendIncrement;
        orderStatsByEmail.set(email, curr);
      }
    }

    const inquiryCountByUid = new Map<string, number>();
    const inquiryCountByEmail = new Map<string, number>();
    for (const inqDoc of inquiriesSnap.docs) {
      const data = inqDoc.data();
      const uid = typeof data.userId === 'string' ? data.userId : '';
      const email = String(data.accountEmail || data.email || '').toLowerCase();
      if (uid) {
        inquiryCountByUid.set(uid, (inquiryCountByUid.get(uid) ?? 0) + 1);
      } else if (email) {
        inquiryCountByEmail.set(email, (inquiryCountByEmail.get(email) ?? 0) + 1);
      }
    }

    const allUids = new Set<string>([...authUserMap.keys(), ...profileMap.keys()]);
    const accounts: ManagedAccountSummary[] = [];

    for (const uid of allUids) {
      const userRecord = authUserMap.get(uid) ?? null;
      const profile = profileMap.get(uid);

      if (isSuperAdminAccount(userRecord, profile)) {
        continue;
      }

      const isManager = isManagerAccount(
        userRecord,
        profile,
        knownManagerIds,
        knownManagerEmails,
        uid
      );
      const role: ManagedAccountRole = isManager ? 'manager' : 'customer';

      const email = String(profile?.email || userRecord?.email || '').trim();
      const lowerEmail = email.toLowerCase();
      const fullNameFromParts = [profile?.firstName, profile?.lastName]
        .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
        .join(' ');
      const name = String(
        profile?.name ||
          fullNameFromParts ||
          userRecord?.displayName ||
          (email ? email.split('@')[0] : 'Unnamed User')
      ).trim();

      const uidOrderStats = orderStatsByUid.get(uid);
      const emailOrderStats = lowerEmail ? orderStatsByEmail.get(lowerEmail) : undefined;
      const orderCount = (uidOrderStats?.orderCount ?? 0) + (emailOrderStats?.orderCount ?? 0);
      const activeOrderCount =
        (uidOrderStats?.activeOrderCount ?? 0) + (emailOrderStats?.activeOrderCount ?? 0);
      const totalSpentPhp =
        (uidOrderStats?.totalSpentPhp ?? 0) + (emailOrderStats?.totalSpentPhp ?? 0);

      const inquiryCount =
        (inquiryCountByUid.get(uid) ?? 0) +
        (lowerEmail ? inquiryCountByEmail.get(lowerEmail) ?? 0 : 0);

      accounts.push({
        id: uid,
        email,
        name,
        photoURL:
          typeof profile?.photoURL === 'string'
            ? profile.photoURL
            : userRecord?.photoURL || undefined,
        role,
        disabled: Boolean(userRecord?.disabled),
        activeManagerKey:
          typeof profile?.activeManagerKey === 'string' ? profile.activeManagerKey : '',
        deprecatedKeys: Array.isArray(profile?.deprecatedKeys)
          ? profile.deprecatedKeys.filter((k): k is string => typeof k === 'string')
          : [],
        createdAt:
          toIsoStringSafe(profile?.createdAt) ??
          toIsoStringSafe(userRecord?.metadata.creationTime),
        lastSignInTime: toIsoStringSafe(userRecord?.metadata.lastSignInTime),
        orderCount,
        activeOrderCount,
        totalSpentPhp,
        inquiryCount,
        hasAuthAccount: Boolean(userRecord),
      });
    }

    accounts.sort((a, b) => {
      if (a.role !== b.role) return a.role === 'manager' ? -1 : 1;
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    return { accounts };
  } catch (error: unknown) {
    console.error('[listManagedAccounts] Failed:', error);
    return {
      accounts: [],
      error: error instanceof Error ? error.message : 'Unable to load accounts.',
    };
  }
}

async function collectTargetOrders(
  firestore: Firestore,
  targetUid: string,
  targetEmail: string
): Promise<admin.firestore.QueryDocumentSnapshot[]> {
  const queries: Promise<admin.firestore.QuerySnapshot>[] = [
    firestore.collection('orders').where('userId', '==', targetUid).get(),
  ];
  if (targetEmail) {
    queries.push(
      firestore.collection('orders').where('userEmail', '==', targetEmail).get()
    );
  }
  const snapshots = await Promise.all(queries);
  const byId = new Map<string, admin.firestore.QueryDocumentSnapshot>();
  for (const snap of snapshots) {
    for (const docSnap of snap.docs) {
      byId.set(docSnap.id, docSnap);
    }
  }
  return Array.from(byId.values());
}

async function collectTargetInquiries(
  firestore: Firestore,
  targetUid: string,
  targetEmail: string
): Promise<admin.firestore.QueryDocumentSnapshot[]> {
  const queries: Promise<admin.firestore.QuerySnapshot>[] = [
    firestore.collection('contactInquiries').where('userId', '==', targetUid).get(),
  ];
  if (targetEmail) {
    queries.push(
      firestore.collection('contactInquiries').where('email', '==', targetEmail).get(),
      firestore
        .collection('contactInquiries')
        .where('accountEmail', '==', targetEmail)
        .get()
    );
  }
  const snapshots = await Promise.all(queries);
  const byId = new Map<string, admin.firestore.QueryDocumentSnapshot>();
  for (const snap of snapshots) {
    for (const docSnap of snap.docs) {
      byId.set(docSnap.id, docSnap);
    }
  }
  return Array.from(byId.values());
}

export async function getAccountInspectionDetails(
  idToken: string,
  targetUid: string
): Promise<{ details?: AccountInspectionDetails; error?: string }> {
  try {
    const actor = await requireSuperAdminActor(idToken);
    const { userRecord, profileData } = await assertTargetMutable(actor, targetUid, false);
    const { firestore } = actor;

    const targetEmail = String(profileData?.email || userRecord?.email || '').trim();
    const { knownManagerIds, knownManagerEmails } = await getKnownManagerSignals(firestore);
    const isManager = isManagerAccount(
      userRecord,
      profileData,
      knownManagerIds,
      knownManagerEmails,
      targetUid
    );

    const [
      orderDocs,
      inquiryDocs,
      favoritesSnap,
      userNotifsSnap,
      topNotifsSnap,
      userAuditSnap,
      keyReqByUidSnap,
      keyReqByEmailSnap,
    ] = await Promise.all([
      collectTargetOrders(firestore, targetUid, targetEmail),
      collectTargetInquiries(firestore, targetUid, targetEmail),
      firestore.collection('users').doc(targetUid).collection('favorites').get(),
      firestore.collection('users').doc(targetUid).collection('notifications').get(),
      firestore.collection('notifications').where('userId', '==', targetUid).get(),
      firestore.collection('user_auditLogs').where('userId', '==', targetUid).get(),
      firestore.collection('keyRequests').where('userId', '==', targetUid).get(),
      targetEmail
        ? firestore.collection('keyRequests').where('email', '==', targetEmail).get()
        : Promise.resolve(null),
    ]);

    let messageCount = 0;
    if (inquiryDocs.length > 0) {
      const msgSnaps = await Promise.all(
        inquiryDocs.map((docSnap) => docSnap.ref.collection('messages').get())
      );
      for (const snap of msgSnaps) {
        messageCount += snap.size;
      }
    }

    let activeOrderCount = 0;
    let completedOrderCount = 0;
    let cancelledOrderCount = 0;
    let totalSpentPhp = 0;

    const mappedOrders: AccountInspectionOrderItem[] = orderDocs.map((docSnap) => {
      const data = docSnap.data() as Order;
      const status = String(data.status || 'pending');
      const total = Number(data.totalPrice || 0);
      if (status === 'cancelled') {
        cancelledOrderCount += 1;
      } else {
        totalSpentPhp += Number.isFinite(total) ? total : 0;
        if (status === 'pending' || status === 'building') {
          activeOrderCount += 1;
        } else {
          completedOrderCount += 1;
        }
      }
      return {
        id: docSnap.id,
        orderNumber: data.orderNumber || docSnap.id.slice(0, 8).toUpperCase(),
        status,
        paymentStatus: String(data.paymentStatus || 'unpaid'),
        totalPrice: Number.isFinite(total) ? total : 0,
        createdAt: toIsoStringSafe(data.createdAt),
        itemCount: Array.isArray(data.items) ? data.items.length : 0,
      };
    });

    mappedOrders.sort((a, b) => {
      const msA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const msB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return msB - msA;
    });

    const keyReqIds = new Set<string>(keyReqByUidSnap.docs.map((d) => d.id));
    if (keyReqByEmailSnap) {
      for (const d of keyReqByEmailSnap.docs) keyReqIds.add(d.id);
    }

    const addressParts = [
      profileData?.address,
      profileData?.city,
      profileData?.state,
      profileData?.zip,
    ].filter((v): v is string => typeof v === 'string' && v.trim().length > 0);

    const fullNameFromParts = [profileData?.firstName, profileData?.lastName]
      .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
      .join(' ');

    const account: ManagedAccountSummary = {
      id: targetUid,
      email: targetEmail,
      name: String(
        profileData?.name ||
          fullNameFromParts ||
          userRecord?.displayName ||
          (targetEmail ? targetEmail.split('@')[0] : 'Unnamed User')
      ).trim(),
      photoURL:
        typeof profileData?.photoURL === 'string'
          ? profileData.photoURL
          : userRecord?.photoURL || undefined,
      role: isManager ? 'manager' : 'customer',
      disabled: Boolean(userRecord?.disabled),
      activeManagerKey:
        typeof profileData?.activeManagerKey === 'string'
          ? profileData.activeManagerKey
          : '',
      deprecatedKeys: Array.isArray(profileData?.deprecatedKeys)
        ? profileData.deprecatedKeys.filter((k): k is string => typeof k === 'string')
        : [],
      createdAt:
        toIsoStringSafe(profileData?.createdAt) ??
        toIsoStringSafe(userRecord?.metadata.creationTime),
      lastSignInTime: toIsoStringSafe(userRecord?.metadata.lastSignInTime),
      orderCount: mappedOrders.length,
      activeOrderCount,
      totalSpentPhp,
      inquiryCount: inquiryDocs.length,
      hasAuthAccount: Boolean(userRecord),
    };

    return {
      details: {
        account,
        phoneOrAddress: addressParts.length > 0 ? addressParts.join(', ') : null,
        savedAddressCount: Array.isArray(profileData?.addressBook)
          ? profileData.addressBook.length
          : 0,
        favoritesCount: favoritesSnap.size,
        notificationsCount: userNotifsSnap.size + topNotifsSnap.size,
        userAuditLogCount: userAuditSnap.size,
        completedOrderCount,
        cancelledOrderCount,
        messageCount,
        keyRequestCount: keyReqIds.size,
        recentOrders: mappedOrders.slice(0, 5),
      },
    };
  } catch (error: unknown) {
    console.error('[getAccountInspectionDetails] Failed:', error);
    return {
      error: error instanceof Error ? error.message : 'Unable to inspect account.',
    };
  }
}

export async function updateAccountRole(
  idToken: string,
  targetUid: string,
  nextRole: ManagedAccountRole
): Promise<{ success: boolean; newKey?: string; error?: string }> {
  try {
    const actor = await requireSuperAdminActor(idToken);
    const { userRecord, profileSnap, profileData } = await assertTargetMutable(
      actor,
      targetUid,
      true
    );
    const { firestore, adminAuth } = actor;
    const targetEmail = String(profileData?.email || userRecord?.email || targetUid);
    const nowIso = new Date().toISOString();

    if (nextRole === 'manager') {
      const newKey = Math.floor(10000000 + Math.random() * 90000000).toString();
      const userRef = firestore.collection('users').doc(targetUid);
      if (profileSnap.exists) {
        await userRef.update({
          isManager: true,
          isSuperAdmin: false,
          activeManagerKey: newKey,
          updatedAt: nowIso,
        });
      } else {
        await userRef.set({
          email: targetEmail,
          name: userRecord?.displayName || '',
          isManager: true,
          isSuperAdmin: false,
          activeManagerKey: newKey,
          createdAt: nowIso,
          updatedAt: nowIso,
        });
      }

      if (userRecord) {
        await adminAuth.setCustomUserClaims(targetUid, {
          isManager: true,
          isSuperAdmin: false,
        });
      }

      await writeSuperAdminAuditLog(firestore, actor, {
        actionName: 'auth_update',
        resourceName: targetEmail,
        resourceId: targetUid,
        details: 'Promoted customer account to Store Manager with generated access key.',
      });

      return { success: true, newKey };
    }

    // Demote to Customer
    const updates: Record<string, unknown> = {
      isManager: false,
      isAdmin: false,
      isSuperAdmin: false,
      activeManagerKey: admin.firestore.FieldValue.delete(),
      updatedAt: nowIso,
    };
    if (
      typeof profileData?.activeManagerKey === 'string' &&
      profileData.activeManagerKey.trim().length > 0
    ) {
      updates.deprecatedKeys = admin.firestore.FieldValue.arrayUnion(
        profileData.activeManagerKey
      );
    }

    if (profileSnap.exists) {
      await firestore.collection('users').doc(targetUid).update(updates);
    }

    if (userRecord) {
      await adminAuth.setCustomUserClaims(targetUid, {
        isManager: false,
        isSuperAdmin: false,
      });
      await adminAuth.revokeRefreshTokens(targetUid);
    }

    await writeSuperAdminAuditLog(firestore, actor, {
      actionName: 'auth_update',
      resourceName: targetEmail,
      resourceId: targetUid,
      details: 'Demoted Store Manager account to Verified Customer and revoked active sessions.',
    });

    return { success: true };
  } catch (error: unknown) {
    console.error('[updateAccountRole] Failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update account role.',
    };
  }
}

export async function resetManagerKeyServer(
  idToken: string,
  targetUid: string
): Promise<{ success: boolean; newKey?: string; error?: string }> {
  try {
    const actor = await requireSuperAdminActor(idToken);
    const { userRecord, profileSnap, profileData } = await assertTargetMutable(
      actor,
      targetUid,
      true
    );
    const { firestore } = actor;
    const targetEmail = String(profileData?.email || userRecord?.email || targetUid);
    const newKey = Math.floor(10000000 + Math.random() * 90000000).toString();
    const nowIso = new Date().toISOString();

    const updates: Record<string, unknown> = {
      isManager: true,
      activeManagerKey: newKey,
      updatedAt: nowIso,
    };

    if (
      typeof profileData?.activeManagerKey === 'string' &&
      profileData.activeManagerKey.trim().length > 0
    ) {
      updates.deprecatedKeys = admin.firestore.FieldValue.arrayUnion(
        profileData.activeManagerKey
      );
    }

    if (profileSnap.exists) {
      await firestore.collection('users').doc(targetUid).update(updates);
    } else {
      await firestore.collection('users').doc(targetUid).set({
        email: targetEmail,
        name: userRecord?.displayName || '',
        isManager: true,
        isSuperAdmin: false,
        activeManagerKey: newKey,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
    }

    await writeSuperAdminAuditLog(firestore, actor, {
      actionName: 'auth_update',
      resourceName: targetEmail,
      resourceId: targetUid,
      details: 'Super Admin reset manager access key.',
    });

    return { success: true, newKey };
  } catch (error: unknown) {
    console.error('[resetManagerKeyServer] Failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reset manager key.',
    };
  }
}

export async function setAccountSuspension(
  idToken: string,
  targetUid: string,
  disabled: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const actor = await requireSuperAdminActor(idToken);
    const { userRecord, profileData } = await assertTargetMutable(actor, targetUid, true);
    if (!userRecord) {
      return {
        success: false,
        error: 'This account has no Firebase Auth record to suspend or restore.',
      };
    }

    await actor.adminAuth.updateUser(targetUid, { disabled });
    if (disabled) {
      await actor.adminAuth.revokeRefreshTokens(targetUid);
    }

    const targetEmail = String(profileData?.email || userRecord.email || targetUid);
    await writeSuperAdminAuditLog(actor.firestore, actor, {
      actionName: 'auth_update',
      resourceName: targetEmail,
      resourceId: targetUid,
      details: disabled
        ? 'Suspended user account login and revoked active refresh tokens.'
        : 'Restored suspended user account login access.',
    });

    return { success: true };
  } catch (error: unknown) {
    console.error('[setAccountSuspension] Failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update account status.',
    };
  }
}

export async function revokeAccountSessions(
  idToken: string,
  targetUid: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const actor = await requireSuperAdminActor(idToken);
    const { userRecord, profileData } = await assertTargetMutable(actor, targetUid, true);
    if (!userRecord) {
      return {
        success: false,
        error: 'This account has no active Firebase Auth profile.',
      };
    }

    await actor.adminAuth.revokeRefreshTokens(targetUid);
    const targetEmail = String(profileData?.email || userRecord.email || targetUid);
    await writeSuperAdminAuditLog(actor.firestore, actor, {
      actionName: 'auth_update',
      resourceName: targetEmail,
      resourceId: targetUid,
      details: 'Forced sign-out by revoking all Firebase Auth refresh tokens.',
    });

    return { success: true };
  } catch (error: unknown) {
    console.error('[revokeAccountSessions] Failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to revoke user sessions.',
    };
  }
}

export async function purgeUserAccount(
  idToken: string,
  targetUid: string
): Promise<AccountPurgeResult> {
  try {
    const actor = await requireSuperAdminActor(idToken);
    const { userRecord, profileSnap, profileData } = await assertTargetMutable(
      actor,
      targetUid,
      true
    );
    const { firestore, adminAuth } = actor;
    const targetEmail = String(profileData?.email || userRecord?.email || '').trim();

    const summary: AccountPurgeSummary = {
      deletedOrders: 0,
      restoredStockUnits: 0,
      deletedInquiries: 0,
      deletedMessages: 0,
      deletedFavorites: 0,
      deletedNotifications: 0,
      deletedAuditLogs: 0,
      deletedKeyRequests: 0,
      authDeleted: false,
    };

    // 1. Collect all orders for user and restore reserved stock for active/unfulfilled orders
    const orderDocs = await collectTargetOrders(firestore, targetUid, targetEmail);
    const orderSubRefs: DocumentReference[] = [];
    const orderRootRefs: DocumentReference[] = [];

    for (const orderDoc of orderDocs) {
      const orderData = orderDoc.data() as Order;
      const shouldRestoreStock =
        (orderData.status === 'pending' || orderData.status === 'building') &&
        orderData.stockState !== 'restored' &&
        !orderData.stockRestoredAt;

      if (shouldRestoreStock) {
        await firestore.runTransaction(async (tx) => {
          const freshSnap = await tx.get(orderDoc.ref);
          if (!freshSnap.exists) return;
          const freshData = freshSnap.data() as Order;
          const prepared = await prepareOrderStockRestore(firestore, tx, freshData);
          const result = applyOrderStockRestore(tx, prepared);
          if (result.restored) {
            for (const entry of prepared.entries) {
              if (entry.snap.exists) {
                summary.restoredStockUnits += entry.quantity;
              }
            }
          }
        });
      }

      const [activitySnap, assemblySnap] = await Promise.all([
        orderDoc.ref.collection('activity').get(),
        orderDoc.ref.collection('assembly').get(),
      ]);
      for (const d of activitySnap.docs) orderSubRefs.push(d.ref);
      for (const d of assemblySnap.docs) orderSubRefs.push(d.ref);
      orderRootRefs.push(orderDoc.ref);
    }

    // Collect operational docs tied to these orders or targetUid
    const orderIds = orderDocs.map((d) => d.id);
    const operationalRefs: DocumentReference[] = [];
    const operationalCollections = [
      'reservationOperations',
      'orderWorkflowOperations',
      'orderRefundOperations',
      'orderRefundReceipts',
    ];
    for (const colName of operationalCollections) {
      const byUidSnap = await firestore
        .collection(colName)
        .where('userId', '==', targetUid)
        .get()
        .catch(() => null);
      if (byUidSnap) {
        for (const d of byUidSnap.docs) operationalRefs.push(d.ref);
      }
      for (let i = 0; i < orderIds.length; i += 10) {
        const chunk = orderIds.slice(i, i + 10);
        const byOrderSnap = await firestore
          .collection(colName)
          .where('orderId', 'in', chunk)
          .get()
          .catch(() => null);
        if (byOrderSnap) {
          for (const d of byOrderSnap.docs) operationalRefs.push(d.ref);
        }
      }
    }

    await deleteDocRefsInChunks(firestore, [
      ...orderSubRefs,
      ...operationalRefs,
    ]);
    summary.deletedOrders = await deleteDocRefsInChunks(firestore, orderRootRefs);

    if (summary.restoredStockUnits > 0) {
      clearBuilderCatalogCache();
      invalidatePublicPartsCatalog();
      clearInventoryCache();
      await bumpCatalogMetaVersion(firestore, { refreshFacets: true }).catch((err) =>
        console.warn('[purgeUserAccount] bumpCatalogMetaVersion warning:', err)
      );
    }

    // 2. Delete contact inquiries, nested messages, and mail aliases
    const inquiryDocs = await collectTargetInquiries(firestore, targetUid, targetEmail);
    const inquiryMessageRefs: DocumentReference[] = [];
    const inquiryRootRefs: DocumentReference[] = [];
    const aliasRefs: DocumentReference[] = [];

    for (const inqDoc of inquiryDocs) {
      const [messagesSnap, aliasesSnap] = await Promise.all([
        inqDoc.ref.collection('messages').get(),
        firestore
          .collection('contactMailAliases')
          .where('inquiryId', '==', inqDoc.id)
          .get()
          .catch(() => null),
      ]);
      for (const msgDoc of messagesSnap.docs) inquiryMessageRefs.push(msgDoc.ref);
      if (aliasesSnap) {
        for (const aliasDoc of aliasesSnap.docs) aliasRefs.push(aliasDoc.ref);
      }
      inquiryRootRefs.push(inqDoc.ref);
    }

    summary.deletedMessages = await deleteDocRefsInChunks(firestore, [
      ...inquiryMessageRefs,
      ...aliasRefs,
    ]);
    summary.deletedInquiries = await deleteDocRefsInChunks(firestore, inquiryRootRefs);

    // 3. Delete notifications, system_notifications, keyRequests, user_auditLogs, aiRateLimits
    const [
      topNotifsSnap,
      sysNotifsSnap,
      keyReqByUidSnap,
      keyReqByEmailSnap,
      userAuditByUidSnap,
      userAuditByEmailSnap,
      favoritesSnap,
      userNotifsSnap,
      rateLimitDoc,
    ] = await Promise.all([
      firestore.collection('notifications').where('userId', '==', targetUid).get(),
      firestore.collection('system_notifications').where('actorId', '==', targetUid).get(),
      firestore.collection('keyRequests').where('userId', '==', targetUid).get(),
      targetEmail
        ? firestore.collection('keyRequests').where('email', '==', targetEmail).get()
        : Promise.resolve(null),
      firestore.collection('user_auditLogs').where('userId', '==', targetUid).get(),
      targetEmail
        ? firestore.collection('user_auditLogs').where('userEmail', '==', targetEmail).get()
        : Promise.resolve(null),
      firestore.collection('users').doc(targetUid).collection('favorites').get(),
      firestore.collection('users').doc(targetUid).collection('notifications').get(),
      firestore.collection('aiRateLimits').doc(targetUid).get(),
    ]);

    summary.deletedFavorites = await deleteDocRefsInChunks(
      firestore,
      favoritesSnap.docs.map((d) => d.ref)
    );

    const notifRefs = [
      ...topNotifsSnap.docs.map((d) => d.ref),
      ...sysNotifsSnap.docs.map((d) => d.ref),
      ...userNotifsSnap.docs.map((d) => d.ref),
    ];
    summary.deletedNotifications = await deleteDocRefsInChunks(firestore, notifRefs);

    const keyRequestRefs = [
      ...keyReqByUidSnap.docs.map((d) => d.ref),
      ...(keyReqByEmailSnap ? keyReqByEmailSnap.docs.map((d) => d.ref) : []),
    ];
    summary.deletedKeyRequests = await deleteDocRefsInChunks(firestore, keyRequestRefs);

    const userAuditRefs = [
      ...userAuditByUidSnap.docs.map((d) => d.ref),
      ...(userAuditByEmailSnap ? userAuditByEmailSnap.docs.map((d) => d.ref) : []),
    ];
    summary.deletedAuditLogs = await deleteDocRefsInChunks(firestore, userAuditRefs);

    const cleanupRefs: DocumentReference[] = [];
    if (rateLimitDoc.exists) cleanupRefs.push(rateLimitDoc.ref);
    if (profileSnap.exists) cleanupRefs.push(profileSnap.ref);
    await deleteDocRefsInChunks(firestore, cleanupRefs);

    // 4. Delete Firebase Auth account
    if (userRecord) {
      try {
        await adminAuth.revokeRefreshTokens(targetUid);
      } catch {
        // Ignore if already invalidated or absent
      }
      try {
        await adminAuth.deleteUser(targetUid);
        summary.authDeleted = true;
      } catch (err: unknown) {
        const code = (err as { code?: string })?.code;
        if (code !== 'auth/user-not-found') throw err;
      }
    }

    // 5. Record one Super Admin audit log summarizing the purge
    await writeSuperAdminAuditLog(firestore, actor, {
      actionName: 'deleted',
      resourceName: targetEmail || targetUid,
      resourceId: targetUid,
      details: `Purged user account (${targetEmail || targetUid}): ${summary.deletedOrders} orders (${summary.restoredStockUnits} stock units restored), ${summary.deletedInquiries} inquiries (${summary.deletedMessages} messages), ${summary.deletedFavorites} saved builds, ${summary.deletedNotifications} notifications, ${summary.deletedAuditLogs} activity logs, authDeleted=${summary.authDeleted}.`,
    });

    return { success: true, summary };
  } catch (error: unknown) {
    console.error('[purgeUserAccount] Failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to purge user account.',
    };
  }
}

