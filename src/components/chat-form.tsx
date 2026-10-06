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
} from "@mantine/core";
import { SparkleButton } from "./ui/sparkle-button";
import { Sparkles } from "lucide-react";

const formSchema = z.object({
  intendedUse: z.string().min(1, "Please select an intended use."),
  budget: z.string().min(2, "Please provide a budget."),
  allowFlexibleBudget: z.boolean().default(false),
  allowWebSearch: z.boolean().default(true),
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
      budget: "",
      allowFlexibleBudget: false,
      allowWebSearch: true,
    },
  });

  function onSubmit(values: FormSchema) {
    getRecommendations({
      intendedUse: values.intendedUse,
      budget: values.budget,
      performanceLevel: "Optimal performance for budget and intended workload",
      additionalNotes: "",
      allowFlexibleBudget: values.allowFlexibleBudget,
      allowWebSearch: values.allowWebSearch,
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
        name="allowWebSearch"
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
                    Web Search
                  </Text>
                </Group>
                <Text size="xs" c="dimmed" className="text-[10px] sm:text-[11px] leading-tight">
                  Allow AI to search the web for parts outside our inventory.
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

      <div className="pt-2">
        <SparkleButton
          type="submit"
          className="w-full h-11 text-xs font-black uppercase tracking-wider rounded-xl"
          isLoading={isPending}
          icon={<Sparkles className="h-4 w-4" />}
        >
          {isPending ? "Generating..." : "Get Recommendations"}
        </SparkleButton>
      </div>
    </form>
  );
}
