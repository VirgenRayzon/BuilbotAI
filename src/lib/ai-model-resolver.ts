
import { getAdminFirestore } from '@/firebase/server-init';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { GoogleAuth } from 'google-auth-library';
import type { LanguageModel } from 'ai';
import { resolveVertexTunedEndpoint } from './vertex-tuned-endpoint';
export type AiFeatureKey = 'chatbot' | 'buildAdvisor' | 'prebuiltAdvisor';

export interface FeatureModelRouting {
    chatbot: 'default' | 'finetuned';
    buildAdvisor: 'default' | 'finetuned';
    prebuiltAdvisor: 'default' | 'finetuned';
}

export const DEFAULT_FEATURE_ROUTING: FeatureModelRouting = {
    chatbot: 'finetuned',
    buildAdvisor: 'default',
    prebuiltAdvisor: 'default',
};

export interface ActiveAiModelConfig {
    provider: 'default' | 'finetuned';
    modelId: string;
    isFineTuned: boolean;
    projectId: string;
    location: string;
    isDegraded: boolean;
}

export const DEFAULT_MODEL = 'gemini-3.8-flash';
export const DEFAULT_TUNED_MODEL_ID = 'projects/781722135778/locations/us-central1/endpoints/2302171190132736000';
export const TUNED_MODEL_RESOURCE_ID = 'projects/781722135778/locations/us-central1/models/2614243376421142528';
export const TUNED_ENDPOINT_RESOURCE_ID = 'projects/781722135778/locations/us-central1/endpoints/2302171190132736000';

interface CachedSettingsData {
    globalProvider: 'default' | 'finetuned';
    featureRouting: FeatureModelRouting;
    normalizedModelId: string;
    configuredDefaultGeminiModel: string;
    projectId: string;
    location: string;
}

let cachedSettings: CachedSettingsData | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 15000;

let isTunedModelDegraded = false;
let degradedUntil = 0;
const DEGRADED_COOLDOWN_MS = 60000;

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
    normalized = normalized.replace('7817221357778', '781722135778');
    if (normalized.includes('2614243376421142528')) {
        normalized = TUNED_ENDPOINT_RESOURCE_ID;
    }
    return normalized;
}

