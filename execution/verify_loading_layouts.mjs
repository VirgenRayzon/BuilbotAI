import { copyFile, mkdir, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
const route = 'src/app/loading-audit-preview';
if (existsSync(`${route}/page.tsx`)) throw new Error('Refusing to overwrite an existing loading audit route');
await mkdir(route, {recursive:true});
try {
  await copyFile('tests/fixtures/loading-layout-page.tsx', `${route}/page.tsx`);
  const result = spawnSync(process.execPath, ['node_modules/@playwright/test/cli.js','test','tests/loading-layouts.spec.ts','tests/landing-loading-layouts.spec.ts','--workers=1','--reporter=line','--output=tmp/loading-test-results'], {stdio:'inherit', env:{...process.env,LOADING_LAYOUT_FIXTURE:'1'}});
  process.exitCode = result.status ?? 1;
} finally {
  await rm(`${route}/page.tsx`, {force:true});
}
