const fs = require('fs');
const path = require('path');

console.log("=== Buildbot AI - A/B Test Builders Cleanup ===");

// 1. Delete test-builder-1 and test-builder-2 directories
const pathsToDelete = [
    path.join(__dirname, '../src/app/test-builder-1'),
    path.join(__dirname, '../src/app/test-builder-2')
];

pathsToDelete.forEach(dir => {
    if (fs.existsSync(dir)) {
        try {
            fs.rmSync(dir, { recursive: true, force: true });
            console.log(`[DELETED] Recursive directory: ${dir}`);
        } catch (err) {
            console.error(`[ERROR] Failed to delete directory ${dir}:`, err);
        }
    } else {
        console.log(`[SKIPPED] Directory not found: ${dir}`);
    }
});

// 2. Clean up src/components/super-admin-settings.tsx
const adminSettingsPath = path.join(__dirname, '../src/components/super-admin-settings.tsx');
if (fs.existsSync(adminSettingsPath)) {
    try {
        let content = fs.readFileSync(adminSettingsPath, 'utf8');
        
        // Remove layout A/B testing card between markers
        const cardRegex = /\/\*\s*TEST_BUILDERS_AB_TESTING_START\s*\*\/[\s\S]*?\/\*\s*TEST_BUILDERS_AB_TESTING_END\s*\*\//g;
        if (cardRegex.test(content)) {
            content = content.replace(cardRegex, '');
            console.log("[REMOVED] A/B Layout Testing Card block from super-admin-settings.tsx");
        }

        // Revert imports if needed
        content = content.replace(
            "import { Loader2, Check, X, RefreshCw, Mail, Key, Shield, Layout, ExternalLink } from 'lucide-react';",
            "import { Loader2, Check, X, RefreshCw, Mail, Key, Shield } from 'lucide-react';"
        );
        content = content.replace(
            "import Link from 'next/link';\r\n",
            ""
        );
        content = content.replace(
            "import Link from 'next/link';\n",
            ""
        );

        fs.writeFileSync(adminSettingsPath, content, 'utf8');
        console.log(`[RESTORED] Cleaned super-admin-settings.tsx`);
    } catch (err) {
        console.error(`[ERROR] Failed to clean super-admin-settings.tsx:`, err);
    }
} else {
    console.log(`[SKIPPED] File not found: ${adminSettingsPath}`);
}

// 3. Revert modified workspace files (inventory-view.tsx and use-filtered-inventory.ts)
// We try git checkout first since it's 100% precise.
try {
    const { execSync } = require('child_process');
    execSync('git checkout HEAD -- src/app/builder/components/inventory-view.tsx');
    execSync('git checkout HEAD -- src/app/builder/hooks/use-filtered-inventory.ts');
    console.log("[RESTORED] Reverted modified components (inventory-view.tsx, use-filtered-inventory.ts) to HEAD via git");
} catch (gitErr) {
    console.log("[FALLBACK] Git checkout failed, executing manual string replacement reverts...");
    
    // Fallback revert for inventory-view.tsx
    const inventoryViewPath = path.join(__dirname, '../src/app/builder/components/inventory-view.tsx');
    if (fs.existsSync(inventoryViewPath)) {
        try {
            let content = fs.readFileSync(inventoryViewPath, 'utf8');
            
            // Revert interface
            content = content.replace(/gridCols\??:\s*number;?/g, '');
            content = content.replace(
                "    className?: string;\n",
                "    className?: string;"
            );
            content = content.replace(
                "    className?: string;\r\n",
                "    className?: string;"
            );

            // Revert signature and class
            content = content.replace(/,\r\n\s*gridCols/g, '');
            content = content.replace(/,\n\s*gridCols/g, '');
            content = content.replace(/const gridColsClass = [\s\S]*?;\r\n\r\n/g, '');
            content = content.replace(/const gridColsClass = [\s\S]*?;\n\n/g, '');
            content = content.replace(/gridColsClass/g, '"grid-cols-2 lg:grid-cols-4"');

            fs.writeFileSync(inventoryViewPath, content, 'utf8');
            console.log(`[RESTORED] Cleaned inventory-view.tsx (Fallback)`);
        } catch (err) {
            console.error(`[ERROR] Failed to clean inventory-view.tsx fallback:`, err);
        }
    }

    // Fallback revert for use-filtered-inventory.ts
    const useFilteredInventoryPath = path.join(__dirname, '../src/app/builder/hooks/use-filtered-inventory.ts');
    if (fs.existsSync(useFilteredInventoryPath)) {
        try {
            let content = fs.readFileSync(useFilteredInventoryPath, 'utf8');
            content = content.replace(
                "import { useState, useMemo, useCallback } from 'react';",
                "import { useState, useMemo } from 'react';"
            );
            const targetStart = "    const handleCategoryChange = useCallback((categoryName: string, selected?: boolean) => {";
            const cleanStart = "    const handleCategoryChange = (categoryName: string, selected?: boolean) => {";

            if (content.includes(targetStart)) {
                const targetEndLf = "        });\n    }, [];\n\n    const sortedAndFilteredParts";
                const targetEndCrlf = "        });\r\n    }, [];\r\n\r\n    const sortedAndFilteredParts";
                
                const cleanEndLf = "        });\n    };\n\n    const sortedAndFilteredParts";
                const cleanEndCrlf = "        });\r\n    };\r\n\r\n    const sortedAndFilteredParts";

                content = content.replace(targetStart, cleanStart);
                content = content.replace(targetEndLf, cleanEndLf);
                content = content.replace(targetEndCrlf, cleanEndCrlf);
            }
            fs.writeFileSync(useFilteredInventoryPath, content, 'utf8');
            console.log(`[RESTORED] Cleaned use-filtered-inventory.ts (Fallback)`);
        } catch (err) {
            console.error(`[ERROR] Failed to clean use-filtered-inventory.ts fallback:`, err);
        }
    }
}

console.log("===============================================");
console.log("Cleanup complete. All layout testing folders deleted.");
console.log("===============================================");
