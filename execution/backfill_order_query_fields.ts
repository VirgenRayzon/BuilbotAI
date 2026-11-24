import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { FieldPath } from 'firebase-admin/firestore';
import { getAdminFirestore } from '../src/firebase/server-init';
import { getOrderFulfillmentStage } from '../src/lib/order-workflow';

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const value = (prefix: string) => args.find(arg => arg.startsWith(prefix))?.slice(prefix.length);
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const expectedProject = value('--project=');
const backupPath = value('--backup=');
const after = value('--after=');
const db = getAdminFirestore();

async function main() {
  if (!projectId || expectedProject !== projectId) {
    throw new Error('Pass --project=<configured project> to identify the target.');
  }
  if (apply) {
    if (!backupPath) throw new Error('--apply requires --backup=<completed private export manifest>.');
    const backup = JSON.parse(await readFile(backupPath, 'utf8')) as Record<string, unknown>;
    const backupAge = Date.now() - Date.parse(String(backup.completedAt));
    if (
      backup.projectId !== projectId ||
      backup.completed !== true ||
      backup.private !== true ||
      !Number.isFinite(backupAge) ||
      backupAge < 0 ||
      backupAge > 86_400_000 ||
      typeof backup.backupUri !== 'string' ||
      !backup.backupUri.startsWith(`gs://${projectId}-private-backups/backups/`)
    ) {
      throw new Error('Backup manifest must be completed, private, and match this project.');
    }
  }

  let scanned = 0;
  let pending = 0;
  let updated = 0;
  let active = 0;
  let archived = 0;
  let cursor = after || '';

  while (true) {
    let query = db.collection('orders').orderBy(FieldPath.documentId()).limit(100);
    if (cursor) query = query.startAfter(cursor);
    const page = await query.get();
    if (page.empty) break;

    for (const document of page.docs) {
      cursor = document.id;
      scanned++;
      const data = document.data();
      const expectedIsArchived = Boolean(data.isArchived);
      const expectedQueueStage = data.status === 'cancelled' ? 'cancelled' : getOrderFulfillmentStage(data as any);

      if (expectedIsArchived) archived++;
      else active++;

      if (data.isArchived === expectedIsArchived && data.queueStage === expectedQueueStage) {
        continue;
      }

      pending++;
      if (apply) {
        await db.runTransaction(async transaction => {
          const fresh = await transaction.get(document.ref);
          if (!fresh.exists) return;
          const freshData = fresh.data() || {};
          const isArchived = Boolean(freshData.isArchived);
          const queueStage = freshData.status === 'cancelled' ? 'cancelled' : getOrderFulfillmentStage(freshData as any);
          transaction.update(document.ref, { isArchived, queueStage });
        });
        updated++;
      }
    }

    console.log(JSON.stringify({ checkpoint: cursor, scanned, active, archived, pending, updated }));
    if (page.size < 100) break;
  }

  console.log(JSON.stringify({ complete: true, scanned, active, archived, pending, updated, mode: apply ? 'apply' : 'dry-run' }));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
