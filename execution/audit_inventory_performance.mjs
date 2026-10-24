import { chromium } from '@playwright/test';
import { config } from 'dotenv';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

config({ quiet: true });
// Production baseline/after audit; does not save credentials or browser storage.
// Usage: node execution/audit_inventory_performance.mjs <origin> <output.json> [runs=3]
const [origin = 'http://127.0.0.1:9002', output = 'tmp/performance/inventory.json', count = '3'] = process.argv.slice(2);
const runs = Number(count);
if (!Number.isInteger(runs) || runs < 1) throw new Error('runs must be positive');
const browser = await chromium.launch({ headless: true });
const results = [];
const conditions = {
  network: '1.6 Mbps down / 750 Kbps up / 150 ms latency', cpu: 'desktop 1x / mobile 4x',
  browser: browser.version(),
  note: 'Restored authenticated sessions. Cold browser asset cache, server cache uncontrolled. Soft navigation reports visible-image readiness, not standard hard-navigation LCP.',
};
async function saveResults() {
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify({ origin, measuredAt: new Date().toISOString(), conditions, results }, null, 2));
}
const accounts = [
  { route: '/admin', role: 'SUPER_ADMIN', login: '/system-access' },
  { route: '/builder', role: 'USER', login: '/signin' },
].filter(account => !process.env.AUDIT_ROLE || account.role === process.env.AUDIT_ROLE);