export async function getActiveAiModelConfig(feature?: AiFeatureKey): Promise<ActiveAiModelConfig> {
    const now = Date.now();
    if (!cachedSettings || (now - lastCacheTime >= CACHE_TTL_MS)) {
        let globalProvider: 'default' | 'finetuned' = 'default';
        let rawModelId = DEFAULT_TUNED_MODEL_ID;
        let configuredDefaultGeminiModel = DEFAULT_MODEL;
        let featureRouting: FeatureModelRouting = { ...DEFAULT_FEATURE_ROUTING };

        try {
            const firestore = getAdminFirestore();
            const settingsSnap = await firestore.collection('siteSettings').doc('main').get();

            if (settingsSnap.exists) {
                const data = settingsSnap.data();
                globalProvider = (data?.aiModelProvider === 'finetuned') ? 'finetuned' : 'default';
                if (data?.fineTunedModelId?.trim()) {
                    rawModelId = data.fineTunedModelId.trim();
                } else if (process.env.GEMINI_FINE_TUNED_MODEL) {
                    rawModelId = process.env.GEMINI_FINE_TUNED_MODEL;
                }
                if (data?.defaultGeminiModel?.trim()) {
                    const candidate = data.defaultGeminiModel.trim();
                    configuredDefaultGeminiModel = (candidate === 'gemini-2.5-pro' || candidate === 'gemini-2.5-flash') ? 'gemini-3.8-flash' : candidate;
                }

                if (data?.featureModelRouting) {
                    featureRouting = {
                        chatbot: data.featureModelRouting.chatbot === 'finetuned' ? 'finetuned' : 'default',
                        buildAdvisor: data.featureModelRouting.buildAdvisor === 'finetuned' ? 'finetuned' : 'default',
                        prebuiltAdvisor: data.featureModelRouting.prebuiltAdvisor === 'finetuned' ? 'finetuned' : 'default',
                    };
                } else {
                    featureRouting = {
                        chatbot: globalProvider,
                        buildAdvisor: globalProvider,
                        prebuiltAdvisor: globalProvider,
                    };
                }
            }
        } catch (error) {
            console.warn("[AI Model Resolver] Unable to fetch siteSettings from Firestore, falling back to env/defaults:", error);
            if (process.env.GEMINI_FINE_TUNED_MODEL) {
                globalProvider = 'finetuned';
                rawModelId = process.env.GEMINI_FINE_TUNED_MODEL;
                featureRouting = {
                    chatbot: 'finetuned',
                    buildAdvisor: 'finetuned',
                    prebuiltAdvisor: 'finetuned',
                };
            }
        }

        let normalizedModelId = normalizeModelId(rawModelId);
        if (normalizedModelId.includes('/models/')) {
            try {
                const token = await getVertexAccessToken();
                if (!token) throw new Error('No Vertex AI access token available');
                normalizedModelId = await resolveVertexTunedEndpoint(normalizedModelId, token);
            } catch (error) {
                console.warn('[AI Model Resolver] Could not resolve tuned model endpoint:', error);
                markTunedModelDegraded(error instanceof Error ? error.message : 'Endpoint lookup failed');
            }
        }
        let projectId = '781722135778';
        let location = 'us-central1';

        const match = normalizedModelId.match(/projects\/([^\/]+)\/locations\/([^\/]+)/);
        if (match) {
            projectId = match[1];
            location = match[2];
        }

        cachedSettings = {
            globalProvider,
            featureRouting,
            normalizedModelId,
            configuredDefaultGeminiModel,
            projectId,
            location,
        };
        lastCacheTime = now;
    }

    const effectiveProvider = (feature && cachedSettings.featureRouting[feature])
        ? cachedSettings.featureRouting[feature]
        : cachedSettings.globalProvider;

    const degraded = isCurrentlyDegraded();
    const isFineTuned = effectiveProvider === 'finetuned' && !degraded;
    const modelId = effectiveProvider === 'finetuned'
        ? cachedSettings.normalizedModelId
        : cachedSettings.configuredDefaultGeminiModel;

    return {
        provider: effectiveProvider,
        modelId,
        isFineTuned,
        projectId: cachedSettings.projectId,
        location: cachedSettings.location,
        isDegraded: degraded,
    };
}

export async function getGenkitModelName(feature?: AiFeatureKey): Promise<string> {
    const config = await getActiveAiModelConfig(feature);
    if (config.isFineTuned && !config.isDegraded) {
        if (config.modelId.startsWith('vertexai/')) return config.modelId;
        if (config.modelId.startsWith('googleai/')) return config.modelId;
        return `vertexai/${config.modelId}`;
    }
    return `googleai/${config.modelId || DEFAULT_MODEL}`;
}

export function invalidateAiModelCache() {
    cachedSettings = null;
    lastCacheTime = 0;
    cachedAccessToken = null;
    tokenExpiry = 0;
    markTunedModelHealthy();
}

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
                tokenExpiry = now + 3500 * 1000;
                return cachedAccessToken;
            }
        } catch (err) {
            console.error("[AI Model Resolver] Failed to acquire Vertex AI access token from Service Account:", err);
        }
    }

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
    }

    return null;
}

export async function getLanguageModelForChat(options?: { forceDefault?: boolean; feature?: AiFeatureKey }): Promise<{
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

    const feature = options?.feature || 'chatbot';
    const config = await getActiveAiModelConfig(feature);
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
            baseURL: `https://${config.location}-aiplatform.googleapis.com/v1beta1/projects/${config.projectId}/locations/${config.location}`,
            apiKey: 'oauth-authenticated',
            fetch: vertexFetch,
        });

        let cleanModelName = config.modelId;
        const endpointsIdx = cleanModelName.indexOf('/endpoints/');
        const modelsIdx = cleanModelName.indexOf('/models/');

        if (endpointsIdx !== -1) {
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
