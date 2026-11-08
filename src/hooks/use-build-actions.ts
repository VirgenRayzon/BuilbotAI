"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { getAiPrebuiltSuggestions } from "@/app/actions";
import { createCheckoutOrder, type CheckoutOrderResult } from "@/app/checkout-actions";
import { type ProgressPhase } from "@/components/ai-progress-modal";
import { ComponentData, PaymentMethod } from "@/lib/types";
import { type PrebuiltBuilderAddFormSchema } from "@/components/prebuilt-builder-add-dialog";
import { useProductSaveOperation } from '@/hooks/use-product-save-operation';

interface UseBuildActionsOptions {
  build: Record<string, ComponentData | ComponentData[] | null>;
  user: any;
  isAiKillSwitch: boolean;
  onClearBuild: () => void;
  onAnalyze?: (forceRefresh?: boolean) => void;
  onAddPrebuilt?: (data: import('@/components/prebuilt-builder-add-dialog').PrebuiltBuilderAddFormSchema, operationId?: string) => void | Promise<import('@/lib/product-identity').CreatedProduct | void>;
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
}: UseBuildActionsOptions) {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showLocalAiProgress, setShowLocalAiProgress] = useState(false);
  const [aiPhase, setAiPhase] = useState<ProgressPhase>('init');
  const [isAiPending, setIsAiPending] = useState(false);
  const [tokensUsed, setTokensUsed] = useState<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { getOperation, resetOperation } = useProductSaveOperation();

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleCancelAi = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setShowLocalAiProgress(false);
    toast({
      title: "AI Generation Stopped",
      description: "The architect has been recalled. Generation cancelled.",
    });
  };

  const handleAddPrebuiltWithAi = (requestedName: string) => {
    if (!onAddPrebuilt) return;

    const prebuiltName = requestedName.trim();
    if (!prebuiltName) {
      toast({
        title: "Prebuilt name required",
        description: "Enter a name before generating the prebuilt.",
        variant: "destructive",
      });
      return;
    }

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
    setIsAiPending(true);
    setTokensUsed(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    (async () => {
      try {
        const checkAbort = () => {
          if (controller.signal.aborted) {
            throw new Error("ABORTED");
          }
        };

        await new Promise(r => setTimeout(r, 400));
        checkAbort();
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

        const productHighlights = Object.entries(build)
          .flatMap(([category, value]) => {
            const parts = Array.isArray(value) ? value : value ? [value] : [];
            return parts
              .filter((part) => part.description?.trim())
              .map((part) => {
                const maxChars = ["CPU", "GPU", "Motherboard"].includes(category) ? 900 : 280;
                return `${category} — ${part.model}: ${part.description!.trim().slice(0, maxChars)}`;
              });
          })
          .join("\n\n");

        const result = await getAiPrebuiltSuggestions({
          components: selectedComponents,
          inventoryPrice: Math.round(totalPrice * 100) / 100,
          productHighlights,
        });

        checkAbort();
        setAiPhase('ai-complete');
        await new Promise(r => setTimeout(r, 300));
        checkAbort();
        setAiPhase('ai-formatting');

        if (result && "description" in result && result.description) {
          await new Promise(r => setTimeout(r, 300));
          checkAbort();
          setAiPhase('image-fetch');

          const caseImage = (build['Case'] as ComponentData)?.image;
          const finalImage = (caseImage && !caseImage.includes('picsum.photos')) 
            ? caseImage 
            : '/placeholders/components/case.jpg';

          const finalData: PrebuiltBuilderAddFormSchema = {
            name: prebuiltName,
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
          checkAbort();
          setAiPhase('saving');

          await onAddPrebuilt(finalData, getOperation(finalData));
          resetOperation();
          checkAbort();
          setAiPhase('done');
          setTokensUsed(Math.round(JSON.stringify(result).length / 4));
        } else {
          setShowLocalAiProgress(false);
          toast({
            variant: "destructive",
            title: "AI Generation Failed",
            description: (result as any)?.error || "Could not generate suggestions."
          });
        }
      } catch (error: any) {
        if (error.message === "ABORTED") {
          console.log("AI Generation aborted by user.");
          return;
        }
        setShowLocalAiProgress(false);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "An unexpected error occurred."
        });
      } finally {
        setIsAiPending(false);
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    })();
  };

  const handleCheckout = async (
    onSuccess?: (result?: CheckoutOrderResult) => void,
    paymentMethod: PaymentMethod = "cod"
  ) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to place your order.",
        variant: "destructive"
      });
      return;
    }

    setIsCheckingOut(true);
    const buildComponents: Array<{
      id: string;
      category: string;
      name: string;
      price: number;
      imageUrl?: string;
    }> = [];
    Object.entries(build).forEach(([category, val]) => {
      if (val) {
        if (Array.isArray(val)) {
          val.forEach((v) =>
            buildComponents.push({
              id: v.id,
              name: v.model,
              category,
              price: v.price,
              imageUrl: v.image,
            })
          );
        } else {
          buildComponents.push({
            id: val.id,
            name: val.model,
            category,
            price: val.price,
            imageUrl: val.image,
          });
        }
      }
    });

    const userEmail = String(user.email || "customer@buildbot.ai");
    const userDisplayName = String(
      user.displayName || userEmail.split("@")[0] || "BuildbotAI Customer"
    );
    const rigSubtotal = buildComponents.reduce((sum, c) => sum + (Number(c.price) || 0), 0);

    const result = await createCheckoutOrder({
      idToken: await user.getIdToken(),
      operationId: crypto.randomUUID(),
      paymentMethod,
      shippingMethod: "store_pickup",
      shippingAddress: {
        fullName: userDisplayName,
        phone: "09170000000",
        email: userEmail,
        region: "Metro Manila",
        city: "Quezon City",
        barangay: "Flagship Hub",
        streetAddress: "BuildbotAI Flagship Hub Pickup",
        postalCode: "1100",
      },
      cartItems: [
        {
          id: `custom-rig-${Date.now()}`,
          kind: "custom-build",
          name: "Custom PC Build",
          price: rigSubtotal,
          quantity: 1,
          components: buildComponents,
        },
      ],
    });

    if (result.success) {
      if (paymentMethod === "cod") {
        toast({
          title: "Order Placed (Cash on Delivery)",
          description: `Order ${result.orderNumber || ""} has been placed with Payment Status: Unpaid (Pay on Delivery).`,
        });
      }
      onClearBuild();
      onSuccess?.(result);
    } else {
      toast({
        title: "Order Failed",
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
    tokensUsed,
    handleAddPrebuiltWithAi,
    handleCancelAi,
    handleCheckout,
    handleAnalyze,
    handleApplySuggestion,
  };
}
