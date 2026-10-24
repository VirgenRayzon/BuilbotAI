"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useUserProfile } from '@/context/user-profile';
import { NeutralPageLoader } from '@/components/neutral-page-loader';
import type { Part } from '@/lib/types';
import type { useCritiqueLogic } from '@/app/ai-build-advisor/hooks/use-critique-logic';
import type { useRecommendationLogic } from '@/app/ai-build-advisor/hooks/use-recommendation-logic';

interface AdvisorJobsContextValue {
  critique: ReturnType<typeof useCritiqueLogic>;
  recommendation: ReturnType<typeof useRecommendationLogic>;
  setAdvisorData: (allParts: Part[], isAiKillSwitch: boolean) => void;
}

export const AdvisorJobsContext = createContext<AdvisorJobsContextValue | null>(null);

const AdvisorJobsScope = dynamic(() => import('./advisor-jobs-scope'), {
  loading: () => <NeutralPageLoader />,
});

export function AdvisorJobsProvider({ children }: { children: ReactNode }) {
  const { authUser } = useUserProfile();
  const pathname = usePathname();
  const onAdvisorPage = pathname === '/ai-build-advisor';
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    if (onAdvisorPage) setActivated(true);
  }, [onAdvisorPage]);

  // Load AI hooks on first use, then retain their scope across navigation so
  // in-flight jobs and results continue to work away from the advisor page.
  if (!activated && !onAdvisorPage) return children;
  // A new account starts with a separate set of in-flight jobs and results.
  return <AdvisorJobsScope key={authUser?.uid ?? 'signed-out'}>{children}</AdvisorJobsScope>;
}

export function useAdvisorJobs() {
  const context = useContext(AdvisorJobsContext);
  if (!context) throw new Error('useAdvisorJobs must be used inside AdvisorJobsProvider');
  return context;
}
