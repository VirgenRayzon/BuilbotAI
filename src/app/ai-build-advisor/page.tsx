"use client";

import { useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { ChatForm, type FormSchema } from "@/components/chat-form";
import { BuildSummary } from "@/components/build-summary";
import { getAiRecommendations } from "@/app/actions";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import type { Build, AiRecommendation } from "@/lib/types";
import { Cpu, Server, CircuitBoard, MemoryStick, Bot, Wallet, HardDrive, Power, RectangleVertical, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";

const componentMetadata: { [key: string]: { icon: React.ElementType, image: any }} = {
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

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value);
};

export default function AiBuildAdvisorPage() {
  const [build, setBuild] = useState<Build | null>(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleGetRecommendations = (data: FormSchema) => {
    startTransition(async () => {
      const result = await getAiRecommendations(data);
      if (!result) {
        toast({
          variant: "destructive",
          title: "Error",
          description:
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

  const handleShare = () => {
    if (!build) return;
    const shareText = `Check out my PC build from Forge Architect AI!
CPU: ${build.cpu.model}
GPU: ${build.gpu.model}
Motherboard: ${build.motherboard.model}
RAM: ${build.ram.model}
Storage: ${build.storage.model}
PSU: ${build.psu.model}
Case: ${build.case.model}
Cooler: ${build.cooler.model}
---
Total Estimated Cost: ${formatCurrency(totalPrice)}
Estimated Wattage: ${build.estimatedWattage}
`;
    navigator.clipboard.writeText(shareText);
    toast({
      title: "Build Copied!",
      description: "Your build configuration has been copied to the clipboard.",
    });
  };

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
      <div className="grid lg:grid-cols-12 gap-8 h-full">
        <aside className="lg:col-span-4 lg:sticky lg:top-20 self-start">
          <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Bot className="w-8 h-8 text-primary" />
              <h2 className="text-2xl font-headline font-semibold">
                AI Build Advisor
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
                      <h3 className="text-muted-foreground text-sm">Estimated Cost</h3>
                      <p className="text-3xl font-bold font-headline">
                          {formatCurrency(totalPrice)}
                      </p>
                  </div>
              </div>
              <Button onClick={handleShare} disabled={!build}>Share Build</Button>
          </div>

          <BuildSummary build={build} isPending={isPending} />
        </div>
      </div>
    </main>
  );
}
