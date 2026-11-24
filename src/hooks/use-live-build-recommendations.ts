'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import { liveRecommendationResponseSchema, type LiveRecommendationRequest, type LiveRecommendationResponse } from '@/lib/live-build-recommendation-schema';
import { getLiveCandidates, selectedInventoryParts, type BuilderSelection } from '@/lib/live-build-recommendations';
import type { Part, Resolution, WorkloadType } from '@/lib/types';

export function useLiveBuildRecommendations({
  allParts, build, resolution, workload, preferredCategory, user, onAddPart, enabled,
}: {
  allParts: Part[];
  build: BuilderSelection;
  resolution: Resolution;
  workload: WorkloadType;
  preferredCategory?: string | null;
  user: User | null;
  onAddPart: (part: Part) => void;
  enabled: boolean;
}) {
  const [budgetInput, setBudgetInput] = useState('');
  const [verified, setVerified] = useState<{ key: string; response: LiveRecommendationResponse } | null>(null);
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const budgetNumber = Number(budgetInput);
  const budget = Number.isFinite(budgetNumber) && budgetNumber > 0 ? budgetNumber : undefined;
  const local = useMemo(() => enabled
    ? getLiveCandidates(allParts, build, { budget, preferredCategory, resolution, workload })
    : { candidates: [], message: '', category: null, projection: null },
  [allParts, build, budget, enabled, preferredCategory, resolution, workload]);
  const selected = selectedInventoryParts(build);
  const includedCooler = !Array.isArray(build.Cooler) && build.Cooler?.id === 'included-stock-cooler';
  const candidateRefs = local.candidates.map(({ part, role }) => ({ category: part.category, id: part.id, role }));
  const key = JSON.stringify({ selected, includedCooler,
    candidates: local.candidates.map(({ part, role }) => [part.category, part.id, part.stock, part.price, role]),
    budget, resolution, workload });
  const latestKey = useRef(key);
  latestKey.current = key;

  const request = useCallback(async (mode: LiveRecommendationRequest['mode'],
    candidates: LiveRecommendationRequest['candidates'], signal?: AbortSignal) => {
    if (!enabled) throw new Error('Live builder recommendations are disabled.');
    if (!user) throw new Error('Sign in to check recommendations.');
    const token = await user.getIdToken();
    const body: LiveRecommendationRequest = { mode, selected, candidates, includedCooler, budget };
    const response = await fetch('/api/builder/live-recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
      signal,
    });
    const data: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const message = data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
        ? data.error : 'Could not check current inventory. Please try again.';
      throw new Error(message);
    }
    if (data === null) throw new Error('Could not read the inventory response. Please try again.');
    return liveRecommendationResponseSchema.parse(data);
  }, [user, key, enabled]);

  useEffect(() => {
    if (!enabled || (!candidateRefs.length && !budget) || !user) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void request('validate', candidateRefs, controller.signal).then(response => {
        if (latestKey.current !== key) return;
        setVerified({ key, response });
        setFailure(null);
      }).catch(cause => {
        if (controller.signal.aborted || latestKey.current !== key) return;
        setFailure({ key, message: cause instanceof Error ? cause.message : 'Could not check current inventory.' });
      });
    }, 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [key, user, request, retryCount, budget, enabled]);

  const currentVerified = verified?.key === key ? verified.response : null;
  const error = failure?.key === key ? failure.message : '';
  const projection = currentVerified?.projection ?? local.projection;
  const shortfall = budget && projection?.minimumCompleteTotal !== null && projection?.minimumCompleteTotal !== undefined
    ? Math.ceil(projection.minimumCompleteTotal - budget) : 0;
  const suggestions = currentVerified
    ? currentVerified.suggestions.flatMap(item => {
      const localPart = local.candidates.find(candidate => candidate.part.id === item.id && candidate.part.category === item.category);
      if (!localPart) return [];
      return [{ ...item, part: { ...localPart.part, name: item.name, price: item.price, stock: item.stock } }];
    })
    : local.candidates.slice(0, 2).map(item => ({
      id: item.part.id, category: item.part.category, name: item.part.name,
      price: item.part.price, stock: item.part.stock, action: item.action,
      reason: item.reason, role: item.role, projectedCompleteTotal: item.projectedCompleteTotal, part: item.part,
    }));

  const apply = useCallback(async (suggestion: typeof suggestions[number]) => {
    if (applyingId || latestKey.current !== key) return;
    setApplyingId(suggestion.id);
    try {
      const { suggestions: [fresh] } = await request('verify', [{
        category: suggestion.category, id: suggestion.id, role: suggestion.role,
      }]);
      if (latestKey.current !== key) return;
      if (!fresh) throw new Error('This part is no longer available for this build.');
      onAddPart({ ...suggestion.part, name: fresh.name, price: fresh.price, stock: fresh.stock });
    } catch (cause) {
      if (latestKey.current === key) setFailure({ key, message: cause instanceof Error ? cause.message : 'Could not apply this part.' });
    } finally {
      setApplyingId(null);
    }
  }, [applyingId, key, onAddPart, request]);

  return {
    suggestions,
    message: shortfall > 0
      ? `At least ₱${shortfall.toLocaleString('en-PH')} more is needed to finish all core parts. Replace a selected part or raise the budget.`
      : currentVerified?.suggestions.length === 0 && local.candidates.length > 0
        ? `No currently available ${local.category || 'parts'} leave enough for the remaining core parts.`
        : local.message,
    category: local.category,
    projection,
    budget,
    verified: currentVerified !== null,
    checking: enabled && (!!candidateRefs.length || !!budget) && currentVerified === null && !error,
    error,
    applyingId,
    apply,
    budgetInput,
    setBudgetInput,
    retry: () => { setFailure(null); setRetryCount(count => count + 1); },
  };
}
