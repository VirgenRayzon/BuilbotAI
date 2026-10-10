"use server";
import { after } from 'next/server';
import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { getVertexAccessToken, markTunedModelHealthy, DEFAULT_TUNED_MODEL_ID, type FeatureModelRouting } from '@/lib/ai-model-resolver';


import {
  aiBuildAdvisorRecommendations,
} from "@/ai/flows/ai-build-advisor-recommendations";
import type {
  AiBuildAdvisorRecommendationsInput,
} from "@/ai/schemas/build-advisor-schemas";
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
import {
  aiSmartBudgetAction,
  type AiSmartBudgetInput,
} from "@/ai/flows/ai-smart-budget";


async function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 180000): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("AI_TIMEOUT")), timeoutMs)
  );
  return Promise.race([promise, timeoutPromise]);
}

const TIMEOUT_MESSAGE = "The AI service is taking too long to respond. Please try again in a few moments.";

export async function getAiPrebuiltPerformance(input: AiPrebuiltPerformanceInput) {
  try {
    const result = await withTimeout(aiPrebuiltPerformanceAction(input));
    return result;
  } catch (error) {
    console.error("Error fetching AI prebuilt performance:", error);
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
      if (error.message.includes("GOOGLE_API_KEY") || error.message.includes("GEMINI_API_KEY") || error.message.includes("FAILED_PRECONDITION")) {
        return {
          error: "Missing API Key. Please set GOOGLE_API_KEY in your .env file to enable AI features.",
        };
      }
      return { error: error.message };
    }
    return { error: "An unknown error occurred." };
  }
}

export async function getAiRecommendations(
  input: AiBuildAdvisorRecommendationsInput
) {
  try {
    const result = await withTimeout(aiBuildAdvisorRecommendations(input));
    return result;
  } catch (error) {
    console.error("Error fetching AI recommendations:", error);
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
      if (error.message.includes("GOOGLE_API_KEY") || error.message.includes("GEMINI_API_KEY") || error.message.includes("FAILED_PRECONDITION")) {
        return {
          error: "Missing API Key. Please set GOOGLE_API_KEY in your .env file to enable AI features.",
        };
      }
      return { error: error.message };
    }
    return { error: "An unknown error occurred." };
  }
}

export async function getAiPartDetails(input: ExtractPartDetailsInput) {
  try {
    const result = await withTimeout(extractPartDetails(input));
    return result;
  } catch (error) {
    console.error("Error fetching AI part details:", error);
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
      return { error: error.message };
    }
    return { error: "An unknown error occurred." };
  }
}

export async function getAiPrebuiltSuggestions(input: AiPrebuiltAdvisorInput) {
  try {
    const result = await withTimeout(aiPrebuiltAdvisor(input));
    return result;
  } catch (error) {
    console.error("Error fetching AI prebuilt suggestions:", error);
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
      return { error: error.message };
    }
    return { error: "An unknown error occurred." };
  }
}

export async function getAiBuildCritique(input: AiBuildCritiqueInput) {
  try {
    const result = await withTimeout(aiBuildCritiqueAction(input, task => after(task)));
    return result;
  } catch (error) {
    console.error("Error fetching AI build critique:", error);
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
      if (error.message.includes("GOOGLE_API_KEY") || error.message.includes("GEMINI_API_KEY") || error.message.includes("FAILED_PRECONDITION")) {
        return {
          error: "Missing API Key. Please set GOOGLE_API_KEY in your .env file to enable AI features.",
        };
      }
      return { error: error.message };
    }
    return { error: "An unknown error occurred." };
  }
}

export async function getAiSmartBudget(input: AiSmartBudgetInput) {
  try {
    const result = await withTimeout(aiSmartBudgetAction(input));
    return result;
  } catch (error) {
    console.error("Error fetching AI smart budget:", error);
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
      if (error.message.includes("GOOGLE_API_KEY") || error.message.includes("GEMINI_API_KEY") || error.message.includes("FAILED_PRECONDITION")) {
        return {
          error: "Missing API Key. Please set GOOGLE_API_KEY in your .env file to enable AI features.",
        };
      }
      return { error: error.message };
    }
    return { error: "An unknown error occurred." };
  }
}

