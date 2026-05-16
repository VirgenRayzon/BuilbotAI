import fs from 'fs';
import path from 'path';

// Simple in-memory cache for CSV content to avoid constant disk I/O
let csvCache: Record<string, { headers: string, lines: string[] }> | null = null;

/**
 * Very basic local CSV search utility.
 * Searches for a query string in all CSV files within a directory.
 */
export async function searchLocalDatabase(query: string): Promise<string[]> {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`\n[${timestamp}] 🔎 CSV GROUNDING: Searching Local Inventory`);
    console.log(`   Query: "${query}"`);
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

    // Initialize cache if empty
    if (!csvCache) {
        csvCache = {};
        const files = fs.readdirSync(dbPath).filter(f => f.endsWith('.csv'));
        for (const file of files) {
            const content = fs.readFileSync(path.join(dbPath, file), 'utf-8');
            const lines = content.split('\n').filter(l => l.trim());
            csvCache[file] = {
                headers: lines[0],
                lines: lines.slice(1)
            };
        }
    }

    const results: string[] = [];
    const normalizedQuery = query.toLowerCase();
    const queryTokens = normalizedQuery.split(/\s+/).filter(t => t.length > 1);

    if (queryTokens.length === 0) return results;

    for (const [fileName, data] of Object.entries(csvCache)) {
        const lineMatches = [];

        for (const line of data.lines) {
            const lineLower = line.toLowerCase();
            const exactIndex = lineLower.indexOf(normalizedQuery);
            
            if (exactIndex !== -1) {
                lineMatches.push({
                    content: `[Local Category: ${fileName.replace('.csv', '')}] Headers: ${data.headers} | Data: ${line}`,
                    score: 100 + (exactIndex < 50 ? 20 : 0)
                });
                continue;
            }

            let matchCount = 0;
            for (const token of queryTokens) {
                if (lineLower.includes(token)) matchCount++;
            }

            if (matchCount >= Math.max(2, queryTokens.length - 1)) {
                lineMatches.push({
                    content: `[Local Category: ${fileName.replace('.csv', '')}] Headers: ${data.headers} | Data: ${line}`,
                    score: 40 + matchCount
                });
            }
        }

        lineMatches.sort((a, b) => b.score - a.score);
        results.push(...lineMatches.slice(0, 3).map(m => m.content));
        if (results.length >= 10) break;
    }

    if (results.length > 0) {
        console.log(`   ✅ Success: Found ${results.length} relevant entries in CSV database.`);
    } else {
        console.log(`   ⚠️ Notice: No matches found in local CSV database.`);
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
