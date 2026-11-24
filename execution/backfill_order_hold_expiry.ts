import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { FieldPath, Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';
import { getAdminFirestore } from '../src/firebase/server-init';
import {
  computeOrderHoldExpiresAt,
  getOrderCreatedDate,
} from '../src/lib/order-expiration';
import type { Order, PaymentMethod } from '../src/lib/types';

const backupManifestSchema = z.object({
  projectId: z.string().min(1),
  completed: z.literal(true),
  private: z.literal(true),
  completedAt: z.string().min(1),
  backupUri: z.string().min(1),
});

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const value = (prefix: string): string | undefined =>
  args.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const expectedProject = value('--project=');
const backupPath = value('--backup=');
const after = value('--after=');

export function computeExpectedHoldExpiresAt(
  data: Partial<Order>
): Timestamp | null {
  const status = (data.status || '').toLowerCase();
  const paymentStatus = (data.paymentStatus || '').toLowerCase();
  const paymentMethod = (data.paymentMethod || '') as PaymentMethod;

  // Stale holds: cancelled, paid, or COD orders must never have holdExpiresAt
  if (
    status === 'cancelled' ||
    paymentStatus === 'paid' ||
    paymentMethod === 'cod'
  ) {
    return null;
  }

  // Pending online orders with unconfirmed payment get 1-hour hold from createdAt
  if (
    status === 'pending' &&
    (paymentStatus === 'pending' || paymentStatus === 'unpaid')
  ) {
    const holdDate = computeOrderHoldExpiresAt(paymentMethod, data.createdAt);
    return holdDate ? Timestamp.fromDate(holdDate) : null;
  }

  return null;
}

export function needsHoldExpiresAtUpdate(
  current: unknown,
  expected: Timestamp | null
): boolean {
  if (expected === null) {
    // Only update if current has a stale non-null/non-undefined value
    return current !== null && current !== undefined;
  }
  if (current === null || current === undefined) {
    return true;
  }
  const currentDate = getOrderCreatedDate(current);
  if (!currentDate) {
    return true;
  }
  return Math.abs(currentDate.getTime() - expected.toDate().getTime()) > 1000;
}

async function main(): Promise<void> {
  if (!projectId || expectedProject !== projectId) {
    throw new Error('Pass --project=<configured project> to identify the target.');
  }

  const db = getAdminFirestore();

  if (apply) {
    if (!backupPath) {
      throw new Error('--apply requires --backup=<completed private export manifest>.');
    }
    const rawBackup = JSON.parse(await readFile(backupPath, 'utf8')) as unknown;
    const backup = backupManifestSchema.parse(rawBackup);
    const backupAge = Date.now() - Date.parse(backup.completedAt);

    if (
      backup.projectId !== projectId ||
      !Number.isFinite(backupAge) ||
      backupAge < 0 ||
      backupAge > 86_400_000 ||
      !backup.backupUri.startsWith(`gs://${projectId}-private-backups/backups/`)
    ) {
      throw new Error('Backup manifest must be completed, private, and match this project.');
    }
  }

  let scanned = 0;
  let pendingUpdates = 0;
  let updated = 0;
  let populatedCount = 0;
  let clearedCount = 0;
  let cursor = after || '';

  while (true) {
    let query = db.collection('orders').orderBy(FieldPath.documentId()).limit(100);
    if (cursor) query = query.startAfter(cursor);
    const page = await query.get();
    if (page.empty) break;

    for (const document of page.docs) {
      cursor = document.id;
      scanned++;
      const data = document.data() as Partial<Order>;
      const expected = computeExpectedHoldExpiresAt(data);

      if (!needsHoldExpiresAtUpdate(data.holdExpiresAt, expected)) {
        continue;
      }

      pendingUpdates++;
      if (expected === null) {
        clearedCount++;
      } else {
        populatedCount++;
      }

      if (apply) {
        await db.runTransaction(async (transaction) => {
          const fresh = await transaction.get(document.ref);
          if (!fresh.exists) return;
          const freshData = fresh.data() as Partial<Order>;
          const freshExpected = computeExpectedHoldExpiresAt(freshData);
          if (needsHoldExpiresAtUpdate(freshData.holdExpiresAt, freshExpected)) {
            transaction.update(document.ref, { holdExpiresAt: freshExpected });
          }
        });
        updated++;
      }
    }

    console.log(
      JSON.stringify({
        checkpoint: cursor,
        scanned,
        pendingUpdates,
        populatedCount,
        clearedCount,
        updated,
      })
    );
    if (page.size < 100) break;
  }

  console.log(
    JSON.stringify({
      complete: true,
      scanned,
      pendingUpdates,
      populatedCount,
      clearedCount,
      updated,
      mode: apply ? 'apply' : 'dry-run',
    })
  );
}

if (process.env.NODE_ENV !== 'test' && require.main === module) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