try {
  for (const mobile of [false, true].filter(value => !process.env.AUDIT_VIEWPORT || (value ? 'mobile' : 'desktop') === process.env.AUDIT_VIEWPORT)) {
    for (const account of accounts) {
      for (let run = 1; run <= runs; run++) {
        const context = await browser.newContext({
          viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
          deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile,
        });
        const page = await context.newPage();
        await page.goto(origin + account.login);
        if (account.role === 'SUPER_ADMIN') await page.getByText('SUPER ADMIN', { exact: true }).click();
        await page.getByLabel('Email Address').fill(process.env[`E2E_${account.role}_EMAIL`] || '');
        await page.locator('form input[type="password"]').first().fill(process.env[`E2E_${account.role}_PASSWORD`] || '');
        if (account.role === 'SUPER_ADMIN') await page.locator('form input[type="password"]').nth(1).fill(process.env.E2E_SUPER_ADMIN_ACCESS_KEY || '');
        await page.locator('form').getByRole('button', { name: account.role === 'USER' ? 'Sign In' : 'Authenticate Session', exact: true }).click();
        await page.waitForURL(new URL(account.route, origin).href, { timeout: 60000 });
        await page.locator(`header nav a[href="${account.route}"]`).waitFor({ state: 'attached' });

        const cdp = await context.newCDPSession(page);
        await cdp.send('Network.enable');
        await cdp.send('Network.emulateNetworkConditions', {
          offline: false, latency: 150, downloadThroughput: 1_600_000 / 8, uploadThroughput: 750_000 / 8,
        });
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: mobile ? 4 : 1 });
        await page.addInitScript(route => {
          const fresh = start => ({ start, lcp: [], shifts: [], tasks: [], firstImageMounted: null, firstImageReady: null, firstImageAlt: null, allVisibleImagesReady: null });
          window.__inventoryAudit = fresh(0);
          window.__resetInventoryAudit = () => { window.__inventoryAudit = fresh(performance.now()); };
          new PerformanceObserver(list => {
            const state = window.__inventoryAudit;
            for (const e of list.getEntries()) if (e.startTime >= state.start) state.lcp.push({
              time: e.startTime - state.start, size: e.size, url: e.url,
              element: e.element?.outerHTML.slice(0, 1500),
            });
          }).observe({ type: 'largest-contentful-paint', buffered: true });
          new PerformanceObserver(list => {
            const state = window.__inventoryAudit;
            for (const e of list.getEntries()) if (!e.hadRecentInput && e.startTime >= state.start) state.shifts.push({ time: e.startTime - state.start, value: e.value });
          }).observe({ type: 'layout-shift', buffered: true });
          new PerformanceObserver(list => {
            const state = window.__inventoryAudit;
            for (const e of list.getEntries()) if (e.startTime >= state.start) state.tasks.push({ time: e.startTime - state.start, duration: e.duration });
          }).observe({ type: 'longtask', buffered: true });
          const sample = () => {
            if (location.pathname !== route) return;
            const state = window.__inventoryAudit;
            const images = [...document.querySelectorAll('main img[data-nimg]')].filter(img => {
              const box = img.getBoundingClientRect();
              return box.width > 80 && box.height > 60 && box.top < innerHeight && box.bottom > 64 && box.left < innerWidth && box.right > 0;
            });
            if (!images.length) return;
            if (state.firstImageMounted === null) state.firstImageMounted = performance.now() - state.start;
            if (images.some(img => img.complete && img.naturalWidth > 0) && state.firstImageReady === null) {
              const ready = images.find(img => img.complete && img.naturalWidth > 0);
              requestAnimationFrame(() => {
                if (state === window.__inventoryAudit && state.firstImageReady === null) {
                  state.firstImageReady = performance.now() - state.start;
                  state.firstImageAlt = ready?.alt;
                }
              });
            }
            if (images.every(img => img.complete && img.naturalWidth > 0) && state.allVisibleImagesReady === null) state.allVisibleImagesReady = performance.now() - state.start;
          };
          new MutationObserver(sample).observe(document, { subtree: true, childList: true });
          document.addEventListener('load', sample, true);
        }, account.route);
        await cdp.send('Network.clearBrowserCache');

        for (const mode of ['hard-cold', 'hard-warm', 'soft-warm']) {
          if (mode === 'soft-warm') {
            await page.goto(origin + '/about', { waitUntil: 'load' });
            await page.locator(`header nav a[href="${account.route}"]`).waitFor({ state: 'attached' });
            // Mobile menu links are hidden; click the same Next.js Link via DOM
            // without a document navigation, rather than substituting page.goto.
            await page.evaluate(() => window.__resetInventoryAudit());
          }
          const errors = [];
          const onError = error => errors.push(error.message);
          const onConsole = message => { if (['error', 'warning'].includes(message.type())) errors.push(message.text()); };
          page.on('pageerror', onError);
          page.on('console', onConsole);
          if (mode === 'soft-warm') {
            await page.locator(`header nav a[href="${account.route}"]`).first().evaluate(link => link.click());
          } else {
            await page.goto(origin + account.route, { waitUntil: 'domcontentloaded', timeout: 90000 });
          }
          await page.waitForFunction(() => window.__inventoryAudit.firstImageReady !== null, undefined, { timeout: 60000 });
          await page.waitForTimeout(5000);
          const metrics = await page.evaluate(() => {
            const state = window.__inventoryAudit;
            let session = 0, max = 0, start = 0, previous = 0;
            for (const shift of state.shifts) {
              if (shift.time - previous > 1000 || shift.time - start > 5000) { session = 0; start = shift.time; }
              session += shift.value; max = Math.max(max, session); previous = shift.time;
            }
            return {
              ...state, cls: max,
              blockingTime: state.tasks.reduce((sum, task) => sum + Math.max(0, task.duration - 50), 0),
              resources: performance.getEntriesByType('resource').filter(e => e.startTime >= state.start).map(e => ({
                name: e.name, type: e.initiatorType, start: e.startTime - state.start,
                end: e.responseEnd - state.start, duration: e.duration, bytes: e.encodedBodySize,
              })),
              images: [...document.querySelectorAll('main img')].map(img => ({
                alt: img.alt, src: img.currentSrc, naturalWidth: img.naturalWidth,
                width: img.getBoundingClientRect().width, top: img.getBoundingClientRect().top,
                loading: img.loading, priority: img.fetchPriority,
              })),
            };
          });
          const record = { route: account.route, mobile, run, mode, errors, ...metrics };
          if (mode === 'soft-warm') record.lcp = []; // standard hard-navigation LCP does not reset on a Next Link transition
          results.push(record);
          // Checkpoint between samples so an interrupted audit remains reviewable.
          await saveResults();
          console.log(JSON.stringify({ route: account.route, mobile, run, mode,
            lcp: record.lcp.at(-1)?.time, firstImageMounted: metrics.firstImageMounted,
            firstImageReady: metrics.firstImageReady, blockingTime: metrics.blockingTime, errors: errors.length,
          }));
          if (run === 1 && mode === 'hard-cold') {
            await mkdir(path.dirname(output), { recursive: true });
            await page.screenshot({ path: output.replace(/\.json$/, `-${account.route.slice(1)}-${mobile ? 'mobile' : 'desktop'}.png`) });
          }
          page.off('pageerror', onError);
          page.off('console', onConsole);
        }
        await context.close();
      }
    }
  }
} finally {
  await browser.close();
  await saveResults();
}
