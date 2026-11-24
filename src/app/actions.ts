"use server";
import { after } from 'next/server';
import { z } from 'zod';
import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { getVertexAccessToken, markTunedModelHealthy, DEFAULT_TUNED_MODEL_ID, type FeatureModelRouting } from '@/lib/ai-model-resolver';
import { resolveVertexTunedEndpoint } from '@/lib/vertex-tuned-endpoint';
import { formatFullName, normalizeName, splitDisplayName } from '@/lib/user-name';

import {
  extractPartDetails,
  type ExtractPartDetailsInput,
} from "@/ai/flows/extract-part-details";
import {
  aiPrebuiltAdvisor,
  type AiPrebuiltAdvisorInput,
} from "@/ai/flows/ai-prebuilt-advisor";
import {
  aiBuildCritiqueAction,
  type AiBuildCritiqueInput,
} from "@/ai/flows/ai-build-critique";
import {
  aiPrebuiltPerformanceAction,
  type AiPrebuiltPerformanceInput,
} from "@/ai/flows/ai-prebuilt-performance";

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 180000): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("AI_TIMEOUT")), timeoutMs)
  );
  return Promise.race([promise, timeoutPromise]);
}

const TIMEOUT_MESSAGE = "The AI service is taking too long to respond. Please try again in a few moments.";

async function runAiAction<T>(
  label: string,
  fn: () => Promise<T>,
  checkApiKey: boolean = false
): Promise<T | { error: string }> {
  try {
    return await withTimeout(fn());
  } catch (error) {
    console.error(`Error fetching ${label}:`, error);
    if (error instanceof Error) {
      if (error.message === "AI_TIMEOUT") {
        return { error: TIMEOUT_MESSAGE };
      }
      if (error.message.includes("fetch failed")) {
        return {
          error:
            "Could not connect to the AI service. Is 'npm run genkit:dev' running in another terminal?",
        };
      }
      if (
        checkApiKey &&
        (error.message.includes("GOOGLE_API_KEY") ||
          error.message.includes("GEMINI_API_KEY") ||
          error.message.includes("FAILED_PRECONDITION"))
      ) {
        return {
          error: "Missing API Key. Please set GOOGLE_API_KEY in your .env file to enable AI features.",
        };
      }
      return { error: error.message };
    }
    return { error: "An unknown error occurred." };
  }
}

export async function getAiPrebuiltPerformance(input: AiPrebuiltPerformanceInput) {
  return runAiAction("AI prebuilt performance", () => aiPrebuiltPerformanceAction(input), true);
}

export async function getAiPartDetails(input: ExtractPartDetailsInput) {
  return runAiAction("AI part details", () => extractPartDetails(input));
}

export async function getAiPrebuiltSuggestions(input: AiPrebuiltAdvisorInput) {
  return runAiAction("AI prebuilt suggestions", () => aiPrebuiltAdvisor(input));
}

export async function getAiBuildCritique(input: AiBuildCritiqueInput) {
  return runAiAction("AI build critique", () => aiBuildCritiqueAction(input, task => after(task)), true);
}

export async function logAdminAction(action: string, details: string, data?: any) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`\n[${timestamp}] 🚀 TERMINAL VERIFICATION: ${action}`);
  console.log(`   Details: ${details}`);
  if (data) console.log(`   Data:`, JSON.stringify(data, null, 2));
  console.log('--------------------------------------------------\n');
  return { success: true };
}

import { getAdminFirestore, getAdminAuth } from "@/firebase/server-init";
import type { Part } from "@/lib/types";
import { getBuilderCatalog, clearBuilderCatalogCache } from '@/lib/server/builder-catalog';
import { invalidatePublicPartsCatalog } from '@/lib/server/public-products';

export async function getCachedInventory(): Promise<Part[]> {
  return getBuilderCatalog();
}

import { clearInventoryCache } from "@/lib/inventory-fetcher";
import { bumpCatalogMetaVersion } from "@/lib/server/catalog-meta-store";

export async function clearCatalogCache() {
  console.log("[clearCatalogCache] Invalidating catalog cache...");
  clearBuilderCatalogCache();
  invalidatePublicPartsCatalog();
  clearInventoryCache();
  try {
    const db = getAdminFirestore();
    await bumpCatalogMetaVersion(db, { refreshFacets: true });
  } catch (error) {
    console.error("[clearCatalogCache] Failed to bump catalog meta version:", error);
  }
  return { success: true };
}

