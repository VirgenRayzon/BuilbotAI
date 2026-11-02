import test from 'node:test';
import assert from 'node:assert/strict';
import { assertOrderTestEnvironment, resolveOrderRoles } from './order-permissions';

test('customers have no staff authority; matching roles preserve manager and super admin access', () => {
  assert.equal(resolveOrderRoles({}, {}).isStaff, false);
  assert.equal(resolveOrderRoles({}, undefined).isStaff, false);
  assert.deepEqual(resolveOrderRoles({ isManager: true }, { isManager: true }),
    { isManager: true, isSuperAdmin: false, isStaff: true });
  assert.equal(resolveOrderRoles({ isSuperAdmin: true }, { isSuperAdmin: true }).isSuperAdmin, true);
});

test('stale, profile-only, missing-profile and partially mismatched staff identities fail closed', () => {
  for (const [claims, profile] of [
    [{ isManager: true }, {}], [{}, { isManager: true }],
    [{ isSuperAdmin: true }, undefined],
    [{ isManager: true, isSuperAdmin: true }, { isManager: true }],
  ]) assert.throws(() => resolveOrderRoles(claims || {}, profile), /System Access/);
  assert.equal(resolveOrderRoles({ isManager: 'true' }, { isManager: 'true' }).isStaff, false);
});

test('deletion and seeding require both emulators and an explicit demo project', () => {
  const demo = { FIRESTORE_EMULATOR_HOST: '127.0.0.1:8088', FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9098',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'demo-buildbot-qr' };
  assert.doesNotThrow(() => assertOrderTestEnvironment(demo));
  assert.throws(() => assertOrderTestEnvironment({}), /Archive real orders/);
  assert.throws(() => assertOrderTestEnvironment({ ...demo, NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'live-project' }));
  assert.throws(() => assertOrderTestEnvironment({ ...demo, FIREBASE_AUTH_EMULATOR_HOST: undefined }));
  assert.throws(() => assertOrderTestEnvironment({ ...demo, FIRESTORE_EMULATOR_HOST: undefined }));
});
