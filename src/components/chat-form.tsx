"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import {
  Select,
  TextInput,
  Switch,
  Paper,
  Stack,
  Group,
  Text,
  Button,
} from "@mantine/core";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { parsePesoBudget } from '@/lib/parse-peso-budget';
import { BUILD_ADVISOR_GOALS, getBuildAdvisorGoal, type BuildAdvisorIntendedUse } from '@/lib/build-advisor-goals';

const formSchema = z.object({
  intendedUse: z.string().min(1, "Please select an intended use."),
  workloadGoal: z.string().min(1, "Please select a priority for this PC."),
  budget: z.string().min(2, "Please provide a budget.").refine(value => parsePesoBudget(value) !== null, "Enter a valid PHP budget."),
  allowFlexibleBudget: z.boolean().default(false),
  allowAiSearch: z.boolean().default(true),
}).superRefine((values, context) => {
  if (values.intendedUse && values.workloadGoal && !getBuildAdvisorGoal(values.intendedUse, values.workloadGoal)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['workloadGoal'], message: 'Select a priority for the chosen intended use.' });
  }
});

export type FormSchema = z.infer<typeof formSchema>;

interface ChatFormProps {
  getRecommendations: (data: any) => void;
  isPending: boolean;
}

export function ChatForm({ getRecommendations, isPending }: ChatFormProps) {
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      intendedUse: "",
      workloadGoal: "",
      budget: "",
      allowFlexibleBudget: false,
      allowAiSearch: true,
    },
  });
  const intendedUse = form.watch('intendedUse');
  const goalGroup = BUILD_ADVISOR_GOALS[intendedUse as BuildAdvisorIntendedUse];

  function onSubmit(values: FormSchema) {
    const goal = getBuildAdvisorGoal(values.intendedUse, values.workloadGoal);
    if (!goal) return;
    getRecommendations({
      intendedUse: values.intendedUse,
      budget: values.budget,
      performanceLevel: goal.prompt,
      additionalNotes: "",
      allowFlexibleBudget: values.allowFlexibleBudget,
      allowAiSearch: values.allowAiSearch,
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
      <Controller
        name="intendedUse"
        control={form.control}
        render={({ field, fieldState }) => (
          <Select
            label="Intended Use"
            placeholder="What will you use this PC for?"
            data={[
              { value: "Gaming", label: "Gaming" },
              { value: "Video Editing", label: "Video Editing" },
              { value: "Software Development", label: "Software Development" },
              { value: "General Office Work", label: "General Office Work" },
            ]}
            value={field.value}
            onChange={(value) => {
              field.onChange(value ?? '');
              form.setValue('workloadGoal', '');
            }}
            error={fieldState.error?.message}
            radius="md"
            size="sm"
            classNames={{
              label:
                "text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5",
              input:
                "bg-slate-50 dark:bg-slate-900/60 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 font-medium focus:border-cyan-500 transition-colors",
            }}
          />
        )}
      />

      {goalGroup && (
        <Controller
          key={intendedUse}
          name="workloadGoal"
          control={form.control}
          render={({ field, fieldState }) => (
            <Select
              label={goalGroup.label}
              placeholder="Choose what matters most"
              data={goalGroup.options.map(option => ({ value: option.value, label: option.label }))}
              value={field.value}
              onChange={(value) => field.onChange(value ?? '')}
              error={fieldState.error?.message}
              radius="md"
              size="sm"
              classNames={{
                label: "text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5",
                input: "bg-slate-50 dark:bg-slate-900/60 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 font-medium focus:border-cyan-500 transition-colors",
              }}
            />
          )}
        />
      )}

      <Controller
        name="budget"
        control={form.control}
        render={({ field, fieldState }) => (
          <TextInput
            label="Budget"
            placeholder="e.g., ~₱50,000, 75k PHP budget"
            leftSection={<span className="text-xs font-bold text-slate-400">₱</span>}
            value={field.value}
            onChange={field.onChange}
            error={fieldState.error?.message}
            radius="md"
            size="sm"
            classNames={{
              label:
                "text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5",
              input:
                "bg-slate-50 dark:bg-slate-900/60 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 font-medium focus:border-cyan-500 transition-colors",
            }}
          />
        )}
      />

      <Controller
        name="allowFlexibleBudget"
        control={form.control}
        render={({ field }) => (
          <Paper
            radius="md"
            withBorder
            p="sm"
            className="bg-slate-50/70 dark:bg-slate-900/50 border-slate-200 dark:border-white/10 transition-colors"
          >
            <Group justify="space-between" align="center" wrap="nowrap">
              <Stack gap={2}>
                <Group gap={6} align="center">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                  <Text size="xs" fw={700} className="text-slate-800 dark:text-slate-200">
                    Flexible Budget
                  </Text>
                </Group>
                <Text size="xs" c="dimmed" className="text-[10px] sm:text-[11px] leading-tight">
                  Allow AI to exceed budget by up to 30% for major gains.
                </Text>
              </Stack>
              <Switch
                color="cyan"
                size="sm"
                checked={field.value}
                onChange={(event) => field.onChange(event.currentTarget.checked)}
              />
            </Group>
          </Paper>
        )}
      />

      <Controller
        name="allowAiSearch"
        control={form.control}
        render={({ field }) => (
          <Paper
            radius="md"
            withBorder
            p="sm"
            className="bg-slate-50/70 dark:bg-slate-900/50 border-slate-200 dark:border-white/10 transition-colors"
          >
            <Group justify="space-between" align="center" wrap="nowrap">
              <Stack gap={2}>
                <Group gap={6} align="center">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                  <Text size="xs" fw={700} className="text-slate-800 dark:text-slate-200">
                    AI Search
                  </Text>
                </Group>
                <Text size="xs" c="dimmed" className="text-[10px] sm:text-[11px] leading-tight">
                  Allows AI to recommend parts outside of our inventory.
                </Text>
              </Stack>
              <Switch
                color="cyan"
                size="sm"
                checked={field.value}
                onChange={(event) => field.onChange(event.currentTarget.checked)}
              />
            </Group>
          </Paper>
        )}
      />

      <div>
        <Button
          type="submit"
          fullWidth
          size="md"
          radius="md"
          color="teal"
          loading={isPending}
          leftSection={<Sparkles size={18} />}
          className={cn(
            "font-headline font-bold text-xs uppercase tracking-wider transition-all duration-200 h-11",
            !isPending
              ? "shadow-md shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.99]"
              : "opacity-60 cursor-not-allowed"
          )}
        >
          {isPending ? "Generating..." : "Get Recommendations"}
        </Button>
      </div>
    </form>
  );
}
