
"use client";
import React, { useState, useMemo } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { YourBuild } from "@/components/your-build";
import { Cpu, Server, CircuitBoard, MemoryStick, HardDrive, Power, RectangleVertical as CaseIcon, Wind, Plus } from "lucide-react";
import type { ComponentData, Part } from "@/lib/types";
import { InventoryToolbar } from "@/components/inventory-toolbar";
import { PartCard } from "@/components/part-card";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useFirestore } from "@/firebase";
import { collection } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

type PartWithoutCategory = Omit<Part, 'category'>;

const componentCategories = [
  { name: "CPU", icon: Cpu, selected: true },
  { name: "GPU", icon: Server, selected: true },
  { name: "Motherboard", icon: CircuitBoard, selected: true },
  { name: "RAM", icon: MemoryStick, selected: true },
  { name: "Storage", icon: HardDrive, selected: true },
  { name: "PSU", icon: Power, selected: true },
  { name: "Case", icon: CaseIcon, selected: true },
  { name: "Cooler", icon: Wind, selected: true },
];

export default function BuilderPage() {
    const firestore = useFirestore();
    const { toast } = useToast();

    // Fetch each category collection
    const cpuQuery = useMemo(() => firestore ? collection(firestore, 'CPU') : null, [firestore]);
    const { data: cpus, loading: cpusLoading } = useCollection<PartWithoutCategory>(cpuQuery);
    const gpuQuery = useMemo(() => firestore ? collection(firestore, 'GPU') : null, [firestore]);
    const { data: gpus, loading: gpusLoading } = useCollection<PartWithoutCategory>(gpuQuery);
    const motherboardQuery = useMemo(() => firestore ? collection(firestore, 'Motherboard') : null, [firestore]);
    const { data: motherboards, loading: motherboardsLoading } = useCollection<PartWithoutCategory>(motherboardQuery);
    const ramQuery = useMemo(() => firestore ? collection(firestore, 'RAM') : null, [firestore]);
    const { data: rams, loading: ramsLoading } = useCollection<PartWithoutCategory>(ramQuery);
    const storageQuery = useMemo(() => firestore ? collection(firestore, 'Storage') : null, [firestore]);
    const { data: storages, loading: storagesLoading } = useCollection<PartWithoutCategory>(storageQuery);
    const psuQuery = useMemo(() => firestore ? collection(firestore, 'PSU') : null, [firestore]);
    const { data: psus, loading: psusLoading } = useCollection<PartWithoutCategory>(psuQuery);
    const caseQuery = useMemo(() => firestore ? collection(firestore, 'Case') : null, [firestore]);
    const { data: cases, loading: casesLoading } = useCollection<PartWithoutCategory>(caseQuery);
    const coolerQuery = useMemo(() => firestore ? collection(firestore, 'Cooler') : null, [firestore]);
    const { data: coolers, loading: coolersLoading } = useCollection<PartWithoutCategory>(coolerQuery);

    // Combine all parts and add category back
    const allParts = useMemo(() => {
        const allParts: Part[] = [];
        cpus?.forEach(p => allParts.push({ ...p, category: 'CPU' }));
        gpus?.forEach(p => allParts.push({ ...p, category: 'GPU' }));
        motherboards?.forEach(p => allParts.push({ ...p, category: 'Motherboard' }));
        rams?.forEach(p => allParts.push({ ...p, category: 'RAM' }));
        storages?.forEach(p => allParts.push({ ...p, category: 'Storage' }));
        psus?.forEach(p => allParts.push({ ...p, category: 'PSU' }));
        cases?.forEach(p => allParts.push({ ...p, category: 'Case' }));
        coolers?.forEach(p => allParts.push({ ...p, category: 'Cooler' }));
        return allParts;
    }, [cpus, gpus, motherboards, rams, storages, psus, cases, coolers]);
    
    const loading = cpusLoading || gpusLoading || motherboardsLoading || ramsLoading || storagesLoading || psusLoading || casesLoading || coolersLoading;

    const [build, setBuild] = useState<Record<string, ComponentData | null>>({
        CPU: null, GPU: null, Motherboard: null, RAM: null, Storage: null, PSU: null, Case: null, Cooler: null,
    });
    
    const [categories, setCategories] = useState(
      componentCategories.map(c => ({ name: c.name, selected: true, icon: c.icon }))
    );

    const [sortBy, setSortBy] = useState('Name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [view, setView] = useState<'grid' | 'list'>('grid');

    const handleCategoryChange = (categoryName: string, selected: boolean) => {
        setCategories(prev =>
            prev.map(cat => (cat.name === categoryName ? { ...cat, selected } : cat))
        );
    };

    const handleAddToBuild = (part: Part) => {
      const category = part.category;
      const componentData: ComponentData = {
        model: part.name,
        price: part.price,
        description: Object.entries(part.specifications).slice(0, 2).map(([key, value]) => `${key}: ${value}`).join(' | '),
        image: part.imageUrl,
        imageHint: part.name.toLowerCase().split(' ').slice(0, 2).join(' '),
        icon: componentCategories.find(c => c.name === category)!.icon,
        wattage: part.wattage,
      };

      setBuild(prevBuild => ({ ...prevBuild, [category]: componentData }));
      toast({ title: 'Part Added', description: `${part.name} has been added to your build.` });
    };

    const sortedAndFilteredParts = useMemo(() => {
        const selectedCategories = categories.filter(c => c.selected).map(c => c.name);
        return (allParts?.filter(part => selectedCategories.includes(part.category)) ?? [])
            .sort((a, b) => {
                let compare = 0;
                if (sortBy === 'Name') compare = a.name.localeCompare(b.name);
                else if (sortBy === 'Price') compare = a.price - b.price;
                return sortDirection === 'asc' ? compare : -compare;
            });
    }, [allParts, categories, sortBy, sortDirection]);

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="text-left mb-8">
        <h1 className="text-4xl font-headline font-bold">Build Your Masterpiece</h1>
        <p className="text-muted-foreground mt-2">
          Select high-performance components and let our AI ensure everything fits
          perfectly together.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <InventoryToolbar
              categories={categories}
              onCategoryChange={handleCategoryChange}
              itemCount={sortedAndFilteredParts.length}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              sortDirection={sortDirection}
              onSortDirectionChange={setSortDirection}
              supportedSorts={['Name', 'Price']}
              view={view}
              onViewChange={setView}
              showViewToggle={true}
          />

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4"><Skeleton className="aspect-video w-full mb-2" /></CardContent>
                  <CardContent className="p-4 pt-0 space-y-2"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /></CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-between items-center"><Skeleton className="h-6 w-1/3" /><Skeleton className="h-9 w-20" /></CardFooter>
                </Card>
              ))}
            </div>
          ) : sortedAndFilteredParts.length > 0 ? (
            view === 'grid' ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                  {sortedAndFilteredParts.map(part => (
                      <PartCard key={part.id} part={part} onAddToBuild={handleAddToBuild} />
                  ))}
              </div>
            ) : (
                <Card className="mt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedAndFilteredParts.map(part => (
                        <TableRow key={part.id} className={part.stock === 0 ? "opacity-50 grayscale" : ""}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <Image src={part.imageUrl} alt={part.name} width={40} height={40} className="rounded-sm object-cover" />
                              <div>
                                <p className="font-semibold">{part.name}</p>
                                <p className="text-xs text-muted-foreground">{part.brand}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                             <Badge variant={part.stock > 5 ? "secondary" : part.stock > 0 ? "destructive" : "outline"}>
                                {part.stock > 0 ? `${part.stock} in stock` : "Out of stock"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(part.price)}</TableCell>
                          <TableCell>
                            <Button size="icon" onClick={() => handleAddToBuild(part)} disabled={part.stock === 0}>
                              <Plus className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
            )
          ) : (
             <Card className="mt-6 min-h-[400px] flex items-center justify-center">
                <CardContent className="text-center text-muted-foreground p-6">
                  <p>No components found for the selected categories.</p>
                </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-4">
            <YourBuild build={build} />
        </div>
      </div>
    </main>
  );
}
