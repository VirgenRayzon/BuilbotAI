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

// 3. Clean up src/app/builder/components/inventory-view.tsx
const inventoryViewPath = path.join(__dirname, '../src/app/builder/components/inventory-view.tsx');
if (fs.existsSync(inventoryViewPath)) {
    try {
        let content = fs.readFileSync(inventoryViewPath, 'utf8');
        
        // Revert props interface
        content = content.replace(
            "    onBrandChange?: (brands: string[]) => void;\r\n    className?: string;",
            "    onBrandChange?: (brands: string[]) => void;"
        );
        content = content.replace(
            "    onBrandChange?: (brands: string[]) => void;\n    className?: string;",
            "    onBrandChange?: (brands: string[]) => void;"
        );

        // Revert function signature and class bindings
        const functionSignatureTarget = `    onBrandChange,\r\n    className\r\n}: InventoryViewProps) {\r\n    return (\r\n        <motion.div\r\n            initial={{ opacity: 0, y: 20 }}\r\n            animate={{ opacity: 1, y: 0 }}\r\n            className={cn(\r\n                "p-6 rounded-3xl border shadow-2xl transition-all duration-500 glass-panel",\r\n                className ? className : "lg:col-span-9"\r\n            )}\r\n        >`;
        const functionSignatureTargetLf = `    onBrandChange,\n    className\n}: InventoryViewProps) {\n    return (\n        <motion.div\n            initial={{ opacity: 0, y: 20 }}\n            animate={{ opacity: 1, y: 0 }}\n            className={cn(\n                "p-6 rounded-3xl border shadow-2xl transition-all duration-500 glass-panel",\n                className ? className : "lg:col-span-9"\n            )}\n        >`;

        const cleanSignature = `    onBrandChange\n}: InventoryViewProps) {\n    return (\n        <motion.div\n            initial={{ opacity: 0, y: 20 }}\n            animate={{ opacity: 1, y: 0 }}\n            className="p-6 rounded-3xl border shadow-2xl transition-all duration-500 glass-panel lg:col-span-9"\n        >`;

        if (content.includes(functionSignatureTarget)) {
            content = content.replace(functionSignatureTarget, cleanSignature);
            console.log("[REMOVED] className custom rendering from inventory-view.tsx (CRLF)");
        } else if (content.includes(functionSignatureTargetLf)) {
            content = content.replace(functionSignatureTargetLf, cleanSignature);
            console.log("[REMOVED] className custom rendering from inventory-view.tsx (LF)");
        }

        fs.writeFileSync(inventoryViewPath, content, 'utf8');
        console.log(`[RESTORED] Cleaned inventory-view.tsx`);
    } catch (err) {
        console.error(`[ERROR] Failed to clean inventory-view.tsx:`, err);
    }
} else {
    console.log(`[SKIPPED] File not found: ${inventoryViewPath}`);
}

// 4. Clean up src/app/builder/hooks/use-filtered-inventory.ts
const useFilteredInventoryPath = path.join(__dirname, '../src/app/builder/hooks/use-filtered-inventory.ts');
if (fs.existsSync(useFilteredInventoryPath)) {
    try {
        let content = fs.readFileSync(useFilteredInventoryPath, 'utf8');
        
        // Revert import
        content = content.replace(
            "import { useState, useMemo, useCallback } from 'react';",
            "import { useState, useMemo } from 'react';"
        );

        // Revert useCallback wrapping
        const targetStart = "    const handleCategoryChange = useCallback((categoryName: string, selected?: boolean) => {";
        const cleanStart = "    const handleCategoryChange = (categoryName: string, selected?: boolean) => {";

        if (content.includes(targetStart)) {
            // Find the end of useCallback wrapping (which ends with }, []); before const sortedAndFilteredParts)
            const targetEndLf = "        });\n    }, [];\n\n    const sortedAndFilteredParts";
            const targetEndCrlf = "        });\r\n    }, [];\r\n\r\n    const sortedAndFilteredParts";
            
            const cleanEndLf = "        });\n    };\n\n    const sortedAndFilteredParts";
            const cleanEndCrlf = "        });\r\n    };\r\n\r\n    const sortedAndFilteredParts";

            content = content.replace(targetStart, cleanStart);
            content = content.replace(targetEndLf, cleanEndLf);
            content = content.replace(targetEndCrlf, cleanEndCrlf);
            
            console.log("[REMOVED] useCallback wrapper from handleCategoryChange in use-filtered-inventory.ts");
        }

        fs.writeFileSync(useFilteredInventoryPath, content, 'utf8');
        console.log(`[RESTORED] Cleaned use-filtered-inventory.ts`);
    } catch (err) {
        console.error(`[ERROR] Failed to clean use-filtered-inventory.ts:`, err);
    }
} else {
    console.log(`[SKIPPED] File not found: ${useFilteredInventoryPath}`);
}

console.log("===============================================");
console.log("Cleanup complete. All layout testing folders deleted.");
console.log("===============================================");
