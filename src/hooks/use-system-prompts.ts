"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSiteSettings } from "@/context/site-settings-context";
import { useUserProfile } from "@/context/user-profile";
import { useFirestore } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { updateSystemPromptsAction, resetSystemPromptsAction } from "@/app/actions";
import { createAuditLog } from "@/firebase/audit";
import {
  DEFAULT_CHATBOT_PROMPT,
  DEFAULT_BUILD_ADVISOR_PROMPT,
  DEFAULT_PREBUILT_ADVISOR_PROMPT,
  DEFAULT_PART_EXTRACTOR_PROMPT,
  SYSTEM_PROMPT_METAS,
  SystemPromptMeta,
} from "@/lib/constants/default-system-prompts";

export type SystemPromptKey = 'chatbot' | 'buildAdvisor' | 'prebuiltAdvisor' | 'partExtractor';

export function useSystemPrompts() {
  const { systemPrompts: savedPrompts } = useSiteSettings();
  const { profile } = useUserProfile();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [activeKey, setActiveKey] = useState<SystemPromptKey>('chatbot');

  // Form state holding current (possibly unsaved) prompt text
  const [draftPrompts, setDraftPrompts] = useState<Record<SystemPromptKey, string>>({
    chatbot: DEFAULT_CHATBOT_PROMPT,
    buildAdvisor: DEFAULT_BUILD_ADVISOR_PROMPT,
    prebuiltAdvisor: DEFAULT_PREBUILT_ADVISOR_PROMPT,
    partExtractor: DEFAULT_PART_EXTRACTOR_PROMPT,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<SystemPromptKey | 'all'>('chatbot');

  // Sync draft prompts when savedPrompts load from Firestore (unless user is actively typing)
  useEffect(() => {
    setDraftPrompts((prev) => ({
      chatbot: savedPrompts?.chatbot ?? DEFAULT_CHATBOT_PROMPT,
      buildAdvisor: savedPrompts?.buildAdvisor ?? DEFAULT_BUILD_ADVISOR_PROMPT,
      prebuiltAdvisor: savedPrompts?.prebuiltAdvisor ?? DEFAULT_PREBUILT_ADVISOR_PROMPT,
      partExtractor: savedPrompts?.partExtractor ?? DEFAULT_PART_EXTRACTOR_PROMPT,
    }));
  }, [savedPrompts?.chatbot, savedPrompts?.buildAdvisor, savedPrompts?.prebuiltAdvisor, savedPrompts?.partExtractor]);

  // Active prompt metadata
  const activeMeta = useMemo<SystemPromptMeta>(() => {
    return (
      SYSTEM_PROMPT_METAS.find((m) => m.id === activeKey) || SYSTEM_PROMPT_METAS[0]
    );
  }, [activeKey]);

  // Check if a specific prompt has unsaved edits
  const isDirty = useCallback(
    (key?: SystemPromptKey) => {
      const target = key || activeKey;
      const currentDraft = draftPrompts[target] ?? "";
      const saved = (savedPrompts?.[target] ?? getBaselineDefault(target)).trim();
      return currentDraft.trim() !== saved.trim();
    },
    [draftPrompts, savedPrompts, activeKey]
  );

  // Check if any prompt has unsaved edits
  const hasAnyUnsavedChanges = useMemo(() => {
    return (
      isDirty('chatbot') ||
      isDirty('buildAdvisor') ||
      isDirty('prebuiltAdvisor') ||
      isDirty('partExtractor')
    );
  }, [isDirty]);

  // Check if prompt differs from hardcoded default baseline
  const isCustomized = useCallback(
    (key: SystemPromptKey) => {
      const current = (draftPrompts[key] ?? "").trim();
      const baseline = getBaselineDefault(key).trim();
      return current !== baseline;
    },
    [draftPrompts]
  );

  // Update draft prompt text
  const setPromptValue = useCallback((key: SystemPromptKey, value: string) => {
    setDraftPrompts((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // Discard unsaved changes for a specific key
  const handleDiscard = useCallback(
    (key: SystemPromptKey) => {
      const saved = savedPrompts?.[key] ?? getBaselineDefault(key);
      setDraftPrompts((prev) => ({
        ...prev,
        [key]: saved,
      }));
      toast({
        title: "Changes Discarded",
        description: `Unsaved changes for ${getPromptName(key)} were reverted.`,
      });
    },
    [savedPrompts, toast]
  );

  // Save changes to Firestore
  const handleSave = useCallback(
    async (saveAll: boolean = false) => {
      setIsSaving(true);
      const editorEmail = profile?.email || "Super Admin";
      const now = new Date().toISOString();

      try {
        const payload = saveAll
          ? {
              chatbot: draftPrompts.chatbot,
              buildAdvisor: draftPrompts.buildAdvisor,
              prebuiltAdvisor: draftPrompts.prebuiltAdvisor,
              partExtractor: draftPrompts.partExtractor,
              updatedBy: editorEmail,
            }
          : {
              [activeKey]: draftPrompts[activeKey],
              updatedBy: editorEmail,
            };

        // 1. Server-side persistence via Admin SDK
        const serverRes = await updateSystemPromptsAction(payload);
        if (!serverRes.success) {
          throw new Error(serverRes.error || "Failed to persist prompts");
        }

        // 2. Client-side Firestore write for immediate local reactivity
        if (firestore) {
          const siteSettingsRef = doc(firestore, "siteSettings", "main");
          await setDoc(
            siteSettingsRef,
            {
              systemPrompts: {
                ...draftPrompts,
                lastUpdated: now,
                updatedBy: editorEmail,
              },
              lastUpdated: now,
              updatedBy: editorEmail,
            },
            { merge: true }
          ).catch(() => {});
        }

        // 3. Audit Log
        if (firestore) {
          await createAuditLog(firestore, {
            actionName: "updated",
            actorId: profile?.id || "super-admin",
            actorName: profile?.name || profile?.email || "Super Admin",
            actorEmail: profile?.email || "Super Admin",
            scope: "System",
            resourceName: "AI System Prompts",
            resourceId: "siteSettings/main",
            details: `Updated AI System Prompt: ${saveAll ? "All Prompts" : getPromptName(activeKey)}`,
          }).catch(() => {});
        }

        toast({
          title: "System Prompts Saved",
          description: saveAll
            ? "All system prompts have been updated across all AI features."
            : `${getPromptName(activeKey)} prompt saved successfully.`,
        });
      } catch (err: any) {
        console.error("Save system prompts error:", err);
        toast({
          title: "Save Failed",
          description: err.message || "Failed to save system prompt",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    },
    [activeKey, draftPrompts, firestore, profile, toast]
  );

  // Confirm reset to defaults
  const handleConfirmReset = useCallback(async () => {
    setIsSaving(true);
    const editorEmail = profile?.email || "Super Admin";

    try {
      const serverRes = await resetSystemPromptsAction(resetTarget, editorEmail);
      if (!serverRes.success) {
        throw new Error(serverRes.error || "Failed to reset prompts");
      }

      if (resetTarget === "all") {
        setDraftPrompts({
          chatbot: DEFAULT_CHATBOT_PROMPT,
          buildAdvisor: DEFAULT_BUILD_ADVISOR_PROMPT,
          prebuiltAdvisor: DEFAULT_PREBUILT_ADVISOR_PROMPT,
          partExtractor: DEFAULT_PART_EXTRACTOR_PROMPT,
        });
      } else {
        setDraftPrompts((prev) => ({
          ...prev,
          [resetTarget]: getBaselineDefault(resetTarget),
        }));
      }

      // Audit Log
      if (firestore) {
        await createAuditLog(firestore, {
          actionName: "updated",
          actorId: profile?.id || "super-admin",
          actorName: profile?.name || profile?.email || "Super Admin",
          actorEmail: profile?.email || "Super Admin",
          scope: "System",
          resourceName: "AI System Prompts",
          resourceId: "siteSettings/main",
          details: `Reset AI System Prompt to default: ${resetTarget === "all" ? "All Prompts" : getPromptName(resetTarget)}`,
        }).catch(() => {});
      }

      toast({
        title: "Prompt Reset to Default",
        description:
          resetTarget === "all"
            ? "All system prompts have been restored to baseline defaults."
            : `${getPromptName(resetTarget)} restored to official default.`,
      });
      setResetDialogOpen(false);
    } catch (err: any) {
      console.error("Reset prompt error:", err);
      toast({
        title: "Reset Failed",
        description: err.message || "Failed to reset system prompt",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [resetTarget, profile, firestore, toast]);

  // Copy to clipboard
  const handleCopy = useCallback(
    (key?: SystemPromptKey) => {
      const target = key || activeKey;
      const text = draftPrompts[target] || "";
      navigator.clipboard.writeText(text);
      toast({
        title: "Copied to Clipboard",
        description: `${getPromptName(target)} prompt copied to clipboard.`,
      });
    },
    [activeKey, draftPrompts, toast]
  );

  return {
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
    lastUpdated: savedPrompts?.lastUpdated,
    updatedBy: savedPrompts?.updatedBy,
  };
}

function getBaselineDefault(key: SystemPromptKey): string {
  switch (key) {
    case 'chatbot':
      return DEFAULT_CHATBOT_PROMPT;
    case 'buildAdvisor':
      return DEFAULT_BUILD_ADVISOR_PROMPT;
    case 'prebuiltAdvisor':
      return DEFAULT_PREBUILT_ADVISOR_PROMPT;
    case 'partExtractor':
      return DEFAULT_PART_EXTRACTOR_PROMPT;
  }
}

function getPromptName(key: SystemPromptKey): string {
  switch (key) {
    case 'chatbot':
      return 'Buildbot Chat Assistant';
    case 'buildAdvisor':
      return 'Build Advisor';
    case 'prebuiltAdvisor':
      return 'Prebuilt Advisor';
    case 'partExtractor':
      return 'Component Specs Extractor';
  }
}
