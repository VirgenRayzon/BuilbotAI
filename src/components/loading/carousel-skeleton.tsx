'use client';

import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { Skeleton } from '@/components/ui/skeleton';
import { CatalogCardSkeleton } from './catalog-card-skeleton';
import { PrebuiltCardSkeleton } from './prebuilt-card-skeleton';

export function CarouselSkeleton({ systems = false }: { systems?: boolean }) {
  return <div aria-label={systems ? 'Loading systems' : 'Loading accessories'} aria-busy="true">
    <Carousel opts={{align:'start'}} className="w-full">
      <CarouselContent className="-ml-3 md:-ml-4">
        {Array.from({length:4}, (_, index) => <CarouselItem key={index} className={systems
          ? 'pl-3 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3 xl:basis-1/4'
          : 'flex basis-[88%] pl-3 sm:basis-1/2 md:pl-4 lg:basis-1/3 xl:basis-1/4'}>
          <div className="flex h-full w-full py-4">{systems ? <PrebuiltCardSkeleton /> : <CatalogCardSkeleton />}</div>
        </CarouselItem>)}
      </CarouselContent>
    </Carousel>
    <div className="mt-16 flex items-center justify-center gap-6" aria-hidden="true">
      <Skeleton className="h-14 w-14 rounded-2xl" /><Skeleton className="h-1 w-24 rounded-full" /><Skeleton className="h-14 w-14 rounded-2xl" />
    </div>
  </div>;
}
