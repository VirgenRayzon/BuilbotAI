"use server";

import {
  aiBuildAdvisorRecommendations,
  type AiBuildAdvisorRecommendationsInput,
} from "@/ai/flows/ai-build-advisor-recommendations";
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


async function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 120000): Promise<T> {
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
    const result = await withTimeout(aiBuildCritiqueAction(input));
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
  
  const fetchedParts: Part[] = [];
  
  const snapshot = await db.collection('parts').where('isArchived', '==', false).get();
  let docs = snapshot.docs;
  
  if (snapshot.empty) {
    const fallbackSnapshot = await db.collection('parts').get();
    docs = fallbackSnapshot.docs.filter(doc => doc.data().isArchived !== true);
  }
  
  docs.forEach(doc => {
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
    
    await adminAuth.setCustomUserClaims(userId, {
      isManager,
      isSuperAdmin,
    });
    
    console.log(`[syncUserClaimsAction] Custom claims set successfully for ${userId}: isManager=${isManager}, isSuperAdmin=${isSuperAdmin}`);
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
        if (userData.activeManagerKey) {
          isKeyValid = (userData.activeManagerKey === roleKey);
        } else {
          // Check database authKeys
          const keyDocSnap = await db.collection('authKeys').doc(roleKey).get();
          const isLegacyKey = (keyDocSnap.exists && keyDocSnap.data()?.role === 'manager') || roleKey === '00216764';
          isKeyValid = isLegacyKey;
        }

        if (!isKeyValid) {
          return { error: 'Incorrect manager key.' };
        }

        // Apply promotions & key adoption if needed
        const updates: any = { isManager: true };
        if (userData.isAdmin && !userData.isManager) {
          updates.isManager = true;
        }
        if (!userData.activeManagerKey) {
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
          return { error: 'Incorrect super admin key.' };
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

    // 4. Set custom claims on Firebase Auth
    await adminAuth.setCustomUserClaims(userId, {
      isManager: true,
      isSuperAdmin: !!effectiveProfile.isSuperAdmin,
    });

    console.log(`[authenticateSystemAccessAction] Successfully promoted user ${userId}: isManager=true, isSuperAdmin=${!!effectiveProfile.isSuperAdmin}`);
    return { success: true };
  } catch (error: any) {
    console.error(`[authenticateSystemAccessAction] Failed to authenticate system access:`, error);
    return { error: error.message || 'Server error occurred during authentication.' };
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


