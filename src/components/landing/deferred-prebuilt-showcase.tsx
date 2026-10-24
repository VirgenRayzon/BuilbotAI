'use client';

import dynamic from 'next/dynamic';
import { useNearViewport } from '@/hooks/use-near-viewport';

const PrebuiltShowcase = dynamic(
  () => import('./prebuilt-showcase').then(module => module.PrebuiltShowcase),
  { loading: () => <div className="min-h-[900px]" aria-label="Loading featured systems" aria-busy="true" /> },
);

export function DeferredPrebuiltShowcase() {
  const { ref, isNear } = useNearViewport<HTMLDivElement>();

  return (
    <div ref={ref} id="prebuilts" className="scroll-mt-24">
      {isNear ? <PrebuiltShowcase /> : <div className="min-h-[900px]" />}
    </div>
  );
}
