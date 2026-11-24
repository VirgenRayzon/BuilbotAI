import test from 'node:test';
import assert from 'node:assert/strict';
import { VersionedServerCache } from './catalog-cache';

test('VersionedServerCache synchronizes across instances when remote version increments', async () => {
  let remoteVersion = 1;
  let loadCountA = 0;
  let loadCountB = 0;

  const readVersion = async () => remoteVersion;

  const instanceA = new VersionedServerCache<string[]>({ maxCheckStalenessMs: 0 });
  const instanceB = new VersionedServerCache<string[]>({ maxCheckStalenessMs: 0 });

  const loaderA = async () => {
    loadCountA++;
    return [`data-v${remoteVersion}-from-A`];
  };

  const loaderB = async () => {
    loadCountB++;
    return [`data-v${remoteVersion}-from-B`];
  };

  // Warm both at version 1
  const dataA1 = await instanceA.getOrLoad(loaderA, readVersion);
  const dataB1 = await instanceB.getOrLoad(loaderB, readVersion);

  assert.deepEqual(dataA1, ['data-v1-from-A']);
  assert.deepEqual(dataB1, ['data-v1-from-B']);
  assert.equal(loadCountA, 1);
  assert.equal(loadCountB, 1);

  // Subsequent call on instance B without version bump should return cached without loader call
  const dataB1Cached = await instanceB.getOrLoad(loaderB, readVersion);
  assert.deepEqual(dataB1Cached, ['data-v1-from-B']);
  assert.equal(loadCountB, 1);

  // Instance A writes / bumps remote version to 2
  remoteVersion = 2;
  // Instance A loads new version
  const dataA2 = await instanceA.getOrLoad(loaderA, readVersion);
  assert.deepEqual(dataA2, ['data-v2-from-A']);
  assert.equal(loadCountA, 2);

  // Instance B was untouched, but its next call must reload version 2 because remote version is 2
  const dataB2 = await instanceB.getOrLoad(loaderB, readVersion);
  assert.deepEqual(dataB2, ['data-v2-from-B']);
  assert.equal(loadCountB, 2);
});

test('VersionedServerCache respects maxCheckStalenessMs window', async () => {
  let remoteVersion = 1;
  let loadCount = 0;
  let versionReadCount = 0;

  const readVersion = async () => {
    versionReadCount++;
    return remoteVersion;
  };

  const instance = new VersionedServerCache<string>({ maxCheckStalenessMs: 5000 });
  const loader = async () => {
    loadCount++;
    return `loaded-v${remoteVersion}`;
  };

  const first = await instance.getOrLoad(loader, readVersion);
  assert.equal(first, 'loaded-v1');
  assert.equal(loadCount, 1);
  assert.equal(versionReadCount, 1);

  // Immediate second call should not check version
  const second = await instance.getOrLoad(loader, readVersion);
  assert.equal(second, 'loaded-v1');
  assert.equal(loadCount, 1);
  assert.equal(versionReadCount, 1);
});

test('VersionedServerCache invalidateLocal forces reload on next getOrLoad', async () => {
  let remoteVersion = 1;
  let loadCount = 0;
  const readVersion = async () => remoteVersion;

  const instance = new VersionedServerCache<string>({ maxCheckStalenessMs: 5000 });
  await instance.getOrLoad(async () => {
    loadCount++;
    return 'initial';
  }, readVersion);
  assert.equal(loadCount, 1);

  instance.invalidateLocal();

  await instance.getOrLoad(async () => {
    loadCount++;
    return 'after-invalidation';
  }, readVersion);
  assert.equal(loadCount, 2);
});
