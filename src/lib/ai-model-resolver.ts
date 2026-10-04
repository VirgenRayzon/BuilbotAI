/**
 * ai-model-resolver.ts — Centralized resolution of the active AI model.
 * Inspects Firestore `siteSettings/main` (or fallback environment variables)
 * to determine whether to use the Default Gemini API (gemini-2.5-flash)
 * or the fine-tuned Vertex AI model.
 *
 * Includes automatic degradation detection, fallback handling, and Service Account token management.
 */

import { getAdminFirestore } from '@/firebase/server-init';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { GoogleAuth } from 'google-auth-library';
import type { LanguageModel } from 'ai';

export interface ActiveAiModelConfig {
    provider: 'default' | 'finetuned';
    modelId: string;
    isFineTuned: boolean;
    projectId: string;
    location: string;
    isDegraded: boolean;
}

export const DEFAULT_MODEL = 'gemini-2.5-flash';
export const DEFAULT_TUNED_MODEL_ID = 'projects/781722135778/locations/us-central1/endpoints/2302171190132736000';
export const TUNED_MODEL_RESOURCE_ID = 'projects/781722135778/locations/us-central1/models/2614243376421142528';
export const TUNED_ENDPOINT_RESOURCE_ID = 'projects/781722135778/locations/us-central1/endpoints/2302171190132736000';

// In-memory cache to prevent excessive Firestore reads across rapid chat messages
let cachedConfig: ActiveAiModelConfig | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 15000; // 15 seconds cache

// Degradation circuit breaker for fine-tuned model
let isTunedModelDegraded = false;
let degradedUntil = 0;
const DEGRADED_COOLDOWN_MS = 60000; // 60 seconds cooldown if permission/network error occurs

export function markTunedModelDegraded(reason: string) {
    isTunedModelDegraded = true;
    degradedUntil = Date.now() + DEGRADED_COOLDOWN_MS;
    console.warn(`[AI Model Resolver] Tuned model marked degraded for ${DEGRADED_COOLDOWN_MS / 1000}s. Reason: ${reason}`);
}

export function markTunedModelHealthy() {
    isTunedModelDegraded = false;
    degradedUntil = 0;
}

export function isCurrentlyDegraded(): boolean {
    if (isTunedModelDegraded && Date.now() > degradedUntil) {
        isTunedModelDegraded = false;
        degradedUntil = 0;
    }
    return isTunedModelDegraded;
}

export function normalizeModelId(rawId?: string): string {
    if (!rawId) return DEFAULT_TUNED_MODEL_ID;
    let normalized = rawId.trim();
    // Normalize typo project 7817221357778 (4 sevens) -> 781722135778 (3 sevens)
    normalized = normalized.replace('7817221357778', '781722135778');
    // If user configured the model registry ID '2614243376421142528', map to the active deployed endpoint '2302171190132736000'
    if (normalized.includes('2614243376421142528')) {
        normalized = TUNED_ENDPOINT_RESOURCE_ID;
    }
    return normalized;
}

export async function getActiveAiModelConfig(): Promise<ActiveAiModelConfig> {
    const now = Date.now();
    const degraded = isCurrentlyDegraded();

    if (cachedConfig && (now - lastCacheTime < CACHE_TTL_MS) && cachedConfig.isDegraded === degraded) {
        return cachedConfig;
    }

    let provider: 'default' | 'finetuned' = 'default';
    let rawModelId = DEFAULT_TUNED_MODEL_ID;
    let configuredDefaultGeminiModel = DEFAULT_MODEL;

    try {
        const firestore = getAdminFirestore();
        const settingsSnap = await firestore.collection('siteSettings').doc('main').get();

        if (settingsSnap.exists) {
            const data = settingsSnap.data();
            provider = (data?.aiModelProvider === 'finetuned') ? 'finetuned' : 'default';
            if (data?.fineTunedModelId?.trim()) {
                rawModelId = data.fineTunedModelId.trim();
            } else if (process.env.GEMINI_FINE_TUNED_MODEL) {
                rawModelId = process.env.GEMINI_FINE_TUNED_MODEL;
            }
            if (data?.defaultGeminiModel?.trim()) {
                configuredDefaultGeminiModel = data.defaultGeminiModel.trim();
            }
        }
    } catch (error) {
        console.warn("[AI Model Resolver] Unable to fetch siteSettings from Firestore, falling back to env/defaults:", error);
        if (process.env.GEMINI_FINE_TUNED_MODEL) {
            provider = 'finetuned';
            rawModelId = process.env.GEMINI_FINE_TUNED_MODEL;
        }
    }

    const normalizedId = normalizeModelId(rawModelId);
    let projectId = '781722135778';
    let location = 'us-central1';

    const match = normalizedId.match(/projects\/([^\/]+)\/locations\/([^\/]+)/);
    if (match) {
        projectId = match[1];
        location = match[2];
    }

    cachedConfig = {
        provider,
        modelId: provider === 'finetuned' ? normalizedId : configuredDefaultGeminiModel,
        isFineTuned: provider === 'finetuned' && !degraded,
        projectId,
        location,
        isDegraded: degraded,
    };
    lastCacheTime = now;
    return cachedConfig;
}

