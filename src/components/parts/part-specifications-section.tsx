"use client";

import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { AddPartFormSchema } from "@/hooks/use-part-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import { CATEGORY_SPECS } from "@/lib/constants/category-specs";

interface PartSpecificationsSectionProps {
  form: UseFormReturn<AddPartFormSchema>;
  setSpecValue: (key: string, value: string) => void;
}

export function PartSpecificationsSection({ form, setSpecValue }: PartSpecificationsSectionProps) {
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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70 flex items-center gap-3">
          <span className="inline-block w-4 h-px bg-primary/40" />
          Technical Specifications
        </p>
        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-black uppercase tracking-widest px-3 py-1">
          {selectedCategory} Standards
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
        {(CATEGORY_SPECS[selectedCategory] || []).map((spec) => (
          <div key={spec.key} className="space-y-2 group">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 group-focus-within:text-primary transition-colors">
              {spec.key}
            </Label>
            <Input
              value={getSpecValue(spec.key)}
              onChange={(e) => setSpecValue(spec.key, e.target.value)}
              placeholder={spec.placeholder}
              className="bg-muted/30 border-border/40 h-10 rounded-xl focus:bg-background transition-all shadow-sm"
            />
          </div>
        ))}
      </div>

      {/* Custom Specs */}
      <div className="pt-6 border-t border-dashed border-border/40">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-6 flex items-center gap-3">
          <span className="inline-block w-4 h-px bg-border/40" />
          Custom Fields
        </p>
        
        <div className="flex flex-wrap gap-3 mb-6">
          {customSpecs.map((spec) => (
            <Badge
              key={spec.key}
              variant="secondary"
              className="pl-3 pr-1 py-1 bg-muted/40 hover:bg-muted/60 border-border/40 transition-colors group flex items-center gap-2 rounded-lg"
            >
              <span className="text-[10px] font-bold text-muted-foreground/80">{spec.key}:</span>
              <span className="text-xs font-semibold">{spec.value}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 rounded-md hover:bg-destructive/10 hover:text-destructive text-muted-foreground/40 transition-all"
                onClick={() => removeSpec(spec.key)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl bg-muted/20 border border-border/40 shadow-inner">
          <div className="flex-1 space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Field Name</Label>
            <Input
              value={customSpecKey}
              onChange={(e) => setCustomSpecKey(e.target.value)}
              placeholder="e.g., Warranty"
              className="bg-background/50 border-border/40 h-10 rounded-xl"
            />
          </div>
          <div className="flex-1 space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Field Value</Label>
            <Input
              value={customSpecValue}
              onChange={(e) => setCustomSpecValue(e.target.value)}
              placeholder="e.g., 3 Years"
              className="bg-background/50 border-border/40 h-10 rounded-xl"
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            className="sm:self-end h-10 px-6 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-bold text-xs uppercase tracking-widest"
            onClick={addCustomSpec}
            disabled={!customSpecKey || !customSpecValue}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Field
          </Button>
        </div>
      </div>
    </div>
  );
}
