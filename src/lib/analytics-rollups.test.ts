import test from 'node:test';
import assert from 'node:assert/strict';
import type { Order, OrderItem, PaymentMethod } from './types';
import {
  applyOrderAnalyticsDeltaInTx,
  type AnalyticsBucket,
} from './analytics-rollups';

interface MockDocSnapshot {
  id: string;
  exists: boolean;
  data: () => Record<string, unknown> | undefined;
}

interface MockDocRef {
  id: string;
  path: string;
}

class MockFirestoreTransaction {
  private readsAllowed = true;
  private writesExecuted = false;

  constructor(private dbState: Map<string, Map<string, Record<string, unknown>>>) {}

  async get(ref: MockDocRef): Promise<MockDocSnapshot> {
    if (!this.readsAllowed && this.writesExecuted) {
      throw new Error('Firestore transactions require all reads to be executed before all writes.');
    }
    const [colName, docId] = ref.path.split('/');
    const col = this.dbState.get(colName);
    const data = col?.get(docId);
    return {
      id: docId,
      exists: data !== undefined,
      data: () => (data ? JSON.parse(JSON.stringify(data)) : undefined),
    };
  }

  set(ref: MockDocRef, data: Record<string, unknown>, options?: { merge?: boolean }): void {
    this.writesExecuted = true;
    this.readsAllowed = false;
    const [colName, docId] = ref.path.split('/');
    let col = this.dbState.get(colName);
    if (!col) {
      col = new Map();
      this.dbState.set(colName, col);
    }
    if (options?.merge && col.has(docId)) {
      const prev = col.get(docId) || {};
      col.set(docId, { ...prev, ...JSON.parse(JSON.stringify(data)) });
    } else {
      col.set(docId, JSON.parse(JSON.stringify(data)));
    }
  }

  update(ref: MockDocRef, data: Record<string, unknown>): void {
    this.writesExecuted = true;
    this.readsAllowed = false;
    const [colName, docId] = ref.path.split('/');
    const col = this.dbState.get(colName);
    if (!col || !col.has(docId)) {
      throw new Error(`Document ${ref.path} does not exist to update.`);
    }
    const prev = col.get(docId) || {};
    col.set(docId, { ...prev, ...JSON.parse(JSON.stringify(data)) });
  }
}

class MockFirestoreDb {
  public state = new Map<string, Map<string, Record<string, unknown>>>();

  collection(name: string) {
    return {
      doc: (id: string): MockDocRef => ({
        id,
        path: `${name}/${id}`,
      }),
    };
  }

  async runTransaction<T>(updateFn: (tx: MockFirestoreTransaction) => Promise<T>): Promise<T> {
    const tx = new MockFirestoreTransaction(this.state);
    return updateFn(tx);
  }

  getDocData(collection: string, id: string): Record<string, unknown> | undefined {
    return this.state.get(collection)?.get(id);
  }
}

function createSampleOrder(overrides: Partial<Order> = {}): Order {
  const items: OrderItem[] = [
    {
      id: 'cpu_1',
      name: 'AMD Ryzen 5 7600',
      category: 'CPU',
      price: 11000,
      quantity: 1,
      groupName: 'My Build',
      buildType: 'custom-build',
    },
    {
      id: 'gpu_1',
      name: 'NVIDIA RTX 4060',
      category: 'GPU',
      price: 19000,
      quantity: 1,
      groupName: 'My Build',
      buildType: 'custom-build',
    },
  ];

  return {
    id: 'ord_sample_1',
    orderNumber: 'ORD-20261112-001',
    userId: 'user_123',
    userEmail: 'gamer@example.com',
    items,
    subtotal: 30000,
    shippingFee: 0,
    protectionFee: 0,
    discountAmount: 0,
    totalPrice: 30000,
    status: 'pending',
    fulfillmentStage: 'order_placed',
    refundStatus: 'none',
    stockState: 'reserved',
    paymentMethod: 'gcash_simulated' as PaymentMethod,
    paymentStatus: 'pending',
    paymentReference: 'GCASH-REF-001',
    createdAt: new Date('2026-11-12T04:00:00.000Z'),
    updatedAt: new Date('2026-11-12T04:00:00.000Z'),
    ...overrides,
  };
}

