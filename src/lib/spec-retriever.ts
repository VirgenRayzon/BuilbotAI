import fs from 'fs';
import path from 'path';

/**
 * In-memory cache for CSV data to prevent repeated disk I/O and parsing.
 */
interface CachedCsv {
    headers: string[];
    lines: string[];
    timestamp: number;
}

const csvCache: Record<string, CachedCsv> = {};
const CACHE_TTL = 1000 * 60 * 60; // 1 hour cache TTL

/**
 * Searches the local CSV database for detailed part specifications.
 */
export async function retrieveCsvSpecs(query: string): Promise<string[]> {
    const dbDir = path.join(process.cwd(), 'src', 'database');
    const results: string[] = [];

    if (!fs.existsSync(dbDir)) {
        console.warn(`Database directory not found at ${dbDir}`);
        return results;
    }

    const files = fs.readdirSync(dbDir).filter(f => f.endsWith('.csv'));
    const queryTerms = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);

    if (queryTerms.length === 0) return results;

    for (const file of files) {
        const filePath = path.join(dbDir, file);
        
        let headers: string[];
        let lines: string[];

        // Check cache first
        const cached = csvCache[file];
        if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
            headers = cached.headers;
            lines = cached.lines;
        } else {
            // Cache miss or expired: read and parse
            const content = fs.readFileSync(filePath, 'utf-8');
            const allLines = content.split('\n');
            if (allLines.length < 2) continue;
            
            headers = allLines[0].split(',').map(h => h.trim());
            lines = allLines.slice(1);

            // Save to cache
            csvCache[file] = {
                headers,
                lines,
                timestamp: Date.now()
            };
            console.log(`[CSV Grounding] Cached ${file} (${lines.length} lines)`);
        }

        const nameIndex = headers.findIndex(h => h.includes('metadata/name') || h.includes('name'));

        // If we can't find a name column, skip this file
        if (nameIndex === -1) continue;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Simple CSV split (handles basic commas, may need refinement for quotes)
            const cells = line.split(',');
            const partName = cells[nameIndex]?.toLowerCase() || '';

            // Check if all query terms match the part name
            let matchCount = 0;
            for (const term of queryTerms) {
                if (partName.includes(term)) {
                    matchCount++;
                }
            }

            // If it's a strong match (at least 2 terms or 70% of terms), extract specs
            if (matchCount >= Math.min(2, queryTerms.length)) {
                let specSummary = `[Spec Source: ${file}] ${cells[nameIndex]}\n`;
                
                // Add key specs (limit to first 10 relevant headers to save tokens)
                headers.forEach((header, idx) => {
                    const val = cells[idx];
                    if (val && val !== '0' && val !== 'FALSE' && val !== '' && idx !== nameIndex) {
                        // Clean up header name
                        const cleanHeader = header.replace(/metadata\/|specifications\/|general_product_information\//g, '');
                        specSummary += `- ${cleanHeader}: ${val}\n`;
                    }
                });

                results.push(specSummary.trim());
                if (results.length >= 3) break; // Limit to top 3 total matches to prevent context bloat
            }
        }
        if (results.length >= 3) break;
    }

    if (results.length > 0) {
        console.log(`[CSV Grounding] Found ${results.length} part specifications in database.`);
    }

    return results;
}

