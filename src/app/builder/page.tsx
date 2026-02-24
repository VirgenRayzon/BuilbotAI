"use client";
import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { YourBuild } from "@/components/your-build";
import {
  Cpu,
  Monitor,
  CircuitBoard,
  MemoryStick,
  HardDrive,
  PlugZap,
  Square,
  Wind,
  Plus,
  X,
  Trash2,
  Info,
  CheckCircle2,
  AlertTriangle,
  Lightbulb
} from "lucide-react";
import type { ComponentData, Part, Build } from "@/lib/types";
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
import { PaginationControls } from "@/components/pagination-controls";
import { SmartBudget } from "@/components/smart-budget";

type PartWithoutCategory = Omit<Part, 'category'>;

const componentCategories = [
  { name: "CPU", icon: Cpu, selected: true },
  { name: "GPU", icon: Monitor, selected: true },
  { name: "Motherboard", icon: CircuitBoard, selected: true },
  { name: "RAM", icon: MemoryStick, selected: true },
  { name: "Storage", icon: HardDrive, selected: true },
  { name: "PSU", icon: PlugZap, selected: true },
  { name: "Case", icon: Square, selected: true },
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

  const [build, setBuild] = useState<Record<string, ComponentData | ComponentData[] | null>>({
    CPU: null, GPU: null, Motherboard: null, RAM: null, Storage: [], PSU: null, Case: null, Cooler: null,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('pc_builder_state');
    if (saved) {
      try {
        setBuild(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved build", e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('pc_builder_state', JSON.stringify(build));
    }
  }, [build, isLoaded]);

  const handleClearBuild = () => {
    setBuild({
      CPU: null, GPU: null, Motherboard: null, RAM: null, Storage: [], PSU: null, Case: null, Cooler: null,
    });
    toast({ title: 'Build Cleared', description: 'Your build has been reset.' });
  };

  const [categories, setCategories] = useState(
    componentCategories.map(c => ({ name: c.name, selected: true, icon: c.icon }))
  );

  const [sortBy, setSortBy] = useState('Name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showSmartBudget, setShowSmartBudget] = useState(false);

  const handleCategoryChange = (categoryName: string, selected: boolean) => {
    setCurrentPage(1);
    setCategories(prev =>
      prev.map(cat => (cat.name === categoryName ? { ...cat, selected } : cat))
    );
  };

  const handlePartToggle = (part: Part) => {
    const category = part.category;

    if (category === 'Storage') {
      const currentStorage = build['Storage'] as ComponentData[];
      const isCurrentlySelected = currentStorage.some(c => c.model === part.name);

      if (isCurrentlySelected) {
        setBuild(prevBuild => ({
          ...prevBuild,
          Storage: currentStorage.filter(c => c.model !== part.name)
        }));
        toast({ title: 'Part Removed', description: `${part.name} has been removed from your build.` });
      } else {
        if (part.stock === 0) {
          toast({ variant: 'destructive', title: 'Out of Stock', description: `${part.name} is currently unavailable.` });
          return;
        }
        const componentData: ComponentData = {
          model: part.name,
          price: part.price,
          description: Object.entries(part.specifications).slice(0, 2).map(([key, value]) => `${key}: ${value}`).join(' | '),
          image: part.imageUrl,
          imageHint: part.name.toLowerCase().split(' ').slice(0, 2).join(' '),
          icon: componentCategories.find(c => c.name === category)!.icon,
          wattage: part.wattage,
          socket: part.specifications['Socket']?.toString() || part.specifications['socket']?.toString(),
          ramType: part.specifications['Memory Type']?.toString() || part.specifications['RAM Type']?.toString() || part.specifications['Memory']?.toString(),
        };
        setBuild(prevBuild => ({
          ...prevBuild,
          Storage: [...currentStorage, componentData]
        }));
        toast({ title: 'Part Added', description: `${part.name} has been added to your build.` });
      }
      return;
    }

    const isCurrentlySelected = (build[category] as ComponentData)?.model === part.name;

    if (isCurrentlySelected) {
      // Part is already selected, so remove it
      setBuild(prevBuild => ({ ...prevBuild, [category]: null }));
      toast({ title: 'Part Removed', description: `${part.name} has been removed from your build.` });
    } else {
      if (part.stock === 0) {
        toast({ variant: 'destructive', title: 'Out of Stock', description: `${part.name} is currently unavailable.` });
        return;
      }

      // Part is not selected or a different one is, so add/replace it
      const componentData: ComponentData = {
        model: part.name,
        price: part.price,
        description: Object.entries(part.specifications).slice(0, 2).map(([key, value]) => `${key}: ${value}`).join(' | '),
        image: part.imageUrl,
        imageHint: part.name.toLowerCase().split(' ').slice(0, 2).join(' '),
        icon: componentCategories.find(c => c.name === category)!.icon,
        wattage: part.wattage,
        socket: part.specifications['Socket']?.toString() || part.specifications['socket']?.toString(),
        ramType: part.specifications['Memory Type']?.toString() || part.specifications['RAM Type']?.toString() || part.specifications['Memory']?.toString(),
      };

      setBuild(prevBuild => ({ ...prevBuild, [category]: componentData }));
      toast({ title: 'Part Added', description: `${part.name} has been added to your build.` });
    }
  };

  const checkCompatibility = (part: Part, currentBuild: any) => {
    const category = part.category;
    const cpu = currentBuild['CPU'] as ComponentData | null;
    const mobo = currentBuild['Motherboard'] as ComponentData | null;
    const ram = currentBuild['RAM'] as ComponentData | null;

    const partSocket = part.specifications['Socket']?.toString() || part.specifications['socket']?.toString();
    const partRamType = part.specifications['Memory Type']?.toString() || part.specifications['RAM Type']?.toString() || part.specifications['Memory']?.toString();

    if (category === 'CPU') {
      if (mobo && mobo.socket && partSocket && mobo.socket !== partSocket) {
        return { compatible: false, message: `This CPU uses ${partSocket} socket, but your motherboard is ${mobo.socket}.` };
      }
    }

    if (category === 'Motherboard') {
      if (cpu && cpu.socket && partSocket && cpu.socket !== partSocket) {
        return { compatible: false, message: `This motherboard is ${partSocket}, but your CPU uses ${cpu.socket}.` };
      }
      if (ram && ram.ramType && partRamType) {
        // Simple string inclusion check for RAM types (e.g. "DDR5" in "DDR5-6000")
        if (!partRamType.toLowerCase().includes(ram.ramType.toLowerCase()) && !ram.ramType.toLowerCase().includes(partRamType.toLowerCase())) {
          return { compatible: false, message: `This motherboard supports ${partRamType}, but your RAM is ${ram.ramType}.` };
        }
      }
    }

    if (category === 'RAM') {
      if (mobo && mobo.ramType && partRamType) {
        if (!mobo.ramType.toLowerCase().includes(partRamType.toLowerCase()) && !partRamType.toLowerCase().includes(mobo.ramType.toLowerCase())) {
          return { compatible: false, message: `Your motherboard supports ${mobo.ramType}, but this RAM is ${partRamType}.` };
        }
      }
    }

    return { compatible: true, message: '' };
  };

  const sortedAndFilteredParts = useMemo(() => {
    const selectedCategories = categories.filter(c => c.selected).map(c => c.name);
    const parts = (allParts?.filter(part => selectedCategories.includes(part.category)) ?? [])
      .sort((a, b) => {
        let compare = 0;
        if (sortBy === 'Name') compare = a.name.localeCompare(b.name);
        else if (sortBy === 'Price') compare = a.price - b.price;
        return sortDirection === 'asc' ? compare : -compare;
      });

    return parts.map(part => ({
      ...part,
      compatibility: checkCompatibility(part, build)
    }));
  }, [allParts, categories, sortBy, sortDirection, build]);

  const totalPages = Math.ceil(sortedAndFilteredParts.length / itemsPerPage);
  const paginatedParts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedAndFilteredParts.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedAndFilteredParts, currentPage, itemsPerPage]);

  const isSelected = (part: Part) => {
    return part.category === 'Storage'
      ? (build['Storage'] as ComponentData[]).some(c => c.model === part.name)
      : (build[part.category] as ComponentData)?.model === part.name;
  };

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div className="text-left">
          <h1 className="text-4xl font-headline font-bold">Build Your Masterpiece</h1>
          <p className="text-muted-foreground mt-2">
            Select high-performance components and let our AI ensure everything fits
            perfectly together.
          </p>
        </div>
        {!showSmartBudget && (
          <Button
            variant="outline"
            className="font-headline tracking-wide flex items-center gap-2 border-primary/50 text-primary hover:bg-primary/10"
            onClick={() => setShowSmartBudget(true)}
          >
            <Lightbulb className="h-4 w-4" /> AI Smart Budget
          </Button>
        )}
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          {showSmartBudget && (
            <div className="mb-6 animate-in fade-in slide-in-from-top-4">
              <SmartBudget
                inventory={allParts}
                onApplyBuild={(newBuild) => {
                  setBuild(newBuild);
                  setShowSmartBudget(false);
                  toast({ title: 'AI Build Applied', description: 'Your cart has been updated with the AI recommendations.' });
                }}
                onClose={() => setShowSmartBudget(false)}
              />
            </div>
          )}

          <InventoryToolbar
            categories={categories}
            onCategoryChange={handleCategoryChange}
            itemCount={sortedAndFilteredParts.length}
            sortBy={sortBy}
            onSortByChange={(val) => { setSortBy(val); setCurrentPage(1); }}
            sortDirection={sortDirection}
            onSortDirectionChange={(val) => { setSortDirection(val); setCurrentPage(1); }}
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
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                  {paginatedParts.map(part => (
                    <PartCard
                      key={part.id}
                      part={part}
                      onToggleBuild={handlePartToggle}
                      isSelected={isSelected(part)}
                      compatibility={part.compatibility}
                    />
                  ))}
                </div>
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setItemsPerPage}
                />
              </>
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
                    {paginatedParts.map(part => {
                      const isSelected = part.category === 'Storage'
                        ? (build['Storage'] as ComponentData[]).some(c => c.model === part.name)
                        : (build[part.category] as ComponentData)?.model === part.name;
                      return (
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
                            <Button
                              size="icon"
                              onClick={() => handlePartToggle(part)}
                              disabled={part.stock === 0 && !isSelected}
                              variant={isSelected ? 'destructive' : 'default'}
                            >
                              {isSelected ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setItemsPerPage}
                />
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
          <div className="sticky top-20 flex flex-col gap-6 max-h-[calc(100vh-6rem)] overflow-y-auto pb-4 pr-2">
            <YourBuild build={build} onClearBuild={handleClearBuild} />
          </div>
        </div>
      </div>
    </main>
  );
}
