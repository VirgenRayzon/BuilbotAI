'use client';

import { useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth, useFirestore } from '@/firebase';
import type { Order, OrderItem } from '@/lib/types';
import {
  initializeRigVerification,
  type CustomRigInstance,
  type RigVerificationRecord,
} from '@/lib/order-assembly';
import {
  getAssemblyRigsFromOrder,
  getOrderPlacedSummary,
  shouldSubscribeToAssemblyVerification,
} from '@/lib/customer-order-activity';
import { getRigAssemblyVerifications } from '@/app/admin/order-assembly-actions';

export { getAssemblyRigsFromOrder, getOrderPlacedSummary };

export function useCustomerRigAssembly(order: Order, selectedRigId?: string) {
  const auth = useAuth();
  const firestore = useFirestore();

  const rigs = useMemo(() => getAssemblyRigsFromOrder(order), [order]);
  const activeRig = useMemo(() => {
    if (!rigs.length) return null;
    if (selectedRigId) {
      return rigs.find((r) => r.rigId === selectedRigId) || rigs[0];
    }
    return rigs[0];
  }, [rigs, selectedRigId]);

  const [verification, setVerification] = useState<RigVerificationRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeRig) {
      setVerification(null);
      return;
    }

    const isAllComplete =
      order.assemblyVerificationPassed === true ||
      order.fulfillmentStage === 'out_for_delivery' ||
      order.fulfillmentStage === 'delivered' ||
      order.status === 'finished building';

    const base = initializeRigVerification(
      order.id,
      activeRig.rigId,
      activeRig.rigName,
      activeRig.items,
      order.createdAt
    );

    if (isAllComplete) {
      base.status = 'passed';
      base.picking.completed = true;
      base.picking.items.forEach((it) => {
        it.picked = true;
      });
      base.assembly.completed = true;
      base.testing.completed = true;
      base.testing.passed = true;
      base.qc.completed = true;
      base.qc.passed = true;
    }

    if (!shouldSubscribeToAssemblyVerification(order)) {
      setVerification(base);
      setLoading(false);
      setError(null);
      return;
    }

    if (!firestore || !order.id) {
      setVerification(base);
      return;
    }

    setLoading(true);
    setError(null);

    const rigDocRef = doc(firestore, 'orders', order.id, 'assembly', activeRig.rigId);

    const unsubscribe = onSnapshot(
      rigDocRef,
      (docSnap) => {
        setLoading(false);
        if (docSnap.exists()) {
          const data = docSnap.data() as RigVerificationRecord;
          setVerification(data);
        } else {
          setVerification(base);
        }
      },
      (err) => {
        console.warn('Realtime assembly listener error, falling back to server action:', err);
        const user = auth?.currentUser;
        if (user) {
          user
            .getIdToken()
            .then((token) => getRigAssemblyVerifications({ orderId: order.id, idToken: token }))
            .then((res) => {
              if (res.success && res.verifications?.[activeRig.rigId]) {
                setVerification(res.verifications[activeRig.rigId]);
              } else {
                setVerification(base);
              }
            })
            .catch(() => {
              setVerification(base);
            })
            .finally(() => setLoading(false));
        } else {
          setVerification(base);
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, [firestore, auth, order.id, order.assemblyVerificationPassed, order.fulfillmentStage, order.status, order.createdAt, activeRig]);

  return {
    rigs,
    activeRig,
    verification,
    loading,
    error,
  };
}
