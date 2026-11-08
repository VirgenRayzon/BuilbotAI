'use client';

import { useCallback, useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import type { OrderItem } from '@/lib/types';
import {
  initializeRigVerification,
  type RigAssemblyStep,
  type RigVerificationRecord,
  type StepUpdateInput,
} from '@/lib/order-assembly';
import {
  getRigAssemblyVerifications,
  updateRigAssemblyStep,
} from '../order-assembly-actions';

export function useOrderAssembly(
  orderId: string,
  rigId: string,
  rigName: string,
  items: OrderItem[],
  enabled = true
) {
  const [verification, setVerification] = useState<RigVerificationRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVerifications = useCallback(async () => {
    if (!enabled || !orderId || !rigId) return;
    setLoading(true);
    setError(null);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        setVerification(initializeRigVerification(orderId, rigId, rigName, items));
        setLoading(false);
        return;
      }
      const idToken = await user.getIdToken();
      const res = await getRigAssemblyVerifications({ orderId, idToken });
      if (res.success && res.verifications && res.verifications[rigId]) {
        setVerification(res.verifications[rigId]);
      } else {
        setVerification(initializeRigVerification(orderId, rigId, rigName, items));
      }
    } catch (err) {
      console.error('Failed to load rig verification:', err);
      setError(err instanceof Error ? err.message : 'Failed to load verification');
      setVerification(initializeRigVerification(orderId, rigId, rigName, items));
    } finally {
      setLoading(false);
    }
  }, [enabled, orderId, rigId, rigName, items]);

  useEffect(() => {
    void fetchVerifications();
  }, [fetchVerifications]);

  const updateStep = useCallback(
    async (step: RigAssemblyStep, update: StepUpdateInput) => {
      setSaving(true);
      setError(null);
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error('You must be signed in to verify assembly.');
        const idToken = await user.getIdToken();

        const res = await updateRigAssemblyStep({
          orderId,
          rigId,
          step,
          update,
          idToken,
        });

        if (!res.success || !res.verification) {
          throw new Error(res.error || 'Failed to update assembly step.');
        }

        setVerification(res.verification);
        return { success: true };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Step update failed';
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setSaving(false);
      }
    },
    [orderId, rigId]
  );

  return {
    verification,
    loading,
    saving,
    error,
    updateStep,
    reload: fetchVerifications,
  };
}
