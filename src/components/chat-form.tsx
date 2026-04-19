"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { Sparkles, Zap, Gamepad2, Laptop, HardDrive } from "lucide-react";

const formSchema = z.object({
  intendedUse: z.string().min(1, "Please select an intended use."),
  budget: z.string().min(2, "Please provide a budget."),
  performanceLevel: z.string().min(1, "Please select a performance level."),
  additionalNotes: z.string().optional(),
  allowFlexibleBudget: z.boolean().default(false),
});

export type FormSchema = z.infer<typeof formSchema>;

interface ChatFormProps {
  getRecommendations: (data: FormSchema) => void;
  isPending: boolean;
}

const SUGGESTIONS = [
  { 
    label: "1080p Esports", 
    icon: Gamepad2,
    values: { intendedUse: "Gaming", budget: "₱35,000", performanceLevel: "Mid-range (1080p/1440p gaming)", additionalNotes: "Focus on high FPS for Valorant." }
  },
  { 
    label: "AAA 4K Beast", 
    icon: Zap,
    values: { intendedUse: "Gaming", budget: "₱120,000", performanceLevel: "High-end (4K, max settings)", additionalNotes: "Ray tracing enabled." }
  },
  { 
    label: "Workstation", 
    icon: Laptop,
    values: { intendedUse: "Video Editing", budget: "₱75,000", performanceLevel: "High-end (4K, max settings)", additionalNotes: "Heavy rendering workloads." }
  },
];

export function ChatForm({ getRecommendations, isPending }: ChatFormProps) {
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      intendedUse: "",
      budget: "",
      performanceLevel: "",
      additionalNotes: "",
      allowFlexibleBudget: false,
    },
  });

  function onSubmit(values: FormSchema) {
    getRecommendations(values);
  }

  const applySuggestion = (values: any) => {
    Object.entries(values).forEach(([key, value]) => {
      form.setValue(key as any, value);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 mb-2">
        {SUGGESTIONS.map((sug) => (
          <Button
            key={sug.label}
            variant="outline"
            size="sm"
            type="button"
            onClick={() => applySuggestion(sug.values)}
            className="h-8 text-[10px] font-bold uppercase tracking-widest gap-2 bg-primary/5 border-primary/10 hover:bg-primary/10 transition-all"
          >
            <sug.icon className="w-3 h-3 text-primary" />
            {sug.label}
          </Button>
        ))}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="intendedUse"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Intended Use</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="What will you use this PC for?" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Gaming">Gaming</SelectItem>
                    <SelectItem value="Video Editing">Video Editing</SelectItem>
                    <SelectItem value="Software Development">
                      Software Development
                    </SelectItem>
                    <SelectItem value="General Office Work">
                      General Office Work
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="budget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Budget</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., ~₱50,000, 75k PHP budget" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="performanceLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Desired Performance</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a performance level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="High-end (4K, max settings)">
                      High-end (4K, max settings)
                    </SelectItem>
                    <SelectItem value="Mid-range (1080p/1440p gaming)">
                      Mid-range (1080p/1440p gaming)
                    </SelectItem>
                    <SelectItem value="Budget (reliable for daily tasks)">
                      Budget (reliable for daily tasks)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="allowFlexibleBudget"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4 bg-primary/5 border-primary/10 shadow-inner">
                <div className="space-y-0.5">
                  <FormLabel className="text-sm font-bold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Flexible Budget
                  </FormLabel>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    Allow AI to exceed budget by up to 30% for major gains.
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="additionalNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Notes (optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Any preferences? e.g., 'prefer AMD', 'need lots of storage', 'quiet operation is important'"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full h-12 font-headline uppercase tracking-widest text-xs" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? "Architecting..." : "Get Recommendations"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
