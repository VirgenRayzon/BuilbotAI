"use client";

import React, { useMemo } from "react";
import {
  Paper,
  Title,
  Text,
  Badge,
  Group,
  Stack,
  Button,
  SegmentedControl,
  Textarea,
  Modal,
  ThemeIcon,
  Tooltip,
  Divider,
} from "@mantine/core";
import {
  Bot,
  Cpu,
  Sparkles,
  Wrench,
  Save,
  RotateCcw,
  Copy,
  Undo2,
  AlertTriangle,
  CheckCircle2,
  FileCode,
  Shield,
  Lightbulb,
  Clock,
  User,
} from "lucide-react";
import { useSystemPrompts, SystemPromptKey } from "@/hooks/use-system-prompts";
import { SYSTEM_PROMPT_METAS } from "@/lib/constants/default-system-prompts";

export function AiSystemPromptsSettings() {
  const {
    activeKey,
    setActiveKey,
    activeMeta,
    draftPrompts,
    setPromptValue,
    isDirty,
    hasAnyUnsavedChanges,
    isCustomized,
    isSaving,
    resetDialogOpen,
    setResetDialogOpen,
    resetTarget,
    setResetTarget,
    handleSave,
    handleDiscard,
    handleConfirmReset,
    handleCopy,
    lastUpdated,
    updatedBy,
  } = useSystemPrompts();

  const currentPromptText = draftPrompts[activeKey] ?? "";
  const charCount = currentPromptText.length;
  const wordCount = useMemo(() => {
    return currentPromptText.trim() ? currentPromptText.trim().split(/\s+/).length : 0;
  }, [currentPromptText]);
  const approxTokens = Math.round(charCount / 4);

  const activeIsDirty = isDirty(activeKey);
  const activeIsCustomized = isCustomized(activeKey);

  // Segmented control data
  const segmentData = useMemo(() => {
    return SYSTEM_PROMPT_METAS.map((meta) => {
      const dirty = isDirty(meta.id);
      const customized = isCustomized(meta.id);

      return {
        value: meta.id,
        label: (
          <Group gap="xs" wrap="nowrap" justify="center" py={4}>
            {meta.id === "chatbot" && <Bot size={15} className="text-cyan-500" />}
            {meta.id === "buildAdvisor" && <Cpu size={15} className="text-violet-500" />}
            {meta.id === "prebuiltAdvisor" && <Sparkles size={15} className="text-amber-500" />}
            {meta.id === "partExtractor" && <Wrench size={15} className="text-emerald-500" />}
            <span className="font-semibold text-xs">{meta.title}</span>
            {dirty && (
              <span className="h-2 w-2 rounded-full bg-amber-500 ring-2 ring-amber-400/30 animate-pulse" />
            )}
            {!dirty && customized && (
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
            )}
          </Group>
        ),
      };
    });
  }, [isDirty, isCustomized]);

  return (
    <div className="space-y-6">
      {/* MAIN SYSTEM PROMPTS CARD */}
      <Paper
        withBorder
        radius="lg"
        p={12}
        className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm transition-all"
      >
        <Stack gap="sm">
          {/* Header & Sub-selector */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 dark:border-white/10 pb-3">
            <div>
              <Group gap="xs">
                <ThemeIcon size="md" radius="md" color="indigo" variant="light">
                  <FileCode size={18} />
                </ThemeIcon>
                <Title order={3} className="text-lg font-bold font-headline text-slate-900 dark:text-white">
                  AI System Prompts & Instructions
                </Title>
              </Group>
              <Text size="xs" className="text-slate-600 dark:text-slate-400 font-medium mt-1">
                Customize persona, behavioral boundaries, and domain rules for the platform&apos;s AI engines.
              </Text>
            </div>

            {/* Quick Actions (Reset All / Discard) */}
            <Group gap="xs" wrap="wrap">
              {hasAnyUnsavedChanges && (
                <Badge
                  color="yellow"
                  variant="light"
                  size="sm"
                  className="font-semibold uppercase tracking-wider text-[10px]"
                >
                  Unsaved Changes Active
                </Badge>
              )}
              <Button
                variant="subtle"
                color="gray"
                size="xs"
                onClick={() => {
                  setResetTarget("all");
                  setResetDialogOpen(true);
                }}
                disabled={isSaving}
                leftSection={<RotateCcw size={13} />}
                className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Reset All to Defaults
              </Button>
            </Group>
          </div>

          {/* Segmented Selector for Prompts */}
          <div>
            <Text size="xs" fw={700} className="text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] mb-2">
              Select AI Feature Prompt
            </Text>
            <SegmentedControl
              value={activeKey}
              onChange={(val) => setActiveKey(val as SystemPromptKey)}
              data={segmentData}
              fullWidth
              size="sm"
              radius="md"
              className="bg-slate-100 dark:bg-[#0c1017] border border-slate-200 dark:border-white/10 p-1"
            />
          </div>

          {/* Active Prompt Details Card */}
          <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-[#0d131f]/70 p-3 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <Group gap="xs">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {activeMeta.title}
                  </span>
                  <Badge
                    size="xs"
                    variant="outline"
                    color={activeIsCustomized ? "cyan" : "gray"}
                    className="font-mono text-[10px]"
                  >
                    {activeIsCustomized ? "Custom Prompt" : "Default Baseline"}
                  </Badge>
                  {activeIsDirty && (
                    <Badge size="xs" color="yellow" variant="filled" className="font-bold text-[10px]">
                      Modified
                    </Badge>
                  )}
                </Group>
                <Text size="xs" className="text-slate-600 dark:text-slate-400 mt-0.5">
                  {activeMeta.subtitle}
                </Text>
              </div>

              {/* Character and token telemetry */}
              <Group gap="xs" wrap="nowrap" className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                <span title="Character count">{charCount.toLocaleString()} chars</span>
                <span>•</span>
                <span title="Word count">{wordCount.toLocaleString()} words</span>
                <span>•</span>
                <span className="text-cyan-600 dark:text-cyan-400 font-semibold" title="Estimated token count">
                  ~{approxTokens.toLocaleString()} tokens
                </span>
              </Group>
            </div>

            <Text size="xs" className="text-slate-600 dark:text-slate-300 leading-relaxed bg-white/60 dark:bg-black/20 p-2.5 rounded-lg border border-slate-200/50 dark:border-white/5">
              <span className="font-semibold text-slate-800 dark:text-slate-200">Scope:</span> {activeMeta.description}
            </Text>

            {/* Target endpoint tag */}
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Live Target:</span>
              <code className="bg-slate-200/70 dark:bg-white/10 px-2 py-0.5 rounded text-[10px]">
                {activeMeta.targetFeature}
              </code>
            </div>
          </div>

          {/* Prompt Textarea Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="system-prompt-textarea"
                className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5"
              >
                <span>System Directive Editor</span>
                {activeIsDirty && (
                  <span className="text-amber-600 dark:text-amber-400 font-normal text-[11px]">
                    (unsaved edits)
                  </span>
                )}
              </label>

              <Group gap="xs">
                <Button
                  size="xs"
                  variant="subtle"
                  color="gray"
                  onClick={() => handleCopy(activeKey)}
                  leftSection={<Copy size={13} />}
                  className="text-xs h-7 px-2"
                >
                  Copy Text
                </Button>

                {activeIsDirty && (
                  <Button
                    size="xs"
                    variant="subtle"
                    color="red"
                    onClick={() => handleDiscard(activeKey)}
                    leftSection={<Undo2 size={13} />}
                    className="text-xs h-7 px-2"
                  >
                    Discard Edits
                  </Button>
                )}

                <Button
                  size="xs"
                  variant="subtle"
                  color="yellow"
                  onClick={() => {
                    setResetTarget(activeKey);
                    setResetDialogOpen(true);
                  }}
                  leftSection={<RotateCcw size={13} />}
                  className="text-xs h-7 px-2"
                >
                  Reset to Default
                </Button>
              </Group>
            </div>

            <Textarea
              id="system-prompt-textarea"
              value={currentPromptText}
              onChange={(e) => setPromptValue(activeKey, e.currentTarget.value)}
              placeholder="Enter comprehensive system instructions for this AI model..."
              autosize
              minRows={14}
              maxRows={30}
              classNames={{
                input:
                  "font-mono text-xs leading-relaxed tracking-normal p-4 bg-white dark:bg-[#0c1017] border-slate-300 dark:border-white/15 text-slate-900 dark:text-slate-100 rounded-xl focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors shadow-inner",
              }}
            />
          </div>

          {/* Safe Editing Guidelines & Guardrails Tips */}
          <div className="rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 p-3 space-y-2">
            <Group gap="xs">
              <Lightbulb size={16} className="text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="font-bold text-xs text-blue-900 dark:text-blue-300">
                Optimization & Guardrail Tips for {activeMeta.title}
              </span>
            </Group>
            <ul className="list-disc list-inside space-y-1 text-xs text-blue-800 dark:text-blue-300/90 leading-relaxed pl-1">
              {activeMeta.tips.map((tip, idx) => (
                <li key={idx}>{tip}</li>
              ))}
            </ul>
          </div>

          <Divider className="border-slate-200 dark:border-white/10" />

          {/* Action Toolbar & Save */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            {/* Last updated metadata */}
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              {lastUpdated ? (
                <>
                  <Group gap={4}>
                    <Clock size={13} />
                    <span>Last Saved: {new Date(lastUpdated).toLocaleString()}</span>
                  </Group>
                  {updatedBy && (
                    <>
                      <span>•</span>
                      <Group gap={4}>
                        <User size={13} />
                        <span>By: {updatedBy}</span>
                      </Group>
                    </>
                  )}
                </>
              ) : (
                <span className="italic">Running with official built-in default prompts.</span>
              )}
            </div>

            {/* Save Buttons */}
            <Group gap="sm" justify="flex-end">
              {hasAnyUnsavedChanges && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleSave(true)}
                  disabled={isSaving}
                  className="text-xs font-semibold border-slate-300 dark:border-white/10"
                >
                  Save All {SYSTEM_PROMPT_METAS.length} Prompts
                </Button>
              )}

              <Button
                color="cyan"
                size="sm"
                onClick={() => handleSave(false)}
                loading={isSaving}
                leftSection={<Save size={15} />}
                className="text-xs font-bold uppercase tracking-wider bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/20"
              >
                Save {activeMeta.title}
              </Button>
            </Group>
          </div>
        </Stack>
      </Paper>

      {/* CONFIRM RESET MODAL */}
      <Modal
        opened={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
        title={
          <Group gap="xs">
            <ThemeIcon color="red" variant="light" radius="md">
              <RotateCcw size={16} />
            </ThemeIcon>
            <span className="font-bold text-slate-900 dark:text-white">
              Reset Prompt to Baseline Default?
            </span>
          </Group>
        }
        centered
        radius="lg"
        classNames={{
          content: "bg-white/95 dark:bg-[#141a23]/95 backdrop-blur-md border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-slate-100 shadow-xl rounded-xl overflow-hidden",
          header: "bg-white/95 dark:bg-[#141a23]/95 border-b border-slate-200/80 dark:border-white/10 px-4 py-3",
          body: "!px-4 !pt-3.5 !pb-4",
          close: "text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors",
        }}
      >
        <Stack gap="md" pt="xs">
          <Text size="xs" className="text-slate-600 dark:text-slate-300 leading-relaxed">
            {resetTarget === "all" ? (
              <>
                Are you sure you want to reset <strong>ALL system prompts</strong> (Chatbot, Build Advisor, and Prebuilt Advisor) back to their factory default instructions? Any customized instructions will be replaced.
              </>
            ) : (
              <>
                Are you sure you want to reset <strong>{activeMeta.title}</strong> back to its original baseline prompt? Any unsaved or custom changes to this prompt will be overwritten.
              </>
            )}
          </Text>

          <Group justify="flex-end" gap="xs" pt="sm">
            <Button
              variant="default"
              size="xs"
              onClick={() => setResetDialogOpen(false)}
              disabled={isSaving}
              className="text-xs border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300"
            >
              Cancel
            </Button>
            <Button
              color="red"
              size="xs"
              onClick={handleConfirmReset}
              loading={isSaving}
              leftSection={<RotateCcw size={13} />}
              className="text-xs font-bold uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white"
            >
              Confirm Reset
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}
