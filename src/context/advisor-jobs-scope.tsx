'use client';

import { useCallback, useState, type ReactNode } from 'react';
import type { Part } from '@/lib/types';
import { useCritiqueLogic } from '@/app/ai-build-advisor/hooks/use-critique-logic';
import { useRecommendationLogic } from '@/app/ai-build-advisor/hooks/use-recommendation-logic';
import { AdvisorJobsContext } from './advisor-jobs-context';

export default function AdvisorJobsScope({ children }: { children: ReactNode }) {
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