export async function logAdminAction(action: string, details: string, data?: any) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`\n[${timestamp}] 🚀 TERMINAL VERIFICATION: ${action}`);
  console.log(`   Details: ${details}`);
  if (data) console.log(`   Data:`, JSON.stringify(data, null, 2));
  console.log('--------------------------------------------------\n');
  return { success: true };
}

// In-memory catalog cache variables
import { getAdminFirestore, getAdminAuth } from "@/firebase/server-init";
import type { Part } from "@/lib/types";
import { INVENTORY_CATEGORY_SLUGS, inventoryItemsPath } from "@/lib/inventory-paths";

let catalogCache: Part[] | null = null;
let catalogCacheTime = 0;
const CATALOG_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function serializeDate(val: any) {
  if (!val) return undefined;
  if (typeof val.toDate === 'function') {
    return val.toDate().toISOString();
  }
  if (val instanceof Date) {
    return val.toISOString();
  }
  if (typeof val === 'string' || typeof val === 'number') {
    return new Date(val).toISOString();
  }
  return undefined;
}

export async function getCachedInventory(): Promise<Part[]> {
  const now = Date.now();
  if (catalogCache && (now - catalogCacheTime < CATALOG_CACHE_TTL)) {
    console.log("[getCachedInventory] Catalog cache hit");
    return catalogCache;
  }
  
  console.log("[getCachedInventory] Cache miss, fetching catalog from Firestore...");
  const db = getAdminFirestore();
  
  const snapshots = await Promise.all(INVENTORY_CATEGORY_SLUGS.map(slug =>
    db.collection(inventoryItemsPath(slug)).where('isArchived', '==', false).get()
  ));
  const fetchedParts: Part[] = [];

  snapshots.flatMap(snapshot => snapshot.docs).forEach(doc => {
    const data = doc.data();
    const category = data.category as Part['category'];
    fetchedParts.push({
      id: doc.id,
      name: data.name || '',
      category,
      brand: data.brand || '',
      price: Number(data.price) || 0,
      usdSrp: data.usdSrp ? Number(data.usdSrp) : undefined,
      stock: Number(data.stock) || 0,
      imageUrl: data.imageUrl || '',
      specifications: data.specifications || {},
      wattage: data.wattage !== undefined ? Number(data.wattage) : undefined,
      performanceTier: data.performanceTier !== undefined ? Number(data.performanceTier) : undefined,
      performanceScore: data.performanceScore !== undefined ? Number(data.performanceScore) : undefined,
      socket: data.socket || undefined,
      ramType: data.ramType || undefined,
      dimensions: data.dimensions || undefined,
      description: data.description || undefined,
      packageType: data.packageType || undefined,
      createdAt: serializeDate(data.createdAt),
      isArchived: data.isArchived || false
    });
  });
  
  catalogCache = fetchedParts;
  catalogCacheTime = now;
  return fetchedParts;
}

import { clearInventoryCache } from "@/lib/inventory-fetcher";

export async function clearCatalogCache() {
  console.log("[clearCatalogCache] Invalidating catalog cache...");
  catalogCache = null;
  catalogCacheTime = 0;
  clearInventoryCache();
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
    
    try {
      await adminAuth.setCustomUserClaims(userId, {
        isManager,
        isSuperAdmin,
      });
      console.log(`[syncUserClaimsAction] Custom claims set successfully for ${userId}: isManager=${isManager}, isSuperAdmin=${isSuperAdmin}`);
    } catch (claimErr) {
      console.warn(`[syncUserClaimsAction] setCustomUserClaims warning (Firestore profile active):`, claimErr);
    }
    return { success: true, isManager, isSuperAdmin };
  } catch (error: any) {
    console.error(`[syncUserClaimsAction] Failed to sync custom claims:`, error);
    return { error: error.message };
  }
}

