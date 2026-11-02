import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const sidebarSource = readFileSync(
  new URL('./admin-sidebar.tsx', import.meta.url),
  'utf8'
);
const adminPageSource = readFileSync(
  new URL('../page.tsx', import.meta.url),
  'utf8'
);

test('passes the live order stage totals into the sidebar', () => {
  assert.match(adminPageSource, /orderStageCounts=\{stats\.stageCounts\}/);
});

test('renders submenu totals as compact right-aligned badges', () => {
  assert.match(sidebarSource, /className="ml-auto inline-flex min-w-5/);
  assert.match(sidebarSource, /rounded-full/);
  assert.match(sidebarSource, /tabular-nums/);
});
