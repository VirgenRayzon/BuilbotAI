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

const formSchema = z.object({
  intendedUse: z.string().min(1, "Please select an intended use."),
  budget: z.string().min(2, "Please provide a budget."),
  performanceLevel: z.string().min(1, "Please select a performance level."),
  additionalNotes: z.string().optional(),
});

export type FormSchema = z.infer<typeof formSchema>;

interface ChatFormProps {
  getRecommendations: (data: FormSchema) => void;
  isPending: boolean;
}

export function ChatForm({ getRecommendations, isPending }: ChatFormProps) {
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      intendedUse: "",
      budget: "",
      performanceLevel: "",
      additionalNotes: "",
    },
  });

  function onSubmit(values: FormSchema) {
    getRecommendations(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="intendedUse"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Intended Use</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                <Input placeholder="e.g., ~$1500, budget-friendly" {...field} />
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? "Architecting..." : "Get Recommendations"}
        </Button>
      </form>
    </Form>
  );
}
