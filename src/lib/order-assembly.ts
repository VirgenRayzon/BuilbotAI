import type { Order, OrderItem } from './types';
import { groupOrderItems, type OrderItemGroup } from './order-item-groups';

export type RigAssemblyStep = 'picking' | 'assembly' | 'testing' | 'qc';

export type RigVerificationStatus = 'unverified' | 'in_progress' | 'passed' | 'failed';

export interface ComponentPickItem {
  lineId: string;
  partId: string;
  name: string;
  category: string;
  picked: boolean;
  notes?: string;
}

export interface AssemblyStepResult {
  completed: boolean;
  passed?: boolean;
  notes?: string;
  verifiedAt?: unknown;
  verifiedBy?: {
    uid: string;
    name: string;
    role: 'Manager' | 'Super Admin' | 'Staff';
  };
}

export interface RigVerificationRecord {
  rigId: string;
  rigName: string;
  orderId: string;
  status: RigVerificationStatus;
  picking: {
    completed: boolean;
    items: ComponentPickItem[];
    verifiedAt?: unknown;
    verifiedBy?: {
      uid: string;
      name: string;
      role: 'Manager' | 'Super Admin' | 'Staff';
    };
  };
  assembly: AssemblyStepResult;
  testing: AssemblyStepResult;
  qc: AssemblyStepResult;
  updatedAt?: unknown;
  createdAt?: unknown;
}

export interface CustomRigInstance {
  rigId: string;
  rigName: string;
  items: OrderItem[];
}

/**
 * Extracts distinct custom rigs from an order using item groups.
 * Prebuilt rigs and additional parts are excluded.
 */
export function getCustomRigsFromOrder(
  order: Pick<Order, 'items' | 'type' | 'prebuiltName'>
): CustomRigInstance[] {
  const groups = groupOrderItems(order);
  const customGroups = groups.filter((g) => g.type === 'custom-build');

  return customGroups.map((grp, idx) => {
    const firstItem = grp.items[0];
    const rigId = firstItem?.rigInstanceId || (grp as any).id || `rig_${idx}`;
    return {
      rigId,
      rigName: grp.name || `Custom Rig #${idx + 1}`,
      items: grp.items,
    };
  });
}

/**
 * Checks if an order requires custom rig assembly verification.
 * Prebuilts and parts-only orders do not require the custom-rig verification checklist.
 */
export function isOrderCustomRigAssemblyRequired(
  order: Pick<Order, 'items' | 'type' | 'prebuiltName' | 'status' | 'fulfillmentStage'>
): boolean {
  if (order.status === 'cancelled') return false;
  const customRigs = getCustomRigsFromOrder(order);
  return customRigs.length > 0;
}

/**
 * Derives a stable line identifier for an item if not already set.
 */
export function getOrderItemLineId(item: OrderItem, index: number, rigId?: string): string {
  if (item.lineId) return item.lineId;
  const prefix = rigId ? `${rigId}_` : '';
  return `${prefix}line_${index}_${item.productId || item.id || 'part'}`;
}

/**
 * Initializes a blank verification record for a custom rig.
 */
export function initializeRigVerification(
  orderId: string,
  rigId: string,
  rigName: string,
  items: OrderItem[],
  createdAt?: unknown
): RigVerificationRecord {
  const pickItems: ComponentPickItem[] = items.map((item, idx) => ({
    lineId: getOrderItemLineId(item, idx, rigId),
    partId: item.productId || item.id,
    name: item.name,
    category: item.category || 'Component',
    picked: false,
  }));

  return {
    rigId,
    rigName,
    orderId,
    status: 'unverified',
    picking: {
      completed: false,
      items: pickItems,
    },
    assembly: {
      completed: false,
    },
    testing: {
      completed: false,
    },
    qc: {
      completed: false,
    },
    createdAt,
    updatedAt: createdAt,
  };
}

export interface StepUpdateInput {
  pickedLineIds?: string[];
  completed?: boolean;
  passed?: boolean;
  notes?: string;
}

