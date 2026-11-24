"use server";

import { randomUUID } from 'node:crypto';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { getOrderActor } from '@/lib/server/order-auth';
import { writeOrderChange } from '@/lib/server/order-activity';
import { toFirestoreDocument } from '@/lib/firestore-document';
import type { Order } from '@/lib/types';
import {
  applyStepUpdateAndInvalidation,
  getCustomRigsFromOrder,
  initializeRigVerification,
  serializeRigVerificationRecord,
  type RigAssemblyStep,
  type RigVerificationRecord,
} from '@/lib/order-assembly';

const updateStepSchema = z.object({
  orderId: z.string().min(1).max(128).regex(/^[a-zA-Z0-9_-]+$/),
  rigId: z.string().min(1).max(128),
  step: z.enum(['picking', 'assembly', 'testing', 'qc']),
  update: z.object({
    pickedLineIds: z.array(z.string()).optional(),
    completed: z.boolean().optional(),
    passed: z.boolean().optional(),
    notes: z.string().max(500).optional(),
  }),
  idToken: z.string().min(1),
});

export async function updateRigAssemblyStep(
  input: z.infer<typeof updateStepSchema>
): Promise<{
  success: boolean;
  error?: string;
  verification?: RigVerificationRecord;
}> {
  const parsed = updateStepSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || 'Invalid assembly step request.',
    };
  }

  try {
    const { orderId, rigId, step, update, idToken } = parsed.data;
    const { decoded, firestore, actorProfile, isManager, isSuperAdmin } =
      await getOrderActor(idToken);

    if (!isManager && !isSuperAdmin) {
      return {
        success: false,
        error: 'Only Managers and Super Admins can verify custom rig assembly.',
      };
    }

    const actorRole: 'Manager' | 'Super Admin' = isSuperAdmin
      ? 'Super Admin'
      : 'Manager';
    const actorName =
      actorProfile?.name || decoded.name || decoded.email || 'Staff Verifier';

    const verifier = {
      uid: decoded.uid,
      name: actorName,
      role: actorRole,
    };

    const orderRef = firestore.collection('orders').doc(orderId);
    const rigRef = orderRef.collection('assembly').doc(rigId);

    const result = await firestore.runTransaction(async (transaction) => {
      const orderSnap = await transaction.get(orderRef);
      if (!orderSnap.exists) {
        throw new Error('Order not found.');
      }

      const order = orderSnap.data() as Order;
      if (order.status === 'cancelled' || order.isArchived) {
        throw new Error('Cancelled or archived orders cannot update assembly verification.');
      }

      const customRigs = getCustomRigsFromOrder(order);
      const targetRig = customRigs.find((r) => r.rigId === rigId);
      if (!targetRig) {
        throw new Error(`Custom rig "${rigId}" not found in this order.`);
      }

      const rigSnap = await transaction.get(rigRef);
      let record: RigVerificationRecord;

      const now = admin.firestore.Timestamp.now();

      if (rigSnap.exists) {
        record = rigSnap.data() as RigVerificationRecord;
      } else {
        record = initializeRigVerification(
          orderId,
          rigId,
          targetRig.rigName,
          targetRig.items,
          now
        );
      }

      const updatedRecord = applyStepUpdateAndInvalidation(
        record,
        step as RigAssemblyStep,
        update,
        verifier,
        now
      );

      transaction.set(rigRef, toFirestoreDocument(updatedRecord));

      let allPassed = updatedRecord.status === 'passed';
      if (allPassed && customRigs.length > 1) {
        for (const otherRig of customRigs) {
          if (otherRig.rigId === rigId) continue;
          const otherSnap = await transaction.get(
            orderRef.collection('assembly').doc(otherRig.rigId)
          );
          if (!otherSnap.exists || otherSnap.data()?.status !== 'passed') {
            allPassed = false;
            break;
          }
        }
      }

      const eventDetails = `Custom Rig "${targetRig.rigName}" ${step.toUpperCase()}: ${
        step === 'picking'
          ? updatedRecord.picking.completed
            ? 'All components picked'
            : `${updatedRecord.picking.items.filter((i) => i.picked).length}/${updatedRecord.picking.items.length} components picked`
          : step === 'assembly'
            ? updatedRecord.assembly.completed
              ? 'Physical assembly completed'
              : 'Assembly incomplete'
            : step === 'testing'
              ? updatedRecord.testing.passed
                ? 'Hardware testing PASSED'
                : 'Hardware testing FAILED'
              : updatedRecord.qc.passed
                ? 'Final QC PASSED'
                : 'Final QC FAILED'
      }${update.notes ? ` — Note: ${update.notes}` : ''}`;

      const activityRef = orderRef.collection('activity').doc(randomUUID());
      transaction.create(
        activityRef,
        toFirestoreDocument({
          id: activityRef.id,
          actorId: decoded.uid,
          actorName,
          actorRole,
          type: 'assembly_verification',
          details: eventDetails,
          createdAt: now,
        })
      );

      writeOrderChange(
        transaction,
        orderRef,
        order,
        {
          assemblyVerificationPassed: allPassed,
          updatedAt: now,
        },
        { actorId: decoded.uid, actorName, actorRole }
      );

      return updatedRecord;
    });

    return {
      success: true,
      verification: serializeRigVerificationRecord(result),
    };
  } catch (error) {
    console.error('updateRigAssemblyStep failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update assembly verification.',
    };
  }
}

export async function getRigAssemblyVerifications(input: {
  orderId: string;
  idToken: string;
}): Promise<{
  success: boolean;
  verifications?: Record<string, RigVerificationRecord>;
  error?: string;
}> {
  try {
    const { decoded, firestore, isManager, isSuperAdmin } = await getOrderActor(input.idToken);
    const orderRef = firestore.collection('orders').doc(input.orderId);

    if (!isManager && !isSuperAdmin) {
      const orderSnap = await orderRef.get();
      if (!orderSnap.exists || orderSnap.data()?.userId !== decoded.uid) {
        return { success: false, error: 'Unauthorized.' };
      }
    }

    const snap = await orderRef.collection('assembly').get();

    const verifications: Record<string, RigVerificationRecord> = {};
    for (const doc of snap.docs) {
      verifications[doc.id] = serializeRigVerificationRecord(doc.data() as RigVerificationRecord);
    }

    return {
      success: true,
      verifications,
    };
  } catch (error) {
    console.error('getRigAssemblyVerifications failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch assembly verifications.',
    };
  }
}