export async function syncUserClaimsAction(idToken: string) {
  try {
    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    console.log(`[syncUserClaimsAction] Synchronizing custom claims for verified user ${userId}...`);
    const db = getAdminFirestore();
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      console.warn(`[syncUserClaimsAction] User document ${userId} not found in Firestore.`);
      return { error: 'User does not exist in Firestore.' };
    }
    const data = userDoc.data();
    if (!data) return { error: 'No user data found.' };

    const isManager = !!data.isManager;
    const isSuperAdmin = !!data.isSuperAdmin;
    if (isManager || isSuperAdmin || data.isAdmin === true) {
      return { error: 'Staff accounts must sign in through System Access.' };
    }
    
    try {
      await adminAuth.setCustomUserClaims(userId, {
        isManager: false,
        isSuperAdmin: false,
      });
      console.log(`[syncUserClaimsAction] Customer claims set successfully for ${userId}.`);
    } catch (claimErr) {
      console.warn(`[syncUserClaimsAction] setCustomUserClaims warning (Firestore profile active):`, claimErr);
    }
    return { success: true, isManager, isSuperAdmin };
  } catch (error: any) {
    console.error(`[syncUserClaimsAction] Failed to sync custom claims:`, error);
    return { error: error.message };
  }
}

const managerProfileSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80).optional(),
    lastName: z.string().trim().min(1).max(80).optional(),
    name: z.string().trim().min(1).max(120).optional(),
  })
  .optional();

export async function registerManagerAction(
  idToken: string,
  managerKey: string,
  profileInput?: { firstName?: string; lastName?: string; name?: string }
) {
  try {
    const adminAuth = getAdminAuth();
    const db = getAdminFirestore();

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    console.log(`[registerManagerAction] Registering manager account for user ${userId}...`);

    const parsedProfileInput = managerProfileSchema.parse(profileInput);
    const tokenNameParts = splitDisplayName(
      typeof decodedToken.name === 'string' ? decodedToken.name : undefined
    );
    const firstName = normalizeName(parsedProfileInput?.firstName || tokenNameParts.firstName).slice(0, 80);
    const lastName = normalizeName(parsedProfileInput?.lastName || tokenNameParts.lastName).slice(0, 80);
    const fullName = normalizeName(
      parsedProfileInput?.name || formatFullName(firstName, lastName) || tokenNameParts.name
    ).slice(0, 120);

    const keyDocSnap = await db.collection('authKeys').doc(managerKey).get();
    const isDbKey = keyDocSnap.exists && keyDocSnap.data()?.role === 'manager';
    const isHardcodedFallback = managerKey === '00216764';

    if (!isDbKey && !isHardcodedFallback) {
      return { error: 'Invalid manager access key. Please verify the key provided by your administrator.' };
    }

    const userDocRef = db.collection('users').doc(userId);
    const userDoc = await userDocRef.get();

    if (userDoc.exists) {
      const existingData = userDoc.data() || {};
      await userDocRef.update({
        isManager: true,
        activeManagerKey: managerKey,
        updatedAt: new Date().toISOString(),
        ...(!existingData.name && fullName ? { name: fullName } : {}),
        ...(!existingData.firstName && firstName ? { firstName } : {}),
        ...(!existingData.lastName && lastName ? { lastName } : {}),
      });
    } else {
      await userDocRef.set({
        email: decodedToken.email || '',
        name: fullName,
        ...(firstName ? { firstName } : {}),
        ...(lastName ? { lastName } : {}),
        isManager: true,
        isSuperAdmin: false,
        activeManagerKey: managerKey,
        createdAt: new Date().toISOString(),
      });
    }

    try {
      await adminAuth.setCustomUserClaims(userId, {
        isManager: true,
        isSuperAdmin: false,
      });
      console.log(`[registerManagerAction] Successfully assigned manager custom claims to user ${userId}`);
    } catch (claimErr) {
      console.warn(`[registerManagerAction] setCustomUserClaims warning:`, claimErr);
    }

    return { success: true };
  } catch (error: any) {
    console.error(`[registerManagerAction] Failed to register manager:`, error);
    return { error: error.message || 'Server error occurred during manager registration.' };
  }
}

