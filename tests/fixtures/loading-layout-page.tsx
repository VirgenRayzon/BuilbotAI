'use client';
import { InventoryView } from '@/app/builder/components/inventory-view';
import { InventoryPartCard } from '@/components/inventory-part-card';
import { AdminPartSkeleton } from '@/components/loading/admin-inventory-skeleton';
import { FpsPerformanceChart } from '@/components/bottleneck/fps-performance-chart';
import type { Part, ComponentData } from '@/lib/types';
import { Cpu } from 'lucide-react';
const chartPart: ComponentData = {id:'audit', model:'Intel Core i5', description:'', price:100, image:'', imageHint:'', icon:Cpu, performanceTier:2};
const part: Part = {id:'audit',name:'Intel Core Ultra 7 265KF',brand:'Intel',category:'CPU',price:21400,stock:10,imageUrl:'',specifications:{},sku:'AUDIT'};
const noop = () => {};
export default function LoadingFixture() {
  return <div className="mx-auto max-w-[1600px] px-4 sm:px-6 md:px-8 xl:px-10">
    <section data-audit="admin-parts" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
      <div data-audit="admin-loading"><AdminPartSkeleton /></div>
      <div data-audit="admin-loaded"><InventoryPartCard part={part} onDelete={noop} onArchive={noop} onUpdateStock={noop} onUpdatePart={async()=>{}} /></div>
    </section>
    <section data-audit="chart-loading"><FpsPerformanceChart build={{}} resolution="1080p" workload="AAA" chartHeight={200} hideHeader withBorder={false} className="p-0" loading /></section>
    <section data-audit="chart-loaded"><FpsPerformanceChart build={{CPU:chartPart, GPU:{...chartPart,model:'RTX 4060'}}} resolution="1080p" workload="AAA" chartHeight={200} hideHeader withBorder={false} className="p-0" /></section>
    {(['grid','list'] as const).map(view => <div key={view}>
      {[true,false].map(loading => <section key={String(loading)} data-audit={`${view}-${loading ? 'loading':'loaded'}`}>
        <InventoryView loading={loading} paginatedParts={Array.from({length:8},(_,i)=>({...part,id:String(i)}))} totalPages={1} currentPage={1} itemsPerPage={8} onPageChange={noop} onItemsPerPageChange={noop} view={view} onViewChange={noop} categories={[]} onCategoryChange={noop} searchQuery="" onSearchQueryChange={noop} sortBy="Date Added" onSortByChange={noop} sortDirection="desc" onSortDirectionChange={noop} onTogglePart={noop} isSelected={()=>false} itemCount={8}/>
      </section>)}
    </div>)}
  </div>;
}