export async function authenticateSystemAccessAction(
  idToken: string,
  roleKey: string,
  requestedRole: 'manager' | 'superadmin'
) {
  try {
    const adminAuth = getAdminAuth();
    const db = getAdminFirestore();

    // 1. Verify idToken to get the user ID securely
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    console.log(`[authenticateSystemAccessAction] Authenticating system access for user ${userId} for role ${requestedRole}...`);

    // 2. Fetch User Profile from Firestore
    const userDocRef = db.collection('users').doc(userId);
    const userDoc = await userDocRef.get();

    let effectiveProfile: any = null;

    if (userDoc.exists) {
      const userData = userDoc.data();
      if (!userData) return { error: 'No user data found.' };
      effectiveProfile = userData;

      // 3. Perform Role & Key Validation
      if (requestedRole === 'manager') {
        const hasManagerAccess = userData.isManager || userData.isAdmin;
        if (!hasManagerAccess) {
          return { error: 'This account does not have manager privileges.' };
        }

        // Validate Key
        let isKeyValid = false;
        if (userData.activeManagerKey && userData.activeManagerKey === roleKey) {
          isKeyValid = true;
        } else {
          // Check database authKeys or default key fallback
          const keyDocSnap = await db.collection('authKeys').doc(roleKey).get();
          const isLegacyKey = (keyDocSnap.exists && keyDocSnap.data()?.role === 'manager') || roleKey === '00216764';
          isKeyValid = isLegacyKey;
        }

        if (!isKeyValid) {
          return { error: 'Incorrect manager key. Please verify your manager key and try again.' };
        }

        // Apply promotions & key adoption if needed
        const updates: any = { isManager: true };
        if (userData.isAdmin && !userData.isManager) {
          updates.isManager = true;
        }
        if (!userData.activeManagerKey || userData.activeManagerKey !== roleKey) {
          updates.activeManagerKey = roleKey;
        }
        await userDocRef.update(updates);
        effectiveProfile.isManager = true;

      } else if (requestedRole === 'superadmin') {
        if (!userData.isSuperAdmin) {
          return { error: 'This account does not have super admin privileges.' };
        }

        // Validate Key
        const keyDocSnap = await db.collection('authKeys').doc(roleKey).get();
        const isDbKey = keyDocSnap.exists && keyDocSnap.data()?.role === 'superadmin';
        const isHardcodedKey = roleKey === 'SUPER_ADMIN_123'; // Allowed server-side only fallback

        if (!isDbKey && !isHardcodedKey) {
          return { error: 'Incorrect super admin key. Please verify your master key and try again.' };
        }

        // Super admins also get manager privileges
        await userDocRef.update({ isSuperAdmin: true, isManager: true });
        effectiveProfile.isSuperAdmin = true;
        effectiveProfile.isManager = true;
      }
    } else {
      // Profile does not exist yet (but auth user exists). Create profile securely on server.
      // Note: Only create user profiles if the key is valid.
      
      // Determine if key is valid before creating profile
      let isKeyValid = false;
      if (requestedRole === 'manager') {
        const keyDocSnap = await db.collection('authKeys').doc(roleKey).get();
        isKeyValid = (keyDocSnap.exists && keyDocSnap.data()?.role === 'manager') || roleKey === '00216764';
      } else if (requestedRole === 'superadmin') {
        const keyDocSnap = await db.collection('authKeys').doc(roleKey).get();
        isKeyValid = (keyDocSnap.exists && keyDocSnap.data()?.role === 'superadmin') || roleKey === 'SUPER_ADMIN_123';
      }

      if (!isKeyValid) {
        return { error: `Incorrect key for ${requestedRole} access.` };
      }

      const newProfile = {
        email: decodedToken.email || '',
        isManager: true,
        isSuperAdmin: requestedRole === 'superadmin',
        createdAt: new Date().toISOString(),
        activeManagerKey: requestedRole === 'manager' ? roleKey : undefined
      };
      await userDocRef.set(newProfile);
      effectiveProfile = newProfile;
    }

    // 4. Set custom claims on Firebase Auth (gracefully catch local environment ADC limitations)
    try {
      await adminAuth.setCustomUserClaims(userId, {
        isManager: true,
        isSuperAdmin: !!effectiveProfile.isSuperAdmin,
      });
      console.log(`[authenticateSystemAccessAction] Successfully promoted user ${userId}: isManager=true, isSuperAdmin=${!!effectiveProfile.isSuperAdmin}`);
    } catch (claimErr) {
      console.warn(`[authenticateSystemAccessAction] setCustomUserClaims warning (Firestore profile updated successfully):`, claimErr);
    }
    return { success: true };
  } catch (error: any) {
    console.error(`[authenticateSystemAccessAction] Failed to authenticate system access:`, error);
    return { error: error.message || 'Server error occurred during authentication.' };
  }
}

