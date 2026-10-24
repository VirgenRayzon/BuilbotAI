import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Production-only audit: start with `npm run build` and `npm run start -- -p 9002`.
// Usage: node execution/audit_landing_performance.mjs <url> <output.json> [runs=3]
const [url = 'http://127.0.0.1:9002', output = 'tmp/performance.json', count = '3'] = process.argv.slice(2);
const runs = Number(count);
if (!Number.isInteger(runs) || runs < 1) throw new Error('runs must be a positive integer');
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const mobile of [false, true]) {
    for (let run = 0; run < runs; run++) {
      const context = await browser.newContext({
        viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
        deviceScaleFactor: mobile ? 2 : 1,
        isMobile: mobile,
        hasTouch: mobile,
      });
      const page = await context.newPage();
      const cdp = await context.newCDPSession(page);
      await cdp.send('Network.enable');
      await cdp.send('Network.emulateNetworkConditions', {
        offline: false, latency: 150, downloadThroughput: 1_600_000 / 8,
        uploadThroughput: 750_000 / 8,
      });
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: mobile ? 4 : 1 });
      await page.addInitScript(() => {
        window.__landingAudit = { lcp: [], shifts: [], tasks: [], heroMounted: null, loaderRemoved: null };
        const state = window.__landingAudit;
        new PerformanceObserver(list => list.getEntries().forEach(e => state.lcp.push({
          startTime: e.startTime, loadTime: e.loadTime, renderTime: e.renderTime,
          size: e.size, url: e.url, element: e.element?.outerHTML.slice(0, 1000),
        }))).observe({ type: 'largest-contentful-paint', buffered: true });
        new PerformanceObserver(list => list.getEntries().forEach(e => {
          if (!e.hadRecentInput) state.shifts.push({ startTime: e.startTime, value: e.value });
        })).observe({ type: 'layout-shift', buffered: true });
        new PerformanceObserver(list => list.getEntries().forEach(e => state.tasks.push({
          startTime: e.startTime, duration: e.duration,
        }))).observe({ type: 'longtask', buffered: true });
        new MutationObserver(() => {
          if (state.heroMounted === null && document.querySelector('img[alt="BuildbotAI Custom PC Rig"]')) state.heroMounted = performance.now();
          if (state.heroMounted !== null && state.loaderRemoved === null && !document.body.textContent.includes('Verifying your account...')) state.loaderRemoved = performance.now();
        }).observe(document, { subtree: true, childList: true });
      });
      for (const cache of ['cold', 'warm']) {
        const errors = [];
        const warnings = [];
        const failures = [];
        const onError = error => errors.push(error.message);
        const onConsole = message => {
          if (message.type() === 'error') errors.push(message.text());
          if (message.type() === 'warning') warnings.push(message.text());
        };
        const onFailure = request => failures.push({ url: request.url().split('?')[0], reason: request.failure()?.errorText });
        page.on('pageerror', onError);
        page.on('console', onConsole);
        page.on('requestfailed', onFailure);
        const captureTrace = process.env.AUDIT_TRACE === '1' && mobile && run === 0 && cache === 'cold';
        if (captureTrace) await cdp.send('Tracing.start', {
          categories: 'devtools.timeline,blink.user_timing,loading', transferMode: 'ReturnAsStream',
        });
        const response = await page.goto(url, { waitUntil: 'load', timeout: 90000 });
        await page.waitForTimeout(12000);
        const metrics = await page.evaluate(() => {
          const state = window.__landingAudit;
          let session = 0, maxSession = 0, start = 0, previous = 0;
          for (const shift of state.shifts) {
            if (shift.startTime - previous > 1000 || shift.startTime - start > 5000) { session = 0; start = shift.startTime; }
            session += shift.value;
            maxSession = Math.max(maxSession, session);
            previous = shift.startTime;
          }
          const resources = performance.getEntriesByType('resource').map(e => ({
            name: e.name, initiatorType: e.initiatorType, startTime: e.startTime,
            responseStart: e.responseStart, responseEnd: e.responseEnd, duration: e.duration,
            transferSize: e.transferSize, encodedBodySize: e.encodedBodySize,
          }));
          const nav = performance.getEntriesByType('navigation')[0];
          return {
            ...state, cls: maxSession,
            fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
            ttfb: nav.responseStart - nav.startTime,
            domContentLoaded: nav.domContentLoadedEventEnd, load: nav.loadEventEnd,
            blockingTime: state.tasks.reduce((sum, task) => sum + Math.max(0, task.duration - 50), 0),
            resources, images: [...document.images].map(img => ({
              alt: img.alt, src: img.currentSrc, naturalWidth: img.naturalWidth,
              loading: img.loading, priority: img.fetchPriority,
              top: img.getBoundingClientRect().top,
            })),
            overflow: document.documentElement.scrollWidth > innerWidth,
          };
        });
        const record = { mobile, run: run + 1, cache, status: response.status(), headers: response.headers(), errors, warnings, failures, ...metrics };
        results.push(record);
        if (captureTrace) {
          const completed = new Promise(resolve => cdp.once('Tracing.tracingComplete', resolve));
          await cdp.send('Tracing.end');
          const { stream } = await completed;
          const chunks = [];
          let eof = false;
          while (!eof) {
            const chunk = await cdp.send('IO.read', { handle: stream });
            chunks.push(Buffer.from(chunk.data, chunk.base64Encoded ? 'base64' : 'utf8'));
            eof = chunk.eof;
          }
          await cdp.send('IO.close', { handle: stream });
          await mkdir(path.dirname(output), { recursive: true });
          await writeFile(output.replace(/\.json$/, '-mobile.trace.json'), Buffer.concat(chunks));
        }
        console.log(JSON.stringify({ mobile, run: run + 1, cache, lcp: metrics.lcp.at(-1)?.startTime, fcp: metrics.fcp, cls: metrics.cls, ttfb: metrics.ttfb, blockingTime: metrics.blockingTime, errors: errors.length }));
        if (run === 0 && cache === 'cold') {
          await mkdir(path.dirname(output), { recursive: true });
          await page.screenshot({ path: output.replace(/\.json$/, `-${mobile ? 'mobile' : 'desktop'}.png`) });
        }
        page.off('pageerror', onError);
        page.off('console', onConsole);
        page.off('requestfailed', onFailure);
      }
      await context.close();
    }
  }
} finally {
  await browser.close();
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify({ url, measuredAt: new Date().toISOString(), conditions: {
    network: '1.6 Mbps down / 750 Kbps up / 150 ms latency', cpu: 'desktop 1x, mobile 4x slowdown',
    navigation: 'hard navigation; warm = repeat in same browser context', settleAfterLoadMs: 12000,
    note: 'Lab window metrics, not field INP. Cache refers to browser cache; server/CDN cache is uncontrolled.',
  }, results }, null, 2));
}
