"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { useUserProfile } from '@/context/user-profile';
import type { Part } from '@/lib/types';
import { useCritiqueLogic } from '@/app/ai-build-advisor/hooks/use-critique-logic';
import { useRecommendationLogic } from '@/app/ai-build-advisor/hooks/use-recommendation-logic';

interface AdvisorJobsContextValue {
  critique: ReturnType<typeof useCritiqueLogic>;
  recommendation: ReturnType<typeof useRecommendationLogic>;
  setAdvisorData: (allParts: Part[], isAiKillSwitch: boolean) => void;
}

const AdvisorJobsContext = createContext<AdvisorJobsContextValue | null>(null);

function AdvisorJobsScope({ children }: { children: ReactNode }) {
  const [advisorData, setAdvisorDataState] = useState<{ allParts: Part[]; isAiKillSwitch: boolean }>({
    allParts: [],
    isAiKillSwitch: false,
  });
  const setAdvisorData = useCallback((allParts: Part[], isAiKillSwitch: boolean) => {
    setAdvisorDataState(current => current.allParts === allParts && current.isAiKillSwitch === isAiKillSwitch
      ? current
      : { allParts, isAiKillSwitch });
  }, []);
  const critique = useCritiqueLogic(advisorData.isAiKillSwitch);
  const recommendation = useRecommendationLogic(advisorData.isAiKillSwitch, advisorData.allParts);

  return (
    <AdvisorJobsContext.Provider value={{ critique, recommendation, setAdvisorData }}>
      {children}
    </AdvisorJobsContext.Provider>
  );
}

export function AdvisorJobsProvider({ children }: { children: ReactNode }) {
  const { authUser } = useUserProfile();
  // A new account starts with a separate set of in-flight jobs and results.
  return <AdvisorJobsScope key={authUser?.uid ?? 'signed-out'}>{children}</AdvisorJobsScope>;
}

export function useAdvisorJobs() {
  const context = useContext(AdvisorJobsContext);
  if (!context) throw new Error('useAdvisorJobs must be used inside AdvisorJobsProvider');
  return context;
}