/**
 * Returns model identifier formatted for Genkit flows:
 * e.g. 'googleai/gemini-2.5-flash' or fine-tuned model path
 */
export async function getGenkitModelName(): Promise<string> {
    const config = await getActiveAiModelConfig();
    if (config.isFineTuned && !config.isDegraded) {
        // If the path already has a provider prefix, return as is
        if (config.modelId.startsWith('vertexai/')) return config.modelId;
        if (config.modelId.startsWith('googleai/')) return config.modelId;
        // Vertex AI Genkit plugin supports vertexai/modelName
        return `vertexai/${config.modelId}`;
    }
    return `googleai/${config.modelId || DEFAULT_MODEL}`;
}

/**
 * Invalidate model cache when a Super Admin changes the model in settings
 */
export function invalidateAiModelCache() {
    cachedConfig = null;
    lastCacheTime = 0;
    cachedAccessToken = null;
    tokenExpiry = 0;
    markTunedModelHealthy();
}

/**
 * Acquire Google Cloud OAuth2 Access Token for Vertex AI invocation
 */
let cachedAccessToken: string | null = null;
let tokenExpiry = 0;

export async function getVertexAccessToken(forceRefresh = false): Promise<string | null> {
    const now = Date.now();
    if (!forceRefresh && cachedAccessToken && (now < tokenExpiry - 60000)) {
        return cachedAccessToken;
    }

    const saEnv = process.env.FB_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT;

    if (saEnv && saEnv.trim() !== '') {
        try {
            let sa;
            if (saEnv.trim().startsWith('{')) {
                sa = JSON.parse(saEnv);
            } else {
                sa = JSON.parse(Buffer.from(saEnv, 'base64').toString('utf8'));
            }
            const auth = new GoogleAuth({
                credentials: sa,
                scopes: ['https://www.googleapis.com/auth/cloud-platform']
            });
            const client = await auth.getClient();
            const tokenResponse = await client.getAccessToken();
            if (tokenResponse.token) {
                cachedAccessToken = tokenResponse.token;
                tokenExpiry = now + 3500 * 1000; // ~1 hour
                return cachedAccessToken;
            }
        } catch (err) {
            console.error("[AI Model Resolver] Failed to acquire Vertex AI access token from Service Account:", err);
        }
    }

    // Fallback: Attempt Google Application Default Credentials (ADC)
    try {
        const auth = new GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/cloud-platform']
        });
        const client = await auth.getClient();
        const tokenResponse = await client.getAccessToken();
        if (tokenResponse.token) {
            cachedAccessToken = tokenResponse.token;
            tokenExpiry = now + 3500 * 1000;
            return cachedAccessToken;
        }
    } catch {
        // No local ADC found
    }

    return null;
}

/**
 * Resolves the active LanguageModel instance for Vercel AI SDK (Chat Route & Server Actions).
 * Automatically provides fallback to Gemini 2.5 Flash if fine-tuned model cannot be initialized.
 */
