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

export function initializeKnowledgeCache(): void {
    const knowledgeDir = path.join(process.cwd(), 'src', 'knowledge');
    if (!fs.existsSync(knowledgeDir)) {
        console.warn(`Knowledge directory not found at ${knowledgeDir}`);
        return;
    }

    console.log("[Knowledge Base] Pre-indexing cache...");
    const files = fs.readdirSync(knowledgeDir).filter(f => f.endsWith('.md') || f.endsWith('.txt'));
    const newCache: CachedSection[] = [];

    for (const file of files) {
        const filePath = path.join(knowledgeDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Split by markdown headers or double newlines to get logical chunks
        const sections = content.split(/(?=^## )|\n\n+/m).filter(s => s.trim().length > 10);

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

// Call on startup
if (typeof window === 'undefined') {
    setTimeout(initializeKnowledgeCache, 0);
}

/**
 * Reads all markdown files in the src/knowledge/ directory
 * and performs a simple keyword-based search to find relevant paragraphs.
 */
export async function retrieveLocalKnowledge(query: string, maxResults: number = 4): Promise<string[]> {
    const knowledgeDir = path.join(process.cwd(), 'src', 'knowledge');
    const scoredResults: { text: string; score: number }[] = [];

    if (!fs.existsSync(knowledgeDir)) {
        console.warn(`Knowledge directory not found at ${knowledgeDir}`);
        return [];
    }

    // 1. Initialize or Refresh Cache
    if (!knowledgeCache || (Date.now() - cacheTimestamp > CACHE_TTL)) {
        initializeKnowledgeCache();
    }

    if (!knowledgeCache) return [];

    // 2. Perform search on cache
    const normalizedQueryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    if (normalizedQueryWords.length === 0) return [];

    // Weighting: core concepts like 'bottleneck' or 'compatibility' are important
    const coreWords = ['bottleneck', 'compatibility', 'tier', 'hierarchy', 'guide'];

    for (const section of knowledgeCache) {
        let score = 0;
        let coreMatch = false;

        for (const word of normalizedQueryWords) {
            if (section.normalized.includes(word)) {
                // Higher weight for component model matches (numbers/X-suffix)
                if (/\d+/.test(word) || word.endsWith('x')) {
                    score += 1.5;
                } else {
                    score += 1;
                }
                
                if (coreWords.includes(word)) coreMatch = true;
            }
        }

        // Relevance threshold: 
        // 1. If it matches a core word (bottleneck/compatibility) AND at least one other word
        // 2. Or if it meets a % threshold based on query length
        const threshold = Math.max(1.5, normalizedQueryWords.length * 0.15);

        if (score >= threshold || (coreMatch && score >= 2)) {
            scoredResults.push({
                text: `[Source: ${section.source}]\n${section.text}`,
                score
            });
        }
    }

    // 3. Sort by score descending, deduplicate, and limit to maxResults
    scoredResults.sort((a, b) => b.score - a.score);
    const seen = new Set<string>();
    const uniqueResults: string[] = [];
    for (const item of scoredResults) {
        if (!seen.has(item.text)) {
            seen.add(item.text);
            uniqueResults.push(item.text);
            if (uniqueResults.length >= maxResults) break;
        }
    }
    
    if (uniqueResults.length > 0) {
        const sources = [...new Set(uniqueResults.map(r => r.split('\n')[0].replace('[Source: ', '').replace(']', '')))];
        const timestamp = new Date().toLocaleTimeString();
        console.log(`\n[${timestamp}] 📚 KNOWLEDGE RETRIEVAL: Active`);
        console.log(`   Query: "${query.length > 120 ? query.substring(0, 120) + '...' : query}"`);
        console.log(`   Result: Found ${uniqueResults.length} relevant sections (top-ranked) from: ${sources.join(', ')}`);
        console.log('--------------------------------------------------');
    }

    return uniqueResults;
}

