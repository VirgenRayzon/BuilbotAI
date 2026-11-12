import 'dotenv/config';
import { readFile, writeFile } from 'node:fs/promises';
import { FieldPath } from 'firebase-admin/firestore';
import { getAdminFirestore } from '../src/firebase/server-init';
import type { Order } from '../src/lib/types';
import {
  calculateOrderDelta,
  formatDayKey,
  formatMonthKey,
  getOrderDate,
  type AnalyticsBucket,
} from '../src/lib/analytics-rollups';

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const value = (prefix: string) => args.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);

const configuredProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
const expectedProject = value('--project=');
const backupPath = value('--backup=');
const after = value('--after=');
const batchSize = Number(value('--batch-size=')) || 250;

function mergeCounters(base: Record<string, number>, delta: Record<string, number>): Record<string, number> {
  const result: Record<string, number> = { ...base };
  for (const [key, val] of Object.entries(delta)) {
    const nextVal = (result[key] || 0) + val;
    if (nextVal !== 0) {
      result[key] = nextVal;
    } else {
      delete result[key];
    }
  }
  return result;
}

function mergeIntoBucket(bucket: AnalyticsBucket, delta: ReturnType<typeof calculateOrderDelta>): void {
  bucket.grossCollectedPhp = Math.round((bucket.grossCollectedPhp + delta.grossCollectedPhp) * 100) / 100;
  bucket.refundedPhp = Math.round((bucket.refundedPhp + delta.refundedPhp) * 100) / 100;
  bucket.netCollectedPhp = Math.round((bucket.netCollectedPhp + delta.netCollectedPhp) * 100) / 100;
  bucket.paidOrderCount = Math.max(0, bucket.paidOrderCount + delta.paidOrderCount);
  bucket.cancelledOrderCount = Math.max(0, bucket.cancelledOrderCount + delta.cancelledOrderCount);
  bucket.customOrderCount = Math.max(0, bucket.customOrderCount + delta.customOrderCount);
  bucket.prebuiltOrderCount = Math.max(0, bucket.prebuiltOrderCount + delta.prebuiltOrderCount);
  bucket.byPaymentMethod = mergeCounters(bucket.byPaymentMethod, delta.byPaymentMethod);
  bucket.partUnitsSold = mergeCounters(bucket.partUnitsSold, delta.partUnitsSold);
  bucket.updatedAt = Date.now();
}

function createEmptyBucket(bucketKey: string): AnalyticsBucket {
  return {
    bucketKey,
    grossCollectedPhp: 0,
    refundedPhp: 0,
    netCollectedPhp: 0,
    paidOrderCount: 0,
    cancelledOrderCount: 0,
    customOrderCount: 0,
    prebuiltOrderCount: 0,
    byPaymentMethod: {},
    partUnitsSold: {},
    updatedAt: Date.now(),
  };
}

async function main() {
  if (configuredProjectId && expectedProject && expectedProject !== configuredProjectId) {
    throw new Error(`Project mismatch: expected --project=${configuredProjectId}`);
  }

  const db = getAdminFirestore();

  if (apply && backupPath) {
    try {
      const existing = await readFile(backupPath, 'utf8');
      console.log(`[backfill] Loaded existing backup verification from ${backupPath} (${existing.length} bytes).`);
    } catch {
      console.log(`[backfill] Backup file ${backupPath} does not exist yet. Creating pre-migration backup...`);
      const [dailySnap, monthlySnap] = await Promise.all([
        db.collection('analyticsDaily').get(),
        db.collection('analyticsMonthly').get(),
      ]);
      const backupData = {
        timestamp: new Date().toISOString(),
        daily: dailySnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        monthly: monthlySnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      };
      await writeFile(backupPath, JSON.stringify(backupData, null, 2), 'utf8');
      console.log(`[backfill] Pre-migration backup saved to ${backupPath}.`);
    }
  }

  const dailyBuckets = new Map<string, AnalyticsBucket>();
  const monthlyBuckets = new Map<string, AnalyticsBucket>();

  let scanned = 0;
  let paidCount = 0;
  let cancelledCount = 0;
  let cursor = after || '';

  console.log(`[backfill] Starting sales rollups scan (mode: ${apply ? 'APPLY' : 'DRY-RUN'}, batchSize: ${batchSize})...`);

  while (true) {
    let q = db.collection('orders').orderBy(FieldPath.documentId()).limit(batchSize);
    if (cursor) {
      q = q.startAfter(cursor);
    }

    const page = await q.get();
    if (page.empty) break;

    for (const doc of page.docs) {
      cursor = doc.id;
      scanned++;
      const order = { id: doc.id, ...(doc.data() as Record<string, unknown>) } as unknown as Order;

      const delta = calculateOrderDelta(null, order);
      if (delta.paidOrderCount > 0) paidCount++;
      if (delta.cancelledOrderCount > 0) cancelledCount++;

      const date = getOrderDate(order);
      const dayKey = formatDayKey(date);
      const monthKey = formatMonthKey(date);

      if (!dailyBuckets.has(dayKey)) {
        dailyBuckets.set(dayKey, createEmptyBucket(dayKey));
      }
      if (!monthlyBuckets.has(monthKey)) {
        monthlyBuckets.set(monthKey, createEmptyBucket(monthKey));
      }

      mergeIntoBucket(dailyBuckets.get(dayKey)!, delta);
      mergeIntoBucket(monthlyBuckets.get(monthKey)!, delta);
    }

    console.log(
      JSON.stringify({
        checkpoint: cursor,
        scanned,
        paidCount,
        cancelledCount,
        dailyBucketsCount: dailyBuckets.size,
        monthlyBucketsCount: monthlyBuckets.size,
      })
    );

    if (page.size < batchSize) break;
  }

  console.log(`[backfill] Scan completed. Scanned ${scanned} orders across ${dailyBuckets.size} days and ${monthlyBuckets.size} months.`);

  if (apply) {
    console.log('[backfill] Writing daily rollups to Firestore...');
    for (const [dayKey, bucket] of dailyBuckets.entries()) {
      await db.collection('analyticsDaily').doc(dayKey).set(bucket, { merge: true });
    }

    console.log('[backfill] Writing monthly rollups to Firestore...');
    for (const [monthKey, bucket] of monthlyBuckets.entries()) {
      await db.collection('analyticsMonthly').doc(monthKey).set(bucket, { merge: true });
    }

    console.log('[backfill] Successfully committed all daily and monthly rollups to Firestore.');
  } else {
    console.log('[backfill] DRY-RUN complete. No database writes were performed. Pass --apply to persist changes.');
  }
}

if (process.env.NODE_ENV !== 'test') {
  main().catch((err) => {
    console.error('[backfill] Fatal error:', err);
    process.exit(1);
  });
}
