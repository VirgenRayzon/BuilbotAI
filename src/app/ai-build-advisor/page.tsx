"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/theme-provider";
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
  const { theme } = useTheme();
  const isDark = theme === "dark";
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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid lg:grid-cols-12 gap-8 h-full"
    >
      <aside className="lg:col-span-4 lg:sticky lg:top-24 self-start">
        <div className={cn(
          "p-8 rounded-3xl border backdrop-blur-xl shadow-2xl transition-all duration-500",
          isDark 
            ? "bg-slate-900/40 border-white/5 shadow-black/40" 
            : "bg-white/60 border-slate-200 shadow-slate-200/50"
        )}>
          <div className="flex items-center gap-4 mb-8">
            <div className={cn(
              "p-3 rounded-2xl",
              isDark ? "bg-primary/10" : "bg-primary/5"
            )}>
              <Bot className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl font-headline font-bold tracking-tight">
                Buildbot Advisor
              </h2>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Neural Engine Active</span>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
            Describe your hardware requirements, budget, or preferred games. Our neural engine will architect the perfect build for you.
          </p>

          <ChatForm
            getRecommendations={handleGetRecommendations}
            isPending={isPending}
          />

          <div className="mt-8 pt-8 border-t border-border/50">
            <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
              <div className="flex items-center gap-1.5">
                <CircuitBoard className="w-3 h-3" />
                V2.4.0-CORE
              </div>
              <div className="flex items-center gap-1.5">
                <Database className="w-3 h-3" />
                LIVE INVENTORY
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:col-span-8">
        <AnimatePresence mode="wait">
          {build ? (
            <motion.div
              key="build-result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-8"
            >
              <div className={cn(
                "p-8 rounded-3xl border backdrop-blur-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6",
                isDark ? "bg-slate-900/40 border-white/5" : "bg-white/60 border-slate-200"
              )}>
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-primary/10">
                    <Wallet className="w-10 h-10 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-1">Total Configuration Value</h3>
                    <p className={cn(
                      "text-4xl font-black font-headline tracking-tighter",
                      isDark ? "text-white" : "text-slate-900"
                    )}>
                      ₱{totalPrice.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <div className="px-3 py-1 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider border border-primary/30">
                    Optimal Efficiency
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">REFRESH RATE: 144Hz+ TARGET</span>
                </div>
              </div>

              <BuildSummary build={build} isPending={isPending} />
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={cn(
                "h-full min-h-[500px] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center p-12 text-center transition-colors duration-500",
                isDark ? "bg-slate-900/20 border-white/5" : "bg-slate-50/50 border-slate-200"
              )}
            >
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Bot className="w-10 h-10 text-primary opacity-20" />
              </div>
              <h3 className="text-xl font-headline font-bold mb-2">Awaiting Parameters</h3>
              <p className="text-muted-foreground max-w-sm">
                Submit your requirements on the left to initialize the build generation process.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-500 overflow-x-hidden",
      isDark ? "bg-[#0c0f14] text-slate-50" : "bg-white text-slate-900"
    )}>
      {/* Circuit Pattern Background */}
      <div className={cn(
        "fixed inset-0 opacity-[0.03] pointer-events-none z-0",
        isDark ? "invert" : ""
      )} style={{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />

      <main className="flex-1 w-full max-w-[1800px] mx-auto p-4 md:p-8 pt-24 md:pt-32 relative z-10">
      <div className="relative mb-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative z-10"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-8 bg-primary" />
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary">System Advisor V2</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-headline font-black uppercase tracking-tighter leading-none">
            AI Build <span className="text-primary italic">Advisor</span>
          </h1>
          <p className="text-muted-foreground mt-4 max-w-2xl text-lg leading-relaxed">
            Get intelligent hardware recommendations and professional critiques for your custom build through our neural-trained AI model.
          </p>
        </motion.div>
        
        {/* Background Accent */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      </div>

      {builderState ? (
        <Tabs defaultValue="critique" className="w-full h-full">
          <div className="flex justify-center mb-12">
            <TabsList className={cn(
              "p-1 h-14 rounded-2xl border backdrop-blur-md",
              isDark ? "bg-slate-900/60 border-white/5" : "bg-white/60 border-slate-200"
            )}>
              <TabsTrigger 
                value="critique" 
                className="rounded-xl px-8 h-full data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300 font-bold uppercase tracking-widest text-[10px]"
              >
                Review Current Build
              </TabsTrigger>
              <TabsTrigger 
                value="generate"
                className="rounded-xl px-8 h-full data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300 font-bold uppercase tracking-widest text-[10px]"
              >
                Generate New Build
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="critique" className="mt-0 h-full">
            <div className="grid lg:grid-cols-12 gap-8 h-full">

              {isInsightsPinned && (
                <div className="hidden lg:block lg:col-span-3 h-[calc(100vh-140px)] sticky top-24">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="h-full"
                  >
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
                  </motion.div>
                </div>
              )}

              {/* Middle Column: AI Critique */}
              <div className={cn(
                "transition-all duration-500",
                isInsightsPinned ? "lg:col-span-6" : "lg:col-span-9"
              )}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    "rounded-3xl border backdrop-blur-xl h-full min-h-[600px] overflow-hidden shadow-2xl",
                    isDark ? "bg-slate-900/40 border-white/5 shadow-black/40" : "bg-white/60 border-slate-200 shadow-slate-200/50"
                  )}
                >
                  <div className="p-8 border-b border-border/50 bg-background/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <LayoutPanelLeft className="w-6 h-6 text-primary" />
                        <h2 className="text-xl font-headline font-bold uppercase tracking-tight">Performance Diagnostics</h2>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase tracking-widest">
                          <CircuitBoard className="w-3 h-3" />
                          Live Analysis
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-2 md:p-6">
                    <AIBuildCritique
                      build={builderState}
                      externalAnalysis={critiqueAnalysis}
                      externalLoading={critiqueLoading}
                      externalError={critiqueError}
                      onRefresh={() => handleCritique(true)}
                    />
                  </div>
                </motion.div>
              </div>

              {/* Right Column: Your Build Specs */}
              <div className="lg:col-span-3">
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="sticky top-24 flex flex-col gap-6 pb-4"
                >
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
                </motion.div>
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
    </div>
  );
}
