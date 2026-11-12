import test from 'node:test';
import assert from 'node:assert/strict';
import {
  authorizeAiRequest,
  AiRouteAuthError,
  getAiClientFingerprint,
} from './ai-route-auth';

function createMockFirestore() {
  const store = new Map<string, Record<string, unknown>>();
  return {
    _store: store,
    collection(colName: string) {
      return {
        doc(docId: string) {
          const path = `${colName}/${docId}`;
          return {
            path,
            id: docId,
            async get() {
              const data = store.get(path);
              return {
                exists: data !== undefined,
                id: docId,
                data: () => data,
                get: (field: string) => data?.[field],
              };
            },
            async set(data: Record<string, unknown>) {
              store.set(path, { ...data });
            },
            async update(data: Record<string, unknown>) {
              const prev = store.get(path) || {};
              store.set(path, { ...prev, ...data });
            },
          };
        },
      };
    },
    async runTransaction<T>(
      updateFunction: (transaction: {
        get: (ref: any) => Promise<any>;
        set: (ref: any, data: Record<string, unknown>) => void;
        update: (ref: any, data: Record<string, unknown>) => void;
      }) => Promise<T>
    ): Promise<T> {
      const transaction = {
        async get(ref: any) {
          return ref.get();
        },
        set(ref: any, data: Record<string, unknown>) {
          store.set(ref.path, { ...data });
        },
        update(ref: any, data: Record<string, unknown>) {
          const prev = store.get(ref.path) || {};
          store.set(ref.path, { ...prev, ...data });
        },
      };
      return updateFunction(transaction);
    },
  };
}

function createMockAuth(validTokens: Record<string, { uid: string; email?: string }>) {
  return {
    async verifyIdToken(token: string) {
      if (validTokens[token]) {
        return validTokens[token];
      }
      const err = new Error('Firebase ID token has expired or is invalid.');
      (err as unknown as { code: string }).code = 'auth/invalid-id-token';
      throw err;
    },
  };
}

test('getAiClientFingerprint computes deterministic hash from headers', () => {
  const req1 = new Request('http://localhost:9002/api/chat', {
    headers: {
      'x-forwarded-for': '203.0.113.195, 10.0.0.1',
      'user-agent': 'Mozilla/5.0 TestBrowser',
    },
  });
  const fp1 = getAiClientFingerprint(req1);

  const req2 = new Request('http://localhost:9002/api/chat', {
    headers: {
      'x-forwarded-for': '203.0.113.195',
      'user-agent': 'Mozilla/5.0 TestBrowser',
    },
  });
  const fp2 = getAiClientFingerprint(req2);

  assert.equal(fp1, fp2, 'Fingerprint must use first client IP from x-forwarded-for');
  assert.equal(typeof fp1, 'string');
  assert.ok(fp1.length > 10);
});

test('invalid Bearer ID tokens return 401', async () => {
  const mockAuth = createMockAuth({});
  const mockDb = createMockFirestore();

  const req = new Request('http://localhost:9002/api/chat', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer bad-token-xyz',
    },
  });

  await assert.rejects(
    async () => {
      await authorizeAiRequest(req, {
        allowGuestWithRateLimit: true,
        maxPerMinute: 20,
        auth: mockAuth as any,
        db: mockDb as any,
      });
    },
    (err: unknown) => {
      assert.ok(err instanceof AiRouteAuthError, 'Must throw AiRouteAuthError');
      assert.equal(err.status, 401, 'Status must be 401');
      const res = err.toResponse();
      assert.equal(res.status, 401);
      return true;
    }
  );
});

test('unauthenticated calls when allowGuestWithRateLimit is false return 401', async () => {
  const mockAuth = createMockAuth({});
  const mockDb = createMockFirestore();

  const req = new Request('http://localhost:9002/api/chat', {
    method: 'POST',
    headers: {
      'x-forwarded-for': '198.51.100.5',
    },
  });

  await assert.rejects(
    async () => {
      await authorizeAiRequest(req, {
        allowGuestWithRateLimit: false,
        maxPerMinute: 20,
        auth: mockAuth as any,
        db: mockDb as any,
      });
    },
    (err: unknown) => {
      assert.ok(err instanceof AiRouteAuthError);
      assert.equal(err.status, 401);
      return true;
    }
  );
});

