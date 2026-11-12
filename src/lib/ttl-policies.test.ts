import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TTL_DAYS,
  FORBIDDEN_TTL_TARGETS,
  computeExpiresAt,
  isExpiredAt,
  type TtlPolicyName,
} from './ttl-policies';
import {
  buildAdvisorRecommendationCacheKey,
  getAdvisorRecommendationCacheKey,
  buildCritiqueCacheKey,
} from './server/ai-cache-keys';

test('TTL_DAYS defines exact expected retention windows in days', () => {
  assert.equal(TTL_DAYS.aiCritiqueCache, 1, 'aiCritiqueCache must be 1 day (24h)');
  assert.equal(TTL_DAYS.aiRecommendationCache, 7, 'aiRecommendationCache must be 7 days');
  assert.equal(TTL_DAYS.orderWorkflowOperations, 30, 'orderWorkflowOperations must be 30 days');
  assert.equal(TTL_DAYS.reservationOperations, 30, 'reservationOperations must be 30 days');
  assert.equal(TTL_DAYS.notifications, 90, 'notifications must be 90 days');
  assert.equal(TTL_DAYS.auditLogs, 365, 'auditLogs must be 365 days');
  assert.equal(TTL_DAYS.analyticsAppliedEvents, 90, 'analyticsAppliedEvents must be 90 days');
});

test('computeExpiresAt computes exact millisecond retention offsets', () => {
  const baseMs = 1700000000000;
  const oneDayMs = 24 * 60 * 60 * 1000;

  // 24 hours
  const critiqueExpiry = computeExpiresAt('aiCritiqueCache', baseMs);
  assert.equal(critiqueExpiry.getTime() - baseMs, 1 * oneDayMs);

  // 7 days
  const recExpiry = computeExpiresAt('aiRecommendationCache', baseMs);
  assert.equal(recExpiry.getTime() - baseMs, 7 * oneDayMs);

  // 30 days
  const opExpiry = computeExpiresAt('orderWorkflowOperations', baseMs);
  assert.equal(opExpiry.getTime() - baseMs, 30 * oneDayMs);

  const resOpExpiry = computeExpiresAt('reservationOperations', baseMs);
  assert.equal(resOpExpiry.getTime() - baseMs, 30 * oneDayMs);

  // 90 days
  const notifExpiry = computeExpiresAt('notifications', baseMs);
  assert.equal(notifExpiry.getTime() - baseMs, 90 * oneDayMs);

  const analyticsExpiry = computeExpiresAt('analyticsAppliedEvents', baseMs);
  assert.equal(analyticsExpiry.getTime() - baseMs, 90 * oneDayMs);

  // 365 days
  const auditExpiry = computeExpiresAt('auditLogs', baseMs);
  assert.equal(auditExpiry.getTime() - baseMs, 365 * oneDayMs);
});

test('computeExpiresAt rejects forbidden and unknown collections', () => {
  assert.ok(FORBIDDEN_TTL_TARGETS.includes('orders' as any));
  assert.ok(FORBIDDEN_TTL_TARGETS.includes('orders/activity' as any));
  assert.ok(FORBIDDEN_TTL_TARGETS.includes('refunds' as any));

  // TypeScript would reject these, but test runtime assertion for defensive safety
  assert.throws(
    () => computeExpiresAt('orders' as unknown as TtlPolicyName),
    /forbidden|invalid/i
  );
  assert.throws(
    () => computeExpiresAt('orders/activity' as unknown as TtlPolicyName),
    /forbidden|invalid/i
  );
  assert.throws(
    () => computeExpiresAt('financial_refunds' as unknown as TtlPolicyName),
    /forbidden|invalid/i
  );
  assert.throws(
    () => computeExpiresAt('unknown_collection' as unknown as TtlPolicyName),
    /forbidden|invalid/i
  );
});