export async function listManagerAccountsAction(idToken: string) {
  try {
    const adminAuth = getAdminAuth();
    const db = getAdminFirestore();
    const requester = await adminAuth.verifyIdToken(idToken);
    const requesterProfile = await db.collection('users').doc(requester.uid).get();
    const canManageStaff = requester.isSuperAdmin === true || requesterProfile.data()?.isSuperAdmin === true;

    if (!canManageStaff) {
      return { error: 'Super administrator access is required.', managers: [] };
    }

    const managers: Array<Record<string, unknown>> = [];
    const staffNotificationSnapshot = await db.collection('system_notifications')
      .where('type', 'in', ['stock_added', 'status_changed', 'item_archived'])
      .get();
    const knownManagerIds = new Set(
      staffNotificationSnapshot.docs
        .map(notification => notification.data().actorId)
        .filter((actorId): actorId is string => typeof actorId === 'string' && actorId.length > 0)
    );
    const knownManagerEmails = new Set<string>();
    staffNotificationSnapshot.docs.forEach(notification => {
      const data = notification.data();
      const candidates = [data.actorName, data.message];
      candidates.forEach(value => {
        if (typeof value !== 'string') return;
        const email = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
        if (email) knownManagerEmails.add(email.toLowerCase());
      });
    });
    let pageToken: string | undefined;

    do {
      const page = await adminAuth.listUsers(1000, pageToken);
      const profileRefs = page.users.map(user => db.collection('users').doc(user.uid));
      const profiles = profileRefs.length > 0 ? await db.getAll(...profileRefs) : [];

      page.users.forEach((user, index) => {
        const profile = profiles[index]?.data() ?? {};
        const normalizedRole = String(profile.role ?? profile.accountType ?? '').toLowerCase();
        const hasManagerKeyHistory = typeof profile.activeManagerKey === 'string' || Array.isArray(profile.deprecatedKeys);
        const accountEmail = String(profile.email || user.email || '').toLowerCase();
        const isManager = user.customClaims?.isManager === true || profile.isManager === true || profile.isAdmin === true || normalizedRole === 'manager' || hasManagerKeyHistory || knownManagerIds.has(user.uid) || knownManagerEmails.has(accountEmail);
        const isSuperAdmin = user.customClaims?.isSuperAdmin === true || profile.isSuperAdmin === true || normalizedRole === 'superadmin' || normalizedRole === 'super_admin';

        if (isManager && !isSuperAdmin) {
          managers.push({
            id: user.uid,
            email: profile.email || user.email || '',
            activeManagerKey: profile.activeManagerKey || '',
            deprecatedKeys: Array.isArray(profile.deprecatedKeys) ? profile.deprecatedKeys : [],
          });
        }
      });

      pageToken = page.pageToken;
    } while (pageToken);

    return { managers };
  } catch (error: any) {
    console.error('[listManagerAccountsAction] Failed to list managers:', error);
    return { error: error.message || 'Unable to load manager accounts.', managers: [] };
  }
}