test('analytics-rollups: transitioning an order to paid increments exact YYYY-MM-DD and YYYY-MM buckets', async () => {
  const db = new MockFirestoreDb();
  const order = createSampleOrder();
  const paidOrder: Order = {
    ...order,
    paymentStatus: 'paid',
    paidAt: new Date('2026-11-12T04:30:00.000Z'),
  };

  await db.runTransaction(async (tx) => {
    // Cast to unknown and then to Firestore/Transaction types expected by function
    await applyOrderAnalyticsDeltaInTx(
      tx as unknown as Parameters<typeof applyOrderAnalyticsDeltaInTx>[0],
      db as unknown as Parameters<typeof applyOrderAnalyticsDeltaInTx>[1],
      'event_paid_1',
      order,
      paidOrder
    );
  });

  const daily = db.getDocData('analyticsDaily', '2026-11-12') as unknown as AnalyticsBucket;
  assert.ok(daily, 'Daily bucket 2026-11-12 should exist');
  assert.equal(daily.bucketKey, '2026-11-12');
  assert.equal(daily.grossCollectedPhp, 30000);
  assert.equal(daily.refundedPhp, 0);
  assert.equal(daily.netCollectedPhp, 30000);
  assert.equal(daily.paidOrderCount, 1);
  assert.equal(daily.cancelledOrderCount, 0);
  assert.equal(daily.customOrderCount, 1);
  assert.equal(daily.prebuiltOrderCount, 0);
  assert.equal(daily.byPaymentMethod['gcash_simulated'], 30000);
  assert.equal(daily.partUnitsSold['CPU'], 1);
  assert.equal(daily.partUnitsSold['GPU'], 1);

  const monthly = db.getDocData('analyticsMonthly', '2026-11') as unknown as AnalyticsBucket;
  assert.ok(monthly, 'Monthly bucket 2026-11 should exist');
  assert.equal(monthly.bucketKey, '2026-11');
  assert.equal(monthly.grossCollectedPhp, 30000);
  assert.equal(monthly.netCollectedPhp, 30000);
  assert.equal(monthly.paidOrderCount, 1);

  const eventDoc = db.getDocData('analyticsAppliedEvents', 'event_paid_1');
  assert.ok(eventDoc, 'Idempotency event doc should be recorded');
  assert.ok(eventDoc.expiresAt, 'Event marker must contain expiresAt TTL');
});

test('analytics-rollups: re-running applyOrderAnalyticsDeltaInTx with same eventKey is a no-op', async () => {
  const db = new MockFirestoreDb();
  const order = createSampleOrder();
  const paidOrder: Order = {
    ...order,
    paymentStatus: 'paid',
    paidAt: new Date('2026-11-12T04:30:00.000Z'),
  };

  // Run first time
  await db.runTransaction(async (tx) => {
    await applyOrderAnalyticsDeltaInTx(
      tx as unknown as Parameters<typeof applyOrderAnalyticsDeltaInTx>[0],
      db as unknown as Parameters<typeof applyOrderAnalyticsDeltaInTx>[1],
      'event_dup_test',
      order,
      paidOrder
    );
  });

  // Run second time with identical eventKey
  await db.runTransaction(async (tx) => {
    await applyOrderAnalyticsDeltaInTx(
      tx as unknown as Parameters<typeof applyOrderAnalyticsDeltaInTx>[0],
      db as unknown as Parameters<typeof applyOrderAnalyticsDeltaInTx>[1],
      'event_dup_test',
      order,
      paidOrder
    );
  });

  const daily = db.getDocData('analyticsDaily', '2026-11-12') as unknown as AnalyticsBucket;
  assert.equal(daily.grossCollectedPhp, 30000, 'Gross revenue must not double');
  assert.equal(daily.netCollectedPhp, 30000, 'Net revenue must not double');
  assert.equal(daily.paidOrderCount, 1, 'Paid order count must not double');
});

