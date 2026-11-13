"use client";

import { useId } from "react";
import { UseFormReturn } from "react-hook-form";
import { BrainCircuit, Loader2, Plus, ShieldAlert } from "lucide-react";
import { Badge, Paper, Text, ThemeIcon } from "@mantine/core";
import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CatalogEditorHeaderActions } from "@/components/ui/catalog-editor-header-actions";
import { PartIdentitySection } from "./part-identity-section";
import { PartSpecificationsSection } from "./part-specifications-section";
import type { AddPartFormSchema, AiComponentWarning } from "@/hooks/use-part-form";
import type { Part } from "@/lib/types";

interface PartEditorFormProps {
  variant: "dialog" | "inline";
  form: UseFormReturn<AddPartFormSchema>;
  initialData?: Part;
  title?: string;
  isAiPending: boolean;
  isSubmitting: boolean;
  elapsedTime: number;
  aiDuration: number | null;
  tokensUsed: number | null;
  aiComponentWarning: AiComponentWarning | null;
  justAutofilled: boolean;
  duplicatePartName: string | null;
  onCategoryChange: (category: string) => void;
  setSpecValue: (key: string, value: string) => void;
  onGetAiDetails: () => void;
  onCancelAiDetails: () => void;
  onSubmit: (values: AddPartFormSchema) => void;
  onSubmitAndView?: () => void;
  onReset?: () => void;
  onStartSave: () => void;
}

