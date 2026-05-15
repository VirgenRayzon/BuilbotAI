import fs from 'fs';
import path from 'path';

/**
 * In-memory cache for knowledge base sections.
 */
interface CachedSection {
    source: string;
    text: string;
    normalized: string;
}

let knowledgeCache: CachedSection[] | null = null;
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hour cache TTL for static knowledge
let cacheTimestamp = 0;

/**
 * Reads all markdown files in the src/knowledge/ directory
 * and performs a simple keyword-based search to find relevant paragraphs.
 */
export async function retrieveLocalKnowledge(query: string): Promise<string[]> {
    const knowledgeDir = path.join(process.cwd(), 'src', 'knowledge');
    const results: string[] = [];

    if (!fs.existsSync(knowledgeDir)) {
        console.warn(`Knowledge directory not found at ${knowledgeDir}`);
        return results;
    }

    // 1. Initialize or Refresh Cache
    if (!knowledgeCache || (Date.now() - cacheTimestamp > CACHE_TTL)) {
        console.log("[Knowledge Base] Initializing/Refreshing cache...");
        const files = fs.readdirSync(knowledgeDir).filter(f => f.endsWith('.md') || f.endsWith('.txt'));
        const newCache: CachedSection[] = [];

        for (const file of files) {
            const filePath = path.join(knowledgeDir, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const sections = content.split('\n\n').filter(s => s.trim().length > 0);

            for (const section of sections) {
                newCache.push({
                    source: file,
                    text: section.trim(),
                    normalized: section.toLowerCase()
                });
            }
        }
        knowledgeCache = newCache;
        cacheTimestamp = Date.now();
        console.log(`[Knowledge Base] Cached ${knowledgeCache.length} sections from ${files.length} files.`);
    }

    // 2. Perform search on cache
    const normalizedQueryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    if (normalizedQueryWords.length === 0) return results;

    for (const section of knowledgeCache) {
        let score = 0;
        for (const word of normalizedQueryWords) {
            if (section.normalized.includes(word)) {
                score++;
            }
        }

        const threshold = Math.max(1, Math.floor(normalizedQueryWords.length * 0.3));

        if (score >= threshold) {
            results.push(`[Source: ${section.source}]\n${section.text}`);
        }
    }

    // 3. Deduplicate and limit
    const uniqueResults = [...new Set(results)].slice(0, 10);
    
    if (uniqueResults.length > 0) {
        const sources = [...new Set(uniqueResults.map(r => r.split('\n')[0].replace('[Source: ', '').replace(']', '')))];
        console.log(`[Knowledge Base] Retrieved ${uniqueResults.length} sections from: ${sources.join(', ')}`);
    }

    return uniqueResults;
}