/**
 * Applies a step verification update and strictly invalidates downstream steps
 * when an earlier stage is corrected or un-done.
 */
export function applyStepUpdateAndInvalidation(
  current: RigVerificationRecord,
  step: RigAssemblyStep,
  update: StepUpdateInput,
  verifier: { uid: string; name: string; role: 'Manager' | 'Super Admin' | 'Staff' },
  timestamp: unknown
): RigVerificationRecord {
  const record: RigVerificationRecord = JSON.parse(JSON.stringify(current));
  record.updatedAt = timestamp;

  if (step === 'picking') {
    if (Array.isArray(update.pickedLineIds)) {
      const pickedSet = new Set(update.pickedLineIds);
      record.picking.items = record.picking.items.map((it) => ({
        ...it,
        picked: pickedSet.has(it.lineId),
      }));
    } else if (update.completed !== undefined) {
      record.picking.items = record.picking.items.map((it) => ({
        ...it,
        picked: Boolean(update.completed),
      }));
    }

    const allPicked =
      record.picking.items.length > 0 &&
      record.picking.items.every((it) => it.picked);

    record.picking.completed = allPicked;
    record.picking.verifiedAt = timestamp;
    record.picking.verifiedBy = verifier;

    if (!allPicked) {
      record.assembly = { completed: false };
      record.testing = { completed: false, passed: false };
      record.qc = { completed: false, passed: false };
    }
  } else if (step === 'assembly') {
    if (!record.picking.completed) {
      throw new Error('Component picking must be completed before marking assembly complete.');
    }

    const isAssemblyComplete = Boolean(update.completed);
    record.assembly = {
      completed: isAssemblyComplete,
      notes: update.notes !== undefined ? update.notes : record.assembly.notes,
      verifiedAt: timestamp,
      verifiedBy: verifier,
    };

    if (!isAssemblyComplete) {
      record.testing = { completed: false, passed: false };
      record.qc = { completed: false, passed: false };
    }
  } else if (step === 'testing') {
    if (!record.assembly.completed) {
      throw new Error('Assembly must be completed before recording hardware testing.');
    }

    const isTestingComplete = Boolean(update.completed ?? (update.passed !== undefined));
    const passed = Boolean(update.passed);

    record.testing = {
      completed: isTestingComplete,
      passed,
      notes: update.notes !== undefined ? update.notes : record.testing.notes,
      verifiedAt: timestamp,
      verifiedBy: verifier,
    };

    if (!isTestingComplete || !passed) {
      record.qc = { completed: false, passed: false };
    }
  } else if (step === 'qc') {
    if (!record.testing.completed || !record.testing.passed) {
      throw new Error('Hardware testing must be completed and passed before performing final QC.');
    }

    const isQcComplete = Boolean(update.completed ?? (update.passed !== undefined));
    const passed = Boolean(update.passed);

    record.qc = {
      completed: isQcComplete,
      passed,
      notes: update.notes !== undefined ? update.notes : record.qc.notes,
      verifiedAt: timestamp,
      verifiedBy: verifier,
    };
  }

  if (record.qc.completed && record.qc.passed) {
    record.status = 'passed';
  } else if (
    (record.testing.completed && record.testing.passed === false) ||
    (record.qc.completed && record.qc.passed === false)
  ) {
    record.status = 'failed';
  } else if (
    record.picking.completed ||
    record.assembly.completed ||
    record.testing.completed ||
    record.picking.items.some((it) => it.picked)
  ) {
    record.status = 'in_progress';
  } else {
    record.status = 'unverified';
  }

  return record;
}

/**
 * Validates that all custom rigs in an order have completed and passed verification.
 * Throws an error if any custom rig is unverified or failed.
 * Historical delivered orders are exempted from retroactive blocking.
 */
