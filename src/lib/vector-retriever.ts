import { getAdminFirestore } from "@/firebase/server-init";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Supported hardware categories in the vector store.
 */
export const VECTOR_CATEGORIES = [
    'cpu',
    'gpu',
    'motherboard',
    'ram',
    'storage',
    'psu',
    'case',
    'cooler',
    'monitor',
    'keyboard',
    'mouse',
    'headset'
] as const;

export type VectorCategory = typeof VECTOR_CATEGORIES[number];

/**
 * Generates a 768-dimensional normalized embedding using Google's Gemini Embedding model.
 */
export async function generateHardwareEmbedding(text: string): Promise<number[]> {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
        throw new Error("Missing Gemini API Key for hardware vector embedding.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

    const result = await model.embedContent({
        content: { role: 'user', parts: [{ text }] },
        outputDimensionality: 768
    } as any);

    return result.embedding.values;
}

/**
 * Detects the most probable category from a query string, or returns null if generic.
 */
function inferCategoryFromQuery(query: string): VectorCategory | null {
    const q = query.toLowerCase();
    if (/\b(ryzen|intel core|xeon|i3|i5|i7|i9|cpu|processor)\b/.test(q)) return 'cpu';
    if (/\b(geforce|rtx|gtx|radeon|rx|gpu|graphics card|arc a\d+|arc b\d+)\b/.test(q)) return 'gpu';
    if (/\b(motherboard|mobo|b650|x670|z790|b760|am5 board|lga1700 board)\b/.test(q)) return 'motherboard';
    if (/\b(ddr4|ddr5|ram|memory|dimm|cl30|cl36)\b/.test(q)) return 'ram';
    if (/\b(nvme|ssd|m\.2|hdd|hard drive|gen4 ssd|gen5 ssd)\b/.test(q)) return 'storage';
    if (/\b(psu|power supply|watt|80\+|gold certified|modular power)\b/.test(q)) return 'psu';
    if (/\b(cooler|aio|liquid cooler|air cooler|radiator|360mm|240mm|heatsink)\b/.test(q)) return 'cooler';
    if (/\b(case|chassis|tower|mid tower|microatx case|itx case)\b/.test(q)) return 'case';
    if (/\b(monitor|hz|144hz|240hz|ips panel|oled|screen)\b/.test(q)) return 'monitor';
    if (/\b(keyboard|mechanical keyboard|switches)\b/.test(q)) return 'keyboard';
    if (/\b(mouse|dpi|wireless mouse)\b/.test(q)) return 'mouse';
    if (/\b(headset|headphones|headphone|earphones)\b/.test(q)) return 'headset';
    return null;
}

/**
 * Formats metadata object into clean, human-readable specification text for AI consumption.
 */
function formatMetadataToSpec(docId: string, category: string, metadata: Record<string, any>): string {
    const name = metadata.name || docId;
    let text = `[Hardware Spec: ${category.toUpperCase()}] ${name}\n`;

    // Group cpu_sockets if present
    const sockets: string[] = [];
    Object.keys(metadata).forEach(key => {
        if (key.startsWith('cpu_sockets/')) {
            sockets.push(metadata[key]);
        }
    });

    if (sockets.length > 0) {
        text += `- Compatible Sockets: ${sockets.join(', ')}\n`;
    }

    // Append other key specifications cleanly
    for (const [key, val] of Object.entries(metadata)) {
        if (key.startsWith('cpu_sockets/') || key === 'name' || val === '' || val === null || val === undefined) {
            continue;
        }
        // Humanize key names
        const cleanKey = key
            .replace(/_/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());

        text += `- ${cleanKey}: ${val}\n`;
    }

    return text.trim();
}

export interface VectorRetrieveOptions {
    category?: string;
    limit?: number;
}

/**
 * Retrieves hardware specifications from the Firestore vector storage (`buildbot_hardware_vector`).
 * Uses findNearest with cosine distance over 768-dim embeddings.
 */
export async function retrieveHardwareVectorSpecs(
    query: string,
    options: VectorRetrieveOptions = {}
): Promise<string[]> {
    const startTime = Date.now();
    const cleanQuery = query.trim();
    if (!cleanQuery) return [];

    const limit = options.limit || 3;
    const specifiedCategory = options.category?.toLowerCase();
    const inferred = specifiedCategory || inferCategoryFromQuery(cleanQuery);

    // Determine target categories to search
    const categoriesToSearch: VectorCategory[] = inferred && VECTOR_CATEGORIES.includes(inferred as VectorCategory)
        ? [inferred as VectorCategory]
        : ['cpu', 'gpu', 'motherboard', 'ram', 'cooler', 'psu', 'case', 'storage'];

    console.log(`[Vector Search] Query: "${cleanQuery}" | Categories: [${categoriesToSearch.join(', ')}] | Limit: ${limit}`);

    try {
        const queryVector = await generateHardwareEmbedding(cleanQuery);
        const db = getAdminFirestore();
        const results: string[] = [];

        // Search category subcollections
        for (const cat of categoriesToSearch) {
            try {
                const itemsCol = db.collection('buildbot_hardware_vector').doc(cat).collection('items');
                const vectorQuery = itemsCol.findNearest('embedding', queryVector, {
                    limit: limit,
                    distanceMeasure: 'COSINE'
                });

                const snapshot = await vectorQuery.get();
                snapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.metadata) {
                        results.push(formatMetadataToSpec(doc.id, cat, data.metadata));
                    }
                });

                // If specific category query satisfied limit, break early
                if (results.length >= limit) break;
            } catch (colErr: any) {
                console.warn(`[Vector Search] Error querying category ${cat}:`, colErr.message);
            }
        }

        console.log(`[Vector Search] Retrieved ${results.length} results in ${Date.now() - startTime}ms`);
        return results.slice(0, limit);

    } catch (error: any) {
        console.error(`[Vector Search] Failed to retrieve vector specs:`, error.message);
        return [];
    }
}
