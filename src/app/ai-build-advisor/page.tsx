"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { ChatForm, type FormSchema } from "@/components/chat-form";
import { BuildSummary } from "@/components/build-summary";
import { getAiRecommendations, getAiBuildCritique } from "@/app/actions";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import type { Build, AiRecommendation, ComponentData, Resolution, WorkloadType } from "@/lib/types";
import { Cpu, Server, CircuitBoard, MemoryStick, Bot, Wallet, Database, Power, RectangleVertical, Wind } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FloatingInsights } from "@/components/floating-insights";
import { LayoutPanelLeft } from "lucide-react";
import { AIBuildCritique } from "@/components/ai-build-critique";
import { YourBuild } from "@/components/your-build";
import { PCVisualizer } from "@/components/pc-visualizer";
import { BuilderSidebarLeft } from "@/components/builder-sidebar-left";
import { BuilderFloatingChat } from "@/components/builder-floating-chat";
import { useUserProfile } from "@/context/user-profile";
import { useRouter } from "next/navigation";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useFirestore } from "@/firebase";
import { collection } from "firebase/firestore";
import type { Part } from "@/lib/types";
import { checkCompatibility } from "@/lib/compatibility";

type PartWithoutCategory = Omit<Part, 'category'>;

const componentMetadata: { [key: string]: { icon: React.ComponentType<{ className?: string }>, image: any } } = {
  cpu: {
    icon: Cpu,
    image: PlaceHolderImages.find((img) => img.id === "cpu")!,
  },
  gpu: {
    icon: Server,
    image: PlaceHolderImages.find((img) => img.id === "gpu")!,
  },
  motherboard: {
    icon: CircuitBoard,
    image: PlaceHolderImages.find((img) => img.id === "motherboard")!,
  },
  ram: {
    icon: MemoryStick,
    image: PlaceHolderImages.find((img) => img.id === "ram")!,
  },
  storage: {
    icon: Database,
    image: PlaceHolderImages.find((img) => img.id === "storage")!,
  },
  psu: {
    icon: Power,
    image: PlaceHolderImages.find((img) => img.id === "psu")!,
  },
  case: {
    icon: RectangleVertical,
    image: PlaceHolderImages.find((img) => img.id === "case")!,
  },
  cooler: {
    icon: Wind,
    image: PlaceHolderImages.find((img) => img.id === "cooler")!,
  },
};

