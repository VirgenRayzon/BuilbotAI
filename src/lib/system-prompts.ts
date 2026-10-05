/**
 * system-prompts.ts — Centralized resolution and caching of active AI System Prompts.
 * Reads configured prompts from Firestore `siteSettings/main` (under `systemPrompts`),
 * falling back to the defaults defined in `default-system-prompts.ts`.
 */

import { getAdminFirestore } from '@/firebase/server-init';
import {
  DEFAULT_CHATBOT_PROMPT,
  DEFAULT_BUILD_ADVISOR_PROMPT,
  DEFAULT_PREBUILT_ADVISOR_PROMPT,
} from './constants/default-system-prompts';

export interface SystemPromptsConfig {
  chatbot?: string;
  buildAdvisor?: string;
  prebuiltAdvisor?: string;
  lastUpdated?: string;
  updatedBy?: string;
}

export type SystemPromptKey = 'chatbot' | 'buildAdvisor' | 'prebuiltAdvisor';

// In-memory cache to prevent excessive Firestore reads across rapid chat messages and advisor calls
let cachedPrompts: SystemPromptsConfig | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 15000; // 15 seconds

export function invalidateSystemPromptsCache() {
  cachedPrompts = null;
  lastCacheTime = 0;
}

export async function getSystemPrompts(): Promise<SystemPromptsConfig> {
  const now = Date.now();
  if (cachedPrompts && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedPrompts;
  }

  let prompts: SystemPromptsConfig = {
    chatbot: DEFAULT_CHATBOT_PROMPT,
    buildAdvisor: DEFAULT_BUILD_ADVISOR_PROMPT,
    prebuiltAdvisor: DEFAULT_PREBUILT_ADVISOR_PROMPT,
  };

  try {
    const firestore = getAdminFirestore();
    const settingsSnap = await firestore.collection('siteSettings').doc('main').get();

    if (settingsSnap.exists) {
      const data = settingsSnap.data();
      const stored = data?.systemPrompts;
      if (stored && typeof stored === 'object') {
        prompts = {
          chatbot: stored.chatbot?.trim() || DEFAULT_CHATBOT_PROMPT,
          buildAdvisor: stored.buildAdvisor?.trim() || DEFAULT_BUILD_ADVISOR_PROMPT,
          prebuiltAdvisor: stored.prebuiltAdvisor?.trim() || DEFAULT_PREBUILT_ADVISOR_PROMPT,
          lastUpdated: stored.lastUpdated,
          updatedBy: stored.updatedBy,
        };
      }
    }
  } catch (error) {
    console.warn('[System Prompts] Unable to fetch system prompts from Firestore, using defaults:', error);
  }

  cachedPrompts = prompts;
  lastCacheTime = now;
  return prompts;
}

export async function getActiveSystemPrompt(key: SystemPromptKey): Promise<string> {
  const config = await getSystemPrompts();
  const prompt = config[key];
  if (prompt && prompt.trim().length > 0) {
    return prompt.trim();
  }

  switch (key) {
    case 'chatbot':
      return DEFAULT_CHATBOT_PROMPT;
    case 'buildAdvisor':
      return DEFAULT_BUILD_ADVISOR_PROMPT;
    case 'prebuiltAdvisor':
      return DEFAULT_PREBUILT_ADVISOR_PROMPT;
    default:
      return '';
  }
}
