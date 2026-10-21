/** Managed export prerequisite for the additive QR migration. Never prints credentials. */
import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { getApp } from 'firebase-admin/app';
import { getAdminFirestore, getAdminStorage } from '../src/firebase/server-init';

async function main() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId || !process.argv.includes(`--project=${projectId}`)) throw new Error('Pass --project=<active project> for the intended database.');
  const output = process.argv.find(arg => arg.startsWith('--manifest='))?.slice(11) || '.tmp/qr-backup.json';
  const backupBucket = `${projectId}-private-backups`;
  const backupUri = `gs://${backupBucket}/backups/qr-inventory-${new Date().toISOString().replace(/[:.]/g, '-')}`;
  getAdminFirestore();
  const [bucket] = await getAdminStorage().bucket(backupBucket).getMetadata();
  if (bucket.iamConfiguration?.publicAccessPrevention !== 'enforced' || !bucket.iamConfiguration?.uniformBucketLevelAccess?.enabled) throw new Error('Backup bucket must enforce public access prevention and uniform IAM access.');
  const credential = getApp().options.credential;
  if (!credential) throw new Error('Firebase Admin credentials are required.');
  const call = async (path: string, init?: RequestInit) => {
    const token = await credential.getAccessToken();
    const response = await fetch(`https://firestore.googleapis.com/v1/${path}`, { ...init, headers: { Authorization: `Bearer ${token.access_token}`, 'Content-Type': 'application/json' } });
    if (!response.ok) throw new Error(`Managed export request failed (${response.status}): ${await response.text()}`);
    return response.json();
  };
  let operation = await call(`projects/${projectId}/databases/(default):exportDocuments`, { method: 'POST', body: JSON.stringify({ outputUriPrefix: backupUri }) });
  console.log(`Managed backup started: ${operation.name}`);
  for (let attempt = 0; !operation.done && attempt < 180; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await call(operation.name);
  }
  if (!operation.done || operation.error) throw new Error(`Backup did not complete successfully: ${JSON.stringify(operation.error || operation.metadata)}`);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify({ projectId, completed: true, private: true, backupUri, operation: operation.name, completedAt: new Date().toISOString() }, null, 2));
  console.log(`Backup complete. Manifest: ${output}`);
}
main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