test('analytics-rollups: partial refund subtracts delta from netCollectedPhp and increments refundedPhp', async () => {
  const db = new MockFirestoreDb();
  const order = createSampleOrder();
  const paidOrder: Order = {
    ...order,
    paymentStatus: 'paid',
    paidAt: new Date('2026-11-12T04:30:00.000Z'),
  };

  // Initial payment
  await db.runTransaction(async (tx) => {
    await applyOrderAnalyticsDeltaInTx(
      tx as unknown as Parameters<typeof applyOrderAnalyticsDeltaInTx>[0],
      db as unknown as Parameters<typeof applyOrderAnalyticsDeltaInTx>[1],
      'event_paid_for_refund',
      order,
      paidOrder
    );
  });

  const refundedOrder: Order = {
    ...paidOrder,
    refundStatus: 'partial',
    refundedAmount: 5000,
  };

  // Issue partial refund
  await db.runTransaction(async (tx) => {
    await applyOrderAnalyticsDeltaInTx(
      tx as unknown as Parameters<typeof applyOrderAnalyticsDeltaInTx>[0],
      db as unknown as Parameters<typeof applyOrderAnalyticsDeltaInTx>[1],
      'event_refund_1',
      paidOrder,
      refundedOrder
    );
  });

  const daily = db.getDocData('analyticsDaily', '2026-11-12') as unknown as AnalyticsBucket;
  assert.equal(daily.grossCollectedPhp, 30000, 'Gross collected remains 30000');
  assert.equal(daily.refundedPhp, 5000, 'Refunded amount increments by 5000');
  assert.equal(daily.netCollectedPhp, 25000, 'Net collected is reduced to 25000 (30000 - 5000)');
  assert.equal(daily.paidOrderCount, 1, 'Paid count remains 1');

  const monthly = db.getDocData('analyticsMonthly', '2026-11') as unknown as AnalyticsBucket;
  assert.equal(monthly.refundedPhp, 5000);
  assert.equal(monthly.netCollectedPhp, 25000);
});

test('analytics-rollups: reversal from paid to unpaid correctly subtracts net revenue (zero prior refund)', async () => {
  const db = new MockFirestoreDb();
  const order = createSampleOrder();
  const paidOrder: Order = {
    ...order,
    paymentStatus: 'paid',
    paidAt: new Date('2026-11-12T04:30:00.000Z'),
  };

  // 1. Mark paid
  await db.runTransaction(async (tx) => {
    await applyOrderAnalyticsDeltaInTx(
      tx as unknown as Parameters<typeof applyOrderAnalyticsDeltaInTx>[0],
      db as unknown as Parameters<typeof applyOrderAnalyticsDeltaInTx>[1],
      'evt_paid_for_reversal_1',
      order,
      paidOrder
    );
  });

  const unpaidReversedOrder: Order = {
    ...paidOrder,
    paymentStatus: 'pending',
  };

  // 2. Reverse to unpaid
  await db.runTransaction(async (tx) => {
    await applyOrderAnalyticsDeltaInTx(
      tx as unknown as Parameters<typeof applyOrderAnalyticsDeltaInTx>[0],
      db as unknown as Parameters<typeof applyOrderAnalyticsDeltaInTx>[1],
      'evt_reverse_to_unpaid_1',
      paidOrder,
      unpaidReversedOrder
    );
  });

  const daily = db.getDocData('analyticsDaily', '2026-11-12') as unknown as AnalyticsBucket;
  assert.equal(daily.paidOrderCount, 0, 'Paid count reverses to 0');
  assert.equal(daily.grossCollectedPhp, 0, 'Gross collected reverses to 0');
  assert.equal(daily.netCollectedPhp, 0, 'Net collected reverses to 0 (NOT +30000)');
});