export function PartEditorForm({
  variant,
  form,
  initialData,
  title,
  isAiPending,
  isSubmitting,
  elapsedTime,
  aiDuration,
  tokensUsed,
  aiComponentWarning,
  justAutofilled,
  duplicatePartName,
  onCategoryChange,
  setSpecValue,
  onGetAiDetails,
  onCancelAiDetails,
  onSubmit,
  onSubmitAndView,
  onReset,
  onStartSave,
}: PartEditorFormProps) {
  const isInline = variant === "inline";
  const inlineFormId = useId();
  const resolvedTitle = title || (initialData ? "Edit Component" : "Add New Component");
  const resolvedDescription = initialData
    ? "Refine component details and performance metrics."
    : "Configure new inventory with AI-assisted specification pre-filling.";
  const submitDisabled =
    isSubmitting || isAiPending || Boolean(aiComponentWarning) || Boolean(duplicatePartName);
  const specCount = form.watch("specifications").length;

  const headerContent = (
    <>
      <div className="flex items-center gap-3 min-w-0">
        <ThemeIcon size={44} radius="xl" variant="light" color="cyan" className="shadow-sm shrink-0">
          <Plus className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
        </ThemeIcon>
        <div className="min-w-0">
          {isInline ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-headline font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {resolvedTitle}
                </h1>
                <Badge variant="light" color="cyan" size="sm" className="font-bold uppercase tracking-wider">
                  {specCount} metrics
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {resolvedDescription}
              </p>
            </>
          ) : (
            <>
              <DialogTitle className="text-xl font-headline font-extrabold tracking-tight text-slate-900 dark:text-white">
                {resolvedTitle}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {resolvedDescription}
              </DialogDescription>
            </>
          )}
        </div>
      </div>

      <CatalogEditorHeaderActions
        mode="part"
        isInline={isInline}
        inlineFormId={inlineFormId}
        isAiPending={isAiPending}
        isSubmitting={isSubmitting}
        submitDisabled={submitDisabled}
        elapsedTime={elapsedTime}
        aiDuration={aiDuration}
        tokensUsed={tokensUsed}
        submitLabel={initialData ? "Update Component" : "Save Component"}
        submittingLabel={initialData ? "Updating, please wait" : "Saving, please wait"}
        onTriggerAi={onGetAiDetails}
        onCancelAi={onCancelAiDetails}
        onReset={onReset}
        onSaveAndView={onSubmitAndView}
        onBeforeSubmit={onStartSave}
      />
    </>
  );

  const formFields = (
    <div className={isInline ? "space-y-8" : "p-3 sm:p-4 space-y-4"}>
      <PartIdentitySection
        form={form}
        onCategoryChange={onCategoryChange}
        justAutofilled={justAutofilled}
        duplicatePartName={duplicatePartName}
        flat={isInline}
      />
      <PartSpecificationsSection
        form={form}
        setSpecValue={setSpecValue}
        justAutofilled={justAutofilled}
        flat={isInline}
      />
    </div>
  );

  const footerContent = (
    <div className="flex flex-wrap items-center justify-between gap-3 w-full">
      <div className="flex items-center gap-3">
        <Badge variant="light" color="cyan" size="lg" className="font-bold uppercase tracking-wider">
          {specCount} metrics defined
        </Badge>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <DialogClose asChild>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            className="h-10 px-6 rounded-xl font-bold uppercase tracking-wider text-xs border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
          >
            Cancel
          </Button>
        </DialogClose>
        <Button
          type="submit"
          onClick={onStartSave}
          disabled={submitDisabled}
          className="h-10 px-8 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold uppercase tracking-wider text-xs shadow-md shadow-cyan-500/20 transition-all duration-200"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {initialData ? "Updating, please wait" : "Saving, please wait"}
            </>
          ) : (
            initialData ? "Update Component" : "Save Component"
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <div className={isInline ? "space-y-6" : undefined}>
      {isInline ? (
        <div className="pb-4 border-b border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
          {headerContent}
        </div>
      ) : (
        <DialogHeader className="p-3 border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02] flex flex-row items-center justify-between gap-3 space-y-0">
          {headerContent}
        </DialogHeader>
      )}

      {isAiPending && (
        <div className={isInline ? "relative overflow-hidden rounded-lg bg-cyan-500/10 border border-cyan-500/20" : "relative overflow-hidden bg-cyan-500/10 dark:bg-cyan-500/10 border-b border-cyan-500/20"}>
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-cyan-500/20">
            <div className="h-full bg-cyan-500 animate-progress-glow w-[35%]" />
          </div>
          <div className="p-3 flex items-center justify-between gap-3">
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
            <Badge variant="filled" color="cyan" size="sm" className="font-mono font-bold animate-pulse shrink-0">
              Processing
            </Badge>
          </div>
        </div>
      )}

      {aiComponentWarning && !isAiPending && (
        <Paper
          role="alert"
          radius={isInline ? "md" : 0}
          className={isInline ? "border border-red-300 bg-red-50 px-3 py-3 dark:border-red-500/30 dark:bg-red-500/10" : "border-x-0 border-t-0 border-b border-red-300 bg-red-50 px-3 py-3 dark:border-red-500/30 dark:bg-red-500/10"}
        >
          <div className="flex items-start gap-3">
            <ThemeIcon size={38} radius="xl" color="red" variant="light" className="mt-0.5 shrink-0">
              <ShieldAlert className="h-5 w-5" aria-hidden="true" />
            </ThemeIcon>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Text fw={800} size="sm" c="red" className="tracking-tight">
                  Component could not be verified
                </Text>
                <Badge color="red" variant="filled" size="xs">
                  Do not add to inventory
                </Badge>
              </div>
              <Text size="xs" mt={3} className="text-red-800 dark:text-red-200">
                {aiComponentWarning.message}
              </Text>
              <Text size="xs" mt={5} fw={700} className="break-words text-slate-700 dark:text-slate-200">
                Searched model: {aiComponentWarning.partName}
              </Text>
            </div>
          </div>
        </Paper>
      )}

      <Form {...form}>
        <form
          id={isInline ? inlineFormId : undefined}
          onSubmit={form.handleSubmit(onSubmit)}
          className={isInline ? "flex flex-col space-y-8" : "flex flex-col"}
        >
          {isInline ? formFields : <ScrollArea className="h-[70vh]">{formFields}</ScrollArea>}

          {!isInline && (
            <DialogFooter className="p-3 border-t border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02]">
              {footerContent}
            </DialogFooter>
          )}
        </form>
      </Form>
    </div>
  );
}