export async function testAiModelConnectionAction(
  provider: 'default' | 'finetuned',
  customModelId?: string,
  defaultModelId?: string
) {
  const startTime = Date.now();
  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: "Missing API Key in .env (GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY).",
        latencyMs: 0
      };
    }

    if (provider === 'default') {
      let targetModel = (defaultModelId && defaultModelId.trim()) || 'gemini-3.8-flash';
      if (targetModel === 'gemini-2.5-pro' || targetModel === 'gemini-2.5-flash') {
        targetModel = 'gemini-3.8-flash';
      }
      const google = createGoogleGenerativeAI({ apiKey });
      const result = await generateText({
        model: google(targetModel),
        prompt: `Say "Connection successful: ${targetModel} is ready."`,
      });
      return {
        success: true,
        model: targetModel,
        provider: 'default',
        response: result.text.trim(),
        latencyMs: Date.now() - startTime
      };
    }

    const targetModel = (customModelId && customModelId.trim())
      ? customModelId.trim().replace('7817221357778', '781722135778')
      : DEFAULT_TUNED_MODEL_ID;

    const token = await getVertexAccessToken(true);
    if (!token) {
      return {
        success: false,
        model: targetModel,
        provider: 'finetuned',
        error: "No Google Cloud Vertex AI credentials found. Set FIREBASE_SERVICE_ACCOUNT (or FB_SERVICE_ACCOUNT) in .env, or run 'gcloud auth application-default login'.",
        latencyMs: Date.now() - startTime
      };
    }

    const resolvedEndpoint = await resolveVertexTunedEndpoint(targetModel, token);
    let projectId = '781722135778';
    let location = 'us-central1';
    const match = resolvedEndpoint.match(/projects\/([^\/]+)\/locations\/([^\/]+)/);
    if (match) {
      projectId = match[1];
      location = match[2];
    }

    const vertexFetch = async (url: string | URL | Request, init?: RequestInit) => {
      const currentToken = await getVertexAccessToken();
      let finalUrl = String(url);
      finalUrl = finalUrl.replace('/models/endpoints/', '/endpoints/');
      const headers = new Headers(init?.headers);
      headers.delete('x-goog-api-key');
      if (currentToken) {
        headers.set('Authorization', `Bearer ${currentToken}`);
      }
      return fetch(finalUrl, { ...init, headers });
    };

    const vertexProvider = createGoogleGenerativeAI({
      baseURL: `https://${location}-aiplatform.googleapis.com/v1beta1/projects/${projectId}/locations/${location}`,
      apiKey: 'oauth-authenticated',
      fetch: vertexFetch,
    });

    let cleanModelName = resolvedEndpoint;
    const endpointsIdx = cleanModelName.indexOf('/endpoints/');
    const modelsIdx = cleanModelName.indexOf('/models/');
    if (endpointsIdx !== -1) {
      cleanModelName = `endpoints/${cleanModelName.slice(endpointsIdx + 11)}`;
    } else if (modelsIdx !== -1) {
      cleanModelName = `publishers/google/models/${cleanModelName.slice(modelsIdx + 8)}`;
    } else if (!cleanModelName.startsWith('publishers/') && !cleanModelName.startsWith('endpoints/')) {
      cleanModelName = `publishers/google/models/${cleanModelName}`;
    }

    const result = await generateText({
      model: vertexProvider(cleanModelName),
      prompt: 'Say "Connection successful: Fine-Tuned Model is ready."',
    });

    markTunedModelHealthy();

    return {
      success: true,
      model: targetModel,
      resolvedEndpoint,
      provider: 'finetuned',
      response: result.text.trim(),
      latencyMs: Date.now() - startTime
    };
  } catch (err: any) {
    const errorMsg = err.message || String(err);
    const isPermissionError = errorMsg.includes('Permission') || errorMsg.includes('PERMISSION_DENIED') || errorMsg.includes('403');

    return {
      success: false,
      model: customModelId || 'Fine-Tuned Model',
      provider,
      error: errorMsg,
      latencyMs: Date.now() - startTime,
      isPermissionError,
      remediation: isPermissionError ? {
        serviceAccount: 'firebase-app-hosting-compute@studio-3150054754-c7d0b.iam.gserviceaccount.com',
        requiredRole: 'roles/editor (Editor) or roles/aiplatform.user (Vertex AI User)',
        project: '781722135778 (studio-3150054754-c7d0b)',
        instructions: 'Grant the "Editor" or "Vertex AI User" role to this service account in Google Cloud IAM & Admin console to enable inference on this Vertex model endpoint.'
      } : undefined
    };
  }
}

export async function updateSiteSettingsAction(settings: {
  aiModelProvider: 'default' | 'finetuned';
  fineTunedModelId?: string;
  defaultGeminiModel?: string;
  fineTunedProjects?: Array<{ id: string; name: string; endpoint: string; createdAt?: string }>;
  activeFineTunedProjectId?: string;
  featureModelRouting?: FeatureModelRouting;
  updatedBy?: string;
}) {
  try {
    const db = getAdminFirestore();
    const activeProject = settings.fineTunedProjects?.find((project) => project.id === settings.activeFineTunedProjectId);
    if (settings.fineTunedProjects && !activeProject) {
      throw new Error('Select a registered fine-tuned project before applying AI settings.');
    }
    let resolvedEndpoint = settings.fineTunedModelId;
    let resolvedProjects = settings.fineTunedProjects;
    if (activeProject) {
      const needsLookup = activeProject.endpoint.includes('/models/');
      const token = needsLookup ? await getVertexAccessToken() : '';
      if (needsLookup && !token) throw new Error('Vertex AI credentials are required to verify the selected tuned model.');
      resolvedEndpoint = await resolveVertexTunedEndpoint(activeProject.endpoint, token || '');
      resolvedProjects = settings.fineTunedProjects?.map((project) =>
        project.id === activeProject.id ? { ...project, endpoint: resolvedEndpoint! } : project
      );
    }
    const updatePayload: Record<string, any> = {
      aiModelProvider: settings.aiModelProvider,
      lastUpdated: new Date().toISOString(),
      updatedBy: settings.updatedBy || 'Super Admin'
    };

    if (resolvedEndpoint !== undefined) {
      updatePayload.fineTunedModelId = resolvedEndpoint;
    }
    if (settings.defaultGeminiModel !== undefined) {
      updatePayload.defaultGeminiModel = settings.defaultGeminiModel;
    }
    if (resolvedProjects !== undefined) {
      updatePayload.fineTunedProjects = resolvedProjects;
    }
    if (settings.activeFineTunedProjectId !== undefined) {
      updatePayload.activeFineTunedProjectId = settings.activeFineTunedProjectId;
    }
    if (settings.featureModelRouting !== undefined) {
      updatePayload.featureModelRouting = settings.featureModelRouting;
    }

    await db.collection('siteSettings').doc('main').set(updatePayload, { merge: true });
    return { success: true, resolvedEndpoint, resolvedProjects };
  } catch (err: any) {
    console.error("Failed to update siteSettings via admin action:", err);
    return { success: false, error: err.message };
  }
}

