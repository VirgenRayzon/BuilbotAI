import fs from 'fs';
import path from 'path';

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

    const files = fs.readdirSync(knowledgeDir).filter(f => f.endsWith('.md') || f.endsWith('.txt'));

    // Normalize the query for basic matching
    const normalizedQueryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);

    if (normalizedQueryWords.length === 0) return results;

    for (const file of files) {
        const filePath = path.join(knowledgeDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        // Split content by paragraphs or headings
        const sections = content.split('\n\n').filter(s => s.trim().length > 0);

        for (const section of sections) {
            const normalizedSection = section.toLowerCase();

            // Calculate a basic "score" based on how many query words appear in this section
            let score = 0;
            for (const word of normalizedQueryWords) {
                if (normalizedSection.includes(word)) {
                    score++;
                }
            }

            // If the section contains at least 30% of the query words (or 1 if query is short), include it
            const threshold = Math.max(1, Math.floor(normalizedQueryWords.length * 0.3));

            if (score >= threshold) {
                results.push(`[Source: ${file}]\n${section.trim()}`);
            }
        }
    }

    // Deduplicate and limit results to prevent massive token usage
    const uniqueResults = [...new Set(results)].slice(0, 10);
    return uniqueResults;
}