test('isExpiredAt correctly identifies expired and unexpired timestamps', () => {
  const nowMs = 1700000000000;

  // Exact past Date
  const pastDate = new Date(nowMs - 1000);
  assert.equal(isExpiredAt(pastDate, nowMs), true);

  // Exact future Date
  const futureDate = new Date(nowMs + 1000);
  assert.equal(isExpiredAt(futureDate, nowMs), false);

  // Boundary: exactly now is expired (expiresAt <= now)
  const nowDate = new Date(nowMs);
  assert.equal(isExpiredAt(nowDate, nowMs), true);

  // Firestore Timestamp-like { toMillis }
  const firestoreTimestampMillis = { toMillis: () => nowMs - 5000 };
  assert.equal(isExpiredAt(firestoreTimestampMillis, nowMs), true);

  // Firestore Timestamp-like { seconds, nanoseconds }
  const firestoreTimestampSeconds = { seconds: Math.floor(nowMs / 1000) + 60, nanoseconds: 0 };
  assert.equal(isExpiredAt(firestoreTimestampSeconds, nowMs), false);

  // ISO string
  const pastIso = new Date(nowMs - 60000).toISOString();
  assert.equal(isExpiredAt(pastIso, nowMs), true);
  const futureIso = new Date(nowMs + 60000).toISOString();
  assert.equal(isExpiredAt(futureIso, nowMs), false);

  // Null/undefined values are not expired
  assert.equal(isExpiredAt(null, nowMs), false);
  assert.equal(isExpiredAt(undefined, nowMs), false);
});

test('buildAdvisorRecommendationCacheKey produces distinct keys for different catalogVersion values', () => {
  const input = {
    intendedUse: 'gaming',
    budget: '₱50,000',
    performanceLevel: 'high performance for 1440p gaming',
    additionalNotes: 'all black build',
    allowFlexibleBudget: false,
    allowAiSearch: true,
  };

  const keyV1 = buildAdvisorRecommendationCacheKey({
    input,
    prompt: 'standard prompt',
    modelSettings: { model: 'gemini-2.5-flash' },
    catalogVersion: 1,
  });

  const keyV2 = buildAdvisorRecommendationCacheKey({
    input,
    prompt: 'standard prompt',
    modelSettings: { model: 'gemini-2.5-flash' },
    catalogVersion: 2,
  });

  const keyV1Identical = buildAdvisorRecommendationCacheKey({
    input: { ...input },
    prompt: 'standard prompt',
    modelSettings: { model: 'gemini-2.5-flash' },
    catalogVersion: 1,
  });

  assert.notEqual(keyV1, keyV2, 'Cache keys must differ when catalogVersion changes');
  assert.equal(keyV1, keyV1Identical, 'Cache keys must be deterministic for identical inputs');
  assert.equal(typeof keyV1, 'string');
  assert.equal(keyV1.length, 64, 'SHA-256 hex string should be 64 characters');
});

test('getAdvisorRecommendationCacheKey respects passed catalogVersion without reading database', async () => {
  const input = {
    intendedUse: 'rendering',
    budget: '₱100,000',
  };

  const key = await getAdvisorRecommendationCacheKey(input, {
    catalogVersion: 42,
    prompt: 'custom prompt',
  });

  const directKey = buildAdvisorRecommendationCacheKey({
    input,
    catalogVersion: 42,
    prompt: 'custom prompt',
  });

  assert.equal(key, directKey);
});

test('buildCritiqueCacheKey produces deterministic SHA-256 hex string', () => {
  const critiqueKey1 = buildCritiqueCacheKey(
    {
      build: { cpu: { model: 'Ryzen 5 5600' }, gpu: { model: 'RTX 4060' } },
      intendedUse: 'Gaming',
    },
    { model: 'gemini-2.5-flash' }
  );

  const critiqueKey2 = buildCritiqueCacheKey(
    {
      build: { gpu: { model: 'RTX 4060' }, cpu: { model: 'Ryzen 5 5600' } },
      intendedUse: 'gaming',
    },
    { model: 'gemini-2.5-flash' }
  );

  assert.equal(critiqueKey1, critiqueKey2, 'Key must be invariant to build part insertion order and casing');
  assert.equal(critiqueKey1.length, 64);
});

