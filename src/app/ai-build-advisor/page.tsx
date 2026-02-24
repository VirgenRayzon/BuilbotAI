"use client";

import { useState, useTransition, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ChatForm, type FormSchema } from "@/components/chat-form";
import { BuildSummary } from "@/components/build-summary";
import { getAiRecommendations } from "@/app/actions";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import type { Build, AiRecommendation, ComponentData } from "@/lib/types";
import { Cpu, Server, CircuitBoard, MemoryStick, Bot, Wallet, HardDrive, Power, RectangleVertical, Wind } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AIBuildCritique } from "@/components/ai-build-critique";
import { YourBuild } from "@/components/your-build";
import { useMemo } from "react";

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
    icon: HardDrive,
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

  const [build, setBuild] = useState<Build | null>(null);
  const [builderState, setBuilderState] = useState<Record<string, ComponentData | ComponentData[] | null> | null>(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [isPending, startTransition] = useTransition();

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
        }
      } catch (e) {
        console.error("Failed to parse saved build", e);
      }
    }
  }, []);

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
        const price = Math.floor(Math.random() * 20000) + 2500;
        return {
          ...component,
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
  };

  const generativeContent = (
    <div className="grid lg:grid-cols-12 gap-8 h-full">
      <aside className="lg:col-span-4 lg:sticky lg:top-20 self-start">
        <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Bot className="w-8 h-8 text-primary" />
            <h2 className="text-2xl font-headline font-semibold">
              Build Advisor
            </h2>
          </div>
          <p className="text-muted-foreground mb-6">
            Describe your dream PC, and our AI will suggest a compatible set
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
    <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
      {builderState ? (
        <Tabs defaultValue="critique" className="w-full h-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 max-w-md mx-auto">
            <TabsTrigger value="critique">Review Current Build</TabsTrigger>
            <TabsTrigger value="generate">Generate New Build</TabsTrigger>
          </TabsList>

          <TabsContent value="critique" className="mt-0 h-full">
            <div className="grid lg:grid-cols-12 gap-8 h-full">
              <div className="lg:col-span-4">
                <div className="sticky top-20 flex flex-col gap-6 max-h-[calc(100vh-6rem)] overflow-y-auto pb-4 pr-2">
                  <YourBuild build={builderState} onClearBuild={() => {
                    localStorage.removeItem('pc_builder_state');
                    setBuilderState(null);
                  }} onRemovePart={handleRemovePart} />
                </div>
              </div>
              <div className="lg:col-span-8">
                <AIBuildCritique build={builderState} />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="generate" className="mt-0 h-full">
            {generativeContent}
          </TabsContent>
        </Tabs>
      ) : generativeContent}
    </main>
  );
}
