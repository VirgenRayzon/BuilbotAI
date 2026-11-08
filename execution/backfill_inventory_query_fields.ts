import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { FieldPath } from 'firebase-admin/firestore';
import { getAdminFirestore } from '../src/firebase/server-init';
import { INVENTORY_CATEGORY_SLUGS, inventoryItemsPath } from '../src/lib/inventory-paths';
import { deriveInventoryQueryFields } from '../src/lib/inventory-query-fields';

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const value = (prefix: string) => args.find(arg => arg.startsWith(prefix))?.slice(prefix.length);
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const expectedProject = value('--project=');
const backupPath = value('--backup=');
const after = value('--after=');
const db = getAdminFirestore();

async function main() {
  if (!projectId || expectedProject !== projectId) throw new Error('Pass --project=<configured project> to identify the target.');
  if (apply) {
    if (!backupPath) throw new Error('--apply requires --backup=<completed private export manifest>.');
    const backup = JSON.parse(await readFile(backupPath, 'utf8')) as Record<string, unknown>;
    const backupAge = Date.now() - Date.parse(String(backup.completedAt));
    if (backup.projectId !== projectId || backup.completed !== true || backup.private !== true ||
      !Number.isFinite(backupAge) || backupAge < 0 || backupAge > 86_400_000 ||
      typeof backup.backupUri !== 'string' || !backup.backupUri.startsWith(`gs://${projectId}-private-backups/backups/`)) {
      throw new Error('Backup manifest must be completed, private, and match this project.');
    }
  }

  let scanned = 0;
  let pending = 0;
  let updated = 0;
  let active = 0;
  let archived = 0;
  let publicEligible = 0;
  let inStock = 0;
  const resumeCategory = after?.split('/')[0];
  const resumeIndex = resumeCategory ? INVENTORY_CATEGORY_SLUGS.indexOf(resumeCategory as typeof INVENTORY_CATEGORY_SLUGS[number]) : -1;
  if (resumeCategory && resumeIndex === -1) throw new Error('Invalid --after category.');
  for (const category of INVENTORY_CATEGORY_SLUGS) {
    if (resumeIndex >= 0 && INVENTORY_CATEGORY_SLUGS.indexOf(category) < resumeIndex) continue;
    let cursor = after?.startsWith(`${category}/`) ? after.slice(category.length + 1) : '';
    while (true) {
      let query = db.collection(inventoryItemsPath(category)).orderBy(FieldPath.documentId()).limit(100);
      if (cursor) query = query.startAfter(cursor);
      const page = await query.get();
      if (page.empty) break;
      for (const document of page.docs) {
        cursor = document.id;
        scanned++;
        const data = document.data();
        if (data.isArchived === true) archived++;
        else active++;
        const expected = deriveInventoryQueryFields(data);
        if (!expected.isArchived && expected.publicCatalogEligible) publicEligible++;
        if (!expected.isArchived && expected.publicCatalogEligible && expected.inStock) inStock++;
        if (Object.entries(expected).every(([key, field]) => data[key] === field)) continue;
        pending++;
        if (apply) {
          await db.runTransaction(async transaction => {
            const fresh = await transaction.get(document.ref);
            if (!fresh.exists) return;
            transaction.update(document.ref, deriveInventoryQueryFields(fresh.data() || {}));
          });
          updated++;
        }
      }
      console.log(JSON.stringify({ checkpoint: `${category}/${cursor}`, scanned, active, archived, publicEligible, inStock, pending, updated }));
      if (page.size < 100) break;
    }
  }
  console.log(JSON.stringify({ complete: true, scanned, active, archived, publicEligible, inStock, pending, updated, mode: apply ? 'apply' : 'dry-run' }));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
