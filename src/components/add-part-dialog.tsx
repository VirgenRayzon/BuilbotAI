/**
 * AddPartDialog — Modal dialog for creating or editing inventory parts.
 * Orchestrates PartIdentitySection and PartSpecificationsSection sub-components
 * with the usePartForm hook for state management and AI autofill.
 */
"use client";

import { useState, useMemo } from "react";
import { Plus, Sparkles, BrainCircuit, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "./ui/scroll-area";
import { SparkleButton } from "./ui/sparkle-button";
import { useFirestore, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";
import type { Part } from "@/lib/types";

// Extracted Components & Hooks
import { usePartForm, AddPartFormSchema } from "@/hooks/use-part-form";
import { PartIdentitySection } from "./parts/part-identity-section";
import { PartSpecificationsSection } from "./parts/part-specifications-section";
import { CATEGORY_SPECS } from "@/lib/constants/category-specs";

interface AddPartDialogProps {
  children: React.ReactNode;
  onSave: (data: AddPartFormSchema) => Promise<void>;
  initialData?: Part;
  title?: string;
}

export function AddPartDialog({ children, onSave, initialData, title }: AddPartDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const firestore = useFirestore();
  const settingsDocRef = useMemo(() => {
    if (firestore) return doc(firestore, 'siteSettings', 'main');
    return null;
  }, [firestore]);
  const { data: settings } = useDoc<any>(settingsDocRef);
  const isAiKillSwitch = settings?.isAiKillSwitch || false;

  const {
    form,
    isAiPending,
    handleGetAiDetails,
    handleCancelAiDetails,
    setSpecValue,
    selectedCategory,
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
        description: `${values.partName} has been ${initialData ? 'updated' : 'added to'} the inventory.` 
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

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && isAiPending) return;
        setOpen(isOpen);
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[70vw] p-0 gap-0 overflow-hidden border-primary/20 bg-background/95 backdrop-blur-xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] rounded-3xl [&>button.absolute]:hidden">
        
        {/* Header */}
        <DialogHeader className="px-8 pt-8 pb-6 border-b border-border/40 bg-muted/20 flex-row items-center gap-4 space-y-0">
          <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 shadow-inner">
            <Plus className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <DialogTitle className="font-headline text-2xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              {title || (initialData ? "Edit Component" : "Add New Component")}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground font-medium mt-1">
              {initialData ? "Refine component details and performance metrics." : "Configure new inventory with AI-assisted specification pre-filling."}
            </DialogDescription>
          </div>
          <div className="ml-auto">
            <SparkleButton
              type="button"
              onClick={isAiPending ? handleCancelAiDetails : handleGetAiDetails}
              isLoading={isAiPending}
              loadingChildren="CANCEL"
              icon={<Sparkles className="h-4 w-4" />}
              className="h-11 px-6 shadow-lg transition-all duration-300 text-xs font-black uppercase tracking-widest"
            >
              AI AUTOFILL
            </SparkleButton>
          </div>
        </DialogHeader>

        {isAiPending && (
          <div className="relative overflow-hidden bg-primary/5 border-b border-primary/10">
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary/20">
              <div className="h-full bg-primary animate-progress-glow w-[30%]" />
            </div>
            <div className="px-8 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                  <BrainCircuit className="h-4 w-4 text-primary animate-pulse" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-primary uppercase tracking-widest">Buildbot Intelligence Active</span>
                  <span className="text-[10px] text-primary/60 font-medium">Researching real-world specs, pricing, and compatibility metrics...</span>
                </div>
              </div>
              <Badge variant="outline" className="animate-pulse bg-primary/10 text-primary border-primary/20 text-[10px] uppercase font-bold px-3 py-1">
                Processing
              </Badge>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col">
            <ScrollArea className="h-[70vh]">
              <div className="px-10 py-8 space-y-10">
                <PartIdentitySection form={form} onCategoryChange={handleCategoryChange} />
                <PartSpecificationsSection form={form} setSpecValue={setSpecValue} />
              </div>
            </ScrollArea>

            <DialogFooter className="px-8 py-6 border-t border-border/40 bg-muted/20">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Specifications</span>
                    <span className="text-xs font-bold">{form.watch("specifications").length} metrics defined</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <DialogClose asChild>
                    <Button type="button" variant="outline" className="h-11 px-8 rounded-xl font-bold uppercase tracking-widest text-xs">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    type="submit"
                    disabled={isSubmitting || isAiPending}
                    className="h-11 px-8 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        SAVING...
                      </>
                    ) : (
                      initialData ? "UPDATE COMPONENT" : "SAVE COMPONENT"
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