export function assertCustomRigDispatchAllowed(
  order: Order,
  verifications: Record<string, RigVerificationRecord | null | undefined>
): void {
  if (order.fulfillmentStage === 'delivered' || order.status === 'finished building') {
    return;
  }

  const customRigs = getCustomRigsFromOrder(order);
  if (customRigs.length === 0) {
    return; // No custom rigs, allowed!
  }

  for (const rig of customRigs) {
    const v = verifications[rig.rigId];
    if (!v) {
      throw new Error(
        `Cannot dispatch order: Custom rig "${rig.rigName}" has not been verified for assembly.`
      );
    }
    if (v.status !== 'passed') {
      const reason =
        v.status === 'failed'
          ? 'verification failed testing or QC'
          : !v.picking.completed
            ? 'component picking is incomplete'
            : !v.assembly.completed
              ? 'physical assembly is incomplete'
              : !v.testing.passed
                ? 'hardware testing is pending or failed'
                : 'final QC is pending';
      throw new Error(
        `Cannot dispatch order: Custom rig "${rig.rigName}" verification is not passed (${reason}).`
      );
    }
  }
}

/**
 * Serializes any timestamp-like value (Date, Firestore Timestamp, {_seconds, _nanoseconds}, etc.)
 * into a standard ISO 8601 string or null.
 */
export function serializeTimestamp(val: unknown): string | null {
  if (!val) return null;
  if (typeof val === 'string') return val;
  if (val instanceof Date) return val.toISOString();
  if (typeof val === 'number') {
    return new Date(val > 1e11 ? val : val * 1000).toISOString();
  }
  if (typeof val === 'object' && val !== null) {
    if ('toDate' in val && typeof (val as { toDate?: () => Date }).toDate === 'function') {
      try {
        return (val as { toDate: () => Date }).toDate().toISOString();
      } catch {
      }
    }
    if ('toMillis' in val && typeof (val as { toMillis?: () => number }).toMillis === 'function') {
      try {
        return new Date((val as { toMillis: () => number }).toMillis()).toISOString();
      } catch {
      }
    }
    if ('_seconds' in val && typeof (val as { _seconds?: number })._seconds === 'number') {
      return new Date((val as { _seconds: number })._seconds * 1000).toISOString();
    }
    if ('seconds' in val && typeof (val as { seconds?: number }).seconds === 'number') {
      return new Date((val as { seconds: number }).seconds * 1000).toISOString();
    }
  }
  return null;
}

/**
 * Normalizes a RigVerificationRecord into a 100% plain JSON-serializable object
 * safe to cross the React Server Components / Server Actions boundary (Flight serialization).
 */
export function serializeRigVerificationRecord(
  record: RigVerificationRecord
): RigVerificationRecord {
  const plain: RigVerificationRecord = {
    ...record,
    createdAt: serializeTimestamp(record.createdAt),
    updatedAt: serializeTimestamp(record.updatedAt),
    picking: {
      ...record.picking,
      items: Array.isArray(record.picking?.items)
        ? record.picking.items.map((it) => ({ ...it }))
        : [],
      verifiedAt: serializeTimestamp(record.picking?.verifiedAt),
      verifiedBy: record.picking?.verifiedBy ? { ...record.picking.verifiedBy } : undefined,
    },
    assembly: {
      ...record.assembly,
      verifiedAt: serializeTimestamp(record.assembly?.verifiedAt),
      verifiedBy: record.assembly?.verifiedBy ? { ...record.assembly.verifiedBy } : undefined,
    },
    testing: {
      ...record.testing,
      verifiedAt: serializeTimestamp(record.testing?.verifiedAt),
      verifiedBy: record.testing?.verifiedBy ? { ...record.testing.verifiedBy } : undefined,
    },
    qc: {
      ...record.qc,
      verifiedAt: serializeTimestamp(record.qc?.verifiedAt),
      verifiedBy: record.qc?.verifiedBy ? { ...record.qc.verifiedBy } : undefined,
    },
  };

  return JSON.parse(JSON.stringify(plain));
}
