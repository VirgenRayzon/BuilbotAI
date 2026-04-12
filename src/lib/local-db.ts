
import fs from 'fs';
import path from 'path';

/**
 * Very basic local CSV search utility.
 * Searches for a query string in all CSV files within a directory.
 */
export async function searchLocalDatabase(query: string): Promise<string[]> {
    // Check multiple potential locations to ensure it works in both dev and production
    const potentialPaths = [
        path.join(process.cwd(), 'src', 'database'),
        path.join(process.cwd(), 'database'),
        path.join(process.cwd(), '.next', 'server', 'database'), // For some serverless build structures
    ];

    let dbPath = '';
    for (const p of potentialPaths) {
        if (fs.existsSync(p)) {
            dbPath = p;
            break;
        }
    }

    const results: string[] = [];

    if (!dbPath) {
        return results;
    }

    const files = fs.readdirSync(dbPath).filter(f => f.endsWith('.csv'));

    for (const file of files) {
        const filePath = path.join(dbPath, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        // Header is the first line
        const header = lines[0];

        // Simple case-insensitive match for the first 100 relevant matches
        // We prioritize matches in the name column if it exists
        const normalizedQuery = query.toLowerCase();
        const queryTokens = normalizedQuery.split(/\s+/).filter(t => t.length > 1);

        if (queryTokens.length === 0) continue;

        const lineMatches = [];

        for (let i = 1; i < lines.length; i++) {
            const lineLower = lines[i].toLowerCase();

            // 1. Check for exact substring match (highest priority)
            const exactIndex = lineLower.indexOf(normalizedQuery);
            if (exactIndex !== -1) {
                lineMatches.push({
                    content: `[Local Category: ${file.replace('.csv', '')}] Headers: ${header} | Data: ${lines[i]}`,
                    score: 100 + (exactIndex < 50 ? 20 : 0) // Boost if match is near start (usually name)
                });
                continue;
            }

            // 2. Token-based matching
            let matchCount = 0;
            let firstMatchPos = 1000;
            for (const token of queryTokens) {
                const pos = lineLower.indexOf(token);
                if (pos !== -1) {
                    matchCount++;
                    firstMatchPos = Math.min(firstMatchPos, pos);
                }
            }

            const positionBoost = firstMatchPos < 100 ? 10 : 0;

            // If all tokens match, it's a strong match
            if (matchCount === queryTokens.length) {
                lineMatches.push({
                    content: `[Local Category: ${file.replace('.csv', '')}] Headers: ${header} | Data: ${lines[i]}`,
                    score: 80 + matchCount + positionBoost
                });
            } else if (matchCount >= Math.max(2, queryTokens.length - 1)) {
                // Partial match (e.g., 3 out of 4 tokens)
                lineMatches.push({
                    content: `[Local Category: ${file.replace('.csv', '')}] Headers: ${header} | Data: ${lines[i]}`,
                    score: 40 + matchCount + positionBoost
                });
            }
        }

        // Sort this file's matches by score and take top
        lineMatches.sort((a, b) => b.score - a.score);
        results.push(...lineMatches.slice(0, 5).map(m => m.content));

        if (results.length >= 15) break;
    }

    return results.slice(0, 10);
}

/**
 * Retrieves a representative sample of parts for a given category.
 * Used to provide the AI with a "Store Menu" for suggestions.
 */
export async function getInventoryByCategory(category: string, limit: number = 20): Promise<string[]> {
    const potentialPaths = [
        path.join(process.cwd(), 'src', 'database'),
        path.join(process.cwd(), 'database'),
    ];

    let dbPath = '';
    for (const p of potentialPaths) {
        if (fs.existsSync(p)) {
            dbPath = p;
            break;
        }
    }

    if (!dbPath) return [];

    // Map common build categories to CSV filenames
    const categoryMap: Record<string, string> = {
        'cpu': 'cpu.csv',
        'gpu': 'gpu.csv',
        'motherboard': 'motherboard.csv',
        'ram': 'ram.csv',
        'storage': 'storage.csv',
        'psu': 'psu.csv',
        'case': 'case.csv',
        'cooler': 'cooler.csv',
        'monitor': 'monitor.csv'
    };

    const fileName = categoryMap[category.toLowerCase()];
    if (!fileName) return [];

    const filePath = path.join(dbPath, fileName);
    if (!fs.existsSync(filePath)) return [];

    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter(l => l.trim().length > 0);
        if (lines.length <= 1) return [];

        const header = lines[0].toLowerCase().split(',');
        const dataLines = lines.slice(1);

        // Identify key columns based on header names
        // Note: CSV indices vary by file
        let nameIdx = header.indexOf('metadata/name');
        let brandIdx = header.indexOf('brand');
        let modelIdx = header.indexOf('model');
        let manufacturerIdx = header.indexOf('metadata/manufacturer');

        // Fallbacks for specific files where headers might differ
        if (nameIdx === -1 && modelIdx !== -1) nameIdx = modelIdx;
        const brandCol = brandIdx !== -1 ? brandIdx : manufacturerIdx;

        // Sampling logic
        const sampledLines = [];
        if (dataLines.length > limit) {
            const step = Math.floor(dataLines.length / limit);
            for (let i = 0; i < dataLines.length && sampledLines.length < limit; i += step) {
                sampledLines.push(dataLines[i]);
            }
        } else {
            sampledLines.push(...dataLines);
        }

        return sampledLines.map(line => {
            const cols = line.split(',');
            const brand = brandCol !== -1 ? cols[brandCol]?.trim() : '';
            const name = nameIdx !== -1 ? cols[nameIdx]?.trim() : 'Unknown Part';
            
            // Clean up name if it includes the brand already (to avoid "Kingston Kingston Fury")
            let displayName = name;
            if (brand && name.toLowerCase().startsWith(brand.toLowerCase())) {
                 // It's already prefixed, keep as is
            } else if (brand) {
                displayName = `${brand} ${name}`;
            }

            return `[${category.toUpperCase()}] Name: "${displayName}"`;
        });
    } catch (error) {
        console.error(`Error reading inventory for ${category}:`, error);
        return [];
    }
}
