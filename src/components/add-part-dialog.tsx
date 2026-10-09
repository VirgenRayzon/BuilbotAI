"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ScrollArea } from "./ui/scroll-area";
import { ThemeIcon, Text, Badge, Paper } from "@mantine/core";
import { Plus, BrainCircuit, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";
import { usePartForm, AddPartFormSchema } from "@/hooks/use-part-form";
import { CATEGORY_SPECS } from "@/lib/constants/category-specs";
import { PartIdentitySection } from "./parts/part-identity-section";
import { PartSpecificationsSection } from "./parts/part-specifications-section";
import { AiActionButton } from "./ui/ai-action-button";
import type { Part } from "@/lib/types";

interface AddPartDialogProps {
  children?: React.ReactNode;
  onSave: (data: AddPartFormSchema) => Promise<void>;
  initialData?: Part;
  title?: string;
}

export function AddPartDialog({ children, onSave, initialData, title }: AddPartDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [justAutofilled, setJustAutofilled] = useState(false);
  const startTimeRef = useRef<number>(0);
  const prevPendingRef = useRef(false);
  const { toast } = useToast();

  const firestore = useFirestore();
  const settingsDocRef = useMemo(() => {
    if (firestore) return doc(firestore, "siteSettings", "main");
    return null;
  }, [firestore]);
  const { data: settings } = useDoc<any>(settingsDocRef);
  const isAiKillSwitch = settings?.isAiKillSwitch || false;

  const {
    form,
    isAiPending,
    aiDuration,
    tokensUsed,
    handleGetAiDetails,
    handleCancelAiDetails,
    setSpecValue,
  } = usePartForm({ initialData, open, isAiKillSwitch });

  const handleCategoryChange = (newCategory: string) => {
    form.setValue("category", newCategory, { shouldValidate: true });
    const categoryKeys = (CATEGORY_SPECS[newCategory] || []).map((s) => s.key);
    const current = form.getValues("specifications");
    form.setValue("specifications", current.filter((s) => categoryKeys.includes(s.key)));
  };

  const onSubmit = async (values: AddPartFormSchema) => {
    setIsSubmitting(true);
    try {
      await onSave(values);
      toast({ 
        title: initialData ? "Part Updated!" : "Part Added!", 
        description: `${values.partName} has been ${initialData ? "updated" : "added to"} the inventory.` 
      });
      if (!initialData) form.reset();
      setOpen(false);
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: initialData ? "Error updating part" : "Error adding part", 
        description: error.message || "An unexpected error occurred." 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Live timer for AI generation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAiPending) {
      setElapsedTime(0);
      startTimeRef.current = Date.now();
      interval = setInterval(() => {
        setElapsedTime(Math.round((Date.now() - startTimeRef.current) / 1000));
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAiPending]);

  // Trigger field highlight when AI generation finishes
  useEffect(() => {
    if (prevPendingRef.current && !isAiPending && aiDuration !== null) {
      setJustAutofilled(true);
      const timer = setTimeout(() => setJustAutofilled(false), 2500);
      return () => clearTimeout(timer);
    }
    prevPendingRef.current = isAiPending;
  }, [isAiPending, aiDuration]);

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && isAiPending) return;
        setOpen(isOpen);
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[70vw] p-0 gap-0 overflow-hidden border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111722] backdrop-blur-2xl shadow-2xl rounded-3xl [&>button.absolute]:hidden">
        
        {/* Header */}
        <DialogHeader className="px-8 pt-7 pb-5 border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02] flex flex-row items-center justify-between gap-4 space-y-0">
          <div className="flex items-center gap-4">
            <ThemeIcon size={46} radius="xl" variant="light" color="cyan" className="shadow-sm">
              <Plus className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
            </ThemeIcon>
            <div>
              <DialogTitle className="text-xl font-headline font-extrabold tracking-tight text-slate-900 dark:text-white">
                {title || (initialData ? "Edit Component" : "Add New Component")}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {initialData ? "Refine component details and performance metrics." : "Configure new inventory with AI-assisted specification pre-filling."}
              </DialogDescription>
            </div>
          </div>

          <div className="ml-auto">
            <AiActionButton
              label="AI AUTOFILL"
              isPending={isAiPending}
              onTrigger={handleGetAiDetails}
              onCancel={handleCancelAiDetails}
              elapsedTime={elapsedTime}
              aiDuration={aiDuration}
              tokensUsed={tokensUsed}
              mode="part"
            />
          </div>
        </DialogHeader>

        {/* AI Progress Banner */}
        {isAiPending && (
          <div className="relative overflow-hidden bg-cyan-500/10 dark:bg-cyan-500/10 border-b border-cyan-500/20">
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-cyan-500/20">
              <div className="h-full bg-cyan-500 animate-progress-glow w-[35%]" />
            </div>
            <div className="px-8 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ThemeIcon size={32} radius="lg" variant="light" color="cyan">
                  <BrainCircuit className="h-4 w-4 animate-pulse text-cyan-600 dark:text-cyan-400" />
                </ThemeIcon>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-cyan-800 dark:text-cyan-300 uppercase tracking-wider">
                    Buildbot Intelligence Active
                  </span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-400">
                    Researching real-world specs, pricing benchmarks, and verified compatibility...
                  </span>
                </div>
              </div>
              <Badge variant="filled" color="cyan" size="sm" className="font-mono font-bold animate-pulse">
                Processing
              </Badge>
            </div>
          </div>
        )}

        {/* Form Body */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col">
            <ScrollArea className="h-[70vh]">
              <div className="px-10 py-8 space-y-10">
                <PartIdentitySection 
                  form={form} 
                  onCategoryChange={handleCategoryChange} 
                  justAutofilled={justAutofilled}
                />
                <PartSpecificationsSection 
                  form={form} 
                  setSpecValue={setSpecValue} 
                  justAutofilled={justAutofilled}
                />
              </div>
            </ScrollArea>

            {/* Footer */}
            <DialogFooter className="px-8 py-4 border-t border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02]">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <Badge variant="light" color="cyan" size="lg" className="font-bold uppercase tracking-wider">
                    {form.watch("specifications").length} metrics defined
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <DialogClose asChild>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="h-10 px-6 rounded-xl font-bold uppercase tracking-wider text-xs border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                    >
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    type="submit"
                    disabled={isSubmitting || isAiPending}
                    className="h-10 px-8 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold uppercase tracking-wider text-xs shadow-md shadow-cyan-500/20 transition-all duration-200"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      initialData ? "Update Component" : "Save Component"
                    )}
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