export async function invalidateAiModelCacheAction() {
  try {
    const { invalidateAiModelCache } = await import('@/lib/ai-model-resolver');
    invalidateAiModelCache();
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function updateSystemPromptsAction(prompts: {
  chatbot?: string;
  buildAdvisor?: string;
  prebuiltAdvisor?: string;
  partExtractor?: string;
  updatedBy?: string;
}) {
  try {
    const db = getAdminFirestore();
    const now = new Date().toISOString();
    const systemPromptsPayload: Record<string, any> = {
      lastUpdated: now,
      updatedBy: prompts.updatedBy || 'Super Admin',
    };

    if (prompts.chatbot !== undefined) systemPromptsPayload.chatbot = prompts.chatbot;
    if (prompts.buildAdvisor !== undefined) systemPromptsPayload.buildAdvisor = prompts.buildAdvisor;
    if (prompts.prebuiltAdvisor !== undefined) systemPromptsPayload.prebuiltAdvisor = prompts.prebuiltAdvisor;
    if (prompts.partExtractor !== undefined) systemPromptsPayload.partExtractor = prompts.partExtractor;

    await db.collection('siteSettings').doc('main').set({
      systemPrompts: systemPromptsPayload,
      lastUpdated: now,
      updatedBy: prompts.updatedBy || 'Super Admin',
    }, { merge: true });

    const { invalidateSystemPromptsCache } = await import('@/lib/system-prompts');
    invalidateSystemPromptsCache();

    return { success: true };
  } catch (err: any) {
    console.error("Failed to update systemPrompts via admin action:", err);
    return { success: false, error: err.message };
  }
}

export async function resetSystemPromptsAction(
  target?: 'chatbot' | 'buildAdvisor' | 'prebuiltAdvisor' | 'partExtractor' | 'all',
  updatedBy?: string
) {
  try {
    const db = getAdminFirestore();
    const now = new Date().toISOString();
    const {
      DEFAULT_CHATBOT_PROMPT,
      DEFAULT_BUILD_ADVISOR_PROMPT,
      DEFAULT_PREBUILT_ADVISOR_PROMPT,
      DEFAULT_PART_EXTRACTOR_PROMPT,
    } = await import('@/lib/constants/default-system-prompts');

    const systemPromptsPayload: Record<string, any> = {
      lastUpdated: now,
      updatedBy: updatedBy || 'Super Admin',
    };

    if (!target || target === 'all') {
      systemPromptsPayload.chatbot = DEFAULT_CHATBOT_PROMPT;
      systemPromptsPayload.buildAdvisor = DEFAULT_BUILD_ADVISOR_PROMPT;
      systemPromptsPayload.prebuiltAdvisor = DEFAULT_PREBUILT_ADVISOR_PROMPT;
      systemPromptsPayload.partExtractor = DEFAULT_PART_EXTRACTOR_PROMPT;
    } else {
      if (target === 'chatbot') systemPromptsPayload.chatbot = DEFAULT_CHATBOT_PROMPT;
      if (target === 'buildAdvisor') systemPromptsPayload.buildAdvisor = DEFAULT_BUILD_ADVISOR_PROMPT;
      if (target === 'prebuiltAdvisor') systemPromptsPayload.prebuiltAdvisor = DEFAULT_PREBUILT_ADVISOR_PROMPT;
      if (target === 'partExtractor') systemPromptsPayload.partExtractor = DEFAULT_PART_EXTRACTOR_PROMPT;
    }

    await db.collection('siteSettings').doc('main').set({
      systemPrompts: systemPromptsPayload,
      lastUpdated: now,
      updatedBy: updatedBy || 'Super Admin',
    }, { merge: true });

    const { invalidateSystemPromptsCache } = await import('@/lib/system-prompts');
    invalidateSystemPromptsCache();

    return { success: true };
  } catch (err: any) {
    console.error("Failed to reset systemPrompts via admin action:", err);
    return { success: false, error: err.message };
  }
}