test('unauthenticated bursts exceeding maxPerMinute for the same client key trigger 429', async () => {
  const mockAuth = createMockAuth({});
  const mockDb = createMockFirestore();
  let currentTime = 1700000000000;

  const createGuestReq = () =>
    new Request('http://localhost:9002/api/chat', {
      method: 'POST',
      headers: {
        'x-forwarded-for': '198.51.100.42',
        'user-agent': 'GuestBrowser/1.0',
      },
    });

  const options = {
    allowGuestWithRateLimit: true,
    maxPerMinute: 3,
    auth: mockAuth as any,
    db: mockDb as any,
    now: () => currentTime,
  };

  // Requests 1, 2, 3 must pass
  const r1 = await authorizeAiRequest(createGuestReq(), options);
  assert.equal(r1.uid, null);
  assert.ok(r1.key.startsWith('guest_'));

  const r2 = await authorizeAiRequest(createGuestReq(), options);
  assert.equal(r2.uid, null);

  const r3 = await authorizeAiRequest(createGuestReq(), options);
  assert.equal(r3.uid, null);

  // Request 4 within the same 60s window must fail with 429 and Retry-After header
  await assert.rejects(
    async () => {
      await authorizeAiRequest(createGuestReq(), options);
    },
    (err: unknown) => {
      assert.ok(err instanceof AiRouteAuthError);
      assert.equal(err.status, 429);
      assert.ok(typeof err.retryAfterSeconds === 'number');
      assert.ok(err.retryAfterSeconds > 0 && err.retryAfterSeconds <= 60);

      const res = err.toResponse();
      assert.equal(res.status, 429);
      assert.equal(res.headers.get('Retry-After'), String(err.retryAfterSeconds));
      return true;
    }
  );

  // Advance time past 60 seconds (window reset)
  currentTime += 61000;

  // Next request should pass again!
  const r5 = await authorizeAiRequest(createGuestReq(), options);
  assert.equal(r5.uid, null);
});

test('valid verified users pass with uid, key, 1-day TTL expiresAt, and per-user rate limit', async () => {
  const mockAuth = createMockAuth({
    'token-alice': { uid: 'user_alice_123', email: 'alice@example.com' },
  });
  const mockDb = createMockFirestore();
  let currentTime = 1700000000000;

  const createAuthReq = () =>
    new Request('http://localhost:9002/api/chat', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer token-alice',
      },
    });

  const options = {
    allowGuestWithRateLimit: true,
    maxPerMinute: 2,
    auth: mockAuth as any,
    db: mockDb as any,
    now: () => currentTime,
  };

  const res1 = await authorizeAiRequest(createAuthReq(), options);
  assert.equal(res1.uid, 'user_alice_123');
  assert.equal(res1.key, 'user_user_alice_123');

  // Verify that the rate limit document was written with 1-day TTL
  const limitDoc = await mockDb.collection('aiRateLimits').doc(res1.key).get();
  assert.ok(limitDoc.exists);
  const data = limitDoc.data()!;
  assert.equal(data.count, 1);
  assert.ok(data.expiresAt instanceof Date, 'expiresAt must be Date instance');
  const expectedExpiryMs = currentTime + 24 * 60 * 60 * 1000;
  assert.equal((data.expiresAt as Date).getTime(), expectedExpiryMs);

  // Second request passes
  const res2 = await authorizeAiRequest(createAuthReq(), options);
  assert.equal(res2.uid, 'user_alice_123');

  // Third request triggers 429
  await assert.rejects(
    async () => {
      await authorizeAiRequest(createAuthReq(), options);
    },
    (err: unknown) => {
      assert.ok(err instanceof AiRouteAuthError);
      assert.equal(err.status, 429);
      return true;
    }
  );
});