test('analytics-rollups: reversal from paid to unpaid with prior refund subtracts remaining net revenue', async () => {
  const db = new MockFirestoreDb();
  const order = createSampleOrder();
  const paidOrder: Order = {
    ...order,
    paymentStatus: 'paid',
    paidAt: new Date('2026-11-12T04:30:00.000Z'),
  };

  // 1. Initial payment
  await db.runTransaction(async (tx) => {
    await applyOrderAnalyticsDeltaInTx(
      tx as unknown as Parameters<typeof applyOrderAnalyticsDeltaInTx>[0],
      db as unknown as Parameters<typeof applyOrderAnalyticsDeltaInTx>[1],
      'evt_paid_with_refund_base',
      order,
      paidOrder
    );
  });

  // 2. Partial refund of 5000 (net = 25000)
  const refundedOrder: Order = {
    ...paidOrder,
    refundStatus: 'partial',
    refundedAmount: 5000,
  };

  await db.runTransaction(async (tx) => {
    await applyOrderAnalyticsDeltaInTx(
      tx as unknown as Parameters<typeof applyOrderAnalyticsDeltaInTx>[0],
      db as unknown as Parameters<typeof applyOrderAnalyticsDeltaInTx>[1],
      'evt_refund_step_2',
      paidOrder,
      refundedOrder
    );
  });

  // 3. Reversal to unpaid
  const reversedUnpaidOrder: Order = {
    ...refundedOrder,
    paymentStatus: 'pending',
  };

  await db.runTransaction(async (tx) => {
    await applyOrderAnalyticsDeltaInTx(
      tx as unknown as Parameters<typeof applyOrderAnalyticsDeltaInTx>[0],
      db as unknown as Parameters<typeof applyOrderAnalyticsDeltaInTx>[1],
      'evt_reverse_with_refund_step_3',
      refundedOrder,
      reversedUnpaidOrder
    );
  });

  const daily = db.getDocData('analyticsDaily', '2026-11-12') as unknown as AnalyticsBucket;
  assert.equal(daily.paidOrderCount, 0, 'Paid count reverses to 0');
  assert.equal(daily.grossCollectedPhp, 0, 'Gross collected reverses to 0');
  assert.equal(daily.refundedPhp, 0, 'Refunded amount reverses to 0');
  assert.equal(daily.netCollectedPhp, 0, 'Net collected reverses to 0 (NOT +35000)');
});

test('analytics-rollups: cancelling an unpaid order updates cancelledOrderCount without changing netCollectedPhp', async () => {
  const db = new MockFirestoreDb();
  const unpaidOrder = createSampleOrder({
    id: 'ord_unpaid_1',
    paymentStatus: 'pending',
    status: 'pending',
    totalPrice: 45000,
    createdAt: new Date('2026-11-12T05:00:00.000Z'),
  });

  const cancelledOrder: Order = {
    ...unpaidOrder,
    status: 'cancelled',
    paymentStatus: 'cancelled',
    cancelledAt: new Date('2026-11-12T05:30:00.000Z'),
  };

  await db.runTransaction(async (tx) => {
    await applyOrderAnalyticsDeltaInTx(
      tx as unknown as Parameters<typeof applyOrderAnalyticsDeltaInTx>[0],
      db as unknown as Parameters<typeof applyOrderAnalyticsDeltaInTx>[1],
      'event_cancel_unpaid_1',
      unpaidOrder,
      cancelledOrder
    );
  });

  const daily = db.getDocData('analyticsDaily', '2026-11-12') as unknown as AnalyticsBucket;
  assert.ok(daily, 'Daily bucket should exist');
  assert.equal(daily.cancelledOrderCount, 1, 'Cancelled count increments to 1');
  assert.equal(daily.netCollectedPhp, 0, 'Net collected remains 0');
  assert.equal(daily.grossCollectedPhp, 0, 'Gross collected remains 0');
  assert.equal(daily.paidOrderCount, 0, 'Paid count remains 0');
});

test('analytics-rollups: all reads occur before writes in Firestore transaction (CRITICAL RULE)', async () => {
  const db = new MockFirestoreDb();
  const order = createSampleOrder();
  const paidOrder: Order = { ...order, paymentStatus: 'paid' };

  await assert.doesNotReject(async () => {
    await db.runTransaction(async (tx) => {
      // In this transaction, applyOrderAnalyticsDeltaInTx performs reads before writes
      await applyOrderAnalyticsDeltaInTx(
        tx as unknown as Parameters<typeof applyOrderAnalyticsDeltaInTx>[0],
        db as unknown as Parameters<typeof applyOrderAnalyticsDeltaInTx>[1],
        'event_read_before_write',
        order,
        paidOrder
      );
    });
  });
});