export async function getLanguageModelForChat(options?: { forceDefault?: boolean }): Promise<{
    model: LanguageModel;
    modelId: string;
    isFineTuned: boolean;
    isFallback: boolean;
}> {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const defaultProvider = createGoogleGenerativeAI({ apiKey });

    if (options?.forceDefault) {
        return {
            model: defaultProvider(DEFAULT_MODEL),
            modelId: DEFAULT_MODEL,
            isFineTuned: false,
            isFallback: false,
        };
    }

    const config = await getActiveAiModelConfig();
    const activeDefaultModel = config.provider === 'default' ? (config.modelId || DEFAULT_MODEL) : DEFAULT_MODEL;

    if (!config.isFineTuned || config.isDegraded) {
        return {
            model: defaultProvider(activeDefaultModel),
            modelId: activeDefaultModel,
            isFineTuned: false,
            isFallback: config.provider === 'finetuned' && config.isDegraded,
        };
    }

    try {
        const token = await getVertexAccessToken();
        if (!token) {
            console.warn("[AI Model Resolver] No Vertex AI access token available, falling back to default model.");
            markTunedModelDegraded("No Vertex AI access token available");
            return {
                model: defaultProvider(DEFAULT_MODEL),
                modelId: DEFAULT_MODEL,
                isFineTuned: false,
                isFallback: true,
            };
        }

        // Custom fetch that injects Google Cloud OAuth2 Bearer token, rewrites endpoints path, and strips API key header
        const vertexFetch = async (url: string | URL | Request, init?: RequestInit) => {
            const currentToken = await getVertexAccessToken();
            let finalUrl = String(url);
            // @ai-sdk/google automatically prepends /models/ to the model name.
            // If targeting a Vertex AI Endpoint (/endpoints/...), rewrite /models/endpoints/ -> /endpoints/
            finalUrl = finalUrl.replace('/models/endpoints/', '/endpoints/');

            const headers = new Headers(init?.headers);
            headers.delete('x-goog-api-key');
            if (currentToken) {
                headers.set('Authorization', `Bearer ${currentToken}`);
            }
            return fetch(finalUrl, { ...init, headers });
        };

        const vertexProvider = createGoogleGenerativeAI({
            baseURL: `https://${config.location}-aiplatform.googleapis.com/v1beta1/projects/${config.projectId}/locations/${config.location}`,
            apiKey: 'oauth-authenticated',
            fetch: vertexFetch,
        });

        // Determine clean model resource for Vertex AI
        let cleanModelName = config.modelId;
        const endpointsIdx = cleanModelName.indexOf('/endpoints/');
        const modelsIdx = cleanModelName.indexOf('/models/');

        if (endpointsIdx !== -1) {
            // Target the deployed endpoint
            cleanModelName = `endpoints/${cleanModelName.slice(endpointsIdx + 11)}`;
        } else if (modelsIdx !== -1) {
            cleanModelName = `publishers/google/models/${cleanModelName.slice(modelsIdx + 8)}`;
        } else if (!cleanModelName.startsWith('publishers/') && !cleanModelName.startsWith('endpoints/')) {
            cleanModelName = `publishers/google/models/${cleanModelName}`;
        }

        return {
            model: vertexProvider(cleanModelName),
            modelId: config.modelId,
            isFineTuned: true,
            isFallback: false,
        };
    } catch (err: any) {
        console.error("[AI Model Resolver] Error setting up Vertex AI provider, falling back to default:", err);
        markTunedModelDegraded(err.message || 'Setup error');
        return {
            model: defaultProvider(DEFAULT_MODEL),
            modelId: DEFAULT_MODEL,
            isFineTuned: false,
            isFallback: true,
        };
    }
}

/**
 * Safe wrapper around ai.generate() for Genkit flows.
 * Attempts execution with the configured model (default or fine-tuned);
 * if the fine-tuned model throws any error (e.g. 403, 404, network), it
 * immediately falls back to googleai/gemini-2.5-flash and marks the tuned model degraded.
 */
export async function safeGenkitGenerate<T = any>(
    aiInstance: { generate: (options: any) => Promise<T> },
    options: any
): Promise<T> {
    const dynamicModel = options.model || await getGenkitModelName();
    try {
        return await aiInstance.generate({ ...options, model: dynamicModel });
    } catch (err: any) {
        if (dynamicModel !== `googleai/${DEFAULT_MODEL}`) {
            console.warn(`[Genkit Fallback] Model ${dynamicModel} failed: ${err.message}. Gracefully falling back to googleai/${DEFAULT_MODEL}...`);
            markTunedModelDegraded(err.message || 'Genkit model failure');
            return await aiInstance.generate({ ...options, model: `googleai/${DEFAULT_MODEL}` });
        }
        throw err;
    }
}
