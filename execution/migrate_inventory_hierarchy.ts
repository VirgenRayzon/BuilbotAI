/**
 * Copy the current part catalog to /inventory/{lowercaseCategory}/items/{partId}.
 * Dry-run by default. Run --apply --project=<id> only after a Firestore export
 * and after coordinating writes to the source collections.
 */
import 'dotenv/config';
import { isDeepStrictEqual } from 'node:util';
import type { DocumentData, DocumentSnapshot } from 'firebase-admin/firestore';
import { getAdminFirestore } from '../src/firebase/server-init';
import {
    INVENTORY_CATEGORY_SLUGS,
    inventoryCategoryLabel,
    inventoryCategoryPath,
    inventoryItemPath,
} from '../src/lib/inventory-paths';

type Candidate = {
    source: string;
    destination: string;
    category: string;
    data: DocumentData;
};

const db = getAdminFirestore();
const apply = process.argv.includes('--apply');
const expectedProject = process.argv.find(arg => arg.startsWith('--project='))?.slice('--project='.length);
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (!projectId) {
    throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID is required for migration preflight.');
}

if (apply && (!expectedProject || expectedProject !== projectId)) {
    throw new Error(`--apply requires --project=${projectId} to match the active Firebase project.`);
}

function normalizedData(candidate: Candidate): DocumentData {
    return {
        ...candidate.data,
        category: inventoryCategoryLabel(candidate.category),
        isArchived: candidate.data.isArchived === true,
    };
}

function keyFields(data: DocumentData): DocumentData {
    return {
        name: data.name,
        price: data.price,
        stock: data.stock,
        popularity: data.popularity,
        isArchived: data.isArchived === true,
    };
}

function changedKeyFields(left: DocumentData, right: DocumentData): string[] {
    const first = keyFields(left);
    const second = keyFields(right);
    return Object.keys(first).filter(key => !isDeepStrictEqual(first[key], second[key]))
        .map(key => `${key}: /parts=${JSON.stringify(first[key])}, legacy=${JSON.stringify(second[key])}`);
}

async function main() {
    const candidates = new Map<string, Candidate>();
    const conflicts: string[] = [];
    const reconciliations: string[] = [];
    const sourceCounts: Record<string, number> = {};

    const parts = await db.collection('parts').get();
    sourceCounts.parts = parts.size;
    for (const part of parts.docs) {
        const data = part.data();
        try {
            const destination = inventoryItemPath(data.category, part.id);
            candidates.set(destination, { source: part.ref.path, destination, category: data.category, data });
        } catch (error) {
            conflicts.push(`${part.ref.path}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    for (const slug of INVENTORY_CATEGORY_SLUGS) {
        const label = inventoryCategoryLabel(slug);
        const legacy = await db.collection(label).get();
        sourceCounts[label] = legacy.size;

        for (const part of legacy.docs) {
            const data = part.data();
            const destination = inventoryItemPath(slug, part.id);
            const existing = candidates.get(destination);
            if (existing) {
                const differences = changedKeyFields(existing.data, data);
                if (differences.length > 0) {
                    const partStock = existing.data.stock;
                    const legacyStock = data.stock;
                    const partPopularity = existing.data.popularity ?? 0;
                    const legacyPopularity = data.popularity ?? 0;
                    const checkoutCount = legacyPopularity - partPopularity;
                    const stockDifference = partStock - legacyStock;
                    const onlyStockAndPopularity = differences.every(field =>
                        field.startsWith('stock:') || field.startsWith('popularity:')
                    );

                    if (onlyStockAndPopularity && checkoutCount > 0 && stockDifference === checkoutCount) {
                        // Checkout used legacy collections; admin stock edits used /parts.
                        // The exact stock/popularity delta identifies checkout deductions.
                        existing.data = { ...existing.data, stock: legacyStock, popularity: legacyPopularity };
                        reconciliations.push(`${destination}: applied ${checkoutCount} legacy checkout deduction(s)`);
                    } else if (onlyStockAndPopularity && checkoutCount === 0 && differences.length === 1 && differences[0].startsWith('stock:')) {
                        // No checkout activity since consolidation; retain the newer /parts stock edit.
                        reconciliations.push(`${destination}: retained /parts stock ${partStock} over legacy ${legacyStock}`);
                    } else {
                        conflicts.push(`${existing.source} vs ${part.ref.path}: ${differences.join('; ')}`);
                    }
                }
            } else {
                candidates.set(destination, { source: part.ref.path, destination, category: label, data });
            }
        }
    }

    const existingDestinations = new Set<string>();
    const refs = [...candidates.values()].map(candidate => db.doc(candidate.destination));
    for (let offset = 0; offset < refs.length; offset += 100) {
        const snapshots = await db.getAll(...refs.slice(offset, offset + 100));
        for (const snapshot of snapshots as DocumentSnapshot[]) {
            if (!snapshot.exists) continue;
            const candidate = candidates.get(snapshot.ref.path);
            if (!candidate) continue;
            existingDestinations.add(snapshot.ref.path);
            if (!isDeepStrictEqual(snapshot.data(), normalizedData(candidate))) {
                conflicts.push(`${snapshot.ref.path} already exists with different data`);
            }
        }
    }

    const destinationCounts = Object.fromEntries(INVENTORY_CATEGORY_SLUGS.map(slug => [slug, 0]));
    for (const candidate of candidates.values()) {
        const slug = candidate.destination.split('/')[1] as keyof typeof destinationCounts;
        destinationCounts[slug] += 1;
    }

    console.log(JSON.stringify({
        projectId,
        mode: apply ? 'apply' : 'plan',
        sourceCounts,
        destinationCounts,
        candidates: candidates.size,
        alreadyCopied: existingDestinations.size,
        reconciliations,
        conflicts: conflicts.slice(0, 100),
        additionalConflicts: Math.max(0, conflicts.length - 100),
    }, null, 2));

    if (conflicts.length > 0) {
        throw new Error(`Migration stopped: ${conflicts.length} conflict(s) require reconciliation.`);
    }
    if (!apply) return;

    const writer = db.bulkWriter();
    let copied = 0;
    const writeFailures: string[] = [];
    for (const slug of INVENTORY_CATEGORY_SLUGS) {
        await db.doc(inventoryCategoryPath(slug)).set({
            label: inventoryCategoryLabel(slug),
            isActive: true,
        }, { merge: true });
    }
    for (const candidate of candidates.values()) {
        if (existingDestinations.has(candidate.destination)) continue;
        writer.create(db.doc(candidate.destination), normalizedData(candidate)).catch(error => {
            writeFailures.push(`${candidate.destination}: ${error instanceof Error ? error.message : String(error)}`);
        });
        copied += 1;
    }
    await writer.close();
    if (writeFailures.length > 0) {
        throw new Error(`Failed to copy ${writeFailures.length} item(s): ${writeFailures.slice(0, 10).join('; ')}`);
    }
    console.log(`Copied ${copied} part documents. Source collections were not modified.`);
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
