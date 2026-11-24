'use client';
import { Button } from '@mantine/core';
import { SectionHeader } from '@/components/landing/section-header';
import { Skeleton } from '@/components/ui/skeleton';
import { PrebuiltCardSkeleton } from './prebuilt-card-skeleton';
import { CarouselSkeleton } from './carousel-skeleton';

export const showcaseLayout = {
  section: 'py-32 relative overflow-hidden transition-colors duration-1000',
  container: 'w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-8 xl:px-10 relative z-10',
  grid: 'grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3 xl:grid-cols-4',
};

export function PrebuiltShowcaseLoadingBody({layout='grid',limit=12,showViewAll=true}: {layout?:'grid'|'carousel';limit?:number;showViewAll?:boolean}) {
  if(layout === 'carousel') return <CarouselSkeleton systems />;
  return <div aria-busy="true" aria-label="Loading featured systems">
    <div className={showcaseLayout.grid}>
      {Array.from({length:limit || 12},(_,index)=><div className="h-full flex flex-col py-2" key={index}><PrebuiltCardSkeleton /></div>)}
    </div>
    {showViewAll && <div className="mt-14 sm:mt-16 flex justify-center"><Skeleton className="flex"><Button size="lg" className="h-12" disabled>View All Pre-builts</Button></Skeleton></div>}
  </div>;
}

export function PrebuiltShowcaseSkeleton() {
  return <section className={showcaseLayout.section}><div className={showcaseLayout.container}>
    <SectionHeader badge="Battle-Ready" title="Featured Systems" subtitle="Expertly architected PC builds, validated by Buildbot AI for zero-bottleneck performance." />
    <div className="relative mt-16 sm:mt-20"><PrebuiltShowcaseLoadingBody /></div>
  </div></section>;
}
