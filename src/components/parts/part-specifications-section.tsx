"use client";

import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { AddPartFormSchema } from "@/hooks/use-part-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge, Paper, ActionIcon } from "@mantine/core";
import { Plus, X } from "lucide-react";
import { CATEGORY_SPECS } from "@/lib/constants/category-specs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface PartSpecificationsSectionProps {
  form: UseFormReturn<AddPartFormSchema>;
  setSpecValue: (key: string, value: string) => void;
  justAutofilled?: boolean;
}

export function PartSpecificationsSection({ form, setSpecValue, justAutofilled }: PartSpecificationsSectionProps) {
  const [customSpecKey, setCustomSpecKey] = useState("");
  const [customSpecValue, setCustomSpecValue] = useState("");
  
  const specifications = form.watch("specifications");
  const selectedCategory = form.watch("category");

  const getSpecValue = (key: string): string =>
    specifications.find((s) => s.key === key)?.value ?? "";

  const addCustomSpec = () => {
    if (customSpecKey && customSpecValue) {
      setSpecValue(customSpecKey, customSpecValue);
      setCustomSpecKey("");
      setCustomSpecValue("");
    }
  };

  const removeSpec = (key: string) => {
    form.setValue("specifications", specifications.filter((s) => s.key !== key));
  };

  const categorySpecKeys = (CATEGORY_SPECS[selectedCategory] || []).map((s) => s.key);
  const customSpecs = specifications.filter((s) => !categorySpecKeys.includes(s.key));

  if (!selectedCategory) return null;

  const highlightClass = justAutofilled
    ? "ring-2 ring-cyan-500/50 bg-cyan-500/10 dark:bg-cyan-500/10 transition-all duration-700"
    : "";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-400 flex items-center gap-2.5">
          <span className="inline-block w-3.5 h-0.5 bg-cyan-500/60 rounded-full" />
          Technical Specifications
        </p>
        <Badge variant="light" color="cyan" size="md" className="font-bold uppercase tracking-wider">
          {selectedCategory} Standards
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(CATEGORY_SPECS[selectedCategory] || []).map((spec) => (
          <Paper
            key={spec.key}
            withBorder
            radius="xl"
            p="md"
            className="bg-slate-50/70 dark:bg-[#141a23]/70 border-slate-200 dark:border-white/10 space-y-2 group shadow-sm transition-all hover:border-cyan-500/30"
          >
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 group-focus-within:text-cyan-600 dark:group-focus-within:text-cyan-400 transition-colors truncate">
                {spec.key}
              </Label>
              {spec.options ? (
                <Badge size="xs" variant="light" color="cyan" className="font-mono text-[9px] uppercase">
                  Select
                </Badge>
              ) : (
                <Badge size="xs" variant="subtle" color="gray" className="font-mono text-[9px] uppercase">
                  Value
                </Badge>
              )}
            </div>
            {spec.options ? (
              <Select
                value={getSpecValue(spec.key)}
                onValueChange={(val) => setSpecValue(spec.key, val)}
              >
                <SelectTrigger className={cn(
                  "bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 h-10 rounded-xl text-slate-900 dark:text-white transition-all shadow-sm",
                  highlightClass
                )}>
                  <SelectValue placeholder={spec.placeholder} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 dark:border-white/10 bg-white dark:bg-[#141a23] text-slate-900 dark:text-white shadow-xl">
                  {spec.options.map((opt) => (
                    <SelectItem 
                      key={opt} 
                      value={opt}
                      className="text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/5"
                    >
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={getSpecValue(spec.key)}
                onChange={(e) => setSpecValue(spec.key, e.target.value)}
                placeholder={spec.placeholder}
                className={cn(
                  "bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 h-10 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all shadow-sm",
                  highlightClass
                )}
              />
            )}
          </Paper>
        ))}
      </div>

      {/* Custom Specs */}
      <div className="pt-6 border-t border-dashed border-slate-200 dark:border-white/10">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2.5">
          <span className="inline-block w-3.5 h-0.5 bg-slate-400/40 rounded-full" />
          Custom Fields
        </p>
        
        {customSpecs.length > 0 && (
          <div className="flex flex-wrap gap-2.5 mb-6">
            {customSpecs.map((spec) => (
              <Badge
                key={spec.key}
                variant="light"
                color="gray"
                size="lg"
                className="pl-3 pr-1 py-1 bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 flex items-center gap-2 rounded-xl"
              >
                <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">{spec.key}:</span>
                <span className="text-xs font-semibold">{spec.value}</span>
                <ActionIcon
                  variant="subtle"
                  color="red"
                  size="xs"
                  className="rounded-full ml-1"
                  onClick={() => removeSpec(spec.key)}
                >
                  <X className="h-3 w-3" />
                </ActionIcon>
              </Badge>
            ))}
          </div>
        )}

        <Paper 
          withBorder 
          radius="xl" 
          p="md" 
          className="flex flex-col sm:flex-row gap-4 bg-slate-50/70 dark:bg-[#111722]/60 border-slate-200 dark:border-white/10"
        >
          <div className="flex-1 space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Field Name
            </Label>
            <Input
              value={customSpecKey}
              onChange={(e) => setCustomSpecKey(e.target.value)}
              placeholder="e.g., Warranty"
              className="bg-white dark:bg-[#141a23] border-slate-200 dark:border-white/10 h-10 rounded-xl text-slate-900 dark:text-white"
            />
          </div>
          <div className="flex-1 space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Field Value
            </Label>
            <Input
              value={customSpecValue}
              onChange={(e) => setCustomSpecValue(e.target.value)}
              placeholder="e.g., 3 Years"
              className="bg-white dark:bg-[#141a23] border-slate-200 dark:border-white/10 h-10 rounded-xl text-slate-900 dark:text-white"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            className="sm:self-end h-10 px-6 rounded-xl border-cyan-500/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 font-bold text-xs uppercase tracking-wider"
            onClick={addCustomSpec}
            disabled={!customSpecKey || !customSpecValue}
          >
            <Plus className="h-4 w-4 mr-1.5" /> Add Field
          </Button>
        </Paper>
      </div>
    </div>
  );
}
