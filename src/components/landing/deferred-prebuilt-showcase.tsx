'use client';
import { PrebuiltShowcaseSkeleton } from '@/components/loading/prebuilt-showcase-skeleton';

import dynamic from 'next/dynamic';
import { useNearViewport } from '@/hooks/use-near-viewport';

const PrebuiltShowcase = dynamic(
  () => import('./prebuilt-showcase').then(module => module.PrebuiltShowcase),
  { loading: () => <PrebuiltShowcaseSkeleton /> },
);

export function DeferredPrebuiltShowcase() {
  const { ref, isNear } = useNearViewport<HTMLDivElement>();

  return (
    <div ref={ref} id="prebuilts" className="scroll-mt-24">
      {isNear ? <PrebuiltShowcase /> : <PrebuiltShowcaseSkeleton />}
    </div>
  );
}
