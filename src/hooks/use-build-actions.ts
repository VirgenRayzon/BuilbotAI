/**
 * useBuildActions — Custom hook encapsulating all Build sidebar business logic.
 * Manages AI prebuilt generation, build critique analysis, checkout flow,
 * and progress modal state. Keeps the YourBuild component presentational.
 */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { getAiPrebuiltSuggestions } from "@/app/actions";
import { processCheckout } from "@/app/checkout-actions";
import { type ProgressPhase } from "@/components/ai-progress-modal";
import { ComponentData, OrderItem, Part } from "@/lib/types";
import { type PrebuiltBuilderAddFormSchema } from "@/components/prebuilt-builder-add-dialog";

interface UseBuildActionsOptions {
  build: Record<string, ComponentData | ComponentData[] | null>;
  user: any;
  isAiKillSwitch: boolean;
  onClearBuild: () => void;
  onAnalyze?: (forceRefresh?: boolean) => void;
  onAddPrebuilt?: (data: any) => void | Promise<void>;
  totalPrice: number;
  onAnalysisUpdate?: (analysis: any) => void;
}

export function useBuildActions({
  build,
  user,
  isAiKillSwitch,
  onClearBuild,
  onAnalyze,
  onAddPrebuilt,
  totalPrice,
  onAnalysisUpdate,
}: UseBuildActionsOptions) {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showLocalAiProgress, setShowLocalAiProgress] = useState(false);
  const [aiPhase, setAiPhase] = useState<ProgressPhase>('init');
  const [isAiPending, startAiTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const handleAddPrebuiltWithAi = () => {
    if (!onAddPrebuilt) return;

    if (isAiKillSwitch) {
      toast({
        title: "AI Disabled",
        description: "AI is disable by Administrator.",
        variant: "destructive"
      });
      return;
    }

    setAiPhase('init');
    setShowLocalAiProgress(true);

    startAiTransition(async () => {
      try {
        await new Promise(r => setTimeout(r, 400));
        setAiPhase('ai-requesting');

        const selectedComponents = {
          cpu: (build['CPU'] as ComponentData)?.model,
          gpu: (build['GPU'] as ComponentData)?.model,
          motherboard: (build['Motherboard'] as ComponentData)?.model,
          ram: Array.isArray(build['RAM']) 
            ? (build['RAM'] as ComponentData[]).map(r => r.model).join(", ") 
            : (build['RAM'] as ComponentData)?.model,
          storage: Array.isArray(build['Storage']) 
            ? (build['Storage'] as ComponentData[]).map(s => s.model).join(", ") 
            : (build['Storage'] as ComponentData)?.model,
          psu: (build['PSU'] as ComponentData)?.model,
          case: (build['Case'] as ComponentData)?.model,
          cooler: (build['Cooler'] as ComponentData)?.model,
        };

        const result = await getAiPrebuiltSuggestions({
          components: selectedComponents
        });

        setAiPhase('ai-complete');
        await new Promise(r => setTimeout(r, 300));
        setAiPhase('ai-formatting');

        if (result && "systemName" in result) {
          await new Promise(r => setTimeout(r, 300));
          setAiPhase('image-fetch');

          const randomNum = Math.floor(Math.random() * 1000);
          const systemSlug = result.systemName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
          const finalImage = `https://picsum.photos/seed/${systemSlug}${randomNum}/800/600`;

          const finalData: PrebuiltBuilderAddFormSchema = {
            name: result.systemName,
            description: result.description || "High-performance prebuilt system.",
            price: Math.round(totalPrice * 100) / 100,
            tier: result.tier || "Mid-Range",
            imageUrl: finalImage,
            cpu: (build['CPU'] as ComponentData)?.id || "",
            gpu: (build['GPU'] as ComponentData)?.id || "",
            motherboard: (build['Motherboard'] as ComponentData)?.id || "",
            ram: Array.isArray(build['RAM']) ? (build['RAM'] as ComponentData[]).map(r => r.id) : (build['RAM'] ? [(build['RAM'] as ComponentData).id] : []),
            storage: Array.isArray(build['Storage']) ? (build['Storage'] as ComponentData[]).map(s => s.id) : (build['Storage'] ? [(build['Storage'] as ComponentData).id] : []),
            psu: (build['PSU'] as ComponentData)?.id || "",
            case: (build['Case'] as ComponentData)?.id || "",
            cooler: (build['Cooler'] as ComponentData)?.id || "",
          };

          await new Promise(r => setTimeout(r, 300));
          setAiPhase('saving');

          await onAddPrebuilt(finalData);
          setAiPhase('done');
        } else {
          setShowLocalAiProgress(false);
          toast({
            variant: "destructive",
            title: "AI Generation Failed",
            description: (result as any)?.error || "Could not generate suggestions."
          });
        }
      } catch (error: any) {
        setShowLocalAiProgress(false);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "An unexpected error occurred."
        });
      }
    });
  };

  const handleCheckout = async (onSuccess?: () => void) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to reserve your build.",
        variant: "destructive"
      });
      return;
    }

    setIsCheckingOut(true);
    const orderItems: OrderItem[] = [];
    Object.entries(build).forEach(([category, val]) => {
      if (val) {
        if (Array.isArray(val)) {
          val.forEach(v => orderItems.push({
            id: v.id,
            name: v.model,
            category,
            price: v.price
          }));
        } else {
          orderItems.push({
            id: (val as any).id,
            name: (val as any).model,
            category,
            price: (val as any).price
          });
        }
      }
    });

    const result = await processCheckout(user.uid, user.email || "guest", orderItems);

    if (result.success) {
      toast({
        title: "Build Reserved!",
        description: "Your build reservation has been recorded.",
      });
      onClearBuild();
      onSuccess?.();
    } else {
      toast({
        title: "Reservation Failed",
        description: result.error,
        variant: "destructive"
      });
    }
    setIsCheckingOut(false);
  };

  const handleAnalyze = async (onComplete?: (success: boolean) => void) => {
    if (onAnalyze) {
      onAnalyze();
      if (onComplete) onComplete(true);
      return;
    }

    if (isAiKillSwitch) {
      toast({
        title: "AI Disabled",
        description: "AI is disabled by Administrator.",
        variant: "destructive"
      });
      return;
    }

    router.push('/ai-build-advisor');
    if (onComplete) onComplete(true);
  };

  const handleApplySuggestion = async (category: string, partId: string) => {
    if (!partId) return;
    
    const event = new CustomEvent('add-suggestion', { 
      detail: { 
        id: partId,
        category: category 
      } 
    });
    window.dispatchEvent(event);
    
    toast({
      title: "Optimization Applied",
      description: `Updating your build with the recommended ${category}.`,
    });
  };

  return {
    isCheckingOut,
    showLocalAiProgress,
    setShowLocalAiProgress,
    aiPhase,
    isAiPending,
    handleAddPrebuiltWithAi,
    handleCheckout,
    handleAnalyze,
    handleApplySuggestion,
  };
}