export default function AiBuildAdvisorPage() {
  const { toast } = useToast();
  const { authUser, profile, loading: userLoading } = useUserProfile();
  const router = useRouter();
  const firestore = useFirestore();

  // Fetch each category collection for Quick Add support
  const cpuQuery = useMemo(() => firestore ? collection(firestore, 'CPU') : null, [firestore]);
  const { data: cpus } = useCollection<PartWithoutCategory>(cpuQuery);
  const gpuQuery = useMemo(() => firestore ? collection(firestore, 'GPU') : null, [firestore]);
  const { data: gpus } = useCollection<PartWithoutCategory>(gpuQuery);
  const motherboardQuery = useMemo(() => firestore ? collection(firestore, 'Motherboard') : null, [firestore]);
  const { data: motherboards } = useCollection<PartWithoutCategory>(motherboardQuery);
  const ramQuery = useMemo(() => firestore ? collection(firestore, 'RAM') : null, [firestore]);
  const { data: rams } = useCollection<PartWithoutCategory>(ramQuery);
  const storageQuery = useMemo(() => firestore ? collection(firestore, 'Storage') : null, [firestore]);
  const { data: storages } = useCollection<PartWithoutCategory>(storageQuery);
  const psuQuery = useMemo(() => firestore ? collection(firestore, 'PSU') : null, [firestore]);
  const { data: psus } = useCollection<PartWithoutCategory>(psuQuery);
  const caseQuery = useMemo(() => firestore ? collection(firestore, 'Case') : null, [firestore]);
  const { data: cases } = useCollection<PartWithoutCategory>(caseQuery);
  const coolerQuery = useMemo(() => firestore ? collection(firestore, 'Cooler') : null, [firestore]);
  const { data: coolers } = useCollection<PartWithoutCategory>(coolerQuery);
  const monitorQuery = useMemo(() => firestore ? collection(firestore, 'Monitor') : null, [firestore]);
  const { data: monitors } = useCollection<PartWithoutCategory>(monitorQuery);
  const keyboardQuery = useMemo(() => firestore ? collection(firestore, 'Keyboard') : null, [firestore]);
  const { data: keyboards } = useCollection<PartWithoutCategory>(keyboardQuery);
  const mouseQuery = useMemo(() => firestore ? collection(firestore, 'Mouse') : null, [firestore]);
  const { data: mice } = useCollection<PartWithoutCategory>(mouseQuery);
  const headsetQuery = useMemo(() => firestore ? collection(firestore, 'Headset') : null, [firestore]);
  const { data: headsets } = useCollection<PartWithoutCategory>(headsetQuery);

  // Combine all parts and add category back
  const allParts = useMemo(() => {
    const parts: Part[] = [];
    cpus?.forEach(p => parts.push({ ...p, category: 'CPU' }));
    gpus?.forEach(p => parts.push({ ...p, category: 'GPU' }));
    motherboards?.forEach(p => parts.push({ ...p, category: 'Motherboard' }));
    rams?.forEach(p => parts.push({ ...p, category: 'RAM' }));
    storages?.forEach(p => parts.push({ ...p, category: 'Storage' }));
    psus?.forEach(p => parts.push({ ...p, category: 'PSU' }));
    cases?.forEach(p => parts.push({ ...p, category: 'Case' }));
    coolers?.forEach(p => parts.push({ ...p, category: 'Cooler' }));
    monitors?.forEach(p => parts.push({ ...p, category: 'Monitor' }));
    keyboards?.forEach(p => parts.push({ ...p, category: 'Keyboard' }));
    mice?.forEach(p => parts.push({ ...p, category: 'Mouse' }));
    headsets?.forEach(p => parts.push({ ...p, category: 'Headset' }));
    return parts;
  }, [cpus, gpus, motherboards, rams, storages, psus, cases, coolers, monitors, keyboards, mice, headsets]);

  // Redirect unauthenticated users to sign-in or admins to admin dashboard
  useEffect(() => {
    if (!userLoading) {
      if (!authUser) {
        router.push('/signin');
      } else if (profile?.isManager) {
        router.push('/admin');
      }
    }
  }, [authUser, profile, userLoading, router]);

  const [build, setBuild] = useState<Build | null>(null);
  const [builderState, setBuilderState] = useState<Record<string, ComponentData | ComponentData[] | null> | null>(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [resolution, setResolution] = useState<Resolution>('1440p');
  const [workload, setWorkload] = useState<WorkloadType>('Balanced');
  const [showInsights, setShowInsights] = useState(false);
  const [isInsightsPinned, setIsInsightsPinned] = useState(false);

  const [critiqueAnalysis, setCritiqueAnalysis] = useState<any>(null);
  const [critiqueLoading, setCritiqueLoading] = useState(false);
  const [critiqueError, setCritiqueError] = useState<string | null>(null);

  const getBuildKey = (state: Record<string, ComponentData | ComponentData[] | null> | null) => {
    if (!state) return "";
    const partIds: string[] = [];
    Object.values(state).forEach(val => {
      if (Array.isArray(val)) {
        val.forEach(v => partIds.push(v.id));
      } else if (val) {
        partIds.push(val.id);
      }
    });
    return partIds.sort().join('|');
  };

  useEffect(() => {
    const saved = localStorage.getItem('pc_builder_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const hasParts = Object.values(parsed).some(val =>
          Array.isArray(val) ? val.length > 0 : val !== null
        );
        if (hasParts) {
          setBuilderState(parsed);

          // Load cached critique if available
          const cache = localStorage.getItem('pc_critique_cache');
          if (cache) {
            try {
              const parsedCache = JSON.parse(cache);
              const buildKey = getBuildKey(parsed);
              if (parsedCache[buildKey]) {
                const analysis = parsedCache[buildKey];
                // DETECT LEGACY SCHEMA: If 'pros' is missing but 'prosCons' exists, clear the cache to avoid crash
                if (!analysis.pros && analysis.prosCons) {
                    console.log("Legacy critique schema detected. Clearing cache.");
                    localStorage.removeItem('pc_critique_cache');
                } else {
                    setCritiqueAnalysis(analysis);
                }
              }
            } catch (e) {
              console.error("Failed to parse critique cache", e);
            }
          }
        }
      } catch (e) {
        console.error("Failed to parse saved build", e);
      }
    }
  }, []);

  const handlePartToggle = (part: Part) => {
    if (!builderState) {
        // Initialize if empty
        const initial = {
            CPU: null, GPU: null, Motherboard: null, RAM: [], Storage: [], PSU: null, Case: null, Cooler: null,
            Monitor: null, Keyboard: null, Mouse: null, Headset: null,
        };
        const next = { ...initial } as any;
        if (part.category === 'RAM' || part.category === 'Storage') {
            next[part.category] = [part];
        } else {
            next[part.category] = part;
        }
        setBuilderState(next);
        localStorage.setItem('pc_builder_state', JSON.stringify(next));
        return;
    }

    const next = { ...builderState } as any;
    const category = part.category;

    // Validate compatibility
    const { compatible, message } = checkCompatibility(part, next);
    
    if (category === 'RAM' || category === 'Storage') {
      const current = Array.isArray(next[category]) ? next[category] : [];
      const index = current.findIndex((p: any) => p.id === part.id);
      
      if (index > -1) {
        current.splice(index, 1);
      } else {
        if (!compatible) {
            toast({
              variant: 'destructive',
              title: 'Compatibility Error',
              description: message || `This ${category} is not compatible with your current build.`
            });
            return;
        }
        current.push(part);
      }
      next[category] = [...current];
    } else {
      const isAlreadySelected = next[category]?.id === part.id;
      if (!isAlreadySelected && !compatible) {
        toast({
          variant: 'destructive',
          title: 'Compatibility Error',
          description: message || `This ${category} is not compatible with your current build.`
        });
        return;
      }
      next[category] = isAlreadySelected ? null : part;
    }

    setBuilderState(next);
    localStorage.setItem('pc_builder_state', JSON.stringify(next));
  };

  // Handle AI suggestions for Quick Add
  useEffect(() => {
    const findPartRobustly = (suggestion: string, partId?: string) => {
        // 0. ID Match (Highest Priority)
        if (partId) {
          const part = allParts.find(p => p.id === partId);
          if (part) return part;
        }
  
        // 1. Exact Match
        let part = allParts.find(p => p.name.toLowerCase() === suggestion.toLowerCase());
        if (part) return part;
  
        // 2. Remove parentheticals
        const cleanSuggestion = suggestion.replace(/\s*\(.*?\)\s*/g, '').trim().toLowerCase();
        part = allParts.find(p => p.name.toLowerCase() === cleanSuggestion);
        if (part) return part;
  
        // 3. Substring match
        part = allParts.find(p => p.name.toLowerCase().includes(cleanSuggestion) || cleanSuggestion.includes(p.name.toLowerCase()));
        if (part) return part;
  
        return null;
    };

    const handleAddSuggestion = (e: any) => {
      const modelName = e.detail.model;
      const partId = e.detail.id;
      const part = findPartRobustly(modelName, partId);
      if (part) {
        handlePartToggle(part);
        toast({
            title: "Part Added",
            description: `Successfully added ${part.name} to your build.`
        });
      } else {
        toast({
          variant: "destructive",
          title: "Part Not Found",
          description: `Could not find "${modelName}" in our live inventory.`
        });
      }
    };

    window.addEventListener('add-suggestion', handleAddSuggestion);
    return () => window.removeEventListener('add-suggestion', handleAddSuggestion);
  }, [allParts, builderState]);

  const handleGetRecommendations = (data: FormSchema) => {
    startTransition(async () => {
      const result = await getAiRecommendations(data);
      if (!result || "error" in result) {
        toast({
          variant: "destructive",
          title: "Error",
          description:
            (result as any)?.error ||
            "Failed to get recommendations from the AI. Please try again.",
        });
        return;
      }

      const processComponent = (
        component: AiRecommendation[keyof Omit<AiRecommendation, "summary" | "estimatedWattage">],
        type: keyof typeof componentMetadata
      ) => {
        const metadata = componentMetadata[type];
        const price = (component as any).estimatedPrice || 0;
        return {
          ...component,
          id: `ai-suggested-${type}`,
          price,
          icon: metadata.icon,
          image: metadata.image.imageUrl,
          imageHint: metadata.image.imageHint,
        };
      };

      const newBuild: Build = {
        summary: result.summary,
        cpu: processComponent(result.cpu, "cpu"),
        gpu: processComponent(result.gpu, "gpu"),
        motherboard: processComponent(result.motherboard, "motherboard"),
        ram: processComponent(result.ram, "ram"),
        storage: processComponent(result.storage, "storage"),
        psu: processComponent(result.psu, "psu"),
        case: processComponent(result.case, "case"),
        cooler: processComponent(result.cooler, "cooler"),
        estimatedWattage: result.estimatedWattage
      };

      setBuild(newBuild);
      const total =
        newBuild.cpu.price +
        newBuild.gpu.price +
        newBuild.motherboard.price +
        newBuild.ram.price +
        newBuild.storage.price +
        newBuild.psu.price +
        newBuild.case.price +
        newBuild.cooler.price;
      setTotalPrice(total);
    });
  };

  const handleRemovePart = (category: string, index?: number) => {
    if (!builderState) return;
    const next = { ...builderState };
    if (category === 'Storage' && typeof index === 'number') {
      const currentStorage = [...(next['Storage'] as ComponentData[])];
      currentStorage.splice(index, 1);
      next['Storage'] = currentStorage;
    } else {
      next[category] = null;
    }
    setBuilderState(next);
    localStorage.setItem('pc_builder_state', JSON.stringify(next));

    // Clear analysis if build changed and doesn't match cache
    const newKey = getBuildKey(next);
    const cache = localStorage.getItem('pc_critique_cache');
    if (cache) {
      try {
        const parsedCache = JSON.parse(cache);
        if (parsedCache[newKey]) {
          setCritiqueAnalysis(parsedCache[newKey]);
        } else {
          setCritiqueAnalysis(null);
        }
      } catch (e) {
        setCritiqueAnalysis(null);
      }
    } else {
      setCritiqueAnalysis(null);
    }
  };

  const handleCritique = async (forceRefresh: boolean = false) => {
    if (!builderState) return;

    const buildKey = getBuildKey(builderState);
    if (!forceRefresh) {
      const cache = localStorage.getItem('pc_critique_cache');
      if (cache) {
        try {
          const parsedCache = JSON.parse(cache);
          if (parsedCache[buildKey]) {
            setCritiqueAnalysis(parsedCache[buildKey]);
            return;
          }
        } catch (e) { }
      }
    }

    setCritiqueLoading(true);
    setCritiqueError(null);

    const inputData: any = {};
    Object.entries(builderState).forEach(([key, val]) => {
      if (val) {
        if (Array.isArray(val)) {
          inputData[key] = val.map((v: any) => ({
            model: v.name || v.model,
            price: v.price,
            brand: v.brand,
            wattage: v.wattage,
            socket: v.socket,
            ramType: v.ramType,
            performanceScore: v.performanceScore,
            dimensions: v.dimensions,
            specifications: v.specifications,
          }));
        } else {
          const singleVal = val as any;
          inputData[key] = {
            model: singleVal.name || singleVal.model,
            price: singleVal.price,
            brand: singleVal.brand,
            wattage: singleVal.wattage,
            socket: singleVal.socket,
            ramType: singleVal.ramType,
            performanceScore: singleVal.performanceScore,
            dimensions: singleVal.dimensions,
            specifications: singleVal.specifications,
          };
        }
      }
    });

    try {
      const result = await getAiBuildCritique(inputData);
      if ('error' in result) {
        setCritiqueError(result.error as string);
      } else {
        setCritiqueAnalysis(result);

        // Save to cache
        const cache = localStorage.getItem('pc_critique_cache') || '{}';
        try {
          const parsedCache = JSON.parse(cache);
          parsedCache[buildKey] = result;
          // Limit cache size to 10 entries (LRU-ish)
          const keys = Object.keys(parsedCache);
          if (keys.length > 10) {
            delete parsedCache[keys[0]];
          }
          localStorage.setItem('pc_critique_cache', JSON.stringify(parsedCache));
        } catch (e) { }
      }
    } catch (err) {
      setCritiqueError("An unexpected error occurred during analysis.");
    } finally {
      setCritiqueLoading(false);
    }
  };

  const generativeContent = (
    <div className="grid lg:grid-cols-12 gap-8 h-full">
      <aside className="lg:col-span-4 lg:sticky lg:top-20 self-start">
        <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Bot className="w-8 h-8 text-primary" />
            <h2 className="text-2xl font-headline font-semibold">
              Buildbot Advisor
            </h2>
          </div>
          <p className="text-muted-foreground mb-6">
            Describe your dream PC, and Buildbot will suggest a compatible set
            of core components to get you started.
          </p>
          <ChatForm
            getRecommendations={handleGetRecommendations}
            isPending={isPending}
          />
        </div>
      </aside>
      <div className="lg:col-span-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Wallet className="w-8 h-8 text-primary" />
            <div>
              <h3 className="text-muted-foreground text-sm">Estimated Cost (PHP)</h3>
              <p className="text-3xl font-bold font-headline">
                ₱{totalPrice.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <BuildSummary build={build} isPending={isPending} />
      </div>
    </div>
  );

  return (
    <main className="flex-1 w-full max-w-[1800px] mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div className="text-left">
          <h1 className="text-4xl font-headline font-bold uppercase tracking-tight">AI Build Advisor</h1>
          <p className="text-muted-foreground mt-2">
            Get intelligent hardware recommendations and professional critiques for your custom build.
          </p>
        </div>
      </div>

      {builderState ? (
        <Tabs defaultValue="critique" className="w-full h-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 max-w-md mx-auto">
            <TabsTrigger value="critique">Review Current Build</TabsTrigger>
            <TabsTrigger value="generate">Generate New Build</TabsTrigger>
          </TabsList>

          <TabsContent value="critique" className="mt-0 h-full">
            <div className="grid lg:grid-cols-12 gap-6 h-full">

              {isInsightsPinned && (
                <div className="hidden lg:block lg:col-span-3 h-[calc(100vh-120px)] sticky top-20">
                  <FloatingInsights
                    isOpen={true}
                    onClose={() => setIsInsightsPinned(false)}
                    build={builderState}
                    resolution={resolution}
                    onResolutionChange={setResolution}
                    workload={workload}
                    onWorkloadChange={setWorkload}
                    isPinned={true}
                    onTogglePin={() => setIsInsightsPinned(false)}
                  />
                </div>
              )}

              {/* Middle Column: AI Critique (Now wider or narrower depending on pin) */}
              <div className={cn("border-r border-border/50 px-6", isInsightsPinned ? "lg:col-span-6" : "lg:col-span-9")}>
                <AIBuildCritique
                  build={builderState}
                  externalAnalysis={critiqueAnalysis}
                  externalLoading={critiqueLoading}
                  externalError={critiqueError}
                  onRefresh={() => handleCritique(true)}
                />
              </div>

              {/* Right Column: Your Build Specs */}
              <div className="lg:col-span-3">
                <div className="sticky top-20 flex flex-col gap-6 pb-4">
                  <YourBuild
                    build={builderState}
                    onClearBuild={() => {
                      localStorage.removeItem('pc_builder_state');
                      setBuilderState(null);
                    }}
                    onRemovePart={handleRemovePart}
                    onAnalyze={handleCritique}
                    resolution={resolution}
                    onResolutionChange={setResolution}
                    workload={workload}
                    onWorkloadChange={setWorkload}
                    showSystemBalance={false}
                    hasAnalysis={!!critiqueAnalysis}
                  />
                </div>
              </div>

            </div>
          </TabsContent>
          <TabsContent value="generate" className="mt-0 h-full">
            {generativeContent}
          </TabsContent>
        </Tabs>
      ) : generativeContent}
      <BuilderFloatingChat />

      {/* Floating Insights Toggle & Panel */}
      <div className={cn("fixed bottom-6 left-6 z-50 flex flex-col-reverse items-start gap-4", isInsightsPinned ? "lg:hidden" : "")}>
        {builderState && !showInsights && (
          <Button
            size="lg"
            onClick={() => setShowInsights(true)}
            className="rounded-full shadow-2xl h-14 px-6 gap-3 bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest border border-white/10 ring-4 ring-primary/20 animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <LayoutPanelLeft className="w-5 h-5" />
            Build Insights
          </Button>
        )}
      </div>

      {builderState && (!isInsightsPinned || showInsights) && (
        <FloatingInsights
          isOpen={showInsights}
          onClose={() => setShowInsights(false)}
          build={builderState}
          resolution={resolution}
          onResolutionChange={setResolution}
          workload={workload}
          onWorkloadChange={setWorkload}
          isPinned={false}
          onTogglePin={() => {
            setIsInsightsPinned(true);
            setShowInsights(false);
          }}
        />
      )}
    </main>
  );
}