test('firestore.indexes.json configures exact fieldOverrides with ttlConfig: {}', async () => {
  const { readFileSync } = await import('node:fs');
  const { resolve } = await import('node:path');
  const indexPath = resolve(process.cwd(), 'firestore.indexes.json');
  const indexContent = JSON.parse(readFileSync(indexPath, 'utf-8'));

  assert.ok(Array.isArray(indexContent.fieldOverrides), 'fieldOverrides must be an array');
  const overrides = indexContent.fieldOverrides as Array<{
    collectionGroup: string;
    fieldPath: string;
    ttlConfig?: Record<string, unknown>;
  }>;

  const expectedCollections = [
    'ai_critique_cache_v1',
    'ai_recommendation_cache_v3',
    'orderWorkflowOperations',
    'reservationOperations',
    'system_notifications',
    'notifications',
    'auditLogs',
    'user_auditLogs',
    'analyticsAppliedEvents',
  ];

  for (const col of expectedCollections) {
    const found = overrides.find(
      (o) => o.collectionGroup === col && o.fieldPath === 'expiresAt'
    );
    assert.ok(found, `Missing TTL fieldOverride for collection '${col}' on field 'expiresAt'`);
    assert.deepEqual(found.ttlConfig, {}, `ttlConfig for '${col}' must be {}`);
  }

  // Ensure NO TTL fieldOverride ever applies to orders or refunds
  const forbiddenOverrides = overrides.filter(
    (o) =>
      o.collectionGroup.includes('order') &&
      o.collectionGroup !== 'orderWorkflowOperations'
  );
  assert.equal(
    forbiddenOverrides.length,
    0,
    `Never configure TTL fieldOverrides on orders or orders/activity: found ${JSON.stringify(forbiddenOverrides)}`
  );
});

test('pruneUserNotificationsServer calls .offset(maxKeep).limit(50)', async () => {
  const { pruneUserNotificationsServer } = await import('./server/order-expiration-sweep');

  let recordedOffset = -1;
  let recordedLimit = -1;
  let recordedOrderBy = '';
  let recordedDirection = '';
  let batchDeleteCalls = 0;
  let batchCommitCalled = false;

  const fakeDocSnap = {
    ref: { id: 'old-notif-1' },
  };

  const fakeQuery = {
    orderBy(field: string, dir: string) {
      recordedOrderBy = field;
      recordedDirection = dir;
      return this;
    },
    offset(n: number) {
      recordedOffset = n;
      return this;
    },
    limit(n: number) {
      recordedLimit = n;
      return this;
    },
    async get() {
      return {
        empty: false,
        size: 1,
        docs: [fakeDocSnap],
      };
    },
  };

  const fakeFirestore: any = {
    collection: (name: string) => ({
      doc: (docId: string) => ({
        collection: (subName: string) => fakeQuery,
      }),
    }),
    batch: () => ({
      delete: (ref: any) => {
        batchDeleteCalls++;
      },
      commit: async () => {
        batchCommitCalled = true;
      },
    }),
  };

  await pruneUserNotificationsServer(fakeFirestore, 'user_test_123', 30);

  assert.equal(recordedOrderBy, 'createdAt');
  assert.equal(recordedDirection, 'desc');
  assert.equal(recordedOffset, 30, 'Must query from offset(maxKeep)');
  assert.equal(recordedLimit, 50, 'Must bound traversal with limit(50)');
  assert.equal(batchDeleteCalls, 1, 'Must delete sliced docs');
  assert.equal(batchCommitCalled, true, 'Must commit batch');
});
