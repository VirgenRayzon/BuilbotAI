import { test, expect } from '@playwright/test';
test.skip(!process.env.LOADING_LAYOUT_FIXTURE, 'Run through node execution/verify_loading_layouts.mjs');

for (const width of [1440, 768, 390]) {
  test(`builder loading geometry at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('http://localhost:9002/loading-audit-preview');
    const loading = page.locator('[data-audit="grid-loading"] .mantine-Card-root').first();
    const loaded = page.locator('[data-audit="grid-loaded"] .mantine-Card-root').first();
    await expect(loaded).toBeVisible();
    await expect.poll(async () => (await loading.boundingBox())?.height).toBeGreaterThan(0);
    const a = await loading.boundingBox();
    const b = await loaded.boundingBox();
    expect(Math.abs(a!.width - b!.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(a!.height - b!.height)).toBeLessThanOrEqual(1);
    await expect(page.locator('[data-audit="list-loading"] table')).toBeVisible();
    await page.locator('[data-audit="grid-loading"]').screenshot({path:`tmp/loading-audit/builder-loading-${width}.png`, style:'header { visibility: hidden }'});
    await page.locator('[data-audit="grid-loaded"]').screenshot({path:`tmp/loading-audit/builder-loaded-${width}.png`, style:'header { visibility: hidden }'});
    for (const kind of ['admin', 'chart']) {
      const first = await page.locator(`[data-audit="${kind}-loading"]`).boundingBox();
      const second = await page.locator(`[data-audit="${kind}-loaded"]`).boundingBox();
      expect(Math.abs(first!.width - second!.width), `${kind} width`).toBeLessThanOrEqual(1);
      expect(Math.abs(first!.height - second!.height), `${kind} height`).toBeLessThanOrEqual(1);
    }
  });
}