export async function registerManagerAction(
  idToken: string,
  managerKey: string
) {
  try {
    const adminAuth = getAdminAuth();
    const db = getAdminFirestore();

    // 1. Verify idToken
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    console.log(`[registerManagerAction] Registering manager account for user ${userId}...`);

    // 2. Validate Default Manager Access Key
    const keyDocSnap = await db.collection('authKeys').doc(managerKey).get();
    const isDbKey = keyDocSnap.exists && keyDocSnap.data()?.role === 'manager';
    const isHardcodedFallback = managerKey === '00216764';

    if (!isDbKey && !isHardcodedFallback) {
      return { error: 'Invalid manager access key. Please verify the key provided by your administrator.' };
    }

    // 3. Create or update user profile as Manager in Firestore
    const userDocRef = db.collection('users').doc(userId);
    const userDoc = await userDocRef.get();

    if (userDoc.exists) {
      await userDocRef.update({
        isManager: true,
        activeManagerKey: managerKey,
        updatedAt: new Date().toISOString(),
      });
    } else {
      await userDocRef.set({
        email: decodedToken.email || '',
        name: decodedToken.name || '',
        isManager: true,
        isSuperAdmin: false,
        activeManagerKey: managerKey,
        createdAt: new Date().toISOString(),
      });
    }

    // 4. Set custom claims on Firebase Auth
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



export async function migrateAllUsersClaimsAction() {
  try {
    console.log("[migrateAllUsersClaimsAction] Starting bulk custom claims migration for all users...");
    const db = getAdminFirestore();
    const adminAuth = getAdminAuth();
    const usersSnapshot = await db.collection('users').get();
    
    let count = 0;
    for (const doc of usersSnapshot.docs) {
      const data = doc.data();
      const userId = doc.id;
      const isManager = !!data.isManager;
      const isSuperAdmin = !!data.isSuperAdmin;
      
      await adminAuth.setCustomUserClaims(userId, {
        isManager,
        isSuperAdmin,
      });
      count++;
      console.log(`[migrateAllUsersClaimsAction] Migrated user ${userId} (${data.email}): isManager=${isManager}, isSuperAdmin=${isSuperAdmin}`);
    }
    
    console.log(`[migrateAllUsersClaimsAction] Completed. Successfully migrated custom claims for ${count} users.`);
    return { success: true, count };
  } catch (error: any) {
    console.error("[migrateAllUsersClaimsAction] Migration failed:", error);
    return { error: error.message };
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
      const targetModel = (defaultModelId && defaultModelId.trim()) || 'gemini-2.5-flash';
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

    // Provider is 'finetuned'
    const targetModel = (customModelId && customModelId.trim())
      ? customModelId.trim().replace('7817221357778', '781722135778')
      : DEFAULT_TUNED_MODEL_ID;

    // Always refresh token on test click to catch newly granted IAM roles immediately
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

    let projectId = '781722135778';
    let location = 'us-central1';
    const match = targetModel.match(/projects\/([^\/]+)\/locations\/([^\/]+)/);
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

    let cleanModelName = targetModel;
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
    const updatePayload: Record<string, any> = {
      aiModelProvider: settings.aiModelProvider,
      lastUpdated: new Date().toISOString(),
      updatedBy: settings.updatedBy || 'Super Admin'
    };

    if (settings.fineTunedModelId !== undefined) {
      updatePayload.fineTunedModelId = settings.fineTunedModelId;
    }
    if (settings.defaultGeminiModel !== undefined) {
      updatePayload.defaultGeminiModel = settings.defaultGeminiModel;
    }
    if (settings.fineTunedProjects !== undefined) {
      updatePayload.fineTunedProjects = settings.fineTunedProjects;
    }
    if (settings.activeFineTunedProjectId !== undefined) {
      updatePayload.activeFineTunedProjectId = settings.activeFineTunedProjectId;
    }
    if (settings.featureModelRouting !== undefined) {
      updatePayload.featureModelRouting = settings.featureModelRouting;
    }

    await db.collection('siteSettings').doc('main').set(updatePayload, { merge: true });
    return { success: true };
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

